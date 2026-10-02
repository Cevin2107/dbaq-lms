"use client";

import React from "react";
import clsx from "clsx";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  glow?: boolean;
  animate?: boolean;
}

const sizeMap = {
  xs: "h-6 w-6 rounded-[8px]",
  sm: "h-8 w-8 rounded-[10px]",
  md: "h-10 w-10 rounded-[12px]",
  lg: "h-14 w-14 rounded-[18px]",
  xl: "h-20 w-20 rounded-[26px]",
};

export function BrandLogo({
  size = "md",
  className,
  glow = false,
  animate = false,
}: BrandLogoProps) {
  const sizeClass = sizeMap[size];

  return (
    <div
      className={clsx(
        "relative shrink-0 flex items-center justify-center overflow-hidden shadow-glass select-none transition-transform duration-300 ease-spring",
        sizeClass,
        animate && "hover:scale-105 active:scale-95",
        className
      )}
    >
      {/* Glow Ambient behind */}
      {glow && (
        <div className="absolute -inset-2 bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] opacity-70 blur-lg pointer-events-none -z-10 animate-pulse-slow" />
      )}

      {/* High-fidelity Vector SVG Logo: Minimalist Luxury ĐBAQ - LMS */}
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="brandIconBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="30%" stopColor="#0284c7" />
            <stop offset="70%" stopColor="#0066cc" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <radialGradient id="brandTopGlow" cx="45%" cy="25%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="brandGlassSheen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="brandPlatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>

          <linearGradient id="brandFacetDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          <linearGradient id="brandGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <filter id="brandShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#020617" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Base Squircle */}
        <rect width="512" height="512" fill="url(#brandIconBg)" />
        <rect width="512" height="512" fill="url(#brandTopGlow)" />

        {/* Glass Arc */}
        <path
          d="M 0 115 C 0 51.5 51.5 0 115 0 L 397 0 C 460.5 0 512 51.5 512 115 C 512 175 390 205 256 205 C 122 205 0 175 0 115 Z"
          fill="url(#brandGlassSheen)"
        />

        {/* Apple Thin Border */}
        <rect
          x="2.5"
          y="2.5"
          width="507"
          height="507"
          rx="112.5"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="6"
        />

        {/* Geometric Emblem: The Apex Crown & Ribbon of Knowledge */}
        <g filter="url(#brandShadow)">
          {/* Top Diamond Apex */}
          <polygon points="256,92 376,174 256,238 136,174" fill="url(#brandPlatGrad)" />
          <polygon points="136,174 256,238 256,320 136,256" fill="url(#brandFacetDark)" opacity="0.9" />
          <polygon points="376,174 256,238 256,320 376,256" fill="#38bdf8" opacity="0.95" />
          <line x1="256" y1="92" x2="256" y2="320" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />

          {/* Ribbon Wings of Infinite Learning */}
          <path
            d="M 120 310 C 170 330 220 335 256 335 C 292 335 342 330 392 310 C 372 355 320 375 256 375 C 192 375 140 355 120 310 Z"
            fill="url(#brandPlatGrad)"
          />

          {/* Golden Star at Apex */}
          <circle cx="256" cy="92" r="8" fill="url(#brandGold)" />

          {/* Text Badge: ĐBAQ - LMS */}
          <rect
            x="106"
            y="415"
            width="300"
            height="52"
            rx="26"
            fill="rgba(2, 6, 23, 0.45)"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="2"
          />
          <text
            x="256"
            y="451"
            textAnchor="middle"
            fontFamily="'Segoe UI', Arial, sans-serif"
            fontSize="25"
            fontWeight="800"
            letterSpacing="4"
            fill="#ffffff"
          >
            ĐBAQ - LMS
          </text>
        </g>
      </svg>
    </div>
  );
}
