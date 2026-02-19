# Kalinga AI Forecasting — Continuation Prompts

Use these prompts to resume work if context is lost. Feed them one at a time.

---

## 🔵 PHASE C — Dashboard Integration (React Frontend)

### Prompt C-1: Forecast Summary Widget for LogisDash

```
We are building the Kalinga medical logistics system. We already have:

1. Python forecasting pipeline in `forecasting/` that generates demand and risk predictions
2. Laravel ForecastController at `backend/app/Http/Controllers/Api/ForecastController.php` with 4 endpoints:
   - GET /api/forecasts/demand
   - GET /api/forecasts/risk
   - GET /api/forecasts/summary  (returns high_risk_items, demand_by_resource, risk_distribution)
   - GET /api/forecasts/hospital/{id}
3. React frontend service at `src/services/forecastService.js` with methods: getDemandForecasts, getRiskForecasts, getSummary, getHospitalDetail, getHighRiskItems

Now please integrate forecast data into `src/pages-logistics/LogisDash.jsx`. This page currently uses MOCK_DATA (hardcoded). Please:

1. Add a new "AI Forecast" tab/section at the top of the dashboard
2. Create a ForecastSummaryCard component that calls forecastService.getSummary() and shows:
   - Risk distribution donut chart (low/medium/high/critical) using Recharts PieChart
   - Top 5 high-risk items with hospital name, resource name, risk_prob, days_until_stockout
   - "Last updated" timestamp from generated_at
3. Style with existing Tailwind classes (dark mode compatible: bg-[#1a1a2e], text-gray-200)
4. Add loading skeleton and error state
5. Use the existing Recharts library already imported in LogisDash

The component should be in `src/components/logistics/ForecastSummaryCard.jsx`.
```

### Prompt C-2: Demand Forecast Chart

```
Continue building the Kalinga forecast dashboard. We have forecastService.js and ForecastController.php already built.

Create a `src/components/logistics/DemandForecastChart.jsx` component that:

1. Accepts props: { hospitalId, resourceId } (optional filters)
2. Calls forecastService.getDemandForecasts({ hospital_id, resource_id, hours: 48 })
3. Renders a Recharts AreaChart showing:
   - X-axis: forecast_time (formatted as "Mon 2pm", "Tue 8am" etc.)
   - Y-axis: predicted demand (units)
   - Three areas: yhat_upper (light fill), yhat (main line), yhat_lower (light fill) — confidence band
4. Add hospital and resource selector dropdowns at the top
5. The existing resources can be fetched from resourceService.getAll()
6. Use Tailwind dark mode styling consistent with LogisDash.jsx

Also add this chart to the LogisDash page in a new "Demand Forecast" section below the existing charts.
```

### Prompt C-3: Risk Heatmap & Alerts

```
Continue building the Kalinga forecast dashboard. We have forecastService.js and ForecastController.php already built.

Create `src/components/logistics/RiskHeatmap.jsx` that:

1. Calls forecastService.getRiskForecasts({ hours: 48 })
2. Renders a grid/heatmap: rows = hospitals, columns = resources
3. Each cell is color-coded by risk_level (green/yellow/orange/red)
4. Clicking a cell shows a tooltip with: risk_prob, projected_stock, days_until_stockout, risk_factors
5. Above the heatmap, show alert banners for any critical-risk items: "⚠️ {resource} at {hospital} — stockout in {days} days"

Also create `src/components/logistics/ReorderAlerts.jsx`:
1. Calls forecastService.getHighRiskItems()
2. Shows a scrollable list of items that need reordering
3. Each item shows: hospital, resource, current stock, days_until_stockout, recommended reorder quantity
4. "Create Request" button that pre-fills the request form

Integrate both into LogisDash.jsx.
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

### Prompt D-1: Laravel Scheduler (Cron Job)

```
We have the Kalinga Python forecasting pipeline at `forecasting/run_forecast.py` (run with `python -m forecasting.run_forecast --production`). It writes predictions to forecast_demand_hourly and forecast_risk_hourly tables.

Now create a Laravel scheduled command to:

1. Create `backend/app/Console/Commands/RunForecasts.php` — an Artisan command `forecasts:run`
2. It should shell out to run: `python -m forecasting.run_forecast --production --horizon 48`
3. Log output to `storage/logs/forecasts.log`
4. Handle failures gracefully (retry once after 5 min, then alert)
5. Register in `backend/app/Console/Kernel.php` (or routes/console.php) to run every 2 hours: `$schedule->command('forecasts:run')->everyTwoHours()`

Also create `backend/app/Console/Commands/GenerateKpiSnapshot.php`:
1. Runs daily at 6am
2. Queries forecast tables + resource tables
3. Generates a KpiSnapshot record for the DOH Secretary briefing
4. Calculates: total_items_at_risk, avg_fulfillment_rate, worst_hospital, best_hospital
```

### Prompt D-2: Auto-Reorder Trigger

```
We have the Kalinga forecast system writing risk predictions to forecast_risk_hourly table with fields: hospital_id, resource_id, risk_prob, projected_stock, days_until_stockout, risk_level.

Create `backend/app/Services/AutoReorderService.php` that:

1. Runs after each forecast cycle (called from RunForecasts command)
2. Queries forecast_risk_hourly for items where risk_level = 'critical' or days_until_stockout < 3
3. For each at-risk item, checks if a pending Request already exists (avoid duplicates)
4. If no pending request: auto-creates a Request with:
   - status: 'pending'
   - priority: 'critical' (if risk_level=critical) or 'high'
   - quantity_requested: calculated from (target_survival_hours - current_survival_hours) × daily_usage
   - notes: "Auto-generated by AI forecast. Risk: {risk_prob}%, stockout in {days}d"
5. Optionally triggers VendorAgreement lookup for preferred supplier
6. Fires a Laravel Event (RequestAutoCreated) so Notifications can alert logistics staff

Also update the ForecastController to add a GET /api/forecasts/auto-reorders endpoint showing recent auto-generated requests.
```

### Prompt D-3: Gemini Narrative Generation

```
We have the Kalinga system with GeminiContextService at `backend/app/Services/GeminiContextService.php` already configured with API key and gemini-2.0-flash-lite model. We also have forecast data in forecast_demand_hourly and forecast_risk_hourly tables.

Create `backend/app/Services/ForecastNarrativeService.php` that:

1. Queries the latest forecast summary (top risk items, demand trends, risk distribution)
2. Sends a structured prompt to Gemini asking it to generate:
   - A 3-sentence executive summary for the DOH Secretary
   - Specific action recommendations (which hospitals need attention, which items to reorder)
   - Weather impact assessment (if precipitation is high)
3. Caches the narrative for 2 hours (avoid excessive API calls)
4. Returns structured JSON: { executive_summary, recommendations[], weather_impact, generated_at }

Add a GET /api/forecasts/narrative endpoint to ForecastController.
On the frontend, create `src/components/logistics/AINarrativeCard.jsx` that displays this narrative in a styled card with a "Refresh" button, and integrate it into LogisDash.jsx.
```

### Prompt D-4: Model Retraining & Monitoring

```
We have the Kalinga Python forecasting pipeline with DemandModel (LightGBM) and RiskModel (Logistic Regression) in `forecasting/models/`. Currently they fall back to rule-based mode when training data is thin.

Create a model monitoring and retraining system:

1. `forecasting/monitoring.py`:
   - Compare past predictions vs actual consumption (from stock_movements table)
   - Calculate MAPE, MAE, RMSE for the last 7 days
   - Flag if error exceeds threshold (MAPE > 30%)
   - Output metrics to `forecast_model_metrics` table (create migration)

2. `forecasting/retrain.py`:
   - Pull last 90 days of actual data
   - Retrain both models
   - Save model artifacts to `forecasting/artifacts/` (.pkl files)
   - Compare new model vs old model on holdout set
   - Only deploy if new model is better (champion-challenger pattern)

3. Update `run_forecast.py` to:
   - Load trained model from artifacts/ if available
   - Fall back to rule-based if no artifact exists
   - Add --retrain flag to trigger retraining

4. Laravel command `forecasts:retrain` that runs weekly via scheduler
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
- `forecasting/models/demand_model.py` — LightGBM with rule-based fallback
- `forecasting/models/risk_model.py` — Logistic regression with heuristic fallback
- `forecasting/demo_data.py` — 5 hospitals × 8 resources synthetic generator
- `forecasting/writer.py` — PostgreSQL writer for both forecast tables
- `forecasting/run_forecast.py` — CLI: --demo (CSV) or --production (DB)
- `forecasting/README.md` — full documentation

### Models filled from empty stubs:

- BufferStock, BufferWithdrawal, DeliveryPerformance, KpiSnapshot, Supplier, SupplyOrder
