"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, Check, Info, Lock, Minus, Plus, RefreshCw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

type Shift = { id: string; name: string; start_time: string; end_time: string };
type AvailableSchedule = { id: string; day_of_week: number; shift_id: string };

const DAYS = [
  { value: 2, label: "Thứ 2" },
  { value: 3, label: "Thứ 3" },
  { value: 4, label: "Thứ 4" },
  { value: 5, label: "Thứ 5" },
  { value: 6, label: "Thứ 6" },
  { value: 7, label: "Thứ 7" },
  { value: 8, label: "Chủ nhật" },
];

export function ScheduleRegistrationPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [maxShifts, setMaxShifts] = useState(3);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [availableSchedules, setAvailableSchedules] = useState<AvailableSchedule[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lockedSchedules, setLockedSchedules] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/student/schedules");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Không thể tải lịch học");
      const data = await res.json();
      setMaxShifts(data.maxShifts);
      setShifts(data.shifts);
      setAvailableSchedules(data.availableSchedules);
      setSelectedIds(new Set(data.myRegistrations));
      setLockedSchedules(new Set(data.lockedSchedules));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSelection = (scheduleId: string) => {
    if (lockedSchedules.has(scheduleId)) return;
    const next = new Set(selectedIds);
    if (next.has(scheduleId)) {
      next.delete(scheduleId);
    } else {
      if (maxShifts <= 0) {
        setError("Tài khoản của bạn hiện có giới hạn 0 ca. Không thể chọn ca học.");
        setTimeout(() => setError(""), 3000);
        return;
      }
      if (next.size >= maxShifts) {
        setError(`Bạn chỉ được chọn tối đa ${maxShifts} ca.`);
        setTimeout(() => setError(""), 3000);
        return;
      }
      next.add(scheduleId);
    }
    setSelectedIds(next);
  };

  const handleRegister = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/student/schedules/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleIds: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể đăng ký lịch");
      }
      setSuccess("Đăng ký lịch thành công!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng ký lịch");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[2rem] bg-white dark:bg-[#1d1d1f] border border-black/5 dark:border-white/5">
        <RefreshCw className="h-8 w-8 animate-spin text-[#0066cc]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-br from-[#ffffff] via-[#f0f9ff] to-[#e0f2fe] dark:from-[#1a1c23] dark:via-[#151921] dark:to-[#0f172a] p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgba(0,102,204,0.08)] border border-[#bae6fd]/30 dark:border-white/10">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white flex items-center gap-4 tracking-[-0.02em] leading-tight mb-3">
            <span className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl text-[#0066cc] dark:text-blue-400">
              <CalendarDays className="h-7 w-7" />
            </span>
            Đăng ký Lịch học
          </h2>
          <p className="text-[17px] text-slate-600 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
            {maxShifts <= 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                Tài khoản của bạn hiện tại có giới hạn 0 ca đăng ký. Vui lòng liên hệ giáo viên để được cấp số ca.
              </span>
            ) : (
              <>
                Vui lòng chọn các ca học phù hợp. Bạn có thể chọn tối đa{" "}
                <span className="font-semibold text-[#0066cc] dark:text-blue-400">{maxShifts} ca</span> trong tuần.
              </>
            )}
          </p>
        </div>

        <div className="bg-white/80 dark:bg-[#0a0a0a]/40 backdrop-blur-md rounded-[1.5rem] border border-white/40 dark:border-white/10 p-5 flex flex-col md:items-end shadow-sm shrink-0 min-w-[140px]">
          <span className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mb-1">Đã chọn</span>
          <div className="text-3xl font-bold text-slate-800 dark:text-white flex items-baseline">
            <span className={clsx(selectedIds.size === maxShifts && "text-[#0066cc] dark:text-blue-400")}>
              {selectedIds.size}
            </span>
            <span className="text-slate-400 text-xl ml-1"> / {maxShifts}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-[1.5rem] shadow-sm">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <p className="text-[15px] font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-[1.5rem] shadow-sm">
          <span className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white text-sm">✓</span>
          <p className="text-[15px] font-medium">{success}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-6 text-xs sm:text-sm px-2">
        {/* 1. Ca trống */}
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full border-2 border-blue-400/80 bg-blue-50/70 dark:bg-blue-950/40 flex items-center justify-center text-[#0066cc] dark:text-blue-300">
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          </span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">Ca trống</span>
        </div>

        {/* 2. Bạn đã chọn */}
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#0066cc] to-[#2563eb] text-white flex items-center justify-center shadow-sm">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </span>
          <span className="text-[#0066cc] dark:text-blue-400 font-semibold">Bạn đã chọn</span>
        </div>

        {/* 3. Đã có người đăng ký */}
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-500 flex items-center justify-center">
            <Lock className="h-3 w-3 stroke-[2.2]" />
          </span>
          <span className="text-rose-600 dark:text-rose-400 font-medium">Đã có người đăng ký</span>
        </div>

        {/* 4. Ca không mở */}
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-slate-400 flex items-center justify-center opacity-60">
            <Minus className="h-3 w-3 stroke-[2]" />
          </span>
          <span className="text-slate-400 dark:text-slate-500 font-normal">Không mở ca</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1d1d1f] rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 overflow-hidden transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-5 border-b border-slate-100 dark:border-white/5 w-36 sticky left-0 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur z-10 font-semibold uppercase text-[13px]">
                  Thứ \ Ca
                </th>
                {shifts.map((shift) => (
                  <th key={shift.id} className="px-6 py-5 border-b border-slate-100 dark:border-white/5 text-center min-w-[140px]">
                    <div className="font-bold text-slate-800 dark:text-white text-[15px]">{shift.name}</div>
                    <div className="text-[13px] text-slate-400 mt-1">
                      {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, idx) => (
                <tr
                  key={day.value}
                  className={clsx(
                    "hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors",
                    idx !== DAYS.length - 1 && "border-b border-slate-100 dark:border-white/5"
                  )}
                >
                  <td className="px-6 py-5 font-semibold text-slate-800 dark:text-white sticky left-0 bg-white/90 dark:bg-[#1d1d1f]/90 backdrop-blur z-10 border-r border-slate-100 dark:border-white/5">
                    {day.label}
                  </td>
                  {shifts.map((shift) => {
                    const schedule = availableSchedules.find(
                      (item) => item.day_of_week === day.value && item.shift_id === shift.id
                    );

                    if (!schedule) {
                      return (
                        <td key={shift.id} className="px-3 sm:px-6 py-3.5 sm:py-4 text-center">
                          <div
                            className="mx-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-center justify-center opacity-40 cursor-not-allowed select-none"
                            title="Ca này không mở lịch"
                          >
                            <Minus className="h-4 w-4 text-slate-400 dark:text-slate-600 stroke-[2]" />
                          </div>
                        </td>
                      );
                    }

                    const isSelected = selectedIds.has(schedule.id);
                    const isLocked = lockedSchedules.has(schedule.id);

                    return (
                      <td key={shift.id} className="px-3 sm:px-6 py-3.5 sm:py-4 text-center">
                        {isLocked ? (
                          <div
                            className="mx-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-rose-500 dark:text-rose-400 flex items-center justify-center cursor-not-allowed select-none shadow-sm"
                            title="Đã có học sinh đăng ký ca này"
                          >
                            <Lock className="h-4 w-4 stroke-[2.2]" />
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleSelection(schedule.id)}
                            title={isSelected ? "Bạn đã chọn ca này • Nhấn để bỏ chọn" : "Ca trống • Nhấn để chọn"}
                            className={clsx(
                              "mx-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 ease-spring active:scale-90 select-none group",
                              isSelected
                                ? "bg-gradient-to-tr from-[#0066cc] to-[#2563eb] text-white shadow-[0_4px_16px_rgba(0,102,204,0.45)] ring-4 ring-blue-500/20 scale-105"
                                : "bg-blue-50/70 hover:bg-blue-100/90 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 border-2 border-blue-400/80 hover:border-[#0066cc] dark:border-blue-500/50 dark:hover:border-blue-400 text-[#0066cc] dark:text-blue-300 shadow-sm hover:scale-110"
                            )}
                          >
                            {isSelected ? (
                              <Check className="h-5 w-5 stroke-[3] animate-scale-in" />
                            ) : (
                              <Plus className="h-5 w-5 stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
                            )}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 dark:bg-[#1d1d1f] p-6 sm:px-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-[15px] text-slate-500 dark:text-slate-400 text-center md:text-left">
            <span className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
              <Info className="w-5 h-5" />
            </span>
            <span>Nhấn vào ô trống để đăng ký, nhấn lại để huỷ chọn. Bạn có thể thay đổi lịch bất kỳ lúc nào trước khi ca học bắt đầu.</span>
          </div>

          <button
            onClick={handleRegister}
            disabled={saving}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 text-white font-semibold transition-all duration-300 ease-spring disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-blue-500/20 hover:shadow-lg hover:-translate-y-0.5 text-[16px]"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Xác nhận đăng ký
          </button>
        </div>
      </div>
    </div>
  );
}
