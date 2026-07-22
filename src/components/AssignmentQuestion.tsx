"use client";

import { memo } from "react";
import clsx from "clsx";
import { Question } from "@/lib/types";
import { MathText } from "@/components/MathText";

interface Props {
  q: Question;
  idx: number;
  questionNumber: number;
  answer: string | undefined;
  essayImage: string | undefined;
  essayImageUploading: boolean;
  locked: boolean;
  onSetChoice: (questionId: string, value: string) => void;
  onSetEssayImageUploading: (questionId: string, isUploading: boolean) => void;
  onSetEssayImage: (questionId: string, url: string | null) => void;
  theme: "light" | "dark";
}

export const AssignmentQuestion = memo(function AssignmentQuestion({
  q,
  idx,
  questionNumber,
  answer,
  essayImage,
  essayImageUploading,
  locked,
  onSetChoice,
  onSetEssayImageUploading,
  onSetEssayImage,
  theme,
}: Props) {
  const isDark = theme === "dark";
  const isAnswered = q.type !== "section" && Boolean(answer);

  return (
    <div
      id={`q-${q.id}`}
      style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
      className={clsx(
        "rounded-[2rem] p-5 sm:p-6 transition-all duration-300 animate-slide-up relative overflow-hidden",
        q.type === "section"
          ? isDark 
            ? "bg-[#1d1d1f]/80 border border-white/5 shadow-sm backdrop-blur-xl" 
            : "bg-slate-50/90 border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl"
          : isAnswered
            ? isDark
              ? "bg-[#1d1d1f]/95 border border-[#0066cc]/30 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-[#0066cc]/10"
              : "bg-white border border-[#0066cc]/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-[#0066cc]/10"
            : isDark
              ? "bg-[#1d1d1f]/60 border border-white/5 hover:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
              : "bg-white/95 border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-md"
      )}
    >
      {/* Accent glow on top edge */}
      {isAnswered && !isDark && <div className="absolute top-0 inset-x-0 h-1 bg-[#0066cc]" />}
      {isAnswered && isDark && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50" />}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {q.type === "section" ? (
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className={clsx(
                "mt-0.5 flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full shadow-sm",
                isDark ? "bg-blue-500/20 text-[#0066cc]" : "bg-[#0066cc]/10 text-[#0066cc]"
              )}>
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx("text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 opacity-70", isDark ? "text-blue-400" : "text-[#0066cc]")}>Thông báo</p>
                {q.imageUrl && (
                  <div className={clsx("mb-4 overflow-hidden rounded-2xl border", isDark ? "border-slate-700 bg-slate-900/50" : "border-indigo-100 bg-white/50")}>
                    <img 
                      src={q.imageUrl} 
                      alt="Thông báo" 
                      className="max-h-[350px] w-full object-contain" 
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                    />
                  </div>
                )}
                <div className={clsx("prose prose-sm sm:prose-base max-w-none font-medium leading-relaxed", isDark ? "text-slate-200" : "text-slate-700")}>
                  <MathText text={q.content || ""} />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold shrink-0 transition-all duration-300 shadow-sm",
                  isAnswered 
                    ? isDark ? "bg-[#0066cc]/20 text-blue-400" : "bg-[#0066cc]/10 text-[#0066cc] border border-[#0066cc]/20" 
                    : isDark ? "bg-white/10 text-slate-300 border border-white/5" : "bg-slate-50 text-slate-600 border border-black/5"
                )}>
                  {questionNumber}
                </div>
                {isAnswered && (
                  <span className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold", isDark ? "bg-[#0066cc]/10 text-[#0066cc] ring-1 ring-[#0066cc]/20" : "bg-[#0066cc]/5 text-[#0066cc] ring-1 ring-[#0066cc]/10")}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    ĐÃ LÀM
                  </span>
                )}
              </div>
              {q.imageUrl && (
                <div className={clsx("mb-4 overflow-hidden rounded-2xl border shadow-sm", isDark ? "border-white/5 bg-[#1d1d1f]/50" : "border-black/5 bg-slate-50")}>
                  <img src={q.imageUrl} alt="Câu hỏi" className="max-h-[350px] w-full object-contain" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              {q.content && (
                <div className={clsx("prose prose-sm sm:prose-base max-w-none font-semibold leading-relaxed mb-4", isDark ? "text-slate-200" : "text-slate-800")}>
                  <MathText text={q.content} />
                </div>
              )}
            </>
          )}
        </div>
        {q.type !== "section" && (
          <span className={clsx(
            "shrink-0 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-black ring-1 shadow-sm",
            isDark ? "bg-amber-500/10 text-amber-400 ring-amber-500/20" : "bg-gradient-to-b from-amber-50 to-orange-50 text-amber-700 ring-amber-200"
          )}>
            {parseFloat(Number(q.points ?? 0).toFixed(2)).toString().replace(".", ",")}đ
          </span>
        )}
      </div>

      {/* Answer inputs */}
      {q.type === "mcq" && (
        <div className="mt-2 grid gap-3 grid-cols-1 sm:grid-cols-2">
          {(q.choices && q.choices.length > 0 ? q.choices : ["", "", "", ""]).map((choice, ci) => {
            const val = String.fromCharCode(65 + ci);
            const checked = answer === val;
            return (
              <label
                key={ci}
                className={clsx(
                  "group relative flex cursor-pointer items-start sm:items-center gap-3 rounded-2xl border px-4 py-3 sm:py-4 transition-all duration-300 overflow-hidden",
                  checked
                    ? "border-transparent bg-[#0066cc] text-white shadow-md shadow-blue-500/30 z-10 scale-[1.02]"
                    : isDark 
                      ? "border-white/10 bg-[#1d1d1f]/60 text-slate-200 hover:bg-white/10 hover:border-white/20 hover:text-white" 
                      : "border-black/5 bg-slate-50/50 text-slate-700 hover:border-[#0066cc]/30 hover:bg-white hover:shadow-sm"
                )}
              >
                {/* Background shimmer on selected */}
                {checked && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite] pointer-events-none" />}

                <span className={clsx(
                  "flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full text-xs sm:text-[13px] font-bold transition-all duration-300 relative z-10",
                  checked 
                    ? "bg-white text-[#0066cc] shadow-sm scale-110" 
                    : isDark ? "bg-white/10 text-slate-300 group-hover:bg-white/20 group-hover:text-white" : "bg-white text-slate-500 shadow-sm border border-black/5 group-hover:border-[#0066cc]/30 group-hover:text-[#0066cc]"
                )}>
                  {val}
                </span>
                <input type="radio" name={`q-${q.id}`} className="sr-only" checked={checked} disabled={locked} onChange={() => onSetChoice(q.id, val)} />
                {choice && <span className="flex-1 font-medium sm:text-[15px] pt-0.5 sm:pt-0 relative z-10"><MathText text={choice} /></span>}
              </label>
            );
          })}
        </div>
      )}

      {q.type === "essay" && (
        <div className="mt-4 space-y-4">
          <div className="relative group">
            <textarea
              className={clsx(
                "min-h-[150px] w-full rounded-2xl border px-5 py-4 text-[15px] transition-all duration-300 resize-y",
                isDark 
                  ? "bg-[#1d1d1f]/50 border-white/10 text-slate-200 placeholder-slate-500 focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/50 hover:border-white/20" 
                  : "bg-slate-50/50 border-black/5 text-slate-800 placeholder-slate-400 focus:border-[#0066cc]/50 focus:bg-white focus:ring-4 focus:ring-[#0066cc]/10 hover:border-[#0066cc]/30 hover:bg-slate-50"
              )}
              placeholder="Nhập phần tự luận của bạn vào đây..."
              disabled={locked}
              value={answer ?? ""}
              onChange={(e) => onSetChoice(q.id, e.target.value)}
              rows={5}
              aria-label={`Câu trả lời cho câu hỏi ${questionNumber}`}
            />
            <div className="absolute right-3 bottom-4 left-3 flex justify-between items-end pointer-events-none">
                <span />
                {answer && (
                <div className={clsx("text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm transition-opacity", 
                  isDark ? "bg-slate-800/90 text-slate-400 ring-1 ring-slate-700" : "bg-white/90 text-slate-500 ring-1 ring-slate-200"
                )}>
                  {answer.length} ký tự
                </div>
              )}
            </div>
          </div>
          
          {/* Essay image upload */}
          {!locked && (
            <div>
              {essayImage ? (
                <div className={clsx("relative overflow-hidden rounded-2xl border shadow-sm group", isDark ? "border-emerald-500/30" : "border-emerald-200")}>
                  <img 
                    src={essayImage} 
                    alt="Ảnh đính kèm" 
                    className="max-h-[400px] w-full object-contain bg-slate-50/50" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={() => onSetEssayImage(q.id, null)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-bold shadow-xl hover:bg-red-500 hover:scale-105 transition-all"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Gỡ ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <label className={clsx(
                  "flex cursor-pointer group flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 rounded-2xl border-2 border-dashed px-6 py-6 sm:py-8 transition-all duration-300",
                  essayImageUploading
                    ? isDark ? "border-[#0066cc]/50 bg-[#0066cc]/10 text-blue-400 cursor-wait" : "border-[#0066cc]/30 bg-[#0066cc]/5 text-[#0066cc] cursor-wait"
                    : isDark 
                      ? "border-white/10 bg-[#1d1d1f]/30 text-slate-400 hover:border-[#0066cc]/50 hover:bg-[#0066cc]/10 hover:text-blue-300" 
                      : "border-black/10 bg-slate-50 text-slate-500 hover:border-[#0066cc]/40 hover:bg-[#0066cc]/5 hover:text-[#0066cc]"
                )}>
                  {essayImageUploading ? (
                    <>
                      <div className="relative">
                        <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-4 w-4 bg-indigo-500 rounded-full animate-ping opacity-50"></div>
                        </div>
                      </div>
                      <span className="font-bold">Đang tải ảnh lên...</span>
                    </>
                  ) : (
                    <>
                      <div className={clsx("p-3 sm:p-4 rounded-2xl transition-all duration-300", isDark ? "bg-slate-800 group-hover:bg-indigo-500/20 group-hover:text-indigo-400" : "bg-white shadow-md group-hover:bg-indigo-100 group-hover:text-indigo-600 group-hover:shadow-lg")}>
                        <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="block font-bold mb-1 group-hover:underline decoration-2 underline-offset-4">Đính kèm ảnh bài làm (tuỳ chọn)</span>
                        <span className="block text-[11px] sm:text-xs opacity-70 font-medium">Hỗ trợ JPG, PNG. Có thể chụp ảnh giấy nháp.</span>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={essayImageUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      onSetEssayImageUploading(q.id, true);
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/upload-answer-image", { method: "POST", body: fd });
                        const data = await res.json();
                        if (res.ok && data.url) {
                          onSetEssayImage(q.id, data.url);
                        }
                      } catch {
                        // silently ignore
                      } finally {
                        onSetEssayImageUploading(q.id, false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              )}
            </div>
          )}
          {/* Show uploaded image when locked */}
          {locked && essayImage && (
            <div className={clsx("overflow-hidden rounded-2xl border mt-4 shadow-sm", isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50")}>
              <div className="p-2 border-b border-inherit bg-inherit/50"><span className="text-[10px] font-bold uppercase tracking-widest opacity-60 ml-2">Ảnh đính kèm</span></div>
              <img src={essayImage} alt="Ảnh bài làm" className="max-h-[400px] w-full object-contain p-2" />
            </div>
          )}
        </div>
      )}

      {q.type === "short_answer" && (
        <input
          type="text"
          className={clsx(
            "mt-4 w-full rounded-2xl border px-5 py-4 text-[15px] transition-all duration-300",
            isDark 
              ? "bg-[#1d1d1f]/50 border-white/10 text-slate-200 placeholder-slate-500 focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/50 hover:border-white/20" 
              : "bg-slate-50/50 border-black/5 text-slate-800 placeholder-slate-400 focus:border-[#0066cc]/50 focus:bg-white focus:ring-4 focus:ring-[#0066cc]/10 hover:border-[#0066cc]/30 hover:bg-slate-50"
          )}
          placeholder="Nhập đáp án ngắn..."
          disabled={locked}
          value={answer ?? ""}
          onChange={(e) => onSetChoice(q.id, e.target.value)}
        />
      )}

      {q.type === "true_false" && q.subQuestions && q.subQuestions.length > 0 && (
        <div className="mt-4 space-y-3">
          {q.subQuestions.map((sq, si) => {
            const tfAnswers = (() => { try { return JSON.parse(answer || "{}"); } catch { return {}; } })();
            const selected = tfAnswers[sq.id];
            return (
              <div key={sq.id} className={clsx(
                "flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border px-4 py-3 sm:py-4 transition-all duration-300",
                isDark ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-slate-50/80 border-slate-200 hover:bg-white hover:shadow-sm"
              )}>
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                  <span className={clsx("flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black", isDark ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-600")}>{String.fromCharCode(97 + si)}</span>
                  <span className={clsx("text-sm sm:text-[15px] font-medium pt-0.5 sm:pt-0", isDark ? "text-slate-300" : "text-slate-800")}>
                    {sq.content ? <MathText text={sq.content} /> : <em className="not-italic opacity-50">Câu {String.fromCharCode(97 + si)}</em>}
                  </span>
                </div>
                <div className="flex gap-2 self-end sm:self-auto ml-9 sm:ml-0">
                  {["true", "false"].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        const updated = { ...tfAnswers, [sq.id]: val };
                        onSetChoice(q.id, JSON.stringify(updated));
                      }}
                      className={clsx(
                        "rounded-full px-5 py-2.5 text-[13px] font-bold transition-all duration-300 min-w-[70px] flex-1 sm:flex-none active:scale-[0.98]",
                        selected === val
                          ? val === "true" 
                            ? "bg-emerald-500 text-white shadow-sm" 
                            : "bg-red-500 text-white shadow-sm"
                          : isDark 
                            ? "border border-white/10 bg-[#1d1d1f]/50 text-slate-300 hover:bg-white/10 hover:text-white" 
                            : "border border-black/5 bg-white text-slate-600 hover:border-black/10 hover:bg-slate-50 hover:shadow-sm"
                      )}
                    >
                      {val === "true" ? "Đúng" : "Sai"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.q === next.q &&
    prev.answer === next.answer &&
    prev.essayImage === next.essayImage &&
    prev.essayImageUploading === next.essayImageUploading &&
    prev.locked === next.locked &&
    prev.theme === next.theme &&
    prev.idx === next.idx &&
    prev.questionNumber === next.questionNumber
  );
});
