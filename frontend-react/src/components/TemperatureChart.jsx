import React, { useEffect, useRef } from 'react';
import { Activity, Info, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function TemperatureChart({ currentTemp, isAnomaly }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const isDark = document.documentElement.classList.contains('dark');

    const dataPoints = [
      { time: '12 AM', temp: 21.0, isAnomaly: false },
      { time: '2 AM', temp: 23.2, isAnomaly: false },
      { time: '4 AM', temp: 23.0, isAnomaly: false },
      { time: '6 AM', temp: 22.8, isAnomaly: false },
      { time: '8 AM', temp: 26.5, isAnomaly: false },
      { time: '10 AM', temp: 30.0, isAnomaly: false },
      { time: '12 PM', temp: 34.5, isAnomaly: false },
      { time: '1:30 PM', temp: 42.3, isAnomaly: true, label: 'Unusual Spike (42.3 °C)' },
      { time: '3 PM', temp: 31.0, isAnomaly: false },
      { time: '4 PM', temp: currentTemp || 28.4, isAnomaly: isAnomaly },
      { time: '6 PM', temp: 24.5, isAnomaly: false },
      { time: '8 PM', temp: 22.0, isAnomaly: false },
      { time: '10 PM', temp: 21.8, isAnomaly: false },
    ];

    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const padLeft = 46;
    const padRight = 24;
    const padTop = 36;
    const padBottom = 28;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const yMin = 10;
    const yMax = 50;
    const yRange = yMax - yMin;

    // Y-Grid and Labels
    const yTicks = [10, 20, 30, 40, 50];
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = isDark ? '#1e293b' : '#f1f5f9';
    ctx.lineWidth = 1;

    yTicks.forEach((val) => {
      const y = padTop + plotH - ((val - yMin) / yRange) * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
      ctx.fillText(`${val}°`, padLeft - 8, y);
    });

    // Safe Expected Range Shaded Band (20°C - 35°C)
    const bandTop = padTop + plotH - ((35 - yMin) / yRange) * plotH;
    const bandBottom = padTop + plotH - ((20 - yMin) / yRange) * plotH;
    ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.07)';
    ctx.fillRect(padLeft, bandTop, plotW, bandBottom - bandTop);

    // X-Ticks
    const xTickIndices = [0, 2, 4, 6, 9, 11];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const pts = dataPoints.map((dp, i) => {
      const x = padLeft + (i / (dataPoints.length - 1)) * plotW;
      const y = padTop + plotH - ((dp.temp - yMin) / yRange) * plotH;
      return { x, y, dp };
    });

    xTickIndices.forEach((idx) => {
      if (pts[idx]) {
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText(pts[idx].dp.time, pts[idx].x, padTop + plotH + 8);
      }
    });

    // Spline Curve & Gradient Fill
    if (pts.length > 1) {
      const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
      grad.addColorStop(0, isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.18)');
      grad.addColorStop(0.7, isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.04)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

      ctx.beginPath();
      ctx.moveTo(pts[0].x, padTop + plotH);
      ctx.lineTo(pts[0].x, pts[0].y);

      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? i : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }

      ctx.lineTo(pts[pts.length - 1].x, padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Stroke
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? i : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Normal Points
      pts.forEach((p) => {
        if (!p.dp.isAnomaly) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
        }
      });

      // Anomaly Highlight Callout
      const anomalyPt = pts.find((p) => p.dp.isAnomaly);
      if (anomalyPt) {
        ctx.beginPath();
        ctx.arc(anomalyPt.x, anomalyPt.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const calloutY = anomalyPt.y - 20;

        ctx.beginPath();
        ctx.moveTo(anomalyPt.x, anomalyPt.y - 7);
        ctx.lineTo(anomalyPt.x - 3.5, anomalyPt.y - 12);
        ctx.lineTo(anomalyPt.x + 3.5, anomalyPt.y - 12);
        ctx.closePath();
        ctx.fillStyle = '#dc2626';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(anomalyPt.x, anomalyPt.y - 12);
        ctx.lineTo(anomalyPt.x, calloutY);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = 'bold 10.5px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#dc2626';
        ctx.textAlign = 'center';
        ctx.fillText('Sudden Spike Detected', anomalyPt.x, calloutY - 11);
        ctx.font = '500 9.5px Inter, system-ui, sans-serif';
        ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
        ctx.fillText(`Recorded ${anomalyPt.dp.temp.toFixed(1)} °C`, anomalyPt.x, calloutY - 1);
      }
    }
  }, [currentTemp, isAnomaly]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              24-Hour Temperature Rhythm
            </h3>
            <p className="text-[0.72rem] text-slate-500 dark:text-slate-400">
              Tracks normal daily warming & cooling curve to spot sensor spikes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-1.5 text-[0.72rem] text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500/30 border border-emerald-500" />
            <span>Normal Range (20° - 35°C)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[0.72rem] text-red-600 dark:text-red-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Spike Alert</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[220px]">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
}
