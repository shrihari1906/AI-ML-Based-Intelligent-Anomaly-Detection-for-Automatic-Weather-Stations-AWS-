import os
import pandas as pd
import numpy as np
import joblib
from sklearn.metrics import classification_report, confusion_matrix

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

    return X

def evaluate_pipeline(df: pd.DataFrame, X: pd.DataFrame, model, stuck_window: int = 7, if_threshold: float = 0.0):
    """
    Runs end-to-end detection with configurable stuck window and decision threshold.
    """
    y_true = df["is_anomaly_true"].to_numpy()
    scores = model.decision_function(X)

    # 1. IsolationForest trigger based on threshold
    if_flag = (scores < if_threshold)

    # 2. Stuck sensor trigger: rolling std near 0 over stuck_window readings
    rolling_std_stuck = df["temperature"].rolling(window=stuck_window, min_periods=stuck_window).std().fillna(1.0)
    stuck_flag = (rolling_std_stuck < 1e-4)

    # 3. Humidity dropout trigger
    hum_diff = df["humidity"].diff().fillna(0.0)
    dropout_flag = (df["humidity"] <= 0.0) | ((hum_diff < -50.0) & (df["humidity"] < 10.0))

    # 4. Spike trigger
    temp_diff = df["temperature"].diff().fillna(0.0)
    spike_flag = (df["temperature"] > 45.0) | (df["temperature"] < -10.0) | (temp_diff.abs() > 25.0) | (df["wind_speed"] > 25.0)

    # Combined detector prediction
    y_pred = (if_flag | stuck_flag | dropout_flag | spike_flag).astype(int)

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # Injected anomaly recall inspection
    stuck_caught = int(y_pred[500:515].sum())
    spike_caught = int(y_pred[1000])
    drop_caught = int(y_pred[1500:1510].sum())

    return {
        "stuck_window": stuck_window,
        "if_threshold": if_threshold,
        "y_pred": y_pred,
        "cm": cm,
        "tp": tp,
        "fp": fp,
        "tn": tn,
        "fn": fn,
        "stuck_caught": stuck_caught,
        "spike_caught": spike_caught,
        "drop_caught": drop_caught,
        "total_injected_caught": stuck_caught + spike_caught + drop_caught
    }

def main():
    model_file = "anomaly_model.pkl"
    data_file = "labeled_weather_data.csv"

    if not os.path.exists(model_file):
        raise FileNotFoundError(f"{model_file} not found. Run train_model.py first.")
    if not os.path.exists(data_file):
        raise FileNotFoundError(f"{data_file} not found. Run inject_anomalies.py first.")

    print(f"Loading model from {model_file}...")
    loaded = joblib.load(model_file)
    if isinstance(loaded, dict) and "model" in loaded:
        model = loaded["model"]
        feature_cols = loaded.get("features", None)
    else:
        model = loaded
        feature_cols = None

    print(f"Loading evaluation dataset from {data_file}...")
    df = pd.read_csv(data_file)
    y_true = df["is_anomaly_true"].to_numpy()

    print("Computing 16 engineered features...")
    X = engineer_features(df)
    if feature_cols:
        X = X[feature_cols]

    # Evaluate with stuck_window = 5 (reverted to 5 readings per user request)
    res_5 = evaluate_pipeline(df, X, model, stuck_window=5, if_threshold=0.0)

    print("\n" + "=" * 65)
    print("EVALUATION: STUCK-SENSOR THRESHOLD = 5 READINGS")
    print("=" * 65)
    print(classification_report(
        y_true,
        res_5["y_pred"],
        target_names=["Normal (0)", "Anomaly (1)"],
        digits=4
    ))

    print("CONFUSION MATRIX (Stuck Window = 5 Readings):")
    cm_df = pd.DataFrame(
        res_5["cm"],
        index=["Actual Normal (0)", "Actual Anomaly (1)"],
        columns=["Predicted Normal (0)", "Predicted Anomaly (1)"]
    )
    print(cm_df)

    print("\n" + "=" * 65)
    print("INSPECTING SPECIFIC INJECTED ANOMALY DETECTIONS (Window = 5)")
    print("=" * 65)
    print(f"1. Stuck sensor (rows 500-514, 15 rows): {res_5['stuck_caught']}/15 flagged as anomalous.")
    print("   (Note: Rows 504-514 detected; requires 5 consecutive identical readings to trigger.)")
    print(f"2. Temperature Spike (row 1000, temp={df.loc[1000, 'temperature']} °C): Flagged = {res_5['spike_caught'] == 1}")
    print(f"3. Humidity Dropout (rows 1500-1509, 10 rows): {res_5['drop_caught']}/10 flagged as anomalous.")
    print(f"Total Injected Anomaly Recall: {res_5['total_injected_caught']}/26 ({(res_5['total_injected_caught']/26*100):.1f}%)")
    print(f"False Positives: {res_5['fp']}")

    # Comparison summary across window sizes and thresholds
    print("\n" + "=" * 65)
    print("FALSE POSITIVES vs. RECALL COMPARISON ACROSS CONFIGURATIONS")
    print("=" * 65)
    configs = [
        ("Window=5, IF Contamination=0.02 (Baseline)", 5, 0.0),
        ("Window=7, IF Contamination=0.02 (Requested)", 7, 0.0),
        ("Window=8, IF Contamination=0.02", 8, 0.0),
        ("Window=10, IF Contamination=0.02", 10, 0.0),
        ("Window=7 + IF Tuned Threshold (-0.04)", 7, -0.04),
    ]

    summary_rows = []
    for label, win, thresh in configs:
        r = evaluate_pipeline(df, X, model, stuck_window=win, if_threshold=thresh)
        summary_rows.append({
            "Configuration": label,
            "False Positives": r["fp"],
            "FP Rate": f"{(r['fp']/len(df)*100):.2f}%",
            "Stuck (out of 15)": f"{r['stuck_caught']}/15",
            "Spike (out of 1)": f"{r['spike_caught']}/1",
            "Dropout (out of 10)": f"{r['drop_caught']}/10",
            "Total Injected Recall": f"{r['total_injected_caught']}/26 ({(r['total_injected_caught']/26*100):.1f}%)"
        })

    summary_table = pd.DataFrame(summary_rows)
    print(summary_table.to_string(index=False))

if __name__ == "__main__":
    main()
