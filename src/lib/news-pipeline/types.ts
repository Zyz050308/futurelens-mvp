export interface RawNewsItem {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  link: string;
  publishDate: Date;
  content: string;
  summary?: string;
  categories?: string[];
  author?: string;
  imageUrl?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'scraper';
  url: string;
  config?: Record<string, any>;
  enabled: boolean;
}

export interface PipelineConfig {
  sources: NewsSource[];
  lastUpdated: Date;
  updateInterval: number;
  maxNewsPerSource: number;
  maxTotalNews: number;
}

export const DEFAULT_SOURCES: NewsSource[] = [
  {
    id: 'openai',
    name: 'OpenAI Blog',
    type: 'rss',
    url: 'https://openai.com/blog/rss.xml',
    enabled: true,
  },
  {
    id: 'google-ai',
    name: 'Google AI Blog',
    type: 'rss',
    url: 'https://blog.google/technology/ai/rss/',
    enabled: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic News',
    type: 'rss',
    url: 'https://www.anthropic.com/api/blog/rss.xml',
    enabled: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek Blog',
    type: 'rss',
    url: 'https://www.deepseek.com/blog/feed',
    enabled: true,
  },
  {
    id: 'tongyi',
    name: '阿里通义',
    type: 'rss',
    url: 'https://qwen.ai/feed',
    enabled: false,
  },
];
