import { Trophy, FileText, CheckCircle2, XCircle } from "lucide-react";
import { MathText } from "@/components/MathText";

export interface QuestionDetail {
  questionId: string;
  order: number;
  type: string;
  content: string;
  choices?: string[];
  answerKey?: string;
  points: number;
  imageUrl?: string;
  studentAnswer: string | null;
  isCorrect: boolean | null;
  isAnswered?: boolean;
  pointsAwarded?: number;
}

interface QuestionDetailCardProps {
  question: QuestionDetail;
  isSubmitted: boolean;
  regradingMode?: boolean;
  onToggleCorrectness?: (questionId: string, points: number) => void;
}

export function QuestionDetailCard({ 
  question: q, 
  isSubmitted, 
  regradingMode = false,
  onToggleCorrectness 
}: QuestionDetailCardProps) {
  const hasAnswer = q.studentAnswer !== undefined && q.studentAnswer !== null && q.studentAnswer !== "";
  
  // Border and background colors based on answer status
  let borderColor = "border-slate-200/50 dark:border-white/10";
  let bgColor = "bg-white/60 dark:bg-[#1d1d1f]/80";
  let shadowColor = "shadow-slate-200/30 dark:shadow-none";
  
  if (isSubmitted && hasAnswer) {
    if (q.isCorrect) {
      borderColor = "border-emerald-300/80 dark:border-emerald-500/30";
      bgColor = "bg-emerald-50/60 dark:bg-emerald-950/20";
      shadowColor = "shadow-emerald-200/40 dark:shadow-none";
    } else {
      borderColor = "border-rose-300/80 dark:border-rose-500/30";
      bgColor = "bg-rose-50/60 dark:bg-rose-950/20";
      shadowColor = "shadow-rose-200/40 dark:shadow-none";
    }
  } else if (hasAnswer) {
    borderColor = "border-blue-300/80 dark:border-blue-500/30";
    bgColor = "bg-blue-50/60 dark:bg-blue-950/20";
    shadowColor = "shadow-blue-200/40 dark:shadow-none";
  }

  return (
    <div className={`rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-sm shadow-md ${shadowColor} p-5 hover:shadow-lg transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-xl bg-slate-200/80 dark:bg-white/10 backdrop-blur-sm px-3 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-300/50 dark:border-white/10">
            Câu {q.order}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg bg-slate-100/60 dark:bg-white/5 backdrop-blur-sm">
            <FileText className="h-3 w-3" />
            {q.type === "mcq" ? "Trắc nghiệm" : 
             q.type === "true_false" ? "Đúng/Sai" : 
             q.type === "short_answer" ? "Trả lời ngắn" : 
             "Tự luận"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg bg-indigo-100/60 dark:bg-indigo-950/40 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-800/40">
            <Trophy className="h-3 w-3" />
            {parseFloat(q.points.toFixed(2)).toString().replace(".", ",")} điểm
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isSubmitted && hasAnswer && (
            <>
              {regradingMode && onToggleCorrectness ? (
                <button
                  onClick={() => onToggleCorrectness(q.questionId, q.points)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border-2 transition-all hover:scale-105 backdrop-blur-sm shadow-md ${
                    q.isCorrect 
                      ? "border-emerald-500 bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200 shadow-emerald-200/50" 
                      : "border-rose-500 bg-rose-100/80 text-rose-700 hover:bg-rose-200 shadow-rose-200/50"
                  }`}
                >
                  {q.isCorrect ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Đúng
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      Sai
                    </>
                  )}
                </button>
              ) : (
                <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold backdrop-blur-sm shadow-md ${
                  q.isCorrect 
                    ? "bg-emerald-100/80 text-emerald-700 border border-emerald-200/50 shadow-emerald-200/50" 
                    : "bg-rose-100/80 text-rose-700 border border-rose-200/50 shadow-rose-200/50"
                }`}>
                  {q.isCorrect ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Đúng
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      Sai
                    </>
                  )}
                </span>
              )}
            </>
          )}
          {!isSubmitted && hasAnswer && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-100/80 backdrop-blur-sm border border-blue-200/50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-md shadow-blue-200/50">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã trả lời
            </span>
          )}
        </div>
      </div>

      {q.imageUrl && (
        <div className="mb-4 rounded-xl border border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-sm p-3 shadow-md">
          <img src={q.imageUrl} alt="Câu hỏi" className="max-h-64 w-auto rounded-lg shadow-sm" />
        </div>
      )}

      {q.content && (
        <div className="text-base font-semibold text-slate-900 dark:text-white mb-4 leading-relaxed"><MathText text={q.content} /></div>
      )}

      {(q.type === "mcq" || q.type === "true_false") && (
        <div className="space-y-2.5">
          {(q.choices && q.choices.length > 0 ? q.choices : ['', '', '', '']).map((choice, idx) => {
            const choiceLetter = String.fromCharCode(65 + idx);
            
            const studentChoice = q.studentAnswer ? String(q.studentAnswer).trim().toUpperCase() : "";
            const correctChoiceRaw = q.answerKey ? String(q.answerKey).trim().toUpperCase() : "";
            const correctChoice = correctChoiceRaw || (q.isCorrect ? studentChoice : "");

            const isCorrectAnswer = correctChoice && choiceLetter === correctChoice;
            const isStudentChoice = studentChoice && choiceLetter === studentChoice;

            const borderClass = isCorrectAnswer 
              ? "border-emerald-400 dark:border-emerald-500/50 shadow-emerald-200/50 dark:shadow-none" 
              : isStudentChoice 
                ? "border-rose-400 dark:border-rose-500/50 shadow-rose-200/50 dark:shadow-none" 
                : "border-slate-200/50 dark:border-white/10 shadow-slate-200/30 dark:shadow-none";
            const bgClass = isCorrectAnswer 
              ? "bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200" 
              : isStudentChoice 
                ? "bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200" 
                : "bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200";
            const fontClass = (isCorrectAnswer || isStudentChoice) ? "font-semibold" : "";

            return (
              <div 
                key={`${q.questionId}-${choiceLetter}`} 
                className={`rounded-xl border backdrop-blur-sm px-4 py-3 text-sm shadow-md transition-all ${borderClass} ${bgClass} ${fontClass} hover:shadow-lg`}
              >
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-slate-200/80 dark:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">
                    {choiceLetter}
                  </span>
                  <span className="flex-1">{choice ? <MathText text={choice} /> : <em className="text-slate-400 dark:text-slate-500">Không có nội dung</em>}</span>
                  {isCorrectAnswer && (
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-xs whitespace-nowrap">
                      <CheckCircle2 className="h-4 w-4" />
                      Đáp án đúng
                    </span>
                  )}
                  {isStudentChoice && !isCorrectAnswer && (
                    <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-bold text-xs whitespace-nowrap">
                      <XCircle className="h-4 w-4" />
                      Học sinh chọn
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {q.type === "short_answer" && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center justify-between rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50/80 dark:bg-blue-950/30 px-3 py-2.5 text-xs">
            <span className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1 shrink-0 mr-2">
              <FileText className="h-3.5 w-3.5" />
              Lựa chọn HS:
            </span>
            <span className="font-bold text-blue-900 dark:text-blue-200 break-words text-right">
              {hasAnswer ? q.studentAnswer : <em className="text-slate-400 dark:text-slate-500 font-normal">Chưa trả lời</em>}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/80 dark:bg-emerald-950/30 px-3 py-2.5 text-xs">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 shrink-0 mr-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đáp án đúng:
            </span>
            <span className="font-bold text-emerald-900 dark:text-emerald-200 break-words text-right">
              {q.answerKey ? q.answerKey : <em className="text-slate-400 dark:text-slate-500 font-normal">Chưa có</em>}
            </span>
          </div>
        </div>
      )}

      {q.type === "essay" && (
        <div className="mt-4">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Câu trả lời của học sinh:
          </p>
          <div className="rounded-xl border border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm shadow-md p-4 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {hasAnswer ? q.studentAnswer : <em className="text-slate-400 dark:text-slate-500">Chưa trả lời</em>}
          </div>
        </div>
      )}

      {!hasAnswer && (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-3 flex items-center gap-2 bg-slate-100/50 dark:bg-white/5 backdrop-blur-sm rounded-xl px-3 py-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Học sinh chưa trả lời câu này
        </p>
      )}
    </div>
  );
}
