import { useEffect, useState } from "react";
import { countActualQuestions } from "@/lib/utils";
import { formatDuration } from "@/lib/sessionTime";
import { RegradeModal, RegradeInstruction } from "@/components/RegradeControls";
import { StudentAnswerReviewList, type ReviewQuestion } from "./StudentAnswerReviewList";
import { CheckCircle2, Edit3, LogOut, RefreshCw, Target, Timer, TrendingUp, Zap } from "lucide-react";

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

  const [liveNow, setLiveNow] = useState(() => Date.now());

  useEffect(() => {
    if (isSubmitted || isPaused) return;

    const timer = setInterval(() => {
      setLiveNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, isPaused]);

  const answeredCountFromQuestions = questions.filter((q) => q.studentAnswer && q.type !== "section").length;
  const answeredCount = typeof answeredCountOverride === "number"
    ? answeredCountOverride
    : answeredCountFromQuestions;
  const totalQuestions = countActualQuestions(questions as any);
  const startedAtMs = new Date(startedAt).getTime();
  const pausedAtMs = pausedAt ? new Date(pausedAt).getTime() : NaN;
  const endTimeMs = isPaused && Number.isFinite(pausedAtMs) ? pausedAtMs : liveNow;
  const fallbackElapsedSeconds = Number.isNaN(startedAtMs)
    ? 0
    : Math.max(0, Math.floor((endTimeMs - startedAtMs) / 1000));
  const workSeconds = typeof durationSeconds === "number"
    ? Math.max(0, Math.floor(durationSeconds))
    : isSubmitted && submissionDurationSeconds != null
      ? Math.max(0, Math.floor(submissionDurationSeconds))
      : fallbackElapsedSeconds;
  const workTimeLabel = formatDuration(workSeconds);
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

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

  return (
    <div className="space-y-4">
      {!isSubmitted && (
        <div className="flex items-center gap-2 p-3 rounded-[2rem] bg-amber-50 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-800/30 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 rounded-full blur animate-pulse" />
              <Zap className="relative h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-[13px] text-amber-800 dark:text-amber-300 font-medium">⚡ Cập nhật theo thời gian thực - Học sinh đang làm bài</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="group relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 hover:shadow-lg transition-all duration-300">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white drop-shadow-sm tracking-[-0.01em]">{answeredCount}/{totalQuestions}</p>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Câu đã trả lời</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 hover:shadow-lg transition-all duration-300">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <LogOut className="h-5 w-5 text-rose-500" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white drop-shadow-sm tracking-[-0.01em]">{exitCount ?? 0}</p>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Số lần thoát</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 hover:shadow-lg transition-all duration-300">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Timer className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white drop-shadow-sm tracking-[-0.01em]">{workTimeLabel}</p>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Thời gian làm</p>
          </div>
        </div>

        {isSubmitted && (
          <div className="group relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 hover:shadow-lg transition-all duration-300">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white drop-shadow-sm tracking-[-0.01em]">{submissionScore ?? 0}đ</p>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Điểm số</p>
            </div>
          </div>
        )}

        <div className="group relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 hover:shadow-lg transition-all duration-300">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-5 w-5 text-[#0066cc]" />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white drop-shadow-sm tracking-[-0.01em]">{progress}%</p>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Tiến độ</p>
          </div>
        </div>
      </div>

      {isSubmitted && submissionId && (
        <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {!regradingMode ? (
              <button
                onClick={startRegrading}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-[15px] font-bold text-white bg-[#0066cc] rounded-full shadow-lg shadow-blue-500/20 hover:bg-[#005bb5] transition-all"
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
