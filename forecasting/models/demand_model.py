"""
Demand Forecasting Model (LightGBM) — Quantile Regression.

Predicts hourly demand (units consumed) per hospital × resource
for the next N hours.

Trains three separate LightGBM models using Pinball (Quantile) Loss
to produce proper probabilistic forecasts:
  - P50 (median) → ``yhat``
  - P90           → ``yhat_upper``  (90th percentile)
  - P95           → ``yhat_p95``    (95th percentile for safety stock)

The P90/P95 predictions deliberately bias *against* under-stocking,
which is the correct life-safety trade-off for medical supplies.

In early stages (thin data), falls back to a simple rule-based
moving-average estimator so the pipeline always produces output.
"""

import numpy as np
import pandas as pd
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

from forecasting.config import (
    DEMAND_MODEL_PARAMS,
    QUANTILE_MODEL_PARAMS,
    ARTIFACTS_DIR,
)
from forecasting.etl.features import DEMAND_FEATURE_COLS


# Quantile targets
_Q_MEDIAN = 0.50
_Q_UPPER  = 0.90
_Q_P95    = 0.95


class DemandModel:
    """
    Two-mode demand forecaster:
      1. Rule-based (always available) — uses avg hourly consumption × surge
      2. LightGBM Quantile Regression (when enough training data exists)

    When in ``lightgbm`` mode, three models are trained independently:
      model_q50 → median prediction        (yhat)
      model_q90 → 90th-percentile upper     (yhat_upper)
      model_q95 → 95th-percentile ceiling   (yhat_p95)
    """

    MIN_TRAINING_ROWS = 100  # need at least this many rows for ML
    ARTIFACT_NAME = "demand_model.pkl"

    def __init__(self):
        self.model = None       # backward-compat: points to model_q50
        self.model_q50 = None
        self.model_q90 = None
        self.model_q95 = None
        self.mode = "rule_based"  # or "lightgbm"
        self.metrics = {}

    # ── Rule-based fallback ──────────────────────────────────

    @staticmethod
    def rule_based_predict(features: pd.DataFrame) -> pd.DataFrame:
        """
        Simple prediction: avg_hourly_consumption adjusted by surge multiplier.
        Adds noise-based confidence bands.

        When ``is_active_disaster_alert`` is set, applies a 1.30× demand boost
        to account for surge scenarios that exogenous event flags capture.
        """
        df = features.copy()

        base = df["avg_hourly_consumption"].fillna(0)
        surge = df["surge_multiplier"].fillna(1.0)
        incident_boost = np.where(df["active_incidents"] > 0, 1.15, 1.0)
        weather_boost = np.where(df["precipitation_mm"] > 5, 1.10, 1.0)

        # Exogenous disaster flag — rule-based uplift
        disaster_boost = np.where(
            df.get("is_active_disaster_alert", pd.Series(0, index=df.index)).fillna(0) > 0,
            1.30,
            1.0,
        )

        df["yhat"] = (base * surge * incident_boost * weather_boost * disaster_boost).round(4)
        df["yhat_lower"] = (df["yhat"] * 0.70).round(4)
        df["yhat_upper"] = (df["yhat"] * 1.40).round(4)
        df["yhat_p95"]   = (df["yhat"] * 1.55).round(4)

        return df

    # ── LightGBM Quantile Training ───────────────────────────

    def _train_quantile(
        self,
        alpha: float,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame,
        y_val: pd.Series,
    ) -> "lgb.LGBMRegressor":
        """Train a single LightGBM model with quantile (pinball) loss."""
        params = {**QUANTILE_MODEL_PARAMS, "objective": "quantile", "alpha": alpha}
        model = lgb.LGBMRegressor(**params)
        model.fit(
            X_train,
            y_train,
            eval_set=[(X_val, y_val)],
            callbacks=[lgb.early_stopping(20, verbose=False)],
        )
        return model

    def train(self, features: pd.DataFrame, target: pd.Series):
        """
        Train three LightGBM quantile models (P50, P90, P95).

        Uses temporal split (not random) to avoid data leakage on
        time-series data.  Falls back to rule-based otherwise.
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

        # Train three quantile heads
        print("[demand] Training quantile models (P50 / P90 / P95) ...")

        self.model_q50 = self._train_quantile(_Q_MEDIAN, X_train, y_train, X_val, y_val)
        self.model_q90 = self._train_quantile(_Q_UPPER,  X_train, y_train, X_val, y_val)
        self.model_q95 = self._train_quantile(_Q_P95,    X_train, y_train, X_val, y_val)

        # backward compat
        self.model = self.model_q50

        # Evaluate median model on the validation set
        preds_50 = self.model_q50.predict(X_val)
        preds_90 = self.model_q90.predict(X_val)
        preds_95 = self.model_q95.predict(X_val)

        self.metrics = {
            "mae": round(mean_absolute_error(y_val, preds_50), 4),
            "rmse": round(np.sqrt(mean_squared_error(y_val, preds_50)), 4),
            "pinball_q90": round(float(_pinball_loss(y_val, preds_90, _Q_UPPER)), 4),
            "pinball_q95": round(float(_pinball_loss(y_val, preds_95, _Q_P95)), 4),
            "rows_trained": len(X_train),
            "rows_validated": len(X_val),
        }
        self.mode = "lightgbm"

        print(
            f"[demand] Quantile models trained — "
            f"MAE(P50)={self.metrics['mae']}, "
            f"PB(P90)={self.metrics['pinball_q90']}, "
            f"PB(P95)={self.metrics['pinball_q95']}"
        )
        return self

    # ── Artifact persistence ─────────────────────────────────

    def save(self, path=None):
        """Persist trained quantile models to disk as .pkl artifact."""
        if not HAS_JOBLIB:
            print("[demand] joblib not available — skipping artifact save")
            return None

        path = path or (ARTIFACTS_DIR / self.ARTIFACT_NAME)
        path.parent.mkdir(parents=True, exist_ok=True)

        artifact = {
            "model": self.model_q50,       # backward compat
            "model_q50": self.model_q50,
            "model_q90": self.model_q90,
            "model_q95": self.model_q95,
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
        Load previously trained quantile models from disk.
        Falls back to a fresh rule-based instance if the artifact is
        missing or joblib is unavailable.
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
            instance.model_q50 = artifact.get("model_q50", artifact.get("model"))
            instance.model_q90 = artifact.get("model_q90")
            instance.model_q95 = artifact.get("model_q95")
            instance.model = instance.model_q50  # backward compat
            instance.mode = artifact.get("mode", "rule_based")
            instance.metrics = artifact.get("metrics", {})
            print(f"[demand] Loaded artifact from {path} (mode={instance.mode}, metrics={instance.metrics})")
        except Exception as e:
            print(f"[demand] Failed to load artifact: {e} — falling back to rule-based")

        return instance

    # ── Prediction ───────────────────────────────────────────

    def predict(self, features: pd.DataFrame) -> pd.DataFrame:
        """
        Generate demand predictions with proper quantile bands.

        Returns DataFrame with columns added:
          - ``yhat``       — P50 median prediction
          - ``yhat_lower`` — P10 lower band (= yhat × 0.75 fallback)
          - ``yhat_upper`` — P90 upper prediction (quantile model)
          - ``yhat_p95``   — P95 upper prediction (quantile model)
        """
        df = features.copy()

        if self.mode == "lightgbm" and self.model_q50 is not None:
            available_cols = [c for c in DEMAND_FEATURE_COLS if c in df.columns]
            X = df[available_cols].fillna(0)

            # Median (P50)
            preds_50 = self.model_q50.predict(X)
            df["yhat"] = np.maximum(preds_50, 0).round(4)

            # P90 upper bound
            if self.model_q90 is not None:
                preds_90 = self.model_q90.predict(X)
                df["yhat_upper"] = np.maximum(preds_90, df["yhat"]).round(4)
            else:
                df["yhat_upper"] = (df["yhat"] * 1.35).round(4)

            # P95 ceiling
            if self.model_q95 is not None:
                preds_95 = self.model_q95.predict(X)
                df["yhat_p95"] = np.maximum(preds_95, df["yhat_upper"]).round(4)
            else:
                df["yhat_p95"] = (df["yhat"] * 1.50).round(4)

            # Approximate lower band (P10) — always heuristic since
            # under-prediction is less critical for life-safety
            df["yhat_lower"] = (df["yhat"] * 0.75).round(4)
        else:
            df = self.rule_based_predict(df)

        return df


# ── Utilities ────────────────────────────────────────────────

def _pinball_loss(y_true, y_pred, alpha: float) -> float:
    """
    Pinball (quantile) loss — the proper scoring rule for quantile
    regression.  Lower is better.

      L(y, ŷ, α) = α × max(y − ŷ, 0) + (1 − α) × max(ŷ − y, 0)
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    diff = y_true - y_pred
    return float(np.mean(np.where(diff >= 0, alpha * diff, (alpha - 1) * diff)))
