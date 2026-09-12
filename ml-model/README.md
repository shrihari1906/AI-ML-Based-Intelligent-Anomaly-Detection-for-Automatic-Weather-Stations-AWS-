# AWS Anomaly Detection — IsolationForest + Rule-Based Pipeline

A hackathon prototype for real-time anomaly detection on **Automatic Weather Station (AWS)** sensor data, combining an unsupervised machine learning model with temporal sliding-window rules to catch three categories of hardware and sensor faults.

---

## What This Model Does

Weather stations continuously stream four sensor readings every hour:
- **Temperature** (°C)
- **Humidity** (%)
- **Pressure** (hPa)
- **Wind Speed** (m/s)

This system detects when those readings are anomalous using a **two-layer detection pipeline**:

### Layer 1 — IsolationForest (scikit-learn)

A `IsolationForest(n_estimators=100, contamination=0.02, random_state=42)` model trained on **16 engineered features** per reading:

- The 4 base sensor values
- Per-sensor **rolling standard deviation** over the last 5 readings (`*_rolling_std_5`) — catches stuck sensors
- Per-sensor **difference from previous reading** (`*_diff_from_prev`) — catches sudden spikes and drops
- Per-sensor **rolling mean** over the last 5 readings (`*_rolling_mean_5`) — provides local baseline context

### Layer 2 — Temporal Domain Rules

After IsolationForest scoring, explicit physics-informed checks are applied over a sliding window of recent readings:

| Rule | Condition | Anomaly Type |
|:-----|:----------|:-------------|
| **Stuck sensor** | Temperature constant (std < 1e-4) for >= 5 consecutive readings | Hardware fault |
| **Sensor dropout** | Humidity <= 0% or sudden drop > 50% to near-zero | Sensor failure |
| **Temperature spike** | Temperature > 45 C or < -10 C, or jump > 25 C in one step | Out-of-range reading |
| **Wind spike** | Wind speed > 25 m/s | Out-of-range reading |
| **Pressure anomaly** | Pressure < 950 hPa or > 1060 hPa | Out-of-range reading |

A reading is flagged anomalous if **either** the IsolationForest OR any domain rule triggers.

---

## Dataset

**Source:** [Historical Hourly Weather Data 2012-2017](https://www.kaggle.com/datasets/selfishgene/historical-hourly-weather-data) — Kaggle

**City Used:** San Diego, CA (chosen for fewest missing values: only 1 missing temperature row out of 45,253)

**Date Range:** October 2012 - November 2017 (45,253 hourly readings)

**Files Used from Dataset:**
- `temperature.csv` — Kelvin, converted to Celsius (subtract 273.15)
- `humidity.csv`
- `pressure.csv`
- `wind_speed.csv`

> **Note:** The raw dataset CSVs are **not included** in this repository (too large for GitHub). Download them from Kaggle and place them in a `raw_data/` folder one level above this directory, then run `prepare_data.py` to regenerate `clean_weather_data.csv`.

---

## Model Performance

Evaluated on `labeled_weather_data.csv` (45,253 rows with 26 synthetically injected ground-truth anomalies).

### Classification Report (End-to-End Detector Pipeline)

```
              precision    recall  f1-score   support

  Normal (0)     0.9999    0.9773    0.9885     45227
 Anomaly (1)     0.0210    0.8462    0.0410        26

    accuracy                         0.9773     45253
   macro avg     0.5105    0.9117    0.5148     45253
weighted avg     0.9993    0.9773    0.9879     45253
```

### Confusion Matrix

```
                    Predicted Normal (0)  Predicted Anomaly (1)
Actual Normal (0)                  44202                   1025
Actual Anomaly (1)                     4                     22
```

### Injected Anomaly Recall Breakdown

| Anomaly Type | Description | Detected |
|:-------------|:------------|:--------:|
| **Stuck Sensor** | 15 consecutive rows with temperature locked at 17.32 C | 11 / 15 |
| **Temperature Spike** | Single reading at 60.0 C | 1 / 1 |
| **Humidity Dropout** | 10 consecutive rows with humidity forced to 0% | 10 / 10 |
| **Total** | | **22 / 26 (84.6%)** |

> The 4 missed stuck-sensor rows are the **first 4 rows** of the 15-row sequence — the window hasn't accumulated 5 identical readings yet, so it doesn't trigger until the 5th consecutive identical value.

---

## Project Structure

```
ml-model/
├── prepare_data.py          # Loads + cleans raw CSVs -> clean_weather_data.csv
├── inject_anomalies.py      # Injects synthetic anomalies -> labeled_weather_data.csv
├── train_model.py           # Trains IsolationForest on 16 features -> anomaly_model.pkl
├── evaluate_model.py        # Evaluates model, prints classification_report + confusion matrix
├── detector.py              # Real-time detector (main module to import in production)
├── clean_weather_data.csv   # Cleaned 45,253-row San Diego dataset (no anomalies)
├── labeled_weather_data.csv # Dataset with ground-truth is_anomaly_true labels
├── anomaly_model.pkl        # Serialized trained IsolationForest + feature list
└── data_overview.png        # 4-panel time-series overview plot
```

---

## How to Reproduce

```bash
# 1. Install dependencies
pip install pandas numpy scikit-learn matplotlib joblib

# 2. Place raw Kaggle CSVs into ../raw_data/ (one level above ml-model/)

# 3. Run the pipeline in order
python prepare_data.py       # Generates clean_weather_data.csv
python inject_anomalies.py   # Generates labeled_weather_data.csv
python train_model.py        # Trains model -> anomaly_model.pkl
python evaluate_model.py     # Prints classification report and confusion matrix

# 4. Test the live detector
python detector.py
```

---

## Using `detector.py` in Production

### Function Signature

```python
from detector import detect_anomaly

result = detect_anomaly(readings: list[dict]) -> dict
```

### Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `readings` | `list[dict]` | A **chronological** list of recent sensor readings. Must contain **at least 5 readings** for stuck-sensor detection to work. Recommended: pass the **last 10 readings** including the current one. |

Each reading dict must have these keys:

| Key | Type | Unit |
|:----|:-----|:-----|
| `"temperature"` | `float` | Celsius |
| `"humidity"` | `float` | % |
| `"pressure"` | `float` | hPa |
| `"wind_speed"` | `float` | m/s |

### Return Value

```python
{
    "is_anomaly": bool,   # True if anomaly detected, False if normal
    "score": float,       # IsolationForest decision score (negative = more anomalous)
    "reason": str         # Human-readable explanation
}
```

**Possible `reason` values:**

| Reason | Trigger |
|:-------|:--------|
| `"normal"` | No anomaly detected |
| `"stuck sensor (temperature constant at X C for >= 5 readings)"` | Hardware fault |
| `"sensor dropout (humidity at X%)"` | Sensor failure |
| `"temperature out of range (X C)"` | Implausible temperature |
| `"temperature spike (+X.X C jump)"` | Sudden large jump |
| `"wind speed spike (X m/s)"` | Extreme wind reading |
| `"pressure out of range (X hPa)"` | Implausible pressure |
| `"unusual sensor pattern"` | Multivariate outlier (IsolationForest catch-all) |

### Working Example

```python
from detector import detect_anomaly

# Pass the last 10 hourly readings from your AWS stream (oldest to newest)
window = [
    {"temperature": 18.1, "humidity": 72.0, "pressure": 1013.5, "wind_speed": 2.5},
    {"temperature": 18.3, "humidity": 71.0, "pressure": 1013.4, "wind_speed": 2.6},
    {"temperature": 18.5, "humidity": 70.0, "pressure": 1013.3, "wind_speed": 2.7},
    {"temperature": 18.6, "humidity": 69.5, "pressure": 1013.2, "wind_speed": 2.8},
    {"temperature": 18.7, "humidity": 69.0, "pressure": 1013.1, "wind_speed": 3.0},
    {"temperature": 18.8, "humidity": 68.5, "pressure": 1013.0, "wind_speed": 3.1},
    {"temperature": 18.9, "humidity": 68.0, "pressure": 1012.9, "wind_speed": 3.2},
    {"temperature": 19.0, "humidity": 67.5, "pressure": 1012.8, "wind_speed": 3.3},
    {"temperature": 19.1, "humidity": 67.0, "pressure": 1012.7, "wind_speed": 3.4},
    {"temperature": 19.2, "humidity": 66.5, "pressure": 1012.6, "wind_speed": 3.5},  # current reading
]

# Normal reading
result = detect_anomaly(window)
print(result)
# {'is_anomaly': False, 'score': 0.1834, 'reason': 'normal'}

# Temperature spike
spike_window = window[:-1] + [{"temperature": 60.0, "humidity": 66.5, "pressure": 1012.6, "wind_speed": 3.5}]
result = detect_anomaly(spike_window)
print(result)
# {'is_anomaly': True, 'score': -0.1424, 'reason': 'temperature out of range (60.0 C)'}

# Stuck sensor
stuck_window = [{"temperature": 17.32, "humidity": 70.0, "pressure": 1015.0, "wind_speed": 2.0}
                for _ in range(10)]
result = detect_anomaly(stuck_window)
print(result)
# {'is_anomaly': True, 'score': 0.176, 'reason': 'stuck sensor (temperature constant at 17.32 C for >= 5 readings)'}

# Humidity dropout
dropout_window = window[:-1] + [{"temperature": 19.2, "humidity": 0.0, "pressure": 1012.6, "wind_speed": 3.5}]
result = detect_anomaly(dropout_window)
print(result)
# {'is_anomaly': True, 'score': 0.047, 'reason': 'sensor dropout (humidity at 0.0%)'}
```

---

## Notes and Limitations

- **Model requires** `anomaly_model.pkl` to be present in the **same directory** as `detector.py` when imported. The model is loaded once at module import time for efficiency.
- **Contamination rate** is set to `0.02` (2%), meaning the IsolationForest expects approximately 2% of data to be anomalous. Adjust this in `train_model.py` to tune sensitivity.
- The stuck-sensor rule currently only detects **temperature** freezes. Extending it to check humidity, pressure, and wind_speed would further improve recall.
- False positives (~1,025 out of 45,227 normal rows, 2.3%) are primarily caused by the IsolationForest's fixed contamination threshold flagging naturally rare but valid weather extremes in the 5-year San Diego dataset.
- `prepare_data.py` requires the raw Kaggle CSVs in `../raw_data/`. The cleaned outputs (`clean_weather_data.csv`, `labeled_weather_data.csv`) are included directly so you can retrain without the raw data.
