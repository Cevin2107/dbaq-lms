'use client';

import { GraduationCap } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
}

export function LoadingScreen({
  message = 'Đang tải dữ liệu học tập...',
  submessage = 'Gia sư Đào Bá Anh Quân • LMS Portal',
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-[#0066cc]/20">
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-400/10 to-transparent blur-3xl dark:from-blue-600/10" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-gradient-to-tl from-sky-400/20 via-blue-500/10 to-transparent blur-3xl dark:from-sky-500/10" />

      {/* Center Liquid Glass Loading Card */}
      <div className="relative z-10 w-full max-w-sm rounded-[2.5rem] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_20px_50px_rgba(0,102,204,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-8 text-center animate-fade-in">
        
        {/* Animated Icon with specular ring */}
        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066cc] to-blue-700 text-white shadow-lg shadow-blue-500/30">
          <div className="absolute inset-0 rounded-2xl bg-blue-400 animate-ping opacity-25" />
          <GraduationCap className="h-8 w-8 relative z-10 animate-pulse" />
        </div>

        {/* Message & Submessage */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-1">
          {message}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          {submessage}
        </p>

        {/* Smooth Pulse Progress Bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-[#0066cc] via-indigo-500 to-sky-400 opacity-80 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
