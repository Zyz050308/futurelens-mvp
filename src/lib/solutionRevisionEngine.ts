import type { SolutionResult } from '@/types/radar';
import type { SolutionRevisionMode } from './solutionWorkspace';

type Section = SolutionResult['usableOutput']['sections'][number];
type CopyableTemplate = SolutionResult['copyableTemplates'][number];

type RevisionInput = {
  previousResult: SolutionResult;
  instruction: string;
  mode?: SolutionRevisionMode;
  contractId?: string;
};

function normalizeInstruction(instruction: string): string {
  return instruction.trim().replace(/\s+/g, ' ');
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword));
}

function clipLines(content: string, maxLines = 4, maxLength = 320): string {
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, maxLines);

  const clipped = lines.join('\n');
  return clipped.length > maxLength ? `${clipped.slice(0, maxLength)}...` : clipped;
}

function mergeTemplates(
  existing: CopyableTemplate[],
  added: CopyableTemplate[]
): CopyableTemplate[] {
  const map = new Map<string, CopyableTemplate>();
  [...existing, ...added].forEach(template => {
    const old = map.get(template.title);
    if (!old || template.content.length > old.content.length) {
      map.set(template.title, template);
    }
  });
  return Array.from(map.values());
}

function inferResultContext(result: SolutionResult, contractId?: string): string {
  const text = [
    contractId,
    result.usableOutput.title,
    result.problemCore.summary,
    ...result.usableOutput.sections.map(section => `${section.heading} ${section.content}`),
    ...result.copyableTemplates.map(template => `${template.title} ${template.content}`),
  ].join('\n');

  if (/(experience_rewrite|STAR|项目经历|简历|投递|岗位)/i.test(text)) return 'experience_rewrite';
  if (/(research_report|调研汇报|课堂|老师|PPT|每页)/i.test(text)) return 'research_report';
  if (/(validation_plan|MVP|访谈|验证|核心假设|目标用户)/i.test(text)) return 'validation_plan';
  if (/(metric_analysis|DAU|转化率|留存|业务负责人|异常波动)/i.test(text)) return 'metric_analysis';
  if (/(analysis_table|字段名|计算|数据|表格|报表|营业额)/i.test(text)) return 'analysis_table';
  return 'generic_document';
}

function buildFinalContent(previousResult: SolutionResult, context: string): string {
  if (context === 'experience_rewrite') {
    return [
      '项目经历最终版：',
      '我负责【项目名称】中的【核心任务】，围绕【目标用户 / 业务目标】完成【关键行动】。',
      '在过程中，我通过【方法 / 工具 / 协作方式】解决了【具体问题】，最终产出【成果物】。',
      '这个项目体现了我的【能力 1】、【能力 2】和【结果意识】。',
      '',
      '可替换信息：项目名称、目标对象、关键行动、成果数据、能力关键词。',
    ].join('\n');
  }

  if (context === 'research_report') {
    return [
      '最终汇报结构：',
      '第 1 页：标题 + 调研对象 + 一句话结论。',
      '第 2 页：背景说明，解释为什么选择这个主题。',
      '第 3 页：资料和观察，放照片、记录、来源和关键发现。',
      '第 4 页：分析总结，把零散材料归纳成 2-3 个观点。',
      '第 5 页：结论与下一步，说明这次调研证明了什么，还缺什么。',
    ].join('\n');
  }

  if (context === 'analysis_table' || context === 'metric_analysis') {
    return [
      '最终说明版本：',
      '本次分析围绕【核心对象】展开，先整理【关键字段】，再判断【变化 / 排名 / 异常】。',
      '当前最需要关注的是【关键结论】，主要依据是【数据证据】。',
      '建议下一步先做【动作 1】，再验证【动作 2】，最后记录【复盘指标】。',
    ].join('\n');
  }

  return [
    '最终可复制版本：',
    '这份成果要解决的是【当前问题】。',
    '接收方最需要先看懂【核心结论】。',
    '建议按“目标 - 关键信息 - 证据 - 下一步”的顺序整理。',
    '最终交付时保留 3 个部分：背景、具体内容、下一步动作。',
  ].join('\n');
}

function buildPptSections(previousResult: SolutionResult, instruction: string, context: string): Section[] {
  const isFivePage = /(5页|五页|5 页|五 页)/.test(instruction);
  const pageCount = isFivePage ? 5 : 6;
  const sourceSections = previousResult.usableOutput.sections.slice(0, pageCount);

  if (context === 'research_report') {
    return [
      {
        heading: `${pageCount} 页 PPT 大纲`,
        content: [
          '第 1 页：主题和一句话结论。写清楚调研对象、范围和核心发现。',
          '第 2 页：调研背景。说明为什么这个主题值得看。',
          '第 3 页：资料整理。放照片、观察记录、资料来源和代表性信息。',
          '第 4 页：分析归纳。把材料归纳成 2-3 个观点，不要堆资料。',
          '第 5 页：结论和下一步。说明本次汇报证明了什么，还可以继续查什么。',
        ].join('\n'),
      },
    ];
  }

  return [
    {
      heading: `${pageCount} 页 PPT 大纲`,
      content: sourceSections
        .map((section, index) => `第 ${index + 1} 页：${section.heading}\n${clipLines(section.content, 2, 180)}`)
        .join('\n\n'),
    },
  ];
}

function buildActionSections(previousResult: SolutionResult): Section[] {
  return [
    {
      heading: '今天可以执行的行动清单',
      content: [
        '1. 先复制当前结果中最接近可交付的模板。',
        '2. 用 20 分钟补齐里面的【对象 / 数据 / 证据 / 示例】。',
        '3. 删除暂时用不上的解释，只保留能交付的内容。',
        '4. 找一个真实接收方标准检查：是否看得懂、是否能判断、是否能执行。',
        '5. 记录最卡的一处，作为下一轮让 FutureLens 调整的输入。',
      ].join('\n'),
    },
    {
      heading: '完成标准',
      content: [
        '完成后应该留下：',
        '- 一份可复制的最终稿或表格。',
        '- 一个明确的检查清单。',
        '- 一个下一步需要补充的问题。',
      ].join('\n'),
    },
  ];
}

function buildFormalSections(previousResult: SolutionResult, context: string): Section[] {
  const base = previousResult.usableOutput.sections.slice(0, 3);
  const prefix = context === 'metric_analysis' || context === 'analysis_table'
    ? '汇报版表达'
    : '正式表达版本';

  return [
    {
      heading: prefix,
      content: [
        '建议表达顺序：',
        '1. 先给结论：本次结果主要说明【核心结论】。',
        '2. 再给依据：依据来自【材料 / 数据 / 观察 / 反馈】。',
        '3. 再给判断：当前最需要关注【关键问题】。',
        '4. 最后给动作：下一步建议先做【具体动作】。',
        '',
        '语气要求：减少“我觉得”“可能还行”，改成“基于目前信息，可以先判断为……”。',
      ].join('\n'),
    },
    ...base.map(section => ({
      heading: section.heading,
      content: clipLines(section.content, 4, 380),
    })),
  ];
}

function buildStudentSections(previousResult: SolutionResult): Section[] {
  return [
    {
      heading: '课堂作业版结构',
      content: [
        '1. 作业主题：用一句话说明本次要讨论什么。',
        '2. 资料来源：列出照片、观察记录、网上资料或课堂材料。',
        '3. 内容整理：把资料分成背景、发现、分析、结论四类。',
        '4. 个人判断：说明你从材料里看到了什么，而不是只罗列资料。',
        '5. 完成检查：标题清楚、页数适中、每页只有一个重点。',
      ].join('\n'),
    },
    ...previousResult.usableOutput.sections.slice(0, 2),
  ];
}

function buildShortSections(previousResult: SolutionResult): Section[] {
  return previousResult.usableOutput.sections.slice(0, 4).map(section => ({
    heading: section.heading,
    content: clipLines(section.content, 3, 260),
  }));
}

function buildExpandedSections(previousResult: SolutionResult, instruction: string): Section[] {
  const sections = [...previousResult.usableOutput.sections];
  const targetIndex = /(第一部分|第1部分|第一项|第1项)/.test(instruction) ? 0 : 0;
  const target = sections[targetIndex];
  if (!target) return sections;

  sections[targetIndex] = {
    ...target,
    content: [
      target.content,
      '',
      '补充展开：',
      '- 先写清楚这一部分要解决的具体问题。',
      '- 再补 2-3 个事实、数据、例子或判断依据。',
      '- 最后写一个可以检查的完成标准。',
    ].join('\n'),
  };
  return sections;
}

export function reviseSolutionResult(input: RevisionInput): SolutionResult {
  const instruction = normalizeInstruction(input.instruction);
  if (!instruction) {
    throw new Error('Instruction is required.');
  }

  const previous = input.previousResult;
  const context = inferResultContext(previous, input.contractId);
  const mode = input.mode ?? 'revise';
  const isFinalize = mode === 'finalize' || includesAny(instruction, ['最终版', '最终稿', '只要最终稿', '可复制', '不要解释']);
  const isAction = mode === 'action' || includesAny(instruction, ['执行步骤', '行动清单', '下一步怎么做', '今天做什么']);
  const isPpt = /(PPT|ppt|大纲|几页|5页|五页|汇报页|页)/.test(instruction);
  const isStudent = includesAny(instruction, ['学生作业', '课堂汇报', '老师看', '课程作业']);
  const isFormal = includesAny(instruction, ['正式', '专业', '老师', '汇报', '商务', '严谨', '业务负责人']);
  const isShort = includesAny(instruction, ['太长', '简短', '压缩', '少一点', '精简']);
  const isExpand = includesAny(instruction, ['细化', '展开', '继续写', '补充', '第一部分', '第1部分']);

  if (isFinalize) {
    const finalContent = buildFinalContent(previous, context);
    return {
      ...previous,
      usableOutput: {
        title: '最终可复制版本',
        sections: [{ heading: '最终可复制版本', content: finalContent }],
      },
      copyableTemplates: [{ title: '最终可复制版本', content: finalContent }],
      clarifyingQuestions: [],
      nextRefinementPrompt: '如果还要继续，可以补充接收对象、字数限制或具体使用场景。',
      refinementSummary: '已整理为最终可复制版本，去掉了诊断和解释性内容。',
    };
  }

  let sections: Section[];
  let addedTemplates: CopyableTemplate[] = [];
  let titlePrefix = '调整版结果';
  let refinementSummary = `已根据“${instruction}”继续调整当前结果。`;

  if (isAction) {
    sections = buildActionSections(previous);
    titlePrefix = '执行清单版';
    addedTemplates = [{ title: '今日执行清单', content: sections.map(section => `${section.heading}\n${section.content}`).join('\n\n') }];
  } else if (isPpt) {
    sections = buildPptSections(previous, instruction, context);
    titlePrefix = 'PPT 大纲版';
    addedTemplates = [{ title: 'PPT 大纲', content: sections[0]?.content ?? '' }];
  } else if (isStudent) {
    sections = buildStudentSections(previous);
    titlePrefix = '课堂作业版';
    addedTemplates = [{ title: '课堂作业说明', content: sections[0]?.content ?? '' }];
  } else if (isFormal) {
    sections = buildFormalSections(previous, context);
    titlePrefix = '正式表达版';
    addedTemplates = [{ title: '正式表达模板', content: sections[0]?.content ?? '' }];
  } else if (isShort) {
    sections = buildShortSections(previous);
    titlePrefix = '精简版';
    addedTemplates = [{ title: '精简可复制版本', content: sections.map(section => `${section.heading}\n${section.content}`).join('\n\n') }];
  } else if (isExpand) {
    sections = buildExpandedSections(previous, instruction);
    titlePrefix = '细化版';
    addedTemplates = [{ title: '细化补充内容', content: sections[0]?.content ?? '' }];
  } else {
    sections = [
      ...previous.usableOutput.sections,
      {
        heading: '根据补充信息调整',
        content: [
          `你补充了：${instruction}`,
          '下一版应优先围绕这条真实信息调整结构、模板和完成标准。',
          '保留当前可用成果，只替换不符合新信息的部分。',
        ].join('\n'),
      },
    ];
  }

  return {
    ...previous,
    usableOutput: {
      title: `${titlePrefix}：${previous.usableOutput.title}`,
      sections,
    },
    copyableTemplates: mergeTemplates(previous.copyableTemplates, addedTemplates),
    nextRefinementPrompt: '例如：生成最终版 / 再压缩一点 / 改成给老师看的版本 / 细化第一部分。',
    refinementSummary,
  };
}
