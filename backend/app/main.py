"""
Main FastAPI Application Entrypoint.
Orchestrates REST routes, WebSocket streams, Database ORM, JWT Authentication, and Static Assets.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import engine, Base
from backend.models import User, Station, TelemetryRecord, AnomalyAlert
from backend.security import auth
from backend.app.routes import stations, inject, analyze, stream, telemetry_data
from backend.data.dataset_loader import ensure_sample_data_file
from backend.detector.ml_models import MLAnomalyDetector
from backend.detector.prediction import fault_predictor


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up baseline ML models, initialize DB tables and seeds on server startup."""
    print("[INIT] Initializing AI/ML Anomaly Detection Service for AWS...")
    
    # 1. Initialize Database schema
    Base.metadata.create_all(bind=engine)
    auth.seed_default_admin()
    
    # 2. Ensure benchmark dataset
    ensure_sample_data_file()
    
    # 3. Warm up ML models
    detector = MLAnomalyDetector()
    detector.ensure_trained_with_synthetic_baseline()
    print("[OK] AI/ML baseline models trained and ready for real-time inference.")
    yield
    print("[STOP] Shutting down AWS Anomaly Detection Service.")


app = FastAPI(
    title="ClimaSense - Climate + Intelligent Sensing",
    description="Multi-tier intelligent quality control, neural autoencoders, predictive failure forecasting, and secure JWT authentication.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(telemetry_data.router)
app.include_router(auth.router)
app.include_router(stations.router)
app.include_router(inject.router)
app.include_router(analyze.router)
app.include_router(stream.router)


@app.get("/api/predict/sensor-risk")
def get_sensor_prediction_risk():
    """Endpoint returning sensor fault predictions and remaining margin to failure."""
    return fault_predictor.predict_all()


# Mount Frontend Static Directory (dist or vanilla static)
frontend_dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend-react", "dist"))
frontend_static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))

if os.path.exists(frontend_dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_dir, "assets")), name="react-assets")
    
    @app.get("/")
    def serve_react_root():
        index_file = os.path.join(frontend_dist_dir, "index.html")
        return FileResponse(index_file)
elif os.path.exists(frontend_static_dir):
    app.mount("/static", StaticFiles(directory=frontend_static_dir), name="static")

    @app.get("/")
    def serve_frontend_index():
        index_file = os.path.join(frontend_static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"status": "ONLINE", "message": "AWS Anomaly Detection API is running."}
