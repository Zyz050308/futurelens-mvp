import type {
  FutureProfile,
  OpportunityRadarV4,
  SolutionResult,
  SolutionSkillName,
} from '@/types/radar';

function compactText(values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ').trim();
}

function getProblemText(profile: FutureProfile): string {
  return compactText([
    profile.currentSituation,
    profile.currentGoal,
    profile.desiredOutcome,
    profile.currentSkills,
    profile.currentAnxiety,
    profile.majorOrCareer,
  ]);
}

function isExistingMaterialInput(text: string): boolean {
  const hasExplicitExistingSignal =
    /(这是我的简历|这是我的作品集|这是我的作品集说明|这是我的文案|帮我分析这段|帮我修改这段|帮我改这份|下面是我的|以下是我的)/i.test(text);
  const hasMaterialKeyword =
    /(简历|作品集|作品集说明|项目经历|自我介绍|求职|申请|文案|个人陈述|ps|项目介绍|材料)/i.test(text);
  const isLongMaterial = text.length > 180 && hasMaterialKeyword;

  return hasExplicitExistingSignal || isLongMaterial;
}

function matchSkill(text: string): SolutionResult['skillMatched'] {
  if (/(报表|流程|sop|工作流|汇报|整理|效率|表格|excel|复盘|项目管理|自动化|月度经营)/i.test(text)) {
    return {
      name: '工作流生成 Skill',
      reason: '这个问题需要先把输入数据、处理步骤、检查标准和最终输出固定下来，而不是只获得一条建议。',
    };
  }

  if (/(简历|作品集|文案|说明|申请|汇报稿|商业计划书|bp|介绍|讲稿|邮件|材料|模板|页面)/i.test(text)) {
    return {
      name: '材料生成 Skill',
      reason: '这个问题的核心是产出一份能直接修改或交付的材料，需要先给出结构、模板和可复制文本。',
    };
  }

  if (/(学习|备考|雅思|托福|ai|技能|转行|路线|计划|复习|练习|课程)/i.test(text)) {
    return {
      name: '学习路径 Skill',
      reason: '这个问题需要把目标拆成训练路径、今日练习和复盘方式，避免停留在“继续学习”。',
    };
  }

  return {
    name: '通用解决 Skill',
    reason: '当前问题还没有明显落到工作流、材料或学习路径上，所以先用通用结构把问题拆成可执行版本。',
  };
}

function getProblemCore(profile: FutureProfile, skillName: SolutionSkillName): SolutionResult['problemCore'] {
  const text = getProblemText(profile);

  if (isExistingMaterialInput(text)) {
    return {
      summary: '你已经有一份材料，现在需要先看清它哪里影响判断，再改出一版更清楚的表达。',
      realBlocker: '真正卡住的是材料里的重点、证据和目标关联还不够清楚，所以别人很难快速判断你的能力或匹配度。',
      whyItMatters: '先找出材料问题，再给出可替换片段，比从头重写更快，也更容易保留你的真实经历。',
    };
  }

  if (/(财务|经营报表|月度经营|报表|excel|表格)/i.test(text)) {
    return {
      summary: '你想做一份财务报表，但目前不确定报表结构、字段、公式和汇报方式。',
      realBlocker: '真正卡住的是报表结构、关键字段、公式口径和汇报逻辑没有先定下来，所以每次做表都会从零开始。',
      whyItMatters: '如果先不固定结构和口径，后面即使用 Excel 或 AI，也只是在整理碎片数据，不能形成可复用的经营分析流程。',
    };
  }

  if (/(作品集|设计|视觉|portfolio)/i.test(text)) {
    return {
      summary: '你想准备作品集，同时用 AI 提高效率，但目前不确定应该先改结构、文案、项目逻辑还是视觉呈现。',
      realBlocker: '如果没有先确定作品集的使用场景和评审标准，就很容易一直改视觉效果，却没有提高作品集的判断力和说服力。',
      whyItMatters: '作品集不是图片合集，而是证明你能解决真实问题的材料。先改哪一部分，会直接影响后续投入是否有效。',
    };
  }

  if (/(简历|申请材料|个人陈述|ps|介绍|讲稿|邮件|文案)/i.test(text)) {
    return {
      summary: '你不是缺少更多表达，而是还没有把材料要证明什么、给谁看、用什么证据证明说清楚。',
      realBlocker: '材料如果只有经历或描述，没有目标对象、判断过程和结果证据，就很难让别人快速相信它有用。',
      whyItMatters: '先把材料结构固定下来，再补细节，才不会陷入反复润色但不知道有没有变好的状态。',
    };
  }

  if (/(雅思|托福|备考|复习|练习|学习|技能)/i.test(text)) {
    return {
      summary: '你真正卡住的不是找不到学习方法，而是不知道今天该练哪一个最小环节，以及练完如何判断有效。',
      realBlocker: '目标太大时，学习会变成收藏资料和换计划。你需要一套今天就能执行、能留下结果的训练单位。',
      whyItMatters: '只有每次练习都能留下卡点和结果，下一步才会越来越准。',
    };
  }

  return {
    summary: profile.currentSituation || '你现在的问题需要先被拆成一个可执行版本。',
    realBlocker: skillName === '通用解决 Skill'
      ? '真正卡住的是问题还没有被转成明确成果、完成标准和下一步动作。'
      : '真正卡住的是还没有把问题转成可以直接使用的成果。',
    whyItMatters: 'FutureLens 需要先给出一版可用成果，再根据你的补充继续调整，而不是停在分析建议。',
  };
}

function buildFinanceReportOutput(): Pick<SolutionResult, 'clarifyingQuestions' | 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'> {
  return {
    clarifyingQuestions: [
      '这份报表给谁看？',
      '你现在有哪些数据？',
      '你想要 Excel、PPT，还是文字汇报？',
    ],
    usableOutput: {
      title: '月度经营报表模板',
      sections: [
        {
          heading: '1. 收入总览表',
          content: '字段：月份 / 收入 / 成本 / 毛利 / 毛利率 / 环比 / 同比 / 备注\n用途：先让老板看到本月收入规模、利润质量和变化趋势。',
        },
        {
          heading: '2. 成本费用表',
          content: '字段：费用类型 / 金额 / 占比 / 变化原因 / 是否异常\n用途：把成本和费用拆开，快速发现本月钱花在哪里、哪里变化异常。',
        },
        {
          heading: '3. 利润分析表',
          content: '字段：收入 / 成本 / 毛利 / 净利润 / 利润率\n用途：判断本月不是只看收入增长，而是看收入增长是否真正带来利润。',
        },
        {
          heading: '4. 现金流概览表',
          content: '字段：期初余额 / 流入 / 流出 / 期末余额 / 异常说明\n用途：避免利润看起来不错，但现金流已经吃紧。',
        },
        {
          heading: '5. 异常说明表',
          content: '字段：异常项目 / 异常原因 / 影响金额 / 处理建议\n用途：把“数据变化”变成“下月应该处理什么”。',
        },
      ],
    },
    copyableTemplates: [
      {
        title: '月度经营报表字段表',
        content: '| 月份 | 收入 | 成本 | 毛利 | 毛利率 | 环比 | 同比 | 费用类型 | 费用金额 | 费用占比 | 净利润 | 利润率 | 期初余额 | 流入 | 流出 | 期末余额 | 异常项目 | 异常原因 | 影响金额 | 处理建议 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
      },
      {
        title: 'Excel 公式清单',
        content: '毛利 = 收入 - 成本\n毛利率 = 毛利 / 收入\n环比 =（本月 - 上月）/ 上月\n同比 =（本月 - 去年同期）/ 去年同期\n净利润 = 毛利 - 费用\n利润率 = 净利润 / 收入',
      },
      {
        title: '老板汇报文案',
        content: '本月收入为 X，较上月变化 X%，主要原因是……\n本月成本为 X，主要变化来自……\n本月毛利率为 X%，需要重点关注……\n本月现金流期末余额为 X，异常点是……\n下月建议重点观察……',
      },
    ],
    nextRefinementPrompt: '例如：这是给老板看的，我现在只有收入和成本数据，想要 Excel 版本。',
  };
}

function buildPortfolioOutput(): Pick<SolutionResult, 'clarifyingQuestions' | 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'> {
  return {
    clarifyingQuestions: [
      '作品集用于求职、考研、课程评审还是申请？',
      '你现在有几个项目？',
      '你最想让 AI 帮你改结构、文案还是视觉风格？',
    ],
    usableOutput: {
      title: '作品集修改工作流',
      sections: [
        {
          heading: '1. 作品集修改工作流',
          content: '先列出所有项目 → 按目标岗位/评审标准/项目完整度筛选 → 找出最该先改的 1 个项目 → 重写项目说明 → 最后统一视觉风格。',
        },
        {
          heading: '2. 项目说明模板',
          content: '项目背景：这个项目来自什么真实场景？\n设计目标：它要解决谁的什么问题？\n我的角色：我负责了哪一部分？\n设计过程：我做了哪些判断和取舍？\n最终成果：最后交付了什么？\n项目价值：它证明了我的哪项能力？',
        },
        {
          heading: '3. 评审反馈问题清单',
          content: '1. 哪个项目最不清楚？\n2. 哪一页最影响专业感？\n3. 如果只能改一个地方，你建议我先改哪里？',
        },
        {
          heading: '4. AI 提效流程',
          content: '用 AI 先帮你检查项目说明是否完整，再生成 3 个项目标题版本，最后让 AI 按“目标岗位要求”指出作品集中最弱的一页。AI 先做检查和改写，不先替你决定方向。',
        },
      ],
    },
    copyableTemplates: [
      {
        title: '作品集项目说明模板',
        content: '项目背景：\n设计目标：\n我的角色：\n设计过程：\n最终成果：\n项目价值：\n我希望评审重点看：',
      },
      {
        title: '评审反馈问题清单',
        content: '1. 哪个项目最不清楚？\n2. 哪一页最影响专业感？\n3. 如果只能改一个地方，你建议我先改哪里？\n4. 这份作品集最能证明我的哪项能力？\n5. 还缺哪类项目或证据？',
      },
      {
        title: '评审反馈消息模板',
        content: '你好，我最近在准备作品集，想请你从真实评审角度帮我看一下。不用夸我，直接指出最影响录用 / 通过的问题就可以。主要想请你看三个点：\n\n1. 哪个项目最不清楚？\n2. 哪一页最影响专业感？\n3. 如果只能改一个地方，你建议我先改哪里？',
      },
    ],
    nextRefinementPrompt: '例如：这份作品集是用来找工作的，我现在有 4 个项目，但不知道哪个最适合放首页。',
  };
}

function buildLearningOutput(): Pick<SolutionResult, 'clarifyingQuestions' | 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'> {
  return {
    clarifyingQuestions: [
      '你要学习的目标结果是什么：考试分数、能完成某个任务，还是能做出一个作品？',
      '现在最弱的是理解、练习、输出，还是坚持？',
      '每天可投入多少分钟？',
    ],
    usableOutput: {
      title: '今日学习路径第一版',
      sections: [
        { heading: '1. 15 分钟诊断', content: '先做一个最小练习，记录卡住的 3 个点，不先换资料。' },
        { heading: '2. 20 分钟专项练习', content: '只练最卡的一项，练完必须留下错题、不会表达的句子或失败原因。' },
        { heading: '3. 5 分钟复盘', content: '写下明天只改哪一个点，避免计划变大。' },
      ],
    },
    copyableTemplates: [
      {
        title: '学习复盘表',
        content: '| 今天练什么 | 卡在哪里 | 具体错误 | 明天只改什么 |\n| --- | --- | --- | --- |',
      },
      {
        title: '今日练习指令',
        content: '今天只完成一轮最小练习：先做，不查资料；记录错误；只针对一个错误补练；写下明天继续练什么。',
      },
    ],
    nextRefinementPrompt: '例如：我每天只有 40 分钟，最卡的是口语表达和坚持。',
  };
}

function buildExistingMaterialOutput(text: string): Pick<SolutionResult, 'clarifyingQuestions' | 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'> {
  const isPortfolio = /(作品集|作品集说明|项目介绍|portfolio)/i.test(text);
  const title = isPortfolio ? '作品集材料修改建议' : '简历 / 材料修改建议';
  const questions = isPortfolio
    ? [
        '作品集用于求职、考研、课程评审还是申请？',
        '你最想突出哪个项目？',
        '你希望我优先改结构、文案还是项目逻辑？',
      ]
    : [
        '这份简历投递什么岗位？',
        '你最想突出哪段经历？',
        '你有没有量化结果可以补充？',
      ];

  return {
    clarifyingQuestions: questions,
    usableOutput: {
      title,
      sections: [
        {
          heading: '1. 材料问题清单',
          content: [
            '- 表达重点不够集中：对方不容易一眼看出你最想证明什么。',
            '- 项目结果不够具体：描述偏过程，缺少最终成果、反馈或影响。',
            '- 缺少数据或证据：只有“负责、参与、熟练”，但缺少数量、时间、结果。',
            '- 和目标岗位 / 申请目标的关联不够明显：经历没有被翻译成对方关心的能力。',
          ].join('\n'),
        },
        {
          heading: '2. 修改建议表',
          content: [
            '| 原问题 | 修改方向 | 可改成 |',
            '| --- | --- | --- |',
            '| 项目描述偏过程，没有体现结果 | 补充结果、数据、个人贡献 | 负责 XX，在 XX 时间内完成 XX，最终带来 XX 结果 |',
            '| 能力词太泛 | 换成具体场景和动作 | 用 XX 方法解决 XX 问题，而不是只写“沟通能力强” |',
            '| 和目标不够相关 | 把经历改写成岗位/申请需要的能力证据 | 这个项目体现了我的 XX 能力，适合用于证明 XX 要求 |',
          ].join('\n'),
        },
        {
          heading: '3. 优化版片段',
          content: [
            '项目经历优化模板：',
            '我负责 XX 项目中的 XX 部分，通过 XX 方法解决了 XX 问题，最终完成 XX 成果。',
            '这个项目体现了我的 XX 能力，尤其是 XX、XX 和 XX。',
            '如果用于求职 / 申请，我会把这段经历放在靠前位置，并补充一个可量化结果。',
          ].join('\n'),
        },
      ],
    },
    copyableTemplates: [
      {
        title: '材料问题清单',
        content: '1. 表达重点是否集中？\n2. 是否写清楚项目结果？\n3. 是否有数据、反馈或证据？\n4. 是否能对应目标岗位 / 申请目标？',
      },
      {
        title: '修改建议表',
        content: '| 原问题 | 修改方向 | 可改成 |\n| --- | --- | --- |\n| 项目描述偏过程 | 补充结果、数据、个人贡献 | 负责 XX，在 XX 时间内完成 XX，最终带来 XX 结果 |\n| 能力词太泛 | 换成具体场景和动作 | 通过 XX 方法解决 XX 问题 |\n| 目标关联弱 | 明确对应能力 | 这个项目体现了我的 XX 能力 |',
      },
      {
        title: '优化版片段',
        content: '我负责 XX 项目中的 XX 部分，通过 XX 方法解决了 XX 问题，最终完成 XX 成果。这个项目体现了我的 XX 能力。',
      },
    ],
    nextRefinementPrompt: isPortfolio
      ? '例如：这份作品集用于求职，我最想突出品牌设计项目，希望先改项目说明。'
      : '例如：这份简历投递视觉设计岗位，我最想突出一个品牌项目，但没有量化结果。',
  };
}

function buildGenericOutput(skillName: SolutionSkillName): Pick<SolutionResult, 'clarifyingQuestions' | 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'> {
  return {
    clarifyingQuestions: [
      '这个问题最后希望产出什么：一份材料、一个流程、一个选择，还是一次练习结果？',
      '你现在已有的材料或条件是什么？',
      '今天能投入多少时间？',
    ],
    usableOutput: {
      title: `${skillName.replace(' Skill', '')}第一版`,
      sections: [
        { heading: '1. 定义成果', content: '先写清楚今天结束时要留下什么可见成果。' },
        { heading: '2. 拆成三步', content: '把问题拆成准备材料、生成第一版、检查修改三步。' },
        { heading: '3. 留下反馈', content: '做完后记录最卡的一处，作为下一轮调整入口。' },
      ],
    },
    copyableTemplates: [
      {
        title: '最小推进清单',
        content: '我要解决的问题：\n今天要留下的成果：\n已有材料：\n第一步：\n完成标准：\n做完后最卡的地方：',
      },
    ],
    nextRefinementPrompt: '例如：我现在有一份材料，但不知道先改结构、内容还是表达。',
  };
}

export function buildSolutionResult(
  profile: FutureProfile,
  _radar?: Partial<OpportunityRadarV4>
): SolutionResult {
  const text = getProblemText(profile);
  const skillMatched = matchSkill(text);
  const problemCore = getProblemCore(profile, skillMatched.name);
  const output =
    isExistingMaterialInput(text)
      ? buildExistingMaterialOutput(text)
      : /(财务|经营报表|月度经营|报表|excel|表格)/i.test(text)
      ? buildFinanceReportOutput()
      : /(作品集|设计|视觉|portfolio)/i.test(text)
        ? buildPortfolioOutput()
        : skillMatched.name === '学习路径 Skill'
          ? buildLearningOutput()
          : buildGenericOutput(skillMatched.name);

  return {
    problemCore: {
      summary: problemCore.summary,
      realBlocker: problemCore.realBlocker,
      whyItMatters: problemCore.whyItMatters,
    },
    skillMatched,
    clarifyingQuestions: output.clarifyingQuestions,
    usableOutput: output.usableOutput,
    copyableTemplates: output.copyableTemplates,
    nextRefinementPrompt: output.nextRefinementPrompt,
  };
}
