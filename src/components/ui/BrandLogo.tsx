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

      {/* Vector SVG: Academic Cap + Stylized Pen Nib + ĐBAQ - LMS Box */}
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
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#020617" floodOpacity="0.45" />
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
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="6"
        />

        {/* Academic Mortarboard + Pen Nib + Wings */}
        <g filter="url(#brandShadow)">
          {/* Cap Top Rhombus */}
          <polygon points="256,92 396,152 256,212 116,152" fill="url(#brandEmblemGrad)" />
          <polygon points="116,152 256,212 256,224 116,164" fill="#93c5fd" opacity="0.75" />
          <polygon points="396,152 256,212 256,224 396,164" fill="#60a5fa" opacity="0.85" />

          {/* Skullcap */}
          <path
            d="M 172 184 Q 256 244 340 184 L 340 214 C 340 260 172 260 172 214 Z"
            fill="url(#brandEmblemGrad)"
            opacity="0.95"
          />

          {/* Golden Tassel & Star */}
          <path d="M 256 152 Q 380 165 392 234 L 386 234 Q 374 170 256 156 Z" fill="url(#brandGoldGrad)" />
          <circle cx="392" cy="244" r="8.5" fill="url(#brandGoldGrad)" />

          {/* Stylized Open Book Wings */}
          <path
            d="M 142 352 C 142 306 208 274 242 272 L 242 302 C 218 304 176 322 176 352 C 176 370 210 380 242 382 L 242 410 C 180 406 142 382 142 352 Z"
            fill="url(#brandEmblemGrad)"
          />
          <path
            d="M 370 352 C 370 306 304 274 270 272 L 270 302 C 294 304 336 322 336 352 C 336 370 302 380 270 382 L 270 410 C 332 406 370 382 370 352 Z"
            fill="url(#brandEmblemGrad)"
          />

          {/* Central Pen Nib Spire */}
          <polygon points="256,256 272,346 256,386 240,346" fill="#ffffff" />
          <circle cx="256" cy="324" r="5" fill="#0066cc" />

          {/* Liquid Glass Box for ĐBAQ - LMS */}
          <rect
            x="106"
            y="420"
            width="300"
            height="52"
            rx="26"
            fill="rgba(2, 6, 23, 0.45)"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="2"
          />
          <text
            x="256"
            y="456"
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
