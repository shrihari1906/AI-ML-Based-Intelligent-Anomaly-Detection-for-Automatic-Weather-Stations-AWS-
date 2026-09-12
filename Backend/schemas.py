from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class WeatherDataCreate(BaseModel):
    """Input schema for POST /data."""
    station_id: str
    timestamp: Optional[datetime] = None
    temperature: float
    humidity: float
    pressure: float
    wind_speed: float


class AnomalyResult(BaseModel):
    """Anomaly detection result embedded in the response."""
    is_anomaly: bool
    score: float
    reason: str


class WeatherDataResponse(BaseModel):
    """Response schema for POST /data and GET /data."""
    id: int
    station_id: str
    timestamp: Optional[datetime] = None
    temperature: float
    humidity: float
    pressure: float
    wind_speed: float
    anomaly: AnomalyResult

    class Config:
        from_attributes = True


class WeatherDataSimple(BaseModel):
    """Response schema for GET /data (without anomaly)."""
    id: int
    station_id: str
    timestamp: Optional[datetime] = None
    temperature: float
    humidity: float
    pressure: float
    wind_speed: float

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    """Response schema for GET /alerts."""
    id: int
    station_id: str
    timestamp: Optional[datetime] = None
    is_anomaly: bool
    score: float
    reason: str

    class Config:
        from_attributes = True