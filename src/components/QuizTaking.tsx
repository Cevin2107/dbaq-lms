"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Assignment, Question } from "@/lib/types";
import { MathText } from "@/components/MathText";
import { useTheme } from "@/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  RotateCcw,
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface Props {
  assignment: Assignment;
  questions: Question[];
  initialStudentName?: string;
}

interface QuestionFeedback {
  selectedChoice: string;
  isCorrect: boolean;
  correctChoice: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const formatClock = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

export function QuizTaking({ assignment, questions: initialQuestions, initialStudentName }: Props) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [studentName, setStudentName] = useState(initialStudentName || "Học sinh");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const quizConfig = assignment.quizConfig || {};

  // Filter actual non-section questions
  const nonSectionQuestions = useMemo(() => {
    return initialQuestions.filter((q) => q.type !== "section");
  }, [initialQuestions]);

  const [shuffleKey, setShuffleKey] = useState(0);

  // Prepared questions (shuffled if needed)
  const preparedQuestions = useMemo(() => {
    let list = [...nonSectionQuestions];
    if (quizConfig.shuffleQuestions) {
      list = shuffleArray(list);
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonSectionQuestions, quizConfig.shuffleQuestions, shuffleKey]);

  // Map each question's display options & letter mapping for shuffleOptions
  // Display letter (A, B, C, D) -> original index (0, 1, 2, 3) -> original letter
  const questionOptionsMap = useMemo(() => {
    const map: Record<
      string,
      {
        displayOptions: Array<{ letter: string; text: string; originalLetter: string }>;
        correctDisplayLetter: string;
      }
    > = {};

    for (const q of preparedQuestions) {
      const rawChoices = q.choices && q.choices.length > 0 ? q.choices : ["", "", "", ""];
      const rawAnswerKey = (q.answerKey || "A").trim().toUpperCase();

      // Original options with their original letters (A=0, B=1, C=2, D=3)
      let items = rawChoices.map((text, idx) => ({
        originalLetter: String.fromCharCode(65 + idx),
        text,
      }));

      if (quizConfig.shuffleOptions) {
        items = shuffleArray(items);
      }

      // Re-assign display letters A, B, C, D based on current display order
      const displayOptions = items.map((item, idx) => ({
        letter: String.fromCharCode(65 + idx),
        text: item.text,
        originalLetter: item.originalLetter,
      }));

      // Find which display letter corresponds to the original answerKey
      const correctItem = displayOptions.find((d) => d.originalLetter === rawAnswerKey);
      const correctDisplayLetter = correctItem ? correctItem.letter : rawAnswerKey;

      map[q.id] = {
        displayOptions,
        correctDisplayLetter,
      };
    }

    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preparedQuestions, quizConfig.shuffleOptions, shuffleKey]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, QuestionFeedback>>({});
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { addToast } = useToast();

  // Timer
  const hasTimer = Boolean(assignment.durationMinutes);
  const [remaining, setRemaining] = useState(
    hasTimer ? (assignment.durationMinutes ?? 0) * 60 : 0
  );

  const currentQ = preparedQuestions[currentIndex];
  const totalQuestions = preparedQuestions.length;
  const currentFeedback = currentQ ? feedbacks[currentQ.id] : undefined;
  const answeredCount = Object.keys(answers).length;

  const draftKey = useMemo(() => `quiz-draft-${assignment.id}`, [assignment.id]);
  const hasLoadedDraftRef = useRef(false);

  // Session registration & Draft restoration
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedName = localStorage.getItem(`student-name-${assignment.id}`) || initialStudentName;
    const savedSessionId = localStorage.getItem(`session-${assignment.id}`);

    if (savedName) setStudentName(savedName);
    if (savedSessionId) setSessionId(savedSessionId);

    const initOrResumeSession = async () => {
      let activeSessionId = savedSessionId;
      try {
        if (!activeSessionId) {
          const res = await fetch("/api/student-sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assignmentId: assignment.id,
              studentName: savedName || studentName || "Học sinh",
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.session?.id) {
              activeSessionId = data.session.id;
              setSessionId(data.session.id);
              localStorage.setItem(`session-${assignment.id}`, data.session.id);
            }
          }
        } else {
          // Keep active status
          fetch("/api/student-sessions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: activeSessionId, status: "active" }),
          }).catch(() => {});
        }

        // Restore draft answers if available
        if (activeSessionId && !hasLoadedDraftRef.current) {
          hasLoadedDraftRef.current = true;
          let loadedDraft: Record<string, string> | null = null;
          try {
            const draftRes = await fetch(`/api/student-sessions/${activeSessionId}/draft`);
            if (draftRes.ok) {
              const draftData = await draftRes.json();
              if (draftData.draftAnswers && Object.keys(draftData.draftAnswers).length > 0) {
                loadedDraft = draftData.draftAnswers;
              }
            }
          } catch {}

          if (!loadedDraft) {
            try {
              const localSaved = localStorage.getItem(draftKey);
              if (localSaved) {
                const parsed = JSON.parse(localSaved);
                if (parsed?.answers && Object.keys(parsed.answers).length > 0) {
                  loadedDraft = parsed.answers;
                }
              }
            } catch {}
          }

          if (loadedDraft && Object.keys(loadedDraft).length > 0) {
            setAnswers(loadedDraft);

            // Reconstruct feedbacks for answered questions
            const restoredFeedbacks: Record<string, QuestionFeedback> = {};
            for (const q of preparedQuestions) {
              const answeredLetter = loadedDraft[q.id];
              if (answeredLetter) {
                const qConfig = questionOptionsMap[q.id];
                const rawKey = (q.answerKey || "A").trim().toUpperCase();
                const correctDisplay = qConfig?.correctDisplayLetter || rawKey;

                // Find display letter that matches answered originalLetter
                const matchedOption = qConfig?.displayOptions.find((d) => d.originalLetter === answeredLetter);
                const displayChoice = matchedOption ? matchedOption.letter : answeredLetter;

                restoredFeedbacks[q.id] = {
                  selectedChoice: displayChoice,
                  isCorrect: answeredLetter.toUpperCase() === rawKey,
                  correctChoice: correctDisplay,
                };
              }
            }
            setFeedbacks(restoredFeedbacks);

            // Jump to the first question that hasn't been answered yet
            const firstUnansweredIndex = preparedQuestions.findIndex((q) => !loadedDraft?.[q.id]);
            if (firstUnansweredIndex !== -1) {
              setCurrentIndex(firstUnansweredIndex);
            } else {
              // If all were answered, go to the last question
              setCurrentIndex(Math.max(0, preparedQuestions.length - 1));
            }
          }
        }
      } catch (err) {
        console.error("Failed to init or resume session:", err);
      }
    };

    initOrResumeSession();
  }, [assignment.id, initialStudentName, studentName, draftKey, preparedQuestions, questionOptionsMap]);

  // Countdown timer
  useEffect(() => {
    if (!hasTimer || remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasTimer, remaining]);

  // Submit handler
  const handleFinish = useCallback(
    async (finalAnswers: Record<string, string>) => {
      if (submitting) return;
      setSubmitting(true);
      try {
        const durationSeconds = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentId: assignment.id,
            studentName: studentName || "Học sinh",
            sessionId: sessionId || undefined,
            answers: finalAnswers,
            essayImages: {},
            durationSeconds,
          }),
        });
        const data = await res.json();
        if (res.ok && data.submissionId) {
          let correct = 0;
          for (const q of preparedQuestions) {
            const ans = finalAnswers[q.id];
            const expected = (q.answerKey || "").trim().toUpperCase();
            if (ans && ans.toUpperCase() === expected) {
              correct++;
            }
          }
          try {
            localStorage.removeItem(draftKey);
            localStorage.removeItem(`session-${assignment.id}`);
          } catch {}
          // Chuyển hướng trực tiếp sang trang Result chi tiết
          router.push(`/assignments/${assignment.id}/result?sid=${data.submissionId}`);
        } else {
          setSubmitting(false);
          alert(data.error || "Có lỗi khi nộp bài. Vui lòng thử lại.");
        }
      } catch (err) {
        setSubmitting(false);
        alert("Lỗi kết nối khi nộp bài. Vui lòng thử lại.");
      }
    },
    [assignment.id, studentName, sessionId, startTime, submitting, draftKey, router]
  );

  const handleRestartQuiz = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAnswers({});
    setFeedbacks({});
    setCurrentIndex(0);
    setSubmitting(false);
    setShuffleKey((prev) => prev + 1);
    try {
      localStorage.removeItem(draftKey);
      if (sessionId) {
        fetch(`/api/student-sessions/${sessionId}/draft`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftAnswers: {} }),
        }).catch(() => {});
      }
    } catch {}
    if (hasTimer) {
      setRemaining((assignment.durationMinutes ?? 0) * 60);
    }
  };

  // Time up auto finish
  useEffect(() => {
    if (hasTimer && remaining === 0 && !submitting) {
      handleFinish(answers);
    }
  }, [hasTimer, remaining, submitting, answers, handleFinish]);

  // Exit handlers
  const handleExitClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (answeredCount > 0) {
      setShowExitConfirm(true);
    } else {
      handleExitConfirm(false);
    }
  };

  const handleExitConfirm = async (saveProgress: boolean) => {
    if (saveProgress && sessionId) {
      try {
        await fetch("/api/student-sessions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, status: "exited" }),
        });
      } catch (e) {}
      localStorage.removeItem(`session-${assignment.id}`);
      localStorage.removeItem(`student-name-${assignment.id}`);
    } else {
      if (sessionId) {
        try {
          await fetch(`/api/student-sessions/${sessionId}`, { method: "DELETE" });
        } catch (e) {}
      }
      localStorage.removeItem(`session-${assignment.id}`);
      localStorage.removeItem(`student-name-${assignment.id}`);
      localStorage.removeItem(draftKey);
    }
    setShowExitConfirm(false);
    addToast({
      title: "Đã thoát bài làm",
      description: saveProgress ? "Tiến trình làm bài của bạn đã được lưu lại." : "Đã thoát khỏi trang bài làm.",
      variant: "info",
      duration: 3500,
    });
    router.push("/");
  };

  // Audio effects
  const playSound = (isCorrect: boolean) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isCorrect) {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(240, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // AudioContext not allowed or not supported
    }
  };

  // Cleanup auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  // Options for current question (supports shuffleOptions)
  const currentOptions = useMemo(() => {
    if (!currentQ) return [];
    const questionConfig = questionOptionsMap[currentQ.id];
    if (questionConfig && questionConfig.displayOptions.length > 0) {
      return questionConfig.displayOptions;
    }
    const rawChoices = currentQ.choices && currentQ.choices.length > 0
      ? currentQ.choices
      : ["", "", "", ""];

    return rawChoices.map((text, idx) => ({
      letter: String.fromCharCode(65 + idx),
      text,
      originalLetter: String.fromCharCode(65 + idx),
    }));
  }, [currentQ, questionOptionsMap]);

  // Choice selection
  const handleSelectOption = (choiceLetter: string) => {
    if (!currentQ || currentFeedback || submitting) return;

    // Retrieve correct display choice from questionOptionsMap
    const questionConfig = questionOptionsMap[currentQ.id];
    const correctDisplayLetter = questionConfig?.correctDisplayLetter || (currentQ.answerKey || "A").trim().toUpperCase();
    const isCorrect = choiceLetter.toUpperCase() === correctDisplayLetter;

    // Find original letter to store in submission answers (matches DB answer_key)
    const selectedOption = currentOptions.find((opt) => opt.letter === choiceLetter);
    const originalLetter = selectedOption?.originalLetter || choiceLetter;

    const newFeedback: QuestionFeedback = {
      selectedChoice: choiceLetter,
      isCorrect,
      correctChoice: correctDisplayLetter,
    };

    const nextAnswers = { ...answers, [currentQ.id]: originalLetter };
    setAnswers(nextAnswers);
    setFeedbacks((prev) => ({ ...prev, [currentQ.id]: newFeedback }));

    // Save draft locally and to server immediately
    try {
      localStorage.setItem(draftKey, JSON.stringify({ answers: nextAnswers }));
      if (sessionId) {
        fetch(`/api/student-sessions/${sessionId}/draft`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftAnswers: nextAnswers }),
        }).catch(() => {});
      }
    } catch {}

    playSound(isCorrect);

    // Auto advance if configured
    if (quizConfig.autoAdvance) {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      const waitTime = (quizConfig.autoAdvanceSeconds || 2) * 1000;
      autoAdvanceTimerRef.current = setTimeout(() => {
        handleNext(nextAnswers);
      }, waitTime);
    }
  };

  const handleNext = (overrideAnswers?: Record<string, string>) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    const effectiveAnswers = overrideAnswers || answers;
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinish(effectiveAnswers);
    }
  };

  // Check if any option is long or contains complex formula to expand to 1 full width column
  const isLongChoice = useMemo(() => {
    return currentOptions.some(
      (opt) =>
        opt.text &&
        (opt.text.length > 30 ||
          opt.text.includes("\n") ||
          opt.text.includes("$$") ||
          opt.text.includes("\\begin") ||
          opt.text.includes("\\frac") ||
          opt.text.includes("\\sqrt") ||
          opt.text.includes("\\int") ||
          opt.text.includes("\\sum"))
    );
  }, [currentOptions]);

  if (!currentQ || totalQuestions === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-8 rounded-[2rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 max-w-md w-full">
          <Zap className="h-10 w-10 text-purple-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Chưa có câu hỏi trắc nghiệm
          </h2>
          <p className="text-xs text-slate-500 mt-1">Quiz này hiện chưa có nội dung câu hỏi.</p>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + (currentFeedback ? 1 : 0)) / totalQuestions) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7] dark:bg-[#000000] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border-b border-black/5 dark:border-white/10 px-4 sm:px-6 py-3.5 transition-all">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Quiz Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md shadow-purple-500/25 text-white">
              <Zap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {assignment.title}
              </h1>
              <div className="flex items-center gap-2 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                <span>Câu {currentIndex + 1} / {totalQuestions}</span>
              </div>
            </div>
          </div>

          {/* Right: Controls & Timer */}
          <div className="flex items-center gap-2 sm:gap-3">
            {hasTimer && (
              <div
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all",
                  remaining <= 300
                    ? "bg-red-500/10 text-red-600 border-red-500/20 animate-pulse"
                    : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-black/5 dark:border-white/10"
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{formatClock(remaining)}</span>
              </div>
            )}

            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-600 dark:text-slate-300 transition-all"
              title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
              aria-label={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            <button
              onClick={handleExitClick}
              className={clsx(
                "flex items-center justify-center gap-1.5 rounded-full px-4 py-2 sm:py-2 text-xs sm:text-sm font-semibold transition-all duration-300 ease-spring border shadow-sm hover:-translate-y-0.5 active:scale-95",
                isDark ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white" : "bg-white border-black/[0.06] text-slate-700 hover:bg-slate-50"
              )}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main interactive question area */}
      <main className="flex-1 max-w-[1000px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        {/* Question Card */}
        <div className="relative rounded-[2.5rem] bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-6 sm:p-10 mb-6 transition-all animate-fade-in">
          {/* Question Index Badge */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              Câu {currentIndex + 1}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {currentQ.points ? `${currentQ.points} điểm` : "1 điểm"}
            </span>
          </div>

          {/* Question Image if present */}
          {currentQ.imageUrl && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 max-h-[350px] bg-slate-50 dark:bg-black/30 flex items-center justify-center">
              <img
                src={currentQ.imageUrl}
                alt={`Hình minh họa câu ${currentIndex + 1}`}
                className="max-h-[350px] object-contain w-full"
                loading="lazy"
              />
            </div>
          )}

          {/* Question Stem rendered with KaTeX */}
          <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed select-text [overflow-wrap:anywhere] [&_.katex-display]:overflow-x-auto">
            <MathText text={currentQ.content || ""} />
          </div>
        </div>

        {/* 4 Answer Options Grid (1 col on mobile or if formula is long, 2 cols on tablet/desktop) */}
        <div className={clsx("grid gap-3.5 sm:gap-4 mb-6", isLongChoice ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
          {currentOptions.map((opt) => {
            const isSelected = currentFeedback?.selectedChoice === opt.letter;
            const isCorrectOption = currentFeedback?.correctChoice === opt.letter;
            const isAnswered = Boolean(currentFeedback);

            // Styling states
            let cardStyle = "bg-white/90 dark:bg-[#18181b]/90 border-black/5 dark:border-white/10 hover:border-purple-500/40 hover:shadow-lg hover:-translate-y-0.5";
            let letterStyle = "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300";

            if (isAnswered) {
              if (isCorrectOption) {
                // Correct answer is highlighted in GREEN (solid, no pulsing)
                cardStyle = "bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm";
                letterStyle = "bg-emerald-500 text-white font-extrabold";
              } else if (isSelected && !currentFeedback?.isCorrect) {
                // Selected wrong answer is highlighted in RED (solid, no pulsing)
                cardStyle = "bg-red-500/15 dark:bg-red-500/20 border-red-500 ring-2 ring-red-500 text-red-950 dark:text-red-100 shadow-sm";
                letterStyle = "bg-red-500 text-white font-extrabold";
              } else {
                // Other non-target options are dimmed out
                cardStyle = "opacity-30 bg-slate-100/50 dark:bg-white/5 border-transparent text-slate-400 dark:text-slate-500 pointer-events-none transition-opacity duration-300";
                letterStyle = "bg-slate-200/50 dark:bg-white/5 text-slate-400";
              }
            }

            return (
              <button
                key={opt.letter}
                type="button"
                role="button"
                disabled={isAnswered || submitting}
                onClick={() => handleSelectOption(opt.letter)}
                className={clsx(
                  "group relative flex items-start gap-3.5 p-4 sm:p-5 rounded-[2rem] border backdrop-blur-xl text-left transition-all duration-300 w-full min-h-[68px] h-auto select-text active:scale-[0.99] outline-none",
                  cardStyle
                )}
                aria-label={`Đáp án ${opt.letter}`}
              >
                {/* Option Letter Indicator */}
                <div
                  className={clsx(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs sm:text-sm font-black transition-all",
                    letterStyle
                  )}
                >
                  {isAnswered && isCorrectOption ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isAnswered && isSelected && !currentFeedback?.isCorrect ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    opt.letter
                  )}
                </div>

                {/* Option Text with KaTeX - Full box expansion, no scrollbars inside */}
                <div className="flex-1 min-w-0 pt-1 text-sm sm:text-base font-semibold leading-relaxed [overflow-wrap:anywhere] break-words select-text [&_.katex-display]:my-1 [&_.katex-display]:overflow-x-visible">
                  <MathText text={opt.text} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Feedback Bar & Action Button */}
        {currentFeedback && (
          <div
            className={clsx(
              "rounded-[2rem] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up shadow-xl backdrop-blur-2xl border transition-all",
              currentFeedback.isCorrect
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                : "bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white",
                  currentFeedback.isCorrect ? "bg-emerald-600" : "bg-red-600"
                )}
              >
                {currentFeedback.isCorrect ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <XCircle className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="text-sm font-black">
                  {currentFeedback.isCorrect ? "Chính xác! Làm tốt lắm 🎉" : "Chưa chính xác!"}
                </p>
                <p className="text-xs opacity-80 mt-0.5">
                  {currentFeedback.isCorrect
                    ? "Hãy tiếp tục phát huy ở câu tiếp theo!"
                    : `Đáp án đúng là phương án ${currentFeedback.correctChoice}. Hãy ghi nhớ nhé!`}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleNext()}
              disabled={submitting}
              className={clsx(
                "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-xs sm:text-sm font-black text-white shadow-lg active:scale-95 transition-all self-end sm:self-auto",
                currentFeedback.isCorrect
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30"
                  : "bg-[#0066cc] hover:bg-[#005bb5] shadow-blue-500/30"
              )}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {currentIndex < totalQuestions - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowExitConfirm(false)} />
          <div className={clsx("relative z-10 w-full max-w-sm rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in zoom-in-95 duration-200 border", isDark ? "bg-[#1d1d1f] border-white/5" : "bg-white/90 backdrop-blur-xl border-black/5")}>
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 mb-4 ring-8 ring-amber-500/10">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className={clsx("text-[19px] font-bold tracking-[-0.01em] mb-1", isDark ? "text-white" : "text-slate-900")}>Thoát bài ngay?</h3>
              <p className={clsx("text-[15px]", isDark ? "text-slate-400" : "text-slate-500")}>Bạn đã làm {answeredCount}/{totalQuestions} câu. Tiến trình có thể lưu lại được.</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => handleExitConfirm(true)} className="w-full rounded-full bg-[#0066cc] hover:bg-[#005bb5] px-4 py-3.5 text-[15px] font-bold text-white transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                Lưu và thoát (Tiếp tục sau)
              </button>
              <button onClick={() => handleExitConfirm(false)} className={clsx("w-full rounded-full border px-4 py-3.5 text-[15px] font-bold transition-all active:scale-[0.98]", isDark ? "border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20" : "border-red-200 text-red-600 bg-red-50 hover:bg-red-100")}>
                Xoá bài (Làm lại từ đầu)
              </button>
              <button onClick={() => setShowExitConfirm(false)} className={clsx("w-full rounded-full px-4 py-3.5 text-[15px] font-bold transition-all active:scale-[0.98]", isDark ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100")} >
                Hủy, quay lại bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
