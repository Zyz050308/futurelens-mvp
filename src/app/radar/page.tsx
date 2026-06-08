'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronRight, Loader2, RefreshCw, AlertCircle, Zap, TrendingUp, TrendingDown, CheckCircle2, Calendar, Target, Shield, User, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { loadProfile } from '@/lib/radar';
import { getChangeSignalsForProfile, generateProfileHash } from '@/lib/changeEngine';
import { analyzeUserState } from '@/lib/stateEngine';
import type { FutureProfile, ChangeSignal, OpportunityRadarV4, TodayChange, ImpactOnUser, ActionItem, UserStateProfile, PersonalImpact, DecisionExplanation, ValueMigration, CoreInsight } from '@/types/radar';
import FutureSelfAvatar from '@/components/FutureSelfAvatar';

// ============================================================
// V6.5 核心模块1：你的真正问题（CoreInsight）
// ============================================================

interface CoreInsightCardProps {
  coreInsight?: CoreInsight;
}

function CoreInsightCard({ coreInsight }: CoreInsightCardProps) {
  if (!coreInsight) {
    return null;
  }

  const assumedProblem = coreInsight["你以为"];
  const actualProblem = coreInsight["实际上"];

  return (
    <div className="ios-card p-6 bg-gradient-to-br from-[#FF9500]/5 to-transparent border border-[#FF9500]/20">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#FF9500]/15 flex items-center justify-center">
          <Target className="w-4 h-4 text-[#FF9500]" />
        </div>
        <span className="text-xs text-[#FF9500] font-semibold uppercase tracking-wide">你的真正问题</span>
      </div>

      {/* 你以为 */}
      <div className="mb-4">
        <div className="text-xs text-[#9CA3AF] mb-1.5">你以为：</div>
        <div className="text-base text-[#6B7280] leading-relaxed">
          {assumedProblem}
        </div>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-[#E5E7EB] my-4" />

      {/* 实际上 */}
      <div>
        <div className="text-xs text-[#FF9500] font-semibold mb-1.5">实际上：</div>
        <div className="text-lg font-semibold text-[#1D1D1F] leading-relaxed">
          {actualProblem}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// V6.5 核心模块2：如果继续这样（Risk Engine）
// ============================================================

interface RiskEngineCardProps {
  risk: string;
}

function RiskEngineCard({ risk }: RiskEngineCardProps) {
  // 生成时间后果（基于 risk 内容推断）
  const generateTimeline = (riskText: string) => {
    return {
      day30: riskText.includes('失业') || riskText.includes('淘汰') 
        ? '可能面临降薪或被替代风险' 
        : riskText.includes('方向') || riskText.includes('迷茫')
        ? '可能继续原地踏步，错失机会窗口'
        : '问题可能进一步积累',
      day90: riskText.includes('失业') || riskText.includes('淘汰')
        ? '竞争力明显下降，求职困难'
        : riskText.includes('方向') || riskText.includes('迷茫')
        ? '机会窗口关闭，时间成本增加'
        : '修复难度增加，需要更多精力',
      worst: riskText.includes('失业') || riskText.includes('淘汰')
        ? '失去职场竞争力，进入被动状态'
        : riskText.includes('方向') || riskText.includes('迷茫')
        ? '形成习惯性拖延，难以突破'
        : '错过最佳行动时机'
    };
  };

  const timeline = generateTimeline(risk);

  return (
    <div className="ios-card p-6 bg-gradient-to-br from-[#FF3B30]/5 to-transparent border border-[#FF3B30]/20">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#FF3B30]/15 flex items-center justify-center">
          <TrendingDown className="w-4 h-4 text-[#FF3B30]" />
        </div>
        <span className="text-xs text-[#FF3B30] font-semibold uppercase tracking-wide">如果继续这样</span>
      </div>

      {/* 时间线 */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-xs font-semibold text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded flex-shrink-0">30天后</span>
          <span className="text-sm text-[#6B7280]">{timeline.day30}</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-xs font-semibold text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded flex-shrink-0">90天后</span>
          <span className="text-sm text-[#6B7280]">{timeline.day90}</span>
        </div>
      </div>

      {/* 最可能结果 */}
      <div className="mt-4 pt-4 border-t border-[#FF3B30]/20">
        <div className="text-xs text-[#FF3B30] font-semibold mb-1">最可能结果</div>
        <div className="text-sm font-medium text-[#1D1D1F]">{timeline.worst}</div>
      </div>
    </div>
  );
}

// ============================================================
// V6.5 核心模块3：今晚做什么（Action Engine - 只显示今晚）
// ============================================================

interface TonightActionCardProps {
  actions: ActionItem[];
  isCompleted: boolean;
  isCompleting: boolean;
  onComplete?: () => void;
}

function TonightActionCard({ actions, isCompleted, isCompleting, onComplete }: TonightActionCardProps) {
  // 找到今晚的行动
  const tonightAction = actions.find(a => a.time === '今晚');
  
  if (!tonightAction) {
    return null;
  }

  // 估算耗时（从 successCriteria 推断）
  const estimateTime = (criteria: string) => {
    if (criteria.includes('5分钟') || criteria.includes('5min')) return '5分钟';
    if (criteria.includes('15分钟') || criteria.includes('15min')) return '15分钟';
    if (criteria.includes('30分钟') || criteria.includes('30min')) return '30分钟';
    if (criteria.includes('1小时') || criteria.includes('1h')) return '1小时';
    return '30分钟'; // 默认
  };

  const estimatedTime = estimateTime(tonightAction.successCriteria);

  return (
    <div className="ios-card p-6 bg-gradient-to-br from-[#34C759]/5 to-transparent border border-[#34C759]/20">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#34C759]/15 flex items-center justify-center">
          <Clock className="w-4 h-4 text-[#34C759]" />
        </div>
        <span className="text-xs text-[#34C759] font-semibold uppercase tracking-wide">今晚做什么</span>
      </div>

      {/* 唯一任务 */}
      <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] mb-4">
        <div className="text-sm font-semibold text-[#1D1D1F] leading-relaxed">
          {tonightAction.task}
        </div>
      </div>

      {/* 耗时和完成标准 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#F9FAFB] rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-0.5">预计耗时</div>
          <div className="text-sm font-semibold text-[#1D1D1F]">{estimatedTime}</div>
        </div>
        <div className="bg-[#F9FAFB] rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-0.5">完成标准</div>
          <div className="text-xs font-medium text-[#34C759]">{tonightAction.successCriteria}</div>
        </div>
      </div>

      {/* 行动反馈按钮 */}
      {onComplete && (
        <button
          onClick={onComplete}
          disabled={isCompleted || isCompleting}
          className={`w-full py-3 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
            isCompleted
              ? 'bg-[#9CA3AF] cursor-not-allowed'
              : 'bg-[#34C759] hover:bg-[#34C759]/90'
          }`}
        >
          {isCompleting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              处理中...
            </>
          ) : isCompleted ? (
            '今天已完成'
          ) : (
            '我完成了'
          )}
        </button>
      )}
    </div>
  );
}

// ============================================================
// V6.5 完成反馈卡片
// ============================================================

function CompletionFeedbackCard() {
  return (
    <div className="ios-card p-6 bg-gradient-to-br from-[#007AFF]/5 to-[#AF52DE]/5 border border-[#007AFF]/20">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#34C759]/15 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
        </div>
        <span className="text-xs text-[#34C759] font-semibold uppercase tracking-wide">已完成今晚行动</span>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-[#6B7280] leading-relaxed">
          你今天完成的不是一个任务，而是一次价值迁移的开始。
        </p>
        <div className="bg-[#F9FAFB] rounded-lg p-4">
          <div className="text-xs text-[#9CA3AF] mb-1.5">状态变化</div>
          <div className="text-sm font-medium text-[#1D1D1F]">
            从「只知道问题」→「开始产生行动证据」
          </div>
        </div>
        <div className="bg-[#F9FAFB] rounded-lg p-4">
          <div className="text-xs text-[#9CA3AF] mb-1.5">明天第一步</div>
          <div className="text-sm font-medium text-[#1D1D1F]">
            基于今晚的结果，整理 3 条你发现的问题，并标记其中最容易改的一条。
          </div>
        </div>
      </div>
    </div>
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
        <span className="text-sm font-medium text-[#6B7280]">查看系统分析依据</span>
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
              <span className="text-xs text-[#34C759] font-semibold">增加的机会</span>
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
}

function UserStateCard({ userState }: UserStateCardProps) {
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
}

function FutureSelfCard({ message }: FutureSelfCardProps) {
  return (
    <div className="ios-card p-5 bg-gradient-to-br from-[#FF9500]/5 to-[#FF9500]/10 border border-[#FF9500]/20">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#FF9500]/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#FF9500]" />
        </div>
        <h2 className="text-base font-semibold">未来分身的提醒</h2>
      </div>
      <p className="text-sm text-[#1D1D1F] leading-relaxed">{message}</p>
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
const EXECUTION_HISTORY_KEY = 'futurelens-execution-history';

export default function RadarPage() {
  const [profile, setProfile] = useState<FutureProfile | null>(null);
  const [radarData, setRadarData] = useState<OpportunityRadarV4 | null>(null);
  const [userState, setUserState] = useState<UserStateProfile | null>(null);
  const [radarCreatedAt, setRadarCreatedAt] = useState<string | undefined>(undefined);
  const [profileHash, setProfileHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const checkIfCompleted = (radarCreatedAt: string | undefined, actionTitle: string) => {
    try {
      const historyJson = localStorage.getItem(EXECUTION_HISTORY_KEY);
      if (!historyJson) return false;
      
      const history = JSON.parse(historyJson);
      if (Array.isArray(history)) {
        return history.some(
          (item: any) => item.radarCreatedAt === radarCreatedAt && item.actionTitle === actionTitle
        );
      }
    } catch (err) {
      console.error('[Radar] 检查完成状态失败:', err);
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

      const loadedProfile = loadProfile();
      if (!loadedProfile) {
        setIsLoading(false);
        return;
      }

      setProfile(loadedProfile);

      const currentProfileHash = generateProfileHash(loadedProfile);
      setProfileHash(currentProfileHash);

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

  const handleActionComplete = () => {
    if (!radarData || !radarCreatedAt) return;
    
    const tonightAction = radarData.actions.find(a => a.time === '今晚');
    if (!tonightAction) return;

    // 估算耗时
    const estimateTime = (criteria: string) => {
      if (criteria.includes('5分钟') || criteria.includes('5min')) return '5分钟';
      if (criteria.includes('15分钟') || criteria.includes('15min')) return '15分钟';
      if (criteria.includes('30分钟') || criteria.includes('30min')) return '30分钟';
      if (criteria.includes('1小时') || criteria.includes('1h')) return '1小时';
      return '30分钟'; // 默认
    };

    setIsCompleting(true);

    setTimeout(() => {
      try {
        // 读取历史记录
        let history = [];
        const historyJson = localStorage.getItem(EXECUTION_HISTORY_KEY);
        if (historyJson) {
          const parsed = JSON.parse(historyJson);
          if (Array.isArray(parsed)) {
            history = parsed;
          }
        }

        // 添加新记录
        const newRecord = {
          completedAt: new Date().toISOString(),
          actionTitle: tonightAction.task,
          actionDuration: estimateTime(tonightAction.successCriteria),
          completionStandard: tonightAction.successCriteria,
          radarCreatedAt: radarCreatedAt,
          profileHash: profileHash
        };

        history.push(newRecord);

        // 保存回 localStorage
        localStorage.setItem(EXECUTION_HISTORY_KEY, JSON.stringify(history));
        setIsCompleted(true);
      } catch (err) {
        console.error('[Radar] 保存执行历史失败:', err);
      } finally {
        setIsCompleting(false);
      }
    }, 500);
  };

  useEffect(() => {
    loadRadar();
  }, []);

  // 检查完成状态
  useEffect(() => {
    if (radarData && radarCreatedAt) {
      const tonightAction = radarData.actions.find(a => a.time === '今晚');
      if (tonightAction) {
        const completed = checkIfCompleted(radarCreatedAt, tonightAction.task);
        setIsCompleted(completed);
      }
    }
  }, [radarData, radarCreatedAt]);

  const handleUpdateChanges = () => {
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
            {error || '无法生成 Opportunity Radar'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpdateChanges}
              className="ios-button-primary inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              更新今日变化
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

  const tonightAction = radarData.actions.find(a => a.time === '今晚');

  // V6.5 重构后的页面结构
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* 头部 */}
      <header className="sticky top-0 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-[#E5E7EB] z-10">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#007AFF] text-sm font-medium">
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>返回</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#007AFF]/20 to-[#007AFF]/5 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
            </div>
            <span className="text-base font-semibold">Opportunity Radar</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        {/* 操作按钮 */}
        <div className="flex gap-3 mb-6">
          <Link
            href="/profile"
            className="ios-button-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
          >
            编辑档案
          </Link>
          <button
            onClick={handleUpdateChanges}
            disabled={isRegenerating}
            className="ios-button-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            重新生成
          </button>
        </div>

        {/* ======================================================== */}
        {/* V6.5 核心内容区：问题 -> 后果 -> 行动 */}
        {/* ======================================================== */}
        <div className="space-y-4">
          {/* 模块1：你的真正问题（CoreInsight） */}
          <CoreInsightCard coreInsight={radarData.coreInsight} />

          {/* 模块2：如果继续这样（Risk Engine） */}
          <RiskEngineCard risk={radarData.impactOnUser?.risk || radarData.personalImpact?.risk || '问题可能进一步积累'} />

          {/* 模块3：今晚做什么（今晚行动） */}
          {tonightAction && (
            <TonightActionCard
              actions={radarData.actions}
              isCompleted={isCompleted}
              isCompleting={isCompleting}
              onComplete={handleActionComplete}
            />
          )}

          {/* 完成反馈卡片 */}
          {isCompleted && <CompletionFeedbackCard />}
        </div>

        {/* ======================================================== */}
        {/* V6.5 二级区域：系统分析依据（折叠） */}
        {/* ======================================================== */}
        <CollapsibleAnalysis>
          {/* 今日变化 */}
          <TodayChangesCard changes={radarData.todayChanges} />

          {/* 这对你意味着什么 */}
          <PersonalImpactCard personalImpact={radarData.personalImpact} />

          {/* 当前状态 */}
          {userState && <UserStateCard userState={userState} />}

          {/* 价值迁移 */}
          {radarData.valueMigration && <ValueMigrationCard migration={radarData.valueMigration} />}

          {/* 系统为什么这样判断 */}
          {radarData.decisionExplanation && <DecisionTransparencyCard explanation={radarData.decisionExplanation} />}

          {/* 完整行动清单 */}
          <ActionsCard actions={radarData.actions} />

          {/* 未来分身提醒 */}
          <FutureSelfCard message={radarData.futureSelfMessage} />
        </CollapsibleAnalysis>

        {/* 底部提示 */}
        <div className="text-center pt-8 pb-6">
          <p className="text-xs text-[#9CA3AF]">
            基于今日变化信号和你的档案生成
          </p>
        </div>
      </main>
    </div>
  );
}
