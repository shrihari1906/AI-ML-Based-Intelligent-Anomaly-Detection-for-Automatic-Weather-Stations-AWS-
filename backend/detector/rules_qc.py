"""
Layer 1: Deterministic WMO-Standard Rule-Based Quality Control (QC).
Implements Range Limits, Rate-of-Change (Step), Persistence (Flatline), and Internal Physical Consistency checks.
"""

from typing import Dict, Any, List, Optional
from collections import deque
import math
from datetime import datetime

from backend.config import WMO_LIMITS


class WMORulesDetector:
    def __init__(self, station_id: str = "AWS-001"):
        self.station_id = station_id
        self.limits = WMO_LIMITS
        
        # State tracking for sequential data
        self.last_reading: Optional[Dict[str, Any]] = None
        
        # Sliding windows for persistence/flatline check (per variable)
        self.history_windows: Dict[str, deque] = {
            var: deque(maxlen=self.limits[var].get("flatline_max_steps", 15))
            for var in self.limits
        }

    def reset_state(self):
        """Reset historical buffers."""
        self.last_reading = None
        for q in self.history_windows.values():
            q.clear()

    def check_reading(self, reading: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate a single telemetry reading against WMO QC rules.
        Returns detailed check results, per-sensor flags, and violation reasons.
        """
        violations: List[Dict[str, Any]] = []
        sensor_scores: Dict[str, float] = {var: 0.0 for var in list(self.limits.keys()) + ["dew_point"]}
        sensor_status: Dict[str, str] = {var: "PASS" for var in list(self.limits.keys()) + ["dew_point"]}

        # 1. Gross / Range Limits Check
        for var, config in self.limits.items():
            val = reading.get(var)
            if val is None:
                violations.append({
                    "tier": "WMO_RULE",
                    "type": "MISSING_DATA",
                    "sensor": var,
                    "severity": "CRITICAL",
                    "message": f"Sensor {var} telemetry is missing or null.",
                })
                sensor_scores[var] = max(sensor_scores[var], 0.95)
                sensor_status[var] = "CRITICAL"
                continue

            # Min / Max Bound Check
            if val < config["min"] or val > config["max"]:
                violations.append({
                    "tier": "WMO_RULE",
                    "type": "OUT_OF_BOUNDS",
                    "sensor": var,
                    "severity": "CRITICAL",
                    "value": val,
                    "bounds": [config["min"], config["max"]],
                    "message": f"{var.replace('_', ' ').title()} value ({val} {config['unit']}) exceeds WMO physical range [{config['min']}, {config['max']}].",
                })
                sensor_scores[var] = max(sensor_scores[var], 1.0)
                sensor_status[var] = "CRITICAL"

            # 2. Persistence / Flatline Check
            q = self.history_windows[var]
            q.append(val)
            if len(q) >= config.get("flatline_max_steps", 15):
                # Check if all values in window are identical or variance is below minimal physical threshold
                variance = float(sum((x - (sum(q)/len(q)))**2 for x in q) / len(q))
                # Skip flatline check for rain or night solar radiation when 0 is normal
                skip_flatline = (var == "precipitation" and all(x == 0.0 for x in q)) or \
                                (var == "solar_radiation" and all(x == 0.0 for x in q)) or \
                                (var == "wind_speed" and all(x == 0.0 for x in q))
                
                if not skip_flatline and variance <= config.get("min_variance_window", 0.0001):
                    violations.append({
                        "tier": "WMO_RULE",
                        "type": "FLATLINE",
                        "sensor": var,
                        "severity": "WARNING",
                        "variance": round(variance, 6),
                        "message": f"{var.replace('_', ' ').title()} sensor locked up (flatlined at {val} for {len(q)} consecutive steps).",
                    })
                    sensor_scores[var] = max(sensor_scores[var], 0.85)
                    if sensor_status[var] == "PASS":
                        sensor_status[var] = "WARNING"

        # 3. Rate of Change / Step Check
        if self.last_reading is not None:
            for var, config in self.limits.items():
                curr_val = reading.get(var)
                prev_val = self.last_reading.get(var)
                if curr_val is not None and prev_val is not None:
                    step_delta = abs(curr_val - prev_val)
                    max_allowed = config.get("max_step_1min", 10.0)
                    if step_delta > max_allowed:
                        violations.append({
                            "tier": "WMO_RULE",
                            "type": "SPIKE_STEP",
                            "sensor": var,
                            "severity": "CRITICAL" if step_delta > max_allowed * 2 else "WARNING",
                            "delta": round(step_delta, 2),
                            "max_allowed": max_allowed,
                            "message": f"Step jump on {var}: changed by {round(step_delta, 2)} {config['unit']} in 1 step (max allowed: {max_allowed}).",
                        })
                        score = min(1.0, step_delta / (max_allowed * 1.5))
                        sensor_scores[var] = max(sensor_scores[var], score)
                        if sensor_status[var] != "CRITICAL":
                            sensor_status[var] = "CRITICAL" if step_delta > max_allowed * 2 else "WARNING"

        # 4. Internal Physical Consistency Checks
        temp = reading.get("temperature")
        dew_point = reading.get("dew_point")
        humidity = reading.get("humidity")
        solar = reading.get("solar_radiation")
        precip = reading.get("precipitation")
        
        # Check A: Dew Point <= Temperature
        if temp is not None and dew_point is not None:
            if dew_point > (temp + 0.3): # 0.3°C tolerance for slight instrumentation noise
                violations.append({
                    "tier": "WMO_RULE",
                    "type": "PHYSICAL_INCONSISTENCY",
                    "sensor": "dew_point",
                    "severity": "CRITICAL",
                    "message": f"Thermodynamic violation: Dew point ({dew_point}°C) exceeds ambient air temperature ({temp}°C).",
                })
                sensor_scores["dew_point"] = max(sensor_scores["dew_point"], 0.95)
                sensor_scores["temperature"] = max(sensor_scores["temperature"], 0.5)
                sensor_status["dew_point"] = "CRITICAL"

        # Check B: Solar radiation at night
        ts_str = reading.get("timestamp")
        if ts_str and solar is not None:
            try:
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                hour = dt.hour + dt.minute / 60.0
                if (hour < 5.0 or hour > 19.5) and solar > 5.0:
                    violations.append({
                        "tier": "WMO_RULE",
                        "type": "PHYSICAL_INCONSISTENCY",
                        "sensor": "solar_radiation",
                        "severity": "WARNING",
                        "message": f"Nighttime solar radiation anomaly: {solar} W/m² recorded at hour {round(hour, 1)}.",
                    })
                    sensor_scores["solar_radiation"] = max(sensor_scores["solar_radiation"], 0.85)
                    if sensor_status["solar_radiation"] == "PASS":
                        sensor_status["solar_radiation"] = "WARNING"
            except Exception:
                pass

        # Check C: Heavy Rain with Extremely Low Humidity
        if precip is not None and humidity is not None:
            if precip > 5.0 and humidity < 35.0:
                violations.append({
                    "tier": "WMO_RULE",
                    "type": "PHYSICAL_INCONSISTENCY",
                    "sensor": "precipitation",
                    "severity": "WARNING",
                    "message": f"Contradictory meteorology: Heavy rain ({precip} mm/h) detected while relative humidity is very dry ({humidity}%).",
                })
                sensor_scores["precipitation"] = max(sensor_scores["precipitation"], 0.75)
                sensor_scores["humidity"] = max(sensor_scores["humidity"], 0.60)
                if sensor_status["precipitation"] == "PASS":
                    sensor_status["precipitation"] = "WARNING"

        # Update last reading state
        self.last_reading = reading.copy()

        overall_score = max(sensor_scores.values()) if sensor_scores else 0.0
        has_critical = any(v["severity"] == "CRITICAL" for v in violations)
        has_warning = any(v["severity"] == "WARNING" for v in violations)

        tier_status = "CRITICAL" if has_critical else ("WARNING" if has_warning else "PASS")

        return {
            "tier": "Layer 1 (WMO Rules QC)",
            "status": tier_status,
            "anomaly_score": round(float(overall_score), 4),
            "sensor_scores": {k: round(v, 4) for k, v in sensor_scores.items()},
            "sensor_status": sensor_status,
            "violations": violations,
            "violation_count": len(violations),
        }
