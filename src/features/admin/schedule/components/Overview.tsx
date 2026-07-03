import { useState, useEffect } from "react";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
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

  // Month selection state - default to current month
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

  // Calculate overall statistics
  const totalSessions = sessions.length;
  const totalIncome = sessions.reduce((sum, session) => {
    const student = students.find((s) => s.id === session.student_id);
    return sum + (student?.salary_per_session || 0);
  }, 0);

  // Calculate per-student statistics
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

  // Calculate monthly distribution for the year
  const monthlyCounts = Array(12).fill(0);
  const monthlyIncomes = Array(12).fill(0);
  yearlySessions.forEach(session => {
    // teaching_date format: YYYY-MM-DD
    const dateParts = session.teaching_date.split('-');
    if (dateParts.length >= 2) {
      const month = parseInt(dateParts[1], 10) - 1; // 0-11
      if (month >= 0 && month < 12) {
        monthlyCounts[month]++;
        const student = students.find((s) => s.id === session.student_id);
        if (student) {
          monthlyIncomes[month] += student.salary_per_session;
        }
      }
    }
  });

  const maxMonthlyCount = Math.max(...monthlyCounts, 1); // Avoid division by zero

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="bg-[#0066cc] rounded-[2rem] shadow-lg shadow-blue-500/20 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 blur-[50px] pointer-events-none" />
        <div className="relative flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <h3 className="text-lg font-bold tracking-[-0.01em]">Tổng quan</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xl font-semibold min-w-[120px] text-center">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenSettings}
              className="ml-2 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              Cài đặt
            </button>
          </div>
        </div>
        <p className="relative text-blue-100 text-[15px]">Thống kê tổng hợp tất cả học sinh</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 p-6 space-y-2">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
              <Calendar className="w-6 h-6 text-[#0066cc]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Tổng số buổi dạy</p>
              <p className="text-[28px] leading-tight font-bold text-slate-900 dark:text-white tracking-[-0.02em]">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-500 rounded-[2rem] shadow-lg shadow-emerald-500/20 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 blur-[30px] pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-sm">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-emerald-100">Tổng thu nhập</p>
              <p className="text-[28px] leading-tight font-bold tracking-[-0.02em]">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-student breakdown */}
      <div className="bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/50 border-b border-black/5 dark:border-white/5">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-[17px] tracking-[-0.01em]">
            <TrendingUp className="w-5 h-5 text-[#0066cc]" />
            Thống kê theo từng học sinh
          </h4>
        </div>
        <div className="divide-y divide-black/5 dark:divide-white/5">
          {studentStats.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium text-[15px]">
              Chưa có dữ liệu buổi dạy trong tháng này
            </div>
          ) : (
            studentStats.map((stat) => (
              <div key={stat.student.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-[#1d1d1f] shadow-sm"
                      style={{ backgroundColor: stat.student.color }}
                    />
                    <h5 className="font-bold text-slate-900 dark:text-white text-[17px] tracking-[-0.01em]">
                      {stat.student.name}
                    </h5>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-5">
                    <span className="text-[15px] font-medium text-slate-600 dark:text-slate-300">{stat.totalSessions} buổi</span>
                    <span className="text-[17px] font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(stat.totalIncome)}
                    </span>
                  </div>
                </div>

                {/* Subject breakdown for this student */}
                {Object.keys(stat.subjects).length > 0 && (
                  <div className="space-y-2.5 mt-4">
                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phân bố theo môn:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stat.subjects).map(([subject, count]) => (
                        <span
                          key={subject}
                          className={`${
                            SUBJECT_COLORS[subject as keyof typeof SUBJECT_COLORS]?.bg || "bg-slate-500"
                          } text-white font-semibold text-[13px] px-3 py-1 rounded-full shadow-sm`}
                        >
                          {SUBJECT_NAMES[subject as keyof typeof SUBJECT_NAMES]}: {count} buổi
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Monthly trend */}
      <div className="bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
            <BarChart3 className="w-5 h-5 text-[#0066cc]" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-[17px] tracking-[-0.01em]">Tổng buổi theo tháng</h4>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Năm {selectedYear}</p>
          </div>
        </div>
        
        <div className="h-56 sm:h-64 mt-4 relative">
          {/* Y-axis guidelines */}
          <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-8 pointer-events-none">
            {[1, 0.75, 0.5, 0.25, 0].map((tick, i) => (
              <div key={i} className="flex items-center w-full">
                <span className="w-8 text-right text-[11px] font-medium text-slate-400 dark:text-slate-500 pr-3">
                  {Math.round(maxMonthlyCount * tick)}
                </span>
                <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-800"></div>
              </div>
            ))}
          </div>

          {/* Bars */}
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
                      className={`w-6 sm:w-10 md:w-12 rounded-t-xl transition-all duration-500 ease-out group-hover:opacity-80 relative flex items-end justify-center ${isCurrentMonth ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[#0066cc]/80 shadow-[0_0_10px_rgba(0,102,204,0.2)] dark:bg-blue-500/70'}`}
                      style={{ height: `${heightPercent}%`, minHeight: count > 0 ? '4px' : '0' }}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl pointer-events-none whitespace-nowrap shadow-xl z-10 translate-y-2 group-hover:-translate-y-0 duration-200 flex flex-col items-center gap-1 border border-slate-700">
                        <span>{count} buổi</span>
                        {monthlyIncomes[index] > 0 && (
                          <span className="text-emerald-400 font-medium">{formatCurrency(monthlyIncomes[index])}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* X-axis labels */}
                  <span className={`absolute bottom-0 text-[11px] sm:text-xs font-semibold translate-y-full pt-3 ${isCurrentMonth ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
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
