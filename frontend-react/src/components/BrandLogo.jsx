import React from 'react';

export default function BrandLogo({ size = 36, className = "" }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center flex-shrink-0 select-none ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          <linearGradient id="towerGrad" x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          <radialGradient id="pulseGlow" cx="24" cy="24" r="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Glow */}
        <circle cx="24" cy="24" r="16" fill="url(#pulseGlow)" />

        {/* Outer Tech Hexagon Shield */}
        <path
          d="M24 3L41 12.8V35.2L24 45L7 35.2V12.8L24 3Z"
          fill="#0f172a"
          stroke="url(#shieldGrad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Outer Concentric Telemetry Radar Arc */}
        <path
          d="M13 18C16 14.5 20 12.5 24 12.5C28 12.5 32 14.5 35 18"
          stroke="#38bdf8"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
        <path
          d="M16.5 21C18.5 19 21.2 17.8 24 17.8C26.8 17.8 29.5 19 31.5 21"
          stroke="#34d399"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />

        {/* Weather Station Observation Mast (AWS Tower) */}
        {/* Mast Legs */}
        <line x1="24" y1="20" x2="16" y2="40" stroke="url(#towerGrad)" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="20" x2="32" y2="40" stroke="url(#towerGrad)" strokeWidth="2" strokeLinecap="round" />
        {/* Cross Trusses */}
        <line x1="19" y1="33" x2="29" y2="33" stroke="url(#towerGrad)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="21.5" y1="27" x2="26.5" y2="27" stroke="url(#towerGrad)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Center Mast Spire */}
        <line x1="24" y1="12" x2="24" y2="38" stroke="url(#towerGrad)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Anemometer Cross-arm at top */}
        <line x1="18" y1="14" x2="30" y2="14" stroke="#f1f5f9" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="18" cy="14" r="1.8" fill="#38bdf8" />
        <circle cx="30" cy="14" r="1.8" fill="#38bdf8" />

        {/* Top Pyranometer / Lightning Finial */}
        <circle cx="24" cy="9" r="2.2" fill="#fbbf24" filter="url(#glow)" />

        {/* Center AI Neural Core Pulse */}
        <circle cx="24" cy="24" r="4.5" fill="#0284c7" />
        <circle cx="24" cy="24" r="2.2" fill="#34d399" filter="url(#glow)" />
      </svg>
    </div>
  );
}
