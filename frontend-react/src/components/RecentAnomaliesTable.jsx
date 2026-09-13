import React from 'react';
import { AlertCircle, CheckCircle2, Wrench, ShieldAlert } from 'lucide-react';

const STATION_NAMES = {
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
  'AWS01': 'Bengaluru Urban',
  'AWS02': 'Mangaluru Coastal',
};

const EXPLANATIONS = {
  'Temperature': 'Unusual heat spike far above the seasonal range.',
  'Wind Speed': 'Sudden strong gust detected by anemometer.',
  'Pressure': 'Abrupt drop in atmospheric pressure.',
  'Humidity': 'Unusually dry air drop; checked against temperature.',
  'Rainfall': 'Sudden precipitation spike during clear skies.',
  'Solar Radiation': 'Pyranometer reading exceeded physical daylight limits.',
};

export default function RecentAnomaliesTable({ anomalies, onViewAll }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              Sensor Alerts & Irregularities
            </h3>
            <p className="text-[0.72rem] text-slate-500 dark:text-slate-400">
              When a sensor acts up or weather spikes abnormally, it is logged here in plain terms
            </p>
          </div>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline cursor-pointer bg-sky-50 dark:bg-sky-950/60 px-3 py-1.5 rounded-lg border border-sky-200/60 dark:border-sky-800/80 transition-colors"
        >
          View Sandbox & All Logs &rarr;
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <th className="py-2.5 px-4 rounded-l-xl">Time</th>
              <th className="py-2.5 px-4">Weather Station</th>
              <th className="py-2.5 px-4">Sensor Parameter</th>
              <th className="py-2.5 px-4">Recorded Reading</th>
              <th className="py-2.5 px-4">Simple Explanation</th>
              <th className="py-2.5 px-4">Alert Level</th>
              <th className="py-2.5 px-4 rounded-r-xl">Action Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {anomalies.map((row, idx) => {
              const isHigh = row.severity === 'High';
              const isInvestigating = row.status === 'Investigating';
              const stationName = STATION_NAMES[row.station_id] || row.station_id;
              const explanation = EXPLANATIONS[row.parameter] || 'Sensor reading differed significantly from the expected physical model.';

              return (
                <tr key={row.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {row.time}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">{stationName}</div>
                    <div className="font-mono text-[0.68rem] text-slate-400">{row.station_id}</div>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {row.parameter}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {row.value}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-[240px]">
                    {explanation}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[0.7rem] font-bold px-2.5 py-0.5 rounded-full ${
                        isHigh
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-800'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-red-500' : 'bg-amber-500'}`} />
                      {isHigh ? 'High Alert' : 'Medium Watch'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[0.7rem] font-bold px-2.5 py-0.5 rounded-full ${
                        isInvestigating
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 ring-1 ring-sky-300 dark:ring-sky-800'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-800'
                      }`}
                    >
                      {isInvestigating ? (
                        <>
                          <Wrench className="w-3 h-3 text-sky-600 dark:text-sky-400 animate-spin" style={{ animationDuration: '3s' }} />
                          <span>Checking Sensor</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Resolved</span>
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
