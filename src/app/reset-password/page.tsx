'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    // Check if we have a hash fragment from Supabase
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) {
      addToast({
        title: 'Link không hợp lệ',
        description: 'Vui lòng yêu cầu gửi lại link đặt lại mật khẩu.',
        variant: 'error',
        duration: 5000,
      });
      router.push('/forgot-password');
    }
  }, [router, addToast]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    addToast({
      title: 'Đặt lại mật khẩu thành công!',
      description: 'Vui lòng đăng nhập với mật khẩu mới.',
      variant: 'success',
      duration: 3000,
    });
    setTimeout(() => router.push('/login'), 2000);
  };

  if (success) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 sm:p-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">Đặt lại mật khẩu thành công!</h1>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">Đang chuyển hướng đến trang đăng nhập...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7.5a5.5 5.5 0 00-9.2 3.8 3.5 3.5 0 002.2 6.7h1.5m9-6.5a5.5 5.5 0 01-9.2 3.8 3.5 3.5 0 01-2.2-6.7h-1.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">Đặt lại mật khẩu</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Tạo mật khẩu mới cho tài khoản của bạn</p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Mật khẩu mới
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-base text-slate-900 dark:text-white transition focus:border-[#0066cc] dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Phải có ít nhất 6 ký tự</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-base text-slate-900 dark:text-white transition focus:border-[#0066cc] dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="brand"
              className="w-full"
              disabled={loading}
              loading={loading}
            >
              Đặt lại mật khẩu
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 dark:border-white/5 pt-6">
            <Link href="/login" className="text-[14px] font-semibold text-[#0066cc] dark:text-blue-400 hover:text-[#005bb5] dark:hover:text-blue-300 transition">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
