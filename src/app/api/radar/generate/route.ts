import { NextRequest, NextResponse } from 'next/server';
import { callDeepSeek } from '@/lib/deepseek';
import type { FutureProfile, ChangeSignal, OpportunityRadarV4 } from '@/types/radar';
import { 
  selectInsight, 
  generatePersonalizedInsight, 
  type UserStateProfile 
} from '@/lib/insightSelector';
import { detectBackgroundDomain, detectCurrentTask } from '@/lib/radar';

export interface GenerateRadarRequest {
  profile: FutureProfile;
  changeSignals: ChangeSignal[];
  userStateProfile?: any;
}

function buildPrompt(profile: FutureProfile, changeSignals: ChangeSignal[], userStateProfile?: any): string {
  const profileText = JSON.stringify(profile, null, 2);
  const signalsText = JSON.stringify(changeSignals, null, 2);
  const stateText = userStateProfile ? JSON.stringify(userStateProfile, null, 2) : '';

  // 构建 UserStateProfile
  const backgroundDomain = detectBackgroundDomain(profile);
  const currentTask = detectCurrentTask(profile);
  
  // 把 radar.ts 的 BackgroundDomain 转换为 insightLibrary 的 domain
  let insightDomain: string = 'design'; // 默认
  if (backgroundDomain === 'design') insightDomain = 'design';
  else if (backgroundDomain === 'tech') insightDomain = 'ai_product';
  else if (backgroundDomain === 'business') insightDomain = 'finance';
  else if (backgroundDomain === 'humanities') insightDomain = 'creator';
  else if (backgroundDomain === 'learning') insightDomain = 'study_abroad';
  else if (backgroundDomain === 'unknown') insightDomain = 'design';

  const userStateForInsight: UserStateProfile = {
    domain: insightDomain,
    userState: userStateProfile?.state || currentTask || 'general_exploration',
    goal: profile.currentGoal,
    anxiety: profile.currentAnxiety,
    weeklyTime: profile.weeklyTime,
    riskPreference: profile.riskPreference,
  };

  // 选择洞察并生成个性化洞察
  const selectedInsight = selectInsight(userStateForInsight);
  let personalizedInsightText = '';
  
  if (selectedInsight) {
    const personalizedInsight = generatePersonalizedInsight(selectedInsight, userStateForInsight);
    personalizedInsightText = JSON.stringify(personalizedInsight, null, 2);
  }

  return `【最高优先级】

【V6.3.1 Insight Library 强制要求】

你必须优先使用 Insight Library 提供的洞察作为 CoreInsight，不要自由创造！

这是从 Insight Library 为这个用户匹配的个性化洞察：
${selectedInsight ? personalizedInsightText : '（未找到匹配洞察，可以自由生成）'}

${selectedInsight ? `
【核心规则】
1. CoreInsight 的"你以为"和"实际上"必须优先使用上面洞察中 personalizedCoreInsight 的内容
2. 可以适当润色，但不能改变洞察的核心观点
3. 洞察的引用字段（goal/anxiety/riskPreference/weeklyTime）必须在你的输出中体现
4. 只有当没有匹配洞察时，你才可以自由生成 CoreInsight

【重要】你必须优先使用这个洞察，而不是自己编造！

洞察原文：
- id: ${selectedInsight.id}
- 标题: ${selectedInsight.title}
- 核心观点: ${selectedInsight.coreInsight["你以为"]} → ${selectedInsight.coreInsight["实际上"]}
- 证据: ${selectedInsight.evidence}
- 价值迁移方向: ${selectedInsight.migrationDirection}
` : ''}

你不是职业规划顾问。

你是 FutureLens 的个人行动导航系统。

你必须根据 userStateProfile 生成建议。

【V6.6 最高优先级规则】

用户档案中的 currentSituation（最近最让你纠结的一件事）是最高优先级信息！

优先级顺序（从高到低）：
1. profile.currentSituation（用户最近纠结的事）← 这是最高优先级！
2. userStateProfile.state（用户状态）
3. userStateProfile.strategyFocus（当前状态下真正应该关注的策略方向）
4. userStateProfile.actionBias（行动生成时应该优先选择的动作类型）
5. userStateProfile.forbiddenBias（行动生成时应该避免的动作类型）
6. 用户 profile 中的时间 / 风险 / 焦虑 / 目标
7. changeSignals（今日变化信号，作为现实依据）
8. domain / 职业背景

也就是说：currentSituation > 用户状态 > 目标焦虑 > 时间风险能力 > 今日变化 > 职业标签

如果 currentSituation 与其他字段冲突，优先相信 currentSituation！

如果职业和状态冲突，优先状态。

【禁止规则】

禁止因为用户是某个职业，就默认推荐该职业常见路径。

建筑用户：
✗ 不能默认都推荐 BIM / 施工图 / 闲鱼效果图
✓ 必须先问：这个建筑用户现在处于什么状态？他真正要解决什么问题？

设计用户：
✗ 不能默认都推荐 Logo / 作品集 / 小红书
✓ 必须先问：这个设计用户现在处于什么状态？他真正要解决什么问题？

金融用户：
✗ 不能默认都推荐理财科普 / 投顾 / 数据分析
✓ 必须先问：这个金融用户现在处于什么状态？他真正要解决什么问题？

必须先问：
- 这个用户现在处于什么状态？
- 他真正要解决什么问题？
- 他的时间够不够？
- 他能承受多大风险？
- 他的焦虑是什么？

【状态差异强制规则】

如果同一个职业有不同 userStateProfile.state，你必须生成明显不同的行动路线：

建筑 + monetization_exploration：
→ 低成本接单验证，确认能否赚钱。不是学BIM。

建筑 + career_security_anxiety：
→ 岗位要求、证书、稳定路线。不是闲鱼接单。

建筑 + entrepreneurship_trial：
→ 客户访谈、本地获客、小型服务验证。不是学施工图。

建筑 + direction_confusion：
→ 三个方向小测试，不直接接单或学BIM。

建筑 + low_energy_survival：
→ 每天15分钟微行动，不安排复杂项目。

---

FutureLens 不是新闻网站，不是趋势总结，不是职业测评，不是泛泛建议工具。
FutureLens 是 AI时代个人行动导航系统。

你的任务不是鼓励用户，而是根据「用户状态」和「今日变化」判断：
1. 今天发生了什么变化
2. 这个变化为什么影响这个用户
3. 用户现在真正的问题是什么
4. 用户今天/明天/本周应该做什么

【核心原则】你必须优先根据 userStateProfile 判断用户状态，而不是职业。

用户状态比职业标签更重要：
- 职业只是背景
- 目标决定方向
- 焦虑决定优先级
- 时间决定行动规模
- 风险偏好决定路径激进程度
- 能力决定起步任务难度

必须分析的维度：
1. 用户是谁（职业背景）
2. 用户现在真正想解决什么（主要目标）
3. 用户最大的限制是什么（时间/能力/资源）
4. 用户害怕什么（主要焦虑）
5. 用户每周能投入多少（时间约束）
6. 用户适合保守路线还是激进路线（风险偏好）
7. 因此今天应该做什么（具体行动）

${userStateProfile ? `
用户状态分析：
${stateText}

你必须根据这个状态分析生成建议：
- 状态名称：${userStateProfile.stateLabel}
- 一句话诊断：${userStateProfile.oneSentenceDiagnosis}
- 主目标：${userStateProfile.mainGoal}
- 主要焦虑：${userStateProfile.mainFear}
- 关键限制：${userStateProfile.keyConstraint}
- 推荐策略：${userStateProfile.recommendedStrategy}
- 应避免：${userStateProfile.avoidStrategy}
- 策略重点：${userStateProfile.strategyFocus?.join('、') || '未提供'}
- 优先动作：${userStateProfile.actionBias?.join('、') || '未提供'}
- 禁止动作：${userStateProfile.forbiddenBias?.join('、') || '未提供'}
- 决策优先级说明：${userStateProfile.decisionPriority || ''}
` : '注意：没有用户状态信息，请根据职业和目标综合判断。'}

【V5.9 Real Change Engine 强化要求】
你必须把 changeSignals 当成现实输入，必须逐条使用 changeSignals 中的：
- affectedCapabilities（变化影响哪些能力）
- threatenedTasks（变化威胁哪些任务）
- emergingOpportunities（变化创造什么新机会）

Personal Impact 必须明确回答：
1. 这个变化具体影响用户哪项能力？
2. 这个变化威胁用户哪类任务？
3. 这个变化创造了什么新位置？
4. 用户当前状态决定他应该如何应对？

Personal Impact 的 reason 必须明确引用至少一个：affectedCapabilities、threatenedTasks、emergingOpportunities。

正确示例：
✓ "你当前依赖「基础视觉执行」能力，而变化信号显示「Logo草稿、海报排版」正在被AI替代，所以系统不建议你继续只接低价执行单，而是先验证品牌策略类需求。"

错误示例：
✗ "AI发展很快，所以你要行动。"

禁止只根据状态生成建议，必须同时参考变化信号！
禁止把变化信号当成装饰，必须真正影响 personalImpact 和 actions！

---
你收到的 changeSignals 是今天与该用户最相关的变化信号。
changeSignals 只能作为现实依据，不能让 changeSignals 覆盖 userStateProfile。
如果 changeSignals 和 userStateProfile 发生冲突，优先遵循 userStateProfile 的 strategyFocus 和 actionBias。
不要自行替换行业。不要使用没有传入的新闻或行业背景。
如果用户身份与变化信号不匹配，请在结果中指出"当前变化信号不足以支持判断"，不要强行编造。
禁止使用与传入变化信号无关的其他行业变化（如把建筑变化讲给金融用户）。

禁止输出以下废话：
- 提升能力
- 学习AI
- 关注趋势
- 建立IP
- 持续输出
- 拥抱变化
- 多尝试
- 保持学习

除非后面有非常具体的动作。

行动必须满足：
1. 今天晚上就能开始
2. 具体到平台、对象、数量或时间
3. 有完成标准
4. 和用户状态强相关
5. 符合用户的时间约束（${userStateProfile?.availableTime || '未知'}）
6. 符合用户的风险偏好（${userStateProfile?.riskPreference || '适中'}）
7. 严格遵循 actionBias（优先动作）${userStateProfile?.actionBias?.length ? '：' + userStateProfile.actionBias.join(' > ') + '优先' : ''}
8. 严格避免 forbiddenBias（禁止动作）${userStateProfile?.forbiddenBias?.length ? '：' + userStateProfile.forbiddenBias.join('、') + '都不要做' : ''}

${userStateProfile?.state === 'low_energy_survival' || userStateProfile?.state === 'monetization_exploration' ? `
【重要】用户处于"低能量"或"变现探索"状态：
- 建议必须是每天15-30分钟的最小行动
- 不要建议系统学习或大项目
- 重点是低成本市场验证
- 今晚任务应该：15分钟内完成，不要求完美
` : ''}

${userStateProfile?.state === 'monetization_sprint' || userStateProfile?.state === 'entrepreneurship_trial' ? `
【重要】用户处于"冲刺"或"创业试探"状态：
- 建议可以包含多任务并行
- 建议可以是作品发布、平台测试
- 重点是快速验证和迭代
- 今晚任务：目标不是学习，而是发布并获得反馈
` : ''}

${userStateProfile?.state === 'career_security_anxiety' ? `
【重要】用户处于"职业安全焦虑"状态：
- 建议必须是稳定、稳妥的路径
- 重点是证书、岗位路径、稳定入口
- 避免高风险建议
- 今晚任务：优先查稳定岗位要求，不要急着接单
` : ''}

${userStateProfile?.state === 'direction_confusion' ? `
【重要】用户处于"方向迷茫"状态：
- 不要给长期路线规划
- 重点是三个方向小测试
- 今晚任务：做三个30分钟测试，不直接定职业
` : ''}

用户档案：
${profileText}

今日变化信号（这些是与该用户最相关的信号，必须基于这些信号进行分析）：
${signalsText}

【V5.5 Impact Layer 强制要求】

对于每一个变化信号，你必须先解释 Personal Impact：

1. 用户当前什么能力受到影响？
2. 用户当前什么目标受到影响？
3. 用户当前什么风险增加？
4. 用户当前什么机会增加？

禁止直接跳到行动！必须先有 Personal Impact。

示例：
变化：AI设计工具自动完成基础视觉稿
→
影响（Personal Impact）：
affectedPart: 你目前的优势主要来自视觉执行
reason: AI正在降低基础执行价值，但你未来目标是AI产品方向，因此产品理解能力价值上升
opportunity: 比纯设计师更早进入AI产品领域
risk: 如果继续停留在执行层，竞争力会下降


【V6.7 CoreInsight 强制要求 —— 从「分析」升级到「理解」】

CoreInsight 必须让用户产生「这句话像在说我」的感觉，而不是「有道理」。

禁止输出以下空泛表达：
- 提升能力、持续学习、积累经验、关注行业、保持努力、提高效率
- 学习AI、拥抱变化、建立个人品牌、提高竞争力
- 缺少反馈链条、需要更高效的学习方法

所有结论必须：
- 与用户身份有关
- 与用户焦虑有关
- 与用户目标有关
- 与用户输入的具体内容有关

格式（四个模块）：

1. 你正在经历什么

系统先复述用户状态。让用户感觉「它听懂我了」。

示例 - 雅思备考用户：
你正在同时面对三件事：雅思备考、出国申请、未来职业方向。
这些事情被你绑在了一起。
所以每次雅思成绩不理想，你都会感觉整个人生停住了。

示例 - 设计师：
你正在每天花大量时间做设计练习，但不确定这些练习能不能变成收入。
你同时担心AI会替代基础设计工作，但又不知道该往哪个方向转型。

2. 你真正害怕失去什么

必须触达情绪、恐惧和真正驱动力，而不是分析行为。

示例 - 雅思备考用户：
你真正害怕的不是英语。
而是：如果英语没有结果，出国计划会受影响；如果出国计划受影响，未来方向会变得更模糊。
你害怕的是：未来失去确定性。

示例 - 设计师：
你真正害怕的不是技能不够。
而是：你投入的时间可能换不来任何回报。
你害怕的是：努力了，但方向错了。

3. 真正的问题是什么

不是分析行为（如「学习效率问题」），而是分析结构（如「想清楚放在验证之前」）。

示例 - 雅思备考用户：
你正在试图先看清未来，再决定怎么行动。
但未来本来就是行动之后才会变清晰的。
所以真正的问题不是方向不明确，而是你把「想清楚」放在了「验证之前」。

示例 - 设计师：
你正在试图先确定哪个方向值得投入，再开始行动。
但哪个方向值得投入，只有试过才知道。
所以真正的问题不是方向不明确，而是你在等一个不存在的「确定性信号」。

4. 如果只记住一句话

整个页面最重要的一句话。用户关掉页面后仍然记得。

示例 - 雅思备考用户：
不要试图先看清未来。先完成下一步。未来会在行动里变清晰。

示例 - 设计师：
不要等确定性信号。先做一个小测试。答案会在测试里出现。

验收标准：
如果输出仍然是「学习效率问题」「反馈链条问题」「缺少明确方向」→ 视为失败。
如果输出触达「未来焦虑」「身份焦虑」「不确定性恐惧」「行动与验证关系」→ 视为通过。

【V6.0 Personal Value Engine 强制要求】

对于每个用户，你必须分析「个人价值迁移路径」：

1. 用户当前主要依赖什么能力产生价值？
2. 哪些能力正在贬值？
3. 哪些能力正在升值？
4. 用户最合理的迁移路线是什么？
5. 迁移紧迫度是多少？

禁止：
- 只谈行业趋势
- 只谈通用能力
- 必须谈用户本人当前依赖的具体能力

必须结合 changeSignals 中的：
- affectedCapabilities（影响哪些能力）
- threatenedTasks（威胁哪些任务）
- emergingOpportunities（创造什么新机会）

判断价值迁移：

示例 - 设计师：
currentValueSource: ["Logo设计", "海报设计", "视觉执行"]
decliningValue: ["基础视觉执行", "Logo草稿", "简单包装设计"]
risingValue: ["品牌策略", "商业提案", "视觉系统设计"]
migrationDirection: "从视觉执行 → 品牌策略 → 商业表达"
urgencyLevel: "high"（因为基础视觉执行正在被AI快速替代）

示例 - 财务：
currentValueSource: ["Excel做账", "基础核算", "手工对账"]
decliningValue: ["数据录入", "报表整理", "手工对账"]
risingValue: ["财务分析", "经营分析", "AI财务流程搭建"]
migrationDirection: "从基础核算 → 财务分析 → 经营分析"
urgencyLevel: "medium"（3-5年内会被影响）

示例 - 建筑：
currentValueSource: ["效果图", "图纸整理", "现场管理"]
decliningValue: ["重复性建模", "基础绘图"]
risingValue: ["BIM模型管理", "客户沟通", "项目管理"]
migrationDirection: "从绘图执行 → BIM管理 → 项目管理"
urgencyLevel: "medium"（行业分化中）

紧迫度判断：
- high: 未来1-2年明显被替代
- medium: 未来3-5年受影响
- low: 暂时稳定

【Future Self 提醒要求】
不要写空泛的话（"未来会越来越好"、"继续努力"），必须引用：
变化 → 影响 → 行动

请严格返回 JSON，不要 Markdown，不要解释。

【强制要求】
- 你必须只返回 JSON
- 不要返回 Markdown 代码块
- 不要返回【json】格式
- 不要在 JSON 前后添加任何文字或解释
- 返回内容必须能被 JSON.parse 直接解析
- 不要包含任何非 JSON 内容

JSON格式：
{
  "todayChanges": [
    {
      "title": "今日变化标题",
      "summary": "这件事发生了什么",
      "whyItMatters": "为什么和用户有关"
    }
  ],
  "personalImpact": {
    "affectedPart": "用户当前什么能力受到影响",
    "reason": "解释为什么这个变化会影响用户，要结合用户的目标和职业",
    "opportunity": "用户当前什么机会增加",
    "risk": "用户当前什么风险增加"
  },
  "coreInsight": {
    "你正在经历什么": "系统复述用户状态，让用户感觉被理解（如：你正在同时面对雅思备考、出国申请、未来职业方向，这些事情被你绑在一起了）",
    "你真正害怕失去什么": "触达情绪、恐惧和真正驱动力（如：你害怕的是未来失去确定性）",
    "真正的问题是什么": "分析结构而非行为（如：你把想清楚放在了验证之前）",
    "如果只记住一句话": "整个页面最重要的一句话（如：不要试图先看清未来，先完成下一步）"
  },
  "valueMigration": {
    "currentValueSource": ["用户当前主要依赖什么能力产生价值"],
    "decliningValue": ["哪些能力正在贬值"],
    "risingValue": ["哪些能力正在升值"],
    "migrationDirection": "从哪迁移到哪的一句话描述",
    "urgencyLevel": "low | medium | high"
  },
  "impactOnUser": {
    "identity": "系统识别出的用户身份",
    "currentProblem": "用户当前真正的问题",
    "risk30Days": "如果不行动，30天后会发生什么（必须具体，不能说'机会减少'、'进展缓慢'）",
    "risk90Days": "如果不行动，90天后会发生什么（必须具体）",
    "mostLikelyResult": "最可能的结果是什么（引用用户的具体情况）",
    "opportunity": "现在出现的新机会"
  },
  "decisionExplanation": {
    "currentPriority": "系统最关注什么，例如：确定创业方向，或者验证技能是否能赚钱，或者建立职业安全感",
    "whyNotOthers": "为什么不是别的事情，要引用用户真实字段，例如：因为你填写每周时间5小时以下，因此系统不会建议长期学习路线",
    "influencingFactors": [
      "想获得什么：...",
      "当前目标：...",
      "当前焦虑：...",
      "每周时间：...",
      "风险偏好：...",
      "当前能力：..."
    ],
    "alternativeScenario": "如果用户修改关键字段（比如把想获得什么从创业改成稳定工作），系统建议会发生什么变化"
  },
  "actions": [
    {
      "time": "今晚",
      "task": "具体任务（必须包含：打开什么平台、搜索什么关键词、完成什么动作）",
      "reason": "为什么要做这个（引用用户当前纠结的事）",
      "platform": "打开什么平台（如：知乎、小红书、GitHub、智联招聘等）",
      "keywords": "搜索什么关键词",
      "action": "完成什么具体动作",
      "successCriteria": "完成标准是什么"
    },
    {
      "time": "明天",
      "task": "具体任务",
      "reason": "为什么要做",
      "successCriteria": "完成标准"
    },
    {
      "time": "本周",
      "task": "具体任务",
      "reason": "为什么要做",
      "successCriteria": "完成标准"
    }
  ],
  "futureSelfMessage": "未来分身给现在用户的提醒，必须引用变化→影响→行动，不要空泛，200字以内"
}

【V5.8 Decision Transparency 要求】
你必须解释为什么推荐这些行动，而不是只告诉用户做什么！
- 禁止空话："因为AI发展很快"、"因为行业变化很大"、"因为未来很重要"、"因为趋势正在变化"
- 必须引用用户真实字段！例如："因为你填写每周时间5小时以下，因此系统不会建议长期学习路线"

decisionExplanation 要求：
- currentPriority：系统最关注什么？例如：确定创业方向，或者验证技能是否能赚钱，或者建立职业安全感
- whyNotOthers：为什么不是别的事情？要明确解释为什么排除了其他路线
- influencingFactors：列出哪些用户字段影响了判断，每项格式是"字段名：具体值"
- alternativeScenario：如果用户修改关键字段（比如把想获得什么从创业改成稳定工作），系统建议会发生什么变化

要求：
- todayChanges 必须基于传入的 changeSignals，但不要复制粘贴，要用自然的语言组织
- personalImpact 是必填项！必须针对每个职业生成完全不同的影响（设计师、财务、建筑必须不同）
- coreInsight 是 V6.7 必填项！必须包含"你正在经历什么"、"你真正害怕失去什么"、"真正的问题是什么"、"如果只记住一句话"四个部分，必须触达情绪和恐惧，禁止空泛表达
- valueMigration 是 V6.0 必填项！必须分析用户的价值迁移路径
- decisionExplanation 是必填项！必须完整解释系统决策过程
- impactOnUser.identity 要简洁明确，比如"${userStateProfile?.stateLabel || '某状态'}的${userStateProfile?.mainGoal || '某用户'}"
- actions 必须有3个，分别是"今晚"、"明天"、"本周"
- 文案必须直白，不要像咨询报告，不要像AI套话，不要空泛
- 严谨在输出中出现与 changeSignals 无关的行业内容
- 行动建议必须符合用户的时间和风险约束
- 行动必须遵循 actionBias（优先做这些）和 forbiddenBias（不要做这些）
- 同样的变化对不同职业必须有不同影响！（设计师、财务、建筑必须完全不同）`;
}

// Fallback Radar 对象
function createFallbackRadar(): OpportunityRadarV4 {
  return {
    todayChanges: [],
    personalImpact: {
      affectedPart: "暂时无法完整解析影响结果",
      reason: "AI 返回格式异常，但系统已保留基础分析结果。",
      opportunity: "请点击重新生成，或稍后再次尝试。",
      risk: "当前结果可能不完整。"
    },
    coreInsight: {
      "你正在经历什么": "无法解析 CoreInsight",
      "你真正害怕失去什么": "请点击重新生成",
      "真正的问题是什么": "请点击重新生成",
      "如果只记住一句话": "请点击重新生成"
    },
    valueMigration: {
      currentValueSource: ["暂时无法解析"],
      decliningValue: ["暂时无法解析"],
      risingValue: ["暂时无法解析"],
      migrationDirection: "请点击重新生成",
      urgencyLevel: "medium"
    },
    impactOnUser: {
      identity: "暂未识别",
      currentProblem: "AI 输出格式异常",
      risk30Days: "结果不完整，请重新生成",
      risk90Days: "结果不完整，请重新生成",
      mostLikelyResult: "结果不完整",
      opportunity: "重新生成后可获得完整分析"
    },
    decisionExplanation: {
      currentPriority: "暂无法确定当前最关注什么",
      whyNotOthers: "暂无法解释为什么不是别的事情",
      influencingFactors: [],
      alternativeScenario: "暂无法解释字段变化后的影响"
    },
    actions: [
      {
        time: "现在",
        task: "点击【更新今日变化】重新生成一次",
        reason: "本次 AI 返回格式不稳定",
        platform: "",
        keywords: "",
        action: "重新生成 Radar",
        successCriteria: "页面成功生成完整机会雷达"
      }
    ],
    futureSelfMessage: "这次结果没有完整生成，不代表你的档案无效。请重新生成一次。"
  };
}

// 安全的 JSON 解析函数，支持多级 fallback
function safeParseDeepSeekResponse(rawText: string): OpportunityRadarV4 {
  console.log('[DEBUG] ========================================');
  console.log('[DEBUG] rawText 前 1000 字符:');
  console.log(rawText.substring(0, 1000));
  console.log('[DEBUG] ========================================');
  console.log('[DEBUG] rawText 长度:', rawText.length);

  let parsedResult: OpportunityRadarV4 | null = null;
  let successStep = '';

  // 策略1：直接尝试 JSON.parse
  console.log('[DEBUG] 策略1：直接 JSON.parse');
  try {
    const parsed = JSON.parse(rawText.trim());
    if (parsed.todayChanges && parsed.impactOnUser && parsed.actions) {
      console.log('[DEBUG] 策略1 成功');
      successStep = '直接 JSON.parse';
      parsedResult = parsed as OpportunityRadarV4;
    } else {
      console.log('[DEBUG] 策略1 失败：缺少必需字段');
    }
  } catch (e) {
    console.log('[DEBUG] 策略1 失败:', (e as Error).message);
  }

  // 策略2：提取代码块中的 JSON
  if (!parsedResult) {
    console.log('[DEBUG] 策略2：提取代码块中的 JSON');
    try {
      const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        console.log('[DEBUG] 找到代码块，长度:', codeBlockMatch[1].length);
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        if (parsed.todayChanges && parsed.impactOnUser && parsed.actions) {
          console.log('[DEBUG] 策略2 成功');
          successStep = '提取代码块中的 JSON';
          parsedResult = parsed as OpportunityRadarV4;
        } else {
          console.log('[DEBUG] 策略2 失败：缺少必需字段');
        }
      } else {
        console.log('[DEBUG] 策略2 失败：未找到代码块');
      }
    } catch (e) {
      console.log('[DEBUG] 策略2 失败:', (e as Error).message);
    }
  }

  // 策略3：从文本中提取第一个 { 到最后一个 } 的内容
  if (!parsedResult) {
    console.log('[DEBUG] 策略3：提取第一个 { 到最后一个 } 的内容');
    try {
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      console.log('[DEBUG] firstBrace:', firstBrace, 'lastBrace:', lastBrace);
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonStr = rawText.substring(firstBrace, lastBrace + 1);
        console.log('[DEBUG] 提取到 jsonStr，长度:', jsonStr.length);
        const parsed = JSON.parse(jsonStr);
        if (parsed.todayChanges && parsed.impactOnUser && parsed.actions) {
          console.log('[DEBUG] 策略3 成功');
          successStep = '提取第一个 { 到最后一个 }';
          parsedResult = parsed as OpportunityRadarV4;
        } else {
          console.log('[DEBUG] 策略3 失败：缺少必需字段');
        }
      } else {
        console.log('[DEBUG] 策略3 失败：未找到有效 { ... } 范围');
      }
    } catch (e) {
      console.log('[DEBUG] 策略3 失败:', (e as Error).message);
    }
  }

  // 策略4：所有策略都失败，返回 fallback
  if (!parsedResult) {
    console.log('[DEBUG] 所有策略失败，触发 fallback');
    successStep = 'fallback';
    parsedResult = createFallbackRadar();
  }

  // 检查 JSON 字段
  console.log('[DEBUG] ========================================');
  console.log('[DEBUG] 检查必需字段:');
  console.log('[DEBUG]  - todayChanges 存在:', !!parsedResult.todayChanges);
  console.log('[DEBUG]  - personalImpact 存在:', !!parsedResult.personalImpact);
  console.log('[DEBUG]  - valueMigration 存在:', !!parsedResult.valueMigration);
  console.log('[DEBUG]  - coreInsight 存在:', !!parsedResult.coreInsight);
  console.log('[DEBUG]  - decisionExplanation 存在:', !!parsedResult.decisionExplanation);
  console.log('[DEBUG]  - actions 存在:', !!parsedResult.actions);
  console.log('[DEBUG]  - futureSelfMessage 存在:', !!parsedResult.futureSelfMessage);
  console.log('[DEBUG] ========================================');
  console.log('[DEBUG] 成功步骤:', successStep);

  return parsedResult;
}

function parseResponse(response: string): OpportunityRadarV4 {
  return safeParseDeepSeekResponse(response);
}

export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG] ========== API 调用开始 ==========');
    const body: GenerateRadarRequest = await request.json();
    const { profile, changeSignals } = body;

    console.log('[DEBUG] 用户 profile:', JSON.stringify({
      currentGoal: profile.currentGoal,
      currentAnxiety: profile.currentAnxiety,
      majorOrCareer: profile.majorOrCareer
    }, null, 2));

    // 验证参数
    if (!profile) {
      return NextResponse.json(
        { error: '缺少用户档案' },
        { status: 400 }
      );
    }

    if (!changeSignals || !Array.isArray(changeSignals)) {
      return NextResponse.json(
        { error: '缺少变化信号，请确保传入正确的 changeSignals 数组' },
        { status: 400 }
      );
    }

    if (changeSignals.length === 0) {
      return NextResponse.json(
        { error: '变化信号为空，无法生成 Radar。请检查用户档案是否包含足够的职业信息。' },
        { status: 400 }
      );
    }

    // 检查 API Key
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API Key 未配置。请在 .env.local 文件中设置 DEEPSEEK_API_KEY' },
        { status: 500 }
      );
    }

    // 构建 Prompt
    console.log('[DEBUG] 开始构建 Prompt');
    const prompt = buildPrompt(profile, changeSignals, body.userStateProfile);
    console.log('[DEBUG] Prompt 长度:', prompt.length, '字符');

    // 检测 insightDomain 和 selectedInsight
    const backgroundDomain = detectBackgroundDomain(profile);
    const currentTask = detectCurrentTask(profile);
    
    let insightDomain: string = 'design';
    if (backgroundDomain === 'design') insightDomain = 'design';
    else if (backgroundDomain === 'tech') insightDomain = 'ai_product';
    else if (backgroundDomain === 'business') insightDomain = 'finance';
    else if (backgroundDomain === 'humanities') insightDomain = 'creator';
    else if (backgroundDomain === 'learning') insightDomain = 'study_abroad';
    else if (backgroundDomain === 'unknown') insightDomain = 'design';

    const userStateForInsight: UserStateProfile = {
      domain: insightDomain,
      userState: body.userStateProfile?.state || currentTask || 'general_exploration',
      goal: profile.currentGoal,
      anxiety: profile.currentAnxiety,
      weeklyTime: profile.weeklyTime,
      riskPreference: profile.riskPreference,
    };

    console.log('[DEBUG] insightDomain:', insightDomain);
    console.log('[DEBUG] userStateForInsight:', JSON.stringify(userStateForInsight, null, 2));

    const selectedInsight = selectInsight(userStateForInsight);
    console.log('[DEBUG] selectedInsight 是否存在:', !!selectedInsight);
    if (selectedInsight) {
      console.log('[DEBUG] selectedInsight:', JSON.stringify({
        id: selectedInsight.id,
        domain: selectedInsight.domain,
        title: selectedInsight.title
      }, null, 2));
    } else {
      console.log('[DEBUG] WARNING: selectedInsight 为 null');
    }

    // 调用 DeepSeek
    console.log('[DEBUG] 开始调用 DeepSeek API...');
    const response = await callDeepSeek(prompt);
    console.log('[DEBUG] DeepSeek API 调用成功，响应长度:', response.length);

    // 解析响应（使用 safeParseDeepSeekResponse，不会抛出异常）
    const radarData = parseResponse(response);

    // 检查是否是 fallback（解析失败）
    const isFallback = !response.includes('"todayChanges"') && !response.trim().startsWith('{');
    console.log('[DEBUG] isFallback:', isFallback);

    console.log('[DEBUG] ========== API 调用结束 ==========');

    return NextResponse.json({
      success: true,
      data: radarData,
      isFallback: isFallback
    });
  } catch (error) {
    console.error('[API/Radar/Generate] 生成失败:', error);
    
    // 发生错误时也返回 fallback，而不是 500
    return NextResponse.json({
      success: true,
      data: createFallbackRadar(),
      isFallback: true
    });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'FutureLens Opportunity Radar 生成接口',
    usage: 'POST /api/radar/generate',
    body: {
      profile: '用户档案对象',
      changeSignals: '今日变化信号数组'
    }
  });
}
