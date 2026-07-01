import type { SolutionResult } from '@/types/radar';

export const SOLUTION_WORKSPACE_STORAGE_KEY = 'futurelens-solution-workspace-v1';

export type SolutionRevisionMode = 'revise' | 'finalize' | 'action';

export type SolutionRevisionRecord = {
  id: string;
  instruction: string;
  mode: SolutionRevisionMode;
  createdAt: string;
  result: SolutionResult;
};

export type SolutionWorkspaceState = {
  version: 1;
  problemText: string;
  materialSummary?: string;
  contractId?: string;
  currentResult: SolutionResult;
  revisions: SolutionRevisionRecord[];
  updatedAt: string;
};

export function createSolutionWorkspaceState(input: {
  problemText: string;
  currentResult: SolutionResult;
  contractId?: string;
  materialSummary?: string;
  now?: string;
}): SolutionWorkspaceState {
  const updatedAt = input.now ?? new Date().toISOString();

  return {
    version: 1,
    problemText: input.problemText,
    materialSummary: input.materialSummary,
    contractId: input.contractId,
    currentResult: input.currentResult,
    revisions: [],
    updatedAt,
  };
}

export function appendSolutionRevision(
  state: SolutionWorkspaceState,
  revision: Omit<SolutionRevisionRecord, 'id' | 'createdAt'> & {
    id?: string;
    createdAt?: string;
  }
): SolutionWorkspaceState {
  const createdAt = revision.createdAt ?? new Date().toISOString();
  const record: SolutionRevisionRecord = {
    id: revision.id ?? `rev-${createdAt}-${state.revisions.length + 1}`,
    instruction: revision.instruction,
    mode: revision.mode,
    createdAt,
    result: revision.result,
  };

  return {
    ...state,
    currentResult: revision.result,
    revisions: [...state.revisions, record],
    updatedAt: createdAt,
  };
}

export function serializeSolutionWorkspaceState(state: SolutionWorkspaceState): string {
  return JSON.stringify(state);
}

export function parseSolutionWorkspaceState(value: string | null): SolutionWorkspaceState | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<SolutionWorkspaceState>;
    if (parsed.version !== 1) return null;
    if (!parsed.problemText || !parsed.currentResult?.usableOutput) return null;
    if (!Array.isArray(parsed.revisions)) return null;

    return parsed as SolutionWorkspaceState;
  } catch {
    return null;
  }
}

function hashText(text: string): string {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function summarizeWorkspaceText(text: string, label = '输入'): string {
  const trimmed = text.trim();
  const looksLikeMaterial = /(这是我的|以下是|下面是|材料|文案|简历|项目经历|汇报稿|作品|报告|草稿)/.test(trimmed);
  if (trimmed.length <= 180 && !(looksLikeMaterial && trimmed.length > 80)) {
    return trimmed;
  }

  return `${label}摘要（约${trimmed.length}字，ID ${hashText(trimmed)}）`;
}

export function inferRevisionMode(instruction: string): SolutionRevisionMode {
  const text = instruction.toLowerCase();
  if (/(最终版|最终稿|只要最终|可复制|不要解释|final)/i.test(text)) return 'finalize';
  if (/(执行步骤|行动清单|下一步怎么做|今天做什么|action|checklist)/i.test(text)) return 'action';
  return 'revise';
}

export function inferContractIdFromResult(result?: SolutionResult): string | undefined {
  if (!result) return undefined;
  const text = [
    result.usableOutput.title,
    ...result.usableOutput.sections.map(section => `${section.heading} ${section.content}`),
    ...result.copyableTemplates.map(template => `${template.title} ${template.content}`),
  ].join('\n');

  if (/(STAR|项目经历|投递|简历|岗位)/i.test(text)) return 'experience_rewrite';
  if (/(调研汇报|课堂|老师|PPT|每页|资料整理)/i.test(text)) return 'research_report';
  if (/(MVP|验证|访谈|核心假设|目标用户)/i.test(text)) return 'validation_plan';
  if (/(DAU|转化率|留存|指标|异常波动|业务负责人)/i.test(text)) return 'metric_analysis';
  if (/(字段名|计算|数据字段|表格|销售|营业额|报表)/i.test(text)) return 'analysis_table';
  return 'generic_document';
}

export function getRevisionSuggestions(contractId?: string, result?: SolutionResult): string[] {
  const resolvedContractId = contractId ?? inferContractIdFromResult(result);

  if (resolvedContractId === 'research_report') {
    return ['压缩成 5 页 PPT', '补充每页内容', '生成课堂汇报稿', '生成最终版'];
  }

  if (resolvedContractId === 'experience_rewrite') {
    return ['生成简历最终版', '改得更像 UI 设计岗位', '补充量化结果', '压缩成一段项目经历'];
  }

  if (resolvedContractId === 'analysis_table' || resolvedContractId === 'metric_analysis') {
    return ['生成结论摘要', '生成下一步行动清单', '改成汇报给接收方的版本', '生成最终表格说明'];
  }

  if (resolvedContractId === 'validation_plan') {
    return ['生成访谈提纲', '压缩成两周计划', '生成 MVP 功能清单', '生成最终版'];
  }

  return ['生成最终版', '压缩成 PPT 大纲', '生成执行清单', '改得更正式'];
}
