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
    hospitals: pd.DataFrame | None = None,
) -> pd.DataFrame:
    """
    Build the full feature matrix for demand forecasting.

    One row per (hospital_id, resource_id, future_hour).

    Parameters
    ----------
    hospitals : DataFrame, optional
        Must contain ``hospital_id`` and ``disaster_mode_active`` columns.
        When provided, the exogenous flag ``is_active_disaster_alert`` is
        derived from the hospital's disaster mode status.  When *not*
        provided the flag defaults to 0 (no alert).
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

    # ── Exogenous event flag: is_active_disaster_alert ───────
    # Derived from the hospital's disaster_mode_active column when the
    # hospitals DataFrame is supplied.  This flag lets the quantile
    # regression model dynamically scale predictions during active
    # emergencies.
    if hospitals is not None and "disaster_mode_active" in hospitals.columns:
        disaster_map = (
            hospitals[["id", "disaster_mode_active"]]
            .rename(columns={"id": "hospital_id"})
            .drop_duplicates("hospital_id")
        )
        disaster_map["is_active_disaster_alert"] = (
            disaster_map["disaster_mode_active"].astype(int)
        )
        features = features.merge(
            disaster_map[["hospital_id", "is_active_disaster_alert"]],
            on="hospital_id",
            how="left",
        )
    if "is_active_disaster_alert" not in features.columns:
        features["is_active_disaster_alert"] = 0
    features["is_active_disaster_alert"] = features["is_active_disaster_alert"].fillna(0).astype(int)

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

    # ── Add actual consumption labels for past hours (enables supervised training) ──
    # For future hours actual_consumption will be NaN; for past hours it holds the
    # true hourly outflow so LightGBM can learn from it.
    hourly_labels = build_hourly_consumption(stock_movements)
    if not hourly_labels.empty:
        # rename to avoid clash with avg_hourly_consumption
        hourly_labels = hourly_labels.rename(columns={"consumption": "actual_consumption"})
        # Align timezone for merge
        if features["forecast_time"].dt.tz is not None and hourly_labels["hour"].dt.tz is None:
            hourly_labels["hour"] = hourly_labels["hour"].dt.tz_localize(features["forecast_time"].dt.tz)
        elif features["forecast_time"].dt.tz is None and hourly_labels["hour"].dt.tz is not None:
            hourly_labels["hour"] = hourly_labels["hour"].dt.tz_localize(None)
        features = features.merge(
            hourly_labels,
            left_on=["hospital_id", "resource_id", "forecast_time"],
            right_on=["hospital_id", "resource_id", "hour"],
            how="left",
        )
        # Drop the duplicate 'hour' column from the merge
        if "hour" in features.columns:
            features = features.drop(columns=["hour"])
    # actual_consumption will be NaN for future timestamps — that's expected;
    # run_forecast.py checks `if "actual_consumption" in features.columns`
    # and only trains when there are non-null labels.

    # ── Add stockout labels for past hours (enables supervised risk training) ──
    # A stockout is when current_quantity dropped to 0 for this (hospital, resource)
    # at a given hour. We derive this from stock_movements: if new_quantity hit 0
    # after an outflow, that hour is a stockout event.
    if not stock_movements.empty and "new_quantity" in stock_movements.columns:
        sm = stock_movements.copy()
        sm["created_at"] = pd.to_datetime(sm["created_at"])
        sm["hour"] = sm["created_at"].dt.floor("h")

        type_col = "movement_type" if "movement_type" in sm.columns else "type"
        outflows = sm[sm[type_col] == "out"].copy()

        if not outflows.empty:
            # Flag hours where stock hit zero after an outflow
            stockout_hours = (
                outflows[outflows["new_quantity"] <= 0]
                .groupby(["hospital_id", "resource_id", "hour"])
                .size()
                .reset_index()
                .rename(columns={0: "_stockout_count"})
            )
            stockout_hours["stockout_occurred"] = 1.0

            # Align timezone for merge
            if features["forecast_time"].dt.tz is not None and stockout_hours["hour"].dt.tz is None:
                stockout_hours["hour"] = stockout_hours["hour"].dt.tz_localize(features["forecast_time"].dt.tz)
            elif features["forecast_time"].dt.tz is None and stockout_hours["hour"].dt.tz is not None:
                stockout_hours["hour"] = stockout_hours["hour"].dt.tz_localize(None)

            features = features.merge(
                stockout_hours[["hospital_id", "resource_id", "hour", "stockout_occurred"]],
                left_on=["hospital_id", "resource_id", "forecast_time"],
                right_on=["hospital_id", "resource_id", "hour"],
                how="left",
            )
            if "hour" in features.columns:
                features = features.drop(columns=["hour"])

            # Fill non-stockout past hours with 0 (only where actual_consumption is known)
            if "actual_consumption" in features.columns:
                past_mask = features["actual_consumption"].notna()
                features.loc[past_mask & features["stockout_occurred"].isna(), "stockout_occurred"] = 0.0
    # stockout_occurred will be NaN for future timestamps and hours without movement data

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
    "is_active_disaster_alert",
]

RISK_FEATURE_COLS = DEMAND_FEATURE_COLS  # same features, different target
