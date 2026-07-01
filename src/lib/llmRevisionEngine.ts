import { callDeepSeek } from './deepseek';
import { reviseSolutionResult } from './solutionRevisionEngine';
import type { SolutionRevisionMode } from './solutionWorkspace';
import type { SolutionResult } from '@/types/radar';

type LLMRevisionInput = {
  previousResult: SolutionResult;
  instruction: string;
  mode?: SolutionRevisionMode;
  contractId?: string;
};

type LLMRevisionOptions = {
  callModel?: (prompt: string) => Promise<string>;
};

function stripCodeFence(value: string): string {
  let text = value.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
    text = text.replace(/\s*```$/i, '');
  }
  return text.trim();
}

function compactPreviousResult(result: SolutionResult) {
  return {
    problemCore: result.problemCore,
    skillMatched: result.skillMatched,
    clarifyingQuestions: result.clarifyingQuestions,
    usableOutput: {
      title: result.usableOutput.title,
      sections: result.usableOutput.sections.map(section => ({
        heading: section.heading,
        content: section.content.slice(0, 2400),
      })),
    },
    copyableTemplates: result.copyableTemplates.map(template => ({
      title: template.title,
      content: template.content.slice(0, 2400),
    })),
    nextRefinementPrompt: result.nextRefinementPrompt,
    refinementSummary: result.refinementSummary,
  };
}

function buildPrompt(input: LLMRevisionInput): string {
  const previousJson = JSON.stringify(compactPreviousResult(input.previousResult), null, 2);
  const mode = input.mode ?? 'revise';

  return `你是 FutureLens 的 Smart Revision Engine。

任务：
你只能基于 previousResult 和 instruction 修改当前结果。
不要重新跑 ProblemFrame。
不要重新判断用户问题。
不要引入新的用户问题方向。
previousResult 是上下文，instruction 是唯一修改目标。

mode: ${mode}
contractId: ${input.contractId || 'unknown'}
instruction: ${input.instruction}

previousResult:
${previousJson}

输出要求：
1. 严格返回 JSON，不要 Markdown，不要解释。
2. JSON 必须符合现有 SolutionResult 结构：
{
  "problemCore": {
    "summary": "string",
    "realBlocker": "string",
    "whyItMatters": "string"
  },
  "skillMatched": {
    "name": "string",
    "reason": "string"
  },
  "clarifyingQuestions": ["string"],
  "usableOutput": {
    "title": "string",
    "sections": [
      { "heading": "string", "content": "string" }
    ]
  },
  "copyableTemplates": [
    { "title": "string", "content": "string" }
  ],
  "nextRefinementPrompt": "string",
  "refinementSummary": "string"
}

模式规则：
- revise：保留 previousResult 的核心成果，只按 instruction 改写、压缩、正式化或补充。
- action：输出可执行步骤、行动清单、完成标准。
- finalize：必须输出最终稿，usableOutput.title 必须包含“最终可复制版本”；sections 中必须有“最终可复制版本”；copyableTemplates 中必须有 title 为“最终可复制版本”的内容。去掉诊断、解释、过程分析，保留可直接复制的最终内容。

质量要求：
- 输出必须具体、可复制、可直接使用。
- 不要只写“优化、完善、梳理”这类空泛词。
- 不要丢失 previousResult 里已经有用的字段、表格、模板或结构。
- 如果 instruction 是压缩成 PPT，就输出页码大纲。
- 如果 instruction 是老板/老师/业务负责人汇报，就改成更正式、更适合汇报的表达。
- 如果 instruction 是改短，就压缩而不是重写成新主题。
- 如果 instruction 是生成执行清单，就输出步骤、输入物、输出物、完成标准。`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeSections(value: unknown): SolutionResult['usableOutput']['sections'] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (!isRecord(item)) return null;
      const heading = typeof item.heading === 'string' ? item.heading.trim() : '';
      const content = typeof item.content === 'string' ? item.content.trim() : '';
      if (!heading || !content) return null;
      return { heading, content };
    })
    .filter((item): item is SolutionResult['usableOutput']['sections'][number] => Boolean(item));
}

function normalizeCopyables(value: unknown): SolutionResult['copyableTemplates'] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (!isRecord(item)) return null;
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const content = typeof item.content === 'string' ? item.content.trim() : '';
      if (!title || !content) return null;
      return { title, content };
    })
    .filter((item): item is SolutionResult['copyableTemplates'][number] => Boolean(item));
}

function normalizeQuestions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => typeof item === 'string' ? item.trim() : '')
    .filter(Boolean)
    .slice(0, 4);
}

function coerceSolutionResult(
  parsed: unknown,
  previousResult: SolutionResult,
  mode?: SolutionRevisionMode
): SolutionResult {
  if (!isRecord(parsed)) {
    throw new Error('LLM revision response is not an object.');
  }

  const usableOutput = isRecord(parsed.usableOutput) ? parsed.usableOutput : {};
  const sections = normalizeSections(usableOutput.sections);
  const copyableTemplates = normalizeCopyables(parsed.copyableTemplates);

  if (sections.length === 0 || copyableTemplates.length === 0) {
    throw new Error('LLM revision response is missing usable sections or copyable templates.');
  }

  const problemCore = isRecord(parsed.problemCore) ? parsed.problemCore : {};
  const skillMatched = isRecord(parsed.skillMatched) ? parsed.skillMatched : {};

  let result: SolutionResult = {
    problemCore: {
      summary: typeof problemCore.summary === 'string' ? problemCore.summary : previousResult.problemCore.summary,
      realBlocker: typeof problemCore.realBlocker === 'string' ? problemCore.realBlocker : previousResult.problemCore.realBlocker,
      whyItMatters: typeof problemCore.whyItMatters === 'string' ? problemCore.whyItMatters : previousResult.problemCore.whyItMatters,
    },
    skillMatched: {
      name: typeof skillMatched.name === 'string' ? skillMatched.name as SolutionResult['skillMatched']['name'] : previousResult.skillMatched.name,
      reason: typeof skillMatched.reason === 'string' ? skillMatched.reason : previousResult.skillMatched.reason,
    },
    clarifyingQuestions: normalizeQuestions(parsed.clarifyingQuestions),
    usableOutput: {
      title: typeof usableOutput.title === 'string' && usableOutput.title.trim()
        ? usableOutput.title.trim()
        : previousResult.usableOutput.title,
      sections,
    },
    copyableTemplates,
    nextRefinementPrompt: typeof parsed.nextRefinementPrompt === 'string'
      ? parsed.nextRefinementPrompt
      : previousResult.nextRefinementPrompt,
    refinementSummary: typeof parsed.refinementSummary === 'string'
      ? parsed.refinementSummary
      : '已根据你的指令智能调整当前结果。',
  };

  if (mode === 'finalize') {
    const finalCopy = result.copyableTemplates.find(template => template.title === '最终可复制版本');
    const finalSection = result.usableOutput.sections.find(section => section.heading === '最终可复制版本');
    const fallbackContent = finalCopy?.content || finalSection?.content || result.usableOutput.sections.map(section => section.content).join('\n\n');

    result = {
      ...result,
      clarifyingQuestions: [],
      usableOutput: {
        title: result.usableOutput.title.includes('最终可复制版本')
          ? result.usableOutput.title
          : `最终可复制版本：${result.usableOutput.title}`,
        sections: finalSection
          ? result.usableOutput.sections
          : [{ heading: '最终可复制版本', content: fallbackContent }],
      },
      copyableTemplates: finalCopy
        ? result.copyableTemplates
        : [{ title: '最终可复制版本', content: fallbackContent }, ...result.copyableTemplates],
    };
  }

  if (mode === 'action') {
    const hasActionSection = result.usableOutput.sections.some(section => section.heading.includes('执行清单'));
    const hasActionCopy = result.copyableTemplates.some(template => template.title.includes('执行清单'));
    const fallbackActionContent = [
      '1. 先确认本次要完成的最小结果。',
      '2. 复制上一版中最接近可交付的内容。',
      '3. 补齐必要对象、材料、数据或限制条件。',
      '4. 按检查标准删掉空泛解释，只保留可执行内容。',
      '5. 完成后记录下一处需要继续调整的问题。',
    ].join('\n');

    result = {
      ...result,
      usableOutput: {
        title: result.usableOutput.title.includes('执行清单')
          ? result.usableOutput.title
          : `执行清单 / 行动清单：${result.usableOutput.title}`,
        sections: hasActionSection
          ? result.usableOutput.sections
          : [{ heading: '执行清单 / 行动清单', content: fallbackActionContent }, ...result.usableOutput.sections],
      },
      copyableTemplates: hasActionCopy
        ? result.copyableTemplates
        : [{ title: '执行清单 / 行动清单', content: fallbackActionContent }, ...result.copyableTemplates],
    };
  }

  return result;
}

export async function reviseSolutionResultWithLLM(
  input: LLMRevisionInput,
  options: LLMRevisionOptions = {}
): Promise<SolutionResult> {
  const instruction = input.instruction.trim();
  if (!instruction) {
    throw new Error('Instruction is required.');
  }

  const prompt = buildPrompt({ ...input, instruction });
  const callModel = options.callModel ?? callDeepSeek;
  const response = await callModel(prompt);
  const parsed = JSON.parse(stripCodeFence(response));
  return coerceSolutionResult(parsed, input.previousResult, input.mode);
}

export async function reviseSolutionResultSmart(
  input: LLMRevisionInput,
  options: LLMRevisionOptions = {}
): Promise<{ result: SolutionResult; source: 'llm' | 'fallback'; error?: string }> {
  try {
    const result = await reviseSolutionResultWithLLM(input, options);
    return { result, source: 'llm' };
  } catch (error) {
    const result = reviseSolutionResult(input);
    return {
      result,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'LLM revision failed.',
    };
  }
}
