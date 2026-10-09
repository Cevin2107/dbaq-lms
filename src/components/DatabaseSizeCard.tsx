"use client";

import { useEffect, useState } from "react";
import DatabaseCleanupModal from "./DatabaseCleanupModal";
import { HardDrive, Trash2, RefreshCw, AlertCircle } from "lucide-react";

interface DatabaseSizeInfo {
  used_bytes: number;
  total_bytes: number;
  used_mb: string;
  total_mb: number;
  used_percent: string;
  is_estimate?: boolean;
}

export default function DatabaseSizeCard() {
  const [sizeInfo, setSizeInfo] = useState<DatabaseSizeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCleanup, setShowCleanup] = useState(false);

  useEffect(() => {
    fetchDatabaseSize();
  }, []);

  async function fetchDatabaseSize() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/database-size");
      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Non-JSON response: ${text.slice(0, 80)}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch database size");
      }

      setSizeInfo(data);
    } catch (err) {
      setError("Không thể lấy thông tin dung lượng");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-[#0066cc] dark:text-blue-400 flex items-center justify-center">
            <HardDrive className="h-4 w-4" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Dung lượng Database</h3>
        </div>
        <div className="h-3 w-full animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-700/60" />
        <p className="text-xs text-slate-400 dark:text-slate-500">Đang kiểm tra dung lượng lưu trữ...</p>
      </div>
    );
  }

  if (error || !sizeInfo) {
    return (
      <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Dung lượng Database</h3>
          </div>
          <button
            onClick={fetchDatabaseSize}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 transition-colors"
            title="Thử lại"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-red-600 dark:text-red-400">{error || "Lỗi tải dữ liệu"}</p>
      </div>
    );
  }

  const usedPercent = parseFloat(sizeInfo.used_percent);
  const remaining = sizeInfo.total_mb - parseFloat(sizeInfo.used_mb);

  // Gradient based on usage
  let gradientColor = "from-emerald-500 to-teal-500";
  let statusTextColor = "text-emerald-600 dark:text-emerald-400";
  let badgeBg = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
  if (usedPercent > 80) {
    gradientColor = "from-red-500 to-rose-600";
    statusTextColor = "text-red-600 dark:text-red-400";
    badgeBg = "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20";
  } else if (usedPercent > 60) {
    gradientColor = "from-amber-500 to-orange-500";
    statusTextColor = "text-amber-600 dark:text-amber-400";
    badgeBg = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
  }

  return (
    <>
      <div className="rounded-[2.25rem] bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-[#0066cc] dark:text-blue-400 flex items-center justify-center">
              <HardDrive className="h-4 w-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Dung lượng Database</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCleanup(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-full transition-all duration-200 active:scale-95"
              title="Dọn dẹp database"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Dọn dẹp</span>
            </button>
            <button
              onClick={fetchDatabaseSize}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors active:scale-95"
              title="Làm mới"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${statusTextColor}`}>
                {sizeInfo.used_mb}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                / {sizeInfo.total_mb} MB
              </span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
              {sizeInfo.used_percent}%
            </span>
          </div>

          {/* Liquid Glass Progress Bar */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5 p-0.5 border border-black/5 dark:border-white/5 shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${gradientColor} shadow-sm transition-all duration-700 ease-out`}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Khả dụng: <strong className="text-slate-800 dark:text-slate-200 font-bold">{remaining.toFixed(2)} MB</strong>
            </span>
            <span className="text-slate-400 text-[11px]">PostgreSQL Supabase</span>
          </div>

          {sizeInfo.is_estimate && (
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 italic">
              * Dung lượng ước tính dựa trên số lượng bản ghi
            </p>
          )}
        </div>
      </div>

      {showCleanup && (
        <DatabaseCleanupModal
          onClose={() => {
            setShowCleanup(false);
            fetchDatabaseSize();
          }}
        />
      )}
    </>
  );
}
