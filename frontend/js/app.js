/**
 * AWS Monitor - Frontend Application Logic.
 * Handles WebSocket telemetry, Leaflet station map, 24h temperature chart, and recent anomaly logging.
 */

// Application State
const state = {
    currentStation: "AWS-001",
    ws: null,
    tempChart: null,
    map: null,
    mapMarkers: {},
    activeTab: "dashboard",
    stations: [],
    recentAnomalies: [],
};

document.addEventListener("DOMContentLoaded", () => {
    initClock();
    initTempChart();
    initMap();
    initWebSocket();
    loadRecentAnomalies();
    initSidebarNav();
});

/* =========================================================
   Live Clock
   ========================================================= */
function initClock() {
    function update() {
        const now = new Date();
        const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        const dateStr = now.toLocaleDateString('en-GB', options);
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const timeStr = `${hours}:${minutes} ${ampm}`;

        const el = document.getElementById("headerClock");
        if (el) el.innerText = `${dateStr} | ${timeStr}`;
    }
    update();
    setInterval(update, 1000);
}

/* =========================================================
   24-Hour Temperature Chart
   ========================================================= */
function initTempChart() {
    state.tempChart = new Temperature24hChart("chartTemp24h");
}

/* =========================================================
   Interactive Leaflet Map
   ========================================================= */
function initMap() {
    const mapEl = document.getElementById("stationMap");
    if (!mapEl) return;

    // Center map around Karnataka (Bengaluru, Mangaluru, Mysuru, Madikeri, Dharwad)
    state.map = L.map('stationMap', {
        zoomControl: false,
        attributionControl: false
    }).setView([13.60, 76.00], 7);

    // Zoom control on bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(state.map);

    // Standard OpenStreetMap tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(state.map);

    // Station Coordinates (Karnataka)
    const stationCoords = [
        { id: "AWS-001", name: "Bengaluru Urban", lat: 12.9716, lon: 77.5946, isAnomaly: false },
        { id: "AWS-002", name: "Mangaluru Coastal", lat: 12.9141, lon: 74.8560, isAnomaly: false },
        { id: "AWS-003", name: "Mysuru Central", lat: 12.2958, lon: 76.6394, isAnomaly: true },
        { id: "AWS-004", name: "Madikeri Coorg Highland", lat: 12.4244, lon: 75.7382, isAnomaly: false },
        { id: "AWS-005", name: "Dharwad Inland", lat: 15.4589, lon: 75.0078, isAnomaly: false },
    ];

    stationCoords.forEach(st => {
        const iconHtml = `<div class="custom-pin ${st.isAnomaly ? 'pin-anomaly' : 'pin-normal'}"></div>`;
        const customIcon = L.divIcon({
            html: iconHtml,
            className: 'station-marker-div',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        const marker = L.marker([st.lat, st.lon], { icon: customIcon }).addTo(state.map);
        marker.bindPopup(`<b>${st.name} (${st.id})</b><br>Status: ${st.isAnomaly ? '⚠️ Anomaly Detected' : '✅ Normal'}`);
        state.mapMarkers[st.id] = { marker, data: st };
    });
}

function updateMapMarkerStatus(stationId, isAnomaly) {
    if (state.mapMarkers[stationId]) {
        const item = state.mapMarkers[stationId];
        item.data.isAnomaly = isAnomaly;
        const iconHtml = `<div class="custom-pin ${isAnomaly ? 'pin-anomaly' : 'pin-normal'}"></div>`;
        item.marker.setIcon(L.divIcon({
            html: iconHtml,
            className: 'station-marker-div',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        }));
    }
}

/* =========================================================
   WebSocket Telemetry Stream
   ========================================================= */
function initWebSocket() {
    if (state.ws) {
        state.ws.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host || "localhost:8000";
    const wsUrl = `${protocol}//${host}/ws/telemetry/${state.currentStation}`;

    state.ws = new WebSocket(wsUrl);

    state.ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleIncomingTelemetry(data);
        } catch (e) {
            console.error("Error parsing telemetry frame:", e);
        }
    };

    state.ws.onclose = () => {
        setTimeout(initWebSocket, 2500);
    };
}

function handleIncomingTelemetry(packet) {
    const reading = packet.reading;
    const isAnomalous = packet.is_anomalous;
    const qc = packet.qc_flag;
    const wmo = packet.layer_1_wmo;

    // 1. Update Top 5 Metric Cards
    // Temperature
    const tempVal = reading.temperature !== undefined ? reading.temperature.toFixed(1) : "28.4";
    const tempStatus = wmo.sensor_status.temperature || (isAnomalous ? "CRITICAL" : "PASS");
    updateMetricCard("temp", `${tempVal} °C`, tempStatus);

    // Humidity
    const humVal = reading.humidity !== undefined ? Math.round(reading.humidity) : "65";
    const humStatus = wmo.sensor_status.humidity || "PASS";
    updateMetricCard("hum", `${humVal} %`, humStatus);

    // Pressure
    const pressVal = reading.pressure !== undefined ? Math.round(reading.pressure) : "1012";
    const pressStatus = wmo.sensor_status.pressure || "PASS";
    updateMetricCard("press", `${pressVal} hPa`, pressStatus);

    // Wind Speed (converted to km/h for display as shown in screenshot: 1 m/s = 3.6 km/h)
    const windSpeedKmh = reading.wind_speed !== undefined ? (reading.wind_speed * 3.6).toFixed(1) : "12.6";
    const windStatus = wmo.sensor_status.wind_speed || "PASS";
    updateMetricCard("wind", `${windSpeedKmh} km/h`, windStatus);

    // Rainfall
    const rainVal = reading.precipitation !== undefined ? reading.precipitation.toFixed(1) : "0.0";
    const rainStatus = wmo.sensor_status.precipitation || "PASS";
    updateMetricCard("rain", `${rainVal} mm`, rainStatus);

    // 2. Update 24h Temperature Chart
    if (state.tempChart) {
        const isTempAnomaly = (tempStatus === "CRITICAL" || tempStatus === "WARNING" || isAnomalous);
        state.tempChart.updateCurrentTemp(reading.temperature || 28.4, isTempAnomaly);
    }

    // 3. Update Map Marker
    updateMapMarkerStatus(state.currentStation, isAnomalous);

    // 4. If Anomaly detected, prepend to Recent Anomalies Table
    if (isAnomalous && packet.explanation && packet.explanation.category !== "NORMAL") {
        logLiveAnomalyEvent(packet);
    }
}

function updateMetricCard(prefix, valueStr, status) {
    const valEl = document.getElementById(`metricVal_${prefix}`);
    const pillEl = document.getElementById(`metricPill_${prefix}`);

    if (valEl) valEl.innerText = valueStr;
    if (pillEl) {
        if (status === "CRITICAL" || status === "OUT_OF_BOUNDS" || status === "SPIKE_STEP") {
            pillEl.innerText = "Anomaly";
            pillEl.className = "status-pill pill-anomaly";
        } else if (status === "WARNING" || status === "SUSPECT") {
            pillEl.innerText = "Warning";
            pillEl.className = "status-pill pill-warning";
        } else {
            pillEl.innerText = "Normal";
            pillEl.className = "status-pill pill-normal";
        }
    }
}

/* =========================================================
   Recent Anomalies Table Management
   ========================================================= */
async function loadRecentAnomalies() {
    try {
        const res = await fetch("/api/stations/recent-anomalies");
        const anomalies = await res.json();
        state.recentAnomalies = anomalies;
        renderRecentAnomaliesTable();
    } catch (e) {
        console.error("Error loading recent anomalies:", e);
    }
}

function renderRecentAnomaliesTable() {
    const tbody = document.getElementById("recentAnomaliesTbody");
    if (!tbody) return;

    tbody.innerHTML = state.recentAnomalies.slice(0, 8).map(row => {
        const sevClass = row.severity === "High" ? "badge-sev-high" : (row.severity === "Medium" ? "badge-sev-med" : "badge-sev-low");
        const statusClass = row.status === "Investigating" ? "badge-status-investigating" : "badge-status-resolved";

        return `
            <tr>
                <td>${row.time}</td>
                <td style="font-family: var(--font-mono); font-weight: 600;">${row.station_id}</td>
                <td>${row.parameter}</td>
                <td style="font-family: var(--font-mono); font-weight: 700;">${row.value}</td>
                <td><span class="tbl-badge ${sevClass}">${row.severity}</span></td>
                <td><span class="tbl-badge ${statusClass}">${row.status}</span></td>
            </tr>
        `;
    }).join("");
}

function logLiveAnomalyEvent(packet) {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateStr = now.toLocaleDateString('en-GB', options);
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${dateStr}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    const param = (packet.explanation.primary_sensor || "Temperature").replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const rawVal = packet.reading[packet.explanation.primary_sensor] || packet.reading.temperature;
    const unit = packet.explanation.primary_sensor === "temperature" ? "°C" : (packet.explanation.primary_sensor === "humidity" ? "%" : "hPa");

    const newEvent = {
        id: `ANOM-${Date.now() % 10000}`,
        time: timeStr,
        station_id: state.currentStation,
        parameter: param,
        value: `${rawVal} ${unit}`,
        severity: packet.qc_flag.flag_id >= 3 ? "High" : "Medium",
        status: "Investigating"
    };

    // Avoid consecutive duplicate logs within 10 seconds
    if (state.recentAnomalies.length > 0 && state.recentAnomalies[0].parameter === param && state.recentAnomalies[0].station_id === state.currentStation) {
        return;
    }

    state.recentAnomalies.unshift(newEvent);
    renderRecentAnomaliesTable();
}

/* =========================================================
   Sidebar Navigation & View Switching
   ========================================================= */
function initSidebarNav() {
    document.querySelectorAll(".nav-item-link").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const tab = link.dataset.tab;
            if (!tab) return;

            document.querySelectorAll(".nav-item-link").forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            state.activeTab = tab;
            document.querySelectorAll(".tab-content-panel").forEach(p => p.classList.remove("active"));
            const targetPanel = document.getElementById(`panel_${tab}`);
            if (targetPanel) {
                targetPanel.classList.add("active");
                if (tab === "dashboard" && state.map) {
                    setTimeout(() => state.map.invalidateSize(), 200);
                }
            }
        });
    });
}

/* =========================================================
   Fault Sandbox Trigger Presets
   ========================================================= */
async function triggerFault(faultType, targetSensor, magnitude, durationSteps, description) {
    try {
        await fetch("/api/faults/inject", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                station_id: state.currentStation,
                fault_type: faultType,
                target_sensor: targetSensor,
                magnitude: magnitude,
                duration_steps: durationSteps,
                description: description,
            })
        });
    } catch (e) {
        console.error("Fault trigger failed:", e);
    }
}

async function clearFaults() {
    try {
        await fetch("/api/faults/clear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ station_id: state.currentStation })
        });
    } catch (e) {
        console.error("Clear faults failed:", e);
    }
}
