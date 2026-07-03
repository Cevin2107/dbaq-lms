"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Assignment } from "@/lib/types";
import { isBefore } from "date-fns";
import clsx from "clsx";
import Link from "next/link";
import { MathText } from "@/components/MathText";

interface AssignmentListProps {
  assignments: Assignment[];
}

export function AssignmentList({ assignments }: AssignmentListProps) {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("not_started");
  const [now, setNow] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, subjectFilter, statusFilter]);

  const formatRemaining = (dueAt?: string | null) => {
    if (!dueAt) return null;
    if (now === null) return "Đang tính...";
    const target = new Date(dueAt).getTime();
    if (Number.isNaN(target)) return null;
    const diff = target - now;
    if (diff <= 0) return null;
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];
    if (days) parts.push(`${days}n`);
    if (hours) parts.push(`${hours}g`);
    if (minutes) parts.push(`${minutes}p`);
    if (!days && seconds) parts.push(`${seconds}s`);
    return parts.length ? parts.join(" ") : "Đã hết hạn";
  };

  const formatDueDate = (dueAt?: string | null) => {
    if (!dueAt) return null;
    const date = new Date(dueAt);
    if (isNaN(date.getTime())) return null;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} · ${day}/${month}/${year}`;
  };

  const getDerivedStatus = useCallback((assignment: Assignment) => {
    if (now !== null && assignment.dueAt && isBefore(new Date(assignment.dueAt), new Date(now))) return "overdue" as const;
    return assignment.latestSubmission ? "completed" : "not_started";
  }, [now]);

  const isUrgent = useCallback((assignment: Assignment) => {
    if (!assignment.dueAt || now === null) return false;
    const diff = new Date(assignment.dueAt).getTime() - now;
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  }, [now]);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const derivedStatus = getDerivedStatus(a);
      const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
      const matchSubject = subjectFilter === "Tất cả" || a.subject === subjectFilter;
      const matchStatus = statusFilter === "Tất cả" || derivedStatus === statusFilter;
      return matchSearch && matchSubject && matchStatus;
    });
  }, [assignments, getDerivedStatus, search, subjectFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const subjects = Array.from(new Set(assignments.map((a) => a.subject)));

    const StatusBadge = ({ assignment }: { assignment: Assignment }) => {
    const status = getDerivedStatus(assignment);
    const urgent = isUrgent(assignment);
    return (
      <div className="flex flex-wrap items-center gap-2">
        {urgent && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-500/10 px-2.5 py-1 text-[12px] font-semibold text-red-600 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            Gấp
          </span>
        )}
        <span className={clsx(
          "rounded-full px-2.5 py-1 text-[12px] font-medium tracking-tight",
          status === "overdue"
            ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            : status === "completed"
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
        )}>
          {status === "overdue" ? "Quá hạn" : status === "completed" ? "Đã làm" : "Chưa làm"}
        </span>
      </div>
    );
  };

  const subjectColor = (subject: string) => {
    const map: Record<string, string> = {
      "Toán": "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      "Lý": "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
      "Hóa": "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
      "Văn": "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
      "Anh": "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      "Sinh": "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
    };
    for (const key of Object.keys(map)) {
      if (subject?.includes(key)) return map[key];
    }
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  };



  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] bg-white dark:bg-[#1d1d1f] shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
          <div className="skeleton dark:bg-slate-700/50 h-12 mb-4 rounded-full" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton dark:bg-slate-700/50 h-10 w-24 rounded-full" />)}
          </div>
        </div>
        <div className="grid gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-[2rem] bg-white dark:bg-[#1d1d1f] shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
              <div className="skeleton dark:bg-slate-700/50 h-6 w-3/4 mb-4 rounded-xl" />
              <div className="skeleton dark:bg-slate-700/50 h-4 w-full mb-2 rounded-lg" />
              <div className="skeleton dark:bg-slate-700/50 h-4 w-2/3 mb-6 rounded-lg" />
              <div className="skeleton dark:bg-slate-700/50 h-11 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up" suppressHydrationWarning>
      
      {/* Search & Filter Card */}
      <div className="rounded-[2rem] bg-white dark:bg-[#1d1d1f] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 p-6" suppressHydrationWarning>
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full rounded-full bg-slate-50 dark:bg-[#2a2a2c] py-3.5 pl-12 pr-4 text-[16px] text-[#1d1d1f] dark:text-white placeholder-slate-400 transition-all focus:bg-white dark:focus:bg-[#333] focus:outline-none focus:ring-4 focus:ring-[#0066cc]/10 border border-transparent focus:border-[#0066cc]/20"
            placeholder="Tìm kiếm bài tập..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Segmented Control for Tabs */}
          <div className="flex flex-wrap items-center bg-slate-100 dark:bg-[#2a2a2c] p-1 rounded-full w-full sm:w-auto">
            {[
              { value: "not_started", label: "Chưa làm" },
              { value: "completed", label: "Đã làm" },
              { value: "overdue", label: "Quá hạn" },
              { value: "Tất cả", label: "Tất cả" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={clsx(
                  "flex-1 sm:flex-none rounded-full px-5 py-2 text-[14px] font-medium transition-all duration-300",
                  statusFilter === tab.value
                    ? "bg-white dark:bg-[#444] text-[#1d1d1f] dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-[#1d1d1f] dark:hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {subjects.length > 1 && (
            <select
              className="w-full sm:w-auto rounded-full bg-slate-50 dark:bg-[#2a2a2c] px-5 py-2.5 text-[14px] font-medium text-slate-700 dark:text-slate-200 transition focus:outline-none focus:ring-4 focus:ring-[#0066cc]/10 border border-slate-200 dark:border-[#444]"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="Tất cả">Tất cả môn</option>
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        {(search || subjectFilter !== "Tất cả" || statusFilter !== "Tất cả") && (
          <div className="flex items-center gap-2 px-1">
            <p className="text-[14px] text-[#1d1d1f]/60 dark:text-white/60 font-normal">
              {filtered.length} kết quả
            </p>
            <button
              onClick={() => { setSearch(""); setSubjectFilter("Tất cả"); setStatusFilter("Tất cả"); }}
              className="ml-auto text-[14px] text-[#0066cc] dark:text-[#2997ff] hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Assignment Grid */}
      <div className="grid gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3" suppressHydrationWarning>
        {paginated.map((assignment) => {
          const status = getDerivedStatus(assignment);
          const overdue = status === "overdue";
          const completed = status === "completed";
          const urgent = isUrgent(assignment);
          const latest = assignment.latestSubmission;
          const remaining = formatRemaining(assignment.dueAt);
          const dueDateTime = formatDueDate(assignment.dueAt);

          return (
            <div
              key={assignment.id}
              className={clsx(
                "group flex flex-col rounded-[2rem] bg-white dark:bg-[#1d1d1f] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/5 dark:border-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]",
                urgent && "ring-1 ring-red-400/30",
                overdue && "opacity-80"
              )}
              suppressHydrationWarning
            >
              <div className="flex items-start justify-between gap-2 mb-5" suppressHydrationWarning>
                <div className="flex items-center gap-2">
                  <span className={clsx("rounded-full px-3 py-1 text-[13px] font-semibold", subjectColor(assignment.subject))}>
                    {assignment.subject}
                  </span>
                  <span className="text-[13px] text-slate-400 font-medium">{assignment.grade}</span>
                </div>
                <StatusBadge assignment={assignment} />
              </div>

              <h2 className="text-[19px] font-bold text-[#1d1d1f] dark:text-white leading-[1.3] tracking-[-0.02em] line-clamp-2 mb-4 group-hover:text-[#0066cc] dark:group-hover:text-sky-400 transition-colors">
                <MathText text={assignment.title} />
              </h2>

              <div className="flex flex-col gap-2 text-[13px] text-slate-500 dark:text-slate-400 flex-1 mb-6" suppressHydrationWarning>
                {dueDateTime && (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Hạn: {dueDateTime}
                  </span>
                )}
                {remaining && (
                  <span className={clsx("flex items-center gap-2", urgent ? "text-red-500 font-semibold" : "")}>
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Còn {remaining}
                  </span>
                )}
                {assignment.durationMinutes && (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Thời gian: {assignment.durationMinutes} phút
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-[#333] pt-5" suppressHydrationWarning>
                <div className="flex items-center gap-2">
                  {latest && !assignment.hideScore && (
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-700 dark:text-slate-300">
                      <span>{latest.score} <span className="text-slate-400 font-normal">/ {assignment.totalScore}</span></span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {latest ? (
                    <>
                      <Link
                        href={`/assignments/${assignment.id}/result?sid=${latest.id}`}
                        className="rounded-full bg-slate-50 dark:bg-[#2a2a2c] px-4 py-2 text-[14px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#333] transition-colors active:scale-95"
                      >
                        Kết quả
                      </Link>
                      <Link
                        href={`/assignments/${assignment.id}/start`}
                        className="rounded-full bg-[#0066cc] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#0071e3] transition-colors active:scale-95 shadow-sm shadow-blue-500/20"
                      >
                        Làm lại
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={overdue ? "#" : `/assignments/${assignment.id}/start`}
                      aria-disabled={overdue}
                      className={clsx(
                        "rounded-full px-6 py-2.5 text-[14px] font-medium transition-all active:scale-95 text-center shadow-sm",
                        overdue
                          ? "cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-none"
                          : "bg-[#0066cc] text-white hover:bg-[#0071e3] shadow-blue-500/20 hover:shadow-blue-500/30"
                      )}
                    >
                      {overdue ? "Đã hết hạn" : "Bắt đầu làm bài"}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center rounded-[2rem] bg-white dark:bg-[#1d1d1f] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-black/5 dark:border-white/5 p-16 text-center">
            <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
              <svg className="h-10 w-10 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-[-0.02em] mb-2">Không tìm thấy bài tập phù hợp</p>
            <p className="text-[14px] text-[#1d1d1f]/60 dark:text-white/60">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/5 dark:border-white/10 bg-white dark:bg-[#2a2a2c] text-[#1d1d1f] dark:text-white hover:bg-[#f5f5f7] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            &larr;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={clsx(
                "h-10 w-10 rounded-full text-[14px] font-medium transition-all duration-300 border border-transparent",
                currentPage === page
                  ? "bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f]"
                  : "bg-white dark:bg-[#2a2a2c] text-[#1d1d1f] dark:text-white hover:bg-[#f5f5f7] dark:hover:bg-[#333]"
              )}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/5 dark:border-white/10 bg-white dark:bg-[#2a2a2c] text-[#1d1d1f] dark:text-white hover:bg-[#f5f5f7] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
