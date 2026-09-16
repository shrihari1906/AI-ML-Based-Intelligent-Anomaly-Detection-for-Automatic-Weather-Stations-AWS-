import React, { useState, useEffect, useRef } from 'react';
import StitchHeader from './components/layout/StitchHeader';
import StitchSidebar from './components/layout/StitchSidebar';
import MainDashboardView from './components/views/MainDashboardView';
import NetworkView from './components/views/NetworkView';
import StationMapView from './components/views/StationMapView';
import FaultSandboxView from './components/views/FaultSandboxView';
import AlertsTableView from './components/views/AlertsTableView';

import { STATIONS, generateMockReadings, MOCK_ALERTS } from './data/mockData';
import { fetchStationReadings, fetchAlerts, postReading } from './services/api';

export default function App() {
  // Theme state: 'dark' | 'light' (defaults to dark)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aws_sentinel_theme') || 'dark';
  });

  // Sidebar state: 'expanded' | 'collapsed' | 'closed' (controlled via 3-button options & hamburger)
  const [sidebarState, setSidebarState] = useState(() => {
    return localStorage.getItem('aws_sentinel_sidebar') || 'expanded';
  });

  useEffect(() => {
    localStorage.setItem('aws_sentinel_sidebar', sidebarState);
  }, [sidebarState]);

  // Active view: 'main-dashboard' | 'network-view' | 'station-map' | 'fault-sandbox' | 'alerts-table'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) return tabParam;
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    return 'main-dashboard';
  });
  const [selectedStation, setSelectedStation] = useState('AWS_001');

  // Seeded state for instant rich display
  const [stations, setStations] = useState(STATIONS);
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  // Cache readings per station
  const [readingsMap, setReadingsMap] = useState(() => {
    const map = {};
    STATIONS.forEach((st) => {
      map[st.id] = generateMockReadings(st.id);
    });
    return map;
  });

  const currentReadings = readingsMap[selectedStation] || [];

  // Synchronize activeTab with URL search params
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState(null, '', url.toString());
  }, [activeTab]);

  // Synchronize theme with <html> class and localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('aws_sentinel_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Background polling for live backend data
  const pollTimerRef = useRef(null);
  useEffect(() => {
    const poll = async () => {
      try {
        const liveReadings = await fetchStationReadings(selectedStation);
        if (liveReadings && liveReadings.length > 0) {
          setReadingsMap((prev) => ({
            ...prev,
            [selectedStation]: liveReadings,
          }));

          const latest = liveReadings[liveReadings.length - 1];
          setStations((prev) =>
            prev.map((s) => {
              if (s.id !== selectedStation) return s;
              // If backend provides an explicit is_anomaly boolean, respect it; otherwise preserve known status
              const hasExplicitAnomaly = typeof latest.is_anomaly === 'boolean';
              const nextStatus = hasExplicitAnomaly
                ? (latest.is_anomaly ? 'anomaly' : 'normal')
                : s.status;
              return {
                ...s,
                status: nextStatus,
                latestReading: {
                  ...s.latestReading,
                  ...latest,
                  anomaly: latest.anomaly || s.latestReading?.anomaly,
                },
              };
            })
          );
        }

        const liveAlerts = await fetchAlerts();
        if (liveAlerts && liveAlerts.length > 0) {
          setAlerts(liveAlerts);
        }
      } catch {
        // Backend offline, nominal mock fallback active
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, 2500);
    return () => clearInterval(pollTimerRef.current);
  }, [selectedStation]);

  // Handle postReading from Fault Sandbox
  const handleSendReading = async (payload) => {
    let backendRes = null;
    try {
      backendRes = await postReading(payload);
    } catch (err) {
      console.warn('Backend /api/reading call failed, using client fallback:', err.message);
    }

    if (backendRes) {
      const isAnomaly = backendRes.anomaly?.is_anomaly ?? false;
      const score = backendRes.anomaly?.score ?? 0.0;
      const reason = backendRes.anomaly?.reason ?? 'normal';

      const newReading = {
        id: backendRes.id || Date.now(),
        station_id: backendRes.station_id,
        timestamp: backendRes.timestamp || new Date().toISOString(),
        displayTime: new Date().toLocaleTimeString(),
        temperature: backendRes.temperature,
        humidity: backendRes.humidity,
        pressure: backendRes.pressure,
        wind_speed: backendRes.wind_speed,
        is_anomaly: isAnomaly,
        score,
        reason,
        anomaly: backendRes.anomaly,
      };

      setReadingsMap((prev) => {
        const existing = prev[payload.station_id] || [];
        const updated = [...existing, newReading];
        if (updated.length > 50) updated.shift();
        return {
          ...prev,
          [payload.station_id]: updated,
        };
      });

      setStations((prev) =>
        prev.map((st) => {
          if (st.id === payload.station_id) {
            return {
              ...st,
              status: isAnomaly ? 'anomaly' : st.status,
              latestReading: newReading,
            };
          }
          return st;
        })
      );

      if (isAnomaly) {
        setAlerts((prev) => [
          {
            id: Date.now(),
            station_id: payload.station_id,
            timestamp: newReading.timestamp,
            is_anomaly: true,
            score,
            reason,
          },
          ...prev,
        ]);
      }

      return backendRes;
    }

    // Client fallback if backend is temporarily offline
    const isAnomaly =
      payload.temperature > 45 ||
      payload.temperature < -10 ||
      payload.humidity <= 0 ||
      payload.wind_speed > 25 ||
      payload.pressure < 950 ||
      payload.pressure > 1050;

    let reason = 'normal';
    if (payload.temperature > 45) reason = `temperature out of range (${payload.temperature} °C)`;
    else if (payload.humidity <= 0) reason = `sensor dropout (humidity at ${payload.humidity}%)`;
    else if (payload.wind_speed > 25) reason = `wind speed spike (${payload.wind_speed} m/s)`;
    else if (payload.pressure < 950 || payload.pressure > 1050)
      reason = `pressure out of range (${payload.pressure} hPa)`;

    const score = isAnomaly ? -0.185 : 0.145;

    const fallbackReading = {
      id: Date.now(),
      station_id: payload.station_id,
      timestamp: payload.timestamp || new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString(),
      temperature: payload.temperature,
      humidity: payload.humidity,
      pressure: payload.pressure,
      wind_speed: payload.wind_speed,
      is_anomaly: isAnomaly,
      score,
      reason,
      anomaly: {
        is_anomaly: isAnomaly,
        score,
        reason,
      },
    };

    setReadingsMap((prev) => {
      const existing = prev[payload.station_id] || [];
      const updated = [...existing, fallbackReading];
      if (updated.length > 50) updated.shift();
      return {
        ...prev,
        [payload.station_id]: updated,
      };
    });

    setStations((prev) =>
      prev.map((st) => {
        if (st.id === payload.station_id) {
          return {
            ...st,
            status: isAnomaly ? 'anomaly' : 'normal',
            latestReading: fallbackReading,
          };
        }
        return st;
      })
    );

    if (isAnomaly) {
      setAlerts((prev) => [
        {
          id: Date.now(),
          station_id: payload.station_id,
          timestamp: fallbackReading.timestamp,
          is_anomaly: true,
          score,
          reason,
        },
        ...prev,
      ]);
    }

    return fallbackReading;
  };

  return (
    <div className={`font-sans antialiased min-h-screen relative transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#14161C] text-[#F2F3F5]' : 'bg-[#EEF2F7] text-[#0F172A]'
    }`}>
      {/* Top Header */}
      <StitchHeader
        activeTab={activeTab}
        theme={theme}
        toggleTheme={toggleTheme}
        sidebarState={sidebarState}
        setSidebarState={setSidebarState}
        selectedStation={selectedStation}
        setSelectedStation={setSelectedStation}
        stations={stations}
      />

      {/* Operational Navigation Sidebar with 3-Button Controls */}
      <StitchSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarState={sidebarState}
        setSidebarState={setSidebarState}
      />

      {/* Main Content Area - Transitions smoothly between Expanded, Compact, and Full-Width Closed */}
      <div
        className={`relative z-10 w-full transition-all duration-300 ease-in-out ${
          sidebarState === 'expanded'
            ? 'xl:pl-64'
            : sidebarState === 'collapsed'
            ? 'xl:pl-16'
            : 'pl-0'
        }`}
      >
        <main className="w-full pt-16 min-h-screen px-3 sm:px-5 lg:px-7 pb-8 max-w-[1920px] mx-auto">
          {activeTab === 'main-dashboard' && (
            <MainDashboardView
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              stations={stations}
              readings={currentReadings}
              alerts={alerts}
            />
          )}

          {activeTab === 'network-view' && (
            <NetworkView
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              setActiveTab={setActiveTab}
              stations={stations}
              readings={currentReadings}
            />
          )}

          {activeTab === 'station-map' && (
            <StationMapView
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              setActiveTab={setActiveTab}
              stations={stations}
              readings={currentReadings}
              theme={theme}
            />
          )}

          {activeTab === 'fault-sandbox' && (
            <FaultSandboxView
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              stations={stations}
              onSendReading={handleSendReading}
            />
          )}

          {activeTab === 'alerts-table' && (
            <AlertsTableView
              alerts={alerts}
              stations={stations}
              setSelectedStation={setSelectedStation}
              setActiveTab={setActiveTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}
