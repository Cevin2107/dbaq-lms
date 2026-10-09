"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { CheckSquare, Square, Users, Save } from "lucide-react";
import clsx from "clsx";

interface Student {
  id: string;
  full_name: string;
  isAssigned: boolean;
}

export function AssignTab({ assignmentId }: { assignmentId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`/api/admin/assignments/${assignmentId}/assign`);
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [assignmentId]);

  const toggleStudent = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isAssigned: !s.isAssigned } : s));
  };

  const toggleAll = () => {
    const allAssigned = students.every(s => s.isAssigned);
    setStudents(prev => prev.map(s => ({ ...s, isAssigned: !allAssigned })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const assignedIds = students.filter(s => s.isAssigned).map(s => s.id);
      const res = await fetch(`/api/admin/assignments/${assignmentId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedIds }),
      });
      if (res.ok) {
        addToast({
          title: "Thành công",
          description: "Đã cập nhật danh sách giao bài",
          variant: "success",
        });
      } else {
        throw new Error("Lỗi lưu");
      }
    } catch (err) {
      addToast({
        title: "Lỗi",
        description: "Không thể lưu phân công",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const assignedCount = students.filter(s => s.isAssigned).length;
  const allAssigned = students.length > 0 && assignedCount === students.length;

  if (loading) {
    return (
      <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 p-12 text-center text-xs font-semibold text-slate-400">
        <div className="animate-spin w-5 h-5 border-2 border-[#0066cc] border-t-transparent rounded-full mx-auto mb-3" />
        Đang tải danh sách học sinh...
      </div>
    );
  }

  return (
    <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-[#0066cc] dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <span>Giao bài cho Học sinh</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chỉ những học sinh được tích chọn mới nhìn thấy và làm bài tập này.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="rounded-full bg-gradient-to-r from-[#0066cc] to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white shadow-lg shadow-blue-500/25 px-6 py-2.5 text-xs font-bold transition-all active:scale-[0.98]"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? "Đang lưu..." : "Lưu phân công"}
        </Button>
      </div>

      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
        <button
          type="button"
          onClick={toggleAll}
          className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#0066cc] dark:hover:text-blue-400 transition"
        >
          {allAssigned ? (
            <CheckSquare className="w-4.5 h-4.5 text-[#0066cc] dark:text-blue-400" />
          ) : (
            <Square className="w-4.5 h-4.5 text-slate-400" />
          )}
          <span>Chọn tất cả học sinh</span>
        </button>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-[#0066cc] dark:text-blue-400 border border-blue-500/20">
          Đã chọn {assignedCount} / {students.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {students.map(student => {
          const initials = student.full_name
            ? student.full_name.split(" ").slice(-2).map((n) => n[0]).join("").toUpperCase()
            : "HS";

          return (
            <div
              key={student.id}
              onClick={() => toggleStudent(student.id)}
              className={clsx(
                "group flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 select-none",
                student.isAssigned
                  ? "border-[#0066cc]/40 bg-blue-50/60 dark:bg-blue-950/20 shadow-xs"
                  : "border-slate-200/80 dark:border-white/10 bg-slate-50/50 hover:bg-slate-100/70 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={clsx(
                    "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors",
                    student.isAssigned
                      ? "bg-gradient-to-tr from-[#0066cc] to-sky-400 text-white shadow-xs"
                      : "bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                  )}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p
                    className={clsx(
                      "font-bold truncate text-xs transition-colors",
                      student.isAssigned ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {student.full_name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {student.isAssigned ? "Được làm bài" : "Chưa giao"}
                  </p>
                </div>
              </div>

              {student.isAssigned ? (
                <CheckSquare className="w-4.5 h-4.5 text-[#0066cc] dark:text-blue-400 shrink-0 ml-2" />
              ) : (
                <Square className="w-4.5 h-4.5 text-slate-300 dark:text-white/20 group-hover:text-slate-400 shrink-0 ml-2" />
              )}
            </div>
          );
        })}
      </div>
      
      {students.length === 0 && (
        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
          <p className="text-xs text-slate-400 italic">Chưa có học sinh nào trong cơ sở dữ liệu hệ thống.</p>
        </div>
      )}
    </div>
  );
}
