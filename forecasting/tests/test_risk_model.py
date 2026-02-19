"""
Unit tests for the Kalinga risk scoring model.

Tests the rule-based sigmoid formula, risk categorisation thresholds,
projected-stock calculation, and edge cases around zero/NaN inputs.
"""

import numpy as np
import pandas as pd
import pytest

from forecasting.models.risk_model import RiskModel, _build_risk_factors
from forecasting.config import RISK_THRESHOLD_HIGH, RISK_THRESHOLD_CRITICAL


# ────────────────────────────────────────────────────────────
# Fixtures
# ────────────────────────────────────────────────────────────

def _make_features(n=10, **overrides):
    """Minimal feature DataFrame suitable for the risk model."""
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
        "stock_ratio":             [2.0] * n,  # healthy default
        "active_incidents":        [0] * n,
        "active_blockades":        [0] * n,
        "temperature_2m":          [30.0] * n,
        "precipitation_mm":        [0.0] * n,
        "wind_speed_kph":          [10.0] * n,
        "normal_daily_usage":      [50.0] * n,
        "surge_multiplier":        [1.0] * n,
        "current_survival_hours":  [168.0] * n,  # 7 days = healthy
        "is_critical":             [0] * n,
        "horizon_h":               list(range(1, n + 1)),
    })
    for col, vals in overrides.items():
        if np.isscalar(vals):
            df[col] = vals
        else:
            df[col] = vals
    return df


def _make_demand(n=10, value=3.5):
    """Create a demand_yhat Series."""
    return pd.Series([value] * n)


# ────────────────────────────────────────────────────────────
# Risk probability & sigmoid formula tests
# ────────────────────────────────────────────────────────────

class TestRiskProbability:
    """Tests for the dual-sigmoid risk formula."""

    def test_output_columns(self):
        feats = _make_features(5)
        result = RiskModel.rule_based_predict(feats, _make_demand(5))
        for col in ("risk_prob", "risk_level", "projected_stock", "days_until_stockout", "risk_factors"):
            assert col in result.columns

    def test_risk_prob_bounded_0_1(self):
        """risk_prob must be in [0, 1] for any input."""
        feats = _make_features(20, stock_ratio=np.random.rand(20) * 5)
        result = RiskModel.rule_based_predict(feats, _make_demand(20))
        assert (result["risk_prob"] >= 0).all()
        assert (result["risk_prob"] <= 1).all()

    def test_zero_stock_ratio_yields_high_risk(self):
        """stock_ratio=0 means no stock → risk should be high/critical."""
        feats = _make_features(5, stock_ratio=0.0, current_survival_hours=0.0)
        result = RiskModel.rule_based_predict(feats, _make_demand(5))
        # stock_sig(0) ≈ 0.95, survival_sig(0) ≈ 0.81 → primary ≈ 0.89
        assert (result["risk_prob"] > 0.80).all()

    def test_high_stock_ratio_yields_low_risk(self):
        """stock_ratio=5 + 168h survival → risk should be low."""
        feats = _make_features(5, stock_ratio=5.0, current_survival_hours=168.0)
        result = RiskModel.rule_based_predict(feats, _make_demand(5))
        # stock_sig(5) ≈ 0.00, survival_sig(168) ≈ 0.00 → primary ≈ 0.00
        assert (result["risk_prob"] < 0.10).all()

    def test_borderline_stock_ratio_0_5(self):
        """stock_ratio=0.5 is the sigmoid midpoint → ~0.50 stock_sig."""
        feats = _make_features(5, stock_ratio=0.5, current_survival_hours=24.0)
        result = RiskModel.rule_based_predict(feats, _make_demand(5))
        # stock_sig(0.5) = 0.50, survival_sig(24) = 0.50
        # primary = 0.6*0.5 + 0.4*0.5 = 0.50
        assert (result["risk_prob"] > 0.40).all()
        assert (result["risk_prob"] < 0.60).all()

    def test_incidents_boost_risk(self):
        """Active incidents should increase risk_prob by up to 0.05."""
        base = _make_features(5, stock_ratio=1.0, current_survival_hours=48.0)
        boosted = _make_features(5, stock_ratio=1.0, current_survival_hours=48.0, active_incidents=3)
        res_base = RiskModel.rule_based_predict(base, _make_demand(5))
        res_boosted = RiskModel.rule_based_predict(boosted, _make_demand(5))
        diff = res_boosted["risk_prob"].values - res_base["risk_prob"].values
        assert (diff >= 0.04).all()  # incident boost = 0.05
        assert (diff <= 0.06).all()

    def test_precipitation_boosts_risk(self):
        """Heavy rain (30mm) should add up to 0.04 to risk_prob."""
        dry = _make_features(5, stock_ratio=1.0, current_survival_hours=48.0, precipitation_mm=0.0)
        wet = _make_features(5, stock_ratio=1.0, current_survival_hours=48.0, precipitation_mm=30.0)
        res_dry = RiskModel.rule_based_predict(dry, _make_demand(5))
        res_wet = RiskModel.rule_based_predict(wet, _make_demand(5))
        diff = res_wet["risk_prob"].values - res_dry["risk_prob"].values
        assert (diff >= 0.03).all()
        assert (diff <= 0.05).all()

    def test_boost_cap_at_0_15(self):
        """Even if all boosters fire, total boost can't exceed 0.15."""
        feats = _make_features(
            5,
            stock_ratio=0.5,
            current_survival_hours=24.0,
            active_incidents=5,
            precipitation_mm=100.0,
            is_critical=1,
            active_blockades=3,
        )
        result = RiskModel.rule_based_predict(feats, _make_demand(5))
        # primary at midpoint ≈ 0.50, max boost = 0.15 → max ≈ 0.65
        assert (result["risk_prob"] <= 0.70).all()


# ────────────────────────────────────────────────────────────
# Risk level categorisation tests
# ────────────────────────────────────────────────────────────

class TestRiskLevel:
    """Tests risk_level bucketing against configured thresholds."""

    def test_low_risk_label(self):
        """stock_ratio=5, survival=168h → should be 'low'."""
        feats = _make_features(3, stock_ratio=5.0, current_survival_hours=168.0)
        result = RiskModel.rule_based_predict(feats, _make_demand(3))
        assert (result["risk_level"] == "low").all()

    def test_critical_risk_label(self):
        """stock_ratio=0, survival=0 + all boosters → 'critical'."""
        feats = _make_features(
            3,
            stock_ratio=0.0,
            current_survival_hours=0.0,
            active_incidents=2,
            is_critical=1,
        )
        result = RiskModel.rule_based_predict(feats, _make_demand(3))
        assert (result["risk_level"] == "critical").all()

    def test_threshold_boundaries(self):
        """Verify the boundary values match config thresholds."""
        assert RISK_THRESHOLD_HIGH == 0.65
        assert RISK_THRESHOLD_CRITICAL == 0.85


# ────────────────────────────────────────────────────────────
# Projected stock & days-until-stockout
# ────────────────────────────────────────────────────────────

class TestProjectedStock:
    """Tests for projected_stock and days_until_stockout calculations."""

    def test_projected_stock_formula(self):
        """projected = current - demand * horizon, clipped at 0."""
        feats = _make_features(1, current_quantity=100)
        feats["horizon_h"] = [10]
        demand = _make_demand(1, value=5.0)  # 5 units/hour × 10h = 50
        result = RiskModel.rule_based_predict(feats, demand)
        assert result["projected_stock"].iloc[0] == pytest.approx(50.0, abs=0.1)

    def test_projected_stock_floors_at_zero(self):
        """If demand exceeds stock, projected_stock should be 0, not negative."""
        feats = _make_features(1, current_quantity=10)
        feats["horizon_h"] = [48]
        demand = _make_demand(1, value=5.0)  # 5 × 48 = 240 >> 10
        result = RiskModel.rule_based_predict(feats, demand)
        assert result["projected_stock"].iloc[0] == 0.0

    def test_days_until_stockout_calculation(self):
        """days_until_stockout = projected / (daily_usage * surge)."""
        feats = _make_features(1, current_quantity=200, normal_daily_usage=50.0, surge_multiplier=1.0)
        feats["horizon_h"] = [1]
        demand = _make_demand(1, value=0.0)  # no immediate demand
        result = RiskModel.rule_based_predict(feats, demand)
        # projected = 200, daily = 50 → days = 4.0
        assert result["days_until_stockout"].iloc[0] == pytest.approx(4.0, abs=0.1)

    def test_zero_daily_usage_gives_999_days(self):
        """If normal_daily_usage=0, days_until_stockout should be 999."""
        feats = _make_features(1, normal_daily_usage=0.0)
        demand = _make_demand(1, value=0.0)
        result = RiskModel.rule_based_predict(feats, demand)
        assert result["days_until_stockout"].iloc[0] == 999.0


# ────────────────────────────────────────────────────────────
# Risk factors helper
# ────────────────────────────────────────────────────────────

class TestBuildRiskFactors:
    """Tests for the _build_risk_factors helper."""

    def test_low_stock_flag(self):
        row = {"stock_ratio": 0.3, "current_survival_hours": 200}
        factors = _build_risk_factors(row)
        assert "low_stock" in factors

    def test_low_survival_flag(self):
        row = {"stock_ratio": 5.0, "current_survival_hours": 20}
        factors = _build_risk_factors(row)
        assert "low_survival" in factors

    def test_incidents_flag(self):
        row = {"stock_ratio": 5.0, "current_survival_hours": 200, "active_incidents": 3}
        factors = _build_risk_factors(row)
        assert "incidents" in factors

    def test_weather_flag(self):
        row = {"stock_ratio": 5.0, "current_survival_hours": 200, "precipitation_mm": 25}
        factors = _build_risk_factors(row)
        assert "weather" in factors

    def test_no_flags_when_healthy(self):
        row = {"stock_ratio": 3.0, "current_survival_hours": 200}
        factors = _build_risk_factors(row)
        assert len(factors) == 0


# ────────────────────────────────────────────────────────────
# RiskModel.predict integration
# ────────────────────────────────────────────────────────────

class TestRiskModelPredict:
    """Integration tests for RiskModel.predict()."""

    def test_default_mode_is_rule_based(self):
        model = RiskModel()
        assert model.mode == "rule_based"

    def test_predict_returns_correct_shape(self):
        model = RiskModel()
        feats = _make_features(20)
        result = model.predict(feats, _make_demand(20))
        assert len(result) == 20

    def test_predict_preserves_identity(self):
        model = RiskModel()
        feats = _make_features(5)
        result = model.predict(feats, _make_demand(5))
        assert "hospital_id" in result.columns
        assert "resource_id" in result.columns

    def test_single_row(self):
        model = RiskModel()
        feats = _make_features(1)
        result = model.predict(feats, _make_demand(1))
        assert len(result) == 1
        assert 0 <= result["risk_prob"].iloc[0] <= 1

    def test_full_pipeline_size(self):
        """11,520 rows (12 hospitals × 20 resources × 48h)."""
        model = RiskModel()
        feats = _make_features(11520)
        result = model.predict(feats, _make_demand(11520))
        assert len(result) == 11520
        assert result["risk_prob"].notna().all()
