"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "info", onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[type];

  return (
    <div className="fixed top-5 right-5 sm:right-6 z-[9999] max-w-sm w-[calc(100%-2.5rem)] animate-slide-up">
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300",
          {
            "bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-50": type === "success",
            "bg-rose-50/95 dark:bg-rose-950/90 border-rose-200/80 dark:border-rose-800/50 text-rose-950 dark:text-rose-50": type === "error",
            "bg-blue-50/95 dark:bg-blue-950/90 border-blue-200/80 dark:border-blue-800/50 text-blue-950 dark:text-blue-50": type === "info",
          }
        )}
      >
        <div
          className={cn("p-1.5 rounded-xl shrink-0 mt-0.5", {
            "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400": type === "success",
            "bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400": type === "error",
            "bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400": type === "info",
          })}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm font-bold tracking-[-0.01em] leading-relaxed">
            {message}
          </div>
        </div>

        <button
          onClick={onClose}
          className="shrink-0 rounded-xl p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100"
          aria-label="Close notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
