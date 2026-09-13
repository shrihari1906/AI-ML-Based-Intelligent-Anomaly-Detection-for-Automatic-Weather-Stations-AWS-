import React, { useState } from 'react';
import { Zap, RefreshCw, AlertOctagon, TrendingDown, Sun, Wind, CheckCircle2, FlaskConical } from 'lucide-react';

export default function FaultSandbox({ onTriggerFault, onClearFaults }) {
  const [activeFaultName, setActiveFaultName] = useState(null);

  const handleRunTest = (faultType, sensor, mag, steps, desc, label) => {
    setActiveFaultName(label);
    onTriggerFault(faultType, sensor, mag, steps, desc);
  };

  const handleReset = () => {
    setActiveFaultName(null);
    onClearFaults();
  };

  const tests = [
    {
      label: 'Heat Spike (+14°C)',
      desc: 'Simulates sudden ambient temperature jump on RTD thermometer',
      icon: '🔥',
      action: () => handleRunTest('SPIKE', 'temperature', 14.0, 20, 'Temperature Spike (+14°C)', 'Heat Spike'),
      color: 'hover:border-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30 text-red-700 dark:text-red-300',
    },
    {
      label: 'Frozen Moisture (82.5%)',
      desc: 'Simulates jammed hygrometer sensor that stops fluctuating',
      icon: '❄️',
      action: () => handleRunTest('FLATLINE', 'humidity', 82.5, 30, 'Humidity Lockup (82.5%)', 'Frozen Moisture'),
      color: 'hover:border-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 text-sky-700 dark:text-sky-300',
    },
    {
      label: 'Slow Pressure Drift',
      desc: 'Simulates gradual barometric loss (-0.25 hPa/sec)',
      icon: '📉',
      action: () => handleRunTest('DRIFT', 'pressure', -0.25, 40, 'Barometer Calibration Drift', 'Slow Pressure Drift'),
      color: 'hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300',
    },
    {
      label: 'Severe Wind Surge (+35 m/s)',
      desc: 'Simulates abrupt violent gust or anemometer transducer anomaly',
      icon: '💨',
      action: () => handleRunTest('SPIKE', 'wind_speed', 35.0, 15, 'Severe Wind Surge (+35 m/s)', 'Severe Wind Surge'),
      color: 'hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 text-purple-700 dark:text-purple-300',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              Sensor Stress Testing Sandbox
            </h3>
            <p className="text-[0.72rem] text-slate-500 dark:text-slate-400">
              Test how the AI anomaly engine catches broken or failing sensors by simulating real-world glitches
            </p>
          </div>
        </div>

        {activeFaultName ? (
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Testing: {activeFaultName}
          </span>
        ) : (
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            All Sensors Clean
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tests.map((test, idx) => (
          <button
            key={idx}
            onClick={test.action}
            className={`p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-left transition-all hover:shadow-sm cursor-pointer flex flex-col gap-1 ${test.color}`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <span>{test.icon}</span>
              <span>{test.label}</span>
            </div>
            <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
              {test.desc}
            </p>
          </button>
        ))}

        <button
          onClick={handleReset}
          className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-all cursor-pointer flex flex-col justify-center items-center text-center gap-1 sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Reset All Sensors to Normal</span>
          </div>
          <p className="text-[0.7rem] text-emerald-600/80 dark:text-emerald-400/80">
            Clear all synthetic glitches & resume clean data
          </p>
        </button>
      </div>
    </div>
  );
}
