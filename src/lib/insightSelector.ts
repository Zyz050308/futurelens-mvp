/**
 * FutureLens V6.3 Insight Selection Layer
 * 
 * 功能：
 * 1. selectInsight() - 根据用户状态选择最适合的洞察
 * 2. generatePersonalizedInsight() - 把行业洞察翻译成个人洞察
 * 
 * 核心目标：
 * 同一个洞察 -> 不同用户 -> 不同解释
 */

import { INSIGHT_LIBRARY, InsightItem } from './insightLibrary';

// ============================================================
// 用户状态类型定义
// ============================================================

export type UserStateProfile = {
  domain: string;
  userState: string;
  goal: string;
  anxiety: string;
  weeklyTime: string;
  riskPreference: string;
};

export type PersonalizedInsight = {
  originalInsight: InsightItem;
  personalizedTitle: string;
  personalizedCoreInsight: {
    "你以为": string;
    "实际上": string;
  };
  personalRisk: string;
  personalOpportunity: string;
  urgencyForUser: "low" | "medium" | "high";
  referencedFields: {
    goal: boolean;
    anxiety: boolean;
    riskPreference: boolean;
    weeklyTime: boolean;
  };
  anxietyType?: AnxietyType;
};

// ============================================================
// 焦虑类型定义
// ============================================================

export type AnxietyType = 
  | 'income_anxiety'
  | 'job_security_anxiety'
  | 'skill_anxiety'
  | 'direction_anxiety'
  | 'execution_anxiety'
  | 'time_anxiety'
  | 'replacement_anxiety'
  | 'application_anxiety'
  | 'unknown';

// ============================================================
// 焦虑类型识别函数
// ============================================================

function classifyAnxiety(profile: UserStateProfile): AnxietyType {
  const anxietyText = (profile.anxiety || '').toLowerCase();
  
  if (anxietyText.includes('赚') || anxietyText.includes('钱') || anxietyText.includes('收入')) {
    return 'income_anxiety';
  }
  if (anxietyText.includes('失业') || anxietyText.includes('稳定') || anxietyText.includes('岗位')) {
    return 'job_security_anxiety';
  }
  if (anxietyText.includes('能力') || anxietyText.includes('不会') || anxietyText.includes('学习')) {
    return 'skill_anxiety';
  }
  if (anxietyText.includes('方向') || anxietyText.includes('选择') || anxietyText.includes('迷茫')) {
    return 'direction_anxiety';
  }
  if (anxietyText.includes('执行') || anxietyText.includes('行动') || anxietyText.includes('拖延')) {
    return 'execution_anxiety';
  }
  if (anxietyText.includes('时间') || anxietyText.includes('时间少')) {
    return 'time_anxiety';
  }
  if (anxietyText.includes('替代') || anxietyText.includes('AI') || anxietyText.includes('淘汰')) {
    return 'replacement_anxiety';
  }
  if (anxietyText.includes('申请') || anxietyText.includes('考试') || anxietyText.includes('雅思') || anxietyText.includes('考')) {
    return 'application_anxiety';
  }
  return 'unknown';
}

// ============================================================
// 焦虑类型解释规则
// ============================================================

const ANXIETY_TYPE_RULES: Record<AnxietyType, {
  prefix: string;
  risk: string;
  opportunity: string;
}> = {
  income_anxiety: {
    prefix: '你真正担心的不是收入下降，而是收入来源正在变化——不是单纯赚更多钱。',
    risk: '依赖单一来源，未来可能会被替代。',
    opportunity: '找到新的收入来源，比提升现有来源更重要。'
  },
  job_security_anxiety: {
    prefix: '你真正担心的不是失去岗位，而是稳定感来自可迁移能力——不是原岗位不变。',
    risk: '把安全感绑定在单一岗位上，风险很大。',
    opportunity: '提升可迁移能力，比保住现有岗位更安全。'
  },
  skill_anxiety: {
    prefix: '你真正担心的不是不会，而是不知道先补哪项能力——不是学习太多，先选对方向。',
    risk: '盲目学习，投入产出比很低。',
    opportunity: '找到核心能力，优先学习，比什么都学更有效。'
  },
  direction_anxiety: {
    prefix: '你真正担心的不是选择太少，而是验证太少——先小范围验证，比做决定更重要。',
    risk: '害怕选错，浪费时间。',
    opportunity: '快速验证，比等完美选择更重要。'
  },
  execution_anxiety: {
    prefix: '你真正担心的不是计划不够，而是反馈太少——有反馈的行动，比无反馈的计划更重要。',
    risk: '计划完美但不执行，等于没有进步。',
    opportunity: '快速行动，获取反馈，比完美计划更重要。'
  },
  time_anxiety: {
    prefix: '你真正担心的不是机会少，而是任务规模必须变小——小范围测试，比大规模行动更安全。',
    risk: '时间少还想同时做很多事，结果什么都做不好。',
    opportunity: '缩小任务规模，小范围验证，比什么都做更重要。'
  },
  replacement_anxiety: {
    prefix: '你真正担心的不是被替代，而是被替代的不是整个人，而是当前任务组合——不是能力不行，是任务组合需要调整。',
    risk: '任务组合单一，风险很高。',
    opportunity: '重构任务组合，比焦虑更重要。'
  },
  application_anxiety: {
    prefix: '你真正担心的不是努力不够，而是材料/分数/反馈链条不清晰——不是不够努力，是反馈不够明确。',
    risk: '努力但不知道问题在哪里，效率很低。',
    opportunity: '建立清晰的反馈链条，比盲目努力更重要。'
  },
  unknown: {
    prefix: '这条洞察对你有价值——因为你焦虑的是不确定性，先抓住机会更重要。',
    risk: '不知道风险在哪里，更难应对。',
    opportunity: '先明确问题，再采取行动。'
  }
};

// ============================================================
// 用户状态与洞察匹配规则
// ============================================================

// 不同状态下，洞察的优先级权重
const STATE_INSIGHT_PRIORITY: Record<string, Record<string, number>> = {
  // 变现探索期：优先价值迁移类洞察
  monetization_exploration: {
    'value_migration': 10,
    'pricing': 8,
    'client_needs': 7,
    'skill_obsolete': 5,
    'general': 3
  },
  
  // 变现冲刺期：优先执行效率类洞察
  monetization_sprint: {
    'execution': 10,
    'pricing': 8,
    'client_needs': 7,
    'value_migration': 5,
    'general': 3
  },
  
  // 职业安全焦虑期：优先稳定/证书类洞察
  career_security_anxiety: {
    'stability': 10,
    'certificate': 9,
    'skill_obsolete': 8,
    'value_migration': 6,
    'general': 3
  },
  
  // 方向迷茫期：优先细分定位类洞察
  direction_confusion: {
    'positioning': 10,
    'value_migration': 7,
    'skill_obsolete': 5,
    'general': 4
  },
  
  // 创业试探期：优先客户验证类洞察
  entrepreneurship_trial: {
    'client_validation': 10,
    'execution': 8,
    'pricing': 7,
    'value_migration': 5,
    'general': 3
  },
  
  // 留学/考试申请期：优先学习效率类洞察
  study_application: {
    'learning_efficiency': 10,
    'feedback': 9,
    'mindset': 7,
    'general': 4
  },
  
  // 技能升级期：优先工具/能力类洞察
  skill_upgrade: {
    'tool': 10,
    'skill_obsolete': 8,
    'value_migration': 6,
    'general': 4
  },
  
  // 职业转型期：优先迁移路径类洞察
  career_transition: {
    'value_migration': 10,
    'positioning': 8,
    'skill_obsolete': 7,
    'general': 4
  },
  
  // 低能量保守期：优先最小行动类洞察
  low_energy_survival: {
    'minimal_action': 10,
    'mindset': 7,
    'general': 5
  },
  
  // 通用探索期
  general_exploration: {
    'value_migration': 8,
    'positioning': 7,
    'general': 5
  }
};

// 洞察分类标签（基于洞察内容自动判断）
function classifyInsight(insight: InsightItem): string {
  const title = insight.title.toLowerCase();
  const coreInsight = `${insight.coreInsight["你以为"]} ${insight.coreInsight["实际上"]}`.toLowerCase();
  const migration = insight.migrationDirection.toLowerCase();
  
  // 价值迁移类
  if (title.includes('替代') || title.includes('价值') || title.includes('迁移') || 
      coreInsight.includes('不是') && coreInsight.includes('而是') ||
      migration.includes('→')) {
    return 'value_migration';
  }
  
  // 定价/价格类
  if (title.includes('价格') || title.includes('预算') || title.includes('付费') || 
      title.includes('收费') || title.includes('赚钱')) {
    return 'pricing';
  }
  
  // 客户需求类
  if (title.includes('客户') || title.includes('需求') || title.includes('信任')) {
    return 'client_needs';
  }
  
  // 技能过时类
  if (title.includes('替代') || title.includes('淘汰') || title.includes('贬值') ||
      title.includes('失业') || title.includes('过时')) {
    return 'skill_obsolete';
  }
  
  // 稳定/证书类
  if (title.includes('稳定') || title.includes('证书') || title.includes('岗位')) {
    return 'stability';
  }
  
  // 定位类
  if (title.includes('细分') || title.includes('定位') || title.includes('什么都会')) {
    return 'positioning';
  }
  
  // 执行效率类
  if (title.includes('效率') || title.includes('加班') || title.includes('执行')) {
    return 'execution';
  }
  
  // 客户验证类
  if (title.includes('验证') || title.includes('没人用') || title.includes('真实用户')) {
    return 'client_validation';
  }
  
  // 学习效率类
  if (title.includes('学习') || title.includes('备考') || title.includes('练习') ||
      title.includes('反馈') || title.includes('单词')) {
    return 'learning_efficiency';
  }
  
  // 反馈类
  if (title.includes('反馈') || title.includes('复盘')) {
    return 'feedback';
  }
  
  // 心态类
  if (title.includes('心态') || title.includes('焦虑') || title.includes('害怕')) {
    return 'mindset';
  }
  
  // 工具类
  if (title.includes('工具') || title.includes('AI') || title.includes('BIM')) {
    return 'tool';
  }
  
  // 最小行动类
  if (title.includes('准备') || title.includes('开始') || title.includes('犯错')) {
    return 'minimal_action';
  }
  
  return 'general';
}

// ============================================================
// selectInsight() - 选择最适合用户的洞察
// ============================================================

export function selectInsight(profile: UserStateProfile): InsightItem | null {
  // 1. 筛选同领域的洞察
  const domainInsights = INSIGHT_LIBRARY.filter(
    insight => insight.domain === profile.domain
  );
  
  if (domainInsights.length === 0) {
    return null;
  }
  
  // 2. 获取用户状态对应的优先级权重
  const statePriority = STATE_INSIGHT_PRIORITY[profile.userState] || 
                        STATE_INSIGHT_PRIORITY['general_exploration'];
  
  // 3. 为每个洞察计算匹配分数
  const scoredInsights = domainInsights.map(insight => {
    const insightClass = classifyInsight(insight);
    const baseScore = statePriority[insightClass] || statePriority['general'] || 3;
    
    // 根据紧迫度调整分数
    const urgencyBonus = insight.urgency === 'high' ? 3 : insight.urgency === 'medium' ? 1 : 0;
    
    // 根据用户焦虑匹配
    const anxietyMatch = profile.anxiety.toLowerCase();
    let anxietyBonus = 0;
    if (insight.title.toLowerCase().includes(anxietyMatch) ||
        insight.coreInsight["你以为"].toLowerCase().includes(anxietyMatch)) {
      anxietyBonus = 5;
    }
    
    // 根据用户目标匹配
    const goalMatch = profile.goal.toLowerCase();
    let goalBonus = 0;
    if (insight.migrationDirection.toLowerCase().includes(goalMatch) ||
        insight.emergingOpportunities.some(op => op.toLowerCase().includes(goalMatch))) {
      goalBonus = 4;
    }
    
    return {
      insight,
      score: baseScore + urgencyBonus + anxietyBonus + goalBonus
    };
  });
  
  // 4. 按分数排序，返回最高分的洞察
  scoredInsights.sort((a, b) => b.score - a.score);
  
  return scoredInsights[0]?.insight || null;
}

// ============================================================
// generatePersonalizedInsight() - 个性化翻译
// ============================================================

export function generatePersonalizedInsight(
  insight: InsightItem,
  profile: UserStateProfile
): PersonalizedInsight {
  
  // 判断用户状态类型，生成不同的个性化解释
  const stateType = profile.userState;
  const riskType = profile.riskPreference || ''; // 安全默认值
  const timeConstraint = profile.weeklyTime || ''; // 安全默认值
  const anxietyType = classifyAnxiety(profile);
  const anxietyRules = ANXIETY_TYPE_RULES[anxietyType];
  
  // 引用字段追踪
  const referencedFields = {
    goal: false,
    anxiety: true, // 始终引用 anxiety
    riskPreference: false,
    weeklyTime: false
  };
  
  // 基于洞察类型和用户状态生成个性化内容
  let personalizedTitle = insight.title;
  let personalizedCoreInsight = {
    "你以为": insight.coreInsight["你以为"],
    "实际上": ""
  };
  let personalRisk = "";
  let personalOpportunity = "";
  let urgencyForUser = insight.urgency;
  
  // ============================================================
  // 核心逻辑：同一洞察，不同状态 -> 不同解释
  // 首先添加 anxiety 相关的解释
  // ============================================================
  
  // 通用：将洞察与焦虑连接起来
  let hasSpecificAnxiety = false;
  
  // 案例：AI替代的是基础财务岗位
  if (insight.id === 'finance-1' || insight.title.includes('替代的是基础')) {
    
    if (stateType === 'career_security_anxiety') {
      // 财务稳定型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}你的风险不是失业。而是未来升职空间缩小——因为基础岗位减少，内部晋升通道也在收缩。`;
      personalRisk = `${anxietyRules.risk}你追求稳定，但稳定岗位的竞争会越来越激烈。`;
      personalOpportunity = `${anxietyRules.opportunity}主动转向分析岗位，反而更稳定。`;
      referencedFields.goal = profile.goal.includes('稳定');
      hasSpecificAnxiety = true;
      
    } else if (stateType === 'career_transition') {
      // 财务转型型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}你的风险不是升职。而是未来根本拿不到入场岗位——基础岗位正在消失，新人入场门槛在提高。`;
      personalRisk = `${anxietyRules.risk}转型窗口期正在关闭，再等2年可能连入场机会都没有。`;
      personalOpportunity = `${anxietyRules.opportunity}现在转数据分析/经营分析，还能赶上窗口期。`;
      referencedFields.goal = true;
      hasSpecificAnxiety = true;
      
    } else if (stateType === 'entrepreneurship_trial' || stateType === 'monetization_exploration') {
      // 财务创业型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}你的风险不是岗位。而是未来客户不会为基础财务服务付费——他们愿意为分析付费，不愿意为做账付费。`;
      personalRisk = `${anxietyRules.risk}如果你只提供基础做账服务，客户会越来越难找。`;
      personalOpportunity = `${anxietyRules.opportunity}提供经营分析服务，客单价是做账的2-3倍。`;
      referencedFields.goal = true;
      hasSpecificAnxiety = true;
      
    } else if (stateType === 'skill_upgrade') {
      // 技能升级型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}你缺的不是能力，是方向——基础能力正在贬值，分析能力正在升值。`;
      personalRisk = `${anxietyRules.risk}继续提升基础能力，投入产出比会越来越低。`;
      personalOpportunity = `${anxietyRules.opportunity}转向分析能力，同样的努力，回报更高。`;
      referencedFields.goal = true;
      hasSpecificAnxiety = true;
      
    }
  }
  
  // 案例：证书决定入场资格，不决定收入
  else if (insight.id === 'architecture-1' || insight.title.includes('证书') && insight.title.includes('收入')) {
    
    if (stateType === 'career_security_anxiety') {
      // 建筑稳定型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}证书能帮你拿到稳定岗位的入场券，但真正决定你收入的是项目管理能力——不是证书数量。`;
      personalRisk = `${anxietyRules.risk}考了证但不学管理，收入天花板很低。`;
      personalOpportunity = `${anxietyRules.opportunity}证书+项目管理，收入是纯证书的2倍。`;
      referencedFields.goal = profile.goal.includes('稳定');
      hasSpecificAnxiety = true;
      
    } else if (stateType === 'monetization_exploration' || stateType === 'monetization_sprint') {
      // 建筑变现型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}证书对接单帮助有限——客户更关心你能交付什么，而不是你有什么证。`;
      personalRisk = `${anxietyRules.risk}花时间考证，不如花时间做案例。`;
      personalOpportunity = `${anxietyRules.opportunity}有案例作品，比有证书更容易接到单。`;
      referencedFields.goal = true;
      hasSpecificAnxiety = true;
      
    } else if (stateType === 'direction_confusion') {
      // 建筑迷茫型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}证书只是工具，不是答案——你需要先想清楚要走哪条路，再决定考什么证。`;
      personalRisk = `${anxietyRules.risk}盲目考证，可能考了对你没用的证。`;
      personalOpportunity = `${anxietyRules.opportunity}先确定方向（施工管理/BIM/设计），再针对性考证。`;
      referencedFields.goal = true;
      hasSpecificAnxiety = true;
      
    }
  }
  
  // 案例：价格战本质是能力同质化
  else if (insight.id === 'design-7' || insight.title.includes('价格战')) {
    
    if (stateType === 'monetization_exploration') {
      // 设计变现探索型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}你陷入价格战，是因为你提供的服务和别人一样——AI让基础执行变得不值钱。`;
      personalRisk = `${anxietyRules.risk}继续低价竞争，时间越来越不值钱。`;
      personalOpportunity = `${anxietyRules.opportunity}差异化定位（比如专注某个细分领域），可以跳出价格战。`;
      referencedFields.goal = true;
      hasSpecificAnxiety = true;
      
    } else if (stateType === 'monetization_sprint') {
      // 设计变现冲刺型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}价格战不是你的问题，是你的定位问题——你需要快速验证差异化服务是否有人买单。`;
      personalRisk = `${anxietyRules.risk}继续低价接单，会消耗你的时间和信心。`;
      personalOpportunity = `${anxietyRules.opportunity}本周尝试一个高客单价服务，验证是否有人买单。`;
      referencedFields.goal = true;
      referencedFields.weeklyTime = timeConstraint.includes('20');
      hasSpecificAnxiety = true;
      
    } else if (stateType === 'career_security_anxiety') {
      // 设计稳定型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}价格战是自由市场的问题，不是你的问题——稳定岗位不参与价格战。`;
      personalRisk = `${anxietyRules.risk}自由市场价格战激烈，稳定岗位相对安全。`;
      personalOpportunity = `${anxietyRules.opportunity}选择稳定岗位路线，可以避开价格战。`;
      referencedFields.riskPreference = riskType.includes('稳妥');
      hasSpecificAnxiety = true;
      
    }
  }
  
  // 案例：缺的不是练习量，而是反馈机制
  else if (insight.id === 'study-3' || insight.title.includes('练习量') || insight.title.includes('反馈')) {
    
    if (timeConstraint.includes('5') || timeConstraint.includes('少')) {
      // 时间少的学生
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}你每周时间有限，更需要高效反馈——低效刷题100小时不如高效反馈10小时。`;
      personalRisk = `${anxietyRules.risk}时间少还低效刷题，考试很难通过。`;
      personalOpportunity = `${anxietyRules.opportunity}用AI即时反馈，每周5小时也能高效进步。`;
      referencedFields.weeklyTime = true;
      hasSpecificAnxiety = true;
      
    } else if (timeConstraint.includes('20') || timeConstraint.includes('多')) {
      // 时间多的学生
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}你时间多，但可能效率低——有反馈的学习10小时，比无反馈的50小时更有效。`;
      personalRisk = `${anxietyRules.risk}时间多但效率低，浪费的是你的时间。`;
      personalOpportunity = `${anxietyRules.opportunity}建立反馈机制，同样的时间，效果翻倍。`;
      referencedFields.weeklyTime = true;
      hasSpecificAnxiety = true;
      
    } else if (profile.anxiety.includes('拖延')) {
      // 拖延型学生
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}拖延的本质是看不到进步——有了即时反馈，拖延会自然减少。`;
      personalRisk = `${anxietyRules.risk}没有反馈，越拖延越焦虑。`;
      personalOpportunity = `${anxietyRules.opportunity}每天15分钟AI反馈练习，比2小时无反馈更有效。`;
      hasSpecificAnxiety = true;
      
    }
  }
  
  // 案例：1000铁杆粉丝>10万路人
  else if (insight.id === 'creator-2' || insight.title.includes('粉丝') && insight.title.includes('信任')) {
    
    if (stateType === 'monetization_exploration') {
      // 创作者变现探索型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}你现在不需要10万粉丝——1000个信任你的粉丝，就能开始变现。`;
      personalRisk = `${anxietyRules.risk}追求涨粉但不建立信任，变现很难。`;
      personalOpportunity = `${anxietyRules.opportunity}专注服务好现有粉丝，比追求数量更重要。`;
      referencedFields.goal = true;
      hasSpecificAnxiety = true;
      
    } else if (stateType === 'entrepreneurship_trial') {
      // 创作者创业型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}创业不需要流量——需要的是愿意付费的铁杆粉丝。`;
      personalRisk = `${anxietyRules.risk}有流量但没信任，付费转化率很低。`;
      personalOpportunity = `${anxietyRules.opportunity}1000个铁杆粉丝，就能支撑一个小产品。`;
      referencedFields.goal = true;
      hasSpecificAnxiety = true;
      
    } else if (stateType === 'direction_confusion') {
      // 创作者迷茫型
      personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}粉丝数不是目标——你需要先想清楚要服务谁，再积累粉丝。`;
      personalRisk = `${anxietyRules.risk}盲目涨粉，可能涨来的是不相关的人。`;
      personalOpportunity = `${anxietyRules.opportunity}先确定服务对象，再针对性积累粉丝。`;
      referencedFields.goal = true;
      hasSpecificAnxiety = true;
      
    }
  }
  
  // 通用处理：其他洞察（如果没有特定处理）
  if (!hasSpecificAnxiety) {
    // 通用：将洞察与焦虑连接起来
    personalizedCoreInsight["实际上"] = `${anxietyRules.prefix}${insight.coreInsight["实际上"]}`;
    personalRisk = `${anxietyRules.risk}${insight.threatenedTasks[0] ? `同时，${insight.threatenedTasks[0]}` : ''}`;
    personalOpportunity = `${anxietyRules.opportunity}${insight.emergingOpportunities[0] ? `具体来说，${insight.emergingOpportunities[0]}` : ''}`;
    
    // 根据用户状态补充
    if (stateType === 'career_security_anxiety') {
      referencedFields.goal = profile.goal.includes('稳定');
    } else if (stateType === 'monetization_exploration' || stateType === 'monetization_sprint') {
      referencedFields.goal = true;
    } else if (stateType === 'direction_confusion') {
      referencedFields.goal = true;
    }
  }
  
  // 根据时间约束调整紧迫度
  if (timeConstraint.includes('5') || timeConstraint.includes('少')) {
    urgencyForUser = 'medium'; // 时间少，不能太激进
    referencedFields.weeklyTime = true;
  } else if (timeConstraint.includes('20') || timeConstraint.includes('多')) {
    urgencyForUser = insight.urgency; // 时间多，保持原紧迫度
    referencedFields.weeklyTime = true;
  }
  
  // 根据风险偏好调整表述
  if (riskType.includes('稳妥') || riskType.includes('保守')) {
    personalOpportunity = personalOpportunity.replace('快速', '稳步');
    referencedFields.riskPreference = true;
  } else if (riskType.includes('激进') || riskType.includes('冒险')) {
    personalOpportunity = personalOpportunity.replace('稳步', '快速');
    referencedFields.riskPreference = true;
  }
  
  return {
    originalInsight: insight,
    personalizedTitle,
    personalizedCoreInsight,
    personalRisk,
    personalOpportunity,
    urgencyForUser,
    referencedFields,
    anxietyType // 新增：返回识别到的焦虑类型
  };
}

// ============================================================
// 批量个性化测试
// ============================================================

export function testInsightPersonalization(
  insightId: string,
  profiles: UserStateProfile[]
): PersonalizedInsight[] {
  const insight = INSIGHT_LIBRARY.find(i => i.id === insightId);
  if (!insight) {
    return [];
  }
  
  return profiles.map(profile => generatePersonalizedInsight(insight, profile));
}

// ============================================================
// 导出统计函数
// ============================================================

export function getInsightLibraryStats(): {
  total: number;
  byDomain: Record<string, number>;
} {
  const byDomain: Record<string, number> = {};
  
  for (const insight of INSIGHT_LIBRARY) {
    byDomain[insight.domain] = (byDomain[insight.domain] || 0) + 1;
  }
  
  return {
    total: INSIGHT_LIBRARY.length,
    byDomain
  };
}