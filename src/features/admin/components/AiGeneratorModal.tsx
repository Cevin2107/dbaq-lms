"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Check, Loader2, Sparkles, X, Save, Edit3, Download } from "lucide-react";
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

/**
 * Parse MCQ options (A, B, C, D) from raw text.
 */
export function parseMcqAnswers(rawText: string): Array<"A" | "B" | "C" | "D"> {
  const lines = rawText.split("\n");
  const results: Array<"A" | "B" | "C" | "D"> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^[\s|:-]+$/.test(trimmed)) continue;

    const cleanLine = trimmed.replace(/^\|/, "").replace(/\|$/, "");
    const parts = cleanLine.split("|").map((p) => p.trim()).filter(Boolean);

    // Skip table header row
    if (
      parts.length >= 2 &&
      /^(câu|stt|stt câu|index)$/i.test(parts[0]) &&
      /^(đáp án|hướng dẫn|answer)$/i.test(parts[1])
    ) {
      continue;
    }

    // 1. Table format e.g. "| 1 | A |" or "| 11 | B |"
    if (parts.length >= 2) {
      const col2 = parts[1].toUpperCase();
      const match = col2.match(/\b([A-D])\b/);
      if (match) {
        results.push(match[1] as "A" | "B" | "C" | "D");
        continue;
      }
    }

    // 2. List format e.g. "Câu 1: A", "1. A", "11 - B", "1) C"
    const listMatch = trimmed.match(/(?:câu\s*\d+|\d+)[\s.:)\-\|]+([a-d])\b/i);
    if (listMatch) {
      results.push(listMatch[1].toUpperCase() as "A" | "B" | "C" | "D");
      continue;
    }

    // 3. Inline format e.g. "1A 2B 3C" or "1.A 2.B"
    const matches = Array.from(trimmed.matchAll(/(?:\b\d+[\s.:)\-]*|\b)([a-d])\b/gi));
    if (matches.length > 0) {
      for (const m of matches) {
        if (m[1]) results.push(m[1].toUpperCase() as "A" | "B" | "C" | "D");
      }
    }
  }

  return results;
}

export interface ParsedTrueFalseItem {
  qNum?: number;
  subLetter?: string;
  value: "true" | "false";
}

/**
 * Parse True/False values ("true" | "false") from raw text.
 * Supports:
 * - "| 10a | Đúng |", "| 10b | Sai |", "| 10c | Đúng |", "| 10d | Sai |"
 * - "10a: Đúng", "10b. Sai", "10c - Đúng", "10d) Sai"
 * - "| 1 | Đúng |", "1: Đ S Đ S", "1. a) Đúng b) Sai"
 */
export function parseTrueFalseAnswers(rawText: string): ParsedTrueFalseItem[] {
  const lines = rawText.split("\n");
  const results: ParsedTrueFalseItem[] = [];

  const parseToken = (tok: string): "true" | "false" | null => {
    const t = tok.trim().toLowerCase();
    if (/^(đúng|đ|true|t|1|v|✓)$/i.test(t)) return "true";
    if (/^(sai|s|false|f|0|x|✗)$/i.test(t)) return "false";
    return null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^[\s|:-]+$/.test(trimmed)) continue;

    const cleanLine = trimmed.replace(/^\|/, "").replace(/\|$/, "");
    const parts = cleanLine.split("|").map((p) => p.trim()).filter(Boolean);

    // Skip table header rows
    if (
      parts.length >= 2 &&
      /^(câu|stt|mệnh đề)$/i.test(parts[0]) &&
      /^(đáp án|đúng\/sai|kết quả)$/i.test(parts[1])
    ) {
      continue;
    }

    // 1. Table format e.g. "| 10a | Đúng |" or "| 10.a | Đúng |"
    if (parts.length >= 2) {
      const col1 = parts[0].trim();
      const col2 = parts[1].trim();

      const qSubMatch = col1.match(/(?:câu\s*)?(\d+)[.:\s)]*([a-d])\b/i);
      const tokenVal = parseToken(col2);

      if (qSubMatch && tokenVal) {
        results.push({
          qNum: parseInt(qSubMatch[1], 10),
          subLetter: qSubMatch[2].toLowerCase(),
          value: tokenVal,
        });
        continue;
      }

      // Check if col1 has row number and subsequent cols are answers e.g. "| 1 | Đúng | Sai | Đúng | Sai |"
      if (tokenVal) {
        const qNumMatch = col1.match(/(?:câu\s*)?(\d+)\b/i);
        const rowAnswers: Array<"true" | "false"> = [];
        for (let i = 1; i < parts.length; i++) {
          const parsed = parseToken(parts[i]);
          if (parsed) rowAnswers.push(parsed);
        }
        if (rowAnswers.length > 0) {
          for (let i = 0; i < rowAnswers.length; i++) {
            results.push({
              qNum: qNumMatch ? parseInt(qNumMatch[1], 10) : undefined,
              subLetter: String.fromCharCode(97 + i),
              value: rowAnswers[i],
            });
          }
          continue;
        }
      }
    }

    // 2. Line format e.g. "Câu 10a: Đúng", "10a. Sai", "10a - Đúng", "10.a) Đúng"
    const lineQSubMatch = trimmed.match(/(?:câu\s*)?(\d+)[.:\s)]*([a-d])[\s.:)\-\|]+(.+)/i);
    if (lineQSubMatch) {
      const qNum = parseInt(lineQSubMatch[1], 10);
      const subLetter = lineQSubMatch[2].toLowerCase();
      const tokenVal = parseToken(lineQSubMatch[3]);
      if (tokenVal) {
        results.push({ qNum, subLetter, value: tokenVal });
        continue;
      }
    }

    // 3. Fallback token extraction e.g. "1: Đ S Đ S", "1. a) Đúng b) Sai", "1 - Đúng"
    const contentPart = trimmed.replace(/^(?:câu\s*\d+|\d+[\s.:)\-|]*)+/i, "");
    const tokens = contentPart.split(/[\s,;\/]+/).map((t) => t.replace(/^([a-d][.:)\-]*)/i, "").trim());

    for (const tok of tokens) {
      const parsed = parseToken(tok);
      if (parsed) results.push({ value: parsed });
    }
  }

  return results;
}

/**
 * Parse text or number answers line by line for Short Answer & Essay questions.
 */
export function parseTextAnswers(rawText: string): string[] {
  const lines = rawText.split("\n");
  const results: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^[\s|:-]+$/.test(trimmed)) continue;

    const cleanLine = trimmed.replace(/^\|/, "").replace(/\|$/, "");
    const parts = cleanLine.split("|").map((p) => p.trim()).filter(Boolean);

    // Skip table headers
    if (
      parts.length >= 2 &&
      /^(câu|stt|stt câu|index)$/i.test(parts[0]) &&
      /^(đáp án|hướng dẫn|lời giải|answer)$/i.test(parts[1])
    ) {
      continue;
    }

    let textVal = "";
    if (parts.length >= 2) {
      textVal = parts.slice(1).join(" | ");
    } else {
      textVal = trimmed.replace(/^(?:câu\s*\d+|\d+)[\s.:)\-\|]+/i, "").trim();
    }

    if (textVal) {
      results.push(textVal);
    }
  }

  return results;
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
    placeholder: "Dán đề bài trắc nghiệm (ví dụ: Câu 1. ... A. ... B. ... C. ... D. ...)",
    description: "4 phương án A, B, C, D (1 đáp án đúng)",
  },
  {
    id: "true_false",
    label: "Đúng / Sai",
    icon: "🔘",
    placeholder:
      "Dán đề bài Đúng/Sai (ví dụ: Câu 1. ... Các mệnh đề sau đúng hay sai?\na) ...\nb) ...\nc) ...\nd) ...)",
    description: "Nhiều mệnh đề a, b, c, d (chọn Đúng/Sai từng ý)",
  },
  {
    id: "short_answer",
    label: "Trả lời ngắn",
    icon: "✏️",
    placeholder: "Dán đề bài trả lời ngắn (ví dụ: Câu 1. Tìm số nghiệm của phương trình...)",
    description: "Điền số hoặc đáp án ngắn gọn",
  },
  {
    id: "essay",
    label: "Tự luận",
    icon: "📄",
    placeholder: "Dán đề bài tự luận...",
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

  // Import Answer Key modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");

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

  const handleApplyImportAnswers = () => {
    if (!importText.trim()) {
      setToast({ message: "Vui lòng dán danh sách đáp án để import.", type: "error" });
      return;
    }

    let expectedCount = 0;

    if (questionType === "mcq") {
      const parsed = parseMcqAnswers(importText);
      expectedCount = aiQuestions.length;

      if (parsed.length === 0) {
        setToast({ message: "Không tìm thấy đáp án hợp lệ trong đoạn văn bản đã nhập.", type: "error" });
        return;
      }

      if (parsed.length !== expectedCount) {
        setToast({
          message: `⚠️ Số lượng đáp án nhập vào (${parsed.length}) khác với số lượng câu hỏi (${expectedCount}). Đã gán ${Math.min(parsed.length, expectedCount)} đáp án theo thứ tự.`,
          type: "error",
        });
      } else {
        setToast({
          message: `✅ Đã cập nhật thành công ${parsed.length} đáp án!`,
          type: "success",
        });
      }

      setAiQuestions((prev) =>
        prev.map((q, idx) => {
          if (idx < parsed.length && q.type === "mcq") {
            return { ...q, correct_answer: parsed[idx] as "A" | "B" | "C" | "D" };
          }
          return q;
        })
      );
    } else if (questionType === "true_false") {
      const tfItems = parseTrueFalseAnswers(importText);
      expectedCount = aiQuestions.reduce((sum, q) => sum + (q.sub_questions?.length || 0), 0);

      if (tfItems.length === 0) {
        setToast({ message: "Không tìm thấy đáp án hợp lệ trong đoạn văn bản đã nhập.", type: "error" });
        return;
      }

      if (tfItems.length !== expectedCount) {
        setToast({
          message: `⚠️ Số lượng đáp án nhập vào (${tfItems.length}) khác với số lượng mệnh đề (${expectedCount}). Đã gán các đáp án theo thứ tự.`,
          type: "error",
        });
      } else {
        setToast({
          message: `✅ Đã cập nhật thành công ${tfItems.length} đáp án!`,
          type: "success",
        });
      }

      const hasSubLetters = tfItems.some((item) => item.subLetter && item.qNum !== undefined);

      if (hasSubLetters) {
        // Group items by question number (e.g., 10 -> { a: "true", b: "false", c: "true", d: "false" })
        const qNumGroups = new Map<number, Map<string, "true" | "false">>();
        for (const item of tfItems) {
          if (item.qNum !== undefined && item.subLetter) {
            if (!qNumGroups.has(item.qNum)) {
              qNumGroups.set(item.qNum, new Map());
            }
            qNumGroups.get(item.qNum)!.set(item.subLetter.toLowerCase(), item.value);
          }
        }

        const uniqueQNums = Array.from(qNumGroups.keys()).sort((a, b) => a - b);
        const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };

        setAiQuestions((prev) =>
          prev.map((q, qIndex) => {
            if (q.type !== "true_false" || !q.sub_questions) return q;

            let targetMap: Map<string, "true" | "false"> | undefined;
            if (qIndex < uniqueQNums.length) {
              const qNum = uniqueQNums[qIndex];
              targetMap = qNumGroups.get(qNum);
            }

            if (!targetMap) return q;

            const nextSubs = q.sub_questions.map((sub, subIdx) => {
              let val: "true" | "false" | undefined;
              for (const [letter, v] of targetMap!.entries()) {
                if (letterMap[letter] === subIdx) {
                  val = v;
                  break;
                }
              }
              if (val !== undefined) {
                return { ...sub, answerKey: val };
              }
              return sub;
            });

            return { ...q, sub_questions: nextSubs };
          })
        );
      } else {
        // Sequential fallback
        let answerPointer = 0;
        setAiQuestions((prev) =>
          prev.map((q) => {
            if (q.type !== "true_false" || !q.sub_questions) return q;
            const nextSubs = q.sub_questions.map((sub) => {
              if (answerPointer < tfItems.length) {
                const ansKey = tfItems[answerPointer++].value;
                return { ...sub, answerKey: ansKey };
              }
              return sub;
            });
            return { ...q, sub_questions: nextSubs };
          })
        );
      }
    } else {
      const parsed = parseTextAnswers(importText);
      expectedCount = aiQuestions.length;

      if (parsed.length === 0) {
        setToast({ message: "Không tìm thấy đáp án hợp lệ trong đoạn văn bản đã nhập.", type: "error" });
        return;
      }

      if (parsed.length !== expectedCount) {
        setToast({
          message: `⚠️ Số lượng đáp án nhập vào (${parsed.length}) khác với số lượng câu hỏi (${expectedCount}). Đã gán ${Math.min(parsed.length, expectedCount)} đáp án theo thứ tự.`,
          type: "error",
        });
      } else {
        setToast({
          message: `✅ Đã cập nhật thành công ${parsed.length} đáp án!`,
          type: "success",
        });
      }

      setAiQuestions((prev) =>
        prev.map((q, idx) => {
          if (idx < parsed.length) {
            return { ...q, answer_key: parsed[idx] };
          }
          return q;
        })
      );
    }

    setIsImportModalOpen(false);
    setImportText("");
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
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      <Card className="relative z-10 flex w-full max-w-4xl flex-col max-h-[90vh] overflow-hidden rounded-[2rem] bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-black/5 dark:border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#0066cc]" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Auto Tạo & Bóc tách câu hỏi</h2>
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
                <Sparkles className="h-5 w-5 mr-2" /> Auto bóc tách câu hỏi {activeTypeObj?.label}
              </Button>
            </div>
          ) : status === "running" ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-[#0066cc] mb-4" />
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Đang tự động bóc tách câu hỏi...</p>
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
              {/* Header stats & select toggle & import button */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[#0066cc] bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 px-3 py-1 rounded-full">
                    Đã tạo {aiQuestions.length} câu hỏi [{activeTypeObj?.label}]
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition border border-indigo-200/60 dark:border-indigo-800/40"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Import đáp án hàng loạt</span>
                  </button>
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

      {/* Sub-modal: Import đáp án */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsImportModalOpen(false)} />
          <Card className="relative z-10 w-full max-w-lg rounded-[2rem] bg-white dark:bg-[#1d1d1f] p-6 shadow-2xl border border-black/5 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-[#0066cc]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Import đáp án hàng loạt [{activeTypeObj?.label}]
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {questionType === "mcq" && "💡 Dán bảng (| Câu | Đáp án |) hoặc danh sách (1. A, 11-B). Hệ thống tự lọc ký tự thừa và gán đáp án A/B/C/D theo thứ tự."}
                {questionType === "true_false" && "💡 Dán bảng (| Câu | Đúng |) hoặc danh sách (1-Đúng, 2-Sai, 1: Đ S Đ S). Hệ thống tự gán Đúng/Sai theo thứ tự từng mệnh đề."}
                {questionType === "short_answer" && "💡 Dán bảng (| Câu | Đáp án |) hoặc danh sách (1. 15.5, Câu 1: -3). Hệ thống gán đáp án ngắn theo thứ tự."}
                {questionType === "essay" && "💡 Dán bảng hoặc danh sách hướng dẫn giải theo thứ tự các câu hỏi."}
              </p>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 px-4 py-3 text-xs font-mono text-slate-900 dark:text-white focus:border-[#0066cc] focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition resize-none placeholder:text-slate-400"
                placeholder={
                  questionType === "mcq"
                    ? "| Câu | Đáp án |\n|-----|--------|\n| 1   | A      |\n| 2   | B      |"
                    : questionType === "true_false"
                    ? "| Câu | Đáp án |\n| 1 | Đúng |\n| 2 | Sai |"
                    : "| Câu | Đáp án |\n| 1 | 15.5 |\n| 2 | -3.14 |"
                }
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(false)}>
                Hủy
              </Button>
              <Button variant="brand" size="sm" onClick={handleApplyImportAnswers}>
                Áp dụng đáp án
              </Button>
            </div>
          </Card>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>,
    document.body
  );
}
