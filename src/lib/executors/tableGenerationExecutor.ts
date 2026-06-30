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

export function runTableGenerationExecutor(context: ExecutorContext): ExecutorResult {
  const needsCalculation = hasNeed(context, ['计算', '判断', '公式', '字段', '数据', '表格']);
  const needsExplanation = hasNeed(context, ['汇报', '说明', '表达', '接收方']);

  const fieldRows = [
    ['周期 / 对象', '标记这份表对应的时间或对象', '本月 / 本项目 / 本批次', '必须和数据来源一致', '范围不清时先不要汇总'],
    ['核心指标', '记录最需要被判断的数字或状态', '收入、完成量、数量、评分', '只放会影响判断的指标', '指标过多时先保留 5 个以内'],
    ['来源', '说明数据从哪里来', '系统导出、人工记录、流水、访谈', '每个数字都要能追溯', '来源不明时标记待确认'],
    ['计算 / 判断规则', '说明这个字段如何得到', 'A-B、A/B、求和、环比', '写成可复用规则', '公式不清楚时先写判断逻辑'],
    ['异常说明', '解释明显变化或不确定项', '本月增加来自...', '只解释影响结论的异常', '异常没有解释时不能直接下结论'],
    ['接收方备注', '把数据翻译成别人能理解的话', '需要关注... / 建议下一步...', '一句话说清影响', '避免只贴数字'],
  ];

  const fieldTable = [
    '| 字段名 | 用途 | 示例值 | 填写 / 计算规则 | 检查点 |',
    '| --- | --- | --- | --- | --- |',
    ...fieldRows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n');

  const calculationRules = [
    '1. 先确认每个核心指标的数据来源。',
    '2. 再写清计算关系，例如：结果 = 输入项 A - 输入项 B。',
    '3. 如果无法计算，就改成判断规则：高 / 中 / 低，正常 / 异常。',
    '4. 每个异常值都要补一句原因或待确认来源。',
  ].join('\n');

  const explanationTemplate = [
    '这份内容给【接收方 / 汇报对象】看的核心结论是：【关键结论】。',
    '本期【核心指标】为【数值】，相比【对比对象】变化【比例 / 状态】。',
    '主要原因是【原因 1】和【原因 2】。',
    '目前最需要关注的是【异常项】，它可能影响【影响范围】。',
    '下一步建议先确认【待确认信息】，再决定【下一步动作】。',
  ].join('\n');

  return {
    deliverableId: context.task.deliverableId,
    executorId: 'TABLE_GENERATION',
    status: 'completed',
    output: {
      title: `${context.task.title} - 表格结构`,
      sections: [
        {
          heading: '字段表',
          content: [
            `用途：${context.task.purpose}`,
            '',
            fieldTable,
          ].join('\n'),
        },
        ...(needsCalculation ? [{
          heading: '计算 / 判断逻辑',
          content: calculationRules,
        }] : []),
        ...(needsExplanation ? [{
          heading: '说明文案模板',
          content: explanationTemplate,
        }] : []),
      ],
      copyableBlocks: [
        {
          title: '字段表模板',
          content: fieldTable,
        },
        ...(needsCalculation ? [{
          title: '计算 / 判断逻辑模板',
          content: calculationRules,
        }] : []),
        ...(needsExplanation ? [{
          title: '说明文案模板',
          content: explanationTemplate,
        }] : []),
      ],
      structuredData: {
        rows: fieldRows.map(([name, purpose, example, rule, check]) => ({
          name,
          purpose,
          example,
          rule,
          check,
        })),
      },
    },
  };
}
