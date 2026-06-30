import type { ExecutorContext, ExecutorResult } from '@/types/executor';

function hasNeed(context: ExecutorContext, keywords: string[]): boolean {
  const source = [
    context.task.rawProblem,
    context.task.title,
    context.task.purpose,
    context.task.transformationNeeded.join(' '),
  ].join(' ');

  return keywords.some(keyword => source.includes(keyword));
}

function buildWorkflowContent(context: ExecutorContext): string {
  const productionFlow = hasNeed(context, ['参考', '仿照', '脚本', '分镜', '素材', '生产流程']);

  const rows = productionFlow
    ? [
        ['1', '参考对象', '拆解结构、节奏、可替换变量', '参考拆解表', '提取出可复用结构'],
        ['2', '自己的目标和素材', '替换成自己的对象、素材和表达重点', '脚本初稿', '每段都有可替换变量'],
        ['3', '脚本初稿', '拆成镜头 / 步骤 / 画面', '分镜表', '每个镜头对应一个信息点'],
        ['4', '分镜表', '整理已有和缺失素材', '素材清单', '每个素材都有使用位置'],
        ['5', '素材清单', '按顺序执行制作并复盘', '可复用生产流程', '下一次可以沿用同一流程'],
      ]
    : [
        ['1', '所有待处理事项', '收集任务池，不先判断重要性', '完整任务列表', '没有遗漏明显任务'],
        ['2', '任务列表', '标记截止时间、影响程度、依赖关系', '优先级标签', '知道哪些必须今天处理'],
        ['3', '优先级标签', '选出 1 个主任务 + 2 个次任务', '今日执行清单', '今天不再反复选择'],
        ['4', '今日执行清单', '安排时间块和检查点', '时间块计划', '每个任务有开始和结束标准'],
        ['5', '当天执行结果', '结束前记录完成、卡点、明天入口', '复盘记录', '明天能接着推进'],
      ];

  return [
    '| 步骤 | 输入物 | 操作 | 输出物 | 完成标准 / 检查点 |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map(row => `| ${row.join(' | ')} |`),
    '',
    productionFlow
      ? 'SOP：找参考 → 拆结构 → 替换变量 → 生成脚本 / 内容 → 拆步骤或分镜 → 整理素材 → 执行第一版 → 复盘 → 更新模板。'
      : 'SOP：收集任务 → 标记优先级 → 选出今日主线 → 安排时间块 → 执行 → 复盘 → 更新下一步。',
  ].join('\n');
}

function buildChecklistContent(context: ExecutorContext): string {
  return [
    `用途：${context.task.purpose}`,
    '',
    '- [ ] 目标是否一句话能说清。',
    '- [ ] 接收方或使用对象是否明确。',
    '- [ ] 每个模块是否有输入、处理和输出。',
    '- [ ] 是否至少有一个可复制的段落、表格或步骤。',
    '- [ ] 缺失信息是否用【占位符】标出。',
    '- [ ] 下一步动作是否能在今天执行。',
  ].join('\n');
}

function buildOutlineContent(context: ExecutorContext): string {
  return [
    `用途：${context.task.purpose}`,
    '',
    '1. 先说明目标：这份成果要让谁理解什么。',
    '2. 再说明现状：你现在已有的信息、材料或限制。',
    '3. 展开核心内容：按 3-5 个模块组织，不要堆散点。',
    '4. 补充证据：放入数据、例子、过程、对比或参考。',
    '5. 给出下一步：看完后对方应该做什么，或你下一步要改哪里。',
  ].join('\n');
}

export function runLlmReasoningExecutor(context: ExecutorContext): ExecutorResult {
  const content =
    context.task.deliverableType === 'workflow'
      ? buildWorkflowContent(context)
      : context.task.deliverableType === 'checklist'
        ? buildChecklistContent(context)
        : buildOutlineContent(context);

  return {
    deliverableId: context.task.deliverableId,
    executorId: 'LLM_REASONING',
    status: 'completed',
    output: {
      title: `${context.task.title} - 结构推理`,
      sections: [
        {
          heading: context.task.title,
          content,
        },
      ],
      copyableBlocks: [
        {
          title: context.task.deliverableType === 'workflow' ? '执行 SOP' : '结构检查清单',
          content,
        },
      ],
    },
  };
}
