'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Target, Radar, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { hasProfile } from '@/lib/radar';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="ios-secondary-card p-5 transition-all duration-200 hover:-translate-y-0.5">
      <div className="w-10 h-10 rounded-2xl bg-[#F9FAFB] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-[#007AFF]" />
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [hasExistingRadar, setHasExistingRadar] = useState(false);

  useEffect(() => {
    setHasExistingProfile(hasProfile());
    const radarData = localStorage.getItem('futurelens-latest-radar');
    setHasExistingRadar(!!radarData);
  }, []);

  const handleContinue = () => {
    // 检查是否有 radar 缓存
    const radarData = localStorage.getItem('futurelens-latest-radar');
    if (radarData) {
      // 直接跳转到 radar 页面，展示缓存内容
      router.push('/radar');
    } else {
      // 没有 radar 数据，跳转到 profile 页面
      router.push('/profile');
    }
  };

  const handleCreate = () => {
    router.push('/profile');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Logo 和标题 */}
        <div className="flex items-center justify-center gap-3 mb-16">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#007AFF]/20 to-[#007AFF]/5 flex items-center justify-center border border-[#007AFF]/10">
            <Sparkles className="w-5 h-5 text-[#007AFF]" />
          </div>
          <span className="text-xl font-semibold tracking-tight">FutureLens</span>
        </div>

        {/* 主要文案 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">创建你的未来分身</h1>
          <p className="text-lg text-[#6B7280]">看见真正与你有关的机会</p>
        </div>

        <p className="text-center text-[#6B7280] mb-12 leading-relaxed max-w-md mx-auto">
          FutureLens 根据你的身份、能力、目标和焦虑，生成属于你的机会雷达。
        </p>

        {/* 操作按钮 */}
        <div className="flex flex-col items-center gap-3 mb-16">
          {hasExistingProfile && hasExistingRadar ? (
            <>
              <button
                onClick={handleContinue}
                className="ios-button-primary inline-flex items-center gap-2 px-8 py-3 text-base font-semibold w-full justify-center max-w-sm"
              >
                继续我的未来分身
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleCreate}
                className="ios-button-secondary inline-flex items-center gap-2 px-8 py-3 text-base font-medium w-full justify-center max-w-sm"
              >
                重新创建分身
              </button>
            </>
          ) : hasExistingProfile ? (
            <button
              onClick={handleContinue}
              className="ios-button-primary inline-flex items-center gap-2 px-8 py-3 text-base font-semibold w-full justify-center max-w-sm"
            >
              继续我的未来分身
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="ios-button-primary inline-flex items-center gap-2 px-8 py-3 text-base font-semibold w-full justify-center max-w-sm"
            >
              创建我的未来分身
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <p className="text-sm text-[#9CA3AF] mt-2">2 分钟 · 本地生成 · 无需注册</p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FeatureCard
            icon={Target}
            title="识别你的当前任务"
            description="根据你的目标和能力，找到最适合你现在开始的事情。"
          />
          <FeatureCard
            icon={Radar}
            title="发现与你相关的机会"
            description="从众多变化中筛选出真正与你的情况匹配的方向。"
          />
          <FeatureCard
            icon={CheckCircle}
            title="生成下一步行动"
            description="不是泛泛建议，而是具体的、可执行的下一步计划。"
          />
        </div>
      </div>
    </div>
  );
}
