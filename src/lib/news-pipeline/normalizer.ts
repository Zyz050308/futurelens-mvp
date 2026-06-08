export interface NormalizedNews {
  title_cn: string;
  summary_cn: string;
  impact_summary: string;
}

const KEYWORD_MAP: Record<string, string> = {
  'launch': '发布',
  'releases': '发布',
  'announces': '宣布',
  'introducing': '推出',
  'unveils': '推出',
  'introduces': '推出',
  'debuts': '首次推出',
  'launches': '发布',
  'new': '新',
  'ai': 'AI',
  'model': '模型',
  'gpt': 'GPT',
  'gemini': 'Gemini',
  'claude': 'Claude',
  'llm': '大语言模型',
  'api': 'API',
  'sdk': 'SDK',
  'tool': '工具',
  'platform': '平台',
  'service': '服务',
  'feature': '功能',
  'update': '更新',
  'upgrade': '升级',
  'improvement': '改进',
  'performance': '性能',
  'efficiency': '效率',
  'speed': '速度',
  'cost': '成本',
  'enterprise': '企业',
  'developer': '开发者',
  'startup': '创业公司',
  'research': '研究',
  'safety': '安全',
  'alignment': '对齐',
  'capability': '能力',
  'training': '训练',
  'inference': '推理',
  'benchmark': '基准测试',
  'open source': '开源',
  'open-source': '开源',
  'multimodal': '多模态',
  'reasoning': '推理',
  'coding': '编程',
  'writing': '写作',
  'understanding': '理解',
  'generation': '生成',
};

const IMPACT_PATTERNS = [
  { pattern: /launch|release|introduce|announce|unveil|debut/i, impact: '重大发布' },
  { pattern: /api|sdk|tool|platform/i, impact: '开发者新工具' },
  { pattern: /enterprise|business|company/i, impact: '企业应用' },
  { pattern: /developer|startup|build/i, impact: '开发者机遇' },
  { pattern: /safety|alignment|ethics/i, impact: 'AI安全' },
  { pattern: /performance|speed|efficiency/i, impact: '性能提升' },
  { pattern: /cost|price|affordable/i, impact: '成本优化' },
  { pattern: /open source|open-source/i, impact: '开源社区' },
  { pattern: /multimodal|vision|audio/i, impact: '多模态突破' },
  { pattern: /reasoning|think|logic/i, impact: '推理能力提升' },
  { pattern: /research|paper|study/i, impact: '学术研究' },
];

function translateKeyword(text: string): string {
  let result = text;
  for (const [en, cn] of Object.entries(KEYWORD_MAP)) {
    result = result.replace(new RegExp(`\\b${en}\\b`, 'gi'), cn);
  }
  return result;
}

function translateToChinese(text: string): string {
  if (!text) return '';
  
  let result = text;
  result = translateKeyword(result);
  
  result = result.replace(/\s+/g, ' ').trim();
  
  if (result.length > 200) {
    result = result.substring(0, 200) + '...';
  }
  
  return result;
}

function generateImpactSummary(title: string, summary: string): string {
  const combined = `${title} ${summary}`;
  
  for (const { pattern, impact } of IMPACT_PATTERNS) {
    if (pattern.test(combined)) {
      return impact;
    }
  }
  
  if (combined.includes('AI') || combined.includes('人工智能')) {
    return 'AI领域动态';
  }
  
  return '值得关注的技术进展';
}

function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function normalizeNews(
  title: string,
  summary: string
): NormalizedNews {
  const title_cn = translateToChinese(title);
  const summary_cn = translateToChinese(summary);
  const impact_summary = generateImpactSummary(title, summary);
  
  return {
    title_cn,
    summary_cn,
    impact_summary,
  };
}

export function normalizeNewsWithOriginal(
  title: string,
  summary: string
): NormalizedNews & { original_title: string; original_summary: string } {
  const normalized = normalizeNews(title, summary);
  
  return {
    ...normalized,
    original_title: title,
    original_summary: summary,
  };
}
