import React, { useState, useMemo } from 'react';

export default function AlertsTableView({
  alerts = [],
  stations = [],
  setSelectedStation,
  setActiveTab,
}) {
  const [stationFilter, setStationFilter] = useState('ALL');
  const [sensorFilter, setSensorFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusOverrides, setStatusOverrides] = useState({});
  const pageSize = 6;

  // Baseline sample alerts merged with live backend alerts using Weather-Radar Palette
  const defaultSampleAlerts = [
    {
      id: 'al-01',
      station_id: 'AWS_002',
      stationName: 'Mysuru South',
      timestamp: '2026-09-13 14:22:04',
      channel: 'PT100 Temp',
      channelColor: '#E08D6B',
      reading: '58.0°C (+4.8°C spike)',
      reason: 'Sudden gradient spike exceeding 3.2σ with zero insolation change',
      severity: 'Critical',
      status: 'Under Review',
      borderClass: 'border-l-[#D9534F]',
      badgeColor: 'text-[#D9534F] bg-[#D9534F]/15 border-[#D9534F]/40',
    },
    {
      id: 'al-02',
      station_id: 'AWS_004',
      stationName: 'Hubli Junction',
      timestamp: '2026-09-13 13:45:12',
      channel: 'Barometer BMP280',
      channelColor: '#C9A24B',
      reading: '910.2 hPa (-1.8 hPa)',
      reason: 'Transient pressure step anomaly detected across 3 timesteps',
      severity: 'Warning',
      status: 'Acknowledged',
      borderClass: 'border-l-[#E08D4B]',
      badgeColor: 'text-[#E08D4B] bg-[#E08D4B]/15 border-[#E08D4B]/40',
    },
    {
      id: 'al-03',
      station_id: 'AWS_005',
      stationName: 'Belagavi North',
      timestamp: '2026-09-13 12:10:00',
      channel: 'Anemometer Mast',
      channelColor: '#7FA8B3',
      reading: '0.0 m/s (NaN drop)',
      reason: 'Zero-voltage telemetry packet received on bus line A',
      severity: 'Watch',
      status: 'Auto-Recovered',
      borderClass: 'border-l-[#D9C15C]',
      badgeColor: 'text-[#D9C15C] bg-[#D9C15C]/15 border-[#D9C15C]/40',
    },
    {
      id: 'al-04',
      station_id: 'AWS_003',
      stationName: 'Mangaluru Coast',
      timestamp: '2026-09-13 10:30:19',
      channel: 'Hygrometer SHT31',
      channelColor: '#6FA8DC',
      reading: '99.8% RH (flatline)',
      reason: 'Sensor output variance < 0.001 over 60 consecutive minutes',
      severity: 'Critical',
      status: 'Open',
      borderClass: 'border-l-[#D9534F]',
      badgeColor: 'text-[#D9534F] bg-[#D9534F]/15 border-[#D9534F]/40',
    },
    {
      id: 'al-05',
      station_id: 'AWS_001',
      stationName: 'Bengaluru Central',
      timestamp: '2026-09-13 08:15:33',
      channel: 'PT100 Temp',
      channelColor: '#E08D6B',
      reading: '34.8°C',
      reason: 'Unusual rate-of-change jump exceeding model confidence envelope',
      severity: 'Warning',
      status: 'Resolved',
      borderClass: 'border-l-[#E08D4B]',
      badgeColor: 'text-[#E08D4B] bg-[#E08D4B]/15 border-[#E08D4B]/40',
    },
    {
      id: 'al-06',
      station_id: 'AWS_002',
      stationName: 'Mysuru South',
      timestamp: '2026-09-13 06:00:00',
      channel: 'System Bus',
      channelColor: '#9BA3AF',
      reading: '11.8V',
      reason: 'Periodic self-test cycle completed with minor voltage drop',
      severity: 'Info',
      status: 'Archived',
      borderClass: 'border-l-[#6B7280]',
      badgeColor: 'text-[#9BA3AF] bg-[#22252A] border-[#6B7280]/40',
    },
  ];

  // Map real alerts from backend to meteorological radar scale format
  const mappedRealAlerts = alerts.map((al, i) => {
    const isCrit = (al.reason || '').toLowerCase().includes('spike') || (al.reason || '').toLowerCase().includes('out of range') || (typeof al.score === 'number' && al.score < -0.12);
    const isStuck = (al.reason || '').toLowerCase().includes('stuck');
    const isDrop = (al.reason || '').toLowerCase().includes('dropout');

    let channel = 'PT100 Temp';
    let channelColor = '#E08D6B';
    if ((al.reason || '').toLowerCase().includes('press')) {
      channel = 'Barometer';
      channelColor = '#C9A24B';
    } else if ((al.reason || '').toLowerCase().includes('wind')) {
      channel = 'Anemometer';
      channelColor = '#7FA8B3';
    } else if ((al.reason || '').toLowerCase().includes('hum') || isDrop) {
      channel = 'Hygrometer';
      channelColor = '#6FA8DC';
    }

    const severity = isCrit ? 'Critical' : isStuck || isDrop ? 'Warning' : 'Watch';
    const borderClass = isCrit ? 'border-l-[#D9534F]' : isStuck || isDrop ? 'border-l-[#E08D4B]' : 'border-l-[#D9C15C]';
    const badgeColor = isCrit
      ? 'text-[#D9534F] bg-[#D9534F]/15 border-[#D9534F]/40'
      : isStuck || isDrop
      ? 'text-[#E08D4B] bg-[#E08D4B]/15 border-[#E08D4B]/40'
      : 'text-[#D9C15C] bg-[#D9C15C]/15 border-[#D9C15C]/40';

    return {
      id: al.id || `real-${i}`,
      station_id: al.station_id,
      stationName: stations.find((s) => s.id === al.station_id)?.name || al.station_id,
      timestamp: al.timestamp ? new Date(al.timestamp).toLocaleString() : 'Recent',
      channel,
      channelColor,
      reading: `Score: ${typeof al.score === 'number' ? al.score.toFixed(3) : al.score}`,
      reason: al.reason,
      severity,
      status: statusOverrides[al.id || `real-${i}`] || 'Under Review',
      borderClass,
      badgeColor,
    };
  });

  const combinedAlerts = mappedRealAlerts.length > 0 ? mappedRealAlerts : defaultSampleAlerts;

  const filtered = useMemo(() => {
    return combinedAlerts.filter((item) => {
      const matchStation = stationFilter === 'ALL' || item.station_id === stationFilter;
      const matchSeverity = severityFilter === 'ALL' || item.severity.toLowerCase() === severityFilter.toLowerCase();
      const matchSensor = sensorFilter === 'ALL' || item.channel.toLowerCase().includes(sensorFilter.toLowerCase());
      const matchSearch =
        item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.station_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.channel.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStation && matchSeverity && matchSensor && matchSearch;
    });
  }, [combinedAlerts, stationFilter, severityFilter, sensorFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayedAlerts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const criticalCount = combinedAlerts.filter((a) => a.severity === 'Critical').length;
  const resolvedCount = combinedAlerts.filter((a) => a.status === 'Resolved' || a.status === 'Archived' || a.status === 'Auto-Recovered').length;

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Station,Timestamp,Sensor,Trigger Reading,Reason,Severity,Status"]
        .concat(
          filtered.map(
            (r) =>
              `"${r.station_id}","${r.timestamp}","${r.channel}","${r.reading}","${r.reason}","${r.severity}","${r.status}"`
          )
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "karnataka_aws_anomaly_audit.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleToggleStatus = (id) => {
    setStatusOverrides((prev) => {
      const current = prev[id] || 'Under Review';
      const next = current === 'Under Review' ? 'Acknowledged' : current === 'Acknowledged' ? 'Resolved' : 'Under Review';
      return { ...prev, [id]: next };
    });
  };

  const handleInspectRow = (row) => {
    if (setSelectedStation) setSelectedStation(row.station_id);
    if (setActiveTab) setActiveTab('main-dashboard');
  };

  return (
    <div className="flex flex-col w-full">
      {/* Page Header & Statistical KPI Row (Weather-Radar Severity Accents) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              Telemetry Alerts &amp; Anomaly Audit Log
            </h1>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm border border-outline-variant">
              LIVE RADAR FEED
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Historical log of model-flagged sensor deviations across Karnataka AWS stations
          </p>
        </div>

        {/* Summary KPI Badges in Radar Scale */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="flex items-center gap-2 px-space-md py-2 min-h-[40px] rounded bg-surface-container border border-outline-variant">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Total Alerts</span>
            <span className="font-telemetry-md text-telemetry-md font-semibold text-on-surface">
              {combinedAlerts.length}
            </span>
          </div>
          <div className="flex items-center gap-2 px-space-md py-2 min-h-[40px] rounded bg-surface-container border border-outline-variant">
            <span className="w-2 h-2 rounded-full bg-[#D9534F]"></span>
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Critical</span>
            <span className="font-telemetry-md text-telemetry-md font-semibold text-[#D9534F]">
              {criticalCount}
            </span>
          </div>
          <div className="flex items-center gap-2 px-space-md py-2 min-h-[40px] rounded bg-surface-container border border-outline-variant">
            <span className="w-2 h-2 rounded-full bg-[#6EC98F]"></span>
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Resolved</span>
            <span className="font-telemetry-md text-telemetry-md font-semibold text-[#6EC98F]">
              {resolvedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="p-space-md rounded bg-surface-container border border-outline-variant mb-space-lg">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-sm flex-1">
            {/* Station Dropdown */}
            <div className="relative">
              <select
                value={stationFilter}
                onChange={(e) => {
                  setStationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded px-space-md py-2.5 min-h-[42px] font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary pr-8 cursor-pointer"
              >
                <option value="ALL">All Stations (5)</option>
                <option value="AWS_001">AWS_001 (Bengaluru)</option>
                <option value="AWS_002">AWS_002 (Mysuru)</option>
                <option value="AWS_003">AWS_003 (Mangaluru)</option>
                <option value="AWS_004">AWS_004 (Hubli)</option>
                <option value="AWS_005">AWS_005 (Belagavi)</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Sensor Channel Dropdown */}
            <div className="relative">
              <select
                value={sensorFilter}
                onChange={(e) => {
                  setSensorFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded px-space-md py-2.5 min-h-[42px] font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary pr-8 cursor-pointer"
              >
                <option value="ALL">All Sensors</option>
                <option value="Temp">PT100 Temperature (#E08D6B)</option>
                <option value="Barometer">Barometer Pressure (#C9A24B)</option>
                <option value="Anemometer">Anemometer Wind (#7FA8B3)</option>
                <option value="Hygrometer">Hygrometer Humidity (#6FA8DC)</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Severity Filter Dropdown (Weather Radar Scale) */}
            <div className="relative">
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded px-space-md py-2.5 min-h-[42px] font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary pr-8 cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical (#D9534F)</option>
                <option value="Warning">Warning (#E08D4B)</option>
                <option value="Watch">Watch (#D9C15C)</option>
                <option value="Info">Info / Notice</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search reason or station..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded pl-9 pr-space-md py-2 min-h-[42px] font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Action Buttons in Storm-Sky Blue Accent */}
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              onClick={() => {
                setStationFilter('ALL');
                setSensorFilter('ALL');
                setSeverityFilter('ALL');
                setSearchTerm('');
              }}
              className="flex items-center gap-2 px-space-md py-2 min-h-[42px] rounded bg-surface-container-lowest border border-outline-variant text-on-surface hover:border-primary transition-colors font-label-md text-label-md"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-outline">restart_alt</span>
              <span>Reset Filters</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-space-md py-2 min-h-[42px] rounded bg-surface-container-lowest border border-outline-variant text-on-surface hover:border-primary transition-colors font-label-md text-label-md"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-outline">file_download</span>
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Table Card */}
      <div className="rounded bg-surface-container border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant">
                <th scope="col" className="py-3 px-space-md font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Station
                </th>
                <th scope="col" className="py-3 px-space-md font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Timestamp (IST)
                </th>
                <th scope="col" className="py-3 px-space-md font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Sensor Channel
                </th>
                <th scope="col" className="py-3 px-space-md font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Trigger Reading
                </th>
                <th scope="col" className="py-3 px-space-md font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Reason / Anomaly Pattern
                </th>
                <th scope="col" className="py-3 px-space-md font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Radar Severity
                </th>
                <th scope="col" className="py-3 px-space-md font-label-sm text-label-sm text-outline uppercase tracking-wider text-right">
                  Status / Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {displayedAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-outline">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl">filter_list_off</span>
                      <span>No anomaly records match the selected filters.</span>
                      <button
                        onClick={() => {
                          setStationFilter('ALL');
                          setSensorFilter('ALL');
                          setSeverityFilter('ALL');
                          setSearchTerm('');
                        }}
                        className="mt-2 text-primary underline text-xs"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedAlerts.map((row) => (
                  <tr
                    key={row.id}
                    className={`bg-surface-container hover:bg-surface-container-high transition-colors border-l-4 ${row.borderClass}`}
                  >
                    <td className="py-3.5 px-space-md font-body-md text-body-md text-on-surface font-medium whitespace-nowrap">
                      {row.station_id} ({row.stationName})
                    </td>
                    <td className="py-3.5 px-space-md font-telemetry-md text-telemetry-md text-on-surface-variant whitespace-nowrap">
                      {row.timestamp}
                    </td>
                    <td className="py-3.5 px-space-md font-body-md text-body-md whitespace-nowrap font-medium" style={{ color: row.channelColor }}>
                      {row.channel}
                    </td>
                    <td className="py-3.5 px-space-md font-telemetry-md text-telemetry-md font-medium text-on-surface whitespace-nowrap">
                      {row.reading}
                    </td>
                    <td className="py-3.5 px-space-md font-body-md text-body-md text-on-surface-variant max-w-sm">
                      {row.reason}
                    </td>
                    <td className="py-3.5 px-space-md whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${row.badgeColor}`}>
                        {row.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-space-md whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(row.id)}
                          className="font-label-sm text-label-sm px-2 py-1 rounded bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant transition-colors"
                          title="Click to cycle status"
                        >
                          {row.status}
                        </button>
                        <button
                          onClick={() => handleInspectRow(row)}
                          className="p-1.5 rounded hover:bg-surface-container-lowest text-outline hover:text-primary transition-colors"
                          title="Inspect Telemetry on Main Dashboard"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="py-3 px-space-md bg-surface-container-lowest border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div className="font-label-sm text-label-sm text-outline">
            Showing <span className="text-on-surface font-medium">{filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span>-
            <span className="text-on-surface font-medium">{Math.min(currentPage * pageSize, filtered.length)}</span> of{' '}
            <span className="text-on-surface font-medium">{filtered.length}</span> anomaly events
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-space-sm py-1.5 min-h-[32px] rounded bg-surface-container border border-outline-variant text-on-surface font-label-md text-label-md transition-colors ${
                currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:border-outline'
              }`}
              type="button"
            >
              &lt; Previous
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded font-label-md text-label-md font-semibold flex items-center justify-center transition-colors ${
                    currentPage === p
                      ? 'bg-primary text-white'
                      : 'bg-surface-container border border-outline-variant text-on-surface hover:border-outline'
                  }`}
                  type="button"
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-space-sm py-1.5 min-h-[32px] rounded bg-surface-container border border-outline-variant text-on-surface font-label-md text-label-md transition-colors ${
                currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:border-outline'
              }`}
              type="button"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Radar Severity Classification Legend */}
      <div className="mt-space-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm font-label-sm text-label-sm text-outline">
        <div className="flex items-center gap-space-md flex-wrap">
          <span className="uppercase tracking-wider">Radar Severity Scale:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6EC98F]"></span>
            <span>Clear / Nominal (#6EC98F)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D9C15C]"></span>
            <span>Watch / Minor (#D9C15C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E08D4B]"></span>
            <span>Warning / Moderate (#E08D4B)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D9534F]"></span>
            <span>Critical / Severe (#D9534F)</span>
          </div>
        </div>
        <div className="tabular-nums">Pipeline Latency: 8.4ms • Sync Cycle: 3.0s</div>
      </div>
    </div>
  );
}
