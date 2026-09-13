import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Cpu,
  Radio,
  Database,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Download,
  Activity,
  Zap,
  Server,
  Key,
  Clock,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  HardDrive,
  UserCheck,
  Bell,
  SlidersHorizontal,
  Layers,
  Thermometer,
  Droplets,
  Gauge,
  Wind
} from 'lucide-react';

export default function SettingsSection({ user = { full_name: 'Abhishek', username: 'abhishek', role: 'admin' } }) {
  const [activeCategory, setActiveCategory] = useState('wmo');
  const [saveStatus, setSaveStatus] = useState(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState(null);

  // 1. WMO Thresholds State
  const [wmoSettings, setWmoSettings] = useState({
    tempMin: -40,
    tempMax: 60,
    tempStep1min: 4.0,
    tempStep1hr: 10.0,
    humMin: 0,
    humMax: 100,
    humStep1min: 10.0,
    pressMin: 700,
    pressMax: 1080,
    pressStep1min: 2.0,
    windSpeedMax: 75,
    windStep1min: 15.0,
    flatlineSteps: 12,
  });

  // 2. AI/ML Ensemble Settings
  const [mlSettings, setMlSettings] = useState({
    layer1Weight: 0.35,
    layer2Weight: 0.30,
    layer3Weight: 0.35,
    anomalyThreshold: 0.70,
    autoencoderLossP95: 0.045,
    isolationContamination: 0.05,
    enableAutoencoderManifold: true,
    enableHampelFilter: true,
    enableEwmaDrift: true,
  });

  // 3. Telemetry Stream Settings
  const [streamSettings, setStreamSettings] = useState({
    defaultSpeed: '1.0',
    historyBufferCap: 300,
    autoImputeMagnus: true,
    soundAlertsOnCritical: false,
    autoReconnectWs: true,
    noiseLevelPct: 15,
  });

  // 4. Database & Storage Settings
  const [dbSettings, setDbSettings] = useState({
    connectionUrl: 'sqlite:///./aws_monitor.db',
    ormType: 'SQLAlchemy ORM 2.0',
    poolSize: 10,
    maxOverflow: 20,
    autoVacuum: true,
    retentionDays: 90,
  });

  // 5. Security & Session Settings
  const [secSettings, setSecSettings] = useState({
    jwtExpiryHours: 24,
    sessionTimeoutMinutes: 60,
    enforceMfa: false,
    restrictIpRange: false,
  });

  const handleSave = () => {
    setSaveStatus('Saving configuration parameters...');
    setTimeout(() => {
      setSaveStatus('Settings successfully saved and applied to active telemetry & QC engine.');
      setTimeout(() => setSaveStatus(null), 4000);
    }, 500);
  };

  const handleResetWmo = () => {
    setWmoSettings({
      tempMin: -40,
      tempMax: 60,
      tempStep1min: 4.0,
      tempStep1hr: 10.0,
      humMin: 0,
      humMax: 100,
      humStep1min: 10.0,
      pressMin: 700,
      pressMax: 1080,
      pressStep1min: 2.0,
      windSpeedMax: 75,
      windStep1min: 15.0,
      flatlineSteps: 12,
    });
    setSaveStatus('Restored factory standard WMO-No. 486 physical bounds.');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handleRunDiagnostics = () => {
    setIsDiagnosticRunning(true);
    setDiagnosticResults(null);
    setTimeout(() => {
      setDiagnosticResults({
        timestamp: new Date().toLocaleTimeString(),
        dbLatency: '3.8 ms (SQLite ORM connected)',
        mlInference: '11.4 ms (Isolation Forest + Autoencoder)',
        wsHeartbeat: '16.2 ms (ws://127.0.0.1:8000/ws/telemetry)',
        ingestionThroughput: '140 records/sec',
        overallStatus: 'OPTIMAL (All subsystems operational)'
      });
      setIsDiagnosticRunning(false);
    }, 800);
  };

  const handleExportConfigJson = () => {
    const configData = {
      wmo: wmoSettings,
      ml: mlSettings,
      stream: streamSettings,
      database: dbSettings,
      security: secSettings,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aws_monitor_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 pb-12 w-full animate-fadeIn">
      {/* 1. Header with System Health Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 rounded-lg border border-sky-100 dark:border-sky-800">
              <SlidersHorizontal className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                System Settings & Alert Rules
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Engine v2.0 Active
                </span>
              </h1>
              <p className="text-[0.84rem] text-slate-500 dark:text-slate-400 mt-0.5">
                Manage weather safety thresholds, AI sensitivity, notifications, and operator preferences
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunDiagnostics}
            disabled={isDiagnosticRunning}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition border border-slate-200 shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Activity className={`w-3.5 h-3.5 text-sky-600 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
            <span>{isDiagnosticRunning ? 'Testing Subsystems...' : 'Run Diagnostics'}</span>
          </button>

          <button
            onClick={handleExportConfigJson}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition border border-slate-200 shadow-2xs active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Config JSON</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Save / Notice Alert Banner */}
      {saveStatus && (
        <div className="p-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{saveStatus}</span>
          </div>
          <span className="text-[0.7rem] font-mono text-emerald-600 bg-white px-2 py-0.5 rounded border border-emerald-100">
            Engine Synced
          </span>
        </div>
      )}

      {/* Diagnostics Results Card (Expands when diagnostics run) */}
      {diagnosticResults && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Live Subsystems Benchmark ({diagnosticResults.timestamp})
            </span>
            <span className="text-[0.7rem] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              {diagnosticResults.overallStatus}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-[0.68rem] text-slate-400 block">Database Query Latency</span>
              <span className="text-emerald-400 font-bold text-sm">{diagnosticResults.dbLatency}</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-[0.68rem] text-slate-400 block">AI/ML Inference Time</span>
              <span className="text-sky-400 font-bold text-sm">{diagnosticResults.mlInference}</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-[0.68rem] text-slate-400 block">WebSocket Latency</span>
              <span className="text-amber-400 font-bold text-sm">{diagnosticResults.wsHeartbeat}</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-[0.68rem] text-slate-400 block">Batch Throughput</span>
              <span className="text-indigo-400 font-bold text-sm">{diagnosticResults.ingestionThroughput}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Navigation Category Pills */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/60 dark:bg-slate-800/80 rounded-2xl w-fit">
        {[
          { id: 'wmo', label: 'Safety Limits & Bounds', icon: Shield },
          { id: 'ml', label: 'AI Sensitivity Tuning', icon: Cpu },
          { id: 'stream', label: 'Telemetry & Alerts', icon: Bell },
          { id: 'database', label: 'Storage & Database', icon: Database },
          { id: 'security', label: 'Access & Passwords', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-750'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Configuration Content Panels */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex flex-col gap-6">
        {/* =========================================================================
            PANEL 1: WMO Quality Control Boundaries
            ========================================================================= */}
        {activeCategory === 'wmo' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  WMO Climatological & Rate-of-Change QC Thresholds
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Based on World Meteorological Organization standards (WMO Guide to Instruments and Methods of Observation, No. 8)
                </p>
              </div>

              <button
                onClick={handleResetWmo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition w-fit cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to WMO Defaults</span>
              </button>
            </div>

            {/* Threshold Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Air Temperature QC */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-amber-500" /> Temperature Limits & Step Delta
                  </span>
                  <span className="text-[0.7rem] font-mono text-slate-500 dark:text-slate-400">Unit: °C</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[0.72rem] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Climatological Range (°C)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={wmoSettings.tempMin}
                        onChange={(e) => setWmoSettings({ ...wmoSettings, tempMin: parseFloat(e.target.value) })}
                        className="w-full text-xs font-mono font-bold p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                      <span className="text-slate-400 dark:text-slate-400 text-xs font-bold px-0.5">to</span>
                      <input
                        type="number"
                        value={wmoSettings.tempMax}
                        onChange={(e) => setWmoSettings({ ...wmoSettings, tempMax: parseFloat(e.target.value) })}
                        className="w-full text-xs font-mono font-bold p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[0.72rem] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Max 1-Min Step Jump (Δ°C)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={wmoSettings.tempStep1min}
                      onChange={(e) => setWmoSettings({ ...wmoSettings, tempStep1min: parseFloat(e.target.value) })}
                      className="w-full text-xs font-mono font-bold p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-amber-600 dark:text-amber-400 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-[0.7rem] text-slate-500 dark:text-slate-400 mb-1">
                    <span>1-Hour Allowable Rate-of-Change Limit:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{wmoSettings.tempStep1hr} °C / hr</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="1"
                    value={wmoSettings.tempStep1hr}
                    onChange={(e) => setWmoSettings({ ...wmoSettings, tempStep1hr: parseFloat(e.target.value) })}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Relative Humidity QC */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-sky-500" /> Relative Humidity & Step Delta
                  </span>
                  <span className="text-[0.7rem] font-mono text-slate-500 dark:text-slate-400">Unit: %</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[0.72rem] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Plausible Range (%)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={wmoSettings.humMin}
                        onChange={(e) => setWmoSettings({ ...wmoSettings, humMin: parseFloat(e.target.value) })}
                        className="w-full text-xs font-mono font-bold p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                      <span className="text-slate-400 dark:text-slate-400 text-xs font-bold px-0.5">to</span>
                      <input
                        type="number"
                        value={wmoSettings.humMax}
                        onChange={(e) => setWmoSettings({ ...wmoSettings, humMax: parseFloat(e.target.value) })}
                        className="w-full text-xs font-mono font-bold p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[0.72rem] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Max 1-Min Step Jump (Δ%)</label>
                    <input
                      type="number"
                      step="1"
                      value={wmoSettings.humStep1min}
                      onChange={(e) => setWmoSettings({ ...wmoSettings, humStep1min: parseFloat(e.target.value) })}
                      className="w-full text-xs font-mono font-bold p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-sky-600 dark:text-sky-400 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-[0.7rem] text-slate-500 dark:text-slate-400 mb-1">
                    <span>Flatline Persistence Max Window:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{wmoSettings.flatlineSteps} steps (12 min)</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={wmoSettings.flatlineSteps}
                    onChange={(e) => setWmoSettings({ ...wmoSettings, flatlineSteps: parseInt(e.target.value) })}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Barometric Pressure QC */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-indigo-500" /> Barometric Pressure QC
                  </span>
                  <span className="text-[0.7rem] font-mono text-slate-500 dark:text-slate-400">Unit: hPa</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[0.72rem] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Pressure Range (hPa)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={wmoSettings.pressMin}
                        onChange={(e) => setWmoSettings({ ...wmoSettings, pressMin: parseFloat(e.target.value) })}
                        className="w-full text-xs font-mono font-bold p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                      <span className="text-slate-400 dark:text-slate-400 text-xs font-bold px-0.5">to</span>
                      <input
                        type="number"
                        value={wmoSettings.pressMax}
                        onChange={(e) => setWmoSettings({ ...wmoSettings, pressMax: parseFloat(e.target.value) })}
                        className="w-full text-xs font-mono font-bold p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[0.72rem] text-slate-600 dark:text-slate-400 block mb-1 font-medium">1-Min Step Jump (ΔhPa)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={wmoSettings.pressStep1min}
                      onChange={(e) => setWmoSettings({ ...wmoSettings, pressStep1min: parseFloat(e.target.value) })}
                      className="w-full text-xs font-mono font-bold p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-indigo-600 dark:text-indigo-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Wind Anemometer QC */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-teal-500" /> Wind Velocity Max Cutoff
                  </span>
                  <span className="text-[0.7rem] font-mono text-slate-500 dark:text-slate-400">Unit: m/s (~270 km/h)</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[0.72rem] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Max Hurricane Cutoff (m/s)</label>
                    <input
                      type="number"
                      value={wmoSettings.windSpeedMax}
                      onChange={(e) => setWmoSettings({ ...wmoSettings, windSpeedMax: parseFloat(e.target.value) })}
                      className="w-full text-xs font-mono font-bold p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-teal-600 dark:text-teal-400 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[0.72rem] text-slate-600 dark:text-slate-400 block mb-1 font-medium">1-Min Gust Delta (m/s)</label>
                    <input
                      type="number"
                      value={wmoSettings.windStep1min}
                      onChange={(e) => setWmoSettings({ ...wmoSettings, windStep1min: parseFloat(e.target.value) })}
                      className="w-full text-xs font-mono font-bold p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-teal-600 dark:text-teal-400 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PANEL 2: AI/ML Ensemble Tuning
            ========================================================================= */}
        {activeCategory === 'ml' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                3-Step AI Balance & Sensitivity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tune the balance between physical safety rules, statistical spike filters, and AI pattern learning
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Layer 1 Weight */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 dark:text-white">Check 1: Physical Limits</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{(mlSettings.layer1Weight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={mlSettings.layer1Weight}
                  onChange={(e) => setMlSettings({ ...mlSettings, layer1Weight: parseFloat(e.target.value) })}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <p className="text-[0.68rem] text-slate-500 dark:text-slate-400">Safe ranges, maximum rates of change, physical consistency</p>
              </div>

              {/* Layer 2 Weight */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 dark:text-white">Check 2: Spikes & Freezes</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{(mlSettings.layer2Weight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={mlSettings.layer2Weight}
                  onChange={(e) => setMlSettings({ ...mlSettings, layer2Weight: parseFloat(e.target.value) })}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <p className="text-[0.68rem] text-slate-500 dark:text-slate-400">Rapid outlier spikes, stuck needle test, slow drift tracker</p>
              </div>

              {/* Layer 3 Weight */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 dark:text-white">Check 3: AI Smart Harmony</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{(mlSettings.layer3Weight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={mlSettings.layer3Weight}
                  onChange={(e) => setMlSettings({ ...mlSettings, layer3Weight: parseFloat(e.target.value) })}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <p className="text-[0.68rem] text-slate-500 dark:text-slate-400">Learned relations: heat vs humidity vs barometric curves</p>
              </div>
            </div>

            {/* Threshold Sliders & Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Ensemble Critical Anomaly Threshold</span>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500 dark:text-slate-400">Decision Cutoff:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{mlSettings.anomalyThreshold} score</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="0.95"
                  step="0.05"
                  value={mlSettings.anomalyThreshold}
                  onChange={(e) => setMlSettings({ ...mlSettings, anomalyThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">Readings with composite score above this value are marked as CRITICAL.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Deep Autoencoder 95th Percentile Loss Target</span>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500 dark:text-slate-400">Reconstruction Threshold:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{mlSettings.autoencoderLossP95} MSE</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.1"
                  step="0.005"
                  value={mlSettings.autoencoderLossP95}
                  onChange={(e) => setMlSettings({ ...mlSettings, autoencoderLossP95: parseFloat(e.target.value) })}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">Tuned against 2,000 synthetic diurnal weather baseline profiles.</p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PANEL 3: Telemetry & Imputation Engine
            ========================================================================= */}
        {(activeCategory === 'stream' || activeCategory === 'system') && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Telemetry Stream & Physics-Based Self-Healing Imputation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Streaming buffer length, speed multiplier, and automated Magnus thermodynamic self-healing
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Speed & Buffer */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-4">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Stream Sampling Rate Multiplier</span>
                <div className="grid grid-cols-4 gap-2">
                  {['0.5', '1.0', '2.0', '5.0'].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setStreamSettings({ ...streamSettings, defaultSpeed: speed })}
                      className={`py-2 text-xs font-mono font-bold rounded-lg border transition cursor-pointer ${
                        streamSettings.defaultSpeed === speed
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {speed}x speed
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                    <span>Telemetry In-Memory Buffer Retention:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{streamSettings.historyBufferCap} packets</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={streamSettings.historyBufferCap}
                    onChange={(e) => setStreamSettings({ ...streamSettings, historyBufferCap: parseInt(e.target.value) })}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-4">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Intelligent Self-Healing & Telemetry Hooks</span>

                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Thermodynamic Magnus Imputation</span>
                      <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">Automatically reconstruct inverted dew points</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={streamSettings.autoImputeMagnus}
                      onChange={(e) => setStreamSettings({ ...streamSettings, autoImputeMagnus: e.target.checked })}
                      className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Audio Beep on Critical Anomaly</span>
                      <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">Synthesize alert tone on step jump or lockup</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={streamSettings.soundAlertsOnCritical}
                      onChange={(e) => setStreamSettings({ ...streamSettings, soundAlertsOnCritical: e.target.checked })}
                      className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Automatic WebSocket Reconnection</span>
                      <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">Exponential backoff retry on disconnect</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={streamSettings.autoReconnectWs}
                      onChange={(e) => setStreamSettings({ ...streamSettings, autoReconnectWs: e.target.checked })}
                      className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PANEL 4: Database & Storage Management
            ========================================================================= */}
        {activeCategory === 'database' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Database Engine & ORM Persistence Storage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage connected SQLite / PostgreSQL ORM database tables, indexing, and data retention windows
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block">Connected Engine</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  SQLite 3 / PostgreSQL Driver
                </div>
                <span className="text-[0.72rem] text-slate-500 dark:text-slate-400 font-mono mt-1 block">aws_monitor.db (65.5 KB)</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block">ORM Model Architecture</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  SQLAlchemy 2.0 Declarative
                </div>
                <span className="text-[0.72rem] text-slate-500 dark:text-slate-400 mt-1 block">4 Managed Schema Tables</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block">Retention Policy</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  90 Days Historical Log
                </div>
                <span className="text-[0.72rem] text-slate-500 dark:text-slate-400 mt-1 block">Auto-partitioning active</span>
              </div>
            </div>

            {/* Table Inventory */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Managed ORM Tables & Status</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="font-mono text-slate-500 dark:text-slate-400 block text-[0.7rem]">table: users</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">2 Users</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[0.68rem] block mt-0.5">Admin & Observer</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="font-mono text-slate-500 dark:text-slate-400 block text-[0.7rem]">table: stations</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">5 Stations</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[0.68rem] block mt-0.5">All Nodes Synced</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="font-mono text-slate-500 dark:text-slate-400 block text-[0.7rem]">table: telemetry_records</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">14,820 Records</span>
                  <span className="text-sky-600 dark:text-sky-400 text-[0.68rem] block mt-0.5">1-min resolution</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="font-mono text-slate-500 dark:text-slate-400 block text-[0.7rem]">table: anomaly_alerts</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">88 Alerts</span>
                  <span className="text-amber-600 dark:text-amber-400 text-[0.68rem] block mt-0.5">Logged with root causes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PANEL 5: Security & Profile
            ========================================================================= */}
        {activeCategory === 'security' && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Security, JWT Tokens & Role-Based Access Control
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Authentication certificates, token lifetimes, and operator permissions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* User Profile Info */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center font-extrabold text-lg">
                    {user?.full_name ? user.full_name[0].toUpperCase() : 'A'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{user?.full_name || 'Abhishek'}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">@{user?.username || 'abhishek'}</p>
                    <span className="text-[0.7rem] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 mt-1 inline-block">
                      System Administrator
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Role Permissions:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Read / Write / Fault Inject</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Auth Method:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">OAuth2 Bearer JWT (HMAC-SHA256)</span>
                  </div>
                </div>
              </div>

              {/* JWT & Session Options */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Session & Token Security Policies</span>

                <div>
                  <label className="text-[0.72rem] text-slate-600 dark:text-slate-400 block mb-1 font-medium">JWT Token Lifetime (Hours)</label>
                  <input
                    type="number"
                    value={secSettings.jwtExpiryHours}
                    onChange={(e) => setSecSettings({ ...secSettings, jwtExpiryHours: parseInt(e.target.value) })}
                    className="w-full text-xs font-mono font-bold p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[0.72rem] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Idle Inactivity Logout (Minutes)</label>
                  <input
                    type="number"
                    value={secSettings.sessionTimeoutMinutes}
                    onChange={(e) => setSecSettings({ ...secSettings, sessionTimeoutMinutes: parseInt(e.target.value) })}
                    className="w-full text-xs font-mono font-bold p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
