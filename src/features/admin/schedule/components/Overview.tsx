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
import { getSessionsForAllStudents } from "@/features/admin/schedule/lib/teachingService";
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
  const [isLoading, setIsLoading] = useState(true);

  // Month selection state - default to current month
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth, refreshKey]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [studentsData, sessionsData] = await Promise.all([
        getStudents(),
        getSessionsForAllStudents(selectedYear, selectedMonth),
      ]);
      setStudents(studentsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error("Error loading overview data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Tổng quan</h3>
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
        <p className="text-purple-100">Thống kê tổng hợp tất cả học sinh</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng số buổi dạy</p>
              <p className="text-2xl font-bold text-gray-800">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-green-100">Tổng thu nhập</p>
              <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-student breakdown */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Thống kê theo từng học sinh
          </h4>
        </div>
        <div className="divide-y divide-gray-100">
          {studentStats.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Chưa có dữ liệu buổi dạy trong tháng này
            </div>
          ) : (
            studentStats.map((stat) => (
              <div key={stat.student.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stat.student.color }}
                    />
                    <h5 className="font-bold text-gray-800 text-lg">
                      {stat.student.name}
                    </h5>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                    <span className="text-gray-600">{stat.totalSessions} buổi</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(stat.totalIncome)}
                    </span>
                  </div>
                </div>

                {/* Subject breakdown for this student */}
                {Object.keys(stat.subjects).length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs text-gray-500">Phân bố theo môn:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stat.subjects).map(([subject, count]) => (
                        <span
                          key={subject}
                          className={`${
                            SUBJECT_COLORS[subject as keyof typeof SUBJECT_COLORS]?.bg || "bg-gray-500"
                          } text-white text-xs px-2 py-1 rounded-full`}
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

      {/* Monthly trend placeholder */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-800">Tổng buổi theo tháng</h4>
        </div>
        <div className="text-center text-gray-500 py-8">
          Biểu đồ thống kê sẽ được cập nhật trong phiên bản tiếp theo
        </div>
      </div>
    </div>
  );
}
