import type { FutureProfile } from '@/types/radar';

export type UserAction =
  | 'create'
  | 'edit'
  | 'analyze'
  | 'organize'
  | 'compare'
  | 'plan'
  | 'transform'
  | 'decide'
  | 'execute'
  | 'unknown';

export type OutputType =
  | 'document'
  | 'table'
  | 'workflow'
  | 'script'
  | 'checklist'
  | 'plan'
  | 'message'
  | 'mixed'
  | 'unknown';

export type ProblemFrame = {
  rawProblem: string;
  userNeed: string;
  centerOutput: {
    name: string;
    outputType: OutputType;
  };
  currentBlocker: {
    action: UserAction;
    reason: string;
  };
  inputAssets: Array<{
    type: 'text' | 'data' | 'draft' | 'reference' | 'image' | 'none' | 'unknown';
    state: 'provided' | 'described' | 'missing' | 'unknown';
    description: string;
  }>;
  transformationNeeded: string[];
  audience?: string;
  constraints: {
    time?: string;
    qualityBar?: string;
    format?: string;
    risk?: string;
  };
  successCriteria: string[];
  missingInfo: string[];
  confidence: number;
};

function compactText(values: Array<string | undefined>): string {
  return values.map(value => value?.trim()).filter(Boolean).join(' ');
}

function includesAny(text: string, words: string[]): boolean {
  return words.some(word => text.includes(word));
}

function getRawProblem(profile: FutureProfile): string {
  return profile.currentSituation?.trim() || compactText([
    profile.currentGoal,
    profile.desiredOutcome,
    profile.currentSkills,
    profile.currentAnxiety,
  ]) || '用户还没有说清楚当前问题。';
}

function getSupportText(profile: FutureProfile): string {
  return compactText([
    profile.currentGoal,
    profile.desiredOutcome,
    profile.currentSkills,
    profile.currentAnxiety,
    profile.weeklyTime,
    profile.riskPreference,
  ]);
}

function inferOutput(rawProblem: string): ProblemFrame['centerOutput'] {
  if (includesAny(rawProblem, ['数据表', '表格', '报表', '台账', '清单表'])) {
    return { name: '可汇报的数据表 / 报表结构', outputType: 'table' };
  }

  if (includesAny(rawProblem, ['仿照', '参考', '模版', '模板']) && includesAny(rawProblem, ['流程', '工作流'])) {
    return { name: '可复用内容模板 / 生产流程', outputType: 'mixed' };
  }

  if (includesAny(rawProblem, ['作品集'])) {
    return { name: '作品展示材料 / 修改流程', outputType: 'mixed' };
  }

  if (includesAny(rawProblem, ['流程很乱', '工作流程很乱', '每天先做什么', '任务很乱', '优先级'])) {
    return { name: '每日执行流程 / 工作安排系统', outputType: 'workflow' };
  }

  if (includesAny(rawProblem, ['材料', '草稿', '文档', '说明', '介绍'])) {
    return { name: '材料修改方案 / 修改框架', outputType: 'document' };
  }

  if (includesAny(rawProblem, ['脚本', '口播', '文案'])) {
    return { name: '可执行脚本 / 表达模板', outputType: 'script' };
  }

  if (includesAny(rawProblem, ['计划', '路线', '学习', '备考', '练习'])) {
    return { name: '执行计划 / 练习路径', outputType: 'plan' };
  }

  return { name: '可展示方案 / 初版表达材料', outputType: 'mixed' };
}

function inferAction(rawProblem: string): UserAction {
  if (includesAny(rawProblem, ['改', '修改', '优化'])) return 'edit';
  if (includesAny(rawProblem, ['分析', '看看', '诊断'])) return 'analyze';
  if (includesAny(rawProblem, ['整理', '规范', '归纳'])) return 'organize';
  if (includesAny(rawProblem, ['比较', '选择', '选'])) return 'compare';
  if (includesAny(rawProblem, ['计划', '规划', '安排'])) return 'plan';
  if (includesAny(rawProblem, ['变成', '转成', '生成', '做成'])) return 'transform';
  if (includesAny(rawProblem, ['决定', '判断'])) return 'decide';
  if (includesAny(rawProblem, ['执行', '落地', '开始'])) return 'execute';
  if (includesAny(rawProblem, ['做', '写', '创建', '准备'])) return 'create';
  return 'unknown';
}

function inferInputAssets(rawProblem: string, supportText: string): ProblemFrame['inputAssets'] {
  const text = compactText([rawProblem, supportText]);
  const assets: ProblemFrame['inputAssets'] = [];

  if (includesAny(text, ['我有一份', '已有', '下面是', '以下是', '这是我的'])) {
    assets.push({ type: 'draft', state: 'described', description: '用户描述自己已有一份初始材料或草稿。' });
  }

  if (includesAny(text, ['数据', '流水', '表格', '记录'])) {
    assets.push({ type: 'data', state: 'described', description: '用户提到已有或需要处理的数据。' });
  }

  if (includesAny(text, ['参考', '仿照', '案例', '样例', '模版', '模板'])) {
    assets.push({ type: 'reference', state: 'described', description: '用户提到参考对象或希望仿照某种结构。' });
  }

  if (includesAny(text, ['素材', '图片', '画面', '截图'])) {
    assets.push({ type: 'image', state: 'described', description: '用户提到已有视觉素材或画面素材。' });
  }

  return assets.length > 0 ? assets : [{ type: 'none', state: 'missing', description: '用户尚未提供明确材料，只描述了想推进的问题。' }];
}

function inferTransformation(rawProblem: string, centerOutput: ProblemFrame['centerOutput']): string[] {
  const transformations: string[] = [];

  if (includesAny(rawProblem, ['仿照', '参考'])) transformations.push('拆解参考');
  if (includesAny(rawProblem, ['材料', '草稿', '文档', '说明', '介绍', '改'])) transformations.push('分析', '诊断', '改写');
  if (centerOutput.outputType === 'table') transformations.push('字段设计', '计算逻辑', '异常说明', '汇报表达');
  if (centerOutput.outputType === 'workflow') transformations.push('任务拆解', '排序', '流程化', '检查点');
  if (includesAny(rawProblem, ['脚本', '口播', '文案']) || centerOutput.outputType === 'script') transformations.push('生成脚本');
  if (includesAny(rawProblem, ['分镜', '镜头'])) transformations.push('生成分镜');
  if (includesAny(rawProblem, ['素材'])) transformations.push('整理素材');
  if (includesAny(rawProblem, ['工作流', '流程'])) transformations.push('形成流程');
  if (includesAny(rawProblem, ['短视频', '视频', '画面']) && includesAny(rawProblem, ['模板', '模版', '方案'])) {
    transformations.push('生成脚本', '生成分镜', '整理素材');
  }
  if (includesAny(rawProblem, ['作品集'])) transformations.push('结构整理', '项目说明', '效率流程', '检查清单');
  if (includesAny(rawProblem, ['想法', '给别人看'])) transformations.push('明确表达结构', '生成初版材料', '检查可理解性');

  if (transformations.length === 0) transformations.push('明确目标', '拆解步骤', '生成第一版', '检查调整');

  return Array.from(new Set(transformations));
}

function inferMissingInfo(rawProblem: string, centerOutput: ProblemFrame['centerOutput']): string[] {
  const missingInfo: string[] = [];

  if (includesAny(rawProblem, ['材料', '草稿', '文档']) && !includesAny(rawProblem, ['用途', '给谁', '对象'])) {
    missingInfo.push('材料用途', '目标对象', '现有内容');
  }

  if (centerOutput.outputType === 'table') {
    missingInfo.push('数据来源', '使用对象', '最终格式');
  }

  if (centerOutput.outputType === 'workflow') {
    missingInfo.push('任务来源', '时间限制', '必须优先完成的事项');
  }

  if (centerOutput.outputType === 'mixed' && includesAny(rawProblem, ['想法', '东西'])) {
    missingInfo.push('想法内容', '目标对象', '展示形式', '使用场景');
  }

  if (includesAny(rawProblem, ['参考', '仿照']) && !includesAny(rawProblem, ['已有参考', '参考链接'])) {
    missingInfo.push('参考对象', '可用素材', '期望成品形式');
  }

  if (missingInfo.length === 0) missingInfo.push('目标对象', '已有材料', '完成标准');

  return Array.from(new Set(missingInfo));
}

export function buildProblemFrame(profile: FutureProfile): ProblemFrame {
  const rawProblem = getRawProblem(profile);
  const supportText = getSupportText(profile);
  const centerOutput = inferOutput(rawProblem);
  const action = inferAction(rawProblem);
  const transformationNeeded = inferTransformation(rawProblem, centerOutput);
  const inputAssets = inferInputAssets(rawProblem, supportText);
  const missingInfo = inferMissingInfo(rawProblem, centerOutput);

  return {
    rawProblem,
    userNeed: `用户想把当前问题推进成：${centerOutput.name}`,
    centerOutput,
    currentBlocker: {
      action,
      reason: `当前阻碍不是缺少场景标签，而是还没有把“${centerOutput.name}”拆成可交付结构和下一步动作。`,
    },
    inputAssets,
    transformationNeeded,
    constraints: {
      time: profile.weeklyTime || undefined,
      qualityBar: profile.currentAnxiety || undefined,
      format: profile.desiredOutcome || undefined,
      risk: profile.riskPreference || undefined,
    },
    successCriteria: [
      `产出一版${centerOutput.name}`,
      '能直接复制或照着执行',
      '补充信息后可以继续细化',
    ],
    missingInfo,
    confidence: rawProblem === '用户还没有说清楚当前问题。' ? 0.35 : 0.72,
  };
}
