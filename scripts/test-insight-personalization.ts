#!/usr/bin/env node
/**
 * FutureLens V6.3 Insight Personalization Test
 * 
 * 测试目标：
 * 1. 同一洞察 -> 不同用户 -> 不同解释
 * 2. 验证是否引用 goal, anxiety, riskPreference, weeklyTime
 * 3. 计算个性化命中率、洞察复用率、解释差异度
 */

import { 
  selectInsight, 
  generatePersonalizedInsight,
  getInsightLibraryStats,
  UserStateProfile,
  PersonalizedInsight,
  AnxietyType
} from '../src/lib/insightSelector';
import { INSIGHT_LIBRARY } from '../src/lib/insightLibrary';

// ============================================================
// 测试用例定义
// ============================================================

// 同一洞察的3种不同用户配置
const FINANCE_USERS: UserStateProfile[] = [
  {
    domain: 'finance',
    userState: 'career_security_anxiety',
    goal: '稳定工作',
    anxiety: '怕被AI替代',
    weeklyTime: '5-10小时',
    riskPreference: '稳妥'
  },
  {
    domain: 'finance',
    userState: 'career_transition',
    goal: '转型数据分析',
    anxiety: '怕错过窗口期',
    weeklyTime: '10-15小时',
    riskPreference: '适中'
  },
  {
    domain: 'finance',
    userState: 'monetization_exploration',
    goal: '接单赚钱',
    anxiety: '找不到客户',
    weeklyTime: '5小时以下',
    riskPreference: '稳妥'
  }
];

const ARCHITECTURE_USERS: UserStateProfile[] = [
  {
    domain: 'architecture',
    userState: 'career_security_anxiety',
    goal: '稳定岗位',
    anxiety: '怕行业下滑',
    weeklyTime: '5-10小时',
    riskPreference: '稳妥'
  },
  {
    domain: 'architecture',
    userState: 'monetization_exploration',
    goal: '接效果图单',
    anxiety: '不知道怎么找客户',
    weeklyTime: '5小时以下',
    riskPreference: '稳妥'
  },
  {
    domain: 'architecture',
    userState: 'direction_confusion',
    goal: '不知道走哪条路',
    anxiety: '迷茫',
    weeklyTime: '10小时',
    riskPreference: '适中'
  }
];

const DESIGN_USERS: UserStateProfile[] = [
  {
    domain: 'design',
    userState: 'monetization_exploration',
    goal: '接单赚钱',
    anxiety: '怕价格战',
    weeklyTime: '5小时以下',
    riskPreference: '稳妥'
  },
  {
    domain: 'design',
    userState: 'monetization_sprint',
    goal: '快速变现',
    anxiety: '时间不够',
    weeklyTime: '20小时以上',
    riskPreference: '激进'
  },
  {
    domain: 'design',
    userState: 'career_security_anxiety',
    goal: '稳定工作',
    anxiety: '怕失业',
    weeklyTime: '10小时',
    riskPreference: '稳妥'
  }
];

const STUDY_USERS: UserStateProfile[] = [
  {
    domain: 'study_abroad',
    userState: 'study_application',
    goal: '雅思6.5',
    anxiety: '拖延',
    weeklyTime: '5小时以下',
    riskPreference: '适中'
  },
  {
    domain: 'study_abroad',
    userState: 'study_application',
    goal: '雅思7分',
    anxiety: '怕考不过',
    weeklyTime: '20小时以上',
    riskPreference: '适中'
  },
  {
    domain: 'study_abroad',
    userState: 'direction_confusion',
    goal: '不知道选什么学校',
    anxiety: '迷茫',
    weeklyTime: '10小时',
    riskPreference: '稳妥'
  }
];

const CREATOR_USERS: UserStateProfile[] = [
  {
    domain: 'creator',
    userState: 'monetization_exploration',
    goal: '变现',
    anxiety: '粉丝太少',
    weeklyTime: '5-10小时',
    riskPreference: '适中'
  },
  {
    domain: 'creator',
    userState: 'entrepreneurship_trial',
    goal: '做产品',
    anxiety: '怕没人买单',
    weeklyTime: '20小时以上',
    riskPreference: '激进'
  },
  {
    domain: 'creator',
    userState: 'direction_confusion',
    goal: '不知道做什么内容',
    anxiety: '迷茫',
    weeklyTime: '10小时',
    riskPreference: '稳妥'
  }
];

// ============================================================
// 测试函数
// ============================================================

type TestResult = {
  domain: string;
  insightId: string;
  insightTitle: string;
  userProfiles: UserStateProfile[];
  personalizedInsights: PersonalizedInsight[];
  differentiationScore: number;
  fieldReferenceRate: {
    goal: number;
    anxiety: number;
    riskPreference: number;
    weeklyTime: number;
  };
  overallHitRate: number;
  anxietyTypeDistribution: Record<AnxietyType, number>;
  anxietyTypeHitRate: Record<AnxietyType, number>;
};

function calculateDifferentScore(insights: PersonalizedInsight[]): number {
  // 计算解释差异度：比较不同用户的核心洞察文本
  if (insights.length < 2) return 0;
  
  const texts = insights.map(i => i.personalizedCoreInsight["实际上"]);
  
  // 简单的文本相似度计算
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const similarity = calculateTextSimilarity(texts[i], texts[j]);
      totalSimilarity += similarity;
      comparisons++;
    }
  }
  
  // 差异度 = 1 - 平均相似度
  const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;
  return Math.round((1 - avgSimilarity) * 100);
}

function calculateTextSimilarity(text1: string, text2: string): number {
  // 基于关键词重合率计算相似度
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

function calculateFieldReferenceRate(insights: PersonalizedInsight[]): {
  goal: number;
  anxiety: number;
  riskPreference: number;
  weeklyTime: number;
} {
  const total = insights.length;
  
  return {
    goal: insights.filter(i => i.referencedFields.goal).length / total,
    anxiety: insights.filter(i => i.referencedFields.anxiety).length / total,
    riskPreference: insights.filter(i => i.referencedFields.riskPreference).length / total,
    weeklyTime: insights.filter(i => i.referencedFields.weeklyTime).length / total
  };
}

function runPersonalizationTest(
  domain: string,
  users: UserStateProfile[]
): TestResult[] {
  const results: TestResult[] = [];
  
  // 获取该领域的洞察
  const domainInsights = INSIGHT_LIBRARY.filter(i => i.domain === domain);
  
  // 选择前3个洞察进行测试
  const testInsights = domainInsights.slice(0, 3);
  
  for (const insight of testInsights) {
    const personalizedInsights = users.map(user => 
      generatePersonalizedInsight(insight, user)
    );
    
    const differentiationScore = calculateDifferentScore(personalizedInsights);
    const fieldReferenceRate = calculateFieldReferenceRate(personalizedInsights);
    const overallHitRate = (
      fieldReferenceRate.goal + 
      fieldReferenceRate.anxiety + 
      fieldReferenceRate.riskPreference + 
      fieldReferenceRate.weeklyTime
    ) / 4;
    
    // 计算焦虑类型分布
    const anxietyTypeDistribution: Record<AnxietyType, number> = {
      income_anxiety: 0,
      job_security_anxiety: 0,
      skill_anxiety: 0,
      direction_anxiety: 0,
      execution_anxiety: 0,
      time_anxiety: 0,
      replacement_anxiety: 0,
      application_anxiety: 0,
      unknown: 0
    };
    
    const anxietyTypeHitRate: Record<AnxietyType, number> = {
      income_anxiety: 0,
      job_security_anxiety: 0,
      skill_anxiety: 0,
      direction_anxiety: 0,
      execution_anxiety: 0,
      time_anxiety: 0,
      replacement_anxiety: 0,
      application_anxiety: 0,
      unknown: 0
    };
    
    for (const pi of personalizedInsights) {
      if (pi.anxietyType) {
        anxietyTypeDistribution[pi.anxietyType]++;
        if (pi.referencedFields.anxiety) {
          anxietyTypeHitRate[pi.anxietyType]++;
        }
      }
    }
    
    results.push({
      domain,
      insightId: insight.id,
      insightTitle: insight.title,
      userProfiles: users,
      personalizedInsights,
      differentiationScore,
      fieldReferenceRate,
      overallHitRate,
      anxietyTypeDistribution,
      anxietyTypeHitRate
    });
  }
  
  return results;
}

// ============================================================
// 报告生成
// ============================================================

function printTestReport(results: TestResult[]): void {
  console.log('\n' + '='.repeat(70));
  console.log(' FutureLens V6.3.1 Insight Personalization Test Report');
  console.log('='.repeat(70));
  
  // 1. 洞察库统计
  const stats = getInsightLibraryStats();
  console.log('\n## 洞察库统计');
  console.log(`- 总洞察数: ${stats.total}`);
  for (const [domain, count] of Object.entries(stats.byDomain)) {
    console.log(`- ${domain}: ${count} 条`);
  }
  
  // 2. 个性化测试结果
  console.log('\n## 个性化测试结果');
  
  for (const result of results) {
    console.log(`\n### ${result.domain} - ${result.insightTitle}`);
    console.log(`- 差异度: ${result.differentiationScore}%`);
    console.log(`- 字段引用率:`);
    console.log(`  - goal: ${Math.round(result.fieldReferenceRate.goal * 100)}%`);
    console.log(`  - anxiety: ${Math.round(result.fieldReferenceRate.anxiety * 100)}%`);
    console.log(`  - riskPreference: ${Math.round(result.fieldReferenceRate.riskPreference * 100)}%`);
    console.log(`  - weeklyTime: ${Math.round(result.fieldReferenceRate.weeklyTime * 100)}%`);
    console.log(`- 总命中率: ${Math.round(result.overallHitRate * 100)}%`);
    
    // 展示个性化结果
    console.log('\n#### 个性化解释对比:');
    for (let i = 0; i < result.personalizedInsights.length; i++) {
      const pi = result.personalizedInsights[i];
      const user = result.userProfiles[i];
      console.log(`\n用户${i + 1}: ${user.userState} | ${user.goal} | ${user.anxiety}`);
      console.log(`  你以为: ${pi.personalizedCoreInsight["你以为"]}`);
      console.log(`  实际上: ${pi.personalizedCoreInsight["实际上"]}`);
      console.log(`  个人风险: ${pi.personalRisk}`);
      console.log(`  个人机会: ${pi.personalOpportunity}`);
      console.log(`  焦虑类型: ${pi.anxietyType || 'unknown'}`);
      console.log(`  引用字段: goal=${pi.referencedFields.goal}, anxiety=${pi.referencedFields.anxiety}, risk=${pi.referencedFields.riskPreference}, time=${pi.referencedFields.weeklyTime}`);
    }
  }
  
  // 3. 汇总统计
  console.log('\n## 汇总统计');
  
  const avgDifferentiation = results.reduce((sum, r) => sum + r.differentiationScore, 0) / results.length;
  const avgGoalRef = results.reduce((sum, r) => sum + r.fieldReferenceRate.goal, 0) / results.length;
  const avgAnxietyRef = results.reduce((sum, r) => sum + r.fieldReferenceRate.anxiety, 0) / results.length;
  const avgRiskRef = results.reduce((sum, r) => sum + r.fieldReferenceRate.riskPreference, 0) / results.length;
  const avgTimeRef = results.reduce((sum, r) => sum + r.fieldReferenceRate.weeklyTime, 0) / results.length;
  const avgHitRate = results.reduce((sum, r) => sum + r.overallHitRate, 0) / results.length;
  
  console.log(`- 平均差异度: ${Math.round(avgDifferentiation)}%`);
  console.log(`- 平均字段引用率:`);
  console.log(`  - goal: ${Math.round(avgGoalRef * 100)}%`);
  console.log(`  - anxiety: ${Math.round(avgAnxietyRef * 100)}%`);
  console.log(`  - riskPreference: ${Math.round(avgRiskRef * 100)}%`);
  console.log(`  - weeklyTime: ${Math.round(avgTimeRef * 100)}%`);
  console.log(`- 平均命中率: ${Math.round(avgHitRate * 100)}%`);
  
  // 4. 焦虑类型分布统计
  console.log('\n## 焦虑类型分布统计');
  
  const overallAnxietyTypeDistribution: Record<AnxietyType, number> = {
    income_anxiety: 0,
    job_security_anxiety: 0,
    skill_anxiety: 0,
    direction_anxiety: 0,
    execution_anxiety: 0,
    time_anxiety: 0,
    replacement_anxiety: 0,
    application_anxiety: 0,
    unknown: 0
  };
  
  const overallAnxietyTypeHitRate: Record<AnxietyType, number> = {
    income_anxiety: 0,
    job_security_anxiety: 0,
    skill_anxiety: 0,
    direction_anxiety: 0,
    execution_anxiety: 0,
    time_anxiety: 0,
    replacement_anxiety: 0,
    application_anxiety: 0,
    unknown: 0
  };
  
  for (const result of results) {
    for (const [type, count] of Object.entries(result.anxietyTypeDistribution)) {
      overallAnxietyTypeDistribution[type as AnxietyType] += count;
    }
    for (const [type, count] of Object.entries(result.anxietyTypeHitRate)) {
      overallAnxietyTypeHitRate[type as AnxietyType] += count;
    }
  }
  
  console.log('\n焦虑类型分布:');
  for (const [type, count] of Object.entries(overallAnxietyTypeDistribution)) {
    if (count > 0) {
      const hitCount = overallAnxietyTypeHitRate[type as AnxietyType];
      const hitRate = count > 0 ? hitCount / count : 0;
      console.log(`- ${type}: ${count} 个, 命中率 ${Math.round(hitRate * 100)}%`);
    }
  }
  
  // 5. 洞察复用率
  console.log('\n## 洞察复用率');
  const totalTests = results.length * results[0]?.userProfiles.length || 0;
  const uniqueInsightsUsed = new Set(results.map(r => r.insightId)).size;
  const reuseRate = (totalTests / uniqueInsightsUsed);
  console.log(`- 测试总数: ${totalTests}`);
  console.log(`- 使用洞察数: ${uniqueInsightsUsed}`);
  console.log(`- 复用率: 每条洞察平均服务 ${reuseRate.toFixed(1)} 个用户`);
  
  // 6. 结论
  console.log('\n## 结论');
  
  if (avgDifferentiation >= 60) {
    console.log('✅ 差异度达标 - 同一洞察能生成不同解释');
  } else {
    console.log('⚠️ 差异度不足 - 个性化解释相似度偏高');
  }
  
  if (avgAnxietyRef >= 0.6) {
    console.log('✅ anxiety引用率达标 - 个性化解释引用了anxiety字段');
  } else {
    console.log('❌ anxiety引用率不达标 - 需要改进');
  }
  
  if (avgHitRate >= 0.5) {
    console.log('✅ 字段引用达标 - 个性化解释引用了用户字段');
  } else {
    console.log('⚠️ 字段引用不足 - 个性化解释未充分引用用户字段');
  }
  
  if (reuseRate >= 3) {
    console.log('✅ 复用率达标 - 每条洞察可服务多个用户');
  } else {
    console.log('⚠️ 复用率不足 - 洞察利用率偏低');
  }
  
  // 最终判断
  console.log('\n## 最终判断');
  if (avgAnxietyRef >= 0.6) {
    console.log('✅ 可以进入 Radar 试接入');
  } else {
    console.log('❌ 不可以进入 Radar 试接入 - anxiety引用率不达标');
  }
  
  console.log('\n' + '='.repeat(70));
}

// ============================================================
// 主流程
// ============================================================

async function main(): Promise<void> {
  console.log('🧪 FutureLens V6.3 Insight Personalization Test\n');
  
  const allResults: TestResult[] = [];
  
  // 运行各领域测试
  console.log('测试 Finance 领域...');
  allResults.push(...runPersonalizationTest('finance', FINANCE_USERS));
  
  console.log('测试 Architecture 领域...');
  allResults.push(...runPersonalizationTest('architecture', ARCHITECTURE_USERS));
  
  console.log('测试 Design 领域...');
  allResults.push(...runPersonalizationTest('design', DESIGN_USERS));
  
  console.log('测试 Study Abroad 领域...');
  allResults.push(...runPersonalizationTest('study_abroad', STUDY_USERS));
  
  console.log('测试 Creator 领域...');
  allResults.push(...runPersonalizationTest('creator', CREATOR_USERS));
  
  // 打印报告
  printTestReport(allResults);
}

main().catch(console.error);