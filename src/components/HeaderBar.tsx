"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, CalendarPlus } from "lucide-react";

export function HeaderBar({ studentName }: { studentName?: string }) {
  const [greeting, setGreeting] = useState("");
  const [greetingEmoji, setGreetingEmoji] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) { setGreeting("Chào buổi sáng"); setGreetingEmoji("🌤️"); }
    else if (hour < 18) { setGreeting("Chào buổi chiều"); setGreetingEmoji("☀️"); }
    else { setGreeting("Chào buổi tối"); setGreetingEmoji("🌙"); }
  }, []);

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

  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6 pointer-events-none">
      <header className="mx-auto w-full max-w-[1440px] rounded-full bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] pointer-events-auto transition-colors duration-500">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6" suppressHydrationWarning>
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" suppressHydrationWarning>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#0066cc] to-[#2997ff] shadow-sm">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="hidden sm:inline text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">Gia sư Đào Bá Anh Quân</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 text-[14px] font-medium">
            {!isAdminPath && <ThemeToggle />}
            
            {pathname === "/register-schedule" ? (
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[#1d1d1f] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                Về trang chủ
              </Link>
            ) : (
              <Link
                href="/register-schedule"
                className="flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 px-4 py-2 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors border border-sky-100 dark:border-sky-500/20"
              >
                <CalendarPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Đăng ký lịch học</span>
              </Link>
            )}

            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[#1d1d1f] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Quản lý
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-100 dark:border-red-500/20 disabled:opacity-50"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
