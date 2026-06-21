import type {
  ActionItem,
  CapabilityName,
  FutureProfile,
  OpportunityRadarV4,
  ProblemShape,
  SolutionMaterialType,
  SolutionPack,
  UserStateProfile,
} from '@/types/radar';
import type { AttachedContextSummary, ProblemUnderstanding } from '@/types/capability';
import { buildCapabilityRoute } from './capabilityRouter';
import { buildExecutionPlan } from './executionPlanner';

type CapabilityPlan = {
  capability: CapabilityName;
  materialType: SolutionMaterialType;
  title: string;
  purpose: string;
  priority: 'high' | 'medium' | 'low';
};

type FeedbackQuestion = SolutionPack['feedbackQuestions'][number];

type AttachedContextInput = {
  type: 'pasted_text';
  label?: string;
  content: string;
};

type SolutionPackOptions = {
  attachedContext?: AttachedContextInput;
};

type MaterialIssue = {
  problem: string;
  why: string;
  direction: string;
  example: string;
};

function compactText(values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ').toLowerCase();
}

function getProfileText(profile: FutureProfile): string {
  return compactText([
    profile.currentSituation,
    profile.currentGoal,
    profile.currentAnxiety,
    profile.desiredOutcome,
    profile.currentSkills,
    profile.majorOrCareer,
  ]);
}

function getProblemText(
  profile: FutureProfile,
  userStateProfile?: Partial<UserStateProfile>,
  action?: ActionItem
): string {
  return compactText([
    getProfileText(profile),
    userStateProfile?.problemStatement,
    userStateProfile?.validationQuestion,
    userStateProfile?.actionDirective,
    action?.task,
    action?.action,
    action?.successCriteria,
  ]);
}

function hasUrgentConcreteTask(text: string): boolean {
  const hasTimePressure =
    /(明天|今晚|今天|本周|马上|立刻|截止|deadline|要交|要提交|要汇报|要面试|要演讲|要答辩|要开会|要完成)/i.test(text);
  const hasConcreteTask =
    /(汇报|ppt|报告|面试|演讲|答辩|开会|提交|交付|准备|材料|作业|申请|简历|方案|文档|邮件|任务|完成)/i.test(text);

  return hasTimePressure && hasConcreteTask;
}

function needsExistingMaterialAnalysis(text: string): boolean {
  const hasMaterialType = /(简历|cv|作品集|portfolio|ps|个人陈述|申请材料|汇报稿|报告|文档|文章|脚本|介绍页|项目介绍|材料)/i.test(text);
  const hasExistingSignal = /(已有|现有|一份|这份|我的|我有|我写了|写了一段|帮我看|帮我看看|帮我改|这是我的)/i.test(text);
  const asksForReview = /(哪里需要修改|哪里不专业|怎么优化|修改|优化|分析|不足|建议|改进|检查|润色|诊断|反馈|评估|是否清楚)/i.test(text);
  const fromScratchSignal = /(想写|要写|从零|不知道怎么写|帮我写|生成一份|做一份|创建)/i.test(text);

  return hasMaterialType && asksForReview && hasExistingSignal && !fromScratchSignal;
}

function needsResearchInformation(text: string): boolean {
  const asksForInformation = /(搜索|查找|资料|信息|案例|调研|研究|了解|收集|整理)/i.test(text);
  const isOnlyInformationGap = /(不知道|不清楚|不了解|缺少|没有资料|没有信息|从哪找|哪里找)/i.test(text);

  return asksForInformation && isOnlyInformationGap;
}

function isCreateOutputRequest(text: string): boolean {
  const hasOutput = /(文章|简历|作品集|作品集项目介绍|介绍页|项目介绍|方案书|方案|视频|脚本|文案|报告|汇报|页面|海报|内容|小红书|ppt)/i.test(text);
  const wantsCreation = /(想写|要写|怎么写|不知道怎么写|做一份|创建|生成|写一份|搭结构|结构怎么)/i.test(text);

  return hasOutput && wantsCreation && !needsExistingMaterialAnalysis(text);
}

export function inferProblemShape(
  profile: FutureProfile,
  userStateProfile?: Partial<UserStateProfile>,
  action?: ActionItem
): ProblemShape {
  const primaryText = compactText([
    getProfileText(profile),
    userStateProfile?.problemStatement,
    userStateProfile?.validationQuestion,
    userStateProfile?.actionDirective,
  ]);
  const text = getProblemText(profile, userStateProfile, action);

  if (needsExistingMaterialAnalysis(text)) {
    return 'analyze_existing_material';
  }

  if (userStateProfile?.problemType === 'monetization_validation') {
    return 'validate_opportunity';
  }

  if (userStateProfile?.problemType === 'exam_deadline') {
    return 'learn_capability';
  }

  if (hasUrgentConcreteTask(primaryText)) {
    return 'solve_specific_task';
  }

  if (userStateProfile?.problemType === 'content_publishing') {
    return 'create_output';
  }

  if (isCreateOutputRequest(primaryText)) {
    return 'create_output';
  }

  if (
    userStateProfile?.problemType === 'career_direction'
    || userStateProfile?.problemType === 'career_security'
    || action?.verificationType === 'industry_path_comparison'
    || action?.verificationType === 'direction_test'
  ) {
    return 'make_decision';
  }

  if (/(工作流|流程|自动化|提效|效率|sop|表格|整理资料|批量|运营流程|财务流程|固定流程)/i.test(text)) {
    return 'build_workflow';
  }

  if (needsResearchInformation(primaryText)) {
    return 'research_information';
  }

  if (/(选择|取舍|比较|要不要|该不该|方向|路径|哪个|考研|找工作)/i.test(text)) {
    return 'make_decision';
  }

  if (/(验证|客户|用户访谈|目标用户|真实用户|付费|询价|副业|创业|接单|需求|机会|mvp|愿意买|愿意付)/i.test(text)) {
    return 'validate_opportunity';
  }

  if (/(学习|备考|掌握|练习|刷题|课程|能力|技能|转行|英语|口语|听力|阅读|写作)/i.test(text)) {
    return 'learn_capability';
  }

  if (/(文章|简历|作品集|方案书|方案|视频|脚本|文案|报告|汇报|页面|海报|内容|发布|小红书|ppt|介绍页)/i.test(text)) {
    return 'create_output';
  }

  return 'solve_specific_task';
}

function getCapabilityPlans(shape: ProblemShape): CapabilityPlan[] {
  const plans: Record<ProblemShape, CapabilityPlan[]> = {
    learn_capability: [
      { capability: 'generate_learning_plan', materialType: 'learning_plan', title: '15分钟训练流程', purpose: '把学习目标拆成今天能完成的一轮训练。', priority: 'high' },
      { capability: 'generate_exercises', materialType: 'exercise_set', title: '今日练习题', purpose: '用具体练习暴露最卡的环节。', priority: 'high' },
      { capability: 'generate_table', materialType: 'table', title: '卡点复盘表', purpose: '记录不会的表达、错误类型和明天调整。', priority: 'medium' },
    ],
    build_workflow: [
      { capability: 'generate_workflow', materialType: 'workflow', title: '最小工作流', purpose: '把重复任务拆成输入、处理、检查、输出。', priority: 'high' },
      { capability: 'generate_prompt_template', materialType: 'prompt_template', title: '可复制提示词', purpose: '让流程能稳定交给工具辅助。', priority: 'high' },
      { capability: 'generate_checklist', materialType: 'checklist', title: '流程检查清单', purpose: '检查这套流程下次是否还能复用。', priority: 'medium' },
    ],
    create_output: [
      { capability: 'generate_document', materialType: 'document_template', title: '产出结构模板', purpose: '先搭好能直接填内容的结构。', priority: 'high' },
      { capability: 'generate_checklist', materialType: 'checklist', title: '交付前检查清单', purpose: '判断初稿是否达到可以给别人看的程度。', priority: 'high' },
      { capability: 'generate_review_form', materialType: 'review_form', title: '反馈收集表', purpose: '让别人给出具体反馈，而不是只说好不好。', priority: 'medium' },
    ],
    make_decision: [
      { capability: 'compare_options', materialType: 'table', title: '选项比较表', purpose: '把不同选择放到同一标准下比较。', priority: 'high' },
      { capability: 'generate_review_form', materialType: 'review_form', title: '不确定项验证表', purpose: '找出真正影响选择的未知信息。', priority: 'high' },
      { capability: 'generate_checklist', materialType: 'checklist', title: '决策标准清单', purpose: '明确哪些证据足以推动下一步。', priority: 'medium' },
    ],
    validate_opportunity: [
      { capability: 'generate_review_form', materialType: 'review_form', title: '机会验证表', purpose: '确认真实对象是否有需求和付费信号。', priority: 'high' },
      { capability: 'generate_message_template', materialType: 'message_template', title: '验证沟通话术', purpose: '降低接触真实对象的行动门槛。', priority: 'high' },
      { capability: 'generate_table', materialType: 'table', title: '反馈记录表', purpose: '记录兴趣、询价、拒绝和沉默。', priority: 'medium' },
    ],
    solve_specific_task: [
      { capability: 'generate_checklist', materialType: 'checklist', title: '最小交付清单', purpose: '先完成明天或今晚必须能交付的版本。', priority: 'high' },
      { capability: 'generate_document', materialType: 'document_template', title: '任务准备模板', purpose: '把汇报、面试或提交内容组织成可执行结构。', priority: 'high' },
      { capability: 'track_task', materialType: 'table', title: '最后检查表', purpose: '确认剩余时间内最应该补哪一步。', priority: 'medium' },
    ],
    research_information: [
      { capability: 'search_information', materialType: 'table', title: '资料检索记录表', purpose: '把需要补齐的信息变成可记录、可比较的事实。', priority: 'high' },
      { capability: 'generate_table', materialType: 'table', title: '信息对比表', purpose: '把不同来源的信息放到同一标准下整理。', priority: 'high' },
      { capability: 'generate_document', materialType: 'document_template', title: '研究结论模板', purpose: '把资料整理成能够支持下一步判断的结论。', priority: 'medium' },
    ],
    analyze_existing_material: [
      { capability: 'analyze_file', materialType: 'review_form', title: '材料分析入口', purpose: '先确认现有材料里最影响结果的问题。', priority: 'high' },
      { capability: 'generate_checklist', materialType: 'checklist', title: '修改检查清单', purpose: '把材料问题变成今天可以逐项修改的清单。', priority: 'high' },
      { capability: 'generate_document', materialType: 'document_template', title: '修改稿结构', purpose: '把修改方向整理成可继续完善的版本。', priority: 'medium' },
    ],
  };

  return plans[shape];
}

function getShapeLabel(shape: ProblemShape): string {
  const labels: Record<ProblemShape, string> = {
    learn_capability: '学习一个能力',
    build_workflow: '搭建一个工作流',
    create_output: '完成一个具体产出',
    make_decision: '做出一个选择',
    validate_opportunity: '验证一个机会',
    solve_specific_task: '解决一个具体任务',
    research_information: '补齐关键信息',
    analyze_existing_material: '分析已有材料',
  };
  return labels[shape];
}

function getGoal(profile: FutureProfile, action: ActionItem, target: string): string {
  return target || profile.currentGoal || profile.desiredOutcome || action.task || profile.currentSituation || '当前问题';
}

function isPortfolioIntro(goal: string): boolean {
  return /(作品集|介绍页|项目介绍|portfolio)/i.test(goal);
}

function isSpeechOrPresentation(goal: string): boolean {
  return /(汇报|ppt|报告|演讲|答辩|开会|presentation)/i.test(goal);
}

function isExamApplicationCoordination(text: string): boolean {
  const hasExam = /(雅思|ielts|托福|toefl|gre|gmat|备考|考试|分数|口语|听力|阅读|写作)/i.test(text);
  const hasApplication = /(申请|申请材料|文书|推荐信|项目经历|作品集|留学|院校|截止|deadline)/i.test(text);
  return hasExam && hasApplication;
}

function createExamApplicationMaterialContent(plan: CapabilityPlan, goal: string, obstacle: string): string {
  if (plan.materialType === 'learning_plan') {
    return `雅思备考 + 申请材料并行计划
核心判断：${obstacle}
本周不要把“先考完雅思”和“之后再准备申请”完全切开，先同步推进两个最小版本。

本周安排：
1. 雅思：每天完成1个最小训练块，只追踪最薄弱单项。
2. 申请材料：列出所有截止时间、必交材料和当前缺口。
3. 项目经历：每天整理1段能写进文书或简历的真实经历。
4. 过来人访谈：问1位已经申请过的人，确认材料准备顺序。

完成标志：到本周末，你应该同时知道“雅思下一步练什么”和“申请材料最先补什么”。`;
  }

  if (plan.materialType === 'exercise_set') {
    return `今日同步推进清单
目标：${goal}

今天只做4件小事：
1. 雅思：做一次25分钟单项诊断，记录最弱题型。
2. 申请：列出目标项目需要的材料清单。
3. 经历：写下1个项目经历，包含背景、你的动作、结果。
4. 访谈：准备3个问题问学长/中介/过来人：
   - 申请材料最容易低估哪一项？
   - 雅思分数和材料准备应该怎么并行？
   - 现在最先补什么，最晚可以等什么？`;
  }

  return `| 模块 | 今天要做什么 | 产出 | 当前缺口 | 下一步 |
| --- | --- | --- | --- | --- |
| 雅思备考 | 25分钟单项诊断 | 最弱题型记录 |  |  |
| 申请材料 | 列必交材料 | 材料清单 |  |  |
| 项目经历 | 整理1段经历 | 背景/动作/结果 |  |  |
| 过来人访谈 | 发出1次询问 | 对方原话 |  |  |`;
}

function normalizeAttachedContext(attachedContext?: AttachedContextInput): AttachedContextInput | undefined {
  const content = attachedContext?.content?.trim();
  if (!content || attachedContext?.type !== 'pasted_text') return undefined;

  return {
    type: 'pasted_text',
    label: attachedContext.label?.trim() || '粘贴材料',
    content: content.slice(0, 5000),
  };
}

function summarizeAttachedContext(attachedContext?: AttachedContextInput): AttachedContextSummary | undefined {
  const normalized = normalizeAttachedContext(attachedContext);
  if (!normalized) return undefined;

  return {
    type: 'pasted_text',
    label: normalized.label,
    contentPreview: normalized.content.slice(0, 180),
    charCount: normalized.content.length,
  };
}

function analyzeManualMaterial(content: string, goal: string): MaterialIssue[] {
  const text = content.trim();
  const issues: MaterialIssue[] = [];
  const addIssue = (issue: MaterialIssue) => {
    if (!issues.some(item => item.problem === issue.problem)) {
      issues.push(issue);
    }
  };

  if (/(熟练掌握|性格开朗|较强沟通能力|多个项目|相关工作|整体还可以|品牌感觉|希望能)/i.test(text)) {
    addIssue({
      problem: '表达偏泛，缺少可以判断能力的具体证据',
      why: '这类表达很常见，但看不出你具体做了什么、做到了什么程度，也不容易让对方形成明确判断。',
      direction: '把抽象评价换成具体场景、动作和结果。',
      example: '把“有较强沟通能力”改成“在项目中负责和需求方确认视觉风格，整理 3 轮反馈并完成最终版交付”。',
    });
  }

  if (!/(目标|需求|问题|背景|对象|用户|岗位|申请|受众)/i.test(text)) {
    addIssue({
      problem: '缺少目标对象或真实问题',
      why: '材料没有说明它服务谁、解决什么问题，对方只能看到经历或产物，看不到判断能力。',
      direction: '开头先补一句“这份材料/这个项目要解决什么问题”。',
      example: `面向${goal || '目标对象'}，我需要先说明项目背景、目标对象和核心问题，再展示做法。`,
    });
  }

  if (!/(因为|所以|策略|方法|判断|选择|取舍|调研|分析)/i.test(text)) {
    addIssue({
      problem: '缺少方法和判断过程',
      why: '只说做了什么，不说为什么这样做，会让材料像任务记录，而不是能力证明。',
      direction: '补充你如何判断、如何取舍、为什么选择这个方案。',
      example: '增加一句“我先比较了 A/B 两种表达方向，最终选择更适合年轻用户识别的方案”。',
    });
  }

  if (!/(结果|提升|降低|完成|上线|反馈|数据|获得|转化|录用|通过)/i.test(text)) {
    addIssue({
      problem: '缺少结果说明',
      why: '没有结果，对方无法判断这段经历或材料是否真的有效。',
      direction: '补充一个可观察结果：数据、反馈、交付物、通过情况或下一步影响。',
      example: '补充“最终形成 3 个视觉方案，并根据反馈确定主视觉方向”。',
    });
  }

  if (text.length < 80) {
    addIssue({
      problem: '内容太短，信息密度不足',
      why: '当前文本只能看出大概方向，看不出关键背景、动作和结果。',
      direction: '至少补齐背景、目标、你的动作、结果四个部分。',
      example: '用 4 句话分别写：项目背景、要解决的问题、你的具体动作、最终结果。',
    });
  }

  if (issues.length === 0) {
    addIssue({
      problem: '材料已经有基础信息，但重点还不够集中',
      why: '对方需要快速看到这份材料最想证明的能力，而不是自己从细节里猜。',
      direction: '把最能证明目标的经历放到前面，并删掉弱相关描述。',
      example: '开头先写“这段材料主要证明我能解决 X 问题”，再展开证据。',
    });
  }

  return issues.slice(0, 5);
}

function createOptimizedMaterialSnippet(content: string, goal: string): string {
  if (/(品牌|logo|包装|作品集|项目介绍|视觉)/i.test(content)) {
    return `优化版项目介绍片段：
这个项目围绕一个品牌视觉识别问题展开：如何让目标用户在短时间内理解品牌定位，并形成稳定记忆点。
我负责从品牌关键词、竞品视觉和使用场景出发，确定视觉方向，并将它落实到 Logo、包装和延展物料中。
相比只展示最终图形，我会在作品集中补充 2-3 张过程证据：关键词推导、方案取舍和最终应用效果。
这样呈现后，评审看到的不只是“做了 Logo 和包装”，而是我如何把真实需求转化为视觉系统。`;
  }

  if (/(简历|岗位|办公软件|沟通能力|项目|视觉设计)/i.test(content)) {
    return `优化版简历片段：
面向视觉设计岗位，我具备基础排版、视觉执行和项目协作能力。
在校内项目中，我参与视觉方案整理与设计执行，负责将需求转化为版式、Logo 或包装等具体交付物。
相比只写“熟练掌握办公软件、性格开朗”，我会补充 1-2 个具体项目：项目目标、我负责的部分、使用的工具、最终产出和收到的反馈。
下一版简历应优先把“我做过什么结果”放在前面，而不是堆通用能力词。`;
  }

  if (/(申请材料|个人陈述|ps|留学|申请)/i.test(content)) {
    return `优化版申请材料片段：
我的申请动机不是泛泛地追求更好的平台，而是来自一个具体问题：${goal || '我希望证明自己的目标方向'}。
过去的经历让我意识到，我需要进一步补足方法、视野和实践环境。
因此，这份申请材料应重点呈现三件事：我遇到过什么真实问题，我采取过什么行动，以及这些行动如何指向未来的学习目标。`;
  }

  return `优化版片段：
这份材料需要先明确它要证明什么：${goal || '一个清晰的目标'}。
建议改成“背景 -> 问题 -> 我的动作 -> 结果 -> 下一步”的结构。
第一段先删掉泛泛评价，改为说明真实场景和目标对象。
第二段写清楚你具体做了什么，以及为什么这样做。
最后补一个可观察结果，让对方能够判断这段材料是否有效。`;
}

function buildManualMaterialAnalysisMaterials(
  attachedContext: AttachedContextInput,
  target: string
): SolutionPack['materials'] {
  const issues = analyzeManualMaterial(attachedContext.content, target);
  const issueChecklist = issues
    .map((issue, index) => `${index + 1}. ${issue.problem}\n   为什么影响效果：${issue.why}`)
    .join('\n');
  const adviceTable = [
    '| 原问题 | 修改方向 | 示例改法 |',
    '| --- | --- | --- |',
    ...issues.map(issue => `| ${issue.problem} | ${issue.direction} | ${issue.example} |`),
  ].join('\n');
  const nextChecklist = [
    '下一步检查清单：',
    '- 开头是否说明了目标对象和真实问题？',
    '- 是否删掉了“熟练、开朗、还可以、感觉”等泛泛评价？',
    '- 是否补充了你的具体动作、方法或判断过程？',
    '- 是否有结果、反馈、数据或交付物作为证据？',
    '- 是否先修改了最影响判断的前 1/3 内容？',
  ].join('\n');

  return [
    {
      id: 'material-1',
      type: 'checklist',
      title: '材料问题清单',
      purpose: '先找出这份材料最影响判断的具体问题。',
      content: issueChecklist,
      usageInstruction: '先逐条核对这些问题，优先处理前两个最影响效果的点。',
    },
    {
      id: 'material-2',
      type: 'table',
      title: '修改建议表',
      purpose: '把问题转成可以直接修改的方向和示例。',
      content: adviceTable,
      usageInstruction: '从第一行开始改，不要同时重写整份材料。',
    },
    {
      id: 'material-3',
      type: 'document_template',
      title: '优化版片段',
      purpose: '提供一段可以直接替换或参考的表达版本。',
      content: createOptimizedMaterialSnippet(attachedContext.content, target),
      usageInstruction: '复制这段结构，替换成你的真实经历、项目或申请信息。',
    },
    {
      id: 'material-4',
      type: 'checklist',
      title: '下一步检查清单',
      purpose: '确认修改后的材料是否已经从泛泛描述变成可判断证据。',
      content: nextChecklist,
      usageInstruction: '修改完一个关键段落后，用这份清单检查是否可以给别人看。',
    },
  ];
}

function createMaterialContent(
  shape: ProblemShape,
  plan: CapabilityPlan,
  profile: FutureProfile,
  action: ActionItem,
  target: string,
  obstacle: string
): string {
  const goal = getGoal(profile, action, target);
  const situation = profile.currentSituation || goal;
  const anxiety = profile.currentAnxiety || obstacle || '不知道下一步怎么推进';
  const contextText = compactText([goal, situation, anxiety, obstacle, action.task, action.reason]);

  if (shape === 'learn_capability' && isExamApplicationCoordination(contextText)) {
    return createExamApplicationMaterialContent(plan, goal, obstacle);
  }

  if (shape === 'learn_capability') {
    if (plan.materialType === 'learning_plan') {
      return `目标：${goal}
今天只做一轮15分钟训练：
1. 3分钟：选一个真实场景，先说一遍，不查资料。
2. 7分钟：围绕同一个场景重说一次，补上不会表达的句子。
3. 3分钟：把卡住的词、句型、发音问题记下来。
4. 2分钟：写下明天只练哪一个卡点。
完成标志：留下1段练习记录和3个具体卡点。`;
    }
    if (plan.materialType === 'exercise_set') {
      return `今日练习题：
1. 用60秒说明：我现在为什么想提升${goal}。
2. 用60秒描述一个最近真实发生的场景。
3. 用60秒复述同一段内容，但必须补上刚才不会表达的地方。
记录方式：
- 不会说的中文句子：
- 查到的英文表达：
- 明天要重复练的句子：`;
    }
    return `| 练习内容 | 卡住的地方 | 错误/不会表达 | 明天怎么改 |
| --- | --- | --- | --- |
| 第1遍口语 |  |  |  |
| 第2遍口语 |  |  |  |
| 最需要复练的一句 |  |  |  |`;
  }

  if (shape === 'build_workflow') {
    if (plan.materialType === 'workflow') {
      return `选择一个重复任务：${goal}
最小流程：
输入：准备一份真实材料或任务样本。
处理：把任务拆成3步，让工具先生成第一版。
检查：人工检查事实、格式、遗漏和不可接受的错误。
输出：形成一份可复用结果。
复盘：记录哪一步节省了时间，哪一步仍然需要人工判断。`;
    }
    if (plan.materialType === 'prompt_template') {
      return `可复制提示词：
你是我的工作流助手。我要把“${goal}”变成固定流程。
当前任务材料：{粘贴材料}
目标输出：{写清楚要得到什么}
限制条件：{时间、格式、质量要求}
请按以下结构输出：
1. 输入材料清单
2. 处理步骤
3. 检查标准
4. 最终输出模板
5. 下次复用时需要保留的规则`;
    }
    return `流程检查清单：
- 输入材料是否明确？
- 处理步骤是否少于5步？
- 哪一步可以交给工具先做？
- 哪一步必须人工判断？
- 输出结果下次是否还能复用？
- 这次流程节省了什么，新增了什么风险？`;
  }

  if (shape === 'create_output') {
    if (plan.materialType === 'document_template' && isPortfolioIntro(goal)) {
      return `作品集介绍页结构：
1. 项目背景：这个项目来自什么真实场景？
2. 解决的问题：它要解决谁的什么问题？
3. 我的方法：我做了哪些判断、调研、草图、设计选择？
4. 过程证据：放1-2张过程图或关键推导，不只放最终图。
5. 最终结果：最终方案是什么，为什么这样呈现？
6. 反思与改进：如果重做，最想优化哪一点？
今晚先写完每一栏的第一句话。`;
    }
    if (plan.materialType === 'document_template') {
      return `初稿结构：
标题：${goal}
1. 这个产出要解决什么问题？
2. 读者或使用者是谁？
3. 核心内容分成哪3部分？
4. 哪个案例、证据或结果能证明它有用？
5. 下一步需要别人给什么反馈？
今晚先完成一个可以给别人看的粗糙版本。`;
    }
    if (plan.materialType === 'checklist') {
      return `交付前检查：
- 是否说清楚这个产出解决什么问题？
- 是否有必要结构，而不是零散内容？
- 是否有案例、证据或过程支撑？
- 是否能让别人看懂你想表达什么？
- 是否标出最需要反馈的一处？
- 是否可以在今天发给一个人看？`;
    }
    return `请别人反馈时直接问：
1. 你是否能在30秒内看懂这个产出想解决什么问题？
2. 哪个部分最不清楚？
3. 缺少案例、证据、结构还是表达？
4. 如果只改一处，应该先改哪里？`;
  }

  if (shape === 'make_decision') {
    if (plan.materialType === 'table') {
      return `| 选项 | 短期成本 | 长期收益 | 最大风险 | 需要验证的信息 |
| --- | --- | --- | --- | --- |
| 选项A |  |  |  |  |
| 选项B |  |  |  |  |
| 暂缓选择 |  |  |  |  |
今天只填事实，不急着得出最终答案。`;
    }
    if (plan.materialType === 'review_form') {
      return `不确定项验证：
1. 现在最影响选择的未知是什么？
2. 哪个未知可以在48小时内验证？
3. 我需要问谁、查什么或试做什么？
4. 如果验证结果为否，我会排除哪个选项？
5. 如果验证结果为是，我会把资源投向哪里？`;
    }
    return `决策标准清单：
- 这个选择是否符合当前时间约束？
- 是否需要先补能力？
- 是否存在不可承受风险？
- 哪个选项能更快产生真实反馈？
- 哪个选项只是因为焦虑才显得重要？`;
  }

  if (shape === 'validate_opportunity') {
    if (plan.materialType === 'review_form') {
      return `机会验证记录：
目标：确认“${goal}”是否有真实需求。
今天至少联系3个可能对象。
记录：
1. 对方是谁？
2. 他是否遇到过这个问题？
3. 他现在怎么解决？
4. 他是否表达兴趣、询价、愿意付费、拒绝或沉默？
5. 他说出的原话是什么？`;
    }
    if (plan.materialType === 'message_template') {
      return `可复制话术：
你好，我正在验证一个小服务：${goal}。
想请你帮我判断一下：你是否遇到过类似问题？现在通常怎么解决？
如果有人能帮你更快做到这个结果，你会愿意继续了解或付费尝试吗？
我不推销，只想听真实反馈，3分钟就好。`;
    }
    return `| 对象 | 是否有痛点 | 当前解决方式 | 兴趣/询价/付费/拒绝/沉默 | 原话 | 下一步 |
| --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |`;
  }

  if (shape === 'research_information') {
    if (plan.materialType === 'table') {
      return `| 需要确认的问题 | 资料来源 | 关键事实 | 可信度 | 对下一步的影响 |
| --- | --- | --- | --- | --- |
| ${goal} 里最缺的事实是什么？ |  |  | 高/中/低 |  |
| 有没有真实案例或样本？ |  |  | 高/中/低 |  |
| 哪条信息会改变你的判断？ |  |  | 高/中/低 |  |`;
    }

    return `研究结论模板：
1. 我原本想确认的问题：${goal}
2. 已经确认的事实：
3. 仍然不确定的地方：
4. 最影响下一步判断的信息：
5. 今天先根据哪条信息采取一个小动作：`;
  }

  if (shape === 'analyze_existing_material') {
    if (plan.capability === 'analyze_file') {
      return `当前版本还不能直接读取附件。
请先粘贴材料中的关键文本，或用下面格式描述这份材料：
1. 材料类型：简历 / 作品集 / 报告 / PPT / 方案 / 其他
2. 目标对象：它要给谁看？
3. 希望达到的结果：${goal}
4. 你最担心的问题：
5. 粘贴最重要的 3-5 段内容：

FutureLens 会先基于你粘贴的文本做结构分析，后续再接入文件解析。`;
    }

    if (plan.materialType === 'checklist') {
      return `材料修改检查清单：
- 这份材料是否在前 30 秒说明了目标？
- 是否能看出你解决了什么具体问题？
- 是否有事实、数据、过程或结果支撑？
- 是否存在只有经历堆砌、没有判断逻辑的部分？
- 哪一段最应该先删、先改或先补证据？
- 修改后是否可以直接发给目标对象查看？`;
    }

    return `修改稿结构：
1. 开头一句话：这份材料想证明什么？
2. 关键经历或内容：只保留最能证明目标的部分。
3. 证据：补充数据、结果、过程或他人反馈。
4. 风险：标出最不确定、最容易被质疑的地方。
5. 下一版动作：今天先改最影响结果的一段。`;
  }

  if (plan.materialType === 'checklist') {
    const presentationLine = isSpeechOrPresentation(goal)
      ? '- 汇报结构是否包含：开场结论、3个重点、证据、结尾行动？'
      : '- 最小版本是否已经能提交、展示或执行？';
    return `最小交付清单：
- 明天/今晚必须完成的结果是什么？
- 现在先做一个60分版本，不追求完美。
${presentationLine}
- 是否预留了检查和预演时间？
- 最后30分钟只补最影响交付的一处。
- 是否能直接进入汇报、提交、面试或执行？`;
  }
  if (plan.materialType === 'document_template') {
    if (isSpeechOrPresentation(goal)) {
      return `最小汇报结构：
总时长：10分钟以内。
1. 30秒：先说结论。
2. 2分钟：说明背景和问题。
3. 5分钟：讲3个重点，每个重点配一个证据。
4. 1分钟：说明风险或未解决问题。
5. 1分钟：给出下一步行动。
预演提示：录一遍音，检查是否超时、是否有一句话说不清。`;
    }
    return `任务准备模板：
任务：${goal}
交付对象：
最小版本必须包含：
1. 背景
2. 关键内容
3. 结论或结果
4. 需要对方确认的问题
剩余时间安排：先完成骨架，再补最关键内容，最后检查格式。`;
  }
  return `| 剩余事项 | 是否影响交付 | 预计用时 | 最后30分钟优先级 |
| --- | --- | --- | --- |
| 核心结构 | 高 |  | 1 |
| 证据/案例 | 中 |  | 2 |
| 格式检查 | 中 |  | 3 |
| 预演/复查 | 高 |  | 1 |`;
}

function getUsageInstruction(shape: ProblemShape, index: number): string {
  if (index === 0) {
    const firstUse: Record<ProblemShape, string> = {
      learn_capability: '今晚先照着这份流程完成一轮练习，不追求完整，只记录卡点。',
      build_workflow: '今晚选择一个真实重复任务，用这份流程跑通一次。',
      create_output: '今晚先用这份模板写出第一版，哪怕很粗糙也要能给别人看。',
      make_decision: '今晚先填表，不急着做最终选择，重点找出最关键的不确定项。',
      validate_opportunity: '今晚先联系真实对象，把对方原话记录下来。',
      solve_specific_task: '今晚先完成最小可交付版本，确保明天能用。',
      research_information: '今晚先补齐最影响判断的一条信息，不追求查全。',
      analyze_existing_material: '今晚先粘贴或整理材料关键文本，再按清单改最影响结果的一段。',
    };
    return firstUse[shape];
  }

  return '完成第一份材料后，用这份材料补充判断和记录反馈。';
}

function buildMaterials(
  shape: ProblemShape,
  plans: CapabilityPlan[],
  profile: FutureProfile,
  action: ActionItem,
  target: string,
  obstacle: string,
  attachedContext?: AttachedContextInput
): SolutionPack['materials'] {
  const normalizedAttachedContext = normalizeAttachedContext(attachedContext);
  if (shape === 'analyze_existing_material' && normalizedAttachedContext) {
    return buildManualMaterialAnalysisMaterials(normalizedAttachedContext, target);
  }

  const contextText = compactText([
    profile.currentSituation,
    profile.currentGoal,
    profile.currentAnxiety,
    target,
    obstacle,
    action.task,
    action.reason,
  ]);
  const isCoordinatedExamApplication = shape === 'learn_capability' && isExamApplicationCoordination(contextText);
  const coordinatedTitles = [
    { title: '雅思备考 + 申请材料并行计划', purpose: '把备考和申请材料同步拆到本周，而不是前后割裂。' },
    { title: '今日同步推进清单', purpose: '同时推进一个雅思诊断、一个申请材料缺口和一个经历整理动作。' },
    { title: '本周执行表', purpose: '记录雅思、申请材料、项目经历和过来人访谈的真实进展。' },
  ];

  return plans.slice(0, 3).map((plan, index) => ({
    id: `material-${index + 1}`,
    type: plan.materialType,
    title: isCoordinatedExamApplication ? coordinatedTitles[index].title : plan.title,
    purpose: isCoordinatedExamApplication ? coordinatedTitles[index].purpose : plan.purpose,
    content: createMaterialContent(shape, plan, profile, action, target, obstacle),
    usageInstruction: getUsageInstruction(shape, index),
  }));
}

function getCompletionCriteria(shape: ProblemShape, action: ActionItem): SolutionPack['completionCriteria'] {
  const criteria: Record<ProblemShape, SolutionPack['completionCriteria']> = {
    learn_capability: {
      minimumDone: '完成一轮指定练习，并记录至少3个卡住的表达、步骤或错误。',
      goodEnoughResult: '留下可复盘内容，能判断明天应该降低难度、重复训练还是增加训练量。',
      evidenceToRecord: '练了多少分钟、哪个环节最卡、出现了哪些错误或不会表达的地方。',
    },
    build_workflow: {
      minimumDone: '选定一个重复任务，拆出输入、处理、检查、输出，并实际跑通一次。',
      goodEnoughResult: '得到一个下次还能复用的流程模板，知道哪一步最耗时、哪一步需要工具辅助。',
      evidenceToRecord: '选择了哪个任务、跑通结果如何、流程是否能复用、哪里仍需要人工判断。',
    },
    create_output: {
      minimumDone: '完成一个初稿，并包含必要结构，能发给别人查看或继续修改。',
      goodEnoughResult: '别人能看懂它要解决什么问题，并能指出最需要补的内容、证据或表达。',
      evidenceToRecord: '初稿完成度、最不确定部分、缺少案例/证据/表达的地方、下一步修改方向。',
    },
    make_decision: {
      minimumDone: '列出主要选项，建立同一套比较标准，并找到最关键的不确定项。',
      goodEnoughResult: '能明确当前更倾向哪个选项，以及下一步需要验证哪条信息。',
      evidenceToRecord: '当前倾向、最大不确定、最影响选择的标准、下一步要验证的信息。',
    },
    validate_opportunity: {
      minimumDone: '联系真实对象并获得真实反馈，至少记录兴趣、询价、拒绝或沉默中的一种信号。',
      goodEnoughResult: '反馈能判断需求是否存在、是否有人愿意继续了解或付费尝试。',
      evidenceToRecord: '联系了几个人、谁有兴趣、是否询价或愿意付费、拒绝原因或沉默情况。',
    },
    solve_specific_task: {
      minimumDone: '完成明天或今晚要交付的最小版本，并完成准备清单。',
      goodEnoughResult: '这个版本已经能直接进入汇报、提交、面试或执行，剩余问题不影响基本交付。',
      evidenceToRecord: '最小版本是否完成、还缺哪一部分、是否预演或检查、最后30分钟优先补什么。',
    },
    research_information: {
      minimumDone: '补齐最影响判断的一条关键信息，并记录来源、事实和可信度。',
      goodEnoughResult: '这条信息足以支持你排除一个错误假设，或明确下一步要验证什么。',
      evidenceToRecord: '查到了什么、来源是什么、可信度如何、它改变了哪个判断。',
    },
    analyze_existing_material: {
      minimumDone: '整理或粘贴材料关键文本，并找出最影响结果的一个修改点。',
      goodEnoughResult: '能明确这份材料最先该改哪里，以及修改后要让谁看或如何验证。',
      evidenceToRecord: '材料类型、最明显问题、先改哪一段、是否需要补证据或重写表达。',
    },
  };

  return criteria[shape];
}

function getFeedbackQuestions(shape: ProblemShape, materials: SolutionPack['materials']): FeedbackQuestion[] {
  const usefulMaterialQuestion: FeedbackQuestion = {
    key: 'useful_material',
    question: '哪份材料最有用？',
    answerType: 'choice',
    options: materials.map(material => material.title),
  };

  const questions: Record<ProblemShape, FeedbackQuestion[]> = {
    learn_capability: [
      { key: 'practice_minutes', question: '今天完成了多少分钟练习？', answerType: 'number' },
      { key: 'hardest_part', question: '哪个环节最卡？', answerType: 'text' },
      { key: 'mistakes', question: '有哪些错误或不会表达的地方？', answerType: 'text' },
      { key: 'next_difficulty', question: '明天需要降低难度还是增加训练？', answerType: 'choice', options: ['降低难度', '保持难度', '增加训练'] },
    ],
    build_workflow: [
      { key: 'workflow_task', question: '你选了哪个重复任务做流程？', answerType: 'text' },
      { key: 'slowest_step', question: '哪一步最耗时？', answerType: 'text' },
      { key: 'reusable', question: '这个流程是否能下次继续复用？', answerType: 'boolean' },
      { key: 'tool_needed', question: '哪个环节需要工具辅助？', answerType: 'text' },
    ],
    create_output: [
      { key: 'draft_done', question: '初稿完成了吗？', answerType: 'boolean' },
      { key: 'uncertain_part', question: '哪个部分最不确定？', answerType: 'text' },
      { key: 'missing_piece', question: '是否缺少案例、证据或表达？', answerType: 'choice', options: ['缺案例', '缺证据', '缺表达', '结构不清', '暂时不缺'] },
      { key: 'next_revision', question: '下一步需要润色、补内容还是找人反馈？', answerType: 'choice', options: ['润色表达', '补充内容', '找人反馈'] },
    ],
    make_decision: [
      { key: 'current_preference', question: '目前更倾向哪个选项？', answerType: 'text' },
      { key: 'biggest_uncertainty', question: '最大的不确定是什么？', answerType: 'text' },
      { key: 'decisive_standard', question: '哪个标准最影响你的选择？', answerType: 'text' },
      { key: 'next_information', question: '下一步需要验证什么信息？', answerType: 'text' },
    ],
    validate_opportunity: [
      { key: 'contact_count', question: '你联系了几个人？', answerType: 'number' },
      { key: 'interest_signal', question: '有人表达兴趣吗？', answerType: 'boolean' },
      { key: 'payment_signal', question: '有人询价或愿意付费吗？', answerType: 'boolean' },
      { key: 'rejection_reason', question: '被拒绝的原因是什么？', answerType: 'text' },
    ],
    solve_specific_task: [
      { key: 'minimum_done', question: '任务最小版本完成了吗？', answerType: 'boolean' },
      { key: 'missing_part', question: '还缺哪一部分会影响明天交付？', answerType: 'text' },
      { key: 'rehearsed', question: '是否已经预演或检查一遍？', answerType: 'boolean' },
      { key: 'last_priority', question: '剩余时间内最应该补哪一步？', answerType: 'text' },
    ],
    research_information: [
      { key: 'found_information', question: '今天查到了哪条最关键的信息？', answerType: 'text' },
      { key: 'source_quality', question: '这个来源是否足够可信？', answerType: 'choice', options: ['可信', '一般', '不可信', '还需要交叉验证'] },
      { key: 'changed_judgment', question: '这条信息改变了你原来的哪个判断？', answerType: 'text' },
      { key: 'remaining_gap', question: '还缺哪一条信息才能继续推进？', answerType: 'text' },
    ],
    analyze_existing_material: [
      { key: 'material_type', question: '你分析的是哪类材料？', answerType: 'text' },
      { key: 'biggest_issue', question: '最明显的问题是什么？', answerType: 'text' },
      { key: 'first_revision', question: '今天最先改哪一段或哪一页？', answerType: 'text' },
      { key: 'needs_evidence', question: '是否需要补充证据、数据或过程？', answerType: 'boolean' },
    ],
  };

  return [...questions[shape], usefulMaterialQuestion];
}

function getSolutionPath(shape: ProblemShape, action: ActionItem, obstacle: string): SolutionPack['solutionPath'] {
  return [
    {
      order: 1,
      step: '确认问题形态',
      purpose: `把当前问题先归入“${getShapeLabel(shape)}”，避免直接给泛建议。`,
      expectedOutput: obstacle,
    },
    {
      order: 2,
      step: '使用执行材料',
      purpose: '把建议变成今天能复制、填写或照着做的材料。',
      expectedOutput: action.task,
    },
    {
      order: 3,
      step: '记录结果并调整',
      purpose: '用真实反馈更新下一步，而不是停留在一次性建议。',
      expectedOutput: '一条具体反馈记录和下一步调整方向。',
    },
  ];
}

function buildProblemUnderstanding(
  shape: ProblemShape,
  profile: FutureProfile,
  action: ActionItem,
  target: string,
  interpretedProblem: string,
  obstacle: string,
  missingInformation: string[],
  attachedContext?: AttachedContextInput
): ProblemUnderstanding {
  const knownContext = [
    profile.currentSituation,
    profile.currentGoal,
    profile.currentAnxiety,
    profile.currentSkills,
    profile.majorOrCareer,
    action.task,
    action.reason,
  ].filter((item): item is string => Boolean(item));

  const attachedContextSummary = summarizeAttachedContext(attachedContext);

  return {
    problemShape: shape,
    userProblem: profile.currentSituation || profile.currentGoal || interpretedProblem,
    targetOutcome: target,
    coreObstacle: obstacle,
    timeConstraint: profile.weeklyTime || undefined,
    knownContext,
    missingInformation,
    requiresFileAnalysis: shape === 'analyze_existing_material',
    requiresUserFeedback: true,
    hasManualMaterialText: Boolean(attachedContextSummary),
    attachedContext: attachedContextSummary,
  };
}

export function createSolutionPackFromRadar(
  radar: OpportunityRadarV4,
  profile: FutureProfile,
  userStateProfile?: Partial<UserStateProfile>,
  options: SolutionPackOptions = {}
): SolutionPack {
  const tonightAction = radar.actions?.find(action => action.time === '今晚') || radar.actions?.[0];
  const action = tonightAction || {
    time: '今晚',
    task: '完成一个最小验证动作',
    reason: '当前需要先产生一个真实结果。',
    successCriteria: '得到一个能改变下一步判断的具体结果。',
  };
  const shape = inferProblemShape(profile, userStateProfile, action);
  const plans = getCapabilityPlans(shape);
  const attachedContext = normalizeAttachedContext(options.attachedContext);
  const target = profile.currentGoal || profile.desiredOutcome || radar.impactOnUser?.opportunity || action.task;
  const interpretedProblem = radar.coreInsight?.['真正的问题是什么']
    || radar.impactOnUser?.currentProblem
    || userStateProfile?.problemStatement
    || '当前问题还需要进一步澄清。';
  const obstacle = radar.impactOnUser?.currentProblem
    || userStateProfile?.problemStatement
    || interpretedProblem;
  const materials = buildMaterials(shape, plans, profile, action, target, obstacle, attachedContext);
  const materialIds = materials.slice(0, 2).map(material => material.id);
  const missingInformation = [
    profile.currentSkills ? '' : '当前能力基础',
    profile.weeklyTime ? '' : '每周可投入时间',
    shape === 'analyze_existing_material' && !attachedContext ? '材料原文或关键片段' : '',
    '执行后的真实结果',
  ].filter(Boolean);
  const problemUnderstanding = buildProblemUnderstanding(
    shape,
    profile,
    action,
    target,
    interpretedProblem,
    obstacle,
    missingInformation,
    attachedContext
  );
  const capabilityRoute = buildCapabilityRoute(problemUnderstanding);
  const executionPlan = buildExecutionPlan(problemUnderstanding, capabilityRoute);

  return {
    problemSummary: {
      userOriginalProblem: profile.currentSituation || profile.currentGoal || '用户还没有明确描述问题。',
      interpretedProblem,
      missingInformation,
    },
    problemShape: shape,
    coreObstacle: {
      summary: obstacle,
      whyItBlocksProgress: userStateProfile?.validationQuestion
        || radar.decisionExplanation?.currentPriority
        || '如果没有真实结果，系统只能继续停留在推测。需要用一次最小执行来减少未知。',
      evidenceFromContext: [
        profile.currentSituation,
        profile.currentAnxiety,
        userStateProfile?.problemStatement,
        action.reason,
      ].filter((item): item is string => Boolean(item)),
    },
    targetOutcome: {
      desiredResult: target,
      successDefinition: action.successCriteria || getCompletionCriteria(shape, action).minimumDone,
      timeConstraint: profile.weeklyTime || undefined,
    },
    solutionPath: getSolutionPath(shape, action, obstacle),
    requiredCapabilities: plans.map(plan => ({
      capability: plan.capability,
      reason: plan.purpose,
      priority: plan.priority,
    })),
    materials,
    todayTask: {
      title: shape === 'analyze_existing_material'
        ? attachedContext
          ? '根据问题清单修改材料前 1/3 内容'
          : '先粘贴你要分析的材料文本'
        : action.task,
      task: shape === 'analyze_existing_material'
        ? attachedContext
          ? '根据材料问题清单，先修改最影响判断的一个关键段落。'
          : '把简历、作品集介绍、汇报稿或申请材料等文字粘贴进分析框。'
        : action.action || action.task,
      estimatedTime: profile.weeklyTime?.includes('0') ? '15-30分钟' : '30-60分钟',
      requiredMaterialIds: materialIds,
      executionSteps: shape === 'analyze_existing_material' && !attachedContext
        ? [
            '复制你要分析的材料正文。',
            '粘贴到“粘贴你要分析的材料”区域。',
            '点击“分析这份材料”。',
          ]
        : [
            `打开材料：${materialIds.join('、')}`,
            materials[0]?.usageInstruction || '先完成最小行动。',
            shape === 'analyze_existing_material'
              ? '先修改最影响判断的一个关键段落。'
              : action.action || action.task,
            `按完成标准记录结果：${getCompletionCriteria(shape, action).minimumDone}`,
          ],
    },
    completionCriteria: getCompletionCriteria(shape, action),
    feedbackQuestions: getFeedbackQuestions(shape, materials),
    nextAdjustmentLogic: [
      {
        condition: '完成标准达成',
        interpretation: '当前路径初步有效，可以进入下一步执行。',
        nextMove: '生成下一轮更具体的执行材料。',
        capabilityToUseNext: 'update_plan_from_feedback',
      },
      {
        condition: '完成标准未达成',
        interpretation: '当前任务可能太大、材料不够直接，或问题判断需要缩小。',
        nextMove: '降低任务难度，重做更小的验证。',
        capabilityToUseNext: 'generate_checklist',
      },
      {
        condition: '出现新发现',
        interpretation: '真实结果提供了新的判断依据。',
        nextMove: '围绕新发现重新调整问题形态或所需能力。',
        capabilityToUseNext: 'update_plan_from_feedback',
      },
    ],
    problemUnderstanding,
    capabilityRoute,
    executionPlan,
  };
}

export function ensureSolutionPack(
  radar: OpportunityRadarV4,
  profile: FutureProfile,
  userStateProfile?: Partial<UserStateProfile>,
  options: SolutionPackOptions = {}
): OpportunityRadarV4 {
  const existing = radar.solutionPack;
  if (
    !options.attachedContext
    &&
    existing?.problemSummary
    && existing.problemShape
    && existing.coreObstacle
    && existing.targetOutcome
    && Array.isArray(existing.solutionPath)
    && Array.isArray(existing.requiredCapabilities)
    && Array.isArray(existing.materials)
    && existing.materials.length > 0
    && existing.todayTask
    && existing.todayTask.requiredMaterialIds?.length
    && existing.completionCriteria
    && Array.isArray(existing.feedbackQuestions)
    && Array.isArray(existing.nextAdjustmentLogic)
    && existing.problemUnderstanding
    && Array.isArray(existing.capabilityRoute)
    && existing.executionPlan
  ) {
    return radar;
  }

  return {
    ...radar,
    solutionPack: createSolutionPackFromRadar(radar, profile, userStateProfile, options),
  };
}
