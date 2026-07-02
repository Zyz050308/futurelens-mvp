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
  if (
    contractId
    && [
      'experience_rewrite',
      'research_report',
      'validation_plan',
      'metric_analysis',
      'analysis_table',
    ].includes(contractId)
  ) {
    return contractId;
  }

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
  if (/(品牌|文案|介绍|改写|正式版本|简洁版本)/i.test(text)) return 'copywriting_revision';
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

  if (context === 'copywriting_revision') {
    return [
      '最终可复制文案：',
      '我们为【目标人群】提供【核心产品 / 服务】，帮助他们在【使用场景】中更轻松地解决【具体问题】。',
      '这款产品的价值不只是“看起来高级”，而是通过【核心卖点一】、【核心卖点二】和【可信依据】带来更清晰、稳定的体验。',
      '如果你正在寻找【用户真实需求】，它可以作为一个更可靠、更易理解的选择。',
      '',
      '可替换信息：目标人群、产品名称、使用场景、具体问题、核心卖点、可信依据。',
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

function buildValidationInterviewSections(): Section[] {
  return [
    {
      heading: '用户访谈提纲',
      content: [
        '1. 最近一次你遇到这个问题是什么时候？当时具体发生了什么？',
        '2. 你现在通常怎么解决？用了哪些工具或替代方案？',
        '3. 哪一步最麻烦、最耗时，或者最容易出错？',
        '4. 如果有一个工具帮你处理，你最希望它先解决哪一件事？',
        '5. 你愿意为了什么结果继续使用或付费？什么情况会让你不用？',
      ].join('\n'),
    },
    {
      heading: '访谈记录表',
      content: [
        '| 受访者 | 当前做法 | 最大痛点 | 替代方案 | 愿意尝试的功能 | 付费/持续使用信号 |',
        '| --- | --- | --- | --- | --- | --- |',
        '| 用户 A | 【现在怎么做】 | 【最麻烦的点】 | 【已有替代】 | 【想先试什么】 | 【是否愿意继续】 |',
      ].join('\n'),
    },
  ];
}

function buildValidationTwoWeekSections(): Section[] {
  return [
    {
      heading: '两周验证计划',
      content: [
        '第 1-2 天：写清核心假设，只保留最需要验证的 1-2 个问题。',
        '第 3-5 天：访谈 5 个目标用户，记录真实行为和现有替代方案。',
        '第 6-8 天：做一个低保真 MVP 流程图或演示稿，不急着开发完整产品。',
        '第 9-11 天：让 3 个用户看演示并完成一次模拟任务。',
        '第 12-14 天：整理是否继续做的判断：痛点强度、使用意愿、MVP 范围、下一步成本。',
      ].join('\n'),
    },
    {
      heading: '验证通过标准',
      content: [
        '- 至少 3 个用户明确说出同一个高频痛点。',
        '- 至少 2 个用户愿意看 MVP 或继续试用。',
        '- MVP 第一版能用 1 个核心流程证明价值。',
        '- 如果用户只觉得“有意思”但没有真实使用场景，需要缩小问题或换目标人群。',
      ].join('\n'),
    },
  ];
}

function buildUiExperienceSections(previousResult: SolutionResult): Section[] {
  return [
    {
      heading: 'UI 岗项目经历改写重点',
      content: [
        '1. 把“做了设计”改成“解决了哪个界面 / 用户 / 信息表达问题”。',
        '2. 强调 UI 岗相关能力：信息架构、组件规范、交互流程、视觉一致性、交付协作。',
        '3. 每段项目经历至少补一个结果：页面数量、迭代次数、反馈、交付物或效率提升。',
      ].join('\n'),
    },
    {
      heading: 'UI 岗可替换项目描述',
      content: [
        '我负责【项目名称】中的 UI 设计与信息整理，围绕【目标用户 / 使用场景】梳理了【核心流程】。',
        '在设计过程中，我完成了【页面 / 组件 / 视觉规范】并根据【反馈来源】进行迭代，最终产出【交付物】。',
        '这个项目体现了我的界面结构、视觉统一和设计落地能力。',
      ].join('\n'),
    },
    ...previousResult.usableOutput.sections.slice(0, 2),
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
  const isInterview = context === 'validation_plan' && includesAny(instruction, ['访谈', '提纲', '问题']);
  const isTwoWeekValidation = context === 'validation_plan' && /(两周|2周|14天|十四天)/.test(instruction) && includesAny(instruction, ['计划', '验证']);
  const isUiExperience = context === 'experience_rewrite' && /(UI|界面|交互|视觉|设计岗|设计岗位)/i.test(instruction);

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
  } else if (isInterview) {
    sections = buildValidationInterviewSections();
    titlePrefix = '访谈提纲版';
    addedTemplates = [{ title: '用户访谈提纲', content: sections.map(section => `${section.heading}\n${section.content}`).join('\n\n') }];
  } else if (isTwoWeekValidation) {
    sections = buildValidationTwoWeekSections();
    titlePrefix = '两周验证计划版';
    addedTemplates = [{ title: '两周验证计划', content: sections.map(section => `${section.heading}\n${section.content}`).join('\n\n') }];
  } else if (isUiExperience) {
    sections = buildUiExperienceSections(previous);
    titlePrefix = 'UI 岗项目经历版';
    addedTemplates = [{ title: 'UI 岗项目经历改写', content: sections.map(section => `${section.heading}\n${section.content}`).join('\n\n') }];
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
