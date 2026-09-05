"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Fingerprint,
  ShieldAlert,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { loginAdmin } from "@/lib/adminAuth";
import { startAuthentication } from "@simplewebauthn/browser";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/Footer";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Warm up the passkey API route to resolve Next.js dynamic compile and serverless cold starts
    fetch("/api/admin/passkeys/auth-options")
      .then((res) => {
        if (res.ok) {
          console.log("[Passkey Pre-warm] API route warmed up successfully.");
        }
      })
      .catch((err) => console.warn("[Passkey Pre-warm] API route pre-warm failed:", err));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPasskeyError("");
    const formData = new FormData(e.currentTarget);
    const result = await loginAdmin(formData);
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  async function readJsonResponse(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json();
    }
    const text = await res.text();
    return text ? { error: text } : {};
  }

  async function handlePasskeyLogin() {
    setPasskeyLoading(true);
    setPasskeyError("");
    setError("");

    try {
      const optionsRes = await fetch("/api/admin/passkeys/auth-options", { method: "POST" });
      const options = await readJsonResponse(optionsRes);
      if (!optionsRes.ok) {
        throw new Error(options.error || "Không thể tạo yêu cầu xác thực");
      }

      const assertionResponse = await startAuthentication(options);
      const verifyRes = await fetch("/api/admin/passkeys/auth-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assertionResponse }),
      });
      const verifyData = await readJsonResponse(verifyRes);
      if (!verifyRes.ok) {
        console.error("Passkey Verify Error Detail:", verifyData);
        throw new Error(verifyData.error || "Không thể xác thực passkey");
      }

      window.location.assign("/admin/dashboard");
    } catch (err: any) {
      console.error("Passkey exception:", err);
      setPasskeyError(err?.message || "Đăng nhập bằng passkey thất bại");
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-[#0066cc]/20 selection:text-[#0066cc]">
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-400/10 to-transparent blur-3xl dark:from-blue-600/10 dark:via-indigo-900/10" />
      <div className="pointer-events-none absolute top-1/4 -right-40 h-[36rem] w-[36rem] rounded-full bg-gradient-to-bl from-sky-400/20 via-blue-500/10 to-transparent blur-3xl dark:from-sky-500/10 dark:via-blue-950/20" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-indigo-300/15 via-blue-400/10 to-transparent blur-3xl dark:from-indigo-950/15" />

      {/* Top Header Bar - Synchronized with Main Portal */}
      <header className="relative z-20 w-full border-b border-black/[0.05] dark:border-white/[0.06] bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
            <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0066cc] to-blue-700 text-white shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105 duration-300">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-base md:text-lg tracking-tight text-slate-900 dark:text-white truncate">
                  Gia sư Đào Bá Anh Quân
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-[#0066cc] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                  Quản trị viên
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Hệ thống Quản lý Học tập & Lịch dạy
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-3.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Hệ thống trực tuyến</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-16">
        <div className="w-full max-w-md animate-fade-in">
          
          {/* Card Container */}
          <div className="rounded-[2rem] sm:rounded-[2.5rem] bg-white/85 dark:bg-[#1a1a1f]/85 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_20px_50px_rgba(0,102,204,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-5 sm:p-8 md:p-9 transition-all relative overflow-hidden">
            
            {/* Card Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">
                    Đăng nhập Quản trị
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bảng điều khiển & Quản lý đào tạo
                  </p>
                </div>
              </div>
            </div>

            {/* Clear, Concise Admin Warning */}
            <div className="mb-6 rounded-2xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 backdrop-blur-md flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Khu vực dành riêng cho Quản trị viên và Gia sư Đào Bá Anh Quân.</span>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="mb-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3.5 text-xs text-red-600 dark:text-red-400 leading-relaxed">
                {error}
              </div>
            )}
            {passkeyError && (
              <div className="mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-3.5 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                {passkeyError}
              </div>
            )}

            {/* Form: Master Password */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Mật khẩu Quản trị
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    className="w-full h-12 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 pl-10 pr-11 py-2.5 sm:py-3 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 placeholder:text-sm transition-all focus:border-[#0066cc] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                    required
                    autoFocus
                    disabled={loading || passkeyLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((curr) => !curr)}
                    className="absolute inset-y-0 right-0 flex h-12 w-11 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    disabled={loading || passkeyLoading}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="brand"
                className="w-full h-12 rounded-2xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all"
                disabled={loading || passkeyLoading}
                loading={loading}
              >
                <span>{loading ? "Đang xác thực quyền..." : "Đăng nhập Quản trị"}</span>
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            {/* Passkey Alternative */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={passkeyLoading || loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-800/40 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-[#0066cc] dark:hover:text-blue-400 disabled:opacity-60"
              >
                <Fingerprint className={`h-4 w-4 ${passkeyLoading ? "animate-pulse text-[#0066cc]" : ""}`} />
                <span>{passkeyLoading ? "Đang xác thực Passkey..." : "Đăng nhập nhanh bằng Passkey"}</span>
              </button>
            </div>

            {/* Back link */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#0066cc] dark:hover:text-blue-400 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Quay lại trang học sinh</span>
              </Link>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer variant="admin" />
    </div>
  );
}
