import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f5f5f7] dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[2.5rem] bg-white/80 dark:bg-[#1a1a1f]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_50px_rgba(0,102,204,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-8 sm:p-10 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-400 font-extrabold text-xl">
            404
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Không tìm thấy trang
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được thay đổi.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-full text-sm font-bold text-white bg-[#0066cc] hover:bg-[#005bb5] shadow-md shadow-blue-500/20 hover:shadow-lg transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay về trang chủ</span>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
