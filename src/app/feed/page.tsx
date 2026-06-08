'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, TrendingUp, Clock, ChevronRight, Zap, Settings, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useIdentity } from '@/hooks/use-identity';
import { loadNewsFromStorage, saveNewsToStorage, shouldRunToday, markAsRunToday } from '@/lib/news-pipeline/storage';
import { transformRawNewsToFull } from '@/lib/news-pipeline/transformer';

type UpdateStatus = 'idle' | 'checking' | 'updating' | 'success' | 'failed';

export default function FeedPage() {
  const router = useRouter();
  const { selectedIdentity, isLoading, clearIdentity } = useIdentity();
  const [newsList, setNewsList] = useState<any[]>([]);
  const [topNews, setTopNews] = useState<any[]>([]);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateMessage, setUpdateMessage] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Helper to format and render news - use title_cn and impact_summary
  const formatAndSetNews = useCallback((news: any[]) => {
    const formattedNews = news.map((n: any) => ({
      id: n.id,
      title: n.title, // transformer 已将 title 设为 title_cn
      originalTitle: n.originalTitle || '',
      source: n.source,
      publishTime: n.publishTime,
      impactSummary: n.impactSummary || '',
      tags: n.tags || [],
      futureImpactScore: n.futureImpactScore,
      impactAspects: [
        n.futureImpactScoreDetails?.employmentImpact >= 4 ? '就业影响' : '',
        n.futureImpactScoreDetails?.entrepreneurshipImpact >= 4 ? '创业机会' : '',
        n.futureImpactScoreDetails?.learningImpact >= 4 ? '学习价值' : '',
        n.futureImpactScoreDetails?.enterpriseImpact >= 4 ? '企业应用' : '',
      ].filter(Boolean),
    }));

    const topNewsData = news
      .filter((n: any) => n.isTop || n.futureImpactScore > 80)
      .sort((a: any, b: any) => b.futureImpactScore - a.futureImpactScore)
      .slice(0, 3)
      .map((n: any) => ({
        id: n.id,
        title: n.title,
        source: n.source,
        publishTime: n.publishTime,
        futureImpactScore: n.futureImpactScore,
        impactSummary: n.impactSummary || '',
      }));

    setNewsList(formattedNews);
    setTopNews(topNewsData);
    setIsInitialLoad(false);
  }, []);

  // Load existing news from pipeline storage only
  const loadExistingNews = useCallback(() => {
    const pipelineNews = loadNewsFromStorage();

    if (pipelineNews.length > 0) {
      formatAndSetNews(pipelineNews);
    } else {
      // No mock data fallback - show empty state
      setNewsList([]);
      setTopNews([]);
      setIsInitialLoad(false);
    }
  }, [formatAndSetNews]);

  // Auto update function
  const runAutoUpdate = useCallback(async () => {
    if (!shouldRunToday()) {
      setUpdateStatus('idle');
      return;
    }

    setUpdateStatus('checking');
    setUpdateMessage('正在检查今日AI新闻...');

    try {
      setUpdateStatus('updating');
      setUpdateMessage('正在更新今日AI新闻...');

      // Step 1: Fetch from API
      const response = await fetch('/api/pipeline/run', { method: 'POST' });
      if (!response.ok) throw new Error(`API failed: ${response.status}`);

      const data = await response.json();
      const rawItems = data.items || [];

      if (rawItems.length === 0) throw new Error('No news fetched');

      // Step 2: Transform first 10 items, filter out nulls
      const transformed = [];
      const itemsToProcess = rawItems.slice(0, 10);

      for (const item of itemsToProcess) {
        try {
          const rawItem = {
            ...item,
            publishDate: item.publishDate
          };
          const fullNews = await transformRawNewsToFull(rawItem);
          if (fullNews !== null) {
            transformed.push(fullNews);
          }
        } catch (err) {
          console.error('[Feed] 单条新闻转换失败:', err);
        }
      }

      if (transformed.length === 0) throw new Error('No news transformed');

      // Step 3: Save to storage
      saveNewsToStorage(transformed);
      markAsRunToday();

      // Step 4: Render
      formatAndSetNews(transformed);

      setUpdateStatus('success');
      setUpdateMessage('今日AI新闻已更新');

      setTimeout(() => {
        setUpdateStatus('idle');
        setUpdateMessage('');
      }, 3000);

    } catch (error) {
      console.error('[Feed] Auto update failed:', error);
      setUpdateStatus('failed');
      setUpdateMessage('更新失败，正在使用本地缓存');

      // Fallback to existing news
      loadExistingNews();

      setTimeout(() => {
        setUpdateStatus('idle');
        setUpdateMessage('');
      }, 5000);
    }
  }, [formatAndSetNews, loadExistingNews]);

  // Initial load
  useEffect(() => {
    if (!isLoading && !selectedIdentity) {
      router.push('/');
    }
  }, [isLoading, selectedIdentity, router]);

  useEffect(() => {
    if (selectedIdentity && isInitialLoad) {
      // First load existing news
      loadExistingNews();

      // Then check for auto update
      if (shouldRunToday()) {
        runAutoUpdate();
      }
    }
  }, [selectedIdentity, isInitialLoad, loadExistingNews, runAutoUpdate]);

  if (isLoading || !selectedIdentity) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500" />
        </div>
      </div>
    );
  }

  // Skeleton loading state
  const showSkeleton = isInitialLoad || (updateStatus === 'updating' && newsList.length === 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-8 py-16">
        <header className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">FutureLens</h1>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-500">当前身份：</span>
                <span className="text-sm font-medium text-violet-400">
                  {selectedIdentity.label}
                </span>
              </div>
              <button
                onClick={clearIdentity}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                <span>切换身份</span>
              </button>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              今日AI事件对你的影响
            </h2>
            <p className="text-lg text-zinc-500">
              基于你的身份筛选和解读
            </p>
          </div>

          {/* Status Bar */}
          {updateStatus !== 'idle' && (
            <div className="mt-6">
              <div className={`flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-full ${
                updateStatus === 'success'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : updateStatus === 'failed'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
              }`}>
                {updateStatus === 'checking' || updateStatus === 'updating' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : updateStatus === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>{updateMessage}</span>
              </div>
            </div>
          )}
        </header>

        {/* Skeleton Loading */}
        {showSkeleton && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
                正在加载今日AI新闻...
              </h3>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 animate-pulse">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-16 h-5 bg-zinc-800 rounded" />
                    <div className="w-20 h-4 bg-zinc-800 rounded" />
                  </div>
                  <div className="w-3/4 h-6 bg-zinc-800 rounded mb-3" />
                  <div className="w-full h-4 bg-zinc-800 rounded mb-2" />
                  <div className="w-2/3 h-4 bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state - no news at all */}
        {!showSkeleton && newsList.length === 0 && (
          <section className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-xl font-medium text-zinc-400 mb-3">暂无新闻数据</h3>
            <p className="text-sm text-zinc-600 mb-6">正在为你抓取今日AI新闻，请稍候...</p>
            <button
              onClick={() => {
                setUpdateStatus('updating');
                setUpdateMessage('正在更新今日AI新闻...');
                fetch('/api/pipeline/run', { method: 'POST' })
                  .then(res => res.json())
                  .then(async (data) => {
                    const rawItems = data.items || [];
                    const transformed = [];
                    for (const item of rawItems.slice(0, 10)) {
                      try {
                        const fullNews = await transformRawNewsToFull(item);
                        if (fullNews) transformed.push(fullNews);
                      } catch {}
                    }
                    if (transformed.length > 0) {
                      saveNewsToStorage(transformed);
                      markAsRunToday();
                      formatAndSetNews(transformed);
                    }
                    setUpdateStatus('success');
                    setUpdateMessage('新闻已更新');
                    setTimeout(() => { setUpdateStatus('idle'); setUpdateMessage(''); }, 3000);
                  })
                  .catch(() => {
                    setUpdateStatus('failed');
                    setUpdateMessage('更新失败，请稍后再试');
                    setTimeout(() => { setUpdateStatus('idle'); setUpdateMessage(''); }, 5000);
                  });
              }}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-xl text-sm font-medium transition-all"
            >
              手动刷新
            </button>
          </section>
        )}

        {/* Top News Section */}
        {!showSkeleton && topNews.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
                今日最重要AI事件
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topNews.map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.id}`}
                  className="group block bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 hover:border-violet-500/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                        {news.source}
                      </span>
                      <span className="text-xs text-zinc-600">{news.publishTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-violet-400">
                        {news.futureImpactScore}
                      </span>
                      <TrendingUp className="w-3 h-3 text-violet-400" />
                    </div>
                  </div>
                  <h4 className="text-base font-medium text-zinc-100 group-hover:text-white transition-colors mb-3">
                    {news.title}
                  </h4>
                  <p className="text-sm text-amber-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {news.impactSummary}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* News List */}
        {!showSkeleton && newsList.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-semibold mb-2">今日重要AI事件</h3>
                <p className="text-sm text-zinc-500">
                  所有AI新闻 · {newsList.length} 条
                </p>
              </div>
              <div className="text-xs text-zinc-600">
                实时更新 · 最后更新于 {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="space-y-4">
              {newsList.map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.id}`}
                  className="group block bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.01]"
                >
                  {/* 中文标题 */}
                  <h4 className="text-lg font-medium text-zinc-100 group-hover:text-white transition-colors mb-2">
                    {news.title}
                  </h4>

                  {/* 一句话影响 */}
                  <p className="text-sm text-amber-400 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {news.impactSummary}
                  </p>

                  {/* 标签 + Score + 查看详情 */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      {news.tags?.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="text-xs text-zinc-400 bg-zinc-800/50 px-2.5 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {news.impactAspects?.map((aspect: string, index: number) => (
                        <span
                          key={`aspect-${index}`}
                          className="text-xs text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full"
                        >
                          {aspect}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-violet-400">
                          {news.futureImpactScore}
                        </span>
                        <TrendingUp className="w-3 h-3 text-violet-400" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 group-hover:text-violet-400 transition-colors">
                        <span>查看详情</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-16 pt-8 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-600">
            &copy; 2025 FutureLens · AI时代的个人未来影响系统
          </p>
        </footer>
      </div>
    </div>
  );
}
