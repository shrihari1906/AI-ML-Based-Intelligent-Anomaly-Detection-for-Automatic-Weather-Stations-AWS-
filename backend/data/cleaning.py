"""
Meteorological Data Processing, Cleaning, and Scrubbing Module.
Implements timestamp standardization, missing gap filling, thermodynamic validation, and outlier scrubbing.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np

from backend.config import WMO_LIMITS
from backend.data.simulator import calculate_dew_point


class WeatherDataCleaner:
    @staticmethod
    def clean_record(reading: Dict[str, Any]) -> Dict[str, Any]:
        """Scrub and sanitize a single raw reading dictionary."""
        cleaned = reading.copy()
        
        # 1. Gross bound clipping / scrubbing
        for var, config in WMO_LIMITS.items():
            if var in cleaned and cleaned[var] is not None:
                val = float(cleaned[var])
                if val < config["min"]:
                    cleaned[var] = config["min"]
                elif val > config["max"]:
                    cleaned[var] = config["max"]

        # 2. Thermodynamic Magnus relation enforcement
        temp = cleaned.get("temperature")
        rh = cleaned.get("humidity")
        dp = cleaned.get("dew_point")

        if temp is not None and rh is not None:
            expected_dp = calculate_dew_point(temp, rh)
            if dp is None or dp > temp:
                cleaned["dew_point"] = expected_dp

        return cleaned

    @staticmethod
    def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
        """Process and clean historical time series DataFrame."""
        cleaned_df = df.copy()

        # Sort by timestamp if available
        if "timestamp" in cleaned_df.columns:
            cleaned_df["timestamp"] = pd.to_datetime(cleaned_df["timestamp"], errors="coerce")
            cleaned_df = cleaned_df.sort_values("timestamp").reset_index(drop=True)

        # Interpolate small missing gaps (max 3 consecutive)
        numeric_cols = [c for c in WMO_LIMITS.keys() if c in cleaned_df.columns]
        cleaned_df[numeric_cols] = cleaned_df[numeric_cols].interpolate(method="linear", limit=3)
        
        # Forward fill remaining
        cleaned_df[numeric_cols] = cleaned_df[numeric_cols].ffill().bfill()

        # Recalculate dew point if temp and humidity present
        if "temperature" in cleaned_df.columns and "humidity" in cleaned_df.columns:
            cleaned_df["dew_point"] = [
                calculate_dew_point(t, rh) if pd.notnull(t) and pd.notnull(rh) else np.nan
                for t, rh in zip(cleaned_df["temperature"], cleaned_df["humidity"])
            ]

        return cleaned_df
