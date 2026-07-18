import { useEffect, useState } from "react";
import { countActualQuestions, cn } from "@/lib/utils";
import { formatDuration } from "@/lib/sessionTime";
import { RegradeModal, RegradeInstruction } from "@/components/RegradeControls";
import { StudentAnswerReviewList, type ReviewQuestion } from "./StudentAnswerReviewList";
import {
  CheckCircle2,
  Edit3,
  LogOut,
  RefreshCw,
  Target,
  Timer,
  Zap,
  Brain,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";


interface StudentWorkReviewPanelProps {
  questions: ReviewQuestion[];
  startedAt: string;
  isSubmitted: boolean;
  isPaused?: boolean;
  pausedAt?: string;
  submissionId?: string;
  submissionScore?: number;
  submissionDurationSeconds?: number;
  durationSeconds?: number;
  answeredCountOverride?: number;
  exitCount?: number;
  onRefresh: () => Promise<void> | void;
  notify?: (message: string, type: "success" | "error") => void;
}

type RegradeAnswerState = {
  isCorrect: boolean;
  pointsAwarded: number;
  subAnswers?: Record<string, boolean>;
};

export function StudentWorkReviewPanel({
  questions,
  startedAt,
  isSubmitted,
  isPaused = false,
  pausedAt,
  submissionId,
  submissionScore,
  submissionDurationSeconds,
  durationSeconds,
  answeredCountOverride,
  exitCount,
  onRefresh,
  notify,
}: StudentWorkReviewPanelProps) {
  const [regradingMode, setRegradingMode] = useState(false);
  const [regrading, setRegrading] = useState(false);
  const [regradeAnswers, setRegradeAnswers] = useState<Map<string, RegradeAnswerState>>(new Map());
  const [showStatsExpanded, setShowStatsExpanded] = useState(true);

  const [liveNow, setLiveNow] = useState(() => Date.now());

  useEffect(() => {
    if (isSubmitted || isPaused) return;

    const timer = setInterval(() => {
      setLiveNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, isPaused]);

  const answeredCountFromQuestions = questions.filter((q) => q.studentAnswer && q.type !== "section").length;
  const answeredCount =
    typeof answeredCountOverride === "number" ? answeredCountOverride : answeredCountFromQuestions;
  const totalQuestions = countActualQuestions(questions as any);
  const startedAtMs = new Date(startedAt).getTime();
  const pausedAtMs = pausedAt ? new Date(pausedAt).getTime() : NaN;
  const endTimeMs = isPaused && Number.isFinite(pausedAtMs) ? pausedAtMs : liveNow;
  const fallbackElapsedSeconds = Number.isNaN(startedAtMs)
    ? 0
    : Math.max(0, Math.floor((endTimeMs - startedAtMs) / 1000));
  const workSeconds =
    typeof durationSeconds === "number"
      ? Math.max(0, Math.floor(durationSeconds))
      : isSubmitted && submissionDurationSeconds != null
      ? Math.max(0, Math.floor(submissionDurationSeconds))
      : fallbackElapsedSeconds;
  const workTimeLabel = formatDuration(workSeconds);

  const startRegrading = () => {
    const initialAnswers = new Map<string, RegradeAnswerState>();
    questions.forEach((q) => {
      initialAnswers.set(q.questionId, {
        isCorrect: q.isCorrect ?? false,
        pointsAwarded: q.pointsAwarded ?? 0,
      });
    });

    setRegradeAnswers(initialAnswers);
    setRegradingMode(true);
  };

  const cancelRegrading = () => {
    setRegradingMode(false);
    setRegradeAnswers(new Map());
  };

  const toggleAnswerCorrectness = (questionId: string, points: number) => {
    const newAnswers = new Map(regradeAnswers);
    const current = newAnswers.get(questionId);

    if (!current) return;

    const newIsCorrect = !current.isCorrect;
    newAnswers.set(questionId, {
      isCorrect: newIsCorrect,
      pointsAwarded: newIsCorrect ? points : 0,
    });

    setRegradeAnswers(newAnswers);
  };

  const setAnswerPoints = (questionId: string, pointsAwarded: number, totalPoints: number) => {
    const safePoints = Math.max(0, Math.min(pointsAwarded, totalPoints));
    const newAnswers = new Map(regradeAnswers);
    newAnswers.set(questionId, {
      isCorrect: safePoints > 0,
      pointsAwarded: safePoints,
    });
    setRegradeAnswers(newAnswers);
  };

  const setSubQuestionAnswer = (
    questionId: string,
    subQuestionIndex: number,
    isCorrect: boolean,
    totalPoints: number,
    totalSubQuestions: number
  ) => {
    const newAnswers = new Map(regradeAnswers);
    const current = newAnswers.get(questionId) || { isCorrect: false, pointsAwarded: 0, subAnswers: {} };

    if (!current.subAnswers) {
      current.subAnswers = {};
    }

    current.subAnswers![subQuestionIndex.toString()] = isCorrect;

    // Tính điểm theo số mệnh đề đúng trong câu đúng/sai
    const subQuestionArray = Object.values(current.subAnswers);
    const correctCount = subQuestionArray.filter((v) => v === true).length;
    const numSubQuestions = Math.max(totalSubQuestions, 1);
    const pointsPerSubQuestion = totalPoints / numSubQuestions;
    current.pointsAwarded = Math.max(0, Math.min(totalPoints, correctCount * pointsPerSubQuestion));
    current.isCorrect = current.pointsAwarded > 0;

    newAnswers.set(questionId, current);
    setRegradeAnswers(newAnswers);
  };

  const submitRegrade = async () => {
    if (!submissionId) return;

    const answers = Array.from(regradeAnswers.entries()).map(([questionId, data]) => ({
      questionId,
      isCorrect: data.isCorrect,
      pointsAwarded: data.pointsAwarded,
    }));

    setRegrading(true);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/regrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) throw new Error("Failed to regrade");

      const result = await res.json();
      if (notify) {
        notify(`Chấm lại thành công! Điểm mới: ${result.newScore}/10`, "success");
      } else {
        alert(`Chấm lại thành công! Điểm mới: ${result.newScore}/10`);
      }

      await onRefresh();
      setRegradingMode(false);
      setRegradeAnswers(new Map());
    } catch {
      if (notify) {
        notify("Có lỗi xảy ra khi chấm lại", "error");
      } else {
        alert("Có lỗi xảy ra khi chấm lại");
      }
    } finally {
      setRegrading(false);
    }
  };

  // Calculate correct/incorrect counts for submitted
  const correctCount = questions.filter(
    (q) => q.type !== "section" && q.isCorrect === true
  ).length;
  const incorrectCount = questions.filter(
    (q) => q.type !== "section" && q.isCorrect === false
  ).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ⚡ Realtime Live Banner */}
      {!isSubmitted && (
        isPaused ? (
          <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-50 via-red-50/50 to-orange-50/30 dark:from-rose-950/20 dark:via-red-950/10 dark:to-orange-950/10 border border-rose-200/60 dark:border-rose-800/30 shadow-[0_4px_20px_rgba(239,68,68,0.08)] p-4 sm:p-5">
            {/* Animated glow */}
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-rose-400/20 blur-3xl animate-pulse" />
            <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-red-400/15 blur-3xl animate-pulse" />

            <div className="relative flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-rose-500/30 rounded-full blur-md animate-pulse" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-red-500 text-white shadow-lg shadow-rose-500/30">
                  <LogOut className="h-5 w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-rose-800 dark:text-rose-300 tracking-[-0.01em]">
                  Học sinh đã thoát trang
                </p>
                <p className="text-[13px] text-rose-600/80 dark:text-rose-400/70 mt-0.5">
                  Tạm dừng cập nhật — Học sinh đã rời khỏi phòng thi hoặc đóng trình duyệt
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-200/50 dark:bg-rose-800/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="relative rounded-full bg-rose-600 h-2 w-2" />
                </span>
                ĐÃ THOÁT
              </div>
            </div>
          </div>
        ) : (
          <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/10 dark:to-yellow-900/20 border border-amber-200/60 dark:border-amber-800/30 shadow-[0_4px_20px_rgba(251,191,36,0.08)] p-4 sm:p-5">
            {/* Animated glow */}
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />
            <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-orange-400/15 blur-3xl animate-pulse" />

            <div className="relative flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-md animate-pulse" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-amber-800 dark:text-amber-300 tracking-[-0.01em]">
                  Học sinh đang làm bài
                </p>
                <p className="text-[13px] text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                  Dữ liệu tự động cập nhật liên tục khi học sinh có thay đổi
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />
                  <span className="relative rounded-full bg-emerald-600 h-2 w-2" />
                </span>
                ĐANG LÀM
              </div>
            </div>
          </div>
        )
      )}

      {/* 📊 Stats Cards */}
      <div>
        <button
          onClick={() => setShowStatsExpanded(!showStatsExpanded)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#0066cc] dark:hover:text-[#0066cc] transition-colors mb-3"
        >
          <Brain className="h-3.5 w-3.5" />
          Thống kê bài làm
          {showStatsExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {showStatsExpanded && (
          <div className={cn(
            "grid grid-cols-2 sm:grid-cols-2 gap-3",
            isSubmitted ? "lg:grid-cols-4" : "lg:grid-cols-3"
          )}>
            {/* Câu đã trả lời */}
            <div className="group/card relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent dark:from-blue-900/10 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Target className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider">
                    {answeredCount}/{totalQuestions}
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">
                  {answeredCount}
                  <span className="text-base font-normal text-slate-400 dark:text-slate-500 ml-0.5">/{totalQuestions}</span>
                </p>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Câu đã trả lời</p>
              </div>
            </div>

            {/* Thời gian làm */}
            <div className="group/card relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-transparent dark:from-purple-900/10 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <Timer className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-[-0.02em] font-mono">
                  {workTimeLabel}
                </p>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Thời gian làm bài</p>
              </div>
            </div>

            {/* Số lần thoát */}
            <div className="group/card relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-transparent to-transparent dark:from-rose-900/10 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                    <LogOut className="h-4 w-4" />
                  </div>
                  {exitCount && exitCount > 2 && (
                    <span className="text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
                      Nhiều
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">
                  {exitCount ?? 0}
                  <span className="text-base font-normal text-slate-400 dark:text-slate-500 ml-0.5">lần</span>
                </p>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Số lần thoát trang</p>
              </div>
            </div>

            {/* Điểm số - only shown when submitted */}
            {isSubmitted && (
              <div className="group/card relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-violet-50/50 to-transparent dark:from-indigo-900/10 dark:via-violet-900/10 pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 text-indigo-600 dark:text-indigo-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                      /10
                    </span>
                  </div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent tracking-[-0.02em]">
                    {submissionScore !== undefined && submissionScore !== null ? parseFloat(Number(submissionScore).toFixed(2)).toString().replace(".", ",") : "0"}
                    <span className="text-base font-normal text-slate-400 ml-0.5">đ</span>
                  </p>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Điểm số</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 📝 Tổng quan đúng/sai nếu đã nộp */}
      {isSubmitted && totalQuestions > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đúng: {correctCount}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <LogOut className="h-3.5 w-3.5 rotate-90" />
            Sai: {incorrectCount}
          </div>
          {unansweredCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/30 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-400 flex items-center justify-center text-[9px] font-bold">-</span>
              Chưa làm: {unansweredCount}
            </div>
          )}
        </div>
      )}

      {/* ✏️ Regrade Section */}
      {isSubmitted && submissionId && (
        <div className="relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 sm:p-5">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 via-transparent to-fuchsia-50/30 dark:from-violet-900/5 dark:via-transparent dark:to-fuchsia-900/5 pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-900/30 dark:to-fuchsia-900/30 text-violet-600 dark:text-violet-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Chấm điểm</p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Điều chỉnh điểm số cho từng câu hỏi</p>
              </div>
            </div>

            {!regradingMode ? (
              <button
                onClick={startRegrading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-bold text-white bg-gradient-to-r from-[#0066cc] to-[#0071e3] rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                <Edit3 className="h-4 w-4" />
                Chấm lại điểm
              </button>
            ) : (
              <RegradeModal
                isOpen={regradingMode}
                isRegrading={regrading}
                onSave={submitRegrade}
                onCancel={cancelRegrading}
              />
            )}
          </div>
          <RegradeInstruction show={regradingMode} />
        </div>
      )}

      {/* 📋 Danh sách câu hỏi */}
      <StudentAnswerReviewList
        questions={questions}
        isSubmitted={isSubmitted}
        regradingMode={regradingMode}
        regradeAnswers={regradeAnswers}
        onToggleAnswerCorrectness={toggleAnswerCorrectness}
        onSetAnswerPoints={setAnswerPoints}
        onSetSubQuestionAnswer={setSubQuestionAnswer}
      />
    </div>
  );
}
