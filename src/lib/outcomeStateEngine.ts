import type { ActionProgressState, SolutionActionItem } from './actionProgressEngine';

export type OutcomeStage = 'not_started' | 'in_progress' | 'blocked' | 'ready_to_finalize' | 'done';

export type OutcomeState = {
  stage: OutcomeStage;
  completionRate: number;
  blockers: string[];
  nextBestMove: string;
  suggestedInstruction: string;
  confidence: number;
};

function roundRate(value: number): number {
  return Math.round(value * 100) / 100;
}

function isCriticalAction(item: SolutionActionItem, index: number): boolean {
  if (index === 0) return true;
  return /(确认|核心|字段|假设|目标|结构|材料|复制|改写)/.test(item.title);
}

function buildBlockedSuggestion(blockers: string[]): string {
  if (blockers.length === 0) return '补齐缺失信息后，重新调整当前结果。';
  return `补齐这些缺失后重新调整：${blockers.slice(0, 3).join('；')}`;
}

export function evaluateOutcomeState(progress: ActionProgressState): OutcomeState {
  const items = progress.items;
  const total = items.length;

  if (total === 0) {
    return {
      stage: 'not_started',
      completionRate: 0,
      blockers: ['还没有可执行任务'],
      nextBestMove: '先重新拆解执行清单。',
      suggestedInstruction: '重新拆解执行清单',
      confidence: 0.6,
    };
  }

  const doneItems = items.filter(item => item.status === 'done');
  const skippedItems = items.filter(item => item.status === 'skipped');
  const pendingItems = items.filter(item => item.status === 'pending');
  const completionRate = roundRate(doneItems.length / total);
  const criticalSkipped = items.some((item, index) => item.status === 'skipped' && isCriticalAction(item, index));
  const skippedTooMany = skippedItems.length >= Math.max(2, Math.ceil(total / 2));
  const blockers = skippedItems.map(item => `${item.title}：${item.doneCriteria}`);

  if (doneItems.length === 0 && skippedItems.length === 0) {
    const first = pendingItems[0];
    return {
      stage: 'not_started',
      completionRate,
      blockers: [],
      nextBestMove: first
        ? `先执行“${first.title}”，完成标准是：${first.doneCriteria}`
        : '先选择一个任务开始。',
      suggestedInstruction: '继续执行当前清单，先完成第一个任务',
      confidence: 0.9,
    };
  }

  if (doneItems.length === total) {
    return {
      stage: 'done',
      completionRate: 1,
      blockers: [],
      nextBestMove: '当前执行清单已经完成，可以生成最终可复制版本。',
      suggestedInstruction: '生成最终可复制版本',
      confidence: 0.95,
    };
  }

  if (criticalSkipped || skippedTooMany) {
    return {
      stage: 'blocked',
      completionRate,
      blockers,
      nextBestMove: buildBlockedSuggestion(blockers),
      suggestedInstruction: '根据已跳过的任务补齐缺失信息，并重新拆解执行清单',
      confidence: criticalSkipped ? 0.88 : 0.82,
    };
  }

  if (completionRate >= 0.75) {
    const remaining = pendingItems[0] ?? skippedItems[0];
    return {
      stage: 'ready_to_finalize',
      completionRate,
      blockers,
      nextBestMove: remaining
        ? `已经接近完成。可以先处理“${remaining.title}”，或者直接生成最终版。`
        : '已经接近完成，可以生成最终版。',
      suggestedInstruction: '生成最终可复制版本',
      confidence: 0.86,
    };
  }

  const nextPending = pendingItems[0];
  return {
    stage: 'in_progress',
    completionRate,
    blockers,
    nextBestMove: nextPending
      ? `继续执行“${nextPending.title}”，完成标准是：${nextPending.doneCriteria}`
      : '继续补齐剩余任务。',
    suggestedInstruction: '继续执行当前清单，补齐剩余任务',
    confidence: 0.84,
  };
}
