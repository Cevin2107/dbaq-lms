import React from 'react';

interface FooterProps {
  className?: string;
  variant?: 'default' | 'admin';
}

export function Footer({ className = '', variant = 'default' }: FooterProps) {
  const currentYear = new Date().getFullYear();
  return (
    <footer
      className={`w-full border-t border-black/[0.04] dark:border-white/[0.05] py-4 bg-white/40 dark:bg-[#0a0a0a]/40 backdrop-blur-md text-center text-xs text-slate-400 dark:text-slate-500 ${className}`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© {currentYear} DBAQ LMS • Nền tảng học tập trực tuyến</span>
        <span className="text-[11px]">
          {variant === 'admin'
            ? 'Hệ thống Quản trị & Điều hành Đào tạo'
            : 'Đồng hành cùng học sinh nâng cao tư duy Toán - Tự nhiên'}
        </span>
      </div>
    </footer>
  );
}
