import type {
  CapabilityRouteItem,
  ExecutionPlan,
  ExecutionStep,
  ProblemUnderstanding,
} from '@/types/capability';

function getStepStatus(item: CapabilityRouteItem): ExecutionStep['status'] {
  if (item.capabilityStatus === 'unavailable' || item.executorStatus === 'unavailable') {
    return 'blocked';
  }

  if (item.canRunAutomatically && item.isSimulated) {
    return 'completed';
  }

  return 'pending';
}

function getResultSummary(item: CapabilityRouteItem): string {
  if (item.capabilityStatus === 'unavailable' || item.executorStatus === 'unavailable') {
    return item.fallbackInstruction || '当前能力暂不可用，需要用户先手动补充信息。';
  }

  if (item.isSimulated) {
    return `当前先由${item.executionMethod}生成可用材料。`;
  }

  if (item.requiresUserInput) {
    return '需要用户执行或补充反馈后继续推进。';
  }

  return '当前页面已支持这一步的展示和推进。';
}

export function buildExecutionPlan(
  problemUnderstanding: ProblemUnderstanding,
  capabilityRoute: CapabilityRouteItem[]
): ExecutionPlan {
  const steps = capabilityRoute.map<ExecutionStep>((item, index) => {
    const status = getStepStatus(item);

    return {
      stepId: `execution-step-${index + 1}`,
      title: item.reason,
      capabilityId: item.capabilityId,
      capabilityName: item.capabilityName,
      executorId: item.executorId,
      executorName: item.executorName,
      status,
      userActionRequired: item.requiresUserInput || status === 'blocked',
      requiresAuthorization: item.requiresAuthorization,
      requiresUpload: item.requiresFileUpload,
      dependsOn: index === 0 ? [] : [`execution-step-${index}`],
      nextStepCondition: status === 'blocked'
        ? '用户手动补充文本后继续'
        : index === capabilityRoute.length - 1
          ? '记录反馈并更新下一步'
          : '当前材料可用后进入下一步',
      resultSummary: getResultSummary(item),
      fallbackInstruction: item.fallbackInstruction,
    };
  });

  const currentStep = steps.find(step => step.status === 'blocked')
    || steps.find(step => step.status === 'pending')
    || steps[0];

  return {
    planId: `execution-plan-${problemUnderstanding.problemShape}`,
    title: '解决路径执行计划',
    problemShape: problemUnderstanding.problemShape,
    steps,
    currentStepId: currentStep?.stepId,
    blockedReason: steps.find(step => step.status === 'blocked')?.resultSummary,
    nextUserStep: currentStep?.fallbackInstruction || currentStep?.resultSummary || '先完成今日任务并记录反馈。',
  };
}
