"""
Stations & Recent Anomalies API Routes.
Provides metadata, health indicators, station coordinates for map plotting, and recent anomaly logs.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta

from backend.config import STATIONS, WMO_LIMITS, QC_FLAGS

router = APIRouter(prefix="/api/stations", tags=["Stations"])

# In-memory recent anomaly events log initialized with realistic records matching UI mockup
RECENT_ANOMALIES: List[Dict[str, Any]] = [
    {
        "id": "ANOM-101",
        "time": "05 Sep 2026, 09:12 AM",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "station_id": "AWS-003",
        "station_name": "Mysuru Central AWS",
        "parameter": "Temperature",
        "value": "42.3 °C",
        "raw_value": 42.3,
        "severity": "High",
        "status": "Investigating",
        "reason": "Sudden step jump (+13.8°C in 1 min) violating WMO rate-of-change threshold and Autoencoder manifold.",
    },
    {
        "id": "ANOM-102",
        "time": "05 Sep 2026, 07:45 AM",
        "timestamp": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
        "station_id": "AWS-002",
        "station_name": "Mangaluru Coastal AWS",
        "parameter": "Wind Speed",
        "value": "76.1 km/h",
        "raw_value": 21.1,
        "severity": "Medium",
        "status": "Resolved",
        "reason": "High wind gust impulse spike captured by Hampel MAD filter.",
    },
    {
        "id": "ANOM-103",
        "time": "04 Sep 2026, 06:20 PM",
        "timestamp": (datetime.now(timezone.utc) - timedelta(hours=14)).isoformat(),
        "station_id": "AWS-005",
        "station_name": "Dharwad Inland AWS",
        "parameter": "Pressure",
        "value": "980 hPa",
        "raw_value": 980.0,
        "severity": "Medium",
        "status": "Resolved",
        "reason": "Atmospheric pressure drop diverging from regional tidal baseline.",
    },
    {
        "id": "ANOM-104",
        "time": "04 Sep 2026, 02:15 PM",
        "timestamp": (datetime.now(timezone.utc) - timedelta(hours=18)).isoformat(),
        "station_id": "AWS-001",
        "station_name": "Bengaluru Urban AWS",
        "parameter": "Humidity",
        "value": "12 %",
        "raw_value": 12.0,
        "severity": "High",
        "status": "Investigating",
        "reason": "Anomalously low relative humidity reading on Deccan plateau.",
    },
]


@router.get("", response_model=List[Dict[str, Any]])
def list_stations():
    """Retrieve all monitored Automatic Weather Stations with coordinates."""
    return list(STATIONS.values())


@router.get("/recent-anomalies", response_model=List[Dict[str, Any]])
def get_recent_anomalies():
    """Retrieve recent anomaly log feed for dashboard display."""
    return RECENT_ANOMALIES


@router.post("/log-anomaly")
def log_anomaly(anomaly: Dict[str, Any]):
    """Log a newly detected anomaly event into recent feed."""
    RECENT_ANOMALIES.insert(0, anomaly)
    if len(RECENT_ANOMALIES) > 50:
        RECENT_ANOMALIES.pop()
    return {"status": "SUCCESS"}


@router.get("/{station_id}")
def get_station_details(station_id: str):
    """Retrieve detailed station metadata and physical parameters."""
    if station_id not in STATIONS:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")
    return STATIONS[station_id]


@router.get("/{station_id}/wmo-limits")
def get_station_wmo_limits(station_id: str):
    """Retrieve WMO QC thresholds and physical bounds."""
    return {
        "station_id": station_id,
        "limits": WMO_LIMITS,
        "qc_flags": QC_FLAGS,
    }
