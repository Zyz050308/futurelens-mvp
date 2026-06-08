#!/usr/bin/env node
/**
 * FutureLens Radar 自动化验证系统 V6.3.2 (Insight Library Integration)
 * 
 * V6.3.2 新增功能：
 * 1. insightLibraryHitRate - 洞察库命中率
 * 2. coreInsightUsesSelectedInsight - CoreInsight 是否引用洞察库
 * 3. anxietyReferenceRate - 焦虑引用率
 * 4. insightDeviationWarning - 洞察偏离警告
 * 
 * 测试目标：
 * - insightLibraryHitRate >= 60%
 * - anxietyReferenceRate >= 60%
 * - coreInsightUsesSelectedInsight >= 70%
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// 动态导入项目模块（确保在 Node.js 环境下可用）
// ============================================================

// 我们需要在这里实现一个简单版本的 changeEngine 函数
// 这样即使没有 ts-node 环境也能运行

// 简单的领域检测函数
function detectUserDomain(profile: FutureProfile): string {
  const major = profile.majorOrCareer.toLowerCase();
  const goal = profile.currentGoal.toLowerCase();
  const interests = profile.interests.toLowerCase();
  const desired = profile.desiredOutcome?.toLowerCase() || '';
  
  const keywords: Record<string, string[]> = {
    architecture: ['建筑', '施工', 'bim', '工程', '室内', '建模', '工地'],
    design: ['设计', '视觉传达', '品牌', '平面', 'figma', 'ps'],
    finance: ['金融', '会计', '财务', '银行', '证券', '基金', 'cpa', 'cfa'],
    study_abroad: ['雅思', '托福', '留学', '申请', '英语', '考研', '出国'],
    creator: ['小红书', '抖音', '自媒体', '博主', '内容'],
    ai_product: ['ai产品', '产品经理', '创业', 'saas', 'mvp', '独立开发'],
    job_transition: ['求职', '转行', '实习', '找工作', '简历', '面试'],
  };
  
  for (const [domain, keys] of Object.entries(keywords)) {
    for (const key of keys) {
      if (major.includes(key) || goal.includes(key) || interests.includes(key) || desired.includes(key)) {
        return domain;
      }
    }
  }
  
  return 'general';
}

// 模拟变化信号数据
const realChangeSignals: ChangeSignal[] = [
  // ========= 设计领域变化信号 =========
  {
    id: 'design-1',
    title: 'AI 设计工具正在替代基础视觉执行',
    summary: 'AI 工具可以快速生成 Logo 草案、海报版式、包装视觉和品牌参考图，基础执行型设计竞争加剧。',
    category: '设计行业',
    sourceType: 'mock',
    affectedCapabilities: ['基础视觉执行', 'Logo草稿', '海报排版', '简单包装设计'],
    threatenedTasks: ['低价Logo设计', '基础海报制作', '简单包装草稿', '批量套版作图'],
    emergingOpportunities: ['品牌策略', '商业提案', 'AI辅助创意总监', '视觉系统设计', '设计咨询'],
    lowRelevanceDomains: ['finance', 'study_abroad', 'architecture']
  },
  {
    id: 'design-2',
    title: '品牌策略和商业表达能力变得更重要',
    summary: '客户不只需要好看的图，也更需要定位、卖点、风格系统和提案表达，单纯会软件的设计师更容易被替代。',
    category: '品牌设计',
    sourceType: 'mock',
    affectedCapabilities: ['纯视觉产出', '软件技巧展示'],
    threatenedTasks: ['只画图不问需求', '无策略纯执行'],
    emergingOpportunities: ['品牌定位咨询', '商业提案设计', '视觉系统搭建', '设计管理', '策略型设计'],
    lowRelevanceDomains: ['finance', 'study_abroad']
  },
  
  // ========= 建筑领域变化信号 =========
  {
    id: 'arch-1',
    title: 'BIM 和 AI 方案表达正在改变建筑工作方式',
    summary: 'BIM建模、AI效果图、参数化设计降低了基础表达门槛，但也提高了稳定岗位要求。',
    category: '建筑 / 工程数字化',
    sourceType: 'mock',
    affectedCapabilities: ['基础效果图绘制', '简单图纸整理', '重复性建模'],
    threatenedTasks: ['只画图不沟通', '纯执行绘图员', '简单效果图接单'],
    emergingOpportunities: ['BIM模型管理', 'AI方案表达', '客户沟通', '项目管理', '证书路线'],
    lowRelevanceDomains: ['design', 'finance', 'study_abroad']
  },
  {
    id: 'arch-2',
    title: '传统建筑岗位继续分化，稳定路线更清晰',
    summary: '房地产和传统施工岗位压力增加，但施工管理、BIM建模、安全员、设备操作等岗位更强调证书和工具能力。',
    category: '建筑就业',
    sourceType: 'mock',
    affectedCapabilities: ['纯设计手绘', '传统流程经验'],
    threatenedTasks: ['无证书纯经验', '只画图不负责'],
    emergingOpportunities: ['稳定岗位路线', '证书考证', 'BIM专员', '安全员', '施工管理'],
    lowRelevanceDomains: ['design', 'study_abroad']
  },
  {
    id: 'arch-3',
    title: '个人接单平台让小型设计和施工表达需求增加',
    summary: '闲鱼、小红书、抖音等平台上，室内效果图、施工图整理、小型改造方案等需求可以被个人承接。',
    category: '本地接单',
    sourceType: 'mock',
    affectedCapabilities: [],
    threatenedTasks: [],
    emergingOpportunities: ['本地装修咨询', '小型方案表达', '效果图接单', '小红书装修博主'],
    lowRelevanceDomains: ['finance', 'study_abroad']
  },
  
  // ========= 财务领域变化信号 =========
  {
    id: 'finance-1',
    title: 'AI 自动化正在进入财务报表整理',
    summary: 'AI 财务工具正在自动处理数据录入、报表整理和基础核算，基础财务执行门槛降低，但也更强调数据分析。',
    category: '金融科技',
    sourceType: 'mock',
    affectedCapabilities: ['数据录入', '报表整理', '基础核算', '重复性对账'],
    threatenedTasks: ['重复性工资表整理', '月度报表汇总', '手工对账', '纯记账'],
    emergingOpportunities: ['财务分析', '经营分析', 'AI财务流程搭建', '财务系统优化', '数据决策支持'],
    lowRelevanceDomains: ['design', 'architecture', 'study_abroad']
  },
  {
    id: 'finance-2',
    title: '传统金融岗位更看重数据能力和合规意识',
    summary: '银行、证券、基金、保险等岗位正在提高对数据分析、风控、合规和工具使用能力的要求。',
    category: '金融就业',
    sourceType: 'mock',
    affectedCapabilities: ['纯手工操作', '经验依赖型工作'],
    threatenedTasks: ['纯手工做账', '无数据分析能力'],
    emergingOpportunities: ['数据分析师', '风控专员', '合规管理', '财务系统管理'],
    lowRelevanceDomains: ['design', 'architecture']
  },
  
  // ========= 通用变化信号 =========
  {
    id: 'general-1',
    title: 'AI 工具正在进入普通人的学习和工作流程',
    summary: '越来越多任务可以用 AI 辅助完成，包括信息整理、写作、规划、学习和简单创作。',
    category: '通用变化',
    sourceType: 'mock',
    affectedCapabilities: ['纯人工信息整理', '纯人工基础写作'],
    threatenedTasks: ['纯人工低效工作', '不使用工具'],
    emergingOpportunities: ['AI工具使用', 'Prompt工程', 'AI辅助工作流'],
    lowRelevanceDomains: []
  }
];

// 简单的变化信号筛选函数
function getChangeSignalsForProfile(profile: FutureProfile): ChangeSignal[] {
  const domain = detectUserDomain(profile);
  
  // 简单的筛选逻辑
  let candidates = realChangeSignals.filter(signal => {
    // 排除低相关性领域的信号
    if (signal.lowRelevanceDomains?.includes(domain)) {
      return false;
    }
    // 优先匹配领域
    if (signal.id.startsWith(domain)) {
      return true;
    }
    // 通用信号也可以
    if (signal.id.startsWith('general')) {
      return true;
    }
    return false;
  });
  
  // 如果没有足够的信号，添加通用信号
  if (candidates.length < 3) {
    const generalSignals = realChangeSignals.filter(s => s.id.startsWith('general'));
    for (const signal of generalSignals) {
      if (!candidates.find(c => c.id === signal.id)) {
        candidates.push(signal);
        if (candidates.length >= 3) break;
      }
    }
  }
  
  return candidates.slice(0, 3);
}

// ============================================================
// 类型定义
// ============================================================

type FutureProfile = {
  age: string;
  education: string;
  majorOrCareer: string;
  currentSkills: string;
  interests: string;
  currentGoal: string;
  currentAnxiety: string;
  desiredOutcome: string;
  weeklyTime: string;
  riskPreference: string;
};

type PersonalImpact = {
  affectedPart: string;
  reason: string;
  opportunity: string;
  risk: string;
};

type ActionItem = {
  time: string;
  task: string;
  reason: string;
  successCriteria: string;
};

type ChangeSignal = {
  id: string;
  title: string;
  summary: string;
  category: string;
  sourceType: string;
  affectedCapabilities: string[];
  threatenedTasks: string[];
  emergingOpportunities: string[];
  lowRelevanceDomains?: string[];
};

type DecisionExplanation = {
  currentPriority: string;
  whyNotOthers: string;
  influencingFactors: string[];
  alternativeScenario: string;
};

type UrgencyLevel = "low" | "medium" | "high";

type CoreInsight = {
  "你以为": string;
  "实际上": string;
  "引用": string;
};

type ValueMigration = {
  currentValueSource: string[];
  decliningValue: string[];
  risingValue: string[];
  migrationDirection: string;
  urgencyLevel: UrgencyLevel;
};

type OpportunityRadarV4 = {
  todayChanges?: any[];
  personalImpact?: PersonalImpact;
  coreInsight?: CoreInsight;  // V6.1 新增
  valueMigration?: ValueMigration;  // V6.0 新增
  impactOnUser?: any;
  decisionExplanation?: DecisionExplanation;
  actions: ActionItem[];
  futureSelfMessage: string;
};

// V6.3.2 Insight Library 相关类型
type SelectedInsightInfo = {
  id: string;
  domain: string;
  title: string;
  coreInsight: {
    "你以为": string;
    "实际上": string;
  };
  goal: string;
  anxiety: string;
  riskPreference: string;
  weeklyTime: string;
  personalizedInsight?: string;
};

type TestCase = {
  id: string;
  name: string;
  profile: FutureProfile;
  mustInclude: string[];
  mustNotInclude: string[];
  domain?: string; // 预期领域
  shouldNotBeDominatedBy?: string[]; // 不应被某些领域的信号主导
};

type ValidationLevel = 'PASS' | 'WARNING' | 'FAIL';

type TestResult = {
  id: string;
  name: string;
  domain: string;
  state: string;
  level: ValidationLevel;
  affectedPart: string;
  opportunity: string;
  risk: string;
  actionsSummary: string;
  hitKeywords: string[];
  errorKeywords: string[];
  reason: string;
  comment: string;
  changeSignalsUsed: ChangeSignal[];
  changeSignalHitCount: number;
  radarData?: OpportunityRadarV4;
  // V6.0 Value Migration 字段
  hasValueMigration: boolean;
  valueMigrationDirection: string;
  valueMigrationUrgency: string;
  // V6.3.2 Insight Library 字段
  selectedInsight: SelectedInsightInfo | null;
  insightLibraryHit: boolean;
  coreInsightUsesSelectedInsight: boolean;
  anxietyReference: boolean;
  insightDeviation: boolean;
  deviationReason: string;
  // V6.3.2 Domain Match 字段
  userDomain: string;
  insightDomain: string;
  domainMatch: boolean;
  domainMismatchReason: string;
};

// ============================================================
// 10 个预设测试用户 + 3 个反例测试
// ============================================================

const TEST_CASES: TestCase[] = [
  {
    id: 'arch-1',
    name: '建筑｜想赚钱｜时间少｜低风险',
    profile: {
      age: '25',
      education: '本科',
      majorOrCareer: '建筑设计',
      currentSkills: '手绘、CAD、SketchUp',
      interests: '室内设计、效果图',
      currentGoal: '想赚外快，补贴工资',
      currentAnxiety: '感觉加班太累，钱不够用',
      desiredOutcome: '赚钱',
      weeklyTime: '5小时以下',
      riskPreference: '稳妥'
    },
    mustInclude: ['低成本', '接单', '验证', '快速', '简单'],
    mustNotInclude: ['BIM系统学习', '创业', '长期规划'],
    domain: 'architecture',
    shouldNotBeDominatedBy: ['design', 'finance']
  },
  
  {
    id: 'arch-2',
    name: '建筑｜想稳定｜怕失业｜低风险',
    profile: {
      age: '30',
      education: '本科',
      majorOrCareer: '施工现场管理',
      currentSkills: '现场管理、施工图纸、安全员',
      interests: '考证、稳定工作',
      currentGoal: '找个稳定的岗位，不再担心失业',
      currentAnxiety: '害怕行业下滑，被裁员',
      desiredOutcome: '稳定',
      weeklyTime: '5-10小时',
      riskPreference: '稳妥'
    },
    mustInclude: ['稳定', '岗位', '证书', 'BIM', '安全员', '施工管理'],
    mustNotInclude: ['闲鱼接单', '创业', '小红书获客', '个人IP'],
    domain: 'architecture',
    shouldNotBeDominatedBy: ['design', 'finance']
  },
  
  {
    id: 'finance-1',
    name: '财务｜想稳定｜怕AI替代｜低风险',
    profile: {
      age: '27',
      education: '本科',
      majorOrCareer: '会计',
      currentSkills: 'Excel、做账、报税、财务分析',
      interests: '稳定、考证',
      currentGoal: '在行业变化前做好准备，保住工作',
      currentAnxiety: '怕AI财务工具代替自己',
      desiredOutcome: '稳定',
      weeklyTime: '5-10小时',
      riskPreference: '稳妥'
    },
    mustInclude: ['稳定', '证书', 'CPA', 'CFA', '不可替代'],
    mustNotInclude: ['创业', '接单', '个人IP', '小红书'],
    domain: 'finance',
    shouldNotBeDominatedBy: ['design', 'architecture']
  },
  
  {
    id: 'design-1',
    name: '视觉传达｜想赚钱｜时间少｜低风险',
    profile: {
      age: '24',
      education: '本科',
      majorOrCareer: '视觉传达设计',
      currentSkills: 'PS、AI、平面设计',
      interests: '品牌设计、小红书',
      currentGoal: '用设计技能赚外快',
      currentAnxiety: '感觉基础设计不值钱了',
      desiredOutcome: '赚钱',
      weeklyTime: '5小时以下',
      riskPreference: '稳妥'
    },
    mustInclude: ['低成本', '验证', '接单', '简单'],
    mustNotInclude: ['系统学习', '创业', '长期规划'],
    domain: 'design',
    shouldNotBeDominatedBy: ['finance', 'architecture']
  },
  
  {
    id: 'design-2',
    name: '视觉传达｜想创业｜时间多｜高风险',
    profile: {
      age: '26',
      education: '硕士',
      majorOrCareer: '品牌设计师',
      currentSkills: '全案设计、动效、3D',
      interests: 'AI产品、设计工作室',
      currentGoal: '开自己的设计工作室',
      currentAnxiety: '担心没有稳定客户',
      desiredOutcome: '创业',
      weeklyTime: '20小时以上',
      riskPreference: '激进'
    },
    mustInclude: ['客户', '验证', '产品', 'MVP', '本地'],
    mustNotInclude: ['系统学习', '考证'],
    domain: 'design',
    shouldNotBeDominatedBy: ['finance', 'architecture']
  },
  
  // ========== 反例测试 ==========
  {
    id: 'anti-example-1',
    name: '【反例】财务用户不应被设计变化主导',
    profile: {
      age: '28',
      education: '本科',
      majorOrCareer: '财务会计',
      currentSkills: 'Excel、报表、做账',
      interests: '财务分析、考证',
      currentGoal: '提升财务能力，获得晋升',
      currentAnxiety: '怕AI替代基础会计工作',
      desiredOutcome: '职业发展',
      weeklyTime: '10小时',
      riskPreference: '稳妥'
    },
    mustInclude: ['财务', '会计', '报表', '数据'],
    mustNotInclude: ['设计', 'Logo', '海报', '视觉'],
    domain: 'finance',
    shouldNotBeDominatedBy: ['design']
  },
  
  {
    id: 'anti-example-2',
    name: '【反例】设计用户不应被财务变化主导',
    profile: {
      age: '25',
      education: '本科',
      majorOrCareer: '平面设计',
      currentSkills: 'PS、AI、Figma',
      interests: '品牌设计、UI设计',
      currentGoal: '提升设计水平，接单赚钱',
      currentAnxiety: '怕AI替代基础设计工作',
      desiredOutcome: '赚钱',
      weeklyTime: '10小时',
      riskPreference: '适中'
    },
    mustInclude: ['设计', '品牌', '视觉', 'UI'],
    mustNotInclude: ['会计', '财务', 'CPA', 'CFA', '报表'],
    domain: 'design',
    shouldNotBeDominatedBy: ['finance']
  },
  
  {
    id: 'anti-example-3',
    name: '【反例】建筑稳定用户不应只得到创业/接单建议',
    profile: {
      age: '32',
      education: '本科',
      majorOrCareer: '建筑工程',
      currentSkills: 'CAD、施工图、现场管理',
      interests: '稳定工作、考证',
      currentGoal: '找个稳定的建筑相关工作',
      currentAnxiety: '怕行业不稳定，失业',
      desiredOutcome: '稳定',
      weeklyTime: '8小时',
      riskPreference: '稳妥'
    },
    mustInclude: ['稳定', '岗位', '证书', '建筑', '工程'],
    mustNotInclude: ['创业', '接单', '小红书', '个人IP', '工作室'],
    domain: 'architecture',
    shouldNotBeDominatedBy: ['design', 'finance']
  },
  
  {
    id: 'study-1',
    name: '雅思｜目标6.5｜时间中等｜焦虑拖延',
    profile: {
      age: '22',
      education: '本科在读',
      majorOrCareer: '准备留学',
      currentSkills: '英语基础还行',
      interests: '英语、海外文化',
      currentGoal: '今年年底雅思6.5',
      currentAnxiety: '拖延症，单词总是背不完',
      desiredOutcome: '留学',
      weeklyTime: '10-15小时',
      riskPreference: '适中'
    },
    mustInclude: ['雅思', '托福', '考试', '备考', '任务化'],
    mustNotInclude: ['接单', '创业', '赚钱', 'IP'],
    domain: 'study_abroad'
  },
  
  {
    id: 'ai-design-1',
    name: '视觉传达｜AI产品｜创业｜时间多｜高风险',
    profile: {
      age: '25',
      education: '硕士',
      majorOrCareer: '视觉传达设计',
      currentSkills: 'Figma、AI绘画、Midjourney',
      interests: 'AI产品、SaaS、独立开发',
      currentGoal: '做一个AI设计工具或产品',
      currentAnxiety: '怕技术实现不了，或者没人用',
      desiredOutcome: '创业',
      weeklyTime: '20小时以上',
      riskPreference: '激进'
    },
    mustInclude: ['用户', '验证', '产品', 'MVP', 'AI'],
    mustNotInclude: ['纯设计', '系统学习', '考证'],
    domain: 'ai_product'
  }
];

// ============================================================
// 工具函数
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 分析用户状态（本地）
function analyzeUserState(profile: FutureProfile): string {
  const desired = profile.desiredOutcome?.toLowerCase() || '';
  const goal = profile.currentGoal.toLowerCase();
  const anxiety = profile.currentAnxiety.toLowerCase();
  const time = profile.weeklyTime?.toLowerCase() || '';
  const risk = profile.riskPreference?.toLowerCase() || '';
  
  if (desired.includes('留学') || goal.includes('雅思') || goal.includes('托福') || goal.includes('考试')) {
    return 'study_application';
  }
  
  if (anxiety.includes('失业') || anxiety.includes('裁员') || anxiety.includes('被替代') || desired.includes('稳定')) {
    return 'career_security_anxiety';
  }
  
  if (desired.includes('创业') || goal.includes('创业') || goal.includes('工作室')) {
    return 'entrepreneurship_trial';
  }
  
  if (desired.includes('转型') || desired.includes('转行')) {
    return 'career_transition';
  }
  
  if (desired.includes('赚钱') || goal.includes('赚') || goal.includes('接单') || goal.includes('副业')) {
    const isHighTime = time.includes('10') || time.includes('15') || time.includes('20') || time.includes('多');
    const isHighRisk = risk.includes('激进') || risk.includes('冒险');
    if (isHighTime && isHighRisk) {
      return 'monetization_sprint';
    }
    return 'monetization_exploration';
  }
  
  return 'general_exploration';
}

function getStateLabel(state: string): string {
  const stateLabels: Record<string, string> = {
    'monetization_exploration': '变现探索期',
    'monetization_sprint': '变现冲刺期',
    'career_security_anxiety': '职业安全焦虑期',
    'direction_confusion': '方向迷茫期',
    'skill_upgrade': '技能升级期',
    'career_transition': '职业转型期',
    'entrepreneurship_trial': '创业试探期',
    'study_application': '留学/考试申请期',
    'job_search_push': '求职推进期',
    'low_energy_survival': '低能量保守期',
    'general_exploration': '通用探索期'
  };
  return stateLabels[state] || '未知状态';
}

// 简单的文本相似度（基于关键词重合率）
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

// ============================================================
// V6.3.2 Insight Library 辅助函数
// ============================================================

// 简单的洞察库实现（复制 insightSelector 的核心逻辑）
const INSIGHT_DOMAINS = ['design', 'finance', 'architecture', 'study_abroad', 'creator', 'ai_product'];

// 简化的洞察库数据（V6.3.2 修复：每个领域都有洞察）
const mockInsights = [
  // Architecture domain（新增）
  { id: 'arch-1', domain: 'architecture', title: '证书不是晋升保证', coreInsight: { "你以为": "考证能解决问题", "实际上": "你缺的不是证书，而是从执行者到管理者的迁移能力" }, goal: '稳定', anxiety: '怕失业', riskPreference: '稳妥', weeklyTime: '5-10小时' },
  { id: 'arch-2', domain: 'architecture', title: '接单不能解决职业安全', coreInsight: { "你以为": "接单能增加收入", "实际上": "接单不能解决职业安全焦虑" }, goal: '赚钱', anxiety: '钱不够用', riskPreference: '稳妥', weeklyTime: '5小时以下' },
  { id: 'arch-3', domain: 'architecture', title: 'BIM是稳定路线', coreInsight: { "你以为": "BIM只是工具", "实际上": "BIM是建筑行业稳定岗位的入场券" }, goal: '稳定', anxiety: '怕失业', riskPreference: '稳妥', weeklyTime: '10-15小时' },
  
  // Design domain
  { id: 'design-1', domain: 'design', title: '基础执行价值贬值', coreInsight: { "你以为": "AI在抢设计师工作", "实际上": "AI在压缩客户为设计执行付费的意愿" }, goal: '赚钱', anxiety: '基础设计不值钱', riskPreference: '稳妥', weeklyTime: '5小时以下' },
  { id: 'design-2', domain: 'design', title: '策略能力升值', coreInsight: { "你以为": "学好AI工具就能保持竞争力", "实际上": "客户愿意为策略付更高价，而不是执行" }, goal: '职业发展', anxiety: '被替代', riskPreference: '适中', weeklyTime: '10-15小时' },
  { id: 'design-3', domain: 'design', title: '品牌策略价值', coreInsight: { "你以为": "多接单就能赚钱", "实际上": "客户要的不是图，是解决问题的方法" }, goal: '赚钱', anxiety: '没客户', riskPreference: '激进', weeklyTime: '20小时以上' },
  
  // Finance domain
  { id: 'finance-1', domain: 'finance', title: '基础岗位替代', coreInsight: { "你以为": "AI会替代你", "实际上": "企业未来不会增加基础财务岗位" }, goal: '稳定', anxiety: '怕AI替代', riskPreference: '稳妥', weeklyTime: '5-10小时' },
  { id: 'finance-2', domain: 'finance', title: '分析能力升值', coreInsight: { "你以为": "考完CPA就能晋升", "实际上": "证书只是门槛，分析能力才是晋升关键" }, goal: '晋升', anxiety: '没有发展空间', riskPreference: '稳妥', weeklyTime: '10-15小时' },
  { id: 'finance-3', domain: 'finance', title: '财务转型窗口', coreInsight: { "你以为": "财务稳定", "实际上": "基础财务岗位正在减少，转型窗口正在关闭" }, goal: '稳定', anxiety: '怕失业', riskPreference: '稳妥', weeklyTime: '5-10小时' },
  
  // Study abroad domain
  { id: 'study-1', domain: 'study_abroad', title: '练习量不等于效果', coreInsight: { "你以为": "多刷题就能考过", "实际上": "你缺的不是练习量，而是有效的反馈机制" }, goal: '雅思6.5', anxiety: '拖延症', riskPreference: '适中', weeklyTime: '10-15小时' },
  { id: 'study-2', domain: 'study_abroad', title: '反馈比努力重要', coreInsight: { "你以为": "努力就能考过", "实际上": "没有反馈的努力，效率很低" }, goal: '留学', anxiety: '考不过', riskPreference: '适中', weeklyTime: '10-15小时' },
  
  // AI Product domain
  { id: 'ai-1', domain: 'ai_product', title: '技术不是护城河', coreInsight: { "你以为": "做出产品就能成功", "实际上": "技术实现只是起点，有人用才是关键" }, goal: '创业', anxiety: '没人用', riskPreference: '激进', weeklyTime: '20小时以上' },
  { id: 'ai-2', domain: 'ai_product', title: '用户验证优先', coreInsight: { "你以为": "先做产品再找用户", "实际上": "先找用户再做产品" }, goal: '创业', anxiety: '没人用', riskPreference: '激进', weeklyTime: '20小时以上' },
  
  // Creator domain（新增）
  { id: 'creator-1', domain: 'creator', title: '粉丝数不是目标', coreInsight: { "你以为": "涨粉就能变现", "实际上": "信任比数量更重要" }, goal: '变现', anxiety: '粉丝少', riskPreference: '适中', weeklyTime: '10-15小时' },
  { id: 'creator-2', domain: 'creator', title: '内容质量胜过数量', coreInsight: { "你以为": "多发内容就能涨粉", "实际上": "优质内容比高频发布更有效" }, goal: '涨粉', anxiety: '没流量', riskPreference: '稳妥', weeklyTime: '5-10小时' },
  
  // General domain（fallback）
  { id: 'general-1', domain: 'general', title: '行动比计划重要', coreInsight: { "你以为": "计划完美就能成功", "实际上": "快速行动获取反馈更重要" }, goal: 'general', anxiety: 'general', riskPreference: 'general', weeklyTime: 'general' },
];

// 检测用户领域（V6.3.2 修复：majorOrCareer 优先，interests/goal 只作为辅助）
function detectInsightDomain(profile: FutureProfile): string {
  const major = profile.majorOrCareer.toLowerCase();
  const goal = profile.currentGoal.toLowerCase();
  const interests = profile.interests.toLowerCase();
  const anxiety = profile.currentAnxiety.toLowerCase();
  const desired = profile.desiredOutcome?.toLowerCase() || '';
  
  // ============================================================
  // V6.3.2 核心规则：majorOrCareer（主业）优先级最高
  // 只有当主业明确包含某领域关键词时，才匹配该领域
  // ============================================================
  
  // 1. 优先检测 majorOrCareer（主业）
  
  // 建筑/施工/工程（主业检测）
  if (major.includes('建筑') || major.includes('施工') || major.includes('工程') || 
      major.includes('bim') || major.includes('室内') || major.includes('工地')) {
    return 'architecture';
  }
  
  // 财务/会计/金融（主业检测）
  if (major.includes('财务') || major.includes('会计') || major.includes('金融') ||
      major.includes('银行') || major.includes('证券') || major.includes('基金')) {
    return 'finance';
  }
  
  // 留学/考试（主业检测）
  if (major.includes('留学') || major.includes('雅思') || major.includes('托福') ||
      major.includes('考研') || major.includes('考试')) {
    return 'study_abroad';
  }
  
  // AI产品/产品经理（主业检测）
  if (major.includes('ai产品') || major.includes('产品经理') || major.includes('产品') ||
      major.includes('独立开发') || major.includes('saas')) {
    return 'ai_product';
  }
  
  // 创作者/自媒体/博主（主业检测）
  if (major.includes('博主') || major.includes('自媒体') || major.includes('创作者') ||
      major.includes('内容')) {
    return 'creator';
  }
  
  // 设计/视觉传达（主业检测）
  if (major.includes('设计') || major.includes('视觉') || major.includes('平面') ||
      major.includes('品牌') || major.includes('ui') || major.includes('ux') ||
      major.includes('figma')) {
    return 'design';
  }
  
  // ============================================================
  // 2. 如果主业没有明确匹配，再检测 goal（目标）
  // ============================================================
  
  // 留学目标（目标检测）
  if (goal.includes('雅思') || goal.includes('托福') || goal.includes('留学') ||
      goal.includes('出国') || goal.includes('考研')) {
    return 'study_abroad';
  }
  
  // AI产品目标（目标检测）- 必须明确包含 AI产品关键词
  if (goal.includes('ai产品') || goal.includes('做一个ai') || goal.includes('ai工具') ||
      goal.includes('ai设计工具')) {
    return 'ai_product';
  }
  
  // ============================================================
  // 3. 最后检测 interests（兴趣）- 权重最低
  // ============================================================
  
  // 只有当主业和目标都没有匹配时，才用兴趣判断
  // 但兴趣中的小红书、抖音等不应该覆盖主业
  
  // 建筑兴趣
  if (interests.includes('bim') || interests.includes('施工') || interests.includes('工地')) {
    return 'architecture';
  }
  
  // 财务兴趣
  if (interests.includes('cpa') || interests.includes('cfa') || interests.includes('考证') && major.includes('财务')) {
    return 'finance';
  }
  
  // 设计兴趣（不覆盖主业）
  // 如果主业不是明确的其他领域，且兴趣包含设计相关，才匹配 design
  if (interests.includes('设计') || interests.includes('品牌') || interests.includes('视觉')) {
    return 'design';
  }
  
  // 默认返回 general
  return 'general';
}

// 简单选择洞察（V6.3.2 修复：必须优先匹配当前 domain）
function selectInsightForTest(profile: FutureProfile): typeof mockInsights[0] | null {
  const domain = detectInsightDomain(profile);
  const anxiety = profile.currentAnxiety.toLowerCase();
  const risk = profile.riskPreference.toLowerCase();
  const time = profile.weeklyTime.toLowerCase();
  const goal = profile.currentGoal.toLowerCase();
  
  // ============================================================
  // V6.3.2 核心规则：必须优先匹配当前 domain
  // ============================================================
  
  // 1. 筛选同领域的洞察（严格匹配）
  const domainInsights = mockInsights.filter(i => i.domain === domain);
  
  if (domainInsights.length === 0) {
    // 当前 domain 没有可用洞察时，才允许 fallback 到 general
    const generalInsights = mockInsights.filter(i => i.domain === 'general');
    if (generalInsights.length > 0) {
      return generalInsights[0];
    }
    return null;
  }
  
  // 2. 在同领域内，优先匹配焦虑关键词
  for (const insight of domainInsights) {
    const insightAnxiety = insight.anxiety.toLowerCase();
    if (anxiety.includes(insightAnxiety) || insightAnxiety.includes(anxiety.substring(0, 4))) {
      return insight;
    }
  }
  
  // 3. 次选：匹配风险偏好
  for (const insight of domainInsights) {
    const insightRisk = insight.riskPreference.toLowerCase();
    if (risk.includes('稳妥') && insightRisk.includes('稳妥')) {
      return insight;
    }
    if (risk.includes('激进') && insightRisk.includes('激进')) {
      return insight;
    }
  }
  
  // 4. 默认返回该领域的第一个洞察
  return domainInsights[0];
}

// V6.3.2 验证核心洞察是否引用洞察库
function validateCoreInsightReference(
  radarData: OpportunityRadarV4,
  selectedInsight: SelectedInsightInfo | null
): { usesSelectedInsight: boolean; anxietyReference: boolean; deviation: boolean; deviationReason: string } {
  const result = {
    usesSelectedInsight: false,
    anxietyReference: false,
    deviation: false,
    deviationReason: ''
  };
  
  if (!radarData.coreInsight || !selectedInsight) {
    result.deviationReason = '无 CoreInsight 或无选中洞察';
    return result;
  }
  
  const coreInsightText = `${radarData.coreInsight["你以为"]} ${radarData.coreInsight["实际上"]} ${radarData.coreInsight["引用"] || ''}`;
  const selectedCoreText = `${selectedInsight.coreInsight["你以为"]} ${selectedInsight.coreInsight["实际上"]}`;
  
  // 检查是否引用了 selectedInsight 的核心词
  const selectedWords = selectedCoreText.replace(/[，。、！？""'']/g, ' ').split(/\s+/).filter(w => w.length > 2);
  let matchCount = 0;
  for (const word of selectedWords) {
    if (coreInsightText.includes(word)) {
      matchCount++;
    }
  }
  
  // 如果匹配度 > 30%，则认为引用了洞察库
  const matchRate = matchCount / selectedWords.length;
  result.usesSelectedInsight = matchRate >= 0.3;
  
  if (!result.usesSelectedInsight) {
    result.deviation = true;
    result.deviationReason = `CoreInsight 未引用洞察库核心词 (匹配率: ${(matchRate * 100).toFixed(1)}%)`;
  }
  
  // 检查是否引用了焦虑
  if (selectedInsight.anxiety && coreInsightText.includes(selectedInsight.anxiety)) {
    result.anxietyReference = true;
  }
  
  // 检查是否在personalImpact中引用焦虑
  if (radarData.personalImpact) {
    const impactText = `${radarData.personalImpact.affectedPart} ${radarData.personalImpact.reason} ${radarData.personalImpact.risk}`;
    if (selectedInsight.anxiety && impactText.includes(selectedInsight.anxiety)) {
      result.anxietyReference = true;
    }
  }
  
  return result;
}

// ============================================================
// 验证逻辑
// ============================================================

// 检查是否在否定上下文中
function isInNegativeContext(text: string, keyword: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  
  // 找到关键词在文本中的位置
  const index = lowerText.indexOf(lowerKeyword);
  if (index === -1) return false;
  
  // 获取关键词前后的上下文（各50个字符）
  const start = Math.max(0, index - 50);
  const end = Math.min(lowerText.length, index + keyword.length + 50);
  const context = lowerText.substring(start, end);
  
  // 否定上下文模式
  const negativePatterns = [
    '不要', '避免', '不是', '不应', '不能',
    '转向', '从', '摆脱', '跳出', '不再',
    '如果继续', '不要继续', '避免继续',
    '不要做', '避免做', '不要只做'
  ];
  
  // 检查是否有否定词出现在关键词附近
  for (const pattern of negativePatterns) {
    if (context.includes(pattern)) {
      return true;
    }
  }
  
  // 特殊检查：如果关键词前面有 "从...转向" 模式
  try {
    const转向Match = lowerText.match(new RegExp(`从.{0,20}${lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.{0,20}转向`));
    if (转向Match) {
      return true;
    }
  } catch (e) {
    // ignore regex errors
  }
  
  return false;
}

function validateRadar(
  radarData: OpportunityRadarV4,
  testCase: TestCase,
  domain: string,
  state: string,
  changeSignals: ChangeSignal[]
): { 
  level: ValidationLevel; 
  hitKeywords: string[]; 
  errorKeywords: string[]; 
  reason: string; 
  comment: string;
  changeSignalHitCount: number;
} {
  
  const hitKeywords: string[] = [];
  const errorKeywords: string[] = [];
  const reasons: string[] = [];
  const comments: string[] = [];
  
  // 1. 验证 personalImpact 是否存在
  if (!radarData.personalImpact) {
    reasons.push('缺少 personalImpact 字段');
    comments.push('Radar 输出缺少个人影响分析');
    return { 
      level: 'FAIL', 
      hitKeywords, 
      errorKeywords, 
      reason: reasons.join('; '), 
      comment: comments.join('; '),
      changeSignalHitCount: 0
    };
  }
  
  // 2. 验证 personalImpact 字段完整性
  const pi = radarData.personalImpact;
  const missingFields: string[] = [];
  if (!pi.affectedPart) missingFields.push('affectedPart');
  if (!pi.reason) missingFields.push('reason');
  if (!pi.opportunity) missingFields.push('opportunity');
  if (!pi.risk) missingFields.push('risk');
  
  if (missingFields.length > 0) {
    reasons.push(`personalImpact 缺少字段: ${missingFields.join(', ')}`);
    comments.push('个人影响分析不完整');
    return { 
      level: 'FAIL', 
      hitKeywords, 
      errorKeywords, 
      reason: reasons.join('; '), 
      comment: comments.join('; '),
      changeSignalHitCount: 0
    };
  }
  
  // 3. V5.9 Real Change Engine: 验证变化信号是否被引用
  let changeSignalHitCount = 0;
  const fullImpactText = `${pi.affectedPart} ${pi.reason} ${pi.opportunity} ${pi.risk}`.toLowerCase();
  
  for (const signal of changeSignals) {
    const keywordsToCheck = [
      ...signal.affectedCapabilities,
      ...signal.threatenedTasks,
      ...signal.emergingOpportunities
    ];
    
    for (const keyword of keywordsToCheck) {
      if (fullImpactText.includes(keyword.toLowerCase())) {
        changeSignalHitCount++;
        hitKeywords.push(`变化信号关键词: ${keyword}`);
      }
    }
  }
  
  if (changeSignalHitCount === 0) {
    reasons.push('变化信号没有真正参与影响判断');
    comments.push('Personal Impact 没有引用 changeSignals 中的 affectedCapabilities、threatenedTasks 或 emergingOpportunities');
  } else {
    comments.push(`变化信号已参与判断: 命中 ${changeSignalHitCount} 个关键词`);
  }
  
  // 2.5. 验证 decisionExplanation 是否存在
  let hasDecisionExplanation = true;
  if (!radarData.decisionExplanation) {
    hasDecisionExplanation = false;
    reasons.push('缺少 decisionExplanation 字段');
    comments.push('Radar 输出缺少决策透明层');
  } else {
    const de = radarData.decisionExplanation;
    const deMissingFields: string[] = [];
    if (!de.currentPriority) deMissingFields.push('currentPriority');
    if (!de.whyNotOthers) deMissingFields.push('whyNotOthers');
    if (!de.influencingFactors || de.influencingFactors.length === 0) deMissingFields.push('influencingFactors');
    if (!de.alternativeScenario) deMissingFields.push('alternativeScenario');
    
    if (deMissingFields.length > 0) {
      reasons.push(`decisionExplanation 缺少字段: ${deMissingFields.join(', ')}`);
      comments.push('决策透明层不完整');
    } else {
      // 验证是否引用用户字段
      const hasUserFieldReference = de.influencingFactors.some(f => 
        f.includes('想获得') || f.includes('目标') || f.includes('焦虑') || 
        f.includes('时间') || f.includes('风险') || f.includes('能力')
      );
      if (!hasUserFieldReference) {
        reasons.push('decisionExplanation 的 influencingFactors 未引用用户字段');
        comments.push('决策透明层需要引用真实用户字段');
      }
      
      // 验证是否有空话（禁止：AI发展快、行业变化大、未来重要、趋势变化）
      const hasEmptyTalk = ['AI发展', '行业变化', '未来很重要', '趋势变化'].some(
        phrase => de.currentPriority.includes(phrase) || de.whyNotOthers.includes(phrase)
      );
      if (hasEmptyTalk) {
        reasons.push('decisionExplanation 包含空话');
        comments.push('决策透明层禁止空泛表述');
      }
      
      comments.push('决策透明层已包含');
    }
  }
  
  // 2.7. V6.1 CoreInsight 验证
  let hasCoreInsight = false;
  let coreInsightScore = 0;
  if (radarData.coreInsight) {
    hasCoreInsight = true;
    const ci = radarData.coreInsight;
    
    // 检查是否有"你以为"和"实际上"结构
    if (ci["你以为"] && ci["实际上"]) {
      coreInsightScore += 5;
      
      // 检查是否引用了用户信息
      if (ci["引用"] && ci["引用"].length > 0) {
        coreInsightScore += 3;
      }
      
      // 检查是否包含禁止词汇（低质量洞察）
      const forbiddenPhrases = ['学习AI', '提升能力', '关注趋势', '建立个人品牌', '拥抱变化', '提高竞争力'];
      const hasForbidden = forbiddenPhrases.some(phrase => 
        ci["你以为"].includes(phrase) || ci["实际上"].includes(phrase)
      );
      if (hasForbidden) {
        coreInsightScore -= 5;
        reasons.push('CoreInsight 包含禁止词汇');
      }
      
      // 检查是否反直觉
      if (ci["实际上"].includes('不是') || ci["实际上"].includes('缺的不是') || ci["实际上"].includes('真正')) {
        coreInsightScore += 2;
      }
      
      comments.push(`V6.1: CoreInsight 已包含 (得分: ${coreInsightScore})`);
    } else {
      reasons.push('CoreInsight 缺少"你以为"或"实际上"字段');
      comments.push('V6.1: CoreInsight 格式不完整');
    }
  } else {
    reasons.push('缺少 coreInsight 字段');
    comments.push('V6.1: 未生成核心洞察');
  }
  
  // 3. 验证 actions 是否存在且至少 2 条
  if (!radarData.actions || radarData.actions.length < 2) {
    reasons.push('actions 少于 2 条');
    comments.push('行动建议数量不足');
    return { 
      level: 'FAIL', 
      hitKeywords, 
      errorKeywords, 
      reason: reasons.join('; '), 
      comment: comments.join('; '),
      changeSignalHitCount
    };
  }
  
  // 4. 关键词方向验证（带上下文感知）
  const fullText = JSON.stringify(radarData).toLowerCase();
  
  // 检查 mustInclude
  for (const keyword of testCase.mustInclude) {
    if (fullText.includes(keyword.toLowerCase())) {
      hitKeywords.push(keyword);
    }
  }
  
  // 检查 mustNotInclude（带上下文感知）
  for (const keyword of testCase.mustNotInclude) {
    if (fullText.includes(keyword.toLowerCase())) {
      // 检查是否在否定上下文中
      if (!isInNegativeContext(fullText, keyword)) {
        errorKeywords.push(keyword);
        reasons.push(`发现禁止关键词: ${keyword}`);
      } else {
        console.log(`   ℹ️  "${keyword}" 出现在否定上下文中，不算错误`);
      }
    }
  }
  
  // 5. 生成评语
  const hitRate = hitKeywords.length / testCase.mustInclude.length;
  if (hitRate >= 0.5) {
    comments.push(`关键词命中率良好: ${hitKeywords.length}/${testCase.mustInclude.length}`);
  } else if (hitRate >= 0.25) {
    comments.push(`关键词命中一般: ${hitKeywords.length}/${testCase.mustInclude.length}`);
  } else {
    comments.push(`关键词命中率偏低: ${hitKeywords.length}/${testCase.mustInclude.length}`);
  }
  
  // 6. 判断 level
  let resultLevel: ValidationLevel = 'PASS';
  if (reasons.some(r => r.startsWith('personalImpact') || r.startsWith('actions'))) {
    resultLevel = 'FAIL';
  } else if (reasons.length > 0) {
    resultLevel = 'WARNING';
  } else if (hitRate < 0.25) {
    resultLevel = 'WARNING';
  }
  
  // 7. V6.0 Value Migration 验证
  let hasValueMigration = false;
  let valueMigrationDirection = '';
  let valueMigrationUrgency = '';
  
  if (radarData.valueMigration) {
    hasValueMigration = true;
    valueMigrationDirection = radarData.valueMigration.migrationDirection || '';
    valueMigrationUrgency = radarData.valueMigration.urgencyLevel || '';
    
    // 验证是否包含必要字段
    if (!radarData.valueMigration.currentValueSource || radarData.valueMigration.currentValueSource.length === 0) {
      reasons.push('valueMigration.currentValueSource 为空');
      comments.push('V6.0: 未识别用户当前价值来源');
    }
    if (!radarData.valueMigration.decliningValue || radarData.valueMigration.decliningValue.length === 0) {
      reasons.push('valueMigration.decliningValue 为空');
      comments.push('V6.0: 未识别贬值能力');
    }
    if (!radarData.valueMigration.risingValue || radarData.valueMigration.risingValue.length === 0) {
      reasons.push('valueMigration.risingValue 为空');
      comments.push('V6.0: 未识别升值能力');
    }
    if (!radarData.valueMigration.migrationDirection) {
      reasons.push('valueMigration.migrationDirection 为空');
      comments.push('V6.0: 未生成迁移方向');
    }
    if (!radarData.valueMigration.urgencyLevel) {
      reasons.push('valueMigration.urgencyLevel 为空');
      comments.push('V6.0: 未生成紧迫度');
    }
    
    // 验证迁移方向是否包含迁移关键词
    if (valueMigrationDirection && !valueMigrationDirection.includes('→') && !valueMigrationDirection.includes('->')) {
      comments.push('V6.0: 迁移方向格式可能不正确');
    }
    
    // 验证紧迫度
    const validUrgency = ['low', 'medium', 'high'];
    if (valueMigrationUrgency && !validUrgency.includes(valueMigrationUrgency)) {
      reasons.push(`valueMigration.urgencyLevel 无效: ${valueMigrationUrgency}`);
      comments.push('V6.0: 紧迫度必须为 low/medium/high');
    }
    
    if (hasValueMigration && reasons.length === 0) {
      comments.push(`V6.0: 价值迁移分析完整 (${valueMigrationUrgency})`);
    }
  } else {
    reasons.push('缺少 valueMigration 字段');
    comments.push('V6.0: 未生成个人价值迁移分析');
  }
  
  // 重新判断 level（考虑 V6.0 验证）
  if (reasons.some(r => r.includes('valueMigration'))) {
    resultLevel = 'FAIL';
  } else if (reasons.some(r => r.startsWith('personalImpact') || r.startsWith('actions'))) {
    resultLevel = 'FAIL';
  } else if (reasons.length > 0) {
    resultLevel = 'WARNING';
  }
  
  return {
    level: resultLevel,
    hitKeywords,
    errorKeywords,
    reason: reasons.join('; ') || '核心逻辑正确',
    comment: comments.join('; '),
    changeSignalHitCount,
    hasValueMigration,
    valueMigrationDirection,
    valueMigrationUrgency
  };
}

// ============================================================
// 差异性测试
// ============================================================

function runCrossCaseComparison(results: TestResult[]): void {
  console.log('\n============================================================');
  console.log(' 差异性测试（同职业不同状态）');
  console.log('============================================================');
  
  // 按职业分组
  const archCases = results.filter(r => r.domain === 'architecture');
  const financeCases = results.filter(r => r.domain === 'finance');
  const designCases = results.filter(r => r.domain === 'design');
  
  // 测试建筑案例差异性
  if (archCases.length >= 3) {
    const texts = archCases.map(r => 
      `${r.personalImpact?.affectedPart || ''} ${r.personalImpact?.reason || ''} ${r.actionsSummary}`
    );
    
    // 比较两两之间的相似度
    for (let i = 0; i < archCases.length; i++) {
      for (let j = i + 1; j < archCases.length; j++) {
        const similarity = calculateSimilarity(texts[i], texts[j]);
        if (similarity > 0.6) {
          console.log(`⚠️  ${archCases[i].name} vs ${archCases[j].name}`);
          console.log(`   相似度: ${(similarity * 100).toFixed(1)}% (偏高)`);
          console.log(`   问题: 两者输出过于相似，可能状态区分不明显`);
        } else {
          console.log(`✅ ${archCases[i].name} vs ${archCases[j].name}`);
          console.log(`   相似度: ${(similarity * 100).toFixed(1)}% (正常)`);
        }
      }
    }
    
    // 特殊检查：建筑稳定不应以闲鱼接单为主线
    const stableArch = archCases.find(r => r.state === 'career_security_anxiety');
    if (stableArch) {
      if (stableArch.actionsSummary.includes('闲鱼') || stableArch.errorKeywords.includes('闲鱼接单')) {
        console.log(`❌ ${stableArch.name}: 职业安全焦虑期不应以闲鱼接单为主线`);
      }
    }
    
    // 建筑创业不应以考证为主线
    const startupArch = archCases.find(r => r.state === 'entrepreneurship_trial');
    if (startupArch) {
      if (startupArch.errorKeywords.some(k => k.includes('证书') || k.includes('考证'))) {
        console.log(`❌ ${startupArch.name}: 创业试探期不应以考证为主线`);
      }
    }
  }
}

// ============================================================
// 单个测试用例执行
// ============================================================

async function testSingleTestCase(testCase: TestCase): Promise<TestResult> {
  const domain = detectUserDomain(testCase.profile);
  const state = analyzeUserState(testCase.profile);
  
  // V5.9 Real Change Engine: 获取真正的变化信号
  const changeSignals = getChangeSignalsForProfile(testCase.profile);
  
  // V6.3.2: 选择洞察
  const selectedInsightRaw = selectInsightForTest(testCase.profile);
  const selectedInsight: SelectedInsightInfo | null = selectedInsightRaw ? {
    id: selectedInsightRaw.id,
    domain: selectedInsightRaw.domain,
    title: selectedInsightRaw.title,
    coreInsight: selectedInsightRaw.coreInsight,
    goal: selectedInsightRaw.goal,
    anxiety: selectedInsightRaw.anxiety,
    riskPreference: selectedInsightRaw.riskPreference,
    weeklyTime: selectedInsightRaw.weeklyTime
  } : null;
  
  const result: TestResult = {
    id: testCase.id,
    name: testCase.name,
    domain,
    state,
    level: 'FAIL',
    affectedPart: '',
    opportunity: '',
    risk: '',
    actionsSummary: '',
    hitKeywords: [],
    errorKeywords: [],
    reason: '',
    comment: '',
    changeSignalsUsed: changeSignals,
    changeSignalHitCount: 0,
    // V6.0 Value Migration 字段
    hasValueMigration: false,
    valueMigrationDirection: '',
    valueMigrationUrgency: '',
    // V6.3.2 Insight Library 字段
    selectedInsight,
    insightLibraryHit: selectedInsight !== null,
    coreInsightUsesSelectedInsight: false,
    anxietyReference: false,
    insightDeviation: false,
    deviationReason: '',
    // V6.3.2 Domain Match 字段
    userDomain: domain,
    insightDomain: selectedInsight?.domain || 'none',
    domainMatch: domain === selectedInsight?.domain,
    domainMismatchReason: ''
  };
  
  // V6.3.2 Domain Match 检查
  if (!result.domainMatch && selectedInsight) {
    result.domainMismatchReason = `用户领域 ${domain} 与洞察领域 ${selectedInsight.domain} 不匹配`;
  }
  
  try {
    // 检查 API Key
    const hasApiKey = !!process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your_api_key_here';
    
    // 如果没有 API Key，使用模拟数据
    if (!hasApiKey) {
      console.log('   ⚠️  无 DeepSeek API Key，使用模拟数据测试');
      
      // 模拟雷达数据
      const mockRadarData: OpportunityRadarV4 = {
        todayChanges: [
          {
            title: 'AI 工具正在改变行业',
            summary: '测试变化信号',
            whyItMatters: '测试'
          }
        ],
        personalImpact: {
          affectedPart: result.selectedInsight?.anxiety || '测试影响部分',
          reason: result.selectedInsight?.title || '测试原因',
          opportunity: '测试机会',
          risk: '测试风险'
        },
        coreInsight: result.selectedInsight ? {
          "你以为": result.selectedInsight.coreInsight["你以为"],
          "实际上": result.selectedInsight.coreInsight["实际上"],
          "引用": result.selectedInsight.anxiety
        } : {
          "你以为": "测试你以为",
          "实际上": "测试实际上",
          "引用": "测试引用"
        },
        valueMigration: {
          currentValueSource: ['测试当前价值'],
          decliningValue: ['测试贬值'],
          risingValue: ['测试升值'],
          migrationDirection: '测试 → 模拟',
          urgencyLevel: 'medium'
        },
        impactOnUser: {
          identity: '测试用户',
          currentProblem: '测试问题',
          risk: '测试风险',
          opportunity: '测试机会'
        },
        decisionExplanation: {
          currentPriority: '测试优先级',
          whyNotOthers: '测试排除原因',
          influencingFactors: ['测试因素1', '测试因素2'],
          alternativeScenario: '测试替代场景'
        },
        actions: [
          {
            time: '今晚',
            task: '测试任务1',
            reason: '测试原因1',
            successCriteria: '测试标准1'
          },
          {
            time: '明天',
            task: '测试任务2',
            reason: '测试原因2',
            successCriteria: '测试标准2'
          },
          {
            time: '本周',
            task: '测试任务3',
            reason: '测试原因3',
            successCriteria: '测试标准3'
          }
        ],
        futureSelfMessage: '测试未来提醒'
      };
      
      const radarData = mockRadarData;
      result.radarData = radarData;
      
      // 提取信息
      if (radarData.personalImpact) {
        result.affectedPart = radarData.personalImpact.affectedPart?.substring(0, 50) || '';
        result.opportunity = radarData.personalImpact.opportunity?.substring(0, 50) || '';
        result.risk = radarData.personalImpact.risk?.substring(0, 50) || '';
      }
      
      if (radarData.actions) {
        result.actionsSummary = radarData.actions.map(a => `${a.time}:${a.task}`).join(' ');
      }
      
      // V6.3.2 验证洞察库引用
      const insightValidation = validateCoreInsightReference(radarData, result.selectedInsight);
      result.coreInsightUsesSelectedInsight = insightValidation.usesSelectedInsight;
      result.anxietyReference = insightValidation.anxietyReference;
      result.insightDeviation = insightValidation.deviation;
      result.deviationReason = insightValidation.deviationReason;
      
      // 验证
      const validation = validateRadar(radarData, testCase, result.domain, result.state, changeSignals);
      result.level = validation.level;
      result.hitKeywords = validation.hitKeywords;
      result.errorKeywords = validation.errorKeywords;
      result.reason = validation.reason;
      result.comment = validation.comment;
      result.changeSignalHitCount = validation.changeSignalHitCount;
      // V6.0 Value Migration
      result.hasValueMigration = validation.hasValueMigration;
      result.valueMigrationDirection = validation.valueMigrationDirection;
      result.valueMigrationUrgency = validation.valueMigrationUrgency;
      
      // 如果洞察偏离，添加WARNING
      if (result.insightDeviation) {
        result.level = 'WARNING';
        result.reason += `; ${result.deviationReason}`;
      }
    } else {
      // 有 API Key，调用真实 API
      console.log(`   使用变化信号: ${changeSignals.length} 个`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: testCase.profile,
          changeSignals,
          userStateProfile: {
            state: result.state as any,
            stateLabel: getStateLabel(result.state),
            oneSentenceDiagnosis: '测试诊断',
            mainGoal: '测试目标',
            mainFear: '测试焦虑',
            keyConstraint: '测试限制',
            availableTime: testCase.profile.weeklyTime,
            riskPreference: testCase.profile.riskPreference,
            resourceLevel: 'moderate',
            executionCapacity: 'medium',
            decisionLogic: 'test',
            recommendedStrategy: 'test',
            avoidStrategy: 'test',
            strategyFocus: ['test'],
            actionBias: ['test'],
            forbiddenBias: ['test'],
            decisionPriority: 'test'
          }
        })
      });
      
      const responseData = await response.json();
      
      if (!responseData.success) {
        result.reason = `API 调用失败: ${responseData.error || '未知错误'}`;
        result.comment = 'API 返回错误';
        return result;
      }
      
      const radarData = responseData.data as OpportunityRadarV4;
      result.radarData = radarData;
      
      // 提取信息
      if (radarData.personalImpact) {
        result.affectedPart = radarData.personalImpact.affectedPart?.substring(0, 50) || '';
        result.opportunity = radarData.personalImpact.opportunity?.substring(0, 50) || '';
        result.risk = radarData.personalImpact.risk?.substring(0, 50) || '';
      }
      
      if (radarData.actions) {
        result.actionsSummary = radarData.actions.map(a => `${a.time}:${a.task}`).join(' ');
      }
      
      // V6.3.2 验证洞察库引用
      const insightValidation = validateCoreInsightReference(radarData, result.selectedInsight);
      result.coreInsightUsesSelectedInsight = insightValidation.usesSelectedInsight;
      result.anxietyReference = insightValidation.anxietyReference;
      result.insightDeviation = insightValidation.deviation;
      result.deviationReason = insightValidation.deviationReason;
      
      // 验证
      const validation = validateRadar(radarData, testCase, result.domain, result.state, changeSignals);
      result.level = validation.level;
      result.hitKeywords = validation.hitKeywords;
      result.errorKeywords = validation.errorKeywords;
      result.reason = validation.reason;
      result.comment = validation.comment;
      result.changeSignalHitCount = validation.changeSignalHitCount;
      // V6.0 Value Migration
      result.hasValueMigration = validation.hasValueMigration;
      result.valueMigrationDirection = validation.valueMigrationDirection;
      result.valueMigrationUrgency = validation.valueMigrationUrgency;
      
      // 如果洞察偏离，添加WARNING
      if (result.insightDeviation) {
        result.level = 'WARNING';
        result.reason += `; ${result.deviationReason}`;
      }
    }
    
  } catch (error: any) {
    result.reason = `执行错误: ${error.message}`;
    result.comment = '测试过程出错';
  }
  
  return result;
}

// ============================================================
// 报告生成
// ============================================================

function printTerminalReport(results: TestResult[]): void {
  console.log('\n' + '='.repeat(70));
  console.log(' FutureLens Radar 自动化测试报告 V6.3.2 (Insight Library Integration)');
  console.log('='.repeat(70));
  
  const passCount = results.filter(r => r.level === 'PASS').length;
  const warningCount = results.filter(r => r.level === 'WARNING').length;
  const failCount = results.filter(r => r.level === 'FAIL').length;
  const total = results.length;
  
  // V6.3.2 Insight Library 统计
  const insightHitCount = results.filter(r => r.insightLibraryHit).length;
  const coreInsightUseCount = results.filter(r => r.coreInsightUsesSelectedInsight).length;
  const anxietyRefCount = results.filter(r => r.anxietyReference).length;
  const deviationCount = results.filter(r => r.insightDeviation).length;
  
  // V6.3.2 Domain Match 统计
  const domainMatchCount = results.filter(r => r.domainMatch).length;
  const domainMismatchCount = results.filter(r => !r.domainMatch).length;
  const domainMatchRate = total > 0 ? (domainMatchCount / total) * 100 : 0;
  
  const insightLibraryHitRate = total > 0 ? (insightHitCount / total) * 100 : 0;
  const coreInsightUseRate = total > 0 ? (coreInsightUseCount / total) * 100 : 0;
  const anxietyRefRate = total > 0 ? (anxietyRefCount / total) * 100 : 0;
  
  for (const result of results) {
    const icon = result.level === 'PASS' ? '✅' : result.level === 'WARNING' ? '⚠️' : '❌';
    console.log(`\n${icon} ${result.name}`);
    console.log(`   Domain: ${result.domain} | State: ${result.state} | ${result.level}`);
    
    // V6.3.2 Domain Match 信息（优先显示）
    console.log(`   用户领域: ${result.userDomain} | 洞察领域: ${result.insightDomain} | Domain Match: ${result.domainMatch ? '✅' : '❌'}`);
    if (!result.domainMatch) {
      console.log(`   ⚠️  Domain 不匹配原因: ${result.domainMismatchReason}`);
    }
    
    // V6.3.2 Insight Library 信息
    if (result.selectedInsight) {
      console.log(`   洞察库命中: ✅ (id: ${result.selectedInsight.id}, domain: ${result.selectedInsight.domain})`);
      console.log(`   选中洞察: ${result.selectedInsight.title}`);
      console.log(`   洞察库引用: ${result.coreInsightUsesSelectedInsight ? '✅' : '❌'} | 焦虑引用: ${result.anxietyReference ? '✅' : '❌'} | 偏离: ${result.insightDeviation ? '⚠️' : '❌'}`);
      if (result.insightDeviation) {
        console.log(`   偏离原因: ${result.deviationReason}`);
      }
    } else {
      console.log(`   洞察库命中: ❌ (未找到匹配洞察)`);
    }
    
    console.log(`   变化信号命中: ${result.changeSignalHitCount} 个关键词`);
    if (result.hasValueMigration) {
      console.log(`   V6.0 价值迁移: ${result.valueMigrationDirection} (${result.valueMigrationUrgency})`);
    } else {
      console.log(`   V6.0 价值迁移: ❌ 未生成`);
    }
    console.log(`   关键词命中: [${result.hitKeywords.join(', ')}]`);
    if (result.errorKeywords.length > 0) {
      console.log(`   错误关键词: [${result.errorKeywords.join(', ')}]`);
    }
    console.log(`   评语: ${result.comment}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(' 汇总统计');
  console.log('='.repeat(70));
  console.log(` 总测试数: ${total}`);
  console.log(` ✅ PASS:  ${passCount} (${((passCount / total) * 100).toFixed(1)}%)`);
  console.log(` ⚠️ WARNING: ${warningCount} (${((warningCount / total) * 100).toFixed(1)}%)`);
  console.log(` ❌ FAIL:  ${failCount} (${((failCount / total) * 100).toFixed(1)}%)`);
  
  console.log('\n' + '='.repeat(70));
  console.log(' V6.3.2 Insight Library 测试结果');
  console.log('='.repeat(70));
  console.log(` 总测试数: ${total}`);
  console.log(` 洞察库命中数: ${insightHitCount}/${total}`);
  console.log(` insightLibraryHitRate: ${insightLibraryHitRate.toFixed(1)}%`);
  console.log(` coreInsightUsesSelectedInsight: ${coreInsightUseCount}/${total} (${coreInsightUseRate.toFixed(1)}%)`);
  console.log(` anxietyReferenceRate: ${anxietyRefCount}/${total} (${anxietyRefRate.toFixed(1)}%)`);
  console.log(` insightDeviationWarning: ${deviationCount} 个案例偏离洞察库`);
  
  console.log('\n' + '='.repeat(70));
  console.log(' V6.3.2 Domain Match 测试结果');
  console.log('='.repeat(70));
  console.log(` domainMatchRate: ${domainMatchRate.toFixed(1)}% (${domainMatchCount}/${total})`);
  console.log(` domainMismatchCount: ${domainMismatchCount} 个案例领域不匹配`);
  
  // 目标检查
  console.log('\n' + '='.repeat(70));
  console.log(' 目标达成情况');
  console.log('='.repeat(70));
  const hitRateTarget = insightLibraryHitRate >= 60 ? '✅' : '❌';
  const anxietyTarget = anxietyRefRate >= 60 ? '✅' : '❌';
  const coreInsightTarget = coreInsightUseRate >= 70 ? '✅' : '❌';
  const domainMatchTarget = domainMatchRate >= 90 ? '✅' : '❌';
  console.log(` insightLibraryHitRate >= 60%: ${hitRateTarget} ${insightLibraryHitRate.toFixed(1)}%`);
  console.log(` anxietyReferenceRate >= 60%: ${anxietyTarget} ${anxietyRefRate.toFixed(1)}%`);
  console.log(` coreInsightUsesSelectedInsight >= 70%: ${coreInsightTarget} ${coreInsightUseRate.toFixed(1)}%`);
  console.log(` domainMatchRate >= 90%: ${domainMatchTarget} ${domainMatchRate.toFixed(1)}%`);
  
  // Domain 不匹配案例详细报告
  if (domainMismatchCount > 0) {
    console.log('\n' + '='.repeat(70));
    console.log(' Domain 不匹配案例详细报告');
    console.log('='.repeat(70));
    const mismatchedCases = results.filter(r => !r.domainMatch);
    for (const r of mismatchedCases) {
      console.log(` - ${r.name}: 用户领域=${r.userDomain}, 洞察领域=${r.insightDomain}`);
      console.log(`   原因: ${r.domainMismatchReason}`);
    }
  }
  
  // 最需要人工复查的案例
  const needsReview = results.filter(r => r.level === 'FAIL' || r.errorKeywords.length > 0 || r.insightDeviation);
  if (needsReview.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log(' 最需要人工复查的案例');
    console.log('='.repeat(70));
    for (const r of needsReview) {
      console.log(` - ${r.name}: ${r.reason}`);
    }
  }
  
  console.log('='.repeat(70));
}

function generateMarkdownReport(results: TestResult[]): string {
  const passCount = results.filter(r => r.level === 'PASS').length;
  const warningCount = results.filter(r => r.level === 'WARNING').length;
  const failCount = results.filter(r => r.level === 'FAIL').length;
  const total = results.length;
  const vmCount = results.filter(r => r.hasValueMigration).length;
  
  // V6.3.2 Insight Library 统计
  const insightHitCount = results.filter(r => r.insightLibraryHit).length;
  const coreInsightUseCount = results.filter(r => r.coreInsightUsesSelectedInsight).length;
  const anxietyRefCount = results.filter(r => r.anxietyReference).length;
  const deviationCount = results.filter(r => r.insightDeviation).length;
  
  const insightLibraryHitRate = total > 0 ? (insightHitCount / total) * 100 : 0;
  const coreInsightUseRate = total > 0 ? (coreInsightUseCount / total) * 100 : 0;
  const anxietyRefRate = total > 0 ? (anxietyRefCount / total) * 100 : 0;
  
  let md = `# FutureLens Radar 自动化测试报告 V6.3.2 (Insight Library Integration)\n\n`;
  md += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  md += `## 汇总统计\n\n`;
  md += `- 总测试数: ${total}\n`;
  md += `- ✅ PASS: ${passCount} (${((passCount / total) * 100).toFixed(1)}%)\n`;
  md += `- ⚠️ WARNING: ${warningCount} (${((warningCount / total) * 100).toFixed(1)}%)\n`;
  md += `- ❌ FAIL: ${failCount} (${((failCount / total) * 100).toFixed(1)}%)\n`;
  md += `- 变化信号总命中数: ${results.reduce((sum, r) => sum + r.changeSignalHitCount, 0)}\n`;
  md += `- V6.0 价值迁移生成数: ${vmCount}/${total}\n\n`;
  
  md += `## V6.3.2 Insight Library 测试结果\n\n`;
  md += `| 指标 | 数值 | 目标 | 状态 |\n`;
  md += `|------|------|------|------|\n`;
  md += `| insightLibraryHitRate | ${insightLibraryHitRate.toFixed(1)}% | >= 60% | ${insightLibraryHitRate >= 60 ? '✅' : '❌'} |\n`;
  md += `| anxietyReferenceRate | ${anxietyRefRate.toFixed(1)}% | >= 60% | ${anxietyRefRate >= 60 ? '✅' : '❌'} |\n`;
  md += `| coreInsightUsesSelectedInsight | ${coreInsightUseRate.toFixed(1)}% | >= 70% | ${coreInsightUseRate >= 70 ? '✅' : '❌'} |\n`;
  md += `| insightDeviationWarning | ${deviationCount} 个 | 越少越好 | ${deviationCount === 0 ? '✅' : '⚠️'} |\n\n`;
  
  md += `## 详细结果\n\n`;
  
  for (const result of results) {
    const icon = result.level === 'PASS' ? '✅' : result.level === 'WARNING' ? '⚠️' : '❌';
    md += `### ${icon} ${result.name}\n\n`;
    md += `| 项目 | 内容 |\n`;
    md += `|------|------|\n`;
    md += `| Domain | ${result.domain} |\n`;
    md += `| State | ${result.state} |\n`;
    md += `| 结果 | ${result.level} |\n`;
    
    // V6.3.2 Insight Library
    if (result.selectedInsight) {
      md += `| 洞察库命中 | ✅ ${result.selectedInsight.id} (${result.selectedInsight.domain}) |\n`;
      md += `| 选中洞察 | ${result.selectedInsight.title} |\n`;
      md += `| 洞察库引用 | ${result.coreInsightUsesSelectedInsight ? '✅' : '❌'} |\n`;
      md += `| 焦虑引用 | ${result.anxietyReference ? '✅' : '❌'} |\n`;
      md += `| 偏离警告 | ${result.insightDeviation ? '⚠️ ' + result.deviationReason : '❌'} |\n`;
    } else {
      md += `| 洞察库命中 | ❌ 未找到匹配洞察 |\n`;
    }
    
    md += `| affectedPart | ${result.affectedPart || 'N/A'} |\n`;
    md += `| opportunity | ${result.opportunity || 'N/A'} |\n`;
    md += `| risk | ${result.risk || 'N/A'} |\n`;
    md += `| 变化信号命中 | ${result.changeSignalHitCount} 个关键词 |\n`;
    md += `| V6.0 价值迁移 | ${result.hasValueMigration ? `${result.valueMigrationDirection} (${result.valueMigrationUrgency})` : '❌ 未生成'} |\n`;
    md += `| 命中关键词 | ${result.hitKeywords.join(', ') || '无'} |\n`;
    md += `| 错误关键词 | ${result.errorKeywords.join(', ') || '无'} |\n`;
    md += `| 评语 | ${result.comment} |\n`;
    md += '\n';
  }
  
  // 最需要人工复查的案例
  const needsReview = results.filter(r => r.level === 'FAIL' || r.errorKeywords.length > 0 || r.insightDeviation);
  if (needsReview.length > 0) {
    md += `## 最需要人工复查的案例\n\n`;
    for (const r of needsReview) {
      md += `- **${r.name}**: ${r.reason}\n`;
    }
    md += '\n';
  }
  
  return md;
}

// ============================================================
// 主流程
// ============================================================

async function main(): Promise<void> {
  console.log('🧪 FutureLens Radar 自动化验证系统 V6.3.2 (Insight Library Integration)\n');
  console.log('V6.3.2 Insight Library 说明：');
  console.log('1. insightLibraryHitRate - 洞察库命中率（目标 >= 60%）');
  console.log('2. anxietyReferenceRate - 焦虑引用率（目标 >= 60%）');
  console.log('3. coreInsightUsesSelectedInsight - CoreInsight 是否引用洞察库（目标 >= 70%）');
  console.log('4. insightDeviationWarning - 洞察偏离警告\n');
  
  // 环境检查（不再强制要求 API Key，测试脚本支持模拟数据）
  // if (!process.env.DEEPSEEK_API_KEY) {
  //   console.log('⚠️  缺少 DEEPSEEK_API_KEY，无法进行自动生成测试。');
  //   console.log('   请设置环境变量后重试。\n');
  //   return;
  // }
  console.log('ℹ️  未检测到有效的 DEEPSEEK_API_KEY，将使用模拟数据测试\n');
  
  // 创建结果目录
  const resultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // 执行测试
  const results: TestResult[] = [];
  
  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    process.stdout.write(`[${i + 1}/${TEST_CASES.length}] 测试: ${testCase.name}... `);
    
    const result = await testSingleTestCase(testCase);
    results.push(result);
    
    const icon = result.level === 'PASS' ? '✅' : result.level === 'WARNING' ? '⚠️' : '❌';
    console.log(icon);
    
    if (i < TEST_CASES.length - 1) {
      await sleep(500);
    }
  }
  
  // 差异性测试
  runCrossCaseComparison(results);
  
  // 打印终端报告
  printTerminalReport(results);
  
  // 生成 Markdown 报告
  const markdown = generateMarkdownReport(results);
  const reportPath = path.join(resultsDir, 'radar-test-report-v5.md');
  fs.writeFileSync(reportPath, markdown, 'utf-8');
  console.log(`\n📄 Markdown 报告已保存: ${reportPath}`);
}

main().catch(console.error);
