'use client';

import React, { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
}

const STUDENT_TIPS = [
  'Kiên trì tích lũy kiến thức mỗi ngày, bứt phá thành tích rạng rỡ.',
  'Nắm chắc lý thuyết cốt lõi, tự tin làm chủ mọi dạng bài tập khó.',
  'Đang sẵn sàng lộ trình bài tập và chuyên đề học tập của bạn...',
  'Chuẩn bị năng lượng học tập tốt nhất để chinh phục điểm 9, điểm 10 nhé!',
  'Tập trung và chủ động là bí quyết đạt kết quả cao trong mọi kỳ thi.',
];

export function LoadingScreen({
  message = 'Đang tải dữ liệu học tập...',
  submessage = 'Gia sư Đào Bá Anh Quân LMS',
}: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [isTipFading, setIsTipFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTipFading(true);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % STUDENT_TIPS.length);
        setIsTipFading(false);
      }, 300);
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-[#0066cc]/20 via-[#38bdf8]/15 to-transparent blur-3xl dark:from-[#0066cc]/25" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-tl from-[#38bdf8]/20 via-[#6366f1]/15 to-transparent blur-3xl dark:from-[#38bdf8]/20" />

      {/* Center Liquid Glass Loading Card */}
      <div className="relative z-10 w-full max-w-[420px] rounded-[2.5rem] bg-white/80 dark:bg-[#121217]/85 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_24px_60px_-15px_rgba(0,102,204,0.18)] dark:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] p-7 sm:p-9 text-center animate-fade-in">
        
        {/* Student Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 text-[#0066cc] dark:text-[#38bdf8] text-[11px] font-bold uppercase tracking-wider mb-5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0066cc] dark:bg-sky-400"></span>
          </span>
          <span>Không Gian Học Tập • LMS</span>
        </div>

        {/* Animated Brand Logo with Ambient Glow */}
        <div className="relative mx-auto mb-6 flex items-center justify-center animate-gentle-float">
          <div className="absolute -inset-3 bg-gradient-to-tr from-[#0084ff] to-[#38bdf8] opacity-70 blur-xl rounded-full animate-soft-pulse-glow" />
          <BrandLogo size="lg" glow animate className="relative z-10 shadow-2xl" />
        </div>

        {/* Headline & Submessage */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
          {message}
        </h3>
        <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mb-6 font-medium">
          {submessage}
        </p>

        {/* Apple-Style Shimmer Progress Bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10 shadow-inner mb-6">
          <div className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-[#0084ff] to-[#38bdf8] animate-shimmer-progress" />
        </div>

        {/* Student Motivational Quote Card */}
        <div className="rounded-[1.25rem] bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 p-3.5 sm:p-4 text-center transition-all duration-300">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Góc truyền cảm hứng học tập
          </p>
          <p
            className={`text-xs sm:text-[13px] font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic transition-opacity duration-300 min-h-[38px] flex items-center justify-center ${
              isTipFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            &ldquo;{STUDENT_TIPS[tipIndex]}&rdquo;
          </p>
        </div>
      </div>

      {/* Subtle Bottom System Signature */}
      <div className="relative z-10 mt-6 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-600 uppercase">
        Gia sư Đào Bá Anh Quân • Học tập thông minh
      </div>
    </div>
  );
}
