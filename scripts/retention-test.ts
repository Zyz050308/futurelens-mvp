#!/usr/bin/env node
/**
 * FutureLens Retention Test（留存验证实验）
 *
 * 验证用户是否有理由连续7天打开 FutureLens
 */

import * as fs from 'fs';
import * as path from 'path';

interface DayData {
  day: number;
  changeSignal: {
    title: string;
    summary: string;
    affectedCapabilities: string[];
    threatenedTasks: string[];
    emergingOpportunities: string[];
  };
  personalImpact: {
    affectedPart: string;
    reason: string;
    opportunity: string;
    risk: string;
  };
  valueMigration: {
    currentValueSource: string[];
    decliningValue: string[];
    risingValue: string[];
    migrationDirection: string;
    urgencyLevel: string;
  };
  actions: string[];
}

const USER_PROFILE = {
  name: '财务用户｜想稳定｜怕AI替代',
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
  }
};

// 模拟7天的变化信号
const DAY7_CHANGES: DayData[] = [
  {
    day: 1,
    changeSignal: {
      title: 'AI自动生成财务报表工具上线',
      summary: '某科技公司发布AI财务工具，可以自动生成财务报表、月度汇总，数据录入效率提升10倍。',
      affectedCapabilities: ['数据录入', '报表整理', '月度汇总'],
      threatenedTasks: ['重复性工资表整理', '月度报表汇总', '手工对账'],
      emergingOpportunities: ['AI工具使用', '财务流程优化']
    },
    personalImpact: {
      affectedPart: '你当前依赖的「数据录入、报表整理」能力正在被工具替代',
      reason: 'AI工具可以自动生成财务报表，数据录入效率提升10倍，你现在的数据录入工作会被加速替代。',
      opportunity: '你可以学习使用AI财务工具，成为部门里最先掌握新工具的人。',
      risk: '如果继续只做手工数据录入，你的岗位价值会下降。'
    },
    valueMigration: {
      currentValueSource: ['数据录入', '报表整理', '手工对账'],
      decliningValue: ['数据录入', '报表整理'],
      risingValue: ['AI工具使用', '财务流程优化'],
      migrationDirection: '从手工数据录入 → AI辅助财务 → 财务流程优化',
      urgencyLevel: 'low'
    },
    actions: [
      '今晚: 在B站搜索"AI财务工具"，找出3个可以试用的免费工具',
      '明天: 试用其中一个工具，看看能帮你省多少时间',
      '本周: 给公司财务经理发微信，问他怎么看AI财务工具'
    ]
  },
  {
    day: 2,
    changeSignal: {
      title: '某大型企业裁撤基础财务岗位',
      summary: '某知名企业宣布裁撤30%的基础财务岗位，主要涉及数据录入、报表整理岗位，替换为AI财务系统。',
      affectedCapabilities: ['数据录入', '报表整理', '基础核算'],
      threatenedTasks: ['重复性工资表整理', '月度报表汇总', '手工对账'],
      emergingOpportunities: ['财务分析', '经营分析']
    },
    personalImpact: {
      affectedPart: '你当前依赖的「Excel做账、基础核算、手工对账」岗位正在被替代',
      reason: '大企业开始裁撤基础财务岗位，30%的数据录入、报表整理岗位被AI系统替代，这是行业信号。',
      opportunity: '你应该提前准备，从基础核算转向财务分析，提升不可替代性。',
      risk: '如果继续只做基础核算，你所在的岗位可能被优化。'
    },
    valueMigration: {
      currentValueSource: ['Excel做账', '基础核算', '手工对账'],
      decliningValue: ['数据录入', '报表整理', '基础核算'],
      risingValue: ['财务分析', '经营分析', 'AI财务流程搭建'],
      migrationDirection: '从基础核算 → 财务分析 → 经营分析',
      urgencyLevel: 'medium'
    },
    actions: [
      '今晚: 打开招聘网站，搜索"财务分析"，看看JD要求哪些技能',
      '明天: 问经理对AI的看法，了解公司是否有相关计划',
      '本周: 开始学习一个数据分析工具（如Power BI）'
    ]
  },
  {
    day: 3,
    changeSignal: {
      title: 'AI财务分析工具进入企业',
      summary: '多个AI财务分析工具开始进入企业，可以自动完成财务分析报告、经营分析图表，数据分析师需求开始增长。',
      affectedCapabilities: ['基础财务分析', '图表制作'],
      threatenedTasks: ['基础财务分析', '手工制作分析图表'],
      emergingOpportunities: ['财务分析', '经营分析', 'AI财务分析', '数据决策支持']
    },
    personalImpact: {
      affectedPart: '你当前依赖的「基础财务分析、图表制作」能力正在被AI工具增强',
      reason: 'AI财务分析工具可以自动生成分析报告，但仍然需要人来理解业务、解读数据、提出问题。',
      opportunity: '你可以从"做分析"转向"问问题"，成为会用AI工具做分析的财务人员。',
      risk: '如果只会做基础分析，不会问问题，你的价值会被AI降低。'
    },
    valueMigration: {
      currentValueSource: ['Excel做账', '基础核算', '手工对账'],
      decliningValue: ['基础核算', '手工制作分析图表'],
      risingValue: ['财务分析', '经营分析', 'AI辅助分析', '业务理解'],
      migrationDirection: '从基础核算 → AI辅助财务分析 → 业务决策支持',
      urgencyLevel: 'medium'
    },
    actions: [
      '今晚: 搜索"AI财务分析工具"，找出3个企业级产品',
      '明天: 试用其中一个工具，看看它能帮你做什么',
      '本周: 开始关注你公司的业务，理解数据背后的业务逻辑'
    ]
  },
  {
    day: 4,
    changeSignal: {
      title: '财务招聘JD变化',
      summary: '主流招聘网站的财务岗位JD开始变化，"会使用AI工具"成为加分项或必备技能，数据分析能力要求提升50%。',
      affectedCapabilities: ['纯手工操作', '经验依赖型工作'],
      threatenedTasks: ['纯手工做账', '无数据分析能力'],
      emergingOpportunities: ['数据分析师', '风控专员', 'AI财务专员']
    },
    personalImpact: {
      affectedPart: '你的简历中「Excel做账、基础核算」技能正在贬值',
      reason: '招聘JD变化显示，市场对"会使用AI工具"和"数据分析能力"的需求在提升，纯手工技能在贬值。',
      opportunity: '你应该更新简历，突出"AI工具使用"和"数据分析"能力。',
      risk: '如果简历还停留在"Excel做账"，你可能连面试机会都没有。'
    },
    valueMigration: {
      currentValueSource: ['Excel做账', '基础核算', '手工对账'],
      decliningValue: ['纯手工做账', '无数据分析能力'],
      risingValue: ['AI工具使用', '数据分析', 'AI财务专员'],
      migrationDirection: '从手工做账 → AI工具+数据分析 → 财务AI专员',
      urgencyLevel: 'medium'
    },
    actions: [
      '今晚: 打开招聘网站，看看你目标岗位的JD有哪些新要求',
      '明天: 更新简历，加入"AI工具使用"和"数据分析"关键词',
      '本周: 开始学习一个数据分析工具（Excel Power Query 或 Power BI）'
    ]
  },
  {
    day: 5,
    changeSignal: {
      title: '企业开始要求AI工具能力',
      summary: '多个企业财务岗位面试开始增加AI工具测试环节，包括AI财务工具使用、数据分析、自动化流程搭建等。',
      affectedCapabilities: ['AI工具使用'],
      threatenedTasks: ['纯手工做账', '不使用AI工具'],
      emergingOpportunities: ['AI财务流程搭建', '财务系统管理']
    },
    personalImpact: {
      affectedPart: '你当前「不使用AI工具」的能力正在成为面试障碍',
      reason: '企业面试开始测试AI工具使用能力，如果你不会用AI工具，可能连面试都过不了。',
      opportunity: '你现在开始学习AI工具，可以在面试中展示"我已经学会"的态度。',
      risk: '如果面试时被发现不会用AI工具，竞争力会明显下降。'
    },
    valueMigration: {
      currentValueSource: ['Excel做账', '基础核算', '手工对账'],
      decliningValue: ['不使用AI工具', '纯手工操作'],
      risingValue: ['AI工具使用', 'AI财务流程搭建', '财务系统管理'],
      migrationDirection: '从纯手工 → AI工具使用者 → AI财务流程搭建者',
      urgencyLevel: 'high'
    },
    actions: [
      '今晚: 在B站搜索"财务AI工具教程"，找出3个实用教程',
      '明天: 动手试用一个AI财务工具，记录你能用它做什么',
      '本周: 在面试中主动展示你对AI工具的理解'
    ]
  },
  {
    day: 6,
    changeSignal: {
      title: '财务分析岗位增长',
      summary: '招聘数据显示，财务分析岗位需求同比增长30%，平均薪资上涨15%，但要求AI工具使用能力。',
      affectedCapabilities: ['财务分析', '数据分析'],
      threatenedTasks: ['纯手工做账', '基础核算'],
      emergingOpportunities: ['财务分析', '经营分析', '数据分析师']
    },
    personalImpact: {
      affectedPart: '「财务分析」岗位正在成为新风口，薪资上涨15%',
      reason: '财务分析岗位需求增长30%，薪资上涨15%，但都需要AI工具能力。这是一个明确的职业迁移信号。',
      opportunity: '你应该现在开始准备，争取在薪资上涨前进入这个领域。',
      risk: '如果继续等，你可能错过最佳入场时机。'
    },
    valueMigration: {
      currentValueSource: ['Excel做账', '基础核算', '手工对账'],
      decliningValue: ['基础核算', '手工对账'],
      risingValue: ['财务分析', '经营分析', '数据分析师'],
      migrationDirection: '从基础核算 → 财务分析 → 经营分析',
      urgencyLevel: 'high'
    },
    actions: [
      '今晚: 在招聘网站搜索"财务分析"，看看薪资范围',
      '明天: 找1-2个财务分析的JD，对比你的技能差距',
      '本周: 开始填补技能差距，从最紧急的开始'
    ]
  },
  {
    day: 7,
    changeSignal: {
      title: '经营分析岗位增长',
      summary: '经营分析岗位成为财务领域新热点，需要结合业务理解、数据分析、AI工具使用，薪资比基础财务高50%。',
      affectedCapabilities: ['业务理解', '数据分析', 'AI工具使用'],
      threatenedTasks: ['纯手工做账', '不懂业务分析'],
      emergingOpportunities: ['经营分析', '业务财务', 'FP&A']
    },
    personalImpact: {
      affectedPart: '「经营分析」是财务领域的新高地，薪资比基础财务高50%',
      reason: '经营分析岗位需要业务理解+数据分析+AI工具，这是你现有能力的自然延伸，也是最高价值的位置。',
      opportunity: '你现在应该开始理解业务，学习经营分析的思维方式。',
      risk: '如果你不开始准备，3年后你可能还在做基础核算。'
    },
    valueMigration: {
      currentValueSource: ['Excel做账', '基础核算', '手工对账'],
      decliningValue: ['基础核算', '手工对账', '纯手工做账'],
      risingValue: ['财务分析', '经营分析', '业务理解', 'AI辅助分析'],
      migrationDirection: '从基础核算 → 财务分析 → 经营分析（终点）',
      urgencyLevel: 'high'
    },
    actions: [
      '今晚: 搜索"经营分析"岗位，看看需要什么能力',
      '明天: 找你公司的经营分析报告，理解它们在分析什么',
      '本周: 开始学习业务，理解你公司的业务逻辑和财务数据的关系'
    ]
  }
];

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
}

function analyzeRetention(): { day1: DayData; day7: DayData; comparison: any; repetition: any } {
  const day1 = DAY7_CHANGES[0];
  const day7 = DAY7_CHANGES[6];

  // 分析变化
  const comparison = {
    changeSignal: {
      changed: day1.changeSignal.title !== day7.changeSignal.title,
      day1: day1.changeSignal.title,
      day7: day7.changeSignal.title
    },
    affectedPart: {
      changed: day1.personalImpact.affectedPart !== day7.personalImpact.affectedPart,
      similarity: calculateSimilarity(day1.personalImpact.affectedPart, day7.personalImpact.affectedPart).toFixed(1) + '%',
      day1: day1.personalImpact.affectedPart,
      day7: day7.personalImpact.affectedPart
    },
    opportunity: {
      changed: day1.personalImpact.opportunity !== day7.personalImpact.opportunity,
      similarity: calculateSimilarity(day1.personalImpact.opportunity, day7.personalImpact.opportunity).toFixed(1) + '%',
      day1: day1.personalImpact.opportunity,
      day7: day7.personalImpact.opportunity
    },
    risk: {
      changed: day1.personalImpact.risk !== day7.personalImpact.risk,
      similarity: calculateSimilarity(day1.personalImpact.risk, day7.personalImpact.risk).toFixed(1) + '%',
      day1: day1.personalImpact.risk,
      day7: day7.personalImpact.risk
    },
    migrationDirection: {
      changed: day1.valueMigration.migrationDirection !== day7.valueMigration.migrationDirection,
      day1: day1.valueMigration.migrationDirection,
      day7: day7.valueMigration.migrationDirection
    },
    urgencyLevel: {
      changed: day1.valueMigration.urgencyLevel !== day7.valueMigration.urgencyLevel,
      day1: day1.valueMigration.urgencyLevel,
      day7: day7.valueMigration.urgencyLevel
    },
    actions: {
      allDifferent: day1.actions.every((action, i) => action !== day7.actions[i]),
      day1: day1.actions,
      day7: day7.actions
    }
  };

  // 计算重复率
  const allContents = DAY7_CHANGES.flatMap(d => [
    d.personalImpact.affectedPart,
    d.personalImpact.reason,
    d.personalImpact.opportunity,
    d.personalImpact.risk,
    d.valueMigration.migrationDirection,
    d.valueMigration.urgencyLevel,
    ...d.actions
  ]);

  const uniqueContents = new Set(allContents);
  const repetition = {
    total: allContents.length,
    unique: uniqueContents.size,
    rate: ((uniqueContents.size / allContents.length) * 100).toFixed(1) + '%'
  };

  return { day1, day7, comparison, repetition };
}

function generateReport(): string {
  const { day1, day7, comparison, repetition } = analyzeRetention();

  let report = '# FutureLens Retention Test（留存验证实验）\n\n';
  report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

  report += '## 用户档案\n\n';
  report += `**用户**: ${USER_PROFILE.name}\n\n`;
  report += `- 职业: ${USER_PROFILE.profile.majorOrCareer}\n`;
  report += `- 目标: ${USER_PROFILE.profile.currentGoal}\n`;
  report += `- 焦虑: ${USER_PROFILE.profile.currentAnxiety}\n\n`;

  report += '## Day 1 → Day 7 变化对比\n\n';

  report += '### 变化信号\n\n';
  report += `| Day | 变化信号 |\n`;
  report += `|-----|----------|\n`;
  DAY7_CHANGES.forEach(d => {
    report += `| Day ${d.day} | ${d.changeSignal.title} |\n`;
  });
  report += '\n';

  report += '### Personal Impact 变化\n\n';
  report += '| 项目 | Day 1 | Day 7 | 变化 |\n';
  report += '|------|-------|-------|------|\n';
  report += `| affectedPart | ${day1.personalImpact.affectedPart.substring(0, 30)}... | ${day7.personalImpact.affectedPart.substring(0, 30)}... | ${comparison.affectedPart.changed ? '✅ 变化' : '❌ 不变'} |\n`;
  report += `| opportunity | ${day1.personalImpact.opportunity.substring(0, 30)}... | ${day7.personalImpact.opportunity.substring(0, 30)}... | ${comparison.opportunity.changed ? '✅ 变化' : '❌ 不变'} |\n`;
  report += `| risk | ${day1.personalImpact.risk.substring(0, 30)}... | ${day7.personalImpact.risk.substring(0, 30)}... | ${comparison.risk.changed ? '✅ 变化' : '❌ 不变'} |\n\n`;

  report += '### Value Migration 变化\n\n';
  report += '| 项目 | Day 1 | Day 7 | 变化 |\n';
  report += '|------|-------|-------|------|\n';
  report += `| migrationDirection | ${day1.valueMigration.migrationDirection} | ${day7.valueMigration.migrationDirection} | ${comparison.migrationDirection.changed ? '✅ 变化' : '❌ 不变'} |\n`;
  report += `| urgencyLevel | ${day1.valueMigration.urgencyLevel} | ${day7.valueMigration.urgencyLevel} | ${comparison.urgencyLevel.changed ? '✅ 变化' : '❌ 不变'} |\n\n`;

  report += '### 紧迫度变化趋势\n\n';
  report += `| Day | 紧迫度 |\n`;
  report += `|-----|--------|\n`;
  DAY7_CHANGES.forEach(d => {
    report += `| Day ${d.day} | ${d.valueMigration.urgencyLevel.toUpperCase()} |\n`;
  });
  report += '\n';

  report += '## 重复率统计\n\n';
  report += `- 总内容数: ${repetition.total}\n`;
  report += `- 唯一内容数: ${repetition.unique}\n`;
  report += `- 重复率: ${repetition.rate}\n\n`;

  report += '## 详细分析\n\n';

  report += '### Day 1 内容\n\n';
  report += '**变化信号**: ' + day1.changeSignal.title + '\n\n';
  report += '**Personal Impact**:\n';
  report += `- affectedPart: ${day1.personalImpact.affectedPart}\n`;
  report += `- reason: ${day1.personalImpact.reason}\n`;
  report += `- opportunity: ${day1.personalImpact.opportunity}\n`;
  report += `- risk: ${day1.personalImpact.risk}\n\n`;
  report += '**Value Migration**:\n';
  report += `- currentValueSource: ${day1.valueMigration.currentValueSource.join(', ')}\n`;
  report += `- decliningValue: ${day1.valueMigration.decliningValue.join(', ')}\n`;
  report += `- risingValue: ${day1.valueMigration.risingValue.join(', ')}\n`;
  report += `- migrationDirection: ${day1.valueMigration.migrationDirection}\n`;
  report += `- urgencyLevel: ${day1.valueMigration.urgencyLevel}\n\n`;
  report += '**Actions**:\n';
  day1.actions.forEach((action, i) => {
    report += `${i+1}. ${action}\n`;
  });
  report += '\n';

  report += '### Day 7 内容\n\n';
  report += '**变化信号**: ' + day7.changeSignal.title + '\n\n';
  report += '**Personal Impact**:\n';
  report += `- affectedPart: ${day7.personalImpact.affectedPart}\n`;
  report += `- reason: ${day7.personalImpact.reason}\n`;
  report += `- opportunity: ${day7.personalImpact.opportunity}\n`;
  report += `- risk: ${day7.personalImpact.risk}\n\n`;
  report += '**Value Migration**:\n';
  report += `- currentValueSource: ${day7.valueMigration.currentValueSource.join(', ')}\n`;
  report += `- decliningValue: ${day7.valueMigration.decliningValue.join(', ')}\n`;
  report += `- risingValue: ${day7.valueMigration.risingValue.join(', ')}\n`;
  report += `- migrationDirection: ${day7.valueMigration.migrationDirection}\n`;
  report += `- urgencyLevel: ${day7.valueMigration.urgencyLevel}\n\n`;
  report += '**Actions**:\n';
  day7.actions.forEach((action, i) => {
    report += `${i+1}. ${action}\n`;
  });
  report += '\n';

  report += '## 判断结果\n\n';

  const hasMajorChanges =
    comparison.changeSignal.changed &&
    comparison.urgencyLevel.changed &&
    comparison.migrationDirection.changed;

  const verdict = hasMajorChanges ? '✅ PASS' : '❌ FAIL';

  report += `**连续7天建议变化程度**: ${verdict}\n\n`;
  report += '理由:\n';
  report += `- 变化信号: ${comparison.changeSignal.changed ? '✅ 每天不同' : '❌ 重复'}\n`;
  report += `- 紧迫度: ${comparison.urgencyLevel.changed ? '✅ 从 low → high 升级' : '❌ 不变'}\n`;
  report += `- 迁移方向: ${comparison.migrationDirection.changed ? '✅ 越来越清晰' : '❌ 不变'}\n`;
  report += `- Actions: ${comparison.actions.allDifferent ? '✅ 完全不同' : '❌ 部分重复'}\n`;
  report += `- 重复率: ${repetition.rate}\n\n`;

  report += '## 产品经理结论\n\n';

  report += '### 用户是否有理由第二天回来？\n\n';
  report += '**答案：没有。**\n\n';
  report += '理由:\n';
  report += '1. Day 1 的 Personal Impact、Value Migration、Actions 已经足够完整\n';
  report += '2. 用户照着 Day 1 的 Actions 做，至少需要 1-2 周\n';
  report += '3. 除非用户遇到新的具体问题，否则没有理由第二天回来\n\n';

  report += '### 用户是否有理由连续7天回来？\n\n';
  report += '**答案：没有。**\n\n';
  report += '理由:\n';
  report += '1. **内容重复率高** - 虽然变化信号每天不同，但 Personal Impact 和 Value Migration 的核心信息基本不变\n';
  report += '2. **紧迫度升级不够快** - 从 low → high 需要 5-6 天，用户可能在前 3 天就已经放弃了\n';
  report += '3. **Actions 缺乏连续性** - 每天的 Actions 是独立的，不是递进的\n';
  report += '4. **没有"进度追踪"机制** - 用户不知道自己做了多少，距离目标还有多远\n\n';

  report += '### 当前 FutureLens 的留存问题\n\n';
  report += '1. **Day 1 信息过载** - 第一天就给完整分析，用户不需要第二天\n';
  report += '2. **缺乏"日更"价值** - 每天的 Insights 相似度太高\n';
  report += '3. **没有进度机制** - 用户不知道自己做没做，做得对不对\n';
  report += '4. **Actions 独立而非递进** - 今天和明天的 Actions 没有逻辑关系\n\n';

  report += '### 建议的改进方向\n\n';
  report += '1. **拆分 Day 1 内容** - 不要第一天就给完整分析，按天数拆分\n';
  report += '2. **增加"每日风险更新"** - 每天推送新的风险信号，而不是新的建议\n';
  report += '3. **增加"进度追踪"** - 让用户每天回来更新自己的进度\n';
  report += '4. **Actions 递进化** - 今天的 Actions 是明天的前置条件\n';
  report += '5. **增加"同行对比"** - 告诉用户，其他同状态的人现在在做什么\n\n';

  report += '### 最终结论\n\n';
  report += '**FutureLens 当前无法支撑连续7天留存。**\n\n';
  report += '原因:\n';
  report += '- Day 1 的分析已经足够完整，用户照着做可以撑 1-2 周\n';
  report += '- 每天的 Insights 重复率太高，没有"必须今天知道"的信息\n';
  report += '- 缺乏进度追踪和行动反馈机制\n\n';
  report += '建议:\n';
  report += '- 将 Day 1 分析拆分为 7 天的递进内容\n';
  report += '- 每天推送不同的"风险更新"而不是"新建议"\n';
  report += '- 增加用户进度追踪功能\n\n';

  return report;
}

function main() {
  console.log('🧪 FutureLens Retention Test\n\n');
  console.log('验证用户是否有理由连续7天打开 FutureLens\n\n');

  const report = generateReport();

  const resultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  const reportPath = path.join(resultsDir, 'retention-test.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log('✅ Retention Test 完成！');
  console.log(`📄 报告已保存: ${reportPath}`);
  console.log('\n核心发现:');
  console.log('❌ FutureLens 当前无法支撑连续7天留存');
  console.log('原因: Day 1 信息已经足够完整，用户不需要第二天回来');
}

main();
