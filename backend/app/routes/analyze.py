"""
Batch Dataset Analysis and Quality Control Reporting Routes.
Handles CSV ingestion, automated multi-tier anomaly detection, and scorecard generation.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import Dict, Any, Optional
import os
import pandas as pd

from backend.data.dataset_loader import (
    parse_csv_content,
    generate_benchmark_dataset,
    ensure_sample_data_file
)
from backend.detector.ensemble import EnsembleAnomalyDetector

router = APIRouter(prefix="/api/analyze", tags=["Batch Analysis & QC Reports"])

# Shared detector instance for batch runs
batch_detector = EnsembleAnomalyDetector(station_id="AWS-BATCH")
batch_detector.ml_detector.ensure_trained_with_synthetic_baseline()


@router.post("/upload")
async def analyze_uploaded_csv(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Upload a meteorological CSV file to run automated 3-tier anomaly detection.
    Returns complete WMO compliance scorecard, root-cause explanations, and time-series flags.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    try:
        df = parse_csv_content(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    # Convert records to dictionary format for detector
    records = df.to_dict(orient="records")
    
    # Cap batch size to 3000 for responsive web experience
    if len(records) > 3000:
        records = records[:3000]

    report = batch_detector.analyze_batch(records)
    report["filename"] = file.filename
    return report


@router.get("/benchmark-sample")
def analyze_benchmark_sample() -> Dict[str, Any]:
    """
    Execute instant batch analysis on the pre-packaged 1,000-sample benchmark dataset
    containing synthetic real-world anomalies (spikes, flatlines, drifts, physical contradictions).
    """
    df = generate_benchmark_dataset(n_samples=800)
    records = df.to_dict(orient="records")
    report = batch_detector.analyze_batch(records)
    report["filename"] = "aws_benchmark_ground_truth.csv"
    return report


@router.get("/download-sample")
def download_sample_csv():
    """Download the pre-generated benchmark CSV file with injected ground-truth anomalies."""
    path = ensure_sample_data_file()
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Sample dataset file not found.")
    return FileResponse(
        path=path,
        filename="aws_meteorological_benchmark_sample.csv",
        media_type="text/csv"
    )
