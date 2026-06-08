'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, Loader2, ChevronRight, User, Package, Target, AlertTriangle, CheckCircle2, Clock, TrendingUp, Shield, Brain } from 'lucide-react';
import { saveProfile, loadProfile } from '@/lib/radar';
import { analyzeUserState } from '@/lib/stateEngine';
import type { FutureProfile, UserStateProfile } from '@/types/radar';
import FutureSelfAvatar from '@/components/FutureSelfAvatar';

const EMPTY_PROFILE: FutureProfile = {
  age: '',
  education: '',
  majorOrCareer: '',
  currentSkills: '',
  interests: '',
  currentGoal: '',
  currentAnxiety: '',
  desiredOutcome: '',
  weeklyTime: '',
  riskPreference: '',
};

// ============================================================
// 工具函数
// ============================================================

function getFilledFields(profile: FutureProfile): string[] {
  const filled: string[] = [];
  
  if (profile.majorOrCareer?.trim().length > 0) filled.push('职业背景');
  if (profile.age?.trim().length > 0) filled.push('年龄');
  if (profile.education?.trim().length > 0) filled.push('学历');
  if (profile.currentSkills?.trim().length > 0) filled.push('当前能力');
  if (profile.interests?.trim().length > 0) filled.push('兴趣方向');
  if (profile.desiredOutcome) filled.push('想获得什么');
  if (profile.currentGoal?.trim().length > 0) filled.push('当前目标');
  if (profile.currentAnxiety?.trim().length > 0) filled.push('当前焦虑');
  if (profile.weeklyTime) filled.push('每周时间');
  if (profile.riskPreference) filled.push('风险偏好');
  
  return filled;
}

function getMissingFields(profile: FutureProfile): string[] {
  const missing: string[] = [];
  
  if (!profile.majorOrCareer?.trim().length) missing.push('专业/职业');
  if (!profile.currentSkills?.trim().length) missing.push('当前能力');
  if (!profile.desiredOutcome) missing.push('想获得什么');
  if (!profile.currentGoal?.trim().length) missing.push('当前目标');
  if (!profile.currentAnxiety?.trim().length) missing.push('当前焦虑');
  if (!profile.weeklyTime) missing.push('每周时间');
  if (!profile.riskPreference) missing.push('风险偏好');
  
  return missing;
}

function determineIdentity(profile: FutureProfile): string {
  if (!profile.majorOrCareer) return '未识别';
  return profile.majorOrCareer;
}

function determineMainGoal(profile: FutureProfile): string {
  if (profile.desiredOutcome) return profile.desiredOutcome;
  if (profile.currentGoal) return profile.currentGoal;
  return '未识别';
}

function determineRiskTendency(riskPreference?: string): string {
  if (riskPreference === '稳妥') return '保守路线';
  if (riskPreference === '激进') return '试错路线';
  if (riskPreference === '适中') return '平衡路线';
  return '待确定';
}

function determineTimeConstraint(weeklyTime?: string): string {
  if (!weeklyTime) return '待确定';
  if (weeklyTime.includes('5小时以下')) return '碎片时间';
  if (weeklyTime.includes('5-10小时')) return '有限时间';
  if (weeklyTime.includes('10-15小时')) return '还行';
  if (weeklyTime.includes('15-20小时') || weeklyTime.includes('20小时以上')) return '时间充足';
  return '待确定';
}

// ============================================================
// 右侧 Future Self 预览组件
// ============================================================

interface FutureSelfPreviewProps {
  profile: FutureProfile;
  userState: UserStateProfile | null;
}

function FutureSelfPreview({ profile, userState }: FutureSelfPreviewProps) {
  const filledFields = getFilledFields(profile);
  const missingFields = getMissingFields(profile);
  const hasEnoughInfo = filledFields.length >= 3;
  
  const identity = determineIdentity(profile);
  const mainGoal = determineMainGoal(profile);
  const riskTendency = determineRiskTendency(profile.riskPreference);
  const timeConstraint = determineTimeConstraint(profile.weeklyTime);
  
  // 影响判断的标签
  const influenceTags = [
    { key: '职业背景', label: '职业影响变化信号', filled: !!profile.majorOrCareer },
    { key: '想获得什么', label: '目标影响行动方向', filled: !!profile.desiredOutcome },
    { key: '当前焦虑', label: '焦虑影响优先级', filled: !!profile.currentAnxiety },
    { key: '每周时间', label: '时间影响任务大小', filled: !!profile.weeklyTime },
    { key: '风险偏好', label: '风险偏好影响路径', filled: !!profile.riskPreference },
    { key: '当前能力', label: '能力影响起步难度', filled: !!profile.currentSkills },
  ];

  if (!hasEnoughInfo) {
    return (
      <div className="ios-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#007AFF]/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#007AFF]" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Future Self 还没有成型</h3>
          </div>
        </div>
        
        <p className="text-sm text-[#6B7280] mb-6">
          填写你的身份、目标和焦虑后，FutureLens 会开始判断你当前所处的状态。
        </p>
        
        <div className="bg-[#F9FAFB] rounded-xl p-4">
          <div className="text-xs text-[#9CA3AF] font-medium mb-3">正在等待</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <div className="w-1 h-1 rounded-full bg-[#FF9500]" />
              <span>专业/职业</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <div className="w-1 h-1 rounded-full bg-[#FF9500]" />
              <span>想获得什么</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <div className="w-1 h-1 rounded-full bg-[#FF9500]" />
              <span>当前焦虑</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 主卡片 */}
      <div className="ios-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#007AFF]/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#007AFF]" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Future Self 正在成型</h3>
            <p className="text-xs text-[#6B7280]">每填写一项，系统都会重新理解你的处境</p>
          </div>
        </div>

        {/* 当前识别 */}
        <div className="bg-gradient-to-r from-[#007AFF]/10 to-[#AF52DE]/10 rounded-xl p-4 mb-4">
          <div className="text-xs text-[#007AFF] font-semibold mb-3">当前识别</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B7280]">身份</span>
              <span className="text-sm font-medium text-[#1D1D1F]">{identity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B7280]">目标</span>
              <span className="text-sm font-medium text-[#1D1D1F]">{mainGoal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B7280]">状态</span>
              <span className="text-sm font-semibold text-[#007AFF]">
                {userState?.stateLabel || '分析中...'}
              </span>
            </div>
          </div>
        </div>

        {/* 这些信息正在影响判断 */}
        <div className="mb-4">
          <div className="text-xs text-[#9CA3AF] font-medium mb-3">这些信息正在影响判断</div>
          <div className="flex flex-wrap gap-2">
            {influenceTags.map((tag) => (
              <span
                key={tag.key}
                className={`text-xs px-2 py-1 rounded-full ${
                  tag.filled
                    ? 'bg-[#34C759]/10 text-[#34C759]'
                    : 'bg-[#F9FAFB] text-[#9CA3AF]'
                }`}
              >
                {tag.filled ? '✓' : '○'} {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* 系统判断 */}
        {userState && (
          <div className="bg-[#F9FAFB] rounded-xl p-4 mb-4">
            <div className="text-xs text-[#9CA3AF] font-medium mb-2">系统当前判断</div>
            <p className="text-sm text-[#6B7280] mb-3">
              {userState.oneSentenceDiagnosis}
            </p>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF9500] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#6B7280]">
                {userState.decisionPriority}
              </p>
            </div>
          </div>
        )}

        {/* 建议倾向 */}
        {userState && (
          <div className="bg-[#34C759]/5 border border-[#34C759]/20 rounded-xl p-3">
            <div className="text-xs text-[#34C759] font-semibold mb-1.5">建议倾向</div>
            <p className="text-sm text-[#6B7280]">
              {userState.recommendedStrategy}
            </p>
          </div>
        )}
      </div>

      {/* 还差什么 */}
      {missingFields.length > 0 && (
        <div className="ios-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#FF9500]" />
            <span className="text-xs font-semibold text-[#FF9500]">还差什么</span>
          </div>
          <div className="space-y-2">
            {missingFields.slice(0, 4).map((field, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-[#FF9500] mt-1.5 flex-shrink-0" />
                <span className="text-xs text-[#6B7280]">
                  还需要填写{field}，才能更精准判断
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="ios-card p-6 flex justify-center">
        <FutureSelfAvatar
          mode="full"
          identity={identity}
          futureRole={mainGoal !== '未识别' ? mainGoal : '寻找方向'}
          stage=""
          risk={riskTendency}
          time={timeConstraint}
          size="lg"
        />
      </div>
    </div>
  );
}

// ============================================================
// 表单分组组件
// ============================================================

interface FormGroupProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function FormGroup({ icon, title, subtitle, children }: FormGroupProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#007AFF]/15 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#1D1D1F]">{title}</h3>
          <p className="text-xs text-[#6B7280]">{subtitle}</p>
        </div>
      </div>
      <div className="ios-card overflow-hidden">{children}</div>
    </div>
  );
}

interface FormRowProps {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}

function FormRow({ label, children, last }: FormRowProps) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${!last ? 'border-b border-[#E5E7EB]' : ''}`}>
      <span className="text-sm text-[#1D1D1F] w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 ml-4">{children}</div>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<FutureProfile>(EMPTY_PROFILE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userState, setUserState] = useState<UserStateProfile | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 加载已有档案
  useEffect(() => {
    const existingProfile = loadProfile();
    if (existingProfile) {
      setProfile(existingProfile);
      // 如果有档案，立即分析状态
      if (getFilledFields(existingProfile).length >= 3) {
        setUserState(analyzeUserState(existingProfile));
      }
    }
  }, []);

  // 实时调用 State Engine（防抖）
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const filledCount = getFilledFields(profile).length;
      if (filledCount >= 3) {
        setUserState(analyzeUserState(profile));
      } else {
        setUserState(null);
      }
    }, 300);
    
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
    setIsSubmitting(true);
    
    // 保存新的 profile
    saveProfile(profile);
    
    // 删除旧的 radar 缓存（强制重新生成）
    localStorage.removeItem('futurelens-latest-radar');
    localStorage.removeItem('futurelens-latest-radar-created-at');
    localStorage.removeItem('futurelens-latest-radar-profile-hash');
    localStorage.removeItem('futurelens-latest-user-state');
    
    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push('/radar');
  };

  const inputClass = 'ios-input w-full px-4 py-2 text-sm placeholder-[#9CA3AF]';
  const selectClass = 'ios-input w-full px-4 py-2 text-sm bg-[#F9FAFB] cursor-pointer';
  const textareaClass = 'ios-input w-full px-4 py-2 text-sm placeholder-[#9CA3AF] resize-none';

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="sticky top-0 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-[#E5E7EB] z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#007AFF] text-sm font-medium">
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>返回</span>
          </Link>
          <span className="text-base font-semibold">构建 Future Self</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 左侧表单 */}
          <div className="lg:col-span-7">
            
            {/* 分组一：你是谁 */}
            <FormGroup
              icon={<User className="w-5 h-5 text-[#007AFF]" />}
              title="你是谁"
              subtitle="这些信息决定系统理解你的现实身份"
            >
              <FormRow label="年龄">
                <input
                  type="text"
                  value={profile.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  placeholder="如：21"
                  className={inputClass}
                />
              </FormRow>
              <FormRow label="学历">
                <input
                  type="text"
                  value={profile.education}
                  onChange={(e) => handleChange('education', e.target.value)}
                  placeholder="如：本科在读"
                  className={inputClass}
                />
              </FormRow>
              <FormRow label="专业/职业" last>
                <input
                  type="text"
                  value={profile.majorOrCareer}
                  onChange={(e) => handleChange('majorOrCareer', e.target.value)}
                  placeholder="如：视觉传达设计"
                  className={inputClass}
                />
              </FormRow>
            </FormGroup>

            {/* 分组二：你有什么 */}
            <FormGroup
              icon={<Package className="w-5 h-5 text-[#34C759]" />}
              title="你有什么"
              subtitle="这些信息决定系统判断你能从哪里开始"
            >
              <FormRow label="当前能力">
                <input
                  type="text"
                  value={profile.currentSkills}
                  onChange={(e) => handleChange('currentSkills', e.target.value)}
                  placeholder="如：Figma、Python、摄影"
                  className={inputClass}
                />
              </FormRow>
              <FormRow label="兴趣方向" last>
                <input
                  type="text"
                  value={profile.interests}
                  onChange={(e) => handleChange('interests', e.target.value)}
                  placeholder="如：品牌设计、AI应用"
                  className={inputClass}
                />
              </FormRow>
            </FormGroup>

            {/* 分组三：你想要什么 */}
            <FormGroup
              icon={<Target className="w-5 h-5 text-[#AF52DE]" />}
              title="你想要什么"
              subtitle="这些信息决定系统优先帮你解决什么问题"
            >
              <FormRow label="想获得什么">
                <select
                  value={profile.desiredOutcome}
                  onChange={(e) => handleChange('desiredOutcome', e.target.value)}
                  className={selectClass}
                >
                  <option value="">请选择...</option>
                  <option value="赚钱">赚钱</option>
                  <option value="学技能">学技能</option>
                  <option value="找方向">找方向</option>
                  <option value="转型">转型</option>
                  <option value="创业">创业</option>
                  <option value="稳定">稳定</option>
                  <option value="留学">留学</option>
                </select>
              </FormRow>
              <FormRow label="当前目标" last>
                <textarea
                  value={profile.currentGoal}
                  onChange={(e) => handleChange('currentGoal', e.target.value)}
                  placeholder="如：找到能发挥设计能力又能赚钱的方向"
                  rows={2}
                  className={textareaClass}
                />
              </FormRow>
            </FormGroup>

            {/* 分组四：你被什么卡住 */}
            <FormGroup
              icon={<AlertTriangle className="w-5 h-5 text-[#FF9500]" />}
              title="你被什么卡住"
              subtitle="这些信息决定系统给你多激进、多现实的行动建议"
            >
              <FormRow label="当前焦虑">
                <textarea
                  value={profile.currentAnxiety}
                  onChange={(e) => handleChange('currentAnxiety', e.target.value)}
                  placeholder="如：担心只会做图以后没有竞争力"
                  rows={2}
                  className={textareaClass}
                />
              </FormRow>
              <FormRow label="每周时间">
                <select
                  value={profile.weeklyTime}
                  onChange={(e) => handleChange('weeklyTime', e.target.value)}
                  className={selectClass}
                >
                  <option value="">请选择...</option>
                  <option value="5小时以下">5小时以下</option>
                  <option value="5-10小时">5-10小时</option>
                  <option value="10-15小时">10-15小时</option>
                  <option value="15-20小时">15-20小时</option>
                  <option value="20小时以上">20小时以上</option>
                </select>
              </FormRow>
              <FormRow label="风险偏好" last>
                <select
                  value={profile.riskPreference}
                  onChange={(e) => handleChange('riskPreference', e.target.value)}
                  className={selectClass}
                >
                  <option value="">请选择...</option>
                  <option value="稳妥">稳妥（低风险，求稳）</option>
                  <option value="适中">适中（平衡稳定和机会）</option>
                  <option value="激进">激进（愿意试错）</option>
                </select>
              </FormRow>
            </FormGroup>

            {/* 提交按钮 */}
            <div className="mt-8 pb-8">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="ios-button-primary w-full flex items-center justify-center gap-2 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    让 FutureLens 分析我的下一步...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    生成我的机会雷达
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <p className="text-xs text-[#9CA3AF] text-center mt-3">
                填写越完整，分析越精准
              </p>
            </div>
          </div>

          {/* 右侧预览 */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <FutureSelfPreview profile={profile} userState={userState} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
