"""
Kalinga Forecasting — Pydantic schemas.

Defines request/response contracts for the FastAPI microservice.
These schemas enforce type safety at the API boundary and auto-generate
OpenAPI documentation.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════
# Request schemas
# ═══════════════════════════════════════════════════════════════

class FeatureRow(BaseModel):
    """
    A single row of the feature matrix.

    Matches the 20-column output of ``build_demand_features()``.
    All numeric fields are optional so the API gracefully handles
    partial data — missing columns are filled with 0 during prediction.
    """

    hospital_id: int = Field(..., description="Hospital FK")
    resource_id: int = Field(..., description="Resource FK")
    forecast_time: str = Field(
        ..., description="ISO-8601 timestamp for the hour being predicted"
    )

    # Time encodings
    hour_sin: float = 0.0
    hour_cos: float = 1.0
    dow_sin: float = 0.0
    dow_cos: float = 1.0
    is_weekend: int = 0
    month: int = 1

    # Consumption history
    avg_hourly_consumption: float = 0.0
    avg_hourly_requests: float = 0.0

    # Inventory state
    current_quantity: float = 0.0
    minimum_stock: float = 0.0
    stock_ratio: float = 1.0
    normal_daily_usage: float = 0.0
    surge_multiplier: float = 1.0
    current_survival_hours: float = 168.0
    is_critical: int = 0

    # External signals
    active_incidents: int = 0
    active_blockades: int = 0
    temperature_2m: float = 30.0
    precipitation_mm: float = 0.0
    wind_speed_kph: float = 10.0

    # Horizon
    horizon_h: int = 1

    class Config:
        json_schema_extra = {
            "example": {
                "hospital_id": 1,
                "resource_id": 3,
                "forecast_time": "2026-02-07T08:00:00+08:00",
                "hour_sin": 0.866,
                "hour_cos": 0.5,
                "avg_hourly_consumption": 4.2,
                "current_quantity": 120,
                "stock_ratio": 2.4,
                "active_incidents": 1,
                "precipitation_mm": 12.5,
                "horizon_h": 6,
            }
        }


class PredictRequest(BaseModel):
    """
    Batch prediction request.

    Accepts a list of feature rows (typically one per
    hospital × resource × hour).  Mirrors the DataFrame that
    ``run_forecast.py`` builds internally.
    """

    features: list[FeatureRow] = Field(
        ..., min_length=1, max_length=50_000,
        description="List of feature rows to predict",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "features": [
                    {
                        "hospital_id": 1,
                        "resource_id": 3,
                        "forecast_time": "2026-02-07T08:00:00+08:00",
                        "avg_hourly_consumption": 4.2,
                        "current_quantity": 120,
                        "stock_ratio": 2.4,
                        "horizon_h": 6,
                    }
                ]
            }
        }


# ═══════════════════════════════════════════════════════════════
# Response schemas
# ═══════════════════════════════════════════════════════════════

class DemandPrediction(BaseModel):
    hospital_id: int
    resource_id: int
    forecast_time: str
    horizon_h: int
    yhat: float
    yhat_lower: float
    yhat_upper: float


class RiskPrediction(BaseModel):
    hospital_id: int
    resource_id: int
    forecast_time: str
    horizon_h: int
    risk_prob: float
    risk_level: str
    projected_stock: float
    days_until_stockout: float


class PredictResponse(BaseModel):
    success: bool = True
    model_versions: dict = Field(
        default_factory=dict,
        description="Which mode each model is running in",
    )
    demand: list[DemandPrediction]
    risk: list[RiskPrediction]
    row_count: int
    elapsed_ms: float


class ModelInfo(BaseModel):
    name: str
    mode: str
    artifact_exists: bool
    metrics: dict = Field(default_factory=dict)
    feature_cols: list[str] = Field(default_factory=list)


class ModelsResponse(BaseModel):
    demand: ModelInfo
    risk: ModelInfo
    artifacts_dir: str


class HealthResponse(BaseModel):
    status: str = "healthy"
    models_loaded: bool = False
    demand_mode: str = "not_loaded"
    risk_mode: str = "not_loaded"
    uptime_seconds: float = 0.0
    timestamp: str = ""


# ═══════════════════════════════════════════════════════════════
# Pipeline trigger schemas (called by Laravel on Render)
# ═══════════════════════════════════════════════════════════════

class RunPipelineRequest(BaseModel):
    """Request body for POST /api/v1/run-pipeline."""
    mode: str = Field("production", description="Run mode: production or demo")
    horizon: int = Field(48, ge=1, le=168, description="Forecast horizon in hours")


class RunPipelineResponse(BaseModel):
    """Response from the pipeline run."""
    success: bool = True
    mode: str = "production"
    demand_rows: int = 0
    risk_rows: int = 0
    high_risk_count: int = 0
    model_version: str = ""
    elapsed_s: float = 0.0
    error: str | None = None
