import { XMLParser } from 'fast-xml-parser';
import type { RawNewsItem, NewsSource } from './types';

const RSS_FETCH_TIMEOUT = 10000;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) => {
    // 确保 item 和 category 始终是数组
    return name === 'item' || name === 'category';
  },
});

interface ParsedRSSItem {
  title?: string;
  link?: string | { '#text': string; '@_href'?: string };
  pubDate?: string;
  isoDate?: string;
  description?: string;
  'content:encoded'?: string;
  content?: string;
  summary?: string;
  category?: string | string[];
  author?: string;
  'dc:creator'?: string;
  guid?: string | { '#text': string };
}

function extractText(field: unknown): string {
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field !== null && '#text' in (field as any)) {
    return (field as any)['#text'] || '';
  }
  return '';
}

function extractCategories(cat: unknown): string[] {
  if (!cat) return [];
  if (typeof cat === 'string') return [cat];
  if (Array.isArray(cat)) return cat.map(c => (typeof c === 'string' ? c : extractText(c)));
  return [];
}

function parseRSSItems(xmlText: string): ParsedRSSItem[] {
  try {
    const parsed = xmlParser.parse(xmlText);

    // RSS 2.0: rss.channel.item
    // Atom: feed.entry
    let items: any[] = [];

    if (parsed?.rss?.channel?.item) {
      items = parsed.rss.channel.item;
    } else if (parsed?.feed?.entry) {
      items = parsed.feed.entry;
    } else if (parsed?.channel?.item) {
      items = parsed.channel.item;
    }

    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error('[RSS Parser] XML 解析失败:', error);
    return [];
  }
}

function convertToRawNewsItem(item: ParsedRSSItem, source: NewsSource): RawNewsItem | null {
  const title = extractText(item.title);
  const link = extractText(item.link);

  if (!title || !link) return null;

  // 解析发布日期
  const dateStr = item.isoDate || item.pubDate || '';
  let publishDate: Date;
  try {
    publishDate = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(publishDate.getTime())) {
      publishDate = new Date();
    }
  } catch {
    publishDate = new Date();
  }

  // 提取内容
  const content = extractText(item['content:encoded']) || extractText(item.content) || extractText(item.description) || '';
  const summary = extractText(item.description) || content.slice(0, 200);
  const categories = extractCategories(item.category);
  const author = extractText(item['dc:creator']) || extractText(item.author) || '';
  const guid = extractText(item.guid);

  return {
    id: `${source.id}-${guid || link || Date.now()}`,
    title,
    source: source.name,
    sourceUrl: source.url,
    link,
    publishDate,
    content,
    summary,
    categories: categories.length > 0 ? categories : undefined,
    author: author || undefined,
  };
}

export async function fetchRSSFeed(source: NewsSource): Promise<RawNewsItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RSS_FETCH_TIMEOUT);

    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const parsedItems = parseRSSItems(xmlText);

    const items: RawNewsItem[] = [];
    for (const item of parsedItems) {
      const rawItem = convertToRawNewsItem(item, source);
      if (rawItem) {
        items.push(rawItem);
      }
    }

    return items;
  } catch (error) {
    console.error(`[RSS Parser] 抓取失败 ${source.name}:`, error);
    return [];
  }
}

export async function fetchAllRSSFeeds(sources: NewsSource[]): Promise<Map<string, RawNewsItem[]>> {
  const results = new Map<string, RawNewsItem[]>();

  for (const source of sources) {
    if (!source.enabled || source.type !== 'rss') continue;

    const items = await fetchRSSFeed(source);
    results.set(source.id, items);
  }

  return results;
}
