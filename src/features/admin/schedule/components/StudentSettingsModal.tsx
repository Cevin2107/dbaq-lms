import { useEffect, useMemo, useState } from "react";
import { X, Settings, Trash2, Save } from "lucide-react";
import type { Student } from "@/features/admin/schedule/lib/database.types";

interface StudentSettingsModalProps {
  students: Student[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Pick<Student, "name" | "salary_per_session">>) => void;
  onDelete: (id: string) => void;
}

export function StudentSettingsModal({ students, onClose, onUpdate, onDelete }: StudentSettingsModalProps) {
  const initialStudentId = students[0]?.id || "";
  const [selectedId, setSelectedId] = useState(initialStudentId);
  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedId),
    [students, selectedId]
  );

  const [name, setName] = useState(selectedStudent?.name || "");
  const [salary, setSalary] = useState(selectedStudent?.salary_per_session || 0);

  useEffect(() => {
    if (selectedStudent) {
      setName(selectedStudent.name);
      setSalary(selectedStudent.salary_per_session);
    }
  }, [selectedStudent]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedStudent) return;
    if (!name.trim()) {
      alert("Vui lòng nhập tên học sinh");
      return;
    }
    if (salary <= 0) {
      alert("Vui lòng nhập mức lương hợp lệ");
      return;
    }
    onUpdate(selectedStudent.id, { name: name.trim(), salary_per_session: salary });
  };

  const handleDelete = () => {
    if (!selectedStudent) return;
    if (window.confirm(`Bạn có chắc muốn xóa học sinh "${selectedStudent.name}"?`)) {
      onDelete(selectedStudent.id);
    }
  };

  if (students.length === 0) {
    return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/90 dark:bg-[#1d1d1f]/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/5 dark:border-white/5 max-w-md w-full animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-[#0066cc]" />
            <h3 className="text-[19px] font-bold text-slate-900 dark:text-white tracking-[-0.01em]">Cài đặt học sinh</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium text-[15px]">
          Chưa có học sinh để chỉnh sửa.
        </div>
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full px-6 py-3.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-full font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-all duration-200 active:scale-[0.98]"
          >
            Đóng
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/90 dark:bg-[#1d1d1f]/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/5 dark:border-white/5 max-w-lg w-full animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-[#0066cc]" />
            <h3 className="text-[19px] font-bold text-slate-900 dark:text-white tracking-[-0.01em]">Cài đặt học sinh</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[14px] font-medium text-slate-700 dark:text-slate-300 mb-2">
              Chọn học sinh
            </label>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all duration-200 outline-none text-[15px]"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id} className="text-slate-900">
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tên học sinh
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all duration-200 outline-none text-[15px]"
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mức lương mỗi buổi
            </label>
            <div className="relative">
              <input
                type="number"
                value={salary}
                onChange={(event) => setSalary(Number(event.target.value))}
                step="5000"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all duration-200 outline-none text-[15px]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                VND
              </span>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 text-[13px] font-medium text-blue-700 dark:text-blue-300">
            Đổi mức lương sẽ ảnh hưởng đến thống kê thu nhập của học sinh.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 px-6 py-3.5 bg-rose-500 text-white rounded-full font-bold hover:bg-rose-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <Trash2 className="w-4 h-4" />
              Xóa học sinh
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3.5 bg-[#0066cc] text-white rounded-full font-bold hover:bg-[#005bb5] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md shadow-blue-500/20 active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-full font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-all duration-200 active:scale-[0.98]"
            >
              Đóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
