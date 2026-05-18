import { useState } from "react";
import { X, UserPlus } from "lucide-react";

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
  const [name, setName] = useState("");
  const [salary, setSalary] = useState(200000);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Vui lòng nhập tên học sinh");
      return;
    }
    if (salary <= 0) {
      alert("Vui lòng nhập mức lương hợp lệ");
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-800">Thêm học sinh mới</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên học sinh
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mức lương mỗi buổi
            </label>
            <div className="relative">
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                step="5000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                VND
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ví dụ: 150000, 200000, 250000
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        ? "ring-2 ring-offset-2 ring-blue-500 scale-110"
                        : "hover:scale-105"
                    }
                  `}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">Thông tin sẽ được thêm:</p>
              <p className="text-sm font-medium text-gray-800 mt-1">
                Học sinh: <span className="font-bold">{name || "___"}</span>
              </p>
              <p className="text-sm text-gray-800">
                Lương: {formatCurrency(salary)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              Thêm học sinh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
