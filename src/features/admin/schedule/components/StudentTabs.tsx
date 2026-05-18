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
          flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full font-medium text-sm sm:text-base transition-all duration-200 whitespace-nowrap
          ${
            selectedTab === "overview"
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
            flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full font-medium text-sm sm:text-base transition-all duration-200 whitespace-nowrap
            ${
              selectedTab === "student" && selectedStudentId === student.id
                ? "text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full font-medium text-sm sm:text-base bg-green-100 text-green-700 hover:bg-green-200 transition-all duration-200 whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        Thêm học sinh
      </button>
    </div>
  );
}
