export type BusinessWorkflowType =
  | 'restaurant_operation'
  | 'factory_management'
  | 'store_growth'
  | 'training_operation'
  | 'team_management'
  | 'business_generic';

export type BusinessWorkflowFrame = {
  workflowType: BusinessWorkflowType;
  businessRole: string;
  statedProblem: string;
  realProblems: string[];
  processBreakdown: string[];
  aiSolutionBlueprint: string[];
  requiredData: string[];
  requiredTools: string[];
  requiredPeople: string[];
  implementationSteps: string[];
  risks: string[];
  priority: string;
  suggestedContractId?: 'business_solution_workflow';
  confidence: number;
};

type CompilerInput = {
  rawProblem: string;
  supportText?: string;
};

type WorkflowPreset = Omit<
  BusinessWorkflowFrame,
  'statedProblem' | 'suggestedContractId' | 'confidence'
>;

function compactText(values: Array<string | undefined>): string {
  return values.map(value => value?.trim()).filter(Boolean).join(' ');
}

function includesAny(text: string, words: string[]): boolean {
  return words.some(word => text.includes(word));
}

function buildFrame(statedProblem: string, preset: WorkflowPreset, confidence: number): BusinessWorkflowFrame {
  return {
    ...preset,
    statedProblem,
    suggestedContractId: 'business_solution_workflow',
    confidence,
  };
}

const restaurantPreset: WorkflowPreset = {
  workflowType: 'restaurant_operation',
  businessRole: '餐厅老板 / 门店经营者',
  realProblems: [
    '点餐信息、后厨出单和库存记录分散，老板看不到一条完整经营链路。',
    '员工依赖口头沟通，订单备注、制作状态、缺货信息容易丢失。',
    '每天没有固定日报字段，无法判断热销菜、退单、库存预警和高峰卡点。',
  ],
  processBreakdown: [
    '顾客点餐：记录桌号、菜品、数量、备注、下单时间、付款状态。',
    '后厨出单：记录订单号、菜品、数量、备注、制作状态、出餐时间。',
    '库存扣减：按菜品关联关键原料，记录消耗、剩余、预警线、补货负责人。',
    '异常处理：记录退单、漏单、催单、缺货替换和顾客反馈。',
    '老板日报：汇总销售额、热销菜、退单数、高峰时段、库存预警和明日准备。',
  ],
  aiSolutionBlueprint: [
    '用统一表单收集点餐和备注，减少口头传递。',
    '用后厨看板按订单状态推进：待做、制作中、已出餐、异常。',
    '用库存预警表提醒关键原料低于安全线。',
    '用 AI 每天根据订单、库存和异常记录生成老板日报。',
  ],
  requiredData: [
    '点餐字段：桌号、订单号、菜品、数量、备注、下单时间、付款状态。',
    '后厨字段：订单号、菜品、数量、制作状态、出餐时间、异常说明。',
    '库存字段：原料名、当前库存、安全线、今日消耗、补货状态。',
    '日报字段：销售额、热销菜、退单数、高峰时段、库存预警、明日重点。',
  ],
  requiredTools: ['点餐表单或轻量 POS', '后厨订单看板', '库存表', '老板日报模板', 'AI 日报总结'],
  requiredPeople: ['老板负责看日报和定规则', '前厅负责点餐录入', '后厨负责状态更新', '库管或指定员工负责库存核对'],
  implementationSteps: [
    '第 1 周：统一点餐字段和后厨状态，先不用做复杂系统。',
    '第 2 周：把库存预警线写进表格，每天闭店核对 10 分钟。',
    '第 3 周：生成老板日报，固定每天只看 6 个经营指标。',
    '第 4 周：根据日报调整备货、排班和热销菜推荐。',
  ],
  risks: [
    '员工不愿意录入：先减少字段，只保留必须字段。',
    '库存不准：先从 10 个高频原料开始，不一次覆盖全部。',
    '系统太复杂：第一版只做记录、看板、日报，不做完整点餐系统。',
  ],
  priority: '先打通“点餐 → 后厨 → 库存 → 老板日报”这一条最小经营链路。',
};

const factoryPreset: WorkflowPreset = {
  workflowType: 'factory_management',
  businessRole: '工厂老板 / 生产负责人',
  realProblems: [
    '生产记录和质检记录没有统一字段，异常发生后很难追溯批次、责任和原因。',
    '现场数据靠口头或纸面记录，老板只能事后听汇报，不能及时看到卡点。',
    'AI 管理不是先买大系统，而是先把生产、质检、异常上报标准化。',
  ],
  processBreakdown: [
    '生产记录：订单号、批次、工序、负责人、计划数量、完成数量、开始/结束时间。',
    '质检记录：批次、抽检数量、不良数、不良类型、处理方式、复检结果。',
    '异常上报：异常时间、工序、设备/人员、影响数量、临时处理、负责人。',
    '负责人看板：今日产量、延误工序、不良率、待处理异常、明日风险。',
  ],
  aiSolutionBlueprint: [
    '用生产记录表统一每道工序的输入和输出。',
    '用质检记录表把不良类型标准化，便于 AI 汇总高频问题。',
    '用异常上报表把现场问题变成可追踪任务。',
    '用 AI 每天生成生产/质检日报和异常原因初判。',
  ],
  requiredData: [
    '生产字段：订单号、批次、工序、负责人、计划数量、完成数量、时间。',
    '质检字段：批次、抽检数量、不良数、不良类型、复检结果。',
    '异常字段：异常原因、影响范围、处理动作、负责人、截止时间。',
  ],
  requiredTools: ['生产记录表', '质检记录表', '异常上报表', '负责人看板', 'AI 日报总结'],
  requiredPeople: ['生产负责人', '质检负责人', '班组长', '老板或厂长'],
  implementationSteps: [
    '第 1 周：只选一条产线试点生产记录和质检记录。',
    '第 2 周：建立异常上报规则，所有异常必须有负责人和处理动作。',
    '第 3 周：生成负责人看板，固定查看产量、不良率和异常。',
    '第 4 周：用 AI 总结高频异常，决定是否扩展到其他产线。',
  ],
  risks: [
    '一开始覆盖太大：先选一条产线和一个关键工序。',
    '员工记录不一致：字段少而固定，比系统复杂更重要。',
    'AI 判断不准：AI 只做汇总和提示，最终判断由负责人确认。',
  ],
  priority: '先让生产记录、质检记录和异常上报可追溯，再谈 AI 管理。',
};

const storePreset: WorkflowPreset = {
  workflowType: 'store_growth',
  businessRole: '门店老板 / 零售经营者',
  realProblems: [
    '复购低通常不是单一工具问题，而是客户分层、触达节奏、活动复盘没有形成闭环。',
    '会员系统、私域和 AI 客服要服务同一条链路：识别客户、触达客户、记录反馈、复盘活动。',
    '如果没有数据看板，老板看不到哪些客户值得重点维护。',
  ],
  processBreakdown: [
    '客户分层：新客、复购客、高价值客、沉默客、流失风险客户。',
    '会员运营：记录手机号/微信、消费品类、最近购买、偏好、生日或重要节点。',
    '复购触达：按客户层级发送不同内容，不群发同一条。',
    '活动复盘：记录活动主题、参与人数、复购人数、客单价、反馈。',
    '数据看板：每周看新增客户、复购率、沉默客户、活动转化。',
  ],
  aiSolutionBlueprint: [
    '用客户标签表做最小会员系统。',
    '用 AI 根据客户层级生成不同触达话术。',
    '用活动复盘表记录每次动作是否带来复购。',
    '用数据看板判断继续会员系统、私域还是 AI 客服。',
  ],
  requiredData: [
    '客户字段：姓名/昵称、联系方式、最近消费、消费品类、标签、最近触达。',
    '触达字段：触达时间、内容、渠道、回复、是否到店/购买。',
    '活动字段：主题、目标人群、优惠/内容、参与人数、复购人数、销售额。',
  ],
  requiredTools: ['客户标签表', '触达话术模板', '活动复盘表', '复购看板', 'AI 文案生成'],
  requiredPeople: ['老板', '店员', '私域/客服负责人（可兼职）'],
  implementationSteps: [
    '第 1 周：整理最近 30 天客户，先分 4 类。',
    '第 2 周：为每类客户写一条触达话术并小范围测试。',
    '第 3 周：做一次复购活动并记录转化。',
    '第 4 周：复盘数据，决定是否上会员系统或 AI 客服。',
  ],
  risks: [
    '过早上系统但没有运营动作。',
    '群发太频繁导致客户反感。',
    '只看销售额，不看复购率和客户层级变化。',
  ],
  priority: '先用客户分层和复购触达跑通一轮，再决定工具投入。',
};

const trainingPreset: WorkflowPreset = {
  workflowType: 'training_operation',
  businessRole: '培训机构负责人',
  realProblems: [
    '招生咨询、排课和学员跟进分散，导致线索丢失、排课混乱、续费判断不清。',
    '机构需要先把咨询记录、课程安排和学员跟进标准化，再让 AI 辅助总结和提醒。',
    '转化漏斗不清时，很难判断问题在获客、咨询、试听、报名还是续费。',
  ],
  processBreakdown: [
    '招生咨询：来源、学生年级、需求、预算、意向程度、下一次跟进时间。',
    '排课流程：课程、老师、教室/线上链接、时间、学员名单、请假/调课。',
    '学员跟进：出勤、作业、课堂表现、家长反馈、续费风险。',
    '转化漏斗：咨询数、试听数、报名数、续费数、流失原因。',
    '员工 SOP：咨询怎么记、排课怎么确认、课后怎么跟进。',
  ],
  aiSolutionBlueprint: [
    '用咨询记录表防止线索丢失。',
    '用排课表统一老师、时间和学员信息。',
    '用 AI 根据课堂记录生成家长沟通摘要。',
    '用转化漏斗看招生和续费卡在哪一步。',
  ],
  requiredData: [
    '咨询字段：来源、需求、课程、意向、跟进时间、负责人。',
    '排课字段：课程、老师、时间、学员、状态、调课记录。',
    '跟进字段：出勤、作业、表现、家长反馈、续费风险。',
    '漏斗字段：咨询、试听、报名、续费、流失原因。',
  ],
  requiredTools: ['咨询 CRM 表', '排课表', '学员跟进表', '转化漏斗看板', 'AI 跟进摘要'],
  requiredPeople: ['招生顾问', '教务', '授课老师', '机构负责人'],
  implementationSteps: [
    '第 1 周：统一咨询记录和跟进时间。',
    '第 2 周：统一排课字段，避免口头排课。',
    '第 3 周：建立课后学员跟进模板。',
    '第 4 周：看转化漏斗，定位招生或续费最大卡点。',
  ],
  risks: [
    '咨询记录不完整，后续无法追踪。',
    '排课信息变更没有同步给老师和家长。',
    'AI 摘要代替真实跟进，导致服务变弱。',
  ],
  priority: '先打通“咨询记录 → 排课 → 学员跟进 → 转化漏斗”。',
};

const teamPreset: WorkflowPreset = {
  workflowType: 'team_management',
  businessRole: '小团队负责人',
  realProblems: [
    '员工日报信息不统一，负责人看不到项目进度、卡点和下一步责任人。',
    '项目状态没有结构化字段，导致会议反复问进度，但问题仍然不清楚。',
    '需要先建立日报字段和负责人看板，再考虑自动化或 AI 总结。',
  ],
  processBreakdown: [
    '日报字段：今日完成、明日计划、当前卡点、需要谁支持、风险等级。',
    '项目进度：项目名、阶段、负责人、完成比例、截止时间、风险。',
    '卡点上报：卡点描述、影响范围、需要决策、处理人、截止时间。',
    '负责人看板：本周目标、延期事项、关键卡点、需要老板决策的问题。',
  ],
  aiSolutionBlueprint: [
    '用统一日报模板收集团队信息。',
    '用项目进度表把任务状态结构化。',
    '用 AI 每天汇总卡点和需要决策的事项。',
    '用负责人看板每周复盘项目推进。',
  ],
  requiredData: [
    '日报字段：完成事项、明日计划、卡点、支持对象、风险等级。',
    '项目字段：项目名、负责人、阶段、截止时间、当前状态。',
    '卡点字段：问题、影响、所需决策、负责人、截止时间。',
  ],
  requiredTools: ['日报模板', '项目进度表', '卡点上报表', '负责人看板', 'AI 周报总结'],
  requiredPeople: ['团队负责人', '项目负责人', '执行成员'],
  implementationSteps: [
    '第 1 周：统一日报字段，只收集 5 个必要信息。',
    '第 2 周：建立项目进度表，每个项目明确负责人和阶段。',
    '第 3 周：建立卡点上报机制，所有卡点必须有下一步。',
    '第 4 周：用负责人看板开周会，只讨论延期、卡点和决策。',
  ],
  risks: [
    '日报变成形式主义：必须和项目进度表联动。',
    '员工只写流水账：字段要逼近完成、卡点和支持需求。',
    '负责人看板过复杂：第一版只看项目、风险、决策三类。',
  ],
  priority: '先统一日报字段和卡点上报，再做项目进度看板。',
};

const genericBusinessPreset: WorkflowPreset = {
  workflowType: 'business_generic',
  businessRole: '小企业经营者',
  realProblems: [
    '问题不是“要不要用 AI”，而是业务流程、数据字段和责任人还没有被拆清楚。',
    '如果直接上工具，容易把混乱流程搬进系统里。',
    '第一步应该先确定最痛的一个业务环节，并形成可记录、可检查、可复盘的最小流程。',
  ],
  processBreakdown: [
    '业务入口：客户/订单/任务从哪里进入。',
    '处理流程：谁负责、按什么步骤处理、每一步留下什么记录。',
    '异常上报：哪些情况必须上报、给谁、多久内处理。',
    '经营看板：老板每天或每周看哪些字段。',
  ],
  aiSolutionBlueprint: [
    '用统一字段记录业务入口。',
    '用流程表明确负责人和完成标准。',
    '用 AI 汇总日报、异常和下一步建议。',
    '用看板判断哪个环节最值得继续系统化。',
  ],
  requiredData: ['业务入口字段', '处理状态字段', '异常字段', '负责人字段', '老板看板字段'],
  requiredTools: ['业务记录表', '流程看板', '异常上报表', 'AI 总结模板'],
  requiredPeople: ['老板', '一线负责人', '执行人员'],
  implementationSteps: [
    '第 1 周：选一个最乱的流程，写清字段和负责人。',
    '第 2 周：试运行记录表和异常上报。',
    '第 3 周：生成老板看板并每周复盘。',
    '第 4 周：决定是否接入更正式系统或外包开发。',
  ],
  risks: ['范围太大', '员工不记录', '老板只看结果不看过程', '工具先行导致流程更乱'],
  priority: '先编译一个最小业务工作流，再决定 AI 或系统投入。',
};

export function compileBusinessWorkflow(input: CompilerInput): BusinessWorkflowFrame | null {
  const text = compactText([input.rawProblem, input.supportText]);
  if (!text) return null;

  const hasBusinessSignal = includesAny(text, [
    '餐厅', '门店', '店里', '工厂', '培训机构', '招生', '排课', '学员',
    '老板', '员工', '团队', '后厨', '库存', '质检', '生产记录', '复购',
    '会员', '私域', '客服', '日报', '项目进度', '经营', '小企业',
  ]);
  const hasWorkflowSignal = includesAny(text, [
    'AI', '系统', '流程', '管理', '很乱', '看不到', '跟进', '运营',
    '解决', '改一下流程', '不知道从哪开始', '不知道该用',
  ]);

  if (!hasBusinessSignal || !hasWorkflowSignal) return null;

  if (includesAny(text, ['餐厅', '点餐', '后厨', '菜品'])) {
    return buildFrame(input.rawProblem, restaurantPreset, 0.92);
  }

  if (includesAny(text, ['工厂', '生产记录', '质检', '车间', '产线', '批次'])) {
    return buildFrame(input.rawProblem, factoryPreset, 0.91);
  }

  if (includesAny(text, ['门店', '复购', '会员', '私域', 'AI 客服', 'AI客服', '客服'])) {
    return buildFrame(input.rawProblem, storePreset, 0.9);
  }

  if (includesAny(text, ['培训机构', '招生', '排课', '学员跟进', '课程安排', '试听'])) {
    return buildFrame(input.rawProblem, trainingPreset, 0.9);
  }

  if (includesAny(text, ['团队', '员工', '日报', '项目进度', '卡在哪里', '负责人看板'])) {
    return buildFrame(input.rawProblem, teamPreset, 0.9);
  }

  return buildFrame(input.rawProblem, genericBusinessPreset, 0.76);
}
