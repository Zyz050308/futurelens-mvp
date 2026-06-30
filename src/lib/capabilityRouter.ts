import type {
  CapabilityId,
  CapabilityRouteItem,
  ProblemShapeId,
  ProblemUnderstanding,
} from '@/types/capability';
import { getCapabilityById } from './capabilityRegistry';
import { getExecutorById } from './toolRegistry';

const routeMap: Record<ProblemShapeId, CapabilityId[]> = {
  learn_capability: [
    'generate_learning_plan',
    'generate_exercises',
    'generate_explanation',
    'generate_table',
    'track_task',
    'update_plan_from_feedback',
  ],
  build_workflow: [
    'generate_workflow',
    'generate_prompt_template',
    'generate_checklist',
    'generate_table',
    'track_task',
  ],
  create_output: [
    'generate_document',
    'generate_checklist',
    'generate_review_form',
    'generate_prompt_template',
  ],
  make_decision: [
    'compare_options',
    'search_information',
    'generate_table',
    'generate_review_form',
    'update_plan_from_feedback',
  ],
  validate_opportunity: [
    'generate_message_template',
    'generate_table',
    'generate_review_form',
    'track_task',
  ],
  solve_specific_task: [
    'generate_checklist',
    'generate_document',
    'track_task',
    'update_plan_from_feedback',
  ],
  research_information: [
    'search_information',
    'generate_table',
    'generate_document',
  ],
  analyze_existing_material: [
    'analyze_file',
    'generate_checklist',
    'generate_document',
  ],
};

const routeReasons: Record<ProblemShapeId, string[]> = {
  learn_capability: ['先形成训练路径', '生成今日练习', '解释卡点原因', '记录练习结果', '追踪执行', '根据反馈调整难度'],
  build_workflow: ['拆出可复用流程', '生成稳定输入方式', '检查流程是否能复用', '记录流程表现', '追踪一次真实运行'],
  create_output: ['先搭出产出结构', '检查是否可交付', '收集具体反馈', '生成优化提示'],
  make_decision: ['把选项放到同一标准比较', '补齐关键事实', '记录比较结果', '设计验证问题', '根据反馈调整选择'],
  validate_opportunity: ['先准备真实沟通', '记录反馈信号', '判断反馈质量', '追踪验证动作'],
  solve_specific_task: ['先保住最小交付', '生成可用结构', '追踪完成状态', '根据剩余问题调整'],
  research_information: ['补齐外部信息', '整理检索结果', '形成可阅读结论'],
  analyze_existing_material: ['先识别材料问题', '生成修改清单', '形成可执行修改稿'],
};

export function getCapabilitiesForProblemShape(shape: ProblemShapeId): CapabilityId[] {
  return routeMap[shape] || routeMap.solve_specific_task;
}

export function buildCapabilityRoute(problemUnderstanding: ProblemUnderstanding): CapabilityRouteItem[] {
  const capabilities = getCapabilitiesForProblemShape(problemUnderstanding.problemShape);
  const reasons = routeReasons[problemUnderstanding.problemShape] || [];

  return capabilities.map((capabilityId, index) => {
    const capability = getCapabilityById(capabilityId);
    const useManualTextFallback =
      capabilityId === 'analyze_file'
      && problemUnderstanding.problemShape === 'analyze_existing_material'
      && problemUnderstanding.hasManualMaterialText;
    const executor = getExecutorById(
      useManualTextFallback ? 'manual_text_input_fallback' : capability.defaultExecutorId
    );
    const futureExecutors = capability.availableExecutorIds
      .filter(id => id !== executor.id)
      .map(id => getExecutorById(id))
      .filter(item => item.currentStatus === 'planned');
    const capabilityStatus = useManualTextFallback ? 'simulated' : capability.currentStatus;
    const unavailable = capabilityStatus === 'unavailable' || executor.currentStatus === 'unavailable';

    return {
      routeId: `capability-route-${index + 1}`,
      capabilityId,
      capabilityName: capability.name,
      capabilityDescription: capability.description,
      reason: reasons[index] || capability.description,
      priority: index < 2 ? 'high' : index < 4 ? 'medium' : 'low',
      executorId: executor.id,
      executorName: executor.name,
      executionMethod: executor.userVisibleMethod,
      capabilityStatus,
      executorStatus: executor.currentStatus,
      isSimulated: executor.isSimulated || capabilityStatus === 'simulated',
      requiresUserInput: capability.requiresUserInput,
      requiresAuthorization: capability.requiresAuthorization,
      requiresFileUpload: useManualTextFallback ? false : capability.requiresFileUpload,
      canRunAutomatically: (useManualTextFallback || capability.canRunAutomatically) && !unavailable,
      fallbackExecutorId: unavailable ? 'manual_context_only' : undefined,
      fallbackInstruction: unavailable
        ? '当前版本还不能直接读取文件，请先把材料中的关键文本粘贴到问题描述或反馈里。'
        : undefined,
      futureExecutorIds: futureExecutors.map(item => item.id),
      futureExecutorNames: futureExecutors.map(item => item.name),
    };
  });
}

export type SolutionCapabilityId =
  | 'demand_understanding'
  | 'task_decomposition'
  | 'table_structure'
  | 'data_organization'
  | 'formula_generation'
  | 'report_copywriting'
  | 'document_analysis'
  | 'material_rewrite'
  | 'workflow_design'
  | 'tool_selection'
  | 'automation_planning'
  | 'script_generation'
  | 'storyboard_generation'
  | 'visual_prompting'
  | 'video_generation'
  | 'study_planning'
  | 'practice_generation'
  | 'general_reasoning';

export type SolutionExecutorId =
  | 'LLM_REASONING'
  | 'DOCUMENT_ANALYSIS'
  | 'TABLE_GENERATION'
  | 'FORMULA_GENERATION'
  | 'COPYWRITING'
  | 'WORKFLOW_PLANNING'
  | 'VISUAL_PROMPTING'
  | 'VIDEO_GENERATION_MODEL'
  | 'SEARCH_RESEARCH'
  | 'FILE_EXPORT'
  | 'CODE_EXECUTION'
  | 'GENERAL_PROBLEM_SOLVING';

export type CapabilityPlan = {
  demandSummary: string;
  taskDecomposition: string[];
  requiredCapabilities: Array<{
    id: SolutionCapabilityId;
    label: string;
    reason: string;
  }>;
  recommendedExecutors: Array<{
    id: SolutionExecutorId;
    label: string;
    status: 'available' | 'planned';
  }>;
  executionSteps: string[];
  expectedDeliverables: string[];
};

const capabilityLabels: Record<SolutionCapabilityId, string> = {
  demand_understanding: '需求理解',
  task_decomposition: '任务拆解',
  table_structure: '表格结构生成',
  data_organization: '数据整理',
  formula_generation: 'Excel 公式生成',
  report_copywriting: '汇报文案生成',
  document_analysis: '文档分析',
  material_rewrite: '材料改写',
  workflow_design: '工作流设计',
  tool_selection: '工具选择',
  automation_planning: '自动化规划',
  script_generation: '脚本生成',
  storyboard_generation: '分镜生成',
  visual_prompting: '画面提示词生成',
  video_generation: '视频生成准备',
  study_planning: '学习路径规划',
  practice_generation: '练习生成',
  general_reasoning: '通用推理',
};

const executorLabels: Record<SolutionExecutorId, string> = {
  LLM_REASONING: '语言模型',
  DOCUMENT_ANALYSIS: '文档分析',
  TABLE_GENERATION: '表格生成',
  FORMULA_GENERATION: '公式生成',
  COPYWRITING: '文案生成',
  WORKFLOW_PLANNING: '工作流规划',
  VISUAL_PROMPTING: '画面提示词',
  VIDEO_GENERATION_MODEL: '视频生成模型',
  SEARCH_RESEARCH: '资料检索',
  FILE_EXPORT: '文件导出',
  CODE_EXECUTION: '代码执行',
  GENERAL_PROBLEM_SOLVING: '通用问题解决',
};

function createCapabilities(ids: SolutionCapabilityId[], focus: string): CapabilityPlan['requiredCapabilities'] {
  return ids.map(id => ({
    id,
    label: capabilityLabels[id],
    reason: `${capabilityLabels[id]}用于${focus}`,
  }));
}

function createExecutors(ids: SolutionExecutorId[]): CapabilityPlan['recommendedExecutors'] {
  return ids.map(id => ({
    id,
    label: executorLabels[id],
    status: id === 'VIDEO_GENERATION_MODEL' || id === 'FILE_EXPORT' ? 'planned' : 'available',
  }));
}

function isExistingMaterialRequest(text: string): boolean {
  const explicit = /(这是我的|下面是我的|以下是我的|我有一份|已有一份|有一份).*(简历|作品集|文案|材料|说明|报告|计划|草稿)|帮我(分析|修改|改|看看).*(这段|这份|材料|草稿)/i.test(text);
  const longMaterial = text.length > 180 && /(简历|作品集|项目经历|自我介绍|求职|申请|文案|材料)/i.test(text);
  return explicit || longMaterial;
}

export function routeCapabilities(problemText: string): CapabilityPlan {
  const text = problemText.trim();

  if (isExistingMaterialRequest(text)) {
    return {
      demandSummary: '用户已有一份材料，需要 FutureLens 先分析问题，再给出修改方向和可替换表达。',
      taskDecomposition: ['识别材料目标', '找出表达和结构问题', '生成修改建议', '给出优化版片段'],
      requiredCapabilities: createCapabilities(
        ['document_analysis', 'material_rewrite', 'report_copywriting', 'general_reasoning'],
        '分析已有材料、改写表达并形成可直接替换的片段'
      ),
      recommendedExecutors: createExecutors(['DOCUMENT_ANALYSIS', 'LLM_REASONING', 'COPYWRITING']),
      executionSteps: ['先判断材料给谁看', '定位材料最影响判断的地方', '输出问题清单和修改建议', '生成一段可替换的优化片段'],
      expectedDeliverables: ['材料问题清单', '修改建议', '优化版片段'],
    };
  }

  if (/(财务|经营报表|月度经营|报表|excel|表格)/i.test(text)) {
    return {
      demandSummary: '用户想完成一份可整理经营数据、可汇报的财务报表。',
      taskDecomposition: ['明确报表用途', '生成报表结构', '设计字段和公式', '输出汇报文案'],
      requiredCapabilities: createCapabilities(
        ['table_structure', 'data_organization', 'formula_generation', 'report_copywriting'],
        '生成可用的报表结构、字段、公式和汇报内容'
      ),
      recommendedExecutors: createExecutors(['LLM_REASONING', 'TABLE_GENERATION', 'FORMULA_GENERATION', 'COPYWRITING']),
      executionSteps: ['先理解报表用途', '生成报表结构', '设计字段和公式', '输出可复制汇报文案', '等待补充数据后生成更准确版本'],
      expectedDeliverables: ['报表结构', '字段表', 'Excel 公式', '老板汇报文案'],
    };
  }

  if (/(短视频|视频方案|视频脚本|分镜|拍摄|剪辑|口播)/i.test(text)) {
    return {
      demandSummary: '用户需要完成短视频选题、脚本、分镜和生成准备。',
      taskDecomposition: ['确定视频目标', '生成脚本结构', '拆分分镜', '生成画面提示词', '标记后续视频生成能力'],
      requiredCapabilities: createCapabilities(
        ['script_generation', 'storyboard_generation', 'visual_prompting', 'video_generation', 'workflow_design'],
        '把短视频想法变成脚本、分镜、素材包和可复用的短视频生产工作流'
      ),
      recommendedExecutors: createExecutors(['LLM_REASONING', 'VISUAL_PROMPTING', 'VIDEO_GENERATION_MODEL']),
      executionSteps: ['先确定视频主题和受众', '生成 30-60 秒脚本', '拆成 4-6 个镜头', '输出每个镜头的画面提示词', '整理成后续可继续生成画面的素材包'],
      expectedDeliverables: ['视频选题', '脚本', '分镜', '画面提示词', '视频生成建议'],
    };
  }

  if (/(作品集|设计|视觉|portfolio)/i.test(text)) {
    return {
      demandSummary: '用户需要改造作品集，并用 AI 提高项目说明、结构和视觉效率。',
      taskDecomposition: ['判断作品集用途', '分析项目结构', '改写项目说明', '设计 AI 提效流程'],
      requiredCapabilities: createCapabilities(
        ['document_analysis', 'material_rewrite', 'workflow_design', 'visual_prompting'],
        '把作品集从展示材料改造成面向评审或招聘的可判断材料'
      ),
      recommendedExecutors: createExecutors(['LLM_REASONING', 'DOCUMENT_ANALYSIS', 'COPYWRITING', 'VISUAL_PROMPTING']),
      executionSteps: ['先理解作品集目标', '拆出项目说明和结构问题', '生成项目说明模板', '输出评审问题清单', '给出 AI 提效流程'],
      expectedDeliverables: ['作品集修改工作流', '项目说明模板', '评审问题清单', 'AI 提效流程'],
    };
  }

  if (/(流程|工作流|每天先做什么|优先级|效率|sop|自动化|项目管理)/i.test(text)) {
    return {
      demandSummary: '用户需要梳理工作流、判断优先级，并形成每天能执行的固定流程。',
      taskDecomposition: ['列出重复任务', '判断优先级', '设计每日流程', '标记可自动化节点'],
      requiredCapabilities: createCapabilities(
        ['task_decomposition', 'workflow_design', 'tool_selection', 'automation_planning'],
        '把混乱任务整理成可复用流程和优先级清单'
      ),
      recommendedExecutors: createExecutors(['LLM_REASONING', 'WORKFLOW_PLANNING', 'GENERAL_PROBLEM_SOLVING']),
      executionSteps: ['先列出所有任务入口', '按紧急度和影响排序', '生成每日执行流程', '找出可以自动化或模板化的节点'],
      expectedDeliverables: ['工作流结构', '优先级清单', '每日执行流程', '可自动化节点建议'],
    };
  }

  if (/(学习|备考|雅思|托福|技能|转行|路线|计划|复习|练习|课程)/i.test(text)) {
    return {
      demandSummary: '用户需要把学习目标拆成路径、练习和复盘方式。',
      taskDecomposition: ['判断学习目标', '拆分阶段路径', '生成今日练习', '设计复盘记录'],
      requiredCapabilities: createCapabilities(
        ['study_planning', 'practice_generation', 'task_decomposition', 'general_reasoning'],
        '把学习目标变成今天能执行的训练单元'
      ),
      recommendedExecutors: createExecutors(['LLM_REASONING', 'GENERAL_PROBLEM_SOLVING']),
      executionSteps: ['先确定目标结果', '拆成阶段训练', '生成最小练习', '记录卡点并调整难度'],
      expectedDeliverables: ['学习路径', '今日练习', '复盘表', '下一步训练建议'],
    };
  }

  return {
    demandSummary: text || '用户需要把一个模糊问题拆成可执行任务并得到第一版成果。',
    taskDecomposition: ['理解真实需求', '拆解子任务', '选择可用能力', '生成第一版成果'],
    requiredCapabilities: createCapabilities(
      ['demand_understanding', 'task_decomposition', 'general_reasoning', 'workflow_design'],
      '把模糊问题变成可执行版本'
    ),
    recommendedExecutors: createExecutors(['LLM_REASONING', 'GENERAL_PROBLEM_SOLVING']),
    executionSteps: ['先理解需求', '拆出最小任务', '生成第一版成果', '等待补充后继续调整'],
    expectedDeliverables: ['需求总结', '任务拆解', '第一版成果', '补充问题'],
  };
}
