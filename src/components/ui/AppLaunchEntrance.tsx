"use client";

import React from "react";

interface AppLaunchEntranceProps {
  children: React.ReactNode;
}

/**
 * AppLaunchEntrance is kept for backwards-compatibility.
 * To avoid jarring 0.1s splash screen flash on page refresh/F5,
 * it passes children directly while Next.js loading.tsx provides unified, smooth loading.
 */
export function AppLaunchEntrance({ children }: AppLaunchEntranceProps) {
  return <>{children}</>;
}
