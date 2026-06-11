'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronRight, Loader2, RefreshCw, AlertCircle, Zap, TrendingUp, TrendingDown, CheckCircle2, Calendar, Target, Shield, User, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { loadProfile } from '@/lib/radar';
import { getChangeSignalsForProfile, generateProfileHash } from '@/lib/changeEngine';
import { analyzeUserState } from '@/lib/stateEngine';
import type { CreateDiscoveryInput, DiscoveryRecord } from '@/types/discovery';
import type { FutureProfile, ChangeSignal, OpportunityRadarV4, TodayChange, ImpactOnUser, ActionItem, UserStateProfile, PersonalImpact, DecisionExplanation, ValueMigration, CoreInsight } from '@/types/radar';
import FutureSelfAvatar from '@/components/FutureSelfAvatar';

type VerificationPhase = 'idle' | 'started' | 'recording' | 'recorded';
type VerificationCategory = 'customer' | 'job' | 'study' | 'direction' | 'general';

type EvidenceRecord = DiscoveryRecord;

type ResultOption = {
  code: string;
  label: string;
  judgment: string;
  nextUnknown: string;
  nextAction: string;
  identitySignal: string;
};

type VerificationContext = {
  category: VerificationCategory;
  goal: string;
  why: string;
  resultPlaceholder: string;
  options: ResultOption[];
};

function getVerificationContext(action?: ActionItem): VerificationContext {
  const text = [
    action?.task,
    action?.reason,
    action?.platform,
    action?.keywords,
    action?.action,
    action?.successCriteria,
  ].filter(Boolean).join(' ').toLowerCase();

  if (/(客户|询价|付费|接单|需求|服务|用户访谈|商家)/.test(text)) {
    return {
      category: 'customer',
      goal: '真实需求是否存在，以及对方是否愿意继续了解你的方案。',
      why: '如果真实需求不存在，继续投入学习和制作不会让方向变清楚。',
      resultPlaceholder: '记录对方是否感兴趣、是否询价、拒绝原因或没有回复。',
      options: [
        { code: 'interested', label: '有人感兴趣', judgment: '真实需求得到了初步支持，但还不能确认是否愿意付费。', nextUnknown: '对方愿意为什么具体结果付出时间或金钱？', nextAction: '追问一位感兴趣的人：他最希望先解决哪个具体问题。', identitySignal: '正在成为能够主动接触真实需求的人' },
        { code: 'asked_price', label: '有人询价', judgment: '需求不仅存在，而且已经出现了初步付费信号。', nextUnknown: '这个付费信号能否再次出现？', nextAction: '用同样的服务表达再接触一位相似对象，确认询价是否可重复。', identitySignal: '正在形成把能力连接到真实需求的能力' },
        { code: 'rejected', label: '被拒绝', judgment: '当前对象或表达没有建立连接，但一次拒绝还不足以否定方向。', nextUnknown: '拒绝来自没有需求，还是你的表达没有说中问题？', nextAction: '换一位对象，并把询问改成只确认对方最困扰的问题。', identitySignal: '正在形成从拒绝中修正方向的能力' },
        { code: 'no_reply', label: '无人回复', judgment: '当前触达方式没有获得反馈，原判断暂时无法成立。', nextUnknown: '问题出在对象、渠道，还是开场表达？', nextAction: '更换一个渠道或对象，再发出一条更具体的询问。', identitySignal: '正在形成低成本测试真实需求的习惯' },
        { code: 'new_discovery', label: '出现新的发现', judgment: '现实暴露了原判断之外的新线索，需要先理解这个变化。', nextUnknown: '这个新发现是偶然情况，还是更重要的真实问题？', nextAction: '围绕新发现再问一个具体对象，确认它是否重复出现。', identitySignal: '正在形成从现实反馈中发现问题的能力' },
      ],
    };
  }

  if (/(岗位|招聘|简历|面试|投递|offer|求职|jd)/.test(text)) {
    return {
      category: 'job',
      goal: '你的当前经历是否已经达到目标岗位的真实要求。',
      why: '只有岗位反馈才能区分：你缺少的是表达、作品证明，还是关键能力。',
      resultPlaceholder: '记录投递、岗位要求、回复、拒信或发现的具体能力缺口。',
      options: [
        { code: 'interview', label: '获得面试', judgment: '你的经历已经通过了第一轮岗位筛选。', nextUnknown: '面试方最在意你哪项经历或能力？', nextAction: '整理面试邀请对应的岗位要求，标出最可能被追问的三点。', identitySignal: '正在成为能够用经历证明自己的人' },
        { code: 'rejection', label: '收到拒信', judgment: '当前材料或匹配度还没有通过岗位筛选。', nextUnknown: '拒绝来自岗位不匹配，还是材料没有证明关键能力？', nextAction: '对照该岗位要求，找出一项简历中没有证据支撑的能力。', identitySignal: '正在形成根据真实标准修正自己的能力' },
        { code: 'no_reply', label: '暂无回复', judgment: '当前投递还没有产生足够反馈，不能据此判断能力是否匹配。', nextUnknown: '需要更多样本，还是需要先调整投递对象？', nextAction: '再选择两个要求相近的岗位，比较它们共同强调的能力。', identitySignal: '正在形成用岗位标准判断方向的能力' },
        { code: 'skill_gap', label: '发现能力缺口', judgment: '方向开始变清楚：当前阻碍是一个具体、可补足的能力缺口。', nextUnknown: '这个能力缺口是否真的是多数目标岗位的共同要求？', nextAction: '再查看五个同类岗位，统计该能力出现的次数。', identitySignal: '正在形成用现实要求识别能力缺口的能力' },
        { code: 'new_discovery', label: '出现新的发现', judgment: '岗位信息改变了你对目标方向的原有理解。', nextUnknown: '这个新发现是否会改变你的目标岗位选择？', nextAction: '找两个相邻岗位进行对比，确认哪一个更符合你的现有积累。', identitySignal: '正在形成基于现实信息选择方向的能力' },
      ],
    };
  }

  if (/(雅思|托福|备考|考试|学习方案|课程|真题|复习|申请)/.test(text)) {
    return {
      category: 'study',
      goal: '是否存在一个符合你当前时间和问题的可执行方案。',
      why: '找到资料不等于找到适合你的方案，关键是它能否被实际执行。',
      resultPlaceholder: '记录找到的方案、为什么适合或不适合，以及暴露出的真实问题。',
      options: [
        { code: 'workable_plan', label: '找到可执行方案', judgment: '当前问题开始从“没有方法”变成“验证方法是否有效”。', nextUnknown: '这个方案执行一次后，是否真的改善了你的薄弱环节？', nextAction: '按方案完成一次最小练习，并记录完成时间和错误类型。', identitySignal: '正在成为能够把目标拆成可执行验证的人' },
        { code: 'not_fit', label: '找到但不适合', judgment: '你排除了一个不符合当前时间或问题的方案。', nextUnknown: '不适合的核心原因是时间、难度，还是没有针对真实弱点？', nextAction: '保留最有用的一步，把方案缩小到今晚可以完成的规模。', identitySignal: '正在形成判断方法是否适合自己的能力' },
        { code: 'no_valid_plan', label: '没找到有效方案', judgment: '问题可能不在资料数量，而在你还没有明确当前最需要解决的薄弱点。', nextUnknown: '现在真正拖慢你的具体问题是什么？', nextAction: '完成一组最小测试，记录错误最集中的一个类型。', identitySignal: '正在形成先识别问题再选择方法的能力' },
        { code: 'problem_elsewhere', label: '发现问题不在计划', judgment: '原判断被修正：阻碍可能来自执行、反馈或基础能力，而不是计划本身。', nextUnknown: '真正阻碍执行的因素能否被一个更小的动作验证？', nextAction: '围绕新发现设计一个 15 分钟测试，只验证这个阻碍。', identitySignal: '正在形成通过结果修正学习判断的能力' },
        { code: 'new_discovery', label: '出现新的发现', judgment: '这次查找带来了新的判断线索。', nextUnknown: '这个新发现是否比原来的计划问题更关键？', nextAction: '用一次最小练习确认这个新发现是否真实影响结果。', identitySignal: '正在形成从练习结果中发现真实问题的能力' },
      ],
    };
  }

  if (/(方向|转行|选择|比较|测试|尝试)/.test(text)) {
    return {
      category: 'direction',
      goal: '这个方向是否值得你继续投入下一轮时间。',
      why: '方向不是想清楚的，而是通过投入感、完成结果和外部反馈逐渐排除出来的。',
      resultPlaceholder: '记录你完成后的感受、结果，以及愿不愿意继续投入。',
      options: [
        { code: 'continue', label: '值得继续测试', judgment: '这个方向获得了继续验证的理由，但还没有形成稳定结论。', nextUnknown: '它是否既适合你，也能获得现实反馈？', nextAction: '把测试推进一步，接触一个真实使用者或评价者。', identitySignal: '正在形成通过小实验判断方向的能力' },
        { code: 'stop', label: '可以排除这个方向', judgment: '你减少了一个错误选项，方向范围已经开始收窄。', nextUnknown: '剩余方向中，哪一个最值得先获得现实反馈？', nextAction: '从剩余方向中选一个，完成同等规模的小测试。', identitySignal: '正在成为能够用行动排除错误方向的人' },
        { code: 'unclear', label: '结果仍不清楚', judgment: '这次测试区分度不足，还没有产生足够信息。', nextUnknown: '需要改变测试方式，还是需要接触更真实的场景？', nextAction: '把下一次测试改成有外部对象、有明确结果的版本。', identitySignal: '正在形成改进验证方式的能力' },
        { code: 'new_constraint', label: '发现新的限制', judgment: '原来的方向判断需要加入一个新的现实限制。', nextUnknown: '这个限制能否降低，还是应该改变方向选择？', nextAction: '用一个更小动作确认这个限制是暂时的还是持续的。', identitySignal: '正在形成识别现实限制的能力' },
        { code: 'new_discovery', label: '出现新的发现', judgment: '现实提供了原计划之外的新方向线索。', nextUnknown: '这个线索是否值得成为下一轮测试重点？', nextAction: '围绕新线索完成一个同等规模的小实验。', identitySignal: '正在形成从行动中发现方向的能力' },
      ],
    };
  }

  return {
    category: 'general',
    goal: '现实结果是否支持你当前的判断。',
    why: '只有获得具体结果，才能减少未知并决定下一步。',
    resultPlaceholder: '记录实际发生的结果，以及它和预期有什么不同。',
    options: [
      { code: 'supported', label: '结果支持原判断', judgment: '原判断得到了初步支持，但还需要重复验证。', nextUnknown: '相同结果是否会再次出现？', nextAction: '在相似条件下再进行一次小规模验证。', identitySignal: '正在形成用现实结果检验判断的能力' },
      { code: 'weakened', label: '结果不支持原判断', judgment: '原判断被削弱，需要调整方向或验证方式。', nextUnknown: '问题来自判断本身，还是这次验证方式？', nextAction: '改变一个关键条件，再完成一次更有区分度的验证。', identitySignal: '正在形成根据结果修正判断的能力' },
      { code: 'unclear', label: '结果仍不清楚', judgment: '这次结果没有减少足够未知。', nextUnknown: '怎样让下一次结果更具体、更容易比较？', nextAction: '为下一次验证增加明确对象和完成结果。', identitySignal: '正在形成设计有效验证的能力' },
      { code: 'not_completed', label: '没有完成验证', judgment: '当前验证门槛可能超过了你的时间或精力。', nextUnknown: '最小到什么程度，你今晚可以真正开始？', nextAction: '把验证缩小成一个 15 分钟内可完成的动作。', identitySignal: '正在形成识别真实行动边界的能力' },
      { code: 'new_discovery', label: '出现新的发现', judgment: '现实带来了原判断之外的新线索。', nextUnknown: '这个新发现是否应该成为下一次验证重点？', nextAction: '围绕新发现设计一个最小验证。', identitySignal: '正在形成从现实结果中更新判断的能力' },
    ],
  };
}

function getEvidenceImpact(record?: EvidenceRecord | null) {
  if (!record) return null;
  const context = getVerificationContextForCategory(record.category, record.actionTitle);
  const option = context.options.find(item => item.code === record.outcomeCode);
  return option || null;
}

function getVerificationContextForCategory(
  category: VerificationCategory,
  fallbackAction: string
): VerificationContext {
  const categoryHints: Record<VerificationCategory, string> = {
    customer: '客户需求询价',
    job: '求职岗位面试',
    study: '雅思备考学习方案',
    direction: '方向选择测试',
    general: fallbackAction,
  };
  return getVerificationContext({
    time: '今晚',
    task: categoryHints[category],
    reason: '',
    successCriteria: '',
  });
}

// ============================================================
// V6.7 核心模块：理解用户（CoreInsight）
// ============================================================

interface CoreInsightCardProps {
  coreInsight?: CoreInsight;
  latestEvidence?: EvidenceRecord | null;
}

function CoreInsightCard({ coreInsight, latestEvidence }: CoreInsightCardProps) {
  if (!coreInsight) {
    return null;
  }

  const theRealProblem = coreInsight["真正的问题是什么"];
  const oneSentenceToRemember = coreInsight["如果只记住一句话"];
  const evidenceImpact = getEvidenceImpact(latestEvidence);
  const currentJudgment = evidenceImpact?.judgment || theRealProblem;

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
      {latestEvidence && evidenceImpact && (
        <div className="mb-5 rounded-xl bg-[#E8F7EC] px-4 py-3 text-sm text-[#248A3D]">
          <div className="font-semibold">根据你最近的验证结果，FutureLens 更新了判断</div>
          <div className="mt-1 text-[#248A3D]/80">{evidenceImpact.judgment}</div>
        </div>
      )}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#FF9500]/12 flex items-center justify-center">
          <Target className="w-4.5 h-4.5 text-[#FF9500]" />
        </div>
        <div>
          <div className="text-xs text-[#9CA3AF] mb-0.5">01</div>
          <h1 className="text-base font-semibold text-[#1D1D1F]">你的真正问题</h1>
        </div>
      </div>

      <div className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] leading-relaxed">
        {currentJudgment}
      </div>

      {latestEvidence && evidenceImpact ? (
        <div className="mt-5 pt-5 border-t border-[#F0F0F2] space-y-3">
          <div>
            <div className="text-xs text-[#248A3D] font-semibold mb-1.5">这次现实结果</div>
            <div className="text-sm text-[#1D1D1F] leading-relaxed">{latestEvidence.userResult}</div>
          </div>
          <div>
            <div className="text-xs text-[#9CA3AF] mb-1.5">更新前的判断</div>
            <div className="text-sm text-[#6B7280] leading-relaxed">{latestEvidence.sourceJudgment || theRealProblem}</div>
          </div>
        </div>
      ) : (
        <div className="mt-5 pt-5 border-t border-[#F0F0F2] text-sm text-[#6B7280] leading-relaxed">
          {oneSentenceToRemember}
        </div>
      )}
    </section>
  );
}

// ============================================================
// V6.5 核心模块2：如果继续这样（Risk Engine）
// ============================================================

interface RiskEngineCardProps {
  risk30Days: string;
  risk90Days: string;
  mostLikelyResult: string;
}

function RiskEngineCard({ risk30Days, risk90Days, mostLikelyResult }: RiskEngineCardProps) {
  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#FF3B30]/10 flex items-center justify-center">
          <TrendingDown className="w-4.5 h-4.5 text-[#FF3B30]" />
        </div>
        <div>
          <div className="text-xs text-[#9CA3AF] mb-0.5">02</div>
          <h2 className="text-base font-semibold text-[#1D1D1F]">如果继续这样</h2>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-xs font-semibold text-[#FF3B30] bg-[#FF3B30]/8 px-2.5 py-1 rounded-md flex-shrink-0">30天后</span>
          <span className="text-sm text-[#6B7280]">{risk30Days}</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-xs font-semibold text-[#FF3B30] bg-[#FF3B30]/8 px-2.5 py-1 rounded-md flex-shrink-0">90天后</span>
          <span className="text-sm text-[#6B7280]">{risk90Days}</span>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-[#F0F0F2]">
        <div className="text-xs text-[#9CA3AF] mb-1.5">最可能发生</div>
        <div className="text-sm font-medium text-[#1D1D1F]">{mostLikelyResult}</div>
      </div>
    </section>
  );
}

// ============================================================
// V7 核心模块3：现在最需要确认什么
// ============================================================

interface VerificationGapCardProps {
  context: VerificationContext;
  latestEvidence?: EvidenceRecord | null;
}

function VerificationGapCard({ context, latestEvidence }: VerificationGapCardProps) {
  const evidenceImpact = getEvidenceImpact(latestEvidence);
  const currentUnknown = evidenceImpact?.nextUnknown || context.goal;

  return (
    <section className="bg-[#1D1D1F] text-white rounded-2xl p-6 shadow-[0_16px_40px_rgba(29,29,31,0.12)]">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
          <Shield className="w-4.5 h-4.5 text-[#FFB340]" />
        </div>
        <div>
          <div className="text-xs text-white/45 mb-0.5">03</div>
          <h2 className="text-base font-semibold">现在最需要确认什么</h2>
        </div>
      </div>

      <p className="text-lg font-medium leading-relaxed">
        {currentUnknown}
      </p>
      <p className="mt-4 text-sm text-white/60 leading-relaxed">
        {latestEvidence ? '这是最近一次结果之后，仍然阻止你做决定的未知。' : context.why}
      </p>
    </section>
  );
}

// ============================================================
// V7 核心模块4：今晚验证什么
// ============================================================

interface TonightActionCardProps {
  action: ActionItem;
  phase: VerificationPhase;
  onStart: () => void;
  onRecord: () => void;
}

function TonightActionCard({ action, phase, onStart, onRecord }: TonightActionCardProps) {
  // 估算耗时（从 successCriteria 推断）
  const estimateTime = (criteria: string) => {
    if (criteria.includes('5分钟') || criteria.includes('5min')) return '5分钟';
    if (criteria.includes('15分钟') || criteria.includes('15min')) return '15分钟';
    if (criteria.includes('30分钟') || criteria.includes('30min')) return '30分钟';
    if (criteria.includes('1小时') || criteria.includes('1h')) return '1小时';
    return '30分钟'; // 默认
  };

  const estimatedTime = estimateTime(action.successCriteria);

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#34C759]/10 flex items-center justify-center">
          <Clock className="w-4.5 h-4.5 text-[#34C759]" />
        </div>
        <div>
          <div className="text-xs text-[#9CA3AF] mb-0.5">04</div>
          <h2 className="text-base font-semibold text-[#1D1D1F]">今晚验证什么</h2>
        </div>
      </div>

      <div className="bg-[#F7F7F8] rounded-xl p-4 mb-4">
        <div className="text-base font-semibold text-[#1D1D1F] leading-relaxed">
          {action.task}
        </div>
      </div>

      {(action.platform || action.keywords || action.action) && (
        <div className="border border-[#E5E7EB] rounded-xl p-4 mb-4 space-y-3">
          {action.platform && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-[#9CA3AF] w-12 flex-shrink-0">去哪里</span>
              <span className="text-xs text-[#6B7280]">{action.platform}</span>
            </div>
          )}
          {action.keywords && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-[#9CA3AF] w-12 flex-shrink-0">找什么</span>
              <span className="text-xs text-[#6B7280]">{action.keywords}</span>
            </div>
          )}
          {action.action && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-[#9CA3AF] w-12 flex-shrink-0">怎么做</span>
              <span className="text-xs text-[#6B7280]">{action.action}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#F7F7F8] rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">大约需要</div>
          <div className="text-sm font-semibold text-[#1D1D1F]">{estimatedTime}</div>
        </div>
        <div className="bg-[#F7F7F8] rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">看到什么就有结果</div>
          <div className="text-xs font-medium text-[#1D1D1F] leading-relaxed">{action.successCriteria}</div>
        </div>
      </div>

      <button
        onClick={phase === 'idle' ? onStart : onRecord}
        disabled={phase === 'recorded'}
        className={`w-full h-12 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
          phase === 'recorded'
            ? 'bg-[#E8F7EC] text-[#248A3D]'
            : phase === 'started'
            ? 'bg-[#1D1D1F] text-white hover:bg-black'
            : 'bg-[#1D1D1F] text-white hover:bg-black'
        }`}
      >
        {phase === 'recorded' ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            已记录这次发现
          </>
        ) : phase === 'started' ? (
          <>
            记录我发现了什么
            <ChevronRight className="w-4 h-4" />
          </>
        ) : (
          <>
            开始验证
            <ChevronRight className="w-4 h-4" />
          </>
        )}
      </button>
    </section>
  );
}

// ============================================================
// V7.2 记录结果与更新判断
// ============================================================

interface RecordDiscoveryCardProps {
  action: ActionItem;
  context: VerificationContext;
  onCancel: () => void;
  onSubmit: (result: { outcome: ResultOption; userResult: string; userDiscovery: string }) => void;
}

function RecordDiscoveryCard({ action, context, onCancel, onSubmit }: RecordDiscoveryCardProps) {
  const [outcomeCode, setOutcomeCode] = useState(context.options[0]?.code || '');
  const [result, setResult] = useState('');
  const [discovery, setDiscovery] = useState('');

  const canSubmit = result.trim().length > 0;
  const selectedOutcome = context.options.find(option => option.code === outcomeCode) || context.options[0];

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
          <Sparkles className="w-4.5 h-4.5 text-[#007AFF]" />
        </div>
        <div>
          <div className="text-xs text-[#9CA3AF] mb-0.5">05</div>
          <h2 className="text-base font-semibold text-[#1D1D1F]">记录我发现了什么</h2>
        </div>
      </div>

      <div className="bg-[#F7F7F8] rounded-xl p-4 mb-5">
        <div className="text-xs text-[#9CA3AF] mb-1.5">想确认什么</div>
        <p className="text-sm font-medium text-[#1D1D1F] leading-relaxed">{context.goal}</p>
        <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">{action.task}</p>
      </div>

      <div className="mb-5">
        <div className="text-sm font-medium text-[#1D1D1F] mb-3">发生了什么？</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {context.options.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => setOutcomeCode(option.code)}
              className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                outcomeCode === option.code
                  ? 'border-[#1D1D1F] bg-[#1D1D1F] text-white'
                  : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F7F8]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block mb-4">
        <span className="block text-sm font-medium text-[#1D1D1F] mb-2">实际发生了什么？</span>
        <textarea
          value={result}
          onChange={(event) => setResult(event.target.value)}
          rows={3}
          placeholder={context.resultPlaceholder}
          className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#1D1D1F] placeholder:text-[#9CA3AF] resize-none focus:outline-none focus:border-[#007AFF]"
        />
      </label>

      <label className="block mb-5">
        <span className="block text-sm font-medium text-[#1D1D1F] mb-2">这改变了你原来的什么想法？</span>
        <textarea
          value={discovery}
          onChange={(event) => setDiscovery(event.target.value)}
          rows={2}
          placeholder="可以留空，FutureLens 会先根据结果更新判断。"
          className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#1D1D1F] placeholder:text-[#9CA3AF] resize-none focus:outline-none focus:border-[#007AFF]"
        />
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 px-5 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#6B7280] hover:bg-[#F7F7F8]"
        >
          稍后记录
        </button>
        <button
          type="button"
          disabled={!canSubmit || !selectedOutcome}
          onClick={() => selectedOutcome && onSubmit({
            outcome: selectedOutcome,
            userResult: result.trim(),
            userDiscovery: discovery.trim(),
          })}
          className="h-12 flex-1 rounded-xl bg-[#1D1D1F] text-white text-sm font-semibold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
        >
          更新判断
        </button>
      </div>
    </section>
  );
}

interface UpdatedJudgmentCardProps {
  record: EvidenceRecord;
}

function UpdatedJudgmentCard({ record }: UpdatedJudgmentCardProps) {
  const update = getEvidenceImpact(record);
  if (!update) return null;

  return (
    <section className="bg-[#E8F7EC] border border-[#34C759]/20 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#248A3D]" />
        </div>
        <div>
          <div className="text-xs text-[#248A3D]/70 mb-0.5">判断已更新</div>
          <h2 className="text-base font-semibold text-[#1D1D1F]">{record.outcomeLabel}</h2>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white/70 rounded-xl p-4">
          <div className="text-xs text-[#6B7280] mb-1.5">这次结果说明</div>
          <p className="text-sm text-[#1D1D1F] leading-relaxed">{update.judgment}</p>
        </div>
        <div className="bg-white/70 rounded-xl p-4">
          <div className="text-xs text-[#6B7280] mb-1.5">现在最需要确认</div>
          <p className="text-sm text-[#1D1D1F] leading-relaxed">{update.nextUnknown}</p>
        </div>
        {record.userDiscovery && (
          <div className="pt-3 border-t border-[#34C759]/15">
            <div className="text-xs text-[#248A3D] mb-1.5">你的发现</div>
            <p className="text-sm text-[#1D1D1F] leading-relaxed">{record.userDiscovery}</p>
          </div>
        )}
      </div>
    </section>
  );
}

interface RecentDiscoveriesCardProps {
  records: EvidenceRecord[];
}

function RecentDiscoveriesCard({ records }: RecentDiscoveriesCardProps) {
  if (records.length === 0) return null;

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#1D1D1F]">最近获得的发现</h2>
        <span className="text-xs text-[#9CA3AF]">{records.length} 条</span>
      </div>
      <div className="space-y-3">
        {records.slice(0, 3).map(record => (
          <div key={record.id} className="border-l-2 border-[#34C759] pl-3">
            <div className="text-xs text-[#9CA3AF] mb-1">
              {new Date(record.createdAt).toLocaleDateString('zh-CN')} · {record.outcomeLabel}
            </div>
            <p className="text-sm text-[#1D1D1F] leading-relaxed">{record.userResult}</p>
            {record.userDiscovery && (
              <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">{record.userDiscovery}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// V6.5 二级折叠区域：系统分析依据
// ============================================================

interface CollapsibleAnalysisProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleAnalysis({ children, defaultOpen = false }: CollapsibleAnalysisProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mt-6">
      {/* 折叠按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
      >
        <span className="text-sm font-medium text-[#6B7280]">查看 FutureLens 为什么这样判断</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#9CA3AF]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
        )}
      </button>

      {/* 折叠内容 */}
      {isOpen && (
        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 二级区域：今日变化模块
// ============================================================

interface TodayChangesCardProps {
  changes: TodayChange[];
}

function TodayChangesCard({ changes }: TodayChangesCardProps) {
  return (
    <div className="ios-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#FF9500]/15 flex items-center justify-center">
          <Zap className="w-4 h-4 text-[#FF9500]" />
        </div>
        <h2 className="text-base font-semibold">今日变化</h2>
      </div>

      <div className="space-y-3">
        {changes.map((change, index) => (
          <div key={index} className="bg-[#F9FAFB] rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-[#FF9500]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-[#FF9500]">{index + 1}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-[#1D1D1F] mb-1">{change.title}</h3>
                <p className="text-xs text-[#6B7280]">{change.summary}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 二级区域：Personal Impact 模块
// ============================================================

interface PersonalImpactCardProps {
  personalImpact?: PersonalImpact;
}

function PersonalImpactCard({ personalImpact }: PersonalImpactCardProps) {
  if (!personalImpact) {
    return null;
  }

  return (
    <div className="ios-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#007AFF]/15 flex items-center justify-center">
          <Target className="w-4 h-4 text-[#007AFF]" />
        </div>
        <h2 className="text-base font-semibold">这对你意味着什么</h2>
      </div>

      <div className="space-y-3">
        <div className="bg-[#F9FAFB] rounded-lg p-3">
          <div className="text-xs text-[#007AFF] font-semibold mb-1">受到影响的能力</div>
          <p className="text-sm text-[#6B7280]">{personalImpact.affectedPart}</p>
        </div>

        <div className="bg-gradient-to-r from-[#007AFF]/5 to-[#AF52DE]/5 rounded-lg p-3">
          <div className="text-xs text-[#AF52DE] font-semibold mb-1">影响原因</div>
          <p className="text-sm text-[#6B7280]">{personalImpact.reason}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#34C759]/5 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-[#34C759]" />
              <span className="text-xs text-[#34C759] font-semibold">新出现的可能性</span>
            </div>
            <p className="text-xs text-[#6B7280]">{personalImpact.opportunity}</p>
          </div>
          <div className="bg-[#FF3B30]/5 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-[#FF3B30]" />
              <span className="text-xs text-[#FF3B30] font-semibold">增加的风险</span>
            </div>
            <p className="text-xs text-[#6B7280]">{personalImpact.risk}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 二级区域：当前状态模块
// ============================================================

interface UserStateCardProps {
  userState: UserStateProfile;
  latestEvidence?: EvidenceRecord | null;
}

function UserStateCard({ userState, latestEvidence }: UserStateCardProps) {
  const identitySignal = getEvidenceImpact(latestEvidence)?.identitySignal;

  return (
    <div className="ios-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#007AFF]/15 flex items-center justify-center">
          <User className="w-4 h-4 text-[#007AFF]" />
        </div>
        <h2 className="text-base font-semibold">当前状态</h2>
      </div>

      <div className="bg-gradient-to-r from-[#007AFF]/5 to-[#AF52DE]/5 rounded-lg p-3 mb-3">
        <div className="text-base font-bold text-[#1D1D1F] mb-1">{userState.stateLabel}</div>
        <p className="text-sm text-[#6B7280]">{userState.oneSentenceDiagnosis}</p>
      </div>

      {identitySignal && (
        <div className="bg-[#E8F7EC] rounded-lg p-3 mb-3">
          <div className="text-xs text-[#248A3D] font-semibold mb-1">最近一次验证带来的状态变化</div>
          <p className="text-sm text-[#1D1D1F]">{identitySignal}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="bg-[#F9FAFB] rounded-lg px-3 py-2">
          <div className="text-xs text-[#9CA3AF]">主目标</div>
          <div className="text-sm font-medium text-[#1D1D1F]">{userState.mainGoal}</div>
        </div>
        <div className="bg-[#F9FAFB] rounded-lg px-3 py-2">
          <div className="text-xs text-[#9CA3AF]">主要焦虑</div>
          <div className="text-sm font-medium text-[#1D1D1F]">{userState.mainFear}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 二级区域：价值迁移模块
// ============================================================

interface ValueMigrationCardProps {
  migration: ValueMigration;
}

function ValueMigrationCard({ migration }: ValueMigrationCardProps) {
  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high':
        return { bg: '#FF3B30', bgLight: '#FF3B30/15', text: '#FF3B30', label: '紧迫' };
      case 'medium':
        return { bg: '#FF9500', bgLight: '#FF9500/15', text: '#FF9500', label: '中等' };
      case 'low':
        return { bg: '#34C759', bgLight: '#34C759/15', text: '#34C759', label: '稳定' };
      default:
        return { bg: '#6B7280', bgLight: '#6B7280/15', text: '#6B7280', label: '未知' };
    }
  };

  const urgency = getUrgencyColor(migration.urgencyLevel);

  return (
    <div className="ios-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#AF52DE]/15 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-[#AF52DE]" />
        </div>
        <h2 className="text-base font-semibold">价值迁移</h2>
        <div 
          className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: urgency.bgLight, color: urgency.text }}
        >
          {urgency.label}
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-[#007AFF]/5 rounded-lg p-3">
          <div className="text-xs text-[#007AFF] font-semibold mb-1">你现在靠什么赚钱</div>
          <div className="flex flex-wrap gap-1">
            {migration.currentValueSource.map((item, index) => (
              <span key={index} className="text-xs bg-white px-2 py-0.5 rounded border border-[#007AFF]/20">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#FF3B30]/5 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-[#FF3B30]" />
              <span className="text-xs text-[#FF3B30] font-semibold">正在贬值</span>
            </div>
            {migration.decliningValue.map((item, index) => (
              <div key={index} className="text-xs text-[#6B7280]">• {item}</div>
            ))}
          </div>
          <div className="bg-[#34C759]/5 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-[#34C759]" />
              <span className="text-xs text-[#34C759] font-semibold">正在升值</span>
            </div>
            {migration.risingValue.map((item, index) => (
              <div key={index} className="text-xs text-[#6B7280]">• {item}</div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#AF52DE]/5 to-[#007AFF]/5 rounded-lg p-3">
          <div className="text-xs text-[#AF52DE] font-semibold mb-1">你应该迁移到</div>
          <p className="text-sm font-medium text-[#1D1D1F]">{migration.migrationDirection}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 二级区域：系统为什么这样判断
// ============================================================

interface DecisionTransparencyCardProps {
  explanation: DecisionExplanation;
}

function DecisionTransparencyCard({ explanation }: DecisionTransparencyCardProps) {
  return (
    <div className="ios-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#AF52DE]/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#AF52DE]" />
        </div>
        <h2 className="text-base font-semibold">系统为什么这样判断</h2>
      </div>

      <div className="space-y-3">
        <div className="bg-gradient-to-r from-[#AF52DE]/5 to-[#007AFF]/5 rounded-lg p-3">
          <div className="text-xs text-[#AF52DE] font-semibold mb-1">系统最关注什么</div>
          <p className="text-sm font-medium text-[#1D1D1F]">{explanation.currentPriority}</p>
        </div>

        <div className="bg-[#F9FAFB] rounded-lg p-3">
          <div className="text-xs text-[#FF3B30] font-semibold mb-1">为什么不是别的事情</div>
          <p className="text-sm text-[#6B7280]">{explanation.whyNotOthers}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {explanation.influencingFactors.map((factor, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#007AFF]/20 rounded-full text-xs">
              <CheckCircle2 className="w-3 h-3 text-[#34C759]" />
              {factor}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 二级区域：完整行动清单
// ============================================================

interface ActionsCardProps {
  actions: ActionItem[];
}

function ActionsCard({ actions }: ActionsCardProps) {
  const getTimeColor = (time: string) => {
    switch (time) {
      case '今晚':
        return { bg: '#34C759', bgLight: '#34C759/15', text: '#34C759' };
      case '明天':
        return { bg: '#007AFF', bgLight: '#007AFF/15', text: '#007AFF' };
      case '本周':
        return { bg: '#AF52DE', bgLight: '#AF52DE/15', text: '#AF52DE' };
      default:
        return { bg: '#6B7280', bgLight: '#6B7280/15', text: '#6B7280' };
    }
  };

  return (
    <div className="ios-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#34C759]/15 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-[#34C759]" />
        </div>
        <h2 className="text-base font-semibold">完整行动清单</h2>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const colors = getTimeColor(action.time);
          return (
            <div key={index} className="bg-[#F9FAFB] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ backgroundColor: colors.bgLight, color: colors.text }}
                >
                  {action.time}
                </span>
              </div>
              <p className="text-sm font-medium text-[#1D1D1F] mb-2">{action.task}</p>
              <div className="text-xs text-[#6B7280] flex items-start gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#34C759] mt-0.5 flex-shrink-0" />
                {action.successCriteria}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 二级区域：未来分身提醒
// ============================================================

interface FutureSelfCardProps {
  message: string;
  evidenceHistory: EvidenceRecord[];
}

function FutureSelfCard({ message, evidenceHistory }: FutureSelfCardProps) {
  const identitySignals = Array.from(new Set(
    evidenceHistory
      .map(record => getEvidenceImpact(record)?.identitySignal)
      .filter((signal): signal is string => Boolean(signal))
  )).slice(0, 3);

  return (
    <div className="ios-card p-5 bg-gradient-to-br from-[#FF9500]/5 to-[#FF9500]/10 border border-[#FF9500]/20">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#FF9500]/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#FF9500]" />
        </div>
        <h2 className="text-base font-semibold">正在被现实证明的你</h2>
      </div>
      {identitySignals.length > 0 ? (
        <div className="space-y-2">
          {identitySignals.map(signal => (
            <div key={signal} className="flex items-start gap-2 text-sm text-[#1D1D1F]">
              <CheckCircle2 className="w-4 h-4 text-[#34C759] mt-0.5 flex-shrink-0" />
              <span>{signal}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#1D1D1F] leading-relaxed">{message}</p>
      )}
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================

const RADAR_KEY = 'futurelens-latest-radar';
const RADAR_CREATED_AT_KEY = 'futurelens-latest-radar-created-at';
const RADAR_PROFILE_HASH_KEY = 'futurelens-latest-radar-profile-hash';
const RADAR_USER_STATE_KEY = 'futurelens-latest-user-state';
const EVIDENCE_HISTORY_KEY = 'futurelens-evidence-history';

export default function RadarPage() {
  const [profile, setProfile] = useState<FutureProfile | null>(null);
  const [radarData, setRadarData] = useState<OpportunityRadarV4 | null>(null);
  const [userState, setUserState] = useState<UserStateProfile | null>(null);
  const [radarCreatedAt, setRadarCreatedAt] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [verificationPhase, setVerificationPhase] = useState<VerificationPhase>('idle');
  const [evidenceHistory, setEvidenceHistory] = useState<EvidenceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadProfileForRadar = async (): Promise<FutureProfile | null> => {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.profile) {
          localStorage.setItem('futurelens-user-profile', JSON.stringify(result.profile));
          return result.profile as FutureProfile;
        }
      }
    } catch (err) {
      console.error('[Radar] Failed to fetch remote profile:', err);
    }

    return loadProfile();
  };

  const loadDiscoveryHistory = async () => {
    try {
      const response = await fetch('/api/discoveries', {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.ok) {
        const result = await response.json();
        const items = Array.isArray(result.items) ? result.items as EvidenceRecord[] : [];
        localStorage.setItem(EVIDENCE_HISTORY_KEY, JSON.stringify(items));
        setEvidenceHistory(items);
        return;
      }
    } catch (err) {
      console.error('[Radar] Failed to fetch discoveries:', err);
    }

    try {
      const stored = localStorage.getItem(EVIDENCE_HISTORY_KEY);
      if (!stored) return;

      const history = JSON.parse(stored);
      if (!Array.isArray(history)) return;

      const validHistory = history
        .filter((item): item is EvidenceRecord => Boolean(item?.id && item?.sourceJudgment && item?.verificationGoal))
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      setEvidenceHistory(validHistory);
    } catch (err) {
      console.error('[Radar] 璇诲彇鍘嗗彶鍙戠幇澶辫触:', err);
    }
  };

  const loadFromCache = (currentProfileHash: string) => {
    try {
      const cachedRadar = localStorage.getItem(RADAR_KEY);
      const cachedCreatedAt = localStorage.getItem(RADAR_CREATED_AT_KEY);
      const cachedProfileHash = localStorage.getItem(RADAR_PROFILE_HASH_KEY);
      const cachedUserState = localStorage.getItem(RADAR_USER_STATE_KEY);
      
      if (cachedRadar) {
        if (cachedProfileHash === currentProfileHash) {
          setRadarData(JSON.parse(cachedRadar));
          setRadarCreatedAt(cachedCreatedAt || undefined);
          if (cachedUserState) {
            setUserState(JSON.parse(cachedUserState));
          }
          return true;
        } else {
          localStorage.removeItem(RADAR_KEY);
          localStorage.removeItem(RADAR_CREATED_AT_KEY);
          localStorage.removeItem(RADAR_PROFILE_HASH_KEY);
          localStorage.removeItem(RADAR_USER_STATE_KEY);
        }
      }
    } catch (err) {
      console.error('[Radar] 读取缓存失败:', err);
    }
    return false;
  };

  const saveToCache = (data: OpportunityRadarV4, currentProfileHash: string, state: UserStateProfile) => {
    try {
      const now = new Date().toISOString();
      localStorage.setItem(RADAR_KEY, JSON.stringify(data));
      localStorage.setItem(RADAR_CREATED_AT_KEY, now);
      localStorage.setItem(RADAR_PROFILE_HASH_KEY, currentProfileHash);
      localStorage.setItem(RADAR_USER_STATE_KEY, JSON.stringify(state));
      setRadarCreatedAt(now);
      setUserState(state);
    } catch (err) {
      console.error('[Radar] 保存缓存失败:', err);
    }
  };

  const loadRadar = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedProfile = await loadProfileForRadar();
      if (!loadedProfile) {
        setIsLoading(false);
        return;
      }

      setProfile(loadedProfile);

      const currentProfileHash = generateProfileHash(loadedProfile);

      const analyzedState = analyzeUserState(loadedProfile);
      setUserState(analyzedState);

      if (!forceRefresh && loadFromCache(currentProfileHash)) {
        setIsLoading(false);
        return;
      }

      setIsRegenerating(true);
      
      const changeSignals = getChangeSignalsForProfile(loadedProfile);
      
      const response = await fetch('/api/radar/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: loadedProfile,
          changeSignals: changeSignals,
          userStateProfile: analyzedState
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '生成失败');
      }

      setRadarData(result.data);
      saveToCache(result.data, currentProfileHash, analyzedState);
    } catch (err) {
      console.error('[Radar] 加载失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    loadRadar();
  }, []);

  useEffect(() => {
    loadDiscoveryHistory();
  }, [radarData]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(EVIDENCE_HISTORY_KEY);
      if (!stored) return;

      const history = JSON.parse(stored);
      if (!Array.isArray(history)) return;

      const validHistory = history
        .filter((item): item is EvidenceRecord => Boolean(item?.id && item?.sourceJudgment && item?.verificationGoal))
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      setEvidenceHistory(validHistory);
    } catch (err) {
      console.error('[Radar] 读取历史发现失败:', err);
    }
  }, [radarData]);

  const handleVerificationSubmitV2 = async (
    result: { outcome: ResultOption; userResult: string; userDiscovery: string }
  ) => {
    const coreInsight = radarData?.coreInsight;
    if (!tonightAction || !coreInsight) return;

    const previousImpact = getEvidenceImpact(latestEvidence);
    const currentAction = previousImpact
      ? {
          ...tonightAction,
          task: previousImpact.nextAction,
          platform: undefined,
          keywords: undefined,
          action: undefined,
          successCriteria: '寰楀埌涓€涓兘澶熸敮鎸併€佸墛寮辨垨鏀瑰彉褰撳墠鍒ゆ柇鐨勫叿浣撶粨鏋溿€?',
        }
      : tonightAction;
    const context = latestEvidence
      ? getVerificationContextForCategory(latestEvidence.category, currentAction.task)
      : getVerificationContext(currentAction);

    const payload: CreateDiscoveryInput = {
      radarCreatedAt: radarCreatedAt || null,
      sourceJudgment: radarData?.impactOnUser?.currentProblem || '',
      verificationGoal: context.goal,
      actionTitle: currentAction.task,
      category: context.category,
      outcomeCode: result.outcome.code,
      outcomeLabel: result.outcome.label,
      userResult: result.userResult,
      userDiscovery: result.userDiscovery,
    };

    try {
      let record: EvidenceRecord;
      const response = await fetch('/api/discoveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const saved = await response.json();
        record = saved.item as EvidenceRecord;
      } else if (response.status === 401) {
        const now = new Date().toISOString();
        record = {
          id: `${Date.now()}`,
          userId: 'local-cache',
          radarCreatedAt: payload.radarCreatedAt || null,
          sourceJudgment: payload.sourceJudgment,
          verificationGoal: payload.verificationGoal,
          actionTitle: payload.actionTitle,
          category: payload.category,
          outcomeCode: payload.outcomeCode,
          outcomeLabel: payload.outcomeLabel,
          userResult: payload.userResult,
          userDiscovery: payload.userDiscovery,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        throw new Error('Failed to save discovery');
      }

      const stored = localStorage.getItem(EVIDENCE_HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const history = Array.isArray(parsed) ? parsed : [];
      const nextHistory = [record, ...history];
      localStorage.setItem(EVIDENCE_HISTORY_KEY, JSON.stringify(nextHistory));
      setEvidenceHistory(nextHistory);
    } catch (err) {
      console.error('[Radar] Failed to save discovery:', err);
    }

    setVerificationPhase('recorded');
  };

  const handleVerificationSubmit = (
    result: { outcome: ResultOption; userResult: string; userDiscovery: string }
  ) => {
    const coreInsight = radarData?.coreInsight;
    if (!tonightAction || !coreInsight) return;

    const previousImpact = getEvidenceImpact(latestEvidence);
    const currentAction = previousImpact
      ? {
          ...tonightAction,
          task: previousImpact.nextAction,
          platform: undefined,
          keywords: undefined,
          action: undefined,
          successCriteria: '得到一个能够支持、削弱或改变当前判断的具体结果。',
        }
      : tonightAction;
    const context = latestEvidence
      ? getVerificationContextForCategory(latestEvidence.category, currentAction.task)
      : getVerificationContext(currentAction);

    const record: EvidenceRecord = {
      id: `${Date.now()}`,
      userId: 'local-cache',
      radarCreatedAt: radarCreatedAt || null,
      sourceJudgment: radarData?.impactOnUser?.currentProblem || '',
      verificationGoal: context.goal,
      actionTitle: currentAction.task,
      category: context.category,
      outcomeCode: result.outcome.code,
      outcomeLabel: result.outcome.label,
      userResult: result.userResult,
      userDiscovery: result.userDiscovery,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem(EVIDENCE_HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const history = Array.isArray(parsed) ? parsed : [];
      const nextHistory = [record, ...history];
      localStorage.setItem(EVIDENCE_HISTORY_KEY, JSON.stringify(nextHistory));
      setEvidenceHistory(nextHistory);
    } catch (err) {
      console.error('[Radar] 保存发现失败:', err);
    }

    setVerificationPhase('recorded');
  };

  const handleUpdateChanges = () => {
    setVerificationPhase('idle');
    loadRadar(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#007AFF] animate-spin" />
          <span className="text-sm text-[#6B7280]">正在加载...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-[#007AFF]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mb-3">你还没有创建未来分身</h2>
          <p className="text-sm text-[#6B7280] mb-8 leading-relaxed">
            FutureLens 需要先了解你是谁，才能为你生成专属的行动导航。
          </p>
          <Link
            href="/profile"
            className="ios-button-primary inline-flex items-center gap-2 px-8 py-3 text-base font-semibold"
          >
            创建我的未来分身
          </Link>
        </div>
      </div>
    );
  }

  if (error || !radarData) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-[#FF3B30]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mb-3">出了点问题</h2>
          <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">
            {error || '暂时无法生成这次判断'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpdateChanges}
              className="ios-button-primary inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              重新判断
            </button>
            <Link
              href="/profile"
              className="ios-button-secondary inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-medium"
            >
              编辑档案
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tonightAction = radarData.actions.find(a => a.time === '今晚') || radarData.actions[0];
  const latestEvidence = evidenceHistory[0] || null;
  const evidenceImpact = getEvidenceImpact(latestEvidence);
  const currentVerificationAction = latestEvidence && evidenceImpact
    ? {
        ...tonightAction,
        task: evidenceImpact.nextAction,
        platform: undefined,
        keywords: undefined,
        action: undefined,
        successCriteria: '得到一个能够支持、削弱或改变当前判断的具体结果。',
      }
    : tonightAction;
  const verificationContext = latestEvidence
    ? getVerificationContextForCategory(latestEvidence.category, currentVerificationAction.task)
    : getVerificationContext(currentVerificationAction);

  // V7.2 验证闭环
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="sticky top-0 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-[#E5E7EB] z-10">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#007AFF] text-sm font-medium">
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>返回</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#FF9500]/12 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#FF9500]" />
            </div>
            <span className="text-base font-semibold">FutureLens</span>
          </div>
          <button
            onClick={handleUpdateChanges}
            disabled={isRegenerating}
            aria-label="重新判断"
            title="重新判断"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-white transition-colors disabled:opacity-50"
          >
            {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 sm:py-10">
        <div className="mb-7">
          <p className="text-sm text-[#9CA3AF]">不用先想清楚全部，只确认下一件最重要的事。</p>
        </div>

        <div className="space-y-4">
          <CoreInsightCard
            coreInsight={radarData.coreInsight}
            latestEvidence={latestEvidence}
          />

          {latestEvidence && (
            <UpdatedJudgmentCard record={latestEvidence} />
          )}

          <RiskEngineCard
            risk30Days={radarData.impactOnUser?.risk30Days || '问题可能进一步积累'}
            risk90Days={radarData.impactOnUser?.risk90Days || '问题可能进一步恶化'}
            mostLikelyResult={radarData.impactOnUser?.mostLikelyResult || '问题持续存在'}
          />

          <VerificationGapCard
            context={verificationContext}
            latestEvidence={latestEvidence}
          />

          {tonightAction && (
            <TonightActionCard
              action={currentVerificationAction}
              phase={verificationPhase}
              onStart={() => setVerificationPhase('started')}
              onRecord={() => setVerificationPhase('recording')}
            />
          )}

          {verificationPhase === 'recording' && currentVerificationAction && (
            <RecordDiscoveryCard
              action={currentVerificationAction}
              context={verificationContext}
              onCancel={() => setVerificationPhase('started')}
              onSubmit={handleVerificationSubmitV2}
            />
          )}

          <RecentDiscoveriesCard records={evidenceHistory} />
        </div>

        <CollapsibleAnalysis>
          <TodayChangesCard changes={radarData.todayChanges} />
          <PersonalImpactCard personalImpact={radarData.personalImpact} />
          {userState && (
            <UserStateCard
              userState={userState}
              latestEvidence={latestEvidence}
            />
          )}
          {radarData.valueMigration && <ValueMigrationCard migration={radarData.valueMigration} />}
          {radarData.decisionExplanation && <DecisionTransparencyCard explanation={radarData.decisionExplanation} />}
          <ActionsCard actions={radarData.actions} />
          <FutureSelfCard
            message={radarData.futureSelfMessage}
            evidenceHistory={evidenceHistory}
          />
        </CollapsibleAnalysis>

        <div className="flex items-center justify-center gap-3 pt-8 pb-6">
          <Link href="/profile" className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
            更新我的情况
          </Link>
          <span className="text-[#D1D5DB]">·</span>
          <span className="text-xs text-[#9CA3AF]">结果可能会随着你的反馈改变</span>
        </div>
      </main>
    </div>
  );
}
