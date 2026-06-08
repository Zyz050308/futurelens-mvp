/**
 * FutureLens V3.1 身份识别 + 策略库系统
 * 
 * 核心改变：从"通用建议"升级为"身份专属策略"
 * - 新增：Identity Engine（身份识别引擎）
 * - 新增：Strategy Library（策略库）
 * - 升级：输出包含真实平台、明确结果、预计时间
 */

import type { FutureProfile, BackgroundDomain, CurrentTask, AnxietyType, ActionNavigationRadar, FutureLensJudgment, CoreTask, TodayAction, ThisWeekAction, ChecklistItem, UserIdentity } from '@/types/radar';
import { detectBackgroundDomain, detectCurrentTask, detectAnxietyType } from './radar';

// ============================================================
// 辅助函数
// ============================================================

function isMeaningfulInput(value: string): boolean {
  if (!value || value.trim().length < 3) return false;
  
  const meaninglessPatterns = [
    /^无$/i,
    /^没有$/i,
    /^暂无$/i,
    /^未填写$/i,
    /^待定$/i,
    /^未知$/i,
    /^[.]+$/,
    /^[a-z]+$/i,
  ];
  
  const trimmed = value.trim();
  if (meaninglessPatterns.some(pattern => pattern.test(trimmed))) {
    return false;
  }
  
  return true;
}

function hasProfileMeaningfulData(profile: FutureProfile): boolean {
  const meaningfulFields = [
    profile.majorOrCareer,
    profile.currentSkills,
    profile.currentGoal,
    profile.currentAnxiety,
  ].filter(field => isMeaningfulInput(field)).length;
  
  return meaningfulFields >= 2;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// ============================================================
// Identity Engine：身份识别引擎
// ============================================================

function detectIdentity(profile: FutureProfile): UserIdentity {
  const { majorOrCareer, currentGoal, currentAnxiety, currentSkills } = profile;
  const fullText = `${majorOrCareer} ${currentGoal} ${currentAnxiety} ${currentSkills}`.toLowerCase();
  
  // 雅思考生
  if (containsKeywords(fullText, ['雅思', 'ielts', '托福', 'toefl', '出国英语', '留学英语'])) {
    return 'ielts_student';
  }
  
  // 留学申请
  if (containsKeywords(fullText, ['留学', '出国', '申请学校', '海外', '国外大学', 'master', 'phd'])) {
    return 'study_abroad';
  }
  
  // 考研用户
  if (containsKeywords(fullText, ['考研', '研究生', '考学', '保研', '复试', '初试'])) {
    return 'graduate_exam';
  }
  
  // 设计学生
  if (containsKeywords(fullText, ['设计', 'ui', 'ux', '平面设计', '视觉传达', '产品设计', '插画', '设计师', 'figma', 'ps', 'photoshop'])) {
    if (containsKeywords(fullText, ['学生', '大四', '大三', '大二', '大一', '应届', '毕业', '找工作', '求职', '实习'])) {
      return 'design_student';
    }
  }
  
  // 求职者
  if (containsKeywords(fullText, ['找工作', '求职', '面试', '简历', 'offer', '跳槽', '换工作', '就业', '应届生', '实习'])) {
    return 'job_seeker';
  }
  
  // 转行用户
  if (containsKeywords(fullText, ['转行', '转专业', '换行业', '从零开始', '零基础', '转岗'])) {
    return 'career_transition';
  }
  
  // AI产品开发者
  if (containsKeywords(fullText, ['ai产品', 'prompt', '大模型', 'llm', 'chatgpt', 'midjourney', 'stable diffusion', 'ai应用', 'agent'])) {
    return 'ai_builder';
  }
  
  // 创业者
  if (containsKeywords(fullText, ['创业', '做产品', 'startup', '创始人', '合伙人', '独立开发', 'side project', '副业', '变现'])) {
    return 'entrepreneur';
  }
  
  // 内容创作者
  if (containsKeywords(fullText, ['做内容', '自媒体', '公众号', '小红书', '抖音', 'b站', 'up主', '博主', '写作', '视频', '剪辑'])) {
    return 'creator';
  }
  
  return 'unknown';
}

// ============================================================
// Strategy Library：策略库
// ============================================================

interface Strategy {
  judgment: FutureLensJudgment;
  coreTask: Omit<CoreTask, 'todayAction' | 'thisWeekAction'>;
  todayAction: TodayAction;
  thisWeekAction: ThisWeekAction;
}

function getDesignStudentStrategy(): Strategy {
  return {
    judgment: {
      notTheProblem: 'AI替代设计师',
      realObstacle: '没有真实商业项目经验',
      reason: '企业不会因为你会PS录用你，但会因为你做过真实项目录用你。真实客户的反馈，比100个虚拟练习更有价值。',
    },
    coreTask: {
      timeFrame: '未来7天',
      mainTask: '获得第一个真实项目',
      reason: '哪怕是免费的，真实项目经验比继续学软件更重要。',
      successCriteria: '完成1个真实客户项目',
      estimatedTime: '7天',
    },
    todayAction: {
      task: '打开闲鱼，搜索并记录20个设计案例',
      estimatedTime: '40分钟',
      successCriteria: '整理出20个案例的价格、服务内容、交付周期',
      checklist: [
        { id: generateId(), text: '打开闲鱼APP', estimatedTime: '1分钟' },
        { id: generateId(), text: '搜索"Logo设计"，记录10个销量最高的案例', estimatedTime: '15分钟' },
        { id: generateId(), text: '搜索"品牌设计"，记录5个案例', estimatedTime: '10分钟' },
        { id: generateId(), text: '搜索"包装设计"，记录5个案例', estimatedTime: '10分钟' },
        { id: generateId(), text: '整理成表格，对比价格、服务、周期', estimatedTime: '4分钟' },
      ],
    },
    thisWeekAction: {
      goal: '完成第一个真实项目',
      action: '在闲鱼发布服务，承接第一个项目（可以免费）',
      expectedResult: '获得第一个客户反馈',
      checklist: [
        { id: generateId(), text: 'Day 1: 参考案例，写好自己的服务介绍', estimatedTime: '30分钟' },
        { id: generateId(), text: 'Day 2: 在闲鱼发布3个不同的服务', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 3-4: 回复咨询，谈成第一个项目', estimatedTime: '2小时' },
        { id: generateId(), text: 'Day 5-6: 完成设计交付', estimatedTime: '3-5小时' },
        { id: generateId(), text: 'Day 7: 收集客户反馈，更新作品集', estimatedTime: '30分钟' },
      ],
    },
  };
}

function getIeltsStudentStrategy(): Strategy {
  return {
    judgment: {
      notTheProblem: '英语能力差',
      realObstacle: '没有稳定的学习反馈系统',
      reason: '盲目刷题只是在堆时间。你需要知道自己的弱项在哪里，针对性突破才是最快的方式。',
    },
    coreTask: {
      timeFrame: '未来7天',
      mainTask: '建立你的错题反馈系统',
      reason: '没有反馈的学习，进步会很慢。建立错题追踪系统，才能针对性突破。',
      successCriteria: '连续7天记录错题，找出3个弱项',
      estimatedTime: '7天',
    },
    todayAction: {
      task: '完成1套剑桥真题听力并分析错题',
      estimatedTime: '1小时',
      successCriteria: '记录每道错题的类型和错误原因',
      checklist: [
        { id: generateId(), text: '打开剑桥真题集，选择1套听力', estimatedTime: '2分钟' },
        { id: generateId(), text: '计时完成听力练习', estimatedTime: '30分钟' },
        { id: generateId(), text: '对答案，标记错题', estimatedTime: '5分钟' },
        { id: generateId(), text: '分析每道错题：是单词没听懂？还是没跟上节奏？', estimatedTime: '15分钟' },
        { id: generateId(), text: '记录到错题本上，标记错误类型', estimatedTime: '8分钟' },
      ],
    },
    thisWeekAction: {
      goal: '建立稳定的反馈系统',
      action: '每天完成1套练习，记录所有错题',
      expectedResult: '知道自己最容易错的3种题型',
      checklist: [
        { id: generateId(), text: 'Day 1: 准备错题本（Notion或Excel）', estimatedTime: '15分钟' },
        { id: generateId(), text: 'Day 2: 完成1套听力，记录错题', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 3: 完成1套阅读，记录错题', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 4: 完成1套听力，记录错题', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 5: 完成1套阅读，记录错题', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 6: 复习所有错题', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 7: 总结3个最弱项，制定下周计划', estimatedTime: '30分钟' },
      ],
    },
  };
}

function getEntrepreneurStrategy(): Strategy {
  return {
    judgment: {
      notTheProblem: '不会开发产品',
      realObstacle: '没有验证用户需求',
      reason: '你可能在做一个没人需要的东西。先验证需求，比开发产品重要100倍。',
    },
    coreTask: {
      timeFrame: '未来7天',
      mainTask: '验证用户需求',
      reason: '没有需求验证的产品，大概率是自嗨。先找到真正的痛点。',
      successCriteria: '完成10个用户访谈',
      estimatedTime: '7天',
    },
    todayAction: {
      task: '采访3个潜在用户',
      estimatedTime: '1小时',
      successCriteria: '记录每个用户的3个痛点',
      checklist: [
        { id: generateId(), text: '列出5个你认识的目标用户', estimatedTime: '5分钟' },
        { id: generateId(), text: '准备3个问题：最焦虑什么？怎么解决？为什么没解决？', estimatedTime: '10分钟' },
        { id: generateId(), text: '联系第1个用户，进行15分钟访谈', estimatedTime: '20分钟' },
        { id: generateId(), text: '联系第2个用户，进行15分钟访谈', estimatedTime: '20分钟' },
        { id: generateId(), text: '整理访谈记录', estimatedTime: '5分钟' },
      ],
    },
    thisWeekAction: {
      goal: '验证需求是否真实存在',
      action: '访谈10个目标用户，找出重复出现的痛点',
      expectedResult: '有1个明确的、多人提到的痛点',
      checklist: [
        { id: generateId(), text: 'Day 1: 准备访谈提纲，列出20个潜在用户', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 2-3: 访谈5个用户', estimatedTime: '2-3小时' },
        { id: generateId(), text: 'Day 4-5: 访谈另外5个用户', estimatedTime: '2-3小时' },
        { id: generateId(), text: 'Day 6: 整理所有访谈记录', estimatedTime: '2小时' },
        { id: generateId(), text: 'Day 7: 找出重复出现的3个痛点', estimatedTime: '1小时' },
      ],
    },
  };
}

function getJobSeekerStrategy(): Strategy {
  return {
    judgment: {
      notTheProblem: '不够优秀',
      realObstacle: '没有证明自己的作品',
      reason: '企业招人看的是证据，不是承诺。你需要用作品证明你能解决问题。',
    },
    coreTask: {
      timeFrame: '未来7天',
      mainTask: '准备1个能展示的作品',
      reason: '空泛的简历没人看，具体的作品才会让人眼前一亮。',
      successCriteria: '有1个可以在线访问的作品',
      estimatedTime: '7天',
    },
    todayAction: {
      task: '打开Boss直聘，研究10个目标岗位',
      estimatedTime: '40分钟',
      successCriteria: '列出这些岗位最需要的3个技能',
      checklist: [
        { id: generateId(), text: '打开Boss直聘APP', estimatedTime: '1分钟' },
        { id: generateId(), text: '搜索你想投的岗位', estimatedTime: '5分钟' },
        { id: generateId(), text: '仔细看10个岗位的JD', estimatedTime: '25分钟' },
        { id: generateId(), text: '记录出现最多的3个技能要求', estimatedTime: '5分钟' },
        { id: generateId(), text: '对比自己现有技能，找出差距', estimatedTime: '4分钟' },
      ],
    },
    thisWeekAction: {
      goal: '做出1个能展示的作品',
      action: '针对目标岗位，做1个小作品',
      expectedResult: '有1个可以放在简历上的作品',
      checklist: [
        { id: generateId(), text: 'Day 1-2: 确定作品方向，明确要解决的问题', estimatedTime: '2小时' },
        { id: generateId(), text: 'Day 3-5: 完成作品（不需要完美）', estimatedTime: '5-8小时' },
        { id: generateId(), text: 'Day 6: 把作品放到网上（GitHub/Notion/个人网站）', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 7: 更新简历，把作品放进去', estimatedTime: '1小时' },
      ],
    },
  };
}

function getGraduateExamStrategy(): Strategy {
  return {
    judgment: {
      notTheProblem: '知识点没学完',
      realObstacle: '没有针对性的复习计划',
      reason: '盲目啃书效率太低。你需要知道哪里是重点，哪里是自己的弱项。',
    },
    coreTask: {
      timeFrame: '未来7天',
      mainTask: '建立你的复习反馈系统',
      reason: '没有反馈的复习，就是在浪费时间。',
      successCriteria: '做完1套真题，找出自己的弱项',
      estimatedTime: '7天',
    },
    todayAction: {
      task: '计时完成1套去年的真题',
      estimatedTime: '3小时',
      successCriteria: '批改完，标记所有错题',
      checklist: [
        { id: generateId(), text: '找出去年的考研真题', estimatedTime: '5分钟' },
        { id: generateId(), text: '严格计时，完成1套真题', estimatedTime: '3小时' },
        { id: generateId(), text: '对照答案批改', estimatedTime: '30分钟' },
        { id: generateId(), text: '标记所有错题，统计错误率最高的章节', estimatedTime: '25分钟' },
      ],
    },
    thisWeekAction: {
      goal: '找到自己的弱项',
      action: '完成2套真题，分析错误规律',
      expectedResult: '知道自己最薄弱的3个章节',
      checklist: [
        { id: generateId(), text: 'Day 1: 完成第1套真题，批改分析', estimatedTime: '3.5小时' },
        { id: generateId(), text: 'Day 2-3: 针对错题复习对应的章节', estimatedTime: '4小时' },
        { id: generateId(), text: 'Day 4: 完成第2套真题，批改分析', estimatedTime: '3.5小时' },
        { id: generateId(), text: 'Day 5-6: 继续复习薄弱环节', estimatedTime: '4小时' },
        { id: generateId(), text: 'Day 7: 总结最弱的3个章节，制定下周计划', estimatedTime: '1小时' },
      ],
    },
  };
}

function getStudyAbroadStrategy(): Strategy {
  return {
    judgment: {
      notTheProblem: '学校背景不够好',
      realObstacle: '没有清晰的申请规划',
      reason: '留学申请是一场信息战。早规划、早准备，比临时抱佛脚有效得多。',
    },
    coreTask: {
      timeFrame: '未来7天',
      mainTask: '确定你的申请目标清单',
      reason: '没有目标的准备，就是在瞎忙。先确定你要申请哪些学校。',
      successCriteria: '列出10所目标学校，包括冲刺、匹配、保底',
      estimatedTime: '7天',
    },
    todayAction: {
      task: '打开小红书，搜索10个同背景的申请案例',
      estimatedTime: '1小时',
      successCriteria: '记录这些案例的背景、申请学校、结果',
      checklist: [
        { id: generateId(), text: '打开小红书', estimatedTime: '1分钟' },
        { id: generateId(), text: '搜索你的专业+留学申请', estimatedTime: '5分钟' },
        { id: generateId(), text: '找10个和你背景相似的案例', estimatedTime: '30分钟' },
        { id: generateId(), text: '记录他们的GPA、语言成绩、申请学校、最终去向', estimatedTime: '20分钟' },
        { id: generateId(), text: '对比自己的背景，找出差距', estimatedTime: '4分钟' },
      ],
    },
    thisWeekAction: {
      goal: '确定你的学校清单',
      action: '研究15所学校，选出10所作为目标',
      expectedResult: '有一份明确的申请清单（3冲刺+4匹配+3保底）',
      checklist: [
        { id: generateId(), text: 'Day 1-2: 列出15所感兴趣的学校', estimatedTime: '2小时' },
        { id: generateId(), text: 'Day 3-4: 研究每所学校的申请要求、截止日期', estimatedTime: '3小时' },
        { id: generateId(), text: 'Day 5: 联系学长学姐，了解真实情况', estimatedTime: '2小时' },
        { id: generateId(), text: 'Day 6: 筛选出10所学校（3冲刺+4匹配+3保底）', estimatedTime: '2小时' },
        { id: generateId(), text: 'Day 7: 整理成表格，标出每所的截止日期', estimatedTime: '1小时' },
      ],
    },
  };
}

function getCareerTransitionStrategy(): Strategy {
  return {
    judgment: {
      notTheProblem: '零基础没经验',
      realObstacle: '没有最小可行的作品集',
      reason: '转行最忌"等我准备好了再开始"。先做1个小作品，比学100个课程更有用。',
    },
    coreTask: {
      timeFrame: '未来7天',
      mainTask: '做1个能展示的小作品',
      reason: '空口说想转行没人信，拿出作品才让人相信你是认真的。',
      successCriteria: '有1个可以给别人看的作品',
      estimatedTime: '7天',
    },
    todayAction: {
      task: '列出3个你能做的最小作品',
      estimatedTime: '30分钟',
      successCriteria: '选出1个明天开始做',
      checklist: [
        { id: generateId(), text: '写下你想转入的行业/岗位', estimatedTime: '5分钟' },
        { id: generateId(), text: '想3个"最小可行作品"（1周内能完成的）', estimatedTime: '15分钟' },
        { id: generateId(), text: '选出最简单的1个', estimatedTime: '5分钟' },
        { id: generateId(), text: '列出完成这个作品需要的步骤', estimatedTime: '5分钟' },
      ],
    },
    thisWeekAction: {
      goal: '完成第一个转行作品',
      action: '用本周时间完成1个小作品',
      expectedResult: '有1个可以放在简历上的作品',
      checklist: [
        { id: generateId(), text: 'Day 1: 确定作品方向，明确要解决的问题', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 2-4: 动手做（不用追求完美）', estimatedTime: '5-8小时' },
        { id: generateId(), text: 'Day 5: 找2-3个人看看，收集反馈', estimatedTime: '2小时' },
        { id: generateId(), text: 'Day 6: 根据反馈调整', estimatedTime: '2小时' },
        { id: generateId(), text: 'Day 7: 发布到网上（GitHub/Notion）', estimatedTime: '1小时' },
      ],
    },
  };
}

function getCreatorStrategy(): Strategy {
  return {
    judgment: {
      notTheProblem: '不够有才华',
      realObstacle: '没有稳定的输出习惯',
      reason: '做内容最忌"等灵感来了再写"。先建立稳定的输出习惯，比追求完美更重要。',
    },
    coreTask: {
      timeFrame: '未来7天',
      mainTask: '连续7天输出内容',
      reason: '灵感是写出来的，不是等出来的。先开始写，再慢慢变好。',
      successCriteria: '连续7天发布内容',
      estimatedTime: '7天',
    },
    todayAction: {
      task: '在小红书/公众号发布第1篇内容',
      estimatedTime: '1小时',
      successCriteria: '成功发布第1篇',
      checklist: [
        { id: generateId(), text: '打开你的内容平台（小红书/公众号）', estimatedTime: '1分钟' },
        { id: generateId(), text: '想3个你最想分享的话题', estimatedTime: '10分钟' },
        { id: generateId(), text: '选1个最简单的开始写', estimatedTime: '30分钟' },
        { id: generateId(), text: '排版、配图', estimatedTime: '15分钟' },
        { id: generateId(), text: '点击发布', estimatedTime: '4分钟' },
      ],
    },
    thisWeekAction: {
      goal: '建立输出习惯',
      action: '连续7天发布内容（不用追求完美）',
      expectedResult: '发布7条内容，知道读者最喜欢什么',
      checklist: [
        { id: generateId(), text: 'Day 1: 发布第1篇', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 2: 发布第2篇，观察数据', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 3: 发布第3篇，尝试不同风格', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 4: 发布第4篇', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 5: 发布第5篇', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 6: 发布第6篇', estimatedTime: '1小时' },
        { id: generateId(), text: 'Day 7: 发布第7篇，总结这周数据', estimatedTime: '1小时' },
      ],
    },
  };
}

function getAiBuilderStrategy(): Strategy {
  return {
    judgment: {
      notTheProblem: '不会写代码',
      realObstacle: '没有找到真实的AI应用场景',
      reason: 'AI应用的核心不是技术，而是找到真正的痛点。先找到场景，再用技术解决。',
    },
    coreTask: {
      timeFrame: '未来7天',
      mainTask: '找到1个真实的AI应用场景',
      reason: '为了AI而AI的产品没有生命力。找到真实痛点，AI只是工具。',
      successCriteria: '有1个明确的、有人需要的AI应用想法',
      estimatedTime: '7天',
    },
    todayAction: {
      task: '在小红书搜索"AI应用"，记录10个案例',
      estimatedTime: '1小时',
      successCriteria: '整理出这些应用解决的问题',
      checklist: [
        { id: generateId(), text: '打开小红书', estimatedTime: '1分钟' },
        { id: generateId(), text: '搜索"AI应用"、"AI工具"', estimatedTime: '5分钟' },
        { id: generateId(), text: '找10个有人在用的AI产品', estimatedTime: '30分钟' },
        { id: generateId(), text: '记录每个产品解决的问题', estimatedTime: '20分钟' },
        { id: generateId(), text: '想：我身边有没有类似的问题？', estimatedTime: '4分钟' },
      ],
    },
    thisWeekAction: {
      goal: '找到你的第一个AI应用场景',
      action: '和10个人聊，找出他们重复提到的痛点',
      expectedResult: '有1个明确的AI应用想法',
      checklist: [
        { id: generateId(), text: 'Day 1: 列出10个你认识的人', estimatedTime: '30分钟' },
        { id: generateId(), text: 'Day 2-3: 和5个人聊：你最近在用什么AI工具？', estimatedTime: '2小时' },
        { id: generateId(), text: 'Day 4-5: 和另外5个人聊：你希望有什么AI工具？', estimatedTime: '2小时' },
        { id: generateId(), text: 'Day 6: 整理所有聊天记录', estimatedTime: '2小时' },
        { id: generateId(), text: 'Day 7: 选出1个最痛的点，作为你的第一个AI应用', estimatedTime: '1小时' },
      ],
    },
  };
}

function getUnknownStrategy(profile: FutureProfile, domain: BackgroundDomain, anxietyType: AnxietyType): Strategy {
  // 默认策略，保持原来的逻辑
  let judgment: FutureLensJudgment;
  let coreTask: Omit<CoreTask, 'todayAction' | 'thisWeekAction'>;
  let todayAction: TodayAction;
  let thisWeekAction: ThisWeekAction;

  switch (anxietyType) {
    case 'skill_obsolete':
      judgment = {
        notTheProblem: '技能被淘汰',
        realObstacle: '没有能展示的作品',
        reason: '企业需要的是能解决问题的人。你需要的是能展示的成果，而不是更多课程。',
      };
      coreTask = {
        timeFrame: '未来7天',
        mainTask: '做1个能展示的作品',
        reason: '作品比简历上的技能列表更有说服力。',
        successCriteria: '有1个可以在线访问的作品',
        estimatedTime: '7天',
      };
      todayAction = {
        task: '列出3个你能做的小作品',
        estimatedTime: '30分钟',
        successCriteria: '选出1个明天开始做',
        checklist: [
          { id: generateId(), text: '想3个你能解决的小问题', estimatedTime: '10分钟' },
          { id: generateId(), text: '选1个最简单的', estimatedTime: '5分钟' },
          { id: generateId(), text: '列出完成步骤', estimatedTime: '15分钟' },
        ],
      };
      thisWeekAction = {
        goal: '完成第一个作品',
        action: '用本周时间完成1个小作品',
        expectedResult: '有1个可以给别人看的作品',
        checklist: [
          { id: generateId(), text: 'Day 1: 确定作品方向', estimatedTime: '1小时' },
          { id: generateId(), text: 'Day 2-5: 动手做', estimatedTime: '5-8小时' },
          { id: generateId(), text: 'Day 6: 发布到网上', estimatedTime: '1小时' },
          { id: generateId(), text: 'Day 7: 收集反馈', estimatedTime: '1小时' },
        ],
      };
      break;

    case 'no_direction':
      judgment = {
        notTheProblem: '不知道未来方向',
        realObstacle: '没有通过行动获得反馈',
        reason: '方向不是想出来的，是试出来的。通过真实行动，你才会知道什么适合你。',
      };
      coreTask = {
        timeFrame: '未来7天',
        mainTask: '尝试3件不同的事',
        reason: '想太多不如做一件。先开始，再调整。',
        successCriteria: '完成3次尝试，记录感受',
        estimatedTime: '7天',
      };
      todayAction = {
        task: '做1件你一直想尝试但没做的事',
        estimatedTime: '1-2小时',
        successCriteria: '完成并记录感受',
        checklist: [
          { id: generateId(), text: '列出3件你想尝试的事', estimatedTime: '10分钟' },
          { id: generateId(), text: '选1件最简单的开始', estimatedTime: '5分钟' },
          { id: generateId(), text: '去做，不用追求完美', estimatedTime: '1小时' },
          { id: generateId(), text: '记录感受：开心吗？时间过得快吗？', estimatedTime: '10分钟' },
        ],
      };
      thisWeekAction = {
        goal: '找到最有感觉的方向',
        action: '尝试3件不同的事，对比感受',
        expectedResult: '知道哪件事让你最有成就感',
        checklist: [
          { id: generateId(), text: 'Day 1: 尝试第1件事', estimatedTime: '1-2小时' },
          { id: generateId(), text: 'Day 3: 尝试第2件事', estimatedTime: '1-2小时' },
          { id: generateId(), text: 'Day 5: 尝试第3件事', estimatedTime: '1-2小时' },
          { id: generateId(), text: 'Day 7: 对比3次经历，决定下一步', estimatedTime: '30分钟' },
        ],
      };
      break;

    default:
      judgment = {
        notTheProblem: '不够努力',
        realObstacle: '没有明确的下一步',
        reason: '努力很重要，但方向更重要。先明确今天要做什么，再谈长期目标。',
      };
      coreTask = {
        timeFrame: '未来7天',
        mainTask: '开始做第1件事',
        reason: '完美的计划不如不完美的开始。先行动，再调整。',
        successCriteria: '完成第1步',
        estimatedTime: '7天',
      };
      todayAction = {
        task: '做1件你能立刻开始的事',
        estimatedTime: '1小时',
        successCriteria: '完成第1步',
        checklist: [
          { id: generateId(), text: '写下你最想完成的1件事', estimatedTime: '5分钟' },
          { id: generateId(), text: '列出这件事的第1步', estimatedTime: '10分钟' },
          { id: generateId(), text: '现在就去做这第1步', estimatedTime: '45分钟' },
        ],
      };
      thisWeekAction = {
        goal: '完成第1件事',
        action: '把那件事做完',
        expectedResult: '有完成的成就感',
        checklist: [
          { id: generateId(), text: 'Day 1-3: 继续推进', estimatedTime: '3-5小时' },
          { id: generateId(), text: 'Day 4-6: 收尾', estimatedTime: '2-3小时' },
          { id: generateId(), text: 'Day 7: 庆祝完成，想下一件事', estimatedTime: '30分钟' },
        ],
      };
  }

  return { judgment, coreTask, todayAction, thisWeekAction };
}

// ============================================================
// 主入口函数
// ============================================================

export function generateActionNavigationRadar(profile: FutureProfile): ActionNavigationRadar {
  // 如果档案没有足够有意义的数据，返回默认空状态
  if (!hasProfileMeaningfulData(profile)) {
    return {
      judgment: {
        notTheProblem: '档案信息不足',
        realObstacle: '需要补充更多信息',
        reason: '请在档案中填写更具体的背景、目标、焦虑等信息，才能生成专属的下一步行动方案。',
      },
      coreTask: {
        timeFrame: '现在',
        mainTask: '完善你的档案信息',
        reason: '这是生成专属方案的基础',
        successCriteria: '档案信息完整',
        estimatedTime: '现在',
        todayAction: {
          task: '补充档案信息',
          estimatedTime: '5分钟',
          successCriteria: '填写专业背景、当前目标、焦虑等信息',
          checklist: [
            { id: generateId(), text: '填写专业或职业背景', estimatedTime: '1分钟' },
            { id: generateId(), text: '描述你现在能做什么', estimatedTime: '2分钟' },
            { id: generateId(), text: '说明你现在的目标是什么', estimatedTime: '1分钟' },
            { id: generateId(), text: '写出你当前最大的焦虑是什么', estimatedTime: '1分钟' },
          ],
        },
        thisWeekAction: {
          goal: '完善档案',
          action: '在档案页面补充完整信息',
          expectedResult: '档案信息完整',
          checklist: [
            { id: generateId(), text: '访问档案页面', estimatedTime: '1分钟' },
            { id: generateId(), text: '填写所有必填项', estimatedTime: '5分钟' },
            { id: generateId(), text: '保存并重新生成', estimatedTime: '1分钟' },
          ],
        },
      },
      identity: 'unknown',
    };
  }

  const identity = detectIdentity(profile);
  const domain = detectBackgroundDomain(profile);
  const anxietyType = detectAnxietyType(profile);

  let strategy: Strategy;

  switch (identity) {
    case 'design_student':
      strategy = getDesignStudentStrategy();
      break;
    case 'ielts_student':
      strategy = getIeltsStudentStrategy();
      break;
    case 'entrepreneur':
      strategy = getEntrepreneurStrategy();
      break;
    case 'job_seeker':
      strategy = getJobSeekerStrategy();
      break;
    case 'graduate_exam':
      strategy = getGraduateExamStrategy();
      break;
    case 'study_abroad':
      strategy = getStudyAbroadStrategy();
      break;
    case 'career_transition':
      strategy = getCareerTransitionStrategy();
      break;
    case 'creator':
      strategy = getCreatorStrategy();
      break;
    case 'ai_builder':
      strategy = getAiBuilderStrategy();
      break;
    default:
      strategy = getUnknownStrategy(profile, domain, anxietyType);
  }

  return {
    identity,
    judgment: strategy.judgment,
    coreTask: {
      ...strategy.coreTask,
      todayAction: strategy.todayAction,
      thisWeekAction: strategy.thisWeekAction,
    },
  };
}
