'use client'

import { useEffect, useState } from "react";
import { Check, Loader2, WifiOff } from "lucide-react";

interface AutoSaveIndicatorProps {
  lastSaveTime: number | null;
  isSaving: boolean;
  isOnline?: boolean;
}

export function AutoSaveIndicator({ lastSaveTime, isSaving, isOnline = true }: AutoSaveIndicatorProps) {
  const [displayText, setDisplayText] = useState<string>(""); 
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setDisplayText("Mất kết nối - Đã lưu cục bộ");
      setShowIndicator(true);
      return;
    }

    if (isSaving) {
      setDisplayText("Đang đồng bộ...");
      setShowIndicator(true);
      return;
    }

    if (lastSaveTime) {
      setDisplayText("Đã đồng bộ lên máy chủ");
      setShowIndicator(true);
      
      // Hide after 3 seconds
      const timeout = setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [isSaving, lastSaveTime, isOnline]);

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-6 right-6 z-30 animate-slide-up">
      <div className={`
        flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all
        ${!isOnline
          ? 'bg-amber-50/95 border border-amber-200 text-amber-700 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-300'
          : isSaving 
            ? 'bg-blue-50/95 border border-blue-200 text-blue-700 dark:bg-blue-950/90 dark:border-blue-800 dark:text-blue-300' 
            : 'bg-emerald-50/95 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-300'
        }
      `}>
        {!isOnline ? (
          <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ) : isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        <span className="text-sm font-semibold">
          {displayText}
        </span>
      </div>
    </div>
  );
}
