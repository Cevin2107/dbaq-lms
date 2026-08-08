"use client";

import Link from "next/link";
import { useAdminAssignments } from "@/features/admin/hooks/useAdminAssignments";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { MathText } from "@/components/MathText";
import { LayoutList, Plus, Search, Filter, Edit, Eye, EyeOff, Clock, Award, Copy, Sparkles, BookOpen } from "lucide-react";
import { useState } from "react";

export default function AssignmentsPage() {
  const { data: assignments = [], isLoading } = useAdminAssignments();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"title" | "date" | "score">("date");

  const handleCopyLink = (assignmentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const filtered = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (a.subject && a.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    
    if (filter === "hidden") return a.is_hidden;
    if (filter === "visible") return !a.is_hidden;
    return true;
  });

  // Sort assignments
  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sortBy === "title") return a.title.localeCompare(b.title);
    if (sortBy === "date") {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : (a.due_at ? new Date(a.due_at).getTime() : 0);
      const dateB = b.created_at ? new Date(b.created_at).getTime() : (b.due_at ? new Date(b.due_at).getTime() : 0);
      return dateB - dateA;
    }
    if (sortBy === "score") return (b.total_score || 0) - (a.total_score || 0);
    return 0;
  });

  return (
    <div className="container-custom py-6 md:py-8 space-y-6 md:space-y-8 animate-fade-in">
      {/* Header with Glassmorphic Card */}
      <div className="rounded-[2rem] bg-gradient-to-br from-white via-[#f0f9ff]/60 to-[#e0f2fe]/40 dark:from-[#1d1d1f]/90 dark:via-[#1d1d1f]/80 dark:to-[#0f172a]/90 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_8px_30px_rgba(0,102,204,0.06)] p-6 sm:p-8 md:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800/40">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Quản lý Kho Bài tập & Đề thi LMS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">
              Quản lý Bài tập
            </h1>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 max-w-xl">
              Tìm kiếm, lọc và phân loại tất cả đề thi, bài tập trong hệ thống.
            </p>
          </div>
          <Link href="/admin/assignments/new">
            <Button variant="brand" size="sm" className="rounded-full bg-[#0066cc] hover:bg-[#005bb5] shadow-lg shadow-blue-500/20 px-5 py-2.5 text-xs font-semibold">
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Tạo bài tập mới</span>
              <span className="sm:hidden">Tạo mới</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar - Enhanced Glassmorphic Card */}
      <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bài tập hoặc môn học..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-full text-[15px] text-slate-900 dark:text-white placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#1d1d1f] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-[#0066cc] dark:focus:border-blue-500 transition-all outline-none"
              aria-label="Tìm kiếm bài tập"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                aria-label="Xóa tìm kiếm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-full px-4 py-2.5">
              <Filter className="h-4 w-4 text-slate-400" />
              <select 
                value={filter} 
                onChange={e => setFilter(e.target.value)}
                className="bg-transparent text-[14px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none pr-1 cursor-pointer"
                aria-label="Lọc trạng thái"
              >
                <option value="all">Tất cả bài tập</option>
                <option value="visible">Đang hiển thị</option>
                <option value="hidden">Đã ẩn</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 rounded-full px-4 py-2.5">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-[14px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none pr-1 cursor-pointer"
                aria-label="Sắp xếp theo"
              >
                <option value="date">Mới nhất (Ngày tạo)</option>
                <option value="title">Tên bài (A-Z)</option>
                <option value="score">Điểm cao nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        {(searchTerm || filter !== "all") && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-2">
            <span>Tìm thấy {sorted.length} bài tập</span>
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(""); setFilter("all"); }}
                className="text-[#0066cc] dark:text-blue-400 hover:underline font-semibold"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* Assignment Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-12 text-center flex flex-col items-center justify-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400">
            <LayoutList className="h-8 w-8" />
          </div>
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">Không tìm thấy bài tập nào!</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            {searchTerm 
              ? "Hãy thử đổi từ khóa tìm kiếm hoặc xóa bộ lọc."
              : "Tạo bài tập đầu tiên để bắt đầu quá trình giảng dạy."}
          </p>
          {!searchTerm && (
            <Link href="/admin/assignments/new">
              <Button variant="brand" className="mt-6 rounded-full bg-[#0066cc] hover:bg-[#005bb5] shadow-lg shadow-blue-500/20">
                <Plus className="h-4 w-4 mr-1.5" />
                Tạo bài tập ngay
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {sorted.map((a: any) => (
            <div
              key={a.id}
              className="group rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,102,204,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col p-5 sm:p-6"
            >
              {/* Header Badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-300 border border-blue-100 dark:border-blue-800/40">
                    {a.subject || "Chung"}
                  </span>
                  {a.grade && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {a.grade}
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {a.is_hidden ? (
                    <Tooltip content="Đang ẩn">
                      <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <EyeOff className="h-4 w-4" />
                      </div>
                    </Tooltip>
                  ) : (
                    <Tooltip content="Đang hiển thị">
                      <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                        <Eye className="h-4 w-4" />
                      </div>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Title */}
              <Tooltip content={a.title.length > 50 ? a.title : ""}>
                <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-4 line-clamp-2 leading-tight min-h-[2.75rem] tracking-[-0.01em] group-hover:text-[#0066cc] dark:group-hover:text-blue-400 transition-colors">
                  <MathText text={a.title} />
                </h3>
              </Tooltip>

              {/* Meta Info */}
              <div className="space-y-2.5 text-[14px] text-slate-600 dark:text-slate-400 flex-1 bg-slate-50/60 dark:bg-slate-800/30 p-3.5 rounded-2xl border border-slate-200/50 dark:border-white/5 mb-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Thời gian
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {a.duration_minutes ? `${a.duration_minutes} phút` : "Không giới hạn"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-slate-400" />
                    Tổng điểm
                  </span>
                  <span className="font-extrabold text-[#0066cc] dark:text-blue-400">{a.total_score || 0} điểm</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleCopyLink(a.id, e)}
                  className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-[#0066cc] dark:hover:text-blue-400 shrink-0 px-3 py-2 text-xs font-semibold"
                  title="Sao chép link bài tập"
                  aria-label="Sao chép link bài tập"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5 text-slate-500 group-hover:text-[#0066cc]" />
                  <span>Sao chép link</span>
                </Button>
                <Link href={`/admin/assignments/${a.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full rounded-xl group font-semibold text-xs py-2">
                    <Edit className="h-3.5 w-3.5 mr-1 group-hover:scale-110 transition-transform" />
                    <span>Quản lý</span>
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
