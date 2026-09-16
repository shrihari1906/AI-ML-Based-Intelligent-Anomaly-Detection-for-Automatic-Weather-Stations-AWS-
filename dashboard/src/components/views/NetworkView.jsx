import React, { useState } from 'react';

export default function NetworkView({
  selectedStation = 'AWS_001',
  setSelectedStation,
  setActiveTab,
  stations = [],
  _readings = [],
}) {
  const [latencyVisible, setLatencyVisible] = useState(true);
  const [showSensorDumpModal, setShowSensorDumpModal] = useState(false);

  // Compute live node counts
  const normalCount = stations.filter((s) => s.status !== 'anomaly').length;
  const anomalyCount = stations.filter((s) => s.status === 'anomaly').length;
  const anomalousStation = stations.find((s) => s.status === 'anomaly') || stations.find((s) => s.id === 'AWS_002') || stations[1];

  // Helper to get formatted string for station
  const getNodeTelemetry = (stId, defaultTemp, defaultAux) => {
    const st = stations.find((s) => s.id === stId);
    const lr = st?.latestReading;
    if (lr && lr.temperature !== undefined) {
      const t = Number(lr.temperature).toFixed(1);
      const aux = lr.pressure ? `${Math.round(lr.pressure)}hPa` : lr.humidity ? `${Math.round(lr.humidity)}%` : defaultAux;
      return `${t}°C | ${aux}`;
    }
    return `${defaultTemp} | ${defaultAux}`;
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Top Operational Control Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-sm border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-md text-headline-md text-[#F2F3F5] font-semibold tracking-tight">
              Telemetry Network Topology
            </h1>
            <span className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant font-label-sm text-label-sm text-primary uppercase">
              MESH ACTIVE
            </span>
          </div>
          <p className="font-body-md text-body-md text-[#9BA3AF] mt-0.5">
            Real-time telemetry mesh and edge inference distribution across Karnataka AWS nodes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-md">
          {/* Latency Visualizer Switch */}
          <button
            onClick={() => setLatencyVisible(!latencyVisible)}
            className="flex items-center gap-2 px-space-md py-2 min-h-[40px] rounded bg-surface-container border border-outline-variant text-on-surface hover:border-primary transition-colors text-label-md font-label-md"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                latencyVisible ? 'bg-primary' : 'bg-outline'
              }`}
            />
            <span>{latencyVisible ? 'Hide Signal Latency' : 'Show Signal Latency'}</span>
          </button>
          {/* Precision Health Legend (Radar Scale + Storm Blue Hub) */}
          <div className="flex items-center gap-space-md px-space-md py-2 min-h-[40px] rounded bg-surface-container border border-outline-variant font-label-sm text-label-sm text-[#9BA3AF]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6EC98F]"></span>
              <span className="text-[#F2F3F5]">Normal ({normalCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9534F]"></span>
              <span className="text-[#D9534F] font-medium">Anomaly ({anomalyCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
              <span className="text-primary font-medium">AI Central Core</span>
            </div>
          </div>
        </div>
      </div>

      {/* Central Scientific Topology Canvas */}
      <div className="relative w-full min-h-[580px] bg-surface-container border border-outline-variant rounded-lg p-space-lg flex items-center justify-center overflow-hidden select-none">
        {/* Topographic & Isobar Vector Grids */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none stroke-[#2B2F3A] opacity-50"
          fill="none"
          strokeWidth="1"
        >
          <defs>
            <pattern height="60" id="radar-grid" patternUnits="userSpaceOnUse" width="60">
              <path d="M 60 0 L 0 0 0 60"></path>
            </pattern>
          </defs>
          <rect fill="url(#radar-grid)" height="100%" width="100%"></rect>
          <circle cx="50%" cy="50%" r="90" strokeDasharray="2 4"></circle>
          <circle cx="50%" cy="50%" r="180"></circle>
          <circle cx="50%" cy="50%" r="270" strokeDasharray="4 6"></circle>
          <line strokeDasharray="2 2" strokeOpacity="0.3" x1="50%" x2="50%" y1="0%" y2="100%"></line>
          <line strokeDasharray="2 2" strokeOpacity="0.3" x1="0%" x2="100%" y1="50%" y2="50%"></line>
        </svg>

        {/* Interactive Mesh Connections SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* AWS_001 Connection (Top) */}
          <line stroke="#2B2F3A" strokeWidth="1.5" x1="50%" x2="50%" y1="50%" y2="15%"></line>
          {/* AWS_002 Connection (Mysuru South - CRITICAL SPIKE in Radar Red #D9534F) */}
          <line stroke="#D9534F" strokeWidth="2" x1="50%" x2="80%" y1="50%" y2="35%"></line>
          {/* AWS_003 Connection (South-East / Coast) */}
          <line stroke="#2B2F3A" strokeWidth="1.5" x1="50%" x2="68%" y1="50%" y2="82%"></line>
          {/* AWS_004 Connection (South-West / Hubli) */}
          <line stroke="#2B2F3A" strokeWidth="1.5" x1="50%" x2="32%" y1="50%" y2="82%"></line>
          {/* AWS_005 Connection (North-West / Belagavi) */}
          <line stroke="#2B2F3A" strokeWidth="1.5" x1="50%" x2="20%" y1="50%" y2="35%"></line>

          {/* Latency Indicators along vectors */}
          <g className={`transition-opacity duration-200 ${latencyVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Node 1: BLR */}
            <rect fill="#181A22" height="18" rx="2" stroke="#2B2F3A" width="44" x="calc(50% - 22px)" y="calc(32% - 10px)"></rect>
            <text dominantBaseline="central" fill="#9BA3AF" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="50%" y="32%">14ms</text>
            {/* Node 2: MYS (Anomaly packet jitter in #D9534F) */}
            <rect fill="#2D1B1E" height="18" rx="2" stroke="#D9534F" width="48" x="calc(65% - 24px)" y="calc(42% - 10px)"></rect>
            <text dominantBaseline="central" fill="#D9534F" fontFamily="JetBrains Mono" fontSize="10" fontWeight="bold" textAnchor="middle" x="65%" y="42%">184ms</text>
            {/* Node 3: IXE */}
            <rect fill="#181A22" height="18" rx="2" stroke="#2B2F3A" width="44" x="calc(59% - 22px)" y="calc(66% - 10px)"></rect>
            <text dominantBaseline="central" fill="#9BA3AF" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="59%" y="66%">22ms</text>
            {/* Node 4: HBX */}
            <rect fill="#181A22" height="18" rx="2" stroke="#2B2F3A" width="44" x="calc(41% - 22px)" y="calc(66% - 10px)"></rect>
            <text dominantBaseline="central" fill="#9BA3AF" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="41%" y="66%">19ms</text>
            {/* Node 5: IXG */}
            <rect fill="#181A22" height="18" rx="2" stroke="#2B2F3A" width="44" x="calc(35% - 22px)" y="calc(42% - 10px)"></rect>
            <text dominantBaseline="central" fill="#9BA3AF" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="35%" y="42%">18ms</text>
          </g>
        </svg>

        {/* Canvas Cardinal Overlays & Scale Coordinate Indices */}
        <div className="absolute top-4 left-4 font-label-sm text-label-sm text-[#6B7280] space-y-1">
          <div>ZONE: KA_IN_SOUTH</div>
          <div>COORDINATES: 12.9716° N, 77.5946° E</div>
          <div className="text-primary font-medium">RADIAL SAMPLING: SYNCHRONOUS</div>
        </div>
        <div className="absolute top-4 right-4 flex flex-col items-end font-label-sm text-label-sm text-[#6B7280] space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-[#6EC98F] rounded-full"></span>
            <span>ISOBAR DRIFT: NOMINAL</span>
          </div>
          <div>PRECISION: 0.01 hPa / 0.1°C</div>
          <div className="text-[#9BA3AF]">ISOLATION DEPTH: K=8</div>
        </div>

        {/* NODE 1: AWS_001 (Bengaluru Central) */}
        <div
          onClick={() => setSelectedStation('AWS_001')}
          className="absolute top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
        >
          <div className="flex flex-col items-center">
            <div
              className={`px-3 py-2 bg-surface-container rounded transition-all flex items-center gap-2 shadow-sm ${
                selectedStation === 'AWS_001'
                  ? 'border-2 border-primary shadow-primary/20'
                  : 'border border-outline-variant group-hover:border-primary'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#6EC98F] shrink-0"></span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-[#F2F3F5] text-xs font-semibold leading-tight">
                  AWS_001: BLR
                </span>
                <span className="font-label-sm text-label-sm text-[#9BA3AF] tabular-nums mt-0.5">
                  {getNodeTelemetry('AWS_001', '28.4°C', '912hPa')}
                </span>
              </div>
            </div>
            <div className="mt-1 px-1.5 py-0.5 rounded bg-surface-container-low border border-outline-variant font-label-sm text-[10px] text-[#6B7280]">
              Bengaluru Central {selectedStation === 'AWS_001' ? '• ACTIVE' : ''}
            </div>
          </div>
        </div>

        {/* NODE 2: AWS_002 (Mysuru South) [CRITICAL ANOMALY NODE] */}
        <div
          onClick={() => setSelectedStation('AWS_002')}
          className="absolute top-[35%] left-[80%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
        >
          <div className="relative flex flex-col items-center">
            <div className="absolute -inset-2.5 rounded border border-[#D9534F] border-dashed opacity-60 pointer-events-none"></div>
            <div
              className={`px-3 py-2 bg-[#2D1B1E] rounded flex items-center gap-2.5 transition-all ${
                selectedStation === 'AWS_002' ? 'border-2 border-[#D9534F] ring-2 ring-[#D9534F]/40' : 'border-2 border-[#D9534F]'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9534F] animate-pulse shrink-0"></span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-[#D9534F] text-xs font-bold leading-tight flex items-center gap-1">
                  <span>AWS_002: MYS</span>
                  <span className="bg-[#D9534F] text-white px-1 text-[9px] font-bold rounded-sm">CRITICAL</span>
                </span>
                <span className="font-label-sm text-label-sm text-[#D9534F] tabular-nums mt-0.5 font-semibold">
                  {getNodeTelemetry('AWS_002', '58.0°C', 'SPIKE')}
                </span>
              </div>
            </div>
            <div className="mt-1 px-1.5 py-0.5 rounded bg-[#2D1B1E] border border-[#D9534F] font-label-sm text-[10px] text-[#D9534F]">
              Mysuru South {selectedStation === 'AWS_002' ? '• ACTIVE' : ''}
            </div>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#2D1B1E] border border-[#D9534F] px-2.5 py-1 rounded shadow-sm z-30 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#D9534F] text-[14px]">error</span>
              <span className="font-label-sm text-label-sm text-[#F2F3F5]">Radar Alert: Thermal standard deviation jump</span>
            </div>
          </div>
        </div>

        {/* NODE 3: AWS_003 (Mangaluru Coastal) */}
        <div
          onClick={() => setSelectedStation('AWS_003')}
          className="absolute top-[82%] left-[68%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
        >
          <div className="flex flex-col items-center">
            <div
              className={`px-3 py-2 bg-surface-container rounded transition-all flex items-center gap-2 shadow-sm ${
                selectedStation === 'AWS_003'
                  ? 'border-2 border-primary shadow-primary/20'
                  : 'border border-outline-variant group-hover:border-primary'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#6EC98F] shrink-0"></span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-[#F2F3F5] text-xs font-semibold leading-tight">
                  AWS_003: IXE
                </span>
                <span className="font-label-sm text-label-sm text-[#9BA3AF] tabular-nums mt-0.5">
                  {getNodeTelemetry('AWS_003', '31.1°C', '99.4% RH')}
                </span>
              </div>
            </div>
            <div className="mt-1 px-1.5 py-0.5 rounded bg-surface-container-low border border-outline-variant font-label-sm text-[10px] text-[#6B7280]">
              Mangaluru Coastal {selectedStation === 'AWS_003' ? '• ACTIVE' : ''}
            </div>
          </div>
        </div>

        {/* NODE 4: AWS_004 (Hubli Junction) */}
        <div
          onClick={() => setSelectedStation('AWS_004')}
          className="absolute top-[82%] left-[32%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
        >
          <div className="flex flex-col items-center">
            <div
              className={`px-3 py-2 bg-surface-container rounded transition-all flex items-center gap-2 shadow-sm ${
                selectedStation === 'AWS_004'
                  ? 'border-2 border-primary shadow-primary/20'
                  : 'border border-outline-variant group-hover:border-primary'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#6EC98F] shrink-0"></span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-[#F2F3F5] text-xs font-semibold leading-tight">
                  AWS_004: HBX
                </span>
                <span className="font-label-sm text-label-sm text-[#9BA3AF] tabular-nums mt-0.5">
                  {getNodeTelemetry('AWS_004', '29.8°C', '1008hPa')}
                </span>
              </div>
            </div>
            <div className="mt-1 px-1.5 py-0.5 rounded bg-surface-container-low border border-outline-variant font-label-sm text-[10px] text-[#6B7280]">
              Hubli Junction {selectedStation === 'AWS_004' ? '• ACTIVE' : ''}
            </div>
          </div>
        </div>

        {/* NODE 5: AWS_005 (Belagavi North) */}
        <div
          onClick={() => setSelectedStation('AWS_005')}
          className="absolute top-[35%] left-[20%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
        >
          <div className="flex flex-col items-center">
            <div
              className={`px-3 py-2 bg-surface-container rounded transition-all flex items-center gap-2 shadow-sm ${
                selectedStation === 'AWS_005'
                  ? 'border-2 border-primary shadow-primary/20'
                  : 'border border-outline-variant group-hover:border-primary'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#6EC98F] shrink-0"></span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-[#F2F3F5] text-xs font-semibold leading-tight">
                  AWS_005: IXG
                </span>
                <span className="font-label-sm text-label-sm text-[#9CA3AF] tabular-nums mt-0.5">
                  {getNodeTelemetry('AWS_005', '26.5°C', '18km/h')}
                </span>
              </div>
            </div>
            <div className="mt-1 px-1.5 py-0.5 rounded bg-surface-container-low border border-outline-variant font-label-sm text-[10px] text-[#6B7280]">
              Belagavi North {selectedStation === 'AWS_005' ? '• ACTIVE' : ''}
            </div>
          </div>
        </div>

        {/* CENTRAL AI CORE NODE (Storm Sky Blue #5B7FBD) */}
        <div className="relative z-10 w-36 h-36 rounded-full bg-surface-container-low border-2 border-primary flex flex-col items-center justify-center text-center p-3 shadow-xl">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-primary"></div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-primary"></div>
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-2 h-0.5 bg-primary"></div>
          <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-2 h-0.5 bg-primary"></div>
          <span className="material-symbols-outlined text-primary text-[20px] mb-0.5">psychology</span>
          <span className="font-headline-sm text-headline-sm text-[#F2F3F5] text-xs font-semibold leading-tight">
            Isolation Forest
          </span>
          <span className="font-body-sm text-body-sm text-[#9BA3AF] text-[11px]">Central AI Core</span>
          <div className="mt-1 px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant">
            <span className="font-label-sm text-label-sm text-primary tabular-nums">100 Trees • Synced</span>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Sync Metrics Grid (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* Col 1: Node Sync Status */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-space-md flex flex-col justify-between">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-[#6B7280] mb-2">
            <span className="uppercase tracking-wider">Node Sync Status</span>
            <span className="font-mono font-semibold" style={{ color: anomalyCount > 0 ? '#D9534F' : '#6EC98F' }}>
              {anomalyCount > 0 ? 'QUARANTINE_ACTIVE' : 'NOMINAL_SYNC'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className={`material-symbols-outlined text-[20px] mt-0.5 ${anomalyCount > 0 ? 'text-[#D9534F]' : 'text-[#6EC98F]'}`}>
              shield_with_heart
            </span>
            <div>
              <div className="font-headline-sm text-headline-sm text-[#F2F3F5] font-semibold">
                {normalCount} / {stations.length} Nodes Nominal
              </div>
              <div className="font-body-sm text-body-sm text-[#9BA3AF] mt-0.5">
                {anomalyCount > 0
                  ? `1 Quarantined for Anomaly Evaluation (${anomalousStation?.id} ${anomalousStation?.name})`
                  : 'All Karnataka weather stations reporting nominal telemetry.'}
              </div>
            </div>
          </div>
          <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden mt-3">
            <div
              className="bg-[#6EC98F] h-full float-left transition-all duration-300"
              style={{ width: `${(normalCount / (stations.length || 5)) * 100}%` }}
            ></div>
            <div
              className="bg-[#D9534F] h-full float-left transition-all duration-300"
              style={{ width: `${(anomalyCount / (stations.length || 5)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Col 2: Telemetry Transport Protocol */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-space-md flex flex-col justify-between">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-[#6B7280] mb-2">
            <span className="uppercase tracking-wider">Transport Protocol</span>
            <span className="text-primary font-mono">ESTABLISHED</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">sync_alt</span>
            <div>
              <div className="font-headline-sm text-headline-sm text-[#F2F3F5] font-semibold">MQTT over TLS 1.3</div>
              <div className="font-label-sm text-label-sm text-[#9BA3AF] mt-0.5">
                Heartbeat interval: 2500ms • Packet loss: 0.00%
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant font-label-sm text-label-sm text-[#6B7280]">
            <span>CIPHER: AES_256_GCM</span>
            <span className="text-[#F2F3F5]">PORT: 8000</span>
          </div>
        </div>

        {/* Col 3: Inference Throughput */}
        <div className="bg-surface-container border border-outline-variant rounded-lg p-space-md flex flex-col justify-between">
          <div className="flex items-center justify-between font-label-sm text-label-sm text-[#6B7280] mb-2">
            <span className="uppercase tracking-wider">Inference Throughput</span>
            <span className="text-[#6EC98F] font-mono">100% COMPLIANT</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">speed</span>
            <div>
              <div className="font-headline-sm text-headline-sm text-[#F2F3F5] font-semibold">120 readings/sec</div>
              <div className="font-label-sm text-label-sm text-[#9BA3AF] mt-0.5">
                Continuous evaluation across 4 meteorological channels
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant font-label-sm text-label-sm text-[#6B7280]">
            <span>LATENCY MEDIAN: 8.4ms</span>
            <span className="text-primary">TREE DRIFT: NONE</span>
          </div>
        </div>
      </div>

      {/* Operational Action Drawer / Status Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md px-space-md py-3 rounded bg-surface-container border border-outline-variant">
        <div className="flex items-center gap-space-md">
          <span className="material-symbols-outlined text-[#D9534F] text-[18px]">notifications_active</span>
          <span className="font-label-sm text-label-sm text-[#F2F3F5]">
            Active Incident Alert: Station <span className="font-bold text-[#D9534F]">{anomalousStation?.id} ({anomalousStation?.name})</span> flagged by online Isolation Forest detector.
          </span>
        </div>
        <div className="flex items-center gap-space-sm shrink-0">
          <button
            onClick={() => setShowSensorDumpModal(true)}
            className="px-space-md py-2 min-h-[40px] rounded bg-[#2D1B1E] border border-[#D9534F] text-[#D9534F] hover:bg-[#3D2226] font-label-sm text-label-sm transition-colors uppercase font-medium"
          >
            Inspect Sensor Dump
          </button>
          <button
            onClick={() => setSelectedStation('AWS_001')}
            className="px-space-md py-2 min-h-[40px] rounded bg-primary hover:bg-primary-hover text-white font-label-sm text-label-sm font-semibold transition-colors uppercase"
          >
            Switch to Primary BLR
          </button>
        </div>
      </div>

      {/* Sensor Dump Modal */}
      {showSensorDumpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 max-w-lg w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D9534F]">terminal</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Raw Sensor Dump: {anomalousStation?.id}
                </h3>
              </div>
              <button
                onClick={() => setShowSensorDumpModal(false)}
                className="text-outline hover:text-on-surface text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Telemetry frames captured on sensor bus immediately prior to quarantine isolation:
            </p>
            <pre className="p-3 rounded bg-surface-container-lowest text-xs font-mono text-primary overflow-x-auto border border-outline-variant max-h-56">
              {JSON.stringify(
                {
                  station_id: anomalousStation?.id,
                  name: anomalousStation?.name,
                  timestamp: new Date().toISOString(),
                  latest_telemetry: anomalousStation?.latestReading,
                  status: anomalousStation?.status,
                  bus_voltage: '13.8V',
                  packet_sequence: 88412,
                  diagnostics: {
                    isolation_score: anomalousStation?.latestReading?.anomaly?.score ?? -0.155,
                    reason: anomalousStation?.latestReading?.anomaly?.reason ?? 'threshold deviation',
                  },
                },
                null,
                2
              )}
            </pre>
            <div className="pt-2 flex justify-end gap-2 border-t border-surface-container-high">
              <button
                onClick={() => setShowSensorDumpModal(false)}
                className="px-4 py-2 rounded bg-surface-container-low text-on-surface hover:bg-surface-container-high font-label-md text-label-md"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedStation(anomalousStation?.id);
                  setShowSensorDumpModal(false);
                  if (setActiveTab) setActiveTab('main-dashboard');
                }}
                className="px-4 py-2 rounded bg-[#D9534F] text-white font-label-md text-label-md font-semibold cursor-pointer hover:opacity-90 transition-opacity"
              >
                Inspect Station on Main Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

