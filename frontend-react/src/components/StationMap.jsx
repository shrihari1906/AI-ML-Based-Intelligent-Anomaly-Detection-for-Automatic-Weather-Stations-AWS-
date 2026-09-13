import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

export default function StationMap({ activeStationId, isAnomalyActive }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Center map around Karnataka
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([13.60, 76.00], 7);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const stationCoords = [
      { id: 'AWS_001', name: 'Bengaluru Urban', region: 'Deccan Plateau', lat: 12.9716, lon: 77.5946, isAnomaly: false },
      { id: 'AWS_002', name: 'Mangaluru Coastal', region: 'Arabian Sea Coast', lat: 12.9141, lon: 74.8560, isAnomaly: false },
      { id: 'AWS_003', name: 'Mysuru Central', region: 'Southern Plains', lat: 12.2958, lon: 76.6394, isAnomaly: true },
      { id: 'AWS_004', name: 'Madikeri Coorg', region: 'Western Ghats Hills', lat: 12.4244, lon: 75.7382, isAnomaly: false },
      { id: 'AWS_005', name: 'Dharwad Inland', region: 'Northern Basin', lat: 15.4589, lon: 75.0078, isAnomaly: false },
    ];

    stationCoords.forEach((st) => {
      const iconHtml = `<div class="custom-pin ${st.isAnomaly ? 'pin-anomaly' : 'pin-normal'}"></div>`;
      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'station-marker-div',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([st.lat, st.lon], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 2px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${st.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">${st.region} • ${st.id}</div>
          <div style="font-size: 11px; font-weight: 600; color: ${st.isAnomaly ? '#dc2626' : '#16a34a'};">
            ${st.isAnomaly ? '⚠️ Sensor Alert Detected' : '✅ All Sensors Healthy'}
          </div>
        </div>
      `);
      markersRef.current[st.id] = { marker, data: st };
    });

    mapInstance.current = map;
  }, []);

  useEffect(() => {
    if (markersRef.current[activeStationId]) {
      const item = markersRef.current[activeStationId];
      const isAnom = isAnomalyActive || item.data.id === 'AWS_003';
      const iconHtml = `<div class="custom-pin ${isAnom ? 'pin-anomaly' : 'pin-normal'}"></div>`;
      item.marker.setIcon(
        L.divIcon({
          html: iconHtml,
          className: 'station-marker-div',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })
      );
    }
  }, [activeStationId, isAnomalyActive]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              Karnataka Station Network
            </h3>
            <p className="text-[0.72rem] text-slate-500 dark:text-slate-400">
              5 regional stations monitoring weather & sensor health
            </p>
          </div>
        </div>

        <span className="text-[0.68rem] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/70 px-2.5 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-800">
          Statewide Grid
        </span>
      </div>

      <div className="relative w-full h-[220px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div ref={mapRef} className="w-full h-full" />

        {/* Legend Overlay */}
        <div className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md flex flex-col gap-1.5 text-xs font-semibold z-[500] border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span className="text-[0.72rem] text-slate-700 dark:text-slate-200">Healthy Sensor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
            <span className="text-[0.72rem] text-slate-700 dark:text-slate-200">Needs Attention</span>
          </div>
        </div>
      </div>
    </div>
  );
}
