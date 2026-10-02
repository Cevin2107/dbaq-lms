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
        <div className="absolute -inset-2 bg-gradient-to-tr from-[#0084ff] to-[#38bdf8] opacity-70 blur-lg pointer-events-none -z-10 animate-pulse-slow" />
      )}

      {/* High-fidelity Vector SVG Logo */}
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoBgGradBright" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="25%" stopColor="#0084ff" />
            <stop offset="60%" stopColor="#0066cc" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          <radialGradient id="logoInnerGlowBright" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#60a5fa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="logoGlassArcBright" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="metalGradBright" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>

          <linearGradient id="goldStarBright" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <filter id="softShadowBright" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Base Background */}
        <rect width="512" height="512" fill="url(#logoBgGradBright)" />
        <rect width="512" height="512" fill="url(#logoInnerGlowBright)" />

        {/* Top Liquid Glass Arc */}
        <path
          d="M 0 115 C 0 51.5 51.5 0 115 0 L 397 0 C 460.5 0 512 51.5 512 115 C 512 175 390 210 256 210 C 122 210 0 175 0 115 Z"
          fill="url(#logoGlassArcBright)"
        />

        {/* Specular Apple Rim */}
        <rect
          x="2.5"
          y="2.5"
          width="507"
          height="507"
          rx="112.5"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="6"
        />

        {/* Minimalist, Clean, Luxury Emblem */}
        <g filter="url(#softShadowBright)">
          {/* Academic Mortarboard Top */}
          <polygon points="256,95 405,162 256,228 107,162" fill="url(#metalGradBright)" />
          
          {/* Underside Depth */}
          <polygon points="107,162 256,228 256,242 107,176" fill="#93c5fd" opacity="0.85" />
          <polygon points="405,162 256,228 256,242 405,176" fill="#60a5fa" opacity="0.95" />

          {/* Skullcap */}
          <path
            d="M 166 198 Q 256 264 346 198 L 346 232 C 346 284 166 284 166 232 Z"
            fill="url(#metalGradBright)"
            opacity="0.95"
          />

          {/* Golden Tassel & Star */}
          <path d="M 256 162 Q 384 176 398 250 L 392 250 Q 378 180 256 166 Z" fill="url(#goldStarBright)" />
          <circle cx="398" cy="260" r="10" fill="url(#goldStarBright)" />

          {/* Stylized Book Wings */}
          <path
            d="M 136 366 C 136 312 210 278 246 276 L 246 310 C 220 312 174 332 174 366 C 174 386 212 396 246 398 L 246 430 C 178 426 136 400 136 366 Z"
            fill="url(#metalGradBright)"
          />
          <path
            d="M 376 366 C 376 312 302 278 266 276 L 266 310 C 292 312 338 332 338 366 C 338 386 300 396 266 398 L 266 430 C 334 426 376 400 376 366 Z"
            fill="url(#metalGradBright)"
          />

          {/* Center Spire */}
          <polygon points="256,260 274,360 256,400 238,360" fill="#ffffff" />
          <circle cx="256" cy="336" r="5" fill="#0066cc" />

          {/* Prominent Monogram: ĐBAQ */}
          <text
            x="256"
            y="472"
            textAnchor="middle"
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
            fontSize="46"
            fontWeight="900"
            letterSpacing="8"
            fill="#ffffff"
          >
            ĐBAQ
          </text>
        </g>
      </svg>
    </div>
  );
}
