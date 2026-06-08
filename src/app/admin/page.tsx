'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, CheckCircle, ArrowLeft, Settings, Database, Lock } from 'lucide-react';
import Link from 'next/link';
import { generateCompleteNewsContent } from '@/lib/ai';
import { saveSingleNewsToStorage, generateId } from '@/lib/news-storage';

const AUTH_KEY = 'futurelens-admin-auth';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    source: '',
    content: '',
    tags: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  if (isChecking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse w-12 h-12 rounded-2xl bg-violet-500/20" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="max-w-sm w-full px-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-violet-400" />
              <h1 className="text-xl font-semibold">请输入管理密码</h1>
            </div>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="管理密码"
                autoFocus
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none transition-colors mb-4"
              />
              {authError && (
                <p className="text-sm text-red-400 mb-4">{authError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-medium rounded-xl transition-all"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setIsSuccess(false);

    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const generatedContent = await generateCompleteNewsContent(
        formData.title,
        formData.content,
        formData.source,
        tags
      );

      const newsItem = {
        id: generateId(),
        title: formData.title,
        source: formData.source,
        publishTime: new Date().toISOString().split('T')[0],
        content: formData.content,
        tags: tags,
        futureImpactScore: generatedContent.futureImpactScore.overallScore,
        impactSummary: generatedContent.impactSummary,
        atlasOpinion: generatedContent.atlasOpinion,
        logicOpinion: generatedContent.logicOpinion,
        echoOpinion: generatedContent.echoOpinion,
        impactAnalysis: generatedContent.impactAnalysis,
        futureImpactScoreDetails: generatedContent.futureImpactScore,
        isTop: false,
      };

      saveSingleNewsToStorage(newsItem);
      setIsSuccess(true);

      setTimeout(() => {
        router.push('/feed');
      }, 2000);
    } catch (error) {
      console.error('Failed to create news:', error);
      alert('创建失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-8 py-16">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">内容管理后台</h1>
            <p className="text-sm text-zinc-500">FutureLens 新闻管理系统</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/pipeline"
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-violet-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-medium">新闻管道</h3>
                <p className="text-xs text-zinc-500">自动抓取AI新闻</p>
              </div>
            </div>
          </Link>

          <Link
            href="/feed"
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-violet-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-medium">查看新闻</h3>
                <p className="text-xs text-zinc-500">浏览所有新闻</p>
              </div>
            </div>
          </Link>
        </div>

        {isSuccess ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-400 mb-2">创建成功！</h2>
            <p className="text-zinc-400">正在跳转到新闻流...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                新闻标题
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="请输入新闻标题..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                新闻来源
              </label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="例如：TechCrunch, The Verge..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                新闻正文
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={8}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                placeholder="请输入新闻正文内容..."
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                新闻标签
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="用逗号分隔，例如：AI创业, 技术发展, 机器学习"
              />
              <p className="text-xs text-zinc-500 mt-2">多个标签用英文逗号分隔</p>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI 正在生成...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>提交并生成 AI 内容</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
