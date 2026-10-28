"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { X, Zap, Clock, Users, Target, Shuffle, Eye, BookOpen } from "lucide-react";
import Toast from "@/components/Toast";

const SUBJECT_OPTIONS = ["Toán học", "Vật lý", "Hóa học", "Ngữ văn", "Tiếng Anh", "Lịch sử", "Địa lý", "Sinh học", "Tin học", "GDCD"];
const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => `Lớp ${i + 1}`);
const CUSTOM_VALUE = "custom";

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateQuizModal({ isOpen, onClose }: CreateQuizModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [subjectSelect, setSubjectSelect] = useState(SUBJECT_OPTIONS[0]);
  const [subjectCustom, setSubjectCustom] = useState("");
  const [gradeSelect, setGradeSelect] = useState(GRADE_OPTIONS[9]); // Lớp 10 default
  const [gradeCustom, setGradeCustom] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [totalScore, setTotalScore] = useState("10");

  // Quiz config
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [instantFeedback, setInstantFeedback] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState("2");

  // Assignment
  const [students, setStudents] = useState<Array<{ id: string; full_name: string }>>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoadingStudents(true);
      fetch("/api/admin/students")
        .then(r => r.json())
        .then(d => {
          if (d.students) {
            setStudents(d.students);
            setAssignedIds(d.students.map((s: any) => s.id));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingStudents(false));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subject = subjectSelect === CUSTOM_VALUE ? subjectCustom.trim() : subjectSelect;
    const grade = gradeSelect === CUSTOM_VALUE ? gradeCustom.trim() : gradeSelect;

    if (!title.trim() || !subject || !grade) {
      setToast({ message: "Vui lòng điền đầy đủ thông tin bắt buộc.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      let dueAtISO: string | undefined;
      if (dueAt) {
        const localDate = new Date(dueAt);
        const offsetDiff = 7 * 60 + localDate.getTimezoneOffset();
        dueAtISO = new Date(localDate.getTime() - offsetDiff * 60 * 1000).toISOString();
      }

      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject,
          grade,
          dueAt: dueAtISO,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          totalScore: parseFloat(totalScore) || 10,
          hideScore: false,
          assignedIds,
          type: "QUIZ",
          quizConfig: {
            shuffleQuestions,
            shuffleOptions,
            instantFeedback,
            autoAdvance,
            autoAdvanceSeconds: autoAdvance ? parseInt(autoAdvanceSeconds) || 2 : undefined,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Keep loading=true so button displays loading spinner until navigation finishes
        router.push(`/admin/assignments/${data.id}`);
      } else {
        const err = await res.json().catch(() => ({}));
        setToast({ message: err.error || "Lỗi tạo Quiz", type: "error" });
        setLoading(false);
      }
    } catch (err: any) {
      setToast({ message: err.message || "Lỗi không xác định", type: "error" });
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tạo Quiz mới"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-2xl max-h-screen sm:max-h-[92vh] flex flex-col rounded-none sm:rounded-[2rem] bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl border-0 sm:border border-white/80 dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-black/5 dark:border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">Tạo Quiz mới</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Chế độ luyện kiểu Quizlet / Kahoot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/8 hover:bg-black/10 dark:hover:bg-white/15 text-slate-500 dark:text-slate-400 transition-all active:scale-95 disabled:opacity-40"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form id="create-quiz-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">

          {/* Thông tin cơ bản */}
          <div className="rounded-[1.5rem] border border-black/5 dark:border-white/8 bg-slate-50/80 dark:bg-white/3 p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <BookOpen className="h-4 w-4 text-[#0066cc]" />
              Thông tin cơ bản
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Tên Quiz <span className="text-red-500">*</span>
              </label>
              <input
                id="quiz-title"
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="VD: Trắc nghiệm Toán 10 - Chương 1"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              />
            </div>

            {/* Subject & Grade */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Môn học <span className="text-red-500">*</span></label>
                <select
                  value={subjectSelect}
                  onChange={e => setSubjectSelect(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                >
                  {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value={CUSTOM_VALUE}>Khác...</option>
                </select>
                {subjectSelect === CUSTOM_VALUE && (
                  <input
                    value={subjectCustom}
                    onChange={e => setSubjectCustom(e.target.value)}
                    placeholder="Nhập môn học"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Khối lớp <span className="text-red-500">*</span></label>
                <select
                  value={gradeSelect}
                  onChange={e => setGradeSelect(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                >
                  {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  <option value={CUSTOM_VALUE}>Khác...</option>
                </select>
                {gradeSelect === CUSTOM_VALUE && (
                  <input
                    value={gradeCustom}
                    onChange={e => setGradeCustom(e.target.value)}
                    placeholder="Nhập khối lớp"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                )}
              </div>
            </div>

            {/* Duration, Score, Due */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Thời gian (phút)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(e.target.value)}
                  placeholder="Không giới hạn"
                  className="w-full px-3 py-3 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Tổng điểm
                </label>
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  value={totalScore}
                  onChange={e => setTotalScore(e.target.value)}
                  placeholder="10"
                  className="w-full px-3 py-3 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Hạn nộp</label>
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={e => setDueAt(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Quiz Config */}
          <div className="rounded-[1.5rem] border border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-purple-700 dark:text-purple-300">
              <Zap className="h-4 w-4" />
              Cấu hình Quiz
            </div>

            <div className="space-y-2.5">
              {[
                { id: "shuffle-q", label: "Xáo trộn thứ tự câu hỏi", desc: "Mỗi lần làm bài, câu hỏi xuất hiện theo thứ tự ngẫu nhiên", icon: Shuffle, value: shuffleQuestions, setter: setShuffleQuestions },
                { id: "shuffle-o", label: "Xáo trộn thứ tự đáp án", desc: "A, B, C, D xuất hiện theo thứ tự ngẫu nhiên mỗi lần làm", icon: Shuffle, value: shuffleOptions, setter: setShuffleOptions },
                { id: "instant-fb", label: "Hiện đáp án ngay sau khi chọn", desc: "Học sinh thấy ngay đáp án đúng/sai sau mỗi câu", icon: Eye, value: instantFeedback, setter: setInstantFeedback },
              ].map(cfg => (
                <label
                  key={cfg.id}
                  htmlFor={cfg.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/70 dark:bg-[#18181b]/60 border border-slate-200/50 dark:border-white/8 cursor-pointer hover:border-purple-400/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all group"
                >
                  <div className="flex items-center pt-0.5">
                    <input
                      type="checkbox"
                      id={cfg.id}
                      checked={cfg.value}
                      onChange={e => cfg.setter(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <cfg.icon className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{cfg.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cfg.desc}</p>
                  </div>
                </label>
              ))}

              {/* Auto-advance */}
              <label
                htmlFor="auto-advance"
                className="flex items-start gap-3 p-3 rounded-xl bg-white/70 dark:bg-[#18181b]/60 border border-slate-200/50 dark:border-white/8 cursor-pointer hover:border-purple-400/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all"
              >
                <div className="flex items-center pt-0.5">
                  <input
                    type="checkbox"
                    id="auto-advance"
                    checked={autoAdvance}
                    onChange={e => setAutoAdvance(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tự động chuyển câu</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tự động chuyển sang câu tiếp sau khoảng thời gian</p>
                  {autoAdvance && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={autoAdvanceSeconds}
                        onChange={e => setAutoAdvanceSeconds(e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-center"
                        onClick={e => e.stopPropagation()}
                      />
                      <span className="text-xs text-slate-500">giây</span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Students */}
          <div className="rounded-[1.5rem] border border-black/5 dark:border-white/8 bg-slate-50/80 dark:bg-white/3 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                <Users className="h-4 w-4 text-[#0066cc]" />
                Giao bài cho học sinh
              </div>
              {students.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignedIds(students.map(s => s.id))}
                    className="text-xs text-[#0066cc] dark:text-blue-400 hover:underline font-semibold"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => setAssignedIds([])}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:underline font-semibold"
                  >
                    Bỏ chọn
                  </button>
                </div>
              )}
            </div>
            {loadingStudents ? (
              <div className="text-xs text-slate-400 text-center py-4">Đang tải danh sách học sinh...</div>
            ) : students.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Chưa có học sinh nào trong hệ thống</div>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-1.5 scrollbar-hide">
                {students.map(s => (
                  <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/70 dark:bg-[#18181b]/60 border border-slate-200/50 dark:border-white/8 cursor-pointer hover:border-[#0066cc]/30 transition-all">
                    <input
                      type="checkbox"
                      checked={assignedIds.includes(s.id)}
                      onChange={e => {
                        if (e.target.checked) setAssignedIds(prev => [...prev, s.id]);
                        else setAssignedIds(prev => prev.filter(id => id !== s.id));
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-[#0066cc] focus:ring-[#0066cc] cursor-pointer"
                    />
                    <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">{s.full_name}</span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đã chọn {assignedIds.length}/{students.length} học sinh
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-black/5 dark:border-white/8 flex-shrink-0 bg-white/50 dark:bg-[#18181b]/50">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-xs font-semibold border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/8 active:scale-95 transition-all disabled:opacity-40"
          >
            Hủy
          </Button>
          <button
            type="submit"
            form="create-quiz-form"
            disabled={loading || !title.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2.5 text-xs font-bold shadow-lg shadow-purple-500/25 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            {loading ? "Đang tạo Quiz..." : "Tạo Quiz"}
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );

  return createPortal(modal, document.body);
}
