import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { SUBJECTS, SUBJECT_NAMES, SUBJECT_COLORS } from "@/features/admin/schedule/constants/subjects";
import type { Subject, TeachingSession } from "@/features/admin/schedule/lib/database.types";

interface SessionModalProps {
  date: Date;
  existingSessions: TeachingSession[];
  onAdd: (subject: Subject) => void;
  onDelete: () => void;
  onClose: () => void;
  studentName?: string;
  studentColor?: string;
}

export function SessionModal({
  date,
  existingSessions,
  onAdd,
  onDelete,
  onClose,
  studentName,
  studentColor,
}: SessionModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject>("Toan");

  const dateStr = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handleAdd = () => {
    onAdd(selectedSubject);
  };

  const handleDelete = () => {
    if (window.confirm("Bạn có chắc muốn xóa tất cả buổi dạy trong ngày này?")) {
      onDelete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">
            Buổi dạy ngày {dateStr}
            {studentName && (
              <span
                className="ml-2 text-sm font-normal px-2 py-1 rounded-full"
                style={{ backgroundColor: studentColor || "#3B82F6", color: "white" }}
              >
                {studentName}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {existingSessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Buổi dạy hiện tại:</p>
              <div className="space-y-2">
                {existingSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`
                      ${SUBJECT_COLORS[session.subject].bg}
                      text-white px-4 py-3 rounded-lg font-medium
                      shadow-sm flex items-center justify-between
                    `}
                  >
                    <span>{SUBJECT_NAMES[session.subject]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Thêm buổi dạy mới:
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as Subject)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {SUBJECT_NAMES[subject]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 p-6 bg-gray-50 rounded-b-2xl">
          {existingSessions.length > 0 && (
            <button
              onClick={handleDelete}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </button>
          )}
          <button
            onClick={handleAdd}
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Thêm
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
