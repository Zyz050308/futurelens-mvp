export type FutureProfile = {
  age: string;
  education: string;
  majorOrCareer: string;
  currentSkills: string;
  currentSituation: string;  // V6.6 新增：最高权重字段
  currentGoal: string;  // V6.6 重命名：你最想获得什么
  currentAnxiety: string;  // V6.6 重命名：你最担心失去什么
  desiredOutcome: string;
  weeklyTime: string;
  riskPreference: string;
};

export type Signal = {
  title: string;
  description: string;
  whyItMatters: string;
};

export type Opportunity = {
  title: string;
  description: string;
  fitReason: string;
};

export type Risk = {
  title: string;
  description: string;
  avoidAction: string;
};

export type WeekAction = {
  week: string;
  action: string;
  outcome: string;
};

export type OpportunityRadar = {
  signals: Signal[];
  opportunities: Opportunity[];
  risks: Risk[];
  next30Days: WeekAction[];
};

export type BackgroundDomain = 'design' | 'tech' | 'business' | 'humanities' | 'learning' | 'unknown';

export type CurrentTask =
  | 'exam'
  | 'product_validation'
  | 'startup'
  | 'money'
  | 'job'
  | 'transition'
  | 'direction'
  | 'skill_growth'
  | 'unknown';

export type SecondaryTask =
  | 'career_choice'
  | 'graduate_major_choice'
  | 'study_abroad'
  | 'portfolio_application'
  | 'none';

export type AnxietyType =
  | 'exam_pressure'
  | 'skill_obsolete'
  | 'no_direction'
  | 'no_users'
  | 'income_pressure'
  | 'portfolio_weak'
  | 'competition_pressure'
  | 'unknown';

export type UserInsight = {
  backgroundDomain: BackgroundDomain;
  currentTask: CurrentTask;
  secondaryTask: SecondaryTask;
  anxietyType: AnxietyType;
};

// 人物属性等级类型
export type DirectionLevel = '迷雾中' | '有线索' | '方向初现' | '目标明确';
export type DriveLevel = '尚未启动' | '准备中' | '可以行动' | '进入执行';
export type SignalLevel = '信号微弱' | '出现连接' | '机会成形' | '高度匹配';
export type PressureLevel = '平稳' | '轻度紧张' | '压力明显' | '高压状态';

// 通用属性类型
export type FutureSelfAttribute<TLevel extends string = string> = {
  value: number;
  level: TLevel;
  label: string;
  code: string;
  description: string;
};

export type FutureSelfStatus = {
  directionSense: FutureSelfAttribute<DirectionLevel>;
  drive: FutureSelfAttribute<DriveLevel>;
  opportunitySignal: FutureSelfAttribute<SignalLevel>;
  pressure: FutureSelfAttribute<PressureLevel>;
  stageLabel: string;
  growthRole: string;
  isProfileMeaningful: boolean;
};

// ============================================================
// V3.0 行动导航系统类型
// ============================================================

// 执行清单项
export type ChecklistItem = {
  id: string;
  text: string;
  estimatedTime: string;
};

// 今日行动
export type TodayAction = {
  task: string;
  estimatedTime: string;
  successCriteria: string;
  checklist: ChecklistItem[];
};

// 本周行动
export type ThisWeekAction = {
  goal: string;
  action: string;
  expectedResult: string;
  checklist: ChecklistItem[];
};

// 现在最应该做什么（核心任务）
export type CoreTask = {
  timeFrame: string;
  mainTask: string;
  reason: string;
  successCriteria: string;
  estimatedTime: string;
  todayAction: TodayAction;
  thisWeekAction: ThisWeekAction;
};

// FutureLens判断（识别真实阻碍）
export type FutureLensJudgment = {
  notTheProblem: string;
  realObstacle: string;
  reason: string;
};

// ============================================================
// V3.1 身份识别类型
// ============================================================

export type UserIdentity =
  | 'design_student'
  | 'job_seeker'
  | 'ielts_student'
  | 'graduate_exam'
  | 'study_abroad'
  | 'career_transition'
  | 'creator'
  | 'entrepreneur'
  | 'ai_builder'
  | 'unknown';

// V3.0 完整输出
export type ActionNavigationRadar = {
  judgment: FutureLensJudgment;
  coreTask: CoreTask;
  identity?: UserIdentity;
};

// ============================================================
// V4.0 变化驱动的 Opportunity Radar 类型
// ============================================================

// 临时变化信号类型（mock数据用）
export type ChangeSignal = {
  id: string;
  title: string;
  summary: string;
  category: string;
  sourceType: "mock" | "rss" | "manual";
  affectedCapabilities: string[];
  threatenedTasks: string[];
  emergingOpportunities: string[];
  lowRelevanceDomains?: string[];
};

// API返回的今日变化
export type TodayChange = {
  title: string;
  summary: string;
  whyItMatters: string;
};

// 对用户的影响（V6.6 升级：增加具体时间后果）
export type ImpactOnUser = {
  identity: string;
  currentProblem: string;
  risk30Days: string;  // V6.6 新增：30天后的具体后果
  risk90Days: string;  // V6.6 新增：90天后的具体后果
  mostLikelyResult: string;  // V6.6 新增：最可能的结果
  opportunity: string;
};

// 行动项（V6.6 升级：今晚行动增加具体平台和关键词）
export type ActionItem = {
  time: string;
  task: string;
  reason: string;
  successCriteria: string;
  verificationType?:
    | 'portfolio_feedback'
    | 'real_scene_trial'
    | 'industry_path_comparison'
    | 'customer_validation'
    | 'job_validation'
    | 'exam_diagnostic'
    | 'content_publish'
    | 'direction_test'
    | 'general';
  platform?: string;  // V6.6 新增：今晚任务需要打开的平台
  keywords?: string;  // V6.6 新增：今晚任务需要搜索的关键词
  action?: string;  // V6.6 新增：今晚任务需要完成的具体动作
};

// ============================================================
// Phase 1 Solution Pack 类型
// ============================================================

export type ProblemShape =
  | 'learn_capability'
  | 'build_workflow'
  | 'create_output'
  | 'make_decision'
  | 'validate_opportunity'
  | 'solve_specific_task';

export type CapabilityName =
  | 'search_information'
  | 'generate_learning_plan'
  | 'generate_exercises'
  | 'generate_explanation'
  | 'generate_document'
  | 'generate_table'
  | 'generate_workflow'
  | 'generate_prompt_template'
  | 'generate_checklist'
  | 'generate_review_form'
  | 'generate_message_template'
  | 'generate_script'
  | 'compare_options'
  | 'run_validation_design'
  | 'track_task'
  | 'update_plan_from_feedback';

export type SolutionMaterialType =
  | 'learning_plan'
  | 'exercise_set'
  | 'explanation'
  | 'document_template'
  | 'table'
  | 'workflow'
  | 'prompt_template'
  | 'checklist'
  | 'review_form'
  | 'script'
  | 'message_template';

export type SolutionPack = {
  problemSummary: {
    userOriginalProblem: string;
    interpretedProblem: string;
    missingInformation: string[];
  };
  problemShape: ProblemShape;
  coreObstacle: {
    summary: string;
    whyItBlocksProgress: string;
    evidenceFromContext: string[];
  };
  targetOutcome: {
    desiredResult: string;
    successDefinition: string;
    timeConstraint?: string;
  };
  solutionPath: Array<{
    step: string;
    purpose: string;
    order: number;
    expectedOutput: string;
  }>;
  requiredCapabilities: Array<{
    capability: CapabilityName;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  materials: Array<{
    id: string;
    type: SolutionMaterialType;
    title: string;
    purpose: string;
    content: string;
    usageInstruction: string;
  }>;
  todayTask: {
    title: string;
    task: string;
    estimatedTime: string;
    requiredMaterialIds: string[];
    executionSteps: string[];
  };
  completionCriteria: {
    minimumDone: string;
    goodEnoughResult: string;
    evidenceToRecord: string;
  };
  feedbackQuestions: Array<{
    key: string;
    question: string;
    answerType: 'text' | 'choice' | 'number' | 'boolean';
    options?: string[];
  }>;
  nextAdjustmentLogic: Array<{
    condition: string;
    interpretation: string;
    nextMove: string;
    capabilityToUseNext?: CapabilityName;
  }>;
};

// V5.5 Personal Impact 类型
export type PersonalImpact = {
  affectedPart: string;
  reason: string;
  opportunity: string;
  risk: string;
};

// V6.7 CoreInsight 类型（从「分析」升级到「理解」）
export type CoreInsight = {
  "你正在经历什么": string;  // V6.7 新增：系统复述用户状态，让用户感觉被理解
  "你真正害怕失去什么": string;  // V6.7 新增：触达情绪、恐惧和真正驱动力
  "真正的问题是什么": string;  // V6.7 升级：分析结构而非行为
  "如果只记住一句话": string;  // V6.7 新增：整个页面最重要的一句话
};

// V4.0 完整输出（已升级到 V6.3）
export type OpportunityRadarV4 = {
  todayChanges: TodayChange[];
  personalImpact?: PersonalImpact;
  coreInsight?: CoreInsight;  // V6.1 新增
  solutionPack?: SolutionPack;  // Phase 1 新增：并行保留旧 Radar 字段
  valueMigration?: ValueMigration;  // V6.0 新增
  impactOnUser: ImpactOnUser;
  decisionExplanation?: DecisionExplanation;  // V5.8 新增
  actions: ActionItem[];
  futureSelfMessage: string;
};

// ============================================================
// V5.1 State Engine 类型
// ============================================================

export type UserState =
  | "monetization_exploration"
  | "monetization_sprint"
  | "career_security_anxiety"
  | "direction_confusion"
  | "skill_upgrade"
  | "career_transition"
  | "entrepreneurship_trial"
  | "study_application"
  | "job_search_push"
  | "content_execution"
  | "low_energy_survival"
  | "general_exploration";

export type CurrentProblemType =
  | "exam_deadline"
  | "career_direction"
  | "career_security"
  | "monetization_validation"
  | "content_publishing"
  | "information_gap";

export type UserStateProfile = {
  state: UserState;
  problemType: CurrentProblemType;
  problemStatement: string;
  validationQuestion: string;
  actionDirective: string;
  stateLabel: string;
  oneSentenceDiagnosis: string;
  mainGoal: string;
  mainFear: string;
  keyConstraint: string;
  availableTime: string;
  riskPreference: string;
  resourceLevel: string;
  executionCapacity: string;
  decisionLogic: string;
  recommendedStrategy: string;
  avoidStrategy: string;
  // V5.1 新增字段
  strategyFocus: string[];
  actionBias: string[];
  forbiddenBias: string[];
  decisionPriority: string;
};

// ============================================================
// V5.8 Decision Transparency Layer 类型
// ============================================================

export type DecisionExplanation = {
  currentPriority: string;       // 系统最关注什么
  whyNotOthers: string;          // 为什么不是别的事情
  influencingFactors: string[];  // 哪些字段影响了判断
  alternativeScenario: string;   // 如果字段变化，建议会怎样变化
};

// ============================================================
// V6.0 Personal Value Engine 类型
// ============================================================

export type UrgencyLevel = "low" | "medium" | "high";

export type ValueMigration = {
  currentValueSource: string[];    // 用户当前主要依赖什么能力产生价值
  decliningValue: string[];        // 哪些能力正在贬值
  risingValue: string[];          // 哪些能力正在升值
  migrationDirection: string;      // 迁移方向（一句话描述）
  urgencyLevel: UrgencyLevel;      // 迁移紧迫度
};
