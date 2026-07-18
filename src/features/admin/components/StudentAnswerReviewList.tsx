import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  FileCheck,
  XCircle,
  BookOpen,
  Lightbulb,
  HelpCircle,
  Zap,
} from "lucide-react";
import { MathText } from "@/components/MathText";

export interface ReviewQuestion {
  questionId: string;
  order: number;
  type: string;
  content: string;
  choices?: string[] | string;
  answerKey?: string;
  correctAnswer?: string;
  points: number;
  imageUrl?: string;
  studentAnswer: string | null;
  isCorrect: boolean | null;
  pointsAwarded?: number;
  subQuestions?: Array<{
    id: string;
    content: string;
    answerKey?: string;
    answer_key?: string;
  }>;
}

interface StudentAnswerReviewListProps {
  questions: ReviewQuestion[];
  isSubmitted: boolean;
  regradingMode?: boolean;
  regradeAnswers?: Map<string, { isCorrect?: boolean; pointsAwarded: number; subAnswers?: Record<string, boolean> }>;
  onToggleAnswerCorrectness?: (questionId: string, points: number) => void;
  onSetAnswerPoints?: (questionId: string, pointsAwarded: number, totalPoints: number) => void;
  onSetSubQuestionAnswer?: (questionId: string, subQuestionIndex: number, isCorrect: boolean, totalPoints: number, totalSubQuestions: number) => void;
}

function normalizeToIndex(value: unknown) {
  if (value == null) return -1;
  const normalized = String(value).trim().toUpperCase();
  if (!normalized) return -1;
  const first = normalized[0];
  if (first >= "A" && first <= "Z") return first.charCodeAt(0) - 65;
  const asNumber = Number(normalized);
  return Number.isFinite(asNumber) && asNumber > 0 ? Math.floor(asNumber - 1) : -1;
}

function sanitizeQuestionContent(content: string) {
  return content.replace(/\s*}\s*$/, "").trim();
}

function toMathRenderableText(content: string) {
  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function getQuestionTypeLabel(type: string): { label: string; colorClass: string } {
  switch (type) {
    case "mcq":
      return { label: "Trắc nghiệm", colorClass: "bg-blue-50 text-blue-600 border-blue-200" };
    case "true_false":
      return { label: "Đúng/Sai", colorClass: "bg-indigo-50 text-indigo-600 border-indigo-200" };
    case "essay":
      return { label: "Tự luận", colorClass: "bg-violet-50 text-violet-600 border-violet-200" };
    default:
      return { label: type, colorClass: "bg-slate-50 text-slate-600 border-slate-200" };
  }
}

const formatScore = (num: number | undefined | null) => {
  if (num == null) return "0";
  return parseFloat(num.toFixed(2)).toString().replace(".", ",");
};

function getScoreBadge(isCorrect: boolean | null, pointsAwarded: number | undefined, totalPoints: number) {
  const displayAwarded = formatScore(pointsAwarded);
  const displayTotal = formatScore(totalPoints);
  if (isCorrect === true) {
    return {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      icon: CheckCircle2,
      label: `Đúng · ${pointsAwarded !== undefined ? displayAwarded : displayTotal}/${displayTotal}đ`,
    };
  }
  if (isCorrect === false) {
    return {
      bg: "bg-rose-50 border-rose-200 text-rose-700",
      icon: XCircle,
      label: `Sai · ${displayAwarded}/${displayTotal}đ`,
    };
  }
  return {
    bg: "bg-slate-50 border-slate-200 text-slate-500",
    icon: HelpCircle,
    label: `Chưa chấm · 0/${displayTotal}đ`,
  };
}

export function StudentAnswerReviewList({
  questions,
  isSubmitted,
  regradingMode = false,
  regradeAnswers = new Map(),
  onToggleAnswerCorrectness,
  onSetAnswerPoints,
  onSetSubQuestionAnswer,
}: StudentAnswerReviewListProps) {
  let actualQuestionNumber = 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {questions && questions.length > 0 ? (
        questions.map((q) => {
          // ===== SECTION TYPE =====
          if (q.type === "section") {
            return (
              <div
                key={q.questionId}
                className="group relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0066cc] to-cyan-400" />
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50/40 via-transparent to-blue-50/40 dark:from-sky-900/10 dark:to-blue-900/10 pointer-events-none" />

                <div className="relative p-4 sm:p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-[#0066cc] to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Đoạn văn / Ghi chú
                          </span>
                          <span className="text-[13px] text-slate-400">•</span>
                          <span className="text-[14px] font-bold text-slate-600 dark:text-slate-300">
                            {q.points}đ
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 border border-sky-200 text-sky-600">
                        <Lightbulb className="h-3 w-3" />
                        <span>Thông tin</span>
                      </div>
                    </div>
                  </div>

                  {q.imageUrl && (
                    <div className="mb-3 rounded-2xl overflow-hidden border border-slate-200/50 shadow-sm">
                      <img
                        src={q.imageUrl}
                        alt="Question image"
                        className="max-h-48 w-full object-contain bg-slate-50 dark:bg-slate-900/50"
                      />
                    </div>
                  )}

                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                    <MathText text={q.content || ""} />
                  </div>
                </div>
              </div>
            );
          }

          // ===== REGULAR QUESTION =====
          const hasAnswer =
            q.studentAnswer !== undefined && q.studentAnswer !== null && q.studentAnswer !== "";
          const regradeAnswer = regradeAnswers.get(q.questionId);
          const displayIsCorrect = regradingMode
            ? regradeAnswer?.isCorrect ?? (q.isCorrect ?? false)
            : q.isCorrect ?? false;
          const displayPointsAwarded = regradingMode
            ? regradeAnswer?.pointsAwarded ?? (q.pointsAwarded ?? 0)
            : q.pointsAwarded ?? 0;
          const displayContent = toMathRenderableText(sanitizeQuestionContent(q.content || ""));
          actualQuestionNumber += 1;
          const questionNumber = actualQuestionNumber;

          const typeInfo = getQuestionTypeLabel(q.type);

          // Determine top bar color
          const topBarColor = hasAnswer
            ? isSubmitted && displayIsCorrect
              ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
              : isSubmitted && !displayIsCorrect
              ? "bg-gradient-to-r from-rose-400 to-rose-500"
              : "bg-gradient-to-r from-[#0066cc] to-blue-400"
            : "bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600";

          // Question number circle color
          const numberCircleColor = hasAnswer
            ? isSubmitted && displayIsCorrect
              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30"
              : isSubmitted && !displayIsCorrect
              ? "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/30"
              : "bg-gradient-to-br from-[#0066cc] to-blue-500 text-white shadow-blue-500/20"
            : "bg-slate-300 dark:bg-slate-600 text-white shadow-slate-400/30";

          const scoreBadge = getScoreBadge(displayIsCorrect, displayPointsAwarded, q.points);

          return (
            <div
              key={q.questionId}
              className="group relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${topBarColor}`} />

              <div className="relative p-4 sm:p-5">
                {/* Header: Question number + Type + Score */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex items-center justify-center h-8 w-8 rounded-xl font-bold text-[14px] shadow-lg ${numberCircleColor}`}
                    >
                      {questionNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeInfo.colorClass}`}
                        >
                          {typeInfo.label}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                          {q.points}đ
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSubmitted && hasAnswer && (
                      <>
                        {regradingMode && onToggleAnswerCorrectness ? (
                          <button
                            onClick={() => onToggleAnswerCorrectness(q.questionId, q.points)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-all duration-200 ${
                              displayIsCorrect
                                ? "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-emerald-300/20"
                                : "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 shadow-rose-300/20"
                            }`}
                          >
                            {displayIsCorrect ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            <span>
                              {displayIsCorrect ? "Đúng" : "Sai"} · {formatScore(displayPointsAwarded)}/{formatScore(q.points)}đ
                            </span>
                          </button>
                        ) : (
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${scoreBadge.bg}`}
                          >
                            <scoreBadge.icon className="h-3.5 w-3.5" />
                            <span>{scoreBadge.label}</span>
                          </div>
                        )}
                      </>
                    )}

                    {!isSubmitted && q.type === "mcq" && q.studentAnswer && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700 shadow-md">
                        <Zap className="h-3.5 w-3.5" />
                        {q.isCorrect ? "Đúng (tạm)" : "Sai (tạm)"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Question image */}
                {q.imageUrl && (
                  <div className="mb-3 rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                    <img
                      src={q.imageUrl}
                      alt="Question image"
                      className="max-h-48 w-full object-contain bg-slate-50 dark:bg-slate-900/50"
                    />
                  </div>
                )}

                {/* Question content */}
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                  <MathText text={displayContent} />
                </div>

                {/* ===== MCQ TYPE ===== */}
                {q.type === "mcq" ? (
                  <div className="space-y-2.5">
                    {(() => {
                      const parsedChoices = Array.isArray(q.choices)
                        ? q.choices
                        : (() => {
                            if (typeof q.choices !== "string") return [];
                            try {
                              const parsed = JSON.parse(q.choices);
                              return Array.isArray(parsed) ? parsed : [];
                            } catch {
                              return [];
                            }
                          })();

                      const selectedIndex = normalizeToIndex(q.studentAnswer);
                      const keyIndex = normalizeToIndex(q.correctAnswer || q.answerKey);
                      const maxIndex = Math.max(parsedChoices.length - 1, selectedIndex, keyIndex, 3);
                      const optionIndexes = Array.from({ length: maxIndex + 1 }, (_, i) => i);
                      const selectedLabel = selectedIndex >= 0 ? String.fromCharCode(65 + selectedIndex) : "-";
                      const keyLabel = keyIndex >= 0 ? String.fromCharCode(65 + keyIndex) : "-";

                      return (
                        <>
                          {/* Student answer vs Key */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                            <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/80 dark:bg-blue-900/20 dark:border-blue-800/30 px-3 py-2.5">
                              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                <FileCheck className="h-3 w-3 inline mr-1" />
                                Lựa chọn HS
                              </span>
                              <span className="inline-flex items-center rounded-full border border-blue-300 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/40 px-2.5 py-1 text-xs font-bold text-blue-800 dark:text-blue-300">
                                {selectedLabel}
                              </span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-900/20 dark:border-emerald-800/30 px-3 py-2.5">
                              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="h-3 w-3 inline mr-1" />
                                Đáp án đúng
                              </span>
                              <span className="inline-flex items-center rounded-full border border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                {keyLabel}
                              </span>
                            </div>
                          </div>

                          {/* Options list */}
                          <div className="space-y-2">
                            {optionIndexes.map((i) => {
                              const optionLabel = String.fromCharCode(65 + i);
                              const isSelected = i === selectedIndex;
                              const isKey = i === keyIndex;
                              const content =
                                typeof parsedChoices[i] === "string"
                                  ? toMathRenderableText(parsedChoices[i])
                                  : "";

                              return (
                                <div
                                  key={i}
                                  className={`rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 ${
                                    isSelected && isKey
                                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 shadow-sm"
                                      : isSelected
                                      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 shadow-sm"
                                      : isKey
                                      ? "border-emerald-300 bg-emerald-50/70 dark:bg-emerald-900/10 dark:border-emerald-700/50"
                                      : "border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2.5">
                                    <div className="min-w-0 flex items-start gap-2.5">
                                      <span
                                        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                                          isSelected && isKey
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : isSelected
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : isKey
                                            ? "bg-emerald-200 dark:bg-emerald-700 text-emerald-700 dark:text-emerald-200"
                                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                        }`}
                                      >
                                        {optionLabel}
                                      </span>
                                      <span className="break-words text-slate-700 dark:text-slate-300">
                                        {content ? (
                                          <MathText text={content} />
                                        ) : (
                                          <span className="italic opacity-60">(Không có nội dung)</span>
                                        )}
                                      </span>
                                    </div>

                                    <div className="shrink-0 flex flex-col items-end gap-1">
                                      {isSelected && (
                                        <span className="rounded-full border border-blue-300 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:text-blue-300">
                                          HS chọn
                                        </span>
                                      )}
                                      {isKey && (
                                        <span className="rounded-full border border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                                          Đáp án
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}

                    {/* Regrade controls for MCQ */}
                    {regradingMode && onSetAnswerPoints && (
                      <div className="mt-4 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200/50 dark:border-violet-800/30">
                        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider mb-3">
                          Chấm lại câu trắc nghiệm
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSetAnswerPoints(q.questionId, q.points, q.points)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              regradeAnswer?.pointsAwarded === q.points
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30"
                                : "bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            }`}
                          >
                            ✓ Đúng ({q.points}đ)
                          </button>
                          <button
                            onClick={() => onSetAnswerPoints(q.questionId, 0, q.points)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              regradeAnswer?.pointsAwarded === 0
                                ? "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-md shadow-rose-500/30"
                                : "bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            }`}
                          >
                            ✗ Sai (0đ)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : q.type === "true_false" ? (
                  /* ===== TRUE/FALSE TYPE ===== */
                  <div className="space-y-2.5 mt-3">
                    {q.subQuestions?.map((sq, i) => {
                      const stuAnsObj = (() => {
                        try {
                          return JSON.parse(q.studentAnswer || "{}");
                        } catch {
                          return {};
                        }
                      })();
                      const isStuTrue = stuAnsObj[sq.id] === "true";
                      const isStuFalse = stuAnsObj[sq.id] === "false";
                      const isKeyTrue = sq.answerKey === "true" || sq.answer_key === "true";
                      const isKeyFalse = sq.answerKey === "false" || sq.answer_key === "false";

                      const isCorrectSub = (isStuTrue && isKeyTrue) || (isStuFalse && isKeyFalse);
                      const isIncorrectSub = (isStuTrue && isKeyFalse) || (isStuFalse && isKeyTrue);

                      return (
                        <div
                          key={sq.id}
                          className="p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <span className="font-semibold text-slate-400 dark:text-slate-500">
                                  {String.fromCharCode(97 + i)}.
                                </span>
                                <span>
                                  <MathText text={toMathRenderableText(sq.content || "")} />
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                    isCorrectSub
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
                                      : isIncorrectSub
                                      ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300"
                                      : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                  }`}
                                >
                                  HS chọn: {isStuTrue ? "Đúng" : isStuFalse ? "Sai" : "-"}
                                </span>
                                <span className="rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                  Đáp án: {isKeyTrue ? "Đúng" : isKeyFalse ? "Sai" : "-"}
                                </span>
                              </div>
                            </div>

                            {/* Regrade toggle buttons */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {regradingMode && onSetSubQuestionAnswer ? (
                                <>
                                  <button
                                    onClick={() =>
                                      onSetSubQuestionAnswer(
                                        q.questionId,
                                        i,
                                        true,
                                        q.points,
                                        q.subQuestions?.length || 0
                                      )
                                    }
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                                      regradeAnswer?.subAnswers?.[i.toString()] === true
                                        ? "bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-200 dark:ring-emerald-700/50 shadow-md"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                    }`}
                                  >
                                    Đúng
                                  </button>
                                  <button
                                    onClick={() =>
                                      onSetSubQuestionAnswer(
                                        q.questionId,
                                        i,
                                        false,
                                        q.points,
                                        q.subQuestions?.length || 0
                                      )
                                    }
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                                      regradeAnswer?.subAnswers?.[i.toString()] === false
                                        ? "bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300 ring-2 ring-rose-200 dark:ring-rose-700/50 shadow-md"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                    }`}
                                  >
                                    Sai
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                                      isCorrectSub
                                        ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-200 dark:ring-emerald-700/50 shadow-md"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                    }`}
                                  >
                                    Đúng
                                  </span>
                                  <span
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                                      isIncorrectSub
                                        ? "bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 ring-2 ring-rose-200 dark:ring-rose-700/50 shadow-md"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                    }`}
                                  >
                                    Sai
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : q.type !== "mcq" && q.studentAnswer ? (
                  /* ===== ESSAY TYPE ===== */
                  <div className="mt-3 space-y-2.5">
                    <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border border-indigo-200/50 dark:border-indigo-800/30">
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <FileCheck className="h-3.5 w-3.5" />
                        Câu trả lời của học sinh
                      </p>
                      <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed bg-white/50 dark:bg-slate-900/30 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-800/20">
                        <MathText text={toMathRenderableText(q.studentAnswer || "")} />
                      </p>
                    </div>

                    {regradingMode && onSetAnswerPoints && (
                      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/30">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-3">
                          Chấm lại câu tự luận
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={q.points}
                            step="0.5"
                            value={regradeAnswer?.pointsAwarded ?? 0}
                            onChange={(e) =>
                              onSetAnswerPoints(q.questionId, parseFloat(e.target.value) || 0, q.points)
                            }
                            className="flex-1 max-w-[120px] px-3 py-2 text-sm font-semibold border border-amber-300 dark:border-amber-700 rounded-xl bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 transition-all"
                          />
                          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                            / {formatScore(q.points)}đ
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ===== UNANSWERED ===== */
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
                        <AlertCircle className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 italic font-medium">
                        Học sinh chưa trả lời câu hỏi này
                      </span>
                    </div>

                    {isSubmitted && regradingMode && onSetAnswerPoints && (
                      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/30">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-3">
                          Chấm câu chưa làm
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={q.points}
                            step="0.5"
                            value={regradeAnswer?.pointsAwarded ?? 0}
                            onChange={(e) =>
                              onSetAnswerPoints(q.questionId, parseFloat(e.target.value) || 0, q.points)
                            }
                            className="flex-1 max-w-[120px] px-3 py-2 text-sm font-semibold border border-amber-300 dark:border-amber-700 rounded-xl bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-200 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 transition-all"
                          />
                          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                            / {formatScore(q.points)}đ
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="relative overflow-hidden rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-10">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="font-medium text-sm text-slate-500 dark:text-slate-400">
              Chưa tải được danh sách câu hỏi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


