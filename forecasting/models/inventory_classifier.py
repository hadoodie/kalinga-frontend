"""
ABC/XYZ Inventory Classifier — Epic 1.

Dynamically classifies inventory items using two orthogonal dimensions:

  ABC (volume/value ranking over a rolling 90-day window):
    A = top 80 % cumulative volume   → high-impact items
    B = next 15 %                    → moderate-impact
    C = remaining 5 %                → low-impact / tail

  XYZ (demand predictability via Coefficient of Variation):
    X = CV ≤ 0.50   → stable, highly predictable demand
    Y = 0.50 < CV ≤ 1.00  → moderate variability
    Z = CV > 1.00   → erratic / unpredictable

  Cold Start rule:
    Any item with < 14 days of movement history is forced to
    classification 'Z' regardless of its computed CV, since the
    sample is too small to draw reliable conclusions.

The combined ABC-XYZ matrix (e.g. AX, BY, CZ) drives downstream
decisions: safety stock multipliers, reorder strategies, and
review frequency.

Usage (Python pipeline):
    from forecasting.models.inventory_classifier import InventoryClassifier
    clf = InventoryClassifier(window_days=90, cold_start_days=14)
    result_df = clf.classify(stock_movements_df, resources_df)
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

import numpy as np
import pandas as pd


# ═══════════════════════════════════════════════════════════════
# Constants — thresholds for ABC and XYZ buckets
# ═══════════════════════════════════════════════════════════════

# ABC cumulative-volume breakpoints (Pareto-inspired)
ABC_A_CUMULATIVE = 0.80   # top 80 % of total volume = "A"
ABC_B_CUMULATIVE = 0.95   # next 15 % = "B"; remainder = "C"

# XYZ coefficient-of-variation breakpoints
XYZ_X_MAX_CV = 0.50
XYZ_Y_MAX_CV = 1.00
# > 1.00 → Z

# Cold-start: minimum days of history required before
# the computed CV is trusted.
DEFAULT_COLD_START_DAYS = 14
DEFAULT_WINDOW_DAYS = 90


class InventoryClassifier:
    """
    Stateless classifier — call ``classify()`` with raw data each run.
    Designed to plug into the forecasting pipeline or be invoked on its
    own from the Laravel job via subprocess / HTTP.
    """

    def __init__(
        self,
        window_days: int = DEFAULT_WINDOW_DAYS,
        cold_start_days: int = DEFAULT_COLD_START_DAYS,
        abc_a_pct: float = ABC_A_CUMULATIVE,
        abc_b_pct: float = ABC_B_CUMULATIVE,
        xyz_x_cv: float = XYZ_X_MAX_CV,
        xyz_y_cv: float = XYZ_Y_MAX_CV,
    ):
        self.window_days = window_days
        self.cold_start_days = cold_start_days
        self.abc_a_pct = abc_a_pct
        self.abc_b_pct = abc_b_pct
        self.xyz_x_cv = xyz_x_cv
        self.xyz_y_cv = xyz_y_cv

    # ── Public API ───────────────────────────────────────────

    def classify(
        self,
        stock_movements: pd.DataFrame,
        resources: pd.DataFrame,
        reference_date: Optional[datetime] = None,
    ) -> pd.DataFrame:
        """
        Run the full ABC/XYZ classification.

        Parameters
        ----------
        stock_movements : DataFrame
            Must contain: resource_id, hospital_id, movement_type|type,
            quantity, created_at.
        resources : DataFrame
            Must contain: resource_id (or id), hospital_id.
            Optional: created_at (used for cold-start detection).
        reference_date : datetime, optional
            "Now" for the rolling window. Defaults to ``datetime.utcnow()``.

        Returns
        -------
        DataFrame with columns:
            hospital_id, resource_id,
            total_volume_90d, abc_class, abc_rank_pct,
            cv, xyz_class, is_cold_start,
            abc_xyz_class
        """
        ref = reference_date or datetime.utcnow()
        cutoff = ref - timedelta(days=self.window_days)

        # ── Normalise inputs ─────────────────────────────────
        sm = self._normalise_movements(stock_movements, cutoff)
        res = self._normalise_resources(resources)

        # ── Daily demand aggregation per (hospital, resource) ─
        daily = self._aggregate_daily(sm, cutoff, ref)

        # ── ABC: volume ranking ──────────────────────────────
        abc = self._compute_abc(daily)

        # ── XYZ: CV + cold start ─────────────────────────────
        xyz = self._compute_xyz(daily, res, ref)

        # ── Merge and produce final class ────────────────────
        merged = abc.merge(xyz, on=["hospital_id", "resource_id"], how="outer")

        # Items with zero movement in the window still need a class
        merged["abc_class"] = merged["abc_class"].fillna("C")
        merged["xyz_class"] = merged["xyz_class"].fillna("Z")
        merged["total_volume_90d"] = merged["total_volume_90d"].fillna(0.0)
        merged["cv"] = merged["cv"].fillna(np.nan)
        merged["is_cold_start"] = merged["is_cold_start"].fillna(True)

        merged["abc_xyz_class"] = merged["abc_class"] + merged["xyz_class"]

        return merged

    # ── Internal helpers ─────────────────────────────────────

    @staticmethod
    def _normalise_movements(sm: pd.DataFrame, cutoff: datetime) -> pd.DataFrame:
        """Filter to outflows within the rolling window."""
        df = sm.copy()
        df["created_at"] = pd.to_datetime(df["created_at"], utc=True, errors="coerce")

        # Normalise movement type column name
        type_col = "movement_type" if "movement_type" in df.columns else "type"
        df = df[df[type_col] == "out"].copy()
        df = df[df["created_at"] >= pd.Timestamp(cutoff, tz="UTC")]
        df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0).abs()
        return df

    @staticmethod
    def _normalise_resources(res: pd.DataFrame) -> pd.DataFrame:
        """Ensure resources has resource_id and created_at."""
        df = res.copy()
        if "resource_id" not in df.columns and "id" in df.columns:
            df = df.rename(columns={"id": "resource_id"})
        if "created_at" in df.columns:
            df["created_at"] = pd.to_datetime(df["created_at"], utc=True, errors="coerce")
        return df

    def _aggregate_daily(
        self, sm: pd.DataFrame, cutoff: datetime, ref: datetime
    ) -> pd.DataFrame:
        """
        Aggregate outflows into daily consumption per (hospital, resource).
        Returns one row per (hospital_id, resource_id, day).
        """
        if sm.empty:
            return pd.DataFrame(columns=[
                "hospital_id", "resource_id", "day", "daily_consumption",
            ])

        df = sm.copy()
        df["day"] = df["created_at"].dt.floor("D")

        daily = (
            df.groupby(["hospital_id", "resource_id", "day"])["quantity"]
            .sum()
            .reset_index()
            .rename(columns={"quantity": "daily_consumption"})
        )
        return daily

    def _compute_abc(self, daily: pd.DataFrame) -> pd.DataFrame:
        """
        ABC classification based on total outflow volume over the window.

        Items are ranked by descending total volume; cumulative percentage
        determines the ABC bucket.
        """
        if daily.empty:
            return pd.DataFrame(columns=[
                "hospital_id", "resource_id", "total_volume_90d",
                "abc_class", "abc_rank_pct",
            ])

        totals = (
            daily.groupby(["hospital_id", "resource_id"])["daily_consumption"]
            .sum()
            .reset_index()
            .rename(columns={"daily_consumption": "total_volume_90d"})
        )
        totals = totals.sort_values("total_volume_90d", ascending=False)

        grand_total = totals["total_volume_90d"].sum()
        if grand_total == 0:
            totals["abc_rank_pct"] = 1.0
            totals["abc_class"] = "C"
            return totals

        totals["cumulative_pct"] = totals["total_volume_90d"].cumsum() / grand_total

        # Track cumulative BEFORE each item to determine class.
        # The item that first crosses the threshold is included in the higher class.
        cumulative_shifted = totals["total_volume_90d"].cumsum().shift(1, fill_value=0) / grand_total
        totals["abc_rank_pct"] = totals["cumulative_pct"].round(4)

        totals["abc_class"] = np.where(
            cumulative_shifted < self.abc_a_pct,
            "A",
            np.where(
                cumulative_shifted < self.abc_b_pct,
                "B",
                "C",
            ),
        )

        return totals[["hospital_id", "resource_id", "total_volume_90d",
                        "abc_class", "abc_rank_pct"]]

    def _compute_xyz(
        self, daily: pd.DataFrame, resources: pd.DataFrame, ref: datetime
    ) -> pd.DataFrame:
        """
        XYZ classification based on Coefficient of Variation (CV).

        CV = std(daily_consumption) / mean(daily_consumption)

        Cold-start override: items with fewer than ``cold_start_days``
        of history default to 'Z'.
        """
        # Determine cold-start status from resource creation date
        cold_cutoff = ref - timedelta(days=self.cold_start_days)

        # Build per-resource stats
        if daily.empty:
            stats = resources[["hospital_id", "resource_id"]].drop_duplicates().copy()
            stats["mean_daily"] = 0.0
            stats["std_daily"] = 0.0
            stats["cv"] = np.nan
            stats["days_with_data"] = 0
        else:
            stats = (
                daily.groupby(["hospital_id", "resource_id"])["daily_consumption"]
                .agg(["mean", "std", "count"])
                .reset_index()
                .rename(columns={"mean": "mean_daily", "std": "std_daily", "count": "days_with_data"})
            )
            stats["std_daily"] = stats["std_daily"].fillna(0.0)
            stats["cv"] = np.where(
                stats["mean_daily"] > 0,
                stats["std_daily"] / stats["mean_daily"],
                np.nan,  # undefined when mean is zero
            )

        # Merge resource created_at for cold-start detection
        if "created_at" in resources.columns:
            res_dates = resources[["resource_id", "hospital_id", "created_at"]].copy()
            stats = stats.merge(res_dates, on=["hospital_id", "resource_id"], how="left")
            stats["is_cold_start"] = (
                stats["created_at"].isna()
                | (stats["created_at"] >= pd.Timestamp(cold_cutoff, tz="UTC"))
            )
        else:
            # Fallback: cold-start if fewer than cold_start_days of movement data
            stats["is_cold_start"] = stats["days_with_data"] < self.cold_start_days

        # XYZ assignment
        stats["xyz_class"] = np.where(
            stats["is_cold_start"],
            "Z",  # Cold-start override → always Z
            np.where(
                stats["cv"].isna(),
                "Z",  # No demand at all → unpredictable
                np.where(
                    stats["cv"] <= self.xyz_x_cv,
                    "X",
                    np.where(
                        stats["cv"] <= self.xyz_y_cv,
                        "Y",
                        "Z",
                    ),
                ),
            ),
        )

        return stats[["hospital_id", "resource_id", "cv",
                       "xyz_class", "is_cold_start"]]

    # ── Convenience: classification matrix description ───────

    @staticmethod
    def describe_class(abc_xyz: str) -> str:
        """Return a human-readable description of an ABC-XYZ class."""
        descriptions = {
            "AX": "High volume, stable demand — ideal for JIT replenishment",
            "AY": "High volume, moderate variability — use statistical safety stock",
            "AZ": "High volume, erratic demand — requires safety buffer + monitoring",
            "BX": "Medium volume, stable — standard reorder point",
            "BY": "Medium volume, moderate variability — periodic review",
            "BZ": "Medium volume, erratic — increase review frequency",
            "CX": "Low volume, stable — min/max replenishment",
            "CY": "Low volume, moderate variability — order on demand",
            "CZ": "Low volume, erratic — keep minimal stock or order ad-hoc",
        }
        return descriptions.get(abc_xyz, "Unknown classification")

    @staticmethod
    def safety_stock_multiplier(abc_xyz: str) -> float:
        """
        Return a suggested safety stock multiplier per ABC-XYZ class.

        This feeds into the SafetyStockCalculator as a class-based
        adjustment factor on top of the probabilistic formula.
        """
        multipliers = {
            "AX": 1.0,   # low variability, high priority → base SS
            "AY": 1.15,  # moderate var → slight uplift
            "AZ": 1.40,  # erratic + high-value → significant buffer
            "BX": 1.0,
            "BY": 1.10,
            "BZ": 1.25,
            "CX": 0.90,  # low volume + stable → can reduce
            "CY": 1.0,
            "CZ": 1.10,
        }
        return multipliers.get(abc_xyz, 1.0)
