"""
Inventory Risk Model (Logistic Regression / Rule-based).

Predicts the probability of stockout per hospital × resource
over the next N hours.

In early stages, uses a deterministic rule-based formula derived
from the ResourceResilienceConfig survival-hours logic already
in the Laravel backend.
"""

import numpy as np
import pandas as pd

try:
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

from forecasting.etl.features import RISK_FEATURE_COLS
from forecasting.config import RISK_THRESHOLD_HIGH, RISK_THRESHOLD_CRITICAL


class RiskModel:
    """
    Two-mode risk scorer:
      1. Rule-based (always available) — survival-hours heuristic
      2. Logistic Regression (when labeled data exists)
    """

    MIN_TRAINING_ROWS = 80

    def __init__(self):
        self.model = None
        self.scaler = None
        self.mode = "rule_based"
        self.metrics = {}

    # ── Rule-based fallback ──────────────────────────────────

    @staticmethod
    def rule_based_predict(features: pd.DataFrame, demand_yhat: pd.Series) -> pd.DataFrame:
        """
        Heuristic risk scoring:
          projected_stock = current_quantity - cumulative_demand_over_horizon
          risk_prob derived from stock_ratio and projected_stock
        """
        df = features.copy()

        current_qty = df["current_quantity"].fillna(0)
        demand = demand_yhat.fillna(0)
        horizon = df["horizon_h"].fillna(1)

        # Cumulative demand = yhat × horizon (simplified — in production, sum over hours)
        cumulative_demand = demand * horizon
        projected = (current_qty - cumulative_demand).clip(lower=0)

        df["projected_stock"] = projected.round(4)

        # Days until stockout = projected / daily consumption rate
        daily_usage = df["normal_daily_usage"].fillna(0).replace(0, np.nan)
        surge = df["surge_multiplier"].fillna(1.0)
        effective_daily = daily_usage * surge
        df["days_until_stockout"] = np.where(
            effective_daily > 0,
            (projected / effective_daily).round(2),
            999.0,
        )

        # Risk probability: multi-factor sigmoid with full [0,1] range
        stock_ratio = df["stock_ratio"].fillna(999)
        survival = df["current_survival_hours"].fillna(999)
        is_crit = df["is_critical"].astype(float) if "is_critical" in df.columns else 0.0
        blockades = df["active_blockades"].fillna(0)
        precip = df["precipitation_mm"].fillna(0)
        incidents = df["active_incidents"].fillna(0)

        # Primary signals — stock + survival ALONE can drive to critical
        stock_sig = 1 / (1 + np.exp(6 * (stock_ratio - 0.5)))     # 0→0.95, 0.5→0.50
        survival_sig = 1 / (1 + np.exp(0.06 * (survival - 24)))   # 0→0.81, 24→0.50, 72→0.05

        primary = 0.60 * stock_sig + 0.40 * survival_sig  # max ~0.89

        # Situational boosters (additive, capped at 0.15)
        boost = np.minimum(
            0.05 * np.where(incidents > 0, 1.0, 0.0)
            + 0.04 * np.minimum(precip / 30.0, 1.0)
            + 0.03 * is_crit
            + 0.03 * np.where(blockades > 0, 1.0, 0.0),
            0.15,
        )

        risk_signal = (primary + boost).clip(0, 1)

        df["risk_prob"] = risk_signal.clip(0, 1).round(4)

        # Categorize
        df["risk_level"] = pd.cut(
            df["risk_prob"],
            bins=[-0.01, 0.35, RISK_THRESHOLD_HIGH, RISK_THRESHOLD_CRITICAL, 1.01],
            labels=["low", "medium", "high", "critical"],
        )

        # Risk factors (human-readable)
        df["risk_factors"] = df.apply(
            lambda row: _build_risk_factors(row), axis=1
        )

        return df

    # ── Logistic Regression training ─────────────────────────

    def train(self, features: pd.DataFrame, labels: pd.Series):
        """
        Train logistic regression on historical stockout events.
        labels: binary (1 = stockout occurred, 0 = no stockout)
        """
        if not HAS_SKLEARN or len(features) < self.MIN_TRAINING_ROWS:
            print(f"[risk] Using rule-based mode ({len(features)} rows, need {self.MIN_TRAINING_ROWS})")
            self.mode = "rule_based"
            return self

        available_cols = [c for c in RISK_FEATURE_COLS if c in features.columns]
        X = features[available_cols].fillna(0)
        y = labels.fillna(0).astype(int)

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.model = LogisticRegression(max_iter=500, random_state=42, class_weight="balanced")
        self.model.fit(X_scaled, y)

        self.mode = "logistic"
        score = self.model.score(X_scaled, y)
        self.metrics = {"accuracy": round(score, 4), "rows_trained": len(X)}
        print(f"[risk] Logistic regression trained — accuracy={self.metrics['accuracy']}")
        return self

    # ── Prediction ───────────────────────────────────────────

    def predict(self, features: pd.DataFrame, demand_yhat: pd.Series) -> pd.DataFrame:
        """
        Generate risk predictions.
        Requires demand_yhat (output from DemandModel) as input.
        """
        if self.mode == "logistic" and self.model is not None:
            df = features.copy()
            available_cols = [c for c in RISK_FEATURE_COLS if c in df.columns]
            X = df[available_cols].fillna(0)
            X_scaled = self.scaler.transform(X)

            probs = self.model.predict_proba(X_scaled)
            # probability of class 1 (stockout)
            df["risk_prob"] = probs[:, 1].round(4) if probs.shape[1] > 1 else 0.0

            df["risk_level"] = pd.cut(
                df["risk_prob"],
                bins=[-0.01, 0.35, RISK_THRESHOLD_HIGH, RISK_THRESHOLD_CRITICAL, 1.01],
                labels=["low", "medium", "high", "critical"],
            )

            # Still compute projected stock from demand
            current_qty = df["current_quantity"].fillna(0)
            df["projected_stock"] = (current_qty - demand_yhat * df["horizon_h"]).clip(lower=0).round(4)
            daily_usage = df["normal_daily_usage"].fillna(0).replace(0, np.nan)
            surge = df["surge_multiplier"].fillna(1.0)
            effective_daily = daily_usage * surge
            df["days_until_stockout"] = np.where(
                effective_daily > 0,
                (df["projected_stock"] / effective_daily).round(2),
                999.0,
            )
            df["risk_factors"] = df.apply(lambda row: _build_risk_factors(row), axis=1)
            return df
        else:
            return self.rule_based_predict(features, demand_yhat)


def _build_risk_factors(row) -> dict:
    """Build a human-readable dict of what's driving risk for this row."""
    factors = {}
    if row.get("stock_ratio", 999) < 1.0:
        factors["low_stock"] = f"Stock at {row.get('stock_ratio', 0):.0%} of minimum"
    if row.get("current_survival_hours", 999) < 72:
        factors["low_survival"] = f"Only {row.get('current_survival_hours', 0):.0f}h survival"
    if row.get("active_incidents", 0) > 0:
        factors["incidents"] = f"{int(row.get('active_incidents', 0))} active incidents"
    if row.get("precipitation_mm", 0) > 10:
        factors["weather"] = f"{row.get('precipitation_mm', 0):.0f}mm precipitation"
    if row.get("active_blockades", 0) > 0:
        factors["blockades"] = f"{int(row.get('active_blockades', 0))} active road blockades"
    if row.get("is_critical", False):
        factors["critical_item"] = "HSI-critical resource"
    return factors
