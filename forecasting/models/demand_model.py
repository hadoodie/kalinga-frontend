"""
Demand Forecasting Model (LightGBM).

Predicts hourly demand (units consumed) per hospital × resource
for the next N hours.

In early stages (thin data), falls back to a simple rule-based
moving-average estimator so the pipeline always produces output.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False

from forecasting.config import DEMAND_MODEL_PARAMS
from forecasting.etl.features import DEMAND_FEATURE_COLS


class DemandModel:
    """
    Two-mode demand forecaster:
      1. Rule-based (always available) — uses avg hourly consumption × surge
      2. LightGBM (when enough training data exists)
    """

    MIN_TRAINING_ROWS = 100  # need at least this many rows for ML

    def __init__(self):
        self.model = None
        self.mode = "rule_based"  # or "lightgbm"
        self.metrics = {}

    # ── Rule-based fallback ──────────────────────────────────

    @staticmethod
    def rule_based_predict(features: pd.DataFrame) -> pd.DataFrame:
        """
        Simple prediction: avg_hourly_consumption adjusted by surge multiplier.
        Adds noise-based confidence bands.
        """
        df = features.copy()

        base = df["avg_hourly_consumption"].fillna(0)
        surge = df["surge_multiplier"].fillna(1.0)
        incident_boost = np.where(df["active_incidents"] > 0, 1.15, 1.0)
        weather_boost = np.where(df["precipitation_mm"] > 5, 1.10, 1.0)

        df["yhat"] = (base * surge * incident_boost * weather_boost).round(4)
        df["yhat_lower"] = (df["yhat"] * 0.7).round(4)
        df["yhat_upper"] = (df["yhat"] * 1.4).round(4)

        return df

    # ── LightGBM training ────────────────────────────────────

    def train(self, features: pd.DataFrame, target: pd.Series):
        """
        Train LightGBM on historical data if enough rows exist.
        Falls back to rule-based otherwise.
        """
        if not HAS_LIGHTGBM or len(features) < self.MIN_TRAINING_ROWS:
            print(f"[demand] Using rule-based mode ({len(features)} rows available, need {self.MIN_TRAINING_ROWS})")
            self.mode = "rule_based"
            return self

        available_cols = [c for c in DEMAND_FEATURE_COLS if c in features.columns]
        X = features[available_cols].fillna(0)
        y = target.fillna(0)

        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

        self.model = lgb.LGBMRegressor(**DEMAND_MODEL_PARAMS)
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            callbacks=[lgb.early_stopping(20, verbose=False)],
        )

        preds = self.model.predict(X_val)
        self.metrics = {
            "mae": round(mean_absolute_error(y_val, preds), 4),
            "rmse": round(np.sqrt(mean_squared_error(y_val, preds)), 4),
            "rows_trained": len(X_train),
        }
        self.mode = "lightgbm"

        print(f"[demand] LightGBM trained — MAE={self.metrics['mae']}, RMSE={self.metrics['rmse']}")
        return self

    # ── Prediction ───────────────────────────────────────────

    def predict(self, features: pd.DataFrame) -> pd.DataFrame:
        """
        Generate demand predictions for future hours.
        Returns DataFrame with yhat, yhat_lower, yhat_upper columns added.
        """
        df = features.copy()

        if self.mode == "lightgbm" and self.model is not None:
            available_cols = [c for c in DEMAND_FEATURE_COLS if c in df.columns]
            X = df[available_cols].fillna(0)
            preds = self.model.predict(X)
            df["yhat"] = np.maximum(preds, 0).round(4)

            # Approximate confidence bands via quantile-like spread
            df["yhat_lower"] = (df["yhat"] * 0.75).round(4)
            df["yhat_upper"] = (df["yhat"] * 1.35).round(4)
        else:
            df = self.rule_based_predict(df)

        return df
