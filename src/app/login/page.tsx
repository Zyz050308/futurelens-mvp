'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';

type LoginStep = 'email' | 'code';

type LoginResponse = {
  success: boolean;
  phase?: 'code_sent' | 'verified';
  email?: string;
  expiresAt?: string;
  devCode?: string;
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

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          cache: 'no-store',
        });
        const result = await response.json();

        if (isMounted && response.ok && result.user) {
          router.replace(getReturnPath());
          return;
        }
      } catch {
        // The login form remains available when session lookup fails.
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
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const result = await response.json() as LoginResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || '验证码发送失败');
      }

      setEmail(result.email || email.trim().toLowerCase());
      setDevCode(result.devCode || '');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });
      const result = await response.json() as LoginResponse;

      if (!response.ok || !result.success || result.phase !== 'verified') {
        throw new Error(result.error || '验证码无效');
      }

      router.replace(getReturnPath());
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '登录失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <main className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#007AFF] animate-spin" aria-label="正在检查登录状态" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F7] px-5 py-12 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1D1D1F] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>

        <section className="ios-card p-6">
          <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center mb-5">
            <Mail className="w-5 h-5 text-[#007AFF]" />
          </div>

          <h1 className="text-xl font-semibold text-[#1D1D1F]">
            {step === 'email' ? '登录 FutureLens' : '输入验证码'}
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
            {step === 'email'
              ? '登录后，你的 Profile 和发现记录可以跨设备恢复。'
              : `验证码已发送至 ${email}`}
          </p>

          {step === 'email' ? (
            <form onSubmit={requestCode} className="mt-6">
              <label htmlFor="email" className="block text-sm font-medium text-[#1D1D1F] mb-2">
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="ios-button-primary w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                获取验证码
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-6">
              <label htmlFor="code" className="block text-sm font-medium text-[#1D1D1F] mb-2">
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
                <div className="mt-3 rounded-lg bg-[#FFF7E8] px-3 py-2 text-sm text-[#9A6700]">
                  开发验证码：<span className="font-semibold">{devCode}</span>
                </div>
              )}

              {error && <p className="mt-3 text-sm text-[#FF3B30]">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting || code.length !== 6}
                className="ios-button-primary w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                完成登录
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setDevCode('');
                  setError('');
                }}
                className="w-full mt-3 py-2 text-sm text-[#007AFF] disabled:opacity-50"
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
