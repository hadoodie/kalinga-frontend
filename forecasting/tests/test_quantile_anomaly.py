"""
Tests for Epic 3 (Quantile Regression) & Epic 4 (Anomaly Detection).

Run:
    python -m pytest forecasting/tests/test_quantile_anomaly.py -v
"""

import numpy as np
import pandas as pd
import pytest
from datetime import datetime, timedelta


# ═══════════════════════════════════════════════════════════════
# Epic 3 — Quantile Regression & Exogenous Events
# ═══════════════════════════════════════════════════════════════

class TestPinballLoss:
    """Test the quantile (pinball) loss utility."""

    def test_pinball_loss_perfect(self):
        """Zero loss when predictions match actuals."""
        from forecasting.models.demand_model import _pinball_loss
        y = np.array([1.0, 2.0, 3.0])
        assert _pinball_loss(y, y, 0.5) == pytest.approx(0.0)

    def test_pinball_loss_under_prediction_q90(self):
        """Under-prediction penalised more at α=0.90."""
        from forecasting.models.demand_model import _pinball_loss
        y_true = np.array([10.0])
        y_pred = np.array([5.0])   # under by 5
        loss = _pinball_loss(y_true, y_pred, 0.90)
        # loss = 0.90 × 5 = 4.5
        assert loss == pytest.approx(4.5)

    def test_pinball_loss_over_prediction_q90(self):
        """Over-prediction penalised less at α=0.90."""
        from forecasting.models.demand_model import _pinball_loss
        y_true = np.array([5.0])
        y_pred = np.array([10.0])  # over by 5
        loss = _pinball_loss(y_true, y_pred, 0.90)
        # loss = (0.90 - 1) × (-5) = 0.10 × 5 = 0.5
        assert loss == pytest.approx(0.5)

    def test_pinball_loss_symmetric_at_median(self):
        """At α=0.50, under and over penalties are equal."""
        from forecasting.models.demand_model import _pinball_loss
        y = np.array([10.0])
        under = _pinball_loss(y, np.array([5.0]), 0.50)
        over = _pinball_loss(y, np.array([15.0]), 0.50)
        assert under == pytest.approx(over)


class TestDemandModelQuantile:
    """Test the quantile regression DemandModel."""

    def _make_features(self, n=200, disaster=False):
        """Generate synthetic feature matrix."""
        np.random.seed(42)
        df = pd.DataFrame({
            "hospital_id": 1,
            "resource_id": 1,
            "forecast_time": pd.date_range("2026-01-01", periods=n, freq="h"),
            "hour_sin": np.sin(2 * np.pi * np.arange(n) / 24),
            "hour_cos": np.cos(2 * np.pi * np.arange(n) / 24),
            "dow_sin": 0.0,
            "dow_cos": 1.0,
            "is_weekend": 0,
            "month": 1,
            "avg_hourly_consumption": 5.0 + np.random.randn(n) * 0.5,
            "avg_hourly_requests": 2.0,
            "current_quantity": 100.0,
            "stock_ratio": 2.0,
            "active_incidents": 0,
            "active_blockades": 0,
            "temperature_2m": 30.0,
            "precipitation_mm": 0.0,
            "wind_speed_kph": 10.0,
            "normal_daily_usage": 120.0,
            "surge_multiplier": 1.0,
            "current_survival_hours": 72.0,
            "is_critical": 0,
            "horizon_h": np.arange(1, n + 1),
            "is_active_disaster_alert": int(disaster),
        })
        return df

    def test_rule_based_returns_p95(self):
        """Rule-based predict must include yhat_p95 column."""
        from forecasting.models.demand_model import DemandModel
        model = DemandModel()
        features = self._make_features(n=10)
        result = model.predict(features)
        assert "yhat_p95" in result.columns
        assert "yhat_upper" in result.columns
        assert "yhat_lower" in result.columns
        # P95 >= P90 >= P50 >= lower
        assert (result["yhat_p95"] >= result["yhat_upper"]).all()
        assert (result["yhat_upper"] >= result["yhat"]).all()
        assert (result["yhat"] >= result["yhat_lower"]).all()

    def test_rule_based_disaster_boost(self):
        """Disaster alert flag should increase rule-based predictions."""
        from forecasting.models.demand_model import DemandModel
        model = DemandModel()
        normal = model.predict(self._make_features(n=5, disaster=False))
        disaster = model.predict(self._make_features(n=5, disaster=True))
        # Disaster predictions should be 1.3x higher
        ratio = (disaster["yhat"].values / normal["yhat"].values)
        assert np.all(ratio > 1.2)

    def test_init_has_quantile_slots(self):
        """Model should initialise with model_q50/q90/q95 = None."""
        from forecasting.models.demand_model import DemandModel
        m = DemandModel()
        assert m.model_q50 is None
        assert m.model_q90 is None
        assert m.model_q95 is None
        assert m.mode == "rule_based"

    def test_train_insufficient_data(self):
        """Training with < MIN_TRAINING_ROWS should stay rule-based."""
        from forecasting.models.demand_model import DemandModel
        m = DemandModel()
        features = self._make_features(n=50)
        target = pd.Series(np.random.rand(50) * 10)
        m.train(features, target)
        assert m.mode == "rule_based"

    def test_predict_ordering_invariant(self):
        """yhat_p95 >= yhat_upper >= yhat >= yhat_lower in all modes."""
        from forecasting.models.demand_model import DemandModel
        model = DemandModel()
        result = model.predict(self._make_features(n=20))
        assert (result["yhat_p95"] >= result["yhat_upper"] - 0.001).all()
        assert (result["yhat_upper"] >= result["yhat"] - 0.001).all()
        assert (result["yhat"] >= result["yhat_lower"] - 0.001).all()

    def test_predict_non_negative(self):
        """Demand predictions must never be negative."""
        from forecasting.models.demand_model import DemandModel
        model = DemandModel()
        features = self._make_features(n=15)
        features["avg_hourly_consumption"] = 0.0  # edge case: no consumption
        result = model.predict(features)
        assert (result["yhat"] >= 0).all()
        assert (result["yhat_upper"] >= 0).all()
        assert (result["yhat_p95"] >= 0).all()


class TestExogenousFeatureFlag:
    """Test is_active_disaster_alert feature engineering."""

    def test_feature_col_list_includes_flag(self):
        """DEMAND_FEATURE_COLS must include is_active_disaster_alert."""
        from forecasting.etl.features import DEMAND_FEATURE_COLS
        assert "is_active_disaster_alert" in DEMAND_FEATURE_COLS

    def test_build_features_without_hospitals(self):
        """Building features without hospitals DF → flag defaults to 0."""
        from forecasting.etl.features import build_demand_features
        resources = pd.DataFrame({
            "hospital_id": [1],
            "resource_id": [10],
            "resource_name": ["Gauze"],
            "category": ["medical"],
            "current_quantity": [100],
            "minimum_stock": [20],
            "is_critical": [0],
        })
        empty = pd.DataFrame()
        result = build_demand_features(
            resources=resources,
            stock_movements=empty,
            requests_df=empty,
            incidents=pd.DataFrame(columns=["id", "created_at", "status"]),
            blockades=empty,
            weather=empty,
            resilience_configs=empty,
            horizon_hours=2,
        )
        assert "is_active_disaster_alert" in result.columns
        assert (result["is_active_disaster_alert"] == 0).all()

    def test_build_features_with_disaster_hospital(self):
        """When hospitals DF has disaster_mode_active=True → flag = 1."""
        from forecasting.etl.features import build_demand_features
        resources = pd.DataFrame({
            "hospital_id": [1],
            "resource_id": [10],
            "resource_name": ["Gauze"],
            "category": ["medical"],
            "current_quantity": [100],
            "minimum_stock": [20],
            "is_critical": [0],
        })
        hospitals = pd.DataFrame({
            "id": [1],
            "disaster_mode_active": [True],
        })
        empty = pd.DataFrame()
        result = build_demand_features(
            resources=resources,
            stock_movements=empty,
            requests_df=empty,
            incidents=pd.DataFrame(columns=["id", "created_at", "status"]),
            blockades=empty,
            weather=empty,
            resilience_configs=empty,
            horizon_hours=2,
            hospitals=hospitals,
        )
        assert (result["is_active_disaster_alert"] == 1).all()


# ═══════════════════════════════════════════════════════════════
# Epic 4 — Anomaly Detection
# ═══════════════════════════════════════════════════════════════

class TestAnomalyDetectorSingle:
    """Test AnomalyDetector.check_single() — the fast path."""

    def test_no_anomaly_within_threshold(self):
        """Consumption within 1.5σ → normal."""
        from forecasting.models.anomaly_detector import AnomalyDetector
        det = AnomalyDetector(z_threshold=1.5)
        result = det.check_single(
            hospital_id=1, resource_id=10,
            actual_consumption=5.0,
            expected_consumption=4.0,
            historical_std=2.0,
        )
        # z = (5-4)/2 = 0.5 < 1.5
        assert not result.is_anomaly
        assert result.severity == "normal"
        assert result.z_score == pytest.approx(0.5)

    def test_warning_anomaly(self):
        """z between 1.5 and 2.5 → warning."""
        from forecasting.models.anomaly_detector import AnomalyDetector
        det = AnomalyDetector(z_threshold=1.5, critical_z=2.5)
        result = det.check_single(
            hospital_id=1, resource_id=10,
            actual_consumption=8.0,
            expected_consumption=4.0,
            historical_std=2.0,
        )
        # z = (8-4)/2 = 2.0
        assert result.is_anomaly
        assert result.severity == "warning"
        assert result.recommend_reforecast

    def test_critical_anomaly(self):
        """z >= 2.5 → critical."""
        from forecasting.models.anomaly_detector import AnomalyDetector
        det = AnomalyDetector(z_threshold=1.5, critical_z=2.5)
        result = det.check_single(
            hospital_id=1, resource_id=10,
            actual_consumption=12.0,
            expected_consumption=4.0,
            historical_std=2.0,
        )
        # z = (12-4)/2 = 4.0
        assert result.is_anomaly
        assert result.severity == "critical"

    def test_min_std_floor(self):
        """When σ < min_std, the floor prevents division by zero."""
        from forecasting.models.anomaly_detector import AnomalyDetector
        det = AnomalyDetector(z_threshold=1.5, min_std=0.5)
        result = det.check_single(
            hospital_id=1, resource_id=10,
            actual_consumption=2.0,
            expected_consumption=1.0,
            historical_std=0.01,  # below min_std
        )
        # Should use min_std=0.5 → z = (2-1)/0.5 = 2.0
        assert result.historical_std == pytest.approx(0.5)
        assert result.z_score == pytest.approx(2.0)

    def test_zero_consumption_no_anomaly(self):
        """Zero actual consumption → z < 0 → no anomaly."""
        from forecasting.models.anomaly_detector import AnomalyDetector
        det = AnomalyDetector(z_threshold=1.5)
        result = det.check_single(
            hospital_id=1, resource_id=10,
            actual_consumption=0.0,
            expected_consumption=5.0,
            historical_std=2.0,
        )
        # z = (0-5)/2 = -2.5 → negative, not an anomaly
        assert not result.is_anomaly
        assert result.severity == "normal"

    def test_details_populated_on_anomaly(self):
        """Details string should describe the anomaly when detected."""
        from forecasting.models.anomaly_detector import AnomalyDetector
        det = AnomalyDetector(z_threshold=1.5)
        result = det.check_single(
            hospital_id=1, resource_id=10,
            actual_consumption=10.0,
            expected_consumption=3.0,
            historical_std=2.0,
        )
        assert result.is_anomaly
        assert "exceeds forecast" in result.details
        assert "σ" in result.details

    def test_details_empty_when_normal(self):
        """Details string should be empty for non-anomalous results."""
        from forecasting.models.anomaly_detector import AnomalyDetector
        det = AnomalyDetector(z_threshold=1.5)
        result = det.check_single(
            hospital_id=1, resource_id=10,
            actual_consumption=4.0,
            expected_consumption=4.0,
            historical_std=2.0,
        )
        assert result.details == ""


class TestAnomalyDetectorDataFrame:
    """Test AnomalyDetector.detect() — the DataFrame path."""

    def _make_movements(self, n_hours=48, base_qty=5.0):
        """Generate synthetic hourly outflow movements."""
        np.random.seed(42)
        rows = []
        start = pd.Timestamp("2026-01-01", tz="Asia/Manila")
        for h in range(n_hours):
            ts = start + pd.Timedelta(hours=h)
            qty = max(0, base_qty + np.random.randn() * 1.0)
            rows.append({
                "hospital_id": 1,
                "resource_id": 10,
                "movement_type": "out",
                "quantity": round(qty, 2),
                "created_at": ts,
                "new_quantity": 100 - h,
            })
        return pd.DataFrame(rows)

    def test_detect_no_anomaly(self):
        """Actual ≈ expected → no anomaly."""
        from forecasting.models.anomaly_detector import AnomalyDetector
        det = AnomalyDetector(z_threshold=1.5, lookback_hours=48)

        movements = self._make_movements(48)
        actual = pd.DataFrame({
            "hospital_id": [1],
            "resource_id": [10],
            "consumption": [5.0],
        })
        forecast = pd.DataFrame({
            "hospital_id": [1],
            "resource_id": [10],
            "yhat": [5.0],
        })

        as_of = pd.Timestamp("2026-01-03", tz="Asia/Manila")
        results = det.detect(actual, forecast, movements, as_of=as_of)
        assert len(results) == 1
        assert not results[0].is_anomaly

    def test_detect_spike_anomaly(self):
        """Actual >> expected → anomaly triggered."""
        from forecasting.models.anomaly_detector import AnomalyDetector
        det = AnomalyDetector(z_threshold=1.5, lookback_hours=48)

        movements = self._make_movements(48, base_qty=5.0)
        actual = pd.DataFrame({
            "hospital_id": [1],
            "resource_id": [10],
            "consumption": [15.0],  # 3x normal
        })
        forecast = pd.DataFrame({
            "hospital_id": [1],
            "resource_id": [10],
            "yhat": [5.0],
        })

        as_of = pd.Timestamp("2026-01-03", tz="Asia/Manila")
        results = det.detect(actual, forecast, movements, as_of=as_of)
        assert len(results) == 1
        assert results[0].is_anomaly
        assert results[0].z_score > 1.5

    def test_detect_multiple_resources(self):
        """Multiple resources evaluated independently."""
        from forecasting.models.anomaly_detector import AnomalyDetector
        det = AnomalyDetector(z_threshold=1.5, lookback_hours=48)

        # Resource 10: normal, Resource 20: anomalous
        movements_10 = self._make_movements(48, base_qty=5.0)
        movements_20 = self._make_movements(48, base_qty=3.0)
        movements_20["resource_id"] = 20
        movements = pd.concat([movements_10, movements_20], ignore_index=True)

        actual = pd.DataFrame({
            "hospital_id": [1, 1],
            "resource_id": [10, 20],
            "consumption": [5.0, 15.0],
        })
        forecast = pd.DataFrame({
            "hospital_id": [1, 1],
            "resource_id": [10, 20],
            "yhat": [5.0, 3.0],
        })

        as_of = pd.Timestamp("2026-01-03", tz="Asia/Manila")
        results = det.detect(actual, forecast, movements, as_of=as_of)
        assert len(results) == 2

        results_dict = {r.resource_id: r for r in results}
        assert not results_dict[10].is_anomaly  # normal
        assert results_dict[20].is_anomaly       # spike

    def test_historical_stats_empty_movements(self):
        """Empty movement history → uses min_std."""
        from forecasting.models.anomaly_detector import AnomalyDetector
        det = AnomalyDetector(z_threshold=1.5, min_std=0.5)

        actual = pd.DataFrame({
            "hospital_id": [1],
            "resource_id": [10],
            "consumption": [5.0],
        })
        forecast = pd.DataFrame({
            "hospital_id": [1],
            "resource_id": [10],
            "yhat": [3.0],
        })
        empty_movements = pd.DataFrame()
        as_of = pd.Timestamp("2026-01-03", tz="Asia/Manila")

        results = det.detect(actual, forecast, empty_movements, as_of=as_of)
        assert len(results) == 1
        # With min_std, z = (5-3)/0.5 = 4.0 → anomaly
        assert results[0].is_anomaly


class TestAnomalyResultDataclass:
    """Test the AnomalyResult dataclass properties."""

    def test_fields_present(self):
        from forecasting.models.anomaly_detector import AnomalyResult
        r = AnomalyResult(
            hospital_id=1,
            resource_id=10,
            hour="2026-01-01T00:00:00",
            actual_consumption=5.0,
            expected_consumption=3.0,
            historical_std=1.0,
            z_score=2.0,
            is_anomaly=True,
            severity="warning",
            recommend_reforecast=True,
        )
        assert r.hospital_id == 1
        assert r.severity == "warning"
        assert r.details == ""  # default

    def test_details_can_be_set(self):
        from forecasting.models.anomaly_detector import AnomalyResult
        r = AnomalyResult(
            hospital_id=1,
            resource_id=10,
            hour="2026-01-01T00:00:00",
            actual_consumption=5.0,
            expected_consumption=3.0,
            historical_std=1.0,
            z_score=2.0,
            is_anomaly=True,
            severity="warning",
            recommend_reforecast=True,
            details="Test detail",
        )
        assert r.details == "Test detail"


class TestConfigConstants:
    """Verify Epic 3 & 4 config additions."""

    def test_quantile_model_params_exist(self):
        from forecasting.config import QUANTILE_MODEL_PARAMS
        assert "n_estimators" in QUANTILE_MODEL_PARAMS
        assert "max_depth" in QUANTILE_MODEL_PARAMS
        # Must NOT have objective/alpha — those are injected at train time
        assert "objective" not in QUANTILE_MODEL_PARAMS
        assert "alpha" not in QUANTILE_MODEL_PARAMS

    def test_anomaly_thresholds_exist(self):
        from forecasting.config import ANOMALY_Z_THRESHOLD, ANOMALY_LOOKBACK_HOURS
        assert ANOMALY_Z_THRESHOLD == pytest.approx(1.5)
        assert ANOMALY_LOOKBACK_HOURS == 168


class TestSchemasEpic3_4:
    """Verify new Pydantic schemas compile and validate."""

    def test_feature_row_has_disaster_flag(self):
        from forecasting.schemas import FeatureRow
        row = FeatureRow(
            hospital_id=1,
            resource_id=1,
            forecast_time="2026-01-01T00:00:00+08:00",
            is_active_disaster_alert=1,
        )
        assert row.is_active_disaster_alert == 1

    def test_demand_prediction_has_p95(self):
        from forecasting.schemas import DemandPrediction
        dp = DemandPrediction(
            hospital_id=1,
            resource_id=1,
            forecast_time="2026-01-01T00:00:00+08:00",
            horizon_h=1,
            yhat=5.0,
            yhat_lower=3.5,
            yhat_upper=7.0,
            yhat_p95=8.0,
        )
        assert dp.yhat_p95 == 8.0

    def test_anomaly_check_request_schema(self):
        from forecasting.schemas import AnomalyCheckRequest
        req = AnomalyCheckRequest(
            hospital_id=1,
            resource_id=10,
            actual_consumption=12.5,
        )
        assert req.expected_consumption == 0.0  # default
        assert req.historical_std == 0.0        # default

    def test_anomaly_result_schema(self):
        from forecasting.schemas import AnomalyResultSchema
        r = AnomalyResultSchema(
            hospital_id=1,
            resource_id=10,
            hour="2026-01-01T00:00:00",
            actual_consumption=12.5,
            expected_consumption=5.0,
            historical_std=2.0,
            z_score=3.75,
            is_anomaly=True,
            severity="critical",
            recommend_reforecast=True,
            details="test",
        )
        assert r.severity == "critical"

    def test_anomaly_response_schema(self):
        from forecasting.schemas import AnomalyCheckResponse, AnomalyResultSchema
        resp = AnomalyCheckResponse(
            z_threshold=1.5,
            anomalies_found=1,
            results=[
                AnomalyResultSchema(
                    hospital_id=1,
                    resource_id=10,
                    hour="2026-01-01T00:00:00",
                    actual_consumption=12.5,
                    expected_consumption=5.0,
                    historical_std=2.0,
                    z_score=3.75,
                    is_anomaly=True,
                    severity="critical",
                    recommend_reforecast=True,
                ),
            ],
        )
        assert resp.anomalies_found == 1
        assert len(resp.results) == 1
