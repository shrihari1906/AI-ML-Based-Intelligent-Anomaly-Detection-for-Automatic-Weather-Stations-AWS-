import React from 'react';

export default function StitchSidebar({
  activeTab,
  setActiveTab,
  sidebarState = 'expanded',
  setSidebarState,
}) {
  const navItems = [
    {
      path: 'main-dashboard',
      label: 'Main Dashboard',
      sublabel: 'Live Telemetry & Diagnostics',
      icon: 'grid_view',
    },
    {
      path: 'network-view',
      label: 'Network Mesh',
      sublabel: '5-Station Topology & Health',
      icon: 'hub',
    },
    {
      path: 'station-map',
      label: 'Isobar Map',
      sublabel: 'Spatial Radar & GIS Contours',
      icon: 'map',
    },
    {
      path: 'fault-sandbox',
      label: 'Fault Sandbox',
      sublabel: 'ML Anomaly Stress Testing',
      icon: 'science',
    },
    {
      path: 'alerts-table',
      label: 'Alerts & Incidents',
      sublabel: 'Triage & Historical Log',
      icon: 'warning',
    },
  ];

  const isClosed = sidebarState === 'closed';
  const isCollapsed = sidebarState === 'collapsed';
  const isExpanded = sidebarState === 'expanded';

  return (
    <>
      {/* Backdrop for Mobile / Tablet when sidebar is open */}
      {!isClosed && (
        <div
          onClick={() => setSidebarState('closed')}
          className="fixed inset-0 bg-black/50 z-30 xl:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed left-0 top-14 bottom-0 bg-surface-container-low border-r border-outline-variant z-40 flex flex-col justify-between transition-all duration-300 ease-in-out select-none ${
          isClosed
            ? '-translate-x-full w-64'
            : isCollapsed
            ? 'translate-x-0 w-16'
            : 'translate-x-0 w-64'
        }`}
      >
        {/* Top Header & 3-Button Control Suite */}
        <div className="flex flex-col">
          <div className="p-3 border-b border-outline-variant flex items-center justify-between gap-2 bg-surface-container/50">
            {/* 3 Buttons Option to Control Sidebar State */}
            <div className="flex items-center gap-1.5" title="Sidebar State Controls">
              {/* Red Button: Close Sidebar */}
              <button
                onClick={() => setSidebarState('closed')}
                className={`w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group ${
                  isClosed ? 'ring-2 ring-[#FF5F56]/50' : ''
                }`}
                title="Close Sidebar (Full-Screen Mode)"
                aria-label="Close Sidebar"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black font-bold font-mono">✕</span>
              </button>

              {/* Yellow Button: Collapse to Compact Icons */}
              <button
                onClick={() => setSidebarState('collapsed')}
                className={`w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group ${
                  isCollapsed ? 'ring-2 ring-[#FFBD2E]/50' : ''
                }`}
                title="Compact Mode (Icons Only)"
                aria-label="Compact Mode"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black font-bold font-mono">−</span>
              </button>

              {/* Green Button: Full Expand */}
              <button
                onClick={() => setSidebarState('expanded')}
                className={`w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group ${
                  isExpanded ? 'ring-2 ring-[#27C93F]/50' : ''
                }`}
                title="Expand Sidebar (Full Navigation)"
                aria-label="Expand Sidebar"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black font-bold font-mono">+</span>
              </button>
            </div>

            {/* Header label in expanded mode */}
            {isExpanded && (
              <div className="flex items-center gap-1.5">
                <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider font-mono">
                  NAVIGATION
                </span>
                <span className="px-1 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-mono font-medium">
                  3-WAY
                </span>
              </div>
            )}

            {/* Quick close button on mobile */}
            <button
              onClick={() => setSidebarState('closed')}
              className="xl:hidden p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface"
              title="Close drawer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 flex flex-col gap-1.5 mt-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setActiveTab(item.path);
                    // On small screens, auto-close the drawer after selection
                    if (window.innerWidth < 1280) {
                      setSidebarState('closed');
                    }
                  }}
                  className={`group relative flex items-center rounded-lg transition-all text-left ${
                    isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-primary/15 text-primary font-semibold border-l-3 border-primary shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                  title={isCollapsed ? `${item.label} — ${item.sublabel}` : undefined}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                      isActive ? 'text-primary' : 'text-outline group-hover:text-primary'
                    }`}
                  >
                    {item.icon}
                  </span>

                  {/* Expanded Labels */}
                  {isExpanded && (
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-xs truncate leading-tight">
                        {item.label}
                      </span>
                      <span className="font-label-sm text-[10px] text-outline truncate leading-tight mt-0.5">
                        {item.sublabel}
                      </span>
                    </div>
                  )}

                  {/* Active Indicator Pip */}
                  {isActive && isExpanded && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
                  )}

                  {/* Collapsed Tooltip on Hover */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#1C1F28] text-white text-xs font-medium rounded-md shadow-xl border border-outline-variant opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Station Cluster & Mode Toggles */}
        <div className="p-2 border-t border-outline-variant flex flex-col gap-2">
          {isExpanded ? (
            <div className="p-2.5 rounded-md bg-surface-container border border-outline-variant flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-label-sm text-[10px] text-outline">
                <span className="tracking-wider uppercase">Cluster Status</span>
                <span className="text-[#6EC98F] font-mono font-medium">ONLINE (5/5)</span>
              </div>
              <div className="font-label-sm text-[11px] text-on-surface font-medium truncate">
                Karnataka AWS Grid
              </div>
              <div className="w-full bg-surface-container-lowest h-1 rounded overflow-hidden mt-0.5">
                <div className="bg-[#6EC98F] h-full w-[100%]" />
              </div>

              {/* 3 Quick Action State Switchers */}
              <div className="grid grid-cols-3 gap-1 mt-1 pt-1.5 border-t border-outline-variant">
                <button
                  onClick={() => setSidebarState('closed')}
                  className="py-1 rounded bg-surface-container-low hover:bg-surface-container-high text-[10px] font-mono text-outline hover:text-on-surface transition-colors text-center"
                  title="Close sidebar for full width"
                >
                  Hide
                </button>
                <button
                  onClick={() => setSidebarState('collapsed')}
                  className="py-1 rounded bg-surface-container-low hover:bg-surface-container-high text-[10px] font-mono text-outline hover:text-on-surface transition-colors text-center"
                  title="Compact icons view"
                >
                  Compact
                </button>
                <button
                  onClick={() => setSidebarState('expanded')}
                  className="py-1 rounded bg-primary/20 text-primary text-[10px] font-mono font-semibold transition-colors text-center"
                  title="Full expanded sidebar"
                >
                  Expand
                </button>
              </div>
            </div>
          ) : isCollapsed ? (
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setSidebarState('expanded')}
                className="w-10 h-10 rounded-lg hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-all"
                title="Expand Sidebar"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
