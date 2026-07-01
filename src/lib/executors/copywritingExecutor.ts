import type { ExecutorContext, ExecutorResult } from '@/types/executor';

function isScriptTask(context: ExecutorContext): boolean {
  return context.task.deliverableType === 'script' || context.task.transformationNeeded.some(item => item.includes('脚本'));
}

function buildScriptCopy(context: ExecutorContext): string {
  return [
    `开头：我现在要解决【${context.task.centerOutput}】里的【具体卡点】。`,
    '展开：先展示【现状 / 材料 / 参考对象】，再说明【我采用的处理方法】。',
    '证据：这里放【数据 / 过程 / 对比 / 示例】，证明这个判断不是空想。',
    '结尾：下一步我会先完成【最小动作】，用【检查标准】判断是否有效。',
    '可替换变量：【对象】、【问题】、【方法】、【证据】、【行动】。',
  ].join('\n');
}

function buildDocumentCopy(): string {
  return [
    '这份材料想说明的是【核心信息】。',
    '接收方最需要理解的是【关键结论】。',
    '目前已有的信息包括【已有材料 / 数据 / 例子】。',
    '为了让它更可信，还需要补充【证据 / 数据 / 示例】。',
    '建议下一步先修改【最影响理解的一段】，再检查整体结构。',
  ].join('\n');
}

function buildStructuredCopy(context: ExecutorContext): string | null {
  if (context.task.deliverableType === 'research_report') {
    return [
      '本次汇报围绕【调研主题】展开，主要想回答【核心问题】。',
      '我目前收集了【照片 / 资料 / 观察记录】，会从【文化元素】、【资料证据】和【个人发现】三个部分说明。',
      '最后会总结这次调研对【课程主题 / 作业要求】的启发，并标出还需要补充的资料。',
    ].join('\n');
  }

  if (context.task.deliverableType === 'validation_plan') {
    return [
      '访谈开场：我正在验证一个关于【目标用户】的产品想法，想了解你最近是否遇到过【问题】。',
      '行为问题：你上一次遇到这个问题是什么时候？当时怎么解决？',
      '痛点问题：现在的解决方式最麻烦或最不满意的地方是什么？',
      'MVP 判断：如果第一版只能解决【一个动作】，你会愿意试用吗？为什么？',
      '结束问题：什么结果会让你愿意继续使用或推荐给别人？',
    ].join('\n');
  }

  if (context.task.deliverableType === 'experience_rewrite') {
    return [
      '背景：在【项目 / 课程 / 实习】中，我面对【具体问题】。',
      '任务：我负责【具体职责】，需要完成【交付物】。',
      '行动：我通过【方法 / 工具 / 协作】完成了【关键动作】。',
      '结果：最终产出【结果】，带来【反馈 / 数据 / 质量提升】。',
      '能力证明：这段经历体现了我的【岗位相关能力】。',
    ].join('\n');
  }

  if (context.task.deliverableType === 'rubric') {
    return [
      '本次作业要求你围绕【课程主题】完成一份设计调研。',
      '请提交【调研说明】、【资料整理】、【分析结论】和【最终展示文件】。',
      '评分会重点看：目标是否清楚、资料是否可靠、分析是否有判断、表达是否完整。',
      '注意：不要只堆图片或资料，每一页都需要说明它和调研主题的关系。',
    ].join('\n');
  }

  if (context.task.deliverableType === 'metric_analysis') {
    return [
      '本次指标变化的核心结论是【结论】。',
      '异常主要出现在【指标 / 时间段 / 用户群】，目前更可能的原因是【原因】。',
      '支持这个判断的证据是【数据证据】，但仍需验证【待验证项】。',
      '下一步建议先做【动作】，观察【指标】是否回到预期范围。',
    ].join('\n');
  }

  if (context.task.deliverableType === 'risk_plan') {
    return [
      '这次改造的目标是【目标】，第一版范围只包括【范围】。',
      '主要风险是【风险 1】和【风险 2】，会通过【灰度 / 监控 / 回滚】控制。',
      '上线前需要确认【检查项】，上线后重点观察【指标】。',
      '如果触发【回滚条件】，将立即执行【回滚方案】。',
    ].join('\n');
  }

  return null;
}

export function runCopywritingExecutor(context: ExecutorContext): ExecutorResult {
  const content = buildStructuredCopy(context) ?? (isScriptTask(context) ? buildScriptCopy(context) : buildDocumentCopy());

  return {
    deliverableId: context.task.deliverableId,
    executorId: 'COPYWRITING',
    status: 'completed',
    output: {
      title: `${context.task.title} - 可复制表达`,
      sections: [
        {
          heading: context.task.title,
          content: [
            `用途：${context.task.purpose}`,
            '',
            content,
          ].join('\n'),
        },
      ],
      copyableBlocks: [
        {
          title: isScriptTask(context) ? '脚本模板' : '可替换段落模板',
          content,
        },
      ],
    },
  };
}
