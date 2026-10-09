"use client";

import { useState, useMemo } from "react";
import clsx from "clsx";
import { 
  ChevronDown, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileCheck, 
  HelpCircle,
  ChevronsUpDown,
  Filter
} from "lucide-react";
import { MathText } from "@/components/MathText";

export function getStudentSubChoice(
  studentAnswer: string | null | undefined,
  sq: { id?: string | number; order?: number } | undefined,
  index: number
): "true" | "false" | null {
  if (!studentAnswer) return null;
  let parsed: Record<string, unknown> | null = null;
  if (typeof studentAnswer === "object") {
    parsed = studentAnswer as Record<string, unknown>;
  } else {
    try {
      parsed = JSON.parse(studentAnswer);
    } catch {
      return null;
    }
  }
  if (!parsed) return null;

  const normalizeVal = (val: unknown): "true" | "false" | null => {
    if (val === true || val === "true" || val === "T" || val === "Đúng" || val === "dung" || val === 1 || val === "1") return "true";
    if (val === false || val === "false" || val === "F" || val === "Sai" || val === "sai" || val === 0 || val === "0") return "false";
    return null;
  };

  // Case 1: Array of answers [ "true", "false", ... ]
  if (Array.isArray(parsed)) {
    if (index >= 0 && index < parsed.length) {
      const res = normalizeVal(parsed[index]);
      if (res !== null) return res;
    }
    return null;
  }

  if (typeof parsed !== "object") return null;

  // Case 2: Exact sq.id match (e.g. UUID or specific string ID)
  if (sq?.id !== undefined && sq?.id !== null) {
    const rawId = String(sq.id);
    if (rawId in parsed) {
      const res = normalizeVal(parsed[rawId]);
      if (res !== null) return res;
    }
  }

  // Case 3: Letter match ('a', 'b', 'c', 'd' or 'A', 'B', 'C', 'D')
  const lowerLetter = String.fromCharCode(97 + index);
  const upperLetter = String.fromCharCode(65 + index);
  if (lowerLetter in parsed) {
    const res = normalizeVal(parsed[lowerLetter]);
    if (res !== null) return res;
  }
  if (upperLetter in parsed) {
    const res = normalizeVal(parsed[upperLetter]);
    if (res !== null) return res;
  }

  // Case 4: Numeric / order keys detection
  const keys = Object.keys(parsed);
  const hasZero = keys.includes("0");
  const hasOne = keys.includes("1");

  if (hasZero) {
    // 0-based indexed: 0, 1, 2, 3
    const keyStr = String(index);
    if (keyStr in parsed) {
      const res = normalizeVal(parsed[keyStr]);
      if (res !== null) return res;
    }
  } else if (hasOne) {
    // 1-based indexed: 1, 2, 3, 4
    const orderKey = String(sq?.order ?? (index + 1));
    if (orderKey in parsed) {
      const res = normalizeVal(parsed[orderKey]);
      if (res !== null) return res;
    }
  } else if (sq?.order !== undefined && sq?.order !== null) {
    const orderKey = String(sq.order);
    if (orderKey in parsed) {
      const res = normalizeVal(parsed[orderKey]);
      if (res !== null) return res;
    }
  }

  // Fallback: Check index or order if not already checked
  if (String(index) in parsed) {
    const res = normalizeVal(parsed[String(index)]);
    if (res !== null) return res;
  }
  if (String(index + 1) in parsed) {
    const res = normalizeVal(parsed[String(index + 1)]);
    if (res !== null) return res;
  }

  return null;
}

export function getSubAnswerKey(
  sq?: { answerKey?: string | boolean; answer_key?: string | boolean } | null
): "true" | "false" | null {
  if (!sq) return null;
  const rawKey = sq.answerKey ?? sq.answer_key;
  if (rawKey === true || rawKey === "true" || rawKey === "T" || rawKey === "Đúng" || rawKey === "dung") return "true";
  if (rawKey === false || rawKey === "false" || rawKey === "F" || rawKey === "Sai" || rawKey === "sai") return "false";
  return null;
}

function toMathRenderableText(content: string) {
  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();
}

type FilterType = "all" | "correct" | "incorrect" | "unanswered";

export function ResultQuestionsAccordion({ 
  questions, 
  answers, 
  isScoreHidden 
}: { 
  questions: any[]; 
  answers: any[]; 
  isScoreHidden: boolean;
}) {
  const actualQuestions = useMemo(() => questions?.filter((q) => q.type !== "section") || [], [questions]);
  const answerMap = useMemo(() => new Map(answers?.map((a) => [a.question_id, a]) || []), [answers]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return new Set(actualQuestions.map((q) => q.id));
  });

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const toggleAll = () => {
    if (expandedIds.size === actualQuestions.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(actualQuestions.map((q) => q.id)));
    }
  };

  const formatPoints = (value: number | null | undefined) => {
    if (value == null) return "0";
    return parseFloat(Number(value).toFixed(2)).toString().replace(".", ",");
  };

  const isQuestionUnanswered = (q: any, answer: any) => {
    if (!answer || !answer.answer) return true;
    const trimmed = String(answer.answer).trim();
    if (trimmed === "") return true;
    if (q.type === "true_false") {
      try {
        const studentTf = typeof answer.answer === "string" ? JSON.parse(trimmed) : answer.answer;
        return !studentTf || Object.keys(studentTf).length === 0;
      } catch {
        return true;
      }
    }
    return false;
  };

  // Phân loại câu hỏi để phục vụ bộ lọc
  const filteredQuestions = useMemo(() => {
    return actualQuestions.filter((q) => {
      const answer = answerMap.get(q.id);
      const isUnanswered = isQuestionUnanswered(q, answer);

      if (activeFilter === "all") return true;
      if (activeFilter === "unanswered") return isUnanswered;

      let isCorrect = answer?.is_correct;
      if (isCorrect === null && q.type === "short_answer") {
        isCorrect = answer?.points_awarded === q.points;
      }

      if (activeFilter === "correct") return !isUnanswered && isCorrect === true;
      if (activeFilter === "incorrect") return !isUnanswered && isCorrect === false;
      return true;
    });
  }, [actualQuestions, answerMap, activeFilter]);

  // Đếm số lượng theo trạng thái
  const counts = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    actualQuestions.forEach((q) => {
      const answer = answerMap.get(q.id);
      if (isQuestionUnanswered(q, answer)) {
        unanswered++;
        return;
      }
      let isCorrect = answer?.is_correct;
      if (isCorrect === null && q.type === "short_answer") {
        isCorrect = answer?.points_awarded === q.points;
      }
      if (isCorrect === true) correct++;
      else if (isCorrect === false) incorrect++;
    });

    return { all: actualQuestions.length, correct, incorrect, unanswered };
  }, [actualQuestions, answerMap]);

  if (isScoreHidden) {
    return (
      <div className="rounded-[2rem] border border-amber-200/50 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/10 p-8 sm:p-10 text-center backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-8 w-8" />
          </div>
        </div>
        <p className="text-xl font-bold text-amber-900 dark:text-amber-200 tracking-[-0.01em]">Bài đã nộp thành công!</p>
        <p className="text-[15px] text-amber-700/80 dark:text-amber-400/80 mt-1.5 max-w-md mx-auto">
          Điểm số và đáp án chi tiết chưa được công bố. Giáo viên sẽ mở kết quả sau khi hoàn tất chấm bài.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thanh công cụ lọc & Thu gọn/Mở rộng */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-[2rem] bg-white/60 dark:bg-[#1d1d1f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 scrollbar-none">
          <button
            onClick={() => setActiveFilter("all")}
            className={clsx(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap",
              activeFilter === "all"
                ? "bg-[#0066cc] text-white shadow-md shadow-blue-500/25"
                : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <span>Tất cả</span>
            <span className={clsx(
              "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
              activeFilter === "all" ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400"
            )}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("correct")}
            className={clsx(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap",
              activeFilter === "correct"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
                : "bg-transparent text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Đúng</span>
            <span className={clsx(
              "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
              activeFilter === "correct" ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300"
            )}>
              {counts.correct}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("incorrect")}
            className={clsx(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap",
              activeFilter === "incorrect"
                ? "bg-rose-600 text-white shadow-md shadow-rose-500/25"
                : "bg-transparent text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            )}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Sai</span>
            <span className={clsx(
              "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
              activeFilter === "incorrect" ? "bg-white/20 text-white" : "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300"
            )}>
              {counts.incorrect}
            </span>
          </button>

          {counts.unanswered > 0 && (
            <button
              onClick={() => setActiveFilter("unanswered")}
              className={clsx(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap",
                activeFilter === "unanswered"
                  ? "bg-slate-700 text-white shadow-md shadow-slate-500/25 dark:bg-slate-300 dark:text-slate-900"
                  : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Chưa làm</span>
              <span className={clsx(
                "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                activeFilter === "unanswered" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              )}>
                {counts.unanswered}
              </span>
            </button>
          )}
        </div>

        {/* Toggle All Button */}
        <button
          onClick={toggleAll}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#0066cc] dark:hover:text-blue-400 hover:bg-black/5 dark:hover:bg-white/5 transition-all self-end sm:self-auto"
        >
          <ChevronsUpDown className="h-4 w-4" />
          <span>{expandedIds.size === actualQuestions.length ? "Thu gọn tất cả" : "Mở rộng tất cả"}</span>
        </button>
      </div>

      {/* Danh sách các câu hỏi */}
      {filteredQuestions.length === 0 ? (
        <div className="rounded-[2rem] bg-white/70 dark:bg-[#1d1d1f]/70 backdrop-blur-xl border border-black/5 dark:border-white/5 p-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <Filter className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Không có câu hỏi nào thuộc phân loại này.
          </p>
        </div>
      ) : (
        filteredQuestions.map((q) => {
          const originalIdx = actualQuestions.findIndex((aq) => aq.id === q.id);
          const questionNumber = originalIdx >= 0 ? originalIdx + 1 : 1;
          const answer = answerMap.get(q.id);
          const isUnanswered = isQuestionUnanswered(q, answer);

          let isCorrect = answer?.is_correct;
          if (isCorrect === null && q.type === "short_answer") {
            isCorrect = answer?.points_awarded === q.points;
          }

          const studentAnswer = answer?.answer;
          const isExpanded = expandedIds.has(q.id);
          const imgUrl = q.image_url || q.imageUrl;

          // Xác định màu sắc chỉ báo
          let statusTheme = {
            border: "border-black/5 dark:border-white/5",
            badgeBg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
            statusLabel: "Chưa trả lời",
            statusColor: "text-slate-500 dark:text-slate-400",
            icon: AlertCircle,
          };

          if (!isUnanswered) {
            if (isCorrect === true) {
              statusTheme = {
                border: "border-emerald-200/80 dark:border-emerald-500/30",
                badgeBg: "bg-emerald-500 text-white shadow-emerald-500/20",
                statusLabel: "Trả lời đúng",
                statusColor: "text-emerald-600 dark:text-emerald-400",
                icon: CheckCircle2,
              };
            } else if (isCorrect === false) {
              statusTheme = {
                border: "border-rose-200/80 dark:border-rose-500/30",
                badgeBg: "bg-rose-500 text-white shadow-rose-500/20",
                statusLabel: "Trả lời sai",
                statusColor: "text-rose-600 dark:text-rose-400",
                icon: XCircle,
              };
            }
          }

          return (
            <div
              key={q.id}
              className={clsx(
                "rounded-[1.75rem] border transition-all duration-300 overflow-hidden backdrop-blur-xl",
                statusTheme.border,
                isExpanded 
                  ? "bg-white/90 dark:bg-[#1d1d1f]/90 shadow-[0_8px_30px_rgba(0,0,0,0.04)]" 
                  : "bg-white/70 dark:bg-[#1d1d1f]/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-[#0066cc]/30"
              )}
            >
              {/* Header (Accordion Trigger) */}
              <button
                type="button"
                onClick={() => toggleExpand(q.id)}
                className="w-full flex items-center justify-between gap-3.5 p-4 sm:p-5 text-left focus:outline-none transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Số câu hỏi hình tròn Liquid Glass */}
                  <span
                    className={clsx(
                      "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl text-xs sm:text-sm font-black shrink-0 shadow-sm transition-all duration-300",
                      statusTheme.badgeBg
                    )}
                  >
                    {questionNumber}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Câu {questionNumber}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                        {q.type === "mcq"
                          ? "Trắc nghiệm"
                          : q.type === "true_false"
                          ? "Đúng/Sai"
                          : q.type === "short_answer"
                          ? "Trả lời ngắn"
                          : q.type === "essay"
                          ? "Tự luận"
                          : "Đọc hiểu"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <p className={clsx("text-sm sm:text-[15px] font-bold tracking-[-0.01em]", statusTheme.statusColor)}>
                        {statusTheme.statusLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                  {/* Điểm số */}
                  <span className="rounded-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <strong className={clsx(isCorrect ? "text-emerald-600 dark:text-emerald-400" : "")}>
                      {formatPoints(answer?.points_awarded)}
                    </strong>
                    <span className="text-slate-400">/{formatPoints(q.points)}đ</span>
                  </span>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-slate-500">
                    <ChevronDown
                      className={clsx(
                        "h-4 w-4 transition-transform duration-300",
                        isExpanded && "rotate-180 text-slate-900 dark:text-white"
                      )}
                    />
                  </div>
                </div>
              </button>

              {/* Nội dung chi tiết (Accordion Body) */}
              <div
                className={clsx(
                  "grid transition-all duration-300 ease-in-out",
                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="p-4 sm:p-6 pt-0 border-t border-black/5 dark:border-white/5 mt-1 space-y-4">
                    {/* Hình ảnh đính kèm (nếu có) */}
                    {imgUrl && (
                      <div className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 shadow-sm mt-4 bg-slate-50 dark:bg-slate-900/50">
                        <img
                          src={imgUrl}
                          alt={`Câu hỏi ${questionNumber}`}
                          className="max-h-72 w-auto object-contain mx-auto"
                        />
                      </div>
                    )}

                    {/* Nội dung câu hỏi */}
                    {q.content && (
                      <div className="text-[15px] font-medium text-slate-800 dark:text-slate-200 leading-relaxed mt-4">
                        <MathText text={toMathRenderableText(q.content)} />
                      </div>
                    )}

                    {/* ===== CÂU HỎI TRẮC NGHIỆM (MCQ) ===== */}
                    {q.type === "mcq" && (() => {
                      const parsedChoices = Array.isArray(q.choices)
                        ? q.choices
                        : (() => {
                            try {
                              return JSON.parse(q.choices);
                            } catch {
                              return [];
                            }
                          })();

                      const normalizeToIndex = (value: unknown) => {
                        if (value == null) return -1;
                        const normalized = String(value).trim().toUpperCase();
                        if (!normalized) return -1;
                        const first = normalized[0];
                        if (first >= "A" && first <= "Z") return first.charCodeAt(0) - 65;
                        return -1;
                      };

                      const selectedIndex = normalizeToIndex(studentAnswer);
                      const keyIndex = normalizeToIndex(q.answer_key || q.answerKey);

                      const maxIndex = Math.max(parsedChoices.length - 1, selectedIndex, keyIndex, 3);
                      const optionIndexes = Array.from({ length: maxIndex + 1 }, (_, i) => i);

                      return (
                        <div className="space-y-2.5 mt-3">
                          {optionIndexes.map((ci) => {
                            const choiceLabel = String.fromCharCode(65 + ci);
                            const choice = typeof parsedChoices[ci] === "string" ? parsedChoices[ci] : "";
                            const isStudentChoice = ci === selectedIndex;
                            const isCorrectAnswer = ci === keyIndex;

                            return (
                              <div
                                key={ci}
                                className={clsx(
                                  "flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-sm transition-all duration-200",
                                  isCorrectAnswer && isStudentChoice
                                    ? "border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/20 dark:border-emerald-700/60 shadow-sm"
                                    : isCorrectAnswer
                                    ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-800/40"
                                    : isStudentChoice
                                    ? "border-rose-400 bg-rose-50/80 dark:bg-rose-950/20 dark:border-rose-700/60 shadow-sm"
                                    : "border-black/5 dark:border-white/5 bg-slate-50/60 dark:bg-[#1d1d1f]/40 text-slate-700 dark:text-slate-300"
                                )}
                              >
                                <div className="flex items-start gap-3 min-w-0 flex-1 max-w-full overflow-hidden">
                                  <span
                                    className={clsx(
                                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors mt-0.5",
                                      isCorrectAnswer
                                        ? "bg-emerald-600 text-white"
                                        : isStudentChoice
                                        ? "bg-rose-600 text-white"
                                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                    )}
                                  >
                                    {choiceLabel}
                                  </span>

                                  <div className="flex-1 min-w-0 max-w-full leading-relaxed break-words [overflow-wrap:anywhere] text-slate-800 dark:text-slate-200 [&_.katex]:max-w-full [&_.katex-display]:max-w-full [&_.katex-display]:overflow-x-auto">
                                    {choice ? (
                                      <MathText text={toMathRenderableText(choice)} />
                                    ) : (
                                      <span className="italic text-slate-400 dark:text-slate-500">(Không có nội dung)</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isStudentChoice && (
                                    <span
                                      className={clsx(
                                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                                        isCorrectAnswer
                                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                                          : "bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                                      )}
                                    >
                                      Bạn chọn
                                    </span>
                                  )}
                                  {isCorrectAnswer && (
                                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                      Đáp án đúng
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* ===== CÂU HỎI ĐÚNG / SAI (TRUE_FALSE) ===== */}
                    {q.type === "true_false" && (() => {
                      const subQs = (q.sub_questions || q.subQuestions || []) as Array<{
                        id: string;
                        content: string;
                        answerKey?: string;
                        answer_key?: string;
                        order?: number;
                      }>;

                      return subQs.length > 0 ? (
                        <div className="space-y-3 mt-3">
                          {subQs.map((sq, si) => {
                            const studentChoice = getStudentSubChoice(studentAnswer, sq, si);
                            const keyChoice = getSubAnswerKey(sq);
                            const hasChoice = studentChoice !== null;
                            const isSubCorrect = hasChoice && keyChoice !== null && studentChoice === keyChoice;

                            const isStuTrue = studentChoice === "true";
                            const isStuFalse = studentChoice === "false";
                            const isKeyTrue = keyChoice === "true";
                            const isKeyFalse = keyChoice === "false";

                            return (
                              <div
                                key={sq.id || si}
                                className={clsx(
                                  "rounded-2xl border p-4 transition-all duration-200",
                                  hasChoice
                                    ? isSubCorrect
                                      ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800/40 dark:bg-emerald-950/10"
                                      : "border-rose-200 bg-rose-50/40 dark:border-rose-800/40 dark:bg-rose-950/10"
                                    : "border-black/5 bg-slate-50/60 dark:border-white/5 dark:bg-[#1d1d1f]/40"
                                )}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  {/* Mệnh đề */}
                                  <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-start gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                                      <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                        {String.fromCharCode(97 + si)}
                                      </span>
                                      <span className="break-words pt-0.5">
                                        <MathText text={toMathRenderableText(sq.content || "")} />
                                      </span>
                                    </div>

                                    {/* Badges thông tin */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                      <span
                                        className={clsx(
                                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                                          hasChoice
                                            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                                            : "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                        )}
                                      >
                                        <FileCheck className="h-3 w-3" />
                                        Bạn chọn: <strong className="font-bold">{isStuTrue ? "Đúng" : isStuFalse ? "Sai" : "Chưa làm"}</strong>
                                      </span>

                                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/80 dark:bg-indigo-900/20 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                                        <CheckCircle2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                                        Đáp án: <strong className="font-bold">{isKeyTrue ? "Đúng" : isKeyFalse ? "Sai" : "-"}</strong>
                                      </span>

                                      {hasChoice && keyChoice !== null && (
                                        <span
                                          className={clsx(
                                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                                            isSubCorrect
                                              ? "bg-emerald-100/80 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-200"
                                              : "bg-rose-100/80 border-rose-300 text-rose-800 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-200"
                                          )}
                                        >
                                          {isSubCorrect ? (
                                            <>
                                              <CheckCircle2 className="h-3 w-3" />
                                              Đúng
                                            </>
                                          ) : (
                                            <>
                                              <XCircle className="h-3 w-3" />
                                              Sai
                                            </>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Hai nút [Đúng] [Sai] trực quan */}
                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    {/* Nút Đúng */}
                                    <div
                                      className={clsx(
                                        "relative flex items-center justify-center min-w-[76px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all border",
                                        isStuTrue && isKeyTrue
                                          ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/50"
                                          : isStuTrue && keyChoice !== null && !isKeyTrue
                                          ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/25 ring-2 ring-rose-400/50"
                                          : !isStuTrue && isKeyTrue
                                          ? "bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-2 border-dashed border-emerald-400 dark:border-emerald-600"
                                          : isStuTrue
                                          ? "bg-[#0066cc] text-white border-[#0066cc] shadow-md shadow-blue-500/25"
                                          : "bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60"
                                      )}
                                    >
                                      <span>Đúng</span>
                                      {isStuTrue && isKeyTrue && (
                                        <span className="absolute -top-2.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-600 text-white border border-white shadow-sm whitespace-nowrap">
                                          Bạn chọn • ✓
                                        </span>
                                      )}
                                      {isStuTrue && keyChoice !== null && !isKeyTrue && (
                                        <span className="absolute -top-2.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-700 text-white border border-white shadow-sm whitespace-nowrap">
                                          Bạn chọn • ✗
                                        </span>
                                      )}
                                      {!isStuTrue && isKeyTrue && (
                                        <span className="absolute -top-2.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white border border-white shadow-sm whitespace-nowrap">
                                          Đáp án
                                        </span>
                                      )}
                                      {isStuTrue && keyChoice === null && (
                                        <span className="absolute -top-2.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-600 text-white border border-white shadow-sm whitespace-nowrap">
                                          Bạn chọn
                                        </span>
                                      )}
                                    </div>

                                    {/* Nút Sai */}
                                    <div
                                      className={clsx(
                                        "relative flex items-center justify-center min-w-[76px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all border",
                                        isStuFalse && isKeyFalse
                                          ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/50"
                                          : isStuFalse && keyChoice !== null && !isKeyFalse
                                          ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/25 ring-2 ring-rose-400/50"
                                          : !isStuFalse && isKeyFalse
                                          ? "bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-2 border-dashed border-emerald-400 dark:border-emerald-600"
                                          : isStuFalse
                                          ? "bg-[#0066cc] text-white border-[#0066cc] shadow-md shadow-blue-500/25"
                                          : "bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60"
                                      )}
                                    >
                                      <span>Sai</span>
                                      {isStuFalse && isKeyFalse && (
                                        <span className="absolute -top-2.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-600 text-white border border-white shadow-sm whitespace-nowrap">
                                          Bạn chọn • ✓
                                        </span>
                                      )}
                                      {isStuFalse && keyChoice !== null && !isKeyFalse && (
                                        <span className="absolute -top-2.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-700 text-white border border-white shadow-sm whitespace-nowrap">
                                          Bạn chọn • ✗
                                        </span>
                                      )}
                                      {!isStuFalse && isKeyFalse && (
                                        <span className="absolute -top-2.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white border border-white shadow-sm whitespace-nowrap">
                                          Đáp án
                                        </span>
                                      )}
                                      {isStuFalse && keyChoice === null && (
                                        <span className="absolute -top-2.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-600 text-white border border-white shadow-sm whitespace-nowrap">
                                          Bạn chọn
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null;
                    })()}

                    {/* ===== CÂU HỎI TRẢ LỜI NGẮN (SHORT_ANSWER) ===== */}
                    {q.type === "short_answer" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div
                          className={clsx(
                            "rounded-2xl border p-4",
                            isCorrect
                              ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/30 dark:bg-emerald-950/20"
                              : "border-rose-200 bg-rose-50/50 dark:border-rose-800/30 dark:bg-rose-950/20"
                          )}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                            Câu trả lời của bạn:
                          </span>
                          <span
                            className={clsx(
                              "font-bold text-[15px]",
                              isCorrect
                                ? "text-emerald-900 dark:text-emerald-200"
                                : "text-rose-900 dark:text-rose-200"
                            )}
                          >
                            {studentAnswer ? (
                              <MathText text={toMathRenderableText(studentAnswer)} />
                            ) : (
                              <em className="text-slate-400 font-normal">Chưa trả lời</em>
                            )}
                          </span>
                        </div>

                        {!isCorrect && (q.answer_key || q.answerKey) && (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/30 dark:bg-emerald-950/20 p-4">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                              Đáp án chính xác:
                            </span>
                            <span className="font-bold text-[15px] text-emerald-900 dark:text-emerald-200">
                              <MathText text={toMathRenderableText(String(q.answer_key || q.answerKey))} />
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ===== CÂU HỎI TỰ LUẬN (ESSAY) ===== */}
                    {q.type === "essay" && (
                      <div className="space-y-3 mt-3">
                        <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-[15px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {studentAnswer ? (
                            <MathText text={toMathRenderableText(studentAnswer)} />
                          ) : (
                            <em className="text-slate-400 dark:text-slate-500">Chưa nhập nội dung bài làm.</em>
                          )}
                        </div>

                        {answer?.answer_image_url && (
                          <div className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 shadow-sm mt-3 bg-slate-50 dark:bg-slate-900/50">
                            <p className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-black/5 dark:border-white/5">
                              Ảnh bài làm đính kèm:
                            </p>
                            <img
                              src={answer.answer_image_url}
                              alt="Ảnh bài làm"
                              className="max-h-96 w-auto object-contain mx-auto p-2"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
