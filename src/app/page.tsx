'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  History,
  Lightbulb,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { FutureProfile } from '@/types/radar';

const PROFILE_DRAFT_KEY = 'futurelens-profile-draft';

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

const capabilities = [
  {
    icon: BrainCircuit,
    title: '看清卡点',
    description: '把你说出的困惑拆开，找到现在真正卡住你的地方。',
    color: 'bg-[#EAF0FF] text-[#3157D5]',
  },
  {
    icon: Target,
    title: '告诉你先做什么',
    description: '不急着给长期答案，先给出今天能开始的一步。',
    color: 'bg-[#E6F7F5] text-[#087B76]',
  },
  {
    icon: TrendingUp,
    title: '准备能用的材料',
    description: '把建议变成检查清单、修改建议、参考模板等可直接使用的内容。',
    color: 'bg-[#FFF3DE] text-[#A66100]',
  },
  {
    icon: History,
    title: '做完再调整',
    description: '记录做完后的结果，FutureLens 会继续帮你调整下一步。',
    color: 'bg-[#E8F7ED] text-[#247A47]',
  },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${compact ? 'h-11 w-10' : 'h-12 w-11'}`}>
      <Image
        src="/futurelens-mark-original.png"
        alt=""
        width={220}
        height={260}
        className="h-full w-full object-contain"
        priority
      />
    </span>
  );
}

function ProductPreview() {
  return (
    <div id="product-preview" className="relative isolate mx-auto max-w-6xl scroll-mt-20 px-0 lg:px-10">
      <div className="absolute inset-x-[12%] -bottom-10 top-16 -z-20 rounded-[40px] bg-[#AFC5FA]/30 blur-3xl" />

      <div className="absolute -left-3 top-24 z-0 hidden w-52 rounded-lg bg-white/90 p-4 shadow-[0_18px_45px_rgba(49,76,137,0.12),0_0_0_1px_rgba(200,211,233,0.55)] backdrop-blur md:block lg:left-0">
        <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold text-[#52627D]">
          <TrendingUp className="h-3.5 w-3.5 text-[#3157D5]" />
          可用材料
        </div>
        <div className="space-y-3">
          <div className="h-2 w-4/5 rounded-full bg-[#DCE6FA]" />
          <div className="h-2 w-full rounded-full bg-[#EDF2FA]" />
          <div className="h-2 w-3/5 rounded-full bg-[#EDF2FA]" />
        </div>
        <div className="mt-5 flex items-end gap-1" aria-hidden="true">
          {[18, 24, 21, 30, 27, 38, 44].map((height, index) => (
            <span key={index} className="flex-1 rounded-sm bg-[#DDE7FF]" style={{ height }} />
          ))}
        </div>
      </div>

      <div className="absolute -right-3 bottom-20 z-10 hidden w-56 rounded-lg bg-white/95 p-4 shadow-[0_20px_50px_rgba(49,76,137,0.14),0_0_0_1px_rgba(200,211,233,0.5)] backdrop-blur md:block lg:right-0">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-[#52627D]">
          <Lightbulb className="h-3.5 w-3.5 text-[#D99A27]" />
          记录结果
        </div>
        <p className="text-xs leading-5 text-[#56657D]">
          做完后记录哪里还卡。
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#35A866]">
          <Check className="h-3 w-3" />
          下一步已准备
        </div>
      </div>

      <div className="relative z-10 overflow-hidden rounded-lg bg-white shadow-[0_30px_90px_rgba(45,72,132,0.16),0_0_0_1px_rgba(190,204,231,0.55)]">
        <div className="flex items-center justify-between border-b border-[#EEF2F8] bg-white px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <BrandMark compact />
            <div>
              <p className="text-sm font-semibold text-[#172540]">你的 FutureLens</p>
              <p className="text-[11px] text-[#8290A7]">从一个真实问题开始</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[#EAF7EF] px-3 py-1.5 text-xs font-medium text-[#247A47] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#35A866]" />
            可以开始
          </div>
        </div>

        <div className="bg-[linear-gradient(145deg,#F8FAFE_0%,#F3F7FD_100%)] p-4 sm:p-6 lg:p-7">
          <div className="grid gap-4 lg:grid-cols-[1.38fr_0.72fr]">
            <div className="space-y-4">
              <section className="rounded-lg bg-white p-5 shadow-[0_8px_24px_rgba(43,69,124,0.06)] sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#3157D5]">
                    <BrainCircuit className="h-4 w-4" />
                    你的问题
                  </div>
                  <span className="rounded-full bg-[#F0F4FC] px-2.5 py-1 text-[10px] font-medium text-[#75839A]">
                    已拆开
                  </span>
                </div>
                <p className="max-w-2xl text-lg font-semibold leading-8 text-[#172540] sm:text-xl">
                  你不是不知道要努力，而是不知道今天先改哪一部分。
                </p>
                <p className="mt-3 text-xs leading-5 text-[#7A879C]">
                  先把问题缩小到今天能处理的一件事。
                </p>
              </section>

              <div className="grid gap-4 sm:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-lg bg-[linear-gradient(145deg,#EDF3FF_0%,#F7F9FF_100%)] p-5 shadow-[0_8px_24px_rgba(43,69,124,0.05)]">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#3157D5]">
                    <CircleDot className="h-4 w-4 text-[#5374D8]" />
                    今天先做
                  </div>
                  <p className="text-sm font-semibold leading-6 text-[#263755]">
                    先改一段最关键的内容，不要一次改完整份。
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs text-[#7585A1]">
                    <Clock3 className="h-3.5 w-3.5" />
                    预计 30 分钟
                  </div>
                </section>

                <section className="rounded-lg bg-white p-5 shadow-[0_8px_24px_rgba(43,69,124,0.06)]">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#172540]">
                    <Target className="h-4 w-4 text-[#3157D5]" />
                    可用材料
                  </div>
                  <p className="text-sm leading-6 text-[#43516A]">
                    检查清单、修改建议、参考版本。
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-[#8793A8]">可以直接使用</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDF2FF] text-[#3157D5]">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </section>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <section className="rounded-lg bg-white p-5 shadow-[0_8px_24px_rgba(43,69,124,0.06)]">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-[#172540]">
                  <TrendingUp className="h-4 w-4 text-[#3157D5]" />
                  继续调整
                </div>
                <p className="text-sm font-medium leading-6 text-[#33425D]">
                  做完后记录哪里还卡，下一步继续缩小范围。
                </p>
                <div className="mt-4 flex items-end gap-1.5" aria-hidden="true">
                  {[32, 42, 37, 54, 49, 68, 78].map((height, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-sm bg-[#DDE7FF]"
                      style={{ height: `${height / 2}px` }}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-lg bg-white p-5 shadow-[0_8px_24px_rgba(43,69,124,0.06)]">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-[#172540]">
                  <Lightbulb className="h-4 w-4 text-[#D99A27]" />
                  最近结果
                </div>
                <p className="text-sm font-medium leading-6 text-[#43516A]">
                  写下实际发生了什么，下一步会更贴近现实。
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-[#8190A6]">
                  <Sparkles className="h-3.5 w-3.5 text-[#6D8BE4]" />
                  结果会用于下一次建议
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [concern, setConcern] = useState('');

  useEffect(() => {
    let isMounted = true;

    try {
      const storedDraft = localStorage.getItem(PROFILE_DRAFT_KEY);
      if (storedDraft) {
        const draft = JSON.parse(storedDraft) as Partial<FutureProfile>;
        setConcern(draft.currentSituation || '');
      }
    } catch {
      localStorage.removeItem(PROFILE_DRAFT_KEY);
    }

    const loadCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });
        const result = await response.json();

        if (isMounted && response.ok) {
          setUserEmail(result.user?.email || null);
        }
      } catch {
        // The homepage remains usable when authentication is unavailable.
      }
    };

    loadCurrentUser();
    window.addEventListener('pageshow', loadCurrentUser);
    window.addEventListener('focus', loadCurrentUser);

    return () => {
      isMounted = false;
      window.removeEventListener('pageshow', loadCurrentUser);
      window.removeEventListener('focus', loadCurrentUser);
    };
  }, []);

  const handleStartAnalysis = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let existingDraft: Partial<FutureProfile> = {};
    try {
      existingDraft = JSON.parse(localStorage.getItem(PROFILE_DRAFT_KEY) || '{}') as Partial<FutureProfile>;
    } catch {
      existingDraft = {};
    }

    const draft: FutureProfile = {
      ...EMPTY_PROFILE,
      ...existingDraft,
      currentSituation: concern.trim(),
    };

    localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(draft));
    if (concern.trim()) {
      sessionStorage.setItem('futurelens-pending-problem', concern.trim());
    }

    if (!userEmail) {
      router.push('/register?from=/profile');
      return;
    }

    if (concern.trim()) {
      try {
        await fetch('/api/account', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ problem: concern.trim() }),
        });
      } catch {
        // The local profile draft is enough to keep the existing Radar flow usable.
      }
    }

    router.push('/profile');
  };

  return (
    <div className="min-h-screen bg-white text-[#14213D]">
      <header className="sticky top-0 z-40 border-b border-[#E8EDF6] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto grid h-[68px] max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8">
          <Link href="/" className="flex items-center justify-self-start gap-3" aria-label="FutureLens 首页">
            <BrandMark compact />
            <span className="text-[19px] font-semibold tracking-[0.015em] text-[#152238]">FutureLens</span>
          </Link>

          <nav className="hidden items-center gap-10 justify-self-center text-sm text-[#58677F] md:flex lg:gap-11">
            <a href="#product-preview" className="transition-colors hover:text-[#3157D5]">产品预览</a>
            <a href="#capabilities" className="transition-colors hover:text-[#3157D5]">能做什么</a>
            <a href="#how-it-works" className="transition-colors hover:text-[#3157D5]">怎么使用</a>
            <Link href="/beta" className="transition-colors hover:text-[#3157D5]">加入内测</Link>
          </nav>

          <div className="flex items-center justify-end">
            <Link
              href={userEmail ? '/account' : '/login'}
              className="max-w-[156px] truncate rounded-md bg-[#3157D5] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2748B8]"
              title={userEmail || '登录'}
            >
              {userEmail || '登录'}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#EDF1F7] bg-[linear-gradient(180deg,#FFFFFF_0%,#F3F7FF_48%,#FAFCFF_82%,#FFFFFF_100%)]">
          <div className="pointer-events-none absolute left-1/2 top-14 h-[440px] w-[960px] -translate-x-1/2 rounded-full bg-[#DDE8FF]/68 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-18 sm:px-8 sm:pt-22 lg:pb-32 lg:pt-24">
            <div className="mx-auto max-w-5xl text-center">
              <h1 className="text-[34px] font-bold leading-[1.12] text-[#101D38] sm:text-5xl lg:text-[56px]">
                说出问题，拿到下一步
              </h1>

              <p className="mx-auto mt-5 max-w-3xl text-sm leading-6 text-[#61708A] sm:text-base sm:leading-7">
                把卡住的事告诉 FutureLens。它会帮你拆开问题，
                <span className="hidden sm:inline">准备能用的材料，并告诉你今天先做什么。</span>
                <span className="sm:hidden">准备材料，并告诉你今天先做什么。</span>
              </p>

              <form
                onSubmit={handleStartAnalysis}
                className="mx-auto mt-8 max-w-[740px] rounded-lg bg-white/95 p-2 shadow-[0_20px_55px_rgba(49,78,145,0.14),0_0_0_1px_rgba(173,190,224,0.52)] backdrop-blur transition-shadow focus-within:shadow-[0_22px_64px_rgba(49,78,145,0.19),0_0_0_2px_rgba(49,87,213,0.18)] sm:flex sm:items-center"
              >
                <label className="flex min-w-0 flex-1 items-center gap-3 px-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#EEF3FF] text-[#5877CF]">
                    <Search className="h-4 w-4" />
                  </span>
                  <span className="sr-only">说出你现在卡住的一件事</span>
                  <input
                    value={concern}
                    onChange={(event) => setConcern(event.target.value)}
                    placeholder="例如：我有一份材料，不知道怎么改"
                    className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-[#172540] outline-none placeholder:text-slate-300"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-md bg-[#3157D5] px-6 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(49,87,213,0.22)] transition-[background-color,transform] hover:bg-[#2748B8] active:translate-y-px sm:w-auto"
                >
                  开始
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-2 text-[11px] text-[#A8B1C0]">
                也可以是：汇报、作品集、学习计划、工作流程
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#7B879B]">
                <a
                  href="#product-preview"
                  className="inline-flex items-center gap-1 font-medium text-[#3157D5] hover:text-[#2748B8]"
                >
                  查看产品示例
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
                <span className="h-3 w-px bg-[#CFD7E5]" />
                <span className="text-[#7B879B]">
                  从真实问题开始 · 给出今天先做什么 · 做完后继续调整
                </span>
              </div>
            </div>

            <div className="mt-16 sm:mt-20 lg:mt-22">
              <ProductPreview />
            </div>
          </div>
        </section>

        <section id="capabilities" className="scroll-mt-20 bg-white pb-12 pt-16 sm:pb-14 sm:pt-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="mb-3 text-xs font-semibold text-[#3157D5]">FUTURELENS 能做什么</p>
              <h2 className="text-3xl font-semibold text-[#14213D] sm:text-4xl">
                把问题变成今天能做的事
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#6E7C93] sm:text-base">
                不只给一段建议，而是帮你拆开问题、准备材料、开始第一步。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {capabilities.map(({ icon: Icon, title, description, color }, index) => (
                <article
                  key={title}
                  className="group relative min-h-[232px] overflow-hidden rounded-lg border border-[#E2E8F3] bg-[linear-gradient(160deg,#FFFFFF_0%,#FAFCFF_100%)] p-6 shadow-[0_12px_34px_rgba(43,68,116,0.07)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-[#C7D4EC] hover:shadow-[0_18px_42px_rgba(43,68,116,0.11)]"
                >
                  <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,#7C9AE8,transparent)] opacity-70" />
                  <div className="mb-7 flex items-start justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-md ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#A4AFC0]">0{index + 1}</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#172540]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6E7C93]">{description}</p>
                  <div className="absolute bottom-0 left-0 h-14 w-14 rounded-tr-full bg-[#F2F6FF] opacity-0 transition-opacity group-hover:opacity-100" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 bg-[#F6F8FC] py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-xs font-semibold text-[#3157D5]">怎么使用</p>
              <h2 className="text-3xl font-semibold leading-tight text-[#14213D]">
                三步拿到下一步
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#6E7C93]">
                从一个真实问题开始，先拿到今天能做的事，再根据结果继续调整。
              </p>
            </div>

            <div className="mt-12 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-0">
              {[
                ['01', '说出你的问题', '把现在卡住的一件事写下来，不需要组织成完美描述。'],
                ['02', '拿到材料和步骤', 'FutureLens 会准备可用材料，并告诉你今天先做什么。'],
                ['03', '做完后继续调整', '记录实际结果，下一步会根据你的反馈继续变化。'],
              ].map(([number, label, description], index) => (
                <div key={label} className="contents">
                  <div className="relative min-h-[184px] flex-1 rounded-lg border border-[#E0E7F3] bg-white p-6 shadow-[0_12px_30px_rgba(43,68,116,0.06)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EDF2FF] text-xs font-semibold text-[#3157D5]">
                      {number}
                    </span>
                    <h3 className="mt-6 text-base font-semibold text-[#263650]">{label}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#738198]">{description}</p>
                  </div>
                  {index < 2 && (
                    <div className="flex h-8 items-center justify-center text-[#8FA5D8] sm:h-auto sm:w-12">
                      <ArrowRight className="h-5 w-5 rotate-90 sm:rotate-0" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-[#E7ECF5] bg-white py-7">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 text-xs text-[#748198] sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <BrandMark compact />
            <span className="font-medium text-[#40506B]">FutureLens</span>
          </div>
          <span>说出你的问题，拿到下一步</span>
        </div>
      </footer>
    </div>
  );
}
