"use client";

import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f5f5f7] dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-500">
      {/* Background ambient lighting aura */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden select-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[140px] transform-gpu" />
        <div className="absolute top-1/3 left-1/3 w-[360px] h-[360px] rounded-full bg-sky-400/10 dark:bg-indigo-600/10 blur-[120px] transform-gpu" />
      </div>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md rounded-[2.5rem] bg-white/75 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_24px_60px_-15px_rgba(0,102,204,0.12)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] p-8 sm:p-10 text-center animate-fade-in relative transition-all duration-300">
          
          {/* Specular badge glow */}
          <div className="mx-auto mb-5 relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-b from-blue-500/15 to-blue-600/5 dark:from-blue-500/25 dark:to-blue-700/10 border border-blue-500/20 dark:border-blue-400/20 shadow-inner">
            <Compass className="h-10 w-10 text-[#0066cc] dark:text-[#2997ff] animate-pulse" />
          </div>

          <div className="inline-block px-3 py-1 mb-3 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/50 text-[11px] font-bold uppercase tracking-wider text-[#0066cc] dark:text-blue-400">
            Mã lỗi 404 • Không tìm thấy
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-[#1d1d1f] dark:text-white mb-2">
            Trang không tồn tại
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-xs mx-auto">
            Đường dẫn bạn đang tìm kiếm có thể đã bị di chuyển, xoá hoặc chưa từng tồn tại trên hệ thống.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-full text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#005bb5] shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-spring"
            >
              <Home className="h-4 w-4" />
              <span>Về trang chủ</span>
            </Link>

            <button
              onClick={() => {
                if (typeof window !== "undefined") window.history.back();
              }}
              className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-spring"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
