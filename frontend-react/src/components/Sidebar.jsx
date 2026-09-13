import React from 'react';
import {
  Home,
  BarChart2,
  Activity,
  AlertTriangle,
  MapPin,
  FileText,
  Settings,
  Radio,
  Wifi
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, badge: 'Live' },
  { id: 'live-data', label: 'Live Weather Data', icon: BarChart2 },
  { id: 'analytics', label: 'AI Health & Insights', icon: Activity },
  { id: 'anomalies', label: 'Sensor Test Sandbox', icon: AlertTriangle },
  { id: 'stations', label: 'Weather Stations', icon: MapPin },
  { id: 'reports', label: 'Health Reports', icon: FileText },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

const STATION_SHORT_NAMES = {
  'AWS_001': 'Bengaluru Urban',
  'AWS_002': 'Mangaluru Coastal',
  'AWS_003': 'Mysuru Central',
  'AWS_004': 'Madikeri Coorg',
  'AWS_005': 'Dharwad Inland',
  'AWS-001': 'Bengaluru Urban',
  'AWS-002': 'Mangaluru Coastal',
  'AWS-003': 'Mysuru Central',
  'AWS-004': 'Madikeri Coorg',
  'AWS-005': 'Dharwad Inland',
};

export default function Sidebar({ activeTab, onTabChange, isConnected = true, activeStationId = 'AWS_001' }) {
  const stationName = STATION_SHORT_NAMES[activeStationId] || activeStationId;

  return (
    <aside className="w-[230px] bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 flex-shrink-0 min-h-[calc(100vh-64px)] transition-colors duration-200">
      <nav className="flex flex-col gap-4">
        {/* Navigation Item List */}
        <ul className="flex flex-col gap-1 list-none m-0 p-0">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[0.62rem] font-bold px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Real-Time Telemetry Stream Status Badge */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[0.68rem]">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> Live Stream
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{stationName}</span>
            <span className="text-[0.68rem] text-slate-400 dark:text-slate-500 font-mono">{activeStationId} • Transmitting</span>
          </div>
        </div>
      </nav>

      {/* Footer Branding */}
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/50">
        <span className="text-sky-500 text-base">🌐</span>
        <div className="leading-tight text-[0.72rem]">
          <div className="font-bold text-slate-800 dark:text-slate-200">ClimaSense</div>
          <div className="text-[0.66rem] text-slate-400">Climate + intelligent sensing</div>
        </div>
      </div>
    </aside>
  );
}
