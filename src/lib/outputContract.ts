import type { SolutionResult } from '@/types/radar';
import type { OutputContractId, ProblemFrame } from './problemFrameEngine';
import { getOutputContractSchema, type OutputContractSchema } from './outputContractSchemas';

export type DeliverableType =
  | 'table'
  | 'document'
  | 'workflow'
  | 'script'
  | 'checklist'
  | 'prompt'
  | 'message'
  | 'outline'
  | 'diagnosis'
  | 'plan'
  | 'research_report'
  | 'analysis_table'
  | 'rubric'
  | 'rubric_assignment'
  | 'rubric_self_assessment'
  | 'validation_plan'
  | 'metric_analysis'
  | 'risk_plan'
  | 'experience_rewrite'
  | 'project_retrospective'
  | 'clarification_flow'
  | 'business_solution_workflow'
  | 'generic_document'
  | 'mixed';

export type OutputContract = {
  contractId: OutputContractId;
  schema: OutputContractSchema;
  title: string;
  deliverables: Array<{
    id: string;
    type: DeliverableType;
    title: string;
    purpose: string;
    contentRules: string[];
    suggestedSections: string[];
    requiredSlots: string[];
  }>;
  copyableBlocks: Array<{
    title: string;
    type: 'template' | 'table' | 'formula' | 'script' | 'checklist' | 'message' | 'outline';
    required: boolean;
  }>;
  clarificationQuestions: Array<{
    question: string;
    reason: string;
    affects: string;
  }>;
  refinementRules: Array<{
    ifUserAdds: string;
    adjust: string;
  }>;
  mustAvoidAssumptions: string[];
  qualityRules: string[];
};

export type OutputQualityCheck = {
  passed: boolean;
  missingSections: string[];
  missingCopyables: string[];
  missingSlots: string[];
  forbiddenTerms: string[];
  duplicateSectionHeadings: string[];
  duplicateCopyableTitles: string[];
  hasFallbackTitle: boolean;
};

function deliverableTypeForSection(contractId: OutputContractId, section: string): DeliverableType {
  if (contractId === 'message_draft') return section.includes('消息') || section.includes('版本') ? 'message' : 'document';
  if (contractId === 'research_report') return section.includes('清单') ? 'checklist' : 'research_report';
  if (contractId === 'analysis_table') return section.includes('动作') ? 'plan' : 'analysis_table';
  if (contractId === 'rubric_assignment') return section.includes('评分') ? 'rubric_assignment' : section.includes('清单') ? 'checklist' : 'document';
  if (contractId === 'rubric_self_assessment') return section.includes('表') || section.includes('等级') ? 'rubric_self_assessment' : 'checklist';
  if (contractId === 'validation_plan') return section.includes('访谈') ? 'message' : section.includes('计划') ? 'plan' : 'validation_plan';
  if (contractId === 'metric_analysis') return section.includes('模板') ? 'document' : 'metric_analysis';
  if (contractId === 'risk_plan') return section.includes('文案') ? 'document' : section.includes('清单') ? 'risk_plan' : 'workflow';
  if (contractId === 'experience_rewrite') return section.includes('模板') || section.includes('描述') ? 'experience_rewrite' : 'checklist';
  if (contractId === 'project_retrospective') return section.includes('表') ? 'table' : 'document';
  if (contractId === 'clarification_flow') return section.includes('表') ? 'clarification_flow' : 'workflow';
  if (contractId === 'business_solution_workflow') {
    if (section.includes('SOP') || section.includes('流程') || section.includes('步骤')) return 'workflow';
    if (section.includes('数据') || section.includes('工具') || section.includes('人员')) return 'table';
    if (section.includes('说明') || section.includes('需求文档')) return 'document';
    return 'business_solution_workflow';
  }
  if (section.includes('表')) return 'table';
  if (section.includes('流程') || section.includes('SOP')) return 'workflow';
  if (section.includes('脚本')) return 'script';
  if (section.includes('清单')) return 'checklist';
  return 'generic_document';
}

function copyableTypeForTitle(title: string): OutputContract['copyableBlocks'][number]['type'] {
  if (title.includes('表')) return 'table';
  if (title.includes('消息')) return 'message';
  if (title.includes('脚本')) return 'script';
  if (title.includes('清单') || title.includes('行动')) return 'checklist';
  if (title.includes('结构')) return 'outline';
  return 'template';
}

function buildDeliverables(frame: ProblemFrame, schema: OutputContractSchema): OutputContract['deliverables'] {
  return schema.requiredSections.map((section, index) => ({
    id: `${schema.id}-section-${index + 1}`,
    type: deliverableTypeForSection(schema.id, section),
    title: section,
    purpose: `生成「${section}」，使「${frame.centerOutput.name}」满足 ${schema.label} 的成果契约。`,
    contentRules: [
      ...schema.qualityRules,
      `必须体现这些槽位：${schema.requiredSlots.join(' / ')}`,
      '不能只给抽象建议，要给字段、步骤、段落或检查项。',
    ],
    suggestedSections: [section],
    requiredSlots: schema.requiredSlots,
  }));
}

function buildCopyableBlocks(schema: OutputContractSchema): OutputContract['copyableBlocks'] {
  return schema.requiredCopyables.map(title => ({
    title,
    type: copyableTypeForTitle(title),
    required: true,
  }));
}

function duplicateItems(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return Array.from(duplicates);
}

function sourceContains(sourceText: string, term: string): boolean {
  return sourceText.includes(term);
}

export function validateAgainstContract(
  result: Pick<SolutionResult, 'usableOutput' | 'copyableTemplates'>,
  schema: OutputContractSchema,
  sourceText: string
): OutputQualityCheck {
  const sectionHeadings = result.usableOutput.sections.map(section => section.heading.replace(/^\d+\.\s*/, ''));
  const copyableTitles = result.copyableTemplates.map(template => template.title);
  const fullText = [
    result.usableOutput.title,
    ...result.usableOutput.sections.flatMap(section => [section.heading, section.content]),
    ...result.copyableTemplates.flatMap(template => [template.title, template.content]),
  ].join('\n');

  const missingSections = schema.requiredSections.filter(required =>
    !sectionHeadings.some(heading => heading.includes(required) || required.includes(heading))
  );
  const missingCopyables = schema.requiredCopyables.filter(required =>
    !copyableTitles.some(title => title.includes(required) || required.includes(title))
  );
  const missingSlots = schema.requiredSlots.filter(slot => !fullText.includes(slot));
  const forbiddenTerms = (schema.forbiddenTerms ?? []).filter(term => {
    if (!fullText.includes(term)) return false;
    if (schema.allowForbiddenTermsIfSourceMentions && sourceContains(sourceText, term)) return false;
    return true;
  });
  const duplicateSectionHeadings = duplicateItems(sectionHeadings);
  const duplicateCopyableTitles = duplicateItems(copyableTitles);
  const hasFallbackTitle = fullText.includes('可展示方案 / 初版表达材料');

  return {
    passed:
      missingSections.length === 0 &&
      missingCopyables.length === 0 &&
      forbiddenTerms.length === 0 &&
      duplicateSectionHeadings.length === 0 &&
      duplicateCopyableTitles.length === 0 &&
      !hasFallbackTitle,
    missingSections,
    missingCopyables,
    missingSlots,
    forbiddenTerms,
    duplicateSectionHeadings,
    duplicateCopyableTitles,
    hasFallbackTitle,
  };
}

export function buildOutputContract(frame: ProblemFrame): OutputContract {
  const contractId = frame.contractId ?? 'generic_document';
  const baseSchema = getOutputContractSchema(contractId);
  const schema = contractId === 'generic_document'
    ? {
        ...baseSchema,
        requiredSections:
          frame.centerOutput.outputType === 'workflow'
            ? ['执行流程', '优先级规则', '每日执行 SOP']
            : frame.centerOutput.outputType === 'mixed' && frame.transformationNeeded.some(item => item.includes('分镜') || item.includes('素材'))
              ? ['参考拆解框架', '脚本结构', '分镜结构', '素材整理清单', '生产流程']
              : frame.centerOutput.outputType === 'table'
                ? ['数据字段表', '原因判断维度', '反馈 / 数据分类表', '可能原因', '下一步调整动作']
                : baseSchema.requiredSections,
        requiredCopyables:
          frame.centerOutput.outputType === 'workflow'
            ? ['每日执行 SOP', '优先级表']
            : frame.centerOutput.outputType === 'mixed' && frame.transformationNeeded.some(item => item.includes('分镜') || item.includes('素材'))
              ? ['短视频模板拆解表', '30-60 秒脚本模板', '分镜表', '素材清单', '短视频生产 SOP']
              : frame.centerOutput.outputType === 'table'
                ? ['分析字段表', '原因判断表', '下一步调整动作']
                : baseSchema.requiredCopyables,
      }
    : baseSchema;
  const deliverables = buildDeliverables(frame, schema);

  return {
    contractId,
    schema,
    title: `${frame.centerOutput.name}第一版`,
    deliverables,
    copyableBlocks: buildCopyableBlocks(schema),
    clarificationQuestions: schema.requiredSlots.slice(0, 3).map(slot => ({
      question: `${slot}是什么？`,
      reason: '这会影响成果是否贴近真实使用场景。',
      affects: frame.centerOutput.name,
    })),
    refinementRules: [
      {
        ifUserAdds: '补充目标对象或使用场景',
        adjust: '调整成果结构、语气和字段重点。',
      },
      {
        ifUserAdds: '补充已有材料或数据',
        adjust: '把材料映射到对应字段、步骤或内容块。',
      },
      {
        ifUserAdds: '补充格式要求或时间限制',
        adjust: '收窄交付范围，优先生成最小可用版本。',
      },
    ],
    mustAvoidAssumptions: [
      '不要默认用户的行业、岗位或身份。',
      '不要把“材料”默认理解成简历或作品集。',
      '不要把“评分标准”默认理解成教师作业评分，先看受众和对象。',
      '不要把“数据分析”默认理解成 DAU/留存/转化率，先看数据对象。',
    ],
    qualityRules: schema.qualityRules,
  };
}
