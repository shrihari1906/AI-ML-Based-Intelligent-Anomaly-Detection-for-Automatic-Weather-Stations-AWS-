/**
 * High-Quality Canvas 24-Hour Temperature Chart Renderer.
 * Accurately replicates the smooth spline, gradient fill, and anomaly callout badge from the UI mockup.
 */

class Temperature24hChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // 24-Hour points: [Hour label, temperature value, isAnomaly]
        this.dataPoints = [
            { time: "12 AM", temp: 21.0, isAnomaly: false },
            { time: "2 AM", temp: 23.2, isAnomaly: false },
            { time: "4 AM", temp: 23.0, isAnomaly: false },
            { time: "6 AM", temp: 22.8, isAnomaly: false },
            { time: "8 AM", temp: 26.5, isAnomaly: false },
            { time: "10 AM", temp: 30.0, isAnomaly: false },
            { time: "12 PM", temp: 34.5, isAnomaly: false },
            { time: "1:30 PM", temp: 42.3, isAnomaly: true, label: "Anomaly Detected\n(42.3 °C)" },
            { time: "3 PM", temp: 31.0, isAnomaly: false },
            { time: "4 PM", temp: 28.4, isAnomaly: false },
            { time: "6 PM", temp: 24.5, isAnomaly: false },
            { time: "8 PM", temp: 22.0, isAnomaly: false },
            { time: "10 PM", temp: 21.8, isAnomaly: false },
        ];

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.draw();
    }

    updateCurrentTemp(temp, isAnomaly) {
        // Update the 4 PM / current point
        this.dataPoints[9].temp = temp;
        this.dataPoints[9].isAnomaly = isAnomaly;
        if (isAnomaly) {
            this.dataPoints[9].label = `Anomaly Detected\n(${temp.toFixed(1)} °C)`;
        }
        this.draw();
    }

    draw() {
        if (!this.ctx || !this.width || !this.height) return;
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.clearRect(0, 0, w, h);

        const padLeft = 46;
        const padRight = 20;
        const padTop = 32;
        const padBottom = 30;
        const plotW = w - padLeft - padRight;
        const plotH = h - padTop - padBottom;

        const yMin = 10;
        const yMax = 50;
        const yRange = yMax - yMin;

        // 1. Draw Horizontal Grid Lines & Y-Axis Labels
        const yTicks = [10, 20, 30, 40, 50];
        ctx.font = "11px Inter, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        ctx.strokeStyle = "#f1f5f9";
        ctx.lineWidth = 1;

        yTicks.forEach(val => {
            const y = padTop + plotH - ((val - yMin) / yRange) * plotH;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(w - padRight, y);
            ctx.stroke();

            ctx.fillText(val.toString(), padLeft - 8, y);
        });

        // Y-Axis Title (Rotated)
        ctx.save();
        ctx.translate(14, padTop + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "center";
        ctx.fillStyle = "#64748b";
        ctx.font = "11px Inter, sans-serif";
        ctx.fillText("Temperature (°C)", 0, 0);
        ctx.restore();

        // 2. Draw X-Axis Ticks & Labels (12 AM, 4 AM, 8 AM, 12 PM, 4 PM, 8 PM)
        const xTickIndices = [0, 2, 4, 6, 9, 11];
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        // Map data points to pixel coords
        const pts = this.dataPoints.map((dp, i) => {
            const x = padLeft + (i / (this.dataPoints.length - 1)) * plotW;
            const y = padTop + plotH - ((dp.temp - yMin) / yRange) * plotH;
            return { x, y, dp };
        });

        xTickIndices.forEach(idx => {
            if (pts[idx]) {
                const pt = pts[idx];
                ctx.fillText(pt.dp.time, pt.x, padTop + plotH + 8);
            }
        });

        // 3. Draw Spline Line with Gradient Fill
        if (pts.length > 1) {
            // Gradient Fill
            const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
            grad.addColorStop(0, "rgba(239, 68, 68, 0.22)");
            grad.addColorStop(0.7, "rgba(239, 68, 68, 0.06)");
            grad.addColorStop(1, "rgba(239, 68, 68, 0.0)");

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

            // Stroke Line
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

            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2.2;
            ctx.stroke();

            // Draw Dots
            pts.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = "#ef4444";
                ctx.fill();
            });

            // 4. Draw Anomaly Callout Badge at Anomaly Point
            const anomalyPt = pts.find(p => p.dp.isAnomaly);
            if (anomalyPt) {
                // Outer glow ring
                ctx.beginPath();
                ctx.arc(anomalyPt.x, anomalyPt.y, 6.5, 0, Math.PI * 2);
                ctx.fillStyle = "#dc2626";
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.stroke();

                // Arrow Pointer & Callout Text
                const calloutY = anomalyPt.y - 20;
                
                // Down arrow
                ctx.beginPath();
                ctx.moveTo(anomalyPt.x, anomalyPt.y - 7);
                ctx.lineTo(anomalyPt.x - 3.5, anomalyPt.y - 12);
                ctx.lineTo(anomalyPt.x + 3.5, anomalyPt.y - 12);
                ctx.closePath();
                ctx.fillStyle = "#dc2626";
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(anomalyPt.x, anomalyPt.y - 12);
                ctx.lineTo(anomalyPt.x, calloutY);
                ctx.strokeStyle = "#dc2626";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Text Badge
                ctx.font = "bold 10px Inter, sans-serif";
                ctx.fillStyle = "#dc2626";
                ctx.textAlign = "center";
                ctx.fillText("Anomaly Detected", anomalyPt.x, calloutY - 11);
                ctx.font = "500 9.5px Inter, sans-serif";
                ctx.fillText(`(${anomalyPt.dp.temp.toFixed(1)} °C)`, anomalyPt.x, calloutY - 1);
            }
        }
    }
}
