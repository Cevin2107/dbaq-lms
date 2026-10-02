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
  xs: "h-7 w-7 rounded-[9px]",
  sm: "h-9 w-9 rounded-[11px]",
  md: "h-10 w-10 sm:h-11 sm:w-11 rounded-[14px]",
  lg: "h-14 w-14 sm:h-16 sm:w-16 rounded-[20px]",
  xl: "h-20 w-20 sm:h-24 sm:w-24 rounded-[28px]",
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
      {/* Ambient Glow behind */}
      {glow && (
        <div className="absolute -inset-2 bg-gradient-to-tr from-[#0084ff] to-[#38bdf8] opacity-80 blur-lg pointer-events-none -z-10 animate-pulse-slow" />
      )}

      {/* Vector SVG: Bold, Crisp Academic Cap + Stylized Pen Nib + ĐBAQ - LMS Box */}
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="brandIconBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="25%" stopColor="#0084ff" />
            <stop offset="65%" stopColor="#0066cc" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>

          <radialGradient id="brandTopGlow" cx="45%" cy="25%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="brandGlassSheen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="brandEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#f0f9ff" />
            <stop offset="75%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          <linearGradient id="brandGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <filter id="brandShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#051532" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Base Squircle */}
        <rect width="512" height="512" fill="url(#brandIconBg)" />
        <rect width="512" height="512" fill="url(#brandTopGlow)" />

        {/* Top Glass Arc */}
        <path
          d="M 0 115 C 0 51.5 51.5 0 115 0 L 397 0 C 460.5 0 512 51.5 512 115 C 512 175 390 205 256 205 C 122 205 0 175 0 115 Z"
          fill="url(#brandGlassSheen)"
        />

        {/* Apple Specular Thin Border */}
        <rect
          x="2.5"
          y="2.5"
          width="507"
          height="507"
          rx="112.5"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="6"
        />

        {/* Academic Mortarboard + Pen Nib + Wings */}
        <g filter="url(#brandShadow)">
          {/* Cap Top Rhombus */}
          <polygon points="256,82 406,146 256,210 106,146" fill="url(#brandEmblemGrad)" />
          <polygon points="106,146 256,210 256,224 106,160" fill="#93c5fd" opacity="0.85" />
          <polygon points="406,146 256,210 256,224 406,160" fill="#60a5fa" opacity="0.95" />

          {/* Skullcap */}
          <path
            d="M 166 180 Q 256 244 346 180 L 346 212 C 346 260 166 260 166 212 Z"
            fill="url(#brandEmblemGrad)"
            opacity="0.95"
          />

          {/* Golden Tassel & Star */}
          <path d="M 256 146 Q 388 160 400 230 L 394 230 Q 380 164 256 150 Z" fill="url(#brandGoldGrad)" />
          <circle cx="400" cy="240" r="9" fill="url(#goldGrad)" />

          {/* Stylized Open Book Wings */}
          <path
            d="M 136 346 C 136 298 206 266 242 264 L 242 296 C 216 298 172 316 172 346 C 172 366 208 376 242 378 L 242 408 C 176 404 136 378 136 346 Z"
            fill="url(#brandEmblemGrad)"
          />
          <path
            d="M 376 346 C 376 298 306 266 270 264 L 270 296 C 296 298 340 316 340 346 C 340 366 304 376 270 378 L 270 408 C 336 404 376 378 376 346 Z"
            fill="url(#brandEmblemGrad)"
          />

          {/* Central Pen Nib Spire */}
          <polygon points="256,248 274,340 256,382 238,340" fill="#ffffff" />
          <circle cx="256" cy="318" r="5.5" fill="#0066cc" />

          {/* Liquid Glass Box for ĐBAQ - LMS (Crisp, High-Contrast) */}
          <rect
            x="100"
            y="416"
            width="312"
            height="56"
            rx="28"
            fill="rgba(2, 6, 23, 0.45)"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="2"
          />
          <text
            x="256"
            y="454"
            textAnchor="middle"
            fontFamily="'Segoe UI', Arial, sans-serif"
            fontSize="27"
            fontWeight="900"
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
