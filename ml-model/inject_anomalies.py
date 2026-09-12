import os
import pandas as pd

def main():
    input_file = "clean_weather_data.csv"
    output_file = "labeled_weather_data.csv"

    if not os.path.exists(input_file):
        raise FileNotFoundError(f"{input_file} not found. Please run prepare_data.py first.")

    print(f"Loading cleaned data from {input_file}...")
    df = pd.read_csv(input_file)

    # Initialize ground truth anomaly label column
    df["is_anomaly_true"] = 0

    print("\n" + "=" * 50)
    print("INJECTING SYNTHETIC ANOMALIES")
    print("=" * 50)

    # Anomaly 1: Stuck Sensor (~15 consecutive rows starting around row 500)
    # Range: rows 500 to 514 inclusive (15 rows)
    stuck_start = 500
    stuck_len = 15
    stuck_end = stuck_start + stuck_len  # 515 (slice 500:514 inclusive)
    stuck_value = float(df.loc[stuck_start, "temperature"])
    print(f"\n1. Injecting 'Stuck Sensor' anomaly:")
    print(f"   Indices: rows {stuck_start} to {stuck_end - 1} ({stuck_len} consecutive rows)")
    print(f"   Original temperatures before injection:\n   {df.loc[stuck_start:stuck_end-1, 'temperature'].tolist()}")
    df.loc[stuck_start:stuck_end - 1, "temperature"] = stuck_value
    df.loc[stuck_start:stuck_end - 1, "is_anomaly_true"] = 1
    print(f"   Forced temperature to constant: {stuck_value} °C")

    # Anomaly 2: Spike (set one temperature reading to 60 around row 1000)
    spike_idx = 1000
    orig_spike_temp = df.loc[spike_idx, "temperature"]
    print(f"\n2. Injecting 'Temperature Spike' anomaly:")
    print(f"   Index: row {spike_idx}")
    print(f"   Original temperature: {orig_spike_temp} °C -> Injected: 60.0 °C")
    df.loc[spike_idx, "temperature"] = 60.0
    df.loc[spike_idx, "is_anomaly_true"] = 1

    # Anomaly 3: Dropout (~10 consecutive humidity readings to 0 around row 1500)
    # Range: rows 1500 to 1509 inclusive (10 rows)
    dropout_start = 1500
    dropout_len = 10
    dropout_end = dropout_start + dropout_len  # 1510 (slice 1500:1509 inclusive)
    print(f"\n3. Injecting 'Humidity Dropout' anomaly:")
    print(f"   Indices: rows {dropout_start} to {dropout_end - 1} ({dropout_len} consecutive rows)")
    print(f"   Original humidity before injection:\n   {df.loc[dropout_start:dropout_end-1, 'humidity'].tolist()}")
    df.loc[dropout_start:dropout_end - 1, "humidity"] = 0.0
    df.loc[dropout_start:dropout_end - 1, "is_anomaly_true"] = 1
    print(f"   Forced humidity readings to: 0.0 %")

    # Save to labeled_weather_data.csv
    df.to_csv(output_file, index=False)
    print(f"\nSaved labeled dataset to '{output_file}'.")

    # Print summary statistics
    anomaly_count = int(df["is_anomaly_true"].sum())
    total_count = len(df)
    print("\n" + "=" * 50)
    print("ANOMALY INJECTION SUMMARY")
    print("=" * 50)
    print(f"Total Rows: {total_count}")
    print(f"Anomalous Rows Marked: {anomaly_count} ({(anomaly_count / total_count * 100):.3f}%)")
    print(f"Normal Rows: {total_count - anomaly_count}")
    print("\nAnomalous Rows Preview:")
    print(df[df["is_anomaly_true"] == 1][["datetime", "temperature", "humidity", "pressure", "wind_speed", "is_anomaly_true"]].head(20))

if __name__ == "__main__":
    main()
