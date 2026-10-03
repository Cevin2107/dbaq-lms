"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { BookOpen, CalendarPlus, CloudSun, FileText, Home, Moon, Sparkles, Sun } from "lucide-react";
import dynamic from "next/dynamic";
import { AssignmentList } from "@/components/AssignmentList";
import { ScheduleRegistrationPanel } from "@/features/schedule/ScheduleRegistrationPanel";

const DocumentsPanel = dynamic(
  () => import("@/features/documents/DocumentsPanel").then((mod) => mod.DocumentsPanel),
  { ssr: false }
);
import { MotivationalQuoteCard } from "@/components/MotivationalQuoteCard";
import type { Assignment, StudentScheduleItem } from "@/lib/types";
import bgImg from "@/app/bg.jpg";

type HomeTabsProps = {
  assignments: Assignment[];
  schedules?: StudentScheduleItem[];
  studentName?: string;
  greeting: string;
  greetingKind: "morning" | "afternoon" | "evening";
};

const tabs = [
  { id: "home", label: "Trang chủ", icon: Home },
  { id: "schedule", label: "Đăng ký lịch học", icon: CalendarPlus },
  { id: "documents", label: "Tài liệu", icon: FileText },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function HomeTabs({ assignments, schedules = [], studentName, greeting, greetingKind }: HomeTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const GreetingIcon = greetingKind === "morning" ? Sun : greetingKind === "afternoon" ? CloudSun : Moon;
  const iconColor =
    greetingKind === "morning"
      ? "text-amber-500 dark:text-amber-400"
      : greetingKind === "afternoon"
        ? "text-orange-500 dark:text-orange-400"
        : "text-indigo-500 dark:text-indigo-400";

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3.5 sm:px-6 md:px-8 pb-12 sm:pb-16">
      {/* Desktop & Mobile Segmented Control with Liquid Sliding Pill */}
      <div className="flex justify-center mb-6 sm:mb-8 px-1">
        <div className="relative grid grid-cols-3 p-1.5 rounded-full bg-white/70 dark:bg-[#1a1a1e]/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-glass w-full max-w-md sm:max-w-lg select-none">
          {/* Liquid Sliding Indicator Pill (Mathematical Pixel-Perfect Match to Grid Columns) */}
          <div
            className="absolute top-1.5 bottom-1.5 rounded-full bg-white dark:bg-[#2c2c30] shadow-md border border-black/[0.04] dark:border-white/10 transition-transform duration-400 ease-liquid pointer-events-none"
            style={{
              width: "calc((100% - 12px) / 3)",
              left: "6px",
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "relative z-10 w-full flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-300 min-w-0 select-none",
                  isActive
                    ? "text-[#0066cc] dark:text-[#2997ff]"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                <Icon className={clsx("h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform duration-300", isActive ? "scale-110" : "scale-100")} />
                <span className="truncate">
                  {tab.id === "schedule" ? (
                    <>
                      <span>Đăng ký lịch</span>
                      <span className="hidden min-[450px]:inline"> học</span>
                    </>
                  ) : (
                    tab.label
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content with Spring Enter Animation */}
      <div key={activeTab} className="animate-tab-enter">
        {activeTab === "home" && (
          <div className="space-y-8">
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-sky-50/90 dark:from-blue-950/40 dark:via-slate-900/40 dark:to-indigo-950/40 border border-blue-100/80 dark:border-blue-900/30 p-5 sm:p-10 shadow-[0_10px_35px_rgba(0,102,204,0.08)]">
              {/* Subtle ambient lighting orb */}
              <div className="pointer-events-none absolute -right-20 -top-20 w-72 h-72 rounded-full bg-gradient-to-br from-blue-400/20 to-sky-300/10 blur-3xl dark:from-blue-600/15" />

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] dark:bg-blue-500/20 dark:text-blue-300 text-xs font-bold mb-4 shadow-sm">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Hệ thống bài tập & học tập trực tuyến</span>
                    <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                  </div>

                  {/* Mobile portrait view */}
                  <div className="md:hidden w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] rounded-[24px] overflow-hidden mb-3 relative shadow-[rgba(0,0,0,0.2)_0px_8px_30px] border-2 border-white/60 dark:border-white/10">
                    <Image
                      src={bgImg}
                      alt="Đào Bá Anh Quân"
                      fill
                      className="object-cover object-[center_35%]"
                      priority
                    />
                  </div>

                  <div className="mb-3 md:mb-6 relative z-10 flex justify-center md:justify-start">
                    <h1
                      className="font-bold tracking-tight text-[#1d1d1f] dark:text-white break-words sm:whitespace-nowrap leading-tight"
                      style={{ fontSize: "clamp(22px, 3.8vw, 64px)" }}
                    >
                      Gia sư Đào Bá Anh Quân
                    </h1>
                  </div>

                  <div className="flex flex-col items-center md:items-start">
                    <div className="flex items-center justify-center md:justify-start gap-2.5 text-[18px] sm:text-[22px] md:text-[26px] font-normal text-[#1d1d1f]/80 dark:text-white/80 tracking-tight leading-[1.3]">
                      <GreetingIcon className={`h-6 w-6 sm:h-7 sm:w-7 ${iconColor}`} />
                      <h2>
                        {greeting}, <span className="font-semibold text-[#1d1d1f] dark:text-white">{studentName || "Học sinh"}</span>.
                      </h2>
                    </div>
                    <MotivationalQuoteCard />
                  </div>
                </div>

                {/* Desktop portrait view */}
                <div className="hidden md:block shrink-0 relative w-72 h-72 lg:w-[360px] lg:h-[360px]">
                  <div className="relative w-full h-full rounded-[24px] overflow-hidden shadow-[rgba(0,0,0,0.22)_0px_12px_36px] border border-white/60 dark:border-white/10 group">
                    <Image
                      src={bgImg}
                      alt="Đào Bá Anh Quân"
                      fill
                      className="object-cover object-[center_35%] transition-transform duration-700 ease-spring group-hover:scale-105"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            <AssignmentList
              assignments={assignments}
              schedules={schedules}
              onNavigateToSchedule={() => setActiveTab("schedule")}
            />
          </div>
        )}

        {activeTab === "schedule" && <ScheduleRegistrationPanel />}
        {activeTab === "documents" && <DocumentsPanel />}
      </div>
    </div>
  );
}

