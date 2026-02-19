"""
Kalinga Forecasting — central configuration.

Reads from environment variables with sensible defaults.
Set DATABASE_URL to connect to the Kalinga Postgres instance.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root if present (only when FORECAST_DATABASE_URL
# isn't already set — i.e. not when launched from Laravel's RunForecasts)
if not os.getenv("FORECAST_DATABASE_URL"):
    _env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
    if _env_path.exists():
        load_dotenv(_env_path)

# ── Paths ────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent
OUTPUT_DIR = PROJECT_ROOT / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# ── Database ─────────────────────────────────────────────────
# Priority: FORECAST_DATABASE_URL (passed by Laravel) > DATABASE_URL > construct from parts
_db_host = os.getenv("DB_HOST", "127.0.0.1")
_db_port = os.getenv("DB_PORT", "5432")
_db_name = os.getenv("DB_DATABASE", "db_kalinga")
_db_user = os.getenv("DB_USERNAME", "postgres")
_db_pass = os.getenv("DB_PASSWORD", "")
_db_ssl  = os.getenv("DB_SSLMODE", "prefer")

_constructed_url = f"postgresql://{_db_user}:{_db_pass}@{_db_host}:{_db_port}/{_db_name}?sslmode={_db_ssl}"

DATABASE_URL = (
    os.getenv("FORECAST_DATABASE_URL")
    or os.getenv("DATABASE_URL")
    or _constructed_url
)

# ── Forecast Parameters ──────────────────────────────────────
FORECAST_HORIZON_HOURS = int(os.getenv("FORECAST_HORIZON_HOURS", "48"))
MODEL_VERSION = os.getenv("MODEL_VERSION", "v0.1")

# ── Weather (Open-Meteo — free, no key needed) ──────────────
WEATHER_API_BASE = "https://api.open-meteo.com/v1/forecast"
# Default coordinates: Metro Manila
DEFAULT_LAT = float(os.getenv("WEATHER_LAT", "14.5995"))
DEFAULT_LON = float(os.getenv("WEATHER_LON", "120.9842"))

# ── Model Tuning ─────────────────────────────────────────────
DEMAND_MODEL_PARAMS = {
    "n_estimators": 200,
    "max_depth": 6,
    "learning_rate": 0.05,
    "num_leaves": 31,
    "min_child_samples": 10,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "random_state": 42,
    "verbose": -1,
}

RISK_THRESHOLD_HIGH = 0.65
RISK_THRESHOLD_CRITICAL = 0.85

# ── Data Retention ───────────────────────────────────────────
FORECAST_RETENTION_DAYS = int(os.getenv("FORECAST_RETENTION_DAYS", "30"))
