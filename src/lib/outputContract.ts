import type { ProblemFrame } from './problemFrameEngine';

export type DeliverableType =
  | 'table'
  | 'document'
  | 'workflow'
  | 'script'
  | 'checklist'
  | 'prompt'
  | 'message'
  | 'outline'
  | 'diagnosis'
  | 'plan'
  | 'mixed';

export type OutputContract = {
  title: string;
  deliverables: Array<{
    id: string;
    type: DeliverableType;
    title: string;
    purpose: string;
    contentRules: string[];
    suggestedSections: string[];
  }>;
  copyableBlocks: Array<{
    title: string;
    type: 'template' | 'table' | 'formula' | 'script' | 'checklist' | 'message' | 'outline';
    required: boolean;
  }>;
  clarificationQuestions: Array<{
    question: string;
    reason: string;
    affects: string;
  }>;
  refinementRules: Array<{
    ifUserAdds: string;
    adjust: string;
  }>;
  mustAvoidAssumptions: string[];
};

function has(frame: ProblemFrame, value: string): boolean {
  return frame.rawProblem.includes(value) || frame.transformationNeeded.some(item => item.includes(value));
}

function createDeliverable(
  id: string,
  type: DeliverableType,
  title: string,
  purpose: string,
  contentRules: string[],
  suggestedSections: string[]
): OutputContract['deliverables'][number] {
  return { id, type, title, purpose, contentRules, suggestedSections };
}

function buildDeliverables(frame: ProblemFrame): OutputContract['deliverables'] {
  const items: OutputContract['deliverables'] = [];

  if (frame.centerOutput.outputType === 'table' || has(frame, '字段设计')) {
    items.push(
      createDeliverable(
        'deliverable-fields',
        'table',
        '字段结构',
        '把中心产出拆成可填写、可检查的字段。',
        ['字段必须有名称、用途和示例', '不要默认套用具体行业字段，除非用户原文提到'],
        ['字段名称', '用途', '示例', '检查方式']
      ),
      createDeliverable(
        'deliverable-logic',
        'checklist',
        '计算 / 判断逻辑',
        '说明每个关键字段如何计算、判断或解释。',
        ['写清计算关系或判断标准', '标记异常或不确定项'],
        ['输入项', '处理逻辑', '输出结果', '异常说明']
      )
    );
  }

  if (frame.centerOutput.outputType === 'workflow' || has(frame, '形成流程') || has(frame, '流程化')) {
    items.push(
      createDeliverable(
        'deliverable-workflow',
        'workflow',
        '执行流程',
        '把问题变成可重复执行的步骤。',
        ['步骤必须有顺序', '每一步要有输入和输出', '避免只写抽象建议'],
        ['入口', '步骤', '检查点', '输出物']
      )
    );
  }

  if (has(frame, '效率流程') && !items.some(item => item.id === 'deliverable-efficiency-workflow')) {
    items.push(
      createDeliverable(
        'deliverable-efficiency-workflow',
        'workflow',
        '效率流程',
        '把重复修改、生成、检查的动作变成可复用流程。',
        ['每一步要说明输入、操作和输出', '标出哪些步骤适合交给 AI 生成初稿或检查'],
        ['输入材料', 'AI 辅助动作', '人工判断点', '输出物', '检查标准']
      )
    );
  }

  if (frame.centerOutput.outputType === 'script' || has(frame, '生成脚本')) {
    items.push(
      createDeliverable(
        'deliverable-script',
        'script',
        '脚本结构',
        '把表达内容变成可以替换变量的脚本。',
        ['包含开头、中段、结尾', '标出可替换变量', '能直接复制后改写'],
        ['开头', '展开', '证据或画面', '结尾行动', '可替换变量']
      )
    );
  }

  if (has(frame, '生成分镜')) {
    items.push(
      createDeliverable(
        'deliverable-storyboard',
        'outline',
        '分镜结构',
        '把内容拆成可以执行或继续生成的画面 / 步骤结构。',
        ['每个分镜要对应一个信息点', '标明需要的素材或输入'],
        ['编号', '画面或步骤', '文字说明', '所需素材', '备注']
      )
    );
  }

  if (frame.centerOutput.outputType === 'document' || has(frame, '改写') || has(frame, '诊断')) {
    items.push(
      createDeliverable(
        'deliverable-diagnosis',
        'diagnosis',
        '结构诊断',
        '先判断现有表达或初始想法哪里不清楚。',
        ['只指出会影响理解或使用的问题', '不要默认具体场景身份'],
        ['问题点', '影响', '修改方向']
      ),
      createDeliverable(
        'deliverable-rewrite',
        'document',
        '可替换片段',
        '给出一段可以直接替换或作为初版的表达。',
        ['保留用户真实意图', '用占位符承接缺失信息'],
        ['目标', '内容结构', '示例表达']
      )
    );
  }

  if (has(frame, '结构整理') || has(frame, '明确表达结构')) {
    items.push(
      createDeliverable(
        'deliverable-structure',
        'outline',
        '结构框架',
        '把中心产出整理成别人能看懂的顺序。',
        ['先说明目标，再展开内容，最后给出下一步', '不要默认具体身份或行业'],
        ['目标', '核心内容', '证明或材料', '下一步']
      )
    );
  }

  if (has(frame, '项目说明') || has(frame, '生成初版材料')) {
    items.push(
      createDeliverable(
        'deliverable-document',
        'document',
        '初版表达材料',
        '把想法或已有内容变成可以展示、讨论或继续修改的版本。',
        ['用用户原文中的对象和目标', '缺失信息用占位符标记'],
        ['背景', '目标', '内容', '证据或依据', '待补充']
      )
    );
  }

  if (has(frame, '拆解参考')) {
    items.push(
      createDeliverable(
        'deliverable-reference',
        'outline',
        '参考拆解框架',
        '把参考对象拆成可复用结构，而不是照抄内容。',
        ['只提取结构、节奏、变量和可替换元素', '标明自己的版本如何替换'],
        ['参考结构', '可复用规则', '我的替换版本']
      )
    );
  }

  if (has(frame, '整理素材')) {
    items.push(
      createDeliverable(
        'deliverable-assets',
        'checklist',
        '素材整理清单',
        '把已有材料或素材映射到最终交付物的不同部分。',
        ['区分已有、缺失、需要补充', '每个素材对应一个用途'],
        ['已有素材', '缺失素材', '补充方式', '使用位置']
      )
    );
  }

  if (has(frame, '检查清单') || has(frame, '检查可理解性')) {
    items.push(
      createDeliverable(
        'deliverable-checklist',
        'checklist',
        '检查清单',
        '确认第一版成果是否足够清楚、完整、可继续推进。',
        ['只检查会影响使用的关键项', '把不确定内容转成待补充项'],
        ['是否看得懂', '是否能使用', '是否缺材料', '下一步改哪里']
      )
    );
  }

  if (items.length === 0) {
    items.push(
      createDeliverable(
        'deliverable-first-version',
        'mixed',
        '第一版成果',
        '先把问题变成可以给别人看或自己执行的初版。',
        ['明确目标', '拆成结构', '留下可继续修改的版本'],
        ['目标', '结构', '第一版内容', '下一步检查']
      )
    );
  }

  return items;
}

function buildCopyableBlocks(deliverables: OutputContract['deliverables']): OutputContract['copyableBlocks'] {
  const blocks = deliverables.map(item => {
    const type =
      item.type === 'table' ? 'table'
      : item.type === 'script' ? 'script'
      : item.type === 'workflow' ? 'checklist'
      : item.type === 'message' ? 'message'
      : item.type === 'outline' ? 'outline'
      : 'template';

    return {
      title: item.title,
      type,
      required: item.id === 'deliverable-first-version' || item.id === 'deliverable-fields' || item.id === 'deliverable-workflow',
    } satisfies OutputContract['copyableBlocks'][number];
  });

  if (!blocks.some(item => item.type === 'checklist')) {
    blocks.push({ title: '检查清单', type: 'checklist', required: true });
  }

  return blocks;
}

export function buildOutputContract(frame: ProblemFrame): OutputContract {
  const deliverables = buildDeliverables(frame);
  const copyableBlocks = buildCopyableBlocks(deliverables);

  return {
    title: `${frame.centerOutput.name}第一版`,
    deliverables,
    copyableBlocks,
    clarificationQuestions: frame.missingInfo.slice(0, 3).map(item => ({
      question: `${item}是什么？`,
      reason: '这会影响第一版成果是否贴近真实使用场景。',
      affects: frame.centerOutput.name,
    })),
    refinementRules: [
      {
        ifUserAdds: '补充目标对象或使用场景',
        adjust: '调整成果结构和表达重点。',
      },
      {
        ifUserAdds: '补充已有材料或数据',
        adjust: '把材料映射到对应字段、步骤或内容块。',
      },
      {
        ifUserAdds: '补充格式要求或时间限制',
        adjust: '收窄交付范围，优先生成最小可用版本。',
      },
    ],
    mustAvoidAssumptions: [
      '不要默认用户的行业、岗位或身份。',
      '不要把“材料”默认理解成特定材料类型。',
      '不要把“工作流”默认理解成每日工作安排，先看中心产出是什么。',
    ],
  };
}
