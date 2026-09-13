import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Activity,
  Layers,
  Cpu,
  BarChart2,
  PieChart,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Zap
} from 'lucide-react';

const DEFAULT_REPORT_DATA = {
  filename: 'aws_benchmark_ground_truth.csv',
  total_records: 800,
  clean_records: 712,
  anomalous_records: 88,
  wmo_compliance_percentage: 89.0,
  flag_distribution: {
    GOOD: 712,
    SUSPECT: 34,
    WARNING: 38,
    CRITICAL: 16
  },
  anomaly_categories: {
    STEP_SPIKE: 31,
    SENSOR_LOCKUP: 22,
    THERMODYNAMIC_INVARIANT: 16,
    CALIBRATION_DRIFT: 11,
    RANGE_EXCEEDANCE: 8
  },
  sensor_failure_distribution: {
    temperature: 34,
    humidity: 26,
    pressure: 16,
    wind_speed: 12
  },
  timeline: [
    {
      id: 'REC-088',
      timestamp: '2026-09-05 09:12:00',
      station_id: 'AWS_003',
      sensor: 'Temperature',
      observed: '42.3 °C',
      imputed: '29.0 °C',
      delta: '+13.3 °C',
      flag: 'CRITICAL',
      flagColor: '#dc2626',
      score: 0.94,
      layer: 'Check 1: Sudden Jump',
      reason: 'Sudden temperature jump (+13.3°C in 1 minute) far above safe natural limit.',
      action: 'Check sensor wiring and RTD connection for loose ground.'
    },
    {
      id: 'REC-087',
      timestamp: '2026-09-05 08:30:00',
      station_id: 'AWS-001',
      sensor: 'Relative Humidity',
      observed: '82.5 %',
      imputed: '64.8 %',
      delta: 'Flatline',
      flag: 'WARNING',
      flagColor: '#ea580c',
      score: 0.81,
      layer: 'Check 1: Stuck Needle',
      reason: 'Humidity reading stayed stuck on the exact same number without natural fluctuations.',
      action: 'Inspect humidity film for dirt or moisture condensation buildup.'
    },
    {
      id: 'REC-086',
      timestamp: '2026-09-05 07:45:00',
      station_id: 'AWS-002',
      sensor: 'Wind Speed',
      observed: '76.1 km/h',
      imputed: '22.4 km/h',
      delta: '+53.7 km/h',
      flag: 'SUSPECT',
      flagColor: '#d97706',
      score: 0.68,
      layer: 'Check 2: Spike Filter',
      reason: 'Sharp isolated wind gust spike detected by anemometer.',
      action: 'Verify ultrasonic transducer alignment and clear debris.'
    },
    {
      id: 'REC-085',
      timestamp: '2026-09-04 18:20:00',
      station_id: 'AWS-005',
      sensor: 'Barometric Pressure',
      observed: '980.0 hPa',
      imputed: '1008.5 hPa',
      delta: '-28.5 hPa',
      flag: 'WARNING',
      flagColor: '#ea580c',
      score: 0.77,
      layer: 'Check 2: Slow Drift',
      reason: 'Air pressure gradually drifted away from regional baseline.',
      action: 'Schedule barometer calibration against standard reference.'
    },
    {
      id: 'REC-084',
      timestamp: '2026-09-04 14:15:00',
      station_id: 'AWS-004',
      sensor: 'Moisture Balance',
      observed: 'Td 28.5°C / T 26.1°C',
      imputed: 'Td 23.4°C',
      delta: 'Td > T',
      flag: 'CRITICAL',
      flagColor: '#dc2626',
      score: 0.96,
      layer: 'Check 1: Physics Balance',
      reason: 'Physical contradiction: Dew point temperature exceeded actual air temperature.',
      action: 'Corrected via physics formula; check relative humidity sensor.'
    },
    {
      id: 'REC-083',
      timestamp: '2026-09-04 11:00:00',
      station_id: 'AWS-001',
      sensor: 'Solar Radiation',
      observed: '1850 W/m²',
      imputed: '720 W/m²',
      delta: '+1130 W/m²',
      flag: 'CRITICAL',
      flagColor: '#dc2626',
      score: 0.98,
      layer: 'Layer 1 (Gross Range)',
      reason: 'Exceeds extraterrestrial solar constant solar irradiance maximum (1361 W/m²).',
      action: 'Inspect pyranometer amplifier gain and check glass dome for specular reflections.'
    },
    {
      id: 'REC-082',
      timestamp: '2026-09-04 09:30:00',
      station_id: 'AWS-002',
      sensor: 'Battery Voltage',
      observed: '9.8 V',
      imputed: '13.6 V',
      delta: '-3.8 V',
      flag: 'SUSPECT',
      flagColor: '#d97706',
      score: 0.62,
      layer: 'Layer 1 (Power Range)',
      reason: 'Battery voltage dropout below transducer operating cutoff (10.5V).',
      action: 'Inspect solar charge controller and battery health; check panel shading.'
    }
  ]
};

export default function ReportsSection() {
  const [report, setReport] = useState(DEFAULT_REPORT_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFlagFilter, setSelectedFlagFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Handle CSV file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadStatus(`Uploading & evaluating ${file.name} through Layer 1-3 detectors...`);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/analyze/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
      const data = await res.json();
      
      let formattedTimeline = [];
      if (data.timeline && Array.isArray(data.timeline)) {
        formattedTimeline = data.timeline
          .filter((t) => t.is_anomalous || (t.qc_flag && t.qc_flag.code !== 'GOOD'))
          .slice(0, 50)
          .map((t, idx) => {
            const exp = t.explanation || {};
            return {
              id: `UP-${String(idx + 1).padStart(3, '0')}`,
              timestamp: t.timestamp ? new Date(t.timestamp).toLocaleString() : 'Observation',
              station_id: t.station_id || 'AWS-BATCH',
              sensor: exp.primary_sensor ? exp.primary_sensor.toUpperCase() : 'SENSOR',
              observed: t.reading && exp.primary_sensor && t.reading[exp.primary_sensor] !== undefined ? `${t.reading[exp.primary_sensor]}` : 'Reading',
              imputed: t.corrected_reading && exp.primary_sensor && t.corrected_reading[exp.primary_sensor] !== undefined ? `${t.corrected_reading[exp.primary_sensor]}` : 'Corrected',
              delta: exp.category || 'Delta',
              flag: t.qc_flag?.code || 'WARNING',
              flagColor: t.qc_flag?.color || '#ea580c',
              score: t.composite_anomaly_score ? t.composite_anomaly_score.toFixed(2) : '0.80',
              layer: 'Multi-Tier QC Ensemble',
              reason: exp.summary || 'Sensor reading flagged.',
              action: exp.recommendation || 'Review sensor performance.'
            };
          });
      }

      setReport({
        filename: file.name,
        total_records: data.total_records,
        clean_records: data.clean_records,
        anomalous_records: data.anomalous_records,
        wmo_compliance_percentage: data.wmo_compliance_percentage,
        flag_distribution: data.flag_distribution || DEFAULT_REPORT_DATA.flag_distribution,
        anomaly_categories: data.anomaly_categories || DEFAULT_REPORT_DATA.anomaly_categories,
        sensor_failure_distribution: data.sensor_failure_distribution || DEFAULT_REPORT_DATA.sensor_failure_distribution,
        timeline: formattedTimeline.length > 0 ? formattedTimeline : DEFAULT_REPORT_DATA.timeline
      });
      setUploadStatus(`Successfully processed ${file.name} (${data.total_records} records).`);
    } catch (err) {
      console.error(err);
      setUploadStatus(`Upload error: ${err.message}`);
    } finally {
      setIsLoading(false);
      setIsUploadModalOpen(false);
    }
  };

  // Filtered timeline rows
  const filteredTimeline = report.timeline.filter((rec) => {
    const matchesFilter = selectedFlagFilter === 'ALL' || rec.flag === selectedFlagFilter;
    const matchesSearch =
      rec.sensor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.station_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.layer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 pb-12 w-full animate-fadeIn">
      {/* 1. Executive Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                Station Health & Quality Reports
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Standard Audit
                </span>
              </h1>
              <p className="text-[0.84rem] text-slate-500 dark:text-slate-400 mt-0.5">
                Automated quality audits, sensor reliability scores, and plain-English explanations for flagged readings
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Audit Status Badge */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Verified Station Quality Audit
          </span>

          {/* Upload Custom CSV Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition border border-slate-200 shadow-2xs active:scale-95 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-slate-600" />
            <span>Upload Custom CSV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Download Sample Dataset Link */}
          <a
            href="/api/analyze/download-sample"
            download
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition border border-slate-200 shadow-2xs active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download Benchmark CSV</span>
          </a>
        </div>
      </div>

      {/* Upload status banner if active */}
      {uploadStatus && (
        <div className="p-3 px-4 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{uploadStatus}</span>
          </div>
          <span className="font-mono text-[0.7rem] bg-white px-2 py-0.5 rounded border border-sky-200">
            {report.filename}
          </span>
        </div>
      )}

      {/* 2. Executive KPI Scorecard Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Total Records Evaluated */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Processed Records</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{report.total_records.toLocaleString()}</div>
            <div className="text-[0.75rem] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5" /> Continuous 1-min sampling
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Quality Compliance Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Accuracy Rate</span>
            <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{report.wmo_compliance_percentage}%</div>
            <div className="text-[0.75rem] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> High-Standard Quality
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-100 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Clean Observations */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Clean Records</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{report.clean_records.toLocaleString()}</div>
            <div className="text-[0.75rem] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Triple-Check Verified
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Flagged Anomalies */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flagged Readings</span>
            <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{report.anomalous_records.toLocaleString()}</div>
            <div className="text-[0.75rem] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Handled & Cleaned
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/70 border border-red-100 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Mid Section: Multi-Tier Distribution & Fault Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Multi-Tier QC Flag Distribution (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-sky-600" />
                WMO Quality Flag Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution according to WMO-No. 486 validation tiers
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {report.total_records} Records
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${(report.flag_distribution.GOOD / report.total_records) * 100}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Good: ${report.flag_distribution.GOOD}`}
            />
            <div
              style={{ width: `${(report.flag_distribution.SUSPECT / report.total_records) * 100}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
              title={`Suspect: ${report.flag_distribution.SUSPECT}`}
            />
            <div
              style={{ width: `${(report.flag_distribution.WARNING / report.total_records) * 100}%` }}
              className="bg-orange-500 h-full transition-all duration-500"
              title={`Warning: ${report.flag_distribution.WARNING}`}
            />
            <div
              style={{ width: `${(report.flag_distribution.CRITICAL / report.total_records) * 100}%` }}
              className="bg-red-500 h-full transition-all duration-500"
              title={`Critical: ${report.flag_distribution.CRITICAL}`}
            />
          </div>

          {/* 4 Flag Tier Cards */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* GOOD */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Good (Valid)
                </span>
                <span className="text-[0.7rem] font-bold text-emerald-700">
                  {((report.flag_distribution.GOOD / report.total_records) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xl font-black text-emerald-900 mt-2">
                {report.flag_distribution.GOOD} <span className="text-xs font-medium text-emerald-700">records</span>
              </div>
              <p className="text-[0.68rem] text-emerald-600 mt-1">Passed all deterministic, statistical & ML gates</p>
            </div>

            {/* SUSPECT */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Suspect / Minor
                </span>
                <span className="text-[0.7rem] font-bold text-amber-700">
                  {((report.flag_distribution.SUSPECT / report.total_records) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xl font-black text-amber-900 mt-2">
                {report.flag_distribution.SUSPECT} <span className="text-xs font-medium text-amber-700">records</span>
              </div>
              <p className="text-[0.68rem] text-amber-600 mt-1">Minor statistical outlier / slight rate jump</p>
            </div>

            {/* WARNING */}
            <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-orange-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> Warning
                </span>
                <span className="text-[0.7rem] font-bold text-orange-700">
                  {((report.flag_distribution.WARNING / report.total_records) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xl font-black text-orange-900 mt-2">
                {report.flag_distribution.WARNING} <span className="text-xs font-medium text-orange-700">records</span>
              </div>
              <p className="text-[0.68rem] text-orange-600 mt-1">Moderate drift, flatline, or Hampel outlier</p>
            </div>

            {/* CRITICAL */}
            <div className="p-3 rounded-xl bg-red-50/70 border border-red-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-red-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Critical Failure
                </span>
                <span className="text-[0.7rem] font-bold text-red-700">
                  {((report.flag_distribution.CRITICAL / report.total_records) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xl font-black text-red-900 mt-2">
                {report.flag_distribution.CRITICAL} <span className="text-xs font-medium text-red-700">records</span>
              </div>
              <p className="text-[0.68rem] text-red-600 mt-1">Physical violation, gross exceedance or severe spike</p>
            </div>
          </div>
        </div>

        {/* Right: Anomaly Categories & Root Cause Attribution (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-sky-600" />
                Root-Cause Anomaly Categories
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Synthesized fault classification across physical & neural layers
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {report.anomalous_records} Violations
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              {
                label: '⚡ Rate-of-Change (Step Spike)',
                count: report.anomaly_categories.STEP_SPIKE || 31,
                color: 'bg-red-500',
                desc: 'Sudden impulse jumps violating 1-min maximum gradient'
              },
              {
                label: '❄️ Sensor Flatline (Persistence Lockup)',
                count: report.anomaly_categories.SENSOR_LOCKUP || 22,
                color: 'bg-orange-500',
                desc: 'Zero-variance stuck transducer readings'
              },
              {
                label: '📐 Thermodynamic Invariants (Magnus Td > T)',
                count: report.anomaly_categories.THERMODYNAMIC_INVARIANT || 16,
                color: 'bg-purple-500',
                desc: 'Physical atmospheric saturation violations'
              },
              {
                label: '📉 Sensor Calibration Drift (EWMA Divergence)',
                count: report.anomaly_categories.CALIBRATION_DRIFT || 11,
                color: 'bg-amber-500',
                desc: 'Gradual multi-hour transducer baseline offset shift'
              },
              {
                label: '☀️ Climatological Gross Range Exceedance',
                count: report.anomaly_categories.RANGE_EXCEEDANCE || 8,
                color: 'bg-rose-500',
                desc: 'Values violating climatological bounds (e.g. >1361 W/m²)'
              }
            ].map((cat, i) => {
              const pct = ((cat.count / report.anomalous_records) * 100).toFixed(0);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.label}</span>
                    <span className="font-mono text-slate-600 font-bold">{cat.count} events ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${cat.color} transition-all duration-500`}
                    />
                  </div>
                  <p className="text-[0.68rem] text-slate-400">{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Sensor Vulnerability Breakdown Row */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-600" />
              Sensor Channel Fault Vulnerability Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies the most failure-prone sensor transducers across historical operations
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            5 Active Telemetry Channels
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            {
              name: 'Air Temperature',
              sensor: 'Pt100 RTD',
              count: report.sensor_failure_distribution.temperature || 34,
              primaryFault: 'Step Spikes (+18°C)',
              color: 'text-red-600',
              badgeBg: 'bg-red-50 text-red-700'
            },
            {
              name: 'Relative Humidity',
              sensor: 'Capacitive Film',
              count: report.sensor_failure_distribution.humidity || 26,
              primaryFault: 'Flatline Lockup (82.5%)',
              color: 'text-orange-600',
              badgeBg: 'bg-orange-50 text-orange-700'
            },
            {
              name: 'Barometric Pressure',
              sensor: 'Piezoresistive',
              count: report.sensor_failure_distribution.pressure || 16,
              primaryFault: 'Slow Calibration Drift',
              color: 'text-amber-600',
              badgeBg: 'bg-amber-50 text-amber-700'
            },
            {
              name: 'Wind Anemometer',
              sensor: 'Ultrasonic 2-Axis',
              count: report.sensor_failure_distribution.wind_speed || 10,
              primaryFault: 'Turbulence Gust Outliers',
              color: 'text-teal-600',
              badgeBg: 'bg-teal-50 text-teal-700'
            },
            {
              name: 'Solar Pyranometer',
              sensor: 'CMP11 Thermopile',
              count: report.sensor_failure_distribution.solar_radiation || 2,
              primaryFault: 'Range Bounds Overflow',
              color: 'text-indigo-600',
              badgeBg: 'bg-indigo-50 text-indigo-700'
            }
          ].map((s, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">{s.name}</span>
                <span className="text-[0.7rem] text-slate-400 font-mono block">{s.sensor}</span>
                <div className={`text-xl font-black mt-2 ${s.color}`}>{s.count}</div>
                <span className="text-[0.68rem] text-slate-500">violations recorded</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60">
                <span className={`text-[0.68rem] font-semibold px-2 py-0.5 rounded-md block text-center truncate ${s.badgeBg}`}>
                  {s.primaryFault}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Detailed Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              Verified Anomaly Events & Imputation Audit Log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical record log comparing observed raw readings vs physics-imputed values with maintenance directives
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search sensor, station, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              {['ALL', 'CRITICAL', 'WARNING', 'SUSPECT'].map((flg) => (
                <button
                  key={flg}
                  onClick={() => setSelectedFlagFilter(flg)}
                  className={`px-2.5 py-1 rounded text-[0.7rem] font-bold transition cursor-pointer ${
                    selectedFlagFilter === flg
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {flg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 text-[0.7rem]">
              <tr>
                <th className="py-3 px-4">Event ID / Time</th>
                <th className="py-3 px-3">Station</th>
                <th className="py-3 px-3">Sensor Parameter</th>
                <th className="py-3 px-3">Observed vs Imputed</th>
                <th className="py-3 px-3">QC Flag</th>
                <th className="py-3 px-3">Detecting Tier</th>
                <th className="py-3 px-4">AI Diagnostic & Maintenance Directive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTimeline.map((rec, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900">{rec.id}</div>
                    <div className="text-[0.7rem] text-slate-400 mt-0.5">{rec.timestamp}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                      {rec.station_id}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-800">{rec.sensor}</span>
                    <span className="text-[0.7rem] text-slate-400 block font-mono">Score: {rec.score}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-mono text-xs">
                      <span className="text-red-600 font-bold">{rec.observed}</span>
                      <span className="text-slate-400 mx-1.5">→</span>
                      <span className="text-emerald-700 font-bold">{rec.imputed}</span>
                    </div>
                    <span className="text-[0.68rem] text-slate-400 font-mono">Δ {rec.delta}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      style={{ color: rec.flagColor, backgroundColor: `${rec.flagColor}15`, borderColor: `${rec.flagColor}30` }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold border"
                    >
                      {rec.flag === 'CRITICAL' ? <AlertOctagon className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {rec.flag}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md block w-fit">
                      {rec.layer}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-[340px]">
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{rec.reason}</p>
                    <p className="text-[0.72rem] text-sky-700 font-semibold mt-1 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-sky-600 shrink-0" />
                      {rec.action}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
