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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/90 dark:bg-[#1d1d1f]/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/5 dark:border-white/5 max-w-md w-full animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
          <h3 className="text-[19px] font-bold text-slate-900 dark:text-white tracking-[-0.01em]">
            Buổi dạy ngày {dateStr}
            {studentName && (
              <span
                className="ml-2 text-[13px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm"
                style={{ backgroundColor: studentColor || "#0066cc", color: "white" }}
              >
                {studentName}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {existingSessions.length > 0 && (
            <div className="space-y-3">
              <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400">Buổi dạy hiện tại:</p>
              <div className="space-y-2.5">
                {existingSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`
                      ${SUBJECT_COLORS[session.subject].bg}
                      text-white px-4 py-3 rounded-2xl font-medium
                      shadow-sm flex items-center justify-between
                    `}
                  >
                    <span className="text-[15px]">{SUBJECT_NAMES[session.subject]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-[14px] font-medium text-slate-700 dark:text-slate-300">
              Thêm buổi dạy mới:
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as Subject)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all duration-200 outline-none text-[15px]"
            >
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject} className="text-slate-900">
                  {SUBJECT_NAMES[subject]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 p-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-black/5 dark:border-white/5">
          {existingSessions.length > 0 && (
            <button
              onClick={handleDelete}
              className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-full font-bold hover:bg-rose-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </button>
          )}
          <button
            onClick={handleAdd}
            className="flex-1 px-6 py-3 bg-[#0066cc] text-white rounded-full font-bold hover:bg-[#005bb5] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md shadow-blue-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Thêm
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-full font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-all duration-200 active:scale-[0.98]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
