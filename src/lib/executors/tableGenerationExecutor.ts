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

function buildStructuredTable(context: ExecutorContext): { heading: string; content: string; copyTitle: string } | null {
  if (context.task.deliverableType === 'analysis_table') {
    const content = [
      '| 判断维度 | 需要看的数据 / 反馈 | 可能原因 | 验证动作 | 调整建议 |',
      '| --- | --- | --- | --- | --- |',
      '| 客流 | 订单数、到店时段、评价提及 | 曝光下降、时段变化、竞品影响 | 对比上周同日和高峰时段 | 先测试引流或时段调整 |',
      '| 价格 | 客单价、低分评价、套餐反馈 | 用户觉得贵或价值不清 | 看评价是否出现贵、不值 | 测试套餐组合或价格说明 |',
      '| 产品 | 复购、菜品评价、退单 | 口味、出品、等待时间问题 | 分类高频差评 | 优先修最高频产品问题 |',
      '| 服务 | 等待时长、投诉、员工反馈 | 高峰流程卡住 | 观察 2 个高峰时段 | 调整排班或出餐顺序 |',
    ].join('\n');
    return { heading: context.task.title, content, copyTitle: context.task.title };
  }

  if (context.task.deliverableType === 'rubric') {
    const content = [
      '| 评分维度 | 权重 | 优秀标准 | 合格标准 | 常见扣分点 |',
      '| --- | --- | --- | --- | --- |',
      '| 作业目标 | 20% | 问题清楚，调研范围明确 | 能说明主题 | 主题太大或不聚焦 |',
      '| 资料收集 | 25% | 来源多样且标注清楚 | 有基本资料 | 堆资料、无来源 |',
      '| 分析判断 | 30% | 能提炼规律和观点 | 有简单分类 | 只有描述没有分析 |',
      '| 表达呈现 | 15% | 结构清楚、页面有层次 | 基本能看懂 | 信息混乱或重复 |',
      '| 提交规范 | 10% | 格式、命名、页数符合要求 | 基本按要求提交 | 缺文件或命名混乱 |',
    ].join('\n');
    return { heading: context.task.title, content, copyTitle: context.task.title };
  }

  if (context.task.deliverableType === 'metric_analysis') {
    const content = [
      '| 指标 | 当前变化 | 可能原因 | 影响范围 | 验证方式 | 下一步建议 |',
      '| --- | --- | --- | --- | --- | --- |',
      '| DAU | 【变化】 | 渠道、活动、入口变化 | 活跃规模 | 按渠道和日期拆分 | 确认流量来源 |',
      '| 转化率 | 【变化】 | 页面、价格、流程、用户质量 | 目标动作 | 看漏斗掉点 | 找最大掉点环节 |',
      '| 留存 | 【变化】 | 新用户质量、体验、需求不匹配 | 长期价值 | 分 cohort 对比 | 看新老用户差异 |',
      '| 订单量 | 【变化】 | 流量、转化、客单、供给 | 业务结果 | 拆成流量 x 转化 | 定位前端还是后端问题 |',
    ].join('\n');
    return { heading: context.task.title, content, copyTitle: context.task.title };
  }

  if (context.task.deliverableType === 'risk_plan') {
    const content = [
      '| 风险点 | 影响范围 | 触发条件 | 预防动作 | 回滚方案 |',
      '| --- | --- | --- | --- | --- |',
      '| 线上用户受影响 | 登录、会话、关键路径 | 错误率超过阈值 | 灰度发布、保留旧入口 | 切回旧流程 |',
      '| 接口兼容问题 | 前后端和第三方服务 | 返回字段不一致 | 兼容层和联调清单 | 恢复旧接口调用 |',
      '| 数据或状态异常 | 用户资料、历史记录 | session/cookie 异常 | 上线前跑核心路径 | 回滚 session 改动 |',
      '| 改动范围失控 | 排期和测试 | 临时加入非核心需求 | 冻结第一版范围 | 拆到下一期 |',
    ].join('\n');
    return { heading: context.task.title, content, copyTitle: context.task.title };
  }

  if (context.task.deliverableType === 'clarification_flow') {
    const content = [
      '| 问题类别 | 当前表现 | 10分钟要写下什么 | 今晚最小动作 |',
      '| --- | --- | --- | --- |',
      '| 目标 | 不知道想得到什么 | 写下今晚要留下的结果 | 选一个最小结果 |',
      '| 材料 | 不知道手上有什么 | 列出已有 3 条信息 | 整理到一处 |',
      '| 顺序 | 不知道先做哪步 | 写下所有待做事项 | 选最容易开始的一步 |',
      '| 标准 | 不知道做到什么算完成 | 写下一个可检查标准 | 做到能被看见即可 |',
    ].join('\n');
    return { heading: context.task.title, content, copyTitle: context.task.title };
  }

  return null;
}

export function runTableGenerationExecutor(context: ExecutorContext): ExecutorResult {
  const structured = buildStructuredTable(context);

  if (structured) {
    return {
      deliverableId: context.task.deliverableId,
      executorId: 'TABLE_GENERATION',
      status: 'completed',
      output: {
        title: `${context.task.title} - 表格结构`,
        sections: [
          {
            heading: structured.heading,
            content: structured.content,
          },
        ],
        copyableBlocks: [
          {
            title: structured.copyTitle,
            content: structured.content,
          },
        ],
      },
    };
  }

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
            heading: context.task.title,
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
