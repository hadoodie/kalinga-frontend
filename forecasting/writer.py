"""
Write forecast results back to PostgreSQL.
Used in production mode to persist predictions for the Laravel API.
"""

import json
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime, timezone

from forecasting.config import DATABASE_URL, MODEL_VERSION, FORECAST_RETENTION_DAYS


def _normalize_timestamp(ts):
    """
    Convert a timestamp to a timezone-naive UTC datetime.
    pandas/SQLAlchemy can fail when inserting timezone-aware datetimes
    into PostgreSQL TIMESTAMP columns via to_sql().
    """
    if ts is None:
        return None
    if isinstance(ts, pd.Timestamp):
        ts = ts.to_pydatetime()
    if hasattr(ts, 'tzinfo') and ts.tzinfo is not None:
        # Convert to UTC then strip tzinfo
        ts = ts.astimezone(timezone.utc).replace(tzinfo=None)
    return ts


def get_engine():
    """Create SQLAlchemy engine from config."""
    return create_engine(DATABASE_URL)


def write_demand_forecasts(df: pd.DataFrame, engine=None):
    """
    Write demand forecasts to forecast_demand_hourly table.
    Clears current-run data first to avoid duplicates.
    """
    if df is None or df.empty:
        return 0

    if engine is None:
        engine = get_engine()

    now = datetime.utcnow()

    records = []
    for _, row in df.iterrows():
        # Serialize feature_snapshot dict as JSON string for JSONB column
        snapshot = row.get("feature_snapshot", {})
        if isinstance(snapshot, dict):
            snapshot = json.dumps(snapshot)
        elif snapshot is None:
            snapshot = json.dumps({})

        records.append({
            "hospital_id": int(row["hospital_id"]),
            "resource_id": int(row["resource_id"]),
            "forecast_time": _normalize_timestamp(row["forecast_time"]),
            "horizon_h": int(row["horizon_h"]),
            "yhat": float(row["yhat"]),
            "yhat_lower": float(row["yhat_lower"]),
            "yhat_upper": float(row["yhat_upper"]),
            "feature_snapshot": snapshot,
            "model_version": MODEL_VERSION,
            "generated_at": now,
        })

    out = pd.DataFrame(records)

    with engine.begin() as conn:
        # Delete forecasts for this exact timeframe and model version to maintain idempotency
        conn.execute(
            text("DELETE FROM forecast_demand_hourly WHERE forecast_time >= :min_time AND forecast_time <= :max_time AND model_version = :version"),
            {
                "min_time": out["forecast_time"].min(),
                "max_time": out["forecast_time"].max(),
                "version": MODEL_VERSION
            }
        )

        # Delete stale forecasts (older than retention period)
        conn.execute(
            text("DELETE FROM forecast_demand_hourly WHERE generated_at < NOW() - :days * INTERVAL '1 day'"),
            {"days": FORECAST_RETENTION_DAYS},
        )
        out.to_sql("forecast_demand_hourly", conn, if_exists="append", index=False, method="multi")

    print(f"[writer] Wrote {len(out)} demand forecasts to DB")
    return len(out)


def write_risk_forecasts(df: pd.DataFrame, engine=None):
    """
    Write risk forecasts to forecast_risk_hourly table.
    Clears current-run data first to avoid duplicates.
    """
    if df is None or df.empty:
        return 0

    if engine is None:
        engine = get_engine()

    now = datetime.utcnow()

    records = []
    for _, row in df.iterrows():
        # Serialize risk_factors dict as JSON string for JSONB column
        factors = row.get("risk_factors", {})
        if isinstance(factors, dict):
            factors = json.dumps(factors)
        elif factors is None:
            factors = json.dumps({})

        records.append({
            "hospital_id": int(row["hospital_id"]),
            "resource_id": int(row["resource_id"]),
            "forecast_time": _normalize_timestamp(row["forecast_time"]),
            "horizon_h": int(row["horizon_h"]),
            "risk_prob": float(row["risk_prob"]),
            "projected_stock": float(row.get("projected_stock", 0)),
            "days_until_stockout": float(row.get("days_until_stockout", 999)),
            "risk_level": str(row.get("risk_level", "low")),
            "risk_factors": factors,
            "model_version": MODEL_VERSION,
            "generated_at": now,
        })

    out = pd.DataFrame(records)

    with engine.begin() as conn:
        # Delete forecasts for this exact timeframe and model version to maintain idempotency
        conn.execute(
            text("DELETE FROM forecast_risk_hourly WHERE forecast_time >= :min_time AND forecast_time <= :max_time AND model_version = :version"),
            {
                "min_time": out["forecast_time"].min(),
                "max_time": out["forecast_time"].max(),
                "version": MODEL_VERSION
            }
        )

        conn.execute(
            text("DELETE FROM forecast_risk_hourly WHERE generated_at < NOW() - :days * INTERVAL '1 day'"),
            {"days": FORECAST_RETENTION_DAYS},
        )
        out.to_sql("forecast_risk_hourly", conn, if_exists="append", index=False, method="multi")

    print(f"[writer] Wrote {len(out)} risk forecasts to DB")
    return len(out)


def prune_old_forecasts(engine=None, retention_days: int | None = None):
    """
    Delete forecast data older than retention_days.
    Called by the Laravel 'forecasts:prune' command or manually.
    """
    if engine is None:
        engine = get_engine()
    days = retention_days or FORECAST_RETENTION_DAYS

    with engine.begin() as conn:
        d = conn.execute(
            text("DELETE FROM forecast_demand_hourly WHERE generated_at < NOW() - :days * INTERVAL '1 day'"),
            {"days": days},
        )
        r = conn.execute(
            text("DELETE FROM forecast_risk_hourly WHERE generated_at < NOW() - :days * INTERVAL '1 day'"),
            {"days": days},
        )
    demand_deleted = d.rowcount
    risk_deleted = r.rowcount
    print(f"[prune] Removed {demand_deleted} demand + {risk_deleted} risk rows older than {days}d")
    return demand_deleted + risk_deleted
