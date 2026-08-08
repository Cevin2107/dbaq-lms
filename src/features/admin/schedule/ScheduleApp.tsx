"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar } from "@/features/admin/schedule/components/Calendar";
import { Statistics } from "@/features/admin/schedule/components/Statistics";
import { StudentTabs } from "@/features/admin/schedule/components/StudentTabs";
import { Overview } from "@/features/admin/schedule/components/Overview";
import { AddStudentModal } from "@/features/admin/schedule/components/AddStudentModal";
import { StudentSettingsModal } from "@/features/admin/schedule/components/StudentSettingsModal";
import { getSessionsByMonth, addSession, deleteSessionsByDate } from "@/features/admin/schedule/lib/teachingService";
import { getStudents, addStudent, updateStudent, deleteStudent } from "@/features/admin/schedule/lib/studentService";
import { exportToImage } from "@/features/admin/schedule/utils/exportUtils";
import { formatDate, getMonthName } from "@/features/admin/schedule/utils/dateUtils";
import { Download, CalendarDays, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { TeachingSession, Subject, Student } from "@/features/admin/schedule/lib/database.types";

export function ScheduleApp() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"overview" | "student">("overview");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showStudentSettingsModal, setShowStudentSettingsModal] = useState(false);
  const [overviewRefreshKey, setOverviewRefreshKey] = useState(0);
  const { addToast } = useToast();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await getStudents();
        setStudents(data);
        if (data.length > 0 && !selectedStudentId) {
          setSelectedStudentId(data[0].id);
        }
      } catch (error) {
        console.error("Error loading students:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, [selectedStudentId]);

  const loadSessions = useCallback(async () => {
    if (!selectedStudentId) return;
    setIsLoading(true);
    try {
      const data = await getSessionsByMonth(year, month, selectedStudentId);
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [year, month, selectedStudentId]);

  useEffect(() => {
    if (selectedTab === "student" && selectedStudentId) {
      loadSessions();
    } else if (selectedTab === "student" && !selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [year, month, selectedStudentId, selectedTab, loadSessions, students]);

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setCurrentDate(new Date(newYear, newMonth - 1, 1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleExport = async () => {
    try {
      const student = students.find((s) => s.id === selectedStudentId);
      const filename = `thong-ke-${student?.name?.toLowerCase().replace(/\s+/g, "-") || "default"}-${getMonthName(month)
        .toLowerCase()
        .replace(" ", "-")}-${year}.png`;
      await exportToImage("export-container", filename);
      addToast({
        title: "Đã xuất phiếu học phí!",
        description: "Hóa đơn học phí đã được lưu dưới dạng hình ảnh",
        variant: "success",
      });
    } catch (error) {
      console.error("Error exporting image:", error);
      addToast({
        title: "Lỗi xuất ảnh",
        description: "Có lỗi xảy ra khi tạo phiếu học phí hình ảnh",
        variant: "error",
      });
    }
  };

  const handleAddStudent = async (name: string, salary: number, color?: string) => {
    try {
      const newStudent = await addStudent(name, salary, color);
      setStudents([...students, newStudent]);
      setSelectedStudentId(newStudent.id);
      setSelectedTab("student");
      setShowAddStudentModal(false);
      setOverviewRefreshKey((prev) => prev + 1);
      addToast({
        title: "Thêm học sinh thành công",
        description: `Đã tạo tài khoản theo dõi cho ${name}`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error adding student:", error);
      addToast({
        title: "Lỗi thêm học sinh",
        description: "Có lỗi xảy ra khi tạo tài khoản học sinh mới",
        variant: "error",
      });
    }
  };

  const handleUpdateStudent = async (id: string, updates: Partial<Pick<Student, "name" | "salary_per_session">>) => {
    try {
      const updatedStudent = await updateStudent(id, updates);
      setStudents((prev) => prev.map((student) => (student.id === id ? updatedStudent : student)));
      setOverviewRefreshKey((prev) => prev + 1);
      addToast({
        title: "Đã cập nhật",
        description: "Thông tin học sinh đã được lưu lại thành công",
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating student:", error);
      addToast({
        title: "Lỗi cập nhật",
        description: "Có lỗi xảy ra khi lưu thông tin học sinh",
        variant: "error",
      });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudent(id);
      const remainingStudents = students.filter((student) => student.id !== id);
      setStudents(remainingStudents);
      if (selectedStudentId === id) {
        const nextStudentId = remainingStudents[0]?.id || null;
        setSelectedStudentId(nextStudentId);
        setSessions([]);
        if (!nextStudentId) {
          setSelectedTab("overview");
        }
      }
      setOverviewRefreshKey((prev) => prev + 1);
      setShowStudentSettingsModal(false);
      addToast({
        title: "Đã xóa học sinh",
        description: "Đã xóa hồ sơ và toàn bộ dữ liệu liên quan",
        variant: "info",
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      addToast({
        title: "Lỗi xóa học sinh",
        description: "Có lỗi xảy ra khi xóa dữ liệu học sinh",
        variant: "error",
      });
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="container-custom py-6 md:py-8 space-y-6 md:space-y-8 animate-fade-in pb-16">
      {/* Unified Hero Header Tile */}
      <div className="rounded-[2rem] bg-gradient-to-br from-white via-[#f0f9ff]/60 to-[#e0f2fe]/40 dark:from-[#1d1d1f]/90 dark:via-[#1d1d1f]/80 dark:to-[#0f172a]/90 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgba(0,102,204,0.06)] p-6 sm:p-8 md:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800/40">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{selectedTab === "overview" ? "Tổng quan Hệ thống" : `Bảng điểm danh — ${currentStudent?.name || "Học sinh"}`}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-[-0.02em]">
              {selectedTab === "overview"
                ? "Quản lý Lịch dạy & Học phí"
                : `Lịch dạy - ${currentStudent?.name || "Học sinh"}`}
            </h1>

            <p className="text-[14px] sm:text-[15px] text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              {selectedTab === "overview"
                ? "Theo dõi tổng số buổi dạy, thu nhập và biểu đồ phân bổ lịch học trong năm."
                : `Điểm danh các buổi dạy thực tế trong tháng ${month}/${year} của học sinh ${currentStudent?.name || ""}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {selectedTab === "student" && (
              <Button
                variant="brand"
                size="sm"
                onClick={handleExport}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-lg shadow-emerald-500/25 px-4 py-2.5 text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4 mr-1.5" />
                <span>Xuất phiếu học phí</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStudentSettingsModal(true)}
              className="rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 text-xs font-bold transition-all"
            >
              <Settings className="h-4 w-4 mr-1.5 text-slate-500" />
              <span>Cấu hình học sinh</span>
            </Button>
            
            <Button
              variant="brand"
              size="sm"
              onClick={() => setShowAddStudentModal(true)}
              className="rounded-full bg-[#0066cc] hover:bg-[#005bb5] active:scale-95 text-white shadow-lg shadow-blue-500/25 px-5 py-2.5 text-xs font-bold transition-all"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Thêm học sinh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Student Selector Tabs */}
      <StudentTabs
        students={students}
        selectedStudentId={selectedStudentId}
        selectedTab={selectedTab}
        onSelectOverview={() => setSelectedTab("overview")}
        onSelectStudent={(id) => {
          setSelectedStudentId(id);
          setSelectedTab("student");
        }}
        onAddStudent={() => setShowAddStudentModal(true)}
      />

      {/* Content Section */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0066cc] border-t-transparent" />
        </div>
      ) : selectedTab === "overview" ? (
        <Overview
          refreshKey={overviewRefreshKey}
          onOpenSettings={() => setShowStudentSettingsModal(true)}
        />
      ) : (
        <div id="export-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Calendar
              year={year}
              month={month}
              sessions={sessions}
              onMonthChange={handleMonthChange}
              onDayClick={handleDayClick}
              studentColor={currentStudent?.color}
              studentName={currentStudent?.name}
            />
          </div>

          <div className="lg:col-span-1">
            <Statistics
              sessions={sessions}
              onExport={handleExport}
              salaryPerSession={currentStudent?.salary_per_session}
              studentName={currentStudent?.name}
              studentId={currentStudent?.id}
              month={month}
              year={year}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddStudentModal && (
        <AddStudentModal
          onAdd={handleAddStudent}
          onClose={() => setShowAddStudentModal(false)}
        />
      )}

      {showStudentSettingsModal && (
        <StudentSettingsModal
          students={students}
          onClose={() => setShowStudentSettingsModal(false)}
          onUpdate={handleUpdateStudent}
          onDelete={handleDeleteStudent}
        />
      )}
    </div>
  );
}
