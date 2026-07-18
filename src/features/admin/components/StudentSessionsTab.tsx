import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { formatVietnamTime } from "@/utils/date";
import { getSessionDurationSeconds } from "@/lib/sessionTime";
import { useToast } from "@/components/ui/Toast";
import { StudentWorkReviewPanel } from "./StudentWorkReviewPanel";
import { 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  User, 
  Eye, 
  Search,
  Zap,
  X,
  Trophy,
  FileText,
  Download
} from "lucide-react";

export function StudentSessionsTab({ assignmentId }: { assignmentId: string }) {
  const { addToast } = useToast();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ["student-sessions", assignmentId],
    queryFn: async () => {
      const res = await fetch(`/api/student-sessions?assignmentId=${assignmentId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.sessions || [];
    },
    staleTime: 0, // Data luôn được coi là stale, refetch ngay lập tức
  });

  const { data: detailData, isLoading: detailLoading, refetch: refetchDetail } = useQuery({
    queryKey: ["session-detail", selectedSessionId],
    queryFn: async () => {
      if (!selectedSessionId) return null;
      const session = sessions.find((s: any) => s.id === selectedSessionId);
      if (!session) return null;

      if (session.submissions?.id) {
        const res = await fetch(`/api/admin/submissions/${session.submissions.id}/detail`, { cache: 'no-store' });
        if (!res.ok) throw new Error("Failed to fetch submission detail");
        return res.json();
      } else {
        const res = await fetch(`/api/admin/sessions/${session.id}/detail`, { cache: 'no-store' });
        if (!res.ok) throw new Error("Failed to fetch session detail");
        return res.json();
      }
    },
    enabled: !!selectedSessionId,
    staleTime: 0, // Data luôn được coi là stale
  });

  // Đăng ký nhận thông báo thay đổi thời gian thực từ Supabase Realtime
  useEffect(() => {
    if (!assignmentId) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel(`student-sessions-admin-${assignmentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_sessions",
          filter: `assignment_id=eq.${assignmentId}`,
        },
        (payload) => {
          console.log("Realtime update received on student_sessions:", payload);
          refetch();
          refetchDetail();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [assignmentId, refetch, refetchDetail]);

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Xóa phiên làm bài này? Toàn bộ quá trình của học sinh sẽ bị mất.")) return;
    try {
      const res = await fetch(`/api/student-sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa thất bại");
      addToast({ title: "Xóa thành công", variant: "success" });
      setSelectedSessionId(null);
      refetch();
    } catch {
      addToast({ title: "Không thể xóa phiên làm bài", variant: "error" });
    }
  };

  // Filter and sort sessions
  const filteredSessions = sessions
    .filter((s: any) => s.student_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a: any, b: any) => {
      // Priority 1: Active sessions (not submitted and not exited)
      const aActive = !a.submissions?.id && a.status !== "exited";
      const bActive = !b.submissions?.id && b.status !== "exited";
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      // Priority 2: Exited sessions (not submitted but exited)
      const aExited = !a.submissions?.id && a.status === "exited";
      const bExited = !b.submissions?.id && b.status === "exited";
      if (aExited && !bExited) return -1;
      if (!aExited && bExited) return 1;

      // Priority 3: Sort by started_at desc
      return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
    });

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  // Main sessions list view
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Section - Glassmorphism */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 sm:p-6">
        <div className="relative flex flex-col gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">
                Danh sách học sinh
              </h2>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shadow-md ${
                sessions.length > 0 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/30'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {sessions.length} {sessions.length === 1 ? 'học sinh' : 'học sinh'}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur animate-pulse" />
                <RefreshCw className="relative h-3.5 w-3.5 animate-spin" />
              </div>
              <span className="font-medium">Tự động đồng bộ mỗi 2 giây</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-1 max-w-md items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm học sinh..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-[#1d1d1f]/50 border border-slate-200 dark:border-white/10 rounded-full text-[14px] text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-[#1d1d1f] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] dark:focus:border-blue-500 transition-all outline-none"
                  aria-label="Tìm kiếm học sinh"
                />
              </div>
              <button
                onClick={() => window.open(`/api/admin/assignments/${assignmentId}/export`, '_blank')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-semibold rounded-full border border-emerald-200 dark:border-emerald-800/30 transition-colors flex-shrink-0 text-[14px]"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Xuất bảng điểm</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-10">
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-4">
              <RefreshCw className="relative h-10 w-10 text-[#0066cc] animate-spin" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium text-[15px]">Đang tải danh sách...</p>
          </div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-transparent to-slate-50/50 pointer-events-none" />
          
          <div className="relative text-center">
            {searchTerm ? (
              <>
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 bg-slate-300/20 rounded-full blur-xl" />
                  <AlertCircle className="relative h-12 w-12 text-slate-300 mx-auto" />
                </div>
                <p className="text-base font-bold text-slate-700 mb-1.5">Không tìm thấy học sinh</p>
                <p className="text-xs text-slate-500">Thử tìm kiếm với từ khóa khác</p>
              </>
            ) : (
              <>
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 bg-indigo-300/20 rounded-full blur-xl" />
                  <User className="relative h-12 w-12 text-slate-300 mx-auto" />
                </div>
                <p className="text-base font-bold text-slate-700 mb-1.5">Chưa có học sinh nào</p>
                <p className="text-xs text-slate-500">Khi học sinh truy cập bài tập, danh sách sẽ hiển thị tại đây.</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {paginatedSessions.map((s: any) => {
            const isSubmitted = !!s.submissions?.id;
            const duration = s.submissions?.id 
              ? Math.round((s.submissions.duration_seconds || s.submissions.durationSeconds || 0) / 60)
              : Math.round(getSessionDurationSeconds(s) / 60);

            // Score color based on value
            const score = s.submissions?.score ?? 0;
            let scoreColorClass = "from-slate-500 to-slate-600";
            if (score >= 8) scoreColorClass = "from-emerald-500 to-teal-600";
            else if (score >= 6) scoreColorClass = "from-blue-500 to-cyan-600";
            else if (score >= 4) scoreColorClass = "from-amber-500 to-orange-600";
            else scoreColorClass = "from-rose-500 to-red-600";

            const questionsAnswered = s.draft_answers
              ? Object.keys(s.draft_answers || {}).filter(k => k !== "__sessionMeta").length
              : 0;

            const cardBorderClass = isSubmitted 
              ? 'border-slate-200/50 dark:border-white/5 shadow-indigo-200/10' 
              : s.status === "exited"
              ? 'border-rose-200/50 dark:border-rose-800/30 shadow-rose-200/10'
              : 'border-amber-200/50 dark:border-amber-800/30 shadow-amber-200/10';

            const cardBgHoverClass = isSubmitted
              ? 'hover:shadow-indigo-200/30 dark:hover:shadow-indigo-900/20'
              : s.status === "exited"
              ? 'hover:shadow-rose-200/30 dark:hover:shadow-rose-900/20'
              : 'hover:shadow-amber-200/30 dark:hover:shadow-amber-900/20';

            return (
              <div 
                key={s.id} 
                className={`group relative overflow-hidden rounded-2xl border p-4 text-sm transition-all duration-300 bg-white/60 dark:bg-[#1d1d1f]/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-[#1d1d1f]/80 hover:shadow-lg ${cardBorderClass} ${cardBgHoverClass} cursor-pointer`}
                onClick={() => setSelectedSessionId(s.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative group/avatar flex-shrink-0">
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-[17px] font-bold text-slate-900 dark:text-white truncate tracking-[-0.01em] group-hover:text-[#0066cc] dark:group-hover:text-blue-400 transition-colors">
                            {s.student_name}
                          </h3>
                          {isSubmitted ? (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/20 backdrop-blur-sm text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              Đã nộp
                            </span>
                          ) : s.status === "exited" ? (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-100/60 dark:bg-rose-900/20 backdrop-blur-sm text-xs font-semibold text-rose-700 dark:text-rose-400">
                              Đã thoát
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-100/60 dark:bg-amber-900/20 backdrop-blur-sm text-xs font-semibold text-amber-700 dark:text-amber-400 animate-pulse">
                              Đang làm
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 mt-1.5">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {duration} phút
                          </span>
                          <span>•</span>
                          <span>Bắt đầu: {formatVietnamTime(new Date(s.started_at))}</span>
                          <span>•</span>
                          <span>Cập nhật: {formatVietnamTime(new Date(s.last_activity_at))}</span>
                          {s.exit_count > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-rose-600 dark:text-rose-400 font-medium">Thoát: {s.exit_count} lần</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 flex items-center gap-2">
                        {isSubmitted ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r shadow-md backdrop-blur-sm border border-white/50 dark:border-white/5 bg-slate-50 dark:bg-slate-800">
                            <div className={`inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${scoreColorClass}`}>
                              <Trophy className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className={`font-bold text-lg bg-gradient-to-r ${scoreColorClass} bg-clip-text text-transparent`}>
                              {parseFloat(Number(score).toFixed(2)).toString().replace(".", ",")}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-900/20 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/30">
                            <FileText className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                            <span className="font-bold text-amber-900 dark:text-amber-200">{questionsAnswered} câu</span>
                          </div>
                        )}
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-[#0066cc]/10 dark:group-hover:bg-blue-900/30 group-hover:text-[#0066cc] dark:group-hover:text-blue-400 transition-all">
                          <Eye className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            &larr;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={clsx(
                "h-10 w-10 rounded-full text-[15px] font-semibold transition-all duration-300",
                currentPage === page
                  ? "bg-[#0066cc] text-white shadow-lg shadow-blue-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            &rarr;
          </button>
        </div>
      )}
      {/* Detail Modal - Glassmorphic */}
      {selectedSessionId && (() => {
        const session = sessions.find((s: any) => s.id === selectedSessionId);
        if (!session) return null;
        const isSubmitted = !!session.submissions?.id;
        return (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white dark:bg-[#1d1d1f] rounded-3xl shadow-2xl border border-black/5 dark:border-white/10 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
              {detailLoading ? (
                <div className="p-12 text-center flex-1 flex items-center justify-center">
                  <div className="space-y-4">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30">
                      <div className="h-8 w-8 border-3 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Đang tải chi tiết...</p>
                  </div>
                </div>
              ) : detailData ? (
                <>
                  {/* Sticky Header */}
                  <div className="sticky top-0 bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-xl border-b border-black/5 dark:border-white/5 p-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl blur opacity-30" />
                        <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg ${
                          isSubmitted 
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30' 
                            : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30'
                        }`}>
                          {isSubmitted ? (
                            <CheckCircle2 className="h-6 w-6 text-white" />
                          ) : (
                            <Clock className="h-6 w-6 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                          {isSubmitted ? 'Bài đã nộp' : 'Bài đang làm'}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          {session.student_name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSessionId(null)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-black/20">
                    <StudentWorkReviewPanel
                      questions={detailData.questions || []}
                      startedAt={session.started_at}
                      isSubmitted={isSubmitted}
                      isPaused={session.status === "exited"}
                      pausedAt={session.last_activity_at}
                      submissionId={session.submissions?.id}
                      submissionScore={session.submissions?.score}
                      submissionDurationSeconds={detailData?.submission?.durationSeconds}
                      durationSeconds={detailData?.submission?.durationSeconds ?? detailData?.session?.durationSeconds ?? getSessionDurationSeconds(session)}
                      answeredCountOverride={
                        detailData?.draft_answers
                          ? Object.keys(detailData.draft_answers).filter(k => k !== "__sessionMeta").length
                          : undefined
                      }
                      exitCount={session.exit_count || 0}
                      onRefresh={async () => {
                        await Promise.all([refetchDetail(), refetch()]);
                      }}
                      notify={(message, type) => {
                        addToast({ title: message, variant: type });
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="p-12 text-center flex-1 flex items-center justify-center">
                  <div className="space-y-4">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-rose-100">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="text-red-600 font-semibold">Không thể tải dữ liệu</p>
                    <p className="text-sm text-slate-600">Vui lòng thử lại sau</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
