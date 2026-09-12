from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from database import Base


class WeatherData(Base):
    """Stores every sensor reading received from weather stations."""
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=True)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    pressure = Column(Float, nullable=False)
    wind_speed = Column(Float, nullable=False)


class Alert(Base):
    """Stores anomaly detection results."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=True)
    is_anomaly = Column(Boolean, nullable=False)
    score = Column(Float, nullable=False)
    reason = Column(String, nullable=False)