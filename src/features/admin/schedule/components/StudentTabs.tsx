import { Plus, Users } from "lucide-react";
import type { Student } from "@/features/admin/schedule/lib/database.types";

interface StudentTabsProps {
  students: Student[];
  selectedStudentId: string | null;
  selectedTab: "overview" | "student";
  onSelectOverview: () => void;
  onSelectStudent: (studentId: string) => void;
  onAddStudent: () => void;
}

export function StudentTabs({
  students,
  selectedStudentId,
  selectedTab,
  onSelectOverview,
  onSelectStudent,
  onAddStudent,
}: StudentTabsProps) {
  return (
    <div className="flex flex-nowrap gap-2 mb-4 pb-2 border-b border-gray-200 overflow-x-auto no-scrollbar">
      <button
        onClick={onSelectOverview}
        className={`
          flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full font-medium text-sm sm:text-[15px] transition-all duration-200 whitespace-nowrap
          ${
            selectedTab === "overview"
              ? "bg-[#0066cc] text-white shadow-lg shadow-blue-500/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
          }
        `}
      >
        <Users className="w-4 h-4" />
        Tổng quan
      </button>

      {students.map((student) => (
        <button
          key={student.id}
          onClick={() => onSelectStudent(student.id)}
          className={`
            flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full font-medium text-sm sm:text-[15px] transition-all duration-200 whitespace-nowrap
            ${
              selectedTab === "student" && selectedStudentId === student.id
                ? "text-white shadow-lg"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
            }
          `}
          style={{
            backgroundColor:
              selectedTab === "student" && selectedStudentId === student.id
                ? student.color
                : undefined,
          }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: student.color }}
          />
          {student.name}
        </button>
      ))}

      <button
        onClick={onAddStudent}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full font-medium text-sm sm:text-[15px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all duration-200 whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        Thêm học sinh
      </button>
    </div>
  );
}
