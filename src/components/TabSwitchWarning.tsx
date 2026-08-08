'use client'

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";

interface TabSwitchWarningProps {
  sessionId: string | null;
}

export function TabSwitchWarning({ sessionId }: TabSwitchWarningProps) {
  const [isTabVisible, setIsTabVisible] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const handleVisibilityChange = () => {
      const nowVisible = document.visibilityState === 'visible';

      if (!nowVisible && isTabVisible) {
        // Trigger 1 SINGLE clean Toast notification when student leaves/switches tab
        addToast({
          title: "Cảnh báo chuyển tab!",
          description: "Hệ thống ghi nhận bạn vừa chuyển tab hoặc rời bài làm.",
          variant: "warning",
          duration: 4000,
        });

        // Track tab switch in backend
        if (sessionId) {
          fetch("/api/student-sessions/activity", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              tabSwitched: true
            }),
          }).catch(err => console.error("Failed to track tab switch:", err));
        }
      }

      setIsTabVisible(nowVisible);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTabVisible, sessionId, addToast]);

  return null;
}
