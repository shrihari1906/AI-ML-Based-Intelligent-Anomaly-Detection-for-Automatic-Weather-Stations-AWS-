"""
Live End-to-End Test for Running Server.
Verifies REST endpoints, WebSocket live telemetry streaming, and fault injection reactions.
"""

import asyncio
import json
import websockets
import requests
import pytest


BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/ws/telemetry/AWS-001"


def test_rest_endpoints():
    print("[1/3] Testing REST Endpoints...")
    # 1. Index page
    res_index = requests.get(f"{BASE_URL}/")
    assert res_index.status_code == 200
    assert "AWS Monitor" in res_index.text
    print("  -> Frontend HTML served successfully.")

    # 2. Stations API
    res_stations = requests.get(f"{BASE_URL}/api/stations")
    assert res_stations.status_code == 200
    stations = res_stations.json()
    assert len(stations) >= 4
    print(f"  -> Stations API returned {len(stations)} station profiles.")

    # 3. Benchmark Sample Run
    res_bench = requests.get(f"{BASE_URL}/api/analyze/benchmark-sample")
    assert res_bench.status_code == 200
    bench_data = res_bench.json()
    assert bench_data["total_records"] > 0
    print(f"  -> Benchmark Analysis completed: {bench_data['total_records']} records scanned, {bench_data['wmo_compliance_percentage']}% WMO compliance.")


@pytest.mark.asyncio
async def test_websocket_stream_and_faults():
    print("[2/3] Testing Live WebSocket Telemetry & Anomaly Reaction...")
    async with websockets.connect(WS_URL) as ws:
        # Receive clean packet
        msg1 = await asyncio.wait_for(ws.recv(), timeout=5.0)
        data1 = json.loads(msg1)
        assert "reading" in data1
        assert "composite_anomaly_score" in data1
        print(f"  -> Received nominal telemetry packet: Temp={data1['reading']['temperature']}°C, Status={data1['qc_flag']['code']}")

        # Inject Fault via REST: Spike on Temperature (+18°C)
        print("  -> Injecting test spike (+18°C on Temperature)...")
        requests.post(f"{BASE_URL}/api/faults/inject", json={
            "station_id": "AWS-001",
            "fault_type": "SPIKE",
            "target_sensor": "temperature",
            "magnitude": 18.0,
            "duration_steps": 10,
            "description": "E2E Test Spike"
        })

        # Receive mutated packet
        msg2 = await asyncio.wait_for(ws.recv(), timeout=5.0)
        data2 = json.loads(msg2)
        print(f"  -> Received mutated packet: Temp={data2['reading']['temperature']}°C, Flag={data2['qc_flag']['code']}, Score={data2['composite_anomaly_score']}")
        assert data2["qc_flag"]["code"] in ("CRITICAL", "WARNING")
        assert len(data2.get("active_faults", [])) > 0
        print(f"  -> Root cause explanation: {data2['explanation']['summary']}")

        # Clear Faults
        print("  -> Clearing all faults...")
        requests.post(f"{BASE_URL}/api/faults/clear", json={"station_id": "AWS-001"})
        
        # Receive cleared packet
        msg3 = await asyncio.wait_for(ws.recv(), timeout=5.0)
        data3 = json.loads(msg3)
        print(f"  -> Post-clear telemetry: Status={data3['qc_flag']['code']}")
        assert len(data3.get("active_faults", [])) == 0

    print("[3/3] End-to-End Live Verification Passed Successfully!")


if __name__ == "__main__":
    test_rest_endpoints()
    asyncio.run(test_websocket_stream_and_faults())
