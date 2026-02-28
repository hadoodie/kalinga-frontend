"""
Anomaly-Triggered Intraday Recalculation — Z-Score Detector (Epic 4).

Compares real-time hourly consumption against the forecasted depletion
curve.  When actual consumption exceeds ``z_threshold`` standard
deviations from the expected hourly rate, the detector fires an alert
and recommends an emergency re-forecast.

This is an **event-driven** check — it is NOT a scheduled batch job.
The caller (Laravel ``IntradayAnomalyService`` or the FastAPI endpoint)
invokes ``detect()`` whenever a new stock-movement is recorded.

Algorithm
---------
1. Compute the *expected* hourly consumption from the last forecast
   (``yhat`` for the current hour slot).
2. Compute the *historical* standard deviation of hourly consumption
   for the same (hospital, resource) pair over a rolling lookback
   window (default 168 h = 7 days).
3. Calculate a Z-score:  z = (actual − expected) / σ
4. If z > z_threshold (default 1.5) → anomaly detected.

The detector returns a structured ``AnomalyResult`` for every
(hospital, resource) pair evaluated, including the Z-score, severity
classification, and whether a re-forecast is recommended.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional


@dataclass
class AnomalyResult:
    """Result of the anomaly check for a single (hospital, resource) pair."""
    hospital_id: int
    resource_id: int
    hour: str                          # ISO-8601 of the evaluated hour slot
    actual_consumption: float
    expected_consumption: float        # yhat from last forecast
    historical_std: float              # σ over lookback window
    z_score: float
    is_anomaly: bool
    severity: str                      # "normal" | "warning" | "critical"
    recommend_reforecast: bool
    details: str = ""


class AnomalyDetector:
    """
    Z-score anomaly detector for intraday consumption spikes.

    Parameters
    ----------
    z_threshold : float
        Number of standard deviations above the expected rate that
        triggers an anomaly.  Default 1.5.
    critical_z : float
        Z-score above which the anomaly is classified as *critical*
        (requiring immediate action).  Default 2.5.
    lookback_hours : int
        Number of past hours to use when computing the historical
        standard deviation.  Default 168 (7 days).
    min_std : float
        Floor for the standard deviation to avoid division-by-zero when
        consumption is perfectly constant.  Default 0.1.
    """

    def __init__(
        self,
        z_threshold: float = 1.5,
        critical_z: float = 2.5,
        lookback_hours: int = 168,
        min_std: float = 0.1,
    ):
        self.z_threshold = z_threshold
        self.critical_z = critical_z
        self.lookback_hours = lookback_hours
        self.min_std = min_std

    # ── Core detection ───────────────────────────────────────

    def detect(
        self,
        actual_hourly: pd.DataFrame,
        forecast_hourly: pd.DataFrame,
        historical_movements: pd.DataFrame,
        as_of: Optional[datetime] = None,
    ) -> List[AnomalyResult]:
        """
        Run anomaly detection for the current hour slot.

        Parameters
        ----------
        actual_hourly : DataFrame
            Columns: hospital_id, resource_id, consumption
            One row per (hospital, resource) with the *actual* outflow
            recorded in the current hour.
        forecast_hourly : DataFrame
            Columns: hospital_id, resource_id, yhat
            The forecasted demand for the same hour (from the last run
            of the demand model).
        historical_movements : DataFrame
            Raw stock_movements table (must include created_at, quantity,
            movement_type/type, hospital_id, resource_id).  Used to
            compute the rolling σ.
        as_of : datetime, optional
            Reference timestamp for the hour being evaluated.
            Defaults to now floored to the current hour.

        Returns
        -------
        list[AnomalyResult]
            One entry per (hospital, resource) pair.
        """
        if as_of is None:
            as_of = pd.Timestamp.now(tz="Asia/Manila").floor("h")
        else:
            as_of = pd.Timestamp(as_of).floor("h")

        # Compute historical hourly std per (hospital, resource)
        hist_stats = self._historical_stats(historical_movements, as_of)

        # Merge actual + forecast + stats
        merged = actual_hourly.merge(
            forecast_hourly[["hospital_id", "resource_id", "yhat"]],
            on=["hospital_id", "resource_id"],
            how="left",
        )
        merged = merged.merge(
            hist_stats,
            on=["hospital_id", "resource_id"],
            how="left",
        )

        # Fill missing forecast with 0 (no forecast available → any
        # consumption is suspicious)
        merged["yhat"] = merged["yhat"].fillna(0)
        merged["hist_std"] = merged["hist_std"].fillna(self.min_std).clip(lower=self.min_std)
        merged["hist_mean"] = merged["hist_mean"].fillna(0)

        results: List[AnomalyResult] = []
        for _, row in merged.iterrows():
            actual = float(row["consumption"])
            expected = float(row["yhat"])
            sigma = float(row["hist_std"])

            z = (actual - expected) / sigma if sigma > 0 else 0.0

            is_anomaly = z > self.z_threshold
            if z >= self.critical_z:
                severity = "critical"
            elif z >= self.z_threshold:
                severity = "warning"
            else:
                severity = "normal"

            # Recommend re-forecast for any anomaly, but mark critical
            # as requiring immediate dispatch notification too.
            recommend = is_anomaly

            detail_parts = []
            if is_anomaly:
                detail_parts.append(
                    f"Consumption {actual:.1f} exceeds forecast {expected:.1f} "
                    f"by {z:.2f}σ (threshold {self.z_threshold}σ)"
                )
                if severity == "critical":
                    detail_parts.append("CRITICAL — escalate to dispatch")

            results.append(AnomalyResult(
                hospital_id=int(row["hospital_id"]),
                resource_id=int(row["resource_id"]),
                hour=str(as_of),
                actual_consumption=round(actual, 4),
                expected_consumption=round(expected, 4),
                historical_std=round(sigma, 4),
                z_score=round(z, 4),
                is_anomaly=is_anomaly,
                severity=severity,
                recommend_reforecast=recommend,
                details="; ".join(detail_parts),
            ))

        return results

    # ── Batch check (multiple hours) ─────────────────────────

    def detect_batch(
        self,
        actual_hourly: pd.DataFrame,
        forecast_hourly: pd.DataFrame,
        historical_movements: pd.DataFrame,
        hours: Optional[List[datetime]] = None,
    ) -> List[AnomalyResult]:
        """
        Run detection across multiple hour-slots.

        ``actual_hourly`` must have an ``hour`` column so consumption
        can be grouped per slot.
        """
        if hours is None:
            hours = sorted(actual_hourly["hour"].unique())

        all_results: List[AnomalyResult] = []
        for h in hours:
            slot_actual = actual_hourly[actual_hourly["hour"] == h].copy()
            if slot_actual.empty:
                continue
            slot_forecast = forecast_hourly.copy()
            # If forecast has a forecast_time column, filter to the slot
            if "forecast_time" in slot_forecast.columns:
                slot_forecast = slot_forecast[
                    slot_forecast["forecast_time"] == pd.Timestamp(h)
                ]
            results = self.detect(
                slot_actual,
                slot_forecast,
                historical_movements,
                as_of=h,
            )
            all_results.extend(results)

        return all_results

    # ── Historical statistics ────────────────────────────────

    def _historical_stats(
        self,
        stock_movements: pd.DataFrame,
        as_of: pd.Timestamp,
    ) -> pd.DataFrame:
        """
        Compute rolling mean & std of hourly consumption per
        (hospital_id, resource_id) over the lookback window.
        """
        if stock_movements.empty:
            return pd.DataFrame(columns=["hospital_id", "resource_id", "hist_mean", "hist_std"])

        df = stock_movements.copy()
        df["created_at"] = pd.to_datetime(df["created_at"])

        # Remove timezone info for comparison if needed
        if as_of.tz is not None:
            try:
                df["created_at"] = df["created_at"].dt.tz_localize(as_of.tz)
            except TypeError:
                df["created_at"] = df["created_at"].dt.tz_convert(as_of.tz)

        type_col = "movement_type" if "movement_type" in df.columns else "type"
        outflows = df[df[type_col] == "out"].copy()

        cutoff = as_of - pd.Timedelta(hours=self.lookback_hours)
        window = outflows[
            (outflows["created_at"] >= cutoff) & (outflows["created_at"] < as_of)
        ].copy()

        if window.empty:
            return pd.DataFrame(columns=["hospital_id", "resource_id", "hist_mean", "hist_std"])

        window["hour"] = window["created_at"].dt.floor("h")
        hourly = (
            window.groupby(["hospital_id", "resource_id", "hour"])["quantity"]
            .sum()
            .reset_index()
            .rename(columns={"quantity": "consumption"})
        )

        stats = (
            hourly.groupby(["hospital_id", "resource_id"])["consumption"]
            .agg(["mean", "std"])
            .reset_index()
            .rename(columns={"mean": "hist_mean", "std": "hist_std"})
        )
        stats["hist_std"] = stats["hist_std"].fillna(self.min_std).clip(lower=self.min_std)

        return stats

    # ── Convenience: single-resource check ───────────────────

    def check_single(
        self,
        hospital_id: int,
        resource_id: int,
        actual_consumption: float,
        expected_consumption: float,
        historical_std: float,
    ) -> AnomalyResult:
        """
        Quick anomaly check for a single (hospital, resource) without
        needing DataFrames.  Useful for real-time webhook handlers.
        """
        sigma = max(historical_std, self.min_std)
        z = (actual_consumption - expected_consumption) / sigma

        is_anomaly = z > self.z_threshold
        if z >= self.critical_z:
            severity = "critical"
        elif z >= self.z_threshold:
            severity = "warning"
        else:
            severity = "normal"

        detail = ""
        if is_anomaly:
            detail = (
                f"Consumption {actual_consumption:.1f} exceeds forecast "
                f"{expected_consumption:.1f} by {z:.2f}σ"
            )

        return AnomalyResult(
            hospital_id=hospital_id,
            resource_id=resource_id,
            hour=str(pd.Timestamp.now(tz="Asia/Manila").floor("h")),
            actual_consumption=round(actual_consumption, 4),
            expected_consumption=round(expected_consumption, 4),
            historical_std=round(sigma, 4),
            z_score=round(z, 4),
            is_anomaly=is_anomaly,
            severity=severity,
            recommend_reforecast=is_anomaly,
            details=detail,
        )
