"""
Intelligent Meteorological Imputation and Data Correction.
Provides physics-guided and statistical reconstruction for corrupted, anomalous, or missing telemetry points.
"""

from typing import Dict, Any, Optional, Tuple
from collections import deque
import math
from datetime import datetime

from backend.data.simulator import calculate_dew_point


class MeteorologicalImputer:
    def __init__(self, history_len: int = 15):
        self.history_len = history_len
        self.buffers: Dict[str, deque] = {
            var: deque(maxlen=history_len)
            for var in [
                "temperature", "humidity", "dew_point", "pressure",
                "wind_speed", "wind_direction", "solar_radiation",
                "precipitation", "battery_voltage"
            ]
        }

    def reset_state(self):
        for q in self.buffers.values():
            q.clear()

    def update_history(self, reading: Dict[str, Any], is_clean: bool):
        """Buffer validated clean values for reference."""
        if is_clean:
            for k, q in self.buffers.items():
                v = reading.get(k)
                if v is not None:
                    q.append(v)

    def impute_reading(
        self,
        reading: Dict[str, Any],
        corrupted_sensors: Dict[str, str], # sensor -> severity ("CRITICAL" | "WARNING")
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Produce a clean reconstructed copy of the reading with imputed estimates.
        """
        corrected = reading.copy()
        imputations: Dict[str, Any] = {}

        temp = reading.get("temperature")
        rh = reading.get("humidity")
        dp = reading.get("dew_point")

        # 1. If Dew Point is corrupted but Temp and RH are fine
        if "dew_point" in corrupted_sensors and temp is not None and rh is not None and "temperature" not in corrupted_sensors and "humidity" not in corrupted_sensors:
            est_dp = calculate_dew_point(temp, rh)
            imputations["dew_point"] = {
                "original": dp,
                "imputed": est_dp,
                "method": "Magnus-Tetens Thermodynamic Formula",
            }
            corrected["dew_point"] = est_dp

        # 2. If Humidity is corrupted but Temp and Dew Point are valid
        elif "humidity" in corrupted_sensors and temp is not None and dp is not None and dp <= temp and "temperature" not in corrupted_sensors and "dew_point" not in corrupted_sensors:
            # Invert Magnus: RH = 100 * exp((17.27 * dp)/(237.7 + dp) - (17.27 * temp)/(237.7 + temp))
            try:
                gamma_dp = (17.27 * dp) / (237.7 + dp)
                gamma_t = (17.27 * temp) / (237.7 + temp)
                est_rh = min(100.0, max(0.0, round(100.0 * math.exp(gamma_dp - gamma_t), 1)))
                imputations["humidity"] = {
                    "original": rh,
                    "imputed": est_rh,
                    "method": "Inverted Magnus Saturation Ratio",
                }
                corrected["humidity"] = est_rh
            except Exception:
                pass

        # 3. For any other sensor flagged as CRITICAL, use median of clean recent history
        for sensor, sev in corrupted_sensors.items():
            if sensor not in imputations and sev in ("CRITICAL", "WARNING"):
                q = self.buffers.get(sensor)
                orig_val = reading.get(sensor)
                if q and len(q) > 0:
                    med_val = round(float(sum(q) / len(q)), 2)
                    imputations[sensor] = {
                        "original": orig_val,
                        "imputed": med_val,
                        "method": "Rolling Historical Average",
                    }
                    corrected[sensor] = med_val

        return corrected, imputations

