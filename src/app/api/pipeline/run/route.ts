import { NextResponse } from 'next/server';
import type { RawNewsItem, NewsSource } from '@/lib/news-pipeline/types';
import { DEFAULT_SOURCES } from '@/lib/news-pipeline/types';
import { fetchRSSFeed } from '@/lib/news-pipeline/rss-parser';
import { translateNewsBatch } from '@/lib/deepseek';
import { isLegacyFeatureAllowed, LEGACY_DISABLED_ERROR } from '@/lib/legacyAccess';

async function fetchSource(source: NewsSource): Promise<{
  sourceId: string;
  sourceName: string;
  success: boolean;
  count: number;
  items: RawNewsItem[];
  error?: string;
}> {
  const startTime = Date.now();

  try {
    console.log(`\n[Step 1] 开始抓取 ${source.name}...`);
    console.log(`[Step 1] URL: ${source.url}`);

    const items = await fetchRSSFeed(source);

    const duration = Date.now() - startTime;
    console.log(`[Step 1] ✅ ${source.name} 抓取成功: ${items.length} 条 (${duration}ms)`);
    if (items.length > 0) {
      console.log(`[Step 1] 前3条标题:`);
      items.slice(0, 3).forEach((item, i) => {
        console.log(`[Step 1]   ${i + 1}. ${item.title.substring(0, 80)}...`);
      });
    }

    return {
      sourceId: source.id,
      sourceName: source.name,
      success: true,
      count: items.length,
      items,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Step 1] ❌ ${source.name} 抓取失败: ${errorMessage} (${duration}ms)`);

    return {
      sourceId: source.id,
      sourceName: source.name,
      success: false,
      count: 0,
      items: [],
      error: errorMessage,
    };
  }
}

export async function POST() {
  if (!isLegacyFeatureAllowed()) {
    return NextResponse.json({ error: LEGACY_DISABLED_ERROR }, { status: 403 });
  }

  console.log('\n========== [Pipeline] 开始执行 ==========\n');
  const startTime = Date.now();
  const results: Array<{
    sourceId: string;
    sourceName: string;
    success: boolean;
    count: number;
    error?: string;
  }> = [];
  const allItems: RawNewsItem[] = [];

  // Step 1: 抓取 RSS
  console.log('[Step 1] 开始逐个抓取RSS源...\n');

  for (const source of DEFAULT_SOURCES) {
    if (!source.enabled || source.type !== 'rss') continue;

    const result = await fetchSource(source);
    results.push(result);

    if (result.success && result.items.length > 0) {
      allItems.push(...result.items);
    }
  }

  const totalFetched = allItems.length;
  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;

  console.log('\n[Step 1] ========== RSS抓取汇总 ==========');
  console.log(`[Step 1] 总抓取数量: ${totalFetched} 条`);
  console.log(`[Step 1] 成功源: ${successCount} 个`);
  console.log(`[Step 1] 失败源: ${failedCount} 个`);

  // Step 2: DeepSeek 批量翻译（前15条）
  const TRANSLATE_COUNT = 15;
  const itemsToTranslate = allItems.slice(0, TRANSLATE_COUNT);

  console.log(`\n[Step 2] 开始 DeepSeek 批量翻译 (${itemsToTranslate.length} 条)...`);

  let translations: { title_cn: string; impact_summary: string }[] = [];
  try {
    translations = await translateNewsBatch(
      itemsToTranslate.map(item => ({
        title: item.title,
        summary: item.summary || item.content?.substring(0, 200),
        content: item.content?.substring(0, 300),
      }))
    );
    const translatedCount = translations.filter(t => t.title_cn).length;
    console.log(`[Step 2] ✅ 翻译完成: ${translatedCount}/${itemsToTranslate.length} 条成功`);
  } catch (error) {
    console.error('[Step 2] ❌ 批量翻译失败，使用原始标题:', error);
    translations = itemsToTranslate.map(() => ({ title_cn: '', impact_summary: '' }));
  }

  // 合并翻译结果到 items
  const mergedItems = allItems.map((item, i) => {
    if (i < TRANSLATE_COUNT && translations[i]) {
      return {
        ...item,
        title_cn: translations[i].title_cn || '',
        impact_summary: translations[i].impact_summary || '',
      };
    }
    return {
      ...item,
      title_cn: '',
      impact_summary: '',
    };
  });

  // 打印翻译结果
  console.log('\n[Step 2] 翻译结果预览:');
  mergedItems.slice(0, 5).forEach((item, i) => {
    console.log(`[Step 2]   ${i + 1}. ${item.title_cn || '(未翻译)'} | ${item.title.substring(0, 50)}`);
  });

  const duration = Date.now() - startTime;
  console.log(`\n[Pipeline] 执行完成! 总耗时: ${(duration / 1000).toFixed(2)}s`);
  console.log('========== [Pipeline] 结束 ==========\n');

  const summary = {
    totalFetched,
    successCount,
    failedCount,
    duration: Date.now() - startTime,
    results,
    items: mergedItems,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(summary);
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to run pipeline',
    endpoints: ['POST /api/pipeline/run'],
  });
}
