"use client";

import { useState, useEffect, useCallback } from "react";
import { MOTIVATIONAL_QUOTES } from "@/data/quotes";
import { Quote as QuoteIcon, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function MotivationalQuoteCard({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // Initialize random index client-side to prevent SSR hydration mismatch
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setIndex(randomIndex);
  }, []);

  const nextQuote = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setIndex((prevIndex) => (prevIndex + 1) % MOTIVATIONAL_QUOTES.length);
      setIsFading(false);
    }, 250);
  }, []);

  // Auto cycle every 9 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextQuote();
    }, 9000);
    return () => clearInterval(timer);
  }, [nextQuote]);

  const currentQuote = MOTIVATIONAL_QUOTES[index];

  return (
    <div
      className={cn(
        "group relative mt-5 max-w-[95%] md:max-w-xl text-center md:text-left transition-all duration-300",
        className
      )}
    >
      <div className="relative overflow-hidden rounded-[1.25rem] bg-white/70 dark:bg-[#1d1d1f]/60 backdrop-blur-xl border border-white/60 dark:border-white/5 px-4 py-3 sm:px-5 sm:py-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100/60 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-400 mt-0 shadow-[0_2px_8px_rgba(0,102,204,0.15)] dark:shadow-none border border-blue-200/50 dark:border-blue-700/30">
            <QuoteIcon className="h-3 w-3" />
          </div>

          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform",
                isFading ? "opacity-0 translate-y-2 scale-[0.98]" : "opacity-100 translate-y-0 scale-100"
              )}
            >
              <p className="text-[14px] sm:text-[15px] font-medium leading-[24px] text-slate-700 dark:text-slate-300 tracking-[-0.01em] text-center sm:text-left italic">
                “{currentQuote.text}”
              </p>
              {currentQuote.author && (
                <p className="mt-1.5 text-[12px] sm:text-[13px] font-bold text-[#0066cc]/90 dark:text-blue-400/90 flex items-center justify-center sm:justify-start gap-1.5 not-italic">
                  <span className="w-4 h-[2px] bg-[#0066cc]/40 dark:bg-blue-400/40 rounded-full inline-block"></span>
                  {currentQuote.author}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
