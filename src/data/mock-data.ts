export interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishTime: string;
  futureImpactScore: number;
  summary: string;
  impactAspects: string[];
}

export interface TopNewsItem {
  id: string;
  title: string;
  source: string;
  publishTime: string;
  futureImpactScore: number;
  impactSummary: string;
}

export interface IdentityOption {
  id: string;
  label: string;
  description: string;
}

export const identityOptions: IdentityOption[] = [
  {
    id: "entrepreneur",
    label: "AI创业者",
    description: "关注AI创业机会和商业应用",
  },
  {
    id: "learner",
    label: "AI学习者",
    description: "追踪AI技术发展和学习资源",
  },
  {
    id: "professional",
    label: "职场人",
    description: "了解AI对职业的影响和机遇",
  },
  {
    id: "creator",
    label: "自媒体人",
    description: "掌握AI创作工具和内容趋势",
  },
  {
    id: "custom",
    label: "自定义身份",
    description: "根据你的特定需求定制",
  },
];

export const topNews: TopNewsItem[] = [
  {
    id: "1",
    title: "OpenAI发布Agent SDK",
    source: "OpenAI",
    publishTime: "2026-06-02",
    futureImpactScore: 92,
    impactSummary: "AI创业门槛进一步降低",
  },
  {
    id: "2",
    title: "Google发布Gemini企业版",
    source: "Google",
    publishTime: "2026-06-02",
    futureImpactScore: 88,
    impactSummary: "企业AI竞争升级",
  },
  {
    id: "3",
    title: "Anthropic开放新API能力",
    source: "Anthropic",
    publishTime: "2026-06-02",
    futureImpactScore: 84,
    impactSummary: "AI开发成本下降",
  },
];

export const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "OpenAI发布GPT-5，性能提升300%",
    source: "TechCrunch",
    publishTime: "2小时前",
    futureImpactScore: 98,
    summary: "新一代大语言模型在推理能力和多模态理解方面实现重大突破",
    impactAspects: ["教育", "办公", "内容创作", "软件开发"],
  },
  {
    id: "2",
    title: "Anthropic推出Claude 4，主打AI安全与对齐",
    source: "The Verge",
    publishTime: "4小时前",
    futureImpactScore: 95,
    summary: "新一代Claude模型在安全性和实用性之间达到更好的平衡",
    impactAspects: ["AI安全", "企业应用", "医疗健康"],
  },
  {
    id: "3",
    title: "谷歌AI助手全面集成到Android系统",
    source: "Ars Technica",
    publishTime: "6小时前",
    futureImpactScore: 92,
    summary: "Gemini AI助手将成为Android设备的默认助手",
    impactAspects: ["移动端", "智能家居", "日常助手"],
  },
  {
    id: "4",
    title: "AI代码生成工具Cursor融资5亿美元",
    source: "VentureBeat",
    publishTime: "8小时前",
    futureImpactScore: 88,
    summary: "AI编程工具Cursor估值达25亿美元，成为AI编程领域新独角兽",
    impactAspects: ["软件开发", "效率工具", "创业机会"],
  },
  {
    id: "5",
    title: "Meta开源Llama 3.5，对标GPT-4",
    source: "Wired",
    publishTime: "12小时前",
    futureImpactScore: 90,
    summary: "Meta发布最强开源大模型，性能直逼闭源顶级模型",
    impactAspects: ["开源社区", "模型研究", "应用开发"],
  },
  {
    id: "6",
    title: "AI视频生成工具Sora正式向公众开放",
    source: "Engadget",
    publishTime: "14小时前",
    futureImpactScore: 93,
    summary: "OpenAI视频生成工具Sora开始向普通用户开放",
    impactAspects: ["视频创作", "内容创作", "影视行业"],
  },
  {
    id: "7",
    title: "特斯拉Optimus机器人进入量产阶段",
    source: "Reuters",
    publishTime: "18小时前",
    futureImpactScore: 85,
    summary: "特斯拉人形机器人将在2025年开始大规模生产",
    impactAspects: ["机器人", "制造业", "服务业"],
  },
  {
    id: "8",
    title: "微软Copilot全面升级，支持自然语言编程",
    source: "Microsoft Blog",
    publishTime: "20小时前",
    futureImpactScore: 91,
    summary: "微软Copilot新增自然语言编程功能，降低编程门槛",
    impactAspects: ["编程教育", "企业效率", "软件开发"],
  },
];
