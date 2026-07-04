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
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-900 shadow-sm outline-none transition focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-blue-400";

const compactFieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-center text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 dark:border-white/10 dark:bg-white/5 dark:text-white";

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

function formatDuration(minutes: number | string | null) {
  const value = Number(minutes || 0);
  if (!value) return "Không giới hạn";
  if (value < 60) return `${value} phút`;
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return mins ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  tone: "blue" | "emerald" | "amber" | "slate";
}) {
  const tones = {
    blue: "bg-blue-50 text-[#0066cc] ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
    amber: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
    slate: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10",
  };

  return (
    <Card variant="glass" className="rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1.5 text-[19px] font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
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
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10">
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[14px] font-bold text-slate-900 dark:text-white">{title}</span>
          <span className="mt-0.5 block text-[12px] leading-4 text-slate-500 dark:text-slate-400">{description}</span>
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
    <Badge variant="warning" size="lg">
      <EyeOff className="h-3.5 w-3.5" />
      Đang ẩn
    </Badge>
  ) : (
    <Badge variant="success" size="lg">
      <Eye className="h-3.5 w-3.5" />
      Đang mở
    </Badge>
  );

  const dueAtLabel = editForm.due_at ? formatVietnamTime(new Date(editForm.due_at)) || "Chưa đặt hạn" : "Chưa đặt hạn";
  const averageScore = Number(analytics?.averageScore || 0);
  const maxScore = Number(analytics?.maxScore || 0);
  const averageDuration = Math.round(Number(analytics?.averageDuration || 0) / 60) || 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={handleSave} className="min-w-0">
          <Card variant="glass" className="overflow-hidden rounded-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-200/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 dark:border-white/10">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[18px] font-black tracking-tight text-slate-900 dark:text-white">Tổng quan & cài đặt</h2>
                  {statusBadge}
                </div>
                <p className="mt-1 text-[13px] leading-5 text-slate-500 dark:text-slate-400">
                  Điều chỉnh thông tin hiển thị, thời gian làm bài và cách tính điểm.
                </p>
              </div>
            </div>

            <div className="space-y-6 p-4 sm:p-5">
              <section>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0066cc] ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-slate-900 dark:text-white">Thông tin bài tập</h3>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">Tên, môn học và lớp áp dụng.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Tên bài tập</label>
                    <input
                      type="text"
                      value={editForm.title || ""}
                      onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                      className={fieldClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Môn học</label>
                    <input
                      type="text"
                      value={editForm.subject || ""}
                      onChange={(event) => setEditForm({ ...editForm, subject: event.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Lớp</label>
                    <input
                      type="text"
                      value={editForm.grade || ""}
                      onChange={(event) => setEditForm({ ...editForm, grade: event.target.value })}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-200/70 pt-6 dark:border-white/10">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-slate-900 dark:text-white">Thời gian & điểm</h3>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">Thiết lập hạn nộp, thời lượng và thang điểm.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <div>
                    <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Hạn nộp</label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(editForm.due_at)}
                      onChange={(event) => setEditForm({ ...editForm, due_at: event.target.value || null })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Thời gian làm bài</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={editForm.duration_minutes || ""}
                        onChange={(event) => setEditForm({ ...editForm, duration_minutes: event.target.value })}
                        className={`${fieldClass} pr-16`}
                      />
                      <span className="pointer-events-none absolute right-3.5 top-[1rem] text-[12px] font-semibold text-slate-400">phút</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Tổng điểm</label>
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

              <section className="border-t border-slate-200/70 pt-6 dark:border-white/10">

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <SettingToggle
                    checked={Boolean(editForm.is_hidden)}
                    onChange={(checked) => setEditForm({ ...editForm, is_hidden: checked })}
                    icon={EyeOff}
                    title="Ẩn bài tập"
                    description="Học sinh sẽ không thấy bài này trong danh sách."
                  />
                  <SettingToggle
                    checked={Boolean(editForm.hide_score)}
                    onChange={(checked) => setEditForm({ ...editForm, hide_score: checked })}
                    icon={Trophy}
                    title="Ẩn điểm sau khi nộp"
                    description="Kết quả vẫn được lưu để giáo viên xem trong admin."
                  />
                </div>
              </section>

              <section className="border-t border-slate-200/70 pt-6 dark:border-white/10">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-black text-slate-900 dark:text-white">Chia điểm theo nhóm câu</h3>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400">Để trống nếu muốn hệ thống chia đều tổng điểm.</p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addPointRange}>
                    <Plus className="h-4 w-4" />
                    Thêm nhóm
                  </Button>
                </div>

                {editForm.point_ranges.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-center dark:border-white/15 dark:bg-white/[0.03]">
                    <Target className="mx-auto h-5 w-5 text-slate-400" />
                    <p className="mt-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300">Đang chia đều theo tổng điểm</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                    <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-2 bg-slate-50 px-3 py-2.5 text-[11px] font-black uppercase text-slate-500 dark:bg-white/[0.03] dark:text-slate-400 sm:grid">
                      <span>Từ câu</span>
                      <span>Đến câu</span>
                      <span>Tổng điểm</span>
                      <span className="text-right">Xóa</span>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-white/10">
                      {editForm.point_ranges.map((range, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 px-3 py-3">
                          <label className="sr-only">Từ câu</label>
                          <input
                            type="number"
                            min={1}
                            value={range.fromQuestion}
                            onChange={(event) => updatePointRange(idx, "fromQuestion", event.target.value === "" ? "" : parseInt(event.target.value, 10))}
                            className={compactFieldClass}
                          />
                          <label className="sr-only">Đến câu</label>
                          <input
                            type="number"
                            min={1}
                            value={range.toQuestion}
                            onChange={(event) => updatePointRange(idx, "toQuestion", event.target.value === "" ? "" : parseInt(event.target.value, 10))}
                            className={compactFieldClass}
                          />
                          <label className="sr-only">Tổng điểm</label>
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={range.totalPoints}
                            onChange={(event) => updatePointRange(idx, "totalPoints", event.target.value === "" ? "" : parseFloat(event.target.value))}
                            className={compactFieldClass}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removePointRange(idx)} className="justify-self-end text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200/70 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4" />
                  Xóa bài
                </Button>
                <Button type="submit" variant="brand" size="sm" loading={loading} disabled={loading} className="w-full sm:w-auto">
                  <Save className="h-4 w-4" />
                  {loading ? "Đang lưu" : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          </Card>
        </form>

        <aside className="space-y-4">
          <Card variant="glass" className="overflow-hidden rounded-2xl">
            <div className="border-b border-slate-200/70 p-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0066cc] ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[15px] font-black text-slate-900 dark:text-white">Thống kê chung</h2>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400">Dữ liệu nộp bài hiện tại.</p>
                </div>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="space-y-2.5 p-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10" />
                ))}
              </div>
            ) : analytics ? (
              <div className="divide-y divide-slate-200/70 dark:divide-white/10">
                {[
                  { label: "Lượt nộp", value: analytics.submissionCount || 0, icon: GraduationCap },
                  { label: "Điểm trung bình", value: averageScore.toFixed(2), icon: Target },
                  { label: "Điểm cao nhất", value: maxScore.toFixed(2), icon: Trophy },
                  { label: "Thời gian TB", value: `${averageDuration} phút`, icon: Clock3 },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{item.label}</span>
                      </div>
                      <span className="text-[15px] font-black text-slate-900 dark:text-white">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-[13px] text-slate-500 dark:text-slate-400">Chưa có dữ liệu thống kê</div>
            )}
          </Card>

        </aside>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
