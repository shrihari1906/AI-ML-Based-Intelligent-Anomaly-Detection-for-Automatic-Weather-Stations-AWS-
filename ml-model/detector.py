import os
import joblib
import pandas as pd
import numpy as np

# Load trained model and features once at module level
MODEL_FILE = "anomaly_model.pkl"
if not os.path.exists(MODEL_FILE):
    raise FileNotFoundError(f"Trained model '{MODEL_FILE}' not found. Please run train_model.py first.")

LOADED_PAYLOAD = joblib.load(MODEL_FILE)
if isinstance(LOADED_PAYLOAD, dict) and "model" in LOADED_PAYLOAD:
    MODEL = LOADED_PAYLOAD["model"]
    FEATURE_COLS = LOADED_PAYLOAD.get("features", None)
else:
    MODEL = LOADED_PAYLOAD
    FEATURE_COLS = None

BASE_FEATURES = ["temperature", "humidity", "pressure", "wind_speed"]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes time-series engineered features per column:
      1. rolling_std_5: rolling std over last 5 readings
      2. diff_from_prev: difference from previous reading
      3. rolling_mean_5: rolling mean over last 5 readings
    """
    X = pd.DataFrame(index=df.index)

    # Base features
    for col in BASE_FEATURES:
        X[col] = df[col]

    # Engineered features per base column
    for col in BASE_FEATURES:
        X[f"{col}_rolling_std_5"] = df[col].rolling(window=5, min_periods=1).std().fillna(0.0)
        X[f"{col}_diff_from_prev"] = df[col].diff().fillna(0.0)
        X[f"{col}_rolling_mean_5"] = df[col].rolling(window=5, min_periods=1).mean().bfill().fillna(0.0)

    if FEATURE_COLS:
        X = X[FEATURE_COLS]

    return X

def detect_anomaly(readings: list[dict]) -> dict:
    """
    Detects anomalies in Automatic Weather Station (AWS) sensor readings using
    a sliding window of recent readings to capture temporal patterns.

    Parameters:
        readings (list[dict]): A chronological list of recent sensor readings (e.g. 5-10
                               readings), where the last item is the current reading to evaluate.
                               Each dict has keys: "temperature", "humidity", "pressure", "wind_speed".

    Returns:
        dict: {"is_anomaly": bool, "score": float, "reason": str}
    """
    if not readings or not isinstance(readings, list):
        raise ValueError("readings must be a non-empty list of dictionaries.")

    # Convert list of readings to DataFrame
    df = pd.DataFrame(readings)

    # Ensure required base feature columns exist
    for col in BASE_FEATURES:
        if col not in df.columns:
            df[col] = 0.0

    # Engineer time-series features over the window
    X_features = engineer_features(df)

    # Extract the current (latest) reading feature vector
    latest_feature_vector = X_features.iloc[[-1]]

    # Model inference: 1 = normal, -1 = anomaly
    pred = MODEL.predict(latest_feature_vector)[0]
    score = float(MODEL.decision_function(latest_feature_vector)[0])

    latest_reading = readings[-1]
    temp = latest_reading.get("temperature", 0.0)
    humidity = latest_reading.get("humidity", 0.0)
    pressure = latest_reading.get("pressure", 1013.0)
    wind_speed = latest_reading.get("wind_speed", 0.0)

    # Retrieve engineered features for the latest step
    temp_rolling_std = float(latest_feature_vector.get("temperature_rolling_std_5", pd.Series([1.0])).iloc[0])
    temp_diff = float(latest_feature_vector.get("temperature_diff_from_prev", pd.Series([0.0])).iloc[0])
    hum_diff = float(latest_feature_vector.get("humidity_diff_from_prev", pd.Series([0.0])).iloc[0])

    # Temporal pattern flags
    # Stuck sensor: requires constant value for >= 5 readings (reverted per user request)
    is_stuck = len(readings) >= 5 and (temp_rolling_std < 1e-4 or all(r.get("temperature") == temp for r in readings[-5:]))
    is_dropout = humidity <= 0.0 or (hum_diff < -50.0 and humidity < 10.0)
    is_spike = temp > 45.0 or temp < -10.0 or abs(temp_diff) > 25.0 or wind_speed > 25.0

    # Flag anomaly if IsolationForest detects outlier OR domain physical check triggers
    is_anomaly = (pred == -1) or is_stuck or is_dropout or is_spike

    if not is_anomaly:
        return {
            "is_anomaly": False,
            "score": round(score, 4),
            "reason": "normal"
        }

    # Determine specific human-readable explanation
    reasons = []
    if is_stuck:
        reasons.append(f"stuck sensor (temperature constant at {temp} °C for >= 5 readings)")
    if is_dropout:
        reasons.append(f"sensor dropout (humidity at {humidity}%)")
    if temp > 45.0 or temp < -10.0:
        reasons.append(f"temperature out of range ({temp} °C)")
    elif abs(temp_diff) > 20.0:
        reasons.append(f"temperature spike ({temp_diff:+.1f} °C jump)")
    if wind_speed > 25.0:
        reasons.append(f"wind speed spike ({wind_speed} m/s)")
    if pressure < 950.0 or pressure > 1060.0:
        reasons.append(f"pressure out of range ({pressure} hPa)")

    if reasons:
        reason = "; ".join(reasons)
    else:
        reason = "unusual sensor pattern"

    return {
        "is_anomaly": True,
        "score": round(score, 4),
        "reason": reason
    }

if __name__ == "__main__":
    print("=" * 65)
    print("TESTING DETECTOR MODULE (Window-Based Anomaly Detection)")
    print("=" * 65)

    # 1. Normal sequence of 5 weather readings
    normal_window = [
        {"temperature": 18.2, "humidity": 70.0, "pressure": 1014.0, "wind_speed": 2.1},
        {"temperature": 18.5, "humidity": 68.0, "pressure": 1013.8, "wind_speed": 2.3},
        {"temperature": 19.1, "humidity": 65.0, "pressure": 1013.5, "wind_speed": 2.8},
        {"temperature": 19.8, "humidity": 63.0, "pressure": 1013.0, "wind_speed": 3.0},
        {"temperature": 20.2, "humidity": 61.0, "pressure": 1012.8, "wind_speed": 3.2},
    ]
    res_normal = detect_anomaly(normal_window)
    print("\n[Test 1 - Normal Reading Window]")
    print(f"Current Reading: {normal_window[-1]}")
    print(f"Result: {res_normal}")

    # 2. Stuck Sensor: temperature constant at 17.32 °C across 5 consecutive readings
    stuck_window = [
        {"temperature": 17.32, "humidity": 75.0, "pressure": 1015.0, "wind_speed": 2.0},
        {"temperature": 17.32, "humidity": 74.0, "pressure": 1015.0, "wind_speed": 2.0},
        {"temperature": 17.32, "humidity": 72.0, "pressure": 1015.0, "wind_speed": 2.0},
        {"temperature": 17.32, "humidity": 71.0, "pressure": 1015.0, "wind_speed": 2.0},
        {"temperature": 17.32, "humidity": 70.0, "pressure": 1015.0, "wind_speed": 2.0},
    ]
    res_stuck = detect_anomaly(stuck_window)
    print("\n[Test 2 - Stuck Sensor Window (5 readings)]")
    print(f"Current Reading: {stuck_window[-1]}")
    print(f"Result: {res_stuck}")

    # 3. Temperature Spike: sudden jump to 60 °C
    spike_window = [
        {"temperature": 18.0, "humidity": 65.0, "pressure": 1012.0, "wind_speed": 3.0},
        {"temperature": 18.2, "humidity": 64.0, "pressure": 1012.0, "wind_speed": 3.0},
        {"temperature": 18.4, "humidity": 63.0, "pressure": 1012.0, "wind_speed": 3.0},
        {"temperature": 18.5, "humidity": 62.0, "pressure": 1012.0, "wind_speed": 3.0},
        {"temperature": 60.0, "humidity": 60.0, "pressure": 1008.0, "wind_speed": 12.0},
    ]
    res_spike = detect_anomaly(spike_window)
    print("\n[Test 3 - Temperature Spike Window]")
    print(f"Current Reading: {spike_window[-1]}")
    print(f"Result: {res_spike}")

    # 4. Humidity Dropout: sudden drop to 0%
    dropout_window = [
        {"temperature": 17.5, "humidity": 78.0, "pressure": 1016.0, "wind_speed": 2.0},
        {"temperature": 17.6, "humidity": 76.0, "pressure": 1016.0, "wind_speed": 2.0},
        {"temperature": 17.7, "humidity": 75.0, "pressure": 1016.0, "wind_speed": 2.0},
        {"temperature": 17.8, "humidity": 74.0, "pressure": 1016.0, "wind_speed": 2.0},
        {"temperature": 17.9, "humidity": 0.0, "pressure": 1016.0, "wind_speed": 2.0},
    ]
    res_dropout = detect_anomaly(dropout_window)
    print("\n[Test 4 - Humidity Dropout Window]")
    print(f"Current Reading: {dropout_window[-1]}")
    print(f"Result: {res_dropout}")
