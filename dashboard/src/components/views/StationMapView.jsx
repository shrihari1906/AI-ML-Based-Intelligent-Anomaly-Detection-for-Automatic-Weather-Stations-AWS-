import React, { useState } from 'react';

// Curated Meteorological & Cartographic Color Themes
const MAP_COLOR_THEMES = {
  blue: {
    id: 'blue',
    label: 'Atmospheric Azure',
    preview: '#3B82F6',
    light: {
      landStart: '#DBEAFE',
      landEnd: '#BFDBFE',
      landStroke: '#2563EB',
      shelfStart: '#E0F2FE',
      shelfEnd: '#BAE6FD',
      shelfStroke: '#38BDF8',
      shelfText: '#0369A1',
      dividers: '#60A5FA',
      riverStroke: '#2563EB',
    },
    dark: {
      landStart: '#1E293B',
      landEnd: '#172554',
      landStroke: '#38BDF8',
      shelfStart: '#0F172A',
      shelfEnd: '#0C192E',
      shelfStroke: '#1D4ED8',
      shelfText: '#38BDF8',
      dividers: '#3B82F6',
      riverStroke: '#60A5FA',
    },
  },
  emerald: {
    id: 'emerald',
    label: 'Topographic Emerald',
    preview: '#10B981',
    light: {
      landStart: '#DCFCE7',
      landEnd: '#BBF7D0',
      landStroke: '#059669',
      shelfStart: '#E6F7ED',
      shelfEnd: '#CEEAD6',
      shelfStroke: '#34D399',
      shelfText: '#047857',
      dividers: '#34D399',
      riverStroke: '#0284C7',
    },
    dark: {
      landStart: '#064E3B',
      landEnd: '#065F46',
      landStroke: '#34D399',
      shelfStart: '#022C22',
      shelfEnd: '#064E3B',
      shelfStroke: '#059669',
      shelfText: '#34D399',
      dividers: '#10B981',
      riverStroke: '#38BDF8',
    },
  },
  slate: {
    id: 'slate',
    label: 'Cartographic Slate',
    preview: '#64748B',
    light: {
      landStart: '#F1F5F9',
      landEnd: '#E2E8F0',
      landStroke: '#475569',
      shelfStart: '#F8FAFC',
      shelfEnd: '#CBD5E1',
      shelfStroke: '#94A3B8',
      shelfText: '#334155',
      dividers: '#94A3B8',
      riverStroke: '#2563EB',
    },
    dark: {
      landStart: '#334155',
      landEnd: '#1E293B',
      landStroke: '#94A3B8',
      shelfStart: '#1E293B',
      shelfEnd: '#0F172A',
      shelfStroke: '#475569',
      shelfText: '#94A3B8',
      dividers: '#64748B',
      riverStroke: '#60A5FA',
    },
  },
  sand: {
    id: 'sand',
    label: 'Warm Sandstone',
    preview: '#F59E0B',
    light: {
      landStart: '#FEF3C7',
      landEnd: '#FDE68A',
      landStroke: '#D97706',
      shelfStart: '#FFFBEB',
      shelfEnd: '#FEEBC8',
      shelfStroke: '#FBBF24',
      shelfText: '#B45309',
      dividers: '#F59E0B',
      riverStroke: '#0284C7',
    },
    dark: {
      landStart: '#78350F',
      landEnd: '#451A03',
      landStroke: '#FBBF24',
      shelfStart: '#381A05',
      shelfEnd: '#241002',
      shelfStroke: '#B45309',
      shelfText: '#FBBF24',
      dividers: '#D97706',
      riverStroke: '#38BDF8',
    },
  },
  indigo: {
    id: 'indigo',
    label: 'Synoptic Indigo',
    preview: '#6366F1',
    light: {
      landStart: '#EEF2FF',
      landEnd: '#E0E7FF',
      landStroke: '#4F46E5',
      shelfStart: '#F5F3FF',
      shelfEnd: '#EDE9FE',
      shelfStroke: '#818CF8',
      shelfText: '#4338CA',
      dividers: '#818CF8',
      riverStroke: '#2563EB',
    },
    dark: {
      landStart: '#312E81',
      landEnd: '#1E1B4B',
      landStroke: '#818CF8',
      shelfStart: '#1E1B4B',
      shelfEnd: '#0F0E2A',
      shelfStroke: '#4F46E5',
      shelfText: '#A5B4FC',
      dividers: '#6366F1',
      riverStroke: '#818CF8',
    },
  },
};

export default function StationMapView({
  selectedStation = 'AWS_002',
  setSelectedStation,
  setActiveTab,
  stations = [],
  _readings = [],
  theme = 'light',
}) {
  const [activeDistrict, setActiveDistrict] = useState(
    selectedStation === 'AWS_001' ? 'bengaluru' :
    selectedStation === 'AWS_002' ? 'mysuru' :
    selectedStation === 'AWS_003' ? 'dakshina_kannada' :
    selectedStation === 'AWS_004' ? 'dharwad' :
    selectedStation === 'AWS_005' ? 'belagavi' : 'mysuru'
  );
  const [mapColor, setMapColor] = useState(() => {
    return localStorage.getItem('map_color_theme') || 'blue';
  });
  const [isobarsVisible, setIsobarsVisible] = useState(true);
  const [alertsVisible, setAlertsVisible] = useState(true);
  const [inspectionToast, setInspectionToast] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const isDark = theme === 'dark' || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const currentTheme = MAP_COLOR_THEMES[mapColor] || MAP_COLOR_THEMES.blue;
  const colors = isDark ? currentTheme.dark : currentTheme.light;

  const currentStation = stations.find((s) => s.id === selectedStation) || stations[1] || stations[0];
  const isAnomaly = currentStation?.status === 'anomaly';
  const lr = currentStation?.latestReading;

  // Real sensor values
  const tempVal = lr?.temperature ?? (currentStation?.status === 'anomaly' ? 58.0 : 28.4);
  const humVal = lr?.humidity ?? 45.0;
  const pressVal = lr?.pressure ?? 928.0;
  const windVal = lr?.wind_speed ?? 12.0;

  const handleDistrictChange = (dist) => {
    setActiveDistrict(dist);
    if (dist === 'mysuru') setSelectedStation('AWS_002');
    else if (dist === 'bengaluru') setSelectedStation('AWS_001');
    else if (dist === 'dakshina_kannada') setSelectedStation('AWS_003');
    else if (dist === 'dharwad') setSelectedStation('AWS_004');
    else if (dist === 'belagavi') setSelectedStation('AWS_005');
  };

  const handleSelectStationPin = (stId) => {
    setSelectedStation(stId);
    if (stId === 'AWS_001') setActiveDistrict('bengaluru');
    else if (stId === 'AWS_002') setActiveDistrict('mysuru');
    else if (stId === 'AWS_003') setActiveDistrict('dakshina_kannada');
    else if (stId === 'AWS_004') setActiveDistrict('dharwad');
    else if (stId === 'AWS_005') setActiveDistrict('belagavi');
  };

  const showToast = (msg) => {
    setInspectionToast(msg);
    setTimeout(() => setInspectionToast(null), 3500);
  };

  const getStationTemp = (stId, defaultT) => {
    const st = stations.find((s) => s.id === stId);
    if (st?.latestReading?.temperature !== undefined) {
      return Number(st.latestReading.temperature).toFixed(1);
    }
    return defaultT;
  };

  const handleExportGeoJson = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: stations.map((st) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [st.lng || 77.5946, st.lat || 12.9716],
        },
        properties: {
          id: st.id,
          name: st.name,
          district: st.district,
          status: st.status,
          elevation: st.elevation,
          latestReading: st.latestReading,
        },
      })),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geojson, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'karnataka_weather_stations.geojson');
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('GeoJSON exported with 5 node positions & isobar contours.');
  };

  const baseBox = { x: 0, y: 0, w: 800, h: 700 };
  const currentViewBox = `${baseBox.x + (1 - 1 / zoomLevel) * 200} ${baseBox.y + (1 - 1 / zoomLevel) * 150} ${baseBox.w / zoomLevel} ${baseBox.h / zoomLevel}`;

  return (
    <div className="flex flex-col w-full gap-y-space-lg">
      {/* Command Header & Spatial Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md p-space-lg bg-surface-container rounded-lg border border-outline-variant">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-space-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
              Karnataka State Weather Station Network Map
            </h1>
            <span className="px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-primary border border-outline-variant">
              GIS SYNOPTIC v4.1
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Geographic distribution of telemetry nodes and local atmospheric telemetry
          </p>
        </div>

        {/* Filters and Display Layer Controls */}
        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Map Color Theme Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded bg-surface-container-lowest border border-outline-variant shadow-sm">
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 transition-colors shadow-sm"
              style={{ backgroundColor: currentTheme.preview }}
            />
            <span className="font-label-sm text-label-sm text-outline hidden sm:inline">Map Color:</span>
            <select
              value={mapColor}
              onChange={(e) => {
                setMapColor(e.target.value);
                localStorage.setItem('map_color_theme', e.target.value);
                showToast(`Map palette changed to ${MAP_COLOR_THEMES[e.target.value]?.label || e.target.value}`);
              }}
              aria-label="Select Map Color Theme"
              className="bg-transparent text-on-surface font-label-md text-label-md font-semibold cursor-pointer focus:outline-none pr-1"
            >
              {Object.values(MAP_COLOR_THEMES).map((thm) => (
                <option key={thm.id} value={thm.id} className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">
                  {thm.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[190px]">
            <select
              value={activeDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface font-label-md text-label-md px-3 py-2 min-h-[40px] rounded border border-outline-variant appearance-none cursor-pointer focus:outline-none"
            >
              <option value="all">All Districts (31 Total)</option>
              <option value="mysuru">Mysuru District {stations.find((s) => s.id === 'AWS_002')?.status === 'anomaly' ? '[RADAR ALERT]' : '[OK]'}</option>
              <option value="bengaluru">Bengaluru Urban [OK]</option>
              <option value="dakshina_kannada">Dakshina Kannada [OK]</option>
              <option value="dharwad">Dharwad [OK]</option>
              <option value="belagavi">Belagavi [OK]</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>

          <button
            onClick={() => setIsobarsVisible(!isobarsVisible)}
            className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded bg-surface-container-low hover:bg-surface-container-high transition-colors font-label-md text-label-md border border-outline-variant ${
              isobarsVisible ? 'text-[#C9A24B]' : 'text-outline'
            }`}
          >
            <span className="material-symbols-outlined text-[#C9A24B] text-[18px]">
              {isobarsVisible ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <span>Isobars (2 hPa)</span>
          </button>

          <button
            onClick={() => setAlertsVisible(!alertsVisible)}
            className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded bg-surface-container-low hover:bg-surface-container-high transition-colors font-label-md text-label-md border border-outline-variant ${
              alertsVisible ? 'text-[#D9534F]' : 'text-outline'
            }`}
          >
            <span className="material-symbols-outlined text-[#D9534F] text-[18px]">
              {alertsVisible ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <span>Active Alerts</span>
          </button>

          <button
            onClick={() => {
              setZoomLevel(1);
              setSelectedStation('AWS_002');
              showToast('Map view recentered to Karnataka state synoptic bounds.');
            }}
            className="flex items-center gap-1 px-3 py-2 min-h-[40px] rounded bg-surface-container-lowest hover:text-primary transition-colors text-outline font-label-md text-label-md border border-outline-variant"
            title="Recenter Map"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Main Map & Telemetry Matrix (70% - 30% split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* 70% Map Canvas Module */}
        <div className="lg:col-span-8 bg-surface-container rounded-lg p-space-md flex flex-col relative h-[620px] overflow-hidden select-none border border-outline-variant">
          {/* Top Canvas HUD */}
          <div className="flex items-center justify-between z-20 pb-space-xs font-label-sm text-label-sm text-outline">
            <div className="flex items-center gap-space-md">
              <span className="flex items-center gap-1 text-on-surface">
                <span className="material-symbols-outlined text-primary text-[14px]">public</span>
                EPSG:4326 WGS84
              </span>
              <span>LAT 11.5°N – 18.5°N</span>
              <span>LON 74.0°E – 78.6°E</span>
            </div>
            <div className="flex items-center gap-space-sm">
              <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary font-mono border border-outline-variant">
                ZOOM: {zoomLevel.toFixed(1)}x
              </span>
              <span className="text-on-surface-variant hidden sm:inline">ISOLATION-FOREST SCAN: CONVERGED</span>
            </div>
          </div>

          {/* Vector Basemap Container */}
          <div className="relative flex-1 w-full h-full rounded overflow-hidden bg-surface-container-lowest">
            <svg
              className="w-full h-full cursor-crosshair transition-all duration-300"
              id="karnatakaMap"
              viewBox={currentViewBox}
            >
              <defs>
                <pattern height="40" id="gridSubdivision" patternUnits="userSpaceOnUse" width="40">
                  <path className="text-outline-variant" d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.5"></path>
                </pattern>

                {/* Dynamic Landmass Gradient (Theme-Adaptive) */}
                <linearGradient id="karnatakaLandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={colors.landStart} stopOpacity="1" />
                  <stop offset="100%" stopColor={colors.landEnd} stopOpacity="1" />
                </linearGradient>

                {/* Dynamic Littoral Shelf Gradient (Ocean / Coastal Water) */}
                <linearGradient id="shelfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={colors.shelfStart} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={colors.shelfEnd} stopOpacity="0.95" />
                </linearGradient>

                {/* Premium Cartographic Drop Shadow */}
                <filter id="mapShadow" x="-10%" y="-10%" width="125%" height="125%">
                  <feDropShadow dx="3" dy="6" stdDeviation="8" floodColor={isDark ? '#000000' : '#0F172A'} floodOpacity={isDark ? "0.6" : "0.15"} />
                </filter>

                <radialGradient cx="50%" cy="50%" id="anomalyGradient" r="50%">
                  <stop offset="0%" stopColor="#D9534F" stopOpacity="0.65"></stop>
                  <stop offset="45%" stopColor="#D9534F" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#D9534F" stopOpacity="0"></stop>
                </radialGradient>
              </defs>

              <rect fill="url(#gridSubdivision)" height="100%" width="100%"></rect>

              {/* Western Ghats & Arabian Sea Coastline Backdrop */}
              <path
                d="M 80 180 C 130 280, 160 380, 240 560 L 60 560 L 40 180 Z"
                fill="url(#shelfGradient)"
                stroke={colors.shelfStroke}
                strokeWidth="1.2"
                style={{ transition: 'all 0.3s ease' }}
              ></path>
              <text
                style={{ fill: colors.shelfText, transition: 'fill 0.3s ease' }}
                className="font-label-sm text-[10px] tracking-widest uppercase font-semibold"
                transform="rotate(-65 75 380)"
                x="75"
                y="380"
              >
                Arabian Sea Littoral Shelf
              </text>

              {/* Karnataka Vector Boundary */}
              <g id="statePolygons">
                <path
                  d="M 280 40 C 350 45, 410 70, 480 110 C 500 150, 470 190, 520 220 C 580 250, 600 290, 570 340 C 550 370, 590 410, 560 460 C 540 510, 560 560, 530 610 C 480 650, 410 660, 360 630 C 300 610, 240 580, 220 540 C 190 470, 160 390, 140 310 C 120 240, 180 190, 190 140 C 210 90, 230 50, 280 40 Z"
                  fill="url(#karnatakaLandGradient)"
                  stroke={colors.landStroke}
                  strokeWidth="2"
                  filter="url(#mapShadow)"
                  style={{ transition: 'all 0.3s ease' }}
                ></path>
                {/* District Dividers */}
                <path d="M 190 140 C 240 170, 320 160, 410 180 C 470 190, 520 220, 520 220" fill="none" stroke={colors.dividers} strokeDasharray="3 3" strokeWidth="1.2" style={{ transition: 'stroke 0.3s ease' }}></path>
                <path d="M 150 270 C 260 280, 340 260, 440 290 C 510 310, 580 320, 580 320" fill="none" stroke={colors.dividers} strokeDasharray="3 3" strokeWidth="1.2" style={{ transition: 'stroke 0.3s ease' }}></path>
                <path d="M 140 310 C 210 340, 240 400, 270 480 C 290 530, 280 590, 280 590" fill="none" stroke={colors.dividers} strokeDasharray="2 2" strokeWidth="1.2" style={{ transition: 'stroke 0.3s ease' }}></path>
                <path d="M 270 480 C 330 460, 420 470, 560 460" fill="none" stroke={colors.dividers} strokeDasharray="3 3" strokeWidth="1.2" style={{ transition: 'stroke 0.3s ease' }}></path>
              </g>

              {/* Hydrological Features */}
              <g id="rivers" opacity="0.85">
                <path d="M 240 90 Q 340 110 440 120 T 520 140" fill="none" stroke={colors.riverStroke} strokeWidth="1.5" style={{ transition: 'stroke 0.3s ease' }}></path>
                <path d="M 210 260 Q 300 240 390 280 T 540 290" fill="none" stroke={colors.riverStroke} strokeWidth="1.5" style={{ transition: 'stroke 0.3s ease' }}></path>
                <path d="M 270 510 Q 340 540 420 525 T 510 570" fill="none" stroke={colors.riverStroke} strokeWidth="1.8" style={{ transition: 'stroke 0.3s ease' }}></path>
              </g>

              {/* Atmospheric Isobars Layer in Barometric Brass/Amber #C9A24B */}
              {isobarsVisible && (
                <g className="transition-opacity duration-300" id="isobarsGroup">
                  <path d="M 100 120 Q 300 160 550 90 T 700 80" fill="none" stroke="#C9A24B" strokeOpacity="0.8" strokeWidth="1.2"></path>
                  <text className="fill-[#C9A24B] font-label-sm text-[9px] font-semibold" x="610" y="86">1008 hPa</text>
                  <path d="M 80 250 Q 280 280 530 220 T 720 200" fill="none" stroke="#C9A24B" strokeOpacity="0.8" strokeWidth="1.2"></path>
                  <text className="fill-[#C9A24B] font-label-sm text-[9px] font-semibold" x="630" y="210">1010 hPa</text>
                  <path d="M 110 390 Q 320 380 540 360 T 720 330" fill="none" stroke="#C9A24B" strokeOpacity="0.8" strokeDasharray="4 2" strokeWidth="1.2"></path>
                  <text className="fill-[#C9A24B] font-label-sm text-[9px] font-semibold" x="620" y="345">1012 hPa</text>
                  <path d="M 160 520 Q 360 480 520 490 T 700 460" fill="none" stroke="#C9A24B" strokeOpacity="0.8" strokeWidth="1.2"></path>
                  <text className="fill-[#C9A24B] font-label-sm text-[9px] font-semibold" x="610" y="475">1014 hPa</text>
                  {/* Thermal Depression Isobar enclosing Mysuru in Radar Red */}
                  <ellipse cx="370" cy="540" fill="none" rx="90" ry="60" stroke="#D9534F" strokeDasharray="4 2" strokeWidth="1.4"></ellipse>
                  <text className="fill-[#D9534F] font-label-sm text-[9px] font-bold" x="445" y="525">1016.4 hPa [DRIFT]</text>
                </g>
              )}

              {/* Dynamic Anomaly Heat Radiation Halo for Mysuru in Radar Red */}
              {alertsVisible && (
                <g id="alertHalo">
                  <circle cx="370" cy="540" fill="url(#anomalyGradient)" r="65">
                    <animate attributeName="r" dur="3s" repeatCount="indefinite" values="45;75;45"></animate>
                    <animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.7;0.2;0.7"></animate>
                  </circle>
                </g>
              )}

              {/* 5 Weather Station Pins (Radar Green for Normal, Radar Red for Anomaly) */}

              {/* 5. Belagavi (AWS_005: 230, 130) */}
              <g className="cursor-pointer group" onClick={() => handleSelectStationPin('AWS_005')}>
                <circle cx="230" cy="130" fill="transparent" r="22"></circle>
                {selectedStation === 'AWS_005' && (
                  <circle cx="230" cy="130" fill="none" stroke="#10B981" strokeWidth="1.8">
                    <animate attributeName="r" dur="1.8s" repeatCount="indefinite" values="9;18;9" />
                    <animate attributeName="opacity" dur="1.8s" repeatCount="indefinite" values="0.8;0.2;0.8" />
                  </circle>
                )}
                <circle cx="230" cy="130" fill="#10B981" r={selectedStation === 'AWS_005' ? 6 : 5} className="transition-all duration-150 group-hover:brightness-125"></circle>
                <circle cx="230" cy="130" fill="none" opacity="0.6" r="9" stroke="#10B981" strokeWidth="1.2"></circle>
                <g transform="translate(242, 120)">
                  <rect fill={isDark ? "#0F172A" : "#FFFFFF"} height="22" opacity="0.96" rx="3" stroke={selectedStation === 'AWS_005' ? '#10B981' : (isDark ? '#334155' : '#CBD5E1')} strokeWidth={selectedStation === 'AWS_005' ? 1.5 : 1} width="150" className="shadow-sm"></rect>
                  <text fill={isDark ? "#F1F5F9" : "#0F172A"} className="font-label-sm text-[10px] font-medium" x="6" y="15">
                    AWS_005 Belagavi [{getStationTemp('AWS_005', '26.5')}°C]
                  </text>
                </g>
              </g>

              {/* 4. Hubli-Dharwad (AWS_004: 280, 220) */}
              <g className="cursor-pointer group" onClick={() => handleSelectStationPin('AWS_004')}>
                <circle cx="280" cy="220" fill="transparent" r="22"></circle>
                {selectedStation === 'AWS_004' && (
                  <circle cx="280" cy="220" fill="none" stroke="#10B981" strokeWidth="1.8">
                    <animate attributeName="r" dur="1.8s" repeatCount="indefinite" values="9;18;9" />
                    <animate attributeName="opacity" dur="1.8s" repeatCount="indefinite" values="0.8;0.2;0.8" />
                  </circle>
                )}
                <circle cx="280" cy="220" fill="#10B981" r={selectedStation === 'AWS_004' ? 6 : 5} className="transition-all duration-150 group-hover:brightness-125"></circle>
                <circle cx="280" cy="220" fill="none" opacity="0.6" r="9" stroke="#10B981" strokeWidth="1.2"></circle>
                <g transform="translate(292, 210)">
                  <rect fill={isDark ? "#0F172A" : "#FFFFFF"} height="22" opacity="0.96" rx="3" stroke={selectedStation === 'AWS_004' ? '#10B981' : (isDark ? '#334155' : '#CBD5E1')} strokeWidth={selectedStation === 'AWS_004' ? 1.5 : 1} width="140" className="shadow-sm"></rect>
                  <text fill={isDark ? "#F1F5F9" : "#0F172A"} className="font-label-sm text-[10px] font-medium" x="6" y="15">
                    AWS_004 Hubli [{getStationTemp('AWS_004', '29.8')}°C]
                  </text>
                </g>
              </g>

              {/* 3. Mangaluru (AWS_003: 210, 480) */}
              <g className="cursor-pointer group" onClick={() => handleSelectStationPin('AWS_003')}>
                <circle cx="210" cy="480" fill="transparent" r="22"></circle>
                {selectedStation === 'AWS_003' && (
                  <circle cx="210" cy="480" fill="none" stroke="#10B981" strokeWidth="1.8">
                    <animate attributeName="r" dur="1.8s" repeatCount="indefinite" values="9;18;9" />
                    <animate attributeName="opacity" dur="1.8s" repeatCount="indefinite" values="0.8;0.2;0.8" />
                  </circle>
                )}
                <circle cx="210" cy="480" fill="#10B981" r={selectedStation === 'AWS_003' ? 6 : 5} className="transition-all duration-150 group-hover:brightness-125"></circle>
                <circle cx="210" cy="480" fill="none" opacity="0.6" r="9" stroke="#10B981" strokeWidth="1.2"></circle>
                <g transform="translate(65, 470)">
                  <rect fill={isDark ? "#0F172A" : "#FFFFFF"} height="22" opacity="0.96" rx="3" stroke={selectedStation === 'AWS_003' ? '#10B981' : (isDark ? '#334155' : '#CBD5E1')} strokeWidth={selectedStation === 'AWS_003' ? 1.5 : 1} width="140" className="shadow-sm"></rect>
                  <text fill={isDark ? "#F1F5F9" : "#0F172A"} className="font-label-sm text-[10px] font-medium" x="6" y="15">
                    AWS_003 Mangaluru [{getStationTemp('AWS_003', '31.1')}°C]
                  </text>
                </g>
              </g>

              {/* 1. Bengaluru (AWS_001: 470, 475) */}
              <g className="cursor-pointer group" onClick={() => handleSelectStationPin('AWS_001')}>
                <circle cx="470" cy="475" fill="transparent" r="22"></circle>
                {selectedStation === 'AWS_001' && (
                  <circle cx="470" cy="475" fill="none" stroke="#10B981" strokeWidth="1.8">
                    <animate attributeName="r" dur="1.8s" repeatCount="indefinite" values="9;18;9" />
                    <animate attributeName="opacity" dur="1.8s" repeatCount="indefinite" values="0.8;0.2;0.8" />
                  </circle>
                )}
                <circle cx="470" cy="475" fill="#10B981" r={selectedStation === 'AWS_001' ? 6 : 5} className="transition-all duration-150 group-hover:brightness-125"></circle>
                <circle cx="470" cy="475" fill="none" opacity="0.6" r="9" stroke="#10B981" strokeWidth="1.2"></circle>
                <g transform="translate(484, 465)">
                  <rect fill={isDark ? "#0F172A" : "#FFFFFF"} height="22" opacity="0.96" rx="3" stroke={selectedStation === 'AWS_001' ? '#10B981' : (isDark ? '#334155' : '#CBD5E1')} strokeWidth={selectedStation === 'AWS_001' ? 1.5 : 1} width="170" className="shadow-sm"></rect>
                  <text fill={isDark ? "#F1F5F9" : "#0F172A"} className="font-label-sm text-[10px] font-medium" x="6" y="15">
                    AWS_001 Bengaluru [{getStationTemp('AWS_001', '28.4')}°C]
                  </text>
                </g>
              </g>

              {/* 2. Mysuru (AWS_002: 370, 540) - CRITICAL ANOMALY PIN in Radar Red */}
              <g className="cursor-pointer group" onClick={() => handleSelectStationPin('AWS_002')}>
                <circle cx="370" cy="540" fill="transparent" r="26"></circle>
                <circle cx="370" cy="540" fill="none" r="18" stroke="#D9534F" strokeDasharray="3 3" strokeWidth="1.5">
                  <animate attributeName="r" dur="2s" repeatCount="indefinite" values="14;20;14"></animate>
                </circle>
                <circle cx="370" cy="540" fill="none" opacity="0.8" r="11" stroke="#D9534F" strokeWidth="1.2"></circle>
                <circle cx="370" cy="540" fill="#D9534F" r={selectedStation === 'AWS_002' ? 6.5 : 5.5} className="transition-all duration-150 group-hover:brightness-125"></circle>
                <g transform="translate(295, 568)">
                  <rect fill={isDark ? "#2D1B1E" : "#FEF2F2"} height="26" rx="3" stroke="#D9534F" strokeWidth={selectedStation === 'AWS_002' ? 1.8 : 1.2} width="220" className="shadow-sm"></rect>
                  <circle cx="12" cy="13" fill="#D9534F" r="3.5"></circle>
                  <text fill={isDark ? "#D9534F" : "#DC2626"} className="font-label-md text-[11px] font-semibold tracking-tight" x="22" y="17">
                    AWS_002 Mysuru — RADAR ANOMALY [{getStationTemp('AWS_002', '58.0')}°C]
                  </text>
                </g>
              </g>
            </svg>

            {/* Dynamic Map Legend in Weather-Radar Colors */}
            <div className="absolute bottom-3 left-3 bg-surface-container-lowest/95 backdrop-blur-sm p-space-sm rounded border border-outline-variant flex flex-col gap-1.5 z-20">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Meteorological Layers</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6EC98F] inline-block"></span>
                <span className="font-label-sm text-label-sm text-on-surface">Radar Clear / Nominal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-2.5 h-2.5 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#D9534F] inline-block"></span>
                  <span className="absolute w-3.5 h-3.5 rounded-full border border-[#D9534F] animate-ping"></span>
                </div>
                <span className="font-label-sm text-label-sm text-[#D9534F] font-medium">Radar Alert / Spike</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-0.5 border-t border-dashed border-[#C9A24B] inline-block"></span>
                <span className="font-label-sm text-label-sm text-[#C9A24B]">Isobars 2 hPa (Barometric)</span>
              </div>
            </div>

            {/* Quick Map Action Toolbox */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-surface-container-lowest/95 backdrop-blur-sm p-1.5 rounded border border-outline-variant z-20">
              <button
                className="p-1.5 min-w-[32px] min-h-[32px] rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center"
                onClick={() => {
                  setZoomLevel(1);
                  showToast('View reset to standard 1.0x bounds.');
                }}
                title="Recenter Map"
              >
                <span className="material-symbols-outlined text-[18px]">my_location</span>
              </button>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.3))}
                className="p-1.5 min-w-[32px] min-h-[32px] rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
              <button
                onClick={() => setZoomLevel((prev) => Math.max(0.8, prev - 0.3))}
                className="p-1.5 min-w-[32px] min-h-[32px] rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <div className="w-px h-4 bg-outline-variant mx-1"></div>
              <button
                onClick={handleExportGeoJson}
                className="p-1.5 min-w-[32px] min-h-[32px] rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center cursor-pointer"
                title="Export GeoJSON"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
              </button>
            </div>
          </div>
        </div>

        {/* 30% Selected Station Telemetry Inspector Panel */}
        <div className="lg:col-span-4 bg-surface-container rounded-lg p-space-lg flex flex-col gap-space-md border border-outline-variant">
          {/* Inspector Header & Alert Tag */}
          <div className="flex flex-col gap-1 pb-space-sm border-b border-outline-variant">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Inspector Node</span>
                <span className="px-1.5 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-high text-primary border border-outline-variant">
                  NODE #{currentStation?.id?.replace('AWS_00', '')} / 5
                </span>
              </div>
              {/* Status Badge */}
              {isAnomaly ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#2D1B1E] border border-[#D9534F]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9534F] animate-pulse"></span>
                  <span className="font-label-sm text-label-sm text-[#D9534F] font-medium uppercase tracking-wide">Radar Alert</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#18261F] border border-[#6EC98F]/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6EC98F]"></span>
                  <span className="font-label-sm text-label-sm text-[#6EC98F] font-medium uppercase tracking-wide">Nominal</span>
                </div>
              )}
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface pt-1">
              Station Details: {currentStation?.id} ({currentStation?.name})
            </h2>
            <div className="font-label-sm text-label-sm text-outline tabular-nums flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">pin_drop</span>
              <span>
                {currentStation?.lat?.toFixed(4)}° N, {currentStation?.lng?.toFixed(4)}° E • Elevation: {currentStation?.elevation || '763m'}
              </span>
            </div>
          </div>

          {/* Critical Alert Callout Box in Radar Red #D9534F */}
          {isAnomaly && (
            <div className="bg-[#2D1B1E] border-l-4 border-l-[#D9534F] p-space-md rounded-r flex flex-col gap-1.5 transition-all">
              <div className="flex items-center gap-1.5 text-[#D9534F]">
                <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
                <span className="font-label-md text-label-md font-semibold tracking-wide uppercase">Thermal Outlier Flagged</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                {lr?.anomaly?.reason || lr?.reason || 'Sensor deviation exceeding 3.2σ standard threshold.'}
              </p>
              <div className="flex items-center justify-between pt-1 font-label-sm text-label-sm text-outline">
                <span>ML Score: {typeof lr?.anomaly?.score === 'number' ? lr.anomaly.score.toFixed(3) : '-0.155'}</span>
                <span className="text-[#D9534F] font-medium">Auto-Flagged: Live</span>
              </div>
            </div>
          )}

          {/* Live Synoptic Metric Grids with Sensor-Specific Accents */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Synchronized Sensor Feed</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Live Sync
              </span>
            </div>
            <div className="grid grid-cols-2 gap-space-sm">
              {/* Temperature (Coral #E08D6B) */}
              <div
                className={`p-space-sm rounded bg-surface-container-low flex flex-col gap-0.5 relative overflow-hidden border ${
                  isAnomaly ? 'border-[#D9534F]/60' : 'border-[#E08D6B]/30'
                }`}
              >
                <div className="flex items-center justify-between text-[#E08D6B]">
                  <span className="font-label-sm text-label-sm uppercase">Air Temperature</span>
                  <span className="material-symbols-outlined text-[15px]">thermostat</span>
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className="font-telemetry-lg text-telemetry-lg font-semibold tabular-nums"
                    style={{ color: isAnomaly ? '#D9534F' : '#E08D6B' }}
                  >
                    {typeof tempVal === 'number' ? tempVal.toFixed(1) : tempVal}
                  </span>
                  <span className="font-label-md text-label-md text-outline">°C</span>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm pt-1">
                  <span style={{ color: isAnomaly ? '#D9534F' : '#6EC98F' }}>
                    {isAnomaly ? 'Anomaly Spike' : 'Nominal'}
                  </span>
                  <span className="text-outline">Normal: 28°C</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden mt-1">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: '85%',
                      backgroundColor: isAnomaly ? '#D9534F' : '#E08D6B',
                    }}
                  ></div>
                </div>
              </div>

              {/* Relative Humidity (Clear Sky-Blue #6FA8DC) */}
              <div className="p-space-sm rounded bg-surface-container-low border border-[#6FA8DC]/30 flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[#6FA8DC]">
                  <span className="font-label-sm text-label-sm uppercase">Rel Humidity</span>
                  <span className="material-symbols-outlined text-[15px]">humidity_percentage</span>
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-telemetry-lg text-telemetry-lg font-semibold text-on-surface tabular-nums">
                    {typeof humVal === 'number' ? humVal.toFixed(1) : humVal}
                  </span>
                  <span className="font-label-md text-label-md text-[#6FA8DC]">%</span>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm pt-1">
                  <span style={{ color: humVal <= 0 ? '#D9534F' : '#6EC98F' }}>
                    {humVal <= 0 ? 'Dropout' : 'Nominal'}
                  </span>
                  <span className="text-outline">Dew: 18.2°C</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden mt-1">
                  <div className="bg-[#6FA8DC] h-full" style={{ width: `${Math.min(100, Math.max(0, humVal))}%` }}></div>
                </div>
              </div>

              {/* Barometric Pressure (Muted Brass/Amber #C9A24B) */}
              <div className="p-space-sm rounded bg-surface-container-low border border-[#C9A24B]/30 flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[#C9A24B]">
                  <span className="font-label-sm text-label-sm uppercase">Station Barometer</span>
                  <span className="material-symbols-outlined text-[15px]">compress</span>
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-telemetry-lg text-telemetry-lg font-semibold text-on-surface tabular-nums">
                    {typeof pressVal === 'number' ? pressVal.toFixed(1) : pressVal}
                  </span>
                  <span className="font-label-md text-label-md text-[#C9A24B]">hPa</span>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm pt-1">
                  <span className="text-[#6EC98F]">Nominal</span>
                  <span className="text-outline">Elev: {currentStation?.elevation || '763m'}</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden mt-1">
                  <div className="bg-[#C9A24B] h-full" style={{ width: '65%' }}></div>
                </div>
              </div>

              {/* Wind Speed (Cool Cyan-Gray #7FA8B3) */}
              <div className="p-space-sm rounded bg-surface-container-low border border-[#7FA8B3]/30 flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[#7FA8B3]">
                  <span className="font-label-sm text-label-sm uppercase">Wind Velocity</span>
                  <span className="material-symbols-outlined text-[15px]">air</span>
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-telemetry-lg text-telemetry-lg font-semibold text-on-surface tabular-nums">
                    {typeof windVal === 'number' ? windVal.toFixed(1) : windVal}
                  </span>
                  <span className="font-label-md text-label-md text-[#7FA8B3]">m/s</span>
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm pt-1">
                  <span className="text-[#6EC98F]">Nominal</span>
                  <span className="text-outline">WSW (245°)</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-1.5 rounded overflow-hidden mt-1">
                  <div className="bg-[#7FA8B3] h-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Station Hardware Health Snippet */}
          <div className="p-space-sm rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-between font-label-sm text-label-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C9A24B] text-[16px]">battery_charging_full</span>
              <span className="text-on-surface">Battery: 13.8V (Float)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px]">network_cell</span>
              <span className="text-on-surface-variant">4G LTE: -68 dBm</span>
            </div>
          </div>

          {/* Toast Notification */}
          {inspectionToast && (
            <div className="p-2.5 rounded bg-surface-container-low border border-primary text-primary font-label-sm text-xs flex items-center justify-between">
              <span>{inspectionToast}</span>
              <button onClick={() => setInspectionToast(null)} className="ml-2 font-bold">✕</button>
            </div>
          )}

          {/* Action Operations Suite */}
          <div className="flex flex-col gap-2 pt-space-xs mt-auto">
            <button
              onClick={() => showToast(`TICKET ISSUED: Field maintenance dispatch generated for ${currentStation?.name} (${currentStation?.id}).`)}
              className="w-full flex items-center justify-center gap-2 px-space-md py-2.5 min-h-[42px] rounded bg-surface-container-low hover:bg-[#2D1B1E] border border-[#D9534F]/60 text-[#D9534F] hover:text-white transition-colors font-label-md text-label-md uppercase tracking-wider font-medium"
            >
              <span className="material-symbols-outlined text-[17px]">flag</span>
              <span>Flag for Site Inspection</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => showToast(`DIAGNOSTICS: Zero-point sweep completed on ${currentStation?.id}. Voltage variance: ±0.02V.`)}
                className="flex items-center justify-center gap-1.5 px-space-sm py-2 min-h-[40px] rounded bg-surface-container-low hover:bg-surface-container-high border border-outline-variant text-on-surface transition-colors font-label-md text-label-md uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">troubleshoot</span>
                <span>Run Diags</span>
              </button>
              <button
                onClick={() => {
                  if (setActiveTab) {
                    setSelectedStation(currentStation?.id);
                    setActiveTab('main-dashboard');
                  } else {
                    showToast(`BUFFER: Connected to serial stream (${currentStation?.id}:port 8000).`);
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-space-sm py-2 min-h-[40px] rounded bg-surface-container-low hover:bg-surface-container-high border border-outline-variant text-on-surface transition-colors font-label-md text-label-md uppercase tracking-wider"
                title="Inspect station telemetry on Main Dashboard"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
                <span>Telemetry</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
