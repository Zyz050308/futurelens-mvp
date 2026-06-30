import { renderDeliverables } from './deliverableRenderer';
import { runCopywritingExecutor } from './executors/copywritingExecutor';
import { runLlmReasoningExecutor } from './executors/llmReasoningExecutor';
import { composeExecutorResults } from './executors/resultComposer';
import { runTableGenerationExecutor } from './executors/tableGenerationExecutor';
import type { OutputContract } from './outputContract';
import type {
  ExecutorContext,
  ExecutorId,
  ExecutorResult,
  ExecutorRunResult,
  ExecutorRuntimeInput,
  ExecutorTask,
} from '@/types/executor';

type Deliverable = OutputContract['deliverables'][number];

function taskFromDeliverable(input: ExecutorRuntimeInput, deliverable: Deliverable): ExecutorTask {
  return {
    deliverableId: deliverable.id,
    deliverableType: deliverable.type,
    title: deliverable.title,
    purpose: deliverable.purpose,
    centerOutput: input.frame.centerOutput.name,
    outputType: input.frame.centerOutput.outputType,
    transformationNeeded: input.frame.transformationNeeded,
    missingInfo: input.frame.missingInfo,
    rawProblem: input.frame.rawProblem,
  };
}

function hasTransformation(input: ExecutorRuntimeInput, keywords: string[]): boolean {
  const source = [
    input.frame.rawProblem,
    input.frame.centerOutput.outputType,
    input.frame.transformationNeeded.join(' '),
  ].join(' ');

  return keywords.some(keyword => source.includes(keyword));
}

export function selectExecutorsForDeliverable(
  input: ExecutorRuntimeInput,
  deliverable: Deliverable
): ExecutorId[] {
  const executors = new Set<ExecutorId>();

  if (deliverable.type === 'table') {
    executors.add('TABLE_GENERATION');
  }

  if (deliverable.type === 'document') {
    executors.add('LLM_REASONING');
    executors.add('COPYWRITING');
  }

  if (deliverable.type === 'script' || deliverable.type === 'message') {
    executors.add('COPYWRITING');
  }

  if (
    deliverable.type === 'workflow' ||
    deliverable.type === 'checklist' ||
    deliverable.type === 'outline' ||
    deliverable.type === 'diagnosis' ||
    deliverable.type === 'plan'
  ) {
    executors.add('LLM_REASONING');
  }

  if (deliverable.type === 'mixed') {
    executors.add('LLM_REASONING');
    executors.add('COPYWRITING');
  }

  if (deliverable.type === 'table' && hasTransformation(input, ['计算逻辑', '字段设计', '表格', '数据'])) {
    executors.add('TABLE_GENERATION');
  }

  if (
    (deliverable.type === 'document' ||
      deliverable.type === 'script' ||
      deliverable.type === 'message' ||
      deliverable.type === 'mixed') &&
    hasTransformation(input, ['说明', '表达', '改写', '文案', '脚本'])
  ) {
    executors.add('COPYWRITING');
  }

  if (hasTransformation(input, ['流程', '步骤', 'SOP', '检查点'])) {
    executors.add('LLM_REASONING');
  }

  if (executors.size === 0) {
    executors.add('LLM_REASONING');
  }

  return Array.from(executors);
}

function failedResult(deliverableId: string, executorId: ExecutorId): ExecutorResult {
  return {
    deliverableId,
    executorId,
    status: 'failed',
    output: {
      title: `${executorId} failed`,
    },
    error: 'Forced failure for function-level fallback verification.',
  };
}

function runExecutor(context: ExecutorContext, executorId: ExecutorId): ExecutorResult {
  if (executorId === 'TABLE_GENERATION') return runTableGenerationExecutor(context);
  if (executorId === 'COPYWRITING') return runCopywritingExecutor(context);
  return runLlmReasoningExecutor(context);
}

export function runExecutorRuntime(input: ExecutorRuntimeInput): ExecutorRunResult {
  const fallback = renderDeliverables(input.frame, input.contract);
  const forcedFailures = new Set(input.forceFailureExecutorIds ?? []);
  const executorResults: ExecutorResult[] = [];

  if (input.mode === 'fallback') {
    return {
      runId: `runtime-${input.frame.centerOutput.outputType}-${input.contract.deliverables.length}`,
      status: 'fallback',
      executorResults: [
        {
          deliverableId: 'runtime',
          executorId: 'RESULT_COMPOSER',
          status: 'fallback',
          output: {
            title: input.contract.title,
            sections: fallback.usableOutput.sections,
            copyableBlocks: fallback.copyableTemplates,
          },
        },
      ],
      composedResult: fallback,
    };
  }

  for (const deliverable of input.contract.deliverables) {
    const task = taskFromDeliverable(input, deliverable);
    const selectedExecutors = selectExecutorsForDeliverable(input, deliverable);

    for (const executorId of selectedExecutors) {
      if (forcedFailures.has(executorId)) {
        executorResults.push(failedResult(deliverable.id, executorId));
        continue;
      }

      executorResults.push(runExecutor({ profile: input.profile, frame: input.frame, contract: input.contract, task }, executorId));
    }
  }

  const hasFailed = executorResults.some(result => result.status === 'failed' || result.status === 'blocked');

  if (hasFailed) {
    return {
      runId: `runtime-${input.frame.centerOutput.outputType}-${input.contract.deliverables.length}`,
      status: 'fallback',
      executorResults: [
        ...executorResults,
        {
          deliverableId: 'runtime',
          executorId: 'RESULT_COMPOSER',
          status: 'fallback',
          output: {
            title: input.contract.title,
            sections: fallback.usableOutput.sections,
            copyableBlocks: fallback.copyableTemplates,
          },
        },
      ],
      composedResult: fallback,
    };
  }

  const composedResult = composeExecutorResults(input.contract.title, executorResults, fallback);

  return {
    runId: `runtime-${input.frame.centerOutput.outputType}-${input.contract.deliverables.length}`,
    status: 'completed',
    executorResults: [
      ...executorResults,
      {
        deliverableId: 'runtime',
        executorId: 'RESULT_COMPOSER',
        status: 'completed',
        output: {
          title: composedResult.usableOutput.title,
          sections: composedResult.usableOutput.sections,
          copyableBlocks: composedResult.copyableTemplates,
        },
      },
    ],
    composedResult,
  };
}
