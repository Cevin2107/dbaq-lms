"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/features/admin/schedule/components/Calendar";
import { Statistics } from "@/features/admin/schedule/components/Statistics";
import { SessionModal } from "@/features/admin/schedule/components/SessionModal";
import { StudentTabs } from "@/features/admin/schedule/components/StudentTabs";
import { Overview } from "@/features/admin/schedule/components/Overview";
import { AddStudentModal } from "@/features/admin/schedule/components/AddStudentModal";
import { StudentSettingsModal } from "@/features/admin/schedule/components/StudentSettingsModal";
import { getSessionsByMonth, addSession, deleteSessionsByDate } from "@/features/admin/schedule/lib/teachingService";
import { getStudents, addStudent, updateStudent, deleteStudent } from "@/features/admin/schedule/lib/studentService";
import { exportToImage } from "@/features/admin/schedule/utils/exportUtils";
import { formatDate, getMonthName } from "@/features/admin/schedule/utils/dateUtils";
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Load students on mount
  useEffect(() => {
    loadStudents();
  }, []);

  // Load sessions when student or date changes
  useEffect(() => {
    if (selectedTab === "student" && selectedStudentId) {
      loadSessions();
    } else if (selectedTab === "student" && !selectedStudentId && students.length > 0) {
      // Auto-select first student if none selected
      setSelectedStudentId(students[0].id);
    }
  }, [year, month, selectedStudentId, selectedTab]);

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

  const loadSessions = async () => {
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
  };

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setCurrentDate(new Date(newYear, newMonth - 1, 1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddSession = async (subject: Subject) => {
    if (!selectedDate || !selectedStudentId) return;

    try {
      await addSession(formatDate(selectedDate), subject, selectedStudentId);
      await loadSessions();
      setSelectedDate(null);
    } catch (error) {
      console.error("Error adding session:", error);
      alert("Có lỗi xảy ra khi thêm buổi dạy");
    }
  };

  const handleDeleteSessions = async () => {
    if (!selectedDate || !selectedStudentId) return;

    try {
      await deleteSessionsByDate(formatDate(selectedDate), selectedStudentId);
      await loadSessions();
      setSelectedDate(null);
    } catch (error) {
      console.error("Error deleting sessions:", error);
      alert("Có lỗi xảy ra khi xóa buổi dạy");
    }
  };

  const handleExport = async () => {
    try {
      const student = students.find((s) => s.id === selectedStudentId);
      const filename = `thong-ke-${student?.name?.toLowerCase().replace(/\s+/g, "-") || "default"}-${getMonthName(month)
        .toLowerCase()
        .replace(" ", "-")}-${year}.png`;
      await exportToImage("export-container", filename);
    } catch (error) {
      console.error("Error exporting image:", error);
      alert("Có lỗi xảy ra khi xuất ảnh");
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
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Có lỗi xảy ra khi thêm học sinh");
    }
  };

  const handleUpdateStudent = async (id: string, updates: Partial<Pick<Student, "name" | "salary_per_session">>) => {
    try {
      const updatedStudent = await updateStudent(id, updates);
      setStudents((prev) => prev.map((student) => (student.id === id ? updatedStudent : student)));
      setOverviewRefreshKey((prev) => prev + 1);
      alert("Đã cập nhật thông tin học sinh");
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Có lỗi xảy ra khi cập nhật học sinh");
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
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Có lỗi xảy ra khi xóa học sinh");
    }
  };

  const selectedDateSessions = selectedDate
    ? sessions.filter((s) => s.teaching_date === formatDate(selectedDate))
    : [];

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-3 px-2 sm:py-4 sm:px-3">
      <div className="max-w-7xl mx-auto">
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

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div id="export-container" className="flex flex-col gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1">
                Theo Dõi Lịch Dạy Học
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Gia sư Đào Bá Anh Quân
              </p>
            </div>
            {selectedTab === "overview" ? (
              <Overview
                refreshKey={overviewRefreshKey}
                onOpenSettings={() => setShowStudentSettingsModal(true)}
              />
            ) : (
              <>
                {students.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl shadow-xl">
                    <p className="text-gray-500 mb-4">Chưa có học sinh nào</p>
                    <button
                      onClick={() => setShowAddStudentModal(true)}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Thêm học sinh đầu tiên
                    </button>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-[minmax(0,1fr),380px] gap-4 items-stretch export-stats-grid">
                    <div className="h-full">
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

                    <div className="h-full">
                      <Statistics
                        sessions={sessions}
                        onExport={handleExport}
                        salaryPerSession={currentStudent?.salary_per_session}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="text-center text-xs text-gray-400 pt-1 border-t border-gray-200">
              Ngày xuất thống kê: {new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </div>
          </div>
        )}

        {selectedDate && currentStudent && (
          <SessionModal
            date={selectedDate}
            existingSessions={selectedDateSessions}
            onAdd={handleAddSession}
            onDelete={handleDeleteSessions}
            onClose={() => setSelectedDate(null)}
            studentName={currentStudent.name}
            studentColor={currentStudent.color}
          />
        )}

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
    </div>
  );
}
