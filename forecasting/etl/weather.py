"""
ETL: Fetch weather forecast from Open-Meteo (free, no API key).

Returns hourly weather for the next 48h for a given lat/lon.
Used as external features for the demand & risk models.
"""

import requests
import pandas as pd
from forecasting.config import WEATHER_API_BASE, DEFAULT_LAT, DEFAULT_LON


def fetch_weather_forecast(
    lat: float = DEFAULT_LAT,
    lon: float = DEFAULT_LON,
    hours: int = 48,
) -> pd.DataFrame:
    """
    Fetch hourly weather from Open-Meteo.

    Returns DataFrame with columns:
        time, temperature_2m, precipitation, wind_speed_10m, weather_code
    """
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

        return df

    except Exception as e:
        print(f"[weather] Failed to fetch forecast: {e}")
        # Return empty frame — model will handle missing gracefully
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
