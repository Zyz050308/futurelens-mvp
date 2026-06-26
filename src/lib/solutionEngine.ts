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

  if (/(财务|经营报表|月度经营|报表|excel|表格)/i.test(text)) {
    return {
      summary: '你要解决的不是“会不会做表”，而是如何把经营数据变成老板能看懂、能决策的一套固定报表。',
      realBlocker: '真正卡住的是报表结构、关键字段、公式口径和汇报逻辑没有先定下来，所以每次做表都会从零开始。',
      whyItMatters: '如果先不固定结构和口径，后面即使用 Excel 或 AI，也只是在整理碎片数据，不能形成可复用的经营分析流程。',
    };
  }

  if (/(作品集|设计|视觉|portfolio)/i.test(text)) {
    return {
      summary: '你真正卡住的不是“不知道要不要努力”，而是不知道作品集应该先解决项目逻辑、评审标准、展示结构中的哪一个问题。',
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
      '这份月度经营报表主要给谁看：老板、部门负责人，还是你自己复盘？',
      '目前能拿到哪些数据：收入、成本、毛利、订单、客户、库存、现金流里有哪些？',
      '你最想通过报表回答什么：利润变化、费用异常、客户质量，还是下月行动？',
      '报表最终是 Excel、PPT，还是一页文字汇报？',
    ],
    usableOutput: {
      title: '月度经营报表第一版工作流',
      sections: [
        {
          heading: '1. 报表结构',
          content: '首页结论：本月经营一句话结论、3 个关键数字、1 个最大风险、1 个下月动作。\n核心数据页：收入、成本、毛利、费用、净利润、现金流。\n业务拆分页：按产品/项目/客户/渠道拆分收入和毛利。\n问题定位页：列出异常变化、可能原因、需要确认的人或数据。',
        },
        {
          heading: '2. 字段设计',
          content: '基础字段：月份、业务线、产品/项目、客户、收入、直接成本、毛利、费用、净利润、回款金额。\n分析字段：收入环比、毛利率、费用率、净利率、回款率、异常标记、原因备注、负责人。',
        },
        {
          heading: '3. Excel 公式',
          content: '毛利 = 收入 - 直接成本\n毛利率 = 毛利 / 收入\n费用率 = 费用 / 收入\n净利润 = 毛利 - 费用\n净利率 = 净利润 / 收入\n收入环比 = (本月收入 - 上月收入) / 上月收入\n回款率 = 回款金额 / 收入',
        },
        {
          heading: '4. 图表建议',
          content: '趋势图：近 6 个月收入、毛利、净利润趋势。\n结构图：本月收入按业务线/产品/客户占比。\n异常表：环比变化超过 20% 的项目单独列出。\n行动表：每个异常对应一个下一步确认动作。',
        },
        {
          heading: '5. 汇报文案',
          content: '本月经营结果可以概括为：收入为【X】，环比【上升/下降 X%】；毛利率为【X%】，主要变化来自【原因】。当前最需要关注的是【异常项】，建议下月先做【动作】，并由【负责人】在【时间】前确认。',
        },
      ],
    },
    copyableTemplates: [
      {
        title: '月度经营报表字段表',
        content: '| 月份 | 业务线 | 产品/项目 | 客户 | 收入 | 直接成本 | 毛利 | 毛利率 | 费用 | 净利润 | 回款金额 | 回款率 | 异常标记 | 原因备注 | 下一步动作 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
      },
      {
        title: 'Excel 公式清单',
        content: '毛利 = 收入 - 直接成本\n毛利率 = 毛利 / 收入\n费用率 = 费用 / 收入\n净利润 = 毛利 - 费用\n净利率 = 净利润 / 收入\n收入环比 = (本月收入 - 上月收入) / 上月收入\n回款率 = 回款金额 / 收入',
      },
      {
        title: '一页汇报文案模板',
        content: '本月经营结果：收入【】元，环比【】；毛利率【】；净利润【】。\n主要变化：1.【】 2.【】 3.【】。\n最大风险：【】。\n下月动作：先确认【】，由【】负责，完成时间【】。',
      },
    ],
    nextRefinementPrompt: '例如：我现在有收入、成本和费用数据，想做给老板看的 Excel 月报。',
  };
}

function buildPortfolioOutput(): Pick<SolutionResult, 'clarifyingQuestions' | 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'> {
  return {
    clarifyingQuestions: [
      '这份作品集是用于课程评审、求职、考研还是申请？',
      '你现在有几个项目？哪个项目最想保留？',
      '你希望 AI 帮你改视觉风格、项目说明，还是整体结构？',
      '目标岗位或评审最看重什么能力？',
    ],
    usableOutput: {
      title: '作品集修改工作流第一版',
      sections: [
        {
          heading: '1. 先列出所有项目',
          content: '把每个项目写成一行：项目名称、目标场景、你负责什么、最终产出、最能证明的能力。',
        },
        {
          heading: '2. 按评审标准筛选',
          content: '用“目标岗位/评审标准/项目完整度”给每个项目打分，先找出最应该放首页的 1 个项目。',
        },
        {
          heading: '3. 修改项目说明结构',
          content: '每个项目按：项目背景、设计目标、我的角色、设计过程、最终成果、项目价值来写，不只展示最终图。',
        },
        {
          heading: '4. 再统一视觉风格',
          content: '等项目逻辑和说明顺序确定后，再统一字号、网格、颜色和图片比例，避免先做表面美化。',
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
    /(财务|经营报表|月度经营|报表|excel|表格)/i.test(text)
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
