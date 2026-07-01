import type { OutputContractId } from './problemFrameEngine';

export type InputMode =
  | 'problem_only'
  | 'asset_only'
  | 'problem_plus_asset';

export type InputAssetType =
  | 'resume_project'
  | 'report_draft'
  | 'assignment_requirement'
  | 'business_idea'
  | 'table_like_text'
  | 'copywriting_draft'
  | 'generic_material'
  | 'unknown';

export type EvidenceSnippet = {
  label: string;
  text: string;
  reason: string;
};

export type InputAssetFrame = {
  inputMode: InputMode;
  rawAssetText: string;
  assetType: InputAssetType;
  assetSummary: string;
  detectedStructure: string[];
  usableParts: string[];
  mainProblems: string[];
  missingParts: string[];
  rewriteTargets: string[];
  evidenceSnippets: EvidenceSnippet[];
  riskFlags: string[];
  suggestedContractId?: OutputContractId;
  confidence: number;
};

type AnalyzeInput = {
  rawProblem: string;
  supportText?: string;
  attachedText?: string;
};

const ASSET_PREFIX_PATTERN = /(这是我的|以下是|下面是|材料[:：]|内容[:：]|项目经历[:：]|文案[:：]|数据[:：]|草稿[:：]|我写的|我有一份|有一份|老师要求)/i;
const REQUEST_PATTERN = /(我想|我需要|我希望|帮我|不知道|怎么|想得到|目标是|用于|投递|分析|修改|改写|整理|生成|判断|验证|做一版|做一个)/i;
const BUSINESS_IDEA_PATTERN = /(产品想法|用户需不需要|需不需要|MVP|目标用户|竞品|没人用|验证|访谈)/i;
const TABLE_LIKE_PATTERN = /(产品A|产品B|产品C|卖了|销量|销售额|订单|数据|字段|排名|占比|\d+\s*(件|个|元|单|%))/i;
const ASSIGNMENT_PATTERN = /(老师要求|作业要求|提交|评分|课程|要包括|截止)/i;

function compactText(values: Array<string | undefined>): string {
  return values.map(value => value?.trim()).filter(Boolean).join(' ').trim();
}

function includesAny(text: string, words: string[]): boolean {
  return words.some(word => text.includes(word));
}

function clipSnippet(text: string, maxLength = 72): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

function splitUsefulFragments(text: string): string[] {
  return text
    .split(/[\n。；;]+/)
    .map(item => item.trim())
    .filter(item => item.length >= 4)
    .slice(0, 5);
}

function pickAssetText(input: AnalyzeInput): { text: string; source: 'attached' | 'support' | 'raw' | 'none' } {
  const attached = input.attachedText?.trim();
  if (attached) return { text: attached.slice(0, 5000), source: 'attached' };

  const support = input.supportText?.trim() ?? '';
  if (support && (ASSET_PREFIX_PATTERN.test(support) || support.length > 160)) {
    return { text: support.slice(0, 5000), source: 'support' };
  }

  const raw = input.rawProblem?.trim() ?? '';
  if (raw && (
    ASSET_PREFIX_PATTERN.test(raw) ||
    BUSINESS_IDEA_PATTERN.test(raw) ||
    TABLE_LIKE_PATTERN.test(raw) ||
    ASSIGNMENT_PATTERN.test(raw) ||
    raw.length > 180
  )) {
    return { text: raw.slice(0, 5000), source: 'raw' };
  }

  return { text: '', source: 'none' };
}

function inferInputMode(input: AnalyzeInput, assetText: string, source: 'attached' | 'support' | 'raw' | 'none'): InputMode {
  if (!assetText) return 'problem_only';

  const rawProblem = input.rawProblem?.trim() ?? '';
  const supportText = input.supportText?.trim() ?? '';
  const hasRequest = REQUEST_PATTERN.test(compactText([rawProblem, supportText]));

  if (source === 'attached') return hasRequest ? 'problem_plus_asset' : 'asset_only';
  if (source === 'raw') {
    return hasRequest && ASSET_PREFIX_PATTERN.test(rawProblem) && rawProblem.length > 28
      ? 'problem_plus_asset'
      : 'asset_only';
  }
  if (source === 'support') return rawProblem ? 'problem_plus_asset' : 'asset_only';

  return 'problem_only';
}

function inferAssetType(assetText: string, fullText: string): InputAssetType {
  if (!assetText) return 'unknown';

  const jobContext = includesAny(fullText, ['投递', '岗位', '求职', '简历', '面试', '招聘', 'UI 岗', 'UI设计岗位', '设计岗']);
  if (
    jobContext &&
    includesAny(fullText, ['项目经历', '实习经历', '负责', '参与', '完成', '个人贡献', '结果', '作品集'])
  ) {
    return 'resume_project';
  }

  if (
    includesAny(fullText, ['产品想法', '用户需不需要', '需不需要', 'MVP', '目标用户', '竞品', '没人用', '验证', '访谈']) &&
    includesAny(fullText, ['产品', '用户', 'AI', 'MVP', '验证'])
  ) {
    return 'business_idea';
  }

  if (
    includesAny(fullText, ['老师要求', '作业要求', '提交', '评分', '课程', '要包括', '截止']) &&
    includesAny(fullText, ['作业', 'PPT', '调研', '老师', '提交'])
  ) {
    return 'assignment_requirement';
  }

  if (
    includesAny(fullText, ['汇报内容', '调研汇报', 'PPT', '第一部分', '第二部分', '第三部分', '照片', '资料', '感受', '结论']) &&
    includesAny(fullText, ['汇报', '调研', 'PPT', '内容'])
  ) {
    return 'report_draft';
  }

  if (
    includesAny(fullText, ['产品A', '产品B', '产品C', '卖了', '销量', '销售额', '订单', '数据', '字段', '排名', '占比']) ||
    /\d+\s*(件|个|元|单|%)/.test(assetText) && includesAny(fullText, ['产品', '销售', '卖', '数据', '排名'])
  ) {
    return 'table_like_text';
  }

  if (
    includesAny(fullText, ['品牌介绍', '宣传语', '文案', 'slogan', 'Slogan', '介绍', '我们品牌', '产品很好', '适合年轻人'])
  ) {
    return 'copywriting_draft';
  }

  return ASSET_PREFIX_PATTERN.test(assetText) || assetText.length > 0 ? 'generic_material' : 'unknown';
}

function contractForAsset(assetType: InputAssetType, fullText: string): OutputContractId | undefined {
  if (assetType === 'resume_project') return 'experience_rewrite';
  if (assetType === 'report_draft') return 'research_report';
  if (assetType === 'assignment_requirement') {
    if (includesAny(fullText, ['给学生', '布置', '评分标准'])) return 'rubric_assignment';
    return 'research_report';
  }
  if (assetType === 'business_idea') return 'validation_plan';
  if (assetType === 'table_like_text') return 'analysis_table';
  if (assetType === 'copywriting_draft') return 'generic_document';
  if (assetType === 'generic_material') return 'generic_document';
  return undefined;
}

function structureForAsset(assetType: InputAssetType, assetText: string): string[] {
  const fragments = splitUsefulFragments(assetText);
  if (assetType === 'table_like_text') return ['包含数字或对比对象', '可以转成字段表和排名表'];
  if (assetType === 'resume_project') return ['包含项目或经历描述', '包含动作但结果不够明确'];
  if (assetType === 'report_draft') return ['包含分段内容', '包含资料/照片/感受/总结等汇报素材'];
  if (assetType === 'assignment_requirement') return ['包含任务要求', '包含提交限制或内容要求'];
  if (assetType === 'business_idea') return ['包含产品设想', '包含用户或验证疑问'];
  if (assetType === 'copywriting_draft') return ['包含一段可改写文案', '表达较概括'];
  if (fragments.length > 0) return fragments.map((_, index) => `第 ${index + 1} 段可整理内容`);
  return [];
}

function problemsForAsset(assetType: InputAssetType): string[] {
  const map: Record<InputAssetType, string[]> = {
    resume_project: ['项目目标不够清楚', '个人贡献和方法没有展开', '结果或反馈缺少证据'],
    report_draft: ['结构顺序偏散', '资料和观点没有对应', '缺少能收束汇报的结论'],
    assignment_requirement: ['任务要求需要拆成可执行步骤', '提交物和检查标准需要明确', '时间安排需要倒排'],
    business_idea: ['核心假设还没有拆开', '目标用户和验证方式不够具体', 'MVP 范围容易过大'],
    table_like_text: ['数据字段还没有结构化', '缺少排序或对比规则', '需要把结论和下一步动作分开'],
    copywriting_draft: ['表达偏泛', '缺少具体卖点或证据', '语气版本没有区分'],
    generic_material: ['材料目的不够清楚', '结构和重点需要重排', '缺少可支撑结论的证据'],
    unknown: [],
  };
  return map[assetType];
}

function missingPartsForAsset(assetType: InputAssetType): string[] {
  const map: Record<InputAssetType, string[]> = {
    resume_project: ['目标岗位', '项目背景', '个人动作', '量化结果或反馈'],
    report_draft: ['汇报主题', '接收对象', '资料来源', '每页重点'],
    assignment_requirement: ['提交格式', '评分重点', '完成时间', '资料来源'],
    business_idea: ['目标用户', '核心痛点', '验证指标', 'MVP 不做什么'],
    table_like_text: ['统计周期', '字段口径', '排序依据', '下一步判断标准'],
    copywriting_draft: ['目标受众', '核心卖点', '语气风格', '使用场景'],
    generic_material: ['材料用途', '目标对象', '核心结论', '证据或示例'],
    unknown: [],
  };
  return map[assetType];
}

function rewriteTargetsForAsset(assetType: InputAssetType): string[] {
  const map: Record<InputAssetType, string[]> = {
    resume_project: ['STAR 项目经历', '可替换项目描述', '量化结果补充问题'],
    report_draft: ['重组后的汇报结构', '每页内容安排', '开头介绍模板'],
    assignment_requirement: ['任务拆解', '资料清单', '时间安排', '提交检查'],
    business_idea: ['核心假设', '访谈问题', 'MVP 范围', '两周验证计划'],
    table_like_text: ['数据字段表', '排名 / 对比表', '初步结论', '下一步动作'],
    copywriting_draft: ['改写版本', '更正式版本', '更简洁版本', '修改说明'],
    generic_material: ['结构整理', '可复制改写版本', '补充问题'],
    unknown: [],
  };
  return map[assetType];
}

function evidenceFromText(assetText: string, assetType: InputAssetType): EvidenceSnippet[] {
  return splitUsefulFragments(assetText).slice(0, 3).map((fragment, index) => ({
    label: index === 0 ? '原文线索' : `原文线索 ${index + 1}`,
    text: clipSnippet(fragment),
    reason: assetType === 'unknown' ? '用于判断输入是否包含材料' : '用于支撑材料诊断，不返回完整原文',
  }));
}

function riskFlagsForText(assetText: string, inputMode: InputMode): string[] {
  const flags: string[] = [];
  if (assetText.length > 4000) flags.push('too_long');
  if (assetText.length > 0 && assetText.length < 12) flags.push('too_short');
  if (/忽略以上|ignore previous|system prompt|开发者指令/i.test(assetText)) {
    flags.push('possible_prompt_instruction');
  }
  if (inputMode !== 'problem_only' && !ASSET_PREFIX_PATTERN.test(assetText) && assetText.length < 40) {
    flags.push('unclear_asset_boundary');
  }
  return flags;
}

function confidenceFor(inputMode: InputMode, assetType: InputAssetType, riskFlags: string[]): number {
  if (inputMode === 'problem_only') return 0.25;
  if (riskFlags.includes('too_short')) return 0.45;
  if (assetType === 'generic_material') return 0.62;
  if (assetType === 'unknown') return 0.35;
  return inputMode === 'problem_plus_asset' ? 0.86 : 0.78;
}

export function analyzeInputAsset(input: AnalyzeInput): InputAssetFrame {
  const picked = pickAssetText(input);
  const rawProblem = input.rawProblem?.trim() ?? '';
  const supportText = input.supportText?.trim() ?? '';
  const fullText = compactText([rawProblem, supportText, picked.text]);
  const inputMode = inferInputMode(input, picked.text, picked.source);
  const assetType = inputMode === 'problem_only' ? 'unknown' : inferAssetType(picked.text, fullText);
  const riskFlags = riskFlagsForText(picked.text, inputMode);
  const suggestedContractId = inputMode === 'problem_only' ? undefined : contractForAsset(assetType, fullText);
  const detectedStructure = inputMode === 'problem_only' ? [] : structureForAsset(assetType, picked.text);
  const usableParts = inputMode === 'problem_only'
    ? []
    : splitUsefulFragments(picked.text).slice(0, 4).map(fragment => clipSnippet(fragment));

  return {
    inputMode,
    rawAssetText: picked.text,
    assetType,
    assetSummary: picked.text
      ? `识别到${assetType === 'generic_material' ? '一段通用材料' : assetType}，约 ${picked.text.length} 字。`
      : '未识别到需要分析的粘贴材料。',
    detectedStructure,
    usableParts,
    mainProblems: inputMode === 'problem_only' ? [] : problemsForAsset(assetType),
    missingParts: inputMode === 'problem_only' ? [] : missingPartsForAsset(assetType),
    rewriteTargets: inputMode === 'problem_only' ? [] : rewriteTargetsForAsset(assetType),
    evidenceSnippets: inputMode === 'problem_only' ? [] : evidenceFromText(picked.text, assetType),
    riskFlags,
    suggestedContractId,
    confidence: confidenceFor(inputMode, assetType, riskFlags),
  };
}
