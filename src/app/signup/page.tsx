'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Fingerprint } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { startAuthentication } from '@simplewebauthn/browser';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminPasskeyLoading, setAdminPasskeyLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      setLoading(false);
      return;
    }
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    addToast({
      title: 'Đăng ký thành công!',
      description: 'Vui lòng đăng nhập để tiếp tục.',
      variant: 'success',
      duration: 3000,
    });
    router.push('/login');
  };

  const readJsonResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }
    const text = await res.text();
    return text ? { error: text } : {};
  };

  const handleAdminPasskeyLogin = async () => {
    setAdminPasskeyLoading(true);
    try {
      const optionsRes = await fetch('/api/admin/passkeys/auth-options', { method: 'POST' });
      const options = await readJsonResponse(optionsRes);
      if (!optionsRes.ok) {
        throw new Error(options.error || 'Không thể tạo yêu cầu xác thực');
      }

      const assertionResponse = await startAuthentication(options);
      const verifyRes = await fetch('/api/admin/passkeys/auth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assertionResponse }),
      });
      const verifyData = await readJsonResponse(verifyRes);
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Không thể xác thực');
      }

      window.location.assign('/admin/dashboard');
    } catch (err: any) {
      addToast({
        title: 'Đăng nhập vân tay thất bại',
        description: err?.message || 'Không thể xác thực',
        variant: 'error',
        duration: 3500,
      });
    } finally {
      setAdminPasskeyLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="rounded-[2rem] bg-white/80 dark:bg-[#1d1d1f]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">Đăng ký tài khoản</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Tạo tài khoản hệ thống để làm bài tập</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-base text-slate-900 dark:text-white transition focus:border-[#0066cc] dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-base text-slate-900 dark:text-white transition focus:border-[#0066cc] dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 pr-12 text-base text-slate-900 dark:text-white transition focus:border-[#0066cc] dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300"
                  disabled={loading}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Mật khẩu phải có ít nhất 6 ký tự</p>
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
              Đăng ký
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">Đã có tài khoản?</span>{' '}
            <Link href="/login" className="font-semibold text-[#0066cc] dark:text-blue-400 hover:text-[#005bb5] dark:hover:text-blue-300 transition">
              Đăng nhập ngay
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
            <Link
              href="/admin"
              className="flex w-full items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-[14px] font-semibold text-slate-700 dark:text-slate-300 transition hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-[#0066cc] dark:hover:text-blue-400"
            >
              Đăng nhập dưới quyền quản trị
            </Link>
            <button
              type="button"
              onClick={handleAdminPasskeyLogin}
              disabled={adminPasskeyLoading}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60"
              aria-label="Đăng nhập admin bằng vân tay"
            >
              <Fingerprint className={`h-5 w-5 ${adminPasskeyLoading ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
