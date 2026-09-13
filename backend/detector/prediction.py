"""
AI/ML Predictive Sensor Fault Detection & Failure Forecasting Engine.
Forecasts sensor trajectories and estimates time-to-failure / threshold breach risk before faults occur.
"""

from typing import Dict, Any, List, Optional
import numpy as np
from collections import deque

from backend.config import WMO_LIMITS


class SensorFaultPredictor:
    def __init__(self, history_len: int = 40):
        self.history_len = history_len
        self.sensor_histories: Dict[str, deque] = {
            s: deque(maxlen=history_len)
            for s in WMO_LIMITS
        }
        self.seed_baseline()

    def seed_baseline(self):
        """Seed predictor buffer with clean baseline points so predictions are immediately available."""
        try:
            from backend.data.simulator import WeatherSimulator
            sim = WeatherSimulator(station_id="AWS-001")
            for _ in range(25):
                self.add_reading(sim.step())
        except Exception:
            pass

    def add_reading(self, reading: Dict[str, Any]):
        """Record latest reading into predictive memory buffer."""
        for sensor in WMO_LIMITS:
            val = reading.get(sensor)
            if val is not None:
                self.sensor_histories[sensor].append(float(val))

    def predict_sensor_fault_risk(self, sensor: str, horizon_steps: int = 15) -> Dict[str, Any]:
        """
        Estimate drift slope, future trajectory, and breach risk.
        Returns:
        - trend_slope (delta / step)
        - forecasted_value at horizon
        - estimated_steps_to_failure
        - fault_risk_score (0.0 to 1.0)
        - early_warning_alert (bool)
        """
        q = self.sensor_histories.get(sensor)
        if not q or len(q) < 10:
            return {
                "sensor": sensor,
                "status": "INSUFFICIENT_DATA",
                "risk_score": 0.0,
                "early_warning": False,
                "forecast": [],
            }

        y = np.array(list(q), dtype=float)
        x = np.arange(len(y))

        # Linear regression fit for drift trajectory
        slope, intercept = np.polyfit(x, y, 1)
        
        # Forecast future points
        future_x = np.arange(len(y), len(y) + horizon_steps)
        forecast_y = (slope * future_x + intercept).tolist()
        
        current_val = y[-1]
        forecast_end = forecast_y[-1]
        
        limits = WMO_LIMITS.get(sensor, {"min": -50, "max": 100})
        v_min = limits["min"]
        v_max = limits["max"]

        # Calculate steps to breach limit if slope continues
        steps_to_fail = None
        if slope > 0.01 and forecast_end > current_val:
            steps_to_fail = int((v_max - current_val) / slope) if slope != 0 else None
        elif slope < -0.01 and forecast_end < current_val:
            steps_to_fail = int((current_val - v_min) / abs(slope)) if slope != 0 else None

        # Compute Risk Probability
        risk_score = 0.0
        if steps_to_fail is not None and steps_to_fail > 0:
            if steps_to_fail < 30:
                risk_score = 0.90
            elif steps_to_fail < 100:
                risk_score = 0.65
            elif steps_to_fail < 300:
                risk_score = 0.35
            else:
                risk_score = 0.10

        return {
            "sensor": sensor,
            "current_value": round(float(current_val), 2),
            "trend_slope": round(float(slope), 4),
            "forecast_end_value": round(float(forecast_end), 2),
            "forecast_trajectory": [round(float(v), 2) for v in forecast_y],
            "estimated_steps_to_failure": steps_to_fail,
            "risk_score": round(float(risk_score), 3),
            "early_warning": risk_score >= 0.60,
            "recommendation": f"Potential calibration drift detected on {sensor}. Trend slope is {round(slope, 3)} units/step." if risk_score >= 0.60 else "Sensor trajectory within normal variance.",
        }

    def predict_all(self, horizon_steps: int = 15) -> Dict[str, Any]:
        """Run predictive health assessment across all meteorological sensors."""
        results = {}
        for sensor in WMO_LIMITS:
            results[sensor] = self.predict_sensor_fault_risk(sensor, horizon_steps)
        
        max_risk = max((res["risk_score"] for res in results.values()), default=0.0)
        return {
            "overall_system_risk": round(float(max_risk), 3),
            "sensors": results
        }


# Global instance
fault_predictor = SensorFaultPredictor()
