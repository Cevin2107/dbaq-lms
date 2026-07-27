"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Check, Loader2, Sparkles, X, Save, Edit3 } from "lucide-react";
import Toast from "@/components/Toast";
import { MathText } from "@/components/MathText";

export type QuestionType = "mcq" | "true_false" | "short_answer" | "essay";

export interface GeneratedSubQuestion {
  id: string;
  content: string;
  answerKey: "true" | "false";
  order: number;
}

export interface GeneratedQuestion {
  type: QuestionType;
  question: string;
  options?: Record<"A" | "B" | "C" | "D", string>;
  correct_answer?: "A" | "B" | "C" | "D";
  sub_questions?: GeneratedSubQuestion[];
  answer_key?: string;
  ai_solve_status?: "solved" | "unsolved";
}

interface AiGeneratorModalProps {
  assignmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QUESTION_TYPE_OPTIONS: Array<{
  id: QuestionType;
  label: string;
  icon: string;
  placeholder: string;
  description: string;
}> = [
  {
    id: "mcq",
    label: "Trắc nghiệm",
    icon: "📝",
    placeholder: "Dán đề bài trắc nghiệm (ví dụ: Câu 1. ... A. ... B. ... C. ... D. ...) hoặc gõ yêu cầu cho AI...",
    description: "4 phương án A, B, C, D (1 đáp án đúng)",
  },
  {
    id: "true_false",
    label: "Đúng / Sai",
    icon: "🔘",
    placeholder:
      "Dán đề bài Đúng/Sai (ví dụ: Câu 1. ... Các mệnh đề sau đúng hay sai?\na) ...\nb) ...\nc) ...\nd) ...) hoặc gõ yêu cầu cho AI...",
    description: "Nhiều mệnh đề a, b, c, d (chọn Đúng/Sai từng ý)",
  },
  {
    id: "short_answer",
    label: "Trả lời ngắn",
    icon: "✏️",
    placeholder: "Dán đề bài trả lời ngắn (ví dụ: Câu 1. Tìm số nghiệm của phương trình...) hoặc gõ yêu cầu cho AI...",
    description: "Điền số hoặc đáp án ngắn gọn",
  },
  {
    id: "essay",
    label: "Tự luận",
    icon: "📄",
    placeholder: "Dán đề bài tự luận hoặc gõ yêu cầu chi tiết cho AI...",
    description: "Bài giải tự luận dài",
  },
];

export function AiGeneratorModal({ assignmentId, isOpen, onClose, onSuccess }: AiGeneratorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [textInput, setTextInput] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [aiQuestions, setAiQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!status || status !== "running") {
      if (status === "idle") setProgress(0);
      return;
    }

    setProgress((prev) => (prev < 8 ? 8 : prev));

    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        if (prev < 45) return prev + 6;
        if (prev < 75) return prev + 4;
        return prev + 2;
      });
    }, 500);

    return () => window.clearInterval(timer);
  }, [status]);

  async function handleGenerate() {
    if (!textInput.trim()) {
      setToast({ message: "Vui lòng dán văn bản hoặc nhập yêu cầu để AI tạo câu hỏi.", type: "error" });
      return;
    }

    setStatus("running");
    setProgress(8);
    setMessage(`AI đang tạo câu hỏi ${QUESTION_TYPE_OPTIONS.find((t) => t.id === questionType)?.label}...`);
    setAiQuestions([]);
    setSelectedIndices(new Set());

    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualText: textInput.trim(),
          questionType,
        }),
      });

      if (!res.ok) {
        if (res.status === 504) {
          throw new Error("AI xử lý quá lâu và bị timeout. Vui lòng tách ngắn bớt nội dung rồi thử lại.");
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Lỗi tạo câu hỏi");
      }

      const data = await res.json();
      const generatedList: GeneratedQuestion[] = (data.questions || []).map((q: any) => ({
        ...q,
        type: q.type || questionType,
      }));

      setProgress(100);
      setAiQuestions(generatedList);
      setSelectedIndices(new Set(generatedList.map((_, i) => i)));
      setStatus("done");
      setMessage(`Đã tạo ${generatedList.length} câu hỏi`);
    } catch (err: any) {
      console.warn("AI generate handled error:", err);
      setProgress(100);
      setStatus("error");
      setMessage(err.message || "Không thể sinh câu hỏi. Vui lòng thử lại.");
    }
  }

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const updateMcqAnswer = (questionIndex: number, answer: "A" | "B" | "C" | "D") => {
    setAiQuestions((prev) =>
      prev.map((q, index) => (index === questionIndex ? { ...q, correct_answer: answer } : q))
    );
  };

  const updateTrueFalseAnswer = (questionIndex: number, subIndex: number, answerKey: "true" | "false") => {
    setAiQuestions((prev) =>
      prev.map((q, index) => {
        if (index !== questionIndex || !q.sub_questions) return q;
        const nextSubs = [...q.sub_questions];
        nextSubs[subIndex] = { ...nextSubs[subIndex], answerKey };
        return { ...q, sub_questions: nextSubs };
      })
    );
  };

  const updateAnswerKeyText = (questionIndex: number, text: string) => {
    setAiQuestions((prev) =>
      prev.map((q, index) => (index === questionIndex ? { ...q, answer_key: text } : q))
    );
  };

  const handleSaveSelected = async () => {
    if (selectedIndices.size === 0 || saving) return;
    setSaving(true);
    try {
      const selected = aiQuestions.filter((_, i) => selectedIndices.has(i));
      const res = await fetch(`/api/admin/assignments/${assignmentId}/ai-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiQuestions: selected }),
      });

      if (!res.ok) throw new Error("Không thể lưu câu hỏi");

      const data = await res.json().catch(() => ({}));
      const createdCount = typeof data?.count === "number" ? data.count : selected.length;
      const skippedDuplicates = typeof data?.skippedDuplicates === "number" ? data.skippedDuplicates : 0;

      setToast({
        message:
          skippedDuplicates > 0
            ? `Đã lưu ${createdCount} câu hỏi, bỏ qua ${skippedDuplicates} câu bị trùng.`
            : `Đã lưu ${createdCount} câu hỏi thành công!`,
        type: "success",
      });
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset state
        setTextInput("");
        setAiQuestions([]);
        setStatus("idle");
      }, 1000);
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const activeTypeObj = QUESTION_TYPE_OPTIONS.find((t) => t.id === questionType);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      <Card className="relative z-10 flex w-full max-w-4xl flex-col max-h-[90vh] overflow-hidden rounded-[2rem] bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-black/5 dark:border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#0066cc]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Tạo & Bóc tách câu hỏi</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {status === "idle" || status === "error" ? (
            <div className="space-y-6">
              {/* Question Type Selector Tabs */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Chọn loại câu hỏi muốn tạo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl">
                  {QUESTION_TYPE_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setQuestionType(item.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all text-xs font-medium ${
                        questionType === item.id
                          ? "bg-white dark:bg-[#1d1d1f] text-[#0066cc] dark:text-blue-400 font-bold shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="text-lg mb-1">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
                  💡 {activeTypeObj?.description}
                </p>
              </div>

              {/* Text Input Area */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nội dung đề bài / Yêu cầu chi tiết
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full h-48 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 px-4 py-3 text-sm focus:border-[#0066cc] focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition resize-none placeholder:text-slate-400 dark:text-white"
                  placeholder={activeTypeObj?.placeholder}
                />
              </div>

              {status === "error" && (
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-900">
                  {message}
                </div>
              )}

              <Button onClick={handleGenerate} variant="brand" className="w-full text-base py-6 rounded-2xl shadow-blue-500/20">
                <Sparkles className="h-5 w-5 mr-2" /> Bắt đầu tạo câu hỏi {activeTypeObj?.label}
              </Button>
            </div>
          ) : status === "running" ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-[#0066cc] mb-4" />
              <p className="text-lg font-semibold text-slate-900 dark:text-white">AI đang phân tích & sinh câu hỏi...</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{message}</p>
              <div className="mt-6 w-full max-w-md">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Tiến độ</span>
                  <span>{Math.min(progress, 100)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header stats & select toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#0066cc] bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 px-3 py-1 rounded-full">
                    Đã tạo {aiQuestions.length} câu hỏi [{activeTypeObj?.label}]
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bấm trực tiếp vào đáp án/mệnh đề để chọn/sửa đáp án đúng
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedIndices.size === aiQuestions.length) setSelectedIndices(new Set());
                    else setSelectedIndices(new Set(aiQuestions.map((_, i) => i)));
                  }}
                  className="text-xs font-bold text-[#0066cc] hover:underline"
                >
                  {selectedIndices.size === aiQuestions.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </button>
              </div>

              {/* List of Generated Cards */}
              <div className="space-y-4">
                {aiQuestions.map((q, i) => (
                  <div
                    key={i}
                    className={`relative rounded-2xl border-2 p-5 transition-all cursor-pointer ${
                      selectedIndices.has(i)
                        ? "border-[#0066cc] bg-blue-50/30 dark:bg-blue-950/20 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#1d1d1f]"
                    }`}
                    onClick={() => toggleSelect(i)}
                  >
                    {/* Checkbox select badge */}
                    <div className="absolute right-4 top-4">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                          selectedIndices.has(i)
                            ? "border-[#0066cc] bg-[#0066cc] text-white"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                        }`}
                      >
                        {selectedIndices.has(i) && <Check className="h-4 w-4 stroke-[3]" />}
                      </div>
                    </div>

                    <h4 className="pr-10 text-[15px] font-bold text-slate-900 dark:text-white mb-3 leading-relaxed">
                      Câu {i + 1}: <MathText text={q.question} />
                    </h4>

                    {/* CARD CONTENT BY TYPE */}

                    {/* 1. MCQ TYPE */}
                    {q.type === "mcq" && q.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-3">
                        {Object.entries(q.options).map(([key, value]) => (
                          <button
                            type="button"
                            key={key}
                            onClick={(event) => {
                              event.stopPropagation();
                              updateMcqAnswer(i, key as "A" | "B" | "C" | "D");
                            }}
                            className={`w-full text-left rounded-xl px-3.5 py-2.5 transition flex items-start gap-2 ${
                              key === q.correct_answer
                                ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold ring-2 ring-emerald-400 dark:ring-emerald-600"
                                : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className="font-extrabold">{key}.</span>
                            <div className="flex-1">
                              <MathText text={value || ""} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 2. TRUE / FALSE TYPE */}
                    {q.type === "true_false" && q.sub_questions && (
                      <div className="space-y-2 mt-3">
                        {q.sub_questions.map((sub, subIdx) => (
                          <div
                            key={sub.id || subIdx}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex-1 font-medium text-slate-800 dark:text-slate-200">
                              <MathText text={sub.content} />
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateTrueFalseAnswer(i, subIdx, "true")}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                  sub.answerKey === "true"
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-700"
                                }`}
                              >
                                ✓ Đúng
                              </button>
                              <button
                                type="button"
                                onClick={() => updateTrueFalseAnswer(i, subIdx, "false")}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                  sub.answerKey === "false"
                                    ? "bg-rose-600 text-white shadow-sm"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-700"
                                }`}
                              >
                                ✗ Sai
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3. SHORT ANSWER TYPE */}
                    {q.type === "short_answer" && (
                      <div className="mt-3 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Edit3 className="h-3.5 w-3.5" /> Đáp án ngắn chuẩn:
                        </label>
                        <input
                          type="text"
                          value={q.answer_key || ""}
                          onChange={(e) => updateAnswerKeyText(i, e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                          placeholder="Nhập đáp án ngắn (ví dụ: 12 hoặc 25)..."
                        />
                      </div>
                    )}

                    {/* 4. ESSAY TYPE */}
                    {q.type === "essay" && (
                      <div className="mt-3 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Edit3 className="h-3.5 w-3.5" /> Đáp án / Hướng dẫn giải gợi ý (nếu có):
                        </label>
                        <textarea
                          value={q.answer_key || ""}
                          onChange={(e) => updateAnswerKeyText(i, e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-white focus:border-[#0066cc] focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 resize-none h-20"
                          placeholder="Nhập đáp án gợi ý hoặc hướng dẫn giải..."
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {status === "done" && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-3 rounded-b-[2rem]">
            <Button variant="outline" onClick={() => setStatus("idle")}>
              Tạo lại
            </Button>
            <Button variant="brand" onClick={handleSaveSelected} disabled={saving || selectedIndices.size === 0}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Lưu {selectedIndices.size} câu đã chọn
            </Button>
          </div>
        )}
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>,
    document.body
  );
}
