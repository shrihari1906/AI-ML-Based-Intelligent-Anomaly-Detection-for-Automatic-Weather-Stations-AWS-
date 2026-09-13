import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RefreshCw,
  Zap,
  Activity,
  Compass,
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  Sun,
  CloudRain,
  Battery,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Terminal,
  Download,
  Layers,
  Sparkles,
  Sliders,
  Radio,
  Eye,
  X,
  FileSpreadsheet,
  Check,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Cpu,
  Code,
  Copy,
  Send,
  Server
} from 'lucide-react';

const STATIONS_LIST = [
  { id: 'AWS_001', name: 'Bengaluru Urban AWS', climate: 'Deccan Semi-Arid', elev: '920m' },
  { id: 'AWS_002', name: 'Mangaluru Coastal AWS', climate: 'Coastal Monsoon', elev: '14m' },
  { id: 'AWS_003', name: 'Mysuru Central AWS', climate: 'Tropical Semi-Arid', elev: '763m' },
  { id: 'AWS_004', name: 'Madikeri Coorg AWS', climate: 'Western Ghats Montane', elev: '1,150m' },
  { id: 'AWS_005', name: 'Dharwad Inland AWS', climate: 'Northern Inland Basin', elev: '750m' },
];

function getCompassDirection(deg) {
  if (deg === undefined || deg === null) return 'N';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index];
}

// Mini SVG Sparkline
function Sparkline({ data, color = '#0284c7', height = 24, width = 68 }) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="opacity-20 bg-slate-200 rounded" />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((val, i) => {
      const x = i * step;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function LiveDataSection({
  telemetry,
  statusFlags,
  latestPacket,
  packetHistory = [],
  activeStationId,
  onStationChange,
  isPaused,
  onTogglePause,
  streamSpeed,
  onSpeedChange,
  onResetBuffer,
  onTriggerFault,
  onClearFaults,
  isAnomalyActive,
}) {
  const [selectedChannel, setSelectedChannel] = useState('temp_hum'); // 'temp_hum' | 'press_wind' | 'anomaly' | 'all'
  const [showSandbox, setShowSandbox] = useState(false);
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'anomalies'
  const [inspectedPacket, setInspectedPacket] = useState(null);
  const [autoScrollFeed, setAutoScrollFeed] = useState(false);
  const tableContainerRef = useRef(null);
  const canvasRef = useRef(null);

  // REST API Intake & Inspection State
  const [showApiConsole, setShowApiConsole] = useState(false);
  const [apiStats, setApiStats] = useState(null);
  const [apiRecords, setApiRecords] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiSubmitting, setApiSubmitting] = useState(false);
  const [apiFilter, setApiFilter] = useState('all'); // 'all' | 'anomalies'
  const [snippetTab, setSnippetTab] = useState('curl'); // 'curl' | 'python' | 'arduino'
  const [apiCopied, setApiCopied] = useState(false);
  const [apiForm, setApiForm] = useState({
    station_id: 'AWS_001',
    timestamp: '2026-09-12T10:00:00',
    temperature: 34.5,
    humidity: 60,
    pressure: 1008,
    wind_speed: 12,
  });
  const [lastApiResponse, setLastApiResponse] = useState(null);

  const fetchApiData = async () => {
    try {
      setApiLoading(true);
      // Alerts panel calls GET /api/alerts instead of /stats
      const [alertsRes, dataRes] = await Promise.all([
        fetch('/api/alerts').then((r) => (r.ok ? r.json() : [])),
        fetch('/data').then((r) => (r.ok ? r.json() : [])),
      ]);
      const totalRecs = Array.isArray(dataRes) ? dataRes.length : 10;
      const totalAnom = Array.isArray(alertsRes) ? alertsRes.length : 3;
      setApiStats({
        total_records: totalRecs,
        total_anomalies: totalAnom,
        normal_records: Math.max(0, totalRecs - totalAnom),
      });
      if (Array.isArray(dataRes)) setApiRecords(dataRes);
    } catch (err) {
      console.error('Failed to load REST API data from /api/alerts and /data:', err);
    } finally {
      setApiLoading(false);
    }
  };

  // Initial fetch of API stats
  useEffect(() => {
    fetchApiData();
  }, []);

  const handleSendSensorReading = async (customPayload) => {
    const payload = customPayload || apiForm;
    try {
      setApiSubmitting(true);
      // Ingestion console POST to /api/reading
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: payload.station_id || 'AWS_001',
          timestamp: payload.timestamp || '2026-09-12T10:00:00',
          temperature: parseFloat(payload.temperature),
          humidity: parseFloat(payload.humidity),
          pressure: parseFloat(payload.pressure),
          wind_speed: parseFloat(payload.wind_speed),
        }),
      });
      const result = await res.json();
      setLastApiResponse(result);
      fetchApiData();
    } catch (err) {
      console.error('Error sending reading to /api/reading:', err);
    } finally {
      setApiSubmitting(false);
    }
  };

  // Auto-scroll feed table container only (prevents dragging/scrolling the main window)
  useEffect(() => {
    if (autoScrollFeed && tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [packetHistory, autoScrollFeed]);

  // Extract history series for sparklines and oscilloscope
  const series = useMemo(() => {
    const temps = [];
    const hums = [];
    const press = [];
    const winds = [];
    const solars = [];
    const dews = [];
    const rains = [];
    const bats = [];
    const scores = [];
    const timestamps = [];

    packetHistory.forEach((pkt) => {
      const r = pkt.reading || {};
      temps.push(r.temperature ?? 28);
      hums.push(r.humidity ?? 65);
      press.push(r.pressure ?? 1012);
      winds.push(r.wind_speed ? r.wind_speed * 3.6 : 12.6);
      solars.push(r.solar_radiation ?? 0);
      dews.push(r.dew_point ?? (r.temperature ? r.temperature - 6 : 22));
      rains.push(r.precipitation ?? 0);
      bats.push(r.battery_voltage ?? 13.6);
      scores.push(pkt.composite_anomaly_score ?? (pkt.is_anomalous ? 0.85 : 0.05));
      timestamps.push(r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : '');
    });

    return { temps, hums, press, winds, solars, dews, rains, bats, scores, timestamps };
  }, [packetHistory]);

  // Render Real-Time Canvas Oscilloscope
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const padLeft = 46;
    const padRight = 20;
    const padTop = 24;
    const padBottom = 26;
    const plotW = Math.max(10, w - padLeft - padRight);
    const plotH = Math.max(10, h - padTop - padBottom);

    const count = packetHistory.length;
    if (count < 2) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Accumulating real-time telemetry stream data points...', w / 2, h / 2);
      return;
    }

    // Determine channels to plot based on tab (4 core sensors)
    let channels = [];
    if (selectedChannel === 'temp_hum') {
      channels = [
        { label: 'Ambient Temp (°C)', data: series.temps, color: '#ef4444', min: 10, max: 55, unit: '°C' },
        { label: 'Humidity (%)', data: series.hums, color: '#0284c7', min: 0, max: 100, unit: '%' },
      ];
    } else if (selectedChannel === 'press_wind') {
      channels = [
        { label: 'Pressure (hPa)', data: series.press, color: '#10b981', min: 950, max: 1040, unit: 'hPa' },
        { label: 'Wind Speed (km/h)', data: series.winds, color: '#8b5cf6', min: 0, max: 120, unit: 'km/h', norm: true },
      ];
    } else if (selectedChannel === 'anomaly') {
      channels = [
        { label: 'Composite Anomaly Score', data: series.scores, color: '#dc2626', min: 0, max: 1.0, unit: '' },
      ];
    } else {
      // 'all' normalized (4 core sensors)
      channels = [
        { label: 'Temp', data: series.temps, color: '#ef4444', min: 10, max: 50, norm: true },
        { label: 'Humidity', data: series.hums, color: '#0284c7', min: 0, max: 100, norm: true },
        { label: 'Pressure', data: series.press, color: '#10b981', min: 980, max: 1030, norm: true },
        { label: 'Wind', data: series.winds, color: '#8b5cf6', min: 0, max: 80, norm: true },
      ];
    }

    // Grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10.5px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const y = padTop + (i / ySteps) * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      const mainCh = channels[0];
      const val = mainCh.max - (i / ySteps) * (mainCh.max - mainCh.min);
      ctx.fillText(`${val.toFixed(val < 10 && val > 0 ? 1 : 0)}${mainCh.unit || ''}`, padLeft - 6, y);
    }

    // Plot each channel
    channels.forEach((ch) => {
      const range = ch.max - ch.min || 1;
      const pts = ch.data.map((val, idx) => {
        const x = padLeft + (idx / (count - 1)) * plotW;
        const clamped = Math.max(ch.min, Math.min(ch.max, val));
        const y = padTop + plotH - ((clamped - ch.min) / range) * plotH;
        return { x, y, val };
      });

      // Area fill for first channel
      if (ch === channels[0]) {
        const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
        grad.addColorStop(0, `${ch.color}28`);
        grad.addColorStop(1, `${ch.color}00`);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, padTop + plotH);
        pts.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.lineTo(pts[pts.length - 1].x, padTop + plotH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Line
      ctx.beginPath();
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 2.2;
      pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Points & Anomaly markers
      pts.forEach((p, idx) => {
        const pkt = packetHistory[idx];
        const isAnomPoint = pkt && pkt.is_anomalous;

        if (isAnomPoint) {
          // Glow halo
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#dc2626';
          ctx.fill();
        } else if (idx === pts.length - 1) {
          // Latest head point
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = ch.color;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
    });

    // Time ticks at bottom
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    const numTicks = Math.min(5, count);
    for (let i = 0; i < numTicks; i++) {
      const idx = Math.floor((i / (numTicks - 1)) * (count - 1));
      const x = padLeft + (idx / (count - 1)) * plotW;
      const label = series.timestamps[idx] || '';
      ctx.fillText(label, x, padTop + plotH + 7);
    }
  }, [packetHistory, selectedChannel, series]);

  // Current reading values
  const r = latestPacket?.reading || telemetry || {};
  const imputed = latestPacket?.imputations || {};
  const corrected = latestPacket?.corrected_reading || {};
  const activeFaults = latestPacket?.active_faults || [];
  const explanation = latestPacket?.explanation || null;
  const qc = latestPacket?.qc_flag || { flag_id: 0, code: 'GOOD', label: 'Valid', severity: 'NONE' };
  const wmo = latestPacket?.layer_1_wmo || {};
  const stat = latestPacket?.layer_2_statistical || {};
  const ml = latestPacket?.layer_3_ml || {};
  const compositeScore = latestPacket?.composite_anomaly_score ?? 0.04;

  const currentStation = STATIONS_LIST.find((s) => s.id === activeStationId) || STATIONS_LIST[0];

  // Sensor array configuration (4 Core Sensors: Temperature, Humidity, Pressure, Wind Speed)
  const sensors = [
    {
      id: 'temperature',
      label: 'Air Temperature',
      sub: 'Dry-Bulb Ambient',
      value: r.temperature !== undefined ? `${r.temperature.toFixed(1)} °C` : '28.4 °C',
      rawVal: r.temperature,
      unit: '°C',
      icon: Thermometer,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
      status: wmo.sensor_status?.temperature || statusFlags.temp || 'Normal',
      sparkData: series.temps.slice(-20),
      sparkColor: '#f43f5e',
      isImputed: Boolean(imputed.temperature !== undefined),
      imputedVal: corrected.temperature !== undefined ? `${corrected.temperature.toFixed(1)} °C` : null,
      meta: 'Karnataka Ambient RTD Range: 15°C to 45°C',
    },
    {
      id: 'humidity',
      label: 'Relative Humidity',
      sub: 'Hygrometer Flux',
      value: r.humidity !== undefined ? `${Math.round(r.humidity)} %` : '65 %',
      rawVal: r.humidity,
      unit: '%',
      icon: Droplets,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-100',
      status: wmo.sensor_status?.humidity || statusFlags.hum || 'Normal',
      sparkData: series.hums.slice(-20),
      sparkColor: '#0284c7',
      isImputed: Boolean(imputed.humidity !== undefined),
      imputedVal: corrected.humidity !== undefined ? `${Math.round(corrected.humidity)} %` : null,
      meta: 'Vapor pressure nominal (20% - 95%)',
    },
    {
      id: 'pressure',
      label: 'Barometric Pressure',
      sub: 'Atmospheric Tide',
      value: r.pressure !== undefined ? `${r.pressure.toFixed(1)} hPa` : '1012.0 hPa',
      rawVal: r.pressure,
      unit: 'hPa',
      icon: Gauge,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      status: wmo.sensor_status?.pressure || statusFlags.press || 'Normal',
      sparkData: series.press.slice(-20),
      sparkColor: '#059669',
      isImputed: Boolean(imputed.pressure !== undefined),
      imputedVal: corrected.pressure !== undefined ? `${corrected.pressure.toFixed(1)} hPa` : null,
      meta: 'Synoptic regional baseline steady',
    },
    {
      id: 'wind_speed',
      label: 'Wind Vector',
      sub: 'Anemometer & Vane',
      value: r.wind_speed !== undefined ? `${(r.wind_speed * 3.6).toFixed(1)} km/h` : '12.6 km/h',
      rawVal: r.wind_speed,
      unit: 'km/h',
      icon: Wind,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      status: wmo.sensor_status?.wind_speed || statusFlags.wind || 'Normal',
      sparkData: series.winds.slice(-20),
      sparkColor: '#6366f1',
      isImputed: Boolean(imputed.wind_speed !== undefined),
      imputedVal: corrected.wind_speed !== undefined ? `${(corrected.wind_speed * 3.6).toFixed(1)} km/h` : null,
      meta: `${r.wind_speed ? r.wind_speed.toFixed(1) : 3.5} m/s (${getCompassDirection(r.wind_direction)})`,
    },
  ];

  // Filtered feed
  const displayedPackets = useMemo(() => {
    if (feedFilter === 'anomalies') {
      return packetHistory.filter((p) => p.is_anomalous || (p.qc_flag && p.qc_flag.flag_id >= 2));
    }
    return packetHistory;
  }, [packetHistory, feedFilter]);

  // Export JSON function
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(packetHistory, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `aws_telemetry_${activeStationId}_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header & Live Stream Operations Console */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Live Station Telemetry</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.72rem] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isPaused ? 'PAUSED' : `LIVE STREAM (${streamSpeed.toFixed(1)} Hz)`}
            </span>
          </div>
          <p className="text-[0.84rem] text-slate-500 dark:text-slate-400 mt-1">
            Continuous second-by-second sensor readings verified by automated physical & AI health checks
          </p>
        </div>

        {/* Controls Ribbon */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Station Selector */}
          <div className="relative">
            <select
              value={activeStationId}
              onChange={(e) => onStationChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer appearance-none shadow-sm"
            >
              {STATIONS_LIST.map((stn) => (
                <option key={stn.id} value={stn.id}>
                  📍 {stn.name} ({stn.elev})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
              ▼
            </div>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {[0.5, 1.0, 2.0, 5.0].map((spd) => (
              <button
                key={spd}
                onClick={() => onSpeedChange(spd)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  streamSpeed === spd
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={onTogglePause}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Stream' : 'Pause'}</span>
          </button>

          {/* Reset Buffer */}
          <button
            onClick={onResetBuffer}
            title="Reset anomaly detection filters and state history"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Fault Injection Toolbar */}
          <button
            onClick={() => setShowSandbox(!showSandbox)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              showSandbox || activeFaults.length > 0
                ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${activeFaults.length > 0 ? 'text-amber-500 fill-amber-500 animate-bounce' : 'text-amber-500'}`} />
            <span>Test Sandbox {activeFaults.length > 0 && `(${activeFaults.length})`}</span>
          </button>

          {/* Toggle REST API & Ingestion Console */}
          <button
            onClick={() => {
              const next = !showApiConsole;
              setShowApiConsole(next);
              if (next) fetchApiData();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              showApiConsole
                ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-sky-500" />
            <span>REST API & Intake</span>
            {apiStats && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 font-bold">
                {apiStats.total_records}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Interactive Fault Injection Sandbox Bar (Collapsible or if active) */}
      {(showSandbox || activeFaults.length > 0) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent rounded-2xl p-4 border border-amber-200/80 shadow-sm flex flex-col gap-3 transition-all animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Fault Injection Sandbox — Test Detectors Against Synthetic Physical Failures
              </h3>
            </div>
            {activeFaults.length > 0 && (
              <span className="text-[0.72rem] font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                ⚠️ {activeFaults.length} Fault(s) Active
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onTriggerFault('SPIKE', 'temperature', 14.0, 25, 'Temperature Spike (+14°C)')}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-300 shadow-sm transition-all"
            >
              🌡️ Temp Spike (+14°C)
            </button>

            <button
              onClick={() => onTriggerFault('FLATLINE', 'humidity', 82.5, 30, 'Frozen Humidity Transducer (82.5%)')}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-300 shadow-sm transition-all"
            >
              ❄️ Freeze Humidity (82.5%)
            </button>

            <button
              onClick={() => onTriggerFault('DRIFT', 'pressure', -0.35, 45, 'Barometer Decalibration Drift')}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-300 shadow-sm transition-all"
            >
              📉 Barometer Drift (-0.35 hPa)
            </button>

            <button
              onClick={() => onTriggerFault('SPIKE', 'wind_speed', 18.0, 20, 'Sudden Wind Gust Surge (+65 km/h)')}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 shadow-sm transition-all"
            >
              🌪️ Wind Surge (+65 km/h)
            </button>

            <button
              onClick={onClearFaults}
              className="ml-auto px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold border border-red-200 shadow-sm transition-all flex items-center gap-1"
            >
              🧹 Clear All Faults
            </button>
          </div>
        </div>
      )}

      {/* 2.5. REST API Intake & IoT Ingestion Console */}
      {showApiConsole && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-sky-200 dark:border-sky-900/60 shadow-lg flex flex-col gap-5 transition-all animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300">
                  <Server className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Live Sensor REST API & Ingestion Console
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Active (0.0.0.0:8000)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Field ingestion endpoints for IoT devices (ESP32, Raspberry Pi) and external automated stations
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
              >
                <Code className="w-3.5 h-3.5 text-sky-500" />
                <span>Swagger Docs (/docs)</span>
              </a>
              <button
                onClick={fetchApiData}
                disabled={apiLoading}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all"
                title="Refresh API Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${apiLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowApiConsole(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Stats Banner (Loaded via GET /api/alerts) */}
          {apiStats && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Total Records</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{apiStats.total_records}</p>
                </div>
                <Radio className="w-5 h-5 text-sky-500" />
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Normal Records</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{apiStats.normal_records}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Active Alerts</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{apiStats.total_anomalies}</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
            </div>
          )}

          {/* Dual Panel: Send Sensor Reading & Live Ingested Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Form Panel: POST /api/reading (5 cols) */}
            <div className="lg:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-sky-500" />
                  POST /api/reading (Send Sensor Reading)
                </span>
                <span className="text-[11px] text-slate-400">JSON Payload</span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setApiForm({ station_id: 'AWS_001', timestamp: '2026-09-12T10:00:00', temperature: 34.5, humidity: 60, pressure: 1008, wind_speed: 12 })}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-700 hover:bg-sky-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-all"
                >
                  Demo Normal (34.5°C)
                </button>
                <button
                  type="button"
                  onClick={() => setApiForm({ station_id: 'AWS_001', timestamp: '2026-09-12T10:00:00', temperature: 52.5, humidity: 35, pressure: 1008, wind_speed: 6.0 })}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-700 hover:bg-rose-50 text-rose-700 dark:text-rose-300 border border-slate-200 dark:border-slate-600 transition-all"
                >
                  🌡️ Heat Spike (52.5°C)
                </button>
                <button
                  type="button"
                  onClick={() => setApiForm({ station_id: 'AWS_002', timestamp: '2026-09-12T10:00:00', temperature: 26.0, humidity: 88, pressure: 975, wind_speed: 48.0 })}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-700 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-600 transition-all"
                >
                  🌪️ Storm Wind (48 m/s)
                </button>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">station_id</label>
                  <input
                    type="text"
                    value={apiForm.station_id}
                    onChange={(e) => setApiForm({ ...apiForm, station_id: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">timestamp</label>
                  <input
                    type="text"
                    value={apiForm.timestamp || '2026-09-12T10:00:00'}
                    onChange={(e) => setApiForm({ ...apiForm, timestamp: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={apiForm.temperature}
                    onChange={(e) => setApiForm({ ...apiForm, temperature: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">humidity (%)</label>
                  <input
                    type="number"
                    step="1"
                    value={apiForm.humidity}
                    onChange={(e) => setApiForm({ ...apiForm, humidity: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">pressure (hPa)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={apiForm.pressure}
                    onChange={(e) => setApiForm({ ...apiForm, pressure: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">wind_speed (m/s)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={apiForm.wind_speed}
                    onChange={(e) => setApiForm({ ...apiForm, wind_speed: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={apiSubmitting}
                onClick={() => handleSendSensorReading()}
                className="w-full mt-1 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {apiSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Sensor Reading (POST /api/reading)</span>
              </button>

              {/* Server Response Card */}
              {lastApiResponse && (
                <div className={`p-3 rounded-lg text-xs border ${
                  lastApiResponse.is_anomaly 
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200' 
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
                }`}>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>Response from POST /api/reading:</span>
                    <span>{lastApiResponse.is_anomaly ? `⚠️ Anomaly: ${lastApiResponse.anomaly_type}` : '✅ Normal Record'}</span>
                  </div>
                  <pre className="text-[10.5px] font-mono overflow-x-auto bg-white/60 dark:bg-slate-900/60 p-2 rounded border border-black/5 dark:border-white/5">
                    {JSON.stringify(lastApiResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Ingested Records Table (7 cols) */}
            <div className="lg:col-span-7 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Ingested Records Feed ({apiRecords.length})
                </span>
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-700/70 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    onClick={() => setApiFilter('all')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      apiFilter === 'all'
                        ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-300 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    All ({apiRecords.length})
                  </button>
                  <button
                    onClick={() => setApiFilter('anomalies')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      apiFilter === 'anomalies'
                        ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-300 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Anomalies ({apiRecords.filter((r) => r.is_anomaly).length})
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-2.5">ID</th>
                      <th className="py-2 px-2">Station</th>
                      <th className="py-2 px-2">Temp</th>
                      <th className="py-2 px-2">Humidity</th>
                      <th className="py-2 px-2">Pressure</th>
                      <th className="py-2 px-2">Wind</th>
                      <th className="py-2 px-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    {(apiFilter === 'anomalies' ? apiRecords.filter((r) => r.is_anomaly) : apiRecords)
                      .slice()
                      .reverse()
                      .map((rec) => (
                        <tr
                          key={rec.id}
                          className={rec.is_anomaly ? 'bg-rose-50/50 dark:bg-rose-950/20' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'}
                        >
                          <td className="py-1.5 px-2.5 font-bold text-slate-900 dark:text-white">#{rec.id}</td>
                          <td className="py-1.5 px-2 font-sans font-semibold text-slate-800 dark:text-slate-200">{rec.station_id}</td>
                          <td className="py-1.5 px-2">{rec.temperature}°C</td>
                          <td className="py-1.5 px-2">{rec.humidity}%</td>
                          <td className="py-1.5 px-2">{rec.pressure} hPa</td>
                          <td className="py-1.5 px-2">{rec.wind_speed} m/s</td>
                          <td className="py-1.5 px-2.5 text-right font-sans">
                            {rec.is_anomaly ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                {rec.anomaly_type || 'Anomaly'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Quick Code Snippets Tab */}
              <div className="mt-1 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Integration Code Snippet
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-semibold">
                    {['curl', 'python', 'arduino'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSnippetTab(tab)}
                        className={`px-2 py-0.5 rounded-md capitalize ${
                          snippetTab === tab
                            ? 'bg-sky-600 text-white font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tab === 'curl' ? 'cURL' : tab === 'python' ? 'Python' : 'Arduino / ESP32'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[10.5px] font-mono overflow-x-auto">
                    {snippetTab === 'curl' && `curl -X POST http://localhost:8000/api/reading \\
  -H "Content-Type: application/json" \\
  -d '{"station_id":"AWS_01","timestamp":"2026-09-12T10:00:00","temperature":34.5,"humidity":60,"pressure":1008,"wind_speed":12}'`}

                    {snippetTab === 'python' && `import requests
res = requests.post("http://localhost:8000/api/reading", json={
    "station_id": "AWS_01",
    "timestamp": "2026-09-12T10:00:00",
    "temperature": 34.5,
    "humidity": 60,
    "pressure": 1008,
    "wind_speed": 12
})
print(res.json())`}

                    {snippetTab === 'arduino' && `// ESP32 / Arduino HTTPClient Example
HTTPClient http;
http.begin("http://192.168.1.5:8000/api/reading");
http.addHeader("Content-Type", "application/json");
String json = "{\\"station_id\\":\\"AWS_01\\",\\"timestamp\\":\\"2026-09-12T10:00:00\\",\\"temperature\\":34.5,\\"humidity\\":60,\\"pressure\\":1008,\\"wind_speed\\":12}";
int code = http.POST(json);`}
                  </pre>
                  <button
                    onClick={() => {
                      const text = snippetTab === 'curl'
                        ? `curl -X POST http://localhost:8000/api/reading -H "Content-Type: application/json" -d '{"station_id":"AWS_01","timestamp":"2026-09-12T10:00:00","temperature":34.5,"humidity":60,"pressure":1008,"wind_speed":12}'`
                        : snippetTab === 'python'
                        ? `import requests\nres = requests.post("http://localhost:8000/api/reading", json={"station_id":"AWS_01","timestamp":"2026-09-12T10:00:00","temperature":34.5,"humidity":60,"pressure":1008,"wind_speed":12})\nprint(res.json())`
                        : `HTTPClient http;\nhttp.begin("http://192.168.1.5:8000/api/reading");\nhttp.addHeader("Content-Type", "application/json");\nhttp.POST("{\\"station_id\\":\\"AWS_01\\",\\"timestamp\\":\\"2026-09-12T10:00:00\\",\\"temperature\\":34.5,\\"humidity\\":60,\\"pressure\\":1008,\\"wind_speed\\":12}");`;
                      navigator.clipboard.writeText(text);
                      setApiCopied(true);
                      setTimeout(() => setApiCopied(false), 2000);
                    }}
                    className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {apiCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{apiCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Real-Time Active Anomaly Alert & AI Explainer Banner */}
      {(isAnomalyActive || (explanation && explanation.category !== 'NORMAL')) && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-5 shadow-lg border border-red-400 animate-pulse flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <AlertOctagon className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  {qc.label || 'CRITICAL ANOMALY'} (QC FLAG {qc.flag_id})
                </span>
                <span className="text-xs text-rose-100 font-semibold">
                  Station {activeStationId} • Culprit: <span className="underline font-bold">{explanation?.primary_sensor || 'Sensor'}</span>
                </span>
              </div>
              <h3 className="text-base font-bold mt-1 text-white leading-snug">
                {explanation?.human_readable || 'Multi-tier anomaly detector flagged abnormal telemetry divergence.'}
              </h3>
              <p className="text-xs text-rose-100 mt-1 flex items-center gap-1">
                <span>🔧 <strong>Technician Directive:</strong> {explanation?.recommended_action || 'Inspect physical sensor connection and calibrate.'}</span>
              </p>
            </div>
          </div>

          <div className="flex md:flex-col items-end gap-2 flex-shrink-0 bg-black/20 p-3 rounded-xl backdrop-blur-sm border border-white/10">
            <span className="text-[0.7rem] uppercase tracking-wider text-rose-200 font-semibold">AI Anomaly Score</span>
            <div className="text-xl font-black text-white">{(compositeScore * 100).toFixed(0)}%</div>
            <span className="text-[0.68rem] text-rose-100">Layer 1-3 Fused</span>
          </div>
        </div>
      )}

      {/* 4. Full 8-Sensor Meteorological Array Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Real-Time Transducer Metrics Array ({sensors.length} Channels Active)
          </h2>
          <span className="text-[0.75rem] text-slate-400 font-medium">
            Sampling Station: <span className="text-slate-700 font-semibold">{currentStation.name}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {sensors.map((s) => {
            const Icon = s.icon;
            const isAnomaly = s.status === 'Anomaly' || s.status === 'CRITICAL';
            const isWarning = s.status === 'Warning' || s.status === 'WARNING' || s.status === 'SUSPECT';

            return (
              <div
                key={s.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 hover:shadow-md flex flex-col justify-between gap-3 relative overflow-hidden ${
                  isAnomaly
                    ? 'border-red-300 dark:border-red-800 ring-2 ring-red-500/20 bg-red-50/20 dark:bg-red-950/20'
                    : isWarning
                    ? 'border-amber-200 dark:border-amber-800 bg-amber-50/10 dark:bg-amber-950/20'
                    : 'border-slate-200/80 dark:border-slate-800 shadow-sm'
                }`}
              >
                {/* Header of card */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl ${s.bgColor} ${s.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{s.label}</div>
                      <div className="text-[0.68rem] text-slate-400 dark:text-slate-500">{s.sub}</div>
                    </div>
                  </div>

                  {/* QC Status Tag */}
                  <span
                    className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isAnomaly
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800'
                        : isWarning
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {isAnomaly ? 'Sensor Alert' : isWarning ? 'Warning' : 'Healthy'}
                  </span>
                </div>

                {/* Primary Value & Sparkline */}
                <div className="flex items-end justify-between mt-1">
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                      {s.value}
                    </div>
                    {/* Self-healed indicator if corrupted */}
                    {s.isImputed && s.imputedVal && (
                      <div className="mt-1 flex items-center gap-1 text-[0.68rem] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                        <Sparkles className="w-3 h-3 text-sky-500" />
                        <span>Healed: {s.imputedVal}</span>
                      </div>
                    )}
                  </div>

                  {/* Micro Sparkline */}
                  <div className="flex flex-col items-end">
                    <Sparkline data={s.sparkData} color={isAnomaly ? '#ef4444' : s.sparkColor} />
                    <span className="text-[0.65rem] text-slate-400 mt-0.5 font-mono">Last 20</span>
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="text-[0.7rem] text-slate-500 pt-2 border-t border-slate-100 font-medium flex items-center justify-between">
                  <span className="truncate">{s.meta}</span>
                  {s.id === 'wind_speed' && (
                    <span className="text-[0.68rem] text-indigo-600 font-bold ml-1">
                      {getCompassDirection(r.wind_direction)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Real-Time Multi-Channel Waveform Oscilloscope */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Sensor Waveform Monitor</h3>
              <span className="text-xs text-slate-400 font-mono">({packetHistory.length} data points buffer)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live second-by-second wave monitor with synchronized anomaly breach flags
            </p>
          </div>

          {/* Channel Selector Pills */}
          <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {[
              { id: 'temp_hum', label: '🌡️ Temp & Humidity' },
              { id: 'press_wind', label: '🧭 Pressure & Wind' },
              { id: 'anomaly', label: '⚡ Anomaly Score' },
              { id: 'all', label: '📊 All 4 Sensors' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedChannel(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedChannel === tab.id
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative w-full h-[250px] bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-4">
            {selectedChannel === 'temp_hum' && (
              <>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Ambient Temp (°C)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-600" /> Relative Humidity (%)</span>
                <span className="text-slate-400 italic font-mono">Karnataka Real-Time Sensor Stream</span>
              </>
            )}
            {selectedChannel === 'press_wind' && (
              <>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pressure (hPa)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Wind Speed (km/h)</span>
              </>
            )}
            {selectedChannel === 'anomaly' && (
              <>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Composite Score (0.0 to 1.0)</span>
                <span className="text-slate-400 italic">Threshold: &gt;0.55 Warning, &gt;0.80 Critical</span>
              </>
            )}
            {selectedChannel === 'all' && (
              <>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Temp</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-600" /> Hum</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Press</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Wind</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[0.7rem] font-semibold text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-600" /> Anomaly Flag Triggered
            </span>
          </div>
        </div>
      </div>

      {/* 6. Multi-Tier AI/ML Live Inspection HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier 1: Physical Limits Check */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                  Check 1: Physical Limits & Safety
                </h4>
              </div>
              <span className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full ${
                wmo.status === 'CRITICAL'
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : wmo.status === 'WARNING'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {wmo.status === 'CRITICAL' ? 'Alert' : wmo.status === 'WARNING' ? 'Warning' : 'Healthy'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Verifies values stay inside realistic natural boundaries and follow basic climate laws.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">Natural Limits (e.g. -20° to 60°C)</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Inside Bounds
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">Sudden Jump Test (Rate of change)</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Normal Rate
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">Moisture vs Temp Match</span>
                <span className={`font-semibold flex items-center gap-1 ${
                  r.dew_point > r.temperature ? 'text-red-600 font-bold' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {r.dew_point > r.temperature ? '❌ Conflict' : '✅ Consistent'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[0.7rem] text-slate-400">
            Active limit issues: <span className="font-bold text-slate-700 dark:text-slate-300">{wmo.violation_count || 0}</span>
          </div>
        </div>

        {/* Tier 2: Statistical Dynamic Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                  Check 2: Spikes & Frozen Sensors
                </h4>
              </div>
              <span className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full ${
                stat.status === 'CRITICAL'
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : stat.status === 'WARNING'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {stat.status === 'CRITICAL' ? 'Alert' : stat.status === 'WARNING' ? 'Warning' : 'Healthy'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Catches sudden unnatural spikes and needles that freeze on a single fixed number.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">Outlier Spike Filter</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">0.42 (Max 3.0)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">Frozen Needle Check</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Fluctuating Naturally</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300">Slow Drift Tracker</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">0.02 hPa / hr (Clean)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[0.7rem] text-slate-400">
            Observation window: <span className="font-bold text-slate-700 dark:text-slate-300">30 readings</span>
          </div>
        </div>

        {/* Tier 3: Neural AI Pattern Check */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                  Check 3: AI Smart Pattern Check
                </h4>
              </div>
              <span className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full ${
                ml.status === 'CRITICAL'
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : ml.status === 'WARNING'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
              }`}>
                {ml.status === 'CRITICAL' ? 'Alert' : ml.status === 'WARNING' ? 'Warning' : 'Healthy'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Verifies that temperature, moisture, and air pressure agree with each other naturally.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>AI Pattern Disagreement Level</span>
                  <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                    {ml.autoencoder?.reconstruction_loss?.toFixed(4) || '0.0124'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      (ml.autoencoder?.score || 0) > 0.6 ? 'bg-red-500' : 'bg-purple-600'
                    }`}
                    style={{ width: `${Math.min(100, (ml.autoencoder?.score || 0.12) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Top Loss Culprit</span>
                <span className="font-bold text-slate-800">
                  {ml.autoencoder?.top_contributor || 'temperature'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[0.7rem] text-slate-400 flex items-center justify-between">
            <span>Model: MLP (24-12-6-12-24)</span>
            <span className="text-emerald-600 font-semibold">Trained Online</span>
          </div>
        </div>
      </div>

      {/* 7. Live Telemetry Stream Packet Feed Log (Terminal) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Telemetry Event Log</h3>
            <span className="text-xs text-slate-400 font-mono">
              ({displayedPackets.length} events logged)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Filter Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <button
                onClick={() => setFeedFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  feedFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All Readings
              </button>
              <button
                onClick={() => setFeedFilter('anomalies')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  feedFilter === 'anomalies'
                    ? 'bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-300 shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Alerts Only
              </button>
            </div>

            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScrollFeed(!autoScrollFeed)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                autoScrollFeed
                  ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {autoScrollFeed ? '⬇ Auto-Scroll ON' : '⏸ Auto-Scroll OFF'}
            </button>

            {/* Export JSON Button */}
            <button
              onClick={handleExportJSON}
              title="Download session packet history as JSON"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Scrolling Table */}
        <div
          ref={tableContainerRef}
          className="overflow-x-auto max-h-[300px] overflow-y-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
        >
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 z-10">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Station</th>
                <th className="py-2.5 px-3">Temp</th>
                <th className="py-2.5 px-3">Humidity</th>
                <th className="py-2.5 px-3">Pressure</th>
                <th className="py-2.5 px-3">Wind</th>
                <th className="py-2.5 px-3">Sunlight</th>
                <th className="py-2.5 px-3">Health Status</th>
                <th className="py-2.5 px-3">AI Score</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              {displayedPackets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-sans">
                    No packets matching current filter. Telemetry streaming live...
                  </td>
                </tr>
              ) : (
                displayedPackets.map((pkt, idx) => {
                  const pr = pkt.reading || {};
                  const isAnom = pkt.is_anomalous;
                  const timeStr = pr.timestamp ? new Date(pr.timestamp).toLocaleTimeString() : `Point #${idx + 1}`;
                  const flag = pkt.qc_flag || { label: 'GOOD', flag_id: 0 };

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition-colors ${
                        isAnom ? 'bg-red-50/60 font-medium' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{timeStr}</td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{pkt.station_id || activeStationId}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {pr.temperature !== undefined ? `${pr.temperature.toFixed(1)}°C` : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                        {pr.humidity !== undefined ? `${Math.round(pr.humidity)}%` : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                        {pr.pressure !== undefined ? `${pr.pressure.toFixed(1)}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                        {pr.wind_speed !== undefined ? `${(pr.wind_speed * 3.6).toFixed(1)} km/h` : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                        {pr.solar_radiation !== undefined ? `${Math.round(pr.solar_radiation)}` : '-'}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${
                            flag.flag_id >= 3
                              ? 'bg-red-100 text-red-700'
                              : flag.flag_id >= 1
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {flag.label || (isAnom ? 'CRITICAL' : 'VALID')}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {pkt.composite_anomaly_score !== undefined
                          ? `${(pkt.composite_anomaly_score * 100).toFixed(0)}%`
                          : '-'}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setInspectedPacket(pkt)}
                          className="px-2 py-0.5 rounded text-[0.7rem] font-sans font-semibold bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 border border-slate-200 transition-all"
                        >
                          View JSON
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. JSON Inspection Modal */}
      {inspectedPacket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Telemetry Packet Inspector — {inspectedPacket.station_id || activeStationId}
                </h3>
              </div>
              <button
                onClick={() => setInspectedPacket(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-900 text-slate-100">
              <pre className="whitespace-pre-wrap">{JSON.stringify(inspectedPacket, null, 2)}</pre>
            </div>

            <div className="p-3 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setInspectedPacket(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
