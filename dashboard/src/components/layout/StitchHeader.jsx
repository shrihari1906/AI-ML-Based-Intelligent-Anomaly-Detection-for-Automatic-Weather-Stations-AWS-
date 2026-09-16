import React, { useState, useEffect } from 'react';

export default function StitchHeader({
  activeTab,
  theme = 'dark',
  toggleTheme,
  sidebarState = 'expanded',
  setSidebarState,
  selectedStation = 'AWS_001',
  setSelectedStation,
  stations = [],
}) {
  const [utcTime, setUtcTime] = useState('');
  const [istTime, setIstTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25));
      setIstTime(now.toLocaleTimeString('en-US', { hour12: false, timeZone: 'Asia/Kolkata' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabLabels = {
    'main-dashboard': { label: 'Main Dashboard', icon: 'grid_view' },
    'network-view': { label: 'Network Mesh Topology', icon: 'hub' },
    'station-map': { label: 'Spatial Isobar & Radar Map', icon: 'map' },
    'fault-sandbox': { label: 'Fault Injection & Diagnostic Sandbox', icon: 'science' },
    'alerts-table': { label: 'Alerts & System Incident Log', icon: 'warning' },
  };

  const currentView = tabLabels[activeTab] || { label: 'Weather Dashboard', icon: 'grid_view' };
  const isClosed = sidebarState === 'closed';
  const isCollapsed = sidebarState === 'collapsed';
  const isExpanded = sidebarState === 'expanded';

  // Toggle helper for 3-line hamburger button: if open, close; if closed, expand
  const toggleSidebar = () => {
    if (isClosed) {
      setSidebarState('expanded');
    } else {
      setSidebarState('closed');
    }
  };

  const currentStation = stations.find((s) => s.id === selectedStation);
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
  const activeStationSeverity = getStationSeverity(currentStation);
  const isCurrentStationAnomaly = activeStationSeverity.level !== 'CLEAR';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-200 bg-surface-container border-b border-outline-variant select-none">
      <div className="h-14 w-full px-3 sm:px-4 flex items-center justify-between gap-3">
        {/* Left: 3-Buttons Option + Hamburger Toggle + App Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Three Buttons Options: Red (Close), Yellow (Compact), Green (Expand) */}
          <div
            className="flex items-center gap-1.5 p-1 rounded-md bg-surface-container-low border border-outline-variant/60"
            title="Sidebar Controls: Red = Close, Yellow = Compact Icons, Green = Expand"
          >
            {/* Red Button: Close/Hide Sidebar */}
            <button
              onClick={() => setSidebarState('closed')}
              className={`w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/60 hover:scale-125 active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                isClosed ? 'ring-2 ring-[#FF5F56]/60 scale-110' : 'opacity-85 hover:opacity-100'
              }`}
              title="Close Sidebar (Hide)"
              aria-label="Close Sidebar"
            />
            {/* Yellow Button: Compact Rail Mode */}
            <button
              onClick={() => setSidebarState('collapsed')}
              className={`w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/60 hover:scale-125 active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                isCollapsed ? 'ring-2 ring-[#FFBD2E]/60 scale-110' : 'opacity-85 hover:opacity-100'
              }`}
              title="Compact Sidebar (Icons Only)"
              aria-label="Compact Sidebar"
            />
            {/* Green Button: Expand Sidebar */}
            <button
              onClick={() => setSidebarState('expanded')}
              className={`w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/60 hover:scale-125 active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
                isExpanded ? 'ring-2 ring-[#27C93F]/60 scale-110' : 'opacity-85 hover:opacity-100'
              }`}
              title="Expand Sidebar (Full Navigation)"
              aria-label="Expand Sidebar"
            />
          </div>

          {/* Three-Lines Hamburger Menu Button */}
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border transition-all cursor-pointer ${
              isClosed
                ? 'bg-surface-container-low text-outline hover:text-on-surface border-outline-variant hover:border-primary/50'
                : 'bg-primary/15 text-primary border-primary/40 font-medium'
            }`}
            title={isClosed ? 'Open Sidebar (☰)' : 'Close Sidebar (☰)'}
            aria-label="Toggle Sidebar Menu"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isClosed ? 'menu' : 'menu_open'}
            </span>
            <span className="text-[11px] font-mono hidden sm:inline">
              {isClosed ? 'MENU' : 'NAV'}
            </span>
          </button>

          {/* App Logo & Branding */}
          <div className="flex items-center gap-2 pl-1 border-l border-outline-variant">
            <div className="h-7 w-7 rounded bg-primary flex items-center justify-center text-white font-bold shadow-xs">
              <span className="material-symbols-outlined text-[18px]">air</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-sm font-semibold tracking-tight text-on-surface">
                  AWS Sentinel
                </span>
                <span className="px-1 py-0.2 rounded border border-outline-variant bg-surface-container-lowest font-label-sm text-[10px] text-primary font-mono">
                  KA-SYS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Clean Active Operational View Breadcrumb (Top bar options removed) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-surface-container-lowest border border-outline-variant/80">
          <span className="material-symbols-outlined text-[16px] text-primary">
            {currentView.icon}
          </span>
          <span className="font-label-md text-xs font-medium text-on-surface">
            {currentView.label}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>

        {/* Right Status Suite & Dark/Light Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Selected Station Status Indicator Dot & Label */}
          <div
            id="navbar-station-status"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low border border-outline-variant cursor-default"
            title={`Active Station: ${currentStation?.name || selectedStation} (${activeStationSeverity.label})`}
          >
            <span
              id="navbar-station-dot"
              className={`w-2 h-2 rounded-full shrink-0 ${isCurrentStationAnomaly ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: activeStationSeverity.color }}
            />
            <span
              className="font-label-sm text-[11px] font-mono font-semibold"
              style={{ color: activeStationSeverity.color }}
            >
              {selectedStation} {activeStationSeverity.label}
            </span>
          </div>

          {/* Station Online Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low border border-outline-variant">
            <span className="w-2 h-2 rounded-full bg-[#6EC98F] animate-pulse" />
            <span className="font-label-sm text-[11px] text-on-surface font-medium">5 Nodes Live</span>
          </div>

          {/* ML Isolation Forest Status */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-low border border-outline-variant font-label-sm text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[14px]">psychology</span>
            <span>IForest v2.4</span>
          </div>

          {/* Clocks */}
          <div className="hidden xl:flex flex-col items-end px-1 font-label-sm text-[10px] text-outline font-mono leading-tight">
            <span>UTC {utcTime || '08:42:15'}</span>
            <span className="text-on-surface-variant font-medium">IST {istTime || '14:12:15'}</span>
          </div>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant transition-all shadow-xs cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="text-[11px] font-medium hidden sm:inline capitalize">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
