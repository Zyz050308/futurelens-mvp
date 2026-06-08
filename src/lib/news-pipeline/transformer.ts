import type { RawNewsItem } from './types';
import type { FullNewsItem } from '@/lib/news-storage';
import { generateId } from '@/lib/news-storage';
import { normalizeNews } from './normalizer';

const isDev = process.env.NODE_ENV === 'development';

function safeFormatDate(value: unknown): string {
  try {
    if (!value) {
      return new Date().toISOString().split('T')[0];
    }

    const date =
      value instanceof Date
        ? value
        : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }

    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function calculateImpactScore(title: string, content: string): number {
  let score = 60;
  
  const keywordGroups = [
    { keywords: ['发布', '推出', 'launch', 'release', 'announces', 'introducing', 'new', 'releases'], weight: 8 },
    { keywords: ['sdk', 'api', '新模型', '大模型', 'model', 'gpt', 'gemini', 'claude', 'llm', 'agent'], weight: 7 },
    { keywords: ['未来', '变革', '创新', 'revolution', 'transform', 'breakthrough'], weight: 5 },
    { keywords: ['创业者', '开发者', '企业', 'startup', 'developer', 'enterprise', 'business'], weight: 5 },
    { keywords: ['性能', '效率', '成本', 'performance', 'efficiency', 'cost', 'faster', 'better'], weight: 4 },
    { keywords: ['ai', 'artificial', 'intelligence', '人工智能', '机器学习'], weight: 3 },
  ];
  
  for (const group of keywordGroups) {
    for (const keyword of group.keywords) {
      if (title.toLowerCase().includes(keyword.toLowerCase()) || content.toLowerCase().includes(keyword.toLowerCase())) {
        score += group.weight;
      }
    }
  }
  
  return Math.min(Math.max(score, 50), 100);
}

function extractTags(title: string, content: string, categories?: string[]): string[] {
  const tags: string[] = [];
  
  if (categories && categories.length > 0) {
    tags.push(...categories.slice(0, 3));
  }
  
  const keywords = ['AI', '大模型', '模型', '创业', '开发者', '创新', 'GPT', 'LLM'];
  
  for (const keyword of keywords) {
    if (title.includes(keyword) || content.includes(keyword)) {
      if (!tags.includes(keyword)) {
        tags.push(keyword);
      }
    }
  }
  
  return tags.length > 0 ? tags : ['AI'];
}

function createDefaultOpinions(): {
  atlasOpinion: any;
  logicOpinion: any;
  echoOpinion: any;
} {
  return {
    atlasOpinion: {
      title: 'Atlas观点',
      content: '正在加载Atlas观点...',
      icon: '🔮',
      color: 'violet',
    },
    logicOpinion: {
      title: 'Logic观点',
      content: '正在加载Logic观点...',
      icon: '🧠',
      color: 'blue',
    },
    echoOpinion: {
      title: 'Echo观点',
      content: '正在加载Echo观点...',
      icon: '📣',
      color: 'amber',
    },
  };
}

function createDefaultImpactAnalysis(impactSummary: string): any {
  return {
    opportunities: ['新机会1', '新机会2'],
    risks: ['风险1'],
    immediateActions: ['今天可做1'],
    thisWeekActions: ['本周可做1'],
    thisMonthActions: ['本月可做1'],
  };
}

export async function transformRawNewsToFull(
  raw: any,
  identity: string = 'entrepreneur'
): Promise<FullNewsItem | null> {
  try {
    if (isDev) {
      console.log(`[Transformer] 转换新闻: ${(raw.title || '').substring(0, 60)}...`);
    }

    const normalized = normalizeNews(raw.title || '', raw.content || '');
    const overallScore = calculateImpactScore(raw.title || '', raw.content || '');

    // 优先使用 DeepSeek 预翻译的 title_cn 和 impact_summary
    const title_cn = raw.title_cn || normalized.title_cn || raw.title || '无标题';
    const impact_summary = raw.impact_summary || normalized.impact_summary || '值得关注的技术进展';

    if (isDev) {
      console.log(`[Transformer]   中文标题: ${title_cn.substring(0, 40)}`);
      console.log(`[Transformer]   一句话影响: ${impact_summary}`);
      console.log(`[Transformer]   Score: ${overallScore}`);
    }

    const opinions = createDefaultOpinions();

    const result: any = {
      id: generateId(),
      title: title_cn,
      source: raw.source || '未知来源',
      publishTime: safeFormatDate(raw.publishDate),
      content: raw.content || '',
      summary: normalized.summary_cn || (raw.content || '').substring(0, 150),
      tags: extractTags(raw.title || '', raw.content || '', raw.categories),
      futureImpactScore: overallScore,
      impactSummary: impact_summary,
      atlasOpinion: opinions.atlasOpinion,
      logicOpinion: opinions.logicOpinion,
      echoOpinion: opinions.echoOpinion,
      impactAnalysis: createDefaultImpactAnalysis(impact_summary),
      futureImpactScoreDetails: {
        employmentImpact: Math.floor(overallScore / 25) + 1,
        entrepreneurshipImpact: Math.floor(overallScore / 20) + 1,
        learningImpact: Math.floor(overallScore / 22) + 1,
        enterpriseImpact: Math.floor(overallScore / 20) + 1,
        timeSensitivity: 3,
        overallScore: overallScore,
      },
      isTop: overallScore > 80,
      originalTitle: raw.title || '',
    };

    if (isDev) {
      console.log(`[Transformer]   ✅ 转换成功`);
    }

    return result as FullNewsItem;
  } catch (error) {
    console.error('[Transformer] 单条新闻转换失败:', raw.title, error);
    return null;
  }
}

export function selectTopNews(news: FullNewsItem[], count: number = 3): FullNewsItem[] {
  const scored = news.map(item => ({
    ...item,
    _priority: item.isTop ? 1000 : item.futureImpactScore
  }));
  
  scored.sort((a, b) => b._priority - a._priority);
  
  return scored.slice(0, count);
}
