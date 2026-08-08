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
      <div className="relative z-10 bg-white/90 dark:bg-[#1d1d1f]/90 backdrop-blur-xl rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-black/5 dark:border-white/10 max-w-md w-full animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-[#0066cc]" />
            <h3 className="text-[19px] font-bold text-slate-900 dark:text-white tracking-[-0.01em]">Thêm học sinh mới</h3>
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
              Tên học sinh
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all duration-200 outline-none text-[15px]"
              autoFocus
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
                onChange={(e) => setSalary(Number(e.target.value))}
                step="5000"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all duration-200 outline-none text-[15px]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                VND
              </span>
            </div>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Ví dụ: 150000, 200000, 250000
            </p>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-slate-700 dark:text-slate-300 mb-2">
              Màu nhận diện
            </label>
            <div className="flex gap-3 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-10 h-10 rounded-full transition-all duration-200
                    ${
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1d1d1f] ring-[#0066cc] scale-110 shadow-md"
                        : "hover:scale-105 shadow-sm"
                    }
                  `}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-4">
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Thông tin sẽ được thêm:</p>
              <p className="text-[15px] font-medium text-slate-900 dark:text-white mt-1">
                Học sinh: <span className="font-bold">{name || "___"}</span>
              </p>
              <p className="text-[15px] text-slate-700 dark:text-slate-300">
                Lương: <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(salary)}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-6 py-3.5 bg-[#0066cc] text-white rounded-full font-bold hover:bg-[#005bb5] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md shadow-blue-500/20 active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              Thêm học sinh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-full font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-all duration-200 active:scale-[0.98]"
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
