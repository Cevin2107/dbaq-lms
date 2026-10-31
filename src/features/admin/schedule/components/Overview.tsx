"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
  Users,
} from "lucide-react";
import { getSessionsForAllStudents, getSessionsForYear } from "@/features/admin/schedule/lib/teachingService";
import { getStudents } from "@/features/admin/schedule/lib/studentService";
import type { Student, Subject } from "@/features/admin/schedule/lib/database.types";
import { SUBJECT_NAMES, SUBJECT_COLORS } from "@/features/admin/schedule/constants/subjects";
import { getMonthName } from "@/features/admin/schedule/utils/dateUtils";

interface StudentStats {
  student: Student;
  totalSessions: number;
  totalIncome: number;
  subjects: Record<Subject, number>;
}

interface OverviewProps {
  onOpenSettings: () => void;
  refreshKey: number;
}

export function Overview({ onOpenSettings, refreshKey }: OverviewProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [yearlySessions, setYearlySessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [studentsData, sessionsData, yearlyData] = await Promise.all([
          getStudents(),
          getSessionsForAllStudents(selectedYear, selectedMonth),
          getSessionsForYear(selectedYear),
        ]);
        setStudents(studentsData);
        setSessions(sessionsData);
        setYearlySessions(yearlyData);
      } catch (error) {
        console.error("Error loading overview data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedYear, selectedMonth, refreshKey]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const totalSessions = sessions.length;
  const totalIncome = sessions.reduce((sum, session) => {
    const student = students.find((s) => s.id === session.student_id);
    return sum + (student?.salary_per_session || 0);
  }, 0);

  const studentStats: StudentStats[] = students
    .map((student) => {
      const studentSessions = sessions.filter((s) => s.student_id === student.id);
      const totalSessions = studentSessions.length;
      const totalIncome = totalSessions * student.salary_per_session;

      const subjects = studentSessions.reduce((acc, session) => {
        acc[session.subject] = (acc[session.subject] || 0) + 1;
        return acc;
      }, {} as Record<Subject, number>);

      return { student, totalSessions, totalIncome, subjects };
    })
    .filter((stat) => stat.totalSessions > 0);

  const monthlyIncomes = Array(12).fill(0);
  yearlySessions.forEach(session => {
    const dateParts = session.teaching_date.split('-');
    if (dateParts.length >= 2) {
      const m = parseInt(dateParts[1], 10) - 1;
      if (m >= 0 && m < 12) {
        const student = students.find((s) => s.id === session.student_id);
        monthlyIncomes[m] += (student?.salary_per_session || 0);
      }
    }
  });

  const maxMonthlyIncome = Math.max(...monthlyIncomes, 1);
  const yearlyIncome = monthlyIncomes.reduce((sum, income) => sum + income, 0);

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1_000_000) {
      return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(amount / 1_000_000)}tr`;
    }
    if (amount >= 1_000) {
      return `${Math.round(amount / 1_000)}k`;
    }
    return `${Math.round(amount)}`;
  };

  const chartLeft = 72;
  const chartRight = 744;
  const chartTop = 24;
  const chartBottom = 176;
  const incomePoints = monthlyIncomes.map((income, index) => ({
    x: chartLeft + (index * (chartRight - chartLeft)) / (monthlyIncomes.length - 1),
    y: chartBottom - (income / maxMonthlyIncome) * (chartBottom - chartTop),
    income,
  }));
  const incomeLinePath = incomePoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const incomeAreaPath = `${incomeLinePath} L ${chartRight} ${chartBottom} L ${chartLeft} ${chartBottom} Z`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0066cc] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Navigator Toolbar */}
      <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-[#0066cc] dark:text-blue-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Thống kê Tổng quan</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Xem báo cáo tổng hợp theo từng tháng và năm</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-white/[0.05] p-1.5 rounded-full border border-slate-200/80 dark:border-white/10">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-full hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white min-w-[110px] text-center px-2">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-full hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Overall Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-6 sm:p-7 rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex items-center gap-4.5">
          <div className="p-4 bg-blue-500/10 text-[#0066cc] dark:text-blue-400 rounded-2xl shrink-0">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng số buổi dạy ({getMonthName(selectedMonth)})</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-[-0.02em] mt-1">{totalSessions} <span className="text-sm font-semibold text-slate-400">buổi</span></p>
          </div>
        </div>

        <div className="p-6 sm:p-7 rounded-[2.25rem] bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20 text-white flex items-center gap-4.5 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 blur-xl pointer-events-none" />
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <div className="relative">
            <p className="text-xs font-bold text-emerald-100">Tổng thu nhập ({getMonthName(selectedMonth)})</p>
            <p className="text-2xl sm:text-3xl font-black tracking-[-0.02em] mt-1">{formatCurrency(totalIncome)}</p>
          </div>
        </div>
      </div>

      {/* Per-Student Breakdown */}
      <div className="p-6 sm:p-8 rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2.5 text-base">
            <div className="p-2 rounded-xl bg-blue-500/10 text-[#0066cc] dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span>Thống kê theo từng học sinh ({getMonthName(selectedMonth)})</span>
          </h3>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
            {studentStats.length} học sinh có buổi
          </span>
        </div>

        {studentStats.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs italic border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
            Chưa có dữ liệu buổi dạy trong {getMonthName(selectedMonth)} {selectedYear}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentStats.map((stat) => (
              <div key={stat.student.id} className="p-5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-3 hover:border-[#0066cc]/40 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shadow-xs shrink-0 ring-2 ring-white dark:ring-black"
                      style={{ backgroundColor: stat.student.color }}
                    />
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {stat.student.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0066cc] dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20">
                      {stat.totalSessions} buổi
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                      {formatCurrency(stat.totalIncome)}
                    </span>
                  </div>
                </div>

                {Object.keys(stat.subjects).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60 dark:border-white/5">
                    {Object.entries(stat.subjects).map(([subject, count]) => (
                      <span
                        key={subject}
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10"
                      >
                        {SUBJECT_NAMES[subject as keyof typeof SUBJECT_NAMES]}: <strong className="text-[#0066cc] dark:text-blue-400">{count} buổi</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly income trend for the selected year */}
      <div className="space-y-4 rounded-[2.25rem] border border-white/80 bg-white/80 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#18181b]/80 sm:space-y-6 sm:p-8">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Thu nhập theo tháng</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Học phí từng tháng trong năm {selectedYear} · VND</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2 self-start rounded-full bg-emerald-500/10 px-3.5 py-2 sm:self-auto">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Cả năm</span>
            <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">{formatCurrency(yearlyIncome)}</span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="-mx-1 min-w-0 touch-pan-x overflow-x-auto overscroll-x-contain pb-2 sm:mx-0 lg:overflow-visible">
          <svg
            viewBox="0 0 760 230"
            className="block h-auto w-full min-w-[760px]"
            role="group"
            aria-label={`Biểu đồ thu nhập theo tháng năm ${selectedYear}. Vuốt ngang để xem các tháng.`}
          >
            <defs>
              <linearGradient id="monthly-income-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartBottom - ratio * (chartBottom - chartTop);
              const tickValue = maxMonthlyIncome * ratio;
              return (
                <g key={ratio}>
                  <line
                    x1={chartLeft}
                    x2={chartRight}
                    y1={y}
                    y2={y}
                    className="stroke-slate-200/80 dark:stroke-white/10"
                    strokeDasharray={ratio === 0 ? undefined : "4 5"}
                  />
                  <text
                    x={chartLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 dark:fill-slate-500"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {formatCompactCurrency(tickValue)}
                  </text>
                </g>
              );
            })}

            <path d={incomeAreaPath} fill="url(#monthly-income-fill)" />
            {incomePoints.map((point, index) => (
              <line
                key={`month-tick-${index}`}
                x1={point.x}
                x2={point.x}
                y1={chartBottom}
                y2={chartBottom + 6}
                className="stroke-slate-300 dark:stroke-white/20"
              />
            ))}
            <path
              d={incomeLinePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {incomePoints.map((point, index) => {
              const isSelected = index + 1 === selectedMonth;
              const selectMonth = () => setSelectedMonth(index + 1);
              return (
                <g
                  key={index}
                  role="button"
                  tabIndex={0}
                  aria-label={`${getMonthName(index + 1)}: ${formatCurrency(point.income)}`}
                  aria-pressed={isSelected}
                  className="cursor-pointer outline-none"
                  onClick={selectMonth}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectMonth();
                    }
                  }}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? "#059669" : "#10b981"}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={point.x}
                    y={chartBottom + 22}
                    textAnchor="middle"
                    className={isSelected ? "fill-emerald-700 dark:fill-emerald-300" : "fill-slate-500 dark:fill-slate-400"}
                    fontSize="11"
                    fontWeight={isSelected ? "700" : "600"}
                  >
                    T{index + 1}
                  </text>
                  <text
                    x={point.x}
                    y={chartBottom + 39}
                    textAnchor="middle"
                    className={isSelected ? "fill-emerald-700 dark:fill-emerald-300" : "fill-slate-400 dark:fill-slate-500"}
                    fontSize="9"
                    fontWeight="600"
                  >
                    {formatCompactCurrency(point.income)}
                  </text>
                  <title>{`${getMonthName(index + 1)}: ${formatCurrency(point.income)}`}</title>
                </g>
              );
            })}
          </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
