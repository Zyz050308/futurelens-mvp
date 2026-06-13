import type { FutureProfile } from '@/types/radar';

export type CareerActionMode =
  | 'portfolio_feedback'
  | 'real_scene_trial'
  | 'industry_path_comparison';

type CareerProblemType = 'career_direction' | 'career_security';

function mergeProfileText(profile: FutureProfile): string {
  return [
    profile.majorOrCareer,
    profile.currentSkills,
    profile.currentSituation,
    profile.currentGoal,
    profile.currentAnxiety,
    profile.desiredOutcome,
  ].filter(Boolean).join(' ').toLowerCase();
}

export function detectCareerActionMode(
  profile: FutureProfile,
  problemType: CareerProblemType
): CareerActionMode {
  const text = mergeProfileText(profile);

  const hasReviewableOutput =
    /(作品集|作品|案例|设计稿|方案稿|样片|视频|文章|脚本|简历|求职材料|项目展示|demo|原型)/i.test(text);
  const needsExternalReview =
    /(面试|求职|评审|反馈|招聘|录用|通过|认可|目标用户|老师|导师)/i.test(text);

  if (hasReviewableOutput && needsExternalReview) {
    return 'portfolio_feedback';
  }

  const isTryingNewMethod =
    /(ai|人工智能|工具|新方法|新技术|数字化|自动化|智能化|提高效率|怎么结合|如何结合)/i.test(text);
  const hasPracticalWorkContext =
    /(真实场景|工作场景|现场|实操|操作|流程|故障|维修|检测|护理|服务|施工|生产|门店|设备|客户问题|实际问题)/i.test(text);

  if (isTryingNewMethod && hasPracticalWorkContext) {
    return 'real_scene_trial';
  }

  const isComparingFuturePaths =
    problemType === 'career_security'
    || /(行业下行|行业下滑|就业路径|职业路径|继续做|转方向|转行|不同方向|哪个方向|稳定性|岗位减少|缩招|前景)/i.test(text);

  if (isComparingFuturePaths) {
    return 'industry_path_comparison';
  }

  return hasReviewableOutput
    ? 'portfolio_feedback'
    : 'real_scene_trial';
}

export function getCareerActionGuidance(mode: CareerActionMode): {
  validationQuestion: string;
  actionDirective: string;
} {
  switch (mode) {
    case 'portfolio_feedback':
      return {
        validationQuestion: '现有作品或案例在真实评审者眼中，最影响录用、认可或继续推进的问题是什么？',
        actionDirective: '今晚必须把一份现有作品、案例或求职材料交给真实同行、招聘者、老师或目标用户评审，获得可用于修改的具体反馈；禁止只继续搜岗位、收藏案例或独自润色。',
      };
    case 'real_scene_trial':
      return {
        validationQuestion: '用户想尝试的新工具或方法，能否在一个真实工作问题上产生可观察的改善？',
        actionDirective: '今晚必须选择一个真实工作问题，用新工具或方法完成一次小规模试用，并记录前后差异、失败点和是否值得继续；禁止只看教程、列工具清单或泛泛研究岗位。',
      };
    case 'industry_path_comparison':
      return {
        validationQuestion: '同一领域的不同工作路径中，哪一条在真实工作内容、进入门槛和需求稳定性上更适合用户？',
        actionDirective: '今晚必须比较同一领域的3条不同工作路径，每条只取一个真实样本，比较工作内容、进入门槛、需求稳定性和已有积累可迁移程度；禁止统一统计10个相似岗位。',
      };
  }
}
