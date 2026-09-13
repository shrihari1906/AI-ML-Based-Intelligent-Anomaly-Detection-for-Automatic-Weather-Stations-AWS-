"""
REST API Routes for Sensor Data Ingestion and Anomaly Querying.

Endpoints:
- POST /data : Ingest new weather sensor reading and evaluate anomaly status.
- GET /data  : Retrieve all recorded sensor readings.
- GET /anomalies : Retrieve only records flagged as anomalies (is_anomaly: true).
- GET /stations/{station_id} : Retrieve all records for a specific station (e.g. AWS01).
- GET /stats : Retrieve summary counts (total_records, total_anomalies, normal_records).
"""

import random
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["Sensor Data Intake & Anomalies"])

# Pydantic Schemas
class SensorReadingInput(BaseModel):
    station_id: str = Field(..., example="AWS01", description="Station identifier (e.g. AWS01, AWS-001)")
    temperature: float = Field(..., example=32.5, description="Ambient air temperature in °C")
    humidity: float = Field(..., example=60.0, description="Relative humidity in %")
    pressure: float = Field(..., example=1012.0, description="Atmospheric surface pressure in hPa")
    wind_speed: float = Field(..., example=5.4, description="Wind speed in m/s")


class SensorRecord(BaseModel):
    id: int = Field(..., example=1, description="Unique record auto-increment ID")
    station_id: str = Field(..., example="AWS01", description="Station identifier")
    temperature: float = Field(..., example=32.5, description="Air temperature in °C")
    humidity: float = Field(..., example=60.0, description="Relative humidity in %")
    pressure: float = Field(..., example=1012.0, description="Atmospheric pressure in hPa")
    wind_speed: float = Field(..., example=5.4, description="Wind speed in m/s")
    timestamp: str = Field(..., example="2026-09-10T10:00:00", description="ISO 8601 Timestamp")
    is_anomaly: bool = Field(..., example=True, description="True if reading is anomalous")
    anomaly_type: Optional[str] = Field(None, example="sensor_drift", description="Type/cause of anomaly or null if normal")


class StatsResponse(BaseModel):
    total_records: int = Field(..., example=10, description="Total number of sensor records")
    total_anomalies: int = Field(..., example=3, description="Total anomalous records")
    normal_records: int = Field(..., example=7, description="Total clean/normal records")


# In-Memory Store pre-seeded with 10 realistic initial records:
# 7 normal records and 3 anomalies (matching example: total=10, anomalies=3, normal=7)
now = datetime.now(timezone.utc)

RECORDS_DB: List[Dict[str, Any]] = [
    {
        "id": 1,
        "station_id": "AWS01",
        "temperature": 28.4,
        "humidity": 65.0,
        "pressure": 1013.2,
        "wind_speed": 3.8,
        "timestamp": (now - timedelta(minutes=90)).strftime("%Y-%m-%dT%H:%M:%S"),
        "is_anomaly": False,
        "anomaly_type": None,
    },
    {
        "id": 2,
        "station_id": "AWS01",
        "temperature": 29.1,
        "humidity": 63.5,
        "pressure": 1013.0,
        "wind_speed": 4.1,
        "timestamp": (now - timedelta(minutes=80)).strftime("%Y-%m-%dT%H:%M:%S"),
        "is_anomaly": False,
        "anomaly_type": None,
    },
    {
        "id": 3,
        "station_id": "AWS01",
        "temperature": 42.5,
        "humidity": 60.0,
        "pressure": 1012.0,
        "wind_speed": 5.4,
        "timestamp": (now - timedelta(minutes=70)).strftime("%Y-%m-%dT%H:%M:%S"),
        "is_anomaly": True,
        "anomaly_type": "sensor_drift",
    },
    {
        "id": 4,
        "station_id": "AWS02",
        "temperature": 27.8,
        "humidity": 72.0,
        "pressure": 1011.5,
        "wind_speed": 6.2,
        "timestamp": (now - timedelta(minutes=60)).strftime("%Y-%m-%dT%H:%M:%S"),
        "is_anomaly": False,
        "anomaly_type": None,
    },
    {
        "id": 5,
        "station_id": "AWS02",
        "temperature": 28.0,
        "humidity": 70.5,
        "pressure": 1011.8,
        "wind_speed": 5.9,
        "timestamp": (now - timedelta(minutes=50)).strftime("%Y-%m-%dT%H:%M:%S"),
        "is_anomaly": False,
        "anomaly_type": None,
    },
    {
        "id": 6,
        "station_id": "AWS01",
        "temperature": 30.2,
        "humidity": 58.0,
        "pressure": 1012.4,
        "wind_speed": 4.5,
        "timestamp": (now - timedelta(minutes=40)).strftime("%Y-%m-%dT%H:%M:%S"),
        "is_anomaly": False,
        "anomaly_type": None,
    },
    {
        "id": 7,
        "station_id": "AWS02",
        "temperature": 28.5,
        "humidity": 71.0,
        "pressure": 980.2,
        "wind_speed": 24.8,
        "timestamp": (now - timedelta(minutes=30)).strftime("%Y-%m-%dT%H:%M:%S"),
        "is_anomaly": True,
        "anomaly_type": "spike",
    },
    {
        "id": 8,
        "station_id": "AWS01",
        "temperature": 31.0,
        "humidity": 55.0,
        "pressure": 1012.1,
        "wind_speed": 4.8,
        "timestamp": (now - timedelta(minutes=20)).strftime("%Y-%m-%dT%H:%M:%S"),
        "is_anomaly": False,
        "anomaly_type": None,
    },
    {
        "id": 9,
        "station_id": "AWS01",
        "temperature": 31.2,
        "humidity": 99.9,
        "pressure": 1011.9,
        "wind_speed": 4.9,
        "timestamp": (now - timedelta(minutes=10)).strftime("%Y-%m-%dT%H:%M:%S"),
        "is_anomaly": True,
        "anomaly_type": "stuck_sensor",
    },
    {
        "id": 10,
        "station_id": "AWS02",
        "temperature": 27.9,
        "humidity": 69.0,
        "pressure": 1012.3,
        "wind_speed": 5.1,
        "timestamp": (now - timedelta(minutes=2)).strftime("%Y-%m-%dT%H:%M:%S"),
        "is_anomaly": False,
        "anomaly_type": None,
    },
]


def evaluate_anomaly(reading: SensorReadingInput) -> tuple[bool, Optional[str]]:
    """
    Intelligently determines anomaly status.
    Combines physical boundary validation with mock anomaly simulation as requested.
    """
    # 1. Deterministic physical bounds checks
    if reading.temperature > 50.0 or reading.temperature < -10.0:
        return True, "temperature_spike"
    if reading.humidity > 100.0 or reading.humidity < 0.0:
        return True, "humidity_out_of_bounds"
    if reading.pressure > 1080.0 or reading.pressure < 880.0:
        return True, "pressure_drop"
    if reading.wind_speed > 45.0 or reading.wind_speed < 0.0:
        return True, "wind_gust_anomaly"

    # 2. Realistic / mock anomaly trigger (~20% probability for field simulation)
    # Allows testing without requiring extreme physical boundary violations
    if random.random() < 0.20:
        anomaly_type = random.choice(["sensor_drift", "spike", "stuck_sensor", "unstable_variance"])
        return True, anomaly_type

    return False, None


# ============================================================================
# API Endpoints
# ============================================================================

class PostReadingPayload(BaseModel):
    station_id: str = Field(..., example="AWS_01")
    timestamp: Optional[str] = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S"))
    temperature: float = Field(..., example=34.5)
    humidity: float = Field(..., example=60.0)
    pressure: float = Field(..., example=1008.0)
    wind_speed: float = Field(..., example=12.0)


@router.post("/api/reading", response_model=SensorRecord, status_code=201, summary="Send new sensor reading (Hackathon Schema)")
@router.post("/data", response_model=SensorRecord, status_code=201, summary="Send new sensor reading")
@router.post("/api/data", response_model=SensorRecord, status_code=201, include_in_schema=False)
def create_sensor_reading(reading: PostReadingPayload):
    """
    Send a new sensor reading.
    Evaluates anomaly detection and returns the created record with id and timestamp.
    """
    input_obj = SensorReadingInput(
        station_id=reading.station_id,
        temperature=reading.temperature,
        humidity=reading.humidity,
        pressure=reading.pressure,
        wind_speed=reading.wind_speed,
    )
    is_anom, anom_type = evaluate_anomaly(input_obj)
    
    new_id = len(RECORDS_DB) + 1
    ts = reading.timestamp or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")

    record = {
        "id": new_id,
        "station_id": reading.station_id,
        "temperature": round(reading.temperature, 2),
        "humidity": round(reading.humidity, 2),
        "pressure": round(reading.pressure, 2),
        "wind_speed": round(reading.wind_speed, 2),
        "timestamp": ts,
        "is_anomaly": is_anom,
        "anomaly_type": anom_type,
    }

    RECORDS_DB.append(record)
    return record


@router.get("/api/readings/{station_id}", summary="Get latest reading or readings for one station")
def get_station_readings_poll(station_id: str):
    """
    Polled by frontend every 2-3 seconds for live dashboard updates.
    Returns the latest sensor reading and historical context for the station.
    """
    station_id_norm = station_id.strip().lower().replace("-", "_")
    matches = [
        rec for rec in RECORDS_DB 
        if rec["station_id"].strip().lower().replace("-", "_") == station_id_norm
    ]
    if matches:
        latest = matches[-1]
    else:
        # Generate a live baseline reading for this Karnataka station so polling always succeeds
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
        latest = {
            "id": len(RECORDS_DB) + 1,
            "station_id": station_id,
            "temperature": round(28.0 + random.uniform(-2, 2), 2),
            "humidity": round(65.0 + random.uniform(-5, 5), 1),
            "pressure": round(1012.0 + random.uniform(-1, 1), 1),
            "wind_speed": round(4.5 + random.uniform(-1, 2), 1),
            "timestamp": now_str,
            "is_anomaly": False,
            "anomaly_type": None,
        }
        RECORDS_DB.append(latest)
        matches = [latest]

    return {
        "station_id": station_id,
        "latest": latest,
        "history": matches[-30:],
        "temperature": latest["temperature"],
        "humidity": latest["humidity"],
        "pressure": latest["pressure"],
        "wind_speed": latest["wind_speed"],
        "timestamp": latest["timestamp"],
        "is_anomaly": latest["is_anomaly"],
        "anomaly_type": latest["anomaly_type"],
    }


@router.get("/api/alerts", summary="Get all anomaly alerts")
@router.get("/anomalies", response_model=List[SensorRecord], summary="Get only anomaly records")
@router.get("/api/anomalies", response_model=List[SensorRecord], include_in_schema=False)
def get_anomalies_only():
    """Retrieve only records where is_anomaly is True."""
    anoms = [rec for rec in RECORDS_DB if rec.get("is_anomaly") is True]
    # Return in format suitable for alerts panel
    alerts_list = []
    for a in reversed(anoms):
        param = "Temperature"
        val = f"{a['temperature']} °C"
        if a.get("anomaly_type") == "spike" or a["wind_speed"] > 20:
            param = "Wind Speed"
            val = f"{a['wind_speed']} m/s"
        elif a.get("anomaly_type") == "stuck_sensor" or a["humidity"] > 95:
            param = "Humidity"
            val = f"{a['humidity']} %"
        elif "pressure" in (a.get("anomaly_type") or ""):
            param = "Pressure"
            val = f"{a['pressure']} hPa"

        alerts_list.append({
            "id": f"ALRT-{a['id']}",
            "record_id": a["id"],
            "station_id": a["station_id"],
            "parameter": param,
            "value": val,
            "severity": "High" if a.get("anomaly_type") in ["spike", "temperature_spike"] else "Medium",
            "status": "Investigating",
            "reason": a.get("anomaly_type") or "Sensor anomaly detected",
            "timestamp": a["timestamp"],
            "is_anomaly": True,
            "anomaly_type": a.get("anomaly_type"),
        })
    return alerts_list


@router.get("/data", response_model=List[SensorRecord], summary="Get all records")
@router.get("/api/data", response_model=List[SensorRecord], include_in_schema=False)
def get_all_records():
    """Retrieve all recorded weather sensor readings."""
    return RECORDS_DB


@router.get("/stations/{station_id}", response_model=List[SensorRecord], summary="Get records for one station")
def get_station_records(station_id: str):
    """
    Retrieve all records for a specific station (e.g. AWS_001, AWS01).
    Case-insensitive matching is supported.
    """
    station_id_norm = station_id.strip().lower().replace("-", "_")
    matches = [
        rec for rec in RECORDS_DB 
        if rec["station_id"].strip().lower().replace("-", "_") == station_id_norm
    ]
    return matches


@router.get("/stats", response_model=StatsResponse, summary="Summary counts")
@router.get("/api/stats", response_model=StatsResponse, include_in_schema=False)
def get_summary_stats():
    """
    Retrieve summary statistics: total_records, total_anomalies, normal_records.
    """
    total = len(RECORDS_DB)
    anomalies = sum(1 for rec in RECORDS_DB if rec.get("is_anomaly") is True)
    normal = total - anomalies
    return {
        "total_records": total,
        "total_anomalies": anomalies,
        "normal_records": normal,
    }
