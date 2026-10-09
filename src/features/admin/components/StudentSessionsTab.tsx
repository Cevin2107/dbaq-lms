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
  Download,
  LogOut
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

  const { data: registeredStudentNames = [] } = useQuery({
    queryKey: ["registered-student-names"],
    queryFn: async () => {
      const res = await fetch("/api/admin/students");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.students || []).map((st: any) => (st.full_name as string)?.toLowerCase().trim()).filter(Boolean);
    },
    staleTime: 60 * 1000,
  });

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
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-5 sm:p-7">
        <div className="relative flex flex-col gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
                Danh sách bài nộp & Phiên làm bài
              </h2>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                sessions.length > 0 
                  ? 'bg-blue-500/10 text-[#0066cc] dark:text-blue-300 border border-blue-500/20'
                  : 'bg-slate-200/50 dark:bg-white/10 text-slate-500'
              }`}>
                {sessions.length} học sinh
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0066cc]" />
              <span className="font-medium">Tự động đồng bộ thời gian thực theo giây</span>
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
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-[#18181b] focus:ring-4 focus:ring-blue-500/15 focus:border-[#0066cc] transition-all outline-none"
                  aria-label="Tìm kiếm học sinh"
                />
              </div>
              <button
                onClick={() => window.open(`/api/admin/assignments/${assignmentId}/export`, '_blank')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 font-bold rounded-full border border-emerald-500/20 transition-all flex-shrink-0 text-xs active:scale-95"
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
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-12">
          <div className="flex flex-col items-center justify-center">
            <RefreshCw className="h-10 w-10 text-[#0066cc] animate-spin mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-semibold text-xs sm:text-sm">Đang tải danh sách học sinh...</p>
          </div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-12 text-center">
          <div className="relative text-center">
            {searchTerm ? (
              <>
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Không tìm thấy học sinh</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Thử tìm kiếm với từ khóa khác</p>
              </>
            ) : (
              <>
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-[#0066cc] dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <User className="h-7 w-7" />
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Chưa có học sinh nào</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Khi học sinh truy cập bài tập, danh sách phiên làm bài sẽ tự động hiển thị tại đây.</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4">
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
              ? 'border-white/80 dark:border-white/10' 
              : s.status === "exited"
              ? 'border-rose-500/30' 
              : 'border-amber-500/30';

            return (
              <div 
                key={s.id} 
                className={`group relative overflow-hidden rounded-[2.25rem] border p-4 sm:p-5 text-sm transition-all duration-300 ease-spring bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(0,102,204,0.08)] hover:-translate-y-0.5 ${cardBorderClass} cursor-pointer`}
                onClick={() => setSelectedSessionId(s.id)}
              >
                <div className="flex items-start gap-3.5">
                  {/* Avatar */}
                  <div className="relative group/avatar flex-shrink-0">
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066cc]/15 to-blue-500/10 text-[#0066cc] dark:text-blue-400 font-extrabold text-sm border border-blue-500/20">
                      {s.student_name ? s.student_name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="text-[17px] font-bold text-slate-900 dark:text-white truncate tracking-[-0.01em] group-hover:text-[#0066cc] dark:group-hover:text-blue-400 transition-colors">
                            {s.student_name}
                          </h3>
                          {!registeredStudentNames.includes(s.student_name?.toLowerCase().trim()) && Boolean(s.is_guest || s.draft_answers?.__sessionMeta?.isGuest) && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100/90 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300/70 dark:border-amber-700/50 shadow-sm flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Học sinh ngoài
                            </span>
                          )}
                          {isSubmitted ? (
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/30 backdrop-blur-sm text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                              Đã nộp
                            </span>
                          ) : s.status === "exited" ? (
                            <span className="px-2.5 py-0.5 rounded-lg bg-rose-100/80 dark:bg-rose-900/30 backdrop-blur-sm text-xs font-bold text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30">
                              Đã thoát
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/30 backdrop-blur-sm text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 animate-pulse">
                              Đang làm
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-2">
                          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full font-medium text-slate-600 dark:text-slate-300">
                            <Clock className="h-3.5 w-3.5 text-[#0066cc]" />
                            {duration} phút
                          </span>
                          <span className="bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full font-medium text-slate-600 dark:text-slate-300">
                            Bắt đầu: {formatVietnamTime(new Date(s.started_at))}
                          </span>
                          <span className="bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full font-medium text-slate-600 dark:text-slate-300">
                            Cập nhật: {formatVietnamTime(new Date(s.last_activity_at))}
                          </span>
                          {s.exit_count > 0 && (
                            <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold px-2.5 py-1 rounded-full border border-rose-200/50 dark:border-rose-800/30">
                              Thoát: {s.exit_count} lần
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 flex items-center justify-between sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
                        {isSubmitted ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r shadow-md backdrop-blur-sm border border-white/50 dark:border-white/5 bg-slate-50 dark:bg-slate-800">
                            <div className={`inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${scoreColorClass}`}>
                              <Trophy className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className={`font-bold text-lg bg-gradient-to-r ${scoreColorClass} bg-clip-text text-transparent`}>
                              {parseFloat(Number(score).toFixed(2)).toString().replace(".", ",")} điểm
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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 animate-fade-in">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setSelectedSessionId(null)} />
            <div className="relative z-10 bg-white/95 dark:bg-[#161618]/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/80 dark:border-white/10 max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-scale-in">
              {detailLoading ? (
                <div className="p-8 sm:p-12 text-center flex-1 flex items-center justify-center">
                  <div className="space-y-4">
                    <RefreshCw className="h-10 w-10 text-[#0066cc] animate-spin mx-auto" />
                    <p className="text-slate-600 dark:text-slate-400 font-semibold text-xs sm:text-sm">Đang tải chi tiết bài làm...</p>
                  </div>
                </div>
              ) : detailData ? (
                <>
                  {/* Sticky Header */}
                  <div className="sticky top-0 bg-white/95 dark:bg-[#161618]/95 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 p-4 sm:p-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl shadow-md ${
                        isSubmitted 
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : session.status === "exited"
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : 'bg-[#0066cc]/15 text-[#0066cc] dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {isSubmitted ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : session.status === "exited" ? (
                          <LogOut className="h-6 w-6" />
                        ) : (
                          <Clock className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-base sm:text-xl font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
                            {isSubmitted ? 'Chi tiết bài nộp' : 'Bài đang làm trực tuyến'}
                          </h2>
                          {!isSubmitted ? (
                            session.status === "exited" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800 shadow-sm animate-pulse">
                                <span className="relative flex h-2 w-2">
                                  <span className="relative rounded-full bg-rose-600 dark:bg-rose-400 h-2 w-2" />
                                </span>
                                Đã thoát
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                                  <span className="relative rounded-full bg-emerald-600 dark:bg-emerald-400 h-2 w-2" />
                                </span>
                                Đang làm
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 shadow-sm">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              Đã nộp bài
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bold">
                            {session.student_name}
                          </p>
                          {!registeredStudentNames.includes(session.student_name?.toLowerCase().trim()) && Boolean(session.is_guest || session.draft_answers?.__sessionMeta?.isGuest) && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Học sinh ngoài
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSessionId(null)}
                      className="rounded-full p-2 text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 transition-colors active:scale-95"
                      aria-label="Đóng cửa sổ"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-[#0a0a0a]/20">
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
