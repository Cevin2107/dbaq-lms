"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { X, Zap, AlertTriangle, CheckCircle2, ChevronRight, RefreshCw, Eye, Download } from "lucide-react";
import Toast from "@/components/Toast";
import { MathText } from "@/components/MathText";
import { parseMcqAnswers } from "./AiGeneratorModal";

interface AutoQuizImportModalProps {
  assignmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ParsedQuizQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: "A" | "B" | "C" | "D";
  errors: string[];
}

function stripOptionPrefix(text: string, letter: string): string {
  const pattern = new RegExp(`^\\s*(?:\\*\\*)?\\s*${letter}\\s*[\\).:-]\\s*(?:\\*\\*)?\\s*`, "i");
  return text.replace(pattern, "").trim();
}

function stripQuestionPrefix(text: string): string {
  return text
    .replace(/^\s*(?:\*\*)?\s*(?:Câu|Question|Q|Bài)\s*\d+[\s.:)\-]*\s*(?:\*\*)?/i, "")
    .trim();
}

export function parseLatexQuizText(text: string): ParsedQuizQuestion[] {
  // Split on "Câu X", "Bài X", "Question X"
  const blocks = text.split(/(?=(?:^|\n)\s*(?:\*\*)?(?:Câu|Question|Q|Bài)\s*\d+)/i).filter(Boolean);
  const questions: ParsedQuizQuestion[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let stem = "";
    const options: { A: string; B: string; C: string; D: string } = { A: "", B: "", C: "", D: "" };
    let foundOptions = false;
    let detectedAnswer: "A" | "B" | "C" | "D" | null = null;

    for (const line of lines) {
      const cleanLine = line.replace(/^\s*\*\*\s*/, "").replace(/\s*\*\*\s*$/, "").trim();

      // Check if line indicates correct answer, e.g., "Đáp án: A" or "Chọn A"
      const ansMatch = cleanLine.match(/^(?:Đáp án|Chọn|Key|Answer)\s*[:.-]?\s*([A-D])\b/i);
      if (ansMatch) {
        detectedAnswer = ansMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
        continue;
      }

      // Check for Option A, B, C, D
      // Also handles when multiple options are on the same line: "A. x    B. y    C. z    D. w"
      const multiOptMatch = cleanLine.match(/A[\).:-]\s*(.*?)\s+B[\).:-]\s*(.*?)\s+C[\).:-]\s*(.*?)\s+D[\).:-]\s*(.*)$/i);
      if (multiOptMatch) {
        foundOptions = true;
        options.A = multiOptMatch[1].trim();
        options.B = multiOptMatch[2].trim();
        options.C = multiOptMatch[3].trim();
        options.D = multiOptMatch[4].trim();
        continue;
      }

      const optionMatch = cleanLine.match(/^(?:\*\*)?\s*([ABCD])\s*[\).:-]\s*(?:\*\*)?\s*(.*)$/i);
      if (optionMatch) {
        foundOptions = true;
        const key = optionMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
        options[key] = stripOptionPrefix(optionMatch[2] || "", key);
      } else if (!foundOptions) {
        stem += (stem ? "\n" : "") + line;
      }
    }

    stem = stripQuestionPrefix(stem);

    if (stem || options.A || options.B || options.C || options.D) {
      const errors: string[] = [];
      if (!stem) errors.push("Thiếu nội dung câu hỏi");
      if (!options.A) errors.push("Thiếu lựa chọn A");
      if (!options.B) errors.push("Thiếu lựa chọn B");
      if (!options.C) errors.push("Thiếu lựa chọn C");
      if (!options.D) errors.push("Thiếu lựa chọn D");

      questions.push({
        question: stem,
        options,
        correctAnswer: detectedAnswer || "A",
        errors,
      });
    }
  }

  return questions;
}

export function AutoQuizImportModal({
  assignmentId,
  isOpen,
  onClose,
  onSuccess,
}: AutoQuizImportModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"input" | "preview">("input");
  const [rawText, setRawText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuizQuestion[]>([]);
  const [importCount, setImportCount] = useState<number>(0);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Bulk answer key import state
  const [isImportKeyModalOpen, setIsImportKeyModalOpen] = useState(false);
  const [importKeyText, setImportKeyText] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleParse = () => {
    if (!rawText.trim()) {
      setToast({ message: "Vui lòng dán nội dung LaTeX câu hỏi", type: "error" });
      return;
    }
    const questions = parseLatexQuizText(rawText);
    if (questions.length === 0) {
      setToast({
        message: "Không tìm thấy câu hỏi hợp lệ. Định dạng cần có: 'Câu 1. ... A. ... B. ... C. ... D. ...'",
        type: "error",
      });
      return;
    }
    setParsedQuestions(questions);
    setImportCount(questions.length);
    setStep("preview");
  };

  const handleSetCorrectAnswer = (idx: number, answer: "A" | "B" | "C" | "D") => {
    setParsedQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], correctAnswer: answer };
      return next;
    });
  };

  const handleApplyImportAnswers = () => {
    if (!importKeyText.trim()) {
      setToast({ message: "Vui lòng dán danh sách đáp án để import.", type: "error" });
      return;
    }

    const parsed = parseMcqAnswers(importKeyText);
    const expectedCount = parsedQuestions.length;

    if (parsed.length === 0) {
      setToast({ message: "Không tìm thấy đáp án hợp lệ trong văn bản đã nhập.", type: "error" });
      return;
    }

    if (parsed.length !== expectedCount) {
      setToast({
        message: `⚠️ Nhận diện ${parsed.length} đáp án cho ${expectedCount} câu hỏi. Đã gán ${Math.min(parsed.length, expectedCount)} đáp án theo thứ tự.`,
        type: "error",
      });
    } else {
      setToast({
        message: `✅ Đã cập nhật thành công ${parsed.length} đáp án!`,
        type: "success",
      });
    }

    setParsedQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx < parsed.length) {
          return { ...q, correctAnswer: parsed[idx] };
        }
        return q;
      })
    );

    setIsImportKeyModalOpen(false);
    setImportKeyText("");
  };

  const handleConfirmImport = async () => {
    if (importCount <= 0) return;
    const toImport = parsedQuestions.slice(0, importCount);

    setImporting(true);
    try {
      // 1. Dùng ai-save endpoint để lưu hàng loạt câu hỏi an toàn và nhanh chóng
      const formattedQuestions = toImport.map((q) => ({
        type: "mcq" as const,
        question: q.question,
        options: {
          A: q.options.A || "",
          B: q.options.B || "",
          C: q.options.C || "",
          D: q.options.D || "",
        },
        correct_answer: q.correctAnswer,
      }));

      const res = await fetch(`/api/admin/assignments/${assignmentId}/ai-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiQuestions: formattedQuestions }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const count = typeof data?.count === "number" ? data.count : toImport.length;
        setToast({ message: `Đã nhập thành công ${count} câu hỏi Quiz!`, type: "success" });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        // Fallback: lưu tuần tự với /api/admin/questions (với assignmentId chuẩn)
        let saved = 0;
        for (let i = 0; i < toImport.length; i++) {
          const q = toImport[i];
          const singleRes = await fetch("/api/admin/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assignmentId,
              content: q.question,
              type: "mcq",
              choices: [q.options.A, q.options.B, q.options.C, q.options.D],
              answerKey: q.correctAnswer,
            }),
          });
          if (singleRes.ok) saved++;
        }
        setToast({ message: `Đã nhập thành công ${saved} câu hỏi Quiz!`, type: "success" });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setToast({ message: err.message || "Lỗi khi lưu câu hỏi", type: "error" });
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[2.5rem] bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-black/5 dark:border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Auto Quiz — Bóc tách đề LaTeX
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động nhận diện Câu hỏi và 4 lựa chọn A, B, C, D (render KaTeX)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/8 hover:bg-black/10 text-slate-500 dark:text-slate-400 active:scale-95 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {step === "input" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 text-xs text-purple-900 dark:text-purple-300">
                <p className="font-bold mb-1">Quy chuẩn định dạng LaTeX:</p>
                <p className="leading-relaxed">
                  Đề bài có dạng: <br />
                  <code className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded font-mono">
                    Câu 1. Cho hàm số $y=f(x)$...
                  </code>
                  <br />
                  <code className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded font-mono">
                    A. $x &gt; 1$
                  </code>
                  <br />
                  <code className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded font-mono">
                    B. $x &lt; 0$
                  </code>
                  <br />
                  <code className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded font-mono">
                    C. $x = 0$
                  </code>
                  <br />
                  <code className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded font-mono">
                    D. Không tồn tại
                  </code>
                  <br />
                  <span className="text-slate-500 dark:text-slate-400">
                    (Có thể thêm dòng "Đáp án: B" để tự động chọn đáp án đúng).
                  </span>
                </p>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Dán toàn bộ văn bản LaTeX câu hỏi vào đây..."
                rows={14}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-black/10 dark:border-white/10 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-none transition-all"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/8">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Đã bóc tách {parsedQuestions.length} câu hỏi
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsImportKeyModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-bold transition border border-purple-200/60 dark:border-purple-800/40 active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Import đáp án hàng loạt</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Số câu nhập:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={parsedQuestions.length}
                    value={importCount}
                    onChange={(e) =>
                      setImportCount(
                        Math.max(1, Math.min(parsedQuestions.length, parseInt(e.target.value) || 1))
                      )
                    }
                    className="w-20 px-3 py-1.5 text-center text-sm font-bold rounded-xl bg-white dark:bg-[#18181b] border border-black/10 dark:border-white/10 outline-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep("input")}
                    className="rounded-full text-xs font-semibold"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Dán lại
                  </Button>
                </div>
              </div>

              {/* Question list preview */}
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {parsedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      idx < importCount
                        ? "bg-white dark:bg-[#1d1d1f] border-purple-500/30 shadow-sm"
                        : "bg-slate-50/50 dark:bg-white/3 border-black/5 opacity-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          Câu {idx + 1}
                        </span>
                        {q.errors.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" />
                            {q.errors.join(", ")}
                          </span>
                        )}
                      </div>

                      {/* Correct answer picker */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-500">Đáp án đúng:</span>
                        {(["A", "B", "C", "D"] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSetCorrectAnswer(idx, opt)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                              q.correctAnswer === opt
                                ? "bg-emerald-600 text-white shadow-sm scale-105"
                                : "bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-black/10"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 select-text">
                      <MathText text={q.question || "*(Chưa có nội dung)*"} />
                    </div>

                    {/* Options grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(["A", "B", "C", "D"] as const).map((opt) => (
                        <div
                          key={opt}
                          className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs ${
                            q.correctAnswer === opt
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300 font-semibold"
                              : "bg-slate-50 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 text-[11px] ${
                              q.correctAnswer === opt
                                ? "bg-emerald-600 text-white"
                                : "bg-black/10 dark:bg-white/10 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {opt}
                          </span>
                          <div className="flex-1 min-w-0 select-text overflow-x-auto">
                            <MathText text={q.options[opt] || "—"} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-black/5 dark:border-white/8 bg-white/50 dark:bg-[#18181b]/50 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-full text-xs font-semibold px-4"
          >
            Đóng
          </Button>

          {step === "input" ? (
            <button
              onClick={handleParse}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 text-xs font-bold shadow-lg shadow-purple-500/25 hover:shadow-xl active:scale-95 transition-all"
            >
              <Eye className="h-3.5 w-3.5" />
              Bóc tách & Xem trước
            </button>
          ) : (
            <button
              disabled={importing || importCount === 0}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2.5 text-xs font-bold shadow-lg shadow-emerald-500/25 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {importing ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {importing ? "Đang lưu câu hỏi..." : `Lưu ${importCount} câu hỏi Quiz`}
            </button>
          )}
        </div>
      </div>

      {/* Sub-modal: Import đáp án hàng loạt */}
      {isImportKeyModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
            onClick={() => setIsImportKeyModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-[2.25rem] bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl border border-white/80 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Download className="h-4 w-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Import đáp án hàng loạt
                </h3>
              </div>
              <button
                onClick={() => setIsImportKeyModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                💡 Dán bảng đáp án (dạng Markdown <code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">| 1 | B |</code>) hoặc danh sách (<code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">1. A, 2-B, 1A 2B</code>). Hệ thống tự bóc tách và gán đáp án A/B/C/D theo thứ tự câu hỏi.
              </p>

              <textarea
                value={importKeyText}
                onChange={(e) => setImportKeyText(e.target.value)}
                rows={9}
                className="w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-4 py-3 text-xs font-mono text-slate-900 dark:text-white focus:border-purple-500 focus:bg-white dark:focus:bg-[#18181b] focus:outline-none focus:ring-4 focus:ring-purple-500/15 transition resize-none placeholder:text-slate-400"
                placeholder={`| 1   | B      |\n| 2   | A      |\n| 3   | C      |\n| 4   | B      |`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportKeyModalOpen(false)}
                className="rounded-full text-xs px-4"
              >
                Hủy
              </Button>
              <button
                type="button"
                onClick={handleApplyImportAnswers}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-purple-500/25 active:scale-95 transition-all"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Áp dụng đáp án
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );

  return createPortal(modal, document.body);
}
