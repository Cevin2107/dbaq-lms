import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDaysInMonth, getMonthName } from "@/features/admin/schedule/utils/dateUtils";
import { CalendarDay } from "@/features/admin/schedule/components/CalendarDay";
import type { TeachingSession } from "@/features/admin/schedule/lib/database.types";

function adjustColor(color: string, amount: number): string {
  // Simple hex color adjustment (expects #RRGGBB)
  if (!color.startsWith("#") || color.length !== 7) return color;
  const r = Math.max(0, Math.min(255, parseInt(color.slice(1, 3), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(color.slice(3, 5), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(color.slice(5, 7), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

interface CalendarProps {
  year: number;
  month: number;
  sessions: TeachingSession[];
  onMonthChange: (year: number, month: number) => void;
  onDayClick: (date: Date) => void;
  studentColor?: string;
  studentName?: string;
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function Calendar({
  year,
  month,
  sessions,
  onMonthChange,
  onDayClick,
  studentColor,
  studentName,
}: CalendarProps) {
  const days = getDaysInMonth(year, month);

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 overflow-hidden h-full flex flex-col">
      {studentName && (
        <div
          className="px-3 sm:px-5 py-3 text-white text-center"
          style={{
            backgroundColor: studentColor ? adjustColor(studentColor, -20) : "#005bb5",
          }}
        >
          <h3 className="text-lg sm:text-[17px] font-bold tracking-widest uppercase">
            Thống kê - {studentName}
          </h3>
        </div>
      )}
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 export-month-header"
        style={{
          background: `linear-gradient(135deg, ${studentColor || "#0066cc"}, ${
            studentColor ? adjustColor(studentColor, -20) : "#005bb5"
          })`,
        }}
      >
        <button
          onClick={handlePrevMonth}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-white/20 text-white transition-colors duration-200"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <h2 className="text-base sm:text-xl font-bold text-white tracking-wide">
          {getMonthName(month)} {year}
        </h2>

        <button
          onClick={handleNextMonth}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-white/20 text-white transition-colors duration-200"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-slate-50/50 dark:bg-slate-800/50 border-b border-black/5 dark:border-white/5">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-3 text-center text-[11px] font-bold uppercase tracking-wider ${
              i >= 5 ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 border-l border-t border-black/5 dark:border-white/5 flex-1">
        {days.map((day, index) => (
          <CalendarDay
            key={index}
            date={day}
            currentMonth={month}
            sessions={sessions}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </div>
  );
}
