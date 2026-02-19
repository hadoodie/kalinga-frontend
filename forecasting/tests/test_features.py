"""
Unit tests for the Kalinga ETL feature engineering pipeline.

Tests build_hourly_consumption, build_hourly_requests, add_time_features,
and the main build_demand_features orchestrator.
"""

import numpy as np
import pandas as pd
import pytest

from forecasting.etl.features import (
    build_hourly_consumption,
    build_hourly_requests,
    add_time_features,
    build_demand_features,
    DEMAND_FEATURE_COLS,
)


# ────────────────────────────────────────────────────────────
# build_hourly_consumption
# ────────────────────────────────────────────────────────────

class TestBuildHourlyConsumption:

    def test_empty_input(self):
        result = build_hourly_consumption(pd.DataFrame())
        assert len(result) == 0
        assert "consumption" in result.columns

    def test_only_outflows_counted(self):
        """Inflows (type='in') should be excluded from consumption."""
        df = pd.DataFrame({
            "hospital_id": [1, 1, 1],
            "resource_id": [1, 1, 1],
            "quantity": [10, 20, 5],
            "type": ["out", "in", "out"],
            "created_at": pd.to_datetime([
                "2025-01-15 10:00", "2025-01-15 10:30", "2025-01-15 10:45",
            ]),
        })
        result = build_hourly_consumption(df)
        # Should aggregate only the two "out" rows in the 10:00 hour → 10+5 = 15
        assert len(result) == 1
        assert result["consumption"].iloc[0] == 15

    def test_multi_hospital_grouping(self):
        """Different hospital_ids should produce separate rows."""
        df = pd.DataFrame({
            "hospital_id": [1, 2],
            "resource_id": [1, 1],
            "quantity": [10, 20],
            "type": ["out", "out"],
            "created_at": pd.to_datetime(["2025-01-15 10:00", "2025-01-15 10:00"]),
        })
        result = build_hourly_consumption(df)
        assert len(result) == 2

    def test_movement_type_column_alias(self):
        """DB uses 'movement_type' instead of 'type' — should still work."""
        df = pd.DataFrame({
            "hospital_id": [1],
            "resource_id": [1],
            "quantity": [7],
            "movement_type": ["out"],
            "created_at": pd.to_datetime(["2025-01-15 10:00"]),
        })
        result = build_hourly_consumption(df)
        assert result["consumption"].iloc[0] == 7


# ────────────────────────────────────────────────────────────
# build_hourly_requests
# ────────────────────────────────────────────────────────────

class TestBuildHourlyRequests:

    def test_empty_input(self):
        result = build_hourly_requests(pd.DataFrame())
        assert len(result) == 0

    def test_aggregates_count_and_qty(self):
        df = pd.DataFrame({
            "hospital_id": [1, 1, 1],
            "resource_id": [1, 1, 1],
            "quantity_requested": [10, 20, 30],
            "created_at": pd.to_datetime([
                "2025-01-15 10:00", "2025-01-15 10:30", "2025-01-15 10:45",
            ]),
        })
        result = build_hourly_requests(df)
        assert result["request_count"].iloc[0] == 3
        assert result["request_qty"].iloc[0] == 60

    def test_quantity_column_alias(self):
        """Demo data uses 'quantity_requested', DB might use 'quantity'."""
        df = pd.DataFrame({
            "hospital_id": [1],
            "resource_id": [1],
            "quantity_requested": [25],
            "created_at": pd.to_datetime(["2025-01-15 10:00"]),
        })
        result = build_hourly_requests(df)
        assert result["request_qty"].iloc[0] == 25


# ────────────────────────────────────────────────────────────
# add_time_features
# ────────────────────────────────────────────────────────────

class TestAddTimeFeatures:

    def test_cyclical_columns_added(self):
        df = pd.DataFrame({
            "hour": pd.date_range("2025-01-15", periods=24, freq="h"),
        })
        result = add_time_features(df, "hour")
        for col in ("hour_sin", "hour_cos", "dow_sin", "dow_cos", "is_weekend", "month"):
            assert col in result.columns

    def test_sin_cos_range(self):
        """Sin/cos values must be in [-1, 1]."""
        df = pd.DataFrame({
            "hour": pd.date_range("2025-01-15", periods=168, freq="h"),
        })
        result = add_time_features(df, "hour")
        for col in ("hour_sin", "hour_cos", "dow_sin", "dow_cos"):
            assert result[col].min() >= -1.0
            assert result[col].max() <= 1.0

    def test_weekend_detection(self):
        """Saturday=5, Sunday=6 should be weekend."""
        df = pd.DataFrame({
            "hour": pd.to_datetime([
                "2025-01-13 12:00",  # Monday
                "2025-01-18 12:00",  # Saturday
                "2025-01-19 12:00",  # Sunday
            ]),
        })
        result = add_time_features(df, "hour")
        assert result["is_weekend"].tolist() == [0, 1, 1]


# ────────────────────────────────────────────────────────────
# build_demand_features (integration)
# ────────────────────────────────────────────────────────────

class TestBuildDemandFeatures:

    @pytest.fixture
    def minimal_data(self):
        """Minimal valid input data for build_demand_features."""
        now = pd.Timestamp.now()
        resources = pd.DataFrame({
            "hospital_id": [1, 1],
            "resource_id": [1, 2],
            "resource_name": ["Blood O-", "Saline IV"],
            "category": ["blood_products", "pharmaceuticals"],
            "current_quantity": [100, 200],
            "minimum_quantity": [50, 80],
            "is_critical": [1, 0],
            "normal_daily_usage": [15, 50],
            "surge_multiplier": [1.0, 1.0],
        })
        stock_movements = pd.DataFrame({
            "hospital_id": [1, 1],
            "resource_id": [1, 1],
            "quantity": [5, 3],
            "type": ["out", "out"],
            "created_at": [now - pd.Timedelta(hours=2), now - pd.Timedelta(hours=1)],
        })
        requests_df = pd.DataFrame({
            "hospital_id": [1],
            "resource_id": [1],
            "quantity_requested": [10],
            "created_at": [now - pd.Timedelta(hours=1)],
        })
        incidents = pd.DataFrame({
            "id": [1],
            "type": ["flood"],
            "status": ["active"],
            "created_at": [now - pd.Timedelta(hours=3)],
        })
        blockades = pd.DataFrame({
            "id": [1],
            "severity": ["partial"],
        })
        weather = pd.DataFrame()
        resilience_configs = pd.DataFrame({
            "hospital_id": [1, 1],
            "resource_id": [1, 2],
            "current_survival_hours": [48.0, 96.0],
        })
        return {
            "resources": resources,
            "stock_movements": stock_movements,
            "requests_df": requests_df,
            "incidents": incidents,
            "blockades": blockades,
            "weather": weather,
            "resilience_configs": resilience_configs,
        }

    def test_output_shape(self, minimal_data):
        """2 resources × 48 hours = 96 rows expected."""
        result = build_demand_features(**minimal_data, horizon_hours=48)
        assert len(result) == 2 * 48

    def test_all_feature_columns_present(self, minimal_data):
        result = build_demand_features(**minimal_data, horizon_hours=48)
        for col in DEMAND_FEATURE_COLS:
            assert col in result.columns, f"Missing feature column: {col}"

    def test_stock_ratio_computed(self, minimal_data):
        result = build_demand_features(**minimal_data, horizon_hours=2)
        # resource 1: 100/50 = 2.0, resource 2: 200/80 = 2.5
        r1 = result[result["resource_id"] == 1]["stock_ratio"].iloc[0]
        r2 = result[result["resource_id"] == 2]["stock_ratio"].iloc[0]
        assert r1 == pytest.approx(2.0, abs=0.01)
        assert r2 == pytest.approx(2.5, abs=0.01)

    def test_horizon_h_values(self, minimal_data):
        result = build_demand_features(**minimal_data, horizon_hours=5)
        # Each resource should have horizon_h = [1, 2, 3, 4, 5]
        h_vals = sorted(result["horizon_h"].unique())
        assert h_vals == [1, 2, 3, 4, 5]

    def test_incident_count_propagated(self, minimal_data):
        """The 1 active incident should appear on every row."""
        result = build_demand_features(**minimal_data, horizon_hours=2)
        assert (result["active_incidents"] == 1).all()

    def test_blockade_count_propagated(self, minimal_data):
        result = build_demand_features(**minimal_data, horizon_hours=2)
        assert (result["active_blockades"] == 1).all()

    def test_no_nan_in_output(self, minimal_data):
        """All NaN should be filled by the feature builder."""
        result = build_demand_features(**minimal_data, horizon_hours=4)
        assert result.isna().sum().sum() == 0

    def test_empty_stock_movements(self, minimal_data):
        """Should work with empty stock_movements (avg_hourly_consumption=0)."""
        minimal_data["stock_movements"] = pd.DataFrame()
        result = build_demand_features(**minimal_data, horizon_hours=2)
        assert (result["avg_hourly_consumption"] == 0).all()
