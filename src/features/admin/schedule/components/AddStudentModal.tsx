import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface AddStudentModalProps {
  onAdd: (name: string, salary: number, color?: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

export function AddStudentModal({ onAdd, onClose }: AddStudentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [salary, setSalary] = useState(200000);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const { addToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên học sinh",
        variant: "warning",
      });
      return;
    }
    if (salary <= 0) {
      addToast({
        title: "Thông tin không hợp lệ",
        description: "Vui lòng nhập mức lương / học phí lớn hơn 0",
        variant: "warning",
      });
      return;
    }
    onAdd(name.trim(), salary, selectedColor);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/80 dark:border-white/10 max-w-md w-full animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-[#0066cc] dark:text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-[-0.01em]">Thêm học sinh mới</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên học sinh
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full px-4 py-3 border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] text-slate-900 dark:text-white rounded-2xl focus:bg-white dark:focus:bg-[#18181b] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] transition-all outline-none text-xs font-semibold"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mức lương mỗi buổi
            </label>
            <div className="relative">
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                step="5000"
                className="w-full pl-4 pr-14 py-3 border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] text-slate-900 dark:text-white rounded-2xl focus:bg-white dark:focus:bg-[#18181b] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] transition-all outline-none text-xs font-semibold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                VND
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
              Ví dụ: 150000, 200000, 250000
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Màu nhận diện
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-8 h-8 rounded-full transition-all duration-200
                    ${
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#18181b] ring-[#0066cc] scale-110 shadow-sm"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                    }
                  `}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="pt-1">
            <div className="bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 space-y-1 text-xs">
              <p className="font-semibold text-slate-500 dark:text-slate-400">Xem trước thông tin:</p>
              <div className="flex items-center justify-between pt-0.5">
                <span className="font-bold text-slate-900 dark:text-white">{name || "Chưa nhập tên"}</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(salary)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0066cc] to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-full font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              Thêm học sinh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-full font-bold text-xs hover:bg-slate-200 dark:hover:bg-white/20 transition-all duration-200 active:scale-[0.98]"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
