"""
Unit tests for Layer 2 Statistical QC, Layer 3 ML, and Ensemble.
"""

import pytest
import numpy as np
from backend.detector.statistical_qc import StatisticalQCDetector
from backend.detector.ml_models import MLAnomalyDetector
from backend.detector.ensemble import EnsembleAnomalyDetector
from backend.data.simulator import WeatherSimulator


def test_statistical_qc_z_score():
    stat = StatisticalQCDetector(window_size=20)
    
    # Fill buffer with Gaussian baseline around 25.0
    for val in np.random.normal(25.0, 0.5, 20):
        stat.check_reading({"temperature": float(val)})
        
    # Inject large 8-sigma outlier
    res = stat.check_reading({"temperature": 34.0})
    assert res["status"] in ("CRITICAL", "WARNING")
    assert any(v["type"] in ("Z_SCORE_ANOMALY", "HAMPEL_OUTLIER") for v in res["violations"])


def test_ml_anomaly_detector():
    ml = MLAnomalyDetector()
    sim = WeatherSimulator(station_id="AWS-001")
    train_data = sim.generate_batch(400)
    ml.train(train_data)
    
    # 1. Clean reading should have low anomaly score
    clean_sample = sim.step()
    res_clean = ml.predict_reading(clean_sample)
    assert res_clean["anomaly_score"] < 0.60

    # 2. Corrupted sample (multivariate violation: temp 48°C, RH 99%, Solar 1100)
    bad_sample = clean_sample.copy()
    bad_sample["temperature"] = 48.0
    bad_sample["humidity"] = 99.0
    bad_sample["solar_radiation"] = 1100.0
    
    res_bad = ml.predict_reading(bad_sample)
    assert res_bad["anomaly_score"] > 0.50
    assert "temperature" in res_bad["autoencoder"]["feature_attributions"]


def test_ensemble_coordinator():
    ensemble = EnsembleAnomalyDetector(station_id="AWS-001")
    sim = WeatherSimulator(station_id="AWS-001")
    
    # Normal stream
    sample = sim.step()
    result = ensemble.analyze_single_reading(sample)
    assert result["qc_flag"]["code"] in ("GOOD", "SUSPECT")
    assert "explanation" in result
    assert "imputations" in result

    # Injected Out of bounds
    extreme_sample = sample.copy()
    extreme_sample["temperature"] = 72.0
    result_extreme = ensemble.analyze_single_reading(extreme_sample)
    assert result_extreme["qc_flag"]["code"] == "CRITICAL"
    assert result_extreme["is_anomalous"] is True
    assert result_extreme["explanation"]["primary_sensor"] == "temperature"
