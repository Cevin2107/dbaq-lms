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
        <div className="absolute -inset-2 bg-gradient-to-tr from-[#0066cc] to-[#38bdf8] opacity-60 blur-lg pointer-events-none -z-10 animate-pulse-slow" />
      )}

      {/* High-fidelity Vector SVG Logo */}
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0071e3" />
            <stop offset="30%" stopColor="#0066cc" />
            <stop offset="70%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <radialGradient id="logoGlow" cx="35%" cy="25%" r="75%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#0066cc" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="logoGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="logoEmblem" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#f0f9ff" />
            <stop offset="75%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <filter id="logoDropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#051532" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Base Background */}
        <rect width="512" height="512" fill="url(#logoBg)" />
        <rect width="512" height="512" fill="url(#logoGlow)" />

        {/* Specular Highlight Arc */}
        <path
          d="M 0 115 C 0 51.5 51.5 0 115 0 L 397 0 C 460.5 0 512 51.5 512 115 C 512 180 390 215 256 215 C 122 215 0 180 0 115 Z"
          fill="url(#logoGlass)"
        />

        {/* Apple Thin Specular Border Rim */}
        <rect
          x="2"
          y="2"
          width="508"
          height="508"
          rx="113"
          fill="none"
          stroke="rgba(255,255,255,0.38)"
          strokeWidth="6"
        />

        {/* Emblem Content */}
        <g filter="url(#logoDropShadow)">
          {/* Mortarboard Rhombus */}
          <polygon points="256,110 398,172 256,234 114,172" fill="url(#logoEmblem)" />
          <polygon points="114,172 256,234 256,246 114,184" fill="#93c5fd" opacity="0.75" />
          <polygon points="398,172 256,234 256,246 398,184" fill="#60a5fa" opacity="0.85" />

          {/* Skullcap */}
          <path
            d="M 172 205 Q 256 268 340 205 L 340 236 C 340 285 172 285 172 236 Z"
            fill="url(#logoEmblem)"
            opacity="0.95"
          />

          {/* Golden Tassel */}
          <path d="M 256 172 Q 380 185 392 258 L 386 258 Q 374 190 256 176 Z" fill="url(#logoGold)" />
          <circle cx="392" cy="268" r="9" fill="url(#logoGold)" />

          {/* Stylized A & Q wings */}
          <path
            d="M 140 376 C 140 326 210 292 244 290 L 244 322 C 220 324 176 344 176 376 C 176 394 212 404 244 406 L 244 436 C 180 432 140 408 140 376 Z"
            fill="url(#logoEmblem)"
          />
          <path
            d="M 372 376 C 372 326 302 292 268 290 L 268 322 C 292 324 336 344 336 376 C 336 394 300 404 268 406 L 268 436 C 332 432 372 408 372 376 Z"
            fill="url(#logoEmblem)"
          />

          {/* Center Spire */}
          <polygon points="256,275 272,370 256,410 240,370" fill="#ffffff" />
          <circle cx="256" cy="345" r="5" fill="#0066cc" />

          {/* Text DBAQ • LMS */}
          <text
            x="256"
            y="468"
            textAnchor="middle"
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
            fontSize="36"
            fontWeight="800"
            letterSpacing="5"
            fill="#ffffff"
            opacity="0.95"
          >
            DBAQ • LMS
          </text>
        </g>
      </svg>
    </div>
  );
}
