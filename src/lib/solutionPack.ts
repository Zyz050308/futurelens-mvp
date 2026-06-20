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

type CapabilityPlan = {
  capability: CapabilityName;
  materialType: SolutionMaterialType;
  title: string;
  purpose: string;
  priority: 'high' | 'medium' | 'low';
};

type FeedbackQuestion = SolutionPack['feedbackQuestions'][number];

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

export function inferProblemShape(
  profile: FutureProfile,
  userStateProfile?: Partial<UserStateProfile>,
  action?: ActionItem
): ProblemShape {
  const text = getProblemText(profile, userStateProfile, action);

  if (userStateProfile?.problemType === 'monetization_validation') {
    return 'validate_opportunity';
  }

  if (userStateProfile?.problemType === 'exam_deadline') {
    return 'learn_capability';
  }

  if (hasUrgentConcreteTask(text)) {
    return 'solve_specific_task';
  }

  if (userStateProfile?.problemType === 'content_publishing') {
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

  if (/(选择|取舍|比较|要不要|该不该|方向|路径|哪个|考研|找工作)/i.test(text)) {
    return 'make_decision';
  }

  if (/(验证|客户|用户|付费|询价|副业|创业|接单|需求|机会|mvp|愿意买|愿意付)/i.test(text)) {
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
      { capability: 'run_validation_design', materialType: 'review_form', title: '机会验证表', purpose: '确认真实对象是否有需求和付费信号。', priority: 'high' },
      { capability: 'generate_message_template', materialType: 'message_template', title: '验证沟通话术', purpose: '降低接触真实对象的行动门槛。', priority: 'high' },
      { capability: 'generate_table', materialType: 'table', title: '反馈记录表', purpose: '记录兴趣、询价、拒绝和沉默。', priority: 'medium' },
    ],
    solve_specific_task: [
      { capability: 'generate_checklist', materialType: 'checklist', title: '最小交付清单', purpose: '先完成明天或今晚必须能交付的版本。', priority: 'high' },
      { capability: 'generate_document', materialType: 'document_template', title: '任务准备模板', purpose: '把汇报、面试或提交内容组织成可执行结构。', priority: 'high' },
      { capability: 'track_task', materialType: 'table', title: '最后检查表', purpose: '确认剩余时间内最应该补哪一步。', priority: 'medium' },
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
  obstacle: string
): SolutionPack['materials'] {
  return plans.slice(0, 3).map((plan, index) => ({
    id: `material-${index + 1}`,
    type: plan.materialType,
    title: plan.title,
    purpose: plan.purpose,
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

export function createSolutionPackFromRadar(
  radar: OpportunityRadarV4,
  profile: FutureProfile,
  userStateProfile?: Partial<UserStateProfile>
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
  const target = profile.currentGoal || profile.desiredOutcome || radar.impactOnUser?.opportunity || action.task;
  const interpretedProblem = radar.coreInsight?.['真正的问题是什么']
    || radar.impactOnUser?.currentProblem
    || userStateProfile?.problemStatement
    || '当前问题还需要进一步澄清。';
  const obstacle = radar.impactOnUser?.currentProblem
    || userStateProfile?.problemStatement
    || interpretedProblem;
  const materials = buildMaterials(shape, plans, profile, action, target, obstacle);
  const materialIds = materials.slice(0, 2).map(material => material.id);

  return {
    problemSummary: {
      userOriginalProblem: profile.currentSituation || profile.currentGoal || '用户还没有明确描述问题。',
      interpretedProblem,
      missingInformation: [
        profile.currentSkills ? '' : '当前能力基础',
        profile.weeklyTime ? '' : '每周可投入时间',
        '执行后的真实结果',
      ].filter(Boolean),
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
      title: action.task,
      task: action.action || action.task,
      estimatedTime: profile.weeklyTime?.includes('0') ? '15-30分钟' : '30-60分钟',
      requiredMaterialIds: materialIds,
      executionSteps: [
        `打开材料：${materialIds.join('、')}`,
        materials[0]?.usageInstruction || '先完成最小行动。',
        action.action || action.task,
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
  };
}

export function ensureSolutionPack(
  radar: OpportunityRadarV4,
  profile: FutureProfile,
  userStateProfile?: Partial<UserStateProfile>
): OpportunityRadarV4 {
  const existing = radar.solutionPack;
  if (
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
  ) {
    return radar;
  }

  return {
    ...radar,
    solutionPack: createSolutionPackFromRadar(radar, profile, userStateProfile),
  };
}
