'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAdminAssignments } from "@/features/admin/hooks/useAdminAssignments";
import DatabaseSizeCard from "@/components/DatabaseSizeCard";
import { MathText } from "@/components/MathText";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  Users,
  Calendar,
  Clock,
  BookOpen,
  Plus,
  RefreshCw,
  Copy,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  GraduationCap,
  FileText,
  ArrowUpRight,
  Check
} from "lucide-react";
import { addSession } from "@/features/admin/schedule/lib/teachingService";
import { addStudent } from "@/features/admin/schedule/lib/studentService";
import { supabase } from "@/features/admin/schedule/lib/supabase";

interface StudentOverview {
  id: string;
  fullName: string;
  email?: string;
  createdAt: string;
  monthlySessionCount: number;
  sessionSubjects: Record<string, number>;
  registeredWeeklyShifts: Array<{
    dayOfWeek: number;
    shiftName: string;
    startTime: string;
    endTime: string;
  }>;
}

interface ShiftItem {
  registrationId: string;
  studentId: string;
  studentName: string;
  shiftName: string;
  startTime: string;
  endTime: string;
}

interface DashboardStatsData {
  summary: {
    totalSystemStudents: number;
    totalMonthlySessions: number;
    totalWeeklyShifts: number;
    totalAssignments: number;
    visibleAssignments: number;
    currentMonth: number;
    currentYear: number;
  };
  students: StudentOverview[];
  weeklyShiftsByDay: Record<number, ShiftItem[]>;
  recentAssignments: any[];
}

const DAYS = [
  { value: 2, label: "Thứ 2", short: "T2" },
  { value: 3, label: "Thứ 3", short: "T3" },
  { value: 4, label: "Thứ 4", short: "T4" },
  { value: 5, label: "Thứ 5", short: "T5" },
  { value: 6, label: "Thứ 6", short: "T6" },
  { value: 7, label: "Thứ 7", short: "T7" },
  { value: 8, label: "Chủ nhật", short: "CN" },
];

const formatTimeShort = (timeStr?: string) => {
  if (!timeStr) return "";
  const parts = timeStr.trim().split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
};

export default function AdminDashboardPage() {
  const { data: assignments = [], isLoading: isAssignmentsLoading, refetch: refetchAssignments } = useAdminAssignments();
  const { addToast } = useToast();

  const [statsData, setStatsData] = useState<DashboardStatsData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [monthlySessions, setMonthlySessions] = useState<Array<{
    id: string;
    teaching_date: string;
    subject: "Toan" | "Ly";
    student_id: string;
    studentName?: string;
  }>>([]);

  const [scheduleStudents, setScheduleStudents] = useState<Array<{
    id: string;
    name: string;
    color?: string;
  }>>([]);

  const [togglingKeys, setTogglingKeys] = useState<Record<string, boolean>>({});

  // Active day filter for weekly teaching schedule tab
  const todayJsDay = new Date().getDay();
  const todayDayOfWeek = todayJsDay === 0 ? 8 : todayJsDay + 1;
  const [selectedDay, setSelectedDay] = useState<number>(todayDayOfWeek);
  const dayTabsRef = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (selectedDay && dayTabsRef.current[selectedDay]) {
      dayTabsRef.current[selectedDay]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedDay]);

  const getTargetDateForDayOfWeek = (targetDayValue: number): Date => {
    const today = new Date();
    const currentJsDay = today.getDay();
    const currentDayValue = currentJsDay === 0 ? 8 : currentJsDay + 1;
    const diff = targetDayValue - currentDayValue;
    const target = new Date(today);
    target.setDate(today.getDate() + diff);
    return target;
  };

  const formatDateIso = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateShortVi = (d: Date): string => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard-stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
        if (data.monthlySessions) setMonthlySessions(data.monthlySessions);
        if (data.scheduleStudents) setScheduleStudents(data.scheduleStudents);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setIsLoadingStats(false);
      setIsRefreshing(false);
    }
  };

  const handleToggleSubjectSession = async (
    shiftStudentName: string,
    targetDayValue: number,
    subject: "Toan" | "Ly"
  ) => {
    const targetDateObj = getTargetDateForDayOfWeek(targetDayValue);
    const targetDateStr = formatDateIso(targetDateObj);
    const formattedDateVi = formatDateShortVi(targetDateObj);
    const subjectNameVi = subject === "Toan" ? "Toán" : "Lý";
    const toggleKey = `${shiftStudentName}-${targetDateStr}-${subject}`;

    if (togglingKeys[toggleKey]) return;
    setTogglingKeys((prev) => ({ ...prev, [toggleKey]: true }));

    try {
      let matchedStudent = scheduleStudents.find(
        (s) => s.name.trim().toLowerCase() === shiftStudentName.trim().toLowerCase()
      );

      if (!matchedStudent) {
        const newSt = await addStudent(shiftStudentName, 200000, "#0066cc");
        matchedStudent = { id: newSt.id, name: newSt.name, color: newSt.color };
        setScheduleStudents((prev) => [...prev, matchedStudent!]);
      }

      const studentId = matchedStudent.id;

      const existingSession = monthlySessions.find(
        (s) =>
          s.student_id === studentId &&
          s.teaching_date === targetDateStr &&
          s.subject === subject
      );

      if (existingSession) {
        const { error } = await supabase
          .from("teaching_sessions")
          .delete()
          .eq("id", existingSession.id);

        if (error) throw error;

        setMonthlySessions((prev) => prev.filter((s) => s.id !== existingSession.id));
        addToast({
          title: `Đã bỏ môn ${subjectNameVi}`,
          description: `Đã hủy buổi ${subjectNameVi} ngày ${formattedDateVi} cho ${shiftStudentName}`,
          variant: "info",
          duration: 3000,
        });
      } else {
        const newSess = await addSession(targetDateStr, subject, studentId);
        setMonthlySessions((prev) => [
          ...prev,
          {
            id: newSess.id,
            teaching_date: targetDateStr,
            subject,
            student_id: studentId,
            studentName: shiftStudentName,
          },
        ]);
        addToast({
          title: `Đã ghi nhận buổi ${subjectNameVi}!`,
          description: `Đã lưu 1 buổi học ${subjectNameVi} ngày ${formattedDateVi} cho ${shiftStudentName}`,
          variant: "success",
          duration: 3000,
        });
      }

      fetchDashboardStats();
    } catch (err) {
      console.error("Error toggling subject session:", err);
      addToast({
        title: "Lỗi lưu buổi học",
        description: "Có lỗi xảy ra khi lưu vào cơ sở dữ liệu",
        variant: "error",
      });
    } finally {
      setTogglingKeys((prev) => ({ ...prev, [toggleKey]: false }));
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchAssignments(), fetchDashboardStats()]);
  };

  const handleCopyLink = (assignmentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/assignments/${assignmentId}/start`;
    navigator.clipboard.writeText(url).then(() => {
      addToast({
        title: "Đã sao chép!",
        description: "Link bài tập đã được sao chép vào clipboard",
        variant: "success",
        duration: 3000,
      });
    }).catch(() => {
      addToast({
        title: "Lỗi",
        description: "Không thể sao chép link",
        variant: "error",
        duration: 3000,
      });
    });
  };

  const summary = statsData?.summary || {
    totalSystemStudents: 0,
    totalMonthlySessions: 0,
    totalWeeklyShifts: 0,
    totalAssignments: assignments.length,
    visibleAssignments: assignments.filter(a => !a.is_hidden).length,
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear(),
  };

  const studentsList = statsData?.students || [];
  const weeklyShiftsByDay = statsData?.weeklyShiftsByDay || {};
  const currentDayShifts = weeklyShiftsByDay[selectedDay] || [];

  return (
    <div className="container-custom py-6 md:py-8 space-y-6 md:space-y-8 animate-fade-in">
      {/* Header with Glassmorphic Card */}
      <div className="rounded-[2rem] bg-gradient-to-br from-white via-[#f0f9ff]/60 to-[#e0f2fe]/40 dark:from-[#1d1d1f]/90 dark:via-[#1d1d1f]/80 dark:to-[#0f172a]/90 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgba(0,102,204,0.06)] p-6 sm:p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hệ thống Quản lý Học tập & Lịch dạy LMS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">
              Tổng quan Hệ thống
            </h1>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Theo dõi danh sách học sinh chính thức, số buổi học trong Tháng {summary.currentMonth}/{summary.currentYear} và lịch dạy cố định trong tuần.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingStats}
              loading={isRefreshing}
              className="rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-xs font-semibold"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              <span>Làm mới</span>
            </Button>
            
            <Link href="/admin/teaching-schedule">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-xs font-semibold"
              >
                <Clock className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                <span>Đăng ký ca dạy</span>
              </Button>
            </Link>

            <Link href="/admin/assignments/new">
              <Button variant="brand" size="sm" className="rounded-full bg-[#0066cc] hover:bg-[#005bb5] shadow-lg shadow-blue-500/20 px-5 py-2 text-xs font-semibold">
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Tạo bài mới</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Stat Overview Cards - Replaced Old Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
        {/* Card 1: Học sinh Hệ thống */}
        <div className="group rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 sm:p-6 hover:shadow-[0_8px_30px_rgba(0,102,204,0.1)] hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 sm:h-13 sm:w-13 rounded-[18px] bg-blue-50 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/50 text-[#0066cc] dark:text-blue-300">
              Chính thức
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isLoadingStats ? "..." : summary.totalSystemStudents}
          </p>
          <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>Học sinh hệ thống</span>
          </p>
        </div>

        {/* Card 2: Số buổi học Tháng này */}
        <div className="group rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 sm:p-6 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 sm:h-13 sm:w-13 rounded-[18px] bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <CalendarDays className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              Tháng {summary.currentMonth}
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isLoadingStats ? "..." : summary.totalMonthlySessions}
          </p>
          <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>Buổi dạy đã học</span>
          </p>
        </div>

        {/* Card 3: Lịch dạy cố định tuần này */}
        <div className="group rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 sm:p-6 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 sm:h-13 sm:w-13 rounded-[18px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              Trong tuần
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isLoadingStats ? "..." : summary.totalWeeklyShifts}
          </p>
          <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>Ca dạy đăng ký</span>
          </p>
        </div>

        {/* Card 4: Tổng bài tập */}
        <div className="group rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 sm:p-6 hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)] hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 sm:h-13 sm:w-13 rounded-[18px] bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              Đang mở
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isAssignmentsLoading ? "..." : summary.visibleAssignments}
          </p>
          <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>Bài tập khả dụng</span>
          </p>
        </div>
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column: Weekly Schedule & Registered Students Roster */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Visual Weekly Schedule Tabs (from /admin/teaching-schedule) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-[-0.01em] flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Lịch dạy trong tuần
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Lịch phân ca giảng dạy theo các ngày trong tuần của học sinh đã đăng ký.
                </p>
              </div>
              <Link href="/admin/teaching-schedule">
                <Button variant="outline" size="sm" className="rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                  Quản lý Ca dạy
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-5">
              
              {/* Day Selector Segmented Control (Mobile Responsive + Auto-Center Scroll) */}
              <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-slate-100/90 dark:bg-slate-800/70 rounded-[1.25rem] sm:rounded-[1.5rem] overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory shadow-inner border border-black/5 dark:border-white/5">
                {DAYS.map((day) => {
                  const isSelected = selectedDay === day.value;
                  const isToday = todayDayOfWeek === day.value;
                  const targetDateObj = getTargetDateForDayOfWeek(day.value);
                  const formattedDateVi = formatDateShortVi(targetDateObj);
                  const targetDateStr = formatDateIso(targetDateObj);

                  const recordedSessionsCount = monthlySessions.filter(
                    (s) => s.teaching_date === targetDateStr
                  ).length;

                  return (
                    <button
                      key={day.value}
                      ref={(el) => {
                        dayTabsRef.current[day.value] = el;
                      }}
                      onClick={() => setSelectedDay(day.value)}
                      className={`flex-1 min-w-[76px] sm:min-w-[95px] shrink-0 snap-center py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? "bg-white dark:bg-[#1d1d1f] text-[#0066cc] dark:text-blue-400 shadow-md shadow-blue-500/10 border border-blue-500/20 scale-[1.02]"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="text-xs sm:text-[13px] whitespace-nowrap">{day.label}</span>
                        {isToday && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0066cc] dark:bg-blue-400 shadow-xs shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between w-full px-0.5 sm:px-1 text-[10px]">
                        <span className={isSelected ? "text-[#0066cc]/90 dark:text-blue-300 font-bold" : "text-slate-400"}>
                          {formattedDateVi}
                        </span>
                        {recordedSessionsCount > 0 && (
                          <span className="px-1 sm:px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[9px] sm:text-[10px]">
                            <span className="sm:hidden">{recordedSessionsCount}b</span>
                            <span className="hidden sm:inline">{recordedSessionsCount} buổi</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Shifts Subheader */}
              <div className="flex items-center justify-between px-1 pt-1 border-b border-black/5 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Ca dạy {DAYS.find((d) => d.value === selectedDay)?.label} — {formatDateShortVi(getTargetDateForDayOfWeek(selectedDay))}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      Tích vào ô Toán hoặc Lý để ghi nhận 1 buổi dạy vào hệ thống
                    </p>
                  </div>
                </div>
              </div>

              {/* Shifts List with Interactive Subject Checkboxes */}
              {isLoadingStats ? (
                <div className="py-12 text-center text-slate-400 text-sm animate-pulse">Đang tải lịch ca dạy...</div>
              ) : currentDayShifts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2.5">
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <Clock className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-300">Không có ca dạy cố định vào {DAYS.find((d) => d.value === selectedDay)?.label}</p>
                  <p className="text-xs text-slate-400 max-w-sm">Học sinh chưa đăng ký ca dạy cố định vào ngày này.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {currentDayShifts.map((shift) => {
                    const targetDateStr = formatDateIso(getTargetDateForDayOfWeek(selectedDay));
                    const matchedSt = scheduleStudents.find(
                      (s) => s.name.trim().toLowerCase() === shift.studentName.trim().toLowerCase()
                    );
                    const stId = matchedSt?.id;

                    const isToanChecked = stId
                      ? monthlySessions.some((s) => s.student_id === stId && s.teaching_date === targetDateStr && s.subject === "Toan")
                      : false;

                    const isLyChecked = stId
                      ? monthlySessions.some((s) => s.student_id === stId && s.teaching_date === targetDateStr && s.subject === "Ly")
                      : false;

                    const isTogglingToan = togglingKeys[`${shift.studentName}-${targetDateStr}-Toan`];
                    const isTogglingLy = togglingKeys[`${shift.studentName}-${targetDateStr}-Ly`];

                    return (
                      <div
                        key={shift.registrationId}
                        className="p-3.5 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] bg-gradient-to-b from-white to-slate-50/60 dark:from-[#252528] dark:to-[#1d1d1f] border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md hover:border-[#0066cc]/40 transition-all duration-200 flex flex-col justify-between gap-3 sm:gap-3.5 group"
                      >
                        {/* Student Name & Shift Info */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md"
                              style={{ backgroundColor: matchedSt?.color || "#0066cc" }}
                            >
                              {shift.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white truncate tracking-[-0.01em]">
                                {shift.studentName}
                              </h4>
                              <p className="text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span className="truncate">{shift.shiftName} ({formatTimeShort(shift.startTime)} – {formatTimeShort(shift.endTime)})</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Attendance Checkboxes Row */}
                        <div className="pt-2 sm:pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center gap-1.5 sm:gap-2">
                          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-0.5">
                            Tính 1 buổi:
                          </span>

                          {/* Checkbox 1: Toán */}
                          <button
                            type="button"
                            onClick={() => handleToggleSubjectSession(shift.studentName, selectedDay, "Toan")}
                            disabled={isTogglingToan}
                            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 border active:scale-[0.97] ${
                              isToanChecked
                                ? "bg-[#0066cc] text-white border-[#0066cc] shadow-md shadow-blue-500/25"
                                : "bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                              isToanChecked ? "bg-white border-white text-[#0066cc]" : "border-blue-400 bg-white dark:bg-slate-900"
                            }`}>
                              {isToanChecked && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />}
                            </div>
                            <span>Toán</span>
                          </button>

                          {/* Checkbox 2: Lý */}
                          <button
                            type="button"
                            onClick={() => handleToggleSubjectSession(shift.studentName, selectedDay, "Ly")}
                            disabled={isTogglingLy}
                            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 border active:scale-[0.97] ${
                              isLyChecked
                                ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/25"
                                : "bg-orange-50/70 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/40 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                              isLyChecked ? "bg-white border-white text-orange-600" : "border-orange-400 bg-white dark:bg-slate-900"
                            }`}>
                              {isLyChecked && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />}
                            </div>
                            <span>Lý</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Registered System Students List with Session Count from /admin/schedule */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-[-0.01em] flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#0066cc] dark:text-blue-400" />
                  Học sinh trong hệ thống & Số buổi học
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Dữ liệu ghi nhận số buổi dạy thực tế (tháng {summary.currentMonth}) và ca đăng ký tuần.
                </p>
              </div>
              <Link href="/admin/schedule">
                <Button variant="outline" size="sm" className="rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#0066cc] hover:bg-blue-50 dark:hover:bg-blue-950/40">
                  Chi tiết Lịch dạy
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-4">
              {isLoadingStats ? (
                <div className="py-10 text-center text-slate-400 text-sm">Đang nạp danh sách học sinh...</div>
              ) : studentsList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">Chưa có học sinh hệ thống nào được đăng ký.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {studentsList.map((st) => (
                    <div
                      key={st.id}
                      className="p-5 rounded-[1.75rem] bg-gradient-to-b from-slate-50/90 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/80 dark:border-white/10 hover:border-[#0066cc]/40 dark:hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div>
                        {/* Student Avatar + Identity Header */}
                        <div className="flex items-center justify-between gap-3 mb-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative">
                              <div className="absolute inset-0 bg-[#0066cc] rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
                              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066cc] to-[#004bb5] text-white font-bold text-lg shadow-md shadow-blue-500/25">
                                {st.fullName.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white truncate tracking-[-0.01em] group-hover:text-[#0066cc] dark:group-hover:text-blue-400 transition-colors">
                                  {st.fullName}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/80 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-300">
                                  Hệ thống
                                </span>
                              </div>
                              {st.email && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {st.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Monthly Sessions Highlight Bar */}
                        <div className="p-3 rounded-2xl bg-white dark:bg-[#1d1d1f] border border-slate-200/60 dark:border-white/5 flex items-center justify-between shadow-xs mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              Buổi dạy thực tế (Tháng {summary.currentMonth}):
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-extrabold text-[#0066cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-xl border border-blue-100 dark:border-blue-900/40">
                            {st.monthlySessionCount} buổi
                          </span>
                        </div>

                        {/* Registered Weekly Shifts Section */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-[#0066cc] dark:text-blue-400" />
                              Lịch ca cố định hàng tuần
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-extrabold text-[10px]">
                              {st.registeredWeeklyShifts.length} ca
                            </span>
                          </div>

                          {st.registeredWeeklyShifts.length === 0 ? (
                            <div className="p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 text-xs text-slate-400 dark:text-slate-500 italic text-center border border-dashed border-slate-200 dark:border-slate-700">
                              Chưa đăng ký ca cố định trong tuần
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {st.registeredWeeklyShifts.map((shift, idx) => {
                                const dayObj = DAYS.find((d) => d.value === shift.dayOfWeek);
                                const startTimeStr = formatTimeShort(shift.startTime);
                                const endTimeStr = formatTimeShort(shift.endTime);
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#1d1d1f] border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-[#0066cc]/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold px-3 py-1 rounded-xl bg-gradient-to-r from-[#0066cc] to-[#0052a3] text-white text-xs shadow-xs">
                                        {dayObj?.label || `Thứ ${shift.dayOfWeek}`}
                                      </span>
                                      {shift.shiftName && (
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                          {shift.shiftName}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-[#0066cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-xl border border-blue-100/80 dark:border-blue-900/40 font-mono">
                                      <Clock className="w-3 h-3 text-blue-500" />
                                      <span>{startTimeStr} – {endTimeStr}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Assignment List & Database Size */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Assignment List Card */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-[-0.01em] flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                Bài tập gần đây
              </h2>
              <Link href="/admin/assignments">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#0066cc]">
                  Xem tất cả
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </Link>
            </div>

            <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 space-y-3">
              {isAssignmentsLoading ? (
                <div className="py-8 text-center text-slate-400 text-sm">Đang nạp bài tập...</div>
              ) : assignments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">Chưa có bài tập nào.</div>
              ) : (
                assignments.slice(0, 5).map((a: any) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-[1.25rem] bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 flex items-center justify-between gap-3 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          a.subject === "Toán" || a.subject === "Toan"
                            ? "bg-blue-50 dark:bg-blue-950/50 text-[#0066cc] dark:text-blue-300"
                            : a.subject === "Lý" || a.subject === "Ly"
                            ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}>
                          {a.subject || "Chung"}
                        </span>
                        {a.grade && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {a.grade}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white truncate">
                        <MathText text={a.title} />
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleCopyLink(a.id, e)}
                        className="h-8 w-8 rounded-full text-slate-500 hover:text-[#0066cc] hover:bg-white dark:hover:bg-slate-700"
                        title="Sao chép link bài tập"
                        aria-label="Sao chép link bài tập"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>

                      <Link href={`/admin/assignments/${a.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:text-[#0066cc] hover:bg-white dark:hover:bg-slate-700">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Database Storage Metrics Card */}
          <div>
            <DatabaseSizeCard />
          </div>

        </div>

      </div>
    </div>
  );
}
