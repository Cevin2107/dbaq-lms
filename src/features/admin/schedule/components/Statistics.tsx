import { useState, useEffect, useRef } from "react";
import { BookOpen, Download, Receipt, AlertCircle, Copy, Check, ShieldCheck, Building2 } from "lucide-react";
import { SUBJECT_NAMES, SUBJECT_COLORS, PRICE_PER_SESSION } from "@/features/admin/schedule/constants/subjects";
import type { TeachingSession, Subject } from "@/features/admin/schedule/lib/database.types";
import {
  generateTransferContent,
  generateInvoiceCode,
  getPaymentDueDate,
} from "@/features/admin/schedule/utils/vietqrUtils";

interface StatisticsProps {
  sessions: TeachingSession[];
  onExport: () => void;
  salaryPerSession?: number;
  studentName?: string;
  studentId?: string;
  month?: number;
  year?: number;
}

export function Statistics({
  sessions,
  onExport,
  salaryPerSession,
  studentName = "Học sinh",
  studentId,
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear(),
}: StatisticsProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState<boolean>(false);
  const [qrError, setQrError] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const totalDays = sessions.length;

  const subjectCounts = sessions.reduce((acc, session) => {
    acc[session.subject] = (acc[session.subject] || 0) + 1;
    return acc;
  }, {} as Record<Subject, number>);

  const pricePerSession = salaryPerSession || PRICE_PER_SESSION;
  const totalIncome = totalDays * pricePerSession;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const transferContent = generateTransferContent(studentName, month);
  const invoiceCode = generateInvoiceCode(studentName, year, month);
  const dueDate = getPaymentDueDate(year, month);

  const bankAccountNo = "19037817132016";
  const bankAccountOwner = "DAO BA ANH QUAN";
  const bankName = "Techcombank (TCB)";

  // Reset QR url when switching students to prevent showing previous student's QR
  useEffect(() => {
    setQrUrl(null);
  }, [studentId, studentName, month, year]);

  useEffect(() => {
    if (totalIncome <= 0) {
      setQrUrl(null);
      setIsLoadingQr(false);
      setQrError(false);
      return;
    }

    let isMounted = true;
    setIsLoadingQr(true);
    setQrError(false);

    fetch("/api/vietqr/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: totalIncome,
        content: transferContent,
        template: "qr_only",
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("API VietQR Error");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data?.qrLink) {
          setQrUrl(data.qrLink);
          setQrError(false);
        } else {
          setQrError(true);
        }
      })
      .catch((err) => {
        console.warn("[VietQR-Fetch-Warning]", err);
        if (isMounted) {
          // Fallback to VietQR QuickLink image directly with qr_only template and unique student cachebuster
          const fallbackUrl = `https://img.vietqr.io/image/TCB-${bankAccountNo}-qr_only.png?amount=${totalIncome}&addInfo=${encodeURIComponent(
            transferContent
          )}&accountName=${encodeURIComponent(bankAccountOwner)}&sid=${encodeURIComponent(studentId || studentName)}`;
          setQrUrl(fallbackUrl);
          setQrError(false);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [studentId, studentName, month, year, totalIncome, transferContent]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankAccountNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col justify-between gap-3">
      <div className="flex flex-col gap-3 flex-1 justify-between">
        {/* Card 1: Tổng số buổi (Ngang: Icon + Title bên trái, Số lượng bên phải) */}
        <div className="bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl rounded-[20px] shadow-sm border border-black/5 dark:border-white/5 p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-[12px]">
                <BookOpen className="w-4 h-4 text-[#0066cc]" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Tổng số buổi
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0066cc] dark:text-blue-400 tracking-tight">
              {totalDays}
            </div>
          </div>
        </div>

        {/* Card 2: Số buổi theo môn (3 Cards trên 1 hàng, không dùng progress bar) */}
        <div className="bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl rounded-[20px] shadow-sm border border-black/5 dark:border-white/5 p-4 space-y-2.5">
          <h4 className="font-bold text-slate-900 dark:text-white text-[13px] tracking-tight">
            Số buổi theo môn
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(SUBJECT_NAMES).map(([subject, name]) => {
              const count = subjectCounts[subject as Subject] || 0;

              return (
                <div
                  key={subject}
                  className="bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-[14px] border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center gap-1"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${SUBJECT_COLORS[subject as Subject].bg
                        }`}
                    />
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {name}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">
                      {count}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">buổi</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: HÓA ĐƠN HỌC PHÍ (Tuition Invoice Card) */}
        <div className="bg-white/90 dark:bg-[#1d1d1f]/90 backdrop-blur-xl rounded-[20px] shadow-sm border border-blue-500/20 dark:border-blue-400/20 p-4 sm:p-5 space-y-4 relative overflow-hidden flex-1 flex flex-col justify-between">
          {/* Subtle gradient background accent */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-blue-500/10 via-emerald-500/5 to-transparent rounded-full blur-xl pointer-events-none" />

          <div className="relative space-y-3.5">
            {/* Header / Invoice Title & Badge */}
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#0066cc]" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Học Phí Tháng {month}/{year}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-700/50 shadow-xs">
                {invoiceCode}
              </span>
            </div>

            {/* Tuition Total Amount */}
            <div className="space-y-0.5">
              <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                Tổng học phí
              </div>
              <div className="text-3xl font-extrabold text-[#0066cc] dark:text-blue-400 tracking-tight">
                {formatCurrency(totalIncome)}
              </div>
            </div>

            {/* QR Code Container - SIGNIFICANTLY ENLARGED QR CODE */}
            <div className="export-qr-container flex flex-col items-center justify-center pt-1.5 pb-1 my-auto">
              {totalIncome > 0 ? (
                isLoadingQr ? (
                  <div className="export-qr-image w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] bg-slate-200 dark:bg-slate-700 animate-pulse rounded-[18px] flex flex-col items-center justify-center text-slate-400">
                    <div className="w-10 h-10 border-4 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : qrError || !qrUrl ? (
                  <div className="export-qr-image w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-[18px] p-4 text-center flex flex-col items-center justify-center gap-1.5">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      Không tải được QR
                    </p>
                  </div>
                ) : (
                  <div className="bg-white p-3 sm:p-3.5 rounded-[20px] shadow-md border border-slate-200/80 inline-block overflow-hidden">
                    <img
                      src={qrUrl}
                      alt="QR Code"
                      className="export-qr-image w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] md:w-[320px] md:h-[320px] max-w-full object-contain rounded-[12px]"
                    />
                  </div>
                )
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Chưa có học phí phát sinh
                </div>
              )}
            </div>

            {/* Bank Details Table - 2 Columns Left Aligned */}
            <div className="space-y-2 text-[12px] bg-slate-50/80 dark:bg-slate-800/40 p-3 sm:p-3.5 rounded-[16px] border border-black/5 dark:border-white/5">
              <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Ngân hàng</span>
                <span className="font-bold text-slate-900 dark:text-white truncate">{bankName}</span>
              </div>
              <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Số TK</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white">
                  <span>{bankAccountNo}</span>
                  <button
                    onClick={handleCopyAccount}
                    title="Sao chép số tài khoản"
                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-500"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Chủ TK</span>
                <span className="font-bold text-slate-900 dark:text-white truncate">{bankAccountOwner}</span>
              </div>
              <div className="grid grid-cols-[90px_1fr] items-center gap-2 border-t border-black/5 dark:border-white/5 pt-2 mt-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Nội dung CK</span>
                <span className="font-mono font-bold text-[#0066cc] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded text-[11px] truncate max-w-fit">
                  {transferContent}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export PNG Button */}
      <button
        onClick={onExport}
        className="w-full bg-[#0066cc] text-white py-3.5 rounded-full font-bold shadow-lg shadow-blue-500/20 hover:bg-[#005bb5] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 group text-[15px]"
      >
        <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        Xuất ảnh thống kê & hóa đơn
      </button>
    </div>
  );
}
