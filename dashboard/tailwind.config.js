/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Atmospheric Science Surfaces & Backgrounds (Dynamic via CSS variables)
        "background": "var(--bg-app, #14161C)",
        "surface": "var(--bg-app, #14161C)",
        "surface-dim": "var(--bg-surface-dim, #101217)",
        "surface-container": "var(--bg-surface-container, #1C1F28)",
        "surface-container-low": "var(--bg-surface-container-low, #181A22)",
        "surface-container-high": "var(--bg-surface-container-high, #222632)",
        "surface-container-highest": "var(--bg-surface-container-highest, #2B2F3D)",
        "surface-container-lowest": "var(--bg-surface-container-lowest, #0F1116)",
        "outline": "var(--text-outline, #6B7280)",
        "outline-variant": "var(--border-outline-variant, #2B2F3A)",

        // Text Scale (Dynamic via CSS variables)
        "on-background": "var(--text-on-surface, #F2F3F5)",
        "on-surface": "var(--text-on-surface, #F2F3F5)",
        "on-surface-variant": "var(--text-on-surface-variant, #9BA3AF)",

        // Primary Accent: Storm Sky Indigo-Blue (for Navigation & AI Core branding ONLY)
        "primary": "#5B7FBD",
        "primary-hover": "#4A6BA3",
        "primary-container": "#4A6BA3",
        "on-primary": "#FFFFFF",
        "on-primary-container": "#FFFFFF",

        // Weather-Radar Severity Scale (for Anomaly Status ONLY)
        "severity-normal": "#6EC98F",
        "severity-watch": "#D9C15C",
        "severity-warning": "#E08D4B",
        "severity-critical": "#D9534F",
        "error": "#D9534F",
        "error-container": "#421817",

        // Sensor-Specific Visual Language
        "sensor-temp": "#E08D6B",
        "sensor-hum": "#6FA8DC",
        "sensor-press": "#C9A24B",
        "sensor-wind": "#7FA8B3",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      spacing: {
        "space-md": "0.75rem",
        "space-xl": "1.5rem",
        "margin-mobile": "0.75rem",
        "gutter": "1rem",
        "gutter-mobile": "0.5rem",
        "margin": "1.5rem",
        "space-lg": "1rem",
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
      },
      fontFamily: {
        "headline-lg": ["Hanken Grotesk", "sans-serif"],
        "telemetry-lg": ["JetBrains Mono", "monospace"],
        "body-md": ["Hanken Grotesk", "sans-serif"],
        "headline-sm": ["Hanken Grotesk", "sans-serif"],
        "body-lg": ["Hanken Grotesk", "sans-serif"],
        "label-sm": ["JetBrains Mono", "monospace"],
        "body-sm": ["Hanken Grotesk", "sans-serif"],
        "headline-lg-mobile": ["Hanken Grotesk", "sans-serif"],
        "label-md": ["JetBrains Mono", "monospace"],
        "telemetry-xl": ["JetBrains Mono", "monospace"],
        "telemetry-md": ["JetBrains Mono", "monospace"],
        "headline-md": ["Hanken Grotesk", "sans-serif"],
      },
      fontSize: {
        "headline-lg": ["2rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em", fontWeight: "600" }],
        "telemetry-lg": ["1.5rem", { lineHeight: "1.75rem", letterSpacing: "-0.03em", fontWeight: "500" }],
        "body-md": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0", fontWeight: "400" }],
        "headline-sm": ["1rem", { lineHeight: "1.5rem", letterSpacing: "0", fontWeight: "500" }],
        "body-lg": ["1rem", { lineHeight: "1.5rem", letterSpacing: "0", fontWeight: "400" }],
        "label-sm": ["0.6875rem", { lineHeight: "0.875rem", letterSpacing: "0.06em", fontWeight: "400" }],
        "body-sm": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.01em", fontWeight: "400" }],
        "headline-lg-mobile": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.01em", fontWeight: "600" }],
        "label-md": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.05em", fontWeight: "500" }],
        "telemetry-xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.04em", fontWeight: "500" }],
        "telemetry-md": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "-0.01em", fontWeight: "400" }],
        "headline-md": ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em", fontWeight: "500" }],
      },
    },
  },
  plugins: [],
};
