import React, { useState, useMemo } from 'react';

export default function MainDashboardView({
  selectedStation = 'AWS_001',
  setSelectedStation,
  stations = [],
  readings = [],
  alerts = [],
}) {
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(null);

  // Helper for 4-tier meteorological radar severity (single source of truth for both health grid & station indicators)
  const getStationSeverity = (st) => {
    if (!st || st.status !== 'anomaly') {
      return { level: 'CLEAR', color: '#6EC98F', label: 'NOMINAL' };
    }
    const lr = st.latestReading;
    const score = lr?.anomaly?.score ?? lr?.score ?? 0;
    const r = (lr?.anomaly?.reason || lr?.reason || '').toLowerCase();
    if (score < -0.12 || r.includes('spike') || r.includes('out of range') || (lr?.temperature && lr.temperature > 45)) {
      return { level: 'CRITICAL', color: '#D9534F', label: 'CRITICAL' };
    }
    if (r.includes('stuck') || r.includes('dropout')) {
      return { level: 'WARNING', color: '#E08D4B', label: 'WARNING' };
    }
    return { level: 'WATCH', color: '#D9C15C', label: 'WATCH' };
  };

  const currentStation = stations.find((s) => s.id === selectedStation) || stations[0];
  const activeSeverity = getStationSeverity(currentStation);
  const isAnomaly = activeSeverity.level !== 'CLEAR';

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : currentStation?.latestReading;

  // Sensor values
  const tempVal = latestReading?.temperature ?? 28.4;
  const humVal = latestReading?.humidity ?? 64.2;
  const pressVal = latestReading?.pressure ?? 912.4;
  const windVal = latestReading?.wind_speed ?? 14.2;

  // Compute trend from last 2 readings
  const prevReading = readings.length >= 2 ? readings[readings.length - 2] : null;
  const tempDiff = prevReading ? (tempVal - prevReading.temperature).toFixed(1) : '+0.2';
  const tempTrendStr = prevReading
    ? `${tempDiff >= 0 ? `+${tempDiff}` : tempDiff}°C/step (${isAnomaly ? 'outlier' : 'nominal'})`
    : '+0.2°C/hr (nominal)';

  // Build dynamic SVG curve points from readings (coral for temperature, red if anomaly)
  const { pathD, areaD, currentX, currentY } = useMemo(() => {
    const defaultD = "M 0,110 C 30,105 50,112 80,102 C 110,92 135,98 160,88 C 190,78 215,84 245,72 C 275,60 300,68 330,55 C 360,42 390,48 420,38 C 450,28 480,34 510,25 L 540,22";
    const defaultArea = `${defaultD} L 540,140 L 0,140 Z`;

    if (!readings || readings.length < 3) {
      return { pathD: defaultD, areaD: defaultArea, currentX: 540, currentY: 22 };
    }

    const recent = readings.slice(-15);
    const temps = recent.map((r) => Number(r.temperature) || 28);
    const minT = Math.min(...temps) - 2;
    const maxT = Math.max(...temps) + 2;
    const rangeT = maxT - minT || 1;

    const points = recent.map((r, i) => {
      const x = Math.round((i / (recent.length - 1)) * 540);
      const val = Number(r.temperature) || 28;
      const y = Math.round(125 - ((val - minT) / rangeT) * 105);
      return [x, y];
    });

    const path = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt[0]},${pt[1]}` : `${acc} L ${pt[0]},${pt[1]}`;
    }, '');

    const area = `${path} L 540,140 L 0,140 Z`;
    const lastPt = points[points.length - 1];

    return {
      pathD: path,
      areaD: area,
      currentX: lastPt[0],
      currentY: lastPt[1],
    };
  }, [readings]);

  const handleSyncVectors = () => {
    setIsSyncing(true);
    setSyncToast('Polling station sensors & synchronizing state vectors...');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncToast('State vectors synchronized with Isolation Forest pipeline.');
      setTimeout(() => setSyncToast(null), 3000);
    }, 900);
  };

  const networkAlert = alerts.find((a) => a.is_anomaly) || alerts[0];

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Toast Notification */}
      {syncToast && (
        <div className="p-3 rounded bg-[#1C1F28] border border-primary text-primary font-label-md text-xs flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
            {syncToast}
          </span>
          <button onClick={() => setSyncToast(null)} className="text-primary hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* TOP HEALTH STRIP: Weather-Radar 4-Step Severity Scale */}
      <section className="w-full bg-surface-container rounded p-space-md flex flex-col gap-space-xs border border-outline-variant">
        <div className="flex items-center justify-between font-label-sm text-label-sm text-outline mb-1">
          <span className="tracking-widest uppercase text-on-surface-variant font-medium">Statewide Node Health Grid</span>
          <span className="tabular-nums">5/5 REPORTING (CYCLE 60s)</span>
        </div>
        <div className="grid grid-cols-5 gap-2 w-full">
          {stations.map((st) => {
            const sev = getStationSeverity(st);
            return (
              <div
                key={st.id}
                className="h-1.5 w-full rounded-none transition-colors"
                style={{ backgroundColor: sev.color }}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-5 gap-2 w-full mt-1">
          {stations.map((st) => {
            const sev = getStationSeverity(st);
            const shortName = {
              AWS_001: 'BLR',
              AWS_002: 'MYS',
              AWS_003: 'IXE',
              AWS_004: 'HBX',
              AWS_005: 'IXG',
            }[st.id] || st.id;

            return (
              <button
                key={st.id}
                onClick={() => setSelectedStation(st.id)}
                className={`flex flex-col text-left p-1 rounded transition-colors focus:outline-none ${
                  st.id === selectedStation ? 'bg-surface-container-high' : 'hover:bg-surface-container-low'
                }`}
              >
                <span
                  className={`font-label-sm text-label-sm font-medium truncate ${
                    st.id === selectedStation ? 'text-white font-semibold' : 'text-on-surface-variant'
                  }`}
                >
                  {st.id} ({shortName})
                </span>
                <span
                  className="font-label-sm text-[11px] font-mono font-semibold"
                  style={{ color: sev.color }}
                >
                  {sev.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* STATION HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              {currentStation?.name} ({currentStation?.id})
            </h1>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-primary border border-outline-variant uppercase tracking-wider">
              {currentStation?.id === 'AWS_001' ? 'Master Primary' : 'Edge Node'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 font-body-sm text-body-sm">
            <span
              id="station-status-indicator-dot"
              className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                isAnomaly ? 'animate-pulse' : ''
              }`}
              style={{ backgroundColor: activeSeverity.color }}
            />
            {isAnomaly ? (
              <span className="font-medium" style={{ color: activeSeverity.color }}>
                {currentStation?.id} reporting {activeSeverity.label} — {currentStation?.latestReading?.anomaly?.reason || currentStation?.latestReading?.reason || latestReading?.anomaly?.reason || latestReading?.reason || 'anomalous sensor pattern'}
              </span>
            ) : networkAlert ? (
              <span className="text-on-surface-variant font-medium">
                Radar alert: <strong style={{ color: '#D9534F' }}>{networkAlert.station_id}</strong> reporting {networkAlert.reason}
              </span>
            ) : (
              <span className="text-on-surface-variant font-medium">
                {currentStation?.id} reporting nominal telemetry • All channels within atmospheric envelope
              </span>
            )}
            <span className="text-outline font-label-sm text-label-sm hidden sm:inline">• Meteorological mesh synced</span>
          </div>
        </div>

        {/* Station selector dropdown */}
        <div className="relative shrink-0">
          <div className="flex items-center gap-space-md px-space-md py-2 min-h-[42px] rounded bg-surface-container hover:bg-surface-container-high transition-colors text-left border border-outline-variant">
            {/* Real-time status indicator dot directly next to the station selector */}
            <span
              id="top-station-selector-dot"
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isAnomaly ? 'animate-pulse' : ''
              }`}
              style={{ backgroundColor: activeSeverity.color }}
              title={`Station ${currentStation?.id}: ${activeSeverity.label}`}
            />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Monitored Station</span>
              <select
                id="station-selector-dropdown"
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="bg-transparent font-label-md text-label-md text-on-surface font-medium cursor-pointer outline-none pr-4"
              >
                {stations.map((st) => {
                  const sSev = getStationSeverity(st);
                  return (
                    <option key={st.id} value={st.id} className="bg-surface-container text-on-surface">
                      {st.name} ({st.id}) {sSev.level !== 'CLEAR' ? `[${sSev.label}]` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <span className="material-symbols-outlined text-[18px] text-outline pointer-events-none">unfold_more</span>
          </div>
        </div>
      </header>

      {/* TELEMETRY METRICS SECTION (ASYMMETRIC GRID) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Hero Card: Ambient Temperature (Warm Coral #E08D6B / Radar Red #D9534F if Anomaly) */}
        <div className="lg:col-span-7 bg-surface-container rounded p-space-lg flex flex-col justify-between relative overflow-hidden border border-outline-variant">
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px] text-[#E08D6B]">thermostat</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">Ambient Temperature</span>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-[#E08D6B] border border-[#E08D6B]/30 uppercase">
                PT100 RTD
              </span>
            </div>
            <div className="flex items-baseline flex-wrap gap-x-space-md mt-2">
              <span
                className="font-telemetry-xl text-telemetry-xl tracking-tight font-medium"
                style={{ color: isAnomaly ? '#D9534F' : '#E08D6B' }}
              >
                {typeof tempVal === 'number' ? tempVal.toFixed(1) : tempVal}°C
              </span>
              <span
                className="font-telemetry-md text-telemetry-md font-medium"
                style={{ color: isAnomaly ? '#D9534F' : '#6EC98F' }}
              >
                {tempTrendStr}
              </span>
              <span className="font-label-sm text-label-sm text-outline ml-auto hidden sm:inline">
                Baseline: 27.8°C
              </span>
            </div>
          </div>

          {/* Area Sparkline / Telemetry Curve in Warm Coral / Radar Red */}
          <div className="w-full my-space-md relative">
            <svg className="w-full h-36 overflow-visible" preserveAspectRatio="none" viewBox="0 0 540 140">
              <defs>
                <linearGradient id="tempGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={isAnomaly ? '#D9534F' : '#E08D6B'} stopOpacity="0.22"></stop>
                  <stop offset="100%" stopColor={isAnomaly ? '#D9534F' : '#E08D6B'} stopOpacity="0.0"></stop>
                </linearGradient>
                <pattern height="35" id="chartGrid" patternUnits="userSpaceOnUse" width="45">
                  <path d="M 45 0 L 0 0 0 35" fill="none" stroke="#2B2F3A" strokeDasharray="2 2" strokeWidth="0.5"></path>
                </pattern>
              </defs>
              <rect fill="url(#chartGrid)" height="140" opacity="0.6" width="540"></rect>
              {/* Normal band bounds */}
              <rect fill={isAnomaly ? '#D9534F' : '#E08D6B'} fillOpacity="0.03" height="65" width="540" y="30"></rect>
              {/* Area fill */}
              <path d={areaD} fill="url(#tempGradient)" />
              {/* Telemetry Curve */}
              <path
                d={pathD}
                fill="none"
                stroke={isAnomaly ? '#D9534F' : '#E08D6B'}
                strokeLinecap="round"
                strokeWidth="2.5"
              />
              <circle cx={currentX} cy={currentY} fill={isAnomaly ? '#D9534F' : '#E08D6B'} r="4"></circle>
              <circle
                cx={currentX}
                cy={currentY}
                fill="none"
                opacity="0.5"
                r="8"
                stroke={isAnomaly ? '#D9534F' : '#E08D6B'}
                strokeWidth="1.2"
              ></circle>
            </svg>
            <div className="flex justify-between items-center font-label-sm text-label-sm text-outline mt-1 tabular-nums">
              <span>-20m</span>
              <span>-15m</span>
              <span>-10m</span>
              <span>-5m</span>
              <span className="text-[#E08D6B] font-medium">LIVE (14:12 IST)</span>
            </div>
          </div>
          <div className="flex items-center justify-between font-label-sm text-label-sm text-outline pt-2 border-t border-surface-container-high">
            <span>Last 20 readings (interval: 60s) • Calibration verified 06:00 IST</span>
            <span className="text-on-surface-variant font-medium">RMSD: 0.04°C</span>
          </div>
        </div>

        {/* 3 Stacked Compact Cards: Humidity (Sky Blue), Pressure (Brass/Amber), Wind (Cyan-Gray) */}
        <div className="lg:col-span-5 flex flex-col gap-space-md justify-between">
          {/* Card 1: Relative Humidity (Clear Sky-Blue #6FA8DC) */}
          <div className="bg-surface-container rounded p-space-md flex flex-col justify-between flex-1 border border-outline-variant">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px] text-[#6FA8DC]">humidity_percentage</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">Relative Humidity</span>
              </div>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-low text-[#6FA8DC] border border-[#6FA8DC]/30">
                CAP-2010
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-medium">
                {typeof humVal === 'number' ? humVal.toFixed(1) : humVal}%
              </span>
              <span className="font-label-sm text-label-sm text-outline">
                Dew Point: {((typeof humVal === 'number' ? humVal : 60) * 0.32).toFixed(1)}°C
              </span>
            </div>
            <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden my-2">
              <div
                className="bg-[#6FA8DC] h-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, humVal))}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-outline">
              <span>Target envelope: 40-80%</span>
              <span className="font-semibold" style={{ color: humVal <= 0 ? '#D9534F' : '#6EC98F' }}>
                {humVal <= 0 ? 'DROPOUT' : 'NORMAL'}
              </span>
            </div>
          </div>

          {/* Card 2: Barometric Pressure (Muted Brass/Amber #C9A24B) */}
          <div className="bg-surface-container rounded p-space-md flex flex-col justify-between flex-1 border border-outline-variant">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px] text-[#C9A24B]">compress</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">Atmospheric Pressure</span>
              </div>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-low text-[#C9A24B] border border-[#C9A24B]/30">
                PIEZO-BARO
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-medium">
                {typeof pressVal === 'number' ? pressVal.toFixed(1) : pressVal} hPa
              </span>
              <span className="font-telemetry-md text-telemetry-md text-[#C9A24B]">-0.1 hPa/3h</span>
            </div>
            <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden my-2">
              <div className="bg-[#C9A24B] h-full transition-all duration-300" style={{ width: '82%' }}></div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-outline">
              <span>QNH Altimeter reference</span>
              <span className="text-on-surface-variant font-medium">Station Elev: {currentStation?.elevation || '920m'}</span>
            </div>
          </div>

          {/* Card 3: Wind Velocity & Gust (Cool Cyan-Gray #7FA8B3) */}
          <div className="bg-surface-container rounded p-space-md flex flex-col justify-between flex-1 border border-outline-variant">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px] text-[#7FA8B3]">air</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">Wind Speed (10m mast)</span>
              </div>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-low text-[#7FA8B3] border border-[#7FA8B3]/30">
                SONIC-3AXIS
              </span>
            </div>
            <div className="flex items-baseline gap-space-sm mt-2">
              <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-medium">
                {typeof windVal === 'number' ? windVal.toFixed(1) : windVal} m/s
              </span>
              <span className="font-body-md text-body-md text-[#7FA8B3]">WSW (245°)</span>
            </div>
            <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden my-2">
              <div
                className="bg-[#7FA8B3] h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (windVal / 35) * 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm text-outline">
              <span>Gust peak: {(windVal * 1.4).toFixed(1)} m/s</span>
              <span className="font-medium" style={{ color: windVal > 25 ? '#E08D4B' : '#6EC98F' }}>
                {windVal > 25 ? 'Gale Warning' : 'Beaufort: 3 (Gentle)'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM ROW: ALERTS & INFERENCE STATUS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left Panel: Recent Telemetry Alerts */}
        <div className="lg:col-span-7 bg-surface-container rounded p-space-lg flex flex-col gap-space-md border border-outline-variant">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[#D9534F] text-[20px]">notifications_active</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-medium">Recent Telemetry Alerts</h2>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">({alerts.length} logged incidents)</span>
          </div>
          <div className="flex flex-col gap-space-sm">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-outline font-body-sm">
                No active anomaly alerts detected across cluster nodes.
              </div>
            ) : (
              alerts.slice(0, 3).map((al, idx) => {
                const isCrit =
                  idx === 0 ||
                  al.reason?.toLowerCase().includes('spike') ||
                  al.reason?.toLowerCase().includes('out of range');
                const badgeColor = isCrit ? '#D9534F' : '#E08D4B';
                const borderColor = isCrit ? '#D9534F' : '#E08D4B';

                return (
                  <div
                    key={al.id || idx}
                    className="p-space-md rounded flex flex-col gap-1 border-l-4 bg-surface-container-low"
                    style={{ borderLeftColor: borderColor }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        {al.station_id} ({stations.find((s) => s.id === al.station_id)?.name || al.station_id})
                      </span>
                      <div className="flex items-center gap-space-sm">
                        <span
                          className="font-label-sm text-label-sm px-1.5 py-0.5 rounded font-medium border"
                          style={{
                            color: badgeColor,
                            borderColor: `${badgeColor}50`,
                            backgroundColor: `${badgeColor}15`,
                          }}
                        >
                          {isCrit ? 'CRITICAL 3.2σ' : 'WARNING DRIFT'}
                        </span>
                        <span className="font-label-sm text-label-sm text-outline tabular-nums">
                          {al.timestamp ? new Date(al.timestamp).toLocaleTimeString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface">{al.reason}</p>
                    <div className="flex items-center gap-4 font-label-sm text-label-sm mt-1 text-outline">
                      <span>Score: {typeof al.score === 'number' ? al.score.toFixed(3) : al.score}</span>
                      <span>Auto-isolated</span>
                      <button
                        onClick={() => setSelectedStation(al.station_id)}
                        className="ml-auto underline cursor-pointer hover:text-white text-primary"
                      >
                        Inspect Node
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Model & Buffer Widget (Storm-Sky Blue Branding) */}
        <div className="lg:col-span-5 bg-surface-container rounded p-space-lg flex flex-col justify-between gap-space-md border border-outline-variant">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-medium">Inference Pipeline Status</h2>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-primary border border-primary/30">
                ONLINE
              </span>
            </div>

            {/* Gauge & Engine Stats */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-space-md my-space-lg">
              {/* Circular Gauge in Storm Sky Blue */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="none" r="42" stroke="#2B2F3A" strokeWidth="8"></circle>
                  <circle
                    cx="50"
                    cy="50"
                    fill="none"
                    r="42"
                    stroke="#5B7FBD"
                    strokeDasharray="263.89"
                    strokeDashoffset={(1 - Math.min(1, (readings.length || 10) / 10)) * 263.89}
                    strokeLinecap="butt"
                    strokeWidth="8"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-semibold tracking-tight">
                    {Math.min(50, readings.length || 10)}/50
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase mt-0.5 max-w-[80px] leading-tight">
                    Window Buffer
                  </span>
                </div>
              </div>

              {/* Model Operational Identity */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6EC98F]"></span>
                  <span className="font-body-md text-body-md text-on-surface font-medium">Isolation Forest — operational</span>
                </div>
                <div className="flex flex-col gap-1 font-label-sm text-label-sm text-outline">
                  <div className="flex justify-between gap-4">
                    <span>Latency</span>
                    <span className="font-telemetry-md text-telemetry-md text-on-surface tabular-nums">4.2ms avg</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Ensemble Size</span>
                    <span className="font-telemetry-md text-telemetry-md text-on-surface tabular-nums">100 estimators</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Contamination Factor</span>
                    <span className="font-telemetry-md text-telemetry-md text-on-surface tabular-nums">0.015</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>State Vector Dimension</span>
                    <span className="font-telemetry-md text-telemetry-md text-on-surface tabular-nums">4D Vector</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar in Storm Sky Blue */}
          <div className="pt-space-md border-t border-surface-container-high flex items-center justify-between gap-space-sm flex-wrap">
            <button
              onClick={() => setShowCalibrationModal(true)}
              className="px-space-md py-2 min-h-[40px] rounded bg-surface-container-low hover:bg-surface-container-high transition-colors font-label-sm text-label-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5 border border-outline-variant"
            >
              <span className="material-symbols-outlined text-[16px] text-outline">tune</span>
              Threshold Calibration
            </button>
            <button
              onClick={handleSyncVectors}
              disabled={isSyncing}
              className="px-space-md py-2 min-h-[40px] rounded bg-primary hover:bg-primary-hover text-white font-label-sm text-label-sm uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5"
            >
              <span className={`material-symbols-outlined text-[16px] ${isSyncing ? 'animate-spin' : ''}`}>refresh</span>
              {isSyncing ? 'Syncing...' : 'Sync Vectors'}
            </button>
          </div>
        </div>
      </section>

      {/* Threshold Calibration Modal */}
      {showCalibrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 max-w-md w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Isolation Forest Calibration</h3>
              </div>
              <button
                onClick={() => setShowCalibrationModal(false)}
                className="text-outline hover:text-on-surface text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Adjust online contamination sensitivity and sliding window bounds for the 100-tree ensemble.
            </p>
            <div className="flex flex-col gap-3 font-label-sm text-label-sm text-outline">
              <div className="flex justify-between items-center">
                <span>Contamination Factor:</span>
                <span className="font-mono text-primary font-bold">0.015 (Standard)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Z-Score Outlier Bound:</span>
                <span className="font-mono text-primary font-bold">3.2 σ</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Stuck Sensor Flatline Window:</span>
                <span className="font-mono text-primary font-bold">5 readings (60s)</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-surface-container-high">
              <button
                onClick={() => setShowCalibrationModal(false)}
                className="px-4 py-2 rounded bg-surface-container-low text-on-surface hover:bg-surface-container-high font-label-md text-label-md"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowCalibrationModal(false);
                  handleSyncVectors();
                }}
                className="px-4 py-2 rounded bg-primary hover:bg-primary-hover text-white font-label-md text-label-md font-semibold"
              >
                Apply Parameters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
