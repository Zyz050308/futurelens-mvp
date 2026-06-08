/**
 * FutureLens Real Change Engine V5.9
 * 
 * 功能：
 * 1. 根据用户 profile 识别职业领域
 * 2. 智能筛选与用户状态、目标、焦虑匹配的变化信号
 * 3. 变化信号带有明确的影响结构：
 *    - affectedCapabilities: 影响哪些能力
 *    - threatenedTasks: 威胁哪些任务
 *    - emergingOpportunities: 创造什么新机会
 * 
 */

import type { FutureProfile, ChangeSignal, UserStateProfile } from '@/types/radar';

export type UserDomain =
  | "architecture"
  | "design"
  | "finance"
  | "study_abroad"
  | "creator"
  | "ai_product"
  | "job_transition"
  | "general";

// ============================================================
// 关键词库
// ============================================================

const ARCHITECTURE_KEYWORDS = [
  '建筑', '工地', '施工', 'bim', '工程', '室内', '建模', '施工员', '安全员',
  '房地产', '图纸', 'revit', 'sketchup', '建筑工人', '建筑师', '土建', '结构',
  '装修', '装饰', '园林', '城市规划', '造价', '监理', '项目经理'
];

const DESIGN_KEYWORDS = [
  '设计', '视觉传达', '品牌', 'logo', 'ui', '平面', '包装', '作品集',
  'figma', 'ps', 'ai绘画', '海报', '字体', '版式', '插画', '摄影', '视觉',
  '品牌设计', '平面设计', '视觉设计', '交互设计', '用户体验', '用户体验设计'
];

const FINANCE_KEYWORDS = [
  '金融', '银行', '证券', '基金', '保险', '投资', '理财', '会计', '审计',
  '财务', '量化', '投顾', '风控', '资产管理', '信托', '期货', '期权',
  'CFA', 'CPA', '投行', '债券', '股权'
];

const STUDY_ABROAD_KEYWORDS = [
  '雅思', '托福', '留学', '申请', '英语', '考研', 'gpa', '文书', '签证',
  '院校', '语言', '出国', '海外', 'GRE', 'GMAT', 'sat', 'alevel',
  '留学申请', '海外院校', '海本', '英硕', '美研'
];

const CREATOR_KEYWORDS = [
  '短视频', '自媒体', '小红书', '抖音', 'b站', '内容', '博主', '拍摄',
  '剪辑', '直播', '账号', 'up主', 'vlog', '视频创作', '内容创作',
  '小红书博主', '抖音博主'
];

const AI_PRODUCT_KEYWORDS = [
  'ai产品', '产品经理', '创业', 'saas', '软件', '开发', '应用', 'mvp',
  '项目', 'next.js', 'typescript', 'prompt', 'agent', '独立开发',
  'side project', '产品设计', '用户增长', '商业化'
];

const JOB_TRANSITION_KEYWORDS = [
  '求职', '转行', '实习', '简历', '面试', '找工作', '招聘', '校招',
  '社招', 'offer', '试用期', '职场', '岗位', 'JD'
];

// ============================================================
// 完整变化信号池（带有影响结构）
// ============================================================

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
  {
    id: 'design-3',
    title: '作品集开始从视觉展示转向问题解决证明',
    summary: '优秀作品集不只是展示图面，而是说明你如何理解需求、拆解问题、形成方案并交付结果。',
    category: '作品集',
    sourceType: 'mock',
    affectedCapabilities: ['纯视觉作品展示'],
    threatenedTasks: ['只放作品不说过程', '无思考的作品集'],
    emergingOpportunities: ['设计案例展示', '问题解决型项目', '作品案例教学', '作品集辅导'],
    lowRelevanceDomains: ['finance', 'architecture']
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
  {
    id: 'finance-3',
    title: '个人理财内容和金融科普需求增加',
    summary: '普通人对理财、保险、基金和风险识别的内容需求增加，懂金融又能讲清楚的人有更多表达机会。',
    category: '金融内容',
    sourceType: 'mock',
    affectedCapabilities: [],
    threatenedTasks: [],
    emergingOpportunities: ['金融内容创作', '理财科普', '知识付费', '财务顾问'],
    lowRelevanceDomains: ['design', 'architecture']
  },
  
  // ========= 留学/考试领域变化信号 =========
  {
    id: 'study-1',
    title: '留学申请越来越强调真实项目和个人叙事',
    summary: '申请者不只是拼成绩，也需要能证明自己兴趣、项目经历和长期方向的材料。',
    category: '留学申请',
    sourceType: 'mock',
    affectedCapabilities: ['纯考试导向', '无项目经历'],
    threatenedTasks: ['只刷分不做项目', '无真实经历'],
    emergingOpportunities: ['项目经历积累', '个人叙事构建', '作品集准备', '研究经历'],
    lowRelevanceDomains: ['design', 'architecture', 'finance']
  },
  {
    id: 'study-2',
    title: '语言学习进入 AI 陪练时代',
    summary: 'AI 口语陪练、写作批改、单词计划和真题分析工具降低了备考门槛，但也要求学生更会安排任务。',
    category: '语言学习',
    sourceType: 'mock',
    affectedCapabilities: ['纯死记硬背', '低效刷题'],
    threatenedTasks: ['无计划拖延', '纯自学无反馈'],
    emergingOpportunities: ['AI辅助学习', '任务化备考', '学习方法优化', '进度追踪'],
    lowRelevanceDomains: ['design', 'architecture', 'finance']
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
  },
  {
    id: 'general-2',
    title: '个人能力越来越需要被作品化',
    summary: '不管是求职、接单还是申请，能够展示出来的作品、案例和结果，比单纯描述能力更有说服力。',
    category: '个人发展',
    sourceType: 'mock',
    affectedCapabilities: [],
    threatenedTasks: [],
    emergingOpportunities: ['作品积累', '案例展示', '成果记录', '个人品牌'],
    lowRelevanceDomains: []
  },
  {
    id: 'general-3',
    title: '低成本试错机会增加',
    summary: '内容平台、AI工具和线上协作让普通人可以用更低成本测试一个方向是否可行。',
    category: '机会探索',
    sourceType: 'mock',
    affectedCapabilities: [],
    threatenedTasks: [],
    emergingOpportunities: ['快速验证', '小范围测试', 'MVP开发', '低成本尝试'],
    lowRelevanceDomains: []
  }
];

// ============================================================
// 工具函数
// ============================================================

function countKeywordMatches(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      count++;
    }
  }
  return count;
}

function getDomainScore(profile: FutureProfile): Record<UserDomain, number> {
  // 合并所有文本字段
  const allText = [
    profile.age,
    profile.education,
    profile.majorOrCareer,
    profile.currentSkills,
    profile.interests,
    profile.currentGoal,
    profile.currentAnxiety,
    profile.desiredOutcome,
  ].filter(Boolean).join(' ');

  return {
    architecture: countKeywordMatches(allText, ARCHITECTURE_KEYWORDS),
    design: countKeywordMatches(allText, DESIGN_KEYWORDS),
    finance: countKeywordMatches(allText, FINANCE_KEYWORDS),
    study_abroad: countKeywordMatches(allText, STUDY_ABROAD_KEYWORDS),
    creator: countKeywordMatches(allText, CREATOR_KEYWORDS),
    ai_product: countKeywordMatches(allText, AI_PRODUCT_KEYWORDS),
    job_transition: countKeywordMatches(allText, JOB_TRANSITION_KEYWORDS),
    general: 0,
  };
}

// ============================================================
// 变化信号匹配评分系统
// ============================================================

type SignalMatchScore = {
  signal: ChangeSignal;
  score: number;
  reasons: string[];
};

function calculateSignalMatchScore(
  signal: ChangeSignal,
  domain: UserDomain,
  profile: FutureProfile,
  userStateProfile?: UserStateProfile
): SignalMatchScore {
  let score = 0;
  const reasons: string[] = [];
  
  const allText = [
    profile.majorOrCareer,
    profile.currentSkills,
    profile.currentGoal,
    profile.currentAnxiety,
    profile.interests,
    profile.desiredOutcome,
  ].filter(Boolean).join(' ').toLowerCase();
  
  // 1. 检查是否在低相关性领域中
  if (signal.lowRelevanceDomains?.includes(domain)) {
    score -= 100;
    reasons.push('信号与用户领域低相关');
  }
  
  // 2. 检查 affectedCapabilities 是否与用户技能匹配
  for (const capability of signal.affectedCapabilities) {
    if (allText.includes(capability.toLowerCase())) {
      score += 30;
      reasons.push(`信号影响能力：${capability}`);
    }
  }
  
  // 3. 检查 threatenedTasks 是否与用户焦虑匹配
  for (const task of signal.threatenedTasks) {
    if (allText.includes(task.toLowerCase())) {
      score += 25;
      reasons.push(`信号威胁任务：${task}`);
    }
    // 检查关键词是否匹配
    if (task.toLowerCase().includes('接单') && profile.currentGoal?.toLowerCase().includes('赚钱')) {
      score += 15;
      reasons.push(`信号与赚钱目标相关`);
    }
    if (task.toLowerCase().includes('替代') && profile.currentAnxiety?.toLowerCase().includes('替代')) {
      score += 20;
      reasons.push(`信号与AI替代焦虑相关`);
    }
  }
  
  // 4. 检查 emergingOpportunities 是否与用户目标匹配
  for (const opportunity of signal.emergingOpportunities) {
    if (allText.includes(opportunity.toLowerCase())) {
      score += 35;
      reasons.push(`信号提供机会：${opportunity}`);
    }
    // 关键词匹配
    if (opportunity.toLowerCase().includes('接单') && profile.currentGoal?.toLowerCase().includes('赚钱')) {
      score += 15;
      reasons.push(`机会与赚钱目标匹配`);
    }
    if (opportunity.toLowerCase().includes('稳定') && profile.desiredOutcome?.toLowerCase().includes('稳定')) {
      score += 20;
      reasons.push(`机会与稳定目标匹配`);
    }
    if (opportunity.toLowerCase().includes('证书') && profile.interests?.toLowerCase().includes('证书')) {
      score += 20;
      reasons.push(`机会与证书兴趣匹配`);
    }
    if (opportunity.toLowerCase().includes('创业') && profile.desiredOutcome?.toLowerCase().includes('创业')) {
      score += 25;
      reasons.push(`机会与创业目标匹配`);
    }
  }
  
  // 5. 根据用户状态微调
  if (userStateProfile) {
    switch (userStateProfile.state) {
      case 'career_security_anxiety':
        // 职业安全焦虑用户更关注稳定、证书、岗位
        if (signal.emergingOpportunities.some(o => o.includes('稳定') || o.includes('证书') || o.includes('岗位'))) {
          score += 20;
          reasons.push(`信号与职业安全焦虑状态匹配`);
        }
        break;
      case 'monetization_exploration':
      case 'monetization_sprint':
        // 赚钱用户更关注接单、机会、客户
        if (signal.emergingOpportunities.some(o => o.includes('接单') || o.includes('机会') || o.includes('客户'))) {
          score += 20;
          reasons.push(`信号与赚钱探索状态匹配`);
        }
        break;
      case 'entrepreneurship_trial':
        // 创业用户更关注客户、验证、MVP
        if (signal.emergingOpportunities.some(o => o.includes('客户') || o.includes('验证') || o.includes('MVP'))) {
          score += 20;
          reasons.push(`信号与创业试探状态匹配`);
        }
        break;
    }
  }
  
  return { signal, score, reasons };
}

// ============================================================
// 核心函数
// ============================================================

/**
 * 根据用户 profile 识别职业领域
 */
export function detectUserDomain(profile: FutureProfile): UserDomain {
  const scores = getDomainScore(profile);
  
  // 优先级顺序
  const priorityOrder: UserDomain[] = [
    'study_abroad',
    'ai_product',
    'architecture',
    'design',
    'finance',
    'creator',
    'job_transition',
    'general'
  ];

  // 找出得分最高的领域
  let maxScore = 0;
  let bestDomain: UserDomain = 'general';

  for (const domain of priorityOrder) {
    if (scores[domain] > maxScore) {
      maxScore = scores[domain];
      bestDomain = domain;
    }
  }

  // 如果没有任何匹配，返回 general
  if (maxScore === 0) {
    return 'general';
  }

  return bestDomain;
}

/**
 * 获取与用户 profile 匹配的变化信号（V5.9 增强版）
 * 
 * 筛选逻辑：
 * 1. 按领域、状态、目标、焦虑综合筛选
 * 2. 优先选择与用户当前情境高度相关的信号
 * 3. 过滤掉低相关性信号
 */
export function getChangeSignalsForProfile(
  profile: FutureProfile,
  userStateProfile?: UserStateProfile
): ChangeSignal[] {
  const domain = detectUserDomain(profile);
  
  // 计算所有信号的匹配分数
  const scoredSignals: SignalMatchScore[] = realChangeSignals.map(signal => 
    calculateSignalMatchScore(signal, domain, profile, userStateProfile)
  );
  
  // 按分数排序，只取正分且最高分的3个
  const sortedSignals = scoredSignals
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.signal);
  
  // 如果筛选后不够3个，补充通用信号
  if (sortedSignals.length < 3) {
    const generalSignals = realChangeSignals.filter(s => s.id.startsWith('general-'));
    for (const signal of generalSignals) {
      if (!sortedSignals.find(s => s.id === signal.id)) {
        sortedSignals.push(signal);
        if (sortedSignals.length >= 3) break;
      }
    }
  }
  
  return sortedSignals;
}

/**
 * 生成 profile 的 hash（用于缓存校验）
 */
export function generateProfileHash(profile: FutureProfile): string {
  // 简单的字符串化，用于比较是否相同
  return JSON.stringify(profile);
}

/**
 * 辅助函数：获取变化信号的详细描述（用于测试）
 */
export function getSignalDetails(signal: ChangeSignal): string {
  return [
    `【${signal.title}】`,
    `影响能力：${signal.affectedCapabilities.join(', ') || '无'}`,
    `威胁任务：${signal.threatenedTasks.join(', ') || '无'}`,
    `创造机会：${signal.emergingOpportunities.join(', ') || '无'}`,
  ].join('\n');
}
