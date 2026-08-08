"use client";

import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Save, Users, RefreshCw, Edit2, Calendar, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProxyStudent) {
      const regs = registrationsByStudent[selectedProxyStudent] || [];
      setProxySelections(regs.map(r => r.available_schedule_id));
    } else {
      setProxySelections([]);
    }
  }, [selectedProxyStudent, registrationsByStudent]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, availableRes, regsRes, limitsRes] = await Promise.all([
        fetch("/api/admin/shifts"),
        fetch("/api/admin/available-schedules"),
        fetch("/api/admin/schedule-registrations"),
        fetch("/api/admin/student-limits")
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
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleAddShift = async () => {
    if (!newShift.name || !newShift.start_time || !newShift.end_time) {
      showMessage("error", "Vui lòng nhập đủ thông tin ca.");
      return;
    }

    try {
      const res = await fetch("/api/admin/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShift)
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
      const res = await fetch(`/api/admin/shifts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showMessage("success", "Đã xoá ca học.");
        fetchData();
      } else {
        showMessage("error", "Không thể xoá ca.");
      }
    } catch {
      showMessage("error", "Lỗi kết nối.");
    }
  };

  const toggleAvailability = (day_of_week: number, shift_id: string) => {
    const exists = availableSchedules.some(s => s.day_of_week === day_of_week && s.shift_id === shift_id);
    if (exists) {
      setAvailableSchedules(availableSchedules.filter(s => !(s.day_of_week === day_of_week && s.shift_id === shift_id)));
    } else {
      setAvailableSchedules([...availableSchedules, { id: "", day_of_week, shift_id }]);
    }
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/available-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules: availableSchedules })
      });
      if (res.ok) {
        showMessage("success", "Đã lưu danh sách ca mở đăng ký.");
        fetchData();
      } else {
        showMessage("error", "Không thể lưu lịch mở.");
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, max_shifts: maxShifts })
      });
      if (res.ok) {
        showMessage("success", "Đã cập nhật số ca tối đa.");
        fetchData();
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
        showMessage("error", "Không thể xoá lịch đăng ký.");
      }
    } catch {
      showMessage("error", "Lỗi kết nối.");
    }
  };

  const toggleProxySelection = (availableScheduleId: string) => {
    if (proxySelections.includes(availableScheduleId)) {
      setProxySelections(proxySelections.filter(id => id !== availableScheduleId));
    } else {
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
        body: JSON.stringify({ student_id: selectedProxyStudent, scheduleIds: proxySelections })
      });
      if (res.ok) {
        showMessage("success", "Đã lưu đăng ký hộ thành công.");
        fetchData();
      } else {
        const data = await res.json();
        showMessage("error", data.error || "Không thể lưu đăng ký hộ.");
      }
    } catch {
      showMessage("error", "Lỗi kết nối.");
    } finally {
      setProxySaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0066cc] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container-custom py-6 md:py-8 space-y-6 md:space-y-8 animate-fade-in pb-16">
      {/* Header Tile Glassmorphic */}
      <div className="rounded-[2rem] bg-gradient-to-br from-white via-[#f0f9ff]/60 to-[#e0f2fe]/40 dark:from-[#1d1d1f]/90 dark:via-[#1d1d1f]/80 dark:to-[#0f172a]/90 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgba(0,102,204,0.06)] p-6 sm:p-8 md:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800/40">
              <Clock className="w-3.5 h-3.5" />
              <span>Cấu hình Ca học & Phân lịch Đăng ký</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">
              Quản lý Đăng ký Ca dạy
            </h1>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-xl">
              Cấu hình các ca học, mở khung lịch rảnh và hỗ trợ đăng ký lịch cố định cho học sinh.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-xs font-semibold self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            <span>Làm mới dữ liệu</span>
          </Button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl font-semibold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {message.text}
        </div>
      )}

      {/* 1. Shifts */}
      <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#0066cc]" /> Quản lý Khung Ca học
        </h2>
        <div className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shifts.map(shift => (
              <div key={shift.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/5">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{shift.name}</span>
                  <span className="text-xs font-mono font-semibold text-[#0066cc] dark:text-blue-400 ml-2">
                    ({shift.start_time.substring(0,5)} – {shift.end_time.substring(0,5)})
                  </span>
                </div>
                <button onClick={() => handleDeleteShift(shift.id)} className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-xl transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 items-stretch sm:items-center mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
            <input type="text" placeholder="Tên ca (ví dụ: Ca chiều)" value={newShift.name} onChange={e => setNewShift({...newShift, name: e.target.value})} className="w-full sm:flex-1 sm:min-w-[140px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-xl text-xs font-semibold outline-none focus:border-[#0066cc]" />
            <div className="flex items-center gap-2">
              <input type="time" value={newShift.start_time} onChange={e => setNewShift({...newShift, start_time: e.target.value})} className="flex-1 sm:w-28 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-xl text-xs font-semibold outline-none focus:border-[#0066cc]" />
              <span className="text-slate-400 font-bold">-</span>
              <input type="time" value={newShift.end_time} onChange={e => setNewShift({...newShift, end_time: e.target.value})} className="flex-1 sm:w-28 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-xl text-xs font-semibold outline-none focus:border-[#0066cc]" />
            </div>
            <Button onClick={handleAddShift} size="sm" className="rounded-xl bg-[#0066cc] hover:bg-[#0052a3] w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              Thêm ca
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Availability Matrix */}
      <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8 overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" /> Cấu hình Lịch rảnh mở cho học sinh
            </h2>
            <p className="text-xs text-slate-500 mt-1">Tích chọn các ca khả dụng để học sinh được đăng ký.</p>
          </div>
          <Button 
            onClick={handleSaveAvailability} 
            disabled={saving}
            className="rounded-full bg-[#0066cc] hover:bg-[#005bb5] shadow-lg shadow-blue-500/20 px-5 text-xs font-semibold"
          >
            {saving ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Lưu lịch mở
          </Button>
        </div>

        {shifts.length === 0 ? (
          <p className="text-slate-500 text-center py-8 text-sm">Chưa có ca học nào. Vui lòng thêm ca học ở khối trên trước.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold">
              <tr>
                <th className="px-4 py-3 border-b border-slate-200 dark:border-white/5 rounded-tl-xl w-32">Thứ \ Ca</th>
                {shifts.map(shift => (
                  <th key={shift.id} className="px-4 py-3 border-b border-slate-200 dark:border-white/5 text-center">
                    <div className="font-bold">{shift.name}</div>
                    <div className="text-xs text-indigo-600 font-mono font-semibold">{shift.start_time.substring(0,5)} – {shift.end_time.substring(0,5)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day.value} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{day.label}</td>
                  {shifts.map(shift => {
                    const isAvailable = availableSchedules.some(s => s.day_of_week === day.value && s.shift_id === shift.id);
                    return (
                      <td key={shift.id} className="px-4 py-3 text-center">
                        <label className="relative inline-flex items-center justify-center cursor-pointer p-2">
                          <input 
                            type="checkbox" 
                            checked={isAvailable}
                            onChange={() => toggleAvailability(day.value, shift.id)}
                            className="sr-only peer"
                          />
                          <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 rounded-lg peer-checked:bg-[#0066cc] peer-checked:border-[#0066cc] flex items-center justify-center transition-all">
                            <svg className={`w-4 h-4 text-white ${isAvailable ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} transition-all`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        )}
      </div>

      {/* 3. Proxy Registration */}
      <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-[#0066cc]" /> Đăng ký ca hộ cho Học sinh
          </h2>
          <select 
            value={selectedProxyStudent} 
            onChange={e => setSelectedProxyStudent(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-full bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
          >
            <option value="">-- Chọn học sinh --</option>
            {studentLimits.map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>

        {selectedProxyStudent ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Đã chọn: <span className="text-[#0066cc] font-extrabold">{proxySelections.length}</span> / {studentLimits.find(s => s.id === selectedProxyStudent)?.max_shifts || 0} ca
              </div>
              <Button 
                onClick={handleSaveProxy} 
                disabled={proxySaving}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5"
              >
                {proxySaving ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                Lưu đăng ký hộ
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-white/5 rounded-tl-xl w-32">Thứ \ Ca</th>
                    {shifts.map(shift => (
                      <th key={shift.id} className="px-4 py-3 border-b border-slate-200 dark:border-white/5 text-center">
                        <div className="font-bold">{shift.name}</div>
                        <div className="text-xs text-slate-400 font-normal">{shift.start_time.substring(0,5)} - {shift.end_time.substring(0,5)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => (
                    <tr key={day.value} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{day.label}</td>
                      {shifts.map(shift => {
                        const availableSchedule = availableSchedules.find(s => s.day_of_week === day.value && s.shift_id === shift.id);
                        if (!availableSchedule) {
                          return <td key={shift.id} className="px-4 py-3 text-center text-slate-300 dark:text-slate-600">-</td>;
                        }

                        let isLockedByOther = false;
                        for (const [studentId, regs] of Object.entries(registrationsByStudent)) {
                          if (studentId !== selectedProxyStudent && regs.some(r => r.available_schedule_id === availableSchedule.id)) {
                            isLockedByOther = true;
                            break;
                          }
                        }

                        const isSelected = proxySelections.includes(availableSchedule.id);

                        return (
                          <td key={shift.id} className="px-4 py-3 text-center">
                            {isLockedByOther ? (
                              <div className="mx-auto w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-not-allowed" title="Đã có học sinh khác đăng ký">
                                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            ) : (
                              <label className="relative inline-flex items-center justify-center cursor-pointer p-2">
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => toggleProxySelection(availableSchedule.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 rounded-lg peer-checked:bg-emerald-600 peer-checked:border-emerald-600 flex items-center justify-center transition-all">
                                  <svg className={`w-4 h-4 text-white ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} transition-all`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <p className="text-slate-500 text-center py-8 text-sm">Vui lòng chọn một học sinh ở mục trên để bắt đầu đăng ký ca hộ.</p>
        )}
      </div>

      {/* 4. Students Limits & Registrations */}
      <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Users className="h-5 w-5 text-[#0066cc]" /> Cấu hình Giới hạn Ca & Danh sách Đã đăng ký
        </h2>

        {studentLimits.length === 0 ? (
          <p className="text-slate-500 text-center py-8 text-sm">Chưa có học sinh nào trên hệ thống.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {studentLimits.map(student => {
              const regs = (registrationsByStudent[student.id] || []).sort((a, b) => {
                if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
                return (a.shift?.start_time || "").localeCompare(b.shift?.start_time || "");
              });
              return (
                <div key={student.id} className="bg-slate-50/80 dark:bg-slate-800/40 rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 p-5 flex flex-col justify-between space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/50 dark:border-white/5">
                    <div className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-[#0066cc] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-md shadow-blue-500/20">
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{student.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-xs font-semibold text-slate-500">Số ca tối đa:</span>
                      <input 
                        type="number"
                        min="0"
                        value={student.max_shifts}
                        onChange={(e) => {
                          const newLimits = studentLimits.map(s => s.id === student.id ? { ...s, max_shifts: Number(e.target.value) } : s);
                          setStudentLimits(newLimits);
                        }}
                        onBlur={(e) => handleUpdateStudentLimit(student.id, Number(e.target.value))}
                        className="w-16 px-2.5 py-1 text-center font-extrabold border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-xs text-[#0066cc] dark:text-blue-400 outline-none focus:ring-2 focus:ring-blue-500"
                        title="Thay đổi sẽ tự động lưu"
                      />
                    </div>
                  </div>
                  
                  {regs.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đã đăng ký ({regs.length}/{student.max_shifts} ca)</p>
                        <button 
                          onClick={() => handleResetRegistration(student.id, student.full_name)}
                          className="text-xs flex items-center gap-1 text-rose-600 font-semibold bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full transition"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Reset lịch
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {regs.map(reg => {
                          const dayLabel = DAYS.find(d => d.value === reg.day_of_week)?.label;
                          const startTime = reg.shift?.start_time ? reg.shift.start_time.substring(0, 5) : "";
                          const endTime = reg.shift?.end_time ? reg.shift.end_time.substring(0, 5) : "";
                          return (
                            <div key={reg.registration_id} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1d1d1f] border border-slate-200/80 dark:border-white/10 shadow-2xs gap-2">
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
                                <span>{startTime} – {endTime}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Chưa đăng ký ca nào.</p>
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
