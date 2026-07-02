import type { SolutionResult } from '@/types/radar';

export type ActionStatus = 'pending' | 'done' | 'skipped';

export type SolutionActionItem = {
  id: string;
  title: string;
  why: string;
  output: string;
  doneCriteria: string;
  status: ActionStatus;
};

export type ActionProgressState = {
  items: SolutionActionItem[];
  nextSuggestion: string;
  updatedAt: string;
};

function compactResultText(result: SolutionResult): string {
  return [
    result.usableOutput.title,
    result.problemCore.summary,
    ...result.usableOutput.sections.map(section => `${section.heading}\n${section.content}`),
    ...result.copyableTemplates.map(template => `${template.title}\n${template.content}`),
  ].join('\n');
}

function inferContract(result: SolutionResult, contractId?: string): string {
  if (contractId) return contractId;
  const text = compactResultText(result);
  if (/(业务工作流|老板版说明|执行人员 SOP|开发\/外包需求文档|后厨|库存|质检|会员运营|排课|负责人看板)/.test(text)) return 'business_solution_workflow';
  if (/(调研|汇报|PPT|课堂|老师|资料清单)/.test(text)) return 'research_report';
  if (/(简历|项目经历|STAR|投递|岗位)/.test(text)) return 'experience_rewrite';
  if (/(数据|字段|分析|汇报文案|销售|营业额|指标)/.test(text)) return 'analysis_table';
  if (/(验证|访谈|MVP|目标用户|两周计划|假设)/.test(text)) return 'validation_plan';
  return 'generic_document';
}

function pickFirstCopyableTitle(result: SolutionResult): string {
  return result.copyableTemplates[0]?.title || result.usableOutput.title || '当前成果';
}

function makeItem(
  id: string,
  title: string,
  why: string,
  output: string,
  doneCriteria: string
): SolutionActionItem {
  return {
    id,
    title,
    why,
    output,
    doneCriteria,
    status: 'pending',
  };
}

export function extractActionItems(result: SolutionResult, contractId?: string): SolutionActionItem[] {
  const resolvedContract = inferContract(result, contractId);
  const firstCopyable = pickFirstCopyableTitle(result);

  if (resolvedContract === 'research_report') {
    return [
      makeItem('research-outline', '确认汇报结构', '先确定页序，避免继续堆材料。', '一份 4-6 页汇报大纲', '每一页都有标题、核心内容和需要放的材料。'),
      makeItem('research-materials', '整理已有资料', '把照片、资料和观察记录放到对应页面。', '资料整理清单', '每条资料都标明来源、用途和对应页码。'),
      makeItem('research-first-draft', '写出第一页和结论页', '先完成开头和结尾，整份 PPT 才有主线。', '第一页介绍 + 最后一页结论', '开头能说明主题，结论能说明本次调研发现。'),
      makeItem('research-check', '按提交标准检查', '提交前先看是否像完整作业。', '完成检查表', '标题、资料来源、分析观点、结论四项都已补齐。'),
    ];
  }

  if (resolvedContract === 'experience_rewrite') {
    return [
      makeItem('experience-target', '确认目标岗位关键词', '项目经历要服务投递目标。', '岗位关键词列表', '列出 3-5 个岗位要求或能力关键词。'),
      makeItem('experience-rewrite', '改写一个项目经历', '先把一段经历改成可投递版本。', firstCopyable, '包含任务、方法、结果和个人贡献。'),
      makeItem('experience-evidence', '补充量化结果', '结果感来自证据，不来自形容词。', '量化结果补充表', '至少补 1 个数字、范围、对比或反馈。'),
      makeItem('experience-final-check', '做投递前检查', '避免流水账和空泛表达。', '投递前检查清单', '岗位相关性、结果、关键词、长度都检查完。'),
    ];
  }

  if (resolvedContract === 'analysis_table' || resolvedContract === 'metric_analysis') {
    return [
      makeItem('analysis-fields', '确认分析字段', '字段不清楚，结论就会空。', '字段表', '每个字段都有用途、示例和判断规则。'),
      makeItem('analysis-conclusion', '写出第一版结论', '先把数据变化翻译成可理解判断。', '结论摘要', '包含最大变化、可能原因和影响范围。'),
      makeItem('analysis-action', '列出下一步动作', '分析必须能导向调整。', '行动清单', '至少有 3 个动作，每个动作有检查指标。'),
      makeItem('analysis-report', '整理成汇报文案', '让接收方快速判断是否需要决策。', '汇报文案', '包含结论、依据、风险和建议。'),
    ];
  }

  if (resolvedContract === 'validation_plan') {
    return [
      makeItem('validation-hypothesis', '写清核心假设', '先验证最关键的不确定性。', '核心假设表', '写清用户、问题、价值和风险。'),
      makeItem('validation-interview', '准备访谈提纲', '访谈要问真实行为，不问空泛态度。', '访谈问题清单', '至少 5 个问题，覆盖现状、痛点、替代方案和付费意愿。'),
      makeItem('validation-mvp', '圈定 MVP 范围', '防止第一版做太大。', 'MVP 功能清单', '功能分成必须做、可延后、不做三类。'),
      makeItem('validation-plan', '安排两周验证', '把验证变成可执行节奏。', '两周执行计划', '每天或每两天都有明确产出。'),
    ];
  }

  if (resolvedContract === 'business_solution_workflow') {
    return [
      makeItem('business-priority', '确认最优先改造的一条流程', '业务系统化不能一次覆盖全部，先选最乱且最影响经营的一条链路。', '一条优先业务流程', '写清流程入口、结束点、负责人和老板要看的结果。'),
      makeItem('business-fields', '固定记录字段', '字段不统一，AI 和系统都无法稳定工作。', '业务字段表', '每个字段都有用途、填写人、更新时间和检查标准。'),
      makeItem('business-pilot', '跑一周最小试点', '先让真实员工按流程跑起来，再判断是否需要工具或外包。', '一周试点记录', '至少连续 5 天留下完整记录和异常说明。'),
      makeItem('business-sop', '写给执行人员的 SOP', '员工必须知道每一步怎么做、做到什么算完成。', '执行人员 SOP', 'SOP 包含步骤、输入物、输出物、异常处理和负责人。'),
      makeItem('business-brief', '整理开发/外包需求文档', '如果要找工具或外包，需要先把流程和字段说清楚。', '开发/外包需求文档结构', '包含业务目标、模块、字段、角色、暂不做事项和验收标准。'),
    ];
  }

  return [
    makeItem('generic-target', '确认这次要交付什么', '先把模糊问题变成一个可见成果。', '一句话交付目标', '写出“我要产出一份/一个什么”。'),
    makeItem('generic-copy', '复制当前最有用模板', '不要从空白开始，先拿现有结果改。', firstCopyable, '已经复制并填入至少 3 处真实信息。'),
    makeItem('generic-check', '按完成标准检查', '避免结果看起来完整但不能用。', '检查清单', '确认对象、内容、证据、下一步都明确。'),
    makeItem('generic-next', '记录下一处卡点', '下一轮调整要基于真实阻碍。', '下一步问题', '写下最需要 FutureLens 继续帮你改的一点。'),
  ];
}

export function buildActionProgress(result: SolutionResult, contractId?: string, now = new Date().toISOString()): ActionProgressState {
  return {
    items: extractActionItems(result, contractId).slice(0, 5),
    nextSuggestion: '先完成第一个未完成任务，再根据结果继续调整。',
    updatedAt: now,
  };
}

export function updateActionProgress(
  progress: ActionProgressState,
  actionId: string,
  status: ActionStatus,
  now = new Date().toISOString()
): ActionProgressState {
  const items = progress.items.map(item => (
    item.id === actionId ? { ...item, status } : item
  ));
  return {
    items,
    nextSuggestion: buildNextSuggestion(items),
    updatedAt: now,
  };
}

export function buildNextSuggestion(items: SolutionActionItem[]): string {
  const doneCount = items.filter(item => item.status === 'done').length;
  const skippedCount = items.filter(item => item.status === 'skipped').length;
  const nextPending = items.find(item => item.status === 'pending');

  if (doneCount === items.length && items.length > 0) {
    return '这轮执行清单已经完成。建议把结果复制回 FutureLens，让它生成下一版更准确的成果。';
  }

  if (skippedCount > 0 && nextPending) {
    return `你跳过了一部分任务，可以先做“${nextPending.title}”，再判断是否需要调整原方案。`;
  }

  if (nextPending) {
    return `下一步建议先做“${nextPending.title}”，完成标准是：${nextPending.doneCriteria}`;
  }

  return '先选择一个最容易推进的任务开始。';
}
