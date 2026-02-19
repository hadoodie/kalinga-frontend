# Kalinga AI Forecasting — Continuation Prompts

Use these prompts to resume work if context is lost. Feed them one at a time.

---

## 🔵 PHASE C — Dashboard Integration (React Frontend)

### ✅ Prompt C-1: Forecast Summary Widget for LogisDash

```
COMPLETED — ForecastSummaryCard.jsx integrated into LogisDash.jsx forecast tab.
Files: src/components/logistics/ForecastSummaryCard.jsx, src/components/logistics/LogisDash.jsx
```

### ✅ Prompt C-2: Demand Forecast Chart

```
COMPLETED — DemandForecastChart.jsx with Recharts AreaChart, hospital/resource filters, confidence bands.
Files: src/components/logistics/DemandForecastChart.jsx
```

### ✅ Prompt C-3: Risk Heatmap & Alerts

```
COMPLETED — RiskHeatmap.jsx with color-coded grid, tooltip details, alert banners for critical items.
Files: src/components/logistics/RiskHeatmap.jsx
```

### Prompt C-4: Hospital Forecast Detail Page

```
Continue building the Kalinga forecast dashboard. We have forecastService.js and ForecastController.php already built.

Create `src/pages-logistics/HospitalForecastDetail.jsx` that:

1. Receives hospitalId from URL params (React Router)
2. Calls forecastService.getHospitalDetail(hospitalId)
3. Shows a comprehensive forecast view for one hospital:
   - Hospital name and location at top
   - Grid of resource cards, each showing: current_quantity, predicted demand (sparkline), risk_level badge, days_until_stockout
   - Full demand forecast chart (DemandForecastChart component with hospitalId filter)
   - Risk timeline: when will each resource hit critical level?
4. Add a route for this page in `src/routes/`

Make it navigable from the main LogisDash page — clicking a hospital name in the risk heatmap should link to this detail page.
```

---

## 🟣 PHASE D — Automation & Intelligence

### ✅ Prompt D-1: Laravel Scheduler (Cron Job)

```
COMPLETED — RunForecasts.php artisan command shells out to Python pipeline.
Registered in routes/console.php to run every 2 hours.
Files: backend/app/Console/Commands/RunForecasts.php, backend/routes/console.php
```

### ✅ Prompt D-2: Auto-Reorder Trigger

```
COMPLETED — AutoReorderService.php processes high-risk items after each forecast cycle.
ForecastController has GET /api/forecasts/auto-reorders endpoint.
Files: backend/app/Services/AutoReorderService.php, backend/app/Http/Controllers/Api/ForecastController.php
```

### ✅ Prompt D-3: Gemini Narrative Generation

```
COMPLETED — ForecastNarrativeService.php queries forecast stats, sends to Gemini, caches for 2h.
GET /api/forecasts/narrative endpoint. ForecastNarrative.jsx displays structured/raw narrative.
Files: backend/app/Services/ForecastNarrativeService.php, src/components/logistics/ForecastNarrative.jsx
```

### ✅ Prompt D-4: Model Retraining & Monitoring (Artifact Persistence)

```
COMPLETED — Both DemandModel and RiskModel now have save()/load() methods using joblib.
Artifacts persist to forecasting/artifacts/ as .pkl files.
run_forecast.py loads artifacts in production, trains if enough data, saves if ML succeeded.
Risk model training gate added (was previously skipped).
Temporal train/val split replaces random split for demand model.
config.py defines ARTIFACTS_DIR.

Files modified:
  - forecasting/config.py (ARTIFACTS_DIR)
  - forecasting/models/demand_model.py (save, load, temporal split)
  - forecasting/models/risk_model.py (save, load, scaler bundled)
  - forecasting/run_forecast.py (load artifacts, risk training gate, save after train)
  - forecasting/requirements.txt (joblib>=1.3)
  - forecasting/artifacts/.gitkeep (new)

Remaining Phase D work:
  - Champion-challenger retrain (Prompt D-5)
```

### Prompt D-5: Champion-Challenger & Monitoring Pipeline

```
We have artifact persistence (save/load .pkl) for DemandModel and RiskModel.
Now create:

1. `forecasting/monitoring.py`:
   - Compare past 7 days of predictions vs actual stock_movements consumption
   - Calculate MAPE, MAE, RMSE per model
   - Flag if MAPE > 30%
   - Write metrics to forecast_model_metrics table

2. `forecasting/retrain.py`:
   - Pull last 90 days of actuals
   - Train both models on full dataset (temporal split)
   - Evaluate new model vs loaded artifact on holdout
   - Only overwrite artifact if new model wins (champion-challenger)
   - Log comparison results

3. `backend/database/migrations/create_forecast_model_metrics_table.php`:
   - model_name, metric_name, value, evaluated_at, training_rows, mode

4. `backend/app/Console/Commands/RetrainForecasts.php`:
   - Artisan command `forecasts:retrain`
   - Shells out to `python -m forecasting.retrain`
   - Register weekly in routes/console.php (Sundays at 02:00)

5. Update MonitorForecasts.php triggerRetraining() to call `forecasts:retrain` instead of `forecasts:run`
```

---

## 🔶 PHASE E — ML Microservice API

### ✅ Prompt E-1: FastAPI Prediction Microservice

```
COMPLETED — Standalone FastAPI microservice exposing ML artifacts as a REST API.
Loads DemandModel and RiskModel artifacts once at startup (singleton pattern).
Versioned endpoints under /api/v1/ with health check and model info.
CORS enabled for frontend communication.

Files created:
  - forecasting/api.py (FastAPI app, startup loader, /predict, /health, /models)
  - forecasting/schemas.py (Pydantic request/response models)
  - forecasting/requirements.txt (added fastapi, uvicorn, pydantic)

Endpoints:
  - POST /api/v1/predict      — batch demand + risk predictions
  - GET  /api/v1/health       — liveness/readiness probe
  - GET  /api/v1/models       — artifact metadata (mode, metrics, feature cols)
  - POST /api/v1/models/reload — hot-reload artifacts without restart

Run: uvicorn forecasting.api:app --host 0.0.0.0 --port 8001
```

### Prompt E-2: Dockerize ML Microservice

```
Create a Dockerfile and docker-compose service for the forecasting API:

1. `forecasting/Dockerfile`:
   - Python 3.11-slim base
   - Install requirements.txt
   - Copy forecasting/ package and artifacts/
   - CMD: uvicorn forecasting.api:app --host 0.0.0.0 --port 8001
   - Health check: curl http://localhost:8001/api/v1/health

2. Update `docker-compose.yml` to add a `forecast-api` service:
   - Build from forecasting/Dockerfile
   - Port 8001:8001
   - Volume mount forecasting/artifacts/ so retrained models are picked up
   - Depends on: postgres
   - Environment: FORECAST_DATABASE_URL from .env

3. Update Laravel RunForecasts.php to optionally call the microservice
   instead of shelling out to Python directly (feature flag).
```

### Prompt E-3: Connect React Frontend to ML Microservice

```
Update src/services/forecastService.js to add a direct ML prediction method:

1. Add ML_API_BASE_URL config (default: http://localhost:8001/api/v1)
2. Add predictDemand(features) method — POST to /predict
3. Add getModelHealth() method — GET /health
4. Add getModelInfo() method — GET /models
5. Update ModelStatusBadge.jsx to show live model status from microservice
6. Add a "Run Prediction" button to LogisDash that sends current filters
   to the microservice and overlays real-time results on the chart
```

---

## 🟢 QUICK REFERENCE — What Exists So Far

### Files created in Phase A+B:

- `backend/database/migrations/2026_02_06_000001_create_forecast_demand_hourly_table.php`
- `backend/database/migrations/2026_02_06_000002_create_forecast_risk_hourly_table.php`
- `backend/app/Models/ForecastDemand.php` (scopes: latestRun, forHospital, forResource, nextHours)
- `backend/app/Models/ForecastRisk.php` (scopes: highRisk, atRiskWithin, levelFromProbability)
- `backend/app/Http/Controllers/Api/ForecastController.php` (4 endpoints)
- `backend/routes/api.php` — updated with forecast routes under `role:admin,logistics`
- `src/services/forecastService.js` — React service with 5 methods + 3 utility helpers
- `forecasting/config.py` — reads DB creds from backend/.env
- `forecasting/etl/extract.py` — 7 SQL extract functions
- `forecasting/etl/weather.py` — Open-Meteo client
- `forecasting/etl/features.py` — 20-feature matrix builder
- `forecasting/models/demand_model.py` — LightGBM with rule-based fallback + artifact save/load
- `forecasting/models/risk_model.py` — Logistic regression with heuristic fallback + artifact save/load
- `forecasting/demo_data.py` — 5 hospitals × 8 resources synthetic generator
- `forecasting/writer.py` — PostgreSQL writer for both forecast tables
- `forecasting/run_forecast.py` — CLI: --demo (CSV) or --production (DB), artifact lifecycle
- `forecasting/artifacts/.gitkeep` — artifact storage directory
- `forecasting/README.md` — full documentation

### Files created in Phase C:

- `src/components/logistics/ForecastSummaryCard.jsx`
- `src/components/logistics/DemandForecastChart.jsx`
- `src/components/logistics/RiskHeatmap.jsx`
- `src/components/logistics/ForecastNarrative.jsx`
- `src/components/logistics/AutoReorderMonitor.jsx`
- `src/components/logistics/demoForecastData.js`

### Files created in Phase D:

- `backend/app/Console/Commands/RunForecasts.php`
- `backend/app/Console/Commands/MonitorForecasts.php`
- `backend/app/Console/Commands/PruneForecasts.php`
- `backend/app/Services/AutoReorderService.php`
- `backend/app/Services/ForecastNarrativeService.php`
- `backend/routes/console.php` — scheduler for forecasts:run, forecasts:monitor, forecasts:prune

### Files created in Phase E:

- `forecasting/api.py` — FastAPI microservice (predict, health, models, reload endpoints)
- `forecasting/schemas.py` — Pydantic request/response models

### Models filled from empty stubs:

- BufferStock, BufferWithdrawal, DeliveryPerformance, KpiSnapshot, Supplier, SupplyOrder
