#!/usr/bin/env python3
"""
Kalinga AI Forecasting — CLI Runner

Usage:
  python -m forecasting.run_forecast --demo           # synthetic data, CSV output
  python -m forecasting.run_forecast --production      # read DB, write forecasts back
  python -m forecasting.run_forecast --demo --horizon 24

Modes:
  --demo        Use synthetic data (no DB needed). Outputs CSV files to ./output/
  --production  Read from Kalinga PostgreSQL, write forecast tables back

Options:
  --horizon N   Forecast horizon in hours (default: 48)
  --seed N      Random seed for demo data (default: 42)
  --output DIR  Output directory for CSV files in demo mode (default: ./output)
"""

import os
import sys
import json
import time
import click
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Ensure the project root is on sys.path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from forecasting.config import FORECAST_HORIZON_HOURS, MODEL_VERSION
from forecasting.etl.features import build_demand_features, DEMAND_FEATURE_COLS
from forecasting.etl.weather import fetch_weather_forecast
from forecasting.models.demand_model import DemandModel
from forecasting.models.risk_model import RiskModel
from forecasting.demo_data import generate_all


@click.command()
@click.option("--demo", is_flag=True, default=False, help="Run with synthetic data (no DB)")
@click.option("--production", is_flag=True, default=False, help="Read/write from Kalinga DB")
@click.option("--horizon", default=None, type=int, help=f"Forecast hours (default: {FORECAST_HORIZON_HOURS})")
@click.option("--seed", default=42, type=int, help="Random seed for demo data")
@click.option("--output", default="./output", type=str, help="Output directory for CSV (demo mode)")
def main(demo, production, horizon, seed, output):
    """Kalinga AI Demand & Risk Forecasting Pipeline."""
    if not demo and not production:
        click.echo("Please specify --demo or --production mode.")
        click.echo("Run with --help for usage.")
        return

    horizon = horizon or FORECAST_HORIZON_HOURS
    start_time = time.time()

    click.echo("=" * 60)
    click.echo(f"  Kalinga Forecasting Pipeline v{MODEL_VERSION}")
    click.echo(f"  Mode: {'DEMO (synthetic data)' if demo else 'PRODUCTION (live DB)'}")
    click.echo(f"  Horizon: {horizon}h")
    click.echo(f"  Started: {datetime.utcnow().isoformat()}")
    click.echo("=" * 60)

    # ── Step 1: Extract data ─────────────────────────────────
    click.echo("\n[1/5] Extracting data...")
    if demo:
        data = generate_all(days_back=180, seed=seed)
        click.echo(f"  Generated synthetic data:")
        for k, v in data.items():
            click.echo(f"    {k}: {len(v)} rows")
    else:
        from forecasting.etl.extract import extract_all
        data = extract_all()
        click.echo(f"  Extracted from database:")
        for k, v in data.items():
            click.echo(f"    {k}: {len(v)} rows")

    # ── Step 2: Fetch weather ────────────────────────────────
    click.echo("\n[2/5] Fetching weather forecasts...")
    try:
        # Use Manila center coordinates
        weather = fetch_weather_forecast(14.5995, 120.9842, horizon)
        click.echo(f"  Weather data: {len(weather)} hourly points")
    except Exception as e:
        click.echo(f"  ⚠ Weather fetch failed ({e}), using defaults")
        weather = pd.DataFrame()

    # ── Step 3: Build feature matrix ─────────────────────────
    click.echo("\n[3/5] Building feature matrix...")
    features = build_demand_features(
        resources=data["resources"],
        stock_movements=data["stock_movements"],
        requests_df=data["requests"],
        incidents=data["incidents"],
        blockades=data["blockades"],
        weather=weather,
        resilience_configs=data["resilience_configs"],
        horizon_hours=horizon,
    )
    click.echo(f"  Feature matrix: {features.shape[0]} rows × {features.shape[1]} cols")

    # ── Step 4: Run demand model ─────────────────────────────
    click.echo("\n[4/5] Running demand model...")

    # Load existing artifact in production (falls back to rule-based if none)
    demand_model = DemandModel.load() if production else DemandModel()

    # In production, attempt to train on historical actual consumption
    if production and "actual_consumption" in features.columns:
        train_mask = features["actual_consumption"].notna()
        n_train = train_mask.sum()
        if n_train >= 50:   # need a meaningful training set
            click.echo(f"  Training LightGBM on {n_train} historical rows...")
            demand_model.train(
                features.loc[train_mask],
                features.loc[train_mask, "actual_consumption"],
            )
            # Persist artifact if ML training succeeded
            if demand_model.mode != "rule_based":
                demand_model.save()
        else:
            click.echo(f"  Only {n_train} labelled rows — need ≥50 for LightGBM, using {demand_model.mode}")
    else:
        click.echo(f"  Using {demand_model.mode} demand model (no training data yet)")

    demand_results = demand_model.predict(features)
    click.echo(f"  Demand predictions: {len(demand_results)} rows")
    click.echo(f"  Mean predicted demand: {demand_results['yhat'].mean():.2f}")
    click.echo(f"  Max predicted demand:  {demand_results['yhat'].max():.2f}")

    # ── Step 5: Run risk model ───────────────────────────────
    click.echo("\n[5/5] Running risk model...")

    # Load existing artifact in production (falls back to rule-based if none)
    risk_model = RiskModel.load() if production else RiskModel()

    # In production, attempt to train on historical stockout labels
    if production and "stockout_occurred" in features.columns:
        risk_labels = features["stockout_occurred"]
        labelled = risk_labels.notna()
        n_labelled = int(labelled.sum())
        if n_labelled >= risk_model.MIN_TRAINING_ROWS:
            click.echo(f"  Training Logistic Regression on {n_labelled} labelled rows...")
            risk_model.train(features.loc[labelled], risk_labels.loc[labelled])
            # Persist artifact if ML training succeeded
            if risk_model.mode != "rule_based":
                risk_model.save()
        else:
            click.echo(f"  Only {n_labelled} labelled rows — need ≥{risk_model.MIN_TRAINING_ROWS}, using {risk_model.mode}")
    else:
        click.echo(f"  Using {risk_model.mode} risk model (no stockout labels)")

    risk_results = risk_model.predict(features, demand_results["yhat"])
    click.echo(f"  Risk predictions: {len(risk_results)} rows")

    if "risk_level" in risk_results.columns:
        risk_dist = risk_results["risk_level"].value_counts()
        click.echo(f"  Risk distribution:")
        for level in ["low", "medium", "high", "critical"]:
            count = risk_dist.get(level, 0)
            click.echo(f"    {level}: {count}")

    # ── Output ───────────────────────────────────────────────
    click.echo("\n" + "─" * 60)

    # Prepare output DataFrames
    demand_output = demand_results[[
        "hospital_id", "resource_id", "forecast_time", "horizon_h",
        "yhat", "yhat_lower", "yhat_upper"
    ]].copy()
    demand_output["model_version"] = MODEL_VERSION
    demand_output["generated_at"] = datetime.utcnow()

    risk_cols = ["hospital_id", "resource_id", "forecast_time", "horizon_h",
                 "risk_prob", "projected_stock", "days_until_stockout", "risk_level"]
    available_risk_cols = [c for c in risk_cols if c in risk_results.columns]
    risk_output = risk_results[available_risk_cols].copy()
    risk_output["model_version"] = MODEL_VERSION
    risk_output["generated_at"] = datetime.utcnow()

    if demo:
        # Write CSV files
        os.makedirs(output, exist_ok=True)
        demand_path = os.path.join(output, "forecast_demand.csv")
        risk_path = os.path.join(output, "forecast_risk.csv")
        summary_path = os.path.join(output, "forecast_summary.json")

        demand_output.to_csv(demand_path, index=False)
        risk_output.to_csv(risk_path, index=False)

        # Summary JSON
        summary = {
            "generated_at": datetime.utcnow().isoformat(),
            "model_version": MODEL_VERSION,
            "mode": "demo",
            "horizon_hours": horizon,
            "total_predictions": len(demand_output),
            "hospitals_covered": int(demand_output["hospital_id"].nunique()),
            "resources_covered": int(demand_output["resource_id"].nunique()),
            "demand_stats": {
                "mean": round(float(demand_output["yhat"].mean()), 4),
                "max": round(float(demand_output["yhat"].max()), 4),
                "min": round(float(demand_output["yhat"].min()), 4),
            },
            "risk_distribution": {
                level: int(risk_dist.get(level, 0))
                for level in ["low", "medium", "high", "critical"]
            } if "risk_level" in risk_results.columns else {},
        }

        with open(summary_path, "w") as f:
            json.dump(summary, f, indent=2)

        click.echo(f"  📁 Output written to {output}/")
        click.echo(f"     {demand_path} ({len(demand_output)} rows)")
        click.echo(f"     {risk_path} ({len(risk_output)} rows)")
        click.echo(f"     {summary_path}")

    else:
        # Write to PostgreSQL
        from forecasting.writer import write_demand_forecasts, write_risk_forecasts
        n_demand = write_demand_forecasts(demand_output)
        n_risk = write_risk_forecasts(risk_output)
        click.echo(f"  📊 Written to database: {n_demand} demand + {n_risk} risk forecasts")

    elapsed = time.time() - start_time
    click.echo(f"\n✅ Pipeline complete in {elapsed:.1f}s")


if __name__ == "__main__":
    main()
