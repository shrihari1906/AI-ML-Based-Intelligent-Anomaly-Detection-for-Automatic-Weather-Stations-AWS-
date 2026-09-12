import os
import time
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest

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

def main():
    data_file = "labeled_weather_data.csv"
    model_file = "anomaly_model.pkl"

    if not os.path.exists(data_file):
        raise FileNotFoundError(f"{data_file} not found. Run inject_anomalies.py first.")

    print(f"Loading training data from {data_file}...")
    df = pd.read_csv(data_file)

    print("Computing engineered time-series features (rolling_std_5, diff_from_prev, rolling_mean_5)...")
    X = engineer_features(df)

    feature_cols = list(X.columns)
    print(f"\nTotal features ({len(feature_cols)}):")
    for i, col in enumerate(feature_cols, 1):
        print(f"  {i}. {col}")
    print(f"\nDataset shape: {X.shape}")
    print(f"NaN values remaining: {X.isnull().sum().sum()}")

    print("\nInitializing IsolationForest:")
    print(" - n_estimators = 100")
    print(" - contamination = 0.02")
    print(" - random_state = 42")

    model = IsolationForest(
        n_estimators=100,
        contamination=0.02,
        random_state=42
    )

    print("\nTraining IsolationForest model on all 16 features...")
    t0 = time.time()
    model.fit(X)
    elapsed = time.time() - t0
    print(f"Model training completed in {elapsed:.2f} seconds.")

    # Save trained model AND feature column order
    payload = {
        "model": model,
        "features": feature_cols
    }
    print(f"Saving model to '{model_file}'...")
    joblib.dump(payload, model_file)

    print("\n" + "=" * 50)
    print("TRAINING SUMMARY")
    print("=" * 50)
    print(f"Model saved successfully to: {model_file}")
    print(f"File size: {os.path.getsize(model_file):,} bytes")
    print(f"Model params: {model.get_params()}")

if __name__ == "__main__":
    main()
