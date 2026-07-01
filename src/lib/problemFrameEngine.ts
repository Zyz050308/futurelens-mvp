import type { FutureProfile } from '@/types/radar';

export type UserAction =
  | 'create'
  | 'edit'
  | 'analyze'
  | 'organize'
  | 'compare'
  | 'plan'
  | 'transform'
  | 'decide'
  | 'execute'
  | 'ask'
  | 'score'
  | 'review'
  | 'unknown';

export type OutputType =
  | 'document'
  | 'table'
  | 'workflow'
  | 'script'
  | 'checklist'
  | 'plan'
  | 'message'
  | 'mixed'
  | 'unknown';

export type ProblemArchetype =
  | 'research_report'
  | 'analysis_table'
  | 'rubric'
  | 'validation_plan'
  | 'metric_analysis'
  | 'risk_plan'
  | 'experience_rewrite'
  | 'clarification_flow'
  | 'generic';

export type OutputContractId =
  | 'message_draft'
  | 'research_report'
  | 'analysis_table'
  | 'rubric_assignment'
  | 'rubric_self_assessment'
  | 'validation_plan'
  | 'metric_analysis'
  | 'risk_plan'
  | 'experience_rewrite'
  | 'project_retrospective'
  | 'clarification_flow'
  | 'generic_document';

export type ProblemFrame = {
  rawProblem: string;
  supportText: string;
  userNeed: string;
  centerOutput: {
    name: string;
    outputType: OutputType;
  };
  archetype?: ProblemArchetype;
  contractId?: OutputContractId;
  object?: string;
  action?: string;
  audience?: string;
  outputNeed?: string;
  currentBlocker: {
    action: UserAction;
    reason: string;
  };
  inputAssets: Array<{
    type: 'text' | 'data' | 'draft' | 'reference' | 'image' | 'none' | 'unknown';
    state: 'provided' | 'described' | 'missing' | 'unknown';
    description: string;
  }>;
  transformationNeeded: string[];
  constraints: {
    time?: string;
    qualityBar?: string;
    format?: string;
    risk?: string;
  };
  successCriteria: string[];
  missingInfo: string[];
  confidence: number;
};

function compactText(values: Array<string | undefined>): string {
  return values.map(value => value?.trim()).filter(Boolean).join(' ');
}

function includesAny(text: string, words: string[]): boolean {
  return words.some(word => text.includes(word));
}

function getRawProblem(profile: FutureProfile): string {
  return profile.currentSituation?.trim() || compactText([
    profile.currentGoal,
    profile.desiredOutcome,
    profile.currentSkills,
    profile.currentAnxiety,
  ]) || '用户还没有说清楚当前问题。';
}

function getSupportText(profile: FutureProfile): string {
  const extended = profile as FutureProfile & {
    extraContext?: string;
    materialsNote?: string;
  };

  return compactText([
    profile.currentGoal,
    profile.desiredOutcome,
    profile.currentSkills,
    profile.currentAnxiety,
    profile.weeklyTime,
    profile.riskPreference,
    extended.extraContext,
    extended.materialsNote,
  ]);
}

function hasJobContext(text: string): boolean {
  return includesAny(text, ['简历', '求职', '投递', '岗位', '招聘方', '面试', '实习经历']);
}

function hasAssignmentTeacherContext(text: string): boolean {
  return includesAny(text, ['给学生', '布置', '作业要求', '提交内容', '提交要求', '评分标准', '课程作业']) &&
    includesAny(text, ['学生', '作业', '提交', '评分']);
}

function hasSelfAssessmentContext(text: string): boolean {
  return includesAny(text, ['给自己', '自评', '学习效果', '每天学习', '个人复盘']) &&
    includesAny(text, ['评分标准', '评分', '打分']);
}

function inferContractId(rawProblem: string, supportText: string): OutputContractId {
  const text = compactText([rawProblem, supportText]);

  if (
    includesAny(text, ['发消息', '一条消息', '怎么说', '礼貌', '询问', '确认一下', '催一下']) &&
    !hasAssignmentTeacherContext(text)
  ) {
    return 'message_draft';
  }

  if (hasSelfAssessmentContext(text)) return 'rubric_self_assessment';
  if (hasAssignmentTeacherContext(text)) return 'rubric_assignment';

  if (
    includesAny(text, ['用户为什么不愿意使用', '用户调研', '产品验证', '用户验证', '用户到底需不需要', 'MVP', '访谈问题', '没人用', '目标用户', '竞品']) &&
    includesAny(text, ['产品', '用户', 'MVP', '验证', '访谈'])
  ) {
    return 'validation_plan';
  }

  if (
    includesAny(text, ['DAU', '转化率', '留存', '订单量', '业务指标', '异常波动', '业务负责人', '指标变化', '分析结论']) &&
    includesAny(text, ['指标', '异常', '分析', '汇报', '结论'])
  ) {
    return 'metric_analysis';
  }

  if (
    includesAny(text, ['销售表', '营业额下降', '订单数据', '订单流水', '顾客评价', '菜单价格', '卖得最好', '原因分析', '调整方案', '销售额']) ||
    includesAny(text, ['财务报表', '经营报表', '月度报表']) ||
    (includesAny(text, ['表', '数据', '反馈']) && includesAny(text, ['原因', '分析', '产品', '销售']))
  ) {
    return 'analysis_table';
  }

  if (
    includesAny(text, ['地域文化', '调研汇报', '课程调研', 'PPT汇报', '报告结构', '汇报结构', '每页放什么']) ||
    (includesAny(text, ['老师让我做', '调研']) && includesAny(text, ['汇报', '报告', 'PPT', '内容清单']))
  ) {
    return 'research_report';
  }

  if (
    includesAny(text, ['重构', '改造', '上线风险', '灰度', '回滚', '接口变更', '团队说明', '风险清单']) &&
    includesAny(text, ['风险', '上线', '改造', '回滚', '灰度'])
  ) {
    return 'risk_plan';
  }

  if (hasJobContext(text) && includesAny(text, ['项目经历', 'STAR', '量化结果', '竞争力', '流水账'])) {
    return 'experience_rewrite';
  }

  if (
    includesAny(text, ['整理一下我过去做过的几个项目', '项目复盘', '复盘项目', '总结经验', '以后复盘']) &&
    !hasJobContext(text)
  ) {
    return 'project_retrospective';
  }

  if (
    includesAny(text, ['脑子很乱', '不知道该先做什么', '不知道先做什么', '越想越乱', '今晚想动起来']) &&
    !includesAny(text, ['简历', '作品集', '财务', '报表', '短视频'])
  ) {
    return 'clarification_flow';
  }

  return 'generic_document';
}

function archetypeFromContract(contractId: OutputContractId): ProblemArchetype {
  if (contractId === 'rubric_assignment' || contractId === 'rubric_self_assessment') return 'rubric';
  if (contractId === 'project_retrospective' || contractId === 'message_draft' || contractId === 'generic_document') return 'generic';
  return contractId;
}

function outputTypeFromContract(contractId: OutputContractId, rawProblem: string): OutputType {
  if (contractId === 'message_draft') return 'message';
  if (contractId === 'analysis_table' || contractId === 'metric_analysis') return 'table';
  if (contractId === 'clarification_flow' || contractId === 'risk_plan') return 'workflow';
  if (contractId === 'generic_document') {
    if (includesAny(rawProblem, ['财务报表', '报表', '销售表', '表格', 'Excel'])) return 'table';
    if (includesAny(rawProblem, ['工作流程很乱', '流程很乱', '每天先做什么', '优先级'])) return 'workflow';
    if (includesAny(rawProblem, ['短视频', '分镜', '脚本', '素材', '工作流'])) return 'mixed';
    return 'document';
  }
  return 'mixed';
}

function centerOutputName(contractId: OutputContractId, rawProblem: string): string {
  const names: Record<OutputContractId, string> = {
    message_draft: '可直接发送的消息草稿',
    research_report: '调研汇报结构 / 资料组织框架',
    analysis_table: includesAny(rawProblem, ['销售表', '卖得最好'])
      ? '销售数据分析表 / 下一步动作'
      : includesAny(rawProblem, ['财务报表', '报表'])
        ? '可汇报的数据表 / 报表结构'
        : '原因分析表 / 调整方案',
    rubric_assignment: '作业说明 / 评分标准',
    rubric_self_assessment: '自评评分标准 / 每日记录表',
    validation_plan: '产品验证方案 / MVP 范围',
    metric_analysis: '业务指标分析结论 / 异常解释表',
    risk_plan: '改造方案 / 风险计划',
    experience_rewrite: '项目经历优化方案',
    project_retrospective: '项目复盘结构 / 经验整理表',
    clarification_flow: '问题澄清流程 / 下一步行动判断',
    generic_document: includesAny(rawProblem, ['短视频', '视频方案', '分镜', '脚本'])
      ? '可复用内容模板 / 生产流程'
      : includesAny(rawProblem, ['工作流程很乱', '每天先做什么'])
        ? '每日执行流程 / 工作安排系统'
        : includesAny(rawProblem, ['材料'])
          ? '材料修改方案 / 修改框架'
          : includesAny(rawProblem, ['财务报表', '报表'])
            ? '可汇报的数据表 / 报表结构'
            : '通用成果结构 / 第一版交付物',
  };

  return names[contractId];
}

function inferAction(rawProblem: string): UserAction {
  if (includesAny(rawProblem, ['发消息', '怎么说', '询问'])) return 'ask';
  if (includesAny(rawProblem, ['评分标准', '自评', '打分'])) return 'score';
  if (includesAny(rawProblem, ['复盘', '总结经验'])) return 'review';
  if (includesAny(rawProblem, ['改', '修改', '优化', '改写'])) return 'edit';
  if (includesAny(rawProblem, ['分析', '看看', '诊断'])) return 'analyze';
  if (includesAny(rawProblem, ['整理', '规范', '归纳'])) return 'organize';
  if (includesAny(rawProblem, ['比较', '选择', '选'])) return 'compare';
  if (includesAny(rawProblem, ['计划', '规划', '安排'])) return 'plan';
  if (includesAny(rawProblem, ['变成', '转成', '生成', '做成'])) return 'transform';
  if (includesAny(rawProblem, ['决定', '判断'])) return 'decide';
  if (includesAny(rawProblem, ['执行', '落地', '开始'])) return 'execute';
  if (includesAny(rawProblem, ['做', '写', '创建', '准备'])) return 'create';
  return 'unknown';
}

function inferObject(rawProblem: string, contractId: OutputContractId): string {
  if (contractId === 'message_draft') return '消息';
  if (contractId === 'research_report') return '调研汇报';
  if (contractId === 'analysis_table') return includesAny(rawProblem, ['销售表']) ? '销售表' : '经营/数据分析表';
  if (contractId === 'rubric_assignment') return '作业说明和评分标准';
  if (contractId === 'rubric_self_assessment') return '自评评分标准';
  if (contractId === 'validation_plan') return '产品验证计划';
  if (contractId === 'metric_analysis') return '业务指标分析';
  if (contractId === 'risk_plan') return '风险计划';
  if (contractId === 'experience_rewrite') return '项目经历';
  if (contractId === 'project_retrospective') return '项目复盘';
  if (contractId === 'clarification_flow') return '当前混乱问题';
  if (includesAny(rawProblem, ['短视频'])) return '短视频模板';
  if (includesAny(rawProblem, ['材料'])) return '材料';
  if (includesAny(rawProblem, ['财务报表'])) return '财务报表';
  return '第一版成果';
}

function inferAudience(rawProblem: string, supportText: string): string | undefined {
  const text = compactText([rawProblem, supportText]);
  if (includesAny(text, ['老师'])) return '老师';
  if (includesAny(text, ['学生'])) return '学生';
  if (includesAny(text, ['业务负责人'])) return '业务负责人';
  if (includesAny(text, ['招聘方', '招聘者', '岗位', '投递'])) return '招聘方';
  if (includesAny(text, ['团队'])) return '团队';
  if (includesAny(text, ['用户'])) return '目标用户';
  if (includesAny(text, ['自己', '自评'])) return '自己';
  return undefined;
}

function inferInputAssets(rawProblem: string, supportText: string): ProblemFrame['inputAssets'] {
  const text = compactText([rawProblem, supportText]);
  const assets: ProblemFrame['inputAssets'] = [];

  if (includesAny(text, ['我有一份', '已有', '下面是', '以下是', '这是我的', '草稿', '材料'])) {
    assets.push({ type: 'draft', state: 'described', description: '用户描述了已有材料或草稿。' });
  }
  if (includesAny(text, ['数据', '流水', '表格', '销售表', '记录', 'DAU', '转化率', '留存'])) {
    assets.push({ type: 'data', state: 'described', description: '用户提到需要处理的数据或指标。' });
  }
  if (includesAny(text, ['参考', '仿照', '案例', '样例', '模版', '模板', '竞品'])) {
    assets.push({ type: 'reference', state: 'described', description: '用户提到参考对象或样例。' });
  }
  if (includesAny(text, ['素材', '图片', '照片', '画面', '截图'])) {
    assets.push({ type: 'image', state: 'described', description: '用户提到视觉素材或图片资料。' });
  }

  return assets.length > 0 ? assets : [{ type: 'none', state: 'missing', description: '用户尚未提供明确材料，只描述了想推进的问题。' }];
}

function inferTransformation(rawProblem: string, contractId: OutputContractId): string[] {
  const map: Record<OutputContractId, string[]> = {
    message_draft: ['明确消息目的', '组织语气', '生成可发送版本', '生成更礼貌版本'],
    research_report: ['调研组织', '资料整理', '汇报结构', '内容大纲', '检查清单'],
    analysis_table: ['字段设计', '原因判断', '反馈/数据分类', '行动建议'],
    rubric_assignment: ['任务说明', '提交物定义', '评分维度', '误解提示', '发布文案'],
    rubric_self_assessment: ['自评维度', '评分等级', '每日记录', '改进建议', '复盘问题'],
    validation_plan: ['假设拆解', '访谈问题', 'MVP范围', '验证指标', '执行计划'],
    metric_analysis: ['指标变化', '异常解释', '影响范围', '验证方式', '汇报表达'],
    risk_plan: ['任务拆解', '风险识别', '灰度策略', '回滚方案', '团队说明'],
    experience_rewrite: ['经历诊断', 'STAR改写', '量化补充', '投递检查'],
    project_retrospective: ['项目复盘', '记录表', '经验总结', '下次改进'],
    clarification_flow: ['问题分类', '快速澄清', '最小行动', '继续补充'],
    generic_document: ['明确目标', '生成第一版材料', '检查可用性'],
  };

  const transformations = [...map[contractId]];

  if (includesAny(rawProblem, ['短视频', '视频方案', '分镜', '脚本'])) {
    transformations.push('参考拆解', '生成脚本', '生成分镜', '整理素材', '形成生产流程');
  }
  if (includesAny(rawProblem, ['财务报表', '报表'])) {
    transformations.push('字段设计', '计算逻辑', '说明文案');
  }
  if (includesAny(rawProblem, ['工作流程很乱', '每天先做什么'])) {
    transformations.push('任务拆解', '优先级规则', '每日执行SOP');
  }
  if (includesAny(rawProblem, ['材料', '不知道怎么改'])) {
    transformations.push('结构诊断', '表达改写', '检查清单');
  }

  return Array.from(new Set(transformations));
}

function inferMissingInfo(contractId: OutputContractId): string[] {
  const map: Record<OutputContractId, string[]> = {
    message_draft: ['接收方', '询问事项', '希望对方回复什么'],
    research_report: ['调研主题', '接收对象', '展示形式'],
    analysis_table: ['时间范围', '对比对象', '数据字段'],
    rubric_assignment: ['课程主题', '提交形式', '评分维度'],
    rubric_self_assessment: ['自评对象', '评分频率', '改进动作'],
    validation_plan: ['目标用户', '核心假设', '判断标准'],
    metric_analysis: ['对比周期', '异常区间', '业务背景'],
    risk_plan: ['改造范围', '影响对象', '回滚方案'],
    experience_rewrite: ['目标岗位', '项目背景', '结果数据'],
    project_retrospective: ['项目名称', '当时目标', '结果如何'],
    clarification_flow: ['当前脑中任务', '最急的一件事', '今晚可完成动作'],
    generic_document: ['目标对象', '已有材料', '完成标准'],
  };

  return map[contractId];
}

export function buildProblemFrame(profile: FutureProfile): ProblemFrame {
  const rawProblem = getRawProblem(profile);
  const supportText = getSupportText(profile);
  const contractId = inferContractId(rawProblem, supportText);
  const archetype = archetypeFromContract(contractId);
  const centerOutput = {
    name: centerOutputName(contractId, rawProblem),
    outputType: outputTypeFromContract(contractId, rawProblem),
  };
  const action = inferAction(rawProblem);
  const transformationNeeded = inferTransformation(rawProblem, contractId);
  const inputAssets = inferInputAssets(rawProblem, supportText);
  const missingInfo = inferMissingInfo(contractId);
  const object = inferObject(rawProblem, contractId);
  const audience = inferAudience(rawProblem, supportText);

  return {
    rawProblem,
    supportText,
    userNeed: `用户想把当前问题推进成：${centerOutput.name}`,
    centerOutput,
    archetype,
    contractId,
    object,
    action,
    audience,
    outputNeed: profile.desiredOutcome || profile.currentGoal || undefined,
    currentBlocker: {
      action,
      reason: `当前阻碍是“${object}”还没有被拆成符合使用场景的成果契约、必要字段和可复制内容。`,
    },
    inputAssets,
    transformationNeeded,
    constraints: {
      time: profile.weeklyTime || undefined,
      qualityBar: profile.currentAnxiety || undefined,
      format: profile.desiredOutcome || undefined,
      risk: profile.riskPreference || undefined,
    },
    successCriteria: [
      `产出一版${centerOutput.name}`,
      '结构完整，必要字段齐全',
      '有可复制内容，能直接拿走使用',
    ],
    missingInfo,
    confidence: rawProblem === '用户还没有说清楚当前问题。' ? 0.35 : 0.82,
  };
}
