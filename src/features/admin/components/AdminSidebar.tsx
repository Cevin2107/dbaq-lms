"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
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
          aria-label="Điều hướng quản trị"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/70 bg-white/90 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#1d1d1f]/90 dark:shadow-none"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="mx-auto flex max-w-xl items-stretch justify-around px-1">
            {NAV_ITEMS.filter(item => item.name !== "Cài đặt").map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-semibold transition-colors duration-300 active:scale-95",
                    isActive
                      ? "text-[#0066cc] dark:text-[#2997ff]"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-x-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#0066cc] dark:bg-[#2997ff]" />
                  )}
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-transform duration-300",
                      isActive ? "scale-110 text-[#0066cc] dark:text-[#2997ff]" : "text-slate-400 dark:text-slate-500"
                    )}
                  />
                  <span className="max-w-full truncate">{item.name}</span>
                </Link>
              );
            })}
            {/* More button for drawer */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-expanded={isMobileMenuOpen}
              aria-haspopup="dialog"
              className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-semibold text-slate-500 transition-colors duration-300 active:scale-95 dark:text-slate-400"
            >
              <Menu className="h-5 w-5" />
              <span>Menu</span>
            </button>
          </div>
        </nav>

        {/* Slide-over Drawer */}
        {isMobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Đóng menu"
              className="fixed inset-0 z-[60] cursor-default bg-slate-950/35 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Menu quản trị"
              className="fixed inset-y-0 right-0 z-[70] flex w-80 max-w-[calc(100vw-1rem)] flex-col border-l border-slate-200/60 bg-white/95 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-[#1d1d1f]/95 dark:shadow-none"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/5">
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
                  aria-label="Đóng menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Nav */}
              <nav aria-label="Điều hướng quản trị đầy đủ" className="flex-1 space-y-1.5 overflow-y-auto p-4">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-[1.25rem] px-4 py-3.5 text-sm font-semibold transition-all duration-300 active:scale-[0.98]",
                        isActive
                          ? "translate-x-1 bg-[#0066cc] text-white shadow-lg shadow-blue-500/20"
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
              <div className="space-y-2 border-t border-slate-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/5">
                <button
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-3 rounded-[1.25rem] border border-transparent px-4 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-200 hover:bg-slate-50 active:scale-[0.98] dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
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
                    className="flex w-full items-center gap-3 rounded-[1.25rem] border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 active:scale-[0.98] dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
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
      <aside className="sticky top-0 left-0 z-40 hidden h-dvh w-[17rem] shrink-0 flex-col border-r border-white/70 bg-white/75 shadow-[0_8px_40px_rgba(15,23,42,0.04)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#161618]/85 dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] lg:flex">
        <div className="flex h-[4.5rem] shrink-0 items-center border-b border-black/[0.05] px-5 dark:border-white/10">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <BrandLogo size="md" animate glow className="shadow-md ring-1 ring-white/40 transition-transform duration-300 group-hover:scale-105 dark:ring-white/10" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[#1d1d1f] dark:text-white leading-tight truncate group-hover:text-[#0066cc] dark:group-hover:text-[#2997ff] transition-colors">Admin Đào Bá Anh Quân</h1>
            <p className="text-[10px] text-[#0066cc] dark:text-[#2997ff] uppercase tracking-wider font-bold">LMS Workspace Pro</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav aria-label="Điều hướng quản trị" className="flex-1 space-y-1.5 overflow-y-auto p-4">
        <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Không gian làm việc</p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-3.5 text-sm font-semibold transition-all duration-300 ease-spring active:scale-[0.98]",
                isActive
                  ? "translate-x-1 bg-[#0066cc] text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-600 hover:bg-black/[0.03] hover:text-[#1d1d1f] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              )}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-300", isActive ? "text-white scale-105" : "text-slate-400 dark:text-slate-500")} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Nav */}
      <div className="shrink-0 space-y-2 border-t border-black/[0.05] p-4 dark:border-white/10">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3.5 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 ease-spring hover:border-black/[0.04] hover:bg-black/[0.03] active:scale-[0.98] dark:text-slate-300 dark:hover:border-white/5 dark:hover:bg-white/5"
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
            className="flex w-full items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-3 text-sm font-semibold text-rose-600 transition-all duration-300 ease-spring hover:bg-rose-500/20 active:scale-[0.98] dark:text-rose-400"
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
