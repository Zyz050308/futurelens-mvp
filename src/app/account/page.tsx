'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Clock3,
  FileText,
  Home,
  Loader2,
  LogOut,
  Sparkles,
  UserRound,
} from 'lucide-react';
import type { FutureProfile } from '@/types/radar';
import type { PublicUser } from '@/types/user';

const PROFILE_DRAFT_KEY = 'futurelens-profile-draft';

type UserProblem = {
  id: string;
  originalInput: string;
  problemShape: string | null;
  status: string;
  createdAt: string;
};

type AccountPayload = {
  user: PublicUser;
  profile: FutureProfile | null;
  latestProblem: UserProblem | null;
  problems: UserProblem[];
};

const EMPTY_PROFILE: FutureProfile = {
  age: '',
  education: '',
  majorOrCareer: '',
  currentSkills: '',
  currentSituation: '',
  currentGoal: '',
  currentAnxiety: '',
  desiredOutcome: '',
  weeklyTime: '',
  riskPreference: '',
};

function displayValue(value?: string | null) {
  return value && value.trim() ? value : '尚未补充';
}

export default function AccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountPayload | null>(null);
  const [newProblem, setNewProblem] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAccount = async () => {
      try {
        const response = await fetch('/api/account', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });
        const result = await response.json().catch(() => null);

        if (response.status === 401) {
          router.push('/login?from=/account');
          return;
        }

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || '无法读取账号信息');
        }

        if (isMounted) {
          setAccount({
            user: result.user,
            profile: result.profile,
            latestProblem: result.latestProblem,
            problems: result.problems || [],
          });
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : '无法读取账号信息');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      router.replace('/');
    }
  };

  const handleStartProblem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = newProblem.trim();
    if (!problem || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await fetch('/api/account', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem }),
      });
    } catch {
      // The local draft keeps the existing Radar flow usable if the account log is unavailable.
    }

    let existingDraft: Partial<FutureProfile> = {};
    try {
      existingDraft = JSON.parse(localStorage.getItem(PROFILE_DRAFT_KEY) || '{}') as Partial<FutureProfile>;
    } catch {
      existingDraft = {};
    }

    const draft: FutureProfile = {
      ...EMPTY_PROFILE,
      ...existingDraft,
      currentSituation: problem,
    };

    localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(draft));
    router.push('/profile');
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F8FC] text-[#14213D]">
        <div className="flex items-center gap-2 text-sm text-[#66758E]">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在读取你的 FutureLens
        </div>
      </main>
    );
  }

  if (error || !account) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F8FC] px-5 text-[#14213D]">
        <section className="max-w-md rounded-2xl border border-[#E0E7F3] bg-white p-6 text-center shadow-[0_18px_50px_rgba(43,68,116,0.1)]">
          <p className="text-sm text-[#C24135]">{error || '账号信息不可用'}</p>
          <Link
            href="/login?from=/account"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#3157D5] px-5 text-sm font-semibold text-white"
          >
            去登录
          </Link>
        </section>
      </main>
    );
  }

  const { user, profile, latestProblem, problems } = account;

  return (
    <main className="min-h-screen bg-[#F6F8FC] text-[#14213D]">
      <header className="border-b border-[#E4EAF4] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#3157D5]"
          >
            <Home className="h-4 w-4" />
            返回首页
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/profile" className="text-sm font-medium text-[#66758E] hover:text-[#3157D5]">
              补充问题背景
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#DDE4F0] bg-white px-3 text-sm font-medium text-[#66758E] transition-colors hover:border-[#C9D5E8] hover:text-[#1D1D1F] disabled:opacity-60"
            >
              {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              退出登录
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#3157D5]">Account</p>
          <h1 className="mt-2 text-3xl font-bold text-[#101D38]">我的 FutureLens</h1>
          <p className="mt-3 text-sm leading-7 text-[#66758E]">
            这里记录你的身份、背景和已经推进过的问题。
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-[#E0E7F3] bg-white p-6 shadow-[0_14px_36px_rgba(43,68,116,0.07)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#3157D5]">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-[#172540]">我的身份</h2>
                <p className="text-xs text-[#8A96A9]">你的公开身份编号</p>
              </div>
            </div>
            <dl className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#7A879C]">昵称</dt>
                <dd className="font-medium text-[#172540]">{displayValue(user.nickname)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#7A879C]">UID</dt>
                <dd className="font-mono text-lg font-bold tracking-[0.08em] text-[#3157D5]">
                  {displayValue(user.publicUid)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#7A879C]">当前状态</dt>
                <dd className="text-right">
                  <span className="rounded-full bg-[#EAF7EF] px-3 py-1 text-xs font-semibold text-[#247A47]">
                    {user.role === 'admin' ? '管理员' : '内测用户'}
                  </span>
                  {user.role !== 'admin' && (
                    <p className="mt-2 text-xs text-[#8A96A9]">参与 FutureLens 早期测试的账号。</p>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-[#E0E7F3] bg-white p-6 shadow-[0_14px_36px_rgba(43,68,116,0.07)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF7EF] text-[#247A47]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-[#172540]">我的背景</h2>
                <p className="text-xs text-[#8A96A9]">用于理解你的问题处境</p>
              </div>
            </div>
            <div className="grid gap-4 text-sm sm:grid-cols-3">
              <div className="rounded-xl bg-[#F7F9FD] p-4">
                <p className="text-xs text-[#8A96A9]">专业 / 职业</p>
                <p className="mt-2 font-medium text-[#172540]">{displayValue(profile?.majorOrCareer)}</p>
              </div>
              <div className="rounded-xl bg-[#F7F9FD] p-4">
                <p className="text-xs text-[#8A96A9]">当前目标</p>
                <p className="mt-2 font-medium text-[#172540]">
                  {displayValue(profile?.currentGoal || profile?.desiredOutcome)}
                </p>
              </div>
              <div className="rounded-xl bg-[#F7F9FD] p-4">
                <p className="text-xs text-[#8A96A9]">常见卡点</p>
                <p className="mt-2 font-medium text-[#172540]">
                  {displayValue(profile?.currentAnxiety || profile?.currentSituation)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-2xl border border-[#E0E7F3] bg-white p-6 shadow-[0_14px_36px_rgba(43,68,116,0.07)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-[#172540]">当前问题</h2>
                <p className="mt-1 text-xs text-[#8A96A9]">最近一次开始的问题</p>
              </div>
              <Clock3 className="h-5 w-5 text-[#8A96A9]" />
            </div>
            {latestProblem ? (
              <p className="rounded-xl bg-[#F7F9FD] p-4 text-sm leading-7 text-[#33425D]">
                {latestProblem.originalInput}
              </p>
            ) : (
              <p className="rounded-xl bg-[#F7F9FD] p-4 text-sm text-[#8A96A9]">
                你还没有开始一个问题。
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[#E0E7F3] bg-white p-6 shadow-[0_14px_36px_rgba(43,68,116,0.07)]">
            <h2 className="font-semibold text-[#172540]">历史问题</h2>
            <div className="mt-5 space-y-3">
              {problems.length > 0 ? (
                problems.slice(0, 4).map((problem) => (
                  <div key={problem.id} className="rounded-xl bg-[#F7F9FD] p-3">
                    <p className="line-clamp-2 text-sm leading-6 text-[#33425D]">
                      {problem.originalInput}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-[#F7F9FD] p-4 text-sm text-[#8A96A9]">
                  你开始过的问题会出现在这里。
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-[#D7E2F4] bg-white p-6 shadow-[0_18px_46px_rgba(43,68,116,0.08)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#3157D5]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-[#172540]">继续开始</h2>
              <p className="text-xs text-[#8A96A9]">从一个真实问题进入下一步</p>
            </div>
          </div>

          <form onSubmit={handleStartProblem} className="gap-3 sm:flex">
            <input
              value={newProblem}
              onChange={(event) => setNewProblem(event.target.value)}
              placeholder="今天你又卡在哪里？"
              className="h-12 min-w-0 flex-1 rounded-xl border border-[#DDE4F0] bg-white px-4 text-sm outline-none transition placeholder:text-[#A8B1C0] focus:border-[#3157D5] focus:ring-4 focus:ring-[#3157D5]/10"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newProblem.trim()}
              className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3157D5] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2748B8] disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              生成下一步
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
