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
      onClick={handleClick}
      className={`
        border-r border-b border-gray-100
        min-h-[50px] sm:min-h-[70px] md:min-h-[85px]
        p-1 transition-colors duration-150
        ${
          !isCurrentMonth
            ? "bg-gray-50 cursor-default"
            : isSaturday || isSunday
            ? "bg-slate-50 hover:bg-slate-100 cursor-pointer"
            : "bg-white hover:bg-blue-50 cursor-pointer"
        }
      `}
    >
      {/* Day number */}
      <div className="flex justify-end mb-1">
        <span
          className={`
            w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full
            text-xs font-medium
            ${
              isTodayDate
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : !isCurrentMonth
                ? "text-gray-300"
                : isSunday || isSaturday
                ? "text-slate-500 font-semibold"
                : "text-gray-700"
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
      <div className="calendar-day-tags hidden sm:block space-y-0.5">
        {daySessions.slice(0, 3).map((session) => (
          <div
            key={session.id}
            className={`
              ${SUBJECT_COLORS[session.subject].bg}
              text-white text-xs px-1.5 py-0.5 rounded
              font-medium truncate leading-5
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
