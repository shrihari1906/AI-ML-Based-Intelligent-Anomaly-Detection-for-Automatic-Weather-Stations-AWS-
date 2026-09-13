# 📡 AI/ML-Based Intelligent Anomaly Detection for Automatic Weather Stations (AWS)

An intelligent, multi-tier Quality Control (QC) and anomaly detection system for surface Automatic Weather Stations (AWS), combining **WMO-standard deterministic physical rules**, **dynamic statistical filters**, and **unsupervised Deep Learning Neural Autoencoders** with explainable root-cause attribution and real-time interactive telemetry visualization.

---

## 🌟 Key Features

### 1. Multi-Tier Hybrid Anomaly Engine
- **Layer 1: Deterministic WMO QC Rules**
  - *Gross Range Limits*: Verifies readings against climatological bounds (Temperature, Relative Humidity, Pressure, Wind Speed/Direction, Solar Radiation, Precipitation, Battery).
  - *Rate-of-Change (Step Test)*: Flags impulse spikes exceeding maximum allowable 1-minute and 1-hour deltas.
  - *Persistence Check (Flatline)*: Identifies locked-up transducers and frozen sensor mechanisms.
  - *Internal Physical Consistency*: Validates physical constraints (e.g., Magnus thermodynamic invariant $T_{dew} \le T_{dry}$, solar radiation at night, rain without humidity).
- **Layer 2: Statistical Dynamic Filters**
  - *Hampel Filter*: Median Absolute Deviation (MAD) robust outlier detection.
  - *Dynamic Rolling Z-Scores*: Real-time rolling window $\sigma$-deviation tracking.
  - *EWMA Drift Tracker*: Multi-timeframe exponential moving average trend divergence to detect gradual sensor decalibration.
- **Layer 3: AI/ML Multivariate Models**
  - *Isolation Forest*: Multi-dimensional spatial point anomaly isolation.
  - *Neural Autoencoder*: Deep neural architecture modeling high-dimensional physical interactions; reconstruction loss breakdown pinpoints the specific sensor breaking multivariate correlations.

### 2. Explainability & Root-Cause Attribution
- Automatically attributes culpability to offending sensors.
- Synthesizes human-readable diagnostic summaries and maintenance directives (e.g., *"⚠️ Temperature jumped +18°C (Step Test failed) + ML Reconstruction Error is 8.4x baseline. Check cable shielding and transducer grounding."*).

### 3. Intelligent Self-Healing & Imputation
- Performs thermodynamic and spline-based estimation for missing or corrupted sensor channels (e.g. restoring inverted Magnus humidity ratios or historical diurnal medians).

### 4. Interactive Simulation & Fault Injection Sandbox
- Real-time physics-based weather simulator modeling diurnal solar cycles, temperature curves, humidity anti-correlation, and thermal convective wind gusts.
- 1-Click Interactive Fault Injection Sandbox to test detectors against:
  - 🌡️ Temperature Spikes (+18°C)
  - ❄️ Humidity Sensor Lockup (Flatline 82.5%)
  - 📐 Thermodynamic Violations (Dew Point > Ambient Temperature)
  - 📉 Barometric Calibration Drift (-0.25 hPa/step)
  - ☀️ Solar Pyranometer Gross Limit Exceedances (1850 W/m²)
  - 🌪️ High-Frequency Wind Noise Bursts
  - 🔌 Battery Voltage Dropouts (9.8V)

### 5. Historical Batch CSV Analysis & WMO Compliance Scorecards
- Upload custom station CSV files or run 1-click evaluation on the bundled 800-record benchmark dataset with labeled ground-truth faults.
- Generates WMO compliance percentages, QC flag distributions (Valid, Suspect, Warning, Critical), and top failing sensors.

---

## 🚀 Quickstart Guide

### 1. Requirements
- Python 3.10+
- Dependencies: `fastapi`, `uvicorn`, `scikit-learn`, `pandas`, `numpy`, `scipy`, `websockets`

### 2. Launch the Application
```bash
python run_server.py
```

Open your browser to:
- **Web Dashboard**: [http://localhost:8000](http://localhost:8000)
- **Interactive REST API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Run Automated Tests
```bash
python -m pytest tests/
```

---

## 🏗️ System Architecture

```
aws/
├── backend/
│   ├── config.py             # WMO limits, station metadata, QC flag definitions
│   ├── data/
│   │   ├── simulator.py      # Physics-based diurnal weather generator
│   │   ├── fault_injector.py # Real-time fault injection state machine
│   │   ├── dataset_loader.py # CSV parser & benchmark generator
│   │   └── sample_data.csv   # Pre-generated benchmark dataset
│   ├── detector/
│   │   ├── rules_qc.py       # Layer 1: WMO deterministic range, step, flatline, consistency
│   │   ├── statistical_qc.py # Layer 2: Hampel filter, rolling Z-score, EWMA drift
│   │   ├── ml_models.py      # Layer 3: Isolation Forest & Neural Autoencoder
│   │   ├── ensemble.py       # Master multi-tier fusion & flag coordinator
│   │   ├── explainer.py      # Root cause attribution & maintenance narratives
│   │   └── imputer.py        # Physics-based missing/corrupted value reconstruction
│   └── app/
│       ├── main.py           # FastAPI entrypoint & static mounting
│       └── routes/
│           ├── stations.py   # Station profiles & WMO limits API
│           ├── inject.py     # Fault injection trigger and clear API
│           ├── analyze.py    # Batch CSV upload & report generation API
│           └── stream.py     # WebSocket real-time telemetry stream
├── frontend/
│   ├── index.html            # Dashboard UI
│   ├── css/styles.css        # Meteorology theme & glassmorphic styling
│   └── js/
│       ├── app.js            # WebSocket client, sandbox triggers, batch reporting
│       └── charts.js         # Canvas multi-sensor time-series renderer
├── tests/
│   ├── test_rules.py         # Unit tests for WMO rules
│   ├── test_ensemble.py      # Unit tests for statistical, ML, and ensemble
│   └── test_api.py           # Integration tests for FastAPI endpoints
├── run_server.py             # One-click launcher
└── README.md
```
