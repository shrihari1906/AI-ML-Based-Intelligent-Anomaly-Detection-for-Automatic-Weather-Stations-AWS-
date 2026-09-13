"""
SQLAlchemy Database Models for AWS Monitor.
Entities: User (Security), Station (Metadata), TelemetryRecord (Time-series), AnomalyAlert (Audit & Events).
"""

import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), default="Abhishek")
    role = Column(String(20), default="admin") # admin | operator | analyst
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Station(Base):
    __tablename__ = "stations"

    id = Column(String(20), primary_key=True, index=True) # e.g. AWS-001
    name = Column(String(100), nullable=False)
    location = Column(String(150), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    elevation_m = Column(Float, default=0.0)
    climate_zone = Column(String(50), default="Tropical")
    status = Column(String(20), default="ONLINE")

    telemetries = relationship("TelemetryRecord", back_populates="station", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyAlert", back_populates="station", cascade="all, delete-orphan")


class TelemetryRecord(Base):
    __tablename__ = "telemetry_records"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String(20), ForeignKey("stations.id"), index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    dew_point = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    wind_direction = Column(Float, nullable=True)
    solar_radiation = Column(Float, nullable=True)
    precipitation = Column(Float, nullable=True)
    battery_voltage = Column(Float, nullable=True)
    
    qc_flag_id = Column(Integer, default=0)
    qc_flag_code = Column(String(20), default="GOOD")
    anomaly_score = Column(Float, default=0.0)

    station = relationship("Station", back_populates="telemetries")


class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String(20), ForeignKey("stations.id"), index=True)
    parameter = Column(String(50), nullable=False)
    value = Column(String(50), nullable=False)
    raw_value = Column(Float, nullable=True)
    severity = Column(String(20), default="High") # High | Medium | Low
    status = Column(String(30), default="Investigating") # Investigating | Resolved | Suppressed
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    station = relationship("Station", back_populates="anomalies")
