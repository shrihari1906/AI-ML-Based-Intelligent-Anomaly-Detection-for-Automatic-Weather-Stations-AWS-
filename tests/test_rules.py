"""
Unit tests for Layer 1 WMO Rules QC.
"""

import pytest
from backend.detector.rules_qc import WMORulesDetector


def test_wmo_gross_limits():
    detector = WMORulesDetector()
    
    # 1. Normal reading
    clean_reading = {
        "timestamp": "2026-09-05T12:00:00Z",
        "temperature": 28.5,
        "humidity": 65.0,
        "dew_point": 21.0,
        "pressure": 1013.2,
        "wind_speed": 4.2,
        "wind_direction": 180.0,
        "solar_radiation": 750.0,
        "precipitation": 0.0,
        "battery_voltage": 13.8,
    }
    res = detector.check_reading(clean_reading)
    assert res["status"] == "PASS"
    assert res["violation_count"] == 0

    # 2. Out of bounds reading (Temperature = 75°C)
    extreme_reading = clean_reading.copy()
    extreme_reading["temperature"] = 75.0
    res_extreme = detector.check_reading(extreme_reading)
    assert res_extreme["status"] == "CRITICAL"
    assert any(v["type"] == "OUT_OF_BOUNDS" and v["sensor"] == "temperature" for v in res_extreme["violations"])


def test_wmo_rate_of_change_spike():
    detector = WMORulesDetector()
    
    r1 = {
        "timestamp": "2026-09-05T12:00:00Z",
        "temperature": 25.0,
        "humidity": 60.0,
        "dew_point": 16.5,
        "pressure": 1012.0,
        "wind_speed": 3.0,
        "wind_direction": 90.0,
        "solar_radiation": 600.0,
        "precipitation": 0.0,
        "battery_voltage": 13.5,
    }
    detector.check_reading(r1)
    
    # Sudden jump from 25°C to 42°C (+17°C in 1 step)
    r2 = r1.copy()
    r2["temperature"] = 42.0
    res2 = detector.check_reading(r2)
    assert res2["status"] in ("CRITICAL", "WARNING")
    assert any(v["type"] == "SPIKE_STEP" for v in res2["violations"])


def test_wmo_physical_inconsistency_dew_point():
    detector = WMORulesDetector()
    
    # Dew point > temperature is thermodynamically impossible
    r_bad = {
        "timestamp": "2026-09-05T12:00:00Z",
        "temperature": 22.0,
        "humidity": 95.0,
        "dew_point": 26.5, # Impossible!
        "pressure": 1012.0,
        "wind_speed": 2.0,
        "wind_direction": 120.0,
        "solar_radiation": 400.0,
        "precipitation": 0.0,
        "battery_voltage": 13.5,
    }
    res = detector.check_reading(r_bad)
    assert res["status"] == "CRITICAL"
    assert any(v["type"] == "PHYSICAL_INCONSISTENCY" for v in res["violations"])


def test_wmo_flatline():
    detector = WMORulesDetector()
    r = {
        "timestamp": "2026-09-05T12:00:00Z",
        "temperature": 26.4,
        "humidity": 70.0,
        "dew_point": 20.0,
        "pressure": 1012.0,
        "wind_speed": 3.0,
        "wind_direction": 180.0,
        "solar_radiation": 500.0,
        "precipitation": 0.0,
        "battery_voltage": 13.5,
    }
    
    # Feed identical values for 18 steps
    for _ in range(14):
        detector.check_reading(r)
    
    res = detector.check_reading(r)
    assert any(v["type"] == "FLATLINE" for v in res["violations"])
