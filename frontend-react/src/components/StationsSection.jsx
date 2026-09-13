import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Radio,
  MapPin,
  Activity,
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  Sun,
  CloudRain,
  Battery,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Search,
  ArrowUpRight,
  Compass,
  Cpu,
  RefreshCw,
  Sliders,
  Eye,
  TrendingUp,
  Zap,
  Info,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Server,
  Signal
} from 'lucide-react';

const FLEET_STATIONS = [
  {
    id: 'AWS_001',
    name: 'Bengaluru Urban AWS',
    location: 'Bengaluru Urban, Karnataka',
    coordinates: '12.9716° N, 77.5946° E',
    lat: 12.9716,
    lon: 77.5946,
    elevation: '920m AMSL',
    elevationVal: 920,
    climateZone: 'Deccan Semi-Arid Plateau',
    zoneBadge: 'Plateau',
    status: 'ONLINE',
    hasAnomaly: false,
    anomalyDetail: null,
    hardware: {
      logger: 'Campbell Scientific CR1000X Plateau Spec',
      tempHumSensor: 'Vaisala HMP155 (Pt100 RTD Class 1/3 DIN)',
      barometer: 'Setra Model 278 Piezoresistive Digital',
      anemometer: 'Gill WindObserver II Ultrasonic 2-Axis',
      pyranometer: 'Kipp & Zonen CMP11 ISO Secondary Standard',
      rainGauge: 'Texas Electronics TR-525USW (0.1mm)',
      solarBattery: '12V 55Ah Deep Cycle Gel + 60W PV Array',
      telemetryLink: 'Quectel 4G LTE-M / NB-IoT (MQTT over TLS)'
    },
    specs: {
      uptime: '99.98%',
      lastCalibrated: '14 May 2026',
      firmware: 'v3.4.1-rc2',
      commLatency: '42 ms',
      signalDbm: '-68 dBm (Excellent)'
    },
    base: {
      temp: 27.2,
      humidity: 60.0,
      pressure: 915.0,
      windSpeed: 3.2,
      windDir: 230,
      dewPoint: 18.8,
      solar: 680,
      rain: 0.0,
      battery: 13.6
    }
  },
  {
    id: 'AWS_002',
    name: 'Mangaluru Coastal AWS',
    location: 'Mangaluru Coastal Shore, Karnataka',
    coordinates: '12.9141° N, 74.8560° E',
    lat: 12.9141,
    lon: 74.8560,
    elevation: '14m AMSL',
    elevationVal: 14,
    climateZone: 'Tropical Coastal Monsoon',
    zoneBadge: 'Coastal',
    status: 'ONLINE',
    hasAnomaly: false,
    anomalyDetail: null,
    hardware: {
      logger: 'Campbell Scientific CR6 Measurement Controller',
      tempHumSensor: 'Vaisala HMP155 Marine-Coated Shielded',
      barometer: 'Setra Model 278 Coastal Sealed Barometer',
      anemometer: 'Gill 2D Ultrasonic Anemometer Marine-Grade',
      pyranometer: 'Hukseflux SR20 Secondary Standard',
      rainGauge: 'R.M. Young 52203 Tipping Bucket Siphon',
      solarBattery: '12V 100Ah Deep Cycle AGM + 100W PV Array',
      telemetryLink: '4G LTE + Coastal Marine VHF Relay'
    },
    specs: {
      uptime: '99.85%',
      lastCalibrated: '02 Apr 2026',
      firmware: 'v3.4.0',
      commLatency: '48 ms',
      signalDbm: '-65 dBm (Excellent)'
    },
    base: {
      temp: 29.5,
      humidity: 78.0,
      pressure: 1011.0,
      windSpeed: 4.8,
      windDir: 270,
      dewPoint: 25.2,
      solar: 640,
      rain: 0.2,
      battery: 13.7
    }
  },
  {
    id: 'AWS_003',
    name: 'Mysuru Central AWS',
    location: 'Mysuru Central, Southern Karnataka',
    coordinates: '12.2958° N, 76.6394° E',
    lat: 12.2958,
    lon: 76.6394,
    elevation: '763m AMSL',
    elevationVal: 763,
    climateZone: 'Tropical Semi-Arid Plain',
    zoneBadge: 'Plains',
    status: 'WARNING',
    hasAnomaly: true,
    anomalyDetail: 'Step jump (+13.8°C / 1-min) flagged by WMO Rate-of-Change & Neural Autoencoder',
    hardware: {
      logger: 'Vaisala AWS310 Automatic Weather Station',
      tempHumSensor: 'Vaisala QMT103 / HUMICAP180R Heated',
      barometer: 'Vaisala BAROCAP PTB330 Digital Pressure',
      anemometer: 'Vaisala WMT700 Ultrasonic Anemometer',
      pyranometer: 'Kipp & Zonen SMP10 Smart Pyranometer',
      rainGauge: 'Vaisala RG13H Heated Tipping Bucket',
      solarBattery: '12V 65Ah Sealed Lead Acid + 80W PV Array',
      telemetryLink: '4G LTE-A Cat-4 / Secure WebSockets'
    },
    specs: {
      uptime: '99.40%',
      lastCalibrated: '19 Jan 2026',
      firmware: 'v3.3.8',
      commLatency: '55 ms',
      signalDbm: '-72 dBm (Very Good)'
    },
    base: {
      temp: 42.3, // Anomaly spike
      humidity: 64.0,
      pressure: 932.0,
      windSpeed: 2.6,
      windDir: 210,
      dewPoint: 20.5,
      solar: 590,
      rain: 0.0,
      battery: 13.4
    }
  },
  {
    id: 'AWS_004',
    name: 'Madikeri Coorg Highland AWS',
    location: 'Madikeri, Coorg, Western Ghats, Karnataka',
    coordinates: '12.4244° N, 75.7382° E',
    lat: 12.4244,
    lon: 75.7382,
    elevation: '1,150m AMSL',
    elevationVal: 1150,
    climateZone: 'Western Ghats Montane',
    zoneBadge: 'Highland',
    status: 'ONLINE',
    hasAnomaly: false,
    anomalyDetail: null,
    hardware: {
      logger: 'Campbell Scientific CR1000X High-Altitude Spec',
      tempHumSensor: 'Rotronic HygroMet4 Meteorological Probe',
      barometer: 'Vaisala PTB110 Class A Barometer',
      anemometer: 'R.M. Young 05103 Wind Monitor Heavy-Duty',
      pyranometer: 'Eppley Precision Spectral Pyranometer (PSP)',
      rainGauge: 'R.M. Young 52202 Heated Tipping Bucket',
      solarBattery: '12V 80Ah Deep Cycle AGM + Dual 50W PV',
      telemetryLink: 'SATCOM Iridium SBD + 4G Fallback'
    },
    specs: {
      uptime: '99.91%',
      lastCalibrated: '28 Feb 2026',
      firmware: 'v3.4.1',
      commLatency: '112 ms',
      signalDbm: '-79 dBm (Good)'
    },
    base: {
      temp: 20.8,
      humidity: 82.0,
      pressure: 885.0,
      windSpeed: 5.4,
      windDir: 240,
      dewPoint: 17.6,
      solar: 700,
      rain: 0.8,
      battery: 13.8
    }
  },
  {
    id: 'AWS_005',
    name: 'Dharwad Inland AWS',
    location: 'Dharwad - Hubballi Basin, North Karnataka',
    coordinates: '15.4589° N, 75.0078° E',
    lat: 15.4589,
    lon: 75.0078,
    elevation: '750m AMSL',
    elevationVal: 750,
    climateZone: 'Northern Inland Basin',
    zoneBadge: 'Inland',
    status: 'ONLINE',
    hasAnomaly: false,
    anomalyDetail: null,
    hardware: {
      logger: 'Campbell Scientific CR1000X Data Logger',
      tempHumSensor: 'Rotronic MP102H HygroClip Weather Probe',
      barometer: 'Vaisala PTB110 Class A Barometer',
      anemometer: 'Met One 014A Anemometer + Wind Vane',
      pyranometer: 'Kipp & Zonen CMP6 First Class Pyranometer',
      rainGauge: 'Texas Electronics TR-525I Rain Gauge',
      solarBattery: '12V 55Ah Deep Cycle Gel + 60W PV Array',
      telemetryLink: 'Quectel 4G LTE-M / Secure MQTT TLS'
    },
    specs: {
      uptime: '99.95%',
      lastCalibrated: '11 Jun 2026',
      firmware: 'v3.4.1',
      commLatency: '61 ms',
      signalDbm: '-74 dBm (Good)'
    },
    base: {
      temp: 28.0,
      humidity: 58.0,
      pressure: 935.0,
      windSpeed: 3.0,
      windDir: 160,
      dewPoint: 19.0,
      solar: 720,
      rain: 0.0,
      battery: 13.6
    }
  }
];


function getWindCompass(degrees) {
  if (degrees === undefined || degrees === null) return 'N';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(((degrees % 360) / 22.5)) % 16;
  return dirs[idx];
}

export default function StationsSection({
  activeStationId,
  onStationChange,
  isAnomalyActive,
  telemetry,
  statusFlags,
  onNavigateToLive
}) {
  const [selectedStationId, setSelectedStationId] = useState(activeStationId || 'AWS_001');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZone, setFilterZone] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date().toLocaleTimeString());

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersMapRef = useRef({});

  // Sync when parent activeStationId changes
  useEffect(() => {
    if (activeStationId && activeStationId !== selectedStationId) {
      setSelectedStationId(activeStationId);
    }
  }, [activeStationId]);

  // Merge live telemetry into active station data
  const stationsData = useMemo(() => {
    return FLEET_STATIONS.map((st) => {
      const isThisActive = st.id === selectedStationId;
      const isThisAnom = (isThisActive && isAnomalyActive) || st.hasAnomaly;

      let currentReadings = { ...st.base };
      if (isThisActive && telemetry) {
        currentReadings = {
          temp: telemetry.temperature !== undefined ? telemetry.temperature : st.base.temp,
          humidity: telemetry.humidity !== undefined ? telemetry.humidity : st.base.humidity,
          pressure: telemetry.pressure !== undefined ? telemetry.pressure : st.base.pressure,
          windSpeed: telemetry.wind_speed !== undefined ? telemetry.wind_speed : st.base.windSpeed,
          windDir: telemetry.wind_direction !== undefined ? telemetry.wind_direction : st.base.windDir,
          dewPoint: telemetry.dew_point !== undefined ? telemetry.dew_point : st.base.dewPoint,
          solar: telemetry.solar_radiation !== undefined ? telemetry.solar_radiation : st.base.solar,
          rain: telemetry.precipitation !== undefined ? telemetry.precipitation : st.base.rain,
          battery: telemetry.battery_voltage !== undefined ? telemetry.battery_voltage : st.base.battery,
        };
      }

      return {
        ...st,
        isAnomaly: isThisAnom,
        readings: currentReadings,
        healthScore: isThisAnom ? 78 : 99,
        status: isThisAnom ? 'WARNING' : 'ONLINE',
      };
    });
  }, [selectedStationId, isAnomalyActive, telemetry]);

  const selectedStation = useMemo(() => {
    return stationsData.find((s) => s.id === selectedStationId) || stationsData[0];
  }, [stationsData, selectedStationId]);

  // Filtered stations for list display
  const filteredStations = useMemo(() => {
    return stationsData.filter((st) => {
      const matchesSearch =
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.climateZone.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterZone === 'ALL') return true;
      if (filterZone === 'NORMAL') return !st.isAnomaly;
      if (filterZone === 'ALERT') return st.isAnomaly;
      if (filterZone === 'COASTAL') return st.zoneBadge === 'Coastal';
      if (filterZone === 'HIGHLAND') return st.zoneBadge === 'Highland';
      if (filterZone === 'INLAND') return st.zoneBadge === 'Inland' || st.zoneBadge === 'Humid';
      return true;
    });
  }, [stationsData, searchQuery, filterZone]);

  // Aggregate Fleet Metrics
  const fleetMetrics = useMemo(() => {
    const total = stationsData.length;
    const online = stationsData.filter((s) => s.status === 'ONLINE').length;
    const alerts = stationsData.filter((s) => s.isAnomaly).length;
    const avgTemp = (stationsData.reduce((acc, s) => acc + s.readings.temp, 0) / total).toFixed(1);
    const avgHum = Math.round(stationsData.reduce((acc, s) => acc + s.readings.humidity, 0) / total);
    const avgPress = Math.round(stationsData.reduce((acc, s) => acc + s.readings.pressure, 0) / total);
    const fleetHealth = Math.round(stationsData.reduce((acc, s) => acc + s.healthScore, 0) / total);

    return { total, online, alerts, avgTemp, avgHum, avgPress, fleetHealth };
  }, [stationsData]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Centered around Karnataka (11.5° - 18.5° N, 74° - 78.5° E)
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([13.60, 76.00], 7);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Standard OpenStreetMap tiles (Clean, free of KEY REQUIRED watermarks)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapRef.current = map;

    // Add markers for all stations
    FLEET_STATIONS.forEach((st) => {
      const isSelected = st.id === selectedStationId;
      const isAnom = st.hasAnomaly;

      const markerDiv = createMarkerElement(st.id, isSelected, isAnom);
      const customIcon = L.divIcon({
        html: markerDiv,
        className: 'station-pin-container',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([st.lat, st.lon], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        handleSelectStation(st.id);
      });

      markersMapRef.current[st.id] = marker;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker icons on selection / anomaly state change
  useEffect(() => {
    if (!mapRef.current) return;

    stationsData.forEach((st) => {
      const marker = markersMapRef.current[st.id];
      if (marker) {
        const isSelected = st.id === selectedStationId;
        const iconHtml = createMarkerElement(st.id, isSelected, st.isAnomaly);
        marker.setIcon(
          L.divIcon({
            html: iconHtml,
            className: 'station-pin-container',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          })
        );
      }
    });
  }, [stationsData, selectedStationId]);

  function createMarkerElement(id, isSelected, isAnomaly) {
    const bgColor = isAnomaly ? '#dc2626' : '#16a34a';
    const ringClass = isAnomaly ? 'animate-ping' : '';
    const selectedRing = isSelected ? 'box-shadow: 0 0 0 4px #0284c7, 0 4px 12px rgba(0,0,0,0.35);' : 'box-shadow: 0 2px 6px rgba(0,0,0,0.3);';

    return `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        ${isAnomaly ? `<div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: #dc2626; opacity: 0.6;" class="${ringClass}"></div>` : ''}
        <div style="
          width: 18px; 
          height: 18px; 
          border-radius: 50%; 
          background-color: ${bgColor}; 
          border: 2.5px solid #ffffff; 
          ${selectedRing}
          transition: transform 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${isSelected ? '<div style="width: 5px; height: 5px; border-radius: 50%; background: #ffffff;"></div>' : ''}
        </div>
      </div>
    `;
  }

  const handleSelectStation = (id) => {
    setSelectedStationId(id);
    if (onStationChange) {
      onStationChange(id);
    }
    const target = stationsData.find((s) => s.id === id);
    if (target && mapRef.current) {
      mapRef.current.flyTo([target.lat, target.lon], 9, {
        duration: 0.8,
        easeLinearity: 0.5,
      });
    }
  };

  const handleResetMap = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([13.60, 76.00], 7, { duration: 0.8 });
    }
  };

  const handleRefreshFleet = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshedAt(new Date().toLocaleTimeString());
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6 pb-12 w-full animate-fadeIn">
      {/* 1. Header & Quick Fleet Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 rounded-lg border border-sky-100 dark:border-sky-800">
              <Radio className="w-5 h-5 animate-pulse text-sky-600 dark:text-sky-400" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                Karnataka Weather Station Fleet
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {fleetMetrics.online}/{fleetMetrics.total} Online
                </span>
              </h1>
              <p className="text-[0.84rem] text-slate-500 dark:text-slate-400 mt-0.5">
                Continuous weather monitoring across Karnataka with real-time sensor health tracking and instant anomaly alerts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshFleet}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition border border-slate-200 shadow-xs active:scale-95 cursor-pointer"
            title="Refresh Fleet Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => onNavigateToLive && onNavigateToLive()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>View Live Telemetry Stream</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Fleet KPI Banners */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Fleet Stations */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Network Grid</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">5 Stations</div>
            <div className="text-[0.75rem] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% active coverage
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-100 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Server className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Fleet Health Index */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Health</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{fleetMetrics.fleetHealth}%</div>
            <div className="text-[0.75rem] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> All Checks Passed
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Regional Climate Mean */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">State Average</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{fleetMetrics.avgTemp} °C</div>
            <div className="text-[0.75rem] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
              <span>RH: {fleetMetrics.avgHum}%</span>
              <span>•</span>
              <span>{fleetMetrics.avgPress} hPa</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Thermometer className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Flagged Anomalies */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Alerts</span>
            <div className={`text-2xl font-black mt-1 ${fleetMetrics.alerts > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
              {fleetMetrics.alerts} {fleetMetrics.alerts === 1 ? 'Station' : 'Stations'}
            </div>
            <div className="text-[0.75rem] font-medium text-slate-500 dark:text-slate-400 mt-1">
              {fleetMetrics.alerts > 0 ? '⚠️ Attention on Mysuru (AWS-003)' : '✅ All stations healthy'}
            </div>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${fleetMetrics.alerts > 0 ? 'bg-red-50 dark:bg-red-950/70 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Split Section: Interactive Map + Fleet Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Lg: 7 cols): High-Def Map + Selected Station Deep-Dive */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Map Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            {/* Map Header Toolbar */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Karnataka Stations Map</h3>
                <span className="text-[0.7rem] bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
                  Statewide Network
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetMap}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 px-2.5 py-1 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition shadow-2xs cursor-pointer"
                >
                  Reset View
                </button>
              </div>
            </div>

            {/* Map Container */}
            <div className="relative w-full h-[360px] bg-slate-100 dark:bg-slate-800">
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Map Floating Legend */}
              <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-md border border-slate-200/80 dark:border-slate-700 z-[500] text-xs flex flex-col gap-1.5">
                <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Legend</span>
                <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-[0_0_4px_#16a34a]" />
                  <span>Healthy Sensor</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_6px_#dc2626]" />
                  <span>Needs Attention</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 border border-white" />
                  <span>Selected: <b>{selectedStation.id}</b></span>
                </div>
              </div>

              {/* Station Quick Badge on Map */}
              <div className="absolute bottom-3 left-3 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg border border-slate-800 z-[500] text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span>Selected: <b>{selectedStation.name}</b> ({selectedStation.elevation})</span>
              </div>
            </div>
          </div>

          {/* Detailed Selected Station Inspector Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    {selectedStation.id}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedStation.name}</h2>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${selectedStation.isAnomaly ? 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'}`}>
                    {selectedStation.isAnomaly ? '⚠️ Needs Attention' : '🟢 Operational'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>📍 {selectedStation.location}</span>
                  <span>•</span>
                  <span>🌐 {selectedStation.coordinates}</span>
                  <span>•</span>
                  <span>⛰️ {selectedStation.elevation}</span>
                  <span>•</span>
                  <span>🏷️ {selectedStation.climateZone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => onNavigateToLive && onNavigateToLive()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg border border-sky-200 transition active:scale-95 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-sky-600" />
                  <span>Stream Sensor Telemetry</span>
                </button>
              </div>
            </div>

            {/* Anomaly Notice Banner if station has active fault */}
            {selectedStation.isAnomaly && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-red-900">Critical Quality Control Violation</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    {selectedStation.anomalyDetail || 'Observed telemetry exceeds standard WMO rate-of-change and neural manifold reconstruction bounds.'}
                  </p>
                </div>
              </div>
            )}

            {/* Live Sensor Readouts Grid (6 Sensors) */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                Live Meteorological Transducers Bank
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* 1. Air Temperature */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="flex items-center gap-1 font-medium">
                      <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Temperature
                    </span>
                    <span className="text-[0.68rem] font-mono text-slate-400">Pt100 RTD</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {selectedStation.readings.temp.toFixed(1)} <span className="text-sm font-semibold text-slate-500">°C</span>
                  </div>
                  <div className="text-[0.7rem] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>Dew Point: {selectedStation.readings.dewPoint.toFixed(1)}°C</span>
                    <span className="text-emerald-600 font-bold text-[0.65rem]">PASS</span>
                  </div>
                </div>

                {/* 2. Relative Humidity */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="flex items-center gap-1 font-medium">
                      <Droplets className="w-3.5 h-3.5 text-sky-500" /> Humidity
                    </span>
                    <span className="text-[0.68rem] font-mono text-slate-400">HUMICAP</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {Math.round(selectedStation.readings.humidity)} <span className="text-sm font-semibold text-slate-500">%</span>
                  </div>
                  <div className="text-[0.7rem] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>Vapor Pressure: 2.8 kPa</span>
                    <span className="text-emerald-600 font-bold text-[0.65rem]">PASS</span>
                  </div>
                </div>

                {/* 3. Barometric Pressure */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="flex items-center gap-1 font-medium">
                      <Gauge className="w-3.5 h-3.5 text-indigo-500" /> Pressure
                    </span>
                    <span className="text-[0.68rem] font-mono text-slate-400">Piezoresistive</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {selectedStation.readings.pressure.toFixed(1)} <span className="text-sm font-semibold text-slate-500">hPa</span>
                  </div>
                  <div className="text-[0.7rem] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>Station QFE / QFF Sync</span>
                    <span className="text-emerald-600 font-bold text-[0.65rem]">PASS</span>
                  </div>
                </div>

                {/* 4. Wind Speed & Vector */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="flex items-center gap-1 font-medium">
                      <Wind className="w-3.5 h-3.5 text-teal-500" /> Wind Vector
                    </span>
                    <span className="text-[0.68rem] font-mono text-slate-400">Ultrasonic</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {(selectedStation.readings.windSpeed * 3.6).toFixed(1)} <span className="text-sm font-semibold text-slate-500">km/h</span>
                  </div>
                  <div className="text-[0.7rem] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>{getWindCompass(selectedStation.readings.windDir)} ({selectedStation.readings.windDir}°)</span>
                    <span className="text-emerald-600 font-bold text-[0.65rem]">PASS</span>
                  </div>
                </div>

                {/* 5. Solar Pyranometer */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="flex items-center gap-1 font-medium">
                      <Sun className="w-3.5 h-3.5 text-amber-500" /> Solar Irradiance
                    </span>
                    <span className="text-[0.68rem] font-mono text-slate-400">GHI CMP11</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {Math.round(selectedStation.readings.solar)} <span className="text-sm font-semibold text-slate-500">W/m²</span>
                  </div>
                  <div className="text-[0.7rem] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>Diurnal Model Curve</span>
                    <span className="text-emerald-600 font-bold text-[0.65rem]">PASS</span>
                  </div>
                </div>

                {/* 6. Precipitation & Power */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span className="flex items-center gap-1 font-medium">
                      <CloudRain className="w-3.5 h-3.5 text-blue-500" /> Precipitation
                    </span>
                    <span className="text-[0.68rem] font-mono text-slate-400">Tipping</span>
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {selectedStation.readings.rain.toFixed(1)} <span className="text-sm font-semibold text-slate-500">mm/h</span>
                  </div>
                  <div className="text-[0.7rem] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>Battery: {selectedStation.readings.battery.toFixed(1)}V</span>
                    <span className="text-emerald-600 font-bold text-[0.65rem]">NORMAL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Station Hardware & Telemetry Specifications Breakdown */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[0.7rem]">Transducer Hardware Inventory</span>
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1.5 font-mono text-[0.75rem]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Logger:</span>
                    <span className="text-slate-800 font-semibold">{selectedStation.hardware.logger}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sensors:</span>
                    <span className="text-slate-800 font-semibold">{selectedStation.hardware.tempHumSensor.split('(')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Power:</span>
                    <span className="text-slate-800 font-semibold">{selectedStation.hardware.solarBattery}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[0.7rem]">Telemetry Link & Diagnostics</span>
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1.5 font-mono text-[0.75rem]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Link Type:</span>
                    <span className="text-slate-800 font-semibold">{selectedStation.hardware.telemetryLink}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uptime:</span>
                    <span className="text-emerald-700 font-semibold">{selectedStation.specs.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Signal / Ping:</span>
                    <span className="text-slate-800 font-semibold">{selectedStation.specs.signalDbm} ({selectedStation.specs.commLatency})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Lg: 5 cols): Station Fleet Directory List */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Search & Filter Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Monitored Stations Directory
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-mono">
                {filteredStations.length} of {stationsData.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by station name, ID, or zone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs font-medium">
              {[
                { id: 'ALL', label: 'All (5)' },
                { id: 'NORMAL', label: 'Operational (4)' },
                { id: 'ALERT', label: 'Alert (1)' },
                { id: 'COASTAL', label: 'Coastal' },
                { id: 'HIGHLAND', label: 'Highland' },
                { id: 'INLAND', label: 'Inland' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterZone(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[0.72rem] transition font-medium cursor-pointer ${filterZone === f.id ? 'bg-sky-600 text-white shadow-xs font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fleet Station Cards Stack */}
          <div className="flex flex-col gap-3">
            {filteredStations.map((st) => {
              const isSelected = st.id === selectedStationId;

              return (
                <div
                  key={st.id}
                  onClick={() => handleSelectStation(st.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 relative ${
                    isSelected
                      ? 'border-sky-500 shadow-md ring-2 ring-sky-500/20 bg-gradient-to-r from-sky-50/30 to-white dark:from-sky-950/40 dark:to-slate-900'
                      : 'border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                  }`}
                >
                  {/* Top Row: Station ID, Name, Status Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-100/70 dark:bg-sky-950 px-1.5 py-0.5 rounded">
                          {st.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{st.name}</h4>
                      </div>
                      <p className="text-[0.75rem] text-slate-500 dark:text-slate-400 mt-0.5">
                        📍 {st.location} • <span className="font-medium text-slate-600 dark:text-slate-300">{st.elevation}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${st.isAnomaly ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <span className={`text-[0.7rem] font-bold px-2 py-0.5 rounded-full border ${st.isAnomaly ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {st.status}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Metrics Snippet */}
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                    <div className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-[0.65rem] text-slate-400 uppercase font-semibold block">Temp</span>
                      <span className="text-xs font-extrabold text-slate-800">{st.readings.temp.toFixed(1)}°C</span>
                    </div>
                    <div className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-[0.65rem] text-slate-400 uppercase font-semibold block">Humidity</span>
                      <span className="text-xs font-extrabold text-slate-800">{Math.round(st.readings.humidity)}%</span>
                    </div>
                    <div className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-[0.65rem] text-slate-400 uppercase font-semibold block">Pressure</span>
                      <span className="text-xs font-extrabold text-slate-800">{Math.round(st.readings.pressure)}</span>
                    </div>
                    <div className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
                      <span className="text-[0.65rem] text-slate-400 uppercase font-semibold block">Wind</span>
                      <span className="text-xs font-extrabold text-slate-800">{(st.readings.windSpeed * 3.6).toFixed(0)}k</span>
                    </div>
                  </div>

                  {/* Card Bottom: Health Bar & Select Action */}
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                      <span className="text-[0.68rem] text-slate-400 font-semibold">QC Health</span>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${st.isAnomaly ? 'bg-red-500 w-[78%]' : 'bg-emerald-500 w-[99%]'}`}
                        />
                      </div>
                      <span className="text-[0.7rem] font-bold text-slate-600">{st.healthScore}%</span>
                    </div>

                    <span className="text-[0.75rem] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5">
                      {isSelected ? 'Currently Inspected' : 'Inspect Station'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Cross-Station Comparative Telemetry Matrix (Fills lower section) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              Regional Stations Comparative Telemetry Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live multi-node cross-comparison across thermodynamic invariants, elevation gradients, and WMO QC flags
            </p>
          </div>
          <span className="text-[0.72rem] text-slate-400 font-mono">
            Synced: {lastRefreshedAt}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 text-[0.7rem]">
              <tr>
                <th className="py-3 px-4">Station ID / Name</th>
                <th className="py-3 px-3">Elevation & Zone</th>
                <th className="py-3 px-3">Air Temp</th>
                <th className="py-3 px-3">Rel. Humidity</th>
                <th className="py-3 px-3">Pressure</th>
                <th className="py-3 px-3">Wind Speed / Dir</th>
                <th className="py-3 px-3">Solar GHI</th>
                <th className="py-3 px-3">WMO QC Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stationsData.map((st) => {
                const isSelected = st.id === selectedStationId;

                return (
                  <tr
                    key={st.id}
                    onClick={() => handleSelectStation(st.id)}
                    className={`hover:bg-slate-50/80 transition cursor-pointer ${isSelected ? 'bg-sky-50/40 font-medium' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: st.isAnomaly ? '#dc2626' : '#16a34a' }} />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {st.name}
                            {isSelected && <span className="text-[0.65rem] bg-sky-100 text-sky-700 px-1 rounded">Active</span>}
                          </div>
                          <div className="text-[0.7rem] text-slate-400 font-mono">{st.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{st.elevation}</div>
                      <div className="text-[0.7rem] text-slate-400">{st.climateZone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${st.isAnomaly ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded' : 'text-slate-800'}`}>
                        {st.readings.temp.toFixed(1)} °C
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-semibold">
                      {Math.round(st.readings.humidity)} %
                      <span className="text-[0.7rem] text-slate-400 block font-normal">Td: {st.readings.dewPoint.toFixed(1)}°C</span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-mono">
                      {st.readings.pressure.toFixed(1)} hPa
                    </td>
                    <td className="py-3 px-3 text-slate-800">
                      {(st.readings.windSpeed * 3.6).toFixed(1)} km/h
                      <span className="text-[0.7rem] text-slate-400 block">{getWindCompass(st.readings.windDir)} ({st.readings.windDir}°)</span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-mono">
                      {Math.round(st.readings.solar)} W/m²
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-bold border ${st.isAnomaly ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {st.isAnomaly ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectStation(st.id);
                          if (onNavigateToLive) onNavigateToLive();
                        }}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 transition cursor-pointer"
                      >
                        Live Stream
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
