import { fetchAllRSSFeeds } from './rss-parser';
import { transformRawNewsToFull } from './transformer';
import { DEFAULT_SOURCES, type RawNewsItem } from './types';
import type { FullNewsItem } from '@/lib/news-storage';

export interface PipelineStats {
  totalFetched: number;
  totalTransformed: number;
  failedSources: string[];
  successSources: string[];
  duration: number;
}

export class NewsPipeline {
  private static instance: NewsPipeline;
  private running: boolean = false;
  private lastUpdate: Date | null = null;
  private stats: PipelineStats | null = null;
  
  public static getInstance(): NewsPipeline {
    if (!NewsPipeline.instance) {
      NewsPipeline.instance = new NewsPipeline();
    }
    return NewsPipeline.instance;
  }
  
  public async run(): Promise<{ news: FullNewsItem[]; stats: PipelineStats }> {
    if (this.running) {
      throw new Error('Pipeline is already running');
    }
    
    this.running = true;
    const startTime = Date.now();
    const stats: PipelineStats = {
      totalFetched: 0,
      totalTransformed: 0,
      failedSources: [],
      successSources: [],
      duration: 0,
    };
    
    try {
      // 1. 抓取所有 RSS 源
      const rawNewsMap = await fetchAllRSSFeeds(DEFAULT_SOURCES);
      
      // 2. 收集和去重原始新闻
      const seenIds = new Set<string>();
      const rawNewsList: RawNewsItem[] = [];
      
      for (const [sourceId, items] of rawNewsMap) {
        if (items.length > 0) {
          stats.successSources.push(sourceId);
          stats.totalFetched += items.length;
          
          for (const item of items) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              rawNewsList.push(item);
            }
          }
        } else {
          stats.failedSources.push(sourceId);
        }
      }
      
      // 3. 转换新闻并按时间排序，过滤 nulls
      const fullNewsPromises = rawNewsList.slice(0, 20).map(item => 
        transformRawNewsToFull(item, 'entrepreneur')
      );
      
      const fullNewsListWithNulls = await Promise.all(fullNewsPromises);
      const fullNewsList = fullNewsListWithNulls.filter((item): item is FullNewsItem => item !== null);
      
      // 4. 按发布时间倒序排序
      fullNewsList.sort((a, b) => {
        const dateA = new Date(a.publishTime).getTime();
        const dateB = new Date(b.publishTime).getTime();
        return dateB - dateA;
      });
      
      stats.totalTransformed = fullNewsList.length;
      this.lastUpdate = new Date();
      
      stats.duration = Date.now() - startTime;
      this.stats = stats;
      
      return { news: fullNewsList, stats };
    } catch (error) {
      console.error('Pipeline run failed:', error);
      throw error;
    } finally {
      this.running = false;
    }
  }
  
  public isRunning(): boolean {
    return this.running;
  }
  
  public getLastUpdate(): Date | null {
    return this.lastUpdate;
  }
  
  public getStats(): PipelineStats | null {
    return this.stats;
  }
}

// 导出默认实例
export const pipeline = NewsPipeline.getInstance();
