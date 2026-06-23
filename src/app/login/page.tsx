'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, Loader2, Mail, UserPlus } from 'lucide-react';

type LoginStep = 'email' | 'code';

type LoginResponse = {
  success: boolean;
  phase?: 'code_sent' | 'verified';
  email?: string;
  expiresAt?: string;
  devCode?: string;
  delivery?: 'email' | 'development';
  code?: string;
  error?: string;
};

function getReturnPath(): string {
  if (typeof window === 'undefined') {
    return '/profile';
  }

  const candidate = new URLSearchParams(window.location.search).get('from');
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/profile';
  }

  return candidate;
}

function getRegisterPath(): string {
  return `/register?from=${encodeURIComponent(getReturnPath())}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [delivery, setDelivery] = useState<'email' | 'development'>('email');
  const [isCopied, setIsCopied] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shouldCreateIdentity, setShouldCreateIdentity] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });
        const result = await response.json();

        if (isMounted && response.ok && result.user) {
          router.replace(getReturnPath());
          return;
        }
      } catch {
        // Keep the login form usable when session lookup fails.
      }

      if (isMounted) {
        setIsCheckingSession(false);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const requestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setShouldCreateIdentity(false);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const result = await response.json() as LoginResponse;

      if (!response.ok || !result.success) {
        if (result.code === 'USER_NOT_FOUND' || result.code === 'INCOMPLETE_ACCOUNT') {
          setShouldCreateIdentity(true);
        }
        throw new Error(result.error || '验证码发送失败');
      }

      setEmail(result.email || email.trim().toLowerCase());
      setDevCode(result.devCode || '');
      setDelivery(result.delivery || (result.devCode ? 'development' : 'email'));
      setIsCopied(false);
      setStep('code');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '验证码发送失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });
      const result = await response.json() as LoginResponse;

      if (!response.ok || !result.success || result.phase !== 'verified') {
        throw new Error(result.error || '验证码无效');
      }

      const sessionResponse = await fetch('/api/auth/me', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });
      const sessionResult = await sessionResponse.json();

      if (!sessionResponse.ok || !sessionResult.user) {
        throw new Error('登录状态未能保存，请检查当前访问地址是否允许 Cookie');
      }

      window.location.replace(getReturnPath());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '登录失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyDevCode = async () => {
    if (!devCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(devCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      setError('复制失败，请手动选择验证码');
    }
  };

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F5F7]">
        <Loader2 className="h-6 w-6 animate-spin text-[#007AFF]" aria-label="正在检查登录状态" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-5 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1D1D1F]"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>

        <section className="ios-card p-6">
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#007AFF]/10">
            <Mail className="h-5 w-5 text-[#007AFF]" />
          </div>

          <h1 className="text-xl font-semibold text-[#1D1D1F]">
            {step === 'email' ? '登录 FutureLens' : '输入验证码'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
            {step === 'email'
              ? '登录后，你的 Profile 和发现记录可以跨设备恢复。'
              : delivery === 'development'
                ? `当前使用开发验证码登录：${email}`
                : `验证码已发送至 ${email}`}
          </p>

          {step === 'email' ? (
            <form onSubmit={requestCode} className="mt-6">
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#1D1D1F]">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="ios-input w-full px-4 py-3 text-sm"
              />

              {error && <p className="mt-3 text-sm text-[#FF3B30]">{error}</p>}

              {shouldCreateIdentity && (
                <Link
                  href={getRegisterPath()}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#CBD6EA] bg-white px-4 py-3 text-sm font-semibold text-[#3157D5] transition-colors hover:bg-[#F4F7FF]"
                >
                  <UserPlus className="h-4 w-4" />
                  创建 FutureLens 身份
                </Link>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="ios-button-primary mt-5 flex w-full items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                获取验证码
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-6">
              <label htmlFor="code" className="mb-2 block text-sm font-medium text-[#1D1D1F]">
                验证码
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                autoFocus
                maxLength={6}
                pattern="[0-9]{6}"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 位验证码"
                className="ios-input w-full px-4 py-3 text-sm tracking-widest"
              />

              {devCode && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#FFF7E8] px-3 py-2 text-sm text-[#9A6700]">
                  <span>
                    开发验证码：<span className="select-all font-semibold">{devCode}</span>
                  </span>
                  <button
                    type="button"
                    onClick={copyDevCode}
                    aria-label="复制开发验证码"
                    title="复制开发验证码"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-[#9A6700]/10"
                  >
                    {isCopied
                      ? <Check className="h-4 w-4" />
                      : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              )}

              {error && <p className="mt-3 text-sm text-[#FF3B30]">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting || code.length !== 6}
                className="ios-button-primary mt-5 flex w-full items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                完成登录
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setDevCode('');
                  setDelivery('email');
                  setIsCopied(false);
                  setShouldCreateIdentity(false);
                  setError('');
                }}
                className="mt-3 w-full py-2 text-sm text-[#007AFF] disabled:opacity-50"
              >
                更换邮箱
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
