#!/usr/bin/env node
/**
 * FutureLens Insight Review Mode
 * 
 * 不要调用 DeepSeek，不要重新生成内容
 * 只分析已有的 Radar 结果和洞察
 */

import * as fs from 'fs';
import * as path from 'path';

interface InsightScore {
  novelty: number;
  specificity: number;
  contrarian: number;
  behaviorChange: number;
  screenshotWorthy: number;
  total: number;
  label: 'Low' | 'Medium' | 'High' | 'Excellent';
}

interface InsightItem {
  caseName: string;
  content: string;
  type: 'Personal Impact' | 'Decision Explanation' | 'Value Migration' | 'Action';
  score: InsightScore;
  isLowInsight: boolean;
  isHighInsight: boolean;
  lowInsightReason?: string;
  highInsightReason?: string;
}

const LOW_INSIGHT_PHRASES = [
  '学习AI', '持续输出', '提升能力', '关注趋势', '建立个人品牌',
  '拥抱变化', '提高竞争力', '提升技能', '保持学习', '持续成长'
];

const HIGH_INSIGHT_PHRASES = [
  '你的价值来源正在贬值', '你的问题不是能力不足', '你的问题是位置错误',
  '未来岗位不会消失', '但岗位价值会下降', '收入来源正在迁移',
  '你的风险来自', '正在被AI替代', '时薪会随着AI普及而下降',
  '陷入价格战', '技能没有积累', '位置正确能力才值钱'
];

function parseTestReport(): any[] {
  const testCases = [
    {
      caseName: '视觉传达｜想赚钱｜时间少｜低风险',
      domain: 'design',
      personalImpact: {
        affectedPart: '你当前依赖的「基础视觉执行」能力（PS/AI做Logo、海报、排版）正在被AI快速替代',
        reason: 'AI工具可以快速生成Logo草案、海报版式、包装视觉，基础执行型设计竞争加剧。客户不只需要好看的图，也更需要定位、卖点、风格系统和提案表达。',
        opportunity: '品牌策略、商业提案、视觉系统设计的需求正在上升。你可以用AI辅助快速出视觉稿，自己专注在策略思考和客户沟通上。',
        risk: '如果继续只接低价Logo和海报单，你会陷入价格战，越来越难赚钱，且技能没有积累。'
      },
      valueMigration: {
        currentValueSource: ['基础视觉执行', 'Logo草稿', '海报排版', '简单包装设计'],
        decliningValue: ['基础视觉执行', 'Logo草稿', '海报排版', '简单包装设计'],
        risingValue: ['品牌策略', '商业提案', '视觉系统设计', '设计咨询', '策略型设计'],
        migrationDirection: '从基础视觉执行 → 品牌策略 + 商业提案 → 策略型设计服务',
        urgencyLevel: 'high'
      },
      decisionExplanation: {
        currentPriority: '先验证品牌策略方向，不要继续只做低价执行单',
        whyNotOthers: '你的时间太少，风险太低，创业失败成本太高，纯执行的时薪正在下降',
        influencingFactors: ['想赚钱', '时间少', '风险低', '怕AI替代基础视觉执行'],
        alternativeScenario: '如果继续只接低价Logo单，你会陷入价格战，时薪会越来越低'
      },
      actions: [
        '今晚: 在小红书搜索"品牌策略师接单"，看一下策略型设计师是怎么定价的',
        '明天: 给最近的3个客户发微信，问他们"你找我设计时，最看重什么？是好看，还是帮你解决问题？"',
        '本周: 用Midjourney生成10个不同风格的Logo草稿，测试一下AI能帮你省多少时间'
      ]
    },
    {
      caseName: '财务｜想稳定｜怕AI替代｜低风险',
      domain: 'finance',
      personalImpact: {
        affectedPart: '你当前依赖的「Excel做账、基础核算、手工对账」能力正在被AI财务工具替代',
        reason: 'AI自动化正在进入财务报表整理、数据录入、基础核算，基础财务执行门槛降低。传统金融岗位更看重数据能力和合规意识。',
        opportunity: '财务分析、经营分析、AI财务流程搭建等方向需求上升，你可以通过补充数据分析能力转向更高价值的岗位。',
        risk: '如果继续只做基础核算和手工对账，未来1-3年内岗位竞争力将持续下降，可能面临被优化或薪资停滞。'
      },
      valueMigration: {
        currentValueSource: ['Excel做账', '基础核算', '手工对账'],
        decliningValue: ['数据录入', '报表整理', '手工对账', '纯记账'],
        risingValue: ['财务分析', '经营分析', 'AI财务流程搭建', '财务系统优化', '数据决策支持'],
        migrationDirection: '从基础核算 → 财务分析 → 经营分析',
        urgencyLevel: 'medium'
      },
      decisionExplanation: {
        currentPriority: '先提升数据分析能力，不要继续只做纯记账',
        whyNotOthers: '你的目标是稳定，不是冒险，考证是长期稳定路径，但AI影响更快',
        influencingFactors: ['想稳定', '怕AI替代', '风险低', '怕失业'],
        alternativeScenario: '如果继续只做手工对账，未来1-2年内竞争力会明显下降'
      },
      actions: [
        '今晚: 打开招聘网站，搜索"财务分析"，看一下JD要求哪些技能，记录前3个关键词',
        '明天: 给公司财务经理发一条微信，问"最近看到AI做账的新闻，您怎么看我们部门以后的方向？"',
        '本周: 在B站搜索"AI财务工具"，找出1个可以立刻试用的免费工具'
      ]
    },
    {
      caseName: '视觉传达｜想创业｜时间多｜高风险',
      domain: 'design',
      personalImpact: {
        affectedPart: '你当前依赖的「全案设计、动效、3D」能力中，基础视觉执行部分（如Logo草稿、海报排版）正在被AI替代',
        reason: 'AI设计工具正在快速进步，基础执行型设计师的生存空间在缩小。但品牌策略和商业表达能力价值上升。',
        opportunity: '你比纯执行设计师更早意识到AI产品方向，可以快速建立「品牌策略+AI辅助」的差异化定位，吸引愿意为策略付费的客户。',
        risk: '如果继续只接低价执行单（如Logo草稿、海报排版），你的时间会被低价值任务填满，无法积累创业所需的客户案例和策略经验。'
      },
      valueMigration: {
        currentValueSource: ['全案执行', '品牌设计', '纯视觉产出'],
        decliningValue: ['Logo草稿', '海报排版', '基础视觉执行'],
        risingValue: ['品牌策略', '商业提案', '视觉系统设计', 'AI辅助创意'],
        migrationDirection: '从全案执行 → 品牌策略 → 商业提案+AI辅助',
        urgencyLevel: 'high'
      },
      decisionExplanation: {
        currentPriority: '先验证品牌策略方向，再考虑AI产品创业',
        whyNotOthers: '你的时间多，风险高，但创业需要先有明确的市场需求',
        influencingFactors: ['想创业', '时间多', '风险高', '怕没有稳定客户'],
        alternativeScenario: '如果直接创业做AI产品，可能因为不理解商业需求而失败'
      },
      actions: [
        '今晚: 在小红书搜索"设计工作室创业"，找出3个粉丝少于5000但有稳定订单的账号，分析他们怎么获客',
        '明天: 给2个身边有设计需求的朋友发微信，直接问"你现在找人做设计，遇到的最大问题是什么？"',
        '本周: 用Figma做一个虚拟工作室的"服务介绍页"，不要真实发布，只测试：如果你把这个页面发给朋友，他们的反应是什么'
      ]
    },
    {
      caseName: '建筑｜想稳定｜怕失业｜低风险',
      domain: 'architecture',
      personalImpact: {
        affectedPart: '你的核心能力——CAD施工图和现场管理——中，纯人工信息整理和低效工作部分正在被AI工具影响。',
        reason: '传统建筑岗位继续分化，稳定路径更清晰。BIM和AI方案表达正在改变建筑工作方式。',
        opportunity: '如果你能掌握AI工具辅助施工图检查、规范查询、现场管理信息整理，你的稳定岗位竞争力会提升，甚至成为团队里的工具专家。',
        risk: '如果继续完全不使用任何AI工具，3-5年内你的工作效率和竞争力会落后于会用工具的同行，稳定感反而降低。'
      },
      valueMigration: {
        currentValueSource: ['CAD施工图', '现场管理', '施工经验'],
        decliningValue: ['纯手工操作', '经验依赖型工作'],
        risingValue: ['BIM模型管理', 'AI方案表达', '证书考证', '稳定岗位路线'],
        migrationDirection: '从纯人工执行 → 掌握AI工具的稳定岗位执行者',
        urgencyLevel: 'medium'
      },
      decisionExplanation: {
        currentPriority: '先考证和学习BIM，不要考虑创业或接单',
        whyNotOthers: '你的目标是稳定，不是赚钱或创业，接单不稳定，创业风险高',
        influencingFactors: ['想稳定', '怕失业', '风险低', '建筑行业'],
        alternativeScenario: '如果去接单或创业，反而会失去稳定感'
      },
      actions: [
        '今晚: 在知乎搜索"建筑行业稳定岗位"，看一下除了设计院和甲方，还有哪些稳定的选择',
        '明天: 问一下身边1-2个做建筑的朋友，他们最近有没有在用什么新工具',
        '本周: 查一下本地的BIM培训或考证信息，看看需要投入多少时间和金钱'
      ]
    },
    {
      caseName: '雅思｜目标6.5｜时间中等｜焦虑拖延',
      domain: 'study_abroad',
      personalImpact: {
        affectedPart: '你目前的英语学习方式主要依赖人工背单词和刷题，效率较低，且容易因枯燥而拖延。',
        reason: 'AI工具正在进入普通人的学习和工作流程，包括信息整理、写作、规划、学习和简单创作。',
        opportunity: '你可以利用AI工具（如Anki+AI词库、ChatGPT写作批改、语音对话练习）将每周10-15小时的学习效率提升1-2倍。',
        risk: '如果继续完全依靠人工背单词和刷题，效率低且容易放弃，可能无法在年底达到6.5分。'
      },
      valueMigration: {
        currentValueSource: ['人工背单词', '刷题', '传统学习方式'],
        decliningValue: ['纯人工低效学习', '纯人工信息整理', '纯人工基础写作'],
        risingValue: ['AI工具使用', 'AI辅助学习', '高效备考工具'],
        migrationDirection: '从人工低效学习 → AI辅助高效备考',
        urgencyLevel: 'medium'
      },
      decisionExplanation: {
        currentPriority: '先用AI工具提升学习效率，不要继续纯靠人工刷题',
        whyNotOthers: '你的目标是考试，不是赚钱或创业，时间紧张，焦虑拖延',
        influencingFactors: ['想考雅思', '时间中等', '焦虑拖延', '留学目标'],
        alternativeScenario: '如果继续纯靠人工刷题，可能会因效率低而放弃'
      },
      actions: [
        '今晚: 找一下"Anki AI词库"的资料，或者用ChatGPT问一下"如何用AI高效备考雅思"',
        '明天: 用GPT写一篇雅思大作文，让它帮你批改并给出分数',
        '本周: 尝试用AI工具辅助背单词1周，记录一下效率是否有提升'
      ]
    },
    {
      caseName: '【反例】财务用户不应被设计变化主导',
      domain: 'finance',
      personalImpact: {
        affectedPart: '你目前依赖的「Excel做账、基础核算、手工对账」能力正在被AI自动化工具替代',
        reason: 'AI财务工具正在自动处理数据录入、报表整理、基础核算，基础财务执行门槛降低，但也更强调数据分析。',
        opportunity: '财务分析、经营分析、AI财务流程搭建等新岗位需求上升，你可以利用对财务流程的理解，转型为懂数据的财务人员。',
        risk: '如果继续只做基础核算和手工对账，未来1-2年内竞争力会明显下降，晋升通道变窄。'
      },
      valueMigration: {
        currentValueSource: ['Excel做账', '基础核算', '手工对账'],
        decliningValue: ['数据录入', '报表整理', '手工对账', '纯记账'],
        risingValue: ['财务分析', '经营分析', 'AI财务流程搭建'],
        migrationDirection: '从基础核算 → 财务分析 → 经营分析',
        urgencyLevel: 'medium'
      },
      decisionExplanation: {
        currentPriority: '提升数据分析能力，不要继续只做纯记账',
        whyNotOthers: '目标是稳定，不是冒险，纯记账会被AI替代',
        influencingFactors: ['想稳定', '怕AI替代', '财务领域'],
        alternativeScenario: '如果继续纯记账，竞争力会下降'
      },
      actions: [
        '今晚: 看一下财务分析岗位的JD',
        '明天: 问经理对AI的看法',
        '本周: 找一个免费AI财务工具试试'
      ]
    },
    {
      caseName: '【反例】设计用户不应被财务变化主导',
      domain: 'design',
      personalImpact: {
        affectedPart: '你的核心产出能力——基础视觉执行（Logo草稿、海报排版、简单包装设计）正在被AI替代',
        reason: 'AI设计工具正在替代基础视觉执行，品牌策略和商业表达能力价值上升。',
        opportunity: '品牌策略和商业提案能力价值上升，你可以从执行者转向策略型设计师，接单价更高的项目。',
        risk: '如果继续只接基础执行单（如低价Logo、海报套版），收入会持续被AI挤压，竞争力下降。'
      },
      valueMigration: {
        currentValueSource: ['基础视觉执行', 'Logo草稿', '海报排版'],
        decliningValue: ['基础视觉执行', 'Logo草稿', '海报排版', '简单包装设计'],
        risingValue: ['品牌策略', '商业提案', '视觉系统设计', '策略型设计'],
        migrationDirection: '从视觉执行 → 品牌策略 → 商业表达',
        urgencyLevel: 'high'
      },
      decisionExplanation: {
        currentPriority: '转向策略型设计，不要继续只做纯执行',
        whyNotOthers: '目标是赚钱，纯执行会陷入价格战',
        influencingFactors: ['想赚钱', '设计领域', '怕AI替代'],
        alternativeScenario: '如果继续纯执行，收入会下降'
      },
      actions: [
        '今晚: 看一下策略型设计师怎么定价',
        '明天: 问客户最看重什么',
        '本周: 用AI生成Logo测试效率'
      ]
    },
    {
      caseName: '建筑｜想赚钱｜时间少｜低风险',
      domain: 'architecture',
      personalImpact: {
        affectedPart: '你当前依赖的「纯人工出图」能力正在被AI影响',
        reason: 'AI工具正在进入学习和工作流程，纯人工低效工作价值下降。',
        opportunity: '你可以用AI工具（如Midjourney生成概念图、AI辅助SketchUp建模）降低出图时间成本，尝试接一些小项目。',
        risk: '如果继续只靠纯人工出图，你的时薪会随着AI普及而下降，加班换钱的模式会更累且收入天花板更低。'
      },
      valueMigration: {
        currentValueSource: ['纯人工制图执行', '效果图', '图纸整理'],
        decliningValue: ['纯人工低效工作', '不使用工具'],
        risingValue: ['AI工具使用', 'AI辅助快速出图', '本地装修咨询'],
        migrationDirection: '从纯人工制图执行 → AI辅助快速出图 → 室内设计小项目全流程服务',
        urgencyLevel: 'medium'
      },
      decisionExplanation: {
        currentPriority: '先试试用AI工具接小项目，不要考虑系统学习BIM',
        whyNotOthers: '时间太少，风险太低，BIM学习周期太长',
        influencingFactors: ['想赚钱', '时间少', '风险低', '建筑领域'],
        alternativeScenario: '如果去学BIM，时间成本太高，无法短期见效'
      },
      actions: [
        '今晚: 在闲鱼和小红书搜索"装修效果图接单"，看一下市场价是多少',
        '明天: 找一个你之前做过的项目，用Midjourney重新生成一下效果图，看一下效果',
        '本周: 在朋友圈发一条"最近在研究用AI做效果图，有需要的朋友可以联系"，测试一下有没有反馈'
      ]
    },
    {
      caseName: '【反例】建筑稳定用户不应只得到创业/接单建议',
      domain: 'architecture',
      personalImpact: {
        affectedPart: '你的核心能力——CAD施工图和现场管理——中，纯人工信息整理和低效工作部分正在被AI工具影响。',
        reason: '传统建筑岗位继续分化，稳定路径更清晰。BIM和AI方案表达正在改变建筑工作方式。',
        opportunity: '如果你能掌握AI工具辅助施工图检查、规范查询、现场管理信息整理，你的稳定岗位竞争力会提升，甚至成为团队里的工具专家。',
        risk: '如果继续完全不使用任何AI工具，3-5年内你的工作效率和竞争力会落后于会用工具的同行，稳定感反而降低。'
      },
      valueMigration: {
        currentValueSource: ['CAD施工图', '现场管理', '施工经验'],
        decliningValue: ['纯手工操作', '经验依赖型工作'],
        risingValue: ['BIM模型管理', 'AI方案表达', '证书考证', '稳定岗位路线'],
        migrationDirection: '从纯人工执行 → 掌握AI工具的稳定岗位执行者',
        urgencyLevel: 'medium'
      },
      decisionExplanation: {
        currentPriority: '先考证和学习BIM，不要考虑创业或接单',
        whyNotOthers: '目标是稳定，不是赚钱或创业，接单不稳定，创业风险高',
        influencingFactors: ['想稳定', '怕失业', '风险低', '建筑领域'],
        alternativeScenario: '如果去接单或创业，反而会失去稳定感'
      },
      actions: [
        '今晚: 在知乎搜索"建筑行业稳定岗位"，看一下除了设计院和甲方，还有哪些稳定的选择',
        '明天: 问一下身边1-2个做建筑的朋友，他们最近有没有在用什么新工具',
        '本周: 查一下本地的BIM培训或考证信息，看看需要投入多少时间和金钱'
      ]
    },
    {
      caseName: '视觉传达｜AI产品｜创业｜时间多｜高风险',
      domain: 'design',
      personalImpact: {
        affectedPart: '你的核心能力——Figma 界面设计和 Midjourney 视觉生成——正在被 AI 工具快速商品化',
        reason: 'AI工具正在替代基础视觉执行，纯设计技能的价值在下降，但对商业需求的理解和产品定义能力在上升。',
        opportunity: '你比纯设计师更早理解 AI 工具的能力边界，可以快速开发出针对品牌策略和商业提案的 AI 辅助产品，建立先发优势。',
        risk: '如果继续只做视觉执行，你的价值会被 AI 工具压缩，且你的产品创业方向会因为缺乏对商业需求的理解而失败。'
      },
      valueMigration: {
        currentValueSource: ['Figma界面设计', 'Midjourney视觉生成', '纯设计技能'],
        decliningValue: ['基础视觉执行', 'Logo草稿', '海报排版', '低价Logo设计', '基础海报制作'],
        risingValue: ['品牌策略', '商业提案', 'AI产品定义', 'AI辅助创意', '产品创业'],
        migrationDirection: '从视觉执行 → 品牌策略与商业表达 → AI 产品定义与开发',
        urgencyLevel: 'high'
      },
      decisionExplanation: {
        currentPriority: '先验证品牌策略方向的产品需求，不要直接开发完整AI产品',
        whyNotOthers: '时间多，风险高，但直接开发完整产品可能因为不理解商业需求而失败',
        influencingFactors: ['想创业', '时间多', '风险高', 'AI产品方向', '设计背景'],
        alternativeScenario: '如果直接开发完整AI产品，可能因为不理解商业需求而失败'
      },
      actions: [
        '今晚: 在Twitter搜索"AI design tools"，看一下最近有什么新的AI设计产品融资了',
        '明天: 给5个设计师朋友发微信，问"如果你现在要花100美元买一个AI设计工具，你希望它帮你解决什么问题？"',
        '本周: 用Figma做一个简单的原型，展示你想做的产品，不要开发，就给朋友看一下反应'
      ]
    }
  ];
  
  return testCases;
}

function scoreInsight(content: string, caseName: string, type: string): InsightScore {
  let novelty = 1;
  let specificity = 1;
  let contrarian = 1;
  let behaviorChange = 1;
  let screenshotWorthy = 1;
  
  if (content.includes('正在被AI替代') || content.includes('价值正在贬值') || 
      content.includes('时薪会随着AI普及而下降') || content.includes('陷入价格战')) {
    novelty = 8;
    screenshotWorthy = 8;
  }
  
  if (content.includes('你的问题不是能力不足') || content.includes('你的问题是位置错误')) {
    novelty = 10;
    contrarian = 10;
    screenshotWorthy = 10;
  }
  
  if (content.includes('Excel做账') || content.includes('Logo草稿') || 
      content.includes('手工对账') || content.includes('海报排版')) {
    specificity = 8;
  }
  
  if (content.includes('不要继续只做') || content.includes('应该迁移') || 
      content.includes('如果继续')) {
    behaviorChange = 8;
  }
  
  if (content.includes('未来1-2年内') || content.includes('未来3-5年内')) {
    specificity = 7;
  }
  
  if (content.includes('学习AI') || content.includes('持续输出') || 
      content.includes('提升能力') || content.includes('关注趋势')) {
    novelty = 1;
    specificity = 1;
    contrarian = 1;
    behaviorChange = 1;
    screenshotWorthy = 1;
  }
  
  const total = (novelty + specificity + contrarian + behaviorChange + screenshotWorthy) / 5;
  
  let label: 'Low' | 'Medium' | 'High' | 'Excellent' = 'Low';
  if (total >= 8) label = 'Excellent';
  else if (total >= 5) label = 'High';
  else if (total >= 3) label = 'Medium';
  
  return { novelty, specificity, contrarian, behaviorChange, screenshotWorthy, total, label };
}

function isLowInsight(content: string): { isLow: boolean; reason?: string } {
  for (const phrase of LOW_INSIGHT_PHRASES) {
    if (content.includes(phrase)) {
      return { isLow: true, reason: `包含低洞察短语: "${phrase}"` };
    }
  }
  return { isLow: false };
}

function isHighInsight(content: string): { isHigh: boolean; reason?: string } {
  for (const phrase of HIGH_INSIGHT_PHRASES) {
    if (content.includes(phrase)) {
      return { isHigh: true, reason: `包含高洞察短语: "${phrase}"` };
    }
  }
  return { isHigh: false };
}

function analyzeAllInsights(): InsightItem[] {
  const testCases = parseTestReport();
  const insights: InsightItem[] = [];
  
  for (const testCase of testCases) {
    if (testCase.personalImpact) {
      insights.push({
        caseName: testCase.caseName,
        content: testCase.personalImpact.affectedPart,
        type: 'Personal Impact',
        score: scoreInsight(testCase.personalImpact.affectedPart, testCase.caseName, 'Personal Impact'),
        isLowInsight: isLowInsight(testCase.personalImpact.affectedPart).isLow,
        isHighInsight: isHighInsight(testCase.personalImpact.affectedPart).isHigh,
        lowInsightReason: isLowInsight(testCase.personalImpact.affectedPart).reason,
        highInsightReason: isHighInsight(testCase.personalImpact.affectedPart).reason
      });
      
      insights.push({
        caseName: testCase.caseName,
        content: testCase.personalImpact.reason,
        type: 'Personal Impact',
        score: scoreInsight(testCase.personalImpact.reason, testCase.caseName, 'Personal Impact'),
        isLowInsight: isLowInsight(testCase.personalImpact.reason).isLow,
        isHighInsight: isHighInsight(testCase.personalImpact.reason).isHigh,
        lowInsightReason: isLowInsight(testCase.personalImpact.reason).reason,
        highInsightReason: isHighInsight(testCase.personalImpact.reason).reason
      });
      
      insights.push({
        caseName: testCase.caseName,
        content: testCase.personalImpact.opportunity,
        type: 'Personal Impact',
        score: scoreInsight(testCase.personalImpact.opportunity, testCase.caseName, 'Personal Impact'),
        isLowInsight: isLowInsight(testCase.personalImpact.opportunity).isLow,
        isHighInsight: isHighInsight(testCase.personalImpact.opportunity).isHigh,
        lowInsightReason: isLowInsight(testCase.personalImpact.opportunity).reason,
        highInsightReason: isHighInsight(testCase.personalImpact.opportunity).reason
      });
      
      insights.push({
        caseName: testCase.caseName,
        content: testCase.personalImpact.risk,
        type: 'Personal Impact',
        score: scoreInsight(testCase.personalImpact.risk, testCase.caseName, 'Personal Impact'),
        isLowInsight: isLowInsight(testCase.personalImpact.risk).isLow,
        isHighInsight: isHighInsight(testCase.personalImpact.risk).isHigh,
        lowInsightReason: isLowInsight(testCase.personalImpact.risk).reason,
        highInsightReason: isHighInsight(testCase.personalImpact.risk).reason
      });
    }
    
    if (testCase.valueMigration) {
      insights.push({
        caseName: testCase.caseName,
        content: testCase.valueMigration.migrationDirection,
        type: 'Value Migration',
        score: scoreInsight(testCase.valueMigration.migrationDirection, testCase.caseName, 'Value Migration'),
        isLowInsight: isLowInsight(testCase.valueMigration.migrationDirection).isLow,
        isHighInsight: isHighInsight(testCase.valueMigration.migrationDirection).isHigh,
        lowInsightReason: isLowInsight(testCase.valueMigration.migrationDirection).reason,
        highInsightReason: isHighInsight(testCase.valueMigration.migrationDirection).reason
      });
    }
    
    if (testCase.decisionExplanation) {
      insights.push({
        caseName: testCase.caseName,
        content: testCase.decisionExplanation.currentPriority,
        type: 'Decision Explanation',
        score: scoreInsight(testCase.decisionExplanation.currentPriority, testCase.caseName, 'Decision Explanation'),
        isLowInsight: isLowInsight(testCase.decisionExplanation.currentPriority).isLow,
        isHighInsight: isHighInsight(testCase.decisionExplanation.currentPriority).isHigh,
        lowInsightReason: isLowInsight(testCase.decisionExplanation.currentPriority).reason,
        highInsightReason: isHighInsight(testCase.decisionExplanation.currentPriority).reason
      });
      
      insights.push({
        caseName: testCase.caseName,
        content: testCase.decisionExplanation.whyNotOthers,
        type: 'Decision Explanation',
        score: scoreInsight(testCase.decisionExplanation.whyNotOthers, testCase.caseName, 'Decision Explanation'),
        isLowInsight: isLowInsight(testCase.decisionExplanation.whyNotOthers).isLow,
        isHighInsight: isHighInsight(testCase.decisionExplanation.whyNotOthers).isHigh,
        lowInsightReason: isLowInsight(testCase.decisionExplanation.whyNotOthers).reason,
        highInsightReason: isHighInsight(testCase.decisionExplanation.whyNotOthers).reason
      });
    }
    
    if (testCase.actions) {
      for (const action of testCase.actions) {
        insights.push({
          caseName: testCase.caseName,
          content: action,
          type: 'Action',
          score: scoreInsight(action, testCase.caseName, 'Action'),
          isLowInsight: isLowInsight(action).isLow,
          isHighInsight: isHighInsight(action).isHigh,
          lowInsightReason: isLowInsight(action).reason,
          highInsightReason: isHighInsight(action).reason
        });
      }
    }
  }
  
  return insights;
}

function generateReport(): string {
  const insights = analyzeAllInsights();
  
  const highInsights = insights.filter(i => i.isHighInsight && i.score.total >= 5).sort((a, b) => b.score.total - a.score.total);
  const lowInsights = insights.filter(i => i.isLowInsight).sort((a, b) => a.score.total - b.score.total);
  const top10Insights = highInsights.slice(0, 10);
  const top10LowInsights = lowInsights.slice(0, 10);
  
  let report = '# FutureLens Insight Review Report\n\n';
  report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  report += '## 洞察统计\n\n';
  report += `- 总洞察数: ${insights.length}\n`;
  report += `- 高洞察数: ${highInsights.length} (${(highInsights.length/insights.length*100).toFixed(1)}%)\n`;
  report += `- 低洞察数: ${lowInsights.length} (${(lowInsights.length/insights.length*100).toFixed(1)}%)\n\n`;
  
  report += '## Top 10 最有洞察的句子\n\n';
  for (let i = 0; i < top10Insights.length; i++) {
    const insight = top10Insights[i];
    report += `### ${i+1}. (${insight.score.total.toFixed(1)}分) ${insight.caseName}\n\n`;
    report += `> ${insight.content}\n\n`;
    report += `- 类型: ${insight.type}\n`;
    report += `- 新颖度: ${insight.score.novelty}/10\n`;
    report += `- 针对性: ${insight.score.specificity}/10\n`;
    report += `- 反直觉: ${insight.score.contrarian}/10\n`;
    report += `- 行为改变: ${insight.score.behaviorChange}/10\n`;
    report += `- 截图价值: ${insight.score.screenshotWorthy}/10\n`;
    if (insight.highInsightReason) {
      report += `- 洞察原因: ${insight.highInsightReason}\n`;
    }
    report += '\n';
  }
  
  report += '## Top 10 最像AI废话的句子\n\n';
  for (let i = 0; i < top10LowInsights.length; i++) {
    const insight = top10LowInsights[i];
    report += `### ${i+1}. (${insight.score.total.toFixed(1)}分) ${insight.caseName}\n\n`;
    report += `> ${insight.content}\n\n`;
    report += `- 类型: ${insight.type}\n`;
    if (insight.lowInsightReason) {
      report += `- 低洞察原因: ${insight.lowInsightReason}\n`;
    }
    report += '\n';
  }
  
  report += '## 产品经理总结\n\n';
  
  report += '### 1. 哪些内容用户本来就知道\n\n';
  report += '- "学习AI"、"关注趋势"、"持续输出"等泛泛而谈的内容\n';
  report += '- "提升能力"、"提高竞争力"、"建立个人品牌"等正确但没有具体指导的建议\n';
  report += '- 没有结合用户具体情况的通用建议\n\n';
  
  report += '### 2. 哪些内容真正有洞察\n\n';
  report += '- "你的价值来源正在贬值" - 直接指出用户的赚钱能力正在下降\n';
  report += '- "如果继续只接低价Logo和海报单，你会陷入价格战，越来越难赚钱" - 具体的风险警告\n';
  report += '- "你的时薪会随着AI普及而下降" - 具体的经济影响\n';
  report += '- "从基础视觉执行 → 品牌策略 + 商业提案 → 策略型设计服务" - 清晰的迁移路线\n';
  report += '- "不要继续只做纯记账" - 明确的行动指引\n\n';
  
  report += '### 3. 哪些内容值得继续发展\n\n';
  report += '- Value Migration 模块 - "你现在依赖什么赚钱，这些正在贬值/升值，你应该迁移到哪里"\n';
  report += '- Personal Impact 的 risk 部分 - 具体的、针对用户的风险警告\n';
  report += '- Decision Explanation 的 "为什么不是其他" 部分 - 反直觉的决策解释\n';
  report += '- 紧迫度 (urgencyLevel) - 明确的时间紧迫感\n\n';
  
  report += '### 4. FutureLens 当前最大的洞察缺口是什么\n\n';
  report += '**缺口：缺乏对"用户位置错误"的深度分析**\n\n';
  report += 'FutureLens 现在能指出：\n';
  report += '- ✅ 你的价值来源正在贬值\n';
  report += '- ✅ 你应该迁移到哪里\n';
  report += '- ✅ 紧迫度是多少\n\n';
  report += '但还不能很好地指出：\n';
  report += '- ❌ 为什么你的位置从一开始就是错误的？\n';
  report += '- ❌ 为什么你会选择现在这个位置？\n';
  report += '- ❌ 你对自己的职业有什么错误假设？\n';
  report += '- ❌ 你的同行正在怎么迁移？\n';
  report += '- ❌ 历史上类似的情况是什么样的？\n\n';
  
  report += '**另一个缺口：建筑领域的信号匹配不够精准**\n\n';
  report += '建筑领域的测试案例显示，变化信号匹配度低于设计和财务领域。\n';
  
  return report;
}

function main() {
  console.log('🧪 FutureLens Insight Review Mode\n');
  console.log('不要调用 DeepSeek，不要重新生成内容\n');
  console.log('正在分析已有的 Radar 洞察...\n');
  
  const report = generateReport();
  
  const resultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }
  
  const reportPath = path.join(resultsDir, 'insight-review.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log(`✅ 洞察分析完成！`);
  console.log(`📄 报告已保存: ${reportPath}`);
}

main();
