export type ProblemShapeId =
  | 'learn_capability'
  | 'build_workflow'
  | 'create_output'
  | 'make_decision'
  | 'validate_opportunity'
  | 'solve_specific_task'
  | 'research_information'
  | 'analyze_existing_material';

export type CapabilityId =
  | 'search_information'
  | 'analyze_file'
  | 'generate_learning_plan'
  | 'generate_exercises'
  | 'generate_explanation'
  | 'generate_document'
  | 'generate_table'
  | 'generate_workflow'
  | 'generate_prompt_template'
  | 'generate_checklist'
  | 'generate_review_form'
  | 'compare_options'
  | 'generate_message_template'
  | 'track_task'
  | 'update_plan_from_feedback';

export type ExecutorId =
  | 'deepseek_text_generation'
  | 'markdown_table_generator'
  | 'page_task_display'
  | 'manual_context_only'
  | 'not_available_yet'
  | 'search_api'
  | 'pdf_parser'
  | 'docx_parser'
  | 'excel_exporter'
  | 'word_exporter'
  | 'pdf_exporter'
  | 'calendar_api'
  | 'notification_system';

export type CapabilityStatus = 'simulated' | 'available' | 'planned' | 'unavailable';

export type ExecutionStepStatus = 'planned' | 'pending' | 'completed' | 'blocked';

export type ProblemUnderstanding = {
  problemShape: ProblemShapeId;
  userProblem: string;
  targetOutcome: string;
  coreObstacle: string;
  timeConstraint?: string;
  knownContext: string[];
  missingInformation: string[];
  requiresFileAnalysis: boolean;
  requiresUserFeedback: boolean;
};

export type Capability = {
  id: CapabilityId;
  name: string;
  description: string;
  category: 'research' | 'analysis' | 'generation' | 'planning' | 'tracking' | 'feedback';
  defaultExecutorId: ExecutorId;
  availableExecutorIds: ExecutorId[];
  currentStatus: CapabilityStatus;
  requiresUserInput: boolean;
  requiresAuthorization: boolean;
  requiresFileUpload: boolean;
  canRunAutomatically: boolean;
};

export type Executor = {
  id: ExecutorId;
  name: string;
  description: string;
  currentStatus: CapabilityStatus;
  isSimulated: boolean;
  userVisibleMethod: string;
};

export type CapabilityRouteItem = {
  routeId: string;
  capabilityId: CapabilityId;
  capabilityName: string;
  capabilityDescription: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  executorId: ExecutorId;
  executorName: string;
  executionMethod: string;
  capabilityStatus: CapabilityStatus;
  executorStatus: CapabilityStatus;
  isSimulated: boolean;
  requiresUserInput: boolean;
  requiresAuthorization: boolean;
  requiresFileUpload: boolean;
  canRunAutomatically: boolean;
  fallbackExecutorId?: ExecutorId;
  fallbackInstruction?: string;
  futureExecutorIds?: ExecutorId[];
  futureExecutorNames?: string[];
};

export type ExecutionStep = {
  stepId: string;
  title: string;
  capabilityId: CapabilityId;
  capabilityName: string;
  executorId: ExecutorId;
  executorName: string;
  status: ExecutionStepStatus;
  userActionRequired: boolean;
  requiresAuthorization: boolean;
  requiresUpload: boolean;
  dependsOn: string[];
  nextStepCondition: string;
  resultSummary: string;
  fallbackInstruction?: string;
};

export type ExecutionPlan = {
  planId: string;
  title: string;
  problemShape: ProblemShapeId;
  steps: ExecutionStep[];
  currentStepId?: string;
  blockedReason?: string;
  nextUserStep: string;
};

export type CapabilityResult = {
  capabilityId: CapabilityId;
  executorId: ExecutorId;
  status: ExecutionStepStatus;
  summary: string;
  output?: string;
  error?: string;
};
