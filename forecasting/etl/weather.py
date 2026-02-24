"""
ETL: Fetch weather forecast from Open-Meteo (free, no API key).

Returns hourly weather for the next 48h for a given lat/lon.
Used as external features for the demand & risk models.

Includes a file-based cache so the pipeline can survive transient
Open-Meteo outages and avoid redundant HTTP calls within 1 hour.
"""

import json
import time
import requests
import pandas as pd
from pathlib import Path
from forecasting.config import WEATHER_API_BASE, DEFAULT_LAT, DEFAULT_LON, ARTIFACTS_DIR

# Cache lives in the artifacts directory (already gitignored).
WEATHER_CACHE_FILE = ARTIFACTS_DIR / "weather_cache.json"
CACHE_TTL_SECONDS = 3600  # 1 hour


def _cache_key(lat: float, lon: float, hours: int) -> str:
    return f"{lat:.4f}_{lon:.4f}_{hours}"


def _read_cache(key: str) -> pd.DataFrame | None:
    """Return cached DataFrame if fresh, else None."""
    if not WEATHER_CACHE_FILE.exists():
        return None
    try:
        with open(WEATHER_CACHE_FILE, "r") as f:
            store = json.load(f)
        entry = store.get(key)
        if entry and (time.time() - entry.get("ts", 0)) < CACHE_TTL_SECONDS:
            df = pd.DataFrame(entry["data"])
            if "time" in df.columns:
                df["time"] = pd.to_datetime(df["time"])
            return df
    except Exception as e:
        print(f"[weather] cache read error: {e}")
    return None


def _write_cache(key: str, df: pd.DataFrame) -> None:
    """Persist DataFrame to the shared cache file."""
    try:
        store = {}
        if WEATHER_CACHE_FILE.exists():
            with open(WEATHER_CACHE_FILE, "r") as f:
                store = json.load(f)

        serializable = df.copy()
        if "time" in serializable.columns:
            serializable["time"] = serializable["time"].astype(str)

        store[key] = {
            "ts": time.time(),
            "data": serializable.to_dict(orient="list"),
        }
        with open(WEATHER_CACHE_FILE, "w") as f:
            json.dump(store, f)
    except Exception as e:
        print(f"[weather] cache write error: {e}")


def _read_stale_cache(key: str) -> pd.DataFrame | None:
    """Return cached data even if expired — used as fallback on API failure."""
    if not WEATHER_CACHE_FILE.exists():
        return None
    try:
        with open(WEATHER_CACHE_FILE, "r") as f:
            store = json.load(f)
        entry = store.get(key)
        if entry and "data" in entry:
            df = pd.DataFrame(entry["data"])
            if "time" in df.columns:
                df["time"] = pd.to_datetime(df["time"])
            age_min = (time.time() - entry.get("ts", 0)) / 60
            print(f"[weather] using stale cache ({age_min:.0f}m old)")
            return df
    except Exception as e:
        print(f"[weather] stale cache read error: {e}")
    return None


def fetch_weather_forecast(
    lat: float = DEFAULT_LAT,
    lon: float = DEFAULT_LON,
    hours: int = 48,
) -> pd.DataFrame:
    """
    Fetch hourly weather from Open-Meteo (with caching).

    Returns DataFrame with columns:
        time, temperature_2m, precipitation_mm, wind_speed_kph, weather_code

    Cache strategy:
      1. Return fresh cache hit (< 1h old) immediately.
      2. On API failure, fall back to stale cache (any age).
      3. If no cache at all, return empty frame.
    """
    key = _cache_key(lat, lon, hours)

    # 1 — Fresh cache?
    cached = _read_cache(key)
    if cached is not None and len(cached) > 0:
        print(f"[weather] cache hit for {key}")
        return cached

    # 2 — Fetch from Open-Meteo
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,precipitation,wind_speed_10m,weather_code",
        "forecast_days": max(1, (hours // 24) + 1),
        "timezone": "Asia/Manila",
    }

    try:
        resp = requests.get(WEATHER_API_BASE, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        hourly = data.get("hourly", {})
        df = pd.DataFrame({
            "time":             pd.to_datetime(hourly.get("time", [])),
            "temperature_2m":   hourly.get("temperature_2m", []),
            "precipitation_mm": hourly.get("precipitation", []),
            "wind_speed_kph":   hourly.get("wind_speed_10m", []),
            "weather_code":     hourly.get("weather_code", []),
        })

        # Trim to requested horizon
        if len(df) > hours:
            df = df.head(hours)

        # Persist to cache
        _write_cache(key, df)
        return df

    except Exception as e:
        print(f"[weather] Failed to fetch forecast: {e}")

        # 3 — Stale cache fallback
        stale = _read_stale_cache(key)
        if stale is not None and len(stale) > 0:
            return stale

        # 4 — Total miss — return empty frame
        return pd.DataFrame(columns=[
            "time", "temperature_2m", "precipitation_mm",
            "wind_speed_kph", "weather_code",
        ])


def classify_weather_severity(weather_code: int) -> str:
    """
    Map Open-Meteo WMO weather code to a severity label.
    See: https://open-meteo.com/en/docs#weathervariables
    """
    if weather_code is None:
        return "unknown"
    if weather_code <= 3:
        return "clear"
    if weather_code <= 48:
        return "fog"
    if weather_code <= 57:
        return "drizzle"
    if weather_code <= 67:
        return "rain"
    if weather_code <= 77:
        return "snow"
    if weather_code <= 82:
        return "heavy_rain"
    if weather_code <= 86:
        return "heavy_snow"
    if weather_code >= 95:
        return "thunderstorm"
    return "other"
