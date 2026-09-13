"""
Configuration and WMO Meteorological Quality Control Standards.
"""

from typing import Dict, Any

# Station Profiles matching the map in the UI
STATIONS = {
    "AWS-001": {
        "id": "AWS-001",
        "name": "Bengaluru Urban AWS",
        "location": "Bengaluru Urban, Karnataka (12.97° N, 77.59° E)",
        "lat": 12.9716,
        "lon": 77.5946,
        "elevation_m": 920,
        "climate_zone": "Deccan Semi-Arid Plateau",
        "status": "ONLINE",
        "base_temp": 27.2,
        "base_humidity": 60.0,
        "base_pressure": 915.0,
    },
    "AWS-002": {
        "id": "AWS-002",
        "name": "Mangaluru Coastal AWS",
        "location": "Mangaluru Coastal, Karnataka (12.91° N, 74.85° E)",
        "lat": 12.9141,
        "lon": 74.8560,
        "elevation_m": 14,
        "climate_zone": "Tropical Coastal Monsoon",
        "status": "ONLINE",
        "base_temp": 29.5,
        "base_humidity": 78.0,
        "base_pressure": 1011.0,
    },
    "AWS-003": {
        "id": "AWS-003",
        "name": "Mysuru Central AWS",
        "location": "Mysuru Central, Karnataka (12.30° N, 76.64° E)",
        "lat": 12.2958,
        "lon": 76.6394,
        "elevation_m": 763,
        "climate_zone": "Tropical Semi-Arid",
        "status": "ONLINE",
        "base_temp": 28.5,
        "base_humidity": 64.0,
        "base_pressure": 932.0,
    },
    "AWS-004": {
        "id": "AWS-004",
        "name": "Madikeri Coorg Highland AWS",
        "location": "Madikeri, Coorg, Karnataka (12.42° N, 75.74° E)",
        "lat": 12.4244,
        "lon": 75.7382,
        "elevation_m": 1150,
        "climate_zone": "Western Ghats Montane",
        "status": "ONLINE",
        "base_temp": 20.8,
        "base_humidity": 82.0,
        "base_pressure": 885.0,
    },
    "AWS-005": {
        "id": "AWS-005",
        "name": "Dharwad Inland AWS",
        "location": "Dharwad - Hubballi, Karnataka (15.46° N, 75.01° E)",
        "lat": 15.4589,
        "lon": 75.0078,
        "elevation_m": 750,
        "climate_zone": "Northern Inland Basin",
        "status": "ONLINE",
        "base_temp": 28.0,
        "base_humidity": 58.0,
        "base_pressure": 935.0,
    },
}

# WMO Physical Plausible & Climatological Limits (Gross Limits)
WMO_LIMITS: Dict[str, Dict[str, float]] = {
    "temperature": {
        "min": -40.0,      # °C (Standard surface station lower limit)
        "max": 60.0,       # °C
        "unit": "°C",
        "max_step_1min": 4.0,   # Max allowable change in 1 minute
        "max_step_1hr": 10.0,   # Max allowable change in 1 hour
        "min_variance_window": 0.001, # Variance threshold for flatline
        "flatline_max_steps": 12,     # Steps before flatline alert
    },
    "dew_point": {
        "min": -50.0,      # °C
        "max": 40.0,       # °C
        "unit": "°C",
        "max_step_1min": 5.0,
        "max_step_1hr": 15.0,
        "min_variance_window": 0.001,
        "flatline_max_steps": 15,
    },
    "humidity": {
        "min": 0.0,        # %
        "max": 100.0,      # % (allowing up to 102% for sensor tolerance)
        "unit": "%",
        "max_step_1min": 10.0,
        "max_step_1hr": 35.0,
        "min_variance_window": 0.001,
        "flatline_max_steps": 15,
    },
    "pressure": {
        "min": 700.0,      # hPa (accounting for elevated stations)
        "max": 1080.0,     # hPa
        "unit": "hPa",
        "max_step_1min": 2.0,
        "max_step_1hr": 6.0,
        "min_variance_window": 0.0005,
        "flatline_max_steps": 20,
    },
    "wind_speed": {
        "min": 0.0,        # m/s
        "max": 75.0,       # m/s (~270 km/h hurricane/cyclone category 5)
        "unit": "m/s",
        "max_step_1min": 15.0,
        "max_step_1hr": 30.0,
        "min_variance_window": 0.0,
        "flatline_max_steps": 30,
    },
    "wind_direction": {
        "min": 0.0,        # Degrees
        "max": 360.0,      # Degrees
        "unit": "°",
        "max_step_1min": 360.0,
        "max_step_1hr": 360.0,
        "min_variance_window": 0.0,
        "flatline_max_steps": 40,
    },
    "solar_radiation": {
        "min": 0.0,        # W/m²
        "max": 1400.0,     # W/m² (Solar constant is ~1361 W/m²)
        "unit": "W/m²",
        "max_step_1min": 350.0,
        "max_step_1hr": 900.0,
        "min_variance_window": 0.0,
        "flatline_max_steps": 30,
    },
    "precipitation": {
        "min": 0.0,        # mm/h or mm accumulation
        "max": 250.0,      # mm/h (Extreme tropical cloudburst ceiling)
        "unit": "mm",
        "max_step_1min": 25.0,
        "max_step_1hr": 150.0,
        "min_variance_window": 0.0,
        "flatline_max_steps": 100,
    },
    "battery_voltage": {
        "min": 10.5,       # V (12V Lead-Acid / LiFePO4 low-voltage cutoff)
        "max": 15.5,       # V (Solar charging regulator max)
        "unit": "V",
        "max_step_1min": 1.5,
        "max_step_1hr": 3.0,
        "min_variance_window": 0.0001,
        "flatline_max_steps": 60,
    },
}

# Quality Control Flag Standards (Aligned with WMO Guide to Data Management)
QC_FLAGS = {
    0: {"code": "GOOD", "label": "Pass / Valid", "severity": "normal", "color": "#10b981"},
    1: {"code": "SUSPECT", "label": "Suspect / Minor Deviation", "severity": "low", "color": "#f59e0b"},
    2: {"code": "WARNING", "label": "Warning / Statistical Anomaly", "severity": "medium", "color": "#f97316"},
    3: {"code": "CRITICAL", "label": "Erroneous / Critical Failure", "severity": "critical", "color": "#ef4444"},
    4: {"code": "IMPUTED", "label": "Estimated / Corrected Value", "severity": "info", "color": "#3b82f6"},
}

# AI/ML Model Hyperparameters
ML_CONFIG: Dict[str, Any] = {
    "isolation_forest": {
        "contamination": 0.05,
        "n_estimators": 100,
        "random_state": 42,
    },
    "autoencoder": {
        "hidden_layers": [16, 8, 4, 8, 16],
        "learning_rate": 0.005,
        "epochs": 40,
        "batch_size": 32,
        "loss_threshold_percentile": 96.0,
    },
    "ensemble": {
        "wmo_weight": 0.40,
        "statistical_weight": 0.25,
        "ml_weight": 0.35,
    }
}
