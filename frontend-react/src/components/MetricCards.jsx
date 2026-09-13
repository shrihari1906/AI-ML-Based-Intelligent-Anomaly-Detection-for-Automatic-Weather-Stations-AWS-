import React from 'react';
import { Thermometer, Droplets, Gauge, Wind } from 'lucide-react';

export default function MetricCards({ telemetry, statusFlags }) {
  const getTempDescriptor = (t, isAnom) => {
    if (isAnom) return 'Unusual temperature spike';
    if (t < 18) return 'Cool & crisp air';
    if (t <= 32) return 'Comfortable & pleasant';
    return 'Warm conditions';
  };

  const getHumDescriptor = (h, isAnom) => {
    if (isAnom) return 'Moisture reading irregularity';
    if (h < 30) return 'Dry atmospheric air';
    if (h <= 70) return 'Ideal comfortable moisture';
    return 'High humidity / sticky';
  };

  const getPressDescriptor = (p, isAnom) => {
    if (isAnom) return 'Abrupt barometric shift';
    if (p < 1000) return 'Low pressure (rain likely)';
    if (p <= 1018) return 'Stable fair weather';
    return 'High pressure (clear skies)';
  };

  const getWindDescriptor = (w, isAnom) => {
    if (isAnom) return 'Irregular gust signature';
    const kmh = w * 3.6;
    if (kmh < 5) return 'Calm / light air';
    if (kmh < 25) return 'Gentle, pleasant breeze';
    if (kmh < 45) return 'Moderate wind';
    return 'Strong windy gusts';
  };

  const tempVal = telemetry.temperature !== undefined ? telemetry.temperature : 28.4;
  const humVal = telemetry.humidity !== undefined ? telemetry.humidity : 65;
  const pressVal = telemetry.pressure !== undefined ? telemetry.pressure : 1012;
  const windVal = telemetry.wind_speed !== undefined ? telemetry.wind_speed : 3.5;

  const cards = [
    {
      id: 'temp',
      label: 'Temperature',
      simpleName: 'Air Warmth',
      value: `${tempVal.toFixed(1)} °C`,
      status: statusFlags.temp || 'Normal',
      descriptor: getTempDescriptor(tempVal, statusFlags.temp === 'Anomaly'),
      icon: Thermometer,
      accent: 'from-amber-500/10 to-red-500/10 dark:from-red-500/20 dark:to-orange-500/10',
      iconBg: 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400',
      borderAccent: 'hover:border-red-500/40',
      tip: 'Measures ambient warmth. Normal in Karnataka is 18°C - 35°C.',
    },
    {
      id: 'hum',
      label: 'Humidity',
      simpleName: 'Air Moisture',
      value: `${Math.round(humVal)} %`,
      status: statusFlags.hum || 'Normal',
      descriptor: getHumDescriptor(humVal, statusFlags.hum === 'Anomaly'),
      icon: Droplets,
      accent: 'from-sky-500/10 to-blue-500/10 dark:from-sky-500/20 dark:to-blue-500/10',
      iconBg: 'bg-sky-500/10 text-sky-500 dark:bg-sky-500/20 dark:text-sky-400',
      borderAccent: 'hover:border-sky-500/40',
      tip: 'Percentage of water vapor in the air. 40% - 70% feels most comfortable.',
    },
    {
      id: 'press',
      label: 'Atmospheric Pressure',
      simpleName: 'Air Pressure',
      value: `${Math.round(pressVal)} hPa`,
      status: statusFlags.press || 'Normal',
      descriptor: getPressDescriptor(pressVal, statusFlags.press === 'Anomaly'),
      icon: Gauge,
      accent: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/10',
      iconBg: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400',
      borderAccent: 'hover:border-emerald-500/40',
      tip: 'Weight of the air. Drops indicate rain/storms; rises indicate sunny skies.',
    },
    {
      id: 'wind',
      label: 'Wind Speed',
      simpleName: 'Breeze & Wind',
      value: `${(windVal * 3.6).toFixed(1)} km/h`,
      status: statusFlags.wind || 'Normal',
      descriptor: getWindDescriptor(windVal, statusFlags.wind === 'Anomaly'),
      icon: Wind,
      accent: 'from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/10',
      iconBg: 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400',
      borderAccent: 'hover:border-purple-500/40',
      tip: 'Speed of airflow. Below 20 km/h is a pleasant, calm breeze.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isAnomaly = card.status === 'Anomaly' || card.status === 'CRITICAL';
        const isWarning = card.status === 'Warning' || card.status === 'WARNING';

        return (
          <div
            key={card.id}
            className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between ${card.borderAccent}`}
            title={card.tip}
          >
            {/* Subtle background glow */}
            <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${card.accent} blur-xl pointer-events-none`} />

            {/* Top row: Icon & Status badge */}
            <div className="flex items-center justify-between gap-2 relative z-10">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                <Icon className="w-5 h-5" />
              </div>

              <span
                className={`inline-flex items-center gap-1 text-[0.68rem] font-bold px-2 py-0.5 rounded-full ${
                  isAnomaly
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-800'
                    : isWarning
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-800'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isAnomaly ? 'bg-red-500 animate-ping' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {isAnomaly ? 'Sensor Alert' : isWarning ? 'Check Sensor' : 'Healthy'}
              </span>
            </div>

            {/* Middle: Number reading & Label in simple terms */}
            <div className="mt-3 relative z-10">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.label}</span>
                <span className="text-[0.65rem] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">{card.simpleName}</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5">
                {card.value}
              </div>
            </div>

            {/* Bottom: Plain English descriptor */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[0.72rem] relative z-10">
              <span className={`font-medium truncate ${isAnomaly ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                {card.descriptor}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
