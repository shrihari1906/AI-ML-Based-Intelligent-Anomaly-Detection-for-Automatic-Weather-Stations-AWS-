"""
Real-Time Telemetry Streaming WebSocket Route.
Streams synchronized meteorological data with live 3-tier anomaly detection,
fault injection simulation, and diagnostic explanations.
"""

import asyncio
import json
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.data.simulator import WeatherSimulator
from backend.data.fault_injector import fault_injector
from backend.detector.ensemble import EnsembleAnomalyDetector
from backend.detector.prediction import fault_predictor

router = APIRouter(tags=["Real-Time Stream"])

# Cache active simulators and detectors per station
station_simulators: Dict[str, WeatherSimulator] = {}
station_detectors: Dict[str, EnsembleAnomalyDetector] = {}


def get_station_services(station_id: str):
    if station_id not in station_simulators:
        station_simulators[station_id] = WeatherSimulator(station_id=station_id, time_step_sec=5)
    if station_id not in station_detectors:
        det = EnsembleAnomalyDetector(station_id=station_id)
        det.ml_detector.ensure_trained_with_synthetic_baseline()
        station_detectors[station_id] = det
    return station_simulators[station_id], station_detectors[station_id]


@router.websocket("/ws/telemetry/{station_id}")
async def telemetry_websocket(websocket: WebSocket, station_id: str = "AWS-001"):
    """
    WebSocket endpoint broadcasting real-time AWS telemetry and live AI/ML anomaly detection results.
    """
    await websocket.accept()
    simulator, detector = get_station_services(station_id)

    # Streaming state
    stream_interval_sec = 1.0 # 1 Hz default
    is_paused = False

    async def receive_controls():
        nonlocal stream_interval_sec, is_paused
        while True:
            try:
                data_text = await websocket.receive_text()
                msg = json.loads(data_text)
                action = msg.get("action")
                if action == "set_speed":
                    hz = float(msg.get("hz", 1.0))
                    stream_interval_sec = max(0.1, min(5.0, 1.0 / hz))
                elif action == "pause":
                    is_paused = True
                elif action == "resume":
                    is_paused = False
                elif action == "reset":
                    detector.reset_state()
            except WebSocketDisconnect:
                break
            except Exception:
                pass

    # Launch background task for incoming control commands
    control_task = asyncio.create_task(receive_controls())

    try:
        while True:
            if not is_paused:
                # 1. Generate clean physical step
                raw_reading = simulator.step()
                
                # 2. Apply any active interactive faults
                faulted_reading = fault_injector.apply_faults(raw_reading)
                fault_predictor.add_reading(faulted_reading)
                
                # 3. Process through 3-tier ensemble detector
                analysis = detector.analyze_single_reading(faulted_reading)
                
                # 4. Attach active faults metadata
                analysis["active_faults"] = fault_injector.get_active_faults(station_id=station_id)
                
                # 5. Send JSON packet to client
                await websocket.send_text(json.dumps(analysis))

            await asyncio.sleep(stream_interval_sec)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.close()
        except Exception:
            pass
    finally:
        control_task.cancel()
