import type { SolutionResult } from '@/types/radar';
import type { OutputContract } from './outputContract';
import type { ProblemFrame } from './problemFrameEngine';

type RenderedDeliverables = Pick<SolutionResult, 'usableOutput' | 'copyableTemplates' | 'nextRefinementPrompt'>;

type Deliverable = OutputContract['deliverables'][number];
type CopyableTemplate = SolutionResult['copyableTemplates'][number];

function hasNeed(frame: ProblemFrame, keyword: string): boolean {
  return frame.rawProblem.includes(keyword) || frame.transformationNeeded.some(item => item.includes(keyword));
}

function hasAnyNeed(frame: ProblemFrame, keywords: string[]): boolean {
  return keywords.some(keyword => hasNeed(frame, keyword));
}

function missingLabel(frame: ProblemFrame, index: number, fallback: string): string {
  return frame.missingInfo[index] || fallback;
}

function renderTableDeliverable(frame: ProblemFrame, deliverable: Deliverable): string {
  const rows = [
    ['周期 / 对象', '标记这份表对应的时间或对象', '本月 / 本项目 / 本批次', '必须和数据来源一致', '缺失时先不要汇总'],
    ['核心指标', '记录最需要被判断的数字或状态', '收入、完成量、数量、评分', '只放会影响判断的指标', '指标过多时先保留 5 个以内'],
    ['来源', '说明数据从哪里来', '系统导出、人工记录、流水、访谈', '每个数字都要能追溯', '来源不明时标记待确认'],
    ['计算规则', '说明这个字段如何得到', 'A-B、A/B、求和、环比', '写成可复用规则', '公式不清楚时先写判断逻辑'],
    ['异常说明', '解释明显变化或不确定项', '本月增加来自……', '只解释影响结论的异常', '异常没有解释时不能直接下结论'],
    ['接收方备注', '把数据翻译成别人能理解的话', '需要关注…… / 建议下一步……', '一句话说清影响', '避免只贴数字'],
  ];

  const fieldTable = [
    '| 字段名 | 用途 | 示例值 | 填写 / 计算规则 | 检查点 |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n');

  const logic = hasAnyNeed(frame, ['计算逻辑', '判断'])
    ? [
        '',
        '计算 / 判断逻辑：',
        '1. 先确认每个核心指标的数据来源。',
        '2. 再写清计算关系，例如：结果 = 输入项 A - 输入项 B。',
        '3. 如果无法计算，就改成判断规则：高 / 中 / 低，正常 / 异常。',
        '4. 每个异常值都要补一句原因或待确认来源。',
      ].join('\n')
    : '';

  const reportCopy = hasAnyNeed(frame, ['汇报表达', '说明'])
    ? [
        '',
        '说明文案模板：',
        '本期【核心指标】为【数值】，相比【对比对象】变化【比例 / 状态】。',
        '主要原因是【原因 1】和【原因 2】。',
        '其中最需要关注的是【异常项】，它可能影响【影响范围】。',
        '下一步建议先确认【待确认信息】，再决定【下一步动作】。',
      ].join('\n')
    : '';

  return [
    `用途：${deliverable.purpose}`,
    '',
    fieldTable,
    logic,
    reportCopy,
  ].filter(Boolean).join('\n');
}

function renderWorkflowDeliverable(frame: ProblemFrame, deliverable: Deliverable): string {
  const isProductionFlow = hasAnyNeed(frame, ['拆解参考', '生成脚本', '生成分镜', '整理素材']);
  const isEfficiencyFlow = deliverable.title.includes('效率') || hasAnyNeed(frame, ['效率流程']);
  const rows = isProductionFlow
    ? [
        ['1', '参考对象', '拆解结构、节奏、可替换变量', '参考拆解表', '提取出可复用结构'],
        ['2', '自己的目标和素材', '替换成自己的对象、素材和表达重点', '脚本初稿', '每段都有可替换变量'],
        ['3', '脚本初稿', '拆成镜头 / 步骤 / 画面', '分镜表', '每个镜头对应一个信息点'],
        ['4', '分镜表', '整理已有和缺失素材', '素材清单', '每个素材都有使用位置'],
        ['5', '素材清单', '按顺序执行制作并复盘', '可复用生产流程', '下一次可以沿用同一流程'],
      ]
    : isEfficiencyFlow
      ? [
          ['1', '已有材料', '让 AI 先提取结构和缺口', '问题清单', '只保留影响判断的缺口'],
          ['2', '问题清单', '让 AI 生成 2-3 个改写方向', '改写候选', '每个候选都有不同侧重点'],
          ['3', '改写候选', '人工选择最贴近目标对象的一版', '选定版本', '不让 AI 替你决定方向'],
          ['4', '选定版本', '让 AI 检查表达、证据和顺序', '检查结果', '检查项能对应回具体段落'],
          ['5', '检查结果', '人工补充真实证据和细节', '可交付版本', '保留真实信息和个人判断'],
        ]
    : [
        ['1', '所有待处理事项', '收集任务池，不先判断重要性', '完整任务列表', '没有遗漏明显任务'],
        ['2', '任务列表', '标记截止时间、影响程度、依赖关系', '优先级标签', '知道哪些必须今天处理'],
        ['3', '优先级标签', '选出 1 个主任务 + 2 个次任务', '今日执行清单', '今天不再反复选择'],
        ['4', '今日执行清单', '安排时间块和检查点', '时间块计划', '每个任务有开始和结束标准'],
        ['5', '当天执行结果', '结束前记录完成、卡点、明天入口', '复盘记录', '明天能接着推进'],
      ];

  return [
    `用途：${deliverable.purpose}`,
    '',
    '| 步骤 | 输入物 | 操作 | 输出物 | 完成标准 / 检查点 |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map(row => `| ${row.join(' | ')} |`),
    '',
    '优先级规则：',
    ...(isProductionFlow
      ? [
          '1. 先确定参考结构，再替换成自己的内容。',
          '2. 先完成能被检查的第一版，再补充风格和细节。',
          '3. 先整理已有素材，再决定哪些内容需要补拍、补写或用 AI 生成初稿。',
        ]
      : isEfficiencyFlow
        ? [
            '1. 先让 AI 做结构提取和初稿生成，不直接交付最终判断。',
            '2. 人工负责选择方向、补真实证据和确认目标对象。',
            '3. 每次只优化一个模块，避免一次性重写导致失真。',
          ]
      : [
          '1. 先做有截止时间、会影响别人、会阻塞后续步骤的任务。',
          '2. 再做能产出可见结果的任务。',
          '3. 最后处理可以批量化、模板化或延后的任务。',
        ]),
    '',
    isProductionFlow
      ? 'SOP：找参考 → 拆结构 → 替换变量 → 生成脚本 / 内容 → 拆步骤或分镜 → 整理素材 → 执行第一版 → 复盘 → 更新模板。'
      : isEfficiencyFlow
        ? 'SOP：输入已有材料 → AI 提取结构 → AI 生成候选 → 人工选择方向 → AI 检查缺口 → 人工补证据 → 输出可交付版本。'
      : 'SOP：收集任务 → 标记优先级 → 选出今日主线 → 安排时间块 → 执行 → 复盘 → 更新下一步。',
  ].join('\n');
}

function renderScriptDeliverable(frame: ProblemFrame, deliverable: Deliverable): string {
  const subject = frame.centerOutput.name;

  return [
    `用途：${deliverable.purpose}`,
    '',
    '可替换脚本结构：',
    `开头 3 秒：我现在要解决的是【${subject}】里的【具体卡点】。`,
    '中段展开：先展示【现状 / 材料 / 参考对象】，再说明【我采用的判断标准】。',
    '证据 / 展示：放入【数据 / 片段 / 过程 / 对比】证明这个判断不是空想。',
    '结尾行动：下一步我会先完成【最小动作】，用【检查标准】判断是否有效。',
    '',
    '可替换变量：',
    '- 【具体卡点】：你现在最不确定的一步。',
    '- 【判断标准】：别人看完后最需要确认的标准。',
    '- 【最小动作】：今天能完成的一小步。',
  ].join('\n');
}

function renderOutlineDeliverable(frame: ProblemFrame, deliverable: Deliverable): string {
  if (deliverable.title.includes('分镜')) {
    return [
      `用途：${deliverable.purpose}`,
      '',
      '| 镜头 / 步骤 | 画面或动作 | 文字说明 | 所需素材 | 备注 |',
      '| --- | --- | --- | --- | --- |',
      '| 1 | 展示当前问题或目标 | 说明为什么要做这件事 | 现状画面 / 文字卡 | 控制在开头 3 秒 |',
      '| 2 | 展示参考或输入材料 | 标出可借鉴的结构 | 参考截图 / 素材 | 只拆结构，不照抄内容 |',
      '| 3 | 展示自己的替换版本 | 说明如何换成自己的内容 | 自有素材 | 对应一个核心信息点 |',
      '| 4 | 展示初版结果 | 让别人看到可用成果 | 成果截图 / 文本 | 不追求完整，先可判断 |',
      '| 5 | 给出下一步 | 引导继续补充或验证 | 检查清单 | 留下可继续修改的入口 |',
    ].join('\n');
  }

  if (deliverable.title.includes('参考')) {
    return [
      `用途：${deliverable.purpose}`,
      '',
      '| 拆解项 | 参考对象怎么做 | 可复用规则 | 我的替换版本 |',
      '| --- | --- | --- | --- |',
      '| 目标 | 它想让人理解什么 | 先明确单一目标 | 我这次要让人理解【目标】 |',
      '| 结构 | 它按什么顺序展开 | 提取顺序，不复制内容 | 我的顺序是【1 / 2 / 3】 |',
      '| 变量 | 哪些内容可以替换 | 找到可替换位置 | 替换成我的【对象 / 素材 / 观点】 |',
      '| 节奏 | 哪一步最抓注意力 | 保留节奏逻辑 | 用我的材料重新表达 |',
      '| 检查 | 它为什么能被看懂 | 提取判断标准 | 用同一标准检查我的版本 |',
    ].join('\n');
  }

  return [
    `用途：${deliverable.purpose}`,
    '',
    '推荐结构：',
    '1. 先说明目标：这份成果要让谁理解什么。',
    '2. 再说明现状：你现在已有的信息、材料或限制。',
    '3. 展开核心内容：按 3-5 个模块组织，不要堆散点。',
    '4. 补充证据：放入数据、例子、过程、对比或参考。',
    '5. 给出下一步：看完后对方应该做什么，或你下一步要改哪里。',
  ].join('\n');
}

function renderDiagnosisDeliverable(frame: ProblemFrame, deliverable: Deliverable): string {
  return [
    `用途：${deliverable.purpose}`,
    '',
    '| 可能问题 | 为什么影响使用 | 修改方向 |',
    '| --- | --- | --- |',
    '| 目的不清 | 接收方不知道这份材料要解决什么 | 开头补一句“这份材料用于【用途】” |',
    '| 对象不清 | 不知道应该按谁的标准判断 | 写明接收方是【目标对象】 |',
    '| 结构松散 | 信息很多但没有阅读顺序 | 改成“目的 → 关键信息 → 证据 → 结论” |',
    '| 证据不足 | 只有判断，没有支撑 | 补充数据、例子、过程或对比 |',
    '| 下一步不明 | 看完不知道该怎么处理 | 结尾写清“希望对方判断 / 反馈 / 执行什么” |',
  ].join('\n');
}

function renderDocumentDeliverable(frame: ProblemFrame, deliverable: Deliverable): string {
  const isProjectLike = hasAnyNeed(frame, ['项目说明', '作品集']);

  if (isProjectLike) {
    return [
      `用途：${deliverable.purpose}`,
      '',
      '项目说明结构：',
      '项目背景：这个项目来自【真实场景 / 课程 / 需求】，要解决【问题】。',
      '目标对象：这份内容主要给【目标对象】看，他们最关心【判断标准】。',
      '我的角色：我负责【调研 / 结构 / 视觉 / 执行 / 复盘】中的【具体部分】。',
      '方法过程：我先【步骤 1】，再【步骤 2】，最后用【标准】检查结果。',
      '最终成果：最后产出了【成果】，它证明了【能力 / 判断 / 结果】。',
      '待补充证据：还需要补【数据 / 反馈 / 对比 / 过程图】。',
    ].join('\n');
  }

  return [
    `用途：${deliverable.purpose}`,
    '',
    '可替换段落模板：',
    '这份材料想说明的是【核心信息】。',
    '接收方最需要理解的是【关键结论】。',
    '目前已有的信息包括【已有材料 / 数据 / 例子】。',
    '为了让它更可信，还需要补充【证据 / 数据 / 示例】。',
    '建议下一步先修改【最影响理解的一段】，再检查整体结构。',
    '',
    '推荐结构：目的 → 关键信息 → 证据支撑 → 结论 / 下一步动作。',
  ].join('\n');
}

function renderChecklistDeliverable(frame: ProblemFrame, deliverable: Deliverable): string {
  if (deliverable.title.includes('计算') || deliverable.title.includes('判断')) {
    return [
      `用途：${deliverable.purpose}`,
      '',
      '| 输入项 | 处理逻辑 | 输出结果 | 异常说明 |',
      '| --- | --- | --- | --- |',
      '| 原始数据 A | 与 B 做差值、比例或状态判断 | 得到核心结果 | 如果来源不明，标记待确认 |',
      '| 对比数据 B | 用于环比、同比、前后对比或基准比较 | 得到变化方向 | 如果缺少基准，先写“无法判断” |',
      '| 判断标准 | 高 / 中 / 低，正常 / 异常，可用 / 不可用 | 得到行动建议 | 标准不清时先让接收方确认 |',
      '',
      '计算逻辑清单：',
      '- [ ] 每个结果都能追溯到输入项。',
      '- [ ] 每个公式或判断规则都写成可复用句子。',
      '- [ ] 每个异常结果都补充原因、影响和下一步处理建议。',
      '- [ ] 不确定的数据不要直接汇总，先标记“待确认”。',
    ].join('\n');
  }

  if (deliverable.title.includes('素材')) {
    return [
      `用途：${deliverable.purpose}`,
      '',
      '- [ ] 列出已有素材：文字、图片、表格、参考对象、数据、草稿。',
      '- [ ] 给每个素材标注用途：开头、说明、证明、展示、结尾。',
      '- [ ] 标出缺失素材：哪些地方没有证据或例子。',
      '- [ ] 写出补充方式：自己补写、重新整理、询问别人、用 AI 生成初稿。',
      '- [ ] 给素材命名：用途_来源_日期，避免后续找不到。',
    ].join('\n');
  }

  return [
    `用途：${deliverable.purpose}`,
    '',
    '- [ ] 目标是否一句话能说清。',
    '- [ ] 接收方是否明确。',
    '- [ ] 每个模块是否有输入、处理和输出。',
    '- [ ] 是否至少有一个可复制的段落、表格或步骤。',
    '- [ ] 缺失信息是否用【占位符】标出。',
    '- [ ] 下一步动作是否能在今天完成。',
  ].join('\n');
}

function renderGenericDeliverable(frame: ProblemFrame, deliverable: Deliverable): string {
  return [
    `用途：${deliverable.purpose}`,
    '',
    `第一版目标：先生成一份「${frame.centerOutput.name}」。`,
    '1. 明确接收方：谁会看或使用它。',
    '2. 明确输入：已有材料、数据、参考或限制是什么。',
    '3. 明确结构：先给出 3-5 个模块。',
    '4. 明确产出：每个模块至少有一段文字、一个字段表或一个步骤。',
    '5. 明确检查：做完后用清单判断是否能继续推进。',
  ].join('\n');
}

function renderSection(frame: ProblemFrame, deliverable: Deliverable): string {
  if (deliverable.type === 'table') return renderTableDeliverable(frame, deliverable);
  if (deliverable.type === 'workflow') return renderWorkflowDeliverable(frame, deliverable);
  if (deliverable.type === 'script') return renderScriptDeliverable(frame, deliverable);
  if (deliverable.type === 'outline') return renderOutlineDeliverable(frame, deliverable);
  if (deliverable.type === 'diagnosis') return renderDiagnosisDeliverable(frame, deliverable);
  if (deliverable.type === 'document') return renderDocumentDeliverable(frame, deliverable);
  if (deliverable.type === 'checklist') return renderChecklistDeliverable(frame, deliverable);
  return renderGenericDeliverable(frame, deliverable);
}

function buildFieldTableTemplate(): CopyableTemplate {
  return {
    title: '字段表模板',
    content: [
      '| 字段名 | 用途 | 示例值 | 填写 / 计算规则 | 检查点 |',
      '| --- | --- | --- | --- | --- |',
      '| 周期 / 对象 | 标记这份成果对应的范围 | 本月 / 本项目 | 和数据来源一致 | 范围不清不汇总 |',
      '| 核心指标 | 记录最需要判断的内容 | 数值 / 状态 / 结果 | 只放影响判断的指标 | 不超过 5 个核心指标 |',
      '| 来源 | 说明信息从哪里来 | 记录 / 数据 / 访谈 | 必须能追溯 | 来源不明要标记 |',
      '| 异常说明 | 解释明显变化 | 增加 / 下降 / 缺失 | 写清原因或待确认 | 无解释不下结论 |',
    ].join('\n'),
  };
}

function buildCalculationTemplate(): CopyableTemplate {
  return {
    title: '计算 / 判断逻辑模板',
    content: [
      '输入项：A =【输入 1】，B =【输入 2】',
      '处理逻辑：结果 = A 与 B 的差值 / 比例 / 状态判断',
      '输出结果：【结果值】',
      '异常说明：如果结果超过【阈值】，需要补充【原因 / 来源 / 处理建议】。',
    ].join('\n'),
  };
}

function buildReportTemplate(frame: ProblemFrame): CopyableTemplate {
  const audience = frame.audience || '接收方';

  return {
    title: '说明文案模板',
    content: [
      `这份内容给【${audience}】看的核心结论是：【关键结论】。`,
      '本期 / 本版最重要的变化是：【变化或结果】。',
      '主要原因是：【原因 1】和【原因 2】。',
      '目前最不确定的是：【待确认信息】。',
      '下一步建议先做：【具体动作】。',
    ].join('\n'),
  };
}

function buildDocumentTemplate(): CopyableTemplate {
  return {
    title: '通用材料改写模板',
    content: [
      '这份材料想说明的是【核心信息】。',
      '接收方最需要理解的是【关键结论】。',
      '目前已有的信息包括【已有材料 / 数据 / 例子】。',
      '最需要补充的是【证据 / 数据 / 示例】。',
      '下一步请先检查【最影响理解的一段】是否足够清楚。',
    ].join('\n'),
  };
}

function buildStructureTemplate(): CopyableTemplate {
  return {
    title: '结构框架模板',
    content: [
      '1. 目的：这份成果要解决什么问题？',
      '2. 对象：谁会看或使用它？',
      '3. 关键信息：对方必须先理解哪 3 点？',
      '4. 证据：用什么数据、例子、过程或对比支撑？',
      '5. 结论：看完后要做什么或判断什么？',
    ].join('\n'),
  };
}

function buildWorkflowTemplate(frame: ProblemFrame): CopyableTemplate {
  const isProductionFlow = hasAnyNeed(frame, ['拆解参考', '生成脚本', '生成分镜', '整理素材']);
  const isEfficiencyFlow = hasAnyNeed(frame, ['效率流程']);

  return {
    title: isProductionFlow ? '生产流程 SOP' : isEfficiencyFlow ? 'AI 提效流程 SOP' : '每日执行 SOP',
    content: isProductionFlow
      ? [
          '1. 找到 1 个参考对象，只拆结构，不复制内容。',
          '2. 提取它的顺序、节奏、变量和可替换元素。',
          '3. 把变量替换成自己的目标、素材和表达重点。',
          '4. 生成脚本，再拆成分镜或步骤。',
          '5. 整理已有素材和缺失素材。',
          '6. 执行第一版，结束后记录哪里卡住。',
        ].join('\n')
      : isEfficiencyFlow
        ? [
            '1. 输入已有材料，让 AI 提取结构和不清楚的地方。',
            '2. 让 AI 生成 2-3 个改写或整理方向。',
            '3. 人工选择最贴近目标对象的一版。',
            '4. 让 AI 按检查清单指出缺口。',
            '5. 人工补充真实证据、过程和判断。',
            '6. 输出一版可交付内容，并记录下一轮要改哪里。',
          ].join('\n')
      : [
          '1. 收集今天所有任务，先不排序。',
          '2. 给每个任务标注截止时间、影响程度、依赖关系。',
          '3. 选出 1 个主任务和 2 个次任务。',
          '4. 给主任务安排一个完整时间块。',
          '5. 每完成一步记录输出物。',
          '6. 结束前写下明天的入口任务。',
        ].join('\n'),
  };
}

function buildScriptTemplate(): CopyableTemplate {
  return {
    title: '脚本模板',
    content: [
      '开头：我现在要解决【具体问题】，最关键的是【判断标准】。',
      '展开：先展示【现状 / 参考 / 材料】，再说明【处理方法】。',
      '证据：这里放【数据 / 过程 / 对比 / 示例】。',
      '结尾：下一步我会先完成【最小动作】，用【检查标准】判断是否有效。',
      '可替换变量：【对象】、【问题】、【方法】、【证据】、【行动】。',
    ].join('\n'),
  };
}

function buildStoryboardTemplate(): CopyableTemplate {
  return {
    title: '分镜 / 步骤表',
    content: [
      '| 编号 | 画面或动作 | 文字说明 | 所需素材 | 备注 |',
      '| --- | --- | --- | --- | --- |',
      '| 1 | 展示问题 | 为什么要做这件事 | 现状素材 | 开头要短 |',
      '| 2 | 展示参考或输入 | 说明可借鉴结构 | 参考素材 | 只拆结构 |',
      '| 3 | 展示自己的版本 | 替换成自己的内容 | 自有素材 | 对应一个信息点 |',
      '| 4 | 展示结果 | 让人看到第一版成果 | 成果素材 | 可以继续改 |',
    ].join('\n'),
  };
}

function buildAssetTemplate(): CopyableTemplate {
  return {
    title: '素材清单',
    content: [
      '| 素材 | 类型 | 对应模块 | 当前状态 | 补充方式 |',
      '| --- | --- | --- | --- | --- |',
      '|  | 文字 / 图片 / 数据 / 参考 |  | 已有 / 缺失 | 自己补 / 询问 / AI 初稿 |',
    ].join('\n'),
  };
}

function buildChecklistTemplate(): CopyableTemplate {
  return {
    title: '检查清单',
    content: [
      '- [ ] 目标一句话说清了吗？',
      '- [ ] 接收方或使用对象明确了吗？',
      '- [ ] 每个模块都有具体内容，而不是只有标题吗？',
      '- [ ] 至少有一个字段表、段落、脚本或 SOP 可以复制吗？',
      '- [ ] 缺失信息是否用【占位符】标出？',
      '- [ ] 下一步动作是否能在今天执行？',
    ].join('\n'),
  };
}

function buildCopyableTemplates(frame: ProblemFrame, contract: OutputContract): CopyableTemplate[] {
  const templates: CopyableTemplate[] = [];

  if (contract.deliverables.some(item => item.type === 'table')) {
    templates.push(buildFieldTableTemplate());
  }

  if (hasAnyNeed(frame, ['计算逻辑', '判断'])) {
    templates.push(buildCalculationTemplate());
  }

  if (hasAnyNeed(frame, ['汇报表达', '说明'])) {
    templates.push(buildReportTemplate(frame));
  }

  if (contract.deliverables.some(item => item.type === 'diagnosis' || item.type === 'document')) {
    templates.push(buildDocumentTemplate());
  }

  if (contract.deliverables.some(item => item.type === 'outline')) {
    templates.push(buildStructureTemplate());
  }

  if (contract.deliverables.some(item => item.type === 'workflow')) {
    templates.push(buildWorkflowTemplate(frame));
  }

  if (contract.deliverables.some(item => item.type === 'script')) {
    templates.push(buildScriptTemplate());
  }

  if (contract.deliverables.some(item => item.title.includes('分镜'))) {
    templates.push(buildStoryboardTemplate());
  }

  if (contract.deliverables.some(item => item.title.includes('素材'))) {
    templates.push(buildAssetTemplate());
  }

  templates.push(buildChecklistTemplate());

  const seen = new Set<string>();
  return templates.filter(template => {
    if (seen.has(template.title)) return false;
    seen.add(template.title);
    return true;
  });
}

export function renderDeliverables(frame: ProblemFrame, contract: OutputContract): RenderedDeliverables {
  return {
    usableOutput: {
      title: contract.title,
      sections: contract.deliverables.map((deliverable, index) => ({
        heading: `${index + 1}. ${deliverable.title}`,
        content: renderSection(frame, deliverable),
      })),
    },
    copyableTemplates: buildCopyableTemplates(frame, contract),
    nextRefinementPrompt: frame.missingInfo.length > 0
      ? `例如：补充${frame.missingInfo.slice(0, 3).join('、')}，FutureLens 可以继续把字段、段落、步骤和检查标准改得更具体。`
      : '例如：补充真实使用对象、已有材料和格式要求，FutureLens 可以继续把这版成果改得更具体。',
  };
}
