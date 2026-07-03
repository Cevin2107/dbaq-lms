import { formatDate, isToday, isSameMonth } from "@/features/admin/schedule/utils/dateUtils";
import { SUBJECT_COLORS, SUBJECT_NAMES } from "@/features/admin/schedule/constants/subjects";
import type { TeachingSession } from "@/features/admin/schedule/lib/database.types";

interface CalendarDayProps {
  date: Date;
  currentMonth: number;
  sessions: TeachingSession[];
  onDayClick: (date: Date) => void;
}

export function CalendarDay({ date, currentMonth, sessions, onDayClick }: CalendarDayProps) {
  const dateStr = formatDate(date);
  const daySessions = sessions.filter((s) => s.teaching_date === dateStr);
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;

  const handleClick = () => {
    if (isCurrentMonth) onDayClick(date);
  };

  return (
    <div
      onClick={() => onDayClick(date)}
      className={`
        calendar-day-container min-h-[50px] sm:min-h-[70px] md:min-h-[85px] 
        p-1 sm:p-2 flex flex-col gap-1 sm:gap-2 relative
        border-r border-b border-black/5 dark:border-white/5
        transition-all duration-200
        ${!isCurrentMonth
          ? "bg-slate-50/50 dark:bg-slate-800/20 cursor-default"
          : isSaturday || isSunday
            ? "bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
            : "bg-white/50 dark:bg-[#1d1d1f]/50 hover:bg-white/80 dark:hover:bg-white/10 cursor-pointer"
        }
      `}
    >
      {/* Day number */}
      <div className="flex justify-end mb-1">
        <span
          className={`
            w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full
            text-[11px] sm:text-xs font-bold
            ${isTodayDate
              ? "bg-[#0066cc] text-white shadow-md shadow-blue-500/20"
              : !isCurrentMonth
                ? "text-slate-300 dark:text-slate-600"
                : isSunday || isSaturday
                  ? "text-rose-500/80"
                  : "text-slate-700 dark:text-slate-300"
            }
          `}
        >
          {date.getDate()}
        </span>
      </div>

      {/* Sessions — dots on mobile, tags on sm+ */}
      <div className="calendar-day-dots flex flex-wrap gap-0.5 sm:hidden">
        {daySessions.slice(0, 3).map((session) => (
          <span
            key={session.id}
            className={`${SUBJECT_COLORS[session.subject].bg} w-2 h-2 rounded-full block`}
          />
        ))}
      </div>
      <div className="calendar-day-tags hidden sm:block space-y-1">
        {daySessions.slice(0, 3).map((session) => (
          <div
            key={session.id}
            className={`
              ${SUBJECT_COLORS[session.subject].bg}
              text-white text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full
              font-semibold truncate leading-tight shadow-sm
            `}
          >
            {SUBJECT_NAMES[session.subject]}
          </div>
        ))}
        {daySessions.length > 3 && (
          <div className="text-xs text-gray-400 text-center font-medium">
            +{daySessions.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}
