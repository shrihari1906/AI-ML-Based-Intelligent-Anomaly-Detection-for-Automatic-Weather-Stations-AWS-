"""
Layer 2: Statistical Dynamic Quality Control & Filters.
Implements Hampel Filter (Median Absolute Deviation), Dynamic Rolling Z-Score / IQR, and EWMA Drift Tracker.
"""

from typing import Dict, Any, List, Optional
from collections import deque
import numpy as np


SENSORS_FOR_STATISTICAL = [
    "temperature",
    "humidity",
    "pressure",
    "wind_speed",
    "solar_radiation",
    "battery_voltage"
]


class StatisticalQCDetector:
    def __init__(self, window_size: int = 30, z_thresh_warning: float = 2.8, z_thresh_critical: float = 4.2):
        self.window_size = window_size
        self.z_thresh_warning = z_thresh_warning
        self.z_thresh_critical = z_thresh_critical
        
        # Sliding buffer of recent values per sensor
        self.buffers: Dict[str, deque] = {
            s: deque(maxlen=window_size) for s in SENSORS_FOR_STATISTICAL
        }
        
        # Exponential moving averages for drift detection
        self.fast_ewma: Dict[str, float] = {}
        self.slow_ewma: Dict[str, float] = {}
        self.alpha_fast = 0.2
        self.alpha_slow = 0.03

    def reset_state(self):
        for q in self.buffers.values():
            q.clear()
        self.fast_ewma.clear()
        self.slow_ewma.clear()

    def check_reading(self, reading: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compute statistical anomaly metrics for incoming reading.
        """
        violations: List[Dict[str, Any]] = []
        sensor_scores: Dict[str, float] = {s: 0.0 for s in SENSORS_FOR_STATISTICAL}
        sensor_status: Dict[str, str] = {s: "PASS" for s in SENSORS_FOR_STATISTICAL}
        z_scores: Dict[str, float] = {}
        hampel_flags: Dict[str, bool] = {}

        for sensor in SENSORS_FOR_STATISTICAL:
            val = reading.get(sensor)
            if val is None:
                continue

            q = self.buffers[sensor]
            
            # Update EWMA for drift
            if sensor not in self.fast_ewma:
                self.fast_ewma[sensor] = val
                self.slow_ewma[sensor] = val
            else:
                self.fast_ewma[sensor] = self.alpha_fast * val + (1 - self.alpha_fast) * self.fast_ewma[sensor]
                self.slow_ewma[sensor] = self.alpha_slow * val + (1 - self.alpha_slow) * self.slow_ewma[sensor]

            # Need sufficient history for meaningful statistical test
            if len(q) >= 10:
                arr = np.array(list(q), dtype=float)
                mean_val = float(np.mean(arr))
                std_val = float(np.std(arr))
                median_val = float(np.median(arr))
                
                # Median Absolute Deviation (MAD) for Hampel Filter
                mad = float(np.median(np.abs(arr - median_val)))
                scale_mad = 1.4826 * mad
                
                # 1. Hampel Filter Check
                diff_median = abs(val - median_val)
                is_hampel_outlier = False
                if scale_mad > 1e-4:
                    hampel_ratio = diff_median / scale_mad
                    if hampel_ratio > 3.0:
                        is_hampel_outlier = True
                        hampel_flags[sensor] = True
                        violations.append({
                            "tier": "STATISTICAL",
                            "type": "HAMPEL_OUTLIER",
                            "sensor": sensor,
                            "severity": "CRITICAL" if hampel_ratio > 4.5 else "WARNING",
                            "hampel_ratio": round(hampel_ratio, 2),
                            "message": f"Hampel filter flagged {sensor}: value {val} deviates {round(hampel_ratio, 1)}x MAD from median {round(median_val, 2)}.",
                        })
                        score = min(1.0, (hampel_ratio - 1.0) / 4.0)
                        sensor_scores[sensor] = max(sensor_scores[sensor], score)
                
                # 2. Dynamic Z-Score Check
                if std_val > 1e-4:
                    z = abs(val - mean_val) / std_val
                    z_scores[sensor] = round(float(z), 2)
                    if z >= self.z_thresh_warning:
                        sev = "CRITICAL" if z >= self.z_thresh_critical else "WARNING"
                        violations.append({
                            "tier": "STATISTICAL",
                            "type": "Z_SCORE_ANOMALY",
                            "sensor": sensor,
                            "severity": sev,
                            "z_score": round(float(z), 2),
                            "rolling_mean": round(mean_val, 2),
                            "rolling_std": round(std_val, 2),
                            "message": f"Statistical outlier in {sensor}: Z-score is {round(z, 2)}σ above normal variance (mean={round(mean_val, 2)}).",
                        })
                        score = min(1.0, z / 5.0)
                        sensor_scores[sensor] = max(sensor_scores[sensor], score)
                        sensor_status[sensor] = sev

                # 3. EWMA Calibration Drift Detection (slow divergence)
                drift_gap = abs(self.fast_ewma[sensor] - self.slow_ewma[sensor])
                # Skip solar at dawn/dusk where natural fast shift happens
                if sensor != "solar_radiation" and std_val > 1e-4:
                    if drift_gap > (std_val * 2.5) and len(q) >= 25:
                        violations.append({
                            "tier": "STATISTICAL",
                            "type": "TREND_DRIFT",
                            "sensor": sensor,
                            "severity": "WARNING",
                            "drift_gap": round(drift_gap, 2),
                            "message": f"Possible calibration drift on {sensor}: short-term EWMA diverges by {round(drift_gap, 2)} from baseline.",
                        })
                        sensor_scores[sensor] = max(sensor_scores[sensor], 0.65)
                        if sensor_status[sensor] == "PASS":
                            sensor_status[sensor] = "WARNING"
            else:
                z_scores[sensor] = 0.0

            # Append current to history buffer
            q.append(val)

        overall_score = max(sensor_scores.values()) if sensor_scores else 0.0
        has_critical = any(v["severity"] == "CRITICAL" for v in violations)
        has_warning = any(v["severity"] == "WARNING" for v in violations)
        tier_status = "CRITICAL" if has_critical else ("WARNING" if has_warning else "PASS")

        return {
            "tier": "Layer 2 (Statistical & Dynamic Filters)",
            "status": tier_status,
            "anomaly_score": round(float(overall_score), 4),
            "sensor_scores": {k: round(v, 4) for k, v in sensor_scores.items()},
            "sensor_status": sensor_status,
            "z_scores": z_scores,
            "violations": violations,
            "violation_count": len(violations),
        }
