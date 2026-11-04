"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useQuery } from "@tanstack/react-query";
import { formatVietnamTime } from "@/utils/date";
import Toast from "@/components/Toast";
import {
  ArrowLeftRight,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Loader2,
  BarChart3,
  CalendarClock,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  Layers3,
  Plus,
  Save,
  Sparkles,
  Target,
  Clock,
  Shuffle,
  Trash2,
  Trophy,
  Zap,
} from "lucide-react";
import { QuizConfig } from "@/lib/types";

type PointRange = {
  fromQuestion: number | "";
  toQuestion: number | "";
  totalPoints: number | "";
};

type EditForm = {
  title: string;
  subject: string;
  grade: string;
  due_at: string | null;
  duration_minutes: number | string | null;
  total_score: number | string;
  is_hidden: boolean;
  hide_score: boolean;
  point_ranges: PointRange[];
  type?: string;
  quiz_config: QuizConfig;
};

const fieldClass =
  "mt-1.5 w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-900 shadow-xs outline-none transition focus:border-[#0066cc] focus:bg-white focus:ring-4 focus:ring-[#0066cc]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-400 dark:focus:bg-[#18181b]";

const compactFieldClass =
  "w-full rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-center text-xs font-bold text-slate-900 outline-none transition focus:border-[#0066cc] focus:bg-white focus:ring-4 focus:ring-[#0066cc]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white";

function normalizeInitialData(initialData: any): EditForm {
  const quizConfig = initialData?.quiz_config ?? initialData?.quizConfig ?? {};
  return {
    title: initialData?.title || "",
    subject: initialData?.subject || "",
    grade: initialData?.grade || "",
    due_at: initialData?.due_at || initialData?.dueAt || null,
    duration_minutes: initialData?.duration_minutes ?? initialData?.durationMinutes ?? null,
    total_score: initialData?.total_score ?? initialData?.totalScore ?? 0,
    is_hidden: initialData?.is_hidden ?? initialData?.isHidden ?? false,
    hide_score: initialData?.hide_score ?? initialData?.hideScore ?? false,
    point_ranges: initialData?.point_ranges ?? initialData?.pointRanges ?? [],
    type: initialData?.type || "ASSIGNMENT",
    quiz_config: {
      shuffleQuestions: quizConfig.shuffleQuestions ?? false,
      shuffleOptions: quizConfig.shuffleOptions ?? false,
      instantFeedback: quizConfig.instantFeedback ?? true,
      autoAdvance: quizConfig.autoAdvance ?? false,
      autoAdvanceSeconds: quizConfig.autoAdvanceSeconds ?? 2,
      allowRetry: quizConfig.allowRetry ?? true,
    },
  };
}

function toDatetimeLocalValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.substring(0, 16);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().substring(0, 16);
}

function SettingToggle({
  checked,
  onChange,
  icon: Icon,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: typeof Eye;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50/40 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10">
      <span className="flex min-w-0 items-center gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-xs dark:bg-white/10 dark:text-slate-200">
          <Icon className="h-4.5 w-4.5 text-[#0066cc] dark:text-blue-400" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-slate-900 dark:text-white">{title}</span>
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span>
        </span>
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-[#0066cc] dark:bg-slate-700" />
        <span className="absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function OverviewTab({ assignmentId, initialData, initialQuestions = [] }: { assignmentId: string; initialData: any; initialQuestions?: any[] }) {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(() => normalizeInitialData(initialData));
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);

  // Fetch questions to check eligibility for converting to Quiz
  const { data: questions = initialQuestions } = useQuery({
    queryKey: ["admin-questions", assignmentId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/questions?assignmentId=${assignmentId}`);
      if (!res.ok) return initialQuestions;
      const data = await res.json();
      return data.questions || [];
    },
    initialData: initialQuestions,
  });

  const isCurrentQuiz = editForm.type === "QUIZ";
  const actualQuestions = (questions || []).filter((q: any) => q.type !== "section");
  const totalQuestionsCount = actualQuestions.length;
  const nonMcqQuestions = actualQuestions.filter((q: any) => q.type !== "mcq");
  const canConvertToQuiz = totalQuestionsCount > 0 && nonMcqQuestions.length === 0;

  const handleToggleType = async () => {
    if (isCurrentQuiz) {
      if (!confirm("Chuyển bài thi này sang dạng Bài tập thông thường?\n\nHọc sinh sẽ làm bài theo dạng hoàn thành tất cả câu rồi nộp bài mới biết kết quả.")) return;
      setConverting(true);
      try {
        const res = await fetch(`/api/admin/assignments/${assignmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "ASSIGNMENT" }),
        });
        if (!res.ok) throw new Error("Chuyển đổi thất bại");
        setEditForm(prev => ({ ...prev, type: "ASSIGNMENT" }));
        setToast({ message: "Đã chuyển sang dạng Bài tập thông thường thành công!", type: "success" });
        router.refresh();
      } catch {
        setToast({ message: "Không thể chuyển đổi dạng bài", type: "error" });
      } finally {
        setConverting(false);
      }
    } else {
      if (!canConvertToQuiz) {
        if (totalQuestionsCount === 0) {
          setToast({ message: "Bài tập chưa có câu hỏi. Vui lòng thêm câu hỏi trắc nghiệm trước khi chuyển sang Quiz.", type: "error" });
        } else {
          setToast({ message: `Không thể chuyển: Có ${nonMcqQuestions.length} câu không phải trắc nghiệm (chỉ chấp nhận câu hỏi trắc nghiệm 4 lựa chọn).`, type: "error" });
        }
        return;
      }

      if (!confirm("Chuyển bài tập này sang dạng Quiz trực tuyến?\n\nHọc sinh sẽ làm theo dạng từng câu, phản hồi trực tiếp kết quả đúng/sai theo thời gian thực.")) return;
      setConverting(true);
      try {
        const res = await fetch(`/api/admin/assignments/${assignmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "QUIZ",
            quizConfig: editForm.quiz_config || {
              shuffleQuestions: false,
              shuffleOptions: false,
              instantFeedback: true,
              autoAdvance: false,
              autoAdvanceSeconds: 2,
              allowRetry: true,
            },
          }),
        });
        if (!res.ok) throw new Error("Chuyển đổi thất bại");
        setEditForm(prev => ({ ...prev, type: "QUIZ" }));
        setToast({ message: "Đã chuyển sang dạng Quiz trực tuyến thành công!", type: "success" });
        router.refresh();
      } catch {
        setToast({ message: "Không thể chuyển đổi sang Quiz", type: "error" });
      } finally {
        setConverting(false);
      }
    }
  };


  useEffect(() => {
    if (initialData) {
      setEditForm(normalizeInitialData(initialData));
    }
  }, [initialData]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-analytics", assignmentId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/assignments/${assignmentId}/analytics`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let dueAtISO = null;
      if (editForm.due_at) {
        const localDate = new Date(editForm.due_at);
        const vietnamOffset = 7 * 60;
        const localOffset = localDate.getTimezoneOffset();
        const adjustedDate = new Date(localDate.getTime() - (vietnamOffset + localOffset) * 60 * 1000);
        dueAtISO = adjustedDate.toISOString();
      }

      const payload = {
        title: editForm.title,
        subject: editForm.subject,
        grade: editForm.grade,
        dueAt: dueAtISO,
        durationMinutes: editForm.duration_minutes ? Number(editForm.duration_minutes) : null,
        totalScore: editForm.total_score ? Number(editForm.total_score) : 10,
        isHidden: editForm.is_hidden,
        hideScore: editForm.hide_score,
        pointRanges: editForm.point_ranges.length > 0 ? editForm.point_ranges : null,
        type: editForm.type,
        quizConfig: editForm.type === "QUIZ" ? editForm.quiz_config : undefined,
      };

      const res = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");
      setToast({ message: "Cập nhật bài tập thành công", type: "success" });
      router.refresh();
    } catch (err) {
      setToast({ message: "Không thể cập nhật bài tập", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Xóa bài tập này? Hành động này sẽ xóa cả câu hỏi và các lần nộp.")) return;
    try {
      const res = await fetch(`/api/admin/assignments/${assignmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa thất bại");
      router.push("/admin/dashboard");
    } catch (err) {
      setToast({ message: "Không thể xóa bài tập", type: "error" });
    }
  };

  const addPointRange = () => {
    setEditForm((prev) => ({
      ...prev,
      point_ranges: [...prev.point_ranges, { fromQuestion: 1, toQuestion: 10, totalPoints: 5 }],
    }));
  };

  const updatePointRange = (idx: number, key: keyof PointRange, value: number | "") => {
    setEditForm((prev) => {
      const updated = [...prev.point_ranges];
      updated[idx] = { ...updated[idx], [key]: value };
      return { ...prev, point_ranges: updated };
    });
  };

  const removePointRange = (idx: number) => {
    setEditForm((prev) => ({
      ...prev,
      point_ranges: prev.point_ranges.filter((_, i) => i !== idx),
    }));
  };

  const statusBadge = editForm.is_hidden ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      <EyeOff className="h-3.5 w-3.5" />
      Đang ẩn
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
      <Eye className="h-3.5 w-3.5" />
      Đang mở
    </span>
  );

  const averageScore = Number(analytics?.averageScore || 0);
  const maxScore = Number(analytics?.maxScore || 0);
  const averageDuration = Math.round(Number(analytics?.averageDuration || 0) / 60) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={handleSave} className="min-w-0">
          <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Tổng quan & Cài đặt</h2>
                  {statusBadge}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Điều chỉnh thông tin hiển thị, thời gian làm bài và cách tính điểm.
                </p>
              </div>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <section>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-[#0066cc] dark:text-blue-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Thông tin bài tập</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tên, môn học và khối lớp áp dụng.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tên bài tập</label>
                    <input
                      type="text"
                      value={editForm.title || ""}
                      onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                      className={fieldClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Môn học</label>
                    <input
                      type="text"
                      value={editForm.subject || ""}
                      onChange={(event) => setEditForm({ ...editForm, subject: event.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Khối Lớp</label>
                    <input
                      type="text"
                      value={editForm.grade || ""}
                      onChange={(event) => setEditForm({ ...editForm, grade: event.target.value })}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-100 dark:border-white/5 pt-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Thời gian & Thang điểm</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Thiết lập hạn nộp, thời lượng và tổng điểm bài thi.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hạn nộp</label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(editForm.due_at)}
                      onChange={(event) => setEditForm({ ...editForm, due_at: event.target.value || null })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Thời gian làm bài</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={editForm.duration_minutes || ""}
                        onChange={(event) => setEditForm({ ...editForm, duration_minutes: event.target.value })}
                        className={`${fieldClass} pr-16`}
                      />
                      <span className="pointer-events-none absolute right-4 top-[1.65rem] text-xs font-bold text-slate-400">phút</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tổng điểm</label>
                    <input
                      type="number"
                      min={0}
                      step={0.25}
                      value={editForm.total_score || ""}
                      onChange={(event) => setEditForm({ ...editForm, total_score: event.target.value })}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-100 dark:border-white/5 pt-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <SettingToggle
                    checked={Boolean(editForm.is_hidden)}
                    onChange={(checked) => setEditForm({ ...editForm, is_hidden: checked })}
                    icon={EyeOff}
                    title="Ẩn bài tập"
                    description="Học sinh sẽ không nhìn thấy bài này trong danh sách."
                  />
                  <SettingToggle
                    checked={Boolean(editForm.hide_score)}
                    onChange={(checked) => setEditForm({ ...editForm, hide_score: checked })}
                    icon={Trophy}
                    title="Ẩn điểm sau khi nộp"
                    description="Kết quả nộp bài chỉ giáo viên mới có thể xem."
                  />
                </div>
              </section>

              {editForm.type === "QUIZ" ? (
                <section className="border-t border-slate-100 dark:border-white/5 pt-6">
                  <div className="rounded-[1.5rem] border border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20 p-5 sm:p-6 space-y-4">
                    <div className="flex items-center gap-2.5 text-sm font-bold text-purple-700 dark:text-purple-300">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Zap className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cấu hình Quiz</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">Thiết lập cơ chế hiển thị và tương tác khi học sinh làm Quiz</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          id: "cfg-shuffle-q",
                          label: "Xáo trộn thứ tự câu hỏi",
                          desc: "Mỗi lần làm bài, câu hỏi xuất hiện theo thứ tự ngẫu nhiên",
                          icon: Shuffle,
                          value: Boolean(editForm.quiz_config.shuffleQuestions),
                          setter: (val: boolean) =>
                            setEditForm((prev) => ({
                              ...prev,
                              quiz_config: { ...prev.quiz_config, shuffleQuestions: val },
                            })),
                        },
                        {
                          id: "cfg-shuffle-o",
                          label: "Xáo trộn thứ tự đáp án",
                          desc: "A, B, C, D xuất hiện theo thứ tự ngẫu nhiên mỗi lần làm",
                          icon: Shuffle,
                          value: Boolean(editForm.quiz_config.shuffleOptions),
                          setter: (val: boolean) =>
                            setEditForm((prev) => ({
                              ...prev,
                              quiz_config: { ...prev.quiz_config, shuffleOptions: val },
                            })),
                        },
                        {
                          id: "cfg-instant-fb",
                          label: "Hiện đáp án ngay sau khi chọn",
                          desc: "Học sinh thấy ngay đáp án đúng/sai sau mỗi câu",
                          icon: Eye,
                          value: Boolean(editForm.quiz_config.instantFeedback),
                          setter: (val: boolean) =>
                            setEditForm((prev) => ({
                              ...prev,
                              quiz_config: { ...prev.quiz_config, instantFeedback: val },
                            })),
                        },
                      ].map((cfg) => (
                        <label
                          key={cfg.id}
                          htmlFor={cfg.id}
                          className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/80 dark:bg-[#18181b]/80 border border-slate-200/60 dark:border-white/8 cursor-pointer hover:border-purple-400/40 hover:bg-white dark:hover:bg-[#18181b] transition-all group shadow-xs"
                        >
                          <div className="flex items-center pt-0.5">
                            <input
                              type="checkbox"
                              id={cfg.id}
                              checked={cfg.value}
                              onChange={(e) => cfg.setter(e.target.checked)}
                              className="h-4.5 w-4.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <cfg.icon className="h-4 w-4 text-purple-500 shrink-0" />
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{cfg.label}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{cfg.desc}</p>
                          </div>
                        </label>
                      ))}

                      {/* Auto-advance */}
                      <label
                        htmlFor="cfg-auto-advance"
                        className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/80 dark:bg-[#18181b]/80 border border-slate-200/60 dark:border-white/8 cursor-pointer hover:border-purple-400/40 hover:bg-white dark:hover:bg-[#18181b] transition-all shadow-xs"
                      >
                        <div className="flex items-center pt-0.5">
                          <input
                            type="checkbox"
                            id="cfg-auto-advance"
                            checked={Boolean(editForm.quiz_config.autoAdvance)}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                quiz_config: { ...prev.quiz_config, autoAdvance: e.target.checked },
                              }))
                            }
                            className="h-4.5 w-4.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-purple-500 shrink-0" />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Tự động chuyển câu</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            Tự động chuyển sang câu tiếp theo sau khoảng thời gian đã định
                          </p>
                          {editForm.quiz_config.autoAdvance && (
                            <div className="mt-3 flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-2 rounded-xl border border-slate-200/60 dark:border-white/10 w-fit">
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Chờ:</span>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={editForm.quiz_config.autoAdvanceSeconds ?? 2}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    quiz_config: {
                                      ...prev.quiz_config,
                                      autoAdvanceSeconds: parseInt(e.target.value, 10) || 2,
                                    },
                                  }))
                                }
                                className="w-16 px-2.5 py-1 rounded-lg bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-center"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-xs font-semibold text-slate-500">giây</span>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="border-t border-slate-100 dark:border-white/5 pt-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Chia điểm theo nhóm câu</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Mặc định hệ thống sẽ chia đều tổng điểm cho tất cả câu.</p>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addPointRange} className="rounded-full text-xs font-bold border-slate-200/80 dark:border-white/10">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Thêm nhóm câu
                    </Button>
                  </div>

                  {editForm.point_ranges.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 p-6 text-center dark:bg-white/[0.02]">
                      <Target className="mx-auto h-6 w-6 text-slate-400" />
                      <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Đang tự động chia đều theo tổng điểm</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10">
                      <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-2 bg-slate-50/80 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-white/[0.03] dark:text-slate-400 sm:grid">
                        <span>Từ câu</span>
                        <span>Đến câu</span>
                        <span>Tổng điểm nhóm</span>
                        <span className="text-right">Hành động</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {editForm.point_ranges.map((range, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-3 p-3 sm:px-4">
                            <input
                              type="number"
                              min={1}
                              value={range.fromQuestion}
                              onChange={(event) => updatePointRange(idx, "fromQuestion", event.target.value === "" ? "" : parseInt(event.target.value, 10))}
                              className={compactFieldClass}
                            />
                            <input
                              type="number"
                              min={1}
                              value={range.toQuestion}
                              onChange={(event) => updatePointRange(idx, "toQuestion", event.target.value === "" ? "" : parseInt(event.target.value, 10))}
                              className={compactFieldClass}
                            />
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={range.totalPoints}
                              onChange={(event) => updatePointRange(idx, "totalPoints", event.target.value === "" ? "" : parseFloat(event.target.value))}
                              className={compactFieldClass}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removePointRange(idx)} className="justify-self-end text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 rounded-xl h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

                            {/* Chuyển đổi định dạng Bài tập <-> Quiz */}
              <section className="border-t border-slate-100 dark:border-white/5 pt-6">
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-white/[0.02]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                        isCurrentQuiz
                          ? "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
                          : "bg-blue-500/10 text-[#0066cc] dark:bg-blue-500/20 dark:text-blue-400"
                      }`}>
                        {isCurrentQuiz ? <Zap className="h-5 w-5" /> : <ArrowLeftRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Chế độ bài làm hiện tại:{" "}
                            <span className={isCurrentQuiz ? "text-purple-600 dark:text-purple-400" : "text-[#0066cc] dark:text-blue-400"}>
                              {isCurrentQuiz ? "Quiz trực tuyến (Tương tác nhanh)" : "Bài tập thông thường (Nộp bài chấm điểm)"}
                            </span>
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                          {isCurrentQuiz
                            ? "Bài đang ở dạng Quiz (phản hồi ngay kết quả từng câu). Bạn có thể chuyển về Bài tập thông thường bất cứ lúc nào."
                            : canConvertToQuiz
                            ? "Tất cả câu hỏi trong bài đều là trắc nghiệm. Bạn có thể chuyển sang dạng Quiz trực tuyến tương tác ngay."
                            : totalQuestionsCount === 0
                            ? "Bài tập chưa có câu hỏi. Cần bổ sung câu hỏi trắc nghiệm để mở tính năng chuyển sang Quiz."
                            : `Chưa đủ điều kiện chuyển Quiz: Có ${nonMcqQuestions.length}/${totalQuestionsCount} câu là dạng khác (Tự luận / Đúng-Sai / Trả lời ngắn). Quiz chỉ hỗ trợ toàn bộ câu trắc nghiệm.`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={converting || (!isCurrentQuiz && !canConvertToQuiz)}
                        onClick={handleToggleType}
                        className={`rounded-full px-5 py-2.5 text-xs font-bold transition-all duration-300 shadow-sm active:scale-95 ${
                          isCurrentQuiz
                            ? "border-purple-300/80 bg-purple-50/80 text-purple-700 hover:bg-purple-100 hover:border-purple-400 dark:border-purple-500/30 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                            : canConvertToQuiz
                            ? "border-blue-300/80 bg-blue-50/80 text-[#0066cc] hover:bg-blue-100 hover:border-blue-400 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-900/50 shadow-blue-500/10"
                            : "opacity-40 cursor-not-allowed border-slate-200 dark:border-white/10 text-slate-400"
                        }`}
                        title={
                          !isCurrentQuiz && !canConvertToQuiz
                            ? (totalQuestionsCount === 0 ? "Chưa có câu hỏi" : "Tất cả câu hỏi phải là trắc nghiệm mới có thể chuyển sang Quiz")
                            : undefined
                        }
                      >
                        {converting ? (
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : isCurrentQuiz ? (
                          <ArrowLeftRight className="h-4 w-4 mr-1.5" />
                        ) : (
                          <Zap className="h-4 w-4 mr-1.5 text-amber-500" />
                        )}
                        <span>
                          {converting
                            ? "Đang chuyển..."
                            : isCurrentQuiz
                            ? "Chuyển sang Bài tập thông thường"
                            : "Chuyển sang dạng Quiz"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 dark:border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} className="w-full sm:w-auto rounded-full text-xs font-bold px-5">
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Xóa bài tập
                </Button>
                <Button type="submit" size="sm" disabled={loading} className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0066cc] to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white shadow-lg shadow-blue-500/25 px-7 py-2.5 text-xs font-bold">
                  <Save className="h-4 w-4 mr-1.5" />
                  {loading ? "Đang lưu thay đổi..." : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="border-b border-slate-100 dark:border-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-[#0066cc] dark:text-blue-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Thống kê nhanh</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Dữ liệu nộp bài thời gian thực.</p>
                </div>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-12 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />
                ))}
              </div>
            ) : analytics ? (
              <div className="divide-y divide-slate-100 dark:divide-white/5 p-2">
                {[
                  { label: "Lượt nộp bài", value: analytics.submissionCount || 0, icon: GraduationCap, color: "text-blue-500 bg-blue-500/10" },
                  { label: "Điểm trung bình", value: averageScore.toFixed(2).replace(".", ","), icon: Target, color: "text-emerald-500 bg-emerald-500/10" },
                  { label: "Điểm cao nhất", value: maxScore.toFixed(2).replace(".", ","), icon: Trophy, color: "text-amber-500 bg-amber-500/10" },
                  { label: "Thời gian làm TB", value: `${averageDuration} phút`, icon: Clock3, color: "text-indigo-500 bg-indigo-500/10" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.color}`}>
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">Chưa có dữ liệu thống kê</div>
            )}
          </div>
        </aside>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
