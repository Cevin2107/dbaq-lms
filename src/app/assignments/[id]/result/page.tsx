import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ResultQuestionsAccordion } from "@/features/assignments/components/ResultQuestionsAccordion";
import { MathText } from "@/components/MathText";
import { Footer } from "@/components/Footer";
import { formatDuration } from "@/lib/sessionTime";
import { 
  Trophy, 
  ArrowLeft, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  Sparkles,
  TrendingUp,
  TrendingDown,
  History,
  FileCheck
} from "lucide-react";

// Disable caching để luôn hiển thị dữ liệu mới nhất
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SubmissionSummary = {
  id: string;
  score: number | null;
  submitted_at: string;
  status: string;
  duration_seconds: number | null;
};

export default async function ResultPage({ 
  params: _params,
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sid?: string }>;
}) {
  const formatPoints = (value: number | null | undefined) => {
    if (value == null) return "0";
    return parseFloat(Number(value).toFixed(2)).toString().replace(".", ",");
  };

  await _params;
  const { sid } = await searchParams;

  if (!sid) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] transition-colors duration-500 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mx-auto mb-4">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5 tracking-[-0.01em]">Không tìm thấy kết quả</h2>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-6">Mã bài nộp không hợp lệ hoặc đã bị xóa khỏi hệ thống.</p>
            <Link 
              href="/" 
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-full bg-[#0066cc] text-[14px] font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-[#0071e3] hover:shadow-blue-500/35 active:scale-95 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const supabase = createSupabaseAdmin();

  const { data: submission } = await (supabase
    .from("submissions") as any)
    .select("*, assignments(*)")
    .eq("id", sid)
    .single();

  if (!submission) return notFound();

  // Lấy danh sách câu hỏi và câu trả lời
  const { data: questions } = await (supabase
    .from("questions") as any)
    .select("*")
    .eq("assignment_id", submission.assignment_id)
    .order("order");

  const { data: answers } = await (supabase
    .from("answers") as any)
    .select("*")
    .eq("submission_id", sid);

  const answerMap = new Map<string, any>(answers?.map((a: any) => [a.question_id, a]) || []);

  const assignment = submission.assignments;
  const score = submission.score ?? 0;
  const totalPoints = assignment?.total_score ?? questions?.reduce((sum: number, q: any) => sum + Number(q.points || 0), 0) ?? 0;
  const submittedAt = new Date(submission.submitted_at).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const isScoreHidden = Boolean(assignment?.hide_score);
  const durationSeconds = submission.duration_seconds || 0;

  // Thống kê câu hỏi
  const actualQuestions = questions?.filter((q: any) => q.type !== "section") || [];

  const isQuestionUnanswered = (q: any) => {
    const ans = answerMap.get(q.id);
    if (!ans || !ans.answer) return true;
    const trimmed = String(ans.answer).trim();
    if (trimmed === "") return true;
    if (q.type === "true_false") {
      try {
        const studentTf = typeof ans.answer === "string" ? JSON.parse(trimmed) : ans.answer;
        return !studentTf || Object.keys(studentTf).length === 0;
      } catch {
        return true;
      }
    }
    return false;
  };

  const correctCount = actualQuestions.filter((q: any) => {
    if (isQuestionUnanswered(q)) return false;
    const answer = answerMap.get(q.id);
    let isCorrect = answer?.is_correct;
    if (isCorrect === null && q.type === "short_answer") {
      isCorrect = answer?.points_awarded === q.points;
    }
    return isCorrect === true;
  }).length;

  const incorrectCount = actualQuestions.filter((q: any) => {
    if (isQuestionUnanswered(q)) return false;
    const answer = answerMap.get(q.id);
    let isCorrect = answer?.is_correct;
    if (isCorrect === null && q.type === "short_answer") {
      isCorrect = answer?.points_awarded === q.points;
    }
    return isCorrect === false;
  }).length;

  const unansweredCount = actualQuestions.filter((q: any) => {
    return isQuestionUnanswered(q);
  }).length;

  const percentage = totalPoints > 0 ? Number(((score / totalPoints) * 100).toFixed(1)) : 0;

  // Đánh giá xếp loại thành tích (Apple Soft Modern Badge)
  const getPerformanceBadge = (pct: number) => {
    if (pct >= 90) return { label: "Xuất sắc", icon: "🌟", color: "from-amber-400 to-yellow-500 text-amber-950 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 dark:border-amber-700/60" };
    if (pct >= 80) return { label: "Giỏi", icon: "🎉", color: "from-emerald-400 to-teal-500 text-emerald-950 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/60" };
    if (pct >= 65) return { label: "Khá", icon: "👍", color: "from-blue-400 to-indigo-500 text-blue-950 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-200 border-blue-300 dark:border-blue-700/60" };
    if (pct >= 50) return { label: "Đạt chuẩn", icon: "📚", color: "from-slate-400 to-slate-500 text-slate-900 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700" };
    return { label: "Cần cố gắng", icon: "💪", color: "from-rose-400 to-red-500 text-rose-950 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-200 border-rose-300 dark:border-rose-700/60" };
  };

  const performance = getPerformanceBadge(percentage);

  // Lịch sử làm bài
  const { data: historyRaw } = await (supabase
    .from("submissions") as any)
    .select("id, score, submitted_at, status, duration_seconds")
    .eq("assignment_id", submission.assignment_id)
    .eq("student_name", submission.student_name)
    .order("submitted_at", { ascending: false })
    .limit(8);
  const history = historyRaw as SubmissionSummary[] | null;

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-slate-900 dark:text-slate-100 transition-colors duration-500 flex flex-col justify-between" suppressHydrationWarning>
      {/* Background Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 right-1/4 w-[600px] h-[600px] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[130px] -translate-y-1/2" />
        <div className="absolute top-1/2 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-400/10 dark:bg-indigo-600/10 blur-[130px]" />
      </div>

      <div className="relative z-10">
        {/* Header - Liquid Glass Header */}
        <header className="sticky top-0 z-40 border-b border-black/5 dark:border-white/10 bg-white/75 dark:bg-[#1d1d1f]/75 backdrop-blur-xl shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
          <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066cc] to-[#0071e3] text-white shadow-md shadow-blue-500/25">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-[-0.01em]">
                  Kết quả bài làm
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  {submission.student_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link 
                href={`/assignments/${assignment.id}/start`}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-all active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Làm lại
              </Link>
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#0066cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all active:scale-95"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Về trang chủ
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Container - 1440px Grid */}
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-6">
          {/* ========================================================= */}
          {/* 🌟 HERO SCORE CARD - Apple Soft Modern Liquid Glass       */}
          {/* ========================================================= */}
          <div className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0066cc] via-[#005bb5] to-[#00478f] text-white shadow-[0_12px_40px_rgba(0,102,204,0.22)] p-6 sm:p-10 transition-all duration-300">
            {/* Animated Mesh Glows */}
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Cột trái: Điểm số & Xếp loại */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3 flex-1">
                {/* Performance Badge */}
                {!isScoreHidden && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/20 shadow-sm text-white">
                    <span>{performance.icon}</span>
                    <span>Xếp loại: {performance.label}</span>
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold text-blue-100">
                    Điểm số đạt được
                  </p>
                  {isScoreHidden ? (
                    <div className="mt-2">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md mb-2">
                        <Clock className="h-7 w-7 text-white" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold tracking-tight">Điểm chưa công bố</p>
                      <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-sm">
                        Giáo viên sẽ xem xét và công bố điểm sau khi hoàn tất ca thi.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-center md:justify-start gap-2 mt-1">
                      <span className="font-mono text-6xl sm:text-7xl md:text-8xl font-black tracking-tight tabular-nums drop-shadow-sm">
                        {formatPoints(score)}
                      </span>
                      <span className="text-2xl sm:text-3xl font-medium text-blue-200">
                        /{formatPoints(totalPoints)}đ
                      </span>
                    </div>
                  )}
                </div>

                {!isScoreHidden && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-2.5 w-40 sm:w-52 rounded-full bg-black/20 overflow-hidden p-0.5">
                      <div 
                        className="h-full rounded-full bg-white shadow-sm transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold font-mono text-blue-100">{percentage}%</span>
                  </div>
                )}
              </div>

              {/* Cột phải: 3 Thẻ thống kê chi tiết (Liquid Concentric Sub-cards) */}
              {!isScoreHidden && (
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-full md:w-auto shrink-0">
                  {/* Đúng */}
                  <div className="flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-sm min-w-[90px] sm:min-w-[120px]">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300 mb-2">
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums leading-none">
                      {correctCount}
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-blue-100 mt-1">
                      Câu đúng
                    </span>
                  </div>

                  {/* Sai */}
                  <div className="flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-sm min-w-[90px] sm:min-w-[120px]">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-rose-400/20 text-rose-300 mb-2">
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums leading-none">
                      {incorrectCount}
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-blue-100 mt-1">
                      Câu sai
                    </span>
                  </div>

                  {/* Chưa làm */}
                  <div className="flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-sm min-w-[90px] sm:min-w-[120px]">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/20 text-blue-100 mb-2">
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums leading-none">
                      {unansweredCount}
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-blue-100 mt-1">
                      Chưa làm
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 📋 META INFORMATION CARD                                  */}
          {/* ========================================================= */}
          <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {/* Bài tập */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#0066cc] dark:text-blue-400">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Bài tập
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={assignment.title}>
                    <MathText text={assignment.title || ""} />
                  </p>
                </div>
              </div>

              {/* Môn học */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Môn học
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {assignment.subject}
                    </span>
                    {assignment.grade && (
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        {assignment.grade}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Thời gian làm bài */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Thời gian làm
                  </p>
                  <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                    {formatDuration(durationSeconds)}
                  </p>
                </div>
              </div>

              {/* Thời điểm nộp */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Thời điểm nộp
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {submittedAt}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 📝 ACCORDION CHI TIẾT TỪNG CÂU HỎI                       */}
          {/* ========================================================= */}
          <section className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="h-4 w-4 text-[#0066cc] dark:text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Chi tiết đáp án &amp; lời giải
              </h2>
            </div>

            <ResultQuestionsAccordion 
              questions={questions || []}
              answers={answers || []}
              isScoreHidden={isScoreHidden}
            />
          </section>

          {/* ========================================================= */}
          {/* 📜 SUBMISSION HISTORY                                     */}
          {/* ========================================================= */}
          {history && history.length > 1 && (
            <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-[#0066cc] dark:text-blue-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Lịch sử làm bài của bạn
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {history.length} lượt nộp
                </span>
              </div>

              {/* Banner so sánh lần nộp gần nhất */}
              {history[0].score !== null && history[1].score !== null && (
                <div
                  className={clsx(
                    "flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold border",
                    history[0].score > history[1].score
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
                      : history[0].score < history[1].score
                      ? "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
                      : "bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 border-black/5 dark:border-white/5"
                  )}
                >
                  {history[0].score > history[1].score ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Tiến bộ rõ rệt! Bạn đã tăng +{formatPoints(history[0].score - history[1].score)} điểm so với lần trước.
                      </span>
                    </>
                  ) : history[0].score < history[1].score ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>
                        Điểm số giảm {formatPoints(history[1].score - history[0].score)} điểm so với lần trước. Hãy kiểm tra lại các câu sai nhé!
                      </span>
                    </>
                  ) : (
                    <span>Điểm số không đổi so với lần làm bài trước.</span>
                  )}
                </div>
              )}

              {/* Grid các lần nộp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                {history.map((h, idx) => {
                  const isCurrent = h.id === sid;
                  const itemTime = new Date(h.submitted_at).toLocaleString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit"
                  });

                  return (
                    <Link
                      key={h.id}
                      href={`/assignments/${assignment.id}/result?sid=${h.id}`}
                      className={clsx(
                        "group relative rounded-2xl border p-4 transition-all duration-300 flex flex-col justify-between gap-3",
                        isCurrent
                          ? "border-[#0066cc] bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-700 shadow-md shadow-blue-500/10"
                          : "border-black/5 dark:border-white/5 bg-white/50 dark:bg-[#1d1d1f]/50 hover:border-[#0066cc]/30 hover:bg-white dark:hover:bg-[#1d1d1f]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                          Lần #{history.length - idx}
                        </span>
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0066cc] text-white">
                            Đang xem
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400">
                            {itemTime}
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className={clsx(
                          "text-2xl font-black font-mono tracking-tight",
                          isCurrent ? "text-[#0066cc] dark:text-blue-400" : "text-slate-800 dark:text-slate-200"
                        )}>
                          {formatPoints(h.score)}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          /{formatPoints(totalPoints)}đ
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 🚀 ACTION BAR                                             */}
          {/* ========================================================= */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/assignments/${assignment.id}/start`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-[15px] font-bold text-white bg-gradient-to-r from-[#0066cc] to-[#0071e3] shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300"
            >
              <RotateCcw className="h-4 w-4" />
              Làm lại bài tập
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-[15px] font-bold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/5 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/15 active:scale-95 transition-all duration-300"
            >
              Về danh sách bài tập
            </Link>
          </div>
        </div>
      </div>

      <Footer className="mt-16" />
    </main>
  );
}
