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

function getPrimaryProblemText(profile: FutureProfile): string {
  return profile.currentSituation?.trim() || getProblemText(profile);
}

type SolutionIntent =
  | 'finance'
  | 'video'
  | 'portfolio'
  | 'existing_material'
  | 'material_output'
  | 'workflow'
  | 'learning'
  | 'generic';

function isExistingMaterialInput(text: string): boolean {
  const hasExplicitExistingSignal =
    /(这是我的|下面是我的|以下是我的|我有一份|已有一份|有一份).*(简历|作品集|文案|材料|说明|报告|计划|草稿)|帮我(分析|修改|改|看看).*(这段|这份|材料|草稿)/i.test(text);
  const hasMaterialKeyword =
    /(简历|作品集|作品集说明|项目经历|自我介绍|求职|申请|文案|个人陈述|ps|项目介绍|材料)/i.test(text);
  const isLongMaterial = text.length > 180 && hasMaterialKeyword;

  return hasExplicitExistingSignal || isLongMaterial;
}

function resolveSolutionIntent(profile: FutureProfile): SolutionIntent {
  const primary = getPrimaryProblemText(profile);
  const full = getProblemText(profile);

  if (isExistingMaterialInput(primary) || isExistingMaterialInput(full)) return 'existing_material';
  if (/(财务|经营报表|月度经营|报表|excel|表格)/i.test(primary)) return 'finance';
  if (/(短视频|推广视频|视频方案|视频模板|视频模版|视频脚本|分镜|拍摄|剪辑|口播|画面提示词)/i.test(primary)) return 'video';
  if (/(作品集|portfolio)/i.test(primary)) return 'portfolio';
  if (/(材料|文案|说明|申请|汇报稿|商业计划书|bp|介绍|讲稿|邮件|模板|模版|页面|清单|报告)/i.test(primary)) return 'material_output';
  if (/(流程很乱|工作流程很乱|每天先做什么|工作安排混乱|任务很乱|不知道.*优先级)/i.test(primary)) return 'workflow';
  if (/(学习|备考|雅思|托福|技能|转行|路线|计划|复习|练习|课程)/i.test(primary)) return 'learning';

  if (/(财务|经营报表|月度经营|报表|excel|表格)/i.test(full)) return 'finance';
  if (/(短视频|推广视频|视频方案|视频模板|视频模版|视频脚本|分镜|拍摄|剪辑|口播|画面提示词)/i.test(full)) return 'video';
  if (/(作品集|portfolio)/i.test(full)) return 'portfolio';
  if (/(流程很乱|工作流程很乱|每天先做什么|工作安排混乱|任务很乱|不知道.*优先级)/i.test(full)) return 'workflow';
  if (/(学习|备考|雅思|托福|技能|转行|路线|计划|复习|练习|课程)/i.test(full)) return 'learning';

  return 'generic';
}

function matchSkill(text: string): SolutionResult['skillMatched'] {
  if (/(短视频|推广视频|视频方案|视频模板|视频模版|视频脚本|分镜|拍摄|剪辑|口播|画面提示词)/i.test(text)) {
    return {
      name: '材料生成 Skill',
      reason: '这个问题的核心是产出一套可复用的视频方案、脚本、分镜和素材组织方式。',
    };
  }

  if (/(作品集|设计|视觉|portfolio)/i.test(text)) {
    return {
      name: '材料生成 Skill',
      reason: '这个问题的核心是产出一份能直接修改或交付的材料，需要先给出结构、模板和可复制文本。',
    };
  }

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

function buildSkillMatched(intent: SolutionIntent): SolutionResult['skillMatched'] {
  if (intent === 'finance' || intent === 'workflow') {
    return {
      name: '工作流生成 Skill',
      reason: intent === 'finance'
        ? '这个问题需要把数据字段、计算公式、检查标准和汇报结构固定下来，形成可复用的报表工作流。'
        : '这个问题需要先把入口、优先级、执行步骤和可复用节点固定下来，而不是继续堆待办事项。',
    };
  }

  if (intent === 'learning') {
    return {
      name: '学习路径 Skill',
      reason: '这个问题需要把目标拆成训练路径、今日练习和复盘方式，避免停留在“继续学习”。',
    };
  }

  if (intent === 'video') {
    return {
      name: '材料生成 Skill',
      reason: '这个问题的核心是产出一套可复用的视频方案、脚本、分镜和素材组织方式。',
    };
  }

  if (intent === 'portfolio' || intent === 'existing_material' || intent === 'material_output') {
    return {
      name: '材料生成 Skill',
      reason: '这个问题的核心是产出一份能直接修改或交付的材料，需要先给出结构、模板和可复制文本。',
    };
  }

  return {
    name: '通用解决 Skill',
    reason: '当前问题还没有明显落到工作流、材料或学习路径上，所以先用通用结构把问题拆成可执行版本。',
  };
}

function getProblemCore(profile: FutureProfile, skillName: SolutionSkillName): SolutionResult['problemCore'] {
  const text = getProblemText(profile);
  const intent = resolveSolutionIntent(profile);

  if (intent === 'existing_material') {
    return {
      summary: '你已经有一份材料，现在需要先看清它的用途、对象和卡点，再改出一版更清楚的表达。',
      realBlocker: '真正卡住的是材料里的重点、证据和目标关联还不够清楚，所以别人很难快速判断你的能力或匹配度。',
      whyItMatters: '先找出材料问题，再给出可替换片段，比从头重写更快，也更容易保留你的真实经历。',
    };
  }

  if (intent === 'finance') {
    return {
      summary: '你想做一份财务报表，但目前不确定报表结构、字段、公式和汇报方式。',
      realBlocker: '真正卡住的是报表结构、关键字段、公式口径和汇报逻辑没有先定下来，所以每次做表都会从零开始。',
      whyItMatters: '如果先不固定结构和口径，后面即使用 Excel 或 AI，也只是在整理碎片数据，不能形成可复用的经营分析流程。',
    };
  }

  if (intent === 'video') {
    return {
      summary: '你想完成一个视频方案或模板，核心不是先学习方法，而是拆解参考结构、生成自己的脚本/分镜模板，并形成可复用的生产流程。',
      realBlocker: '真正卡住的是中心产出还没有被拆成“参考拆解、模板结构、素材组织、生产步骤”几个可执行部分。',
      whyItMatters: '只要先生成一版可复用模板和工作流，你后面就能基于素材继续调整，而不是每次从零想创意。',
    };
  }

  if (intent === 'portfolio') {
    return {
      summary: '你想准备作品集，同时用 AI 提高效率，但目前不确定应该先改结构、文案、项目逻辑还是视觉呈现。',
      realBlocker: '如果没有先确定作品集的使用场景和评审标准，就很容易一直改视觉效果，却没有提高作品集的判断力和说服力。',
      whyItMatters: '作品集不是图片合集，而是证明你能解决真实问题的材料。先改哪一部分，会直接影响后续投入是否有效。',
    };
  }

  if (intent === 'material_output') {
    return {
      summary: '你想完成一份可用材料，当前需要先明确它给谁看、要达成什么效果，以及第一版应该包含哪些结构。',
      realBlocker: '真正卡住的是材料的目标对象、结构和完成标准还不清楚，所以很难判断应该先改内容、表达还是格式。',
      whyItMatters: '先生成通用修改框架，再根据用途继续细化，比默认套用某个具体案例更稳。',
    };
  }

  if (intent === 'learning') {
    return {
      summary: '你真正卡住的不是找不到学习方法，而是不知道今天该练哪一个最小环节，以及练完如何判断有效。',
      realBlocker: '目标太大时，学习会变成收藏资料和换计划。你需要一套今天就能执行、能留下结果的训练单位。',
      whyItMatters: '只有每次练习都能留下卡点和结果，下一步才会越来越准。',
    };
  }

  if (intent === 'workflow') {
    return {
      summary: '你现在需要的不是更多待办事项，而是把混乱工作拆成固定入口、优先级和每天可重复执行的流程。',
      realBlocker: '真正卡住的是任务没有被分层：哪些必须今天做、哪些可以模板化、哪些可以自动化，还没有被区分出来。',
      whyItMatters: '先固定工作流，后面才知道该用什么工具、哪些节点值得自动化，而不是每天重新判断先做什么。',
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

function buildWorkflowOutput(): Pick<SolutionResult, 'clarifyingQuestions' | 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'> {
  return {
    clarifyingQuestions: [
      '你每天最重复、最容易乱的任务是哪一类？',
      '这些任务里哪些必须当天完成？',
      '你现在主要用纸笔、微信、表格，还是项目管理工具记录？',
    ],
    usableOutput: {
      title: '每日工作流第一版',
      sections: [
        {
          heading: '1. 工作流结构',
          content: '收集入口：把所有任务先放到同一个入口\n分类处理：按“今天必须 / 本周推进 / 等待别人 / 可自动化”分组\n执行顺序：先做影响最大且有截止时间的任务\n复盘出口：每天结束只记录 3 件事：完成了什么、卡在哪里、明天第一件事是什么',
        },
        {
          heading: '2. 优先级清单',
          content: 'A 类：今天不做会影响交付或别人推进\nB 类：本周必须推进，但今天不一定完成\nC 类：可以模板化、批处理或交给工具辅助\nD 类：暂时不做，只保留记录',
        },
        {
          heading: '3. 每日执行流程',
          content: '09:00 统一收集任务 → 09:15 标记 A/B/C/D → 09:30 先完成 1 个 A 类任务 → 下午批处理 B 类任务 → 下班前 10 分钟写明天第一件事。',
        },
        {
          heading: '4. 可自动化节点建议',
          content: '重复汇总、固定格式回复、每周报表、会议纪要、资料整理都可以先模板化。不要一开始追求全自动，先把输入和输出固定下来。',
        },
      ],
    },
    copyableTemplates: [
      {
        title: '每日优先级表',
        content: '| 任务 | 类型 A/B/C/D | 截止时间 | 影响对象 | 下一步动作 |\n| --- | --- | --- | --- | --- |\n|  |  |  |  |  |',
      },
      {
        title: '每日执行 SOP',
        content: '1. 收集所有任务\n2. 标记 A/B/C/D\n3. 先做 1 个 A 类任务\n4. 批处理 B 类任务\n5. 记录可模板化节点\n6. 写下明天第一件事',
      },
    ],
    nextRefinementPrompt: '例如：我每天主要乱在消息、报表和临时需求，不知道怎么排优先级。',
  };
}

function buildVideoOutput(): Pick<SolutionResult, 'clarifyingQuestions' | 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'> {
  return {
    clarifyingQuestions: [
      '这条短视频想给谁看？',
      '你希望视频让观众产生什么动作：关注、咨询、购买，还是理解一个观点？',
      '你想真人出镜、图文混剪，还是 AI 生成画面？',
    ],
    usableOutput: {
      title: '短视频参考模板拆解与个人模板方案',
      sections: [
        {
          heading: '1. 参考短视频模板拆解表',
          content: '字段：环节 / 时长 / 画面内容 / 字幕或口播 / 镜头类型 / 节奏 / 可替换元素 / 我的版本怎么改。\n先把你想仿照的参考视频拆成结构，不直接照抄内容，只保留节奏、镜头组织和表达方式。',
        },
        {
          heading: '2. 我的短视频脚本模板',
          content: '开头 3 秒：说出目标用户正在遇到的具体问题。\n中段展开：用 2-3 个步骤、画面证据或反差解释你的内容。\n画面展示：放入已有素材、补拍画面或 AI 生成画面。\n结尾行动：告诉观众下一步做什么。\n可替换变量：目标人群 / 场景 / 结果 / 证据 / 行动。',
        },
        {
          heading: '3. 分镜结构',
          content: '字段：镜头编号 / 画面 / 口播或字幕 / 素材需求 / 备注。\n镜头 1：问题场景\n镜头 2：参考模板里的关键节奏\n镜头 3：自己的素材或产品出现\n镜头 4：核心卖点或方法拆解\n镜头 5：结果展示\n镜头 6：结尾行动提示',
        },
        {
          heading: '4. 素材准备清单',
          content: '已有素材：先列出你手上已经有的短视频素材。\n需要补拍 / 补找素材：按镜头编号补齐缺口。\n可用 AI 生成素材：适合用来补背景、转场、氛围画面。\n素材命名规则：镜头编号_用途_版本，例如 01_开头问题_v1。',
        },
        {
          heading: '5. 短视频生产工作流',
          content: '找参考视频 → 拆解模板 → 提取结构 → 替换成自己的内容 → 生成分镜 → 整理素材 → 拍摄 / 生成画面 → 剪辑 → 复盘 → 更新模板库。',
        },
      ],
    },
    copyableTemplates: [
      {
        title: '短视频模板拆解表',
        content: '| 环节 | 时长 | 画面内容 | 字幕 / 口播 | 镜头类型 | 节奏 | 可替换元素 | 我的版本怎么改 |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n| 开头 | 0-3秒 |  |  |  |  |  |  |\n| 展开 | 3-20秒 |  |  |  |  |  |  |\n| 证明 | 20-45秒 |  |  |  |  |  |  |\n| 结尾 | 45-60秒 |  |  |  |  |  |  |',
      },
      {
        title: '30-60 秒脚本模板',
        content: '开头 3 秒：\n中段展开：\n画面展示：\n结尾行动：\n可替换变量：目标人群 / 场景 / 结果 / 证据 / 行动',
      },
      {
        title: '分镜表',
        content: '| 镜头编号 | 画面 | 口播 / 字幕 | 素材需求 | 备注 |\n| --- | --- | --- | --- | --- |\n| 1 |  |  |  |  |\n| 2 |  |  |  |  |\n| 3 |  |  |  |  |',
      },
      {
        title: '素材清单',
        content: '已有素材：\n需要补拍 / 补找素材：\n可用 AI 生成素材：\n素材命名规则：镜头编号_用途_版本',
      },
      {
        title: '短视频生产 SOP',
        content: '1. 找参考视频\n2. 拆解模板\n3. 提取结构\n4. 替换成自己的内容\n5. 生成分镜\n6. 整理素材\n7. 拍摄 / 生成画面\n8. 剪辑\n9. 复盘\n10. 更新模板库',
      },
    ],
    nextRefinementPrompt: '例如：我有 3 条参考视频，想仿照它们的结构，但换成我自己的内容和素材。',
  };
}

function buildExistingMaterialOutput(text: string): Pick<SolutionResult, 'clarifyingQuestions' | 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'> {
  const isPortfolio = /(作品集|作品集说明|项目介绍|portfolio)/i.test(text);
  const isResume = /(简历|求职|岗位|投递)/i.test(text);
  const title = isPortfolio ? '作品集材料修改建议' : isResume ? '简历 / 材料修改建议' : '通用材料修改框架';
  const questions = isPortfolio
    ? [
        '作品集用于求职、考研、课程评审还是申请？',
        '你最想突出哪个项目？',
        '你希望我优先改结构、文案还是项目逻辑？',
      ]
    : isResume
      ? [
          '这份简历投递什么岗位？',
          '你最想突出哪段经历？',
          '你有没有量化结果可以补充？',
        ]
    : [
        '这份材料最终给谁看？',
        '你希望它帮你完成什么结果？',
        '你现在最不确定的是结构、内容、表达，还是可信度？',
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
      : isResume
        ? '例如：这份简历投递视觉设计岗位，我最想突出一个品牌项目，但没有量化结果。'
        : '例如：这份材料是给对方判断方案是否可行，我最担心结构不清楚、结果不够具体。',
  };
}

function buildRefinedFinanceOutput(): SolutionResult {
  return {
    problemCore: {
      summary: '你补充的信息说明，这份报表不只是自己整理数据，而是要给老板看，并且要能核对员工成本、公司流水和数据准确性。',
      realBlocker: '真正卡住的是通用经营报表还不够贴近你的真实数据来源：员工数据、公司流水和准确性检查需要单独成表。',
      whyItMatters: '老板看报表时最关心经营结果、异常原因和需要决策的问题。第二版要把这些内容提前整理出来。',
    },
    skillMatched: {
      name: '工作流生成 Skill',
      reason: '你补充了老板汇报、员工数据、公司流水、Excel 和数据准确性要求，所以需要把通用报表升级成可核对、可汇报的 Excel 工作流。',
    },
    clarifyingQuestions: [
      '员工数据目前是工资表、考勤表，还是手工记录？',
      '公司流水来自银行流水、收款平台，还是内部台账？',
      '老板最关心利润、现金流，还是异常费用？',
    ],
    usableOutput: {
      title: '第二版结果：老板版月度经营报表',
      sections: [
        {
          heading: '1. 员工成本表',
          content: '字段：员工姓名 / 部门 / 基础工资 / 绩效 / 社保 / 实发工资 / 备注\n用途：把人员相关成本单独拆出来，避免工资、社保、绩效混在费用总表里看不清。',
        },
        {
          heading: '2. 公司流水核对表',
          content: '字段：日期 / 流水来源 / 收入金额 / 支出金额 / 对应业务 / 是否已核对 / 异常说明\n用途：把报表收入和成本逐项对回公司流水，先解决“数据准不准”的问题。',
        },
        {
          heading: '3. 数据准确性检查清单',
          content: '收入总额是否和公司流水一致\n成本费用是否有凭证\n员工工资是否和实际发放一致\n异常金额是否单独标记\n现金流期末余额是否能对上账户余额',
        },
        {
          heading: '4. 老板版汇报结构',
          content: '本月经营结果\n收入和成本变化\n员工成本情况\n现金流风险\n需要老板决策的问题',
        },
        {
          heading: '5. Excel 表结构提示',
          content: '建议拆成 5 个 sheet：首页汇总 / 收入成本 / 员工成本 / 流水核对 / 异常说明。首页只放老板需要看的关键结论，明细放后面可追溯。',
        },
      ],
    },
    copyableTemplates: [
      {
        title: '员工成本表字段',
        content: '| 字段名称 | 用途 | 示例 |\n| --- | --- | --- |\n| 员工姓名 | 标记成本归属 | 张三 |\n| 部门 | 看不同部门成本 | 销售部 |\n| 基础工资 | 固定人工成本 | 8000 |\n| 绩效 | 浮动人工成本 | 1200 |\n| 社保 | 公司承担部分 | 1500 |\n| 实发工资 | 实际支付金额 | 7600 |\n| 备注 | 异常或调整说明 | 补发上月绩效 |',
      },
      {
        title: '公司流水核对表字段',
        content: '| 字段名称 | 用途 | 示例 |\n| --- | --- | --- |\n| 日期 | 定位流水周期 | 2026-06-28 |\n| 流水来源 | 银行/平台/现金 | 对公银行 |\n| 收入金额 | 本笔流入 | 20000 |\n| 支出金额 | 本笔流出 | 5000 |\n| 对应业务 | 关联收入或费用项目 | 客户回款 |\n| 是否已核对 | 防止重复或漏记 | 是 |\n| 异常说明 | 单独解释不一致 | 未匹配发票 |',
      },
      {
        title: '数据准确性检查清单',
        content: '1. 收入总额是否和公司流水一致\n2. 成本费用是否有凭证\n3. 员工工资是否和实际发放一致\n4. 异常金额是否单独标记\n5. 现金流期末余额是否能对上账户余额',
      },
      {
        title: '老板版汇报文案',
        content: '本月经营结果整体为：收入 X，成本 X，毛利率 X%。\n收入较上月变化 X%，主要来自……\n员工成本本月为 X，占总成本 X%，其中异常变化是……\n公司流水已核对 X%，目前发现的主要差异是……\n下月建议老板重点决策：……',
      },
    ],
    nextRefinementPrompt: '例如：老板最关心现金流，我的流水来自银行导出，员工工资表只有基础工资和实发工资。',
    refinementSummary: '已根据你的补充，生成老板版报表、员工成本表、公司流水核对表、数据准确性检查清单和 Excel 表结构。',
  };
}

function buildRefinedPortfolioOutput(): SolutionResult {
  return {
    problemCore: {
      summary: '你补充的信息说明，这份作品集是用于求职，并且你已经有 4 个项目，当前最担心项目说明太空。',
      realBlocker: '真正卡住的是项目排序和项目说明没有服务于招聘者判断：招聘者需要快速看懂你能解决什么问题，而不是只看视觉效果。',
      whyItMatters: '求职作品集的第一轮判断很快，项目首页、项目说明和关键证据决定了别人是否愿意继续看。',
    },
    skillMatched: {
      name: '材料生成 Skill',
      reason: '你要把已有项目组织成求职材料，所以需要生成作品集结构、项目说明框架和面向招聘者的反馈问题。',
    },
    clarifyingQuestions: [
      '目标岗位更偏品牌设计、视觉设计、UI，还是内容设计？',
      '4 个项目里哪一个最接近目标岗位要求？',
      '你已有的项目结果里，有没有真实反馈、数据或落地场景？',
    ],
    usableOutput: {
      title: '第二版结果：求职版作品集结构',
      sections: [
        {
          heading: '1. 求职版作品集结构',
          content: '首页：一句话定位 + 3 个最能代表能力的项目\n项目 1：最贴近目标岗位的完整项目\n项目 2：体现方法和过程判断的项目\n项目 3：体现风格或执行能力的项目\n附录：其他练习、软件能力和补充作品',
        },
        {
          heading: '2. 4 个项目的排序建议',
          content: '先把 4 个项目按“岗位相关度 / 项目完整度 / 可证明能力 / 视觉完成度”打分。首页不要放最漂亮的项目，而要放最能证明你适合目标岗位的项目。',
        },
        {
          heading: '3. 项目说明改写框架',
          content: '每个项目说明按 5 行写：项目背景 / 真实问题 / 我的判断 / 我的解决方法 / 最终结果。先让招聘者看懂你解决了什么，再展示视觉。',
        },
        {
          heading: '4. 面向招聘者的评审问题',
          content: '请对方只看 3 件事：哪个项目最像真实工作？哪个项目说明最空？如果只能改一页，应该先改哪一页？',
        },
        {
          heading: '5. 需要优先修改的页面类型',
          content: '优先改项目首页、项目背景页、设计过程页、最终结果页。不要先花太多时间统一装饰风格，先把项目逻辑补清楚。',
        },
      ],
    },
    copyableTemplates: [
      {
        title: '求职版作品集目录',
        content: '1. 个人定位：我适合什么岗位 / 能解决什么问题\n2. 项目一：最匹配目标岗位的完整项目\n3. 项目二：体现设计方法和判断过程\n4. 项目三：体现视觉执行和风格稳定性\n5. 补充页：软件能力、练习、其他作品',
      },
      {
        title: '项目说明改写框架',
        content: '项目背景：这个项目来自什么真实场景？\n真实问题：它要解决谁的什么问题？\n我的判断：我为什么这样设计？\n我的方法：我做了哪些调研、结构、视觉或测试？\n最终结果：交付了什么，产生了什么反馈或价值？',
      },
      {
        title: '招聘者反馈消息模板',
        content: '你好，我正在把作品集改成求职版本。现在有 4 个项目，最担心项目说明太空。想请你从招聘者角度直接指出：\n1. 哪个项目最像真实工作？\n2. 哪个项目说明最空？\n3. 如果只能先改一页，你建议我先改哪一页？',
      },
    ],
    nextRefinementPrompt: '例如：目标岗位是品牌视觉设计，4 个项目里有 2 个品牌项目、1 个包装、1 个海报练习。',
    refinementSummary: '已根据你的补充，生成求职版作品集结构、4 个项目排序建议、项目说明改写框架和招聘者反馈模板。',
  };
}

function buildRefinedVideoOutput(): SolutionResult {
  return {
    problemCore: {
      summary: '你补充的信息说明，这次不是要一个泛泛的视频建议，而是要一套可以照着做的短视频模板和步骤，并且要把已有素材整理进生产流程。',
      realBlocker: '真正卡住的是参考视频、已有素材、脚本结构、分镜和剪辑步骤还没有被串成一条可复用流程，所以很容易变成“知道要做视频，但不知道下一步怎么落地”。',
      whyItMatters: '第二版要把参考拆解、素材整理、模板生成和成片检查连起来，让你能直接拿素材进入制作，而不是回到学习方法或每日工作流。',
    },
    skillMatched: {
      name: '材料生成 Skill',
      reason: '你需要的是短视频模板、脚本、分镜、素材表和生产 SOP 的组合成果，而不是泛工作流安排。',
    },
    clarifyingQuestions: [
      '你准备仿照的参考视频属于口播、混剪、剧情，还是产品展示？',
      '已有素材里哪些可以直接用，哪些还需要补拍或用 AI 补画面？',
      '你希望第一条视频控制在 30 秒、45 秒，还是 60 秒？',
    ],
    usableOutput: {
      title: '第二版结果：短视频模板生成工作流',
      sections: [
        {
          heading: '1. 参考视频拆解步骤',
          content: '先选 3 条最接近目标风格的参考视频。每条只拆结构：开头如何抓注意力、中段如何展开、画面如何切换、结尾如何引导行动。不要先评价好不好看，先把可复用结构拆出来。',
        },
        {
          heading: '2. 素材整理表',
          content: '字段：素材名称 / 类型 / 对应镜头 / 是否可直接使用 / 需要补拍或 AI 生成 / 备注。\n把“短视频素材”先按镜头用途分类：开头问题、过程展示、结果证明、转场、结尾行动。',
        },
        {
          heading: '3. 自己模板生成流程',
          content: '参考结构 → 替换目标人群 → 替换问题场景 → 放入自己的素材 → 写 30-60 秒脚本 → 拆成镜头 → 标记缺失素材 → 生成第一版剪辑清单。',
        },
        {
          heading: '4. 镜头替换规则',
          content: '参考视频的“画面形式”可以借鉴，但内容必须替换成自己的场景。\n人物镜头可替换为：产品画面 / 操作过程 / 截图演示 / AI 生成背景。\n口播可替换为：字幕卡 / 屏幕录制 / 前后对比。',
        },
        {
          heading: '5. 成片检查清单',
          content: '开头 3 秒是否说清目标问题？\n每个镜头是否对应一个信息点？\n素材命名是否能追溯到镜头？\n结尾是否有明确行动？\n这条视频能否作为下一条视频的模板继续复用？',
        },
      ],
    },
    copyableTemplates: [
      {
        title: '参考视频拆解步骤',
        content: '1. 选 3 条参考视频\n2. 记录每条视频的开头、中段、结尾\n3. 标记画面节奏和转场方式\n4. 提取可复用结构\n5. 写出自己的替换版本',
      },
      {
        title: '素材整理表',
        content: '| 素材名称 | 类型 | 对应镜头 | 是否可直接使用 | 需要补拍 / AI 生成 | 备注 |\n| --- | --- | --- | --- | --- | --- |\n|  |  |  |  |  |  |',
      },
      {
        title: '自己的模板生成流程',
        content: '参考结构：\n目标人群：\n问题场景：\n已有素材：\n脚本第一版：\n分镜第一版：\n缺失素材：\n剪辑顺序：',
      },
      {
        title: '镜头替换规则',
        content: '参考镜头：\n我自己的替换画面：\n替换理由：\n需要的素材：\n是否可用 AI 补充：',
      },
      {
        title: '成片检查清单',
        content: '1. 开头 3 秒是否明确？\n2. 中段是否只有一个主线？\n3. 素材是否和脚本匹配？\n4. 结尾行动是否清楚？\n5. 这条视频结构是否能复用？',
      },
    ],
    nextRefinementPrompt: '例如：参考视频是口播混剪，我手上有 8 段素材，想先做一条 45 秒版本。',
    refinementSummary: '已根据你的补充，生成短视频模板第二版，包括参考拆解、素材整理、模板生成流程、镜头替换规则和成片检查清单。',
  };
}

export function buildRefinedSolutionResult(
  profile: FutureProfile,
  supplementText: string,
  baseResult?: SolutionResult
): SolutionResult {
  const intent = resolveSolutionIntent(profile);
  const text = compactText([getProblemText(profile), supplementText]);

  if (intent === 'finance' || (intent === 'generic' && /(财务|经营报表|月度经营|报表|excel|表格|流水|员工|工资|老板|汇报|数据不准|数据不准确)/i.test(text))) {
    return buildRefinedFinanceOutput();
  }

  if (intent === 'video') {
    return buildRefinedVideoOutput();
  }

  if (intent === 'portfolio' || (intent === 'generic' && /(作品集|设计|视觉|portfolio|项目说明|求职|招聘)/i.test(text))) {
    return buildRefinedPortfolioOutput();
  }

  const base = baseResult || buildSolutionResult(profile);
  return {
    ...base,
    usableOutput: {
      title: `第二版结果：${base.usableOutput.title}`,
      sections: [
        ...base.usableOutput.sections,
        {
          heading: '根据补充信息调整',
          content: `你补充了：${supplementText}\n下一版应优先围绕这条真实信息调整结构、模板和完成标准。`,
        },
      ],
    },
    refinementSummary: '已根据你的补充生成第二版结果。',
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

function buildOutputForIntent(
  profile: FutureProfile,
  intent: SolutionIntent,
  skillName: SolutionSkillName
): Pick<SolutionResult, 'clarifyingQuestions' | 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'> {
  switch (intent) {
    case 'existing_material':
      return buildExistingMaterialOutput(getProblemText(profile));
    case 'finance':
      return buildFinanceReportOutput();
    case 'video':
      return buildVideoOutput();
    case 'portfolio':
      return buildPortfolioOutput();
    case 'workflow':
      return buildWorkflowOutput();
    case 'learning':
      return buildLearningOutput();
    case 'material_output':
    case 'generic':
    default:
      return buildGenericOutput(skillName);
  }
}

export function buildSolutionResult(
  profile: FutureProfile,
  _radar?: Partial<OpportunityRadarV4>
): SolutionResult {
  const intent = resolveSolutionIntent(profile);
  const skillMatched = buildSkillMatched(intent);
  const problemCore = getProblemCore(profile, skillMatched.name);
  const output = buildOutputForIntent(profile, intent, skillMatched.name);

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
