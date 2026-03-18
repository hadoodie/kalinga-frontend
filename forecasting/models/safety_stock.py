"""
Probabilistic Dynamic Safety Stock Calculator — Epic 2.

Replaces flat-percentage buffers with a statistically rigorous
calculation that accounts for *both* demand variability and lead
time variability.

Formula
-------
    SS = Z × √(avg_LT × σ_d² + avg_d² × σ_LT²)

Where:
    Z       = Z-score for the target service level (e.g. 1.645 for 95 %)
    avg_LT  = average lead time in days
    avg_d   = average daily demand
    σ_d     = standard deviation of daily demand
    σ_LT    = standard deviation of lead time in days

The Z-score is derived from the inverse of the standard normal CDF
(``scipy.stats.norm.ppf``).  When scipy is unavailable a lookup
table covers the most common service levels.

Usage (Python pipeline):
    from forecasting.models.safety_stock import SafetyStockCalculator
    calc = SafetyStockCalculator(target_service_level=0.95)
    ss = calc.compute(avg_lead_time=5.0, std_lead_time=1.2,
                       avg_demand=20.0, std_demand=6.0)

Batch mode on DataFrames:
    result_df = calc.compute_batch(demand_stats_df, lead_time_stats_df)
"""

from __future__ import annotations

import math
from typing import Optional

import numpy as np
import pandas as pd

# Optional: scipy for exact Z-score; fallback to lookup table
try:
    from scipy.stats import norm as _norm
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False


# ═══════════════════════════════════════════════════════════════
# Z-score lookup for common service levels (when scipy absent)
# ═══════════════════════════════════════════════════════════════

_Z_TABLE: dict[float, float] = {
    0.50: 0.0000,
    0.80: 0.8416,
    0.85: 1.0364,
    0.90: 1.2816,
    0.92: 1.4051,
    0.95: 1.6449,
    0.97: 1.8808,
    0.98: 2.0537,
    0.99: 2.3263,
    0.995: 2.5758,
    0.999: 3.0902,
}


def z_score(service_level: float) -> float:
    """
    Return the Z-score (inverse CDF of standard normal) for a given
    service level probability.

    Uses scipy if available; otherwise interpolates from a lookup table.
    """
    if service_level <= 0 or service_level >= 1:
        raise ValueError(f"service_level must be in (0, 1), got {service_level}")

    if HAS_SCIPY:
        return float(_norm.ppf(service_level))

    # Lookup / linear interpolation
    keys = sorted(_Z_TABLE.keys())
    if service_level in _Z_TABLE:
        return _Z_TABLE[service_level]

    # Find bracketing keys
    lower = max((k for k in keys if k <= service_level), default=keys[0])
    upper = min((k for k in keys if k >= service_level), default=keys[-1])
    if lower == upper:
        return _Z_TABLE[lower]
    # Linear interpolation
    frac = (service_level - lower) / (upper - lower)
    return _Z_TABLE[lower] + frac * (_Z_TABLE[upper] - _Z_TABLE[lower])


# ═══════════════════════════════════════════════════════════════
# Calculator
# ═══════════════════════════════════════════════════════════════

class SafetyStockCalculator:
    """
    Configurable probabilistic safety stock calculator.

    Parameters
    ----------
    target_service_level : float
        Desired probability of not stocking out during a replenishment
        cycle.  Common values: 0.90, 0.95, 0.99.
    default_lead_time_days : float
        Fallback average lead time when no supplier data is available.
    default_lead_time_std : float
        Fallback lead time standard deviation.
    """

    def __init__(
        self,
        target_service_level: float = 0.95,
        default_lead_time_days: float = 5.0,
        default_lead_time_std: float = 1.5,
    ):
        if not (0 < target_service_level < 1):
            raise ValueError("target_service_level must be in (0, 1)")

        self.service_level = target_service_level
        self.z = z_score(target_service_level)
        self.default_lt = default_lead_time_days
        self.default_lt_std = default_lead_time_std

    # ── Scalar API ───────────────────────────────────────────

    def compute(
        self,
        avg_lead_time: float,
        std_lead_time: float,
        avg_demand: float,
        std_demand: float,
    ) -> float:
        """
        Compute safety stock for a single item.

        SS = Z × √(avg_LT × σ_d² + avg_d² × σ_LT²)

        All inputs must be in consistent time units (days recommended).

        Returns 0.0 when demand or lead time data is degenerate.
        """
        if avg_demand <= 0 or avg_lead_time <= 0:
            return 0.0

        variance_component = (
            avg_lead_time * (std_demand ** 2)
            + (avg_demand ** 2) * (std_lead_time ** 2)
        )
        return round(self.z * math.sqrt(max(variance_component, 0.0)), 2)

    # ── Reorder Point ────────────────────────────────────────

    def reorder_point(
        self,
        avg_lead_time: float,
        std_lead_time: float,
        avg_demand: float,
        std_demand: float,
    ) -> float:
        """
        ROP = (avg_demand × avg_lead_time) + safety_stock
        """
        ss = self.compute(avg_lead_time, std_lead_time, avg_demand, std_demand)
        return round(avg_demand * avg_lead_time + ss, 2)

    # ── Batch (DataFrame) API ────────────────────────────────

    def compute_batch(
        self,
        demand_stats: pd.DataFrame,
        lead_time_stats: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        """
        Vectorised safety stock calculation across many items.

        Parameters
        ----------
        demand_stats : DataFrame
            Required columns: hospital_id, resource_id,
                              avg_daily_demand, std_daily_demand.
        lead_time_stats : DataFrame, optional
            Columns: resource_id (or resource_sku),
                     avg_lead_time_days, std_lead_time_days.
            If absent, ``default_lead_time_days`` and
            ``default_lead_time_std`` are used for all items.

        Returns
        -------
        DataFrame with original columns plus:
            z_score, safety_stock, reorder_point
        """
        df = demand_stats.copy()

        # Merge lead time data if available
        if lead_time_stats is not None and not lead_time_stats.empty:
            merge_col = (
                "resource_id"
                if "resource_id" in lead_time_stats.columns
                else "resource_sku"
            )
            lt = lead_time_stats.rename(columns={
                "avg_lead_time_days": "avg_lt",
                "std_lead_time_days": "std_lt",
            })
            df = df.merge(
                lt[[merge_col, "avg_lt", "std_lt"]],
                on=merge_col,
                how="left",
            )
        else:
            df["avg_lt"] = np.nan
            df["std_lt"] = np.nan

        # Fill missing lead-time data with defaults
        df["avg_lt"] = df["avg_lt"].fillna(self.default_lt)
        df["std_lt"] = df["std_lt"].fillna(self.default_lt_std)

        # Ensure demand stats default to 0
        avg_d = df["avg_daily_demand"].fillna(0).values
        std_d = df["std_daily_demand"].fillna(0).values
        avg_lt = df["avg_lt"].values
        std_lt = df["std_lt"].values

        # Vectorised formula:
        #   SS = Z * sqrt(avg_lt * std_d^2 + avg_d^2 * std_lt^2)
        variance = avg_lt * (std_d ** 2) + (avg_d ** 2) * (std_lt ** 2)
        df["z_score"] = self.z
        df["safety_stock"] = np.round(self.z * np.sqrt(np.maximum(variance, 0.0)), 2)
        df["reorder_point"] = np.round(avg_d * avg_lt + df["safety_stock"], 2)

        return df

    # ── Demand statistics from stock movements ───────────────

    @staticmethod
    def demand_stats_from_movements(
        stock_movements: pd.DataFrame,
        window_days: int = 90,
    ) -> pd.DataFrame:
        """
        Compute per-(hospital, resource) daily demand statistics from
        raw stock movement records.

        Returns DataFrame with columns:
            hospital_id, resource_id,
            avg_daily_demand, std_daily_demand,
            days_with_data, total_demand
        """
        if stock_movements.empty:
            return pd.DataFrame(columns=[
                "hospital_id", "resource_id",
                "avg_daily_demand", "std_daily_demand",
                "days_with_data", "total_demand",
            ])

        df = stock_movements.copy()
        df["created_at"] = pd.to_datetime(df["created_at"], utc=True, errors="coerce")

        # Filter to window
        cutoff = pd.Timestamp.utcnow() - pd.Timedelta(days=window_days)
        df = df[df["created_at"] >= cutoff]

        # Only outflows count as demand
        type_col = "movement_type" if "movement_type" in df.columns else "type"
        df = df[df[type_col] == "out"].copy()
        df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0).abs()

        df["day"] = df["created_at"].dt.floor("D")

        daily = (
            df.groupby(["hospital_id", "resource_id", "day"])["quantity"]
            .sum()
            .reset_index()
            .rename(columns={"quantity": "daily_consumption"})
        )

        stats = (
            daily.groupby(["hospital_id", "resource_id"])["daily_consumption"]
            .agg(["mean", "std", "count", "sum"])
            .reset_index()
            .rename(columns={
                "mean": "avg_daily_demand",
                "std": "std_daily_demand",
                "count": "days_with_data",
                "sum": "total_demand",
            })
        )
        stats["std_daily_demand"] = stats["std_daily_demand"].fillna(0.0)
        return stats

    # ── Lead time statistics from supply orders ──────────────

    @staticmethod
    def lead_time_stats_from_orders(
        supply_orders: pd.DataFrame,
    ) -> pd.DataFrame:
        """
        Compute per-resource lead time statistics from historical
        supply orders that have been received.

        Expects columns: resource_sku (or resource_id),
                         expected_delivery_date, actual_delivery_date,
                         status.

        Returns DataFrame with columns:
            resource_sku, avg_lead_time_days, std_lead_time_days,
            order_count
        """
        if supply_orders.empty:
            return pd.DataFrame(columns=[
                "resource_sku", "avg_lead_time_days",
                "std_lead_time_days", "order_count",
            ])

        df = supply_orders.copy()

        # Only completed orders with actual delivery dates
        df = df[df["status"] == "received"].copy()
        df = df.dropna(subset=["actual_delivery_date", "expected_delivery_date"])

        df["expected_delivery_date"] = pd.to_datetime(df["expected_delivery_date"])
        df["actual_delivery_date"] = pd.to_datetime(df["actual_delivery_date"])
        df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")

        # Lead time = actual_delivery - order creation (or expected as baseline)
        if "created_at" in df.columns and df["created_at"].notna().any():
            df["lead_time_days"] = (
                df["actual_delivery_date"] - df["created_at"]
            ).dt.total_seconds() / 86400
        else:
            # Fallback: use expected_delivery_date as approximation
            df["lead_time_days"] = (
                df["actual_delivery_date"] - df["expected_delivery_date"]
            ).dt.total_seconds() / 86400

        # Keep only positive lead times
        df = df[df["lead_time_days"] > 0]

        id_col = "resource_sku" if "resource_sku" in df.columns else "resource_id"

        stats = (
            df.groupby(id_col)["lead_time_days"]
            .agg(["mean", "std", "count"])
            .reset_index()
            .rename(columns={
                "mean": "avg_lead_time_days",
                "std": "std_lead_time_days",
                "count": "order_count",
            })
        )
        stats["std_lead_time_days"] = stats["std_lead_time_days"].fillna(0.0)
        return stats

    # ── Summary / repr ───────────────────────────────────────

    def __repr__(self) -> str:
        return (
            f"SafetyStockCalculator("
            f"service_level={self.service_level}, z={self.z:.4f}, "
            f"default_lt={self.default_lt}d ± {self.default_lt_std}d)"
        )
