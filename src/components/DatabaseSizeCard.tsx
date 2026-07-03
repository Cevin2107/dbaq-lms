"use client";

import { useEffect, useState } from "react";
import DatabaseCleanupModal from "./DatabaseCleanupModal";

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
      <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dung lượng Database</h3>
        <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-700"></div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
      </div>
    );
  }

  if (error || !sizeInfo) {
    return (
      <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dung lượng Database</h3>
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error || "Lỗi tải dữ liệu"}</p>
      </div>
    );
  }

  const usedPercent = parseFloat(sizeInfo.used_percent);
  const remaining = sizeInfo.total_mb - parseFloat(sizeInfo.used_mb);
  
  // Color based on usage
  let barColor = "bg-green-500";
  let textColor = "text-green-700";
  if (usedPercent > 80) {
    barColor = "bg-red-500";
    textColor = "text-red-700";
  } else if (usedPercent > 60) {
    barColor = "bg-yellow-500";
    textColor = "text-yellow-700";
  }

  return (
    <>
      <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dung lượng Database</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCleanup(true)}
              className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition"
              title="Dọn dẹp"
            >
              🗑️ Dọn dẹp
            </button>
            <button
              onClick={fetchDatabaseSize}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Làm mới"
            >
              🔄
            </button>
          </div>
        </div>
      
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${textColor}`}>
              {sizeInfo.used_mb} MB
            </span>
            <span className="text-sm text-slate-500">
              / {sizeInfo.total_mb} MB
            </span>
          </div>
          
          <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/50">
            <div
              className={`h-full ${barColor} transition-all duration-500`}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            ></div>
          </div>
          
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Còn lại: <strong>{remaining.toFixed(2)} MB</strong>
            </span>
            <span className={`font-semibold ${textColor}`}>
              {sizeInfo.used_percent}%
            </span>
          </div>

          {sizeInfo.is_estimate && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-500 italic">
              * Dung lượng ước tính dựa trên số lượng bản ghi
            </p>
          )}
        </div>
      </div>

      {showCleanup && (
        <DatabaseCleanupModal onClose={() => {
          setShowCleanup(false);
          fetchDatabaseSize(); // Refresh size after cleanup
        }} />
      )}
    </>
  );
}
