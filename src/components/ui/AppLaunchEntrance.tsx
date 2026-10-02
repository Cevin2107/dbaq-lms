"use client";

import React, { useEffect, useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import clsx from "clsx";

interface AppLaunchEntranceProps {
  children: React.ReactNode;
}

export function AppLaunchEntrance({ children }: AppLaunchEntranceProps) {
  const [stage, setStage] = useState<"launching" | "fading" | "complete">("launching");

  useEffect(() => {
    // Check if user already launched recently in this session (avoid annoying flash on rapid page navigation)
    const hasLaunched = typeof window !== "undefined" && sessionStorage.getItem("dbaq_app_launched");

    if (hasLaunched) {
      setStage("complete");
      return;
    }

    // Sequence the launch animation:
    // 0ms -> 450ms: Logo glow & title reveals
    // 550ms: Smooth zoom & fade out of splash layer
    // 850ms: Complete and unmount splash
    const timerFade = setTimeout(() => {
      setStage("fading");
    }, 600);

    const timerComplete = setTimeout(() => {
      setStage("complete");
      try {
        sessionStorage.setItem("dbaq_app_launched", "true");
      } catch (_) {}
    }, 950);

    return () => {
      clearTimeout(timerFade);
      clearTimeout(timerComplete);
    };
  }, []);

  return (
    <>
      {/* Main app content with smooth entrance zoom/fade */}
      <div
        className={clsx(
          "w-full min-h-screen transition-all duration-700 ease-liquid",
          stage === "launching" ? "opacity-90 scale-[0.99] filter blur-[1px]" : "opacity-100 scale-100 filter-none"
        )}
      >
        {children}
      </div>

      {/* Splash overlay screen */}
      {stage !== "complete" && (
        <div
          className={clsx(
            "fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none transition-all duration-500 ease-liquid select-none",
            stage === "fading"
              ? "opacity-0 scale-105 pointer-events-none blur-sm"
              : "opacity-100 scale-100 bg-[#f8fafc]/90 dark:bg-[#0a0a0a]/95 backdrop-blur-2xl"
          )}
        >
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-tr from-[#0066cc]/25 to-[#38bdf8]/20 blur-3xl pointer-events-none animate-pulse-slow" />

          {/* Central Logo & Brand Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            <div className="mb-6 transform transition-transform duration-700 ease-spring hover:scale-105 animate-scale-in">
              <BrandLogo size="xl" glow animate className="shadow-2xl" />
            </div>

            <div className="space-y-2 animate-slide-up">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
                Gia sư Đào Bá Anh Quân
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs">
                Hệ thống học tập & rèn luyện trực tuyến
              </p>
            </div>

            {/* Apple-style thin smooth loader bar */}
            <div className="mt-8 w-44 h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden relative shadow-inner">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-[#0066cc] via-[#2997ff] to-indigo-500 animate-[shimmer_1.2s_infinite]" />
            </div>
          </div>

          {/* Footer note inside splash */}
          <div className="absolute bottom-6 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-600 uppercase">
            DBAQ • LMS PRO
          </div>
        </div>
      )}
    </>
  );
}
