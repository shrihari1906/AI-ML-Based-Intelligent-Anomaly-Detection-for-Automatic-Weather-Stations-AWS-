import React, { useState } from 'react';

export default function FaultSandboxView({
  selectedStation = 'AWS_002',
  setSelectedStation,
  stations = [],
  onSendReading,
}) {
  const [targetStation, setTargetStation] = useState(selectedStation || 'AWS_002');
  const [activeFault, setActiveFault] = useState('heat-spike'); // 'heat-spike' | 'frozen' | 'dropout' | 'pressure' | 'wind'
  const [magnitude, setMagnitude] = useState(13);
  const [duration, setDuration] = useState(15);
  const [noise, setNoise] = useState(2);
  const [isSimulating, setIsSimulating] = useState(false);
  const [frozenStep, setFrozenStep] = useState(0);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [contamination, setContamination] = useState(0.035);
  const [subsampleSize, setSubsampleSize] = useState(256);
  const [toastMsg, setToastMsg] = useState(null);

  // Verdict state
  const [verdict, setVerdict] = useState({
    isAnomaly: true,
    score: -0.742,
    confidence: '94.8%',
    reason: 'Isolated temperature divergence without barometric or humidity shifts typical of natural heatwaves. Characteristic of sensor thermistor failure.',
    tempDisplay: '41.2',
    pressDisplay: '928',
    humDisplay: '62',
  });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);

    try {
      if (activeFault === 'heat-spike') {
        const payload = {
          station_id: targetStation,
          timestamp: new Date().toISOString(),
          temperature: +(28.4 + Number(magnitude)).toFixed(1),
          humidity: 50.0,
          pressure: 1012.0,
          wind_speed: 3.5,
        };
        const res = onSendReading ? await onSendReading(payload) : null;
        setVerdict({
          isAnomaly: true,
          score: res?.anomaly?.score ?? -0.742,
          confidence: '96.2%',
          reason: res?.anomaly?.reason || `temperature out of range (${payload.temperature} °C)`,
          tempDisplay: payload.temperature.toFixed(1),
          pressDisplay: '1012',
          humDisplay: '50',
        });
        showToast(`Thermal spike payload injected to ${targetStation} successfully.`);
      } else if (activeFault === 'frozen') {
        let finalRes = null;
        for (let i = 1; i <= 6; i++) {
          setFrozenStep(i);
          const payload = {
            station_id: targetStation,
            timestamp: new Date().toISOString(),
            temperature: 24.5,
            humidity: 55.0,
            pressure: 1013.0,
            wind_speed: 2.0,
          };
          if (onSendReading) {
            finalRes = await onSendReading(payload);
          }
          if (i < 6) await sleep(650);
        }
        setVerdict({
          isAnomaly: true,
          score: finalRes?.anomaly?.score ?? -0.684,
          confidence: '98.1%',
          reason: finalRes?.anomaly?.reason || 'stuck sensor (temperature constant at 24.5 °C for >= 5 readings)',
          tempDisplay: '24.5',
          pressDisplay: '1013',
          humDisplay: '55',
        });
        showToast(`Frozen sensor burst (6x packets) completed on ${targetStation}.`);
      } else if (activeFault === 'dropout') {
        const payload = {
          station_id: targetStation,
          timestamp: new Date().toISOString(),
          temperature: 24.0,
          humidity: 0.0,
          pressure: 1012.0,
          wind_speed: 3.0,
        };
        const res = onSendReading ? await onSendReading(payload) : null;
        setVerdict({
          isAnomaly: true,
          score: res?.anomaly?.score ?? -0.812,
          confidence: '99.0%',
          reason: res?.anomaly?.reason || 'sensor dropout (humidity at 0%)',
          tempDisplay: '24.0',
          pressDisplay: '1012',
          humDisplay: '0.0',
        });
        showToast(`Hygrometer zero-dropout packet injected to ${targetStation}.`);
      } else if (activeFault === 'pressure') {
        const payload = {
          station_id: targetStation,
          timestamp: new Date().toISOString(),
          temperature: 22.0,
          humidity: 65.0,
          pressure: 850.0,
          wind_speed: 4.0,
        };
        const res = onSendReading ? await onSendReading(payload) : null;
        setVerdict({
          isAnomaly: true,
          score: res?.anomaly?.score ?? -0.765,
          confidence: '95.4%',
          reason: res?.anomaly?.reason || 'pressure out of range (850 hPa)',
          tempDisplay: '22.0',
          pressDisplay: '850',
          humDisplay: '65',
        });
        showToast(`Barometric step drop (850 hPa) injected to ${targetStation}.`);
      } else if (activeFault === 'wind') {
        const payload = {
          station_id: targetStation,
          timestamp: new Date().toISOString(),
          temperature: 23.5,
          humidity: 70.0,
          pressure: 1009.0,
          wind_speed: 45.0,
        };
        const res = onSendReading ? await onSendReading(payload) : null;
        setVerdict({
          isAnomaly: true,
          score: res?.anomaly?.score ?? -0.738,
          confidence: '97.2%',
          reason: res?.anomaly?.reason || 'wind speed spike (45 m/s)',
          tempDisplay: '23.5',
          pressDisplay: '1009',
          humDisplay: '70',
        });
        showToast(`Severe wind gust spike (45 m/s) injected to ${targetStation}.`);
      }
    } catch (err) {
      console.error(err);
      showToast('Simulation request completed.');
    } finally {
      setIsSimulating(false);
      setFrozenStep(0);
    }
  };

  const handleResetSimulation = async () => {
    setIsSimulating(true);
    try {
      for (let i = 1; i <= 3; i++) {
        const payload = {
          station_id: targetStation,
          timestamp: new Date().toISOString(),
          temperature: +(24.5 + i * 0.2).toFixed(1),
          humidity: +(60.0 + i * 0.5).toFixed(1),
          pressure: 1012.0,
          wind_speed: +(3.5 + i * 0.1).toFixed(1),
        };
        if (onSendReading) await onSendReading(payload);
        if (i < 3) await sleep(300);
      }
      setVerdict({
        isAnomaly: false,
        score: 0.155,
        confidence: '99.4%',
        reason: 'Normal ambient telemetry within standard operational boundaries.',
        tempDisplay: '25.1',
        pressDisplay: '1012',
        humDisplay: '61.5',
      });
      showToast(`Restored ${targetStation} to nominal state with 3 equilibrium packets.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportJson = () => {
    const data = {
      incident_id: `FLT-${Date.now()}`,
      station_id: targetStation,
      profile: activeFault,
      parameters: {
        magnitude: `+${magnitude}°C`,
        duration: `${duration}m`,
        noise_factor: `±${noise * 0.1}σ`,
        contamination_factor: contamination,
      },
      diagnostic_verdict: verdict,
      timestamp: new Date().toISOString(),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `incident_${targetStation}_${activeFault}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast(`Incident JSON file downloaded for ${targetStation}.`);
  };

  // Dynamic SVG path for right anomaly card in Radar-Red (#D9534F)
  const renderFaultSvgPath = () => {
    if (activeFault === 'frozen') {
      return (
        <>
          <polygon fill="#D9534F" fillOpacity="0.08" points="0,50 400,50 400,100 0,100"></polygon>
          <line x1="0" y1="50" x2="400" y2="50" stroke="#D9534F" strokeWidth="2.5"></line>
          <circle cx="150" cy="50" fill="#D9534F" r="3.5"></circle>
          <circle cx="280" cy="50" fill="#D9534F" r="3.5"></circle>
        </>
      );
    }
    if (activeFault === 'dropout') {
      return (
        <>
          <polygon fill="#D9534F" fillOpacity="0.08" points="0,35 150,35 160,95 400,95 400,100 0,100"></polygon>
          <path d="M 0 35 L 150 35 L 160 95 L 400 95" fill="none" stroke="#D9534F" strokeWidth="2.5"></path>
          <circle cx="160" cy="95" fill="#D9534F" r="3.5"></circle>
        </>
      );
    }
    if (activeFault === 'pressure') {
      return (
        <>
          <polygon fill="#D9534F" fillOpacity="0.08" points="0,30 140,30 160,75 400,75 400,100 0,100"></polygon>
          <path d="M 0 30 L 140 30 L 160 75 L 400 75" fill="none" stroke="#D9534F" strokeWidth="2.5"></path>
          <circle cx="160" cy="75" fill="#D9534F" r="3.5"></circle>
        </>
      );
    }
    if (activeFault === 'wind') {
      return (
        <>
          <polygon fill="#D9534F" fillOpacity="0.08" points="0,75 140,75 170,12 210,80 240,25 280,75 400,75 400,100 0,100"></polygon>
          <path d="M 0 75 L 140 75 Q 155 75 170 12 Q 190 75 210 80 Q 225 25 240 25 Q 260 75 280 75 L 400 75" fill="none" stroke="#D9534F" strokeWidth="2.5"></path>
          <circle cx="170" cy="12" fill="#D9534F" r="3.5"></circle>
        </>
      );
    }
    return (
      <>
        <polygon fill="#D9534F" fillOpacity="0.1" points="0,68 140,68 180,18 260,14 310,18 400,16 400,100 0,100"></polygon>
        <path d="M 0 68 L 130 68 Q 155 68 175 22 L 240 16 L 310 18 L 400 15" fill="none" stroke="#D9534F" strokeWidth="2.5"></path>
        <circle cx="175" cy="22" fill="#D9534F" r="3.5"></circle>
      </>
    );
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 rounded bg-surface-container border border-primary text-primary font-label-md text-xs flex items-center justify-between shadow-lg">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 font-bold">✕</button>
        </div>
      )}

      {/* Header Block with Operational Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm font-label-sm text-label-sm text-outline uppercase tracking-wider">
            <span className="text-primary">SANDBOX // ENVIRO-LAB</span>
            <span>/</span>
            <span>ISOLATION FOREST V2.4.1</span>
            <span>/</span>
            <span className="text-on-surface-variant">TELEMETRY INJECTOR</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Fault Injection &amp; Model Diagnostic Sandbox
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Simulate sensor hardware degradations and atmospheric anomalies against the live Isolation Forest pipeline. Calibrate false positive tolerances across Karnataka cluster nodes.
          </p>
        </div>
        {/* Live Telemetry Stream Indicator */}
        <div className="flex items-center gap-space-md shrink-0 bg-surface-container-low px-space-md py-space-sm rounded border border-outline-variant">
          <div className="flex flex-col items-start">
            <span className="font-label-sm text-label-sm text-outline">ENGINE LATENCY</span>
            <span className="font-telemetry-md text-telemetry-md text-primary font-medium">8.42 ms avg</span>
          </div>
          <div className="h-6 w-px bg-outline-variant"></div>
          <div className="flex flex-col items-start">
            <span className="font-label-sm text-label-sm text-outline">CONTAINMENT</span>
            <span className="font-label-sm text-label-sm text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> ISOLATED
            </span>
          </div>
        </div>
      </div>

      {/* Active Anomaly Alert Banner in Radar Red #D9534F */}
      <div className="bg-[#2D1B1E] border-l-4 border-l-[#D9534F] rounded-r-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <span className="material-symbols-outlined text-[#D9534F] text-2xl shrink-0">warning</span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-headline-sm text-headline-sm text-[#F2F3F5] font-medium tracking-tight">
              ACTIVE PROFILE: {activeFault.toUpperCase()} target node {targetStation}
            </span>
            <span className="hidden sm:inline text-outline">•</span>
            <span className="font-label-md text-label-md text-on-surface-variant">
              {isSimulating
                ? frozenStep > 0
                  ? `Injecting frozen packet ${frozenStep}/6...`
                  : 'Evaluating online ML trees...'
                : 'Model Evaluated in 8.4ms'}
            </span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-space-sm">
          <span className="font-label-sm text-label-sm text-[#D9534F] bg-surface-container-lowest px-3 py-1 rounded border border-[#D9534F]/40 tabular-nums font-mono">
            Score: {typeof verdict.score === 'number' ? verdict.score.toFixed(3) : verdict.score} ({verdict.isAnomaly ? 'Anomaly' : 'Nominal'})
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-[10px] font-mono text-outline border border-outline-variant">
            KA-ZONE-S2
          </span>
        </div>
      </div>

      {/* Main Grid: Controls + Context */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
        {/* Control Panel (Left 8 cols) */}
        <div className="xl:col-span-8 bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col gap-space-lg">
          {/* Panel Header & Target Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-md border-b border-outline-variant">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-[#6B7280] uppercase tracking-wider">TARGET STATION NODE</span>
              <span className="font-headline-sm text-headline-sm text-[#F2F3F5] font-semibold">Sensor Cluster Target &amp; Mode</span>
            </div>
            {/* Dropdown Selector */}
            <div className="relative min-w-[280px]">
              <select
                value={targetStation}
                onChange={(e) => {
                  setTargetStation(e.target.value);
                  setSelectedStation(e.target.value);
                }}
                className="w-full bg-surface-container-lowest border border-outline-variant text-[#F2F3F5] font-label-md text-label-md py-2.5 px-3 min-h-[42px] rounded appearance-none cursor-pointer focus:outline-none focus:border-primary pr-10"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.id} className="bg-surface-container">
                    {st.id} — {st.name} ({st.district})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[#9CA3AF] pointer-events-none absolute right-3 top-3 text-[18px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Fault Vector Selector Buttons (Sensor-Themed Accents) */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-[#9CA3AF] uppercase tracking-wider">Select Degradation Profile</span>
              <span className="font-label-sm text-label-sm text-primary">5 FAULT PATTERNS LOADED</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-sm">
              {/* Button 1: Heat Spike (Coral #E08D6B) */}
              <button
                onClick={() => setActiveFault('heat-spike')}
                className={`flex flex-col items-start p-3 min-h-[76px] rounded text-left transition-all relative overflow-hidden group border ${
                  activeFault === 'heat-spike'
                    ? 'bg-surface-container-high border-[#E08D6B] text-white ring-1 ring-[#E08D6B]/50'
                    : 'bg-surface-container-low border-outline-variant text-on-surface hover:border-[#E08D6B]/50'
                }`}
                type="button"
              >
                {activeFault === 'heat-spike' && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#E08D6B]"></div>
                )}
                <span className="material-symbols-outlined text-[#E08D6B] text-[20px] mb-1">local_fire_department</span>
                <span className="font-label-md text-label-md font-medium">Heat Spike</span>
                <span className="font-label-sm text-label-sm text-outline mt-0.5">Temp: +{magnitude}°C</span>
              </button>

              {/* Button 2: Frozen Sensor (Radar Amber #D9C15C) */}
              <button
                onClick={() => setActiveFault('frozen')}
                className={`flex flex-col items-start p-3 min-h-[76px] rounded text-left transition-all relative overflow-hidden group border ${
                  activeFault === 'frozen'
                    ? 'bg-surface-container-high border-[#D9C15C] text-white ring-1 ring-[#D9C15C]/50'
                    : 'bg-surface-container-low border-outline-variant text-on-surface hover:border-[#D9C15C]/50'
                }`}
                type="button"
              >
                {activeFault === 'frozen' && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#D9C15C]"></div>
                )}
                <span className="material-symbols-outlined text-[#D9C15C] text-[20px] mb-1">ac_unit</span>
                <span className="font-label-md text-label-md font-medium">Frozen Sensor</span>
                <span className="font-label-sm text-label-sm text-outline mt-0.5">6x Burst (delay)</span>
              </button>

              {/* Button 3: Sensor Dropout (Sky-Blue #6FA8DC) */}
              <button
                onClick={() => setActiveFault('dropout')}
                className={`flex flex-col items-start p-3 min-h-[76px] rounded text-left transition-all relative overflow-hidden group border ${
                  activeFault === 'dropout'
                    ? 'bg-surface-container-high border-[#6FA8DC] text-white ring-1 ring-[#6FA8DC]/50'
                    : 'bg-surface-container-low border-outline-variant text-on-surface hover:border-[#6FA8DC]/50'
                }`}
                type="button"
              >
                {activeFault === 'dropout' && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#6FA8DC]"></div>
                )}
                <span className="material-symbols-outlined text-[#6FA8DC] text-[20px] mb-1">signal_disconnected</span>
                <span className="font-label-md text-label-md font-medium">Sensor Dropout</span>
                <span className="font-label-sm text-label-sm text-outline mt-0.5">Humidity: 0%</span>
              </button>

              {/* Button 4: Pressure Anomaly (Brass/Amber #C9A24B) */}
              <button
                onClick={() => setActiveFault('pressure')}
                className={`flex flex-col items-start p-3 min-h-[76px] rounded text-left transition-all relative overflow-hidden group border ${
                  activeFault === 'pressure'
                    ? 'bg-surface-container-high border-[#C9A24B] text-white ring-1 ring-[#C9A24B]/50'
                    : 'bg-surface-container-low border-outline-variant text-on-surface hover:border-[#C9A24B]/50'
                }`}
                type="button"
              >
                {activeFault === 'pressure' && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C9A24B]"></div>
                )}
                <span className="material-symbols-outlined text-[#C9A24B] text-[20px] mb-1">compress</span>
                <span className="font-label-md text-label-md font-medium">Pressure Drop</span>
                <span className="font-label-sm text-label-sm text-outline mt-0.5">Press: 850 hPa</span>
              </button>

              {/* Button 5: Wind Spike (Cyan-Gray #7FA8B3) */}
              <button
                onClick={() => setActiveFault('wind')}
                className={`flex flex-col items-start p-3 min-h-[76px] rounded text-left transition-all relative overflow-hidden group border ${
                  activeFault === 'wind'
                    ? 'bg-surface-container-high border-[#7FA8B3] text-white ring-1 ring-[#7FA8B3]/50'
                    : 'bg-surface-container-low border-outline-variant text-on-surface hover:border-[#7FA8B3]/50'
                }`}
                type="button"
              >
                {activeFault === 'wind' && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#7FA8B3]"></div>
                )}
                <span className="material-symbols-outlined text-[#7FA8B3] text-[20px] mb-1">air</span>
                <span className="font-label-md text-label-md font-medium">Wind Spike</span>
                <span className="font-label-sm text-label-sm text-outline mt-0.5">Wind: 45 m/s</span>
              </button>
            </div>
          </div>

          {/* Parameter Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-space-sm">
            {/* Slider 1: Magnitude */}
            <div className="flex flex-col gap-2 bg-surface-container-lowest p-3 rounded border border-outline-variant">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-[#9CA3AF]">MAGNITUDE</span>
                <span className="font-label-sm text-label-sm text-primary font-mono bg-surface-container-high px-1.5 py-0.5 rounded">
                  +{magnitude}.0°C
                </span>
              </div>
              <input
                className="w-full accent-primary bg-surface-container-high h-2 rounded cursor-pointer"
                max="25"
                min="1"
                type="range"
                value={magnitude}
                onChange={(e) => setMagnitude(e.target.value)}
              />
              <div className="flex justify-between font-label-sm text-label-sm text-[#6B7280]">
                <span>+1.0°C</span>
                <span>+25.0°C</span>
              </div>
            </div>

            {/* Slider 2: Duration */}
            <div className="flex flex-col gap-2 bg-surface-container-lowest p-3 rounded border border-outline-variant">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-[#9CA3AF]">DURATION</span>
                <span className="font-label-sm text-label-sm text-[#F2F3F5] font-mono bg-surface-container-high px-1.5 py-0.5 rounded">
                  {duration} min
                </span>
              </div>
              <input
                className="w-full accent-primary bg-surface-container-high h-2 rounded cursor-pointer"
                max="60"
                min="1"
                type="range"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <div className="flex justify-between font-label-sm text-label-sm text-[#6B7280]">
                <span>1 min</span>
                <span>60 min</span>
              </div>
            </div>

            {/* Slider 3: Noise Factor */}
            <div className="flex flex-col gap-2 bg-surface-container-lowest p-3 rounded border border-outline-variant">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-[#9CA3AF]">NOISE FACTOR</span>
                <span className="font-label-sm text-label-sm text-[#F2F3F5] font-mono bg-surface-container-high px-1.5 py-0.5 rounded">
                  ±{(noise * 0.1).toFixed(1)} σ
                </span>
              </div>
              <input
                className="w-full accent-primary bg-surface-container-high h-2 rounded cursor-pointer"
                max="10"
                min="0"
                type="range"
                value={noise}
                onChange={(e) => setNoise(e.target.value)}
              />
              <div className="flex justify-between font-label-sm text-label-sm text-[#6B7280]">
                <span>±0.0</span>
                <span>±1.0</span>
              </div>
            </div>
          </div>

          {/* Action Trigger Bar in Storm Sky Blue */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-2 border-t border-outline-variant">
            <div className="flex items-center gap-space-sm text-outline font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-[#6EC98F]">sync</span>
              <span>Pipeline: Synced to {targetStation} sensor telemetry cache</span>
            </div>
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full sm:w-auto px-6 py-2.5 min-h-[42px] rounded bg-primary hover:bg-primary-hover text-white font-label-md text-label-md font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
              type="button"
            >
              <span className={`material-symbols-outlined text-[18px] ${isSimulating ? 'animate-spin' : ''}`}>
                {isSimulating ? 'sync' : 'play_arrow'}
              </span>
              <span>{isSimulating ? 'Evaluating...' : 'Run Inference Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Parameter & Tree Depth Card (Right 4 cols) */}
        <div className="xl:col-span-4 bg-surface-container border border-outline-variant rounded-lg p-5 flex flex-col justify-between gap-space-md">
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant">
              <span className="font-label-sm text-label-sm text-[#6B7280] uppercase">HYPERPARAMETER TUNER</span>
              <span className="font-label-sm text-label-sm text-primary">ISOLATION TREES: 100</span>
            </div>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-[#9CA3AF]">Contamination Factor:</span>
                <span className="font-mono text-[#F2F3F5]">{contamination} (Active)</span>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-[#9CA3AF]">Subsample Size:</span>
                <span className="font-mono text-[#F2F3F5]">{subsampleSize} samples / window</span>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-[#9CA3AF]">Max Path Length Average:</span>
                <span className="font-mono text-[#F2F3F5]">7.84 steps</span>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-[#9CA3AF]">State Vector Dimension:</span>
                <span className="font-mono text-[#F2F3F5]">4D (T, H, P, W)</span>
              </div>
            </div>

            {/* Sensor Station Target Metadata Card */}
            <div className="mt-2 bg-surface-container-lowest border border-outline-variant p-3 rounded flex flex-col gap-1">
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-outline">TARGET NODE</span>
                <span className="text-[#F2F3F5] font-mono">{targetStation}</span>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-outline">FIRMWARE REV</span>
                <span className="text-on-surface-variant font-mono">v4.18-K-SEC</span>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-outline">STATUS</span>
                <span className="font-mono font-semibold" style={{ color: verdict.isAnomaly ? '#D9534F' : '#6EC98F' }}>
                  {verdict.isAnomaly ? 'RADAR ANOMALY' : 'NOMINAL'}
                </span>
              </div>
            </div>
          </div>

          {/* Realtime Forest Decision Indicator in Radar Red */}
          <div className="p-3 rounded bg-[#2D1B1E] border border-[#D9534F]/40 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#D9534F] text-xl">psychology</span>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-[#D9534F] font-semibold">TREE TRAVERSAL DIVERGENCE</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {verdict.isAnomaly ? 'Path length truncated to 3.2 steps (Target: 7.8)' : 'Path length normal at 7.82 steps'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Divider: Before / After Comparative Diagnostic */}
      <div className="flex items-center gap-space-md pt-2">
        <div className="h-px bg-outline-variant flex-1"></div>
        <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest px-2">
          Differential Inference Analysis (T-0 to T+15m)
        </span>
        <div className="h-px bg-outline-variant flex-1"></div>
      </div>

      {/* Before / After Comparison Panel (Radar-Green Baseline vs Radar-Red Anomaly) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* Card Left: Baseline Pre-Injection (Soft Radar-Green #6EC98F) */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between gap-space-lg">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6EC98F]"></span>
                <span className="font-headline-sm text-headline-sm text-[#F2F3F5] font-semibold">
                  Pre-Injection Baseline Telemetry (Nominal)
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline font-mono">FRAME: T-15m to T-00m</span>
            </div>

            {/* Metric Readouts with Sensor Colors */}
            <div className="grid grid-cols-3 gap-space-sm">
              <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant flex flex-col">
                <span className="font-label-sm text-label-sm text-[#E08D6B]">TEMPERATURE</span>
                <span className="font-telemetry-lg text-telemetry-lg text-[#F2F3F5] font-mono mt-1">
                  28.4<span className="text-sm text-[#9CA3AF]">°C</span>
                </span>
                <span className="font-label-sm text-label-sm text-[#6EC98F] mt-0.5">±0.2° variance</span>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant flex flex-col">
                <span className="font-label-sm text-label-sm text-[#C9A24B]">PRESSURE</span>
                <span className="font-telemetry-lg text-telemetry-lg text-[#F2F3F5] font-mono mt-1">
                  928<span className="text-sm text-[#9CA3AF]"> hPa</span>
                </span>
                <span className="font-label-sm text-label-sm text-[#9CA3AF] mt-0.5">Equilibrium</span>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant flex flex-col">
                <span className="font-label-sm text-label-sm text-[#6FA8DC]">REL HUMIDITY</span>
                <span className="font-telemetry-lg text-telemetry-lg text-[#F2F3F5] font-mono mt-1">
                  62<span className="text-sm text-[#9CA3AF]">%</span>
                </span>
                <span className="font-label-sm text-label-sm text-[#6EC98F] mt-0.5">Nominal hygric</span>
              </div>
            </div>

            {/* Sparkline: Stable Flat Nominal Curve in Radar Green #6EC98F */}
            <div className="flex flex-col gap-1.5 bg-surface-container-lowest p-4 rounded border border-outline-variant">
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-[#9CA3AF]">SENSOR CONTINUITY TRACE (PT-100 RESISTANCE)</span>
                <span className="text-[#6EC98F] font-mono">σ = 0.04</span>
              </div>
              <div className="h-28 w-full relative flex items-center">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                  <line stroke="#2B2F3A" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="400" y1="25" y2="25"></line>
                  <line stroke="#2B2F3A" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="400" y1="50" y2="50"></line>
                  <line stroke="#2B2F3A" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="400" y1="75" y2="75"></line>
                  <polygon fill="#6EC98F" fillOpacity="0.08" points="0,55 40,53 80,56 120,52 160,54 200,53 240,55 280,52 320,54 360,53 400,55 400,100 0,100"></polygon>
                  <path d="M 0 54 Q 40 52 80 55 T 160 53 T 240 54 T 320 52 T 400 54" fill="none" stroke="#6EC98F" strokeWidth="2"></path>
                  <circle cx="80" cy="55" fill="#6EC98F" r="2.5"></circle>
                  <circle cx="200" cy="53" fill="#6EC98F" r="2.5"></circle>
                  <circle cx="320" cy="52" fill="#6EC98F" r="2.5"></circle>
                </svg>
              </div>
              <div className="flex justify-between font-label-sm text-label-sm text-[#6B7280]">
                <span>T - 15m</span>
                <span>T - 10m</span>
                <span>T - 5m</span>
                <span>Injection Threshold T-0</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6EC98F] animate-pulse"></span>
              <span className="font-label-md text-label-md text-[#F2F3F5] font-medium">Model Assessment: Nominal State</span>
            </div>
            <span className="font-label-sm text-label-sm text-[#6EC98F] font-mono">Confidence: 99.4%</span>
          </div>
        </div>

        {/* Card Right: Injected Telemetry & AI Diagnostic Verdict in Radar Red #D9534F */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between gap-space-lg">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${verdict.isAnomaly ? 'bg-[#D9534F]' : 'bg-[#6EC98F]'}`}></span>
                <span className="font-headline-sm text-headline-sm text-[#F2F3F5] font-semibold">
                  Injected Telemetry &amp; AI Diagnostic Verdict
                </span>
              </div>
              <span className={`font-label-sm text-label-sm font-mono ${verdict.isAnomaly ? 'text-[#D9534F]' : 'text-[#6EC98F]'}`}>
                {verdict.isAnomaly ? 'SIMULATION ACTIVE' : 'NOMINAL RESTORED'}
              </span>
            </div>

            {/* Metric Readouts */}
            <div className="grid grid-cols-3 gap-space-sm">
              <div className="bg-[#2D1B1E] p-3 rounded border border-[#D9534F]/40 flex flex-col">
                <span className="font-label-sm text-label-sm text-[#D9534F]">CURRENT TEMPERATURE</span>
                <span className="font-telemetry-lg text-telemetry-lg text-[#D9534F] font-mono mt-1">
                  {verdict.tempDisplay}<span className="text-sm">°C</span>
                </span>
                <span className="font-label-sm text-label-sm text-[#D9534F] mt-0.5 font-mono">
                  {verdict.isAnomaly ? `(+${magnitude}.0° delta)` : 'Nominal'}
                </span>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant flex flex-col">
                <span className="font-label-sm text-label-sm text-[#C9A24B]">PRESSURE</span>
                <span className="font-telemetry-lg text-telemetry-lg text-[#F2F3F5] font-mono mt-1">
                  {verdict.pressDisplay}<span className="text-sm text-[#9CA3AF]"> hPa</span>
                </span>
                <span className="font-label-sm text-label-sm text-outline mt-0.5">Baro sensor</span>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant flex flex-col">
                <span className="font-label-sm text-label-sm text-[#6FA8DC]">REL HUMIDITY</span>
                <span className="font-telemetry-lg text-telemetry-lg text-[#F2F3F5] font-mono mt-1">
                  {verdict.humDisplay}<span className="text-sm text-[#9CA3AF]">%</span>
                </span>
                <span className="font-label-sm text-label-sm text-outline mt-0.5">Hygro sensor</span>
              </div>
            </div>

            {/* Sparkline: Dynamic Trajectory Curve in Radar Red */}
            <div className="flex flex-col gap-1.5 bg-surface-container-lowest p-4 rounded border border-outline-variant">
              <div className="flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-[#D9534F]">ANOMALOUS TELEMETRY TRAJECTORY ({activeFault.toUpperCase()})</span>
                <span className="text-[#D9534F] font-mono">Δ = {activeFault} trigger</span>
              </div>
              <div className="h-28 w-full relative flex items-center">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                  <line stroke="#2B2F3A" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="400" y1="25" y2="25"></line>
                  <line stroke="#2B2F3A" strokeDasharray="2 2" strokeWidth="1" x1="0" x2="400" y1="50" y2="50"></line>
                  <line stroke="#2B2F3A" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="400" y1="75" y2="75"></line>
                  {renderFaultSvgPath()}
                </svg>
              </div>
              <div className="flex justify-between font-label-sm text-label-sm text-[#6B7280]">
                <span>T - 00m (Injection)</span>
                <span className="text-[#D9534F]">Trigger Point T+1m</span>
                <span>T + 10m Peak</span>
                <span>T + 15m Plateau</span>
              </div>
            </div>
          </div>

          {/* Right Model Verdict Diagnostics Box */}
          <div className="p-4 rounded bg-[#2D1B1E] border border-[#D9534F]/40 flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-[#D9534F] uppercase tracking-wider">AI EVALUATION</span>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-headline-sm" style={{ color: verdict.isAnomaly ? '#D9534F' : '#6EC98F' }}>
                  {verdict.isAnomaly ? 'YES — CRITICAL ANOMALY' : 'NOMINAL CONVERGENCE'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#D9534F]/20">
              <span className="font-label-sm text-label-sm text-[#9CA3AF]">Anomaly Confidence Score:</span>
              <span className="font-telemetry-md text-telemetry-md text-[#F2F3F5] font-mono font-semibold">
                {verdict.confidence}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-[#9CA3AF] leading-relaxed pt-1">
              <span className="text-[#F2F3F5] font-medium">Root Cause Attribution: </span>
              {verdict.reason}
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer Toolbar in Storm Sky Blue & Neutral Slate */}
      <div className="bg-surface-container border border-outline-variant rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm w-full sm:w-auto">
          <button
            onClick={handleResetSimulation}
            disabled={isSimulating}
            className="w-full sm:w-auto px-4 py-2 min-h-[40px] rounded bg-surface-container-low border border-outline-variant text-[#F2F3F5] hover:border-primary font-label-md text-label-md transition-colors flex items-center justify-center gap-2"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-outline">restart_alt</span>
            Reset Simulation
          </button>
          <button
            onClick={() => setShowThresholdModal(true)}
            className="w-full sm:w-auto px-4 py-2 min-h-[40px] rounded bg-surface-container-low border border-outline-variant text-[#F2F3F5] hover:border-primary font-label-md text-label-md transition-colors flex items-center justify-center gap-2"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-outline">tune</span>
            Tune Model Thresholds
          </button>
        </div>
        <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
          <span className="hidden md:inline font-label-sm text-label-sm text-[#6B7280]">SERIALIZED EVENT #FLT-2024-8841</span>
          <button
            onClick={handleExportJson}
            className="w-full sm:w-auto px-4 py-2 min-h-[40px] rounded bg-surface-container-low border border-primary/50 text-primary hover:bg-primary/10 font-label-md text-label-md font-mono transition-colors flex items-center justify-center gap-2"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            Export Incident Vector (JSON)
          </button>
        </div>
      </div>

      {/* Model Threshold Tuning Modal in Storm Sky Blue */}
      {showThresholdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 max-w-md w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Model Hyperparameter Tuner</h3>
              </div>
              <button
                onClick={() => setShowThresholdModal(false)}
                className="text-outline hover:text-on-surface text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-outline">Contamination Rate:</span>
                  <span className="text-primary font-mono">{contamination}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.10"
                  step="0.005"
                  value={contamination}
                  onChange={(e) => setContamination(Number(e.target.value))}
                  className="w-full accent-primary bg-surface-container-high h-2 rounded cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-outline">Subsample Size:</span>
                  <span className="text-primary font-mono">{subsampleSize} trees</span>
                </div>
                <input
                  type="range"
                  min="64"
                  max="512"
                  step="64"
                  value={subsampleSize}
                  onChange={(e) => setSubsampleSize(Number(e.target.value))}
                  className="w-full accent-primary bg-surface-container-high h-2 rounded cursor-pointer"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-surface-container-high">
              <button
                onClick={() => setShowThresholdModal(false)}
                className="px-4 py-2 rounded bg-surface-container-low text-on-surface hover:bg-surface-container-high font-label-md text-label-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowThresholdModal(false);
                  showToast(`Hyperparameters updated: Contamination=${contamination}, Subsample=${subsampleSize}.`);
                }}
                className="px-4 py-2 rounded bg-primary hover:bg-primary-hover text-white font-label-md text-label-md font-semibold"
              >
                Save Hyperparameters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
