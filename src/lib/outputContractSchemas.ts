import type { OutputContractId, OutputType, ProblemArchetype } from './problemFrameEngine';

export type OutputContractSchema = {
  id: OutputContractId;
  label: string;
  archetype: ProblemArchetype;
  outputType: OutputType;
  requiredSections: string[];
  requiredCopyables: string[];
  requiredSlots: string[];
  forbiddenTerms?: string[];
  allowForbiddenTermsIfSourceMentions?: boolean;
  qualityRules: string[];
};

const schemas: Record<OutputContractId, OutputContractSchema> = {
  message_draft: {
    id: 'message_draft',
    label: '消息草稿',
    archetype: 'generic',
    outputType: 'message',
    requiredSections: ['消息目的', '消息结构', '可复制消息版本', '更礼貌版本', '注意事项'],
    requiredCopyables: ['可直接发送的消息', '更礼貌版本'],
    requiredSlots: ['接收方', '询问事项', '语气', '时间点', '希望对方回复什么'],
    forbiddenTerms: ['可展示方案 / 初版表达材料', '汇报结构', '评分标准表'],
    qualityRules: ['必须直接给可发送文本', '不能误判成调研汇报或评分标准'],
  },
  research_report: {
    id: 'research_report',
    label: '调研汇报',
    archetype: 'research_report',
    outputType: 'mixed',
    requiredSections: ['汇报结构', '每页放什么', '资料整理清单', '开头介绍模板', '完成检查清单'],
    requiredCopyables: ['汇报结构模板', '开头介绍模板', '资料整理清单'],
    requiredSlots: ['调研主题', '接收对象', '已有资料', '展示形式', '完成时间'],
    qualityRules: ['每页必须说明放什么', '资料要对应页面位置', '检查清单要面向可提交成果'],
  },
  analysis_table: {
    id: 'analysis_table',
    label: '分析表',
    archetype: 'analysis_table',
    outputType: 'table',
    requiredSections: ['数据字段表', '原因判断维度', '反馈 / 数据分类表', '可能原因', '下一步调整动作'],
    requiredCopyables: ['分析字段表', '原因判断表', '下一步调整动作'],
    requiredSlots: ['时间范围', '对比对象', '数据字段', '反馈来源', '原因假设', '下一步动作'],
    forbiddenTerms: ['DAU', '留存', '转化率'],
    allowForbiddenTermsIfSourceMentions: true,
    qualityRules: ['经营/销售/反馈分析不能输出高阶互联网指标模板', '销售表必须有产品、销量、销售额、排名、占比、趋势、下一步动作'],
  },
  rubric_assignment: {
    id: 'rubric_assignment',
    label: '作业说明和评分标准',
    archetype: 'rubric',
    outputType: 'mixed',
    requiredSections: ['作业目标', '任务说明', '提交物清单', '评分标准表', '学生常见误解提示', '可复制发布文案'],
    requiredCopyables: ['作业发布文案', '评分标准表'],
    requiredSlots: ['课程主题', '作业目标', '提交形式', '评分维度', '权重', '扣分点'],
    qualityRules: ['必须站在教师发布任务视角', '要让学生知道交什么、怎么评分、哪里容易误解'],
  },
  rubric_self_assessment: {
    id: 'rubric_self_assessment',
    label: '自评评分标准',
    archetype: 'rubric',
    outputType: 'table',
    requiredSections: ['自评维度', '评分等级', '每日记录表', '改进建议', '复盘问题'],
    requiredCopyables: ['每日自评表', '复盘问题'],
    requiredSlots: ['自评对象', '评分频率', '评分等级', '记录方式', '改进动作'],
    forbiddenTerms: ['学生', '提交物', '作业发布文案', '教师视角'],
    allowForbiddenTermsIfSourceMentions: true,
    qualityRules: ['不能出现教师/学生/提交物语境，除非用户原文明确提到', '评分标准要服务个人复盘和改进'],
  },
  validation_plan: {
    id: 'validation_plan',
    label: '验证计划',
    archetype: 'validation_plan',
    outputType: 'mixed',
    requiredSections: ['核心假设拆解', '目标用户', '访谈问题', 'MVP 功能范围', '验证指标', '两周执行计划'],
    requiredCopyables: ['用户访谈问题', 'MVP 范围清单', '两周执行计划'],
    requiredSlots: ['目标用户', '核心假设', '用户痛点', '验证方式', '判断标准', 'MVP 范围', '时间周期'],
    forbiddenTerms: ['地域文化', '每页放什么', '课程作业'],
    qualityRules: ['产品用户调研必须进入验证计划', '不能降级成普通调研汇报或商业计划书'],
  },
  metric_analysis: {
    id: 'metric_analysis',
    label: '业务指标分析',
    archetype: 'metric_analysis',
    outputType: 'mixed',
    requiredSections: ['指标变化表', '异常解释表', '影响范围', '验证方式', '汇报结论模板'],
    requiredCopyables: ['指标变化表', '异常解释表', '汇报结论模板'],
    requiredSlots: ['指标', '当前变化', '对比周期', '异常区间', '影响范围', '可能原因', '验证方式', '下一步建议'],
    forbiddenTerms: ['客流', '菜单', '门店', '顾客评价', '价格问题', '产品问题', '服务问题'],
    allowForbiddenTermsIfSourceMentions: true,
    qualityRules: ['异常解释表必须围绕指标变化，不得混入小商家经营维度', '结论要区分事实、解释、建议'],
  },
  risk_plan: {
    id: 'risk_plan',
    label: '风险计划',
    archetype: 'risk_plan',
    outputType: 'workflow',
    requiredSections: ['改造目标', '任务拆解', '风险清单', '灰度 / 回滚检查', '团队说明文案'],
    requiredCopyables: ['风险清单', '团队说明文案'],
    requiredSlots: ['改造范围', '影响对象', '风险等级', '触发条件', '预防动作', '回滚方案'],
    qualityRules: ['风险必须对应触发条件和回滚方案', '说明文案要能发给团队'],
  },
  experience_rewrite: {
    id: 'experience_rewrite',
    label: '经历改写',
    archetype: 'experience_rewrite',
    outputType: 'mixed',
    requiredSections: ['项目经历诊断', 'STAR 改写模板', '可替换项目描述', '量化结果补充清单', '投递前检查清单'],
    requiredCopyables: ['STAR 项目经历模板', '可替换项目描述', '量化结果补充清单'],
    requiredSlots: ['目标岗位', '项目背景', '个人动作', '结果', '数据证明', '对齐能力'],
    qualityRules: ['只有明确简历/求职/岗位/投递语境才进入经历改写', '不能编造经历数据'],
  },
  project_retrospective: {
    id: 'project_retrospective',
    label: '项目复盘',
    archetype: 'generic',
    outputType: 'document',
    requiredSections: ['项目复盘结构', '项目记录表', '经验总结问题', '下次改进清单'],
    requiredCopyables: ['项目复盘记录表', '经验总结问题'],
    requiredSlots: ['项目名称', '当时目标', '做了什么', '结果如何', '学到什么', '下次怎么改'],
    forbiddenTerms: ['简历', '岗位', '投递', '招聘方'],
    allowForbiddenTermsIfSourceMentions: true,
    qualityRules: ['项目复盘不能自动进入求职语境', '要帮助用户沉淀经验和下次改进'],
  },
  clarification_flow: {
    id: 'clarification_flow',
    label: '澄清流程',
    archetype: 'clarification_flow',
    outputType: 'workflow',
    requiredSections: ['问题分类', '10分钟澄清表', '今晚最小行动', '继续补充问题'],
    requiredCopyables: ['10分钟澄清表', '今晚最小行动'],
    requiredSlots: ['当前脑中任务', '最急的一件事', '可用时间', '最大阻碍', '今晚可完成动作'],
    qualityRules: ['必须承认信息不足，但给出今天可执行的下一步', '不能停在安慰或泛建议'],
  },
  business_solution_workflow: {
    id: 'business_solution_workflow',
    label: '业务解决方案工作流',
    archetype: 'business_workflow',
    outputType: 'workflow',
    requiredSections: [
      '真实问题诊断',
      '当前业务流程拆解',
      'AI/系统方案蓝图',
      '可执行业务工作流',
      '所需数据 / 工具 / 人员',
      '30 天落地步骤',
      '风险与优先级',
      '老板版说明',
      '执行人员 SOP',
      '开发/外包需求文档结构',
    ],
    requiredCopyables: ['老板版说明', '执行人员 SOP', '开发/外包需求文档结构'],
    requiredSlots: ['业务角色', '核心流程', '数据字段', '工具', '人员', '30 天步骤', '风险', '优先级'],
    qualityRules: [
      '必须把经营问题拆成流程、字段、人员和落地步骤',
      '不能只说提升效率、使用 AI、优化流程，必须给具体记录字段和 SOP',
      '第一版只设计业务工作流和系统化方案，不假装已经建设企业后台或 SaaS',
    ],
  },
  generic_document: {
    id: 'generic_document',
    label: '通用成果',
    archetype: 'generic',
    outputType: 'document',
    requiredSections: ['第一版成果', '可复制模板', '检查清单'],
    requiredCopyables: ['可复制模板', '检查清单'],
    requiredSlots: ['目标对象', '已有材料', '完成标准'],
    forbiddenTerms: ['可展示方案 / 初版表达材料'],
    qualityRules: ['不能只输出抽象标题', '必须包含字段、步骤、段落或检查项'],
  },
};

export function getOutputContractSchema(id: OutputContractId): OutputContractSchema {
  return schemas[id] ?? schemas.generic_document;
}

export function listOutputContractSchemas(): OutputContractSchema[] {
  return Object.values(schemas);
}
