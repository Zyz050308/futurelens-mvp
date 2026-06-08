import type { FutureProfile, OpportunityRadar, BackgroundDomain, CurrentTask, SecondaryTask, AnxietyType, UserInsight, FutureSelfStatus, FutureSelfAttribute, DirectionLevel, DriveLevel, SignalLevel, PressureLevel } from '@/types/radar';

const PROFILE_KEY = 'futurelens-user-profile';
const RADAR_KEY = 'futurelens-latest-radar';
const RADAR_CREATED_AT_KEY = 'futurelens-latest-radar-created-at';

export function saveProfile(profile: FutureProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): FutureProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as FutureProfile;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROFILE_KEY);
}

export function hasProfile(): boolean {
  return loadProfile() !== null;
}

// ============================================================
// 关键词库定义
// ============================================================

// Background Domain 关键词
const DESIGN_KEYWORDS_BACKGROUND = [
  '设计', '视觉传达', '平面设计', '品牌设计', '品牌视觉', '视觉系统',
  'vi设计', 'logo设计', '包装设计', '海报设计', '字体设计', '版式设计',
  'ui设计', 'ux设计', '交互设计', '产品设计',
  '插画', '摄影', '视频', '剪辑',
  'figma', 'ps', 'ai绘画', 'midjourney', 'runway', 'stable diffusion',
  'sketch', 'adobe', 'canva', '主视觉', '延展物料',
];

const TECH_KEYWORDS_BACKGROUND = [
  '计算机', '软件', '编程', '代码', '开发',
  '前端', '后端', '全栈', '前端开发', '后端开发',
  'next.js', 'react', 'vue', 'angular', 'typescript', 'javascript',
  'python', 'java', 'golang', 'rust', 'c++', 'c#',
  '算法', '数据结构', 'ai开发', '机器学习', '深度学习',
  '程序员', '工程师', '技术栈', 'api', '数据库',
  'agent', 'saas', 'mvp', '独立开发',
];

const BUSINESS_KEYWORDS_BACKGROUND = [
  '商科', '市场营销', '营销', '运营', '电商', '电商运营',
  '管理', '工商管理', '行政管理',
  '传媒', '新闻传播', '广告',
  '文科', '中文系', '历史', '哲学',
  '销售', '大客户销售', '渠道销售',
  '新媒体', '新媒体运营', '内容运营', '用户运营', '活动运营',
  '小红书', '抖音', '视频号', '直播', '短视频',
  '创业', '副业', '自媒体', '个人ip', '博主',
  '品牌运营', '品牌增长', '品牌营销', '品牌策划', '品牌管理',
  '内容策划', '内容营销', '文案策划',
  '社群', '私域', '增长', '用户增长', '裂变',
  '变现', '商业模式', '盈利', '盈利模式', '收入',
  '接单', '客户', '商家', '甲方', '项目外包',
  '商业化', 'toc', 'tob', '企业服务',
];

const HUMANITIES_KEYWORDS = [
  '英语', '汉语言', '教育', '文学', '历史', '哲学', '法学', '新闻', '传播', '社会学', '心理学',
];

const LEARNING_KEYWORDS = [
  '学习', '备考', '考试', '雅思', '托福', '考研', '四六级', '留学', '出国',
];

// Current Task 关键词
const EXAM_KEYWORDS = [
  '雅思', '托福', '英语', '四六级', '考研', '考试', '备考', '留学', '出国', '成绩', '分数', '口语', '写作', '听力', '阅读',
];

const PRODUCT_VALIDATION_KEYWORDS = [
  '真实产品', '用户验证', '没人用', '产品价值', 'mvp', '上线', '真实用户', '反馈', '留存', '付费验证',
];

const STARTUP_KEYWORDS = [
  '创业', '做产品', '商业化', '项目', '公司', '独立开发', 'saas',
];

const MONEY_KEYWORDS = [
  '赚钱', '副业', '变现', '接单', '客户', '商家', '收入', '付费', '报价',
];

const JOB_KEYWORDS = [
  '就业', '找工作', '实习', '求职', '简历', '面试', '作品集', '岗位',
];

const TRANSITION_KEYWORDS = [
  '转型', '换方向', '转行', '从零开始', '新赛道',
];

const DIRECTION_KEYWORDS = [
  '找方向', '迷茫', '不知道适合什么', '不知道做什么', '未来方向',
];

const SKILL_GROWTH_KEYWORDS = [
  '学技能', '提升能力', '学习', '掌握', '训练', '提高效率',
];

// Secondary Task 关键词
const GRADUATE_MAJOR_KEYWORDS = [
  '研究生', '专业选择', '读研', '考研', '硕士', '方向选择', '研究方向', '申请方向', '保研',
];

const STUDY_ABROAD_KEYWORDS = [
  '留学', '出国', '海外', '申请', '国外', '海外院校', '海本', '雅思', '托福',
];

const PORTFOLIO_KEYWORDS = [
  '作品集', 'portfolio', '申请材料', '设计申请', '英文作品集', '项目集',
];

const CAREER_KEYWORDS = [
  '就业', '职业', '岗位', '工作', '就业指导', '职业方向', '未来工作', '实习', '求职',
];

// Anxiety Type 关键词
const EXAM_PRESSURE_KEYWORDS = ['雅思', '托福', '考研', '考试', '备考', '压力', '焦虑', '分数'];
const SKILL_OBSOLETE_KEYWORDS = ['淘汰', '过时', '技能贬值', '替代', '淘汰'];
const NO_DIRECTION_KEYWORDS = ['迷茫', '不知道', '方向', '未来'];
const NO_USERS_KEYWORDS = ['没人用', '用户', '验证'];
const INCOME_PRESSURE_KEYWORDS = ['收入', '赚钱', '副业', '变现'];
const PORTFOLIO_WEAK_KEYWORDS = ['作品集', '简历', '找工作', '求职'];
const COMPETITION_PRESSURE_KEYWORDS = ['竞争', '内卷', '压力', '竞争激烈'];

function countKeywordMatches(text: string, keywords: string[]): number {
  let count = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      count++;
    }
  }
  return count;
}

// ============================================================
// Background Domain 识别
// ============================================================

export function detectBackgroundDomain(profile: FutureProfile): BackgroundDomain {
  const majorText = profile.majorOrCareer.toLowerCase();
  const skillsText = profile.currentSkills.toLowerCase();
  const allText = `${majorText} ${skillsText}`;

  let scores: Record<BackgroundDomain, number> = {
    design: 0,
    tech: 0,
    business: 0,
    humanities: 0,
    learning: 0,
    unknown: 0,
  };

  scores.design += countKeywordMatches(majorText, DESIGN_KEYWORDS_BACKGROUND) * 3;
  scores.tech += countKeywordMatches(majorText, TECH_KEYWORDS_BACKGROUND) * 3;
  scores.business += countKeywordMatches(majorText, BUSINESS_KEYWORDS_BACKGROUND) * 3;
  scores.humanities += countKeywordMatches(majorText, HUMANITIES_KEYWORDS) * 3;
  scores.learning += countKeywordMatches(majorText, LEARNING_KEYWORDS) * 2;

  scores.design += countKeywordMatches(skillsText, DESIGN_KEYWORDS_BACKGROUND) * 2;
  scores.tech += countKeywordMatches(skillsText, TECH_KEYWORDS_BACKGROUND) * 2;
  scores.business += countKeywordMatches(skillsText, BUSINESS_KEYWORDS_BACKGROUND) * 2;
  scores.humanities += countKeywordMatches(skillsText, HUMANITIES_KEYWORDS) * 2;
  scores.learning += countKeywordMatches(skillsText, LEARNING_KEYWORDS) * 1;

  const sortedScores = Object.entries(scores)
    .filter(([k]) => k !== 'unknown')
    .sort(([, a], [, b]) => b - a);

  if (sortedScores[0][1] >= 2) {
    return sortedScores[0][0] as BackgroundDomain;
  }

  return 'unknown';
}

// ============================================================
// Current Task 识别（优先级最高）
// ============================================================

export function detectCurrentTask(profile: FutureProfile): CurrentTask {
  const goalText = profile.currentGoal.toLowerCase();
  const anxietyText = profile.currentAnxiety.toLowerCase();
  const interestsText = profile.interests.toLowerCase();
  const skillsText = profile.currentSkills.toLowerCase();
  const desiredText = profile.desiredOutcome.toLowerCase();
  const allText = `${goalText} ${anxietyText} ${interestsText} ${skillsText} ${desiredText}`;

  if (countKeywordMatches(allText, EXAM_KEYWORDS) > 0) {
    return 'exam';
  }

  if (countKeywordMatches(allText, PRODUCT_VALIDATION_KEYWORDS) > 0) {
    return 'product_validation';
  }

  if (countKeywordMatches(allText, STARTUP_KEYWORDS) > 0) {
    return 'startup';
  }

  if (countKeywordMatches(allText, MONEY_KEYWORDS) > 0 || desiredText === '赚钱') {
    return 'money';
  }

  if (countKeywordMatches(allText, JOB_KEYWORDS) > 0 || desiredText === '就业') {
    return 'job';
  }

  if (countKeywordMatches(allText, TRANSITION_KEYWORDS) > 0) {
    return 'transition';
  }

  if (countKeywordMatches(allText, DIRECTION_KEYWORDS) > 0 || desiredText === '找方向') {
    return 'direction';
  }

  if (countKeywordMatches(allText, SKILL_GROWTH_KEYWORDS) > 0 || desiredText === '学技能') {
    return 'skill_growth';
  }

  return 'unknown';
}

// ============================================================
// Secondary Task 识别（优先级：研究生 > 留学 > 作品集 > 就业）
// ============================================================

export function detectSecondaryTask(profile: FutureProfile): SecondaryTask {
  const goalText = profile.currentGoal.toLowerCase();
  const anxietyText = profile.currentAnxiety.toLowerCase();
  const interestsText = profile.interests.toLowerCase();
  const skillsText = profile.currentSkills.toLowerCase();
  const allText = `${goalText} ${anxietyText} ${interestsText} ${skillsText}`;

  // 优先级 1: 研究生专业选择
  if (countKeywordMatches(allText, GRADUATE_MAJOR_KEYWORDS) > 0) {
    return 'graduate_major_choice';
  }

  // 优先级 2: 留学申请
  if (countKeywordMatches(allText, STUDY_ABROAD_KEYWORDS) > 0) {
    return 'study_abroad';
  }

  // 优先级 3: 作品集申请
  if (countKeywordMatches(allText, PORTFOLIO_KEYWORDS) > 0) {
    return 'portfolio_application';
  }

  // 优先级 4: 职业选择
  if (countKeywordMatches(allText, CAREER_KEYWORDS) > 0) {
    return 'career_choice';
  }

  return 'none';
}

// ============================================================
// Anxiety Type 识别
// ============================================================

export function detectAnxietyType(profile: FutureProfile): AnxietyType {
  const anxietyText = profile.currentAnxiety.toLowerCase();
  const goalText = profile.currentGoal.toLowerCase();
  const allText = `${anxietyText} ${goalText}`;

  if (countKeywordMatches(allText, EXAM_PRESSURE_KEYWORDS) > 0) {
    return 'exam_pressure';
  }

  if (countKeywordMatches(allText, NO_USERS_KEYWORDS) > 0) {
    return 'no_users';
  }

  if (countKeywordMatches(allText, NO_DIRECTION_KEYWORDS) > 0) {
    return 'no_direction';
  }

  if (countKeywordMatches(allText, INCOME_PRESSURE_KEYWORDS) > 0) {
    return 'income_pressure';
  }

  if (countKeywordMatches(allText, PORTFOLIO_WEAK_KEYWORDS) > 0) {
    return 'portfolio_weak';
  }

  if (countKeywordMatches(allText, SKILL_OBSOLETE_KEYWORDS) > 0) {
    return 'skill_obsolete';
  }

  if (countKeywordMatches(allText, COMPETITION_PRESSURE_KEYWORDS) > 0) {
    return 'competition_pressure';
  }

  return 'unknown';
}

// ============================================================
// Risk and Outcome 调整
// ============================================================

function applyRiskAndOutcome(
  base: OpportunityRadar,
  outcome: string,
  riskPref: string
): OpportunityRadar {
  const result = JSON.parse(JSON.stringify(base)) as OpportunityRadar;

  if (riskPref === '稳妥') {
    result.next30Days = result.next30Days.map(w => ({
      ...w,
      action: w.action.includes('（') ? w.action : w.action + '（不建议立刻激进投入）',
    }));
  } else if (riskPref === '激进') {
    result.next30Days = result.next30Days.map(w => ({
      ...w,
      action: w.action.includes('（') ? w.action : w.action + '（建议快速行动，早犯错早调整）',
    }));
  }

  return result;
}

// ============================================================
// Exam Task 内容模板 - 支持阶段式内容
// ============================================================

function getExamRadar(profile: FutureProfile, insight: UserInsight): OpportunityRadar {
  const { backgroundDomain, secondaryTask } = insight;

  // 如果有副任务，使用阶段式内容
  if (secondaryTask !== 'none') {
    return getExamRadarWithSecondaryTask(profile, insight);
  }

  // 原有的纯考试内容
  const base: OpportunityRadar = {
    signals: [
      {
        title: 'AI 正在把英语学习从"刷资料"变成"随时可反馈的个人教练"',
        description:
          '过去雅思学习最大的问题是反馈慢、没人纠错、练习不连续。现在 AI 可以陪练口语、批改作文、生成听力和阅读练习。',
        whyItMatters:
          '这意味着你的学习不再受限于老师资源，只要有稳定时间，就能持续获得个性化反馈。',
      },
      {
        title: '备考的核心不再是资料数量，而是弱点识别和复盘效率',
        description:
          '资料太多反而会让人焦虑，真正重要的是知道自己哪里薄弱，并持续修正。',
        whyItMatters:
          '与其每天刷 10 篇阅读，不如认真分析 2 篇错题，找出反复出错的原因。',
      },
      {
        title: '出国考试竞争正在从"努力程度"变成"学习系统效率"',
        description:
          '同样每周 15 小时，谁能更快发现问题、调整计划，谁就更容易提高分数。',
        whyItMatters:
          '你不需要比所有人更努力，只需要比所有人更有策略。',
      },
    ],
    opportunities: [
      {
        title: 'AI 雅思学习工作流',
        description:
          '用 AI 建立每日单词、口语、写作、听力、阅读训练流程，而不是随机刷题。',
        fitReason: '你每周有固定投入时间，更适合建立稳定学习系统。',
      },
      {
        title: 'AI 口语陪练与写作批改',
        description:
          '每天用 AI 模拟 Part 1 / Part 2 / Part 3 口语题，并从词汇、逻辑、流利度、语法四个维度反馈。',
        fitReason: '及时反馈可以降低不确定感。',
      },
      {
        title: '个人弱项诊断表',
        description: '把每次练习结果记录成表格，标记弱项。',
        fitReason: '比起盲目学习，你更需要知道"哪里拖了分"。',
      },
      {
        title: '出国备考节奏管理',
        description: '把学习拆成每周任务，避免因为焦虑而乱学。',
        fitReason: '你已经明确准备出国考试，接下来需要的是节奏和反馈系统。',
      },
    ],
    risks: [
      {
        title: '不要把 AI 当成答案生成器',
        description: '如果只是让 AI 帮你写作文，成绩不会真正提高。',
        avoidAction: '每次都要求 AI 解释错误原因，并让你重新改写。',
      },
      {
        title: '不要同时收藏太多资料',
        description: '资料太多反而会焦虑，真正有效的是固定一套学习流程。',
        avoidAction: '限定每周只使用 1 套主资料 + 1 个 AI 复盘流程。',
      },
      {
        title: '不要只练输入，不练输出',
        description: '很多人背单词、刷阅读很多，但口语和写作没有持续输出。',
        avoidAction: '每天至少 20 分钟口语输出，隔天完成一篇小作文。',
      },
    ],
    next30Days: [
      {
        week: '第 1 周',
        action: '建立 AI 学习系统。让 AI 根据目标分数、当前水平生成学习计划，固定每天任务。',
        outcome: '明确了每天应该做什么，有了稳定的学习节奏。',
      },
      {
        week: '第 2 周',
        action: '开始口语和写作反馈训练。每天用 AI 模拟 1 组口语题，每两天写 1 篇段落，让 AI 反馈并二次修改。',
        outcome: '有了第一周的 AI 反馈记录。',
      },
      {
        week: '第 3 周',
        action: '建立错题和弱项表。统计最常出现的 3 个失分原因。',
        outcome: '找到了自己最薄弱的 2-3 个点。',
      },
      {
        week: '第 4 周',
        action: '做一次完整模拟测试。根据结果调整下个月计划。',
        outcome: '知道了自己的真实水平，下个月目标更明确。',
      },
    ],
  };

  return applyRiskAndOutcome(base, profile.desiredOutcome, profile.riskPreference);
}

// ============================================================
// 阶段式考试雷达 - 当有副任务时使用
// ============================================================

function getExamRadarWithSecondaryTask(profile: FutureProfile, insight: UserInsight): OpportunityRadar {
  const { backgroundDomain, secondaryTask } = insight;

  // 根据背景领域生成语言能力相关的长期优势描述
  const langAdvantageMap: Record<BackgroundDomain, { title: string; description: string }> = {
    design: {
      title: '设计背景 + 英语能力正在形成新的长期优势',
      description: '设计背景 + 英语能力，可以帮助你做英文作品集表达、海外设计案例分析、国际品牌研究和留学申请。',
    },
    tech: {
      title: '技术背景 + 英语能力正在形成新的长期优势',
      description: '技术背景 + 英语能力，可以帮助你阅读英文技术资料、申请海外项目、参与国际开源或远程协作。',
    },
    business: {
      title: '商科/运营背景 + 英语能力正在形成新的长期优势',
      description: '商科/运营背景 + 英语能力，可以帮助你理解海外商业案例、跨境电商、国际营销和留学申请。',
    },
    humanities: {
      title: '人文社科背景 + 英语能力正在形成新的长期优势',
      description: '人文社科背景 + 英语能力，可以帮助你深入学术研究、海外留学、论文写作和跨文化交流。',
    },
    learning: {
      title: '学习能力 + 英语能力正在形成新的长期优势',
      description: '良好的学习能力 + 英语能力，可以帮助你在任何领域建立竞争优势，包括留学申请和职业发展。',
    },
    unknown: {
      title: '语言能力正在成为个人发展的关键杠杆',
      description: '无论你选择什么方向，英语能力都能帮助你获取更广泛的资源、建立更大的优势。',
    },
  };

  // 根据副任务生成中期选择相关描述
  const secondaryTaskMap: Record<SecondaryTask, { label: string; direction: string }> = {
    graduate_major_choice: {
      label: '研究生方向选择',
      direction: '考研方向、专业选择、研究领域',
    },
    study_abroad: {
      label: '留学申请准备',
      direction: '海外院校申请、项目选择、申请材料',
    },
    portfolio_application: {
      label: '作品集与申请材料准备',
      direction: '作品集整理、申请材料撰写、项目展示',
    },
    career_choice: {
      label: '职业方向选择',
      direction: '就业方向、岗位选择、职业规划',
    },
    none: {
      label: '无',
      direction: '',
    },
  };

  const langAdvantage = langAdvantageMap[backgroundDomain];
  const secondaryInfo = secondaryTaskMap[secondaryTask];

  const base: OpportunityRadar = {
    signals: [
      {
        title: '考试不是孤立目标，而是升学、就业或转型的前置门槛',
        description:
          '你同时提到研究生专业选择、就业指导、留学申请或作品集，说明考试只是短期卡点。真正的问题是：考试通过后，下一步要去哪里。',
        whyItMatters:
          '与其只盯着考试分数，不如同时想清楚"考完之后我要做什么"。',
      },
      {
        title: 'AI 正在降低学习反馈成本',
        description:
          'AI 可以批改作文、模拟口语、拆解阅读听力错误，让备考从"盲目刷题"变成"持续复盘"。',
        whyItMatters:
          '这让你有更多精力去思考中期和长期的选择，而不只是埋头备考。',
      },
      {
        title: langAdvantage.title,
        description: langAdvantage.description,
        whyItMatters: '把考试学习和背景能力结合起来，可以让短期努力服务于长期目标。',
      },
    ],
    opportunities: [
      {
        title: 'AI 考试备考系统',
        description: '围绕目标分数和每周可投入时间，建立听说读写或对应考试科目的训练计划。',
        fitReason: '你当前的短期卡点是考试成绩，需要先建立稳定学习节奏。',
      },
      {
        title: '阶段选择地图',
        description: `用 AI 整理考试之后的路径选择：${secondaryInfo.direction}。`,
        fitReason: '你焦虑的不只是考试本身，而是考试之后的下一步选择。',
      },
      {
        title: '背景能力转化',
        description: langAdvantage.description.split('，')[1] || langAdvantage.description,
        fitReason: '把语言能力和专业背景结合起来，可以形成独特的竞争优势。',
      },
      {
        title: '长期方向探索',
        description: `每周用 AI 对比一个可能方向：包括${secondaryInfo.direction}、能力要求和个人匹配度。`,
        fitReason: '这可以避免你考完试后仍然不知道下一步去哪。',
      },
    ],
    risks: [
      {
        title: '不要只盯着考试分数，忽略下一步路径',
        description:
          '如果只提高分数，但不知道申请什么方向、找什么工作或准备什么材料，考试结束后仍然会焦虑。',
        avoidAction: '每周至少花 2 小时研究一个后续方向。',
      },
      {
        title: '不要把考试学习和专业背景割裂',
        description:
          '你不是单纯考试机器，考试能力应该服务于专业选择、申请材料、作品集、就业或转型。',
        avoidAction: '每周产出一个和背景相关的小材料，例如英文项目说明或方向对比表。',
      },
      {
        title: '不要过度追求稳妥导致拖延',
        description: '如果你的风险偏好是稳妥，要提醒：稳妥不等于不行动。',
        avoidAction: '把行动拆小，每周至少完成一个可见成果。',
      },
    ],
    next30Days: [
      {
        week: '第 1 周',
        action: `建立 AI 考试备考系统。根据目标分数、当前水平和每周可投入时间，拆分每日任务。同时列出 3 个可能的后续方向（包括${secondaryInfo.direction}）。`,
        outcome: '有了稳定的备考节奏，同时明确了 3 个可能的后续方向。',
      },
      {
        week: '第 2 周',
        action: `开始核心弱项训练。针对考试中的关键弱项进行 AI 反馈练习。同时用 AI 对比 3 个后续方向的要求、难度和出口。`,
        outcome: '备考有进展，同时有了初步的方向对比结果。',
      },
      {
        week: '第 3 周',
        action: `建立错题和弱项表。统计最常失分的 3 个原因。同时选择一个已有经历或项目，整理成可用于${secondaryInfo.label}的说明材料。`,
        outcome: '备考和方向准备同时有进展。',
      },
      {
        week: '第 4 周',
        action: `做一次完整模拟测试，根据结果调整下月计划。同时整理一页"下一阶段方向选择表"：最想走的路、最不适合的路、需要补强的能力。`,
        outcome: '知道了自己的真实水平，同时明确了下一阶段的主要方向。',
      },
    ],
  };

  return applyRiskAndOutcome(base, profile.desiredOutcome, profile.riskPreference);
}

// ============================================================
// Product Validation Task 内容模板
// ============================================================

function getProductValidationRadar(profile: FutureProfile, backgroundDomain: BackgroundDomain): OpportunityRadar {
  let base: OpportunityRadar;

  if (backgroundDomain === 'design') {
    base = {
      signals: [
        {
          title: 'AI 正在让设计能力从"交付图片"变成"交付可运行的产品体验"',
          description: '过去设计师的价值在于产出物：海报、Logo、界面。现在，设计师的价值在于能否把审美、判断和流程整合成一个用户愿意用的产品。',
          whyItMatters: '这意味着你的机会不只在接单，也在把设计判断力产品化。',
        },
        {
          title: '设计师做产品有独特优势',
          description: '技术人做产品往往忽略用户体验，设计师的审美和用户直觉反而是稀缺资产。用 AI 弥补技术短板，设计师完全能做出好产品。',
          whyItMatters: '你不需要成为程序员才能做产品，你需要的是把产品做出来的最小技术方案。',
        },
        {
          title: '没有真实用户验证的 AI 产品很容易变成好看的作品集',
          description: '很多设计师用 AI 做出看起来很棒的产品原型，但没有真实用户反复使用。',
          whyItMatters: '产品价值的唯一验证方式是：有没有人真的在用、愿意反馈、甚至付费。',
        },
      ],
      opportunities: [
        {
          title: 'AI 产品原型验证服务',
          description: '帮非技术创业者或学生快速把想法做成可演示页面、流程图和落地页，用于验证需求。',
          fitReason: '你能快速出原型，用 AI 加速执行，按项目制收费。',
        },
        {
          title: '设计能力产品化',
          description: '把你对品牌、页面、视觉系统的判断，包装成一个小工具、小报告或工作流。',
          fitReason: '一次开发，多次售卖。可以从 Notion 模板、Figma 插件或简单网页开始。',
        },
        {
          title: 'FutureLens 类个人机会发现工具',
          description: '用你自己的焦虑作为起点，验证是否还有同类学生需要 AI 时代方向判断。',
          fitReason: '这是你自己的真实需求，做出来自己也能用，同时验证产品方向。',
        },
      ],
      risks: [
        { title: '不要只做看起来很酷的 AI 产品', description: '如果没有人反复使用、反馈、迭代，那只是精致的作品集，不是产品。', avoidAction: '产品做出来之后，必须找真实用户测试。' },
        { title: '不要用设计精致掩盖需求不成立', description: '设计师往往追求完美，容易陷入"做出完美产品再给人看"的陷阱。', avoidAction: '先做最丑的版本，立刻给人看，根据反馈快速迭代。' },
        { title: '创业阶段最重要的不是页面完整', description: '很多设计师做产品从 UI 开始，但最重要的问题是：有没有人愿意填写、反馈、甚至付费。', avoidAction: '先把核心价值流跑通，哪怕界面很丑。' },
      ],
      next30Days: [
        { week: '第 1 周', action: '找 5 个同学访谈，记录他们对 AI、专业、就业、赚钱的真实焦虑。', outcome: '有了真实用户洞察，知道目标用户在焦虑什么。' },
        { week: '第 2 周', action: '基于访谈结果，用 Figma 或 Notion 做一个最小版本的工具。', outcome: '有了一个可以给人填写的最小产品。' },
        { week: '第 3 周', action: '让 5 个真实用户填写你的工具，观察他们填写时的第一反应。', outcome: '获得了真实用户反馈。' },
        { week: '第 4 周', action: '基于反馈改一版，问 3 个用户是否愿意付费或留下联系方式。', outcome: '完成第一次真实的需求验证。' },
      ],
    };
  } else if (backgroundDomain === 'tech') {
    base = {
      signals: [
        { title: 'AI 正在让独立开发者做出真正有价值的产品', description: '技术门槛从未如此之低。云服务按量付费，AI 帮你写代码，一个人就能做一个有人用的产品。', whyItMatters: '这不是最好的时代，也不是最坏的时代，这是最适合行动的时代。' },
        { title: '垂直场景的 AI 应用还是蓝海', description: '通用 AI 产品竞争激烈，但在某个具体场景深耕的产品很少。', whyItMatters: '选择一个你熟悉的领域，用 AI 解决一个具体问题，就能做出差异化产品。' },
        { title: '做产品最重要的不是技术，是找到愿意付费的真实用户', description: '很多开发者陷入"技术完美主义"，花了 3 个月做出一个功能完整的产品，结果没有人用。', whyItMatters: '产品成功的关键是：尽早找用户、尽早收钱、尽早迭代。' },
      ],
      opportunities: [
        { title: '垂直场景 AI SaaS 产品', description: '选择一个你熟悉的垂直场景，用 AI 解决一个具体问题。', fitReason: '垂直场景竞争少，用户粘性高，愿意为解决真实问题的产品付费。' },
        { title: 'AI 效率工具型产品', description: '做一个帮特定人群提效的工具：浏览器插件、工作流自动化、AI 写作助手。', fitReason: '工具型产品用户门槛低，付费意愿明确，迭代快。' },
      ],
      risks: [
        { title: '不要等到产品完美再推广', description: '很多开发者花了 3-6 个月做出一个"完整产品"，结果发现用户根本不感兴趣。', avoidAction: '用 1-2 周做出最丑的 MVP，立刻找人试用。' },
        { title: '不要只追技术热点而忽略用户需求', description: 'Agent 火就做 Agent，RAG 火就学 RAG，但从来没有基于真实需求选择技术。', avoidAction: '先确定要解决的真实问题，再选择最适合的技术。' },
      ],
      next30Days: [
        { week: '第 1 周', action: '找到 5 个目标领域的真实用户，做 30 分钟访谈，问他们的真实痛点。', outcome: '有了真实用户洞察和初步需求验证。' },
        { week: '第 2 周', action: '基于访谈结果，用 AI 辅助开发，用 1 周时间做出最丑的 MVP。', outcome: '有了可访问的产品。' },
        { week: '第 3 周', action: '找 10 个目标用户注册试用，每天跟进 1-2 个用户的反馈。', outcome: '有了真实用户数据和明确的迭代方向。' },
        { week: '第 4 周', action: '推出第一个付费版本（哪怕 9.9 元），让 3 个用户付费。', outcome: '完成第一次真实商业闭环。' },
      ],
    };
  } else {
    base = {
      signals: [
        { title: '产品验证是降低创业风险的最好方法', description: '在投入大量时间之前，先用最小成本验证是否有人真的需要这个产品。', whyItMatters: '与其在脑子里想完美方案，不如快速做出来，让真实用户告诉你是否有价值。' },
      ],
      opportunities: [
        { title: '最小可行性产品验证', description: '用 Notion、表单工具或简单网页做一个 MVP，测试你的想法。', fitReason: '不需要复杂技术，就可以快速验证。' },
      ],
      risks: [
        { title: '不要害怕你的想法被人嘲笑', description: '很多好产品一开始看起来都很傻。', avoidAction: '先找 5 个你信任的人聊聊，听听真实反馈。' },
      ],
      next30Days: [
        { week: '第 1 周', action: '找 5 个目标用户访谈，问他们的真实痛点。', outcome: '有了真实用户洞察。' },
        { week: '第 2 周', action: '做一个最简单的 MVP（可以是表单+人工回复）。', outcome: '有了可以测试的东西。' },
        { week: '第 3 周', action: '让 5 个用户试用，收集反馈。', outcome: '知道了产品哪里需要改进。' },
        { week: '第 4 周', action: '迭代一版，问用户是否愿意付费。', outcome: '完成了初步的付费意愿验证。' },
      ],
    };
  }

  return applyRiskAndOutcome(base, profile.desiredOutcome, profile.riskPreference);
}

// ============================================================
// Money Task 内容模板
// ============================================================

function getMoneyRadar(profile: FutureProfile, backgroundDomain: BackgroundDomain): OpportunityRadar {
  let base: OpportunityRadar;

  if (backgroundDomain === 'design') {
    base = {
      signals: [
        { title: 'AI 让你可以用设计能力快速变现', description: '过去做一套品牌视觉需要 1 周，现在用 AI 3 天就能完成初稿，然后用你的审美和策略能力做差异化。', whyItMatters: '这意味着你可以用更低的时间成本承接更多小单。' },
      ],
      opportunities: [
        { title: 'AI 品牌视觉服务', description: '帮小商家做低成本品牌视觉：Logo、配色、海报模板。', fitReason: '小商家缺设计能力，但愿意为提升品牌形象付费。' },
        { title: 'Notion/Figma 模板售卖', description: '把你的设计经验整理成可复用的模板，在 Gumroad 或其他平台售卖。', fitReason: '一次设计，多次售卖，边际成本为零。' },
      ],
      risks: [
        { title: '不要一开始就做低价竞争', description: '低价会让你的时间越来越不值钱。', avoidAction: '先把作品做好，找 3 个真实客户案例，再定价。' },
      ],
      next30Days: [
        { week: '第 1 周', action: '整理 3 个已有作品，补充背景说明，做成可展示的作品集。', outcome: '有了可以给客户看的案例。' },
        { week: '第 2 周', action: '找 1 个真实客户，免费或低价做一套品牌视觉服务。', outcome: '有了第一个真实案例。' },
        { week: '第 3 周', action: '整理案例，开始在小红书或朋友圈宣传。', outcome: '有了初步的曝光。' },
        { week: '第 4 周', action: '尝试接 1 个付费订单（哪怕只有 500 元）。', outcome: '完成第一次商业变现。' },
      ],
    };
  } else if (backgroundDomain === 'tech') {
    base = {
      signals: [
        { title: '技术人变现不需要等到产品上线', description: '你可以先做咨询、接外包、卖模板、做技术顾问，有了稳定收入再做自己的产品。', whyItMatters: '很多技术人陷入"产品执念"，但其实先赚钱验证市场，再做产品更稳妥。' },
      ],
      opportunities: [
        { title: 'AI 工具定制服务', description: '帮小商家或个人定制简单的 AI 工具：数据处理、自动化脚本、简单网页。', fitReason: '很多人有想法但不会代码，你可以帮他们实现。' },
        { title: '技术咨询与培训', description: '把你的编程经验整理成课程或咨询服务。', fitReason: '经验分享本身就有价值，而且可以建立个人品牌。' },
      ],
      risks: [
        { title: '不要只想着做产品，忽略身边的小机会', description: '很多人忽略了身边的小单，但小单其实是最稳妥的起步方式。', avoidAction: '先接 3 个小单，看看市场需要什么。' },
      ],
      next30Days: [
        { week: '第 1 周', action: '整理你的技术能力清单，把技能写得具体、让人能懂。', outcome: '清楚了自己能提供什么。' },
        { week: '第 2 周', action: '找 1 个身边的朋友或小商家，免费或低价帮他们解决一个技术问题。', outcome: '有了第一个真实客户案例。' },
        { week: '第 3 周', action: '开始在朋友圈或小红书宣传你的技术服务。', outcome: '有了初步的曝光。' },
        { week: '第 4 周', action: '尝试接 1 个付费订单（哪怕只有 1000 元）。', outcome: '完成第一次商业变现。' },
      ],
    };
  } else {
    base = {
      signals: [
        { title: 'AI 让内容变现的门槛大幅降低', description: '过去需要团队才能做的内容生意，现在一个人加 AI 就能搞定。', whyItMatters: '不管你是什么背景，你都有独特的经验可以分享，而 AI 可以帮你把经验变成内容。' },
      ],
      opportunities: [
        { title: 'AI 小红书/抖音内容代运营轻服务', description: '帮小商家或个人 IP 做内容代运营：用 AI 生成文案、配图、话题策划，按月收费。', fitReason: '商家愿意为能直接带来客流的内容服务付费。' },
        { title: '垂直领域内容 IP', description: '选择一个你熟悉的垂直领域，持续输出有价值的内容。', fitReason: '积累粉丝后，可接入广告、课程、咨询、社群等多种变现方式。' },
      ],
      risks: [
        { title: '不要一开始就追求大而全', description: '很多人一开始就想做平台、做生态，结果资源跟不上。', avoidAction: '从最小的切入点开始，先服务好 10 个人。' },
      ],
      next30Days: [
        { week: '第 1 周', action: '选择一个具体赛道，收集 20 条同类账号内容，分析规律。', outcome: '知道了什么内容在这个赛道有效。' },
        { week: '第 2 周', action: '开始发布内容，每周至少 3 篇。', outcome: '发布了至少 6 篇内容，有了初步反馈。' },
        { week: '第 3 周', action: '和 5 个评论或私信你的用户深入聊一聊。', outcome: '获得了真实用户洞察。' },
        { week: '第 4 周', action: '设计一个最小的付费产品（9.9 元、99 元都可以），尝试卖给 1-2 个人。', outcome: '完成第一次真实的商业闭环。' },
      ],
    };
  }

  return applyRiskAndOutcome(base, profile.desiredOutcome, profile.riskPreference);
}

// ============================================================
// 旧模板作为兜底
// ============================================================

function getDesignDefaultRadar(profile: FutureProfile): OpportunityRadar {
  const base: OpportunityRadar = {
    signals: [
      { title: 'AI 正在降低基础设计执行门槛', description: 'Midjourney、Figma AI、Runway 等工具让没有设计基础的人也能快速生成高质量视觉内容。', whyItMatters: '这意味着"会做图"本身的价值在贬值，但"知道做什么图、为什么做"的判断力价值在上升。' },
      { title: '客户越来越关注设计背后的逻辑', description: '雇主和客户不再只看你做得好不好看，更关注你能否讲清楚设计策略。', whyItMatters: '设计决策能力正在成为比设计执行能力更稀缺的资源。' },
      { title: '设计服务正在从定制走向产品化', description: '过去设计是纯服务，现在越来越多人把设计能力包装成模板、工具或工作流。', whyItMatters: '这是设计师扩大收入边界的机会：从按时间收费，转向按价值收费。' },
    ],
    opportunities: [
      { title: 'AI 品牌视觉系统设计', description: '帮小商家做品牌视觉：Logo 应用规范、色彩系统、字体系统、模板库。', fitReason: '结合你的设计能力与 AI 工具，降低交付成本，提升客单价。' },
      { title: 'AI 产品原型设计', description: '帮创业者快速将想法视觉化。', fitReason: '用 AI 将原型迭代速度提升 5-10 倍。' },
      { title: '设计模板与工作流产品', description: '把你的设计经验整理成可复用的模板包、AI 提示词包或 Figma 组件库。', fitReason: '一次开发，多次售卖，边际成本为零。' },
    ],
    risks: [
      { title: '只会软件操作的设计能力正在快速贬值', description: '如果你的技能集中在"用 Figma 画图"，这些工作正在被 AI 工具逐步替代。', avoidAction: '不要只学 AI 工具操作，要深入理解 AI 的能力边界和局限。' },
      { title: '单张海报式作品难以证明系统能力', description: '客户越来越精明，他们想知道你能否交付完整的品牌系统。', avoidAction: '每次作品展示都要有上下文：背景、目标、策略、成果。' },
    ],
    next30Days: [
      { week: '第 1 周', action: '整理 3 个已有作品，补充项目背景、目标用户、设计策略。', outcome: '有了能讲出完整设计逻辑的作品案例。' },
      { week: '第 2 周', action: '选择一个小品牌，用 AI 辅助完成一套品牌视觉延展。', outcome: '完成一个完整的品牌设计交付案例。' },
      { week: '第 3 周', action: '把案例整理成作品集页面。', outcome: '有了可对外展示的作品集。' },
      { week: '第 4 周', action: '找 3 个小商家或同学做需求访谈。', outcome: '验证了真实付费意愿。' },
    ],
  };
  return applyRiskAndOutcome(base, profile.desiredOutcome, profile.riskPreference);
}

function getTechDefaultRadar(profile: FutureProfile): OpportunityRadar {
  const base: OpportunityRadar = {
    signals: [
      { title: 'AI 正在提升程序员的单产效率', description: 'GitHub Copilot、Cursor 等工具让代码编写速度提升 2-5 倍。', whyItMatters: '"会写代码"的价值在下降，但"知道写什么、为什么写"的价值在上升。' },
      { title: '垂直领域 AI 应用正在爆发', description: '通用大模型已经成熟，但针对具体行业的 AI 应用还有大量空白。', whyItMatters: '懂技术 + 懂垂直行业的人才正在变得稀缺。' },
      { title: '小产品、小服务正在变得可行', description: '技术门槛降低、云成本降低、AI 辅助开发，让个人开发者也能快速做出解决真实问题的小产品。', whyItMatters: '个人开发者的黄金时代正在到来。' },
    ],
    opportunities: [
      { title: '垂直领域 AI 助手开发', description: '选择一个你熟悉的垂直领域，开发一个专属 AI 助手。', fitReason: '懂技术 + 懂垂直行业，就能创造出有差异化的产品。' },
      { title: 'AI 工具定制与落地服务', description: '帮中小企业选择和落地 AI 工具，按项目收费。', fitReason: '很多企业想用 AI 但不知道从哪里开始。' },
      { title: '独立开发者小产品', description: '做一个 1-10 人付费就能覆盖成本的小产品。', fitReason: '试错成本低，边际成本几乎为零。' },
    ],
    risks: [
      { title: '只会写 CRUD 的程序员正在被边缘化', description: 'AI 工具已经能很好地完成基础代码开发。', avoidAction: '不要只停留在"会用框架写业务逻辑"的层面。' },
      { title: '追逐技术热点但不落地等于浪费时间', description: '今天学 Agent，明天学 RAG，后天学新框架，但从来不用它们做真实项目。', avoidAction: '学技术的同时一定要配合真实项目。' },
    ],
    next30Days: [
      { week: '第 1 周', action: '列出 10 个你遇到过的真实痛点。', outcome: '有了可以做产品的真实点子。' },
      { week: '第 2 周', action: '选择 1 个点子，用 AI 辅助开发，1 周内做出 MVP。', outcome: '有了可以给人看、给人用的小产品。' },
      { week: '第 3 周', action: '找 5 个目标用户试用，记录反馈。', outcome: '获得真实用户反馈。' },
      { week: '第 4 周', action: '基于反馈迭代功能，尝试让 1-2 个用户付费。', outcome: '完成第一次真实商业闭环。' },
    ],
  };
  return applyRiskAndOutcome(base, profile.desiredOutcome, profile.riskPreference);
}

function getBusinessDefaultRadar(profile: FutureProfile): OpportunityRadar {
  const base: OpportunityRadar = {
    signals: [
      { title: 'AI 正在降低内容生产门槛', description: '写文案、做图、剪视频——这些过去需要专业团队的工作，现在一个人加 AI 就能搞定。', whyItMatters: '个人的内容生产能力不再受限于技术，而取决于对用户需求的理解。' },
      { title: '垂直细分领域正在成为新机会', description: '大而全的平台很难做，但小而美、精准服务某一类人群的项目正在起来。', whyItMatters: '普通人切入的机会更大，关键是选对细分方向。' },
      { title: '信任正在成为新的商业货币', description: '用户更愿意为信任付费——为你这个人付费，而不是为某个产品付费。', whyItMatters: '建立个人影响力虽然慢，但一旦建立，会成为长期资产。' },
    ],
    opportunities: [
      { title: 'AI 内容运营服务', description: '帮商家或博主用 AI 提升内容生产效率。', fitReason: '你懂内容运营，AI 帮你提升执行效率，两者结合是稀缺能力。' },
      { title: '垂直领域内容 IP', description: '选择一个你熟悉的垂直领域，持续输出有价值的内容。', fitReason: '积累粉丝后，可接入多种变现方式。' },
      { title: 'AI 辅助电商运营服务', description: '帮卖家优化商品页：卖点提炼、详情页文案、广告投放素材。', fitReason: '卖家愿意为能直接提升转化率的服务付费。' },
    ],
    risks: [
      { title: '一开始就追求大而全很容易失败', description: '很多人一开始就想做平台、做生态，结果资源跟不上。', avoidAction: '从最小的切入点开始，先服务好 10 个人。' },
      { title: '只看数据不看用户很难走得远', description: '一味追求涨粉、播放量，但没有真正理解用户。', avoidAction: '多和真实用户聊天，哪怕只有 10 个。' },
    ],
    next30Days: [
      { week: '第 1 周', action: '选择一个垂直领域，列出 30 个这个领域的人经常问的问题。', outcome: '有了内容选题方向。' },
      { week: '第 2 周', action: '开始发布内容，每周至少 3 篇。', outcome: '发布了至少 6 篇内容。' },
      { week: '第 3 周', action: '和 5 个评论或私信你的用户深入聊一聊。', outcome: '获得真实用户洞察。' },
      { week: '第 4 周', action: '设计一个最小的付费产品，尝试卖给 1-2 个人。', outcome: '完成第一次商业闭环。' },
    ],
  };
  return applyRiskAndOutcome(base, profile.desiredOutcome, profile.riskPreference);
}

function getGeneralRadar(profile: FutureProfile): OpportunityRadar {
  const base: OpportunityRadar = {
    signals: [
      { title: 'AI 正在重塑大多数工作的执行方式', description: '文档写作、数据分析，会议总结——这些日常工作正在被 AI 工具快速替代。', whyItMatters: '"会做事"的价值在下降，"会判断做什么事"的价值在上升。' },
      { title: '行业边界正在模糊，跨界能力溢价在上升', description: 'AI 让一个人可以快速具备跨领域能力：会写代码的销售、会做设计的运营。', whyItMatters: '只精通一个领域的"专才"竞争激烈，而能整合多领域能力的"通才"获得溢价。' },
      { title: '个人影响力正在成为新的资产', description: '普通人通过持续输出专业知识建立影响力，进而获得商业机会。', whyItMatters: '这是普通人建立个人品牌门槛最低的时代。' },
    ],
    opportunities: [
      { title: 'AI + 专业领域的复合能力建设', description: '用 AI 工具快速完成执行层工作，把精力集中在需要专业判断的领域。', fitReason: '结合你的专业背景和 AI 工具，成为"能用 AI 放大专业价值"的人。' },
      { title: '细分领域知识 IP', description: '在你熟悉的领域持续输出：行业洞察、方法论、案例分析。', fitReason: '时间投入一次，长期被动收益。可接入课程、咨询、社群等变现。' },
      { title: 'AI 工具选型和落地顾问', description: '帮中小企业或传统行业选择和落地 AI 工具。', fitReason: '不需要深度技术背景，需要理解业务 + 了解 AI 工具能力。' },
    ],
    risks: [
      { title: '"学 AI" 而不"用 AI 做具体事"等于没学', description: '很多人花大量时间学习 AI 工具，但从不实际用于工作。', avoidAction: '不要追求学完 AI，要追求用 AI 完成一件具体的事。' },
      { title: '追逐热门赛道但缺乏积累', description: '什么火追什么，但每次都浅尝辄止。', avoidAction: '选择一个与你专业相关的方向，深耕 6 个月。' },
    ],
    next30Days: [
      { week: '第 1 周', action: '写下你目前最费时间的三件事，用 AI 尝试优化其中一项。', outcome: '完成 1 件用 AI 提效的实际工作。' },
      { week: '第 2 周', action: '梳理你的专业能力清单，用这些作为内容选题方向。', outcome: '确定了 3 个内容选题方向。' },
      { week: '第 3 周', action: '选择一个平台，发布第一篇专业内容。', outcome: '发布了 1 篇有实质内容的帖子。' },
      { week: '第 4 周', action: '联系 3 个目标领域的人，做一次 30 分钟的语音交流。', outcome: '获得了 3 个真实需求洞察。' },
    ],
  };
  return applyRiskAndOutcome(base, profile.desiredOutcome, profile.riskPreference);
}

// ============================================================
// 主入口函数
// ============================================================

export function generateTaskBasedRadar(profile: FutureProfile): OpportunityRadar {
  const backgroundDomain = detectBackgroundDomain(profile);
  const currentTask = detectCurrentTask(profile);
  const secondaryTask = detectSecondaryTask(profile);
  const anxietyType = detectAnxietyType(profile);

  const insight: UserInsight = { backgroundDomain, currentTask, secondaryTask, anxietyType };

  switch (currentTask) {
    case 'exam':
      return getExamRadar(profile, insight);

    case 'product_validation':
      return getProductValidationRadar(profile, backgroundDomain);

    case 'startup':
      return getProductValidationRadar(profile, backgroundDomain);

    case 'money':
      return getMoneyRadar(profile, backgroundDomain);

    case 'job':
      return getDefaultForDomain(profile, backgroundDomain);

    case 'direction':
      return getGeneralRadar(profile);

    case 'transition':
      return getGeneralRadar(profile);

    case 'skill_growth':
      return getDefaultForDomain(profile, backgroundDomain);

    default:
      return getDefaultForDomain(profile, backgroundDomain);
  }
}

function getDefaultForDomain(profile: FutureProfile, domain: BackgroundDomain): OpportunityRadar {
  switch (domain) {
    case 'design':
      return getDesignDefaultRadar(profile);
    case 'tech':
      return getTechDefaultRadar(profile);
    case 'business':
      return getBusinessDefaultRadar(profile);
    default:
      return getGeneralRadar(profile);
  }
}

export function generateMockRadar(profile: FutureProfile): OpportunityRadar {
  return generateTaskBasedRadar(profile);
}

export function getUserInsight(profile: FutureProfile): UserInsight {
  return {
    backgroundDomain: detectBackgroundDomain(profile),
    currentTask: detectCurrentTask(profile),
    secondaryTask: detectSecondaryTask(profile),
    anxietyType: detectAnxietyType(profile),
  };
}

export function getPersonalizedSummary(profile: FutureProfile): string {
  const insight = getUserInsight(profile);
  const { backgroundDomain, currentTask, secondaryTask } = insight;
  
  const goalHasMeaning = hasRecognizableMeaning(profile.currentGoal);
  const anxietyHasMeaning = isEffectiveAnxiety(profile.currentAnxiety);

  const typeLabels: Record<BackgroundDomain, string> = {
    design: '创意设计',
    tech: '技术开发',
    business: '商业运营',
    humanities: '人文社科',
    learning: '学习备考',
    unknown: '个人发展',
  };

  const secondaryLabels: Record<SecondaryTask, string> = {
    graduate_major_choice: '研究生方向选择',
    study_abroad: '留学申请准备',
    portfolio_application: '作品集与申请材料',
    career_choice: '职业方向选择',
    none: '无',
  };

  // 检查目标是否有效
  const goalDisplay = goalHasMeaning ? profile.currentGoal : '你还没有提供可识别的具体目标';

  // 如果目标无效但焦虑有效，给出不同的提示
  if (!goalHasMeaning && anxietyHasMeaning) {
    return `基于你目前的背景：${profile.majorOrCareer}，你当前的主要焦虑是：${profile.currentAnxiety}。FutureLens 判断，你的压力确实存在，但目标还不够清晰。建议：把你的焦虑具体化——比如"担心雅思"可以变成"三个月内雅思达到6.5"，这样 Future Self 就能为你生成更具体的机会雷达。`;
  }

  // 如果目标和焦虑都无效
  if (!goalHasMeaning && !anxietyHasMeaning) {
    if (profile.majorOrCareer) {
      return `基于你目前的背景：${profile.majorOrCareer}，FutureLens 发现你的档案还没有提供清晰的目标和焦虑。你的 Future Self 还没有完全成型。请补充更具体的目标、能力和焦虑，机会雷达会更像你。`;
    }
    return `FutureLens 发现你的档案还没有提供清晰的目标和焦虑。请补充更具体的信息，Future Self 才能成型并为你生成专属的机会雷达。`;
  }

  // 如果当前任务是考试，且有副任务
  if (currentTask === 'exam' && secondaryTask !== 'none') {
    const secondaryLabel = secondaryLabels[secondaryTask];
    return `基于你目前的背景：${profile.majorOrCareer}，你当前的核心任务不是单纯准备考试，而是同时解决考试成绩和${secondaryLabel}。FutureLens 判断，你现在最应该关注的是：先用 AI 建立稳定的备考系统，同时把考试学习和你的专业背景、升学选择或就业方向结合起来，避免考完以后仍然不知道下一步去哪。`;
  }

  // 如果当前任务是考试，但没有副任务
  if (currentTask === 'exam') {
    return `基于你目前的背景：${profile.majorOrCareer}，你当前最重要的任务是提高英语学习效率、稳定成绩输出，并建立可持续的备考系统。FutureLens 判断，你现在最应该关注的是：建立一个可持续反馈、可复盘、可执行的 AI 备考系统，而不是盲目刷题。`;
  }

  if (currentTask === 'product_validation') {
    return `基于你目前的背景：${profile.majorOrCareer}，你的目标不是单纯提升专业能力，而是验证你的产品想法。FutureLens 判断，你现在最应该关注的是：用最小成本验证是否真的有人需要这个产品，而不是先把它做得很完美。`;
  }

  if (currentTask === 'money') {
    return `基于你目前的背景：${profile.majorOrCareer}，你当前最关心的是用 AI 找到可变现的路径。FutureLens 判断，你现在最应该关注的是：选择一个具体人群和具体场景，先做出能收费的小服务，而不是泛泛学习 AI 工具。`;
  }

  if (currentTask === 'direction') {
    return `基于你目前的背景：${profile.majorOrCareer}，你的目标是找到未来方向。FutureLens 判断，你现在最应该关注的是：通过低成本试错和用户访谈来探索可能性，而不是在脑子里空想完美路线。`;
  }

  return `基于你目前的背景：${profile.majorOrCareer}，你的目标是 ${goalDisplay}，主要焦虑是 ${profile.currentAnxiety}。FutureLens 判断，你当前最应该关注的是：从单一技能执行，转向可被市场验证的${typeLabels[backgroundDomain]}机会能力。`;
}

// 测试导出
export function _testDetection(profile: FutureProfile): UserInsight {
  return getUserInsight(profile);
}

// ============================================================
// Future Self 状态生成 - 人物属性版
// ============================================================

const STAGE_KEYWORDS: Record<string, string[]> = {
  '备考突破期': ['雅思', '托福', '考研', '考试', '备考', '留学', '出国', '成绩', '分数'],
  '产品验证期': ['创业', '产品', 'mvp', '真实用户', '上线', '用户验证', '产品价值'],
  '变现探索期': ['赚钱', '副业', '变现', '接单', '客户', '收入', '付费'],
  '职业准备期': ['就业', '求职', '实习', '作品集', '岗位', '简历', '面试'],
  '方向探索期': ['找方向', '迷茫', '不知道', '未来方向'],
};

const GROWTH_ROLE_MAP: Record<string, string> = {
  '赚钱': 'AI 变现探索者',
  '学技能': '能力升级者',
  '找方向': '方向探索者',
  '转型': '路径重构者',
  '创业': '机会创造者',
};

// ============================================================
// 输入有效性判断 - 严格版
// ============================================================

const REAL_OBJECT_KEYWORDS = [
  // 考试学习
  '雅思', '托福', '英语', '四六级', '考研', '考试', '备考', '留学', '出国', '成绩', '分数', '口语', '写作', '听力', '阅读', '单词', '复习', '学习',
  // 职业
  '就业', '求职', '实习', '岗位', '简历', '面试', '作品集', '职业', '工作', '研究生', '专业选择', '申请',
  // 创业产品
  '创业', '产品', 'mvp', '上线', '用户', '客户', '反馈', '留存', '付费', '商业化', '真实产品', '需求',
  // 赚钱副业
  '赚钱', '副业', '变现', '接单', '收入', '报价', '商家', '电商', '私域',
  // 能力领域
  '设计', '视觉', '品牌', 'figma', 'ps', 'ai', '编程', 'react', 'python', '运营', '小红书', '数据分析', '写作', '沟通', '摄影', '剪辑', '前端',
];

const MEANINGFUL_KEYWORDS = [
  '雅思', '托福', '英语', '四六级', '考研', '考试', '备考', '留学', '出国', '成绩', '分数', '口语', '写作', '听力', '阅读', '单词', '复习', '学习',
  '就业', '求职', '实习', '岗位', '简历', '面试', '作品集', '职业', '工作', '研究生', '专业选择', '申请',
  '创业', '产品', 'MVP', '上线', '用户', '客户', '反馈', '留存', '付费', '商业化', '真实产品', '没人用', '需求',
  '赚钱', '副业', '变现', '接单', '收入', '报价', '商家', '私域', '电商',
  '设计', '视觉', '品牌', 'Figma', 'PS', 'AI', '编程', 'React', 'Python', '运营', '小红书', '数据分析', '写作', '沟通', '摄影', '剪辑', '前端',
  '担心', '焦虑', '害怕', '迷茫', '不知道', '没通过', '没竞争力', '没人用', '不适合', '不确定', '压力', '很差', '薄弱', '不会'
];

// 意图词
const INTENT_WORDS = ['想', '担心', '害怕', '焦虑', '希望', '准备', '学习', '感兴趣', '打算', '计划'];

// 无意义模式
const MEANINGLESS_PATTERNS = [
  /^[0-9]+$/, // 纯数字
  /^[.。?？!！]+$/, // 纯符号
  /^无$/, /^暂无$/, /^没有$/, /^不知道$/, /^不清楚$/, /^随便$/, /^都行$/, /^还可$/, /^一般$/,
  /^好$/, /^很好$/, /^很牛$/, /^牛$/, /^可以$/, /^普通$/, /^没啥$/, /^还没有$/,
  /^还行$/,
];

// 检查是否包含真实对象关键词
function containsRealObject(value: string): boolean {
  const lower = value.toLowerCase();
  return REAL_OBJECT_KEYWORDS.some(k => lower.includes(k));
}

// 检查意图词后面是否有真实内容
function hasRealContentAfterIntentWord(value: string): boolean {
  if (!value) return false;
  
  // 提取意图词后面的内容
  for (const intent of INTENT_WORDS) {
    const index = value.indexOf(intent);
    if (index !== -1) {
      const afterContent = value.slice(index + intent.length).trim();
      if (!afterContent) return false; // 意图词后面没有内容
      
      // 检查后面的内容是否有效
      // 如果后面是数字、纯符号、重复词、无意义词，则无效
      if (/^[0-9]+$/.test(afterContent)) return false;
      if (/^[.。?？!！]+$/.test(afterContent)) return false;
      if (/(.)\1{2,}/.test(afterContent)) return false; // 重复字符
      
      // 如果后面是空泛词，无效
      const vagueAfter = ['很', '很牛', '牛', '好', '很好', '一般', '随便', '不知道', '还行'];
      if (vagueAfter.includes(afterContent)) return false;
      
      // 如果后面有真实对象关键词，有效
      if (containsRealObject(afterContent)) return true;
    }
  }
  
  // 没有意图词的情况下，只要包含真实对象关键词就算有效
  return containsRealObject(value);
}

function isMeaningfulInput(value: string): boolean {
  if (!value || value.trim().length < 1) return false;
  const trimmed = value.trim();
  
  // 1. trim 后为空
  if (trimmed.length < 1) return false;
  
  // 2. 纯数字
  if (/^[0-9]+$/.test(trimmed)) return false;
  
  // 3. 纯符号
  if (/^[.。?？!！]+$/.test(trimmed)) return false;
  
  // 4. 重复字符（3个以上）
  if (/(.)\1{2,}/.test(trimmed)) return false;
  
  // 5. 单独的空泛词
  for (const pattern of MEANINGLESS_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }
  
  // 6. 检查意图词后面是否有真实内容
  // "想123123"、"担心123123"、"想啊啊啊"等情况
  const hasIntent = INTENT_WORDS.some(w => trimmed.includes(w));
  if (hasIntent && !hasRealContentAfterIntentWord(trimmed)) {
    return false;
  }
  
  // 7. 数字占比超过60%，且没有真实对象关键词
  const digitCount = (trimmed.match(/[0-9]/g) || []).length;
  const digitRatio = digitCount / trimmed.length;
  if (digitRatio > 0.6 && !containsRealObject(trimmed)) {
    return false;
  }
  
  // 8. 如果没有意图词，必须包含真实对象关键词或足够长且有意义的文本
  if (!hasIntent && !containsRealObject(trimmed)) {
    // 检查是否是纯空泛描述
    const vagueOnly = ['想', '好', '很好', '一般', '还行', '随便', '不知道'].some(v => trimmed === v || trimmed.includes(v + '$'));
    if (vagueOnly && trimmed.length < 10) return false;
  }
  
  return true;
}

function containsMeaningfulKeyword(value: string): boolean {
  return containsRealObject(value);
}

// 检查是否包含可识别的有意义内容（用于判断真实目标）
// 区分"有效焦虑"和"有效目标"
function hasRecognizableMeaning(value: string): boolean {
  if (!value || value.trim().length < 1) return false;
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  
  // 1. 首先检查是否是中文乱句（无意义的随机字符组合）
  // 乱句特征：大量连续辅音字母、无常见实词、无法组成有意义的短语
  if (isChineseGibberish(trimmed)) {
    return false;
  }
  
  // 2. 如果包含真实对象关键词，认为有意义
  if (containsRealObject(trimmed)) {
    return true;
  }
  
  // 3. 检查是否有明确的目标结构（意图词 + 真实对象）
  const goalPatterns = [
    /想.{2,}([做学找开创立搞])/,  // 想做...、想学...
    /准备.{2,}/,                   // 准备...
    /希望.{2,}/,                   // 希望...
    /打算.{2,}/,                   // 打算...
    /计划.{2,}/,                   // 计划...
    /个月.+(达到|完成|通过)/,     // 三个月内达到...
    /每周.+(做学)/,                // 每周做...
    /毕业.+(前|后)/,               // 毕业前/后...
  ];
  
  for (const pattern of goalPatterns) {
    if (pattern.test(lower)) {
      // 同时确保意图词后面有真实内容
      if (hasRealContentAfterIntentWord(trimmed)) {
        return true;
      }
    }
  }
  
  // 4. 焦虑词 + 真实问题（可作为焦虑的有效表达，但不能作为明确目标）
  // 这类内容应该在焦虑强度判断中使用，但不直接提升方向感
  // 保持返回 false，让目标判断更严格
  
  return false;
}

// 检查是否是中文乱句（无意义字符组合）
function isChineseGibberish(value: string): boolean {
  if (!value) return false;
  
  // 如果包含真实对象关键词，不是乱句
  if (containsRealObject(value)) return false;
  
  // 移除常见标点和空格
  const cleaned = value.replace(/[，。！？、；：""''【】《》（）\s\d.,!?]+/g, '');
  if (cleaned.length < 4) return false; // 太短不判断
  
  // 统计连续辅音或无意义字符的比例
  // 常见真实中文词的特征：包含常见实词（的、了、在、有、这、那、上、下、去、来、出、回、见、想、要、可、会、能、以、为、因、如、于、即、从、而、但、却、又、也、还、而、且、或、并、等）
  const commonChineseChars = '的一是不了在人有我这中大为上个国们来时要去也要得着下过里看起小么都妈对起子得还才嘛便人道那马么从同么作得';
  
  let meaningfulCharCount = 0;
  for (const char of cleaned) {
    if (commonChineseChars.includes(char)) {
      meaningfulCharCount++;
    }
  }
  
  // 如果有意义字符占比低于 30%，认为是乱句
  const meaningfulRatio = meaningfulCharCount / cleaned.length;
  if (meaningfulRatio < 0.3) {
    return true;
  }
  
  // 检查是否有明显的无意义字符组合（如随机辅音串）
  const nonsensePatterns = [
    /[bcdfghjklmnpqrstvwxyz]{4,}/i,  // 连续4个以上辅音字母
    /[zcs]{3,}[h]?/i,               // zh/ch/sh 滥用
    /[^\\u4e00-\\u9fa5]{5,}/,        // 连续5个以上非汉字
  ];
  
  for (const pattern of nonsensePatterns) {
    if (pattern.test(value)) {
      return true;
    }
  }
  
  return false;
}

// 检查是否是"有效焦虑"（只有情绪词，没有具体对象）
function isEffectiveAnxiety(value: string): boolean {
  if (!value || !isMeaningfulInput(value)) return false;
  
  const lower = value.toLowerCase();
  
  // 焦虑词列表
  const anxietyWords = ['焦虑', '担心', '害怕', '迷茫', '压力', '不安', '紧张', '困惑', '烦躁'];
  const hasAnxietyWord = anxietyWords.some(w => lower.includes(w));
  
  if (!hasAnxietyWord) return false;
  
  // 检查是否只有情绪词而没有真实对象
  // 如果包含真实对象关键词，可能是有效的焦虑（有具体问题）
  if (containsRealObject(value)) {
    return true;
  }
  
  // "很焦虑 不知道该怎么办" 这种算有效焦虑
  const vagueAnxietyPatterns = [
    /很焦虑.*不知道/,
    /不知道该怎么办/,
    /不知道.*怎么办/,
    /压力很大/,
    /很迷茫/,
  ];
  
  for (const pattern of vagueAnxietyPatterns) {
    if (pattern.test(lower)) {
      return true;
    }
  }
  
  return false;
}

function getTextIntensity(value: string): 'low' | 'medium' | 'high' {
  const lower = value.toLowerCase();
  
  // 高强度词
  const HIGH_INTENSITY_WORDS = ['非常', '特别', '很焦虑', '特别焦虑', '严重', '完全', '一直', '总是', '崩溃', '压力很大', '很差', '没通过', '失败', '没人用', '没有竞争力', '完全不知道', '不知道怎么办', '很担心', '很迷茫'];
  if (HIGH_INTENSITY_WORDS.some(w => lower.includes(w))) return 'high';
  
  // 低强度词
  const LOW_INTENSITY_WORDS = ['有点', '稍微', '可能', '暂时', '了解一下', '试试看'];
  if (LOW_INTENSITY_WORDS.some(w => lower.includes(w))) return 'low';
  
  // 中强度词
  const MEDIUM_INTENSITY_WORDS = ['担心', '焦虑', '害怕', '不确定', '不太会', '不稳定', '不够', '不好', '一般', '还可以', '想提升', '想改善', '感兴趣'];
  if (MEDIUM_INTENSITY_WORDS.some(w => lower.includes(w))) return 'medium';
  
  // 有焦虑关键词但没有强度词 - 使用 isEffectiveAnxiety 判断
  if (isEffectiveAnxiety(value)) return 'medium';
  
  // 有真实对象关键词
  if (containsRealObject(value)) return 'medium';
  
  return 'low';
}

const SPECIFIC_PATTERNS = [
  // 有时间/结果/标准
  /月.*内|周.*内|天.*内|毕业.*前|学期.*前/, // 时间
  /达到|完成|实现|通过|获得|拿到|收到/, // 结果
  /6\.|6\.5|7\.|8\.|雅思.*分|托福.*分/, // 具体分数
  /投递.*岗位|接到.*客户|上线.*产品/, // 具体行动
  // 有明确对象和数量
  /3个|5个|10个|一个|第一个/,
];

function getSpecificityScore(value: string): number {
  // 无效输入返回0
  if (!isMeaningfulInput(value)) return 0;
  
  const lower = value.toLowerCase();
  
  // 3分：具体模式（有时间/结果/标准）
  for (const pattern of SPECIFIC_PATTERNS) {
    if (pattern.test(lower)) return 3;
  }
  
  // 检查是否"想+乱码/无意义词"
  const hasIntent = INTENT_WORDS.some(w => value.includes(w));
  if (hasIntent) {
    // 意图词后面必须有真实内容
    if (!hasRealContentAfterIntentWord(value)) return 0;
  }
  
  // 2分：有明确方向（有真实对象关键词）
  if (containsRealObject(value)) {
    // 检查是否有具体的方向词
    const specificWords = ['雅思', '托福', '考研', '留学', '就业', '求职', '实习', '创业', '产品', '副业', '作品集', '就业'];
    if (specificWords.some(w => lower.includes(w))) return 2;
    return 2;
  }
  
  // 1分：有效但模糊
  return 1;
}

function getRelevanceScore(profile: FutureProfile): number {
  const interests = profile.interests.toLowerCase();
  const skills = profile.currentSkills.toLowerCase();
  const goal = profile.currentGoal.toLowerCase();
  const allText = `${interests} ${skills} ${goal}`;
  
  // 使用 REAL_OBJECT_KEYWORDS 统计匹配的关键词数量
  const matchedKeywords = REAL_OBJECT_KEYWORDS.filter(k => allText.includes(k.toLowerCase()));
  const totalKeywords = matchedKeywords.length;
  
  // 检查是否有跨领域匹配（设计、技术、商业等）
  const designKeywords = ['设计', '视觉', '品牌', 'figma', 'ps', 'ai', '插画', '摄影', '视频'];
  const techKeywords = ['编程', '前端', '后端', 'react', 'python', 'java', '算法', '数据'];
  const businessKeywords = ['营销', '运营', '电商', '管理', '传媒', '销售', '新媒体'];
  
  const hasDesign = designKeywords.some(k => allText.includes(k));
  const hasTech = techKeywords.some(k => allText.includes(k));
  const hasBusiness = businessKeywords.some(k => allText.includes(k));
  const hasOverlap = [hasDesign, hasTech, hasBusiness].filter(Boolean).length >= 2;
  
  if (totalKeywords >= 6 && hasOverlap) return 3; // 高度匹配
  if (totalKeywords >= 3) return 2; // 机会成形
  if (totalKeywords >= 1) return 1; // 出现连接
  return 0; // 信号微弱
}

function isProfileMeaningful(profile: FutureProfile): boolean {
  const fields = [
    profile.majorOrCareer,
    profile.currentSkills,
    profile.interests,
    profile.currentGoal,
    profile.currentAnxiety,
    profile.weeklyTime,
  ];
  
  const meaningfulCount = fields.filter(isMeaningfulInput).length;
  return meaningfulCount >= 2;
}

function getDirectionLevelAndValue(goal: string): { value: number; level: DirectionLevel; description: string } {
  // 使用 hasRecognizableMeaning 判断目标有效性，而不是 isMeaningfulInput
  // 这样可以区分"有效焦虑"和"有效目标"
  if (!hasRecognizableMeaning(goal)) {
    return { value: 20, level: '迷雾中', description: '你还没有提供清晰目标，Future Self 暂时看不清下一步方向。' };
  }
  
  const specificity = getSpecificityScore(goal);
  const hasExam = /雅思|托福|考研|留学/.test(goal);
  const hasCareer = /就业|求职|作品集|工作|研究生/.test(goal);
  const hasProduct = /创业|产品|mvp|上线/.test(goal);
  
  if (specificity >= 3 || (hasExam && hasCareer)) {
    return { value: 80, level: '目标明确', description: '你的目标已经具体到可以直接规划行动。' };
  }
  
  if (specificity === 2 || hasExam || hasCareer || hasProduct) {
    return { value: 65, level: '方向初现', description: '你的目标已经比较明确，下一步需要拆成可执行任务。' };
  }
  
  if (specificity === 1) {
    return { value: 45, level: '有线索', description: '你已经提到了一些方向，但还缺少明确结果、时间或判断标准。' };
  }
  
  return { value: 30, level: '迷雾中', description: '你还没有提供清晰目标，Future Self 暂时看不清下一步方向。' };
}

function getDriveLevelAndValue(profile: FutureProfile): { value: number; level: DriveLevel; description: string } {
  const hasSkills = isMeaningfulInput(profile.currentSkills);
  const hasTime = isMeaningfulInput(profile.weeklyTime);
  const hasOutcome = isMeaningfulInput(profile.desiredOutcome);
  
  // 检查是否有真实技能关键词
  const skillsText = `${profile.currentSkills} ${profile.interests}`;
  const hasRealSkills = /设计|编程|运营|写作|数据分析|摄影|剪辑|前端/.test(skillsText);
  
  if (!hasSkills && !hasTime) {
    return { value: 20, level: '尚未启动', description: '你还没有说明自己能做什么或每周能投入多少时间。' };
  }
  
  if (hasRealSkills && hasTime && hasOutcome) {
    return { value: 70, level: '可以行动', description: '你已经具备开始行动的基础，可以进入小步验证。' };
  }
  
  if (hasRealSkills && hasTime) {
    return { value: 60, level: '可以行动', description: '你已经具备开始行动的基础，可以进入小步验证。' };
  }
  
  if (hasSkills || hasTime) {
    return { value: 45, level: '准备中', description: '你已经有一些能力基础，但行动路径还需要进一步明确。' };
  }
  
  return { value: 20, level: '尚未启动', description: '你还没有说明自己能做什么或每周能投入多少时间。' };
}

function getSignalLevelAndValue(profile: FutureProfile): { value: number; level: SignalLevel; description: string } {
  const relevance = getRelevanceScore(profile);
  
  if (relevance >= 3) {
    return { value: 85, level: '高度匹配', description: '你的能力、兴趣和目标之间已经形成强连接，适合快速行动。' };
  }
  
  if (relevance === 2) {
    return { value: 65, level: '机会成形', description: '你的能力、兴趣和目标正在形成较明确的机会方向。' };
  }
  
  if (relevance === 1) {
    return { value: 45, level: '出现连接', description: '你的背景和目标之间已经出现一些可探索的连接点。' };
  }
  
  return { value: 25, level: '信号微弱', description: '目前能力、兴趣和目标之间的连接还不清晰。' };
}

function getPressureLevelAndValue(anxiety: string): { value: number; level: PressureLevel; description: string } {
  // 只有有效焦虑才升高压力值
  if (!isEffectiveAnxiety(anxiety)) {
    return { value: 35, level: '平稳', description: '当前压力不高，可以保持探索节奏。' };
  }
  
  const intensity = getTextIntensity(anxiety);
  
  if (intensity === 'high') {
    return { value: 88, level: '高压状态', description: '你的压力已经比较强，建议先把问题拆成可控的小行动。' };
  }
  
  if (intensity === 'medium') {
    return { value: 68, level: '压力明显', description: '你的焦虑已经指向具体问题，需要拆解成短期任务。' };
  }
  
  return { value: 48, level: '轻度紧张', description: '你有一些不确定感，但还没有明显压迫行动。' };
}

export function detectStageLabel(profile: FutureProfile): string {
  if (!isProfileMeaningful(profile)) return '档案未成型';
  
  const allText = [
    profile.currentGoal,
    profile.currentAnxiety,
    profile.desiredOutcome,
    profile.interests,
  ].join(' ').toLowerCase();

  for (const [label, keywords] of Object.entries(STAGE_KEYWORDS)) {
    if (keywords.some(k => allText.includes(k))) {
      return label;
    }
  }

  return '机会探索期';
}

export function detectGrowthRole(profile: FutureProfile): string {
  if (!isProfileMeaningful(profile)) return '等待真实输入';
  
  const desired = profile.desiredOutcome;
  return GROWTH_ROLE_MAP[desired] || '等待选择成长方向';
}

export function generateFutureSelfStatus(profile: FutureProfile): FutureSelfStatus {
  try {
    const meaningful = isProfileMeaningful(profile);
    
    if (!meaningful) {
      return {
        directionSense: { value: 20, level: '迷雾中', label: '方向感', code: 'VISION', description: '你还没有提供清晰目标，Future Self 暂时看不清下一步方向。' },
        drive: { value: 20, level: '尚未启动', label: '行动力', code: 'DRIVE', description: '你还没有说明自己能做什么或每周能投入多少时间。' },
        opportunitySignal: { value: 25, level: '信号微弱', label: '机会感应', code: 'SIGNAL', description: '目前能力、兴趣和目标之间的连接还不清晰。' },
        pressure: { value: 30, level: '平稳', label: '压力值', code: 'PRESSURE', description: '当前还没有可识别的真实压力来源。' },
        stageLabel: '档案未成型',
        growthRole: '等待真实输入',
        isProfileMeaningful: false,
      };
    }
    
    const directionData = getDirectionLevelAndValue(profile.currentGoal);
    const driveData = getDriveLevelAndValue(profile);
    const signalData = getSignalLevelAndValue(profile);
    const pressureData = getPressureLevelAndValue(profile.currentAnxiety);
    
    return {
      directionSense: { ...directionData, label: '方向感', code: 'VISION' },
      drive: { ...driveData, label: '行动力', code: 'DRIVE' },
      opportunitySignal: { ...signalData, label: '机会感应', code: 'SIGNAL' },
      pressure: { ...pressureData, label: '压力值', code: 'PRESSURE' },
      stageLabel: detectStageLabel(profile),
      growthRole: detectGrowthRole(profile),
      isProfileMeaningful: true,
    };
  } catch (error) {
    console.error('Failed to generate FutureSelfStatus:', error);
    return {
      directionSense: {
        value: 20,
        level: '迷雾中',
        label: '方向感',
        code: 'VISION',
        description: '你还没有提供清晰目标，Future Self 暂时看不清下一步方向。'
      },
      drive: {
        value: 20,
        level: '尚未启动',
        label: '行动力',
        code: 'DRIVE',
        description: '你还没有说明自己能做什么或每周能投入多少时间。'
      },
      opportunitySignal: {
        value: 25,
        level: '信号微弱',
        label: '机会感应',
        code: 'SIGNAL',
        description: '目前能力、兴趣和目标之间的连接还不清晰。'
      },
      pressure: {
        value: 30,
        level: '平稳',
        label: '压力值',
        code: 'PRESSURE',
        description: '当前还没有可识别的真实压力来源。'
      },
      stageLabel: '档案未成型',
      growthRole: '等待真实输入',
      isProfileMeaningful: false
    };
  }
}

// 导出测试函数
export function _testFutureSelfStatus(profile: FutureProfile): FutureSelfStatus {
  return generateFutureSelfStatus(profile);
}

// 导出辅助函数供测试
export function _testIsMeaningfulInput(value: string): boolean {
  return isMeaningfulInput(value);
}

export function _testGetSpecificityScore(value: string): number {
  return getSpecificityScore(value);
}

export function _testGetTextIntensity(value: string): 'low' | 'medium' | 'high' {
  return getTextIntensity(value);
}

export function _testHasRealContentAfterIntentWord(value: string): boolean {
  return hasRealContentAfterIntentWord(value);
}

export function _testContainsRealObject(value: string): boolean {
  return containsRealObject(value);
}

export function _testHasRecognizableMeaning(value: string): boolean {
  return hasRecognizableMeaning(value);
}

export function _testIsChineseGibberish(value: string): boolean {
  return isChineseGibberish(value);
}

export function _testIsEffectiveAnxiety(value: string): boolean {
  return isEffectiveAnxiety(value);
}
