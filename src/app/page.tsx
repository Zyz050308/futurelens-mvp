'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Compass, TrendingUp, Target, Zap, ChevronDown, ChevronRight } from 'lucide-react';
import { hasProfile } from '@/lib/radar';
import HeroQuestionsVisual from '@/components/HeroQuestionsVisual';

// ============================================================
// V6.7 首页：创建 FutureLens Person
// ============================================================

// 第二屏：理解卡片
interface UnderstandingCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  index: number;
}

function UnderstandingCard({ icon: Icon, title, description, index }: UnderstandingCardProps) {
  return (
    <div 
      className="ios-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-[#FF9500]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#1D1D1F] mb-2">{title}</h3>
          <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

// 第三屏：流程步骤
interface FlowStepProps {
  title?: string;
  isArrow?: boolean;
}

function FlowStep({ title, isArrow = false }: FlowStepProps) {
  if (isArrow) {
    return (
      <div className="flex items-center justify-center">
        <ChevronDown className="w-5 h-5 text-[#FF9500]/60" />
      </div>
    );
  }
  
  return (
    <div className="ios-card px-6 py-4 text-center">
      <span className="text-sm font-medium text-[#1D1D1F]">{title}</span>
    </div>
  );
}

export default function HomePage() {
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setHasExistingProfile(hasProfile());

    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });
        const result = await response.json();

        if (isMounted && response.ok) {
          const email = result.user?.email || null;
          setUserEmail(email);
          if (email) {
            setHasExistingProfile(true);
          }
        }
      } catch {
        // The homepage remains usable when authentication is unavailable.
      }
    };

    loadCurrentUser();
    const handlePageShow = () => loadCurrentUser();
    const handleFocus = () => loadCurrentUser();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCurrentUser();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* ============================================================ */}
      {/* 第一屏：Hero */}
      {/* ============================================================ */}
      <section className="min-h-screen flex items-center overflow-hidden relative">
        <div className="absolute top-5 right-6 z-20">
          <Link
            href={userEmail ? '/profile' : '/login'}
            className="text-sm text-[#6B7280] hover:text-[#1D1D1F] transition-colors max-w-[220px] truncate"
            title={userEmail || '登录'}
          >
            {userEmail || '登录'}
          </Link>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 左侧：文案 */}
            <div className="order-2 lg:order-1 relative z-10">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF9500]/20 to-[#FF9500]/5 flex items-center justify-center border border-[#FF9500]/10">
                  <Sparkles className="w-5 h-5 text-[#FF9500]" />
                </div>
                <span className="text-xl font-semibold tracking-tight text-[#1D1D1F]">FutureLens</span>
              </div>

              {/* 主标题 */}
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-[#1D1D1F] mb-6 leading-tight">
                创建一个逐渐理解你的
                <br />
                <span className="text-[#FF9500]">FutureLens Person</span>
              </h1>

              {/* 副标题 */}
              <p className="text-lg text-[#6B7280] mb-4 leading-relaxed">
                它会根据你的处境、目标和行动，持续帮你看见真正与你有关的变化。
              </p>

              {/* 说明文字 */}
              <p className="text-base text-[#9CA3AF] mb-8 leading-relaxed">
                不用一次说清全部未来。先告诉它你现在最纠结的一件事。
              </p>

              {/* 按钮 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/profile"
                  className="ios-button-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold"
                >
                  开始创建我的 FutureLens Person
                  <ArrowRight className="w-5 h-5" />
                </Link>
                
                {hasExistingProfile && (
                  <Link
                    href={userEmail ? '/radar' : '/login?from=/radar'}
                    className="ios-button-secondary inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium"
                  >
                    继续我的 FutureLens
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                )}
              </div>

              {/* 底部提示 */}
              <p className="text-xs text-[#9CA3AF] mt-6">
                2 分钟 · 本地生成 · 无需注册 · 数据不上传
              </p>
            </div>

            {/* 右侧：动效 */}
            <div className="order-1 lg:order-2 relative w-full lg:w-[55%] h-[300px] lg:min-h-[680px] overflow-hidden pointer-events-none">
              <HeroQuestionsVisual />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 第二屏：FutureLens Person 会如何理解你 */}
      {/* ============================================================ */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          {/* 标题 */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#1D1D1F] mb-4">
              FutureLens Person 会如何理解你？
            </h2>
            <p className="text-base text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
              它不是让你填写一份冰冷档案，而是从你的处境、目标和行动里，逐渐形成对你的理解。
            </p>
          </div>

          {/* 三张卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UnderstandingCard
              icon={Compass}
              title="你的当前处境"
              description="你最近在纠结什么？是考试、作品集、就业、转行，还是未来方向？"
              index={0}
            />
            <UnderstandingCard
              icon={TrendingUp}
              title="你的价值迁移"
              description="你现在依赖的能力，哪些正在升值，哪些正在贬值？"
              index={1}
            />
            <UnderstandingCard
              icon={Target}
              title="你的下一步行动"
              description="不是给你一份报告，而是告诉你今天先做什么。"
              index={2}
            />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 第三屏：FutureLens 是什么 */}
      {/* ============================================================ */}
      <section className="py-24 bg-[#F5F5F7]">
        <div className="max-w-4xl mx-auto px-6">
          {/* 标题 */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1D1D1F] mb-4">
              FutureLens 不是预测未来
            </h2>
            <p className="text-base text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
              它创建一个 FutureLens Person，持续理解你的状态，并从世界变化中筛出真正与你有关的机会。
            </p>
          </div>

          {/* 流程图 */}
          <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
            <FlowStep title="你的处境" />
            <FlowStep isArrow />
            <FlowStep title="FutureLens Person" />
            <FlowStep isArrow />
            <FlowStep title="世界变化" />
            <FlowStep isArrow />
            <FlowStep title="机会雷达" />
            <FlowStep isArrow />
            <FlowStep title="下一步行动" />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 底部 CTA */}
      {/* ============================================================ */}
      <section className="py-24 bg-gradient-to-b from-[#F5F5F7] to-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-[#1D1D1F] mb-6">
            先从一句真实的困惑开始。
          </h2>
          
          <Link
            href="/profile"
            className="ios-button-primary inline-flex items-center justify-center gap-2 px-10 py-5 text-lg font-semibold"
          >
            创建我的 FutureLens Person
            <Zap className="w-6 h-6" />
          </Link>

          <p className="text-xs text-[#9CA3AF] mt-6">
            不用填写复杂问卷。只需要告诉我你现在最纠结的一件事。
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Footer */}
      {/* ============================================================ */}
      <footer className="py-8 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF9500]" />
            <span className="text-sm text-[#6B7280]">FutureLens — 看见真正与你有关的变化</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
