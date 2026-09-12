from collections import deque
from datetime import datetime

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from detector import detect_anomaly
from models import WeatherData, Alert
from schemas import (
    WeatherDataCreate,
    WeatherDataResponse,
    WeatherDataSimple,
    AnomalyResult,
    AlertResponse,
)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AWS Anomaly Detection Backend",
    description="Backend API for AI/ML-Based Intelligent Anomaly Detection "
                "System for Automatic Weather Stations (AWS)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory rolling buffer: station_id -> deque(maxlen=10)
# ---------------------------------------------------------------------------
station_buffers: dict[str, deque] = {}
BUFFER_SIZE = 10


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def home():
    """Health-check endpoint."""
    return {"message": "Backend running"}


@app.post("/api/reading", response_model=WeatherDataResponse)
def create_weather_data(
    data: WeatherDataCreate,
    db: Session = Depends(get_db),
):
    """
    Accept a single sensor reading for a station.

    - Persists the reading to the database.
    - Adds it to the station's rolling buffer (last 10 readings).
    - If buffer has >= 10 readings, calls detect_anomaly() with the
      IsolationForest ML model and stores the result in the alerts table.
    - If < 10 readings, returns is_anomaly=false with reason 'insufficient data'.
    """
    ts = data.timestamp or datetime.utcnow()

    # 1. Persist the reading
    new_data = WeatherData(
        station_id=data.station_id,
        timestamp=ts,
        temperature=data.temperature,
        humidity=data.humidity,
        pressure=data.pressure,
        wind_speed=data.wind_speed,
    )
    db.add(new_data)
    db.commit()
    db.refresh(new_data)

    # 2. Update the in-memory rolling buffer
    if data.station_id not in station_buffers:
        station_buffers[data.station_id] = deque(maxlen=BUFFER_SIZE)

    station_buffers[data.station_id].append({
        "temperature": data.temperature,
        "humidity": data.humidity,
        "pressure": data.pressure,
        "wind_speed": data.wind_speed,
    })

    buffer = station_buffers[data.station_id]

    # 3. Run anomaly detection
    if len(buffer) >= BUFFER_SIZE:
        result = detect_anomaly(list(buffer))
    else:
        result = {
            "is_anomaly": False,
            "score": 0.0,
            "reason": "insufficient data",
        }

    # 4. Store the alert
    alert = Alert(
        station_id=data.station_id,
        timestamp=ts,
        is_anomaly=result["is_anomaly"],
        score=result["score"],
        reason=result["reason"],
    )
    db.add(alert)
    db.commit()

    # 5. Build response
    return WeatherDataResponse(
        id=new_data.id,
        station_id=new_data.station_id,
        timestamp=new_data.timestamp,
        temperature=new_data.temperature,
        humidity=new_data.humidity,
        pressure=new_data.pressure,
        wind_speed=new_data.wind_speed,
        anomaly=AnomalyResult(
            is_anomaly=result["is_anomaly"],
            score=result["score"],
            reason=result["reason"],
        ),
    )


@app.get("/api/alerts", response_model=list[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    """Return all alerts where is_anomaly is true, most recent first."""
    return (
        db.query(Alert)
        .filter(Alert.is_anomaly == True)
        .order_by(Alert.timestamp.desc())
        .all()
    )


@app.get("/api/readings/{station_id}", response_model=list[WeatherDataSimple])
def get_station_readings(station_id: str, db: Session = Depends(get_db)):
    """Return the last 50 readings for a station (for frontend charts)."""
    return (
        db.query(WeatherData)
        .filter(WeatherData.station_id == station_id)
        .order_by(WeatherData.timestamp.desc())
        .limit(50)
        .all()
    )