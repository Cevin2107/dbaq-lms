'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Fingerprint } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { startAuthentication } from '@simplewebauthn/browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminPasskeyLoading, setAdminPasskeyLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.trim()) {
      setError('Vui lòng nhập email');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      setLoading(false);
      return;
    }

    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          maxAge: rememberMe ? 365 * 24 * 60 * 60 : undefined, // 1 year or Session
        }
      }
    );

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    addToast({
      title: 'Đăng nhập thành công!',
      description: 'Chào mừng bạn quay trở lại.',
      variant: 'success',
      duration: 3000,
    });
    router.push('/');
    router.refresh(); // Refresh to update server components with new auth state
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">Đăng nhập</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Đăng nhập hệ thống để làm bài tập</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
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
                Mật khẩu
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
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300"
                  disabled={loading}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center pt-1">
              <input
                id="rememberMe"
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-[#0066cc] focus:ring-[#0066cc] dark:border-slate-600 dark:bg-slate-800 dark:checked:bg-blue-500"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="rememberMe" className="ml-2.5 block text-sm text-slate-600 dark:text-slate-400">
                Luôn giữ tôi đăng nhập
              </label>
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
              Đăng nhập
            </Button>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-center text-sm font-medium text-[#0066cc] dark:text-blue-400 hover:text-[#005bb5] dark:hover:text-blue-300 transition"
            >
              Quên mật khẩu?
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">Chưa có tài khoản?</span>{' '}
            <Link href="/signup" className="font-semibold text-[#0066cc] dark:text-blue-400 hover:text-[#005bb5] dark:hover:text-blue-300 transition">
              Đăng ký ngay
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
