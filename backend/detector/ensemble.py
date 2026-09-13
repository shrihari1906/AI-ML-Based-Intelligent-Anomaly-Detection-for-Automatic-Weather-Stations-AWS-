"""
Master Multi-Tier Ensemble Anomaly Detection Coordinator.
Fuses Layer 1 (WMO Rules), Layer 2 (Statistical Filters), and Layer 3 (AI/ML)
into unified severity decisions, root-cause attribution, and data correction.
"""

from typing import Dict, Any, List, Optional
import pandas as pd

from backend.config import QC_FLAGS, ML_CONFIG
from backend.detector.rules_qc import WMORulesDetector
from backend.detector.statistical_qc import StatisticalQCDetector
from backend.detector.ml_models import MLAnomalyDetector
from backend.detector.explainer import AnomalyExplainer
from backend.detector.imputer import MeteorologicalImputer


class EnsembleAnomalyDetector:
    def __init__(self, station_id: str = "AWS-001"):
        self.station_id = station_id
        self.wmo_detector = WMORulesDetector(station_id=station_id)
        self.stat_detector = StatisticalQCDetector()
        self.ml_detector = MLAnomalyDetector()
        self.imputer = MeteorologicalImputer()
        
        # Weights for multi-tier scoring
        self.w_wmo = ML_CONFIG["ensemble"]["wmo_weight"]
        self.w_stat = ML_CONFIG["ensemble"]["statistical_weight"]
        self.w_ml = ML_CONFIG["ensemble"]["ml_weight"]

    def reset_state(self):
        self.wmo_detector.reset_state()
        self.stat_detector.reset_state()
        self.imputer.reset_state()

    def train_ml(self, training_data: pd.DataFrame | List[Dict[str, Any]]):
        """Train internal ML models on baseline historical data."""
        self.ml_detector.train(training_data)

    def analyze_single_reading(self, reading: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single incoming telemetry packet through all 3 layers.
        Returns complete fused analysis, diagnostic explanations, and imputed estimates.
        """
        # Layer 1: Deterministic WMO QC Check
        wmo_res = self.wmo_detector.check_reading(reading)
        
        # Layer 2: Statistical Dynamic Filters
        stat_res = self.stat_detector.check_reading(reading)
        
        # Layer 3: AI/ML Models
        ml_res = self.ml_detector.predict_reading(reading)

        # Composite Anomaly Score Computation
        s_wmo = wmo_res["anomaly_score"]
        s_stat = stat_res["anomaly_score"]
        s_ml = ml_res["anomaly_score"]

        composite_score = (self.w_wmo * s_wmo) + (self.w_stat * s_stat) + (self.w_ml * s_ml)
        
        # If Layer 1 found a CRITICAL rule violation (e.g. out of bounds), escalate score directly
        if wmo_res["status"] == "CRITICAL":
            composite_score = max(composite_score, 0.90)

        composite_score = round(float(min(1.0, composite_score)), 4)

        # Determine Final Quality Flag
        if composite_score >= 0.80 or wmo_res["status"] == "CRITICAL":
            flag_id = 3
            status_code = "CRITICAL"
        elif composite_score >= 0.55 or wmo_res["status"] == "WARNING" or stat_res["status"] == "CRITICAL":
            flag_id = 2
            status_code = "WARNING"
        elif composite_score >= 0.30 or stat_res["status"] == "WARNING" or ml_res["status"] == "WARNING":
            flag_id = 1
            status_code = "SUSPECT"
        else:
            flag_id = 0
            status_code = "GOOD"

        flag_meta = QC_FLAGS[flag_id]

        # Root Cause Analysis & Sensor Attribution
        explanation = AnomalyExplainer.explain(
            reading=reading,
            wmo_res=wmo_res,
            stat_res=stat_res,
            ml_res=ml_res,
            composite_score=composite_score,
            final_status=status_code,
        )

        # Intelligent Imputation for corrupted sensors
        corrupted_sensors = {}
        for s, st in wmo_res.get("sensor_status", {}).items():
            if st != "PASS":
                corrupted_sensors[s] = st
        for s, st in stat_res.get("sensor_status", {}).items():
            if st != "PASS":
                corrupted_sensors[s] = max(corrupted_sensors.get(s, "PASS"), st)
                
        corrected_reading, imputations = self.imputer.impute_reading(reading, corrupted_sensors)
        
        # Update imputer clean history buffer if reading was valid
        is_clean = (status_code == "GOOD")
        self.imputer.update_history(reading, is_clean)

        return {
            "timestamp": reading.get("timestamp"),
            "station_id": reading.get("station_id", self.station_id),
            "station_name": reading.get("station_name", "AWS"),
            "reading": reading,
            "corrected_reading": corrected_reading,
            "imputations": imputations,
            "qc_flag": {
                "flag_id": flag_id,
                "code": flag_meta["code"],
                "label": flag_meta["label"],
                "severity": flag_meta["severity"],
                "color": flag_meta["color"],
            },
            "composite_anomaly_score": composite_score,
            "is_anomalous": status_code in ("CRITICAL", "WARNING"),
            "layer_1_wmo": wmo_res,
            "layer_2_statistical": stat_res,
            "layer_3_ml": ml_res,
            "explanation": explanation,
        }

    def analyze_batch(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Batch evaluation of historical readings / uploaded CSVs.
        Produces full timeline and aggregated Quality Control metrics.
        """
        self.reset_state()
        results = []
        
        counts = {"GOOD": 0, "SUSPECT": 0, "WARNING": 0, "CRITICAL": 0}
        category_counts: Dict[str, int] = {}
        sensor_failure_counts: Dict[str, int] = {}

        for rec in records:
            res = self.analyze_single_reading(rec)
            results.append(res)
            
            code = res["qc_flag"]["code"]
            counts[code] = counts.get(code, 0) + 1
            
            cat = res["explanation"]["category"]
            category_counts[cat] = category_counts.get(cat, 0) + 1
            
            primary_s = res["explanation"]["primary_sensor"]
            if primary_s and code != "GOOD":
                sensor_failure_counts[primary_s] = sensor_failure_counts.get(primary_s, 0) + 1

        total = len(records)
        clean_count = counts.get("GOOD", 0)
        wmo_compliance_pct = round((clean_count / total * 100.0), 1) if total > 0 else 100.0

        return {
            "total_records": total,
            "clean_records": clean_count,
            "anomalous_records": total - clean_count,
            "wmo_compliance_percentage": wmo_compliance_pct,
            "flag_distribution": counts,
            "anomaly_categories": category_counts,
            "sensor_failure_distribution": sensor_failure_counts,
            "timeline": results,
        }
