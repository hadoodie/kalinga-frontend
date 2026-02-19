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

try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    HAS_JOBLIB = False

from forecasting.config import DEMAND_MODEL_PARAMS, ARTIFACTS_DIR
from forecasting.etl.features import DEMAND_FEATURE_COLS


class DemandModel:
    """
    Two-mode demand forecaster:
      1. Rule-based (always available) — uses avg hourly consumption × surge
      2. LightGBM (when enough training data exists)
    """

    MIN_TRAINING_ROWS = 100  # need at least this many rows for ML
    ARTIFACT_NAME = "demand_model.pkl"

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
        Uses temporal split (not random) to avoid data leakage on time-series.
        Falls back to rule-based otherwise.
        """
        if not HAS_LIGHTGBM or len(features) < self.MIN_TRAINING_ROWS:
            print(f"[demand] Using rule-based mode ({len(features)} rows available, need {self.MIN_TRAINING_ROWS})")
            self.mode = "rule_based"
            return self

        available_cols = [c for c in DEMAND_FEATURE_COLS if c in features.columns]
        X = features[available_cols].fillna(0)
        y = target.fillna(0)

        # Temporal split — preserve time ordering to avoid data leakage
        split_idx = int(len(X) * 0.8)
        X_train, X_val = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_val = y.iloc[:split_idx], y.iloc[split_idx:]

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
            "rows_validated": len(X_val),
        }
        self.mode = "lightgbm"

        print(f"[demand] LightGBM trained — MAE={self.metrics['mae']}, RMSE={self.metrics['rmse']}")
        return self

    # ── Artifact persistence ─────────────────────────────────

    def save(self, path=None):
        """Persist trained model to disk as .pkl artifact."""
        if not HAS_JOBLIB:
            print("[demand] joblib not available — skipping artifact save")
            return None

        path = path or (ARTIFACTS_DIR / self.ARTIFACT_NAME)
        path.parent.mkdir(parents=True, exist_ok=True)

        artifact = {
            "model": self.model,
            "mode": self.mode,
            "metrics": self.metrics,
            "feature_cols": list(DEMAND_FEATURE_COLS),
        }
        joblib.dump(artifact, path)
        print(f"[demand] Saved artifact → {path} (mode={self.mode})")
        return path

    @classmethod
    def load(cls, path=None):
        """
        Load a previously trained model from disk.
        Falls back to a fresh rule-based instance if the artifact is missing
        or joblib is unavailable.
        """
        instance = cls()
        path = path or (ARTIFACTS_DIR / cls.ARTIFACT_NAME)

        if not HAS_JOBLIB:
            print("[demand] joblib not available — starting with rule-based mode")
            return instance

        if not path.exists():
            print(f"[demand] No artifact at {path} — starting with rule-based mode")
            return instance

        try:
            artifact = joblib.load(path)
            instance.model = artifact["model"]
            instance.mode = artifact.get("mode", "rule_based")
            instance.metrics = artifact.get("metrics", {})
            print(f"[demand] Loaded artifact from {path} (mode={instance.mode}, metrics={instance.metrics})")
        except Exception as e:
            print(f"[demand] Failed to load artifact: {e} — falling back to rule-based")

        return instance

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
