import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MetricCards from './components/MetricCards';
import TemperatureChart from './components/TemperatureChart';
import StationMap from './components/StationMap';
import RecentAnomaliesTable from './components/RecentAnomaliesTable';
import FaultSandbox from './components/FaultSandbox';
import AuthModal from './components/AuthModal';
import LiveDataSection from './components/LiveDataSection';
import AnalyticsSection from './components/AnalyticsSection';
import StationsSection from './components/StationsSection';
import ReportsSection from './components/ReportsSection';
import SettingsSection from './components/SettingsSection';
import { Info, Sparkles, ChevronDown, ChevronUp, Radio } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState({ username: 'abhishek', full_name: 'Abhishek', role: 'admin' });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aws_theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('aws_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [activeStationId, setActiveStationId] = useState('AWS_001');
  const [streamSpeed, setStreamSpeed] = useState(1.0);
  const [isPaused, setIsPaused] = useState(false);
  const [latestPacket, setLatestPacket] = useState(null);
  const [packetHistory, setPacketHistory] = useState([]);
  
  // Real-time Telemetry & Anomaly State (4 Core Sensors)
  const [telemetry, setTelemetry] = useState({
    temperature: 28.4,
    humidity: 65,
    pressure: 1012,
    wind_speed: 3.5, // 12.6 km/h
    wind_direction: 245,
    battery_voltage: 13.6,
  });

  const [statusFlags, setStatusFlags] = useState({
    temp: 'Normal',
    hum: 'Normal',
    press: 'Normal',
    wind: 'Normal',
  });

  const [isAnomalyActive, setIsAnomalyActive] = useState(false);
  const [clockStr, setClockStr] = useState('Tue, 5 Sep 2026 | 10:24 AM');

  // Recent Anomalies List (pre-seeded with Karnataka stations)
  const [anomalies, setAnomalies] = useState([
    {
      id: 'ANOM-1',
      time: '05 Sep 2026, 09:12 AM',
      station_id: 'AWS_003',
      parameter: 'Temperature',
      value: '42.3 °C',
      severity: 'High',
      status: 'Investigating',
    },
    {
      id: 'ANOM-2',
      time: '05 Sep 2026, 07:45 AM',
      station_id: 'AWS_002',
      parameter: 'Wind Speed',
      value: '76.1 km/h',
      severity: 'Medium',
      status: 'Resolved',
    },
    {
      id: 'ANOM-3',
      time: '04 Sep 2026, 06:20 PM',
      station_id: 'AWS_005',
      parameter: 'Pressure',
      value: '980 hPa',
      severity: 'Medium',
      status: 'Resolved',
    },
    {
      id: 'ANOM-4',
      time: '04 Sep 2026, 02:15 PM',
      station_id: 'AWS_001',
      parameter: 'Humidity',
      value: '12 %',
      severity: 'High',
      status: 'Investigating',
    },
  ]);

  // Clock Timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      const dateStr = now.toLocaleDateString('en-GB', options);
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setClockStr(`${dateStr} | ${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simple HTTP Polling: GET /api/readings/{station_id} every 2.5s (Replaces WebSocket)
  useEffect(() => {
    let isMounted = true;

    const pollStationData = async () => {
      if (isPaused) return;

      try {
        const res = await fetch(`/api/readings/${activeStationId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        const r = data.latest || data;
        const isAnom = Boolean(r.is_anomaly);

        // Build telemetry packet for charts and oscilloscope
        const packet = {
          station_id: activeStationId,
          timestamp: r.timestamp || new Date().toISOString(),
          reading: {
            temperature: r.temperature,
            humidity: r.humidity,
            pressure: r.pressure,
            wind_speed: r.wind_speed,
            wind_direction: 245,
            battery_voltage: 13.6,
          },
          composite_anomaly_score: isAnom ? 0.88 : 0.06,
          is_anomalous: isAnom,
          layer_1_wmo: {
            sensor_status: {
              temperature: (isAnom && (r.anomaly_type?.includes('temp') || r.anomaly_type === 'spike' || r.anomaly_type === 'sensor_drift')) ? 'FAIL' : 'PASS',
              humidity: (isAnom && (r.anomaly_type?.includes('hum') || r.anomaly_type === 'stuck_sensor')) ? 'FAIL' : 'PASS',
              pressure: (isAnom && (r.anomaly_type?.includes('press') || r.pressure < 985 || r.pressure > 1050)) ? 'FAIL' : 'PASS',
              wind_speed: (isAnom && (r.anomaly_type?.includes('wind') || r.wind_speed > 25)) ? 'FAIL' : 'PASS',
            },
          },
          explanation: isAnom
            ? {
                category: 'PHYSICAL_ANOMALY',
                primary_sensor: r.anomaly_type?.includes('hum') ? 'humidity' : (r.anomaly_type?.includes('press') ? 'pressure' : (r.wind_speed > 25 ? 'wind_speed' : 'temperature')),
                summary: r.anomaly_type ? `Detected ${r.anomaly_type.replace('_', ' ')}` : 'Sensor anomaly detected outside normal limits',
              }
            : { category: 'NORMAL', primary_sensor: 'temperature', summary: 'All sensors healthy and nominal' },
        };

        setLatestPacket(packet);
        setPacketHistory((prev) => [...prev.slice(-49), packet]);

        setTelemetry({
          temperature: r.temperature,
          humidity: r.humidity,
          pressure: r.pressure,
          wind_speed: r.wind_speed,
          wind_direction: 245,
          battery_voltage: 13.6,
        });

        setStatusFlags({
          temp: packet.layer_1_wmo.sensor_status.temperature === 'PASS' ? 'Normal' : 'Anomaly',
          hum: packet.layer_1_wmo.sensor_status.humidity === 'PASS' ? 'Normal' : 'Anomaly',
          press: packet.layer_1_wmo.sensor_status.pressure === 'PASS' ? 'Normal' : 'Anomaly',
          wind: packet.layer_1_wmo.sensor_status.wind_speed === 'PASS' ? 'Normal' : 'Anomaly',
        });

        setIsAnomalyActive(isAnom);
      } catch (err) {
        console.error('Polling error on /api/readings:', err);
      }
    };

    // Initial fetch immediately
    pollStationData();

    // Poll every 2.5 seconds (2500ms)
    const intervalMs = Math.max(1000, Math.round(2500 / streamSpeed));
    const timer = setInterval(pollStationData, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [activeStationId, isPaused, streamSpeed]);

  // Periodic fetch from GET /api/alerts to keep anomalies table current
  useEffect(() => {
    let isMounted = true;
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts');
        if (!res.ok) return;
        const alertsList = await res.json();
        if (!isMounted || !Array.isArray(alertsList) || alertsList.length === 0) return;

        const formatted = alertsList.slice(0, 10).map((a, idx) => {
          const d = a.timestamp ? new Date(a.timestamp) : new Date();
          const timeStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
            ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            id: a.id || `ALRT-${idx + 1}`,
            time: timeStr,
            station_id: a.station_id || activeStationId,
            parameter: a.parameter || 'Temperature',
            value: a.value || 'Alert',
            severity: a.severity || 'High',
            status: a.status || 'Investigating',
          };
        });
        setAnomalies(formatted);
      } catch (e) {
        // Silently preserve pre-seeded anomalies
      }
    };

    fetchAlerts();
    const alertTimer = setInterval(fetchAlerts, 5000);
    return () => {
      isMounted = false;
      clearInterval(alertTimer);
    };
  }, [activeStationId]);

  // Polling Stream Controls
  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleSpeedChange = (hz) => {
    setStreamSpeed(hz);
  };

  const handleResetBuffer = () => {
    setPacketHistory([]);
  };

  const handleStationChange = (newStationId) => {
    setActiveStationId(newStationId);
    setPacketHistory([]);
  };

  const handleTriggerFault = async (faultType, sensor, mag, steps, desc) => {
    try {
      await fetch('/api/faults/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: activeStationId,
          fault_type: faultType,
          target_sensor: sensor,
          magnitude: mag,
          duration_steps: steps,
          description: desc,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearFaults = async () => {
    try {
      await fetch('/api/faults/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station_id: activeStationId }),
      });
      setIsAnomalyActive(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => setUser(null)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigateToTab={(tab) => setActiveTab(tab)}
      />

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} activeStationId={activeStationId} />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-5">
          {/* View 1: Main Dashboard (Matches Screenshot) */}
          {activeTab === 'dashboard' && (
            <>
              {/* Dashboard Title, Status & Clock */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Weather & Sensor Dashboard
                    </h1>
                    <span className="text-[0.68rem] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      5 Karnataka Stations Online
                    </span>
                  </div>
                  <p className="text-[0.84rem] text-slate-500 dark:text-slate-400 mt-0.5">
                    Live weather telemetry monitored by intelligent AI to detect faulty sensors and sudden changes
                  </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-sky-400 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>{showGuide ? 'Hide Guide' : 'How it works'}</span>
                    {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    {clockStr}
                  </div>
                </div>
              </div>

              {/* Collapsible 3-Step Plain English Explainer */}
              {showGuide && (
                <div className="bg-gradient-to-r from-sky-50/90 via-blue-50/90 to-indigo-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-2xl p-4.5 border border-sky-200/80 dark:border-sky-900/60 shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-200">
                        How ClimaSense Keeps Weather Data Reliable in 3 Simple Steps
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowGuide(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-1.5 py-0.5"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/85 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 shadow-2xs">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[0.68rem] font-bold">1</span>
                        Sensors Send Readings
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[0.74rem] leading-relaxed">
                        Automatic weather stations in Bengaluru, Mangaluru, Mysuru, Coorg, and Dharwad stream temperature, air pressure, wind, and rain every second.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/85 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 shadow-2xs">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[0.68rem] font-bold">2</span>
                        AI Validates Physical Laws
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[0.74rem] leading-relaxed">
                        Smart models check if numbers make sense together. If a thermometer jumps +15°C in one second or a moisture sensor gets stuck, the AI spots it.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/85 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 shadow-2xs">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[0.68rem] font-bold">3</span>
                        Instant Plain-English Alerts
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[0.74rem] leading-relaxed">
                        Engineers get instant warnings explaining exactly which sensor has drifted or failed, so bad data is fixed before reaching public forecasts.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 5 Metric Cards */}
              <MetricCards telemetry={telemetry} statusFlags={statusFlags} />

              {/* Middle Row (24h Chart + Station Map) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7">
                  <TemperatureChart currentTemp={telemetry.temperature} isAnomaly={isAnomalyActive} />
                </div>
                <div className="lg:col-span-5">
                  <StationMap activeStationId={activeStationId} isAnomalyActive={isAnomalyActive} />
                </div>
              </div>

              {/* Bottom Row: Recent Anomalies Table */}
              <RecentAnomaliesTable
                anomalies={anomalies}
                onViewAll={() => setActiveTab('anomalies')}
              />
            </>
          )}

          {/* View 2: Anomalies & Fault Sandbox */}
          {activeTab === 'anomalies' && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Anomalies & Sandbox</h1>
                <p className="text-[0.86rem] text-slate-500 mt-0.5">
                  Real-time sensor fault simulation and automated root-cause detection
                </p>
              </div>

              <FaultSandbox
                onTriggerFault={handleTriggerFault}
                onClearFaults={handleClearFaults}
              />

              <RecentAnomaliesTable
                anomalies={anomalies}
                onViewAll={() => {}}
              />
            </div>
          )}

          {/* View 3: Live Data (Upgraded Professional Telemetry Suite) */}
          {activeTab === 'live-data' && (
            <LiveDataSection
              telemetry={telemetry}
              statusFlags={statusFlags}
              latestPacket={latestPacket}
              packetHistory={packetHistory}
              activeStationId={activeStationId}
              onStationChange={handleStationChange}
              isPaused={isPaused}
              onTogglePause={handleTogglePause}
              streamSpeed={streamSpeed}
              onSpeedChange={handleSpeedChange}
              onResetBuffer={handleResetBuffer}
              onTriggerFault={handleTriggerFault}
              onClearFaults={handleClearFaults}
              isAnomalyActive={isAnomalyActive}
            />
          )}

          {/* View 4: Analytics */}
          {activeTab === 'analytics' && (
            <AnalyticsSection isAnomalyActive={isAnomalyActive} />
          )}

          {/* View 5: Stations Fleet Operations */}
          {activeTab === 'stations' && (
            <StationsSection
              activeStationId={activeStationId}
              onStationChange={handleStationChange}
              isAnomalyActive={isAnomalyActive}
              telemetry={telemetry}
              statusFlags={statusFlags}
              onNavigateToLive={() => setActiveTab('live-data')}
            />
          )}

          {/* View 6: Quality Reports & Scorecard */}
          {activeTab === 'reports' && (
            <ReportsSection />
          )}

          {/* View 7: System Settings & QC Configuration */}
          {activeTab === 'settings' && (
            <SettingsSection user={user} />
          )}
        </main>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
      />
    </div>
  );
}
