'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowLeft, CheckCircle, XCircle, Trash2, Lock } from 'lucide-react';
import Link from 'next/link';
import { transformRawNewsToFull, selectTopNews } from '@/lib/news-pipeline/transformer';
import { loadNewsFromStorage, saveNewsToStorage } from '@/lib/news-pipeline/storage';
import { DEFAULT_SOURCES } from '@/lib/news-pipeline/types';

const AUTH_KEY = 'futurelens-admin-auth';
const isDev = process.env.NODE_ENV === 'development';
const MAX_ITEMS_TO_PROCESS = 10;

export default function PipelinePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [newsCount, setNewsCount] = useState(0);

  useEffect(() => {
    const saved = sessionStorage.getItem(AUTH_KEY);
    if (saved === 'true') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem(AUTH_KEY, 'true');
      } else {
        setAuthError(data.error || '密码错误');
      }
    } catch {
      setAuthError('验证失败，请重试');
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setLogs([]);

    try {
      addLog('开始运行新闻管道...');
      addLog(`Step 1: 调用 API 抓取新闻...`);

      const response = await fetch('/api/pipeline/run', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`API 错误: ${response.status}`);
      }

      const data = await response.json();
      addLog(`Step 1 完成: 从 ${data.results?.length || 0} 个源获取新闻`);
      
      const rawNewsList = data.items || [];
      addLog(`Step 1: 总共抓取到 ${rawNewsList.length} 条新闻`);
      addLog(`Step 1: 准备处理前 ${Math.min(MAX_ITEMS_TO_PROCESS, rawNewsList.length)} 条新闻`);

      if (rawNewsList.length > MAX_ITEMS_TO_PROCESS) {
        addLog(`Step 1: 跳过 ${rawNewsList.length - MAX_ITEMS_TO_PROCESS} 条新闻（仅处理前 ${MAX_ITEMS_TO_PROCESS} 条）`);
      }

      const itemsToProcess = rawNewsList.slice(0, MAX_ITEMS_TO_PROCESS);

      addLog('Step 2: 开始转换新闻格式...');

      const convertedNews = [];
      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i] as any;
        try {
          const rawItem = {
            ...item,
            publishDate: item.publishDate
          };
          const transformed = await transformRawNewsToFull(rawItem);
          if (transformed !== null) {
            convertedNews.push(transformed);
            
            if (isDev) {
              if (i < 3) {
                addLog(`  转换成功: ${transformed.title?.substring(0, 50) || 'N/A'}`);
              } else if (i === 3) {
                addLog(`  转换成功: ... 还有 ${convertedNews.length - 3} 条新闻`);
              }
            }
          }
        } catch (err) {
          addLog(`  转换失败: ${err}`);
        }
      }

      addLog(`Step 2 完成: 转换了 ${convertedNews.length} 条新闻`);

      const existingNews = loadNewsFromStorage();
      addLog(`Step 3: 已加载 ${existingNews.length} 条现有新闻`);

      const allNews = [...convertedNews, ...existingNews];
      
      const uniqueNews = [];
      const seen = new Set();
      for (const news of allNews) {
        const key = news.title + news.source;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueNews.push(news);
        }
      }

      uniqueNews.sort((a, b) => 
        new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()
      );

      const finalNews = uniqueNews.slice(0, 30);
      
      addLog(`Step 3: 保存 ${finalNews.length} 条唯一新闻（最多30条）`);
      saveNewsToStorage(finalNews);

      addLog('Step 4: 验证保存...');
      const saved = loadNewsFromStorage();
      addLog(`Step 4: 已保存 ${saved.length} 条新闻`);

      setNewsCount(saved.length);
      addLog('✅ 管道运行完成！');
    } catch (error) {
      console.error('管道运行错误:', error);
      addLog(`❌ 管道运行失败: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCheckStorage = () => {
    const news = loadNewsFromStorage();
    setNewsCount(news.length);
    
    setLogs([]);
    addLog('📦 检查当前存储的新闻...');
    addLog(`当前存储: ${news.length} 条新闻`);
    
    news.slice(0, 10).forEach((n, i) => {
      addLog(`  ${i+1}. ${n.title?.substring(0, 60) || 'N/A'} (${n.source})`);
    });
    
    if (news.length > 10) {
      addLog(`  ... 还有 ${news.length - 10} 条新闻`);
    }
  };

  const handleClearStorage = () => {
    if (confirm('确定要清空所有管道抓取的新闻吗？')) {
      saveNewsToStorage([]);
      setNewsCount(0);
      addLog('已清空所有存储的新闻');
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse w-12 h-12 rounded-2xl bg-amber-500/20" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="max-w-sm w-full px-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-semibold">请输入管理密码</h1>
            </div>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="管理密码"
                autoFocus
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition-colors mb-4"
              />
              {authError && (
                <p className="text-sm text-red-400 mb-4">{authError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all"
              >
                验证
              </button>
            </form>
            <button
              onClick={() => router.push('/')}
              className="w-full mt-3 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/feed">
            <button className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>返回新闻流</span>
            </button>
          </Link>
          {isDev && (
            <Link href="/admin">
              <button className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                管理后台
              </button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">新闻管道管理</h1>
            <p className="text-sm text-zinc-500">自动抓取、转换和存储AI新闻</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              管道控制
            </h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRunPipeline}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>运行中...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>运行新闻管道 (Debug)</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleCheckStorage}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium py-3 px-6 rounded-xl transition-all duration-300"
              >
                <CheckCircle className="w-5 h-5" />
                <span>查看当前存储</span>
              </button>

              <button
                onClick={handleClearStorage}
                className="w-full flex items-center justify-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 font-medium py-3 px-6 rounded-xl transition-all duration-300"
              >
                <Trash2 className="w-5 h-5" />
                <span>清空存储</span>
              </button>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-3">状态信息</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">存储新闻数量</span>
                <span className="text-2xl font-bold text-violet-400">{newsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">数据源</span>
                <span className="text-sm text-zinc-300">{DEFAULT_SOURCES.filter(s => s.enabled).length}/{DEFAULT_SOURCES.length}</span>
              </div>
              <div className="pt-3 border-t border-zinc-800">
                <p className="text-xs text-zinc-500">
                  自动标记精选新闻 (Score &gt; 80)
                </p>
              </div>
            </div>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              运行日志
            </h3>
            <div className="max-h-80 overflow-y-auto bg-zinc-950 rounded-lg p-4">
              <ul className="space-y-2">
                {logs.map((log, i) => (
                  <li key={i} className="text-sm text-zinc-400">
                    {log}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
