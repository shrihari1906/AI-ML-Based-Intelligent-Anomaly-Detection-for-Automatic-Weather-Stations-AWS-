"""
Layer 3: AI/ML & Deep Learning Anomaly Detection Models.
Implements:
1. Multi-dimensional Isolation Forest for spatial point outlier detection.
2. Neural Autoencoder with per-feature Reconstruction Error decomposition for multivariate correlation breakdowns.
"""

from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import RobustScaler
import joblib
import os


FEATURE_COLUMNS = [
    "temperature",
    "humidity",
    "dew_point",
    "pressure",
    "wind_speed",
    "wind_direction",
    "solar_radiation",
    "precipitation",
    "battery_voltage"
]


class MLAnomalyDetector:
    def __init__(self, contamination: float = 0.04):
        self.feature_cols = FEATURE_COLUMNS
        self.scaler = RobustScaler()
        self.iso_forest = IsolationForest(
            n_estimators=120,
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )
        self.autoencoder = MLPRegressor(
            hidden_layer_sizes=(24, 12, 6, 12, 24),
            activation="relu",
            solver="adam",
            max_iter=300,
            tol=1e-3,
            random_state=42,
            early_stopping=True,
            n_iter_no_change=8,
        )
        
        self.is_trained = False
        self.autoencoder_threshold = 0.05
        self.autoencoder_p99 = 0.10
        self.feature_baseline_std: Dict[str, float] = {}

    def _extract_feature_vector(self, reading: Dict[str, Any]) -> np.ndarray:
        """Extract ordered feature array from reading dict, imputing missing with 0."""
        vec = []
        for col in self.feature_cols:
            val = reading.get(col)
            vec.append(float(val) if val is not None else 0.0)
        return np.array(vec, dtype=float).reshape(1, -1)

    def train(self, training_data: pd.DataFrame | List[Dict[str, Any]]):
        """Train Isolation Forest and Autoencoder on clean historical baseline data."""
        if isinstance(training_data, list):
            df = pd.DataFrame(training_data)
        else:
            df = training_data.copy()

        # Filter available features
        available_cols = [c for c in self.feature_cols if c in df.columns]
        if len(available_cols) < 4:
            raise ValueError(f"Insufficient feature columns for ML training. Expected: {self.feature_cols}")

        X_raw = df[available_cols].fillna(df[available_cols].median()).values
        
        # Fit scaler
        X_scaled = self.scaler.fit_transform(X_raw)
        
        # Fit Isolation Forest
        self.iso_forest.fit(X_scaled)
        
        # Fit Autoencoder (maps X_scaled -> X_scaled)
        self.autoencoder.fit(X_scaled, X_scaled)
        
        # Calculate baseline reconstruction errors to set adaptive thresholds
        reconstructed = self.autoencoder.predict(X_scaled)
        mse_per_sample = np.mean((X_scaled - reconstructed) ** 2, axis=1)
        
        self.autoencoder_threshold = float(np.percentile(mse_per_sample, 95.0))
        self.autoencoder_p99 = float(np.percentile(mse_per_sample, 99.0))
        if self.autoencoder_threshold < 1e-4:
            self.autoencoder_threshold = 0.05
        if self.autoencoder_p99 <= self.autoencoder_threshold:
            self.autoencoder_p99 = self.autoencoder_threshold * 2.0

        for idx, col in enumerate(available_cols):
            self.feature_baseline_std[col] = float(np.std(X_raw[:, idx])) + 1e-5

        self.is_trained = True

    def ensure_trained_with_synthetic_baseline(self):
        """Auto-train on physics simulator if no custom model loaded."""
        if not self.is_trained:
            from backend.data.simulator import WeatherSimulator
            sim = WeatherSimulator(station_id="AWS-001", time_step_sec=60)
            baseline_batch = sim.generate_batch(n_samples=1500)
            self.train(baseline_batch)

    def predict_reading(self, reading: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run inference on a single reading.
        Returns:
        - isolation_forest_score (0.0 to 1.0)
        - autoencoder_reconstruction_loss
        - per_feature_reconstruction_error & attribution percentage
        """
        if not self.is_trained:
            self.ensure_trained_with_synthetic_baseline()

        x_raw = self._extract_feature_vector(reading)
        x_scaled = self.scaler.transform(x_raw)

        # 1. Isolation Forest Inference
        # decision_function gives negative score for outliers, positive for inliers
        raw_if_score = self.iso_forest.decision_function(x_scaled)[0]
        # Map to 0 (normal) -> 1 (extreme anomaly)
        if_anomaly_prob = float(np.clip(0.5 - (raw_if_score * 2.0), 0.0, 1.0))
        is_if_outlier = bool(self.iso_forest.predict(x_scaled)[0] == -1)

        # 2. Autoencoder Reconstruction Inference
        x_recon = self.autoencoder.predict(x_scaled)
        sq_errors = (x_scaled[0] - x_recon[0]) ** 2
        total_recon_loss = float(np.mean(sq_errors))
        
        # Per-feature breakdown
        sum_err = float(np.sum(sq_errors)) + 1e-6
        feature_errors: Dict[str, float] = {}
        feature_attributions: Dict[str, float] = {}
        
        for idx, col in enumerate(self.feature_cols):
            feat_loss = float(sq_errors[idx])
            feature_errors[col] = round(feat_loss, 4)
            feature_attributions[col] = round((feat_loss / sum_err) * 100.0, 1)

        # Normalized Autoencoder Anomaly Score (0.0 to 1.0)
        ae_norm_score = float(np.clip(total_recon_loss / (self.autoencoder_p99 * 1.5), 0.0, 1.0))
        
        # Combined ML Score
        combined_ml_score = round(0.5 * if_anomaly_prob + 0.5 * ae_norm_score, 4)

        # Top offending feature
        top_culprit = max(feature_attributions.items(), key=lambda item: item[1])

        violations = []
        if combined_ml_score > 0.65 or is_if_outlier:
            violations.append({
                "tier": "AI_ML",
                "type": "MULTIVARIATE_ANOMALY",
                "sensor": top_culprit[0],
                "severity": "CRITICAL" if combined_ml_score > 0.85 else "WARNING",
                "isolation_forest_prob": round(if_anomaly_prob, 3),
                "reconstruction_loss": round(total_recon_loss, 4),
                "top_driver": f"{top_culprit[0]} ({top_culprit[1]}% contribution)",
                "message": f"ML model detected multivariate correlation breakdown driven primarily by {top_culprit[0]} (Recon loss={round(total_recon_loss, 3)}).",
            })

        return {
            "tier": "Layer 3 (AI/ML Multivariate Ensemble)",
            "status": "CRITICAL" if combined_ml_score > 0.80 else ("WARNING" if combined_ml_score > 0.55 else "PASS"),
            "anomaly_score": combined_ml_score,
            "isolation_forest": {
                "is_outlier": is_if_outlier,
                "score": round(if_anomaly_prob, 4),
            },
            "autoencoder": {
                "reconstruction_loss": round(total_recon_loss, 4),
                "threshold_p95": round(self.autoencoder_threshold, 4),
                "score": round(ae_norm_score, 4),
                "feature_errors": feature_errors,
                "feature_attributions": feature_attributions,
                "top_contributor": top_culprit[0],
            },
            "violations": violations,
            "violation_count": len(violations),
        }
