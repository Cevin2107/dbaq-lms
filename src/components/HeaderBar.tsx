"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut } from "lucide-react";
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

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4 pointer-events-none">
      <header className="mx-auto w-full max-w-[1440px] rounded-full bg-white/75 dark:bg-[#1c1c1e]/75 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-glass pointer-events-auto transition-all duration-500 ease-liquid">
        <div className="flex h-13 sm:h-14 items-center justify-between px-3 sm:px-6" suppressHydrationWarning>
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity group" suppressHydrationWarning>
            <BrandLogo size="md" animate glow className="shadow-sm ring-1 ring-white/30 dark:ring-white/10" />
            <div className="flex flex-col">
              <span className="text-[13.5px] sm:text-[15px] font-bold tracking-tight text-[#1d1d1f] dark:text-white leading-tight">
                Gia sư Đào Bá Anh Quân
              </span>
              <span className="text-[10px] font-semibold text-[#0066cc] dark:text-[#2997ff] uppercase tracking-wider hidden md:inline">
                LMS Pro
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3 text-[13px] sm:text-[14px] font-medium">
            {!isAdminPath && <ThemeToggle />}

            {pathname === "/register-schedule" && (
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-300 ease-spring hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm"
              >
                Về trang chủ
              </Link>
            )}

            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-300 ease-spring hover:bg-sky-100 dark:hover:bg-sky-500/20 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 border border-sky-100 dark:border-sky-500/20 font-semibold text-xs sm:text-sm"
            >
              Quản lý
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 sm:px-4 sm:py-2 transition-all duration-300 ease-spring hover:bg-red-100 dark:hover:bg-red-500/20 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 border border-red-100 dark:border-red-500/20 disabled:opacity-50 disabled:pointer-events-none text-xs sm:text-sm"
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
