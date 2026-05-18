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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">Cài đặt học sinh</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6 text-center text-gray-500">
            Chưa có học sinh để chỉnh sửa.
          </div>
          <div className="p-6 pt-0">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-800">Cài đặt học sinh</h3>
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
              Chọn học sinh
            </label>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên học sinh
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                onChange={(event) => setSalary(Number(event.target.value))}
                step="5000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                VND
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            Đổi mức lương sẽ ảnh hưởng đến thống kê thu nhập của học sinh.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
              Xóa học sinh
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
            >
              Đóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
