"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { useState } from "react";

export function HeaderBar({ studentName }: { studentName?: string }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith("/admin");

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabaseClient");
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  const initialLetter = studentName ? studentName.trim().slice(-1).toUpperCase() : "";

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4 pointer-events-none">
      <header className="mx-auto w-full max-w-[1440px] rounded-full bg-white/80 dark:bg-[#161618]/85 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] pointer-events-auto transition-all duration-500 ease-liquid">
        <div className="flex h-13 sm:h-14 items-center justify-between px-3 sm:px-6" suppressHydrationWarning>
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-all duration-300 group" suppressHydrationWarning>
            <BrandLogo size="md" animate glow className="shadow-sm ring-1 ring-white/40 dark:ring-white/10 transition-transform duration-300 group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-[13.5px] sm:text-[15px] font-bold tracking-tight text-[#1d1d1f] dark:text-white leading-tight group-hover:text-[#0066cc] dark:group-hover:text-[#2997ff] transition-colors">
                Gia sư Đào Bá Anh Quân
              </span>
              <span className="text-[10px] font-semibold text-[#0066cc] dark:text-[#2997ff] uppercase tracking-wider hidden md:inline">
                LMS Pro
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2.5 text-[13px] sm:text-[14px] font-medium">
            {/* Student Name Pill */}
            {studentName && !isAdminPath && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/70 dark:bg-white/5 border border-black/[0.04] dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0066cc] text-white text-[10px] font-bold">
                  {initialLetter || <User className="h-3 w-3" />}
                </div>
                <span className="truncate max-w-[120px]">{studentName}</span>
              </div>
            )}

            {!isAdminPath && <ThemeToggle />}

            {pathname === "/register-schedule" && (
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-full bg-slate-100/80 dark:bg-white/5 text-slate-700 dark:text-slate-300 px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-300 ease-spring hover:bg-slate-200/70 dark:hover:bg-white/10 hover:-translate-y-0.5 active:scale-95 border border-black/[0.05] dark:border-white/10 font-semibold text-xs sm:text-sm"
              >
                Về trang chủ
              </Link>
            )}

            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full bg-blue-50/80 dark:bg-blue-500/10 text-[#0066cc] dark:text-blue-400 px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-300 ease-spring hover:bg-blue-100/80 dark:hover:bg-blue-500/20 hover:shadow-sm hover:shadow-blue-500/15 hover:-translate-y-0.5 active:scale-95 border border-blue-200/50 dark:border-blue-500/20 font-semibold text-xs sm:text-sm"
            >
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Quản lý</span>
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 rounded-full bg-rose-50/80 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-300 ease-spring hover:bg-rose-100/80 dark:hover:bg-rose-500/20 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 border border-rose-200/50 dark:border-rose-500/20 disabled:opacity-50 disabled:pointer-events-none text-xs sm:text-sm"
              title="Đăng xuất"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
