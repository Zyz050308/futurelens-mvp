const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const TEMPERATURE = 0.7;

export interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DeepSeekRequest {
  model?: string;
  messages: DeepSeekMessage[];
  temperature?: number;
}

export interface DeepSeekResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callDeepSeek(prompt: string): Promise<string> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API Key 未配置。请在 .env.local 文件中设置 DEEPSEEK_API_KEY');
  }

  const request: DeepSeekRequest = {
    model: DEEPSEEK_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: TEMPERATURE
  };

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API 错误: ${response.status} - ${errorText}`);
    }

    const data: DeepSeekResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('DeepSeek API 返回为空');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('[DeepSeek] API 调用失败:', error);
    throw error;
  }
}

export interface OpportunityRadar {
  name: string;
  score: number;
}

export interface ImpactReason {
  factor: string;
  impact: number;
  description: string;
}

export interface NewsAnalysis {
  title_cn: string;
  summary_cn: string;
  impact_summary: string;
  opportunities: OpportunityRadar[];
  reasons: ImpactReason[];
  atlas: string;
  logic: string;
  echo: string;
  impact: {
    opportunity: string;
    risk: string;
    today: string;
    week: string;
    month: string;
  };
}

export function buildAnalysisPrompt(
  identity: string,
  news: {
    title: string;
    summary?: string;
    content?: string;
  }
): string {
  return `你是 FutureLens 的 AI 分析系统。

FutureLens 是 AI时代的个人未来影响系统。

请基于以下新闻和用户身份，输出中文分析。

用户身份：
${identity}

新闻标题：
${news.title}

新闻摘要：
${news.summary || '无'}

新闻正文：
${news.content || news.summary || '无'}

请严格返回 JSON，不要 Markdown，不要解释。

JSON格式：

{
  "title_cn": "中文标题",
  "summary_cn": "中文摘要，80字以内",
  "impact_summary": "一句话说明这条新闻对该身份的影响，要具体、有洞察力，30字以内",
  "opportunities": [
    {"name": "机会主题1", "score": 92},
    {"name": "机会主题2", "score": 83},
    {"name": "机会主题3", "score": 78}
  ],
  "reasons": [
    {"factor": "因素名称1", "impact": 35, "description": "该因素的具体说明，一句话"},
    {"factor": "因素名称2", "impact": 25, "description": "该因素的具体说明，一句话"},
    {"factor": "因素名称3", "impact": 18, "description": "该因素的具体说明，一句话"},
    {"factor": "因素名称4", "impact": 9, "description": "该因素的具体说明，一句话"}
  ],
  "atlas": "Atlas观点。悲观现实主义未来学家，关注产业周期、泡沫、长期结构，120字以内",
  "logic": "Logic观点。理性技术研究员，关注技术限制、事实依据、落地难度，120字以内",
  "echo": "Echo观点。普通人代表，关注就业、收入、生活变化，口语化，120字以内",
  "impact": {
    "opportunity": "机会描述，具体说明对该身份的机会",
    "risk": "风险描述，具体说明对该身份的风险",
    "today": "今天可以做什么，具体可执行的行动",
    "week": "本周可以做什么，具体可执行的行动",
    "month": "本月可以做什么，具体可执行的行动"
  }
}

reasons说明：
- factor：影响因素的简短名称，如"AI成本下降"、"行业扩散"、"职业变化"、"监管变化"
- impact：该因素对Future Impact Score的贡献值，正整数，所有reasons的impact之和应接近Future Impact Score
- description：该因素的具体说明，基于新闻内容，一句话

reasons应从以下维度分析：
1. 技术成熟度（技术是否已经可用）
2. 行业扩散速度（是否正在快速扩散到多个行业）
3. 职业影响范围（是否影响大量工作岗位）
4. 监管变化（是否引发新的政策或法规）`;
}

export function parseAnalysisResponse(response: string): NewsAnalysis {
  try {
    let jsonStr = response.trim();
    
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/^```\s*/, '');
      jsonStr = jsonStr.replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonStr);
    
    if (!parsed.title_cn || !parsed.summary_cn || !parsed.impact_summary) {
      throw new Error('返回的 JSON 缺少必要字段');
    }

    if (!parsed.opportunities || !Array.isArray(parsed.opportunities)) {
      parsed.opportunities = [
        { name: 'AI应用', score: 75 },
        { name: '技术升级', score: 65 },
        { name: '流程优化', score: 55 },
      ];
    }

    if (!parsed.reasons || !Array.isArray(parsed.reasons)) {
      parsed.reasons = [
        { factor: '技术成熟度', impact: 30, description: '相关AI技术正在快速成熟。' },
        { factor: '行业扩散', impact: 25, description: '多个行业开始规模化采用。' },
        { factor: '职业影响', impact: 20, description: '部分工作流程将被自动化。' },
        { factor: '监管变化', impact: 10, description: '可能引发新的行业规范。' },
      ];
    }

    return parsed as NewsAnalysis;
  } catch (error) {
    console.error('[DeepSeek] JSON 解析失败:', error, '\n原始响应:', response);
    throw new Error('DeepSeek 返回的 JSON 格式无效');
  }
}

export interface TranslatedItem {
  title_cn: string;
  impact_summary: string;
}

export async function translateNewsBatch(
  items: { title: string; summary?: string; content?: string }[]
): Promise<TranslatedItem[]> {
  const emptyResult = items.map(() => ({ title_cn: '', impact_summary: '' }));

  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('[DeepSeek] API Key 未配置，跳过批量翻译');
    return emptyResult;
  }

  if (items.length === 0) return emptyResult;

  const newsList = items
    .map((item, i) => `${i + 1}. ${item.title}`)
    .join('\n');

  const prompt = `你是 FutureLens 的新闻翻译系统。FutureLens 是 AI时代的个人未来影响系统。

请将以下英文新闻标题翻译为完整流畅的中文标题，并为每条新闻生成一句话影响说明。

新闻标题列表：
${newsList}

请严格返回 JSON 数组，不要 Markdown 代码块，不要解释：
[
  {"title_cn": "完整中文标题", "impact_summary": "一句话说明这条新闻对普通人的影响，30字以内"},
  ...
]

要求：
1. title_cn 必须是完整流畅的中文句子，不是关键词替换
2. 翻译要准确传达原意，使用中文科技新闻常见表述
3. impact_summary 要具体、有洞察力，说明对普通人的实际影响
4. 数量必须与输入一致，共 ${items.length} 条`;

  try {
    const response = await callDeepSeek(prompt);
    let jsonStr = response.trim();

    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/^```\s*/, '');
      jsonStr = jsonStr.replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      return parsed.map((item: any, i: number) => ({
        title_cn: item.title_cn || items[i]?.title || '',
        impact_summary: item.impact_summary || '',
      }));
    }

    return emptyResult;
  } catch (error) {
    console.error('[DeepSeek] 批量翻译失败:', error);
    return emptyResult;
  }
}
