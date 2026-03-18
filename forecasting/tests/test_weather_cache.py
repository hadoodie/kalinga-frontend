"""
Integration tests for the weather ETL caching layer.

Tests the caching, stale-fallback, and end-to-end fetch logic
without requiring a live Open-Meteo connection.
"""

import json
import time
import pandas as pd
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path

from forecasting.etl.weather import (
    fetch_weather_forecast,
    classify_weather_severity,
    _cache_key,
    _read_cache,
    _write_cache,
    _read_stale_cache,
    CACHE_TTL_SECONDS,
)


# ── Fixtures ──────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def isolated_cache(tmp_path, monkeypatch):
    """Redirect the weather cache file to a temp directory for test isolation."""
    cache_file = tmp_path / "weather_cache.json"
    monkeypatch.setattr(
        "forecasting.etl.weather.WEATHER_CACHE_FILE", cache_file
    )
    return cache_file


def _make_mock_response(hours: int = 48):
    """Build a fake Open-Meteo JSON response."""
    times = pd.date_range("2025-01-01", periods=hours, freq="h")
    return {
        "hourly": {
            "time": [t.isoformat() for t in times],
            "temperature_2m": [25.0] * hours,
            "precipitation": [0.0] * hours,
            "wind_speed_10m": [10.0] * hours,
            "weather_code": [0] * hours,
        }
    }


# ── Cache key ─────────────────────────────────────────────────

def test_cache_key_format():
    key = _cache_key(14.5995, 120.9842, 48)
    assert key == "14.5995_120.9842_48"


# ── Write → Read round-trip ───────────────────────────────────

def test_write_and_read_cache(isolated_cache):
    df = pd.DataFrame({
        "time": pd.date_range("2025-01-01", periods=3, freq="h"),
        "temperature_2m": [25, 26, 27],
        "precipitation_mm": [0, 1, 0],
        "wind_speed_kph": [10, 12, 8],
        "weather_code": [0, 61, 0],
    })
    key = "test_key"
    _write_cache(key, df)

    result = _read_cache(key)
    assert result is not None
    assert len(result) == 3
    assert list(result.columns) == list(df.columns)


def test_read_cache_returns_none_when_expired(isolated_cache):
    df = pd.DataFrame({"time": ["2025-01-01"], "temperature_2m": [25]})
    key = "expired_key"
    _write_cache(key, df)

    # Manually backdate the timestamp
    with open(isolated_cache, "r") as f:
        store = json.load(f)
    store[key]["ts"] = time.time() - CACHE_TTL_SECONDS - 10
    with open(isolated_cache, "w") as f:
        json.dump(store, f)

    assert _read_cache(key) is None


def test_stale_cache_returns_data_even_when_expired(isolated_cache):
    df = pd.DataFrame({"time": ["2025-01-01"], "temperature_2m": [25]})
    key = "stale_key"
    _write_cache(key, df)

    # Backdate
    with open(isolated_cache, "r") as f:
        store = json.load(f)
    store[key]["ts"] = time.time() - CACHE_TTL_SECONDS - 600
    with open(isolated_cache, "w") as f:
        json.dump(store, f)

    result = _read_stale_cache(key)
    assert result is not None
    assert len(result) == 1


# ── fetch_weather_forecast integration ────────────────────────

@patch("forecasting.etl.weather.requests.get")
def test_fetch_populates_cache_on_success(mock_get, isolated_cache):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = _make_mock_response(48)
    mock_resp.raise_for_status = MagicMock()
    mock_get.return_value = mock_resp

    df = fetch_weather_forecast(hours=48)
    assert len(df) == 48
    assert "temperature_2m" in df.columns

    # Cache should now be populated
    assert isolated_cache.exists()
    key = _cache_key(14.5995, 120.9842, 48)
    assert _read_cache(key) is not None


@patch("forecasting.etl.weather.requests.get")
def test_fetch_returns_cache_on_second_call(mock_get, isolated_cache):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = _make_mock_response(48)
    mock_resp.raise_for_status = MagicMock()
    mock_get.return_value = mock_resp

    # First call: hits API
    fetch_weather_forecast(hours=48)
    assert mock_get.call_count == 1

    # Second call: should hit cache, NOT the API
    df2 = fetch_weather_forecast(hours=48)
    assert mock_get.call_count == 1  # still 1
    assert len(df2) == 48


@patch("forecasting.etl.weather.requests.get")
def test_fetch_falls_back_to_stale_cache_on_api_failure(mock_get, isolated_cache):
    # Pre-populate stale cache
    df = pd.DataFrame({
        "time": pd.date_range("2025-01-01", periods=5, freq="h"),
        "temperature_2m": [25] * 5,
        "precipitation_mm": [0] * 5,
        "wind_speed_kph": [10] * 5,
        "weather_code": [0] * 5,
    })
    key = _cache_key(14.5995, 120.9842, 48)
    _write_cache(key, df)

    # Expire the cache
    with open(isolated_cache, "r") as f:
        store = json.load(f)
    store[key]["ts"] = time.time() - CACHE_TTL_SECONDS - 100
    with open(isolated_cache, "w") as f:
        json.dump(store, f)

    # API throws
    mock_get.side_effect = ConnectionError("DNS failure")
    result = fetch_weather_forecast(hours=48)
    assert len(result) == 5  # got stale cache


@patch("forecasting.etl.weather.requests.get")
def test_fetch_returns_empty_on_total_miss(mock_get, isolated_cache):
    """No cache and API failure → empty DataFrame."""
    mock_get.side_effect = ConnectionError("No network")
    result = fetch_weather_forecast(hours=48)
    assert len(result) == 0
    assert "temperature_2m" in result.columns


# ── classify_weather_severity ─────────────────────────────────

@pytest.mark.parametrize(
    "code,expected",
    [
        (0, "clear"),
        (3, "clear"),
        (45, "fog"),
        (53, "drizzle"),
        (63, "rain"),
        (73, "snow"),
        (82, "heavy_rain"),
        (85, "heavy_snow"),
        (95, "thunderstorm"),
        (99, "thunderstorm"),
        (None, "unknown"),
    ],
)
def test_classify_weather_severity(code, expected):
    assert classify_weather_severity(code) == expected
