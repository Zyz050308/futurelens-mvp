'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Brain,
  Megaphone,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  Radar,
  Info,
} from 'lucide-react';
import { useIdentity } from '@/hooks/use-identity';
import { getNewsById } from '@/lib/news-storage';
import { loadNewsFromStorage } from '@/lib/news-pipeline/storage';
import type { NewsAnalysis, OpportunityRadar, ImpactReason } from '@/lib/deepseek';

const AI_CACHE_PREFIX = 'futurelens-ai-analysis-';
const CACHE_VERSION = '1.4';

interface CachedAnalysis extends NewsAnalysis {
  version?: string;
}

function getAICacheKey(newsId: string, identity: string): string {
  return `${AI_CACHE_PREFIX}${newsId}-${identity}`;
}

function getAICache(newsId: string, identity: string): CachedAnalysis | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getAICacheKey(newsId, identity);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as CachedAnalysis;

    // 版本检查：旧缓存没有 version 或 reasons，需要失效
    if (parsed.version !== CACHE_VERSION || !parsed.reasons || parsed.reasons.length === 0) {
      console.log('[Detail] 旧版本缓存，已清除:', key);
      localStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function setAICache(newsId: string, identity: string, data: NewsAnalysis): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getAICacheKey(newsId, identity);
    const cached: CachedAnalysis = { ...data, version: CACHE_VERSION };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch {}
}

function clearAICache(newsId: string, identity: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getAICacheKey(newsId, identity));
  } catch {}
}

export default function NewsDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const newsId = pathname.split('/').pop() || '1';

  const { selectedIdentity } = useIdentity();
  const [news, setNews] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<NewsAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiError, setAiError] = useState<string>('');
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    const pipelineNews = loadNewsFromStorage();
    let foundNews: any = pipelineNews.find((n: any) => n.id === newsId);

    if (!foundNews) {
      foundNews = getNewsById(newsId) as any;
    }

    if (foundNews) {
      setNews(foundNews);
      fetchAIAnalysis(foundNews);
    }
  }, [newsId, selectedIdentity]);

  const fetchAIAnalysis = async (newsItem: any) => {
    setLoading(true);
    setAiError('');

    const identity = selectedIdentity?.label || '创业者';

    const cached = getAICache(newsItem.id, identity);
    if (cached) {
      console.log('[Detail] 使用 AI 分析缓存');
      setAiAnalysis(cached);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          news: {
            id: newsItem.id,
            title: newsItem.title || newsItem.originalTitle || '',
            summary: newsItem.summary || newsItem.impactSummary || '',
            content: newsItem.content || '',
          },
          identity,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const analysis = data.data as NewsAnalysis;
        setAiAnalysis(analysis);
        setAICache(newsItem.id, identity, analysis);
        console.log('[Detail] DeepSeek 分析完成，已缓存');
      } else {
        throw new Error(data.error || 'AI 分析返回异常');
      }
    } catch (error) {
      console.error('[Detail] AI 分析失败:', error);
      setAiError(error instanceof Error ? error.message : 'AI 分析失败');
      setAiAnalysis(buildFallbackAnalysis(newsItem));
    } finally {
      setLoading(false);
    }
  };

  const buildFallbackAnalysis = (newsItem: any): NewsAnalysis => {
    return {
      title_cn: newsItem.title || '无标题',
      summary_cn: newsItem.summary || newsItem.content?.substring(0, 80) || '',
      impact_summary: newsItem.impactSummary || '影响分析暂不可用',
      opportunities: [
        { name: 'AI应用', score: 75 },
        { name: '技术升级', score: 65 },
        { name: '流程优化', score: 55 },
      ],
      reasons: [
        { factor: '技术成熟度', impact: 30, description: '相关AI技术正在快速成熟。' },
        { factor: '行业扩散', impact: 25, description: '多个行业开始规模化采用。' },
        { factor: '职业影响', impact: 20, description: '部分工作流程将被自动化。' },
        { factor: '监管变化', impact: 10, description: '可能引发新的行业规范。' },
      ],
      atlas: newsItem.atlasOpinion?.content || 'Atlas观点暂不可用，请稍后再试。',
      logic: newsItem.logicOpinion?.content || 'Logic观点暂不可用，请稍后再试。',
      echo: newsItem.echoOpinion?.content || 'Echo观点暂不可用，请稍后再试。',
      impact: {
        opportunity: newsItem.impactAnalysis?.opportunities?.[0] || '暂无建议',
        risk: newsItem.impactAnalysis?.risks?.[0] || '暂无建议',
        today: newsItem.impactAnalysis?.immediateActions?.[0] || '暂无建议',
        week: newsItem.impactAnalysis?.thisWeekActions?.[0] || '暂无建议',
        month: newsItem.impactAnalysis?.thisMonthActions?.[0] || '暂无建议',
      },
    };
  };

  if (!news) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500">新闻不存在</div>
      </div>
    );
  }

  const impactScore = news.futureImpactScore || 60;
  const reasonsTotal = aiAnalysis?.reasons?.reduce((sum, r) => sum + r.impact, 0) || 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-8 py-16">
        {/* 顶部导航 */}
        <div className="flex items-center gap-6 mb-8">
          <Link
            href="/feed"
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </Link>
          {selectedIdentity && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">当前身份：</span>
              <span className="text-sm font-medium text-violet-400">
                {selectedIdentity.label}
              </span>
            </div>
          )}
        </div>

        {/* ====== 模块1: 未来影响指数（最顶部）====== */}
        <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-violet-400" />
                <span className="text-sm font-medium text-violet-400 uppercase tracking-wider">
                  Future Impact Score
                </span>
              </div>
              <p className="text-xs text-zinc-500">未来12个月影响强度</p>
            </div>
            <div className="text-right">
              <span className="text-7xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                {impactScore}
              </span>
            </div>
          </div>
          <div className="mt-4 relative h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000"
              style={{ width: `${impactScore}%` }}
            />
          </div>
          {/* 解释提示 */}
          <div className="mt-4 flex items-start gap-2 bg-violet-500/5 rounded-lg p-3">
            <Info className="w-4 h-4 text-violet-500/60 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-zinc-500 leading-relaxed">
              Future Impact Score 并非预测结果，而是系统根据
              <span className="text-violet-400/80">技术成熟度</span>、
              <span className="text-violet-400/80">行业扩散速度</span>、
              <span className="text-violet-400/80">职业影响范围</span>、
              <span className="text-violet-400/80">监管变化</span>
              综合评估得到。
            </p>
          </div>
        </div>

        {/* ====== 模块2: 一句话影响（核心）====== */}
        <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-8 mb-6 text-center">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-6">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              <span className="text-lg text-zinc-400">AI正在分析这条新闻对你的影响...</span>
            </div>
          ) : (
            <>
              <p className="text-2xl md:text-3xl font-medium text-zinc-100 leading-relaxed">
                {aiAnalysis?.impact_summary || news.impactSummary || '影响分析中...'}
              </p>
              <p className="text-sm text-violet-400 mt-4">
                对于{selectedIdentity?.label || '创业者'}的影响
              </p>
            </>
          )}
        </div>

        {/* ====== 模块3: 未来机会雷达 ====== */}
        {!loading && aiAnalysis && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Radar className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-violet-400">Future Opportunity Radar</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {(aiAnalysis.opportunities || []).map((opp: OpportunityRadar, idx: number) => (
                <div key={idx} className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 text-center">
                  <p className="text-sm font-medium text-zinc-200 mb-3">{opp.name}</p>
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-zinc-800" />
                      <circle
                        cx="32" cy="32" r="28"
                        stroke="url(#oppGradient)"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(opp.score / 100) * 175.84} 175.84`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="oppGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#d946ef" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-violet-400">{opp.score}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">机会强度</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====== 模块4: 影响依据（Why）====== */}
        {!loading && aiAnalysis && aiAnalysis.reasons && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-8 mb-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-violet-400">影响依据</h2>
              </div>
              <p className="text-xs text-zinc-500 ml-7">系统判断该事件会影响你的原因</p>
            </div>

            {/* 影响因素列表 */}
            <div className="space-y-4">
              {aiAnalysis.reasons.map((reason: ImpactReason, idx: number) => {
                const barWidth = reasonsTotal > 0 ? (reason.impact / reasonsTotal) * 100 : 25;
                return (
                  <div key={idx} className="bg-zinc-900/60 border border-zinc-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-200">{reason.factor}</span>
                      <span className="text-sm font-bold text-violet-400">+{reason.impact}</span>
                    </div>
                    {/* 影响值条 */}
                    <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{reason.description}</p>
                  </div>
                );
              })}
            </div>

            {/* 总和提示 */}
            <div className="mt-6 pt-4 border-t border-zinc-700/50 flex items-center justify-between">
              <span className="text-xs text-zinc-500">影响因素总和</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-violet-400">{reasonsTotal}</span>
                <span className="text-xs text-zinc-500">
                  ≈ Future Impact Score {impactScore}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ====== 模块5+6: 机会与风险 ====== */}
        {!loading && aiAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
              <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                机会
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed">{aiAnalysis.impact.opportunity}</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                风险
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed">{aiAnalysis.impact.risk}</p>
            </div>
          </div>
        )}

        {/* ====== 模块7: 下一步行动 ====== */}
        {!loading && aiAnalysis && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-violet-400">下一步行动</h2>
            </div>

            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-blue-500 to-amber-500" />

              <div className="space-y-6">
                {[
                  { label: 'Today', sublabel: '今天', content: aiAnalysis.impact.today, color: 'violet', dot: 'bg-violet-500' },
                  { label: 'Week', sublabel: '本周', content: aiAnalysis.impact.week, color: 'blue', dot: 'bg-blue-500' },
                  { label: 'Month', sublabel: '本月', content: aiAnalysis.impact.month, color: 'amber', dot: 'bg-amber-500' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-6 relative">
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full ${item.dot} flex items-center justify-center`}>
                        <span className="text-xs font-bold text-white">{item.label.charAt(0)}</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold ${
                          item.color === 'violet' ? 'text-violet-400' :
                          item.color === 'blue' ? 'text-blue-400' :
                          'text-amber-400'
                        }`}>
                          {item.label}
                        </span>
                        <span className="text-xs text-zinc-500">{item.sublabel}</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ====== 模块8: 未来学家 Atlas ====== */}
        {!loading && aiAnalysis && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-violet-500/20 rounded-lg p-2">
                <Eye className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-violet-400">未来学家 Atlas</h3>
                <p className="text-xs text-zinc-500">长期趋势视角</p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed mt-3">{aiAnalysis.atlas}</p>
          </div>
        )}

        {/* ====== 模块9: 研究员 Logic ====== */}
        {!loading && aiAnalysis && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-500/20 rounded-lg p-2">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-400">研究员 Logic</h3>
                <p className="text-xs text-zinc-500">技术与商业验证</p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed mt-3">{aiAnalysis.logic}</p>
          </div>
        )}

        {/* ====== 模块10: 普通人 Echo ====== */}
        {!loading && aiAnalysis && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-500/20 rounded-lg p-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-400">普通人 Echo</h3>
                <p className="text-xs text-zinc-500">生活与就业影响</p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed mt-3">{aiAnalysis.echo}</p>
          </div>
        )}

        {/* ====== 模块11: 新闻原文（默认折叠）====== */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden mb-8">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="w-full flex items-center justify-between p-6 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">查看原始新闻</span>
            </div>
            {showOriginal ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showOriginal && (
            <div className="px-6 pb-6 border-t border-zinc-800 pt-4">
              <h3 className="text-xl font-semibold text-zinc-100 mb-2">
                {aiAnalysis?.title_cn || news.title}
              </h3>

              {aiAnalysis?.title_cn && news.originalTitle && news.originalTitle !== aiAnalysis.title_cn && (
                <p className="text-sm text-zinc-500 mb-4">
                  原标题：{news.originalTitle}
                </p>
              )}

              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
                  {news.source}
                </span>
                <span className="text-xs text-zinc-500">{news.publishTime}</span>
              </div>

              {aiAnalysis?.summary_cn && (
                <p className="text-sm text-zinc-400 mb-4">{aiAnalysis.summary_cn}</p>
              )}

              {news.content && (
                <p className="text-sm text-zinc-500 leading-relaxed">{news.content}</p>
              )}
            </div>
          )}
        </div>

        {/* AI 错误提示 */}
        {!loading && aiError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-400">
              AI分析暂时不可用：{aiError}。当前显示为本地缓存内容。
            </p>
          </div>
        )}

        <footer className="pt-8 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-600">
            © 2025 FutureLens · AI时代的个人未来影响系统
          </p>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                const identity = selectedIdentity?.label || '创业者';
                clearAICache(news.id, identity);
                setAiAnalysis(null);
                fetchAIAnalysis(news);
              }}
              className="mt-3 text-xs text-zinc-600 hover:text-zinc-400 underline"
            >
              清除当前新闻当前身份AI缓存
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
