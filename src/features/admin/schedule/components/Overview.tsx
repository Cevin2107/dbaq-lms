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

  const monthlyCounts = Array(12).fill(0);
  const monthlyIncomes = Array(12).fill(0);
  yearlySessions.forEach(session => {
    const dateParts = session.teaching_date.split('-');
    if (dateParts.length >= 2) {
      const m = parseInt(dateParts[1], 10) - 1;
      if (m >= 0 && m < 12) {
        monthlyCounts[m]++;
        const student = students.find((s) => s.id === session.student_id);
        monthlyIncomes[m] += (student?.salary_per_session || 0);
      }
    }
  });

  const maxMonthlyCount = Math.max(...monthlyCounts, 1);

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
      <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0066cc]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Thống kê Tổng quan</h2>
            <p className="text-xs text-slate-500">Xem báo cáo tổng hợp theo từng tháng</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full border border-slate-200/80 dark:border-white/10">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-full hover:bg-white dark:hover:bg-[#1d1d1f] text-slate-600 dark:text-slate-300 transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white min-w-[110px] text-center px-2">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-full hover:bg-white dark:hover:bg-[#1d1d1f] text-slate-600 dark:text-slate-300 transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Overall Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/60 text-[#0066cc] dark:text-blue-400 rounded-2xl shrink-0">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng số buổi dạy ({getMonthName(selectedMonth)})</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-[-0.02em] mt-1">{totalSessions} <span className="text-sm font-semibold text-slate-500">buổi</span></p>
          </div>
        </div>

        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 text-white flex items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 blur-xl pointer-events-none" />
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <div className="relative">
            <p className="text-xs font-semibold text-emerald-100">Tổng thu nhập ({getMonthName(selectedMonth)})</p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] mt-1">{formatCurrency(totalIncome)}</p>
          </div>
        </div>
      </div>

      {/* Per-Student Breakdown */}
      <div className="p-6 sm:p-8 rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-[#0066cc]" />
            Thống kê theo từng học sinh ({getMonthName(selectedMonth)})
          </h3>
          <span className="text-xs font-semibold text-slate-500">{studentStats.length} học sinh có buổi dạy</span>
        </div>

        {studentStats.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm italic">
            Chưa có dữ liệu buổi dạy trong {getMonthName(selectedMonth)} {selectedYear}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentStats.map((stat) => (
              <div key={stat.student.id} className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-3 hover:border-[#0066cc]/40 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shadow-xs shrink-0"
                      style={{ backgroundColor: stat.student.color }}
                    />
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {stat.student.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#0066cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-xl border border-blue-100/80 dark:border-blue-900/40">
                      {stat.totalSessions} buổi
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-100/80 dark:border-emerald-900/40">
                      {formatCurrency(stat.totalIncome)}
                    </span>
                  </div>
                </div>

                {Object.keys(stat.subjects).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/50 dark:border-white/5">
                    {Object.entries(stat.subjects).map(([subject, count]) => (
                      <span
                        key={subject}
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-white dark:bg-[#1d1d1f] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10"
                      >
                        {SUBJECT_NAMES[subject as keyof typeof SUBJECT_NAMES]}: <strong className="text-[#0066cc]">{count} buổi</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Trend Chart for the Year */}
      <div className="p-6 sm:p-8 rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0066cc]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Phân bổ Buổi dạy trong năm</h4>
              <p className="text-xs text-slate-500">Biểu đồ tổng số buổi dạy 12 tháng năm {selectedYear}</p>
            </div>
          </div>
        </div>
        
        <div className="h-56 sm:h-64 relative pt-4">
          <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-8 pointer-events-none">
            {[1, 0.75, 0.5, 0.25, 0].map((tick, i) => (
              <div key={i} className="flex items-center w-full">
                <span className="w-8 text-right text-[11px] font-semibold text-slate-400 dark:text-slate-500 pr-2">
                  {Math.round(maxMonthlyCount * tick)}
                </span>
                <div className="flex-1 border-t border-dashed border-slate-200/80 dark:border-slate-800" />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex items-end justify-between pl-8 pb-8 pt-2">
            {monthlyCounts.map((count, index) => {
              const heightPercent = (count / maxMonthlyCount) * 100;
              const isCurrentMonth = (index + 1) === selectedMonth;
              
              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer"
                  onClick={() => setSelectedMonth(index + 1)}
                >
                  <div className="w-full flex justify-center h-full items-end">
                    <div 
                      className={`w-6 sm:w-10 rounded-t-xl transition-all duration-300 group-hover:opacity-80 relative flex items-end justify-center ${isCurrentMonth ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md shadow-emerald-500/30' : 'bg-gradient-to-t from-[#0066cc] to-[#005bb5] shadow-xs dark:from-blue-600 dark:to-blue-400'}`}
                      style={{ height: `${heightPercent}%`, minHeight: count > 0 ? '6px' : '0' }}
                    >
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900 text-white text-xs font-bold py-1.5 px-2.5 rounded-xl pointer-events-none whitespace-nowrap shadow-xl z-20 flex flex-col items-center gap-0.5 border border-slate-700">
                        <span>T{index + 1}: {count} buổi</span>
                        {monthlyIncomes[index] > 0 && (
                          <span className="text-emerald-400 font-semibold">{formatCurrency(monthlyIncomes[index])}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`absolute bottom-0 text-[11px] font-bold translate-y-full pt-2 ${isCurrentMonth ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    T{index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
