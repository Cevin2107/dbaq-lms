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
        <div className="bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
              <BookOpen className="w-6 h-6 text-[#0066cc]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Tổng số buổi</p>
              <p className="text-[28px] leading-tight font-bold text-slate-900 dark:text-white tracking-[-0.02em]">{totalDays}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 p-6 space-y-5">
          <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-[17px] tracking-[-0.01em]">Số buổi theo môn</h4>
          <div className="space-y-4">
            {Object.entries(SUBJECT_NAMES).map(([subject, name]) => {
              const count = subjectCounts[subject as Subject] || 0;
              const percentage = totalDays > 0 ? (count / totalDays) * 100 : 0;

              return (
                <div key={subject} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-[#1d1d1f] shadow-sm ${SUBJECT_COLORS[subject as Subject].bg}`}
                      />
                      <span className="text-[15px] font-medium text-slate-700 dark:text-slate-300">{name}</span>
                    </div>
                    <span className="text-[15px] font-bold text-slate-900 dark:text-white">{count}</span>
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

        <div className="bg-emerald-500 rounded-[2rem] shadow-lg shadow-emerald-500/20 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 blur-[30px] pointer-events-none" />
          <div className="relative flex items-center gap-4 mb-4">
            <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-sm">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-emerald-100">Tổng học phí</p>
              <p className="text-[32px] leading-tight font-bold tracking-[-0.02em]">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="relative text-[13px] font-medium text-emerald-100/80">
            {totalDays} buổi × {formatCurrency(pricePerSession)}
          </div>
        </div>
      </div>

      <button
        onClick={onExport}
        className="w-full bg-[#0066cc] text-white py-3.5 rounded-full font-bold shadow-lg shadow-blue-500/20 hover:bg-[#005bb5] transition-all duration-300 flex items-center justify-center gap-2 group text-[15px]"
      >
        <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        Xuất ảnh thống kê
      </button>
    </div>
  );
}
