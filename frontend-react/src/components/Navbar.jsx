import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  User as UserIcon,
  LogIn,
  LogOut,
  Sun,
  Moon,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  X,
  ExternalLink,
  Shield,
  Zap
} from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Navbar({
  user,
  onOpenAuth,
  onLogout,
  theme = 'light',
  onToggleTheme,
  onNavigateToTab
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const notifications = [
    {
      id: 'n1',
      station: 'AWS-003',
      sensor: 'Temperature',
      text: 'Step jump (+13.3°C / 1-min) flagged by WMO rate-of-change.',
      time: '12m ago',
      severity: 'CRITICAL',
    },
    {
      id: 'n2',
      station: 'AWS-001',
      sensor: 'Humidity',
      text: 'Sensor persistence lockup (flatline 82.5% for 45 steps).',
      time: '48m ago',
      severity: 'WARNING',
    },
    {
      id: 'n3',
      station: 'AWS-002',
      sensor: 'Wind Speed',
      text: 'Impulse gust spike (76.1 km/h) filtered by Hampel MAD.',
      time: '2h ago',
      severity: 'SUSPECT',
    },
  ];

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[64px] bg-[#0f172a] text-white flex items-center justify-between px-5 sm:px-6 sticky top-0 z-50 shadow-md border-b border-slate-800">
      {/* 1. Brand Logo & Title */}
      <div className="flex items-center gap-3.5">
        <BrandLogo size={38} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[1.25rem] font-extrabold tracking-tight text-white leading-tight">
              Clima<span className="text-sky-400 font-black">Sense</span>
            </span>
            <span className="text-[0.62rem] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 hidden sm:inline-block">
              AWS AI/ML
            </span>
          </div>
          <span className="text-[0.72rem] text-slate-400 font-normal truncate max-w-[280px] sm:max-w-none">
            Climate + intelligent sensing
          </span>
        </div>
      </div>

      {/* 2. Right Controls: Theme Toggle, Notifications, User */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition shadow-2xs active:scale-95 cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-fadeIn" />
          ) : (
            <Moon className="w-4 h-4 text-sky-300 animate-fadeIn" />
          )}
        </button>

        {/* Notification Bell with Dropdown Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition shadow-2xs active:scale-95 cursor-pointer"
            title={`${unreadCount} New Anomaly Alerts`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[0.62rem] font-black w-[17px] h-[17px] rounded-full flex items-center justify-center border-2 border-[#0f172a] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Interactive Notifications Popover Drawer */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[600] animate-fadeIn">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Active Anomaly Alerts</span>
                  <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                    {unreadCount} New
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setUnreadCount(0)}
                    className="text-[0.7rem] text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      if (onNavigateToTab) onNavigateToTab('anomalies');
                    }}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex items-start gap-2.5"
                  >
                    <span className="mt-0.5 shrink-0">
                      {n.severity === 'CRITICAL' ? (
                        <AlertOctagon className="w-4 h-4 text-red-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[0.7rem] font-bold text-slate-900 dark:text-white">
                          {n.station} • {n.sensor}
                        </span>
                        <span className="text-[0.65rem] text-slate-400 font-mono">{n.time}</span>
                      </div>
                      <p className="text-[0.75rem] text-slate-600 dark:text-slate-300 leading-snug mt-0.5">
                        {n.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    if (onNavigateToTab) onNavigateToTab('anomalies');
                  }}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center justify-center gap-1 w-full cursor-pointer"
                >
                  <span>Open Anomaly Diagnostic Sandbox</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Auth Button */}
        {user ? (
          <div className="relative" ref={userRef}>
            <div
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 text-xs font-medium text-white px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition cursor-pointer"
              title="Operator Profile"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 text-slate-900 flex items-center justify-center font-black text-xs shadow-inner">
                {user.full_name ? user.full_name[0].toUpperCase() : 'A'}
              </div>
              <span className="hidden sm:inline-block font-semibold">
                {user.full_name || user.username || 'Abhishek'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[600] animate-fadeIn p-2">
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {user.full_name || 'Abhishek'}
                  </div>
                  <div className="text-[0.7rem] text-slate-400 font-mono">@{user.username || 'abhishek'}</div>
                  <span className="inline-block mt-1 text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                    {user.role ? user.role.toUpperCase() : 'ADMIN OPERATOR'}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onNavigateToTab) onNavigateToTab('settings');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5 text-sky-500" />
                    <span>System Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onNavigateToTab) onNavigateToTab('live-data');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer flex items-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Live Telemetry</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer flex items-center gap-2 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2 rounded-xl transition shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
