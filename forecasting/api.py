"""
Kalinga AI Forecasting — FastAPI Microservice

Standalone REST API that serves predictions from trained ML artifacts.
Designed to run alongside (not inside) the Laravel backend.

Usage:
    uvicorn forecasting.api:app --host 0.0.0.0 --port 8001 --reload

Endpoints:
    POST /api/v1/predict        — Batch demand + risk predictions
    GET  /api/v1/health         — Liveness / readiness probe
    GET  /api/v1/models         — Artifact metadata
    POST /api/v1/models/reload  — Hot-reload artifacts without restart
"""

import os
import sys
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from forecasting.config import ARTIFACTS_DIR, MODEL_VERSION
from forecasting.etl.features import DEMAND_FEATURE_COLS, RISK_FEATURE_COLS
from forecasting.models.demand_model import DemandModel
from forecasting.models.risk_model import RiskModel
from forecasting.schemas import (
    DemandPrediction,
    HealthResponse,
    ModelInfo,
    ModelsResponse,
    PredictRequest,
    PredictResponse,
    RiskPrediction,
    RunPipelineRequest,
    RunPipelineResponse,
)


# ═══════════════════════════════════════════════════════════════
# Singleton model registry — loaded once at startup
# ═══════════════════════════════════════════════════════════════

class _ModelRegistry:
    """
    Holds loaded model instances for the lifetime of the process.

    This avoids deserializing .pkl files on every request (the #1
    performance mistake in ML microservices).
    """

    def __init__(self):
        self.demand_model: DemandModel | None = None
        self.risk_model: RiskModel | None = None
        self.loaded: bool = False
        self.started_at: float = time.time()

    def load(self):
        """Load artifacts from disk. Safe to call multiple times."""
        print(f"[api] Loading model artifacts from {ARTIFACTS_DIR} ...")

        self.demand_model = DemandModel.load()
        self.risk_model = RiskModel.load()
        self.loaded = True

        print(
            f"[api] Models ready — "
            f"demand: {self.demand_model.mode}, "
            f"risk: {self.risk_model.mode}"
        )

    def reload(self):
        """Hot-reload artifacts without restarting the process."""
        print("[api] Reloading model artifacts ...")
        self.load()


registry = _ModelRegistry()


# ═══════════════════════════════════════════════════════════════
# Application lifecycle
# ═══════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models at startup, cleanup on shutdown."""
    registry.load()
    yield
    print("[api] Shutting down forecasting API")


app = FastAPI(
    title="Kalinga Forecasting API",
    description=(
        "ML microservice for demand forecasting and inventory risk scoring. "
        "Serves predictions from trained LightGBM / Logistic Regression artifacts."
    ),
    version=MODEL_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS — allow the React frontend and Laravel backend ──────
_cors_origins_raw = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:8000",
)
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)


# ═══════════════════════════════════════════════════════════════
# Routes
# ═══════════════════════════════════════════════════════════════

# ── Health check ─────────────────────────────────────────────

@app.get(
    "/api/v1/health",
    response_model=HealthResponse,
    tags=["operations"],
    summary="Liveness & readiness probe",
)
async def health():
    """
    Returns the operational status of the microservice.

    Use this for Kubernetes readiness probes or uptime monitoring.
    A ``models_loaded: false`` response means the service is alive
    but cannot serve predictions yet.
    """
    return HealthResponse(
        status="healthy" if registry.loaded else "starting",
        models_loaded=registry.loaded,
        demand_mode=registry.demand_model.mode if registry.demand_model else "not_loaded",
        risk_mode=registry.risk_model.mode if registry.risk_model else "not_loaded",
        uptime_seconds=round(time.time() - registry.started_at, 2),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


# ── Model info ───────────────────────────────────────────────

@app.get(
    "/api/v1/models",
    response_model=ModelsResponse,
    tags=["operations"],
    summary="Artifact metadata for both models",
)
async def models():
    """
    Returns metadata about the currently loaded ML artifacts,
    including mode (lightgbm / logistic / rule_based), evaluation
    metrics from training, and the feature columns each model expects.
    """
    demand_artifact = ARTIFACTS_DIR / DemandModel.ARTIFACT_NAME
    risk_artifact = ARTIFACTS_DIR / RiskModel.ARTIFACT_NAME

    return ModelsResponse(
        demand=ModelInfo(
            name="DemandModel (LightGBM)",
            mode=registry.demand_model.mode if registry.demand_model else "not_loaded",
            artifact_exists=demand_artifact.exists(),
            metrics=registry.demand_model.metrics if registry.demand_model else {},
            feature_cols=list(DEMAND_FEATURE_COLS),
        ),
        risk=ModelInfo(
            name="RiskModel (Logistic Regression)",
            mode=registry.risk_model.mode if registry.risk_model else "not_loaded",
            artifact_exists=risk_artifact.exists(),
            metrics=registry.risk_model.metrics if registry.risk_model else {},
            feature_cols=list(RISK_FEATURE_COLS),
        ),
        artifacts_dir=str(ARTIFACTS_DIR),
    )


# ── Hot-reload artifacts ─────────────────────────────────────

@app.post(
    "/api/v1/models/reload",
    tags=["operations"],
    summary="Hot-reload model artifacts from disk",
)
async def reload_models():
    """
    Re-reads .pkl artifacts from ``forecasting/artifacts/`` without
    restarting the process. Call this after ``run_forecast.py --production``
    saves new artifacts.
    """
    try:
        registry.reload()
        return {
            "success": True,
            "demand_mode": registry.demand_model.mode,
            "risk_mode": registry.risk_model.mode,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reload failed: {e}")


# ── Predict ──────────────────────────────────────────────────

@app.post(
    "/api/v1/run-pipeline",
    response_model=RunPipelineResponse,
    tags=["pipeline"],
    summary="Trigger full ETL → predict → DB-write cycle",
)
async def run_pipeline(request: RunPipelineRequest):
    """
    Runs the complete forecasting pipeline:
      1. Reads hospitals/resources/stock from PostgreSQL
      2. Builds the feature matrix
      3. Predicts demand + risk using loaded models
      4. Writes results back to forecast_demand_hourly / forecast_risk_hourly

    This endpoint is called by Laravel's ``forecasts:run`` command when
    running on Render (separate services, no subprocess available).
    """
    import subprocess as _sp

    t0 = time.perf_counter()

    # Build the CLI command that run_forecast.py expects
    cmd = [
        sys.executable, "-m", "forecasting.run_forecast",
        f"--{request.mode}",
        "--horizon", str(request.horizon),
    ]

    try:
        result = _sp.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=280,                     # stay under the 300 s HTTP timeout
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        )

        elapsed = round(time.perf_counter() - t0, 2)

        if result.returncode != 0:
            print(f"[api] run-pipeline FAILED (exit {result.returncode})")
            print(result.stderr[-2000:] if result.stderr else "(no stderr)")
            return RunPipelineResponse(
                success=False,
                mode=request.mode,
                elapsed_s=elapsed,
                error=result.stderr[-1000:] if result.stderr else "Non-zero exit code",
            )

        # Parse stdout for row counts (run_forecast.py prints them)
        stdout = result.stdout or ""
        demand_rows = _parse_count(stdout, "demand")
        risk_rows = _parse_count(stdout, "risk")
        high_risk = _parse_count(stdout, "high")

        print(f"[api] run-pipeline OK — demand={demand_rows}, risk={risk_rows}, elapsed={elapsed}s")

        return RunPipelineResponse(
            success=True,
            mode=request.mode,
            demand_rows=demand_rows,
            risk_rows=risk_rows,
            high_risk_count=high_risk,
            model_version=MODEL_VERSION,
            elapsed_s=elapsed,
        )

    except _sp.TimeoutExpired:
        return RunPipelineResponse(
            success=False,
            mode=request.mode,
            elapsed_s=round(time.perf_counter() - t0, 2),
            error="Pipeline timed out (280 s limit)",
        )
    except Exception as e:
        return RunPipelineResponse(
            success=False,
            mode=request.mode,
            elapsed_s=round(time.perf_counter() - t0, 2),
            error=str(e),
        )


def _parse_count(stdout: str, keyword: str) -> int:
    """
    Extract a number from lines like:
        [writer] Wrote 2160 demand forecasts to DB
        High/Critical Risks: 268
    """
    import re
    for line in stdout.splitlines():
        lower = line.lower()
        if keyword in lower:
            nums = re.findall(r"[\d,]+", line)
            for n in nums:
                val = int(n.replace(",", ""))
                if val > 0:
                    return val
    return 0


@app.post(
    "/api/v1/predict",
    response_model=PredictResponse,
    tags=["prediction"],
    summary="Batch demand + risk predictions",
)
async def predict(request: PredictRequest):
    """
    Accepts a batch of feature rows and returns demand forecasts
    plus risk scores for every row.

    The feature schema mirrors the 20-column matrix produced by
    ``build_demand_features()``. Missing optional fields default to
    safe values (0 for numeric, 1.0 for multipliers).

    **Performance note:** Models are loaded once at startup. A
    typical 1,000-row batch completes in < 200 ms.
    """
    if not registry.loaded:
        raise HTTPException(
            status_code=503,
            detail="Models are still loading. Retry in a few seconds.",
        )

    t0 = time.perf_counter()

    # ── Convert Pydantic rows → DataFrame ────────────────────
    rows = [row.model_dump() for row in request.features]
    features = pd.DataFrame(rows)

    # Ensure forecast_time is parsed (models don't use it, but output needs it)
    if "forecast_time" in features.columns:
        features["forecast_time"] = pd.to_datetime(
            features["forecast_time"], utc=True, errors="coerce"
        )

    # Fill any remaining NaN with 0 (defensive)
    numeric_cols = features.select_dtypes(include=[np.number]).columns
    features[numeric_cols] = features[numeric_cols].fillna(0)

    # ── Run demand model ─────────────────────────────────────
    try:
        demand_results = registry.demand_model.predict(features)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Demand prediction failed: {e}",
        )

    # ── Run risk model ───────────────────────────────────────
    try:
        demand_yhat = demand_results["yhat"]
        risk_results = registry.risk_model.predict(features, demand_yhat)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Risk prediction failed: {e}",
        )

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

    # ── Serialize results ────────────────────────────────────
    demand_out = []
    for _, row in demand_results.iterrows():
        demand_out.append(DemandPrediction(
            hospital_id=int(row["hospital_id"]),
            resource_id=int(row["resource_id"]),
            forecast_time=str(row.get("forecast_time", "")),
            horizon_h=int(row.get("horizon_h", 1)),
            yhat=round(float(row["yhat"]), 4),
            yhat_lower=round(float(row.get("yhat_lower", row["yhat"] * 0.7)), 4),
            yhat_upper=round(float(row.get("yhat_upper", row["yhat"] * 1.4)), 4),
        ))

    risk_out = []
    for _, row in risk_results.iterrows():
        risk_out.append(RiskPrediction(
            hospital_id=int(row["hospital_id"]),
            resource_id=int(row["resource_id"]),
            forecast_time=str(row.get("forecast_time", "")),
            horizon_h=int(row.get("horizon_h", 1)),
            risk_prob=round(float(row.get("risk_prob", 0)), 4),
            risk_level=str(row.get("risk_level", "low")),
            projected_stock=round(float(row.get("projected_stock", 0)), 4),
            days_until_stockout=round(float(row.get("days_until_stockout", 999)), 2),
        ))

    return PredictResponse(
        success=True,
        model_versions={
            "demand": registry.demand_model.mode,
            "risk": registry.risk_model.mode,
            "pipeline": MODEL_VERSION,
        },
        demand=demand_out,
        risk=risk_out,
        row_count=len(demand_out),
        elapsed_ms=elapsed_ms,
    )


# ═══════════════════════════════════════════════════════════════
# Entrypoint
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "forecasting.api:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info",
    )
