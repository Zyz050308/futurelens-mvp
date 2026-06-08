/**
 * FutureLens State Engine V1
 * 
 * 任务：根据用户多维度信息判断用户当前所处的状态
 * 
 * 核心哲学：
 * - 不把人定义为某个职业
 * - 而是通过身份、目标、焦虑、限制、资源、时间、风险、偏好等多维度判断用户状态
 * 
 * 状态由以下因素共同决定：
 * 1. 用户想获得什么（wantToGet / desiredOutcome）
 * 2. 每周能投入多少时间（weeklyTime）
 * 3. 风险偏好（riskPreference）
 * 4. 当前能力（currentSkills）
 * 5. 当前焦虑（currentAnxiety）
 * 6. 当前目标（currentGoal）
 * 7. 兴趣（interests）
 */

import type { FutureProfile } from '@/types/radar';

// ============================================================
// 类型定义
// ============================================================

export type UserState =
  | "monetization_exploration"
  | "monetization_sprint"
  | "career_security_anxiety"
  | "direction_confusion"
  | "skill_upgrade"
  | "career_transition"
  | "entrepreneurship_trial"
  | "study_application"
  | "job_search_push"
  | "low_energy_survival"
  | "general_exploration";

export type UserStateProfile = {
  state: UserState;
  stateLabel: string;
  oneSentenceDiagnosis: string;
  mainGoal: string;
  mainFear: string;
  keyConstraint: string;
  availableTime: string;
  riskPreference: string;
  resourceLevel: string;
  executionCapacity: string;
  decisionLogic: string;
  recommendedStrategy: string;
  avoidStrategy: string;
  // V5.1 新增字段
  strategyFocus: string[];     // 当前状态下真正应该关注的策略方向
  actionBias: string[];        // 行动生成时应该优先选择的动作类型
  forbiddenBias: string[];      // 行动生成时应该避免的动作类型
  decisionPriority: string;     // 一句话说明当前状态为什么比职业更重要
};

// ============================================================
// 关键词库
// ============================================================

// 想获得相关关键词
const WANT_MONETIZATION = ['赚钱', '收入', '接单', '副业', '变现', '赚钱', 'money', 'income', 'freelance'];
const WANT_STABILITY = ['稳定', '考编', '国企', '铁饭碗', '事业编', '安稳'];
const WANT_SKILL = ['学技能', '提升', '能力', '学习', '提升能力'];
const WANT_TRANSITION = ['转行', '转型', '换行业', '跨行'];
const WANT_STARTUP = ['创业', '产品', '公司', 'mvp', '项目', '做产品', 'startup'];
const WANT_STUDY = ['留学', '雅思', '托福', '考研', '出国', '申请', '英语', '考试'];
const WANT_JOB = ['求职', '找工作', '实习', '面试', '简历', 'offer'];

// 时间相关
const TIME_LOW = ['0', '1', '2', '3', '少', '零碎'];
const TIME_MEDIUM = ['5', '6', '7', '8', '9', '10', '中等'];
const TIME_HIGH = ['15', '20', '多', '充足', '大量'];

// 风险偏好
const RISK_LOW = ['稳妥', '保守', '低风险', '稳健', '求稳'];
const RISK_MEDIUM = ['适中', '中等', '平衡'];
const RISK_HIGH = ['激进', '冒险', '高风险', '敢于尝试'];

// 焦虑相关
const ANXIETY_INCOME = ['收入', '没钱', '穷', '赚钱', '毕业', '就业', 'money'];
const ANXIETY_UNEMPLOYMENT = ['失业', '被替代', '裁员', '找不到', '就业', '前景', '行业下滑'];
const ANXIETY_SKILL = ['能力', '不够', '不会', '不行', '差距', '不足'];
const ANXIETY_DIRECTION = ['方向', '迷茫', '不知道', '做什么', '选择', '困惑'];
const ANXIETY_TIME = ['时间', '忙', '没时间', '挤不出'];

// ============================================================
// 工具函数
// ============================================================

function countMatches(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      count++;
    }
  }
  return count;
}

function getTimeLevel(weeklyTime?: string): 'low' | 'medium' | 'high' | 'unknown' {
  if (!weeklyTime) return 'unknown';
  
  const text = weeklyTime.toLowerCase();
  
  if (TIME_LOW.some(t => text.includes(t))) return 'low';
  if (TIME_HIGH.some(t => text.includes(t))) return 'high';
  if (TIME_MEDIUM.some(t => text.includes(t))) return 'medium';
  
  return 'unknown';
}

function getRiskLevel(riskPreference?: string): 'low' | 'medium' | 'high' | 'unknown' {
  if (!riskPreference) return 'unknown';
  
  const text = riskPreference.toLowerCase();
  
  if (RISK_LOW.some(t => text.includes(t))) return 'low';
  if (RISK_HIGH.some(t => text.includes(t))) return 'high';
  if (RISK_MEDIUM.some(t => text.includes(t))) return 'medium';
  
  return 'unknown';
}

function getSkillLevel(skills?: string): 'low' | 'medium' | 'high' | 'unknown' {
  if (!skills || skills.trim().length < 5) return 'unknown';
  
  // 简单的技能数量估算
  const skillsCount = skills.split(/[,，、]/).filter(s => s.trim().length > 0).length;
  
  if (skillsCount >= 4) return 'high';
  if (skillsCount >= 2) return 'medium';
  return 'low';
}

function mergeProfileFields(profile: FutureProfile): string {
  return [
    profile.age,
    profile.education,
    profile.majorOrCareer,
    profile.currentSkills,
    profile.interests,
    profile.currentGoal,
    profile.currentAnxiety,
    profile.desiredOutcome,
    profile.weeklyTime,
    profile.riskPreference,
  ].filter(Boolean).join(' ');
}

// ============================================================
// 状态判断函数
// ============================================================

function detectUserState(profile: FutureProfile): UserState {
  const text = mergeProfileFields(profile);
  
  // 获取各维度分数
  const wantMonetization = countMatches(text, WANT_MONETIZATION);
  const wantStability = countMatches(text, WANT_STABILITY);
  const wantSkill = countMatches(text, WANT_SKILL);
  const wantTransition = countMatches(text, WANT_TRANSITION);
  const wantStartup = countMatches(text, WANT_STARTUP);
  const wantStudy = countMatches(text, WANT_STUDY);
  const wantJob = countMatches(text, WANT_JOB);
  
  const anxietyIncome = countMatches(text, ANXIETY_INCOME);
  const anxietyUnemployment = countMatches(text, ANXIETY_UNEMPLOYMENT);
  const anxietySkill = countMatches(text, ANXIETY_SKILL);
  const anxietyDirection = countMatches(text, ANXIETY_DIRECTION);
  const anxietyTime = countMatches(text, ANXIETY_TIME);
  
  const timeLevel = getTimeLevel(profile.weeklyTime);
  const riskLevel = getRiskLevel(profile.riskPreference);
  const skillLevel = getSkillLevel(profile.currentSkills);
  
  // 1. 留学/考试申请期（最高优先级之一）
  if (wantStudy >= 2) {
    return 'study_application';
  }
  
  // 2. 求职推进期
  if (wantJob >= 2) {
    return 'job_search_push';
  }
  
  // 3. 创业试探期
  if (wantStartup >= 2 || (wantStartup >= 1 && riskLevel === 'high')) {
    return 'entrepreneurship_trial';
  }
  
  // 4. 职业转型期
  if (wantTransition >= 1 && anxietyUnemployment >= 1) {
    return 'career_transition';
  }
  
  // 5. 变现冲刺期（想赚钱 + 时间多 + 风险中高）
  if (wantMonetization >= 1 && (timeLevel === 'high' || timeLevel === 'medium') && (riskLevel === 'high' || riskLevel === 'medium')) {
    return 'monetization_sprint';
  }
  
  // 6. 职业安全焦虑期（想稳定 + 焦虑失业）
  if (wantStability >= 1 || (anxietyUnemployment >= 2 && riskLevel === 'low')) {
    return 'career_security_anxiety';
  }
  
  // 7. 低能量保守期（时间少 + 焦虑重）
  if (timeLevel === 'low' && (anxietyIncome >= 1 || anxietyUnemployment >= 1)) {
    return 'low_energy_survival';
  }
  
  // 8. 技能升级期（想提升能力 + 有明确方向）
  if (wantSkill >= 1 && anxietySkill >= 1 && skillLevel !== 'low') {
    return 'skill_upgrade';
  }
  
  // 9. 方向迷茫期（焦虑方向 + 目标模糊）
  if (anxietyDirection >= 2 || (anxietyDirection >= 1 && !profile.currentGoal)) {
    return 'direction_confusion';
  }
  
  // 10. 变现探索期（想赚钱 + 时间中等或较少）
  if (wantMonetization >= 1 && (timeLevel === 'low' || timeLevel === 'medium' || timeLevel === 'unknown')) {
    return 'monetization_exploration';
  }
  
  // 11. 通用探索期（默认）
  return 'general_exploration';
}

// ============================================================
// 状态详情生成
// ============================================================

function generateStateDetails(state: UserState, profile: FutureProfile): Omit<UserStateProfile, 'state'> {
  const text = mergeProfileFields(profile);
  const timeLevel = getTimeLevel(profile.weeklyTime);
  const riskLevel = getRiskLevel(profile.riskPreference);
  const skillLevel = getSkillLevel(profile.currentSkills);
  
  // 推断 mainGoal
  let mainGoal = '未知目标';
  if (profile.desiredOutcome) {
    mainGoal = profile.desiredOutcome;
  } else if (profile.currentGoal) {
    mainGoal = profile.currentGoal;
  }
  
  // 推断 mainFear
  let mainFear = '未知焦虑';
  if (text.includes('收入') || text.includes('没钱')) {
    mainFear = '收入不稳定或没有收入';
  } else if (text.includes('失业') || text.includes('裁员')) {
    mainFear = '职业被替代或失业';
  } else if (text.includes('方向') || text.includes('迷茫')) {
    mainFear = '不知道该往哪个方向发展';
  } else if (text.includes('能力') || text.includes('不够')) {
    mainFear = '能力不足以支撑目标';
  }
  
  // 推断 keyConstraint
  let keyConstraint = '暂无明显限制';
  if (timeLevel === 'low') {
    keyConstraint = `每周只有${profile.weeklyTime || '少量'}时间`;
  } else if (riskLevel === 'low') {
    keyConstraint = `风险偏好低，倾向于稳妥方案`;
  } else if (skillLevel === 'low') {
    keyConstraint = '当前技能积累较少';
  }
  
  // 推断 resourceLevel
  let resourceLevel = '中等';
  if (skillLevel === 'high') {
    resourceLevel = '较强（有多项技能）';
  } else if (skillLevel === 'low') {
    resourceLevel = '较弱（技能积累较少）';
  }
  
  // 推断 executionCapacity
  let executionCapacity = '中等';
  if (timeLevel === 'high') {
    executionCapacity = '较强（时间充足）';
  } else if (timeLevel === 'low') {
    executionCapacity = '较弱（时间有限）';
  }
  
  switch (state) {
    case 'monetization_exploration':
      return {
        stateLabel: '变现探索期',
        oneSentenceDiagnosis: '你不是缺能力，而是不知道自己的技能能不能产生收入。',
        mainGoal,
        mainFear,
        keyConstraint,
        availableTime: profile.weeklyTime || '未知',
        riskPreference: profile.riskPreference || '适中',
        resourceLevel,
        executionCapacity,
        decisionLogic: `变现探索 + 时间${timeLevel === 'low' ? '少' : '中等'} + 风险${riskLevel === 'low' ? '低' : '适中'}`,
        recommendedStrategy: '先做低成本市场验证，不要直接系统学习。先测试市场需求。',
        avoidStrategy: '不要一上来学习完整课程或做长期规划。先接触真实客户。',
        // V5.1 新增字段
        strategyFocus: [
          '低成本市场验证',
          '找到第一个真实需求',
          '确认技能能否产生收入'
        ],
        actionBias: [
          '平台搜索真实需求',
          '发布最小服务',
          '收集客户反馈',
          '完成一次低风险接单测试'
        ],
        forbiddenBias: [
          '系统学习大课程',
          '长期职业规划',
          '复杂创业项目',
          '只做作品不接触客户'
        ],
        decisionPriority: '这个用户当前最重要的不是成为更专业的建筑师，而是验证现有能力能不能产生第一笔收入。'
      };
      
    case 'monetization_sprint':
      return {
        stateLabel: '变现冲刺期',
        oneSentenceDiagnosis: '你已经有一定能力和时间，现在需要快速验证商业模式。',
        mainGoal,
        mainFear,
        keyConstraint,
        availableTime: profile.weeklyTime || '未知',
        riskPreference: profile.riskPreference || '适中',
        resourceLevel,
        executionCapacity,
        decisionLogic: `变现冲刺 + 时间${timeLevel} + 风险${riskLevel} + 能力${skillLevel}`,
        recommendedStrategy: '同时做作品、接单、平台发布。7天内发布服务，14天内拿到反馈。',
        avoidStrategy: '不要只调研不发布。速度是关键。',
        // V5.1 新增字段
        strategyFocus: [
          '快速发布验证',
          '多渠道接单',
          '作品展示和转化',
          '快速迭代反馈'
        ],
        actionBias: [
          '发布服务到多平台',
          '主动联系潜在客户',
          '完成可展示作品',
          '收集第一批付费反馈'
        ],
        forbiddenBias: [
          '只调研不行动',
          '等待完美再发布',
          '只做学习不产出',
          '分散精力做多个平台'
        ],
        decisionPriority: '这个用户有时间有风险偏好，需要快速验证变现路径，不是慢慢学习。'
      };
      
    case 'career_security_anxiety':
      return {
        stateLabel: '职业安全焦虑期',
        oneSentenceDiagnosis: '你担心的是未来职业稳定性，需要找到稳定的职业路径。',
        mainGoal,
        mainFear,
        keyConstraint,
        availableTime: profile.weeklyTime || '未知',
        riskPreference: profile.riskPreference || '低',
        resourceLevel,
        executionCapacity,
        decisionLogic: `职业安全 + 风险偏好${riskLevel}`,
        recommendedStrategy: '证书、岗位路径、稳定入口。查岗位要求、证书路线、考试时间。',
        avoidStrategy: '避免高风险创业、盲目接单、频繁换方向。',
        // V5.1 新增字段
        strategyFocus: [
          '稳定岗位路径',
          '岗位要求反推',
          '证书和资格',
          '降低失业风险'
        ],
        actionBias: [
          '搜索稳定岗位',
          '记录岗位要求',
          '查询证书条件',
          '制定考试/证书路径'
        ],
        forbiddenBias: [
          '盲目接单',
          '高风险创业',
          '只做内容账号',
          '长期不确定项目'
        ],
        decisionPriority: '这个用户不是想冒险，而是想降低未来失业风险，所以稳定路径优先，不是变现优先。'
      };
      
    case 'direction_confusion':
      return {
        stateLabel: '方向迷茫期',
        oneSentenceDiagnosis: '你还没有明确方向，不需要急着做长期计划。',
        mainGoal,
        mainFear,
        keyConstraint,
        availableTime: profile.weeklyTime || '未知',
        riskPreference: profile.riskPreference || '适中',
        resourceLevel,
        executionCapacity,
        decisionLogic: '方向迷茫 + 目标模糊',
        recommendedStrategy: '不要直接给长期路线。先做3个30分钟小实验测试不同方向。',
        avoidStrategy: '避免制定复杂的长期计划。先搞清楚方向再说。',
        // V5.1 新增字段
        strategyFocus: [
          '方向测试',
          '小实验',
          '排除错误方向',
          '发现兴趣和能力交集'
        ],
        actionBias: [
          '做三个30分钟测试',
          '记录喜欢/不喜欢',
          '比较行动感受',
          '快速排除一个方向'
        ],
        forbiddenBias: [
          '长期路线规划',
          '直接定职业',
          '大项目',
          '系统学习'
        ],
        decisionPriority: '这个用户现在不适合直接选路线，应该先通过小实验确定方向。方向比速度重要。'
      };
      
    case 'skill_upgrade':
      return {
        stateLabel: '技能升级期',
        oneSentenceDiagnosis: '你知道自己的技能差距，现在需要系统提升并产出作品。',
        mainGoal,
        mainFear,
        keyConstraint,
        availableTime: profile.weeklyTime || '未知',
        riskPreference: profile.riskPreference || '适中',
        resourceLevel,
        executionCapacity,
        decisionLogic: `技能升级 + 焦虑能力不足 + 能力${skillLevel}`,
        recommendedStrategy: '任务化学习 + 输出作品。学习一个工具后必须产出一个可展示成果。',
        avoidStrategy: '避免只看教程不产出。产出才是学习的目的。',
        // V5.1 新增字段
        strategyFocus: [
          '任务化学习',
          '学完立刻产出',
          '补齐关键技能',
          '形成可展示成果'
        ],
        actionBias: [
          '学习一个具体工具',
          '产出一个小作品',
          '对比优秀案例',
          '记录技能差距'
        ],
        forbiddenBias: [
          '只看教程',
          '收藏资料',
          '不产出作品',
          '学太多不实践'
        ],
        decisionPriority: '这个用户需要把学习变成输出，否则学习不会改变未来轨迹。产出才是学习的意义。'
      };
      
    case 'career_transition':
      return {
        stateLabel: '职业转型期',
        oneSentenceDiagnosis: '你想离开当前职业方向，需要用新方向的样本证明自己。',
        mainGoal,
        mainFear,
        keyConstraint,
        availableTime: profile.weeklyTime || '未知',
        riskPreference: profile.riskPreference || '适中',
        resourceLevel,
        executionCapacity,
        decisionLogic: `转行意愿 + 对当前职业不满意`,
        recommendedStrategy: '用小项目证明新方向能力。做转型样本、案例、简历项目。',
        avoidStrategy: '避免裸辞、直接大跨度转行。先做样本再决定。',
        // V5.1 新增字段
        strategyFocus: [
          '转型样本',
          '可迁移能力',
          '新方向小项目',
          '降低转型风险'
        ],
        actionBias: [
          '做一个新方向案例',
          '整理可迁移能力',
          '搜索目标岗位',
          '建立转型作品'
        ],
        forbiddenBias: [
          '裸辞',
          '直接大跨度转行',
          '只想不做',
          '直接放弃现有经验'
        ],
        decisionPriority: '这个用户需要用小项目证明自己能进入新方向，而不是直接押注转行。样本比决心重要。'
      };
      
    case 'entrepreneurship_trial':
      return {
        stateLabel: '创业试探期',
        oneSentenceDiagnosis: '你想做产品或创业，但需要先验证需求是否真实存在。',
        mainGoal,
        mainFear,
        keyConstraint,
        availableTime: profile.weeklyTime || '未知',
        riskPreference: profile.riskPreference || '高',
        resourceLevel,
        executionCapacity,
        decisionLogic: `创业意愿 + 时间${timeLevel} + 风险${riskLevel}`,
        recommendedStrategy: '用户访谈 + MVP + 验证需求。先采访3个目标用户，不要先写完整产品。',
        avoidStrategy: '避免闭门造车、先做复杂系统。需求验证优先。',
        // V5.1 新增字段
        strategyFocus: [
          '用户访谈',
          '需求验证',
          '最小产品',
          '本地获客测试'
        ],
        actionBias: [
          '采访潜在客户',
          '发布测试服务',
          '验证痛点',
          '做一个小型MVP'
        ],
        forbiddenBias: [
          '先做完整产品',
          '闭门造车',
          '只学习理论',
          '过早设计品牌'
        ],
        decisionPriority: '这个用户当前需要验证真实需求，而不是继续完善想法。需求验证优先于产品开发。'
      };
      
    case 'study_application':
      return {
        stateLabel: '留学/考试申请期',
        oneSentenceDiagnosis: '你需要同时准备考试和申请材料，需要任务化的备考策略。',
        mainGoal,
        mainFear,
        keyConstraint,
        availableTime: profile.weeklyTime || '未知',
        riskPreference: profile.riskPreference || '适中',
        resourceLevel,
        executionCapacity,
        decisionLogic: '考试/留学申请目标',
        recommendedStrategy: '任务化备考 + 材料建设 + 项目证明。真题、错题、作品集、申请材料同步推进。',
        avoidStrategy: '避免泛泛背单词、泛泛准备。任务化才是高效备考。',
        // V5.1 新增字段
        strategyFocus: [
          '考试目标',
          '申请材料',
          '作品集/项目证明',
          '时间表'
        ],
        actionBias: [
          '做真题',
          '整理申请清单',
          '补一个项目证明',
          '制定备考任务'
        ],
        forbiddenBias: [
          '泛泛学习英语',
          '只看经验帖',
          '无目标刷资料',
          '只收藏不行动'
        ],
        decisionPriority: '这个用户当前最重要的是申请结果和可证明材料，而不是泛泛成长。任务化才是关键。'
      };
      
    case 'job_search_push':
      return {
        stateLabel: '求职推进期',
        oneSentenceDiagnosis: '你需要找到工作，需要用作品和简历证明自己的能力。',
        mainGoal,
        mainFear,
        keyConstraint,
        availableTime: profile.weeklyTime || '未知',
        riskPreference: profile.riskPreference || '适中',
        resourceLevel,
        executionCapacity,
        decisionLogic: `求职目标 + 焦虑没有机会`,
        recommendedStrategy: '简历项目化 + 岗位反推。搜索岗位、提取要求、补案例。',
        avoidStrategy: '避免只改简历不补作品。作品才是硬通货。',
        // V5.1 新增字段
        strategyFocus: [
          '岗位反推',
          '简历项目化',
          '补作品案例',
          '面试准备'
        ],
        actionBias: [
          '搜索岗位',
          '提取岗位要求',
          '修改简历项目',
          '补一个案例'
        ],
        forbiddenBias: [
          '只改简历排版',
          '泛泛学习',
          '长期等待机会',
          '只投不跟进'
        ],
        decisionPriority: '这个用户需要用岗位要求反推行动，而不是继续空泛提升。岗位要求才是标准。'
      };
      
    case 'low_energy_survival':
      return {
        stateLabel: '低能量保守期',
        oneSentenceDiagnosis: '你现在时间和精力都有限，只能做最小行动。',
        mainGoal,
        mainFear,
        keyConstraint: `每周只有${profile.weeklyTime || '很少'}时间 + 焦虑较重`,
        availableTime: profile.weeklyTime || '很少',
        riskPreference: profile.riskPreference || '低',
        resourceLevel,
        executionCapacity: '较弱（时间和精力都有限）',
        decisionLogic: `时间${timeLevel} + 风险${riskLevel} + 焦虑较重`,
        recommendedStrategy: '只给最小行动，不给宏大计划。每天15-30分钟任务。',
        avoidStrategy: '避免大计划、复杂学习路线、创业型任务。先活下来再说。',
        // V5.1 新增字段
        strategyFocus: [
          '最小行动',
          '降低行动门槛',
          '每天15-30分钟推进',
          '避免复杂任务'
        ],
        actionBias: [
          '截图记录',
          '完成一个微任务',
          '回复一个询问',
          '保存一个参考案例'
        ],
        forbiddenBias: [
          '系统学习',
          '创业',
          '多平台运营',
          '长期项目',
          '高风险公开承诺'
        ],
        decisionPriority: '这个用户的核心限制是时间和精力，不应该给他复杂路线。最小行动才是可行的。'
      };
      
    case 'general_exploration':
    default:
      return {
        stateLabel: '通用探索期',
        oneSentenceDiagnosis: '你的信息还不够充分，需要先补充更多信息才能给出精准建议。',
        mainGoal,
        mainFear,
        keyConstraint,
        availableTime: profile.weeklyTime || '未知',
        riskPreference: profile.riskPreference || '适中',
        resourceLevel,
        executionCapacity,
        decisionLogic: '信息不足或无明显倾向',
        recommendedStrategy: '补充信息 + 做小测试。通过3个小任务判断方向。',
        avoidStrategy: '避免做重大决定。先搞清楚状况。',
        // V5.1 新增字段
        strategyFocus: [
          '补充信息',
          '小测试',
          '识别真实目标',
          '降低误判'
        ],
        actionBias: [
          '完成信息补充',
          '做一个30分钟测试',
          '比较三个方向',
          '记录行动反馈'
        ],
        forbiddenBias: [
          '强行长期规划',
          '直接定职业',
          '复杂项目',
          '大投入'
        ],
        decisionPriority: '当前信息不足，系统不能假装完全了解用户，应该先通过小任务收集更多信号。'
      };
  }
}

// ============================================================
// 主函数
// ============================================================

/**
 * 分析用户状态
 * 综合所有 profile 字段，判断用户当前所处的状态
 */
export function analyzeUserState(profile: FutureProfile): UserStateProfile {
  const state = detectUserState(profile);
  const details = generateStateDetails(state, profile);
  
  return {
    state,
    ...details,
  };
}

/**
 * 获取状态标签的中文名称
 */
export function getStateLabel(state: UserState): string {
  const labels: Record<UserState, string> = {
    monetization_exploration: '变现探索期',
    monetization_sprint: '变现冲刺期',
    career_security_anxiety: '职业安全焦虑期',
    direction_confusion: '方向迷茫期',
    skill_upgrade: '技能升级期',
    career_transition: '职业转型期',
    entrepreneurship_trial: '创业试探期',
    study_application: '留学/考试申请期',
    job_search_push: '求职推进期',
    low_energy_survival: '低能量保守期',
    general_exploration: '通用探索期',
  };
  
  return labels[state];
}
