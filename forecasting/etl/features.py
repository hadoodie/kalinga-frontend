"""
ETL: Feature engineering for demand & risk models.

Transforms raw extracted data into hourly feature matrices
that LightGBM / logistic regression can consume.
"""

import numpy as np
import pandas as pd


def build_hourly_consumption(stock_movements: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate stock_movements into hourly outflow per (hospital_id, resource_id).

    Returns DataFrame with columns:
        hospital_id, resource_id, hour, consumption
    """
    if stock_movements.empty:
        return pd.DataFrame(columns=["hospital_id", "resource_id", "hour", "consumption"])

    df = stock_movements.copy()
    df["created_at"] = pd.to_datetime(df["created_at"])
    df["hour"] = df["created_at"].dt.floor("h")

    # Normalize column name: DB uses 'movement_type', demo uses 'type'
    type_col = "movement_type" if "movement_type" in df.columns else "type"

    # Only count outflows as demand
    out = df[df[type_col] == "out"].copy()

    hourly = (
        out.groupby(["hospital_id", "resource_id", "hour"])["quantity"]
        .sum()
        .reset_index()
        .rename(columns={"quantity": "consumption"})
    )
    return hourly


def build_hourly_requests(requests_df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate requests into hourly request count & total qty per (hospital_id, resource_id).
    """
    if requests_df.empty:
        return pd.DataFrame(columns=[
            "hospital_id", "resource_id", "hour", "request_count", "request_qty",
        ])

    df = requests_df.copy()
    df["created_at"] = pd.to_datetime(df["created_at"])
    df["hour"] = df["created_at"].dt.floor("h")

    # Normalize quantity column name
    qty_col = "quantity_requested" if "quantity_requested" in df.columns else "quantity"

    # Use a count column (id if available, else just count rows)
    grouped = df.groupby(["hospital_id", "resource_id", "hour"])
    hourly = pd.DataFrame({
        "request_count": grouped[qty_col].count(),
        "request_qty": grouped[qty_col].sum(),
    }).reset_index()
    return hourly


def build_incident_features(incidents: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate incidents into hourly counts.
    """
    if incidents.empty:
        return pd.DataFrame(columns=["hour", "incident_count"])

    df = incidents.copy()
    df["created_at"] = pd.to_datetime(df["created_at"])
    df["hour"] = df["created_at"].dt.floor("h")

    hourly = (
        df.groupby("hour")["id"]
        .count()
        .reset_index()
        .rename(columns={"id": "incident_count"})
    )
    return hourly


def add_time_features(df: pd.DataFrame, time_col: str = "hour") -> pd.DataFrame:
    """
    Add cyclical time features: hour_of_day, day_of_week, is_weekend, month.
    Uses sin/cos encoding for cyclical nature.
    """
    df = df.copy()
    t = pd.to_datetime(df[time_col])

    df["hour_of_day"] = t.dt.hour
    df["day_of_week"] = t.dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["month"] = t.dt.month

    # Cyclical encoding
    df["hour_sin"] = np.sin(2 * np.pi * df["hour_of_day"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour_of_day"] / 24)
    df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)

    return df


def build_demand_features(
    resources: pd.DataFrame,
    stock_movements: pd.DataFrame,
    requests_df: pd.DataFrame,
    incidents: pd.DataFrame,
    blockades: pd.DataFrame,
    weather: pd.DataFrame,
    resilience_configs: pd.DataFrame,
    horizon_hours: int = 48,
) -> pd.DataFrame:
    """
    Build the full feature matrix for demand forecasting.

    One row per (hospital_id, resource_id, future_hour).
    """
    # Generate future hour slots
    now = pd.Timestamp.now(tz="Asia/Manila").floor("h")
    future_hours = pd.date_range(now, periods=horizon_hours, freq="h")

    # Normalize column names (DB uses 'minimum_stock', demo uses 'minimum_quantity')
    if "minimum_quantity" in resources.columns and "minimum_stock" not in resources.columns:
        resources = resources.rename(columns={"minimum_quantity": "minimum_stock"})

    # Get unique (hospital, resource) pairs
    keep_cols = ["hospital_id", "resource_id", "resource_name", "category",
                 "current_quantity", "minimum_stock", "is_critical"]
    # Also keep these if they exist on resources (demo data has them here)
    for col in ["normal_daily_usage", "surge_multiplier"]:
        if col in resources.columns:
            keep_cols.append(col)
    pairs = resources[[c for c in keep_cols if c in resources.columns]].copy()

    # Cross join pairs × future hours
    pairs["_key"] = 1
    hours_df = pd.DataFrame({"hour": future_hours, "_key": 1})
    features = pairs.merge(hours_df, on="_key").drop("_key", axis=1)

    # Add time features
    features = add_time_features(features, "hour")

    # Add historical consumption rate (avg per hour over last 7 days)
    hourly_consumption = build_hourly_consumption(stock_movements)
    if not hourly_consumption.empty:
        avg_consumption = (
            hourly_consumption.groupby(["hospital_id", "resource_id"])["consumption"]
            .mean()
            .reset_index()
            .rename(columns={"consumption": "avg_hourly_consumption"})
        )
        features = features.merge(avg_consumption, on=["hospital_id", "resource_id"], how="left")
    else:
        features["avg_hourly_consumption"] = 0.0

    # Add request rate
    hourly_requests = build_hourly_requests(requests_df)
    if not hourly_requests.empty:
        avg_requests = (
            hourly_requests.groupby(["hospital_id", "resource_id"])["request_count"]
            .mean()
            .reset_index()
            .rename(columns={"request_count": "avg_hourly_requests"})
        )
        features = features.merge(avg_requests, on=["hospital_id", "resource_id"], how="left")
    else:
        features["avg_hourly_requests"] = 0.0

    # Add incident count (global)
    active_statuses = ["active", "reported", "acknowledged", "en_route", "on_scene"]
    features["active_incidents"] = len(
        incidents[incidents["status"].isin(active_statuses)]
    ) if not incidents.empty else 0

    # Add blockade count
    features["active_blockades"] = len(blockades) if not blockades.empty else 0

    # Add weather (merge on hour)
    if not weather.empty:
        weather_slim = weather.rename(columns={"time": "hour"})
        # Ensure timezone compatibility for merge
        if features["hour"].dt.tz is not None and weather_slim["hour"].dt.tz is None:
            weather_slim["hour"] = weather_slim["hour"].dt.tz_localize(features["hour"].dt.tz)
        elif features["hour"].dt.tz is None and weather_slim["hour"].dt.tz is not None:
            weather_slim["hour"] = weather_slim["hour"].dt.tz_localize(None)
        features = features.merge(weather_slim, on="hour", how="left")
    else:
        features["temperature_2m"] = np.nan
        features["precipitation_mm"] = 0.0
        features["wind_speed_kph"] = 0.0

    # Add resilience config (survival hours, and daily usage if not already present)
    if not resilience_configs.empty:
        rc_cols = ["hospital_id", "resource_id"]
        for col in ["current_survival_hours", "normal_daily_usage", "surge_multiplier"]:
            if col in resilience_configs.columns and col not in features.columns:
                rc_cols.append(col)
            elif col in resilience_configs.columns and col in features.columns:
                pass  # already present from resources merge
        if len(rc_cols) > 2:
            rc = resilience_configs[rc_cols].copy()
            features = features.merge(rc, on=["hospital_id", "resource_id"], how="left")
    # Ensure columns exist with defaults
    if "normal_daily_usage" not in features.columns:
        features["normal_daily_usage"] = np.nan
    if "surge_multiplier" not in features.columns:
        features["surge_multiplier"] = 1.0
    if "current_survival_hours" not in features.columns:
        features["current_survival_hours"] = np.nan

    # Fill NaN
    features = features.fillna(0)

    # Compute stock ratio (current / minimum) as risk signal
    min_stock = features["minimum_stock"] if "minimum_stock" in features.columns else 0
    features["stock_ratio"] = np.where(
        min_stock > 0,
        features["current_quantity"] / min_stock,
        999.0,
    )

    # Horizon column (hours from now)
    features["horizon_h"] = ((features["hour"] - now).dt.total_seconds() / 3600).astype(int) + 1

    # Rename hour → forecast_time for downstream consumers
    features = features.rename(columns={"hour": "forecast_time"})

    return features


# ── Feature columns used by the models ────────────────────────
DEMAND_FEATURE_COLS = [
    "hour_sin", "hour_cos", "dow_sin", "dow_cos", "is_weekend", "month",
    "avg_hourly_consumption", "avg_hourly_requests",
    "current_quantity", "stock_ratio",
    "active_incidents", "active_blockades",
    "temperature_2m", "precipitation_mm", "wind_speed_kph",
    "normal_daily_usage", "surge_multiplier", "current_survival_hours",
    "is_critical", "horizon_h",
]

RISK_FEATURE_COLS = DEMAND_FEATURE_COLS  # same features, different target
