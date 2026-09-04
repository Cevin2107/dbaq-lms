'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Fingerprint,
  GraduationCap,
  Sparkles,
  BookOpenCheck,
  CalendarClock,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Quote,
  ArrowLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Footer } from '@/components/Footer';
import { startAuthentication } from '@simplewebauthn/browser';

type AuthMode = 'login' | 'signup' | 'forgot-password';
type FeatureId = 'assignments' | 'schedule' | 'progress';

interface AuthPortalProps {
  initialMode?: AuthMode;
}

const FEATURE_DATA = [
  {
    id: 'assignments' as FeatureId,
    title: 'Bài tập & Đề thi thử',
    shortDesc: 'Công thức Toán - Tự nhiên KaTeX sắc nét, làm bài tương tác và chấm điểm tự động.',
    icon: BookOpenCheck,
    badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
    accentBorder: 'border-blue-500/40 dark:border-blue-400/40',
    previewBadge: 'Chuẩn KaTeX & LaTeX',
    headline: 'Đề thi & Bài tập Toán - Tự nhiên chuyên sâu',
    highlightSnippet: 'Phương trình f(x) = x³ - 3x + 2 có bao nhiêu điểm cực trị?',
    tags: ['Toán 12', 'Chấm điểm tự động', 'Lời giải chi tiết', 'Tự động lưu bài'],
    detail: 'Hỗ trợ hiển thị công thức phân số, tích phân, căn thức cực nét. Lưu tạm tự động khi làm bài và nhận kết quả phân tích đáp án tức thì.',
  },
  {
    id: 'schedule' as FeatureId,
    title: 'Đăng ký ca học',
    shortDesc: 'Đăng ký ca học linh hoạt, theo dõi ca học sắp tới theo thời gian thực.',
    icon: CalendarClock,
    badgeColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
    accentBorder: 'border-indigo-500/40 dark:border-indigo-400/40',
    previewBadge: 'Phân ca Realtime',
    headline: 'Quản lý lịch học thông minh & công bằng',
    highlightSnippet: 'Ca học sắp tới: Thứ 5 (18:00 - 20:00) • Lớp Chuyên đề Toán',
    tags: ['Tự động nhắc lịch', 'Giới hạn ca công bằng', 'Tránh trùng lịch', 'Realtime Sync'],
    detail: 'Học sinh chủ động đăng ký các ca học trong tuần theo định mức được phân bổ, theo dõi ca học kế tiếp ngay tại trang chủ.',
  },
  {
    id: 'progress' as FeatureId,
    title: 'Theo dõi tiến độ',
    shortDesc: 'Lưu trữ lịch sử nộp bài, phân tích điểm số và nhận xét kèm sát 1:1.',
    icon: TrendingUp,
    badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    accentBorder: 'border-emerald-500/40 dark:border-emerald-400/40',
    previewBadge: 'Báo cáo năng lực',
    headline: 'Thống kê cá nhân hóa & Nhận xét gia sư',
    highlightSnippet: 'Tỉ lệ hoàn thành: 95% • Điểm trung bình bài tập: 8.8 / 10',
    tags: ['Báo cáo tiến bộ', 'Chấm chữa 1:1', 'Chữa lỗi sai', 'Bứt phá điểm số'],
    detail: 'Mọi bài làm đều được lưu vết minh bạch giúp gia sư theo dõi sát sao mức độ hiểu bài và kịp thời bù đắp các lỗ hổng kiến thức.',
  },
];

export function AuthPortal({ initialMode = 'login' }: AuthPortalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [activeFeature, setActiveFeature] = useState<FeatureId>('assignments');
  
  // Login & Signup States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [adminPasskeyLoading, setAdminPasskeyLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  useEffect(() => {
    const tabParam = searchParams.get('tab') || searchParams.get('mode');
    if (tabParam === 'signup') {
      setMode('signup');
    } else if (tabParam === 'login') {
      setMode('login');
    } else if (tabParam === 'forgot-password') {
      setMode('forgot-password');
    }
  }, [searchParams]);

  const switchMode = (newMode: AuthMode) => {
    setError('');
    setMode(newMode);
    if (typeof window !== 'undefined') {
      const targetUrl = newMode === 'signup' ? '/signup' : newMode === 'forgot-password' ? '/forgot-password' : '/login';
      window.history.replaceState(null, '', targetUrl);
    }
  };

  const readJsonResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }
    const text = await res.text();
    return text ? { error: text } : {};
  };

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
          maxAge: rememberMe ? 365 * 24 * 60 * 60 : undefined,
        },
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
      description: 'Chào mừng bạn quay trở lại hệ thống.',
      variant: 'success',
      duration: 3000,
    });
    router.push('/');
    router.refresh();
  };

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

    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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
      title: 'Đăng ký tài khoản thành công!',
      description: 'Vui lòng đăng nhập để bắt đầu học tập.',
      variant: 'success',
      duration: 4000,
    });
    setLoading(false);
    switchMode('login');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.trim()) {
      setError('Vui lòng nhập email nhận liên kết');
      setLoading(false);
      return;
    }

    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setResetSent(true);
    setLoading(false);
    addToast({
      title: 'Đã gửi liên kết khôi phục!',
      description: 'Vui lòng kiểm tra hộp thư email của bạn.',
      variant: 'success',
      duration: 5000,
    });
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
        title: 'Đăng nhập passkey thất bại',
        description: err?.message || 'Không thể xác thực',
        variant: 'error',
        duration: 3500,
      });
    } finally {
      setAdminPasskeyLoading(false);
    }
  };

  const currentFeature = FEATURE_DATA.find((f) => f.id === activeFeature) || FEATURE_DATA[0];

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-[#0066cc]/20 selection:text-[#0066cc]">
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-400/10 to-transparent blur-3xl dark:from-blue-600/10 dark:via-indigo-900/10" />
      <div className="pointer-events-none absolute top-1/4 -right-40 h-[36rem] w-[36rem] rounded-full bg-gradient-to-bl from-sky-400/20 via-blue-500/10 to-transparent blur-3xl dark:from-sky-500/10 dark:via-blue-950/20" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-indigo-300/15 via-blue-400/10 to-transparent blur-3xl dark:from-indigo-950/15" />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full border-b border-black/[0.05] dark:border-white/[0.06] bg-white/60 dark:bg-[#0a0a0a]/60 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066cc] to-blue-700 text-white shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105 duration-300">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  Gia sư Đào Bá Anh Quân
                </span>
                <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-[#0066cc] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                  LMS Portal
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Nền tảng Học tập & Luyện thi Trực tuyến
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-3.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Hệ thống trực tuyến 24/7</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content: 2-Column Split */}
      <main className="relative z-10 flex-1 flex items-center py-8 sm:py-12 lg:py-14">
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Platform Introduction & Interactive Synchronized Feature Showcase */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-6 sm:space-y-7 animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 dark:border-blue-500/20 bg-blue-50/80 dark:bg-blue-950/40 px-4 py-1.5 text-xs font-semibold text-[#0066cc] dark:text-blue-400 backdrop-blur-md shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Không gian học tập & luyện thi chất lượng cao</span>
              </div>

              {/* Hero Headlines */}
              <div className="space-y-2.5">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-slate-900 dark:text-white leading-[1.15]">
                  Rèn luyện kiến thức vững vàng,{' '}
                  <span className="bg-gradient-to-r from-[#0066cc] via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                    tự tin bứt phá mọi kỳ thi
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  Đồng hành cùng học sinh của <strong className="font-semibold text-slate-900 dark:text-white">Gia sư Đào Bá Anh Quân</strong>. Khám phá các tính năng chuyên sâu dưới đây:
                </p>
              </div>

              {/* Feature Tabs: 3 Bento Interactive Cards with Synchronized State */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {FEATURE_DATA.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeFeature === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveFeature(item.id)}
                        className={`text-left rounded-[1.75rem] p-4.5 sm:p-5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          isActive
                            ? 'bg-white dark:bg-[#1f1f25] border-2 ' +
                              item.accentBorder +
                              ' shadow-[0_8px_30px_rgba(0,102,204,0.12)] scale-[1.02] ring-2 ring-[#0066cc]/10'
                            : 'bg-white/60 dark:bg-[#1a1a1f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 opacity-80 hover:opacity-100 hover:bg-white/80 dark:hover:bg-[#1f1f24]/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.badgeColor} transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          {isActive && (
                            <span className="flex h-2 w-2 rounded-full bg-[#0066cc] dark:bg-blue-400 animate-pulse" />
                          )}
                        </div>
                        <h3 className={`text-sm font-bold tracking-tight mb-1 ${isActive ? 'text-[#0066cc] dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {item.shortDesc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Synchronized Spotlight Detail Card */}
                <div className="rounded-[2rem] bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50/70 dark:from-blue-950/25 dark:via-indigo-950/15 dark:to-[#17171d]/50 border border-blue-100/90 dark:border-white/5 p-5 backdrop-blur-xl shadow-sm transition-all duration-300">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0066cc]/10 text-[#0066cc] dark:bg-blue-400/20 dark:text-blue-300">
                      <Zap className="h-3.5 w-3.5" />
                      <span>{currentFeature.previewBadge}</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      Nhấn vào từng thẻ trên để xem chi tiết
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{currentFeature.headline}</span>
                    </h4>
                    <p className="text-xs font-mono bg-white/70 dark:bg-black/30 border border-black/5 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200">
                      {currentFeature.highlightSnippet}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {currentFeature.detail}
                    </p>
                  </div>

                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-3 mt-3 border-t border-black/5 dark:border-white/5">
                    {currentFeature.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-white/80 dark:bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/5"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inspirational Quote Strip */}
              <div className="rounded-[1.75rem] bg-white/50 dark:bg-[#1a1a1f]/50 border border-black/5 dark:border-white/5 p-4 sm:p-5 backdrop-blur-md flex items-start gap-3.5">
                <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0066cc]/10 text-[#0066cc] dark:text-blue-400">
                  <Quote className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-medium italic text-slate-700 dark:text-slate-300 leading-relaxed">
                    &ldquo;Học tập là hạt giống của trí tuệ, sự kiên trì là giọt nước tưới mát cây thành công.&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    — Lời nhắn gửi từ Gia sư Đào Bá Anh Quân
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Sliding Synchronized Form Container */}
            <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end animate-slide-up">
              <div className="w-full max-w-md rounded-[2.5rem] bg-white/85 dark:bg-[#1a1a1f]/85 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_20px_50px_rgba(0,102,204,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-7 sm:p-9 transition-all relative overflow-hidden">
                
                {/* Apple Segmented Control: Sliding Pill Indicator */}
                {mode !== 'forgot-password' ? (
                  <div className="relative flex p-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl mb-7 border border-black/[0.04] dark:border-white/[0.05]">
                    {/* Synchronized Morphing Pill */}
                    <div
                      className="absolute top-1.5 bottom-1.5 rounded-xl bg-white dark:bg-[#2a2a30] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{
                        width: 'calc(50% - 6px)',
                        transform: mode === 'signup' ? 'translateX(calc(100% + 6px))' : 'translateX(0px)',
                        left: '3px',
                      }}
                    />
                    
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className={`relative z-10 flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-colors duration-200 ${
                        mode === 'login'
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className={`relative z-10 flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-colors duration-200 ${
                        mode === 'signup'
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Đăng ký tài khoản
                    </button>
                  </div>
                ) : (
                  <div className="mb-6 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#0066cc] dark:hover:text-blue-400 transition"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Quay lại đăng nhập</span>
                    </button>
                  </div>
                )}

                {/* Sliding Form Panels Container */}
                {mode !== 'forgot-password' ? (
                  <div className="overflow-hidden">
                    <div
                      className="flex w-[200%] transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{
                        transform: mode === 'signup' ? 'translateX(-50%)' : 'translateX(0%)',
                      }}
                    >
                      {/* PANEL 1: LOGIN FORM */}
                      <div className={`w-1/2 pr-3.5 transition-opacity duration-300 ${mode === 'login' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#0066cc] dark:text-blue-400">
                              <Lock className="h-5 w-5" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">
                                Chào mừng trở lại!
                              </h2>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Đăng nhập để vào không gian học tập của bạn
                              </p>
                            </div>
                          </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                          <div>
                            <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                              Địa chỉ Email
                            </label>
                            <div className="relative">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                                <Mail className="h-4 w-4" />
                              </div>
                              <input
                                id="login-email"
                                type="email"
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:border-[#0066cc] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                                placeholder="student@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                                autoComplete="email"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                Mật khẩu
                              </label>
                              <button
                                type="button"
                                onClick={() => switchMode('forgot-password')}
                                className="text-xs font-medium text-[#0066cc] dark:text-blue-400 hover:underline transition"
                              >
                                Quên mật khẩu?
                              </button>
                            </div>
                            <div className="relative">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                                <Lock className="h-4 w-4" />
                              </div>
                              <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 pl-10 pr-11 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:border-[#0066cc] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                                autoComplete="current-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((current) => !current)}
                                className="absolute inset-y-0 right-0 flex items-center justify-center px-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition disabled:cursor-not-allowed"
                                disabled={loading}
                                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                aria-pressed={showPassword}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center pt-0.5">
                            <input
                              id="rememberMe"
                              type="checkbox"
                              className="h-4 w-4 rounded-md border-slate-300 text-[#0066cc] focus:ring-[#0066cc] dark:border-slate-600 dark:bg-slate-800 dark:checked:bg-blue-500 cursor-pointer"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              disabled={loading}
                            />
                            <label htmlFor="rememberMe" className="ml-2.5 block text-xs sm:text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                              Luôn duy trì đăng nhập
                            </label>
                          </div>

                          {error && (
                            <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3.5 text-xs text-red-600 dark:text-red-400 leading-relaxed">
                              {error}
                            </div>
                          )}

                          <Button
                            type="submit"
                            variant="brand"
                            className="w-full h-12 rounded-2xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all"
                            disabled={loading}
                            loading={loading}
                          >
                            <span>{loading ? 'Đang xác thực đăng nhập...' : 'Đăng nhập hệ thống'}</span>
                            {!loading && <ArrowRight className="h-4 w-4" />}
                          </Button>
                        </form>

                        <div className="mt-5 text-center text-xs sm:text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Chưa có tài khoản học viên?</span>{' '}
                          <button
                            type="button"
                            onClick={() => switchMode('signup')}
                            className="font-semibold text-[#0066cc] dark:text-blue-400 hover:underline transition"
                          >
                            Đăng ký ngay
                          </button>
                        </div>
                      </div>

                      {/* PANEL 2: SIGNUP FORM */}
                      <div className={`w-1/2 pl-3.5 transition-opacity duration-300 ${mode === 'signup' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">
                                Tạo tài khoản học viên
                              </h2>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Bắt đầu học tập cùng Thầy Đào Bá Anh Quân
                              </p>
                            </div>
                          </div>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-3.5">
                          <div>
                            <label htmlFor="signup-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                              Họ và tên học sinh <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                                <User className="h-4 w-4" />
                              </div>
                              <input
                                id="signup-name"
                                type="text"
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:border-[#0066cc] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                                placeholder="Nguyễn Văn A"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={loading}
                                required
                                autoComplete="name"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="signup-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                              Địa chỉ Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                                <Mail className="h-4 w-4" />
                              </div>
                              <input
                                id="signup-email"
                                type="email"
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:border-[#0066cc] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                                placeholder="student@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                                autoComplete="email"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="signup-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                              Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                                <Lock className="h-4 w-4" />
                              </div>
                              <input
                                id="signup-password"
                                type={showPassword ? 'text' : 'password'}
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 pl-10 pr-11 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:border-[#0066cc] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                                placeholder="Tối thiểu 6 ký tự"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                                autoComplete="new-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((current) => !current)}
                                className="absolute inset-y-0 right-0 flex items-center justify-center px-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition disabled:cursor-not-allowed"
                                disabled={loading}
                                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                aria-pressed={showPassword}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              Mật khẩu phải dài tối thiểu 6 ký tự để bảo vệ tài khoản.
                            </p>
                          </div>

                          {error && (
                            <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3.5 text-xs text-red-600 dark:text-red-400 leading-relaxed">
                              {error}
                            </div>
                          )}

                          <Button
                            type="submit"
                            variant="brand"
                            className="w-full h-12 rounded-2xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all"
                            disabled={loading}
                            loading={loading}
                          >
                            <span>{loading ? 'Đang khởi tạo tài khoản...' : 'Hoàn tất đăng ký'}</span>
                            {!loading && <ArrowRight className="h-4 w-4" />}
                          </Button>
                        </form>

                        <div className="mt-5 text-center text-xs sm:text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Đã có tài khoản học viên?</span>{' '}
                          <button
                            type="button"
                            onClick={() => switchMode('login')}
                            className="font-semibold text-[#0066cc] dark:text-blue-400 hover:underline transition"
                          >
                            Đăng nhập ngay
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MODE 3: FORGOT PASSWORD */
                  <div className="animate-fade-in">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                          <Lock className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-[-0.02em]">
                            Khôi phục mật khẩu
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Nhận liên kết đặt lại mật khẩu qua email
                          </p>
                        </div>
                      </div>
                    </div>

                    {resetSent ? (
                      <div className="space-y-4 text-center py-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Đã gửi email khôi phục!
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong className="text-slate-900 dark:text-white">{email}</strong>. Vui lòng kiểm tra hộp thư đến (và mục spam nếu cần).
                        </p>
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full h-11 rounded-2xl text-xs font-semibold mt-4"
                          onClick={() => {
                            setResetSent(false);
                            switchMode('login');
                          }}
                        >
                          Quay lại đăng nhập
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                          <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            Địa chỉ Email đăng ký
                          </label>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                              <Mail className="h-4 w-4" />
                            </div>
                            <input
                              id="forgot-email"
                              type="email"
                              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:border-[#0066cc] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 dark:focus:ring-blue-500/20"
                              placeholder="student@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              disabled={loading}
                              required
                              autoComplete="email"
                            />
                          </div>
                        </div>

                        {error && (
                          <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3.5 text-xs text-red-600 dark:text-red-400 leading-relaxed">
                            {error}
                          </div>
                        )}

                        <Button
                          type="submit"
                          variant="brand"
                          className="w-full h-12 rounded-2xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all"
                          disabled={loading}
                          loading={loading}
                        >
                          <span>{loading ? 'Đang gửi liên kết...' : 'Gửi liên kết khôi phục'}</span>
                          {!loading && <ArrowRight className="h-4 w-4" />}
                        </Button>

                        <div className="mt-4 text-center">
                          <button
                            type="button"
                            onClick={() => switchMode('login')}
                            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#0066cc] dark:hover:text-blue-400 transition"
                          >
                            Hủy và quay lại đăng nhập
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Admin and Passkey Section */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
                  <Link
                    href="/admin"
                    className="flex w-full items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-800/40 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-[#0066cc] dark:hover:text-blue-400"
                  >
                    Đăng nhập Quản trị viên
                  </Link>
                  <button
                    type="button"
                    onClick={handleAdminPasskeyLogin}
                    disabled={adminPasskeyLoading || loading}
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 ${adminPasskeyLoading ? 'ring-2 ring-[#0066cc]/40 bg-blue-50/50 dark:bg-blue-900/30' : ''}`}
                    title="Đăng nhập Admin bằng Passkey"
                    aria-label="Đăng nhập admin bằng passkey"
                  >
                    <Fingerprint className={`h-5 w-5 ${adminPasskeyLoading ? 'animate-pulse text-[#0066cc]' : ''}`} />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
