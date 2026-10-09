"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  GraduationCap,
  Users,
  Settings,
  CalendarDays,
  LogOut,
  Menu,
  X,
  Clock,
  Moon,
  Sun,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Tổng quan", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Bài tập", href: "/admin/assignments", icon: GraduationCap },
  { name: "Lịch dạy", href: "/admin/schedule", icon: CalendarDays },
  { name: "Đăng ký", href: "/admin/teaching-schedule", icon: Clock },
  { name: "Học sinh", href: "/admin/stats", icon: Users },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ─── MOBILE: Bottom Tab Bar + Slide-over Drawer (Visible on < lg) ──── */}
      <div className="lg:hidden">
        {/* Bottom Tab Bar */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 dark:border-white/5 bg-white/90 dark:bg-[#1d1d1f]/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-none"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex items-stretch justify-around">
            {NAV_ITEMS.filter(item => item.name !== "Cài đặt").map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[10px] font-semibold transition-colors relative",
                    isActive
                      ? "text-[#0066cc] dark:text-blue-400"
                      : "text-slate-400 dark:text-slate-500 active:text-slate-600 dark:active:text-slate-300"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#0066cc]" />
                  )}
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform",
                      isActive ? "text-[#0066cc] dark:text-blue-400 scale-110" : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
            {/* More button for drawer */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 active:text-slate-600 dark:active:text-slate-300 transition-colors"
            >
              <Menu className="h-5 w-5" />
              <span>Menu</span>
            </button>
          </div>
        </nav>

        {/* Slide-over Drawer */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-slate-900/30 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 z-[70] w-72 flex flex-col bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-2xl shadow-2xl dark:shadow-none border-l border-slate-200/60 dark:border-white/5 animate-slide-in-right">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <BrandLogo size="sm" animate className="shadow-md" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Admin Đào Bá Anh Quân</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Workspace</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Nav */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-[1.25rem] px-4 py-3.5 text-sm font-semibold transition-all duration-300",
                        isActive
                          ? "bg-[#0066cc] text-white shadow-lg shadow-blue-500/20 translate-x-1"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-slate-400")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer Footer */}
              <div className="border-t border-slate-100 dark:border-white/5 p-3 space-y-2">
                <button
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-3 rounded-[1.25rem] px-4 py-3.5 text-sm font-semibold transition-all hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-95 text-slate-700 dark:text-slate-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5 flex-shrink-0 text-amber-500" />
                  ) : (
                    <Moon className="h-5 w-5 flex-shrink-0 text-slate-500" />
                  )}
                  <span>{theme === "dark" ? "Giao diện Sáng" : "Giao diện Tối"}</span>
                </button>
                <form action="/api/admin/logout" method="POST">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-[1.25rem] px-4 py-3.5 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-500/10 transition-all hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20"
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0 text-red-500" />
                    <span>Đăng xuất</span>
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── DESKTOP: Sticky Sidebar (Visible on >= lg) ──── */}
      <aside className="hidden lg:flex sticky top-0 left-0 z-40 h-screen w-64 flex-col border-r border-white/60 dark:border-white/10 bg-white/80 dark:bg-[#161618]/85 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-black/[0.05] dark:border-white/10 px-5">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <BrandLogo size="md" animate glow className="shadow-md ring-1 ring-white/40 dark:ring-white/10 transition-transform duration-300 group-hover:scale-105" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[#1d1d1f] dark:text-white leading-tight truncate group-hover:text-[#0066cc] dark:group-hover:text-[#2997ff] transition-colors">Admin Đào Bá Anh Quân</h1>
            <p className="text-[10px] text-[#0066cc] dark:text-[#2997ff] uppercase tracking-wider font-bold">LMS Workspace Pro</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1.5 p-3.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-300 ease-spring",
                isActive
                  ? "bg-[#0066cc] text-white shadow-lg shadow-blue-500/25 translate-x-1"
                  : "text-slate-600 dark:text-slate-400 hover:bg-black/[0.03] dark:hover:bg-white/5 hover:text-[#1d1d1f] dark:hover:text-white active:scale-95"
              )}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-300", isActive ? "text-white scale-105" : "text-slate-400 dark:text-slate-500")} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Nav */}
      <div className="shrink-0 border-t border-black/[0.05] dark:border-white/10 p-3.5 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-300 ease-spring hover:bg-black/[0.03] dark:hover:bg-white/5 active:scale-95 text-slate-700 dark:text-slate-300 border border-transparent hover:border-black/[0.04] dark:hover:border-white/5"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 flex-shrink-0 text-amber-500" />
          ) : (
            <Moon className="h-5 w-5 flex-shrink-0 text-slate-500" />
          )}
          <span>{theme === "dark" ? "Giao diện Sáng" : "Giao diện Tối"}</span>
        </button>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 transition-all duration-300 ease-spring hover:bg-rose-500/20 active:scale-95 border border-rose-500/20"
          >
            <LogOut className="h-5 w-5 text-rose-500 flex-shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </form>
      </div>
    </aside>
  </>
  );
}
