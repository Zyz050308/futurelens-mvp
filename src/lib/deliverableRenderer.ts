import type { SolutionResult } from '@/types/radar';
import type { OutputContract } from './outputContract';
import type { OutputContractId, ProblemFrame } from './problemFrameEngine';

type RenderedDeliverables = Pick<SolutionResult, 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'>;
type CopyableTemplate = SolutionResult['copyableTemplates'][number];

function source(frame: ProblemFrame): string {
  return [frame.rawProblem, frame.supportText, frame.outputNeed, frame.audience].filter(Boolean).join(' ');
}

function hasAny(frame: ProblemFrame, words: string[]): boolean {
  const text = source(frame);
  return words.some(word => text.includes(word));
}

function normalizeSections(sections: Array<{ heading: string; content: string }>): Array<{ heading: string; content: string }> {
  const map = new Map<string, string>();
  for (const section of sections) {
    const existing = map.get(section.heading);
    if (!existing) {
      map.set(section.heading, section.content.trim());
    } else if (existing !== section.content.trim()) {
      map.set(section.heading, `${existing}\n\n${section.content.trim()}`);
    }
  }
  return Array.from(map.entries()).map(([heading, content], index) => ({
    heading: `${index + 1}. ${heading}`,
    content,
  }));
}

function table(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function genericChecklist(): string {
  return [
    '- [ ] 目标对象是否明确。',
    '- [ ] 每个模块是否有具体字段、步骤或段落。',
    '- [ ] 是否有可复制内容，而不是只有建议。',
    '- [ ] 缺失信息是否用【占位符】标出。',
    '- [ ] 下一步是否能在今天执行。',
  ].join('\n');
}

function bulletList(items: string[], fallback: string): string {
  const source = items.length > 0 ? items : [fallback];
  return source.map(item => `- ${item}`).join('\n');
}

function evidenceList(frame: ProblemFrame): string {
  const snippets = frame.inputAsset?.evidenceSnippets ?? [];
  if (snippets.length === 0) return '- 暂不引用完整原文，只根据材料摘要生成诊断。';
  return snippets.map(snippet => `- ${snippet.label}：${snippet.text}（${snippet.reason}）`).join('\n');
}

function renderInputAsset(frame: ProblemFrame): RenderedDeliverables {
  const asset = frame.inputAsset;
  if (!asset || asset.inputMode === 'problem_only') return renderByContract(frame, frame.contractId ?? 'generic_document');

  const commonSections = [
    {
      heading: '材料类型判断',
      content: [
        `输入模式：${asset.inputMode}`,
        `材料类型：${asset.assetType}`,
        `识别摘要：${asset.assetSummary}`,
        `置信度：${asset.confidence.toFixed(2)}`,
      ].join('\n'),
    },
    {
      heading: '原材料可用部分',
      content: [
        bulletList(asset.usableParts, '当前材料太短，暂时只能保留“已有一段材料”这个事实。'),
        '',
        '短证据片段：',
        evidenceList(frame),
      ].join('\n'),
    },
    {
      heading: '主要问题',
      content: bulletList(asset.mainProblems, '材料目的、结构和证据还不够清楚。'),
    },
    {
      heading: '缺失信息',
      content: bulletList(asset.missingParts, '需要补充材料用途、目标对象和完成标准。'),
    },
  ];

  if (asset.assetType === 'resume_project') {
    const star = [
      '背景：在【项目 / 课程 / 实习】中，我面对【具体问题】。',
      '任务：我负责【个人职责】，需要完成【交付物】。',
      '行动：我通过【调研 / 设计 / 协作 / 工具】完成【关键动作】。',
      '结果：最终产出【成果】，带来【反馈 / 数据 / 质量提升】。',
      '能力证明：这段经历体现了我的【目标岗位相关能力】。',
    ].join('\n');
    const rewrite = '我在【校园文创项目】中负责【调研、海报设计和展示整理】，目标是把【文化主题】转化成可展示的视觉方案。我通过【用户/场景调研】提取设计方向，并完成【海报与展示物料】。建议继续补充老师反馈、展示效果或数量结果，让这段经历更像岗位能力证明。';

    return {
      usableOutput: {
        title: '项目经历材料分析与改写第一版',
        sections: normalizeSections([
          ...commonSections,
          { heading: '项目经历诊断', content: '这段材料已经有“做了什么”，但缺少“为什么做、你怎么做、结果如何”。如果用于投递，需要把任务列表改成能力证据。' },
          { heading: 'STAR 改写版本', content: star },
          { heading: '可替换项目描述', content: rewrite },
          { heading: '量化结果补充问题', content: '- 项目周期是多久？\n- 最终产出了几张海报、几页方案或几个展示物？\n- 老师或用户的反馈是什么？\n- 你负责的是独立完成还是团队协作？\n- 这段经历最能证明哪项 UI / 视觉能力？' },
          { heading: '投递前检查', content: '- [ ] 是否写清目标岗位。\n- [ ] 是否突出个人贡献。\n- [ ] 是否有结果或反馈。\n- [ ] 是否避免“负责相关工作”这种空话。\n- [ ] 是否能让招聘方快速看到能力。' },
        ]),
      },
      copyableTemplates: [
        { title: 'STAR 改写模板', content: star },
        { title: '可替换项目描述', content: rewrite },
        { title: '量化结果补充清单', content: '周期：\n规模：\n个人贡献：\n反馈：\n对应岗位能力：' },
      ],
      nextRefinementPrompt: '补充目标岗位、项目周期、最终成果数量和反馈，我可以继续把这段经历改成更像可投递版本。',
    };
  }

  if (asset.assetType === 'report_draft') {
    const structure = [
      '1. 汇报主题：说明调研对象和核心问题。',
      '2. 调研背景：说明为什么选这个主题。',
      '3. 资料整理：把照片、网上资料、观察记录分开放。',
      '4. 核心发现：提炼 2-3 个最重要的发现。',
      '5. 个人判断：说明这些发现意味着什么。',
      '6. 结论：回到作业或汇报目标。',
    ].join('\n');
    const pagePlan = table(
      ['页码', '页面主题', '放什么', '检查点'],
      [
        ['1', '标题与主题', '调研题目、姓名、课程', '一眼知道讲什么'],
        ['2', '调研对象', '城市/地点/文化元素/照片', '对象足够具体'],
        ['3', '资料整理', '照片、资料来源、观察记录', '每个素材有说明'],
        ['4', '核心发现', '2-3 个发现和证据', '不是只堆图片'],
        ['5', '总结', '结论、启发、下一步', '能收束主题'],
      ]
    );

    return {
      usableOutput: {
        title: '混乱汇报材料重组第一版',
        sections: normalizeSections([
          ...commonSections,
          { heading: '结构诊断', content: '当前材料按“第一部分/第二部分/第三部分”堆放，但每部分和汇报目标的关系不够清楚。需要先按“主题-资料-发现-结论”重组。' },
          { heading: '重组后的汇报结构', content: structure },
          { heading: '每页放什么', content: pagePlan },
          { heading: '开头介绍模板', content: '本次汇报围绕【调研主题】展开，主要想回答【核心问题】。我目前整理了【照片 / 资料 / 观察记录】，会从【对象介绍】、【资料证据】和【核心发现】三个部分说明，最后总结这次调研对【课程/作业目标】的启发。' },
          { heading: '完成检查清单', content: '- [ ] 每一页是否有明确标题。\n- [ ] 每张照片是否有说明。\n- [ ] 网上资料是否标注来源。\n- [ ] 是否有 2-3 个自己的发现。\n- [ ] 结论是否回应调研目的。' },
        ]),
      },
      copyableTemplates: [
        { title: '重组后的汇报结构', content: structure },
        { title: '每页内容安排表', content: pagePlan },
        { title: '开头介绍模板', content: '本次汇报围绕【调研主题】展开，主要想回答【核心问题】。\n我目前整理了【已有资料】，会从【维度一】、【维度二】和【维度三】说明。\n最后会总结这次调研对【课程主题】的启发。' },
      ],
      nextRefinementPrompt: '补充汇报主题、页数要求和已有照片/资料数量，我可以继续改成完整 PPT 大纲。',
    };
  }

  if (asset.assetType === 'assignment_requirement') {
    const taskPlan = table(
      ['任务', '要做什么', '输出物', '检查点'],
      [
        ['理解要求', '圈出主题、必须包含内容、截止时间', '要求清单', '没有漏项'],
        ['收集资料', '找来源、样子、寓意、现场观察', '资料包', '每条资料有来源'],
        ['组织汇报', '按来源-样子-寓意-观察排序', 'PPT 结构', '顺序清楚'],
        ['提交检查', '核对页数、命名、格式、截止时间', '最终版本', '符合要求'],
      ]
    );

    return {
      usableOutput: {
        title: '作业要求拆解第一版',
        sections: normalizeSections([
          ...commonSections,
          { heading: '任务拆解', content: taskPlan },
          { heading: '资料清单', content: '- 来源：纹样来自哪里。\n- 样子：纹样长什么样，可以放图片。\n- 寓意：它通常象征什么。\n- 现场观察：在哪里看到、有什么细节。\n- 资料来源：网页、书籍、照片或观察记录。' },
          { heading: '时间安排', content: '第 1 天：确定纹样对象并收集资料。\n第 2 天：整理 PPT 结构和图片说明。\n第 3 天：补充结论、检查格式并提交。' },
          { heading: '提交检查', content: '- [ ] 是否包括来源。\n- [ ] 是否包括样子。\n- [ ] 是否包括寓意。\n- [ ] 是否包括现场观察。\n- [ ] 是否按截止时间完成。' },
        ]),
      },
      copyableTemplates: [
        { title: '作业任务拆解表', content: taskPlan },
        { title: '资料收集清单', content: '来源：\n样子：\n寓意：\n现场观察：\n资料来源：' },
      ],
      nextRefinementPrompt: '补充课程主题、PPT 页数和提交格式，我可以继续生成完整页码安排。',
    };
  }

  if (asset.assetType === 'business_idea') {
    const mvp = table(
      ['模块', '第一版做什么', '暂时不做什么', '验证指标'],
      [
        ['上传作业要求', '支持粘贴文本', '不做 PDF/DOCX', '是否愿意粘贴真实要求'],
        ['整理草稿', '输出结构和问题点', '不做自动提交', '整理结果是否可用'],
        ['改写建议', '给出可替换片段', '不做复杂评分', '用户是否继续修改'],
      ]
    );

    return {
      usableOutput: {
        title: '产品想法验证计划第一版',
        sections: normalizeSections([
          ...commonSections,
          { heading: '核心假设', content: '- 大学生确实会卡在“作业要求和草稿整理”这一步。\n- 他们愿意把作业要求和草稿粘贴给工具。\n- 结构整理和改写建议比泛泛建议更有价值。' },
          { heading: '目标用户', content: '优先找 5-8 位近期有课程作业、论文、汇报或设计作业的大学生，不要一开始覆盖所有学生。' },
          { heading: '访谈问题', content: '1. 最近一次作业卡在哪里？\n2. 你会不会把作业要求发给 AI？为什么？\n3. 你最想让 AI 帮你整理什么？\n4. 如果只能给一个功能，你会选结构整理、改写还是检查清单？\n5. 什么结果会让你愿意下次继续用？' },
          { heading: 'MVP 范围', content: mvp },
          { heading: '验证指标', content: '- 至少 5 人愿意提供真实作业要求。\n- 至少 3 人认为整理结果能直接帮他开始。\n- 至少 2 人愿意在下一次作业继续用。\n- 用户能说清楚最有价值的一个输出。' },
          { heading: '两周计划', content: '第 1-2 天：写清目标用户和访谈问题。\n第 3-6 天：访谈 5 位学生。\n第 7-9 天：用手工方式模拟输出。\n第 10-14 天：判断 MVP 只保留哪些功能。' },
        ]),
      },
      copyableTemplates: [
        { title: '用户访谈问题', content: '最近一次作业卡在哪里？\n你会不会把作业要求发给 AI？为什么？\n你最想让 AI 帮你整理什么？\n什么结果会让你愿意继续用？' },
        { title: 'MVP 范围表', content: mvp },
        { title: '两周验证计划', content: '第 1-2 天：确定目标用户。\n第 3-6 天：完成访谈。\n第 7-9 天：手工模拟结果。\n第 10-14 天：收敛 MVP 范围。' },
      ],
      nextRefinementPrompt: '补充目标用户是谁、他们现在怎么完成作业，我可以继续把访谈和 MVP 做得更具体。',
    };
  }

  if (asset.assetType === 'table_like_text') {
    const fields = table(
      ['字段名', '用途', '示例值', '规则', '检查点'],
      [
        ['产品名称', '识别分析对象', '产品A', '每个产品一行', '名称不要混用'],
        ['销量', '判断卖得好不好', '120', '统一统计周期', '单位一致'],
        ['排名', '看 Top 产品', '第 1 名', '按销量降序', '说明排序口径'],
        ['占比', '看贡献度', '52%', '单品销量 / 总销量', '总和应接近 100%'],
      ]
    );
    const ranking = table(
      ['排名', '产品', '销量', '初步判断', '下一步'],
      [
        ['1', '产品A', '120', '当前销量最高', '分析为什么卖得好'],
        ['2', '产品B', '80', '中等表现', '看是否有增长空间'],
        ['3', '产品C', '30', '销量较低', '判断是否调整或停推'],
      ]
    );

    return {
      usableOutput: {
        title: '销售数据文字分析第一版',
        sections: normalizeSections([
          ...commonSections,
          { heading: '数据字段表', content: fields },
          { heading: '排名表', content: ranking },
          { heading: '初步结论', content: '从当前数字看，产品A卖得最好，产品B次之，产品C最低。下一步不要只看销量，还要补充价格、毛利、时间周期和库存，才能判断该重点推哪个。' },
          { heading: '下一步动作', content: '- 补充每个产品单价。\n- 补充统计周期。\n- 计算销售额和占比。\n- 看产品A是否毛利也最高。\n- 判断产品C是低潜力还是缺少曝光。' },
        ]),
      },
      copyableTemplates: [
        { title: '数据字段表', content: fields },
        { title: '排名表', content: ranking },
        { title: '下一步动作清单', content: '补充单价：\n补充周期：\n计算销售额：\n计算占比：\n判断主推产品：' },
      ],
      nextRefinementPrompt: '补充每个产品的单价、成本和统计周期，我可以继续生成销售额和毛利判断。',
    };
  }

  if (asset.assetType === 'copywriting_draft') {
    const rewrite = '我们为【目标人群】提供【核心产品/服务】。\n它重点解决【具体问题】，让用户在【使用场景】中获得【核心价值】。\n相比普通选择，我们更强调【核心卖点一】和【核心卖点二】。';
    const formal = '【品牌名】面向【目标人群】，提供兼具【功能价值】与【体验价值】的产品方案。\n品牌希望通过【核心能力】帮助用户在【具体场景】中更高效地完成【目标】。\n这套表达更适合官网、介绍页或正式材料。';
    const concise = '为【目标人群】提供【核心价值】的【产品/品牌】。\n适合【使用场景】，解决【具体问题】。\n一句话记忆点：【最想让用户记住的话】。';

    return {
      usableOutput: {
        title: '品牌文案诊断与改写第一版',
        sections: normalizeSections([
          ...commonSections,
          { heading: '文案问题诊断', content: '原文里“很好”“高级”“适合年轻人”都偏抽象，缺少目标人群、具体场景和可感知卖点。' },
          { heading: '改写版本', content: rewrite },
          { heading: '更正式版本', content: formal },
          { heading: '更简洁版本', content: concise },
          { heading: '修改说明', content: '- 把“很好”改成具体价值。\n- 把“高级”改成可感知体验。\n- 把“年轻人”细化成具体目标人群。\n- 增加使用场景，让文案不空。' },
        ]),
      },
      copyableTemplates: [
        { title: '通用改写版本', content: rewrite },
        { title: '更正式版本', content: formal },
        { title: '更简洁版本', content: concise },
      ],
      nextRefinementPrompt: '补充品牌名、目标人群、产品特点和使用场景，我可以继续改成更贴近真实品牌的一版。',
    };
  }

  const neutral = '这份材料想说明的是【核心信息】。\n接收方最需要理解的是【关键结论】。\n目前最需要补充的是【证据 / 数据 / 示例】。\n建议结构：\n1. 先说明目的\n2. 再说明关键信息\n3. 再用证据支撑\n4. 最后给出结论或下一步动作';

  return {
    usableOutput: {
      title: '通用材料诊断与改写第一版',
      sections: normalizeSections([
        ...commonSections,
        { heading: '材料问题诊断', content: '当前材料可以先作为原始线索，但用途、接收对象、核心结论和证据都还需要补清楚。' },
        { heading: '结构整理', content: '1. 材料目的\n2. 接收方最关心的信息\n3. 已有证据或例子\n4. 缺失信息\n5. 结论或下一步动作' },
        { heading: '可复制改写版本', content: neutral },
        { heading: '下一步补充问题', content: '- 这份材料给谁看？\n- 你希望对方看完做什么？\n- 材料里最重要的一段是什么？\n- 有没有数据、例子或结果可以补充？' },
      ]),
    },
    copyableTemplates: [
      { title: '通用材料改写模板', content: neutral },
      { title: '材料检查清单', content: '- [ ] 是否写清材料目的。\n- [ ] 是否写清接收对象。\n- [ ] 是否有核心结论。\n- [ ] 是否有证据、数据或示例。\n- [ ] 是否有下一步动作。' },
    ],
    nextRefinementPrompt: '补充这份材料给谁看、想达到什么效果、已有哪几段内容，我可以继续改写成更完整的一版。',
  };
}

function renderMessageDraft(): RenderedDeliverables {
  const message = [
    '老师您好，我想确认一下这次作业的提交时间。',
    '请问是【具体日期 / 时间】前提交吗？',
    '另外想确认提交方式是【平台 / 邮箱 / 纸质】吗？',
    '麻烦老师有空时帮我确认一下，谢谢老师。',
  ].join('\n');

  return {
    usableOutput: {
      title: '可直接发送的消息草稿',
      sections: normalizeSections([
        { heading: '消息目的', content: '确认作业提交时间和提交方式，语气保持礼貌、简洁，不让对方额外猜测你想问什么。' },
        { heading: '消息结构', content: '1. 先称呼接收方。\n2. 直接说明想确认的事项。\n3. 用占位符标出时间点或提交方式。\n4. 结尾表达感谢。' },
        { heading: '可复制消息版本', content: message },
        { heading: '更礼貌版本', content: `${message}\n\n如果老师方便的话，也想请您提醒一下是否还有格式或命名要求，我会按要求整理后提交。` },
        { heading: '注意事项', content: '- 不要一上来解释太多背景。\n- 不要连续问很多无关问题。\n- 如果已经有课程群通知，先说明“我看了通知但还有一处想确认”。' },
      ]),
    },
    copyableTemplates: [
      { title: '可直接发送的消息', content: message },
      { title: '更礼貌版本', content: `${message}\n如果老师方便的话，也想请您提醒一下是否还有格式或命名要求。` },
    ],
    nextRefinementPrompt: '例如：老师比较严格，我想语气再正式一点，或者我想顺便问提交格式。',
  };
}

function renderResearchReport(): RenderedDeliverables {
  const structure = [
    '1. 封面：调研主题、姓名、课程、完成时间。',
    '2. 调研目的：为什么调研这个地域文化主题，要回答什么问题。',
    '3. 调研对象：地域、文化元素、照片、资料来源。',
    '4. 资料整理：把照片、网上资料、观察记录分别放到对应页面。',
    '5. 核心发现：提炼 2-3 个文化特征或规律。',
    '6. 结论：这次调研对课程作业或汇报主题有什么启发。',
  ].join('\n');

  return {
    usableOutput: {
      title: '调研汇报结构 / 资料组织框架第一版',
      sections: normalizeSections([
        { heading: '汇报结构', content: structure },
        {
          heading: '每页放什么',
          content: table(
            ['页码', '页面主题', '放什么内容', '检查点'],
            [
              ['1', '主题和目的', '标题、调研范围、核心问题', '一眼能看懂主题'],
              ['2', '资料来源', '照片、网页资料、观察记录', '每个资料有来源'],
              ['3', '文化元素', '建筑、图案、习俗、文字、人物或场景', '不只堆图片'],
              ['4', '分析发现', '相似点、差异、背后原因', '有自己的判断'],
              ['5', '总结', '结论、启发、可继续研究方向', '能收束作业'],
            ]
          ),
        },
        { heading: '资料整理清单', content: '- 照片：标注拍摄地点、拍摄对象、能说明什么。\n- 网上资料：记录标题、来源、关键观点。\n- 观察记录：写下你看到的细节和初步判断。\n- 缺失资料：标出还需要补一张图、一个案例或一条解释。' },
        { heading: '开头介绍模板', content: '本次汇报围绕【调研主题】展开，主要想回答【核心问题】。\n我目前收集了【照片 / 资料 / 观察记录】，会从【文化元素】、【资料证据】和【个人发现】三个部分说明。\n最后会总结这次调研对【课程主题 / 作业要求】的启发。' },
        { heading: '完成检查清单', content: '- [ ] 每页标题是否清楚。\n- [ ] 每张图是否有说明。\n- [ ] 资料来源是否标注。\n- [ ] 是否有 2-3 个自己的发现。\n- [ ] 结论是否回应调研目的。' },
      ]),
    },
    copyableTemplates: [
      { title: '汇报结构模板', content: structure },
      { title: '开头介绍模板', content: '本次汇报围绕【调研主题】展开，主要想回答【核心问题】。\n我目前收集了【已有资料】，会从【维度一】、【维度二】和【维度三】说明。\n最后会总结这次调研对【课程主题】的启发。' },
      { title: '资料整理清单', content: '照片：\n来源：\n能说明什么：\n放在哪一页：\n还缺什么：' },
    ],
    nextRefinementPrompt: '例如：我的主题是地方建筑文化，已有 4 张照片和两段资料，想做 5 页 PPT。',
  };
}

function renderAnalysisTable(frame: ProblemFrame): RenderedDeliverables {
  const isSales = hasAny(frame, ['销售表', '卖得最好']);
  const isFinance = hasAny(frame, ['财务报表', '报表']);

  const fields = isSales
    ? table(
        ['字段', '用途', '示例', '规则', '检查点'],
        [
          ['产品名称', '识别分析对象', '拿铁 / 套餐A', '每行一个产品', '不要把不同规格混在一起'],
          ['销量', '判断卖得好不好', '128', '统计同一时间范围', '缺失时先标记待确认'],
          ['销售额', '判断收入贡献', '5600', '销量 x 单价', '与流水总额核对'],
          ['排名', '找出 Top 产品', '第 1 名', '按销量或销售额排序', '说明排序口径'],
          ['占比', '判断贡献程度', '23%', '单品销售额 / 总销售额', '占比过高要看风险'],
          ['趋势', '判断是否持续变好', '+12%', '本期 vs 上期', '不要只看单日'],
        ]
      )
    : isFinance
      ? table(
          ['字段名', '用途', '示例值', '填写 / 计算规则', '检查点'],
          [
            ['月份', '记录周期', '2026年6月', '与数据来源周期一致', '周期不清不汇总'],
            ['收入', '本期收入规模', '120000', '按实际入账口径统计', '和流水核对'],
            ['成本', '本期直接成本', '76000', '只放与收入直接相关成本', '口径要一致'],
            ['毛利', '判断经营质量', '44000', '收入 - 成本', '公式可复算'],
            ['毛利率', '判断利润效率', '36.7%', '毛利 / 收入', '收入为 0 不计算'],
            ['异常说明', '解释明显变化', '成本上升来自...', '只解释影响结论的异常', '没有原因先标待确认'],
          ]
        )
      : table(
          ['字段', '用途', '示例', '规则', '检查点'],
          [
            ['时间范围', '限定分析周期', '本周 / 本月', '和数据来源一致', '不能混用周期'],
            ['核心数据', '记录最关键数字', '订单数 / 销售额', '只放影响判断的数据', '来源可追溯'],
            ['反馈类别', '整理文字反馈', '价格 / 产品 / 服务', '保留原话线索', '不要只写主观猜测'],
            ['可能原因', '形成假设', '价格感知偏高', '必须能被验证', '每个原因有证据'],
            ['下一步动作', '小范围调整', '测试一个套餐', '7 天内能观察', '动作要有指标'],
          ]
        );

  const reasonTable = isSales
    ? table(
        ['判断维度', '需要看的数据', '可能原因', '验证动作', '下一步动作'],
        [
          ['销量排名', '各产品销量', '爆品集中或长尾太多', '按销量排序 Top 10', '保留高销量产品，检查低销量产品'],
          ['销售额贡献', '销售额和占比', '高销量但低收入', '按销售额排序', '调整组合或价格'],
          ['趋势变化', '本期 vs 上期', '活动、季节、库存影响', '看连续 7 天趋势', '继续观察或调整陈列'],
        ]
      )
    : table(
        ['原因维度', '需要看的数据 / 反馈', '可能原因', '验证动作', '调整建议'],
        [
          ['价格', '客单价、价格相关反馈', '用户觉得价值不清', '看评价是否提到贵/不值', '测试套餐或价值说明'],
          ['产品', '复购、退单、低分评价', '产品体验不稳定', '分类高频差评', '先修最高频问题'],
          ['流量', '订单数、时段、来源', '曝光或到店减少', '对比上周同日', '测试引流或时段动作'],
          ['流程', '等待时长、投诉、员工反馈', '高峰流程卡住', '观察高峰时段', '调整排班或出餐顺序'],
        ]
      );

  return {
    usableOutput: {
      title: `${frame.centerOutput.name}第一版`,
      sections: normalizeSections([
        { heading: '数据字段表', content: fields },
        { heading: '原因判断维度', content: reasonTable },
        { heading: '反馈 / 数据分类表', content: table(['来源', '原始信息', '分类', '可能原因', '处理建议'], [['订单流水', '【数据变化】', '数据', '待判断', '和对比周期核对'], ['顾客反馈', '【原话】', '反馈', '待判断', '归入价格/产品/流程等维度']]) },
        { heading: '可能原因', content: '先不要一次下结论。把可能原因拆成：数据变化、用户反馈、外部环境、内部流程四类，每一类至少找 1 条证据。' },
        { heading: '下一步调整动作', content: '第 1 天：整理字段表。\n第 2 天：找出最大变化项。\n第 3 天：分类反馈。\n第 4-5 天：只测试一个调整动作。\n第 6 天：观察数据变化。\n第 7 天：决定继续、停止或换方向。' },
        ...(isFinance ? [{ heading: '说明文案模板', content: '本期【核心指标】为【数值】，相比【对比周期】变化【比例】。\n主要原因可能是【原因一】和【原因二】。\n其中最需要关注的是【异常项目】，它可能影响【影响范围】。\n下一步建议先确认【待确认信息】，再决定【调整动作】。' }] : []),
      ]),
    },
    copyableTemplates: [
      { title: '分析字段表', content: fields },
      { title: '原因判断表', content: reasonTable },
      { title: '下一步调整动作', content: '本周只验证一个原因假设：【原因假设】。\n要看的指标：【指标】。\n要做的动作：【动作】。\n7 天后判断：如果【指标变化】，就继续；如果没有变化，就换下一个原因假设。' },
      ...(isFinance ? [{ title: '说明文案模板', content: '本期【核心指标】为【数值】，相比【对比周期】变化【比例】。\n主要原因可能是【原因一】和【原因二】。\n其中最需要关注的是【异常项目】，它可能影响【影响范围】。\n下一步建议先确认【待确认信息】，再决定【调整动作】。' }] : []),
    ],
    nextRefinementPrompt: '例如：我有上周和本周的订单流水，还有 20 条顾客评价。',
  };
}

function renderRubricAssignment(): RenderedDeliverables {
  const rubric = table(
    ['评分维度', '权重', '优秀标准', '合格标准', '常见扣分点'],
    [
      ['作业目标', '20%', '问题清楚，调研范围明确', '能说明主题', '主题太大或不聚焦'],
      ['资料收集', '25%', '来源多样且标注清楚', '有基本资料', '堆资料、无来源'],
      ['分析判断', '30%', '能提炼规律和观点', '有简单分类', '只有描述没有分析'],
      ['表达呈现', '15%', '结构清楚、页面有层次', '基本能看懂', '信息混乱或重复'],
      ['提交规范', '10%', '格式、命名、页数符合要求', '基本按要求提交', '缺文件或命名混乱'],
    ]
  );
  const message = '本次作业要求大家围绕【课程主题】完成一次设计调研。\n请提交【提交物一】、【提交物二】和【提交物三】。\n评分会重点看：调研目标是否清楚、资料是否有来源、分析是否有自己的判断、表达是否清晰。\n请注意：不要只堆资料，必须说明你的观察和判断。';

  return {
    usableOutput: {
      title: '作业说明 / 评分标准第一版',
      sections: normalizeSections([
        { heading: '作业目标', content: '让学生围绕【课程主题】完成一次有明确对象、资料来源和分析判断的设计调研。' },
        { heading: '任务说明', content: '选择一个具体调研对象，收集资料，整理观察，提炼 2-3 个发现，并用 PPT 或文档展示。' },
        { heading: '提交物清单', content: '- 调研主题说明\n- 资料来源截图或链接\n- 3-5 页汇报内容\n- 结论或反思\n- 文件命名：【姓名-课程-调研主题】' },
        { heading: '评分标准表', content: rubric },
        { heading: '学生常见误解提示', content: '- 不是资料越多越好，而是资料要能支撑结论。\n- 不是只做版面排版，要有分析判断。\n- 图片必须配说明，不要只放图。\n- 结论要回应调研目标。' },
        { heading: '可复制发布文案', content: message },
      ]),
    },
    copyableTemplates: [
      { title: '作业发布文案', content: message },
      { title: '评分标准表', content: rubric },
    ],
    nextRefinementPrompt: '例如：课程主题是城市视觉调研，提交形式是 5 页 PPT，满分 100 分。',
  };
}

function renderRubricSelfAssessment(): RenderedDeliverables {
  const selfRubric = table(
    ['维度', '5分标准', '3分标准', '1分标准', '今日记录', '明日改进'],
    [
      ['投入时间', '完成计划时长且专注', '完成一半以上', '几乎没开始', '【分钟】', '【调整动作】'],
      ['理解程度', '能复述并举例', '大致理解但不稳', '看完仍说不清', '【卡点】', '【补练内容】'],
      ['输出结果', '留下可检查成果', '有零散记录', '没有产出', '【成果】', '【下一步】'],
      ['复盘质量', '写清问题和改进', '只记录完成情况', '没有复盘', '【发现】', '【改进】'],
    ]
  );

  return {
    usableOutput: {
      title: '自评评分标准 / 每日记录表第一版',
      sections: normalizeSections([
        { heading: '自评维度', content: '从投入时间、理解程度、输出结果、复盘质量四个维度评分，避免只凭感觉判断今天学得好不好。' },
        { heading: '评分等级', content: selfRubric },
        { heading: '每日记录表', content: table(['日期', '学习内容', '总分', '最大卡点', '明日改进'], [['【日期】', '【内容】', '【分数】', '【卡点】', '【动作】']]) },
        { heading: '改进建议', content: '如果连续两天低于 3 分，先降低任务难度；如果输出结果为空，第二天必须改成能留下可见成果的小任务。' },
        { heading: '复盘问题', content: '1. 今天真正完成了什么？\n2. 哪一步最卡？\n3. 是时间不够、方法不清，还是材料太难？\n4. 明天要降低难度还是增加练习？' },
      ]),
    },
    copyableTemplates: [
      { title: '每日自评表', content: selfRubric },
      { title: '复盘问题', content: '今天完成了：\n最大卡点是：\n我给自己的分数是：\n明天先改：' },
    ],
    nextRefinementPrompt: '例如：我每天学英语 40 分钟，想用这个表记录口语练习效果。',
  };
}

function renderValidationPlan(): RenderedDeliverables {
  const interview = '1. 你上一次遇到【问题】是什么时候？\n2. 当时你怎么解决？花了多少时间或成本？\n3. 现在的解决方式哪里不满意？\n4. 如果有一个最小版本只解决【核心动作】，你会愿意试用吗？为什么？\n5. 什么结果会让你愿意继续使用或推荐？';
  const mvp = '必须做：解决一个核心痛点的最小功能。\n暂不做：账号体系、复杂配置、完整自动化、非验证必需功能。\n判断标准：目标用户是否愿意试用、是否能完成关键动作、是否愿意继续反馈。';

  return {
    usableOutput: {
      title: '产品验证方案 / MVP 范围第一版',
      sections: normalizeSections([
        { heading: '核心假设拆解', content: '1. 痛点假设：目标用户真的有这个问题。\n2. 替代方案假设：他们现在的解决方式不够好。\n3. MVP 假设：第一版只解决一个关键动作也有人愿意试。\n4. 持续使用假设：用户愿意再次使用或推荐。' },
        { heading: '目标用户', content: '先选择最容易接触的 5-8 个目标用户。不要泛泛找“所有人”，而是找最近 30 天内真实遇到过这个问题的人。' },
        { heading: '访谈问题', content: interview },
        { heading: 'MVP 功能范围', content: mvp },
        { heading: '验证指标', content: '- 至少 5 次有效访谈。\n- 至少 3 人有近期真实案例。\n- 至少 2 人愿意试用最小版本。\n- 能明确说出一个最该做的 MVP 功能。' },
        { heading: '两周执行计划', content: '第 1-2 天：确定目标用户和访谈名单。\n第 3-6 天：完成 5-8 次访谈。\n第 7-9 天：整理痛点和替代方案。\n第 10-12 天：定义 MVP 范围。\n第 13-14 天：判断继续、缩小或换方向。' },
      ]),
    },
    copyableTemplates: [
      { title: '用户访谈问题', content: interview },
      { title: 'MVP 范围清单', content: mvp },
      { title: '两周执行计划', content: '第1-2天：找人\n第3-6天：访谈\n第7-9天：整理\n第10-12天：定 MVP\n第13-14天：做判断' },
    ],
    nextRefinementPrompt: '例如：目标用户是刚开始做自媒体的人，我已经有 3 个竞品截图。',
  };
}

function renderMetricAnalysis(): RenderedDeliverables {
  const metricTable = table(
    ['指标', '当前变化', '对比周期', '异常区间', '影响范围', '可能原因', '验证方式', '下一步建议'],
    [
      ['DAU', '【上升/下降】', '本周 vs 上周', '【日期】', '活跃规模', '渠道、活动、入口变化', '按渠道和日期拆分', '确认流量来源'],
      ['转化率', '【变化比例】', '本期 vs 上期', '【漏斗环节】', '目标动作', '页面、价格、流程、用户质量', '看漏斗掉点', '找最大掉点环节'],
      ['留存', '【次日/7日变化】', 'cohort 对比', '【用户批次】', '长期价值', '新用户质量、体验、需求不匹配', '分 cohort 对比', '看新老用户差异'],
      ['订单量', '【变化趋势】', '本期 vs 上期', '【时间段】', '业务结果', '流量、转化、客单、供给', '拆成流量 x 转化', '定位前端还是后端问题'],
    ]
  );
  const summary = '本次指标变化的核心结论是【结论】。\n主要异常出现在【指标 / 人群 / 时间段】。\n目前更可能的原因是【原因】，证据是【证据】。\n仍需验证的是【待验证项】。\n下一步建议先做【动作】，观察【指标】是否变化。';

  return {
    usableOutput: {
      title: '业务指标分析结论 / 异常解释表第一版',
      sections: normalizeSections([
        { heading: '指标变化表', content: metricTable },
        { heading: '异常解释表', content: metricTable },
        { heading: '影响范围', content: '分别判断异常影响的是流量入口、转化链路、留存质量还是最终订单结果。不要只看一个总数，要拆到时间段、人群或渠道。' },
        { heading: '验证方式', content: '- 按日期拆分，确认异常从哪一天开始。\n- 按渠道/人群拆分，确认是否集中在某类用户。\n- 对照产品、活动、投放、价格或流程变更时间点。\n- 用漏斗或 cohort 验证解释是否成立。' },
        { heading: '汇报结论模板', content: summary },
      ]),
    },
    copyableTemplates: [
      { title: '指标变化表', content: metricTable },
      { title: '异常解释表', content: metricTable },
      { title: '汇报结论模板', content: summary },
    ],
    nextRefinementPrompt: '例如：转化率从 12% 降到 8%，主要发生在新用户和移动端。',
  };
}

function renderRiskPlan(): RenderedDeliverables {
  const riskTable = table(
    ['风险点', '影响范围', '触发条件', '预防动作', '回滚方案'],
    [
      ['线上用户受影响', '核心流程', '错误率超过阈值', '灰度发布、保留旧入口', '立即切回旧流程'],
      ['接口兼容问题', '前端/后端/第三方', '返回字段不一致', '先做兼容层和联调清单', '恢复旧接口调用'],
      ['数据或会话异常', '用户状态/历史记录', 'session 异常', '上线前跑核心路径', '回滚 session 改动'],
      ['改动范围失控', '排期和测试', '临时加入非核心需求', '冻结第一版范围', '拆到下一版'],
    ]
  );
  const note = '这次改造的目标是【目标】。\n第一版范围只包括【范围】，暂不处理【不做内容】。\n主要风险是【风险1】和【风险2】，我们会通过【灰度 / 回滚 / 监控】控制。\n需要团队配合的是【配合事项】。';

  return {
    usableOutput: {
      title: '改造方案 / 风险计划第一版',
      sections: normalizeSections([
        { heading: '改造目标', content: '明确这次改造要解决什么问题、影响哪些对象、第一版做到什么程度。' },
        { heading: '任务拆解', content: table(['阶段', '任务', '依赖', '完成标准'], [['准备', '确认范围和风险', '需求说明', '范围冻结'], ['实施', '完成核心改动', '代码/配置', '核心路径可跑'], ['验证', '灰度和回归', '测试环境', '可回滚']]) },
        { heading: '风险清单', content: riskTable },
        { heading: '灰度 / 回滚检查', content: '- [ ] 是否保留旧入口。\n- [ ] 是否有监控指标。\n- [ ] 是否明确回滚触发条件。\n- [ ] 是否知道谁负责决策。' },
        { heading: '团队说明文案', content: note },
      ]),
    },
    copyableTemplates: [
      { title: '风险清单', content: riskTable },
      { title: '团队说明文案', content: note },
    ],
    nextRefinementPrompt: '例如：这次改造影响登录链路，计划先灰度 10% 用户。',
  };
}

function renderExperienceRewrite(): RenderedDeliverables {
  const star = '背景：在【项目 / 课程 / 实习】中，我面对【具体问题】。\n任务：我负责【具体职责】，需要完成【交付物】。\n行动：我通过【方法 / 工具 / 协作】完成了【关键动作】。\n结果：最终产出【结果】，带来【反馈 / 数据 / 质量提升】。\n能力证明：这段经历体现了我的【岗位相关能力】。';
  const rewrite = '我在【项目名称】中负责【个人职责】，目标是解决【具体问题】。\n我通过【方法/工具】完成了【关键动作】，并产出【交付物】。\n最终结果是【结果/反馈/数据】，这段经历体现了我的【岗位相关能力】。';

  return {
    usableOutput: {
      title: '项目经历优化方案第一版',
      sections: normalizeSections([
        { heading: '项目经历诊断', content: '如果只写“做了品牌设计、海报设计、UI设计”，会像任务列表。需要补出目标、个人动作、方法和结果。' },
        { heading: 'STAR 改写模板', content: star },
        { heading: '可替换项目描述', content: rewrite },
        { heading: '量化结果补充清单', content: '- 项目周期：用了多久？\n- 产出规模：多少页面 / 海报 / 方案 / 组件？\n- 反馈结果：老师、用户、同事怎么评价？\n- 效率变化：是否更快、更清晰、更稳定？\n- 对比证明：修改前后有什么差异？' },
        { heading: '投递前检查清单', content: '- [ ] 是否出现目标岗位关键词。\n- [ ] 是否说明个人贡献，而不是团队泛描述。\n- [ ] 是否有结果或反馈。\n- [ ] 是否避免“负责相关工作”这种空话。\n- [ ] 是否能被招聘方快速看懂。' },
      ]),
    },
    copyableTemplates: [
      { title: 'STAR 项目经历模板', content: star },
      { title: '可替换项目描述', content: rewrite },
      { title: '量化结果补充清单', content: '周期：\n规模：\n反馈：\n效率：\n对比：' },
    ],
    nextRefinementPrompt: '例如：目标岗位是 UI 设计，我有 1 个实习项目和 3 个课程项目。',
  };
}

function renderProjectRetrospective(): RenderedDeliverables {
  const record = table(
    ['项目名称', '当时目标', '做了什么', '结果如何', '学到什么', '下次怎么改'],
    [['【项目】', '【目标】', '【动作】', '【结果】', '【经验】', '【改进】']]
  );

  return {
    usableOutput: {
      title: '项目复盘结构 / 经验整理表第一版',
      sections: normalizeSections([
        { heading: '项目复盘结构', content: '按“目标 - 行动 - 结果 - 经验 - 下次改进”整理，重点服务经验沉淀和下一次改进。' },
        { heading: '项目记录表', content: record },
        { heading: '经验总结问题', content: '1. 当时真正想达成什么？\n2. 哪个判断后来证明是对的？\n3. 哪个动作最浪费时间？\n4. 如果重做一次，第一步会怎么改？' },
        { heading: '下次改进清单', content: '- [ ] 下次开始前先写目标。\n- [ ] 每周记录关键决策。\n- [ ] 保留过程材料。\n- [ ] 项目结束后 24 小时内复盘。' },
      ]),
    },
    copyableTemplates: [
      { title: '项目复盘记录表', content: record },
      { title: '经验总结问题', content: '我当时的目标是：\n我做了：\n结果是：\n我学到：\n下次我会：' },
    ],
    nextRefinementPrompt: '例如：我想复盘 3 个课程项目，重点看哪里拖慢了进度。',
  };
}

function renderClarificationFlow(): RenderedDeliverables {
  const clarifyTable = table(
    ['问题分类', '当前表现', '10分钟要写下什么', '今晚最小动作'],
    [
      ['目标', '不知道想得到什么', '今晚要留下的结果', '选一个最小结果'],
      ['材料', '不知道手上有什么', '已有 3 条信息', '整理到一处'],
      ['顺序', '不知道先做哪步', '所有待做事项', '选最容易开始的一步'],
      ['标准', '不知道做到什么算完成', '一个可检查标准', '做到能被看见即可'],
    ]
  );
  const action = '1. 用 3 分钟写下所有让你乱的事情。\n2. 用 3 分钟圈出最想先解决的一件。\n3. 用 4 分钟写下它的目标、已有材料和下一步。\n4. 今晚只完成一个 20 分钟内能结束的小动作。';

  return {
    usableOutput: {
      title: '问题澄清流程 / 下一步行动判断第一版',
      sections: normalizeSections([
        { heading: '问题分类', content: '现在信息不足，不适合假装给完整方案。先把混乱拆成目标、材料、顺序、标准四类。' },
        { heading: '10分钟澄清表', content: clarifyTable },
        { heading: '今晚最小行动', content: action },
        { heading: '继续补充问题', content: '补充：最急的一件事、已有材料、今天可用时间、最担心的阻碍。补完后再生成更完整的一版。' },
      ]),
    },
    copyableTemplates: [
      { title: '10分钟澄清表', content: clarifyTable },
      { title: '今晚最小行动', content: action },
    ],
    nextRefinementPrompt: '例如：我今晚只有 40 分钟，最急的是明天要交一份说明。',
  };
}

function renderGenericDocument(frame: ProblemFrame): RenderedDeliverables {
  if (hasAny(frame, ['短视频', '视频方案', '分镜', '脚本'])) return renderVideoLike(frame);
  if (hasAny(frame, ['工作流程很乱', '每天先做什么', '优先级'])) return renderWorkflowLike(frame);
  if (hasAny(frame, ['财务报表', '报表'])) return renderAnalysisTable(frame);

  const neutral = '这份材料想说明的是【核心信息】。\n接收方最需要理解的是【关键结论】。\n目前已有的信息包括【已有材料 / 数据 / 例子】。\n最需要补充的是【证据 / 数据 / 示例】。\n下一步请先检查【最影响理解的一段】是否足够清楚。';

  return {
    usableOutput: {
      title: `${frame.centerOutput.name}第一版`,
      sections: normalizeSections([
        { heading: '第一版成果', content: '先把目标、对象、已有材料、完成标准写清楚，再进入改写或制作。' },
        { heading: '可复制模板', content: neutral },
        { heading: '检查清单', content: genericChecklist() },
      ]),
    },
    copyableTemplates: [
      { title: '可复制模板', content: neutral },
      { title: '检查清单', content: genericChecklist() },
    ],
    nextRefinementPrompt: '例如：这份材料给谁看、现在有哪些内容、你希望改成什么效果。',
  };
}

function renderVideoLike(frame: ProblemFrame): RenderedDeliverables {
  const breakdown = table(
    ['环节', '时长', '画面内容', '字幕 / 口播', '镜头类型', '可替换元素', '我的版本怎么改'],
    [['开头', '0-3秒', '抛出问题', '【痛点句】', '特写/字幕卡', '问题对象', '换成自己的场景'], ['展开', '3-30秒', '展示过程', '【步骤说明】', '过程镜头', '素材', '换成已有素材'], ['结尾', '最后5秒', '展示结果', '【行动引导】', '结果镜头', '行动', '换成自己的目标']]
  );
  const script = '开头 3 秒：我想解决【具体问题】，但现在卡在【卡点】。\n中段展开：我先参考【参考对象】，拆出【结构】，再替换成【自己的内容】。\n画面展示：依次展示【素材1】、【素材2】、【过程】。\n结尾行动：如果你也想做，可以先用这个模板完成第一版。';
  const storyboard = table(['镜头编号', '画面', '口播 / 字幕', '素材需求', '备注'], [['1', '问题画面', '我现在想做...', '现状素材', '短'], ['2', '参考拆解', '这个模板分成...', '参考截图', '只拆结构'], ['3', '我的版本', '我替换成...', '已有素材', '突出变化']]);
  const assets = table(['素材', '类型', '对应镜头', '当前状态', '补充方式'], [['【素材名】', '文字/图片/视频', '镜头1', '已有/缺失', '补拍/AI初稿/查找']]);
  const flow = '找参考视频 → 拆解模板 → 提取结构 → 替换成自己的内容 → 生成脚本 → 生成分镜 → 整理素材 → 拍摄/生成画面 → 剪辑 → 复盘 → 更新模板库。';

  return {
    usableOutput: {
      title: `${frame.centerOutput.name}第一版`,
      sections: normalizeSections([
        { heading: '参考拆解框架', content: breakdown },
        { heading: '脚本结构', content: script },
        { heading: '分镜结构', content: storyboard },
        { heading: '素材整理清单', content: assets },
        { heading: '生产流程', content: flow },
      ]),
    },
    copyableTemplates: [
      { title: '短视频模板拆解表', content: breakdown },
      { title: '30-60 秒脚本模板', content: script },
      { title: '分镜表', content: storyboard },
      { title: '素材清单', content: assets },
      { title: '短视频生产 SOP', content: flow },
    ],
    nextRefinementPrompt: '例如：参考视频是口播混剪，我手上有 8 段素材，想先做 45 秒版本。',
  };
}

function renderWorkflowLike(frame: ProblemFrame): RenderedDeliverables {
  const flow = table(
    ['步骤', '输入物', '操作', '输出物', '完成标准 / 检查点'],
    [
      ['1', '所有待处理事项', '收集任务池，不先判断重要性', '完整任务列表', '没有遗漏明显任务'],
      ['2', '任务列表', '标记截止时间、影响程度、依赖关系', '优先级标签', '知道哪些必须今天处理'],
      ['3', '优先级标签', '选出 1 个主任务 + 2 个次任务', '今日执行清单', '今天不再反复选择'],
      ['4', '今日执行清单', '安排时间块和检查点', '时间块计划', '每个任务有开始和结束标准'],
      ['5', '当天执行结果', '结束前记录完成、卡点、明天入口', '复盘记录', '明天能接着推进'],
    ]
  );
  const sop = '收集任务 → 标记优先级 → 选出今日主线 → 安排时间块 → 执行 → 复盘 → 更新下一步。';

  return {
    usableOutput: {
      title: `${frame.centerOutput.name}第一版`,
      sections: normalizeSections([
        { heading: '执行流程', content: flow },
        { heading: '优先级规则', content: '先做有截止时间、会影响别人、会阻塞后续步骤的任务；再做能产出可见结果的任务；最后处理可以批量化或延后的任务。' },
        { heading: '每日执行 SOP', content: sop },
      ]),
    },
    copyableTemplates: [
      { title: '每日执行 SOP', content: sop },
      { title: '优先级表', content: flow },
    ],
    nextRefinementPrompt: '例如：我每天有 6 个任务，其中 2 个有截止时间，1 个需要等别人反馈。',
  };
}

function renderByContract(frame: ProblemFrame, contractId: OutputContractId): RenderedDeliverables {
  if (contractId === 'message_draft') return renderMessageDraft();
  if (contractId === 'research_report') return renderResearchReport();
  if (contractId === 'analysis_table') return renderAnalysisTable(frame);
  if (contractId === 'rubric_assignment') return renderRubricAssignment();
  if (contractId === 'rubric_self_assessment') return renderRubricSelfAssessment();
  if (contractId === 'validation_plan') return renderValidationPlan();
  if (contractId === 'metric_analysis') return renderMetricAnalysis();
  if (contractId === 'risk_plan') return renderRiskPlan();
  if (contractId === 'experience_rewrite') return renderExperienceRewrite();
  if (contractId === 'project_retrospective') return renderProjectRetrospective();
  if (contractId === 'clarification_flow') return renderClarificationFlow();
  return renderGenericDocument(frame);
}

export function renderDeliverables(frame: ProblemFrame, contract: OutputContract): RenderedDeliverables {
  if (frame.inputAsset && frame.inputAsset.inputMode !== 'problem_only') {
    return renderInputAsset(frame);
  }

  return renderByContract(frame, contract.contractId);
}
