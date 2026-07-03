import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ResultQuestionsAccordion } from "@/features/assignments/components/ResultQuestionsAccordion";
import { MathText } from "@/components/MathText";

// Disable caching để luôn hiển thị dữ liệu mới nhất
export const dynamic = 'force-dynamic';
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
  const formatPoints = (value: number | null | undefined) => Number(value ?? 0).toFixed(3);
  await _params;
  const { sid } = await searchParams;

  if (!sid) {
      <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] transition-colors duration-500 flex items-center justify-center">
        <div className="mx-auto max-w-xl px-4 py-8">
          <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 text-center">
            <p className="text-[15px] text-slate-600 dark:text-slate-400 font-medium">Không tìm thấy kết quả bài làm.</p>
            <Link href="/" className="inline-block mt-4 px-6 py-2.5 rounded-full bg-slate-100 dark:bg-white/10 text-[14px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-all">
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </main>
  }

  const supabase = createSupabaseAdmin();

  const { data: submission } = await (supabase
    .from("submissions") as any)
    .select("*, assignments(*)")
    .eq("id", sid)
    .single();

  if (!submission) return notFound();

  // Lấy câu hỏi và câu trả lời
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
  const submittedAt = new Date(submission.submitted_at).toLocaleString("vi-VN");
  const isScoreHidden = Boolean(assignment?.hide_score);

  // Tính toán thống kê
  const actualQuestions = questions?.filter((q: any) => q.type !== 'section') || [];

  const isQuestionUnanswered = (q: any) => {
    const ans = answerMap.get(q.id);
    if (!ans || !ans.answer) return true;
    const trimmed = ans.answer.trim();
    if (trimmed === "") return true;
    if (q.type === "true_false") {
      try {
        const studentTf = JSON.parse(trimmed);
        return Object.keys(studentTf).length === 0;
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

  const percentage = totalPoints > 0 ? ((score / totalPoints) * 100).toFixed(1) : '0.0';

  const { data: historyRaw } = await (supabase
    .from("submissions") as any)
    .select("id, score, submitted_at, status, duration_seconds")
    .eq("assignment_id", submission.assignment_id)
    .eq("student_name", submission.student_name)
    .order("submitted_at", { ascending: false })
    .limit(10);
  const history = historyRaw as SubmissionSummary[] | null;

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] transition-colors duration-500" suppressHydrationWarning>
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-100 dark:bg-blue-900/20 opacity-40 blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-sky-100 dark:bg-sky-900/20 opacity-40 blur-[100px] translate-y-1/2 -translate-x-1/3" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#1d1d1f]/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0066cc] shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-[-0.01em]">Kết quả bài làm</h1>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-[14px] font-medium text-slate-500 dark:text-slate-400 transition hover:text-[#0066cc] dark:hover:text-blue-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Về trang chủ
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 relative" suppressHydrationWarning>
        {/* Score card */}
        <div className="overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5" suppressHydrationWarning>
          <div className="bg-[#0066cc] p-8 text-center text-white relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none" />
            
            <p className="text-[13px] font-bold text-blue-100 mb-3 tracking-widest uppercase">Kết quả chung</p>
            {isScoreHidden ? (
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-md">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-[22px] font-bold">Điểm chưa được công bố</p>
                <p className="text-[15px] text-blue-100 mt-1">Giáo viên sẽ thông báo sau khi hoàn tất chấm bài.</p>
              </div>
            ) : (
              <div>
                <div className="text-7xl font-bold tracking-tight tabular-nums">
                  {score}<span className="text-3xl font-medium text-blue-200">/{totalPoints}</span>
                </div>
                <div className="mt-3 text-2xl font-bold text-blue-100">{percentage}%</div>
              </div>
            )}
          </div>

          {!isScoreHidden && (
            <div className="grid grid-cols-3 divide-x divide-black/5 dark:divide-white/5 border-t border-black/5 dark:border-white/5">
              {[
                { value: correctCount, label: "Đúng", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/50 dark:bg-emerald-500/10" },
                { value: incorrectCount, label: "Sai", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50/50 dark:bg-rose-500/10" },
                { value: unansweredCount, label: "Bỏ qua", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50/50 dark:bg-slate-800/30" },
              ].map(s => (
                <div key={s.label} className={`flex flex-col items-center py-5 ${s.bg}`}>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5" suppressHydrationWarning>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { label: "Bài tập", value: assignment.title },
              { label: "Môn học", value: assignment.subject },
              { label: "Nộp lúc", value: submittedAt },
              { label: "Trạng thái", value: submission.status === "scored" ? "Đã chấm" : "Đang chấm", badge: true, color: submission.status === "scored" ? "emerald" : "amber" },
            ].map((item, i) => (
              <div key={item.label} className={clsx("flex flex-col", i > 1 ? "mt-2 sm:mt-0" : "")}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">{item.label}</p>
                {item.badge ? (
                  <div>
                    <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold ${
                      item.color === "emerald" 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}>{item.value}</span>
                  </div>
                ) : (
                  <p className="text-[14px] font-bold text-slate-900 dark:text-slate-200 line-clamp-2">
                    {item.label === "Bài tập" ? <MathText text={item.value || ""} /> : item.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Question detail */}
        <div className="space-y-4">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-2">Chi tiết từng câu</h2>
          {isScoreHidden && (
            <div className="rounded-[2rem] border border-amber-200/50 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/10 p-8 text-center backdrop-blur-xl">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 dark:bg-amber-500/20">
                  <svg className="h-7 w-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-[17px] font-bold text-amber-900 dark:text-amber-200">Bài đã nộp thành công!</p>
              <p className="text-[15px] text-amber-700 dark:text-amber-400/80 mt-1">Giáo viên sẽ chấm bài và công bố điểm sau.</p>
            </div>
          )}

          {!isScoreHidden && (
             <ResultQuestionsAccordion 
               questions={questions || []}
               answers={answers || []}
               isScoreHidden={isScoreHidden}
             />
          )}
        </div>

        {/* History */}
        {history && history.length > 0 && (
          <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Lịch sử làm bài</h2>
            </div>
            {history.length > 1 && history[0].score !== null && history[1].score !== null && (
              <div className={clsx(
                "mb-5 rounded-2xl px-5 py-4 text-[14px] font-bold",
                history[0].score > history[1].score ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                history[0].score < history[1].score ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300"
              )}>
                {history[0].score > history[1].score
                  ? `🎉 Cải thiện +${(history[0].score - history[1].score).toFixed(3)} so với lần trước!`
                  : history[0].score < history[1].score
                  ? `Giảm ${(history[1].score - history[0].score).toFixed(3)} điểm. Cố gắng hơn nhé!`
                  : "Điểm không đổi so với lần trước."}
              </div>
            )}
            <div className="space-y-3">
              {history.map((h, idx) => (
                <Link
                  key={h.id}
                  href={`/assignments/${assignment.id}/result?sid=${h.id}`}
                  className={clsx(
                    "flex items-center justify-between rounded-2xl border px-5 py-4 transition-all duration-200",
                    h.id === sid 
                      ? "border-[#0066cc]/30 bg-[#0066cc]/5 shadow-sm" 
                      : "border-black/5 dark:border-white/5 hover:border-[#0066cc]/20 hover:bg-slate-50/50 dark:hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-[13px] font-bold text-slate-500 dark:text-slate-400">#{history.length - idx}</div>
                    <div>
                      <p className={clsx("text-[15px] font-bold", h.id === sid ? "text-[#0066cc] dark:text-blue-400" : "text-slate-900 dark:text-slate-200")}>{h.score ?? 0}/{totalPoints} điểm</p>
                      <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{new Date(h.submitted_at).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                  {h.id === sid && (
                    <span className="rounded-full bg-[#0066cc] px-3 py-1 text-[11px] font-bold text-white shadow-sm">Đang xem</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Retry button */}
        <Link
          href={`/assignments/${assignment.id}/start`}
          className="flex items-center justify-center gap-2 rounded-full py-4.5 text-[15px] font-bold text-white shadow-md transition-all bg-[#0066cc] hover:bg-[#005bb5] hover:shadow-lg active:scale-[0.98]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm lại bài tập
        </Link>
      </div>
    </main>
  );
}
