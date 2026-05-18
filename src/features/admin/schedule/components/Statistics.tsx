import { BookOpen, DollarSign, Download } from "lucide-react";
import { SUBJECT_NAMES, SUBJECT_COLORS, PRICE_PER_SESSION } from "@/features/admin/schedule/constants/subjects";
import type { TeachingSession, Subject } from "@/features/admin/schedule/lib/database.types";

interface StatisticsProps {
  sessions: TeachingSession[];
  onExport: () => void;
  salaryPerSession?: number;
}

export function Statistics({ sessions, onExport, salaryPerSession }: StatisticsProps) {
  const totalDays = sessions.length;

  const subjectCounts = sessions.reduce((acc, session) => {
    acc[session.subject] = (acc[session.subject] || 0) + 1;
    return acc;
  }, {} as Record<Subject, number>);

  const pricePerSession = salaryPerSession || PRICE_PER_SESSION;
  const totalIncome = totalDays * pricePerSession;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex flex-col gap-4 flex-1">
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng số buổi</p>
              <p className="text-2xl font-bold text-gray-800">{totalDays}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <h4 className="font-semibold text-gray-800 mb-3">Số buổi theo môn</h4>
          <div className="space-y-3">
            {Object.entries(SUBJECT_NAMES).map(([subject, name]) => {
              const count = subjectCounts[subject as Subject] || 0;
              const percentage = totalDays > 0 ? (count / totalDays) * 100 : 0;

              return (
                <div key={subject} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${SUBJECT_COLORS[subject as Subject].bg}`}
                      />
                      <span className="text-sm font-medium text-gray-700">{name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${SUBJECT_COLORS[subject as Subject].bg} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-green-100">Tổng học phí</p>
              <p className="text-3xl font-bold">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="text-sm text-green-100">
            {totalDays} buổi × {formatCurrency(pricePerSession)}
          </div>
        </div>
      </div>

      <button
        onClick={onExport}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
      >
        <Download className="w-5 h-5" />
        Xuất ảnh thống kê
      </button>
    </div>
  );
}
