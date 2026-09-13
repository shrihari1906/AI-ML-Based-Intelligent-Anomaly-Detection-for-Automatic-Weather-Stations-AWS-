"""
Integration tests for FastAPI REST endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_get_stations():
    response = client.get("/api/stations")
    assert response.status_code == 200
    stations = response.json()
    assert len(stations) >= 4
    assert any(s["id"] == "AWS-001" for s in stations)


def test_get_station_wmo_limits():
    response = client.get("/api/stations/AWS-001/wmo-limits")
    assert response.status_code == 200
    data = response.json()
    assert "limits" in data
    assert "temperature" in data["limits"]
    assert "humidity" in data["limits"]


def test_fault_injection_lifecycle():
    # 1. Inject a fault
    payload = {
        "station_id": "AWS-001",
        "fault_type": "SPIKE",
        "target_sensor": "temperature",
        "magnitude": 15.0,
        "duration_steps": 10,
        "description": "Integration test spike"
    }
    inj_res = client.post("/api/faults/inject", json=payload)
    assert inj_res.status_code == 200
    fault_data = inj_res.json()
    assert fault_data["status"] == "SUCCESS"
    fault_id = fault_data["fault_id"]

    # 2. Get active faults
    active_res = client.get("/api/faults/active?station_id=AWS-001")
    assert active_res.status_code == 200
    active_faults = active_res.json()
    assert any(f["fault_id"] == fault_id for f in active_faults)

    # 3. Clear faults
    clear_res = client.post("/api/faults/clear", json={"station_id": "AWS-001"})
    assert clear_res.status_code == 200
    
    # 4. Confirm cleared
    active_after = client.get("/api/faults/active?station_id=AWS-001").json()
    assert len(active_after) == 0


def test_benchmark_batch_analysis():
    response = client.get("/api/analyze/benchmark-sample")
    assert response.status_code == 200
    data = response.json()
    assert "total_records" in data
    assert data["total_records"] > 0
    assert "wmo_compliance_percentage" in data
    assert "flag_distribution" in data
    assert "timeline" in data
