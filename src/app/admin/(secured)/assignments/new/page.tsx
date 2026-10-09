"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, BookOpen, Clock, Settings2, Target, EyeOff, LayoutTemplate, Users } from "lucide-react";

const SUBJECT_OPTIONS = ["Toán học", "Vật lý", "Hóa học", "Ngữ văn", "Tiếng Anh", "Lịch sử", "Địa lý", "Sinh học", "Tin học", "GDCD"];
const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => `Lớp ${i + 1}`);
const CUSTOM_VALUE = "custom";

export default function NewAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorObj, setErrorObj] = useState<{ message: string; type: string } | null>(null);

  const [subjectSelect, setSubjectSelect] = useState<string>(SUBJECT_OPTIONS[0]);
  const [subjectCustom, setSubjectCustom] = useState("");
  const [gradeSelect, setGradeSelect] = useState<string>(GRADE_OPTIONS[0]);
  const [gradeCustom, setGradeCustom] = useState("");
  const [hideScore, setHideScore] = useState(false);

  const [students, setStudents] = useState<Array<{id: string; full_name: string}>>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    fetch("/api/admin/students")
      .then(res => res.json())
      .then(data => {
        if (data.students) {
          setStudents(data.students);
          setAssignedIds(data.students.map((s: any) => s.id)); // Default assign to all
        }
        setLoadingStudents(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingStudents(false);
      });
  }, []);

  const resolveSubjectAndGrade = () => {
    const resolvedSubject = subjectSelect === CUSTOM_VALUE ? subjectCustom.trim() : subjectSelect;
    const resolvedGrade = gradeSelect === CUSTOM_VALUE ? gradeCustom.trim() : gradeSelect;
    if (!resolvedSubject || !resolvedGrade) return null;
    return { resolvedSubject, resolvedGrade };
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorObj(null);

    const resolved = resolveSubjectAndGrade();
    if (!resolved) {
      setLoading(false);
      setErrorObj({ message: "Vui lòng chọn hoặc nhập môn học và lớp hợp lệ.", type: "error" });
      return;
    }
    const { resolvedSubject, resolvedGrade } = resolved;

    const formData = new FormData(e.currentTarget);
    
    // Convert datetime-local to Vietnam timezone (UTC+7)
    let dueAtISO = null;
    const dueAtInput = formData.get("dueAt") as string;
    if (dueAtInput) {
      const localDate = new Date(dueAtInput);
      const vietnamOffset = 7 * 60; // UTC+7 in minutes
      const localOffset = localDate.getTimezoneOffset(); // local offset from UTC
      const offsetDiff = vietnamOffset + localOffset;
      const adjustedDate = new Date(localDate.getTime() - offsetDiff * 60 * 1000);
      dueAtISO = adjustedDate.toISOString();
    }
    
    const data = {
      title: formData.get("title") as string,
      subject: resolvedSubject,
      grade: resolvedGrade,
      dueAt: dueAtISO,
      durationMinutes: parseInt(formData.get("durationMinutes") as string) || undefined,
      totalScore: parseFloat(formData.get("totalScore") as string) || 10,
      hideScore,
      assignedIds,
    };

    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        router.push(`/admin/assignments/${result.id}`);
      } else {
        const text = await res.text();
        try {
          const errorData = JSON.parse(text);
          setErrorObj({ message: errorData.error || text, type: "error" });
        } catch {
          setErrorObj({ message: text, type: "error" });
        }
      }
    } catch (err: any) {
      setErrorObj({ message: err.message || "Unknown error", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 md:space-y-8 animate-fade-in pb-24">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-6 sm:p-8 md:p-10">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-72 h-72 bg-gradient-to-br from-blue-400/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <Link href="/admin/assignments">
              <Button variant="ghost" size="sm" className="mb-2 -ml-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 text-xs font-semibold active:scale-95 transition-all">
                 <ArrowLeft className="h-4 w-4 mr-1.5" />
                 Quay lại danh sách
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
              Tạo bài tập mới
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Cấu hình thông tin cơ bản trước khi biên soạn ngân hàng câu hỏi và barem chấm điểm chi tiết.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorObj && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <EyeOff className="h-4 w-4 shrink-0" />
            <span>{errorObj.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin cơ bản */}
            <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-6 sm:p-8">
              <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-[#0066cc] dark:text-blue-400 flex items-center justify-center font-bold">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h2 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-white tracking-[-0.01em]">
                  Thông tin cơ bản
                </h2>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Tên bài tập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white transition focus:border-[#0066cc] focus:bg-white dark:focus:bg-[#18181b] focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                    placeholder="VD: Kiểm tra Toán - Hàm số bậc nhất 15 phút"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      Môn học <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col gap-2">
                      <select
                        name="subjectSelect"
                        value={subjectSelect}
                        onChange={(e) => setSubjectSelect(e.target.value)}
                        className="w-full bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl border border-slate-200/80 dark:border-white/10 px-4 py-3 text-xs sm:text-sm font-medium transition focus:border-[#0066cc] focus:bg-white dark:focus:bg-[#18181b] focus:outline-none focus:ring-4 focus:ring-blue-500/15 cursor-pointer"
                        required
                      >
                        {SUBJECT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        <option value={CUSTOM_VALUE}>Khác</option>
                      </select>
                      {subjectSelect === CUSTOM_VALUE && (
                        <input
                          type="text"
                          name="subjectCustom"
                          value={subjectCustom}
                          onChange={(e) => setSubjectCustom(e.target.value)}
                          required
                          className="w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white transition focus:border-[#0066cc] focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                          placeholder="Nhập môn khác"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      Phân loại Lớp <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col gap-2">
                      <select
                        name="gradeSelect"
                        value={gradeSelect}
                        onChange={(e) => setGradeSelect(e.target.value)}
                        className="w-full bg-slate-50/80 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl border border-slate-200/80 dark:border-white/10 px-4 py-3 text-xs sm:text-sm font-medium transition focus:border-[#0066cc] focus:bg-white dark:focus:bg-[#18181b] focus:outline-none focus:ring-4 focus:ring-blue-500/15 cursor-pointer"
                        required
                      >
                        {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                        <option value={CUSTOM_VALUE}>Khác</option>
                      </select>
                      {gradeSelect === CUSTOM_VALUE && (
                        <input
                          type="text"
                          name="gradeCustom"
                          value={gradeCustom}
                          onChange={(e) => setGradeCustom(e.target.value)}
                          required
                          className="w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white transition focus:border-[#0066cc] focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                          placeholder="Nhập lớp khác (vd: Lớp 10 nâng cao)"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cấu hình làm bài */}
            <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-6 sm:p-8">
              <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Settings2 className="h-5 w-5" />
                </div>
                <h2 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-white tracking-[-0.01em]">
                  Cấu hình làm bài
                </h2>
              </div>
              
              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Hạn nộp bài</label>
                  <input
                    type="datetime-local"
                    name="dueAt"
                    className="w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white transition focus:border-[#0066cc] focus:bg-white dark:focus:bg-[#18181b] focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Thời gian (phút)</label>
                  <input
                    type="number"
                    name="durationMinutes"
                    className="w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white transition focus:border-[#0066cc] focus:bg-white dark:focus:bg-[#18181b] focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                    placeholder="Không giới hạn"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Tổng điểm <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="totalScore"
                    step="0.5"
                    defaultValue="10"
                    required
                    className="w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white transition focus:border-[#0066cc] focus:bg-white dark:focus:bg-[#18181b] focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                  />
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/5">
                <label className="flex items-start sm:items-center gap-3 cursor-pointer group p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition border border-transparent hover:border-black/5 dark:hover:border-white/10">
                  <div className="mt-0.5 sm:mt-0">
                    <input
                      type="checkbox"
                      checked={hideScore}
                      onChange={(e) => setHideScore(e.target.checked)}
                      className="h-5 w-5 rounded-md border-slate-300 dark:border-white/20 text-[#0066cc] focus:ring-[#0066cc] cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block group-hover:text-[#0066cc] dark:group-hover:text-blue-400 transition-colors tracking-[-0.01em]">
                      Ẩn điểm sau khi nộp
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                      Học sinh chỉ thấy thông báo đã nhận bài (Hữu ích cho bài thi tự luận hoặc kỳ thi chính thức).
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-6 sm:p-7 h-full max-h-[650px] flex flex-col">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Users className="h-5 w-5" />
                  </div>
                  <h2 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-white tracking-[-0.01em]">
                    Giao bài
                  </h2>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setAssignedIds(assignedIds.length === students.length ? [] : students.map(s => s.id))}
                  className="text-xs h-8 px-3 text-[#0066cc] dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 rounded-full font-bold active:scale-95 transition-all"
                >
                  {assignedIds.length === students.length ? "Bỏ chọn" : "Chọn tất cả"}
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar min-h-[300px]">
                {loadingStudents ? (
                  <div className="text-xs text-slate-400 text-center py-8 animate-pulse">Đang nạp danh sách học sinh...</div>
                ) : students.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-8 bg-slate-50 dark:bg-white/5 rounded-2xl">Chưa có học sinh nào.</div>
                ) : (
                  students.map(s => (
                    <label key={s.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/10 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={assignedIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) setAssignedIds(prev => [...prev, s.id]);
                          else setAssignedIds(prev => prev.filter(id => id !== s.id));
                        }}
                        className="h-4 w-4 rounded-md border-slate-300 dark:border-white/20 text-[#0066cc] focus:ring-[#0066cc]"
                      />
                      <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{s.full_name}</span>
                    </label>
                  ))
                )}
              </div>
              <div className="pt-4 mt-2 border-t border-black/5 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 text-center shrink-0">
                Đã chọn <span className="font-extrabold text-[#0066cc] dark:text-blue-400">{assignedIds.length}</span> học sinh
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-end gap-3 p-4 border-t border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl shadow-lg md:static md:shadow-none md:border-0 md:bg-transparent md:p-0">
           <Link href="/admin/assignments">
             <Button type="button" variant="secondary" className="px-6 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-bold active:scale-95 transition-all">
               Hủy bỏ
             </Button>
           </Link>
           <Button type="submit" variant="brand" disabled={loading} className="px-8 rounded-full bg-[#0066cc] hover:bg-[#005bb5] shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 text-xs font-semibold active:scale-95 transition-all duration-300 ease-spring">
             {loading ? "Đang xử lý..." : "Lưu & Biên soạn câu hỏi"}
             {!loading && <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />}
           </Button>
        </div>
      </form>
    </div>
  );
}
