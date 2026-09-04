"use client";

import { useMemo } from "react";
import { 
  Clock, 
  CalendarCheck2, 
  ChevronRight, 
  Radio, 
  CalendarPlus,
  Sparkles
} from "lucide-react";
import clsx from "clsx";
import type { StudentScheduleItem } from "@/lib/types";

const DAYS_MAP: Record<number, { label: string; short: string }> = {
  2: { label: "Thứ Hai", short: "T2" },
  3: { label: "Thứ Ba", short: "T3" },
  4: { label: "Thứ Tư", short: "T4" },
  5: { label: "Thứ Năm", short: "T5" },
  6: { label: "Thứ Sáu", short: "T6" },
  7: { label: "Thứ Bảy", short: "T7" },
  8: { label: "Chủ Nhật", short: "CN" },
};

function getVietnamCurrentTime() {
  const now = new Date();
  const vnDateStr = now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
  const vnDate = new Date(vnDateStr);
  const jsDay = vnDate.getDay();
  const currentDayOfWeek = jsDay === 0 ? 8 : jsDay + 1; // 2: Mon ... 8: Sun
  const currentHours = vnDate.getHours();
  const currentMinutes = vnDate.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  return { currentDayOfWeek, currentTotalMinutes, vnDate };
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return "";
  return timeStr.substring(0, 5);
}

interface UpcomingScheduleCardProps {
  schedules?: StudentScheduleItem[];
  onNavigateToSchedule?: () => void;
}

export function UpcomingScheduleCard({
  schedules = [],
  onNavigateToSchedule,
}: UpcomingScheduleCardProps) {
  const { currentDayOfWeek, currentTotalMinutes } = getVietnamCurrentTime();

  // Find next/active shift
  const upcomingInfo = useMemo(() => {
    if (!schedules || schedules.length === 0) return null;

    const todayShifts = schedules.filter((s) => s.dayOfWeek === currentDayOfWeek);

    for (const shift of todayShifts) {
      const startMins = parseTimeToMinutes(shift.startTime);
      const endMins = parseTimeToMinutes(shift.endTime);

      if (currentTotalMinutes >= startMins && currentTotalMinutes <= endMins) {
        const remainingLiveMins = endMins - currentTotalMinutes;
        const hoursLeft = Math.floor(remainingLiveMins / 60);
        const minsLeft = remainingLiveMins % 60;
        const remainingStr = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}p` : `${minsLeft}p`;

        return {
          shift,
          status: "live" as const,
          label: "Đang diễn ra",
          timeRemainingText: `Còn ${remainingStr} nữa kết thúc`,
        };
      }

      if (currentTotalMinutes < startMins) {
        const diffMins = startMins - currentTotalMinutes;
        const hoursLeft = Math.floor(diffMins / 60);
        const minsLeft = diffMins % 60;
        const remainingStr = hoursLeft > 0 ? `${hoursLeft} giờ ${minsLeft > 0 ? `${minsLeft}p` : ""}` : `${diffMins} phút`;

        return {
          shift,
          status: "today_soon" as const,
          label: "Hôm nay",
          timeRemainingText: `Bắt đầu sau ${remainingStr}`,
        };
      }
    }

    // Nearest shift in upcoming days
    let nearestShift: StudentScheduleItem | null = null;
    let minDaysDiff = 999;

    for (const shift of schedules) {
      let daysDiff = shift.dayOfWeek - currentDayOfWeek;
      if (daysDiff <= 0) {
        daysDiff += 7;
      }
      if (daysDiff < minDaysDiff) {
        minDaysDiff = daysDiff;
        nearestShift = shift;
      }
    }

    if (nearestShift) {
      const dayName = DAYS_MAP[nearestShift.dayOfWeek]?.label || `Thứ ${nearestShift.dayOfWeek}`;
      const timeDiffText = minDaysDiff === 1 ? "Ngày mai" : `${dayName} (sau ${minDaysDiff} ngày)`;

      return {
        shift: nearestShift,
        status: "upcoming" as const,
        label: timeDiffText,
        timeRemainingText: `${formatTimeDisplay(nearestShift.startTime)} – ${formatTimeDisplay(nearestShift.endTime)}`,
      };
    }

    return null;
  }, [schedules, currentDayOfWeek, currentTotalMinutes]);

  const hasRegistrations = schedules && schedules.length > 0;

  return (
    <div className="rounded-[2rem] bg-white dark:bg-[#1d1d1f] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 p-5 sm:p-6 flex flex-col gap-3.5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#0066cc] to-[#0052a3] text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
            <CalendarCheck2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              Ca học sắp tới
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToSchedule}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066cc] dark:text-[#2997ff] hover:underline shrink-0 bg-blue-50/80 dark:bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/30 transition active:scale-95"
        >
          <span>{hasRegistrations ? "Đổi ca học" : "Đăng ký ca"}</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Main: Next / Live Shift Banner */}
      {hasRegistrations && upcomingInfo ? (
        <div
          className={clsx(
            "p-3.5 sm:p-4 rounded-2xl border transition-all relative overflow-hidden",
            upcomingInfo.status === "live"
              ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30 dark:border-emerald-500/20"
              : upcomingInfo.status === "today_soon"
                ? "bg-gradient-to-r from-[#0066cc]/10 via-[#0066cc]/5 to-transparent border-[#0066cc]/30 dark:border-blue-500/20"
                : "bg-slate-50/80 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/5"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                upcomingInfo.status === "live"
                  ? "bg-emerald-500 text-white animate-pulse"
                  : upcomingInfo.status === "today_soon"
                    ? "bg-[#0066cc] text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              )}
            >
              {upcomingInfo.status === "live" ? (
                <Radio className="h-4 w-4 animate-pulse" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={clsx(
                    "text-[10px] font-black uppercase px-2 py-0.5 rounded-md",
                    upcomingInfo.status === "live"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                      : upcomingInfo.status === "today_soon"
                        ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  )}
                >
                  {upcomingInfo.label}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {upcomingInfo.timeRemainingText}
                </span>
              </div>

              <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {DAYS_MAP[upcomingInfo.shift.dayOfWeek]?.label} • {upcomingInfo.shift.shiftName}
                </span>
                <span className="text-xs font-mono font-bold text-[#0066cc] dark:text-[#2997ff]">
                  ({formatTimeDisplay(upcomingInfo.shift.startTime)} – {formatTimeDisplay(upcomingInfo.shift.endTime)})
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state if student has no shifts */
        <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/60 dark:border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-400 flex items-center justify-center shrink-0">
              <CalendarPlus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Chưa có ca học cố định
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Đăng ký ca học để nhận thông báo lịch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToSchedule}
            className="px-3 py-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-bold shrink-0 shadow-xs transition active:scale-95 flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3" />
            <span>Đăng ký</span>
          </button>
        </div>
      )}
    </div>
  );
}
