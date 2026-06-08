import type { TopNewsItem } from "@/data/mockData";

export interface AIOpinion {
  title: string;
  content: string;
  icon: string;
  color: string;
}

export interface ImpactAnalysis {
  title?: string;
  summary?: string;
  aspects?: string[];
  recommendations?: string[];
  opportunities?: string[];
  risks?: string[];
  immediateActions?: string[];
  thisWeekActions?: string[];
  thisMonthActions?: string[];
}

export interface PersonaConfig {
  id: string;
  name: string;
  title: string;
  icon: string;
  color: string;
  personality: string;
  traits: string[];
  promptTemplate: string;
}

export interface FutureImpactScore {
  employmentImpact: number;
  entrepreneurshipImpact: number;
  learningImpact: number;
  enterpriseImpact: number;
  timeSensitivity: number;
  overallScore: number;
}

export const personaConfigs: Record<string, PersonaConfig> = {
  atlas: {
    id: "atlas",
    name: "Atlas",
    title: "Atlas前瞻观点",
    icon: "🔮",
    color: "violet",
    personality: "悲观现实主义的未来学家",
    traits: ["关注产业周期", "质疑市场泡沫", "警惕技术炒作", "长期视角"],
    promptTemplate: `
你是Atlas，一位悲观现实主义的未来学家。
你的核心特质：
- 关注产业周期和技术发展规律
- 经常质疑市场泡沫和过度炒作
- 以长期视角看待技术变革
- 不盲目乐观，善于发现潜在风险

请针对以下AI新闻事件，发表你的前瞻观点：
{news}

要求：
- 保持悲观现实主义立场
- 指出潜在的风险和挑战
- 分析产业周期影响
- 警惕可能的泡沫现象
- 语言专业但易懂
    `.trim(),
  },
  logic: {
    id: "logic",
    name: "Logic",
    title: "Logic深度分析",
    icon: "🧠",
    color: "blue",
    personality: "理性克制的技术研究员",
    traits: ["强调事实依据", "关注限制条件", "反对夸大宣传", "严谨分析"],
    promptTemplate: `
你是Logic，一位理性克制的技术研究员。
你的核心特质：
- 只基于事实和数据进行分析
- 强调技术的限制条件和边界
- 反对夸大宣传和过度承诺
- 保持客观中立的技术视角

请针对以下AI新闻事件，进行深度技术分析：
{news}

要求：
- 基于事实和技术原理进行分析
- 指出技术的实际能力边界
- 反对夸大宣传，揭示真实情况
- 保持理性克制，不情绪化
- 提供技术层面的深入见解
    `.trim(),
  },
  echo: {
    id: "echo",
    name: "Echo",
    title: "Echo大众视角",
    icon: "📣",
    color: "amber",
    personality: "普通人的代表",
    traits: ["关注就业影响", "关心收入变化", "在意生活变化", "语言口语化"],
    promptTemplate: `
你是Echo，代表普通大众的声音。
你的核心特质：
- 关注AI对普通人工作和生活的影响
- 关心就业机会和收入变化
- 用简单直白的口语化表达
- 代表大众的真实担忧和期待

请针对以下AI新闻事件，从普通人视角发表看法：
{news}

要求：
- 使用口语化、接地气的语言
- 关注对就业和收入的影响
- 讨论普通人能感受到的生活变化
- 表达真实的担忧和期待
- 避免专业术语，让所有人都能理解
    `.trim(),
  },
};

const atlasMockResponses: Record<string, AIOpinion> = {
  "1": {
    title: "Atlas前瞻观点",
    content: "OpenAI发布Agent SDK确实是重要进展，但我们必须保持警惕。历史告诉我们，每一次技术平台开放都会引发创业泡沫。虽然开发门槛降低了，但真正能存活下来的应用寥寥无几。现在涌入的创业者需要想清楚：你的Agent能解决什么真正的问题？还是只是又一个跟风产品？这个周期我们见过太多次了。",
    icon: "🔮",
    color: "violet",
  },
  "2": {
    title: "Atlas前瞻观点",
    content: "Google发布Gemini企业版，企业级AI市场看起来很热闹。但别忘了，企业软件的销售周期很长，客户迁移成本很高。现在很多公司只是在试水AI，真正愿意大规模投入的还是少数。这个市场正在变得拥挤，估值泡沫已经开始显现。建议创业者不要盲目跟风。",
    icon: "🔮",
    color: "violet",
  },
  "3": {
    title: "Atlas前瞻观点",
    content: "Anthropic开放新API能力，这确实能降低开发成本。但我们要问：低成本是否意味着低价值？当所有人都能用同样的API时，差异化在哪里？历史上每次技术民主化都会导致同质化竞争，最终只有少数真正有创新的玩家能存活。现在的繁荣可能只是下一轮洗牌的前奏。",
    icon: "🔮",
    color: "violet",
  },
};

const logicMockResponses: Record<string, AIOpinion> = {
  "1": {
    title: "Logic深度分析",
    content: "从技术角度看，Agent SDK本质上是将OpenAI现有的能力进行封装。它并没有突破大语言模型的根本限制：上下文窗口有限、推理能力存在边界、长程规划能力仍有不足。开发者需要清楚，Agent不是万能的，它只是一个工具。过度宣传可能会导致用户对实际能力产生不切实际的期待。",
    icon: "🧠",
    color: "blue",
  },
  "2": {
    title: "Logic深度分析",
    content: "Gemini企业版的核心优势在于多模态能力和Google的云基础设施。但必须指出，企业级部署存在诸多限制：模型成本依然很高、数据安全合规要求严格、定制化开发周期长。宣称的性能提升需要在真实业务场景中验证，建议企业在大规模部署前进行充分的POC测试，避免被宣传误导。",
    icon: "🧠",
    color: "blue",
  },
  "3": {
    title: "Logic深度分析",
    content: "新API能力的开放是技术发展的自然过程。需要强调的是，API调用存在速率限制和成本门槛，大规模应用需要考虑这些实际约束。此外，多API组合会增加系统复杂度和潜在故障点。开发者应该关注稳定性、成本优化和错误处理，而不仅仅是功能本身。",
    icon: "🧠",
    color: "blue",
  },
};

const echoMockResponses: Record<string, AIOpinion> = {
  "1": {
    title: "Echo大众视角",
    content: "说实话，这些技术对我们普通人来说太遥远了。我更关心的是：这个Agent SDK出来后，会不会让很多工作岗位消失？以后写代码、做客服的人是不是更容易被替代？还有，普通人能用上这些东西吗？会不会又是只有公司和专业人士才能用？希望别让技术越来越脱离普通人的生活。",
    icon: "📣",
    color: "amber",
  },
  "2": {
    title: "Echo大众视角",
    content: "Google又发新东西了，听起来很厉害的样子。但对我们打工人来说，最实际的问题是：公司会不会因为这个东西裁人？如果效率提升了，是不是意味着需要的人更少了？还有，这东西贵不贵？如果只有大公司用得起，那对我们小老百姓有什么好处呢？",
    icon: "📣",
    color: "amber",
  },
  "3": {
    title: "Echo大众视角",
    content: "API开放听起来挺好的，好像能让更多人用上AI。但我就想知道：这能帮我找到更好的工作吗？还是会让我的工作更不稳定？听说现在AI已经能写文案、做设计了，以后这些工作是不是都要被抢了？希望技术进步能带来更多机会，而不是让大家更焦虑。",
    icon: "📣",
    color: "amber",
  },
};

const impactAnalysisMock: Record<string, Record<string, ImpactAnalysis>> = {
  "1": {
    entrepreneur: {
      title: "对AI创业者的影响分析",
      summary: "Agent SDK的发布大幅降低了AI创业门槛，是进入AI应用领域的绝佳时机。",
      aspects: ["开发成本降低", "上市时间缩短", "差异化竞争加剧"],
      recommendations: [
        "立即评估Agent SDK的应用场景",
        "关注垂直领域的细分机会",
        "考虑构建AI工作流自动化工具",
        "储备prompt engineering人才",
      ],
    },
    learner: {
      title: "对AI学习者的影响分析",
      summary: "Agent开发将成为新的热门方向，建议学习相关技术栈。",
      aspects: ["技能需求变化", "学习路径更新", "实践机会增多"],
      recommendations: [
        "学习Agent架构设计",
        "掌握prompt工程技巧",
        "参与开源Agent项目",
        "关注AI安全和对齐问题",
      ],
    },
    professional: {
      title: "对职场人的影响分析",
      summary: "AI Agent将重塑工作流程，职场人需要适应新的工作方式。",
      aspects: ["工作效率提升", "技能要求变化", "职业发展转型"],
      recommendations: [
        "学习使用AI Agent工具",
        "提升数据分析能力",
        "关注所在行业的AI应用",
        "培养人机协作能力",
      ],
    },
    creator: {
      title: "对自媒体人的影响分析",
      summary: "AI Agent为内容创作提供了强大工具，内容生产方式将发生变革。",
      aspects: ["内容生产效率", "创作形式创新", "竞争格局变化"],
      recommendations: [
        "尝试AI辅助内容创作",
        "探索交互式内容形式",
        "建立个人AI助手工作流",
        "关注AI生成内容的版权问题",
      ],
    },
    custom: {
      title: "综合影响分析",
      summary: "AI Agent技术的发展将对多个领域产生深远影响。",
      aspects: ["技术创新", "产业变革", "社会影响"],
      recommendations: [
        "持续关注AI技术发展趋势",
        "评估自身领域的AI应用机会",
        "培养AI相关技能",
        "关注AI伦理和安全问题",
      ],
    },
  },
  "2": {
    entrepreneur: {
      title: "对AI创业者的影响分析",
      summary: "企业级AI市场竞争升级，创业者需要寻找差异化定位。",
      aspects: ["市场竞争加剧", "企业需求增长", "垂直细分机会"],
      recommendations: [
        "聚焦特定行业的AI解决方案",
        "考虑与大厂API集成",
        "关注企业数据安全需求",
        "探索AI+行业的深度融合",
      ],
    },
    learner: {
      title: "对AI学习者的影响分析",
      summary: "企业级AI技能需求增长，建议关注行业应用方向。",
      aspects: ["企业级应用技能", "行业知识整合", "解决方案设计"],
      recommendations: [
        "学习企业级AI部署",
        "了解行业合规要求",
        "参与企业AI项目实践",
        "关注垂直领域AI案例",
      ],
    },
    professional: {
      title: "对职场人的影响分析",
      summary: "企业AI应用加速，职场人需要适应AI驱动的工作环境。",
      aspects: ["工作方式转变", "技能要求提升", "职业发展新机会"],
      recommendations: [
        "学习所在企业的AI工具",
        "提升数据驱动决策能力",
        "关注AI在行业中的应用案例",
        "培养AI协作能力",
      ],
    },
    creator: {
      title: "对自媒体人的影响分析",
      summary: "企业级AI能力开放为内容创作提供了更强工具支持。",
      aspects: ["创作工具升级", "内容质量提升", "个性化内容生产"],
      recommendations: [
        "尝试企业级AI创作工具",
        "探索高质量内容生产",
        "建立内容创作工作流",
        "关注AI生成内容的差异化",
      ],
    },
    custom: {
      title: "综合影响分析",
      summary: "企业级AI市场的发展将推动整个AI生态的成熟。",
      aspects: ["技术普及", "产业升级", "生态完善"],
      recommendations: [
        "关注企业AI应用案例",
        "评估自身领域的AI机会",
        "学习AI商业应用知识",
        "建立AI应用的行业认知",
      ],
    },
  },
  "3": {
    entrepreneur: {
      title: "对AI创业者的影响分析",
      summary: "API能力开放降低了AI开发成本，有利于早期创业项目。",
      aspects: ["开发成本降低", "技术门槛降低", "创新速度加快"],
      recommendations: [
        "评估新API的应用场景",
        "快速原型验证商业假设",
        "关注API成本优化",
        "考虑多API组合策略",
      ],
    },
    learner: {
      title: "对AI学习者的影响分析",
      summary: "更开放的API为学习提供了更多实践机会。",
      aspects: ["实践机会增多", "学习门槛降低", "创新空间扩大"],
      recommendations: [
        "尝试调用新API开发应用",
        "参与API集成项目",
        "学习API设计和使用模式",
        "关注API生态发展",
      ],
    },
    professional: {
      title: "对职场人的影响分析",
      summary: "更多AI能力通过API开放，职场人可以更便捷地应用AI。",
      aspects: ["AI工具获取更便捷", "工作效率提升", "技能要求变化"],
      recommendations: [
        "学习使用新的AI API",
        "探索AI在工作中的应用",
        "提升技术整合能力",
        "关注AI工具的安全性",
      ],
    },
    creator: {
      title: "对自媒体人的影响分析",
      summary: "新API能力为内容创作提供了更多可能性。",
      aspects: ["创作工具扩展", "内容形式创新", "生产效率提升"],
      recommendations: [
        "尝试新API的创作能力",
        "探索创新内容形式",
        "建立AI辅助创作流程",
        "关注AI生成内容质量",
      ],
    },
    custom: {
      title: "综合影响分析",
      summary: "API开放是AI技术民主化的重要一步。",
      aspects: ["技术普及", "创新加速", "生态繁荣"],
      recommendations: [
        "关注AI API发展动态",
        "评估API在自身领域的应用",
        "学习API集成技术",
        "关注API安全和隐私",
      ],
    },
  },
};

const futureImpactScoreMock: Record<string, FutureImpactScore> = {
  "1": {
    employmentImpact: 5,
    entrepreneurshipImpact: 5,
    learningImpact: 4,
    enterpriseImpact: 4,
    timeSensitivity: 5,
    overallScore: 92,
  },
  "2": {
    employmentImpact: 3,
    entrepreneurshipImpact: 4,
    learningImpact: 3,
    enterpriseImpact: 5,
    timeSensitivity: 4,
    overallScore: 88,
  },
  "3": {
    employmentImpact: 4,
    entrepreneurshipImpact: 4,
    learningImpact: 4,
    enterpriseImpact: 3,
    timeSensitivity: 3,
    overallScore: 84,
  },
};

export async function generateAtlasOpinion(news: TopNewsItem): Promise<AIOpinion> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return atlasMockResponses[news.id] || atlasMockResponses["1"];
}

export async function generateLogicOpinion(news: TopNewsItem): Promise<AIOpinion> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return logicMockResponses[news.id] || logicMockResponses["1"];
}

export async function generateEchoOpinion(news: TopNewsItem): Promise<AIOpinion> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return echoMockResponses[news.id] || echoMockResponses["1"];
}

export async function generateImpactAnalysis(
  news: TopNewsItem,
  identity: string
): Promise<ImpactAnalysis> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const newsAnalysis = impactAnalysisMock[news.id];
  return newsAnalysis ? newsAnalysis[identity] || newsAnalysis.custom : impactAnalysisMock["1"].custom;
}

export async function generateFutureImpactScore(news: TopNewsItem): Promise<FutureImpactScore> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return futureImpactScoreMock[news.id] || futureImpactScoreMock["1"];
}

export function getPersonaPrompt(personaId: string, news: TopNewsItem): string {
  const config = personaConfigs[personaId];
  if (!config) {
    return "";
  }
  return config.promptTemplate.replace("{news}", JSON.stringify(news));
}

export interface GeneratedNewsContent {
  atlasOpinion: AIOpinion;
  logicOpinion: AIOpinion;
  echoOpinion: AIOpinion;
  impactAnalysis: ImpactAnalysis;
  futureImpactScore: FutureImpactScore;
  impactSummary: string;
}

export async function generateCompleteNewsContent(
  title: string,
  content: string,
  source: string,
  tags: string[]
): Promise<GeneratedNewsContent> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const newsItem = {
    id: "temp",
    title,
    source,
    publishTime: new Date().toISOString().split("T")[0],
    futureImpactScore: 0,
    impactSummary: "",
  };

  const [atlas, logic, echo, impact, score] = await Promise.all([
    generateAtlasOpinion(newsItem),
    generateLogicOpinion(newsItem),
    generateEchoOpinion(newsItem),
    generateImpactAnalysis(newsItem, "entrepreneur"),
    generateFutureImpactScore(newsItem),
  ]);

  return {
    atlasOpinion: atlas,
    logicOpinion: logic,
    echoOpinion: echo,
    impactAnalysis: impact,
    futureImpactScore: score,
    impactSummary: "AI事件对未来产生深远影响，需要关注相关变化。",
  };
}
