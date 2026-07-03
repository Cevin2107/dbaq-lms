"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Copy, CheckCircle2, Clock, Award, Calendar, Share2 } from "lucide-react";

export default function StartAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [incompleteSession, setIncompleteSession] = useState<{ id: string; student_name: string; started_at: string } | null>(null);
  const [checkingIncomplete, setCheckingIncomplete] = useState(false);
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const router = useRouter();
  const [assignmentId, setAssignmentId] = useState<string>("");
  const { addToast } = useToast();

  useEffect(() => {
    params.then(p => setAssignmentId(p.id));
  }, [params]);

  useEffect(() => {
    const fetchUser = async () => {
      const { createSupabaseBrowserClient } = await import("@/lib/supabaseClient");
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setStudentName(user.user_metadata?.full_name || "Học sinh");
      }
    };
    fetchUser();
  }, []);

  // Fetch assignment data
  useEffect(() => {
    if (!assignmentId) return;
    const fetchAssignment = async () => {
      setLoadingAssignment(true);
      try {
        const res = await fetch(`/api/assignments/${assignmentId}`);
        if (res.ok) {
          const data = await res.json();
          setAssignmentData(data);
        }
      } catch (error) {
        console.error("Error fetching assignment:", error);
      } finally {
        setLoadingAssignment(false);
      }
    };
    fetchAssignment();
  }, [assignmentId]);

  useEffect(() => {
    const checkIncomplete = async () => {
      const trimmedName = studentName.trim();
      if (!trimmedName || trimmedName.length < 2 || !assignmentId) {
        setIncompleteSession(null);
        return;
      }
      setCheckingIncomplete(true);
      try {
        const res = await fetch(
          `/api/student-sessions?assignmentId=${assignmentId}&studentName=${encodeURIComponent(trimmedName)}&findIncomplete=true`
        );
        if (res.ok) {
          const data = await res.json();
          setIncompleteSession(data.hasIncomplete && data.session ? data.session : null);
        } else {
          setIncompleteSession(null);
        }
      } catch {
        setIncompleteSession(null);
      } finally {
        setCheckingIncomplete(false);
      }
    };
    if (studentName) {
      checkIncomplete();
    }
  }, [studentName, assignmentId]);

  const handleStart = async (resumeSessionId?: string) => {
    const trimmedName = studentName.trim();
    if (!trimmedName) { setError("Đang tải thông tin..."); return; }

    setLoading(true);
    setError("");
    try {
      let sessionId = resumeSessionId;
      if (!sessionId) {
        const res = await fetch("/api/student-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignmentId, studentName: trimmedName, status: "active" }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Không thể bắt đầu bài tập");
        }
        const data = await res.json();
        sessionId = data.sessionId;
      } else {
        const res = await fetch("/api/student-sessions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, status: "active" }),
        });
        if (!res.ok) throw new Error("Không thể tiếp tục bài tập");
      }
      if (!sessionId) throw new Error("Không thể lấy session ID");
      localStorage.setItem(`session-${assignmentId}`, sessionId);
      localStorage.setItem(`student-name-${assignmentId}`, trimmedName);
      router.push(`/assignments/${assignmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      addToast({
        title: "Đã sao chép!",
        description: "Link bài tập đã được sao chép vào clipboard",
        variant: "success",
        duration: 3000,
      });
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(() => {
      addToast({
        title: "Lỗi",
        description: "Không thể sao chép link",
        variant: "error",
        duration: 3000,
      });
    });
  };

  const formatDueDate = (dueAt?: string | null) => {
    if (!dueAt) return null;
    const date = new Date(dueAt);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-100 dark:bg-blue-900/20 opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-sky-100 dark:bg-sky-900/20 opacity-60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl animate-fade-in">
        {/* Compact Hero Section */}
        <div className="mb-8 flex flex-col items-center text-center animate-slide-up">
          {/* Compact Logo */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0066cc] shadow-lg shadow-blue-500/30">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>

          {/* Responsive Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-[-0.02em] mb-2">
            Hệ thống bài tập trực tuyến
          </h1>

          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white mb-1">Sẵn sàng làm bài?</h2>
          <p className="text-[15px] text-slate-500 dark:text-slate-400">Kiểm tra thông tin và bắt đầu</p>
        </div>

        {/* Assignment Info Card */}
        {loadingAssignment ? (
          <div className="mb-4 rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6">
            <div className="space-y-3">
              <div className="h-6 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-4 w-1/2 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
            </div>
          </div>
        ) : assignmentData ? (
          <div className="mb-4 rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-[19px] font-bold text-slate-900 dark:text-white truncate mb-2">
                  {assignmentData.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#0066cc]/10 text-[#0066cc] dark:bg-blue-500/20 dark:text-blue-300 border-none px-3 rounded-full text-[13px] font-semibold">
                    {assignmentData.subject}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none px-3 rounded-full text-[13px] font-semibold">
                    {assignmentData.grade}
                  </Badge>
                </div>
              </div>
              <button
                onClick={handleCopyLink}
                className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                title="Chia sẻ link"
              >
                {copySuccess ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Share2 className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* Compact Assignment Meta Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {assignmentData.dueAt && (
                <div className="flex items-center gap-2.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
                  <Calendar className="h-5 w-5 text-[#0066cc] dark:text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hạn nộp</div>
                    <div className="text-[14px] font-bold text-slate-900 dark:text-white truncate">{formatDueDate(assignmentData.dueAt)}</div>
                  </div>
                </div>
              )}
              {assignmentData.durationMinutes && (
                <div className="flex items-center gap-2.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
                  <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thời gian</div>
                    <div className="text-[14px] font-bold text-slate-900 dark:text-white">{assignmentData.durationMinutes}p</div>
                  </div>
                </div>
              )}
              {assignmentData.totalScore && (
                <div className="flex items-center gap-2.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
                  <Award className="h-5 w-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Điểm tối đa</div>
                    <div className="text-[14px] font-bold text-slate-900 dark:text-white">{assignmentData.totalScore}đ</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Input Card */}
        <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow">
          <div className="space-y-6">
            <div className="text-center p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mb-1">Đăng nhập với tư cách:</p>
              <p className="text-[19px] font-bold text-[#0066cc] dark:text-blue-400">{studentName || "Đang tải..."}</p>
            </div>
            
            {error && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-[14px] font-medium text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
            {checkingIncomplete && (
              <div className="flex items-center justify-center gap-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-[14px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Đang kiểm tra tiến độ...
              </div>
            )}
            {incompleteSession && !checkingIncomplete && (
              <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50 shrink-0">
                    <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-amber-900 dark:text-amber-300">Bài làm còn dang dở</p>
                    <p className="text-[13px] text-amber-700 dark:text-amber-400/80 mt-1">Lần cuối: {new Date(incompleteSession.started_at).toLocaleString("vi-VN")}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStart(incompleteSession.id)}
                    disabled={loading}
                    className="flex-1 rounded-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 px-4 py-3 text-[14px] font-bold text-white transition shadow-sm hover:shadow-md active:scale-[0.98]"
                  >
                    Tiếp tục
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await fetch(`/api/student-sessions/${incompleteSession.id}`, { method: "DELETE" });
                      } catch {}
                      setIncompleteSession(null);
                    }}
                    disabled={loading}
                    className="flex-1 rounded-full border border-amber-200 dark:border-amber-700 bg-white dark:bg-transparent hover:bg-amber-50 dark:hover:bg-amber-900/30 disabled:opacity-50 px-4 py-3 text-[14px] font-bold text-amber-700 dark:text-amber-400 transition active:scale-[0.98]"
                  >
                    Làm mới
                  </button>
                </div>
              </div>
            )}

            {!incompleteSession && (
              <button
                onClick={() => handleStart()}
                disabled={loading || !studentName.trim() || checkingIncomplete}
                className="w-full flex items-center justify-center h-[52px] rounded-full bg-[#0066cc] shadow-md shadow-blue-500/20 hover:bg-[#005bb5] hover:shadow-lg disabled:opacity-60 px-4 py-3 text-[15px] font-bold text-white transition active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang chuẩn bị...
                  </span>
                ) : "Bắt đầu làm bài →"}
              </button>
            )}

            <Link
              href="/"
              className="block text-center text-[14px] font-semibold text-[#0066cc] dark:text-blue-400 hover:text-[#005bb5] dark:hover:text-blue-300 transition"
            >
              ← Quay lại trang chính
            </Link>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex px-4 py-2 rounded-full bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-sm">
            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Kết nối bảo mật & riêng tư
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
