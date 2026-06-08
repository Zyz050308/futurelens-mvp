import type { FullNewsItem } from '@/lib/news-storage';

const STORAGE_KEY = 'futurelens-pipeline-news';
const METADATA_KEY = 'futurelens-pipeline-meta';
const CACHE_VERSION = '2.0'; // 升级版本号，使旧英文缓存失效

export interface PipelineMetadata {
  lastRunDate?: string;
  lastUpdated?: Date | null;
  isRunning?: boolean;
  sourceCount?: number;
  totalNews?: number;
  version?: string;
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// 检查缓存版本，旧版本数据需要清除
function checkCacheVersion(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(METADATA_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.version !== CACHE_VERSION) {
        console.log('[Storage] 缓存版本不匹配，清除旧数据');
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(METADATA_KEY);
        // 同时清除旧的 news-storage 缓存
        localStorage.removeItem('futurelens_news');
        return false;
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function shouldRunToday(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(METADATA_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const today = getTodayDateString();
      return data.lastRunDate !== today || data.version !== CACHE_VERSION;
    }
    return true;
  } catch (error) {
    console.error('Failed to check if should run today:', error);
    return true;
  }
}

export function markAsRunToday(): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = loadMetadata();
    const updated: PipelineMetadata = {
      ...existing,
      lastRunDate: getTodayDateString(),
      lastUpdated: new Date(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(METADATA_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to mark as run today:', error);
  }
}

export function saveNewsToStorage(news: FullNewsItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(news));

    const metadata: PipelineMetadata = {
      lastRunDate: getTodayDateString(),
      lastUpdated: new Date(),
      isRunning: false,
      sourceCount: 5,
      totalNews: news.length,
      version: CACHE_VERSION,
    };
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('Failed to save news to storage:', error);
  }
}

export function loadNewsFromStorage(): FullNewsItem[] {
  if (typeof window === 'undefined') return [];

  try {
    // 检查缓存版本
    checkCacheVersion();

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load news from storage:', error);
  }
  return [];
}

export function loadMetadata(): PipelineMetadata {
  if (typeof window === 'undefined') {
    return {
      lastUpdated: null,
      isRunning: false,
      sourceCount: 0,
      totalNews: 0,
    };
  }

  try {
    const stored = localStorage.getItem(METADATA_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        ...data,
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : null,
      };
    }
  } catch (error) {
    console.error('Failed to load metadata from storage:', error);
  }

  return {
    lastUpdated: null,
    isRunning: false,
    sourceCount: 0,
    totalNews: 0,
  };
}

export function mergeNews(existing: FullNewsItem[], newNews: FullNewsItem[]): FullNewsItem[] {
  const map = new Map<string, FullNewsItem>();

  for (const item of existing) {
    map.set(item.id, item);
  }

  for (const item of newNews) {
    map.set(item.id, item);
  }

  return Array.from(map.values()).sort((a, b) =>
    new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()
  ).slice(0, 30);
}
