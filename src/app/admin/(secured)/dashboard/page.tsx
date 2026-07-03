'use client'

import Link from "next/link";
import { useAdminAssignments } from "@/features/admin/hooks/useAdminAssignments";
import DatabaseSizeCard from "@/components/DatabaseSizeCard";
import { MathText } from "@/components/MathText";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Eye, EyeOff, LayoutList, BarChart3, Plus, RefreshCw, Copy } from "lucide-react";

export default function AdminDashboardPage() {
  const { data: assignments = [], isLoading, isRefetching, refetch } = useAdminAssignments();
  const { addToast } = useToast();

  const visibleCount = assignments.filter((a) => !a.is_hidden).length;
  const hiddenCount = assignments.filter((a) => a.is_hidden).length;

  const handleCopyLink = (assignmentId: string) => {
    const url = `${window.location.origin}/assignments/${assignmentId}/start`;
    navigator.clipboard.writeText(url).then(() => {
      addToast({
        title: "Đã sao chép!",
        description: "Link bài tập đã được sao chép vào clipboard",
        variant: "success",
        duration: 3000,
      });
    }).catch(() => {
      addToast({
        title: "Lỗi",
        description: "Không thể sao chép link",
        variant: "error",
        duration: 3000,
      });
    });
  };

  return (
    <div className="container-custom py-6 md:py-8 space-y-6 animate-fade-in">
      {/* Header with Glassmorphic Card */}
      <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8 md:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">Tổng quan hệ thống</h1>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-2">Quản lý bài tập và theo dõi số liệu chung.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()} 
              disabled={isRefetching} 
              loading={isRefetching}
              className="rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
            <Link href="/admin/assignments/new">
              <Button variant="brand" size="sm" className="rounded-full bg-[#0066cc] hover:bg-[#005bb5] shadow-lg shadow-blue-500/20 px-5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Tạo bài mới</span>
                <span className="sm:hidden">Tạo mới</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards - Enhanced Glassmorphic */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div className="group rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
              <div className="relative inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[18px] bg-[#0066cc] text-white mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <LayoutList className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{assignments.length}</p>
              <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-1">Tổng bài tập</p>
            </div>
            
            <div className="group rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
              <div className="relative inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[18px] bg-emerald-500 text-white mb-4 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                <Eye className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{visibleCount}</p>
              <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-1">Đang công khai</p>
            </div>
            
            <div className="group rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 col-span-2 sm:col-span-1">
              <div className="relative inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[18px] bg-slate-400 dark:bg-slate-600 text-white mb-4 shadow-lg shadow-slate-400/30 group-hover:scale-110 transition-transform duration-300">
                <EyeOff className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-slate-700 dark:text-slate-200 tracking-tight">{hiddenCount}</p>
              <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-1">Đang ẩn</p>
            </div>
          </>
        )}
      </div>

      {/* Content Grid - Stacks on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Danh sách bài tập</h2>
            <Link href="/admin/stats">
              <Button variant="outline" size="sm" className="rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                <BarChart3 className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                Thống kê chi tiết
              </Button>
            </Link>
          </div>

          <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Đang tải dữ liệu...</div>
            ) : assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-white/5">
                  <LayoutList className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-300">Chưa có bài tập nào</p>
                <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400 max-w-xs">Tạo bài tập đầu tiên để bắt đầu quá trình giảng dạy!</p>
                <Link href="/admin/assignments/new">
                  <Button variant="brand" className="mt-6 rounded-full bg-[#0066cc] hover:bg-[#005bb5] shadow-lg shadow-blue-500/20">
                    Tạo bài tập ngay
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {assignments.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5 transition hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white truncate tracking-[-0.01em]">
                          <MathText text={a.title} />
                        </h3>
                        {a.is_hidden && (
                          <Badge variant="secondary" className="shrink-0 text-[10px] py-0 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Đang ẩn</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-[#0066cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-[10px]">{a.subject}</span>
                        <span>&bull;</span>
                        <span>{a.grade}</span>
                        <span>&bull;</span>
                        <span className="font-semibold">{a.total_score} điểm</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyLink(a.id)}
                        className="h-9 w-9 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-[#0066cc]"
                        aria-label="Sao chép link bài tập"
                        title="Sao chép link bài tập"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Link href={`/admin/assignments/${a.id}`}>
                        <Button variant="secondary" size="sm" className="rounded-full bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                          Chi tiết
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Database size overview on the right */}
        <div className="lg:col-span-1">
           <DatabaseSizeCard />
        </div>
      </div>
    </div>
  );
}
