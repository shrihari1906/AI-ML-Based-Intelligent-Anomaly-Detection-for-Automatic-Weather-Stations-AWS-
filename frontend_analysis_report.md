# Comprehensive Frontend Architecture & Technology Report
**Project: ClimaSense — Climate + Intelligent Sensing**

---

## Executive Summary

The project repository contains **two frontend implementations**:
1. **`frontend-react/` (Primary / Production Application)**:
   A modern, production-grade Single Page Application (SPA) built with **React 18**, **Vite**, and **Tailwind CSS**. It compiles into `frontend-react/dist` and is served live by the FastAPI backend at [http://localhost:8000](http://localhost:8000).
2. **`frontend/` (Legacy Prototype)**:
   An initial prototype utilizing vanilla **HTML5**, **CSS3**, and **Vanilla JavaScript** with external CDN dependencies.

---

## 1. Core Technology Stack & Libraries

| Category | Technology / Library | Version | Purpose in Frontend |
| :--- | :--- | :--- | :--- |
| **Framework** | **React** & **ReactDOM** | `^18.3.1` | Component-based UI hierarchy, state management, hooks (`useState`, `useEffect`, `useRef`, `useMemo`). |
| **Build Tool & Bundler** | **Vite** | `^6.0.3` | Instant Hot Module Replacement (HMR) development server and Rollup production bundler. |
| **Styling Engine** | **Tailwind CSS** | `^3.4.16` | Utility-first CSS framework, class-based dark mode (`darkMode: 'class'`), responsive grid layouts. |
| **CSS Preprocessing** | **PostCSS** & **Autoprefixer** | `^8.4.49` / `^10.4.20` | Automated CSS parsing and cross-browser vendor prefixing. |
| **Iconography** | **Lucide React** | `^0.468.0` | Comprehensive collection of 30+ SVG vector icons (`Activity`, `Gauge`, `Server`, `Radio`, `Zap`, `ShieldCheck`, etc.). |
| **Geospatial Mapping** | **Leaflet** | `^1.9.4` | Interactive tile maps, custom marker pins, popups, and zoom controls for Karnataka weather stations. |
| **Data Visualization** | **HTML5 Canvas API** | Native Browser API | High-performance 60 FPS real-time oscilloscope graphs, safe range bands, and sparklines. |
| **Typography** | **Google Fonts** | `Inter` & `JetBrains Mono` | Sleek modern typography for headings, metric values, and telemetry code blocks. |

---

## 2. Design System & Aesthetics (10/10 UI)

1. **Dual-Theme Engine (Light & Dark Modes)**:
   - Synchronized to the root `<html>` element (`class="dark"`) and stored in `localStorage`.
   - **Light Mode**: Clean white cards (`bg-white`), subtle slate borders (`border-slate-200/80`), gentle drop shadows.
   - **Dark Mode**: Deep slate canvas (`bg-slate-950`), elevated dark cards (`bg-slate-900`, `border-slate-800`), high-contrast crisp text.
2. **Glassmorphism & Ambient Glows**:
   - Translucent backdrops (`backdrop-blur-md`, `border-white/10`).
   - Color-coded glowing indicators for weather metrics:
     - **Air Warmth (Temperature)**: Rose / Coral (`#f43f5e`)
     - **Air Moisture (Humidity)**: Sky Blue (`#0284c7`)
     - **Air Pressure**: Emerald Green (`#10b981`)
     - **Breeze & Wind**: Indigo / Violet (`#6366f1`)
     - **Precipitation**: Blue (`#2563eb`)
3. **Micro-Animations & Visual Cues**:
   - Live heartbeat indicator with pulsing dot (`animate-pulse`) for active WebSocket connection.
   - Interactive hover lifts on cards (`hover:-translate-y-0.5 transition-all`).
   - Culprit sensor alert callouts (`animate-bounce`).
4. **Plain-English Explanations**:
   - Academic and algorithmic jargon (*Magnus invariant, WMO step limits, EWMA decalibration drift, Hampel MAD filter*) replaced with intuitive language: **Air Warmth**, **Air Moisture**, **Air Pressure**, **Breeze & Wind**, **Check 1: Physical Limits**, **Check 2: Spikes & Frozen Sensors**, **Check 3: AI Smart Pattern Check**.

---

## 3. Directory & File Structure (`frontend-react/`)

```
frontend-react/
├── package.json               # Dependencies and scripts (vite, vite build, preview)
├── vite.config.js             # Vite configuration with React plugin and proxy settings
├── tailwind.config.js         # Tailwind theme colors, dark mode configuration
├── postcss.config.js          # PostCSS configuration
├── index.html                 # Single page application HTML entry point
├── dist/                      # Production compiled bundle served by FastAPI
│   ├── index.html
│   └── assets/                # Fingerprinted JS & CSS bundles
└── src/
    ├── main.jsx               # React DOM root render
    ├── index.css              # Global styles, Tailwind directives, custom scrollbars
    ├── App.jsx                # Global state orchestrator, WebSockets, navigation
    └── components/
        ├── Navbar.jsx               # Header, theme toggle, station badge, notifications
        ├── Sidebar.jsx              # Tab navigation, active station fleet indicator
        ├── BrandLogo.jsx            # Custom ClimaSense SVG vector logo
        ├── MetricCards.jsx          # Live climate KPI cards with mini sparklines
        ├── TemperatureChart.jsx     # Canvas trajectory graph with safe expected band
        ├── StationMap.jsx           # Leaflet mini-map with Karnataka station markers
        ├── RecentAnomaliesTable.jsx # Audit feed with plain-English explanation column
        ├── FaultSandbox.jsx         # 1-click synthetic fault testing ground
        ├── LiveDataSection.jsx      # High-speed oscilloscope & REST API Intake Console
        ├── AnalyticsSection.jsx     # ML autoencoder loss, Isolation Forest & risk prediction
        ├── StationsSection.jsx      # Full Karnataka fleet manager & interactive map
        ├── ReportsSection.jsx       # WMO compliance audit & 800-record batch scanner
        ├── SettingsSection.jsx      # Threshold tuning sliders & security settings
        └── AuthModal.jsx            # Glassmorphism JWT login & registration modal
```

---

## 4. Component Details & Features

### A. Navigation & System Control
- **[`App.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/App.jsx)**:
  - Manages real-time WebSocket connection to `/ws/telemetry/{station_id}`.
  - Maintains 100-packet sliding buffer for high-frequency telemetry.
  - Controls station switching across all 5 Karnataka stations.
  - Features collapsible **"How it works in 3 Simple Steps"** guide drawer.
- **[`Navbar.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/components/Navbar.jsx)**:
  - Brand header displaying **ClimaSense** and tagline (*"Climate + intelligent sensing"*).
  - Quick Karnataka station selector badge and live stream heartbeat dot.
  - Light/Dark mode switcher with animated Sun and Moon icons.
  - User profile with JWT authentication status and Demo Admin login.
- **[`Sidebar.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/components/Sidebar.jsx)**:
  - Navigation menu for all 7 application views (*Dashboard, Live Weather Data, AI Health & Insights, Sensor Test Sandbox, Weather Stations, Health Reports, System Settings*).

---

### B. Live Weather Dashboard
- **[`MetricCards.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/components/MetricCards.jsx)**:
  - 5 primary climate cards: **Air Warmth**, **Air Moisture**, **Air Pressure**, **Breeze & Wind**, and **Precipitation**.
  - Mini SVG sparkline graphs showing the last 20 seconds of sensor trends.
  - Visual status badges: `Healthy`, `Check Sensor`, `Sensor Alert`.
- **[`TemperatureChart.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/components/TemperatureChart.jsx)**:
  - Real-time HTML5 Canvas trajectory graph.
  - Shaded **Safe Expected Range Band** (`20°C - 35°C`) for instant visual outlier identification.
  - Highlighted callouts on anomalous spikes (e.g. *Sudden Spike Detected: Recorded 42.3 °C*).
- **[`StationMap.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/components/StationMap.jsx)** & **[`StationsSection.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/components/StationsSection.jsx)**:
  - Embedded **Leaflet** map centered on Karnataka (`[13.60, 76.00]`).
  - Monitored stations:
    1. **AWS-001**: Bengaluru Urban (Deccan Plateau, 920 m)
    2. **AWS-002**: Mangaluru Coastal (Coastal Monsoon, 14 m)
    3. **AWS-003**: Mysuru Central (Semi-Arid, 763 m)
    4. **AWS-004**: Madikeri Coorg Highland (Western Ghats, 1,150 m)
    5. **AWS-005**: Dharwad Inland (Inland Basin, 750 m)

---

### C. Live Operations & IoT Ingestion Console
- **[`LiveDataSection.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/components/LiveDataSection.jsx)**:
  - **Multi-Channel Canvas Oscilloscope**: Synchronized waveform visualization for paired channels (*Air Warmth & Moisture*, *Humidity & Sunlight*, *Pressure & Wind*, *Composite Score*).
  - **3 Inspection Layers Explainer**:
    - *Check 1*: Physical Limits & Safety
    - *Check 2*: Spikes & Frozen Sensors
    - *Check 3*: AI Smart Pattern Check
  - **Live Sensor REST API & Ingestion Console**:
    - Real-time counters for `Total Records`, `Normal Records`, and `Flagged Anomalies`.
    - **1-Click Sensor Reading Sender**: Form to dispatch `POST /data` with test presets (*Normal 32.5°C*, *Heat Spike 52.5°C*, *Storm Wind 48 m/s*) and immediate JSON response preview.
    - **Live Ingested Feed**: Interactive table with All / Anomalies toggle.
    - **Integration Code Snippets**: Copyable snippets for **cURL**, **Python (`requests`)**, and **Arduino / ESP32 C++ (`HTTPClient`)**.

---

### D. AI Diagnostics & Fault Testing Ground
- **[`FaultSandbox.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/components/FaultSandbox.jsx)**:
  - Interactive simulator to inject 5 distinct sensor faults:
    1. *Heat Spike* (+18°C sudden jump)
    2. *Frozen Moisture* (85% stuck needle)
    3. *Physics Rule Broken* (Dew point > Temperature)
    4. *Slow Pressure Drift* (-0.4 hPa/step decalibration)
    5. *Sunlight Overload* (1,850 W/m² night error)
  - One-click *Reset All Sensors to Normal* button.
- **[`AnalyticsSection.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/components/AnalyticsSection.jsx)**:
  - Autoencoder latent reconstruction loss meter.
  - Isolation Forest multidimensional outlier score.
  - Sensor failure risk forecasting & remaining margin to failure table.
  - 4 Physical Law balance cards.

---

### E. Audits, Settings & Security
- **[`ReportsSection.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/components/ReportsSection.jsx)**:
  - Automated QC compliance audit scorecard.
  - Asynchronous 800-record AI benchmark scan via `/api/analyze/benchmark-sample`.
- **[`SettingsSection.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/components/SettingsSection.jsx)**:
  - Sliders for safety limits, spike thresholds, and neural sensitivity.
- **[`AuthModal.jsx`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend-react/src/components/AuthModal.jsx)**:
  - JWT authentication modal with Sign In, Sign Up, and **"Fill Demo Admin"** 1-click credentials.

---

## 5. Legacy Prototype (`frontend/`)

- Located in [`frontend/`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend):
  - [`index.html`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend/index.html)
  - [`css/styles.css`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend/css/styles.css)
  - [`js/app.js`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend/js/app.js)
  - [`js/charts.js`](file:///c:/Users/abhis/OneDrive/Desktop/aws/frontend/js/charts.js)
- Served as the fallback prototype if the React production bundle is not present.
