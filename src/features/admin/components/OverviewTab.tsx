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
  Trash2,
  Trophy,
} from "lucide-react";

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
};

const fieldClass =
  "mt-1.5 w-full rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-900 shadow-xs outline-none transition focus:border-[#0066cc] focus:bg-white focus:ring-4 focus:ring-[#0066cc]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-blue-400 dark:focus:bg-[#18181b]";

const compactFieldClass =
  "w-full rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-center text-xs font-bold text-slate-900 outline-none transition focus:border-[#0066cc] focus:bg-white focus:ring-4 focus:ring-[#0066cc]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white";

function normalizeInitialData(initialData: any): EditForm {
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

export function OverviewTab({ assignmentId, initialData }: { assignmentId: string; initialData: any }) {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(() => normalizeInitialData(initialData));
  const [loading, setLoading] = useState(false);

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
