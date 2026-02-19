"""
Write forecast results back to PostgreSQL.
Used in production mode to persist predictions for the Laravel API.
"""

import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime

from forecasting.config import DATABASE_URL, MODEL_VERSION


def get_engine():
    """Create SQLAlchemy engine from config."""
    return create_engine(DATABASE_URL)


def write_demand_forecasts(df: pd.DataFrame, engine=None):
    """
    Write demand forecasts to forecast_demand_hourly table.
    Clears current-run data first to avoid duplicates.
    """
    if engine is None:
        engine = get_engine()

    now = datetime.utcnow()

    records = []
    for _, row in df.iterrows():
        records.append({
            "hospital_id": int(row["hospital_id"]),
            "resource_id": int(row["resource_id"]),
            "forecast_time": row["forecast_time"],
            "horizon_h": int(row["horizon_h"]),
            "yhat": float(row["yhat"]),
            "yhat_lower": float(row["yhat_lower"]),
            "yhat_upper": float(row["yhat_upper"]),
            "feature_snapshot": row.get("feature_snapshot", {}),
            "model_version": MODEL_VERSION,
            "generated_at": now,
        })

    out = pd.DataFrame(records)

    with engine.begin() as conn:
        # Delete stale forecasts (older than 1 day)
        conn.execute(text(
            "DELETE FROM forecast_demand_hourly WHERE generated_at < NOW() - INTERVAL '1 day'"
        ))
        out.to_sql("forecast_demand_hourly", conn, if_exists="append", index=False)

    print(f"[writer] Wrote {len(out)} demand forecasts to DB")
    return len(out)


def write_risk_forecasts(df: pd.DataFrame, engine=None):
    """
    Write risk forecasts to forecast_risk_hourly table.
    Clears current-run data first to avoid duplicates.
    """
    if engine is None:
        engine = get_engine()

    now = datetime.utcnow()

    records = []
    for _, row in df.iterrows():
        records.append({
            "hospital_id": int(row["hospital_id"]),
            "resource_id": int(row["resource_id"]),
            "forecast_time": row["forecast_time"],
            "horizon_h": int(row["horizon_h"]),
            "risk_prob": float(row["risk_prob"]),
            "projected_stock": float(row.get("projected_stock", 0)),
            "days_until_stockout": float(row.get("days_until_stockout", 999)),
            "risk_level": str(row.get("risk_level", "low")),
            "risk_factors": row.get("risk_factors", {}),
            "model_version": MODEL_VERSION,
            "generated_at": now,
        })

    out = pd.DataFrame(records)

    with engine.begin() as conn:
        conn.execute(text(
            "DELETE FROM forecast_risk_hourly WHERE generated_at < NOW() - INTERVAL '1 day'"
        ))
        out.to_sql("forecast_risk_hourly", conn, if_exists="append", index=False)

    print(f"[writer] Wrote {len(out)} risk forecasts to DB")
    return len(out)
