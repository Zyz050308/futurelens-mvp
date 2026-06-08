import type { AIOpinion, ImpactAnalysis, FutureImpactScore } from "@/lib/ai";

export interface FullNewsItem {
  id: string;
  title: string;
  originalTitle?: string;
  source: string;
  publishTime: string;
  content: string;
  summary?: string;
  tags: string[];
  futureImpactScore: number;
  impactSummary: string;
  atlasOpinion: AIOpinion;
  logicOpinion: AIOpinion;
  echoOpinion: AIOpinion;
  impactAnalysis: ImpactAnalysis;
  futureImpactScoreDetails: FutureImpactScore;
  isTop?: boolean;
  createdAt?: Date;
}

const STORAGE_KEY = "futurelens_news";

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getNewsById(id: string): FullNewsItem | undefined {
  const allNews = loadNewsFromStorage();
  return allNews.find((news) => news.id === id);
}

export function loadNewsFromStorage(): FullNewsItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed;
  } catch (error) {
    console.error('Error loading news from storage:', error);
    return [];
  }
}

export function saveNewsToStorage(news: FullNewsItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(news));
  } catch (error) {
    console.error('Error saving news to storage:', error);
  }
}

export function saveSingleNewsToStorage(newsItem: FullNewsItem): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existingNews = loadNewsFromStorage();
    const updatedNews = [newsItem, ...existingNews].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNews));
  } catch (error) {
    console.error('Error saving single news to storage:', error);
  }
}

export function formatNewsForFeed(news: FullNewsItem): any {
  return {
    id: news.id,
    title: news.title,
    source: news.source,
    publishTime: news.publishTime,
    summary: news.summary || news.content.substring(0, 150),
    tags: news.tags,
    futureImpactScore: news.futureImpactScore,
    impactSummary: news.impactSummary,
    isTop: news.isTop,
    impactAspects: [
      news.futureImpactScoreDetails.employmentImpact >= 4 ? '就业影响' : '',
      news.futureImpactScoreDetails.entrepreneurshipImpact >= 4 ? '创业机会' : '',
      news.futureImpactScoreDetails.learningImpact >= 4 ? '学习价值' : '',
      news.futureImpactScoreDetails.enterpriseImpact >= 4 ? '企业应用' : '',
    ].filter(Boolean),
  };
}

export function formatTopNewsForHome(news: FullNewsItem): any {
  return {
    id: news.id,
    title: news.title,
    source: news.source,
    publishTime: news.publishTime,
    futureImpactScore: news.futureImpactScore,
    impactSummary: news.impactSummary,
  };
}
