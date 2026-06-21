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
    const executor = getExecutorById(capability.defaultExecutorId);
    const futureExecutors = capability.availableExecutorIds
      .filter(id => id !== capability.defaultExecutorId)
      .map(id => getExecutorById(id))
      .filter(item => item.currentStatus === 'planned');
    const unavailable = capability.currentStatus === 'unavailable' || executor.currentStatus === 'unavailable';

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
      capabilityStatus: capability.currentStatus,
      executorStatus: executor.currentStatus,
      isSimulated: executor.isSimulated || capability.currentStatus === 'simulated',
      requiresUserInput: capability.requiresUserInput,
      requiresAuthorization: capability.requiresAuthorization,
      requiresFileUpload: capability.requiresFileUpload,
      canRunAutomatically: capability.canRunAutomatically && !unavailable,
      fallbackExecutorId: unavailable ? 'manual_context_only' : undefined,
      fallbackInstruction: unavailable
        ? '当前版本还不能直接读取文件，请先把材料中的关键文本粘贴到问题描述或反馈里。'
        : undefined,
      futureExecutorIds: futureExecutors.map(item => item.id),
      futureExecutorNames: futureExecutors.map(item => item.name),
    };
  });
}
