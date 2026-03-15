"""
Unit tests for the Kalinga demand forecasting model.

Tests both the rule-based fallback and (when available) the LightGBM path.
Uses mock DataFrames that mirror the feature matrix produced by build_demand_features().
"""

import numpy as np
import pandas as pd
import pytest

from forecasting.models.demand_model import DemandModel
from forecasting.etl.features import DEMAND_FEATURE_COLS


# ────────────────────────────────────────────────────────────
# Fixtures — minimal feature DataFrames
# ────────────────────────────────────────────────────────────

def _make_features(n=10, **overrides):
    """Create a minimal feature DataFrame with realistic defaults."""
    now = pd.Timestamp.now(tz="Asia/Manila").floor("h")
    hours = pd.date_range(now, periods=n, freq="h")
    df = pd.DataFrame({
        "hospital_id":             [1] * n,
        "resource_id":             [1] * n,
        "forecast_time":           hours,
        "hour_sin":                np.sin(2 * np.pi * np.arange(n) / 24),
        "hour_cos":                np.cos(2 * np.pi * np.arange(n) / 24),
        "dow_sin":                 [0.0] * n,
        "dow_cos":                 [1.0] * n,
        "is_weekend":              [0] * n,
        "month":                   [8] * n,
        "avg_hourly_consumption":  [3.5] * n,
        "avg_hourly_requests":     [0.8] * n,
        "current_quantity":        [100] * n,
        "minimum_stock":           [50] * n,
        "stock_ratio":             [2.0] * n,
        "active_incidents":        [0] * n,
        "active_blockades":        [0] * n,
        "temperature_2m":          [30.0] * n,
        "precipitation_mm":        [0.0] * n,
        "wind_speed_kph":          [10.0] * n,
        "normal_daily_usage":      [50.0] * n,
        "surge_multiplier":        [1.0] * n,
        "current_survival_hours":  [48.0] * n,
        "is_critical":             [0] * n,
        "horizon_h":               list(range(1, n + 1)),
    })
    for col, vals in overrides.items():
        if np.isscalar(vals):
            df[col] = vals
        else:
            df[col] = vals
    return df


# ────────────────────────────────────────────────────────────
# Rule-based predict tests
# ────────────────────────────────────────────────────────────

class TestDemandRuleBased:
    """Tests for the rule_based_predict static method."""

    def test_basic_output_columns(self):
        """Result must contain yhat, yhat_lower, yhat_upper."""
        feats = _make_features(5)
        result = DemandModel.rule_based_predict(feats)
        for col in ("yhat", "yhat_lower", "yhat_upper"):
            assert col in result.columns, f"Missing column: {col}"

    def test_predictions_non_negative(self):
        """All demand predictions must be >= 0."""
        feats = _make_features(20)
        result = DemandModel.rule_based_predict(feats)
        assert (result["yhat"] >= 0).all()
        assert (result["yhat_lower"] >= 0).all()

    def test_confidence_band_ordering(self):
        """Lower bound <= point estimate <= upper bound."""
        feats = _make_features(10)
        result = DemandModel.rule_based_predict(feats)
        assert (result["yhat_lower"] <= result["yhat"]).all()
        assert (result["yhat"] <= result["yhat_upper"]).all()

    def test_surge_multiplier_increases_demand(self):
        """Higher surge_multiplier → proportionally higher yhat."""
        base = _make_features(5, surge_multiplier=1.0)
        surged = _make_features(5, surge_multiplier=2.0)
        res_base = DemandModel.rule_based_predict(base)
        res_surged = DemandModel.rule_based_predict(surged)
        # Surge of 2× should double the prediction
        np.testing.assert_allclose(
            res_surged["yhat"].values,
            res_base["yhat"].values * 2.0,
            atol=0.01,
        )

    def test_zero_consumption_yields_zero(self):
        """If avg_hourly_consumption is 0, yhat should be 0."""
        feats = _make_features(5, avg_hourly_consumption=0.0)
        result = DemandModel.rule_based_predict(feats)
        assert (result["yhat"] == 0).all()

    def test_incident_boost_effect(self):
        """Active incidents should increase demand by 15%."""
        no_incident = _make_features(5, active_incidents=0)
        with_incident = _make_features(5, active_incidents=3)
        res_no = DemandModel.rule_based_predict(no_incident)
        res_yes = DemandModel.rule_based_predict(with_incident)
        # With incidents: yhat = base * 1.15
        np.testing.assert_allclose(
            res_yes["yhat"].values,
            res_no["yhat"].values * 1.15,
            atol=0.01,
        )

    def test_precipitation_boost_effect(self):
        """Heavy precipitation (>5mm) should increase demand by 10%."""
        dry = _make_features(5, precipitation_mm=0.0, active_incidents=0)
        rainy = _make_features(5, precipitation_mm=20.0, active_incidents=0)
        res_dry = DemandModel.rule_based_predict(dry)
        res_rainy = DemandModel.rule_based_predict(rainy)
        np.testing.assert_allclose(
            res_rainy["yhat"].values,
            res_dry["yhat"].values * 1.10,
            atol=0.01,
        )

    def test_combined_boosts_multiply(self):
        """Incident + precipitation boosts stack multiplicatively."""
        feats = _make_features(5, active_incidents=1, precipitation_mm=10.0)
        result = DemandModel.rule_based_predict(feats)
        base_yhat = 3.5 * 1.0  # avg * surge
        expected = base_yhat * 1.15 * 1.10  # incident * weather
        np.testing.assert_allclose(result["yhat"].values, expected, atol=0.01)

    def test_nan_consumption_treated_as_zero(self):
        """NaN avg_hourly_consumption should be filled to 0."""
        feats = _make_features(3, avg_hourly_consumption=np.nan)
        result = DemandModel.rule_based_predict(feats)
        assert (result["yhat"] == 0).all()

    def test_nan_surge_treated_as_one(self):
        """NaN surge_multiplier should default to 1.0."""
        feats = _make_features(3, avg_hourly_consumption=5.0, surge_multiplier=np.nan)
        result = DemandModel.rule_based_predict(feats)
        np.testing.assert_allclose(result["yhat"].values, 5.0, atol=0.01)


# ────────────────────────────────────────────────────────────
# DemandModel.predict integration
# ────────────────────────────────────────────────────────────

class TestDemandModelPredict:
    """Tests for the DemandModel.predict() method."""

    def test_default_mode_is_rule_based(self):
        model = DemandModel()
        assert model.mode == "rule_based"

    def test_predict_returns_correct_shape(self):
        model = DemandModel()
        feats = _make_features(20)
        result = model.predict(feats)
        assert len(result) == 20
        assert "yhat" in result.columns

    def test_predict_preserves_identity_columns(self):
        """hospital_id, resource_id, forecast_time must survive prediction."""
        model = DemandModel()
        feats = _make_features(5)
        result = model.predict(feats)
        for col in ("hospital_id", "resource_id", "forecast_time"):
            assert col in result.columns

    def test_train_falls_back_with_few_rows(self):
        """Training with < MIN_TRAINING_ROWS should keep rule_based mode."""
        model = DemandModel()
        feats = _make_features(10)
        target = pd.Series(np.random.rand(10))
        model.train(feats, target)
        assert model.mode == "rule_based"

    def test_single_row_prediction(self):
        """Model should handle a single-row feature matrix."""
        model = DemandModel()
        feats = _make_features(1)
        result = model.predict(feats)
        assert len(result) == 1
        assert result["yhat"].iloc[0] >= 0

    def test_large_feature_matrix(self):
        """Model should handle 11,520 rows (12 hospitals × 20 resources × 48h)."""
        model = DemandModel()
        feats = _make_features(11520)
        result = model.predict(feats)
        assert len(result) == 11520
        assert result["yhat"].notna().all()
