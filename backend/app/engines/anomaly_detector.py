import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, List, Optional, Tuple
import math

class AnomalyResult:
    def __init__(
        self,
        is_anomaly: bool,
        anomaly_score: float,
        confidence: float,
        method: str,
        features: Dict[str, float],
        details: Dict[str, Any]
    ):
        self.is_anomaly = is_anomaly
        self.anomaly_score = anomaly_score
        self.confidence = confidence
        self.method = method
        self.features = features
        self.details = details

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_anomaly": self.is_anomaly,
            "anomaly_score": round(self.anomaly_score, 4),
            "confidence": round(self.confidence, 4),
            "method": self.method,
            "features": self.features,
            "details": self.details
        }


class BehavioralAnomalyEngine:
    """
    ML Behavioral Anomaly Detector for AI Agents and API Traffic.
    Uses:
    1. Scikit-learn Isolation Forest model trained on traffic feature vectors:
       [request_rate_per_min, token_length, tool_call_depth, entropy, error_ratio]
    2. Statistical z-score baseline anomaly fallback when ML model has not yet accumulated baseline
    """

    def __init__(self):
        self.feature_names = [
            "request_rate_per_min",
            "token_length",
            "tool_call_depth",
            "entropy",
            "error_rate"
        ]
        self.model: Optional[IsolationForest] = None
        self.is_trained: bool = False
        self.baseline_stats: Dict[str, Dict[str, float]] = {
            "request_rate_per_min": {"mean": 12.0, "std": 8.0},
            "token_length": {"mean": 250.0, "std": 180.0},
            "tool_call_depth": {"mean": 2.0, "std": 1.5},
            "entropy": {"mean": 3.8, "std": 0.6},
            "error_rate": {"mean": 0.02, "std": 0.05}
        }
        # Pre-fit an initial model with synthetic baseline distributions
        self._init_baseline_model()

    def _init_baseline_model(self):
        try:
            # Generate 500 baseline normal samples
            np.random.seed(42)
            n_samples = 500
            rates = np.random.normal(12.0, 5.0, n_samples).clip(1, 40)
            lengths = np.random.normal(250.0, 100.0, n_samples).clip(10, 1000)
            depths = np.random.poisson(2, n_samples).clip(0, 6)
            entropies = np.random.normal(3.8, 0.4, n_samples).clip(2.0, 4.8)
            errors = np.random.exponential(0.02, n_samples).clip(0, 0.2)

            X_baseline = np.column_stack([rates, lengths, depths, entropies, errors])
            self.model = IsolationForest(
                n_estimators=100,
                contamination=0.05,
                random_state=42
            )
            self.model.fit(X_baseline)
            self.is_trained = True
        except Exception:
            self.is_trained = False

    def train(self, feature_rows: List[List[float]]):
        """Train or fine-tune IsolationForest on historical real production metrics."""
        if not feature_rows or len(feature_rows) < 20:
            return False
        try:
            X = np.array(feature_rows)
            new_model = IsolationForest(
                n_estimators=100,
                contamination=0.05,
                random_state=42
            )
            new_model.fit(X)
            self.model = new_model
            self.is_trained = True

            # Update baseline statistics
            for i, name in enumerate(self.feature_names):
                col = X[:, i]
                self.baseline_stats[name] = {
                    "mean": float(np.mean(col)),
                    "std": max(0.001, float(np.std(col)))
                }
            return True
        except Exception:
            return False

    def score(
        self,
        request_rate_per_min: float,
        token_length: float,
        tool_call_depth: float,
        entropy: float,
        error_rate: float
    ) -> AnomalyResult:
        features_dict = {
            "request_rate_per_min": float(request_rate_per_min),
            "token_length": float(token_length),
            "tool_call_depth": float(tool_call_depth),
            "entropy": float(entropy),
            "error_rate": float(error_rate)
        }

        # 1. Isolation Forest Evaluation
        if self.is_trained and self.model is not None:
            try:
                feature_vec = np.array([[
                    request_rate_per_min,
                    token_length,
                    tool_call_depth,
                    entropy,
                    error_rate
                ]])
                # decision_function gives negative score for outliers, positive for inliers
                raw_decision = self.model.decision_function(feature_vec)[0]
                prediction = self.model.predict(feature_vec)[0] # -1 for anomaly, 1 for normal

                # Convert to 0.0 - 1.0 anomaly score (higher = more anomalous)
                # raw_decision roughly between -0.4 and +0.3
                anomaly_score = float(np.clip(0.5 - (raw_decision * 1.5), 0.0, 1.0))
                is_anomaly = bool(prediction == -1 or anomaly_score > 0.65)

                return AnomalyResult(
                    is_anomaly=is_anomaly,
                    anomaly_score=anomaly_score,
                    confidence=0.88,
                    method="isolation_forest",
                    features=features_dict,
                    details={"raw_decision_score": float(raw_decision)}
                )
            except Exception:
                pass

        # 2. Fallback: Statistical Z-Score Anomaly Detector
        z_scores = {}
        for k, v in features_dict.items():
            stat = self.baseline_stats.get(k, {"mean": 0.0, "std": 1.0})
            z = abs(v - stat["mean"]) / stat["std"]
            z_scores[k] = z

        max_z = max(z_scores.values()) if z_scores else 0.0
        is_stat_anomaly = max_z > 3.0 # > 3 sigma deviation
        norm_score = min(1.0, max_z / 5.0)

        return AnomalyResult(
            is_anomaly=is_stat_anomaly,
            anomaly_score=norm_score,
            confidence=0.75,
            method="statistical_zscore_fallback",
            features=features_dict,
            details={"z_scores": z_scores, "max_z": round(max_z, 2)}
        )

anomaly_engine = BehavioralAnomalyEngine()
