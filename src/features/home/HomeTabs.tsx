"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { BookOpen, CalendarPlus, CloudSun, FileText, Home, Moon, Sun } from "lucide-react";
import dynamic from "next/dynamic";
import { AssignmentList } from "@/components/AssignmentList";
import { ScheduleRegistrationPanel } from "@/features/schedule/ScheduleRegistrationPanel";

const DocumentsPanel = dynamic(
  () => import("@/features/documents/DocumentsPanel").then((mod) => mod.DocumentsPanel),
  { ssr: false }
);
import type { Assignment } from "@/lib/types";
import bgImg from "@/app/bg.jpg";

type HomeTabsProps = {
  assignments: Assignment[];
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

export function HomeTabs({ assignments, studentName, greeting, greetingKind }: HomeTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const GreetingIcon = greetingKind === "morning" ? Sun : greetingKind === "afternoon" ? CloudSun : Moon;
  const iconColor =
    greetingKind === "morning"
      ? "text-amber-500 dark:text-amber-400"
      : greetingKind === "afternoon"
        ? "text-orange-500 dark:text-orange-400"
        : "text-indigo-500 dark:text-indigo-400";

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 pb-16">
      <div className="mb-6 rounded-full bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-md border border-black/5 dark:border-white/10 p-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-[#0066cc] text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "home" && (
        <div className="space-y-8 animate-slide-up">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-sky-50/80 dark:from-blue-950/40 dark:via-slate-900/40 dark:to-indigo-950/40 border border-blue-100/80 dark:border-blue-900/30 p-6 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] dark:bg-blue-500/20 dark:text-blue-300 text-xs font-bold mb-4 order-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Hệ thống bài tập trực tuyến</span>
                </div>

                <div className="md:hidden w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-[24px] overflow-hidden mb-0 relative shadow-[rgba(0,0,0,0.22)_3px_5px_30px_0px] order-2">
                  <Image
                    src={bgImg}
                    alt="Đào Bá Anh Quân"
                    fill
                    className="object-cover object-[center_35%]"
                    priority
                  />
                </div>

                <div className="mb-4 md:mb-8 relative z-10 -mt-6 md:-mt-0 order-3">
                  <h1 
                    className="font-bold md:font-semibold leading-[1.07] tracking-[-0.02em] text-[#1d1d1f] dark:text-white whitespace-nowrap bg-white/70 dark:bg-black/70 backdrop-blur-md md:bg-transparent md:backdrop-blur-none px-4 py-2 rounded-2xl md:p-0 md:rounded-none border border-white/40 md:border-transparent shadow-sm md:shadow-none"
                    style={{ fontSize: "clamp(22px, 4.2vw, 72px)" }}
                  >
                    Gia sư Đào Bá Anh Quân
                  </h1>
                </div>

                <div className="flex flex-col items-center md:items-start order-4">
                  <div className="flex items-center justify-center md:justify-start gap-2.5 text-[19px] sm:text-[24px] md:text-[28px] font-normal text-[#1d1d1f]/80 dark:text-white/80 tracking-tight leading-[1.3]">
                    <GreetingIcon className={`h-6 w-6 sm:h-7 sm:w-7 ${iconColor}`} />
                    <h2>
                      {greeting}, <span className="font-semibold text-[#1d1d1f] dark:text-white">{studentName || "Học sinh"}</span>.
                    </h2>
                  </div>
                  <div className="mt-3 text-[15px] sm:text-[17px] text-[#1d1d1f]/60 dark:text-white/50 tracking-tight text-center md:text-left max-w-[90%] md:max-w-lg">
                    <div className="flex flex-col items-center">
                      😎 Cố gắng lên nhé học trò của tôi ơi 😎
                    </div>
                    <div className="flex flex-col items-center">
                      Chúc em học tốt <span className="text-[40px]">💯</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden md:block shrink-0 relative w-72 h-72 lg:w-[380px] lg:h-[380px]">
                <div className="relative w-full h-full rounded-[18px] overflow-hidden shadow-[rgba(0,0,0,0.22)_3px_5px_30px_0px]">
                  <Image
                    src={bgImg}
                    alt="Đào Bá Anh Quân"
                    fill
                    className="object-cover object-[center_35%]"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          <AssignmentList assignments={assignments} />
        </div>
      )}

      {activeTab === "schedule" && <ScheduleRegistrationPanel />}
      {activeTab === "documents" && <DocumentsPanel />}
    </div>
  );
}
