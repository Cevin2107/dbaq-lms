"use client";

import { loginAdmin } from "@/lib/adminAuth";
import { startAuthentication } from "@simplewebauthn/browser";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Fingerprint } from "lucide-react";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeyLoading, setPasskeyLoading] = useState(false);

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
        throw new Error(verifyData.error || "Không thể xác thực");
      }

      window.location.assign("/admin/dashboard");
    } catch (err: any) {
      console.error("Passkey exception:", err);
      setPasskeyError(err?.message || "Đăng nhập bằng vân tay thất bại");
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-100 dark:bg-blue-900/20 opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-sky-100 dark:bg-sky-900/20 opacity-60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0066cc] text-white shadow-lg shadow-blue-500/30 mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">Trang quản trị</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">Hệ thống quản lý nội bộ</p>
        </div>

        <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 sm:p-10">
          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white mb-1.5">Đăng nhập</h2>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-6">Nhập mật khẩu để tiếp tục.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Mật khẩu admin</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-[15px] text-slate-900 dark:text-white transition focus:border-[#0066cc] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                required
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-[14px] font-medium text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
            {passkeyError && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-[14px] font-medium text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {passkeyError}
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center h-[52px] rounded-full text-[15px] font-semibold text-white transition-all disabled:opacity-60 bg-[#0066cc] shadow-md shadow-blue-500/20 hover:bg-[#005bb5] hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đăng nhập...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Đăng nhập →
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={passkeyLoading}
                className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60"
                aria-label="Đăng nhập bằng vân tay"
              >
                <Fingerprint className={`h-5 w-5 ${passkeyLoading ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </form>
        </div>
        <div className="mt-8 text-center">
          <Link href="/" className="text-[14px] font-semibold text-[#0066cc] dark:text-blue-400 hover:text-[#005bb5] dark:hover:text-blue-300 transition">
            ← Quay lại trang học sinh
          </Link>
        </div>
      </div>
    </main>
  );
}
