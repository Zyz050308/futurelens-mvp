import type { FutureProfile, SolutionResult } from './radar';
import type { DeliverableType, OutputContract } from '@/lib/outputContract';
import type { OutputType, ProblemFrame } from '@/lib/problemFrameEngine';

export type ExecutorId =
  | 'LLM_REASONING'
  | 'TABLE_GENERATION'
  | 'COPYWRITING'
  | 'RESULT_COMPOSER';

export type ExecutorStatus =
  | 'completed'
  | 'fallback'
  | 'blocked'
  | 'failed';

export type ExecutorTask = {
  deliverableId: string;
  deliverableType: DeliverableType;
  title: string;
  purpose: string;
  centerOutput: string;
  outputType: OutputType;
  transformationNeeded: string[];
  missingInfo: string[];
  rawProblem: string;
};

export type ExecutorOutput = {
  title: string;
  sections?: Array<{
    heading: string;
    content: string;
  }>;
  copyableBlocks?: Array<{
    title: string;
    content: string;
  }>;
  structuredData?: unknown;
};

export type ExecutorResult = {
  deliverableId: string;
  executorId: ExecutorId;
  status: ExecutorStatus;
  output: ExecutorOutput;
  error?: string;
};

export type ExecutorRuntimeInput = {
  profile: FutureProfile;
  frame: ProblemFrame;
  contract: OutputContract;
  mode?: 'runtime' | 'fallback';
  forceFailureExecutorIds?: ExecutorId[];
};

export type ExecutorRunResult = {
  runId: string;
  status: ExecutorStatus;
  executorResults: ExecutorResult[];
  composedResult: Pick<SolutionResult, 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'>;
};

export type ExecutorContext = {
  profile: FutureProfile;
  frame: ProblemFrame;
  contract: OutputContract;
  task: ExecutorTask;
};
