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

export function runCopywritingExecutor(context: ExecutorContext): ExecutorResult {
  const content = isScriptTask(context) ? buildScriptCopy(context) : buildDocumentCopy();

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
