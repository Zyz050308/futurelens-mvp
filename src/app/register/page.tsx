'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, Mail, Sparkles } from 'lucide-react';
import type { PublicUser } from '@/types/user';

function getSafeFrom(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/account';
  }
  return value;
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = getSafeFrom(searchParams.get('from'));

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [codeRequested, setCodeRequested] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<PublicUser | null>(null);

  const handleRequestCode = async () => {
    if (isRequestingCode) {
      return;
    }

    setIsRequestingCode(true);
    setError(null);
    setDevCode(null);

    try {
      if (!nickname.trim()) {
        throw new Error('请先填写昵称');
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname, email }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || '验证码获取失败，请稍后再试');
      }

      setCodeRequested(true);
      if (result.devCode) {
        setDevCode(result.devCode);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '验证码获取失败，请稍后再试');
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          email,
          verificationCode,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success || !result.user) {
        throw new Error(result?.error || '创建失败，请稍后再试');
      }

      setRegisteredUser(result.user);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '创建失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredUser) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F7FF_54%,#FFFFFF_100%)] px-5 py-10 text-[#14213D]">
        <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-xl items-center">
          <section className="w-full rounded-2xl border border-[#E0E7F3] bg-white p-8 shadow-[0_24px_70px_rgba(43,68,116,0.12)]">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF7EF] text-[#247A47]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-[#3157D5]">欢迎来到 FutureLens</p>
            <h1 className="mt-3 text-3xl font-bold text-[#101D38]">
              你的 UID：{registeredUser.publicUid || '生成中'}
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#66758E]">
              从现在开始，FutureLens 会把你的问题、反馈和材料记录在这个身份下。
            </p>
            <button
              type="button"
              onClick={() => router.push(from)}
              className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3157D5] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2748B8]"
            >
              继续生成我的下一步
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F7FF_54%,#FFFFFF_100%)] px-5 py-10 text-[#14213D]">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-xl items-center">
        <section className="w-full rounded-2xl border border-[#E0E7F3] bg-white p-8 shadow-[0_24px_70px_rgba(43,68,116,0.12)]">
          <Link href="/" className="text-sm font-medium text-[#3157D5] hover:text-[#2748B8]">
            返回首页
          </Link>

          <div className="mt-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#3157D5]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-[#101D38]">创建你的 FutureLens 身份</h1>
            <p className="mt-4 text-sm leading-7 text-[#66758E]">
              FutureLens 会记住你的问题、材料和反馈。以后你回来时，它会知道你上次卡在哪里。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-[#33425D]">昵称</span>
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="例如：阿盘"
                className="mt-2 h-12 w-full rounded-xl border border-[#DDE4F0] bg-white px-4 text-sm outline-none transition focus:border-[#3157D5] focus:ring-4 focus:ring-[#3157D5]/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#33425D]">邮箱</span>
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-[#DDE4F0] bg-white px-4 text-sm outline-none transition focus:border-[#3157D5] focus:ring-4 focus:ring-[#3157D5]/10"
                />
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={isRequestingCode}
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#CBD6EA] bg-white px-4 text-sm font-semibold text-[#3157D5] transition-colors hover:bg-[#F4F7FF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRequestingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  获取验证码
                </button>
              </div>
            </label>

            {codeRequested && (
              <label className="block">
                <span className="text-sm font-medium text-[#33425D]">验证码</span>
                <input
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="输入 6 位验证码"
                  className="mt-2 h-12 w-full rounded-xl border border-[#DDE4F0] bg-white px-4 text-sm outline-none transition focus:border-[#3157D5] focus:ring-4 focus:ring-[#3157D5]/10"
                />
              </label>
            )}

            {devCode && (
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(devCode)}
                className="w-full rounded-xl bg-[#F4F7FF] px-4 py-3 text-left text-sm text-[#3157D5]"
              >
                开发验证码：{devCode}
              </button>
            )}

            {error && (
              <p className="rounded-xl bg-[#FFF1F0] px-4 py-3 text-sm text-[#C24135]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !codeRequested}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3157D5] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2748B8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在创建
                </>
              ) : (
                <>
                  创建并继续
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#8B97AA]">
            已有账号？{' '}
            <Link href={`/login?from=${encodeURIComponent(from)}`} className="font-medium text-[#3157D5]">
              去登录
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F7FF_54%,#FFFFFF_100%)] px-5 py-10 text-[#14213D]">
          <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-xl items-center">
            <section className="w-full rounded-2xl border border-[#E0E7F3] bg-white p-8 shadow-[0_24px_70px_rgba(43,68,116,0.12)]">
              <p className="text-sm text-[#66758E]">正在准备注册页...</p>
            </section>
          </div>
        </main>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
