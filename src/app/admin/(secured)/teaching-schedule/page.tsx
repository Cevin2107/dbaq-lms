"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Users,
  RefreshCw,
  Edit2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Link2,
  Search,
  X,
  AlertCircle,
  CalendarCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import clsx from "clsx";

type Shift = { id: string; name: string; start_time: string; end_time: string };
type AvailableSchedule = { id: string; day_of_week: number; shift_id: string };

type StudentRegistration = {
  registration_id: string;
  available_schedule_id: string;
  day_of_week: number;
  shift: Shift;
};

type StudentLimit = {
  id: string;
  full_name: string;
  max_shifts: number;
};

const DAYS = [
  { value: 2, label: "Thứ 2" },
  { value: 3, label: "Thứ 3" },
  { value: 4, label: "Thứ 4" },
  { value: 5, label: "Thứ 5" },
  { value: 6, label: "Thứ 6" },
  { value: 7, label: "Thứ 7" },
  { value: 8, label: "Chủ nhật" },
];

export default function TeachingSchedulePage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [availableSchedules, setAvailableSchedules] = useState<AvailableSchedule[]>([]);
  const [studentLimits, setStudentLimits] = useState<StudentLimit[]>([]);
  const [registrationsByStudent, setRegistrationsByStudent] = useState<Record<string, StudentRegistration[]>>({});

  const [selectedProxyStudent, setSelectedProxyStudent] = useState<string>("");
  const [proxySelections, setProxySelections] = useState<string[]>([]);
  const [proxySaving, setProxySaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [newShift, setNewShift] = useState({ name: "", start_time: "", end_time: "" });

  // Pro Admin States: Copy link feedback, search & filtering
  const [copied, setCopied] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [studentFilter, setStudentFilter] = useState<"all" | "registered" | "unregistered">("all");
  const [originUrl, setOriginUrl] = useState("https://dbaq-lms.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const registrationUrl = `${originUrl}/register-schedule`;

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3500);
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(registrationUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = registrationUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showMessage("success", "Đã sao chép link đăng ký! Bạn có thể gửi link này cho học sinh.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showMessage("error", "Không thể tự động sao chép link. Vui lòng sao chép thủ công.");
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [shiftsRes, availableRes, regsRes, limitsRes] = await Promise.all([
        fetch("/api/admin/shifts"),
        fetch("/api/admin/available-schedules"),
        fetch("/api/admin/schedule-registrations"),
        fetch("/api/admin/student-limits"),
      ]);

      if (shiftsRes.ok) setShifts(await shiftsRes.json());
      if (availableRes.ok) setAvailableSchedules(await availableRes.json());

      if (regsRes.ok) {
        const regsData = await regsRes.json();
        const regMap: Record<string, StudentRegistration[]> = {};
        for (const r of regsData) {
          regMap[r.student_id] = r.registrations;
        }
        setRegistrationsByStudent(regMap);
      }

      if (limitsRes.ok) {
        setStudentLimits(await limitsRes.json());
      }
    } catch (err) {
      console.error(err);
      showMessage("error", "Lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedProxyStudent) {
      const regs = registrationsByStudent[selectedProxyStudent] || [];
      setProxySelections(regs.map((r) => r.available_schedule_id));
    } else {
      setProxySelections([]);
    }
  }, [selectedProxyStudent, registrationsByStudent]);

  const handleAddShift = async () => {
    if (!newShift.name || !newShift.start_time || !newShift.end_time) {
      showMessage("error", "Vui lòng nhập đủ thông tin ca.");
      return;
    }

    try {
      const res = await fetch("/api/admin/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShift),
      });
      if (res.ok) {
        setNewShift({ name: "", start_time: "", end_time: "" });
        showMessage("success", "Đã thêm ca học thành công.");
        fetchData();
      } else {
        const data = await res.json();
        showMessage("error", data.error || "Không thể thêm ca.");
      }
    } catch {
      showMessage("error", "Lỗi kết nối.");
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm("Xoá ca học này sẽ xoá luôn tất cả lịch rảnh và đăng ký liên quan. Bạn có chắc không?")) return;
    try {
      const res = await fetch(`/api/admin/shifts/${id}`, { method: "DELETE" });
      if (res.ok) {
        showMessage("success", "Đã xoá ca học.");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage("error", data.error || "Không thể xoá ca.");
      }
    } catch {
      showMessage("error", "Lỗi kết nối.");
    }
  };

  const toggleAvailability = (day_of_week: number, shift_id: string) => {
    const exists = availableSchedules.some((s) => s.day_of_week === day_of_week && s.shift_id === shift_id);
    if (exists) {
      setAvailableSchedules(availableSchedules.filter((s) => !(s.day_of_week === day_of_week && s.shift_id === shift_id)));
    } else {
      setAvailableSchedules([...availableSchedules, { id: "", day_of_week, shift_id }]);
    }
  };

  const handleSelectAllAvailability = () => {
    const all: AvailableSchedule[] = [];
    DAYS.forEach((day) => {
      shifts.forEach((shift) => {
        all.push({ id: "", day_of_week: day.value, shift_id: shift.id });
      });
    });
    setAvailableSchedules(all);
    showMessage("success", "Đã chọn mở tất cả các ca trong tuần. Hãy nhấn 'Lưu lịch mở' để hoàn tất.");
  };

  const handleClearAllAvailability = () => {
    setAvailableSchedules([]);
    showMessage("success", "Đã bỏ chọn tất cả các ca. Hãy nhấn 'Lưu lịch mở' để hoàn tất.");
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/available-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules: availableSchedules }),
      });
      if (res.ok) {
        showMessage("success", "Đã lưu danh sách ca mở đăng ký! Bạn có thể sao chép link gửi cho học sinh ngay.");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage("error", data.error || "Không thể lưu lịch mở.");
      }
    } catch {
      showMessage("error", "Lỗi kết nối.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStudentLimit = async (studentId: string, maxShifts: number) => {
    try {
      const res = await fetch("/api/admin/student-limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: studentId, student_id: studentId, max_shifts: maxShifts }),
      });
      if (res.ok) {
        showMessage("success", "Đã cập nhật số ca tối đa.");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage("error", data.error || "Không thể cập nhật số ca tối đa.");
      }
    } catch {
      showMessage("error", "Lỗi kết nối.");
    }
  };

  const handleResetRegistration = async (studentId: string, studentName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá toàn bộ lịch đăng ký của học sinh ${studentName}?`)) return;
    try {
      const res = await fetch(`/api/admin/schedule-registrations?student_id=${studentId}`, { method: "DELETE" });
      if (res.ok) {
        showMessage("success", `Đã xoá đăng ký của ${studentName}.`);
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage("error", data.error || "Không thể xoá lịch đăng ký.");
      }
    } catch {
      showMessage("error", "Lỗi kết nối.");
    }
  };

  const toggleProxySelection = (availableScheduleId: string) => {
    if (proxySelections.includes(availableScheduleId)) {
      setProxySelections(proxySelections.filter((id) => id !== availableScheduleId));
    } else {
      const studentObj = studentLimits.find((s) => s.id === selectedProxyStudent);
      const studentMax = typeof studentObj?.max_shifts === "number" ? studentObj.max_shifts : 3;
      if (proxySelections.length >= studentMax) {
        showMessage("error", `Học sinh này chỉ được chọn tối đa ${studentMax} ca.`);
        return;
      }
      setProxySelections([...proxySelections, availableScheduleId]);
    }
  };

  const handleSaveProxy = async () => {
    if (!selectedProxyStudent) return;
    setProxySaving(true);
    try {
      const res = await fetch("/api/admin/schedule-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: selectedProxyStudent, scheduleIds: proxySelections }),
      });
      if (res.ok) {
        showMessage("success", "Đã lưu đăng ký hộ thành công.");
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage("error", data.error || "Không thể lưu đăng ký hộ.");
      }
    } catch {
      showMessage("error", "Lỗi kết nối.");
    } finally {
      setProxySaving(false);
    }
  };

  // Calculations for Command-Center Stats Bar
  const totalRegisteredStudents = studentLimits.filter(
    (s) => (registrationsByStudent[s.id] || []).length > 0
  ).length;

  const totalRegisteredSlots = Object.values(registrationsByStudent).reduce(
    (acc, regs) => acc + regs.length,
    0
  );

  // Filtered students in Section 4
  const filteredStudents = studentLimits.filter((student) => {
    const regs = registrationsByStudent[student.id] || [];
    const matchesSearch = student.full_name
      .toLowerCase()
      .includes(studentSearchTerm.toLowerCase().trim());
    if (!matchesSearch) return false;

    if (studentFilter === "registered") return regs.length > 0;
    if (studentFilter === "unregistered") return regs.length === 0;
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0066cc] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container-custom py-6 md:py-8 space-y-6 md:space-y-8 animate-fade-in pb-16">
      {/* ─── 1. Header Tile Glassmorphic ─── */}
      <div className="rounded-[2.5rem] bg-gradient-to-br from-white via-[#f0f9ff]/70 to-[#e0f2fe]/50 dark:from-[#1d1d1f]/90 dark:via-[#1d1d1f]/80 dark:to-[#0f172a]/90 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgba(0,102,204,0.06)] p-6 sm:p-8 md:p-10 relative overflow-hidden">
        {/* Soft Ambient Light Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 via-sky-300/15 to-transparent blur-3xl dark:from-blue-600/15" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800/40 shadow-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Cấu hình Ca học & Phân lịch Đăng ký</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">
              Quản lý Đăng ký Ca dạy
            </h1>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Cấu hình các khung giờ ca học, mở lịch rảnh tuần và chia sẻ liên kết đăng ký trực tuyến cho học sinh.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="rounded-full shadow-2xs border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              <span>Làm mới</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 2. Quick Share Registration Link Banner (Pro Feature) ─── */}
      <div className="rounded-[2rem] bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/10 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900/40 border border-blue-500/25 dark:border-blue-400/20 p-5 sm:p-7 shadow-[0_10px_30px_rgba(0,102,204,0.08)] backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-13 w-13 rounded-2xl bg-gradient-to-tr from-[#0066cc] to-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25">
              <Link2 className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  Link Đăng ký Lịch học trực tuyến
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sẵn sàng gửi học sinh
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                Gửi liên kết này cho học sinh để các em tự chọn và chốt ca học theo số ca bạn đã phân quyền:
              </p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/10 text-xs font-mono font-semibold text-[#0066cc] dark:text-blue-300 max-w-full overflow-hidden select-all">
                <span className="truncate">{registrationUrl}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-end">
            <Button
              onClick={handleCopyLink}
              className={clsx(
                "rounded-full px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 shadow-md active:scale-95 flex-1 sm:flex-initial",
                copied
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25"
                  : "bg-[#0066cc] hover:bg-[#005bb5] text-white shadow-blue-500/25"
              )}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1.5 stroke-[3]" />
                  <span>Đã sao chép link!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1.5 stroke-[2.2]" />
                  <span>Sao chép link đăng ký</span>
                </>
              )}
            </Button>

            <a
              href="/register-schedule"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all duration-200 shadow-sm active:scale-90"
              title="Mở xem thử giao diện học sinh trong tab mới"
            >
              <ExternalLink className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ─── 3. Executive KPI Stats Overview (Command Center) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat 1: Shifts */}
        <div className="rounded-[1.75rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Khung Ca học</span>
            <Clock className="h-4 w-4 text-[#0066cc]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {shifts.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đang thiết lập trong ngày</p>
        </div>

        {/* Stat 2: Available Slots */}
        <div className="rounded-[1.75rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Tổng Ca rảnh mở</span>
            <CalendarCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {availableSchedules.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ca mở cho học sinh chọn</p>
        </div>

        {/* Stat 3: Registered Students */}
        <div className="rounded-[1.75rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Học sinh đã đăng ký</span>
            <UserCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            <span>{totalRegisteredStudents}</span>
            <span className="text-sm font-semibold text-slate-400 ml-1">/ {studentLimits.length}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Học sinh đã chọn lịch</p>
        </div>

        {/* Stat 4: Total Booked Slots */}
        <div className="rounded-[1.75rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Tổng lượt ca chốt</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {totalRegisteredSlots}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Lượt ca học đã xác nhận</p>
        </div>
      </div>

      {/* Floating Alert Feedback */}
      {message.text && (
        <div
          className={clsx(
            "p-4 sm:p-5 rounded-[1.5rem] font-semibold text-sm flex items-center gap-3 shadow-md animate-slide-up transition-all",
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{message.text}</span>
          <button
            onClick={() => setMessage({ type: "", text: "" })}
            className="p-1 hover:opacity-75 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── 4. Shifts Management ─── */}
      <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-[#0066cc]" />
            <span>Quản lý Khung Ca học</span>
          </h2>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {shifts.length} ca hiện có
          </span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-2xs hover:border-slate-300 dark:hover:border-white/10 transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{shift.name}</div>
                  <div className="text-xs font-mono font-semibold text-[#0066cc] dark:text-blue-400 mt-0.5">
                    {shift.start_time.substring(0, 5)} – {shift.end_time.substring(0, 5)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteShift(shift.id)}
                  className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  title="Xoá ca này"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Shift Form */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 items-stretch sm:items-center mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <input
              type="text"
              placeholder="Tên ca (VD: Ca sáng, Ca tối 1)"
              value={newShift.name}
              onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
              className="w-full sm:flex-1 sm:min-w-[160px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-xl text-xs font-semibold outline-none focus:border-[#0066cc]"
            />
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={newShift.start_time}
                onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                className="flex-1 sm:w-28 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-xl text-xs font-semibold outline-none focus:border-[#0066cc]"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input
                type="time"
                value={newShift.end_time}
                onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                className="flex-1 sm:w-28 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-xl text-xs font-semibold outline-none focus:border-[#0066cc]"
              />
            </div>
            <Button
              onClick={handleAddShift}
              size="sm"
              className="rounded-xl bg-[#0066cc] hover:bg-[#0052a3] text-white w-full sm:w-auto shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Thêm ca
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 5. Availability Matrix ─── */}
      <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <span>Cấu hình Lịch rảnh mở cho học sinh</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tích chọn các ca khả dụng để học sinh được đăng ký. Thiết lập xong hãy nhấn <strong>Lưu lịch mở</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Quick Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllAvailability}
              className="rounded-full text-xs font-semibold px-3.5 border-slate-200 dark:border-white/10"
              title="Tích chọn mở toàn bộ ca"
            >
              Mở tất cả
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllAvailability}
              className="rounded-full text-xs font-semibold px-3.5 border-slate-200 dark:border-white/10"
              title="Bỏ chọn toàn bộ ca"
            >
              Đóng tất cả
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="rounded-full border-blue-200 dark:border-blue-900/60 text-[#0066cc] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold px-4"
            >
              {copied ? <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500 stroke-[3]" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              <span>{copied ? "Đã chép link!" : "Sao chép link gửi HS"}</span>
            </Button>
            <Button
              onClick={handleSaveAvailability}
              disabled={saving}
              className="rounded-full bg-[#0066cc] hover:bg-[#005bb5] text-white shadow-lg shadow-blue-500/20 px-5 text-xs font-bold"
            >
              {saving ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Lưu lịch mở
            </Button>
          </div>
        </div>

        {shifts.length === 0 ? (
          <p className="text-slate-500 text-center py-8 text-sm">Chưa có ca học nào. Vui lòng thêm ca học ở khối trên trước.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-white/5">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="px-4 py-3.5 border-b border-slate-200 dark:border-white/5 w-32 sticky left-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur z-10 font-bold text-xs uppercase tracking-wider">
                    Thứ \ Ca
                  </th>
                  {shifts.map((shift) => (
                    <th key={shift.id} className="px-4 py-3.5 border-b border-slate-200 dark:border-white/5 text-center min-w-[130px]">
                      <div className="font-bold text-slate-900 dark:text-white">{shift.name}</div>
                      <div className="text-xs text-[#0066cc] dark:text-blue-400 font-mono font-semibold mt-0.5">
                        {shift.start_time.substring(0, 5)} – {shift.end_time.substring(0, 5)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day.value} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200 sticky left-0 bg-white/90 dark:bg-[#1d1d1f]/90 backdrop-blur z-10 border-r border-slate-100 dark:border-white/5">
                      {day.label}
                    </td>
                    {shifts.map((shift) => {
                      const isAvailable = availableSchedules.some(
                        (s) => s.day_of_week === day.value && s.shift_id === shift.id
                      );
                      return (
                        <td key={shift.id} className="px-4 py-3.5 text-center">
                          <label className="relative inline-flex items-center justify-center cursor-pointer p-2 group">
                            <input
                              type="checkbox"
                              checked={isAvailable}
                              onChange={() => toggleAvailability(day.value, shift.id)}
                              className="sr-only peer"
                            />
                            <div className="w-7 h-7 border-2 border-slate-300 dark:border-slate-600 rounded-xl peer-checked:bg-[#0066cc] peer-checked:border-[#0066cc] flex items-center justify-center transition-all duration-200 shadow-2xs group-hover:scale-105 active:scale-95">
                              <svg
                                className={`w-4 h-4 text-white ${
                                  isAvailable ? "opacity-100 scale-100" : "opacity-0 scale-50"
                                } transition-all duration-200`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── 6. Proxy Registration (Đăng ký hộ) ─── */}
      <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Edit2 className="h-5 w-5 text-[#0066cc]" />
              <span>Đăng ký ca hộ cho Học sinh</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Admin có thể chọn trực tiếp ca học thay cho học sinh khi phụ huynh/học sinh nhờ đặt lịch.
            </p>
          </div>

          <select
            value={selectedProxyStudent}
            onChange={(e) => setSelectedProxyStudent(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-full bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[260px] shadow-2xs"
          >
            <option value="">-- Chọn học sinh cần đăng ký hộ --</option>
            {studentLimits.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} ({s.max_shifts} ca tối đa)
              </option>
            ))}
          </select>
        </div>

        {selectedProxyStudent ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Đang chọn ca cho:{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {studentLimits.find((s) => s.id === selectedProxyStudent)?.full_name}
                </span>{" "}
                • Đã chọn:{" "}
                <span className="text-[#0066cc] dark:text-blue-400 font-extrabold text-base">
                  {proxySelections.length}
                </span>{" "}
                / {studentLimits.find((s) => s.id === selectedProxyStudent)?.max_shifts ?? 0} ca
              </div>
              <Button
                onClick={handleSaveProxy}
                disabled={proxySaving}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 shadow-md shadow-emerald-500/20"
              >
                {proxySaving ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                Lưu đăng ký hộ
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-white/5">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="px-4 py-3.5 border-b border-slate-200 dark:border-white/5 w-32 sticky left-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur z-10 font-bold text-xs uppercase tracking-wider">
                      Thứ \ Ca
                    </th>
                    {shifts.map((shift) => (
                      <th key={shift.id} className="px-4 py-3.5 border-b border-slate-200 dark:border-white/5 text-center min-w-[130px]">
                        <div className="font-bold">{shift.name}</div>
                        <div className="text-xs text-slate-400 font-normal">
                          {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day.value} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200 sticky left-0 bg-white/90 dark:bg-[#1d1d1f]/90 backdrop-blur z-10 border-r border-slate-100 dark:border-white/5">
                        {day.label}
                      </td>
                      {shifts.map((shift) => {
                        const availableSchedule = availableSchedules.find(
                          (s) => s.day_of_week === day.value && s.shift_id === shift.id
                        );
                        if (!availableSchedule) {
                          return <td key={shift.id} className="px-4 py-3 text-center text-slate-300 dark:text-slate-600">-</td>;
                        }

                        let isLockedByOther = false;
                        for (const [studentId, regs] of Object.entries(registrationsByStudent)) {
                          if (
                            studentId !== selectedProxyStudent &&
                            regs.some((r) => r.available_schedule_id === availableSchedule.id)
                          ) {
                            isLockedByOther = true;
                            break;
                          }
                        }

                        const isSelected = proxySelections.includes(availableSchedule.id);

                        return (
                          <td key={shift.id} className="px-4 py-3 text-center">
                            {isLockedByOther ? (
                              <div
                                className="mx-auto w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-not-allowed"
                                title="Đã có học sinh khác đăng ký"
                              >
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <label className="relative inline-flex items-center justify-center cursor-pointer p-2 group">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleProxySelection(availableSchedule.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-7 h-7 border-2 border-slate-300 dark:border-slate-600 rounded-xl peer-checked:bg-emerald-600 peer-checked:border-emerald-600 flex items-center justify-center transition-all duration-200 group-hover:scale-105 active:scale-95 shadow-2xs">
                                  <svg
                                    className={`w-4 h-4 text-white ${
                                      isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"
                                    } transition-all duration-200`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </label>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8 text-sm italic">
            Vui lòng chọn một học sinh ở mục trên để bắt đầu đăng ký ca hộ.
          </p>
        )}
      </div>

      {/* ─── 7. Students Limits & Registrations ─── */}
      <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Users className="h-5 w-5 text-[#0066cc]" />
              <span>Cấu hình Giới hạn Ca & Danh sách Đã đăng ký</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Phân quyền số ca tối đa được chọn cho từng học sinh và theo dõi các ca đã chốt.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm tên học sinh..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="pl-9 pr-3.5 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-56"
              />
              {studentSearchTerm && (
                <button
                  onClick={() => setStudentSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="inline-flex p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                onClick={() => setStudentFilter("all")}
                className={clsx(
                  "px-3 py-1 rounded-full transition-colors",
                  studentFilter === "all"
                    ? "bg-white dark:bg-[#2c2c30] text-[#0066cc] dark:text-blue-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                Tất cả ({studentLimits.length})
              </button>
              <button
                onClick={() => setStudentFilter("registered")}
                className={clsx(
                  "px-3 py-1 rounded-full transition-colors",
                  studentFilter === "registered"
                    ? "bg-white dark:bg-[#2c2c30] text-[#0066cc] dark:text-blue-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                Đã chọn ({totalRegisteredStudents})
              </button>
              <button
                onClick={() => setStudentFilter("unregistered")}
                className={clsx(
                  "px-3 py-1 rounded-full transition-colors",
                  studentFilter === "unregistered"
                    ? "bg-white dark:bg-[#2c2c30] text-[#0066cc] dark:text-blue-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                Chưa chọn ({studentLimits.length - totalRegisteredStudents})
              </button>
            </div>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <p className="text-slate-500 text-center py-8 text-sm italic">
            Không tìm thấy học sinh nào phù hợp với bộ lọc.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {filteredStudents.map((student) => {
              const regs = (registrationsByStudent[student.id] || []).sort((a, b) => {
                if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
                return (a.shift?.start_time || "").localeCompare(b.shift?.start_time || "");
              });
              const isLimitReached = regs.length >= student.max_shifts && student.max_shifts > 0;
              return (
                <div
                  key={student.id}
                  className="bg-slate-50/80 dark:bg-slate-800/40 rounded-[1.75rem] border border-slate-200/80 dark:border-white/5 p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-white/10 transition-colors shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/50 dark:border-white/5">
                    <div className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#0066cc] to-[#2563eb] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-md shadow-blue-500/20">
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="truncate block">{student.full_name}</span>
                        <span className="text-[11px] text-slate-400 font-normal">Học sinh</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5 shadow-2xs">
                      <span className="text-xs font-semibold text-slate-500">Số ca tối đa:</span>
                      <input
                        type="number"
                        min="0"
                        value={student.max_shifts}
                        onChange={(e) => {
                          const newLimits = studentLimits.map((s) =>
                            s.id === student.id ? { ...s, max_shifts: Number(e.target.value) } : s
                          );
                          setStudentLimits(newLimits);
                        }}
                        onBlur={(e) => handleUpdateStudentLimit(student.id, Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="w-14 px-2 py-0.5 text-center font-extrabold border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-xs text-[#0066cc] dark:text-blue-400 outline-none focus:ring-2 focus:ring-blue-500"
                        title="Thay đổi sẽ tự động lưu khi ấn Enter hoặc bấm ra ngoài"
                      />
                    </div>
                  </div>

                  {regs.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Đã đăng ký ({regs.length}/{student.max_shifts} ca)
                          </p>
                          {isLimitReached && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              Đủ ca
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleResetRegistration(student.id, student.full_name)}
                          className="text-xs flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 px-2.5 py-1 rounded-full transition border border-rose-100 dark:border-rose-900/30"
                          title="Xóa tất cả các ca đã đăng ký của học sinh này"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Reset lịch</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {regs.map((reg) => {
                          const dayLabel = DAYS.find((d) => d.value === reg.day_of_week)?.label;
                          const startTime = reg.shift?.start_time ? reg.shift.start_time.substring(0, 5) : "";
                          const endTime = reg.shift?.end_time ? reg.shift.end_time.substring(0, 5) : "";
                          return (
                            <div
                              key={reg.registration_id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1d1d1f] border border-slate-200/80 dark:border-white/10 shadow-2xs gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-extrabold px-2.5 py-0.5 rounded-md bg-gradient-to-r from-[#0066cc] to-[#0052a3] text-white text-[11px] shrink-0">
                                  {dayLabel}
                                </span>
                                {reg.shift?.name && (
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {reg.shift.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-bold text-[#0066cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-100/80 dark:border-blue-900/40 font-mono shrink-0">
                                <Clock className="w-3 h-3 text-blue-500" />
                                <span>
                                  {startTime} – {endTime}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-1">
                      <p className="text-xs text-slate-400 italic">Chưa đăng ký ca nào.</p>
                      <button
                        onClick={() => setSelectedProxyStudent(student.id)}
                        className="text-xs text-[#0066cc] dark:text-blue-400 font-semibold hover:underline"
                      >
                        + Đăng ký hộ
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
