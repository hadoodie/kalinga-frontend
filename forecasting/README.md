# Kalinga AI Forecasting Pipeline

Hourly demand forecasting and inventory risk scoring per hospital × resource.

## Architecture

```
forecasting/
├── __init__.py            # Package init
├── config.py              # DB url, model params, thresholds (reads backend/.env)
├── run_forecast.py        # CLI entry point (--demo or --production)
├── demo_data.py           # Synthetic data generator (5 hospitals × 8 resources)
├── writer.py              # Writes results to PostgreSQL
├── etl/
│   ├── extract.py         # SQL extracts from Kalinga DB
│   ├── weather.py         # Open-Meteo weather API client
│   └── features.py        # Feature engineering (20 features)
├── models/
│   ├── demand_model.py    # LightGBM demand forecaster (rule-based fallback)
│   └── risk_model.py      # Logistic regression risk scorer (rule-based fallback)
└── output/                # CSV output in demo mode (gitignored)
```

## How It Works

1. **Extract** — Pull resource inventory, stock movements, requests, incidents, blockades from Kalinga DB (or generate synthetic data in demo mode)
2. **Weather** — Fetch hourly precipitation/temperature from Open-Meteo API
3. **Features** — Build feature matrix: cross-join (hospital × resource × future_hours), add time encoding, rolling averages, incident counts, weather severity, resilience config
4. **Demand Model** — Predict hourly units consumed (yhat, yhat_lower, yhat_upper)
5. **Risk Model** — Compute stockout probability and days_until_stockout per item

## Feature Columns (20)

`hour_sin`, `hour_cos`, `dow_sin`, `dow_cos`, `is_weekend`, `avg_hourly_consumption`, `avg_hourly_requests`, `stock_ratio`, `current_quantity`, `normal_daily_usage`, `surge_multiplier`, `current_survival_hours`, `is_critical`, `active_incidents`, `active_blockades`, `precipitation_mm`, `temperature_2m`, `weather_severity`, `horizon_h`, `hospital_id_enc`

## Setup

```powershell
cd forecasting
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Demo Run (no DB needed)

```powershell
cd c:\Users\Jared\Downloads\kalinga
python -m forecasting.run_forecast --demo --horizon 48
```

Outputs → `./output/forecast_demand.csv`, `forecast_risk.csv`, `forecast_summary.json`

## Production Run

Reads DB credentials from `backend/.env` (DB_HOST, DB_PORT, etc.):

```powershell
python -m forecasting.run_forecast --production --horizon 48
```

Writes to → `forecast_demand_hourly` and `forecast_risk_hourly` tables.

## Laravel API Endpoints

The ForecastController serves results to the React frontend:

| Endpoint                                                       | Description           |
| -------------------------------------------------------------- | --------------------- |
| `GET /api/forecasts/demand?hospital_id=&resource_id=&hours=48` | Demand predictions    |
| `GET /api/forecasts/risk?risk_level=high`                      | Risk predictions      |
| `GET /api/forecasts/summary`                                   | Dashboard KPI summary |
| `GET /api/forecasts/hospital/{id}`                             | Per-hospital detail   |

## Model Details

- **Demand**: LightGBM regressor (200 trees, depth 6, lr 0.05). Falls back to rule-based (avg consumption × surge × incident/weather boost) when < 100 training rows.
- **Risk**: Logistic regression with balanced class weights. Falls back to sigmoid-based heuristic combining stock_ratio, survival_hours, incidents, and precipitation.
- **Thresholds**: high ≥ 0.65, critical ≥ 0.85
