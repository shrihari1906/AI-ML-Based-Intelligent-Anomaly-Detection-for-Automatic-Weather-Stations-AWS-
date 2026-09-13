"""
Physics-Based Meteorological Weather Simulator for Automatic Weather Stations (AWS).
Generates realistic multi-variable time series with diurnal cycles, physical correlations, and sensor noise.
"""

import math
import random
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import numpy as np

from backend.config import STATIONS


def calculate_dew_point(temp_c: float, humidity_pct: float) -> float:
    """
    Magnus-Tetens formula for dew point calculation.
    Physical invariant: Dew point <= Temperature in normal conditions.
    """
    # Constrain humidity to valid domain for log
    rh = max(0.1, min(100.0, humidity_pct))
    a = 17.27
    b = 237.7
    gamma = (a * temp_c) / (b + temp_c) + math.log(rh / 100.0)
    dew_point = (b * gamma) / (a - gamma)
    return round(dew_point, 2)


class WeatherSimulator:
    def __init__(self, station_id: str = "AWS-001", time_step_sec: int = 5, start_time: Optional[datetime] = None):
        self.station_id = station_id
        self.station_meta = STATIONS.get(station_id, STATIONS["AWS-001"])
        self.time_step_sec = time_step_sec
        self.current_time = start_time or datetime.now(timezone.utc)
        
        # State variables for temporal persistence / random walk
        self.base_temp = self.station_meta.get("base_temp", 25.0)
        self.base_humidity = self.station_meta.get("base_humidity", 65.0)
        self.base_pressure = self.station_meta.get("base_pressure", 1013.25)
        
        self.wind_dir_state = random.uniform(0, 360)
        self.pressure_synoptic_offset = random.uniform(-3.0, 3.0)
        self.rain_intensity = 0.0 # mm/h
        self.rain_duration_remaining = 0
        self.cumulative_rain_mm = 0.0
        self.step_count = 0

    def step(self) -> Dict[str, Any]:
        """Advance time by one step and generate synchronized weather observation."""
        self.current_time += timedelta(seconds=self.time_step_sec)
        self.step_count += 1
        
        # Solar Time representation (0.0 - 24.0)
        hour = self.current_time.hour + self.current_time.minute / 60.0 + self.current_time.second / 3600.0
        
        # 1. Solar Radiation (W/m²)
        # Daylight between 06:00 and 18:00, peak at 12:00
        if 6.0 <= hour <= 18.0:
            solar_phase = math.sin(math.pi * (hour - 6.0) / 12.0)
            max_solar = 950.0 if "Desert" not in self.station_meta["climate_zone"] else 1100.0
            solar_rad = max_solar * math.pow(solar_phase, 1.2)
            # Cloud passing noise
            cloud_cover = max(0.0, min(0.6, random.gauss(0.1, 0.15)))
            solar_rad *= (1.0 - cloud_cover)
            solar_rad += random.gauss(0, 8.0)
            solar_rad = max(0.0, round(solar_rad, 1))
        else:
            solar_rad = 0.0

        # 2. Air Temperature (°C)
        # Lagged peak at ~14:30 (14.5), lowest before dawn ~05:30 (5.5)
        temp_diurnal_phase = math.sin(math.pi * (hour - 8.5) / 12.0)
        temp_amplitude = 6.5 if "Coastal" in self.station_meta["climate_zone"] else 12.0
        temp_val = self.base_temp + (temp_amplitude * temp_diurnal_phase)
        # High solar heating adjustment & thermal noise
        temp_val += (solar_rad / 1000.0) * 1.5 + random.gauss(0, 0.15)
        temp_val = round(temp_val, 2)

        # 3. Relative Humidity (%)
        # Inversely correlated with temperature
        rh_diurnal_phase = -math.sin(math.pi * (hour - 8.5) / 12.0)
        rh_amplitude = 18.0 if "Desert" in self.station_meta["climate_zone"] else 22.0
        rh_val = self.base_humidity + (rh_amplitude * rh_diurnal_phase)
        # Evaporative noise
        rh_val -= (solar_rad / 1000.0) * 8.0 + random.gauss(0, 0.5)
        rh_val = max(5.0, min(99.0, round(rh_val, 1)))

        # 4. Dew Point (°C) derived physically
        dew_point_val = calculate_dew_point(temp_val, rh_val)

        # 5. Barometric Pressure (hPa)
        # Semi-diurnal atmospheric tide (12-hour period, peaks around 10:00 and 22:00)
        tide_phase = math.sin(4.0 * math.pi * hour / 24.0) * 1.2
        # Slow synoptic wander
        self.pressure_synoptic_offset += random.gauss(0, 0.01)
        self.pressure_synoptic_offset = max(-10.0, min(10.0, self.pressure_synoptic_offset))
        press_val = self.base_pressure + tide_phase + self.pressure_synoptic_offset + random.gauss(0, 0.05)
        press_val = round(press_val, 2)

        # 6. Wind Speed (m/s) & Direction (degrees)
        # Higher wind during afternoon convective mixing
        thermal_wind_boost = max(0.0, solar_rad / 300.0)
        base_speed = 3.0 if "Coastal" in self.station_meta["climate_zone"] else 1.8
        # Rayleigh-distributed wind speed
        wind_speed_val = base_speed + thermal_wind_boost + np.random.rayleigh(scale=1.5)
        wind_speed_val = max(0.0, round(float(wind_speed_val), 1))
        
        # Wind Direction random walk with inertia
        self.wind_dir_state = (self.wind_dir_state + random.gauss(0, 3.5)) % 360.0
        wind_dir_val = round(self.wind_dir_state, 1)

        # 7. Precipitation (mm/h) & Event Logic
        if self.rain_duration_remaining > 0:
            self.rain_duration_remaining -= 1
            # Rain cooling effect & high humidity boost
            rh_val = min(99.5, rh_val + 12.0)
            dew_point_val = calculate_dew_point(temp_val, rh_val)
            delta_rain = (self.rain_intensity / 3600.0) * self.time_step_sec
            self.cumulative_rain_mm += delta_rain
            precip_val = round(self.rain_intensity + random.gauss(0, 0.5), 2)
            precip_val = max(0.0, precip_val)
        else:
            # Random rain occurrence trigger (higher chance in coastal/tropical)
            precip_val = 0.0
            if random.random() < 0.001 and rh_val > 70.0:
                self.rain_duration_remaining = random.randint(15, 60)
                self.rain_intensity = random.uniform(2.0, 25.0)

        # 8. Battery / Solar Health (V)
        if solar_rad > 50:
            battery_val = 13.6 + (solar_rad / 1000.0) * 0.7 + random.gauss(0, 0.02)
            battery_val = min(14.4, round(battery_val, 2))
        else:
            # Night battery discharge down to 12.2V - 12.5V
            battery_val = 12.4 + random.gauss(0, 0.02)
            battery_val = round(battery_val, 2)

        return {
            "timestamp": self.current_time.isoformat(),
            "epoch_ms": int(self.current_time.timestamp() * 1000),
            "station_id": self.station_id,
            "station_name": self.station_meta["name"],
            "temperature": temp_val,
            "humidity": rh_val,
            "dew_point": dew_point_val,
            "pressure": press_val,
            "wind_speed": wind_speed_val,
            "wind_direction": wind_dir_val,
            "solar_radiation": solar_rad,
            "precipitation": precip_val,
            "cumulative_rain": round(self.cumulative_rain_mm, 2),
            "battery_voltage": battery_val,
        }

    def generate_batch(self, n_samples: int = 500, start_time: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Generate a series of continuous historical readings."""
        if start_time:
            self.current_time = start_time
        records = []
        for _ in range(n_samples):
            records.append(self.step())
        return records
