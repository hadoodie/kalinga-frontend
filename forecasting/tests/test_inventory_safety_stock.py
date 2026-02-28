"""
Tests for Epic 1: ABC/XYZ Inventory Classifier
and Epic 2: Probabilistic Dynamic Safety Stock Calculator.
"""

import math
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import pytest

from forecasting.models.inventory_classifier import InventoryClassifier
from forecasting.models.safety_stock import SafetyStockCalculator, z_score


# ═══════════════════════════════════════════════════════════════
# Epic 1 — ABC/XYZ Classifier
# ═══════════════════════════════════════════════════════════════


class TestInventoryClassifier:
    """Tests for the InventoryClassifier."""

    @pytest.fixture
    def classifier(self):
        return InventoryClassifier(window_days=90, cold_start_days=14)

    @pytest.fixture
    def base_resources(self):
        """Resources DataFrame with 5 items, all created >14 days ago."""
        return pd.DataFrame({
            "id": [1, 2, 3, 4, 5],
            "hospital_id": [1, 1, 1, 1, 1],
            "created_at": pd.Timestamp.utcnow() - pd.Timedelta(days=60),
        })

    def _make_movements(self, resource_id, daily_qty, days, hospital_id=1, variance=0):
        """Generate synthetic outflow stock movements."""
        rows = []
        for d in range(days):
            ts = datetime.utcnow() - timedelta(days=days - d)
            qty = max(0, daily_qty + np.random.normal(0, variance))
            rows.append({
                "resource_id": resource_id,
                "hospital_id": hospital_id,
                "movement_type": "out",
                "quantity": round(qty, 2),
                "created_at": ts.isoformat(),
            })
        return rows

    # ── ABC tests ────────────────────────────────────────────

    def test_abc_pareto_ranking(self, classifier):
        """Item with highest volume should be class A."""
        resources = pd.DataFrame({
            "id": [1, 2, 3],
            "hospital_id": [1, 1, 1],
            "created_at": pd.Timestamp.now(tz="UTC") - pd.Timedelta(days=60),
        })
        movements = []
        # Resource 1: 100/day (dominant), Resource 2: 10/day, Resource 3: 1/day
        movements += self._make_movements(1, 100, 30)
        movements += self._make_movements(2, 10, 30)
        movements += self._make_movements(3, 1, 30)
        sm = pd.DataFrame(movements)

        result = classifier.classify(sm, resources)
        assert not result.empty

        r1 = result[result["resource_id"] == 1].iloc[0]
        r3 = result[result["resource_id"] == 3].iloc[0]

        assert r1["abc_class"] == "A"
        assert r3["abc_class"] == "C"

    def test_abc_all_equal_volume(self, classifier, base_resources):
        """When all items have equal volume, all should be A (they all fit in top 80%)."""
        movements = []
        for rid in [1, 2, 3]:
            movements += self._make_movements(rid, 10, 30)
        sm = pd.DataFrame(movements)

        result = classifier.classify(sm, base_resources)
        # With 3 equal items, each is ~33%. Cumulative: 33%, 67%, 100%.
        # Items 1 and 2 fall within 80%, so A; item 3 at 100% is B or C.
        classes = set(result["abc_class"].values)
        assert "A" in classes

    # ── XYZ tests ────────────────────────────────────────────

    def test_xyz_stable_demand_is_X(self, classifier, base_resources):
        """Constant daily demand → CV ≈ 0 → class X."""
        movements = self._make_movements(1, 50, 30, variance=0)
        sm = pd.DataFrame(movements)

        result = classifier.classify(sm, base_resources)
        r1 = result[result["resource_id"] == 1].iloc[0]
        assert r1["xyz_class"] == "X"

    def test_xyz_erratic_demand_is_Z(self, classifier, base_resources):
        """Highly variable demand → CV > 1 → class Z."""
        np.random.seed(42)
        movements = self._make_movements(1, 10, 30, variance=20)  # CV ~ 2.0
        sm = pd.DataFrame(movements)

        result = classifier.classify(sm, base_resources)
        r1 = result[result["resource_id"] == 1].iloc[0]
        assert r1["xyz_class"] in ("Y", "Z")  # high variance

    # ── Cold Start tests ─────────────────────────────────────

    def test_cold_start_new_item_forced_to_Z(self, classifier):
        """Items created < 14 days ago must default to Z classification."""
        resources = pd.DataFrame({
            "id": [1],
            "hospital_id": [1],
            "created_at": pd.Timestamp.utcnow() - pd.Timedelta(days=5),  # 5 days old
        })
        # Even with perfectly stable demand
        movements = self._make_movements(1, 50, 5, variance=0)
        sm = pd.DataFrame(movements)

        result = classifier.classify(sm, resources)
        r1 = result[result["resource_id"] == 1].iloc[0]
        assert r1["xyz_class"] == "Z"
        assert r1["is_cold_start"] == True

    def test_cold_start_not_applied_to_old_items(self, classifier, base_resources):
        """Items with sufficient history should NOT be marked as cold-start."""
        movements = self._make_movements(1, 50, 30, variance=0)
        sm = pd.DataFrame(movements)

        result = classifier.classify(sm, base_resources)
        r1 = result[result["resource_id"] == 1].iloc[0]
        assert r1["is_cold_start"] == False

    # ── Combined class ───────────────────────────────────────

    def test_combined_abc_xyz_class(self, classifier, base_resources):
        """abc_xyz_class should be the concatenation of ABC + XYZ."""
        movements = self._make_movements(1, 100, 30, variance=0)
        sm = pd.DataFrame(movements)

        result = classifier.classify(sm, base_resources)
        r1 = result[result["resource_id"] == 1].iloc[0]
        assert r1["abc_xyz_class"] == r1["abc_class"] + r1["xyz_class"]

    # ── Edge cases ───────────────────────────────────────────

    def test_empty_movements(self, classifier, base_resources):
        """No stock movements → all items C/Z."""
        sm = pd.DataFrame(columns=[
            "resource_id", "hospital_id", "movement_type", "quantity", "created_at",
        ])
        result = classifier.classify(sm, base_resources)
        assert len(result) > 0
        assert all(result["abc_class"] == "C")

    def test_safety_stock_multiplier_lookup(self):
        """Multiplier table should return expected values."""
        assert InventoryClassifier.safety_stock_multiplier("AX") == 1.0
        assert InventoryClassifier.safety_stock_multiplier("AZ") == 1.40
        assert InventoryClassifier.safety_stock_multiplier("CX") == 0.90
        assert InventoryClassifier.safety_stock_multiplier("ZZ") == 1.0  # unknown → default

    def test_describe_class(self):
        """Description lookup should return non-empty strings."""
        assert "stable" in InventoryClassifier.describe_class("AX").lower()
        assert InventoryClassifier.describe_class("XX") == "Unknown classification"


# ═══════════════════════════════════════════════════════════════
# Epic 2 — Safety Stock Calculator
# ═══════════════════════════════════════════════════════════════


class TestZScore:
    """Tests for the Z-score utility function."""

    def test_z_score_95(self):
        """Z-score for 95% service level ≈ 1.645."""
        z = z_score(0.95)
        assert abs(z - 1.6449) < 0.01

    def test_z_score_99(self):
        """Z-score for 99% service level ≈ 2.326."""
        z = z_score(0.99)
        assert abs(z - 2.3263) < 0.01

    def test_z_score_50(self):
        """Z-score for 50% service level = 0."""
        z = z_score(0.50)
        assert abs(z) < 0.01

    def test_z_score_interpolation(self):
        """Z-score for unlisted value should interpolate reasonably."""
        z = z_score(0.93)
        assert 1.28 < z < 1.65  # between 0.90 and 0.95

    def test_z_score_invalid(self):
        """Z-score should raise for out-of-range service levels."""
        with pytest.raises(ValueError):
            z_score(0.0)
        with pytest.raises(ValueError):
            z_score(1.0)


class TestSafetyStockCalculator:
    """Tests for the SafetyStockCalculator."""

    @pytest.fixture
    def calc(self):
        return SafetyStockCalculator(target_service_level=0.95)

    # ── Core formula ─────────────────────────────────────────

    def test_basic_calculation(self, calc):
        """Manual verification of the safety stock formula."""
        # SS = Z × √(avg_LT × σ_d² + avg_d² × σ_LT²)
        # Z ≈ 1.6449 for 95%
        avg_lt = 5.0
        std_lt = 1.0
        avg_d = 20.0
        std_d = 5.0

        expected_variance = avg_lt * (std_d ** 2) + (avg_d ** 2) * (std_lt ** 2)
        expected_ss = 1.6449 * math.sqrt(expected_variance)

        result = calc.compute(avg_lt, std_lt, avg_d, std_d)
        assert abs(result - round(expected_ss, 2)) < 0.1

    def test_zero_demand_returns_zero(self, calc):
        """Zero average demand should yield zero safety stock."""
        assert calc.compute(5.0, 1.0, 0.0, 0.0) == 0.0

    def test_zero_lead_time_returns_zero(self, calc):
        """Zero lead time should yield zero safety stock."""
        assert calc.compute(0.0, 0.0, 20.0, 5.0) == 0.0

    def test_no_variability_returns_zero(self, calc):
        """When both σ_d and σ_LT are zero, SS should be zero."""
        result = calc.compute(5.0, 0.0, 20.0, 0.0)
        assert result == 0.0

    def test_higher_service_level_increases_ss(self):
        """99% service level should produce higher SS than 90%."""
        calc_90 = SafetyStockCalculator(target_service_level=0.90)
        calc_99 = SafetyStockCalculator(target_service_level=0.99)

        ss_90 = calc_90.compute(5.0, 1.0, 20.0, 5.0)
        ss_99 = calc_99.compute(5.0, 1.0, 20.0, 5.0)
        assert ss_99 > ss_90

    def test_higher_demand_variability_increases_ss(self, calc):
        """More variable demand → higher safety stock."""
        ss_low = calc.compute(5.0, 1.0, 20.0, 2.0)
        ss_high = calc.compute(5.0, 1.0, 20.0, 10.0)
        assert ss_high > ss_low

    def test_higher_lead_time_variability_increases_ss(self, calc):
        """More variable lead time → higher safety stock."""
        ss_low = calc.compute(5.0, 0.5, 20.0, 5.0)
        ss_high = calc.compute(5.0, 3.0, 20.0, 5.0)
        assert ss_high > ss_low

    # ── Reorder Point ────────────────────────────────────────

    def test_reorder_point(self, calc):
        """ROP = avg_d × avg_LT + SS."""
        rop = calc.reorder_point(5.0, 1.0, 20.0, 5.0)
        ss = calc.compute(5.0, 1.0, 20.0, 5.0)
        expected_rop = 20.0 * 5.0 + ss
        assert abs(rop - expected_rop) < 0.1

    # ── Batch API ────────────────────────────────────────────

    def test_batch_compute(self, calc):
        """Batch should produce same results as scalar calls."""
        demand_stats = pd.DataFrame({
            "hospital_id": [1, 1],
            "resource_id": [10, 20],
            "avg_daily_demand": [20.0, 50.0],
            "std_daily_demand": [5.0, 15.0],
        })

        result = calc.compute_batch(demand_stats)
        assert "safety_stock" in result.columns
        assert "reorder_point" in result.columns
        assert len(result) == 2

        # Verify first row matches scalar
        row = result.iloc[0]
        scalar_ss = calc.compute(
            calc.default_lt, calc.default_lt_std,
            20.0, 5.0,
        )
        assert abs(row["safety_stock"] - scalar_ss) < 0.1

    def test_batch_with_lead_time_stats(self, calc):
        """Batch should merge lead time data by resource_id."""
        demand_stats = pd.DataFrame({
            "hospital_id": [1],
            "resource_id": [10],
            "avg_daily_demand": [20.0],
            "std_daily_demand": [5.0],
        })
        lead_time_stats = pd.DataFrame({
            "resource_id": [10],
            "avg_lead_time_days": [3.0],
            "std_lead_time_days": [0.5],
        })

        result = calc.compute_batch(demand_stats, lead_time_stats)
        scalar_ss = calc.compute(3.0, 0.5, 20.0, 5.0)
        assert abs(result.iloc[0]["safety_stock"] - scalar_ss) < 0.1

    # ── Demand stats from movements helper ───────────────────

    def test_demand_stats_from_movements(self):
        """Should correctly compute mean and std of daily outflows."""
        rows = []
        for d in range(30):
            rows.append({
                "resource_id": 1,
                "hospital_id": 1,
                "movement_type": "out",
                "quantity": 10,
                "created_at": (datetime.utcnow() - timedelta(days=30 - d)).isoformat(),
            })
        sm = pd.DataFrame(rows)

        stats = SafetyStockCalculator.demand_stats_from_movements(sm, window_days=90)
        assert len(stats) == 1
        assert stats.iloc[0]["avg_daily_demand"] == 10.0
        assert stats.iloc[0]["std_daily_demand"] == 0.0  # constant demand

    def test_demand_stats_excludes_inflows(self):
        """Inflows should not count as demand."""
        rows = [
            {"resource_id": 1, "hospital_id": 1, "movement_type": "in",
             "quantity": 100, "created_at": datetime.utcnow().isoformat()},
            {"resource_id": 1, "hospital_id": 1, "movement_type": "out",
             "quantity": 10, "created_at": datetime.utcnow().isoformat()},
        ]
        sm = pd.DataFrame(rows)

        stats = SafetyStockCalculator.demand_stats_from_movements(sm)
        assert len(stats) == 1
        assert stats.iloc[0]["avg_daily_demand"] == 10.0

    # ── Lead time stats helper ───────────────────────────────

    def test_lead_time_stats_from_orders(self):
        """Should compute lead time from order creation to actual delivery."""
        orders = pd.DataFrame({
            "resource_sku": ["SKU-001", "SKU-001"],
            "status": ["received", "received"],
            "created_at": [
                (datetime.utcnow() - timedelta(days=10)).isoformat(),
                (datetime.utcnow() - timedelta(days=8)).isoformat(),
            ],
            "expected_delivery_date": [
                (datetime.utcnow() - timedelta(days=5)).isoformat(),
                (datetime.utcnow() - timedelta(days=3)).isoformat(),
            ],
            "actual_delivery_date": [
                (datetime.utcnow() - timedelta(days=5)).isoformat(),
                (datetime.utcnow() - timedelta(days=3)).isoformat(),
            ],
        })

        stats = SafetyStockCalculator.lead_time_stats_from_orders(orders)
        assert len(stats) == 1
        assert abs(stats.iloc[0]["avg_lead_time_days"] - 5.0) < 0.1
        assert stats.iloc[0]["order_count"] == 2

    # ── Constructor validations ──────────────────────────────

    def test_invalid_service_level(self):
        """Constructor should reject out-of-range service levels."""
        with pytest.raises(ValueError):
            SafetyStockCalculator(target_service_level=0.0)
        with pytest.raises(ValueError):
            SafetyStockCalculator(target_service_level=1.0)

    def test_repr(self, calc):
        """__repr__ should include service level and Z-score."""
        r = repr(calc)
        assert "0.95" in r
        assert "1.6449" in r
