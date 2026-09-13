"""
Dataset Loader and Batch Ingestion for AWS Data.
Handles CSV upload parsing, format standardizing, and pre-packaged sample dataset generation.
"""

import io
import os
from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta

from backend.data.simulator import WeatherSimulator
from backend.data.fault_injector import FaultInjector


REQUIRED_SENSORS = [
    "temperature",
    "humidity",
    "pressure",
    "wind_speed",
    "wind_direction",
    "solar_radiation",
    "precipitation",
    "battery_voltage"
]

COLUMN_SYNONYMS = {
    "temp": "temperature",
    "air_temp": "temperature",
    "temperature_c": "temperature",
    "rh": "humidity",
    "rel_humidity": "humidity",
    "relative_humidity": "humidity",
    "press": "pressure",
    "baro_pressure": "pressure",
    "barometer": "pressure",
    "wind_spd": "wind_speed",
    "wind_dir": "wind_direction",
    "solar_rad": "solar_radiation",
    "solar": "solar_radiation",
    "rain": "precipitation",
    "rain_mm": "precipitation",
    "precip": "precipitation",
    "battery": "battery_voltage",
    "batt_v": "battery_voltage",
    "v_batt": "battery_voltage",
    "time": "timestamp",
    "datetime": "timestamp",
    "date_time": "timestamp",
}


def standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize arbitrary CSV column names to standardized AWS sensor keys."""
    rename_map = {}
    for col in df.columns:
        clean_name = str(col).strip().lower().replace(" ", "_").replace("-", "_")
        if clean_name in COLUMN_SYNONYMS:
            rename_map[col] = COLUMN_SYNONYMS[clean_name]
        elif clean_name in REQUIRED_SENSORS or clean_name in ["timestamp", "station_id", "station_name", "dew_point"]:
            rename_map[col] = clean_name
    df = df.rename(columns=rename_map)
    return df


def parse_csv_content(csv_bytes_or_str: bytes | str) -> pd.DataFrame:
    """Parse CSV text or bytes into a standardized DataFrame."""
    if isinstance(csv_bytes_or_str, bytes):
        csv_str = csv_bytes_or_str.decode("utf-8", errors="replace")
    else:
        csv_str = csv_bytes_or_str

    df = pd.read_csv(io.StringIO(csv_str))
    df = standardize_columns(df)

    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    else:
        # Generate synthetic timestamps if missing
        start = datetime.now(timezone.utc) - timedelta(minutes=len(df))
        df["timestamp"] = [start + timedelta(minutes=i) for i in range(len(df))]

    # Ensure numeric types
    for col in REQUIRED_SENSORS + ["dew_point"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if "station_id" not in df.columns:
        df["station_id"] = "AWS-UPLOAD"
    if "station_name" not in df.columns:
        df["station_name"] = "Uploaded Station Data"

    return df


def generate_benchmark_dataset(n_samples: int = 1000) -> pd.DataFrame:
    """
    Generate a rich benchmark dataset with ground-truth labeled anomalies
    (Spikes, Flatlines, Drifts, Physical Inconsistencies, Gross Limits)
    for model training, evaluation, and test visualization.
    """
    sim = WeatherSimulator(station_id="AWS-001", time_step_sec=60)
    injector = FaultInjector()
    
    # 1. Generate clean baseline data
    clean_records = sim.generate_batch(n_samples=n_samples)
    
    # 2. Add controlled anomalies across the timeline
    # Anomaly 1: Spike at index 100-102 (Temperature +18°C)
    injector.inject_fault("AWS-001", "SPIKE", "temperature", magnitude=18.0, duration_steps=3, description="Temperature spike")
    
    # Anomaly 2: Flatline at index 250-280 (Humidity stuck at 82.5%)
    # Anomaly 3: Physical Inconsistency at index 450-465 (Dew Point > Temp)
    # Anomaly 4: Severe Drift at index 650-720 (Pressure -0.3 hPa/step)
    # Anomaly 5: Gross Out of Bounds at index 850-855 (Solar = 1950 W/m²)
    
    modified_records = []
    for idx, r in enumerate(clean_records):
        if idx == 250:
            injector.inject_fault("AWS-001", "FLATLINE", "humidity", magnitude=82.5, duration_steps=30, description="Humidity sensor lockup")
        elif idx == 450:
            injector.inject_fault("AWS-001", "INCONSISTENCY", "dew_point", duration_steps=15, description="Dew point exceeding temperature")
        elif idx == 650:
            injector.inject_fault("AWS-001", "DRIFT", "pressure", magnitude=-0.15, duration_steps=60, description="Barometer calibration drift")
        elif idx == 850:
            injector.inject_fault("AWS-001", "OUT_OF_BOUNDS", "solar_radiation", magnitude=1950.0, duration_steps=5, description="Solar sensor ADC overflow")

        r_mod = injector.apply_faults(r)
        has_anomaly = len(r_mod.get("injected_faults", [])) > 0
        r_mod["ground_truth_anomaly"] = 1 if has_anomaly else 0
        r_mod["ground_truth_label"] = r_mod["injected_faults"][0]["type"] if has_anomaly else "NORMAL"
        modified_records.append(r_mod)

    df = pd.DataFrame(modified_records)
    return df


def ensure_sample_data_file():
    """Create sample_data.csv on disk if it doesn't already exist."""
    path = os.path.join(os.path.dirname(__file__), "sample_data.csv")
    if not os.path.exists(path):
        df = generate_benchmark_dataset(1200)
        # Drop dict column for clean CSV output
        df_export = df.drop(columns=["injected_faults"], errors="ignore")
        df_export.to_csv(path, index=False)
        return path
    return path
