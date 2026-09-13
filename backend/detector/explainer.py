"""
Explainability & Root-Cause Attribution Engine.
Analyzes multi-tier detection outputs to produce human-readable diagnostic reports,
sensor failure attributions, and maintenance recommendations.
"""

from typing import Dict, Any, List, Optional


class AnomalyExplainer:
    @staticmethod
    def explain(
        reading: Dict[str, Any],
        wmo_res: Dict[str, Any],
        stat_res: Dict[str, Any],
        ml_res: Dict[str, Any],
        composite_score: float,
        final_status: str,
    ) -> Dict[str, Any]:
        """
        Generate diagnostic narrative and sensor attribution ranking.
        """
        all_violations: List[Dict[str, Any]] = []
        all_violations.extend(wmo_res.get("violations", []))
        all_violations.extend(stat_res.get("violations", []))
        all_violations.extend(ml_res.get("violations", []))

        # Sensor culpability score computation
        sensor_scores: Dict[str, float] = {}
        for k, v in wmo_res.get("sensor_scores", {}).items():
            sensor_scores[k] = sensor_scores.get(k, 0.0) + (v * 0.45)
        for k, v in stat_res.get("sensor_scores", {}).items():
            sensor_scores[k] = sensor_scores.get(k, 0.0) + (v * 0.25)
            
        ae_attr = ml_res.get("autoencoder", {}).get("feature_attributions", {})
        for k, pct in ae_attr.items():
            sensor_scores[k] = sensor_scores.get(k, 0.0) + (pct / 100.0 * 0.30)

        # Sort sensors by culpability
        sorted_culprits = sorted(sensor_scores.items(), key=lambda item: item[1], reverse=True)
        primary_sensor = sorted_culprits[0][0] if sorted_culprits and sorted_culprits[0][1] > 0.1 else None
        
        # Build Diagnostic Summary and Recommended Action
        if final_status == "GOOD" or composite_score < 0.25:
            summary = "All meteorological variables comply with WMO standards and multivariate ML baselines."
            recommendation = "No action required. Station operating nominally."
            category = "NORMAL"
        else:
            reasons = []
            for v in all_violations:
                reasons.append(v.get("message", ""))

            # Categorize primary failure mode
            types = [v.get("type") for v in all_violations]
            if "OUT_OF_BOUNDS" in types:
                category = "PHYSICAL_LIMIT_EXCEEDED"
                recommendation = f"Check {primary_sensor} transducer for open/short circuit, extreme electrical spike, or severe physical damage."
            elif "SPIKE_STEP" in types or "HAMPEL_OUTLIER" in types:
                category = "TRANSIENT_SPIKE"
                recommendation = f"Transient impulse detected on {primary_sensor}. Check cable shielding, lightning protection, or grounding."
            elif "FLATLINE" in types:
                category = "SENSOR_LOCKUP"
                recommendation = f"Sensor {primary_sensor} locked up / frozen. Inspect sensor housing for mechanical blockage or frozen mechanism."
            elif "PHYSICAL_INCONSISTENCY" in types:
                category = "CROSS_SENSOR_CONTRADICTION"
                recommendation = f"Thermodynamic inconsistency detected (e.g. Dew point > Temp or Solar at night). Recalibrate hygrometer/pyranometer."
            elif "TREND_DRIFT" in types:
                category = "CALIBRATION_DRIFT"
                recommendation = f"Gradual sensor offset drift on {primary_sensor}. Schedule field recalibration against reference standard."
            elif "MULTIVARIATE_ANOMALY" in types:
                category = "MULTIVARIATE_ANOMALY"
                recommendation = f"Joint physical anomaly flagged by AI Autoencoder on {primary_sensor}. Cross-examine with adjacent AWS stations."
            else:
                category = "TELEMETRY_ANOMALY"
                recommendation = "Inspect AWS data logger communication link and telemetry buffer."

            summary = "; ".join(reasons) if reasons else f"Anomalous pattern detected primarily in {primary_sensor}."

        return {
            "category": category,
            "primary_sensor": primary_sensor,
            "summary": summary,
            "recommendation": recommendation,
            "sensor_attributions": {k: round(v, 3) for k, v in sorted_culprits[:6]},
            "total_violations": len(all_violations),
            "violation_details": all_violations,
        }
