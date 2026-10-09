import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject>("Toan");

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/80 dark:border-white/10 max-w-md w-full animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-[-0.01em]">
            Buổi dạy ngày {dateStr}
            {studentName && (
              <span
                className="ml-2 text-xs font-bold px-3 py-1 rounded-full shadow-xs"
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

        <div className="p-6 space-y-5">
          {existingSessions.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Buổi dạy đã lên lịch:</p>
              <div className="space-y-2">
                {existingSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`
                      ${SUBJECT_COLORS[session.subject].bg}
                      text-white px-4 py-3 rounded-2xl font-bold
                      shadow-xs flex items-center justify-between text-xs
                    `}
                  >
                    <span>{SUBJECT_NAMES[session.subject]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Thêm môn học mới:
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as Subject)}
              className="w-full px-4 py-3 border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] text-slate-900 dark:text-white rounded-2xl focus:bg-white dark:focus:bg-[#18181b] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] transition-all outline-none text-xs font-semibold"
            >
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject} className="text-slate-900 dark:text-white dark:bg-[#18181b]">
                  {SUBJECT_NAMES[subject]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2.5 p-6 bg-slate-50/60 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5">
          {existingSessions.length > 0 && (
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-full font-bold text-xs hover:bg-rose-600 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
            >
              <Trash2 className="w-4 h-4" />
              Xóa ca
            </button>
          )}
          <button
            onClick={handleAdd}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#0066cc] to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-full font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Thêm ca
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-full font-bold text-xs hover:bg-slate-200 dark:hover:bg-white/20 transition-all duration-200 active:scale-[0.98]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
