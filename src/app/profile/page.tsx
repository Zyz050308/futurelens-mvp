'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MessageCircle,
  Package,
  Sparkles,
  Target,
} from 'lucide-react';
import { loadProfile, saveProfile } from '@/lib/radar';
import { analyzeUserState } from '@/lib/stateEngine';
import type { FutureProfile, UserStateProfile } from '@/types/radar';

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

const PROFILE_DRAFT_KEY = 'futurelens-profile-draft';
const SELECTED_ACCOUNT_PROBLEM_KEY = 'futurelens-selected-account-problem';

async function fetchRemoteProfile(): Promise<FutureProfile | null> {
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to load profile');
    }

    const result = await response.json();
    return result.profile || null;
  } catch (error) {
    console.error('[Profile] Failed to fetch remote profile:', error);
    return null;
  }
}

function normalizeProfile(profile?: Partial<FutureProfile> | null): FutureProfile {
  return {
    ...EMPTY_PROFILE,
    ...(profile || {}),
  };
}

function mergeNonEmptyProfile(base: FutureProfile, overlay?: Partial<FutureProfile> | null): FutureProfile {
  if (!overlay) {
    return base;
  }

  const merged = { ...base };
  (Object.keys(EMPTY_PROFILE) as Array<keyof FutureProfile>).forEach((key) => {
    const value = overlay[key];
    if (typeof value === 'string' && value.trim()) {
      merged[key] = value;
    }
  });
  return merged;
}

function getFilledFields(profile: FutureProfile): string[] {
  const filled: string[] = [];

  if (profile.currentSituation?.trim()) filled.push('你现在卡住的事');
  if (profile.desiredOutcome?.trim()) filled.push('你想得到什么');
  if (profile.currentGoal?.trim()) filled.push('补充说明');
  if (profile.currentSkills?.trim()) filled.push('已有材料');
  if (profile.majorOrCareer?.trim()) filled.push('专业/职业');
  if (profile.age?.trim()) filled.push('年龄');
  if (profile.education?.trim()) filled.push('学历');
  if (profile.currentAnxiety?.trim()) filled.push('担心点');
  if (profile.weeklyTime?.trim()) filled.push('每周时间');
  if (profile.riskPreference?.trim()) filled.push('风险偏好');

  return filled;
}

function getUserState(profile: FutureProfile): UserStateProfile | null {
  if (getFilledFields(profile).length < 3) {
    return null;
  }

  return analyzeUserState(profile);
}

type SectionCardProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  emphasis?: boolean;
};

function SectionCard({ icon, title, subtitle, children, emphasis }: SectionCardProps) {
  return (
    <section
      className={`rounded-[28px] border bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)] ${
        emphasis ? 'border-[#007AFF]/18 p-6' : 'border-[#E6EBF2] p-5'
      }`}
    >
      <div className="mb-5 flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            emphasis ? 'bg-[#007AFF]/12 text-[#007AFF]' : 'bg-[#F1F6FF] text-[#2563EB]'
          }`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-[#111827]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-6 text-[#6B7280]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

type FieldShellProps = {
  label: string;
  helper?: string;
  children: ReactNode;
};

function FieldShell({ label, helper, children }: FieldShellProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#1F2937]">{label}</span>
      {helper && <span className="ml-2 text-xs text-[#9CA3AF]">{helper}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

type ProblemPreviewProps = {
  profile: FutureProfile;
  userState: UserStateProfile | null;
  isSubmitting: boolean;
  onGenerate: () => void;
};

function ProblemPreview({ profile, userState, isSubmitting, onGenerate }: ProblemPreviewProps) {
  const hasCurrentProblem = Boolean(profile.currentSituation?.trim());
  const checkpoints = [
    { label: hasCurrentProblem ? '已知道：你现在卡住的事' : '需要先写：你现在卡住的事', active: hasCurrentProblem },
    { label: '可补充：你想得到什么', active: Boolean(profile.desiredOutcome || profile.currentGoal?.trim()) },
    { label: '可补充：你已有的材料', active: Boolean(profile.currentSkills?.trim()) },
  ];

  return (
    <aside className="rounded-[30px] border border-[#E4EAF3] bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#007AFF]/12 text-[#007AFF]">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#111827]">
            {hasCurrentProblem ? '正在理解你的问题' : '等待你的问题'}
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#8A94A6]">
            {hasCurrentProblem
              ? 'FutureLens 会根据你补充的背景，生成更具体的下一步。'
              : '先写下你现在卡住的事。'}
          </p>
        </div>
      </div>

      {hasCurrentProblem && (
        <div className="mb-5 rounded-2xl bg-[#F7FAFF] p-4">
          <p className="line-clamp-4 text-sm leading-6 text-[#1F2937]">{profile.currentSituation}</p>
        </div>
      )}

      <div className="space-y-2.5">
        {checkpoints.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ${
              item.active ? 'bg-[#EAFBF0] text-[#15803D]' : 'bg-[#F7F8FA] text-[#7B8494]'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {userState && (
        <div className="mt-5 rounded-2xl border border-[#E8EEF7] bg-[#FBFCFF] p-4">
          <p className="text-xs font-semibold text-[#007AFF]">当前理解</p>
          <p className="mt-2 text-sm leading-6 text-[#4B5563]">
            {hasCurrentProblem ? '已经可以生成。补充越多，下一步会越具体。' : '先写下你现在卡住的事。'}
          </p>
        </div>
      )}

      <p className="mt-5 text-xs leading-5 text-[#8A94A6]">
        没填完也可以生成，补充越多结果越准。
      </p>

      <button
        type="button"
        onClick={onGenerate}
        disabled={isSubmitting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0B1220] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        生成我的下一步
      </button>
    </aside>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<FutureProfile>(EMPTY_PROFILE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitStage, setSubmitStage] = useState<string | null>(null);
  const [userState, setUserState] = useState<UserStateProfile | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrateProfile = async () => {
      let draftProfile: FutureProfile | null = null;
      try {
        const draft = localStorage.getItem(PROFILE_DRAFT_KEY);
        if (draft) {
          draftProfile = normalizeProfile(JSON.parse(draft) as FutureProfile);
        }
      } catch {
        localStorage.removeItem(PROFILE_DRAFT_KEY);
      }

      const localProfile = normalizeProfile(loadProfile());
      const remoteProfile = normalizeProfile(await fetchRemoteProfile());
      let hydratedProfile = remoteProfile;

      hydratedProfile = mergeNonEmptyProfile(hydratedProfile, localProfile);
      hydratedProfile = mergeNonEmptyProfile(hydratedProfile, draftProfile);

      try {
        const selectedProblem = sessionStorage.getItem(SELECTED_ACCOUNT_PROBLEM_KEY);
        if (selectedProblem?.trim()) {
          hydratedProfile = {
            ...hydratedProfile,
            currentSituation: selectedProblem.trim(),
          };
          sessionStorage.removeItem(SELECTED_ACCOUNT_PROBLEM_KEY);
        }
      } catch {
        // sessionStorage can be unavailable in unusual browser modes.
      }

      if (!isMounted || getFilledFields(hydratedProfile).length === 0) {
        return;
      }

      setProfile(hydratedProfile);
      saveProfile(hydratedProfile);
      setUserState(getUserState(hydratedProfile));
    };

    hydrateProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setUserState(getUserState(profile));
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [profile]);

  const handleChange = (field: keyof FutureProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitStage('正在确认登录状态...');

    try {
      localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(profile));
      saveProfile(profile);

      const authResponse = await fetch('/api/auth/me', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });
      const authResult = await authResponse.json().catch(() => null);

      if (!authResponse.ok) {
        throw new Error(authResult?.error || '无法确认登录状态，请稍后重试');
      }

      if (!authResult?.user) {
        setIsSubmitting(false);
        setSubmitStage(null);
        router.push('/login?from=/profile');
        return;
      }

      setSubmitStage('正在保存问题背景...');
      const response = await fetch('/api/profile', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });
      const result = await response.json().catch(() => null);

      if (response.status === 401) {
        setIsSubmitting(false);
        setSubmitStage(null);
        router.push('/login?from=/profile');
        return;
      }

      if (!response.ok || !result?.success || !result.profile) {
        throw new Error(result?.error || 'Profile 保存失败，请稍后重试');
      }

      saveProfile(result.profile);

      const currentProblem = result.profile.currentSituation?.trim();
      if (currentProblem) {
        try {
          const accountResponse = await fetch('/api/account', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ problem: currentProblem }),
          });
          const accountResult = await accountResponse.json().catch(() => null);

          if (!accountResponse.ok || !accountResult?.success) {
            console.warn(
              '[Profile] Failed to sync current problem:',
              accountResult?.error || accountResponse.statusText
            );
          }
        } catch (syncError) {
          console.warn('[Profile] Failed to sync current problem:', syncError);
        }
      }

      localStorage.removeItem(PROFILE_DRAFT_KEY);
      localStorage.removeItem('futurelens-latest-radar');
      localStorage.removeItem('futurelens-latest-radar-created-at');
      localStorage.removeItem('futurelens-latest-radar-profile-hash');
      localStorage.removeItem('futurelens-latest-user-state');

      setSubmitStage('保存成功，正在生成下一步...');
      router.push('/radar');
    } catch (error) {
      console.error('[Profile] Failed to save profile:', error);
      setSubmitStage(null);
      setSubmitError(error instanceof Error ? error.message : 'Profile 保存失败，请稍后重试');
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-[#DDE4F0] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#A7B0BE] focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10';
  const textareaClass = `${inputClass} resize-none leading-6`;
  const selectClass = `${inputClass} cursor-pointer appearance-none`;

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <header className="sticky top-0 z-20 border-b border-[#E5EAF2] bg-[#F5F7FB]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-[#007AFF]">
            <ChevronRight className="h-5 w-5 rotate-180" />
            <span>返回</span>
          </Link>
          <span className="text-sm font-semibold text-[#111827] sm:text-base">补充你的问题背景</span>
          <div className="w-14" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold text-[#007AFF]">问题背景补充</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#111827] sm:text-4xl">
            补充你的问题背景
          </h1>
          <p className="mt-3 text-base leading-7 text-[#6B7280]">
            你可以直接生成，也可以补充一点背景，让 FutureLens 更准。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <SectionCard
              emphasis
              icon={<MessageCircle className="h-5 w-5" />}
              title="你现在卡住的事是什么？"
              subtitle="这是 FutureLens 理解你的入口，先写这一项就可以开始。"
            >
              <textarea
                value={profile.currentSituation}
                onChange={(event) => handleChange('currentSituation', event.target.value)}
                placeholder="说清楚：你想完成什么，现在卡在哪一步。不需要写完整材料。"
                rows={6}
                className="w-full resize-none rounded-[22px] border border-[#DDE4F0] bg-[#FBFCFF] px-5 py-4 text-base leading-7 text-[#111827] outline-none transition placeholder:text-[#A7B0BE] focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10"
              />
            </SectionCard>

            <SectionCard
              icon={<Target className="h-5 w-5" />}
              title="推荐补充"
              subtitle="这些信息最能帮助 FutureLens 判断今天先做什么。"
            >
              <div className="grid gap-4">
                <FieldShell label="你想得到什么">
                  <select
                    value={profile.desiredOutcome}
                    onChange={(event) => handleChange('desiredOutcome', event.target.value)}
                    className={selectClass}
                  >
                    <option value="">可以先不选</option>
                    <option value="一版可复制的方案">一版可复制的方案</option>
                    <option value="模板 / 表格 / 清单">模板 / 表格 / 清单</option>
                    <option value="流程 / SOP">流程 / SOP</option>
                    <option value="文案 / 脚本">文案 / 脚本</option>
                    <option value="先判断该做什么">先判断该做什么</option>
                  </select>
                </FieldShell>

                <FieldShell label="补充说明" helper="你希望这次推进到哪里">
                  <textarea
                    value={profile.currentGoal}
                    onChange={(event) => handleChange('currentGoal', event.target.value)}
                    placeholder="补充目标、对象、时间、风格、限制，或者你希望这次推进到哪一步。不确定也可以空着。"
                    rows={3}
                    className={textareaClass}
                  />
                </FieldShell>

                <FieldShell label="已有材料" helper="先描述，不需要上传文件">
                  <textarea
                    value={profile.currentSkills}
                    onChange={(event) => handleChange('currentSkills', event.target.value)}
                    placeholder="说明你已有的材料类型：文字、表格、图片、参考案例、数据、草稿。没有也可以空着。"
                    rows={3}
                    className={textareaClass}
                  />
                </FieldShell>
              </div>
            </SectionCard>

            <SectionCard
              icon={<AlertTriangle className="h-5 w-5" />}
              title="更多背景，可选"
              subtitle="不确定也可以跳过，这些只会帮助系统调整任务大小和推进方式。"
            >
              <div className="grid gap-4">
                <FieldShell label="担心点">
                  <textarea
                    value={profile.currentAnxiety}
                    onChange={(event) => handleChange('currentAnxiety', event.target.value)}
                    placeholder="说明你最担心的阻碍：不够具体、不够专业、时间不够、信息不全、结果不能直接用。"
                    rows={3}
                    className={textareaClass}
                  />
                </FieldShell>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldShell label="每周时间">
                    <select
                      value={profile.weeklyTime}
                      onChange={(event) => handleChange('weeklyTime', event.target.value)}
                      className={selectClass}
                    >
                      <option value="">可以先不选</option>
                      <option value="5小时以下">5小时以下</option>
                      <option value="5-10小时">5-10小时</option>
                      <option value="10-15小时">10-15小时</option>
                      <option value="15-20小时">15-20小时</option>
                      <option value="20小时以上">20小时以上</option>
                    </select>
                  </FieldShell>

                  <FieldShell label="风险偏好">
                    <select
                      value={profile.riskPreference}
                      onChange={(event) => handleChange('riskPreference', event.target.value)}
                      className={selectClass}
                    >
                      <option value="">可以先不选</option>
                      <option value="稳妥">稳妥：先要确定性</option>
                      <option value="适中">适中：能接受小步尝试</option>
                      <option value="激进">激进：愿意快速试错</option>
                    </select>
                  </FieldShell>
                </div>
              </div>
            </SectionCard>

            <div className="pb-8 pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#111827] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_45px_rgba(17,24,39,0.18)] transition hover:bg-[#0B1220] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    正在生成我的下一步...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    生成我的下一步
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              {submitError && <p className="mt-3 text-center text-sm text-[#FF3B30]">{submitError}</p>}
              {submitStage && !submitError && <p className="mt-3 text-center text-sm text-[#007AFF]">{submitStage}</p>}
              <p className="mt-3 text-center text-xs text-[#8A94A6]">
                没填完也可以生成，补充越多结果越准。
              </p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <ProblemPreview
                profile={profile}
                userState={userState}
                isSubmitting={isSubmitting}
                onGenerate={handleSubmit}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
