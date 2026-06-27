'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronRight, Loader2, RefreshCw, AlertCircle, Zap, TrendingUp, TrendingDown, CheckCircle2, Calendar, Target, Shield, User, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { loadProfile } from '@/lib/radar';
import { getChangeSignalsForProfile, generateProfileHash } from '@/lib/changeEngine';
import { analyzeUserState } from '@/lib/stateEngine';
import { routeCapabilities, type CapabilityPlan } from '@/lib/capabilityRouter';
import { buildRefinedSolutionResult, buildSolutionResult } from '@/lib/solutionEngine';
import type { CreateDiscoveryInput, DiscoveryRecord } from '@/types/discovery';
import type { FutureProfile, ChangeSignal, OpportunityRadarV4, TodayChange, ImpactOnUser, ActionItem, UserStateProfile, PersonalImpact, DecisionExplanation, ValueMigration, CoreInsight, SolutionPack, SolutionResult, ProblemShape, CapabilityName, SolutionMaterialType } from '@/types/radar';
import FutureSelfAvatar from '@/components/FutureSelfAvatar';

type VerificationPhase = 'idle' | 'started' | 'recording' | 'recorded';
type VerificationCategory = 'customer' | 'job' | 'study' | 'direction' | 'general';
type VerificationType = NonNullable<ActionItem['verificationType']>;

type EvidenceRecord = DiscoveryRecord;

type ResultOption = {
  code: string;
  label: string;
  judgment: string;
  nextUnknown: string;
  nextAction: string;
  identitySignal: string;
};

type VerificationContext = {
  category: VerificationCategory;
  goal: string;
  why: string;
  resultPlaceholder: string;
  options: ResultOption[];
};

function inferVerificationType(text: string): VerificationType | null {
  if (/(真实评审|评审者|作品反馈|作品或案例|最影响认可|只改一处)/.test(text)) {
    return 'portfolio_feedback';
  }
  if (/(前后对照|新工具或方法|真实工作问题|可复现的小问题|试用结果)/.test(text)) {
    return 'real_scene_trial';
  }
  if (/(3条不同工作路径|3 条真实工作路径|三条工作路径|路径各选一个真实样本)/.test(text)) {
    return 'industry_path_comparison';
  }
  if (/(发布一个最小内容|最低可发布|到点直接发布)/.test(text)) {
    return 'content_publish';
  }
  return null;
}

function getVerificationContext(action?: ActionItem): VerificationContext {
  const text = [
    action?.task,
    action?.reason,
    action?.platform,
    action?.keywords,
    action?.action,
    action?.successCriteria,
  ].filter(Boolean).join(' ').toLowerCase();
  const verificationType = action?.verificationType || inferVerificationType(text);

  if (verificationType === 'portfolio_feedback') {
    return {
      category: 'job',
      goal: '你的作品在真实评审标准下，最影响认可或岗位匹配的问题是什么。',
      why: '继续独自修改只能增加完成度，真实评审才能告诉你作品是否证明了目标岗位需要的能力。',
      resultPlaceholder: '记录评审者指出的具体问题、岗位匹配度和最值得强化的方向。',
      options: [
        { code: 'positive_feedback', label: '获得正向反馈', judgment: '作品已有一部分价值被真实评审者认可。', nextUnknown: '这份认可来自表达完成度，还是确实证明了目标岗位需要的能力？', nextAction: '追问评审者：作品中最能证明你能力的是哪一部分，以及为什么。', identitySignal: '正在成为能够用作品证明能力的人' },
        { code: 'clear_problem', label: '被指出明显问题', judgment: '真实评审暴露了一个具体问题，下一步不再需要盲目修改。', nextUnknown: '这个问题是单个作品的问题，还是整个作品集反复出现的问题？', nextAction: '检查另外两份作品，确认同类问题是否重复出现。', identitySignal: '正在形成根据专业反馈改进作品的能力' },
        { code: 'role_mismatch', label: '作品不匹配岗位', judgment: '当前作品与目标岗位的判断标准没有建立足够连接。', nextUnknown: '需要调整目标岗位，还是补一份更能证明关键能力的作品？', nextAction: '让评审者指出目标岗位最缺的一项证明，并确定一个最小补充案例。', identitySignal: '正在形成用岗位标准选择作品的能力' },
        { code: 'stronger_direction', label: '发现可强化方向', judgment: '作品中出现了值得继续放大的能力信号。', nextUnknown: '这个优势能否在更多作品和真实岗位反馈中重复成立？', nextAction: '选另一份作品，用同一能力线索重新组织表达并再次获得反馈。', identitySignal: '正在形成识别并强化个人优势的能力' },
        { code: 'reframe_needed', label: '需要重新调整表达', judgment: '能力可能存在，但当前呈现方式没有让评审者清楚看见。', nextUnknown: '缺失的是背景、判断过程，还是结果证据？', nextAction: '只重写一个案例的“问题、判断、结果”三部分，再交给同一评审者复看。', identitySignal: '正在形成把能力转化为可见证据的能力' },
      ],
    };
  }

  if (verificationType === 'real_scene_trial') {
    return {
      category: 'general',
      goal: '这个工具或新方法，在真实工作问题中究竟能解决什么、不能解决什么。',
      why: '工具是否值得继续学，不取决于功能清单，而取决于它在真实流程中产生了什么可观察结果。',
      resultPlaceholder: '记录测试的真实问题、前后差异、失败点和新的学习线索。',
      options: [
        { code: 'real_use_case', label: '找到真实使用场景', judgment: '这个方法已经连接到一个具体工作问题，值得继续验证。', nextUnknown: '这个场景是否重复出现，改善是否足以改变原有流程？', nextAction: '在第二个相似案例中复现同样测试，比较结果是否稳定。', identitySignal: '正在形成把新工具连接到真实工作的能力' },
        { code: 'practitioner_uses_it', label: '从业者确实在用', judgment: '真实从业者的使用证明这个方向不是凭空想象。', nextUnknown: '他们在什么条件下使用，又保留了哪些人工判断？', nextAction: '追问一位使用者，记录适用条件、限制和最常见的失败情况。', identitySignal: '正在形成从真实实践中判断学习方向的能力' },
        { code: 'assist_only', label: '只能辅助，不能解决核心问题', judgment: '测试明确了工具的边界：它能提升局部效率，但不能替代核心专业判断。', nextUnknown: '最值得保留的辅助环节是哪一步？', nextAction: '把工具限制在一个低风险环节，再测试它能节省多少时间或减少多少错误。', identitySignal: '正在形成识别工具边界的专业判断力' },
        { code: 'no_practical_value', label: '暂时没有实际价值', judgment: '当前工具或方法没有改善这个真实问题，可以停止无效投入。', nextUnknown: '问题在工具不适合，还是选择的场景不具代表性？', nextAction: '换一个更常见的小问题做最后一次验证；仍无改善就排除这个方向。', identitySignal: '正在形成用结果停止无效学习的能力' },
        { code: 'new_learning_direction', label: '发现新的学习方向', judgment: '真实测试暴露了一个比原计划更具体的能力缺口。', nextUnknown: '这个新能力是否会直接改善真实工作结果？', nextAction: '围绕新缺口完成一个最小练习，并回到同一场景再次测试。', identitySignal: '正在形成由真实问题驱动学习的能力' },
      ],
    };
  }

  if (verificationType === 'industry_path_comparison') {
    return {
      category: 'direction',
      goal: '同一行业的不同路径中，哪条更符合你的积累、限制和对稳定性的要求。',
      why: '行业不是一个整体。比较不同工作路径，才能把笼统的行业焦虑变成可排除、可继续验证的选择。',
      resultPlaceholder: '记录三条路径的真实差异、被排除的选项和最值得继续验证的候选路径。',
      options: [
        { code: 'clear_candidate', label: '出现明确候选路径', judgment: '一条路径在进入门槛、稳定性和现有积累之间形成了更好的匹配。', nextUnknown: '这条路径的真实日常工作是否也适合你？', nextAction: '联系一位该路径从业者，确认日常工作、最难部分和新人进入方式。', identitySignal: '正在形成基于现实差异选择职业路径的能力' },
        { code: 'path_excluded', label: '排除了一条路径', judgment: '你减少了一个不适合的选项，判断范围已经收窄。', nextUnknown: '剩余路径中最关键的差异是什么？', nextAction: '只比较剩余两条路径最影响你的一个维度。', identitySignal: '正在成为能够用证据排除错误路径的人' },
        { code: 'tradeoff_found', label: '发现关键取舍', judgment: '不同路径没有绝对优劣，但核心取舍已经变得清楚。', nextUnknown: '你愿意用什么交换稳定、成长或收入？', nextAction: '按你的优先级给三个取舍维度排序，并据此重新比较路径。', identitySignal: '正在形成理解职业选择代价的能力' },
        { code: 'evidence_insufficient', label: '证据仍然不足', judgment: '当前样本没有提供足够区分度，还不能支持路径选择。', nextUnknown: '缺少的是工作内容、进入门槛，还是稳定性证据？', nextAction: '只补充最缺失的一个维度，并寻找一个更真实的样本。', identitySignal: '正在形成识别职业判断证据缺口的能力' },
        { code: 'new_path', label: '发现新的行业路径', judgment: '比较过程出现了原先没有考虑、但可能更匹配的路径。', nextUnknown: '新路径是真的更适合，还是只是信息新鲜？', nextAction: '用相同维度把新路径与当前候选路径做一次对照。', identitySignal: '正在形成开放但不盲目的路径判断能力' },
      ],
    };
  }

  if (verificationType === 'content_publish') {
    return {
      category: 'general',
      goal: '你能否真正发布最小内容，并从发布结果中获得第一轮反馈。',
      why: '当前未知不是还能准备什么，而是内容发布后会发生什么，以及你真正卡在哪一步。',
      resultPlaceholder: '记录是否发布、第一轮数据、收到的反馈或最具体的发布阻力。',
      options: [
        { code: 'published', label: '已经发布', judgment: '你已经越过发布门槛，接下来可以用真实数据而不是想象改进内容。', nextUnknown: '第一轮数据反映的是选题、表达还是分发问题？', nextAction: '记录24小时数据，只选择一个最明显的问题进行下一次调整。', identitySignal: '正在成为能够通过发布获得反馈的人' },
        { code: 'engagement', label: '获得真实互动', judgment: '内容已经引发真实回应，说明其中有值得继续验证的信号。', nextUnknown: '互动来自哪一个具体观点或表达？', nextAction: '围绕互动最集中的一点做一条更具体的后续内容。', identitySignal: '正在形成根据真实互动选择内容方向的能力' },
        { code: 'low_response', label: '发布但反馈很少', judgment: '这次发布没有形成明显反馈，但它提供了真实基线。', nextUnknown: '问题更可能出在选题、开头表达，还是触达不足？', nextAction: '保持主题不变，只调整一个变量后再次发布。', identitySignal: '正在形成用数据迭代内容的能力' },
        { code: 'blocked', label: '仍然没有发布', judgment: '真正阻力已经从“内容不够好”变成了一个具体的发布障碍。', nextUnknown: '最后阻止发布的是完成度要求、被评价的恐惧，还是流程过大？', nextAction: '把内容缩小到15分钟可完成版本，并删除一个非必要步骤。', identitySignal: '正在形成识别并降低行动门槛的能力' },
        { code: 'new_discovery', label: '发现新的内容方向', judgment: '发布过程暴露了一个比原计划更值得验证的内容线索。', nextUnknown: '这个新方向是否能再次获得真实互动？', nextAction: '围绕新线索发布一条最小后续内容。', identitySignal: '正在形成从发布结果中发现方向的能力' },
      ],
    };
  }

  if (verificationType === 'customer_validation' || /(客户|询价|付费|接单|需求|服务|用户访谈|商家)/.test(text)) {
    return {
      category: 'customer',
      goal: '真实需求是否存在，以及对方是否愿意继续了解你的方案。',
      why: '如果真实需求不存在，继续投入学习和制作不会让方向变清楚。',
      resultPlaceholder: '记录对方是否感兴趣、是否询价、拒绝原因或没有回复。',
      options: [
        { code: 'interested', label: '有人感兴趣', judgment: '真实需求得到了初步支持，但还不能确认是否愿意付费。', nextUnknown: '对方愿意为什么具体结果付出时间或金钱？', nextAction: '追问一位感兴趣的人：他最希望先解决哪个具体问题。', identitySignal: '正在成为能够主动接触真实需求的人' },
        { code: 'asked_price', label: '有人询价', judgment: '需求不仅存在，而且已经出现了初步付费信号。', nextUnknown: '这个付费信号能否再次出现？', nextAction: '用同样的服务表达再接触一位相似对象，确认询价是否可重复。', identitySignal: '正在形成把能力连接到真实需求的能力' },
        { code: 'willing_to_pay', label: '愿意付费', judgment: '真实需求已经形成明确付费证据。', nextUnknown: '这个付费意愿能否在相似对象中重复出现，并形成可交付边界？', nextAction: '确认交付范围、价格和开始条件，并再找一位相似对象验证。', identitySignal: '正在成为能够用真实交易证明能力价值的人' },
        { code: 'rejected', label: '被拒绝', judgment: '当前对象或表达没有建立连接，但一次拒绝还不足以否定方向。', nextUnknown: '拒绝来自没有需求，还是你的表达没有说中问题？', nextAction: '换一位对象，并把询问改成只确认对方最困扰的问题。', identitySignal: '正在形成从拒绝中修正方向的能力' },
        { code: 'no_reply', label: '无人回复', judgment: '当前触达方式没有获得反馈，原判断暂时无法成立。', nextUnknown: '问题出在对象、渠道，还是开场表达？', nextAction: '更换一个渠道或对象，再发出一条更具体的询问。', identitySignal: '正在形成低成本测试真实需求的习惯' },
      ],
    };
  }

  if (verificationType === 'job_validation' || /(岗位|招聘|简历|面试|投递|offer|求职|jd)/.test(text)) {
    return {
      category: 'job',
      goal: '你的当前经历是否已经达到目标岗位的真实要求。',
      why: '只有岗位反馈才能区分：你缺少的是表达、作品证明，还是关键能力。',
      resultPlaceholder: '记录投递、岗位要求、回复、拒信或发现的具体能力缺口。',
      options: [
        { code: 'interview', label: '获得面试', judgment: '你的经历已经通过了第一轮岗位筛选。', nextUnknown: '面试方最在意你哪项经历或能力？', nextAction: '整理面试邀请对应的岗位要求，标出最可能被追问的三点。', identitySignal: '正在成为能够用经历证明自己的人' },
        { code: 'rejection', label: '收到拒信', judgment: '当前材料或匹配度还没有通过岗位筛选。', nextUnknown: '拒绝来自岗位不匹配，还是材料没有证明关键能力？', nextAction: '对照该岗位要求，找出一项简历中没有证据支撑的能力。', identitySignal: '正在形成根据真实标准修正自己的能力' },
        { code: 'no_reply', label: '暂无回复', judgment: '当前投递还没有产生足够反馈，不能据此判断能力是否匹配。', nextUnknown: '需要更多样本，还是需要先调整投递对象？', nextAction: '再选择两个要求相近的岗位，比较它们共同强调的能力。', identitySignal: '正在形成用岗位标准判断方向的能力' },
        { code: 'skill_gap', label: '发现能力缺口', judgment: '方向开始变清楚：当前阻碍是一个具体、可补足的能力缺口。', nextUnknown: '这个能力缺口是否真的是多数目标岗位的共同要求？', nextAction: '再查看五个同类岗位，统计该能力出现的次数。', identitySignal: '正在形成用现实要求识别能力缺口的能力' },
        { code: 'new_discovery', label: '出现新的发现', judgment: '岗位信息改变了你对目标方向的原有理解。', nextUnknown: '这个新发现是否会改变你的目标岗位选择？', nextAction: '找两个相邻岗位进行对比，确认哪一个更符合你的现有积累。', identitySignal: '正在形成基于现实信息选择方向的能力' },
      ],
    };
  }

  if (verificationType === 'exam_diagnostic' || /(雅思|托福|备考|考试|学习方案|课程|真题|复习|申请)/.test(text)) {
    return {
      category: 'study',
      goal: '是否存在一个符合你当前时间和问题的可执行方案。',
      why: '找到资料不等于找到适合你的方案，关键是它能否被实际执行。',
      resultPlaceholder: '记录找到的方案、为什么适合或不适合，以及暴露出的真实问题。',
      options: [
        { code: 'workable_plan', label: '找到可执行方案', judgment: '当前问题开始从“没有方法”变成“验证方法是否有效”。', nextUnknown: '这个方案执行一次后，是否真的改善了你的薄弱环节？', nextAction: '按方案完成一次最小练习，并记录完成时间和错误类型。', identitySignal: '正在成为能够把目标拆成可执行验证的人' },
        { code: 'not_fit', label: '找到但不适合', judgment: '你排除了一个不符合当前时间或问题的方案。', nextUnknown: '不适合的核心原因是时间、难度，还是没有针对真实弱点？', nextAction: '保留最有用的一步，把方案缩小到今晚可以完成的规模。', identitySignal: '正在形成判断方法是否适合自己的能力' },
        { code: 'no_valid_plan', label: '没找到有效方案', judgment: '问题可能不在资料数量，而在你还没有明确当前最需要解决的薄弱点。', nextUnknown: '现在真正拖慢你的具体问题是什么？', nextAction: '完成一组最小测试，记录错误最集中的一个类型。', identitySignal: '正在形成先识别问题再选择方法的能力' },
        { code: 'problem_elsewhere', label: '发现问题不在计划', judgment: '原判断被修正：阻碍可能来自执行、反馈或基础能力，而不是计划本身。', nextUnknown: '真正阻碍执行的因素能否被一个更小的动作验证？', nextAction: '围绕新发现设计一个 15 分钟测试，只验证这个阻碍。', identitySignal: '正在形成通过结果修正学习判断的能力' },
        { code: 'new_discovery', label: '出现新的发现', judgment: '这次查找带来了新的判断线索。', nextUnknown: '这个新发现是否比原来的计划问题更关键？', nextAction: '用一次最小练习确认这个新发现是否真实影响结果。', identitySignal: '正在形成从练习结果中发现真实问题的能力' },
      ],
    };
  }

  if (verificationType === 'direction_test' || /(方向|转行|选择|比较|测试|尝试)/.test(text)) {
    return {
      category: 'direction',
      goal: '这个方向是否值得你继续投入下一轮时间。',
      why: '方向不是想清楚的，而是通过投入感、完成结果和外部反馈逐渐排除出来的。',
      resultPlaceholder: '记录你完成后的感受、结果，以及愿不愿意继续投入。',
      options: [
        { code: 'continue', label: '值得继续测试', judgment: '这个方向获得了继续验证的理由，但还没有形成稳定结论。', nextUnknown: '它是否既适合你，也能获得现实反馈？', nextAction: '把测试推进一步，接触一个真实使用者或评价者。', identitySignal: '正在形成通过小实验判断方向的能力' },
        { code: 'stop', label: '可以排除这个方向', judgment: '你减少了一个错误选项，方向范围已经开始收窄。', nextUnknown: '剩余方向中，哪一个最值得先获得现实反馈？', nextAction: '从剩余方向中选一个，完成同等规模的小测试。', identitySignal: '正在成为能够用行动排除错误方向的人' },
        { code: 'unclear', label: '结果仍不清楚', judgment: '这次测试区分度不足，还没有产生足够信息。', nextUnknown: '需要改变测试方式，还是需要接触更真实的场景？', nextAction: '把下一次测试改成有外部对象、有明确结果的版本。', identitySignal: '正在形成改进验证方式的能力' },
        { code: 'new_constraint', label: '发现新的限制', judgment: '原来的方向判断需要加入一个新的现实限制。', nextUnknown: '这个限制能否降低，还是应该改变方向选择？', nextAction: '用一个更小动作确认这个限制是暂时的还是持续的。', identitySignal: '正在形成识别现实限制的能力' },
        { code: 'new_discovery', label: '出现新的发现', judgment: '现实提供了原计划之外的新方向线索。', nextUnknown: '这个线索是否值得成为下一轮测试重点？', nextAction: '围绕新线索完成一个同等规模的小实验。', identitySignal: '正在形成从行动中发现方向的能力' },
      ],
    };
  }

  return {
    category: 'general',
    goal: '现实结果是否支持你当前的判断。',
    why: '只有获得具体结果，才能减少未知并决定下一步。',
    resultPlaceholder: '记录实际发生的结果，以及它和预期有什么不同。',
    options: [
      { code: 'supported', label: '结果支持原判断', judgment: '原判断得到了初步支持，但还需要重复验证。', nextUnknown: '相同结果是否会再次出现？', nextAction: '在相似条件下再进行一次小规模验证。', identitySignal: '正在形成用现实结果检验判断的能力' },
      { code: 'weakened', label: '结果不支持原判断', judgment: '原判断被削弱，需要调整方向或验证方式。', nextUnknown: '问题来自判断本身，还是这次验证方式？', nextAction: '改变一个关键条件，再完成一次更有区分度的验证。', identitySignal: '正在形成根据结果修正判断的能力' },
      { code: 'unclear', label: '结果仍不清楚', judgment: '这次结果没有减少足够未知。', nextUnknown: '怎样让下一次结果更具体、更容易比较？', nextAction: '为下一次验证增加明确对象和完成结果。', identitySignal: '正在形成设计有效验证的能力' },
      { code: 'not_completed', label: '没有完成验证', judgment: '当前验证门槛可能超过了你的时间或精力。', nextUnknown: '最小到什么程度，你今晚可以真正开始？', nextAction: '把验证缩小成一个 15 分钟内可完成的动作。', identitySignal: '正在形成识别真实行动边界的能力' },
      { code: 'new_discovery', label: '出现新的发现', judgment: '现实带来了原判断之外的新线索。', nextUnknown: '这个新发现是否应该成为下一次验证重点？', nextAction: '围绕新发现设计一个最小验证。', identitySignal: '正在形成从现实结果中更新判断的能力' },
    ],
  };
}

function getEvidenceImpact(record?: EvidenceRecord | null) {
  if (!record) return null;
  const context = getVerificationContextForCategory(record.category, record.actionTitle);
  const option = context.options.find(item => item.code === record.outcomeCode);
  return option || null;
}

function getVerificationContextForCategory(
  category: VerificationCategory,
  fallbackAction: string
): VerificationContext {
  if (inferVerificationType(fallbackAction)) {
    return getVerificationContext({
      time: '今晚',
      task: fallbackAction,
      reason: '',
      successCriteria: '',
    });
  }

  const categoryHints: Record<VerificationCategory, string> = {
    customer: '客户需求询价',
    job: '求职岗位面试',
    study: '雅思备考学习方案',
    direction: '方向选择测试',
    general: fallbackAction,
  };
  return getVerificationContext({
    time: '今晚',
    task: categoryHints[category],
    reason: '',
    successCriteria: '',
  });
}

// ============================================================
// V6.7 核心模块：理解用户（CoreInsight）
// ============================================================

interface CoreInsightCardProps {
  coreInsight?: CoreInsight;
  latestEvidence?: EvidenceRecord | null;
}

function CoreInsightCard({ coreInsight, latestEvidence }: CoreInsightCardProps) {
  if (!coreInsight) {
    return null;
  }

  const theRealProblem = coreInsight["真正的问题是什么"];
  const oneSentenceToRemember = coreInsight["如果只记住一句话"];
  const evidenceImpact = getEvidenceImpact(latestEvidence);
  const currentJudgment = evidenceImpact?.judgment || theRealProblem;

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
      {latestEvidence && evidenceImpact && (
        <div className="mb-5 rounded-xl bg-[#E8F7EC] px-4 py-3 text-sm text-[#248A3D]">
          <div className="font-semibold">根据你最近的验证结果，FutureLens 更新了判断</div>
          <div className="mt-1 text-[#248A3D]/80">{evidenceImpact.judgment}</div>
        </div>
      )}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#FF9500]/12 flex items-center justify-center">
          <Target className="w-4.5 h-4.5 text-[#FF9500]" />
        </div>
        <div>
          <div className="text-xs text-[#9CA3AF] mb-0.5">01</div>
          <h1 className="text-base font-semibold text-[#1D1D1F]">你的真正问题</h1>
        </div>
      </div>

      <div className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] leading-relaxed">
        {currentJudgment}
      </div>

      {latestEvidence && evidenceImpact ? (
        <div className="mt-5 pt-5 border-t border-[#F0F0F2] space-y-3">
          <div>
            <div className="text-xs text-[#248A3D] font-semibold mb-1.5">这次现实结果</div>
            <div className="text-sm text-[#1D1D1F] leading-relaxed">{latestEvidence.userResult}</div>
          </div>
          <div>
            <div className="text-xs text-[#9CA3AF] mb-1.5">更新前的判断</div>
            <div className="text-sm text-[#6B7280] leading-relaxed">{latestEvidence.sourceJudgment || theRealProblem}</div>
          </div>
        </div>
      ) : (
        <div className="mt-5 pt-5 border-t border-[#F0F0F2] text-sm text-[#6B7280] leading-relaxed">
          {oneSentenceToRemember}
        </div>
      )}
    </section>
  );
}

// ============================================================
// V6.5 核心模块2：如果继续这样（Risk Engine）
// ============================================================

interface RiskEngineCardProps {
  risk30Days: string;
  risk90Days: string;
  mostLikelyResult: string;
}

function RiskEngineCard({ risk30Days, risk90Days, mostLikelyResult }: RiskEngineCardProps) {
  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#FF3B30]/10 flex items-center justify-center">
          <TrendingDown className="w-4.5 h-4.5 text-[#FF3B30]" />
        </div>
        <div>
          <div className="text-xs text-[#9CA3AF] mb-0.5">02</div>
          <h2 className="text-base font-semibold text-[#1D1D1F]">如果继续这样</h2>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-xs font-semibold text-[#FF3B30] bg-[#FF3B30]/8 px-2.5 py-1 rounded-md flex-shrink-0">30天后</span>
          <span className="text-sm text-[#6B7280]">{risk30Days}</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-xs font-semibold text-[#FF3B30] bg-[#FF3B30]/8 px-2.5 py-1 rounded-md flex-shrink-0">90天后</span>
          <span className="text-sm text-[#6B7280]">{risk90Days}</span>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-[#F0F0F2]">
        <div className="text-xs text-[#9CA3AF] mb-1.5">最可能发生</div>
        <div className="text-sm font-medium text-[#1D1D1F]">{mostLikelyResult}</div>
      </div>
    </section>
  );
}

// ============================================================
// V7 核心模块3：现在最需要确认什么
// ============================================================

interface VerificationGapCardProps {
  context: VerificationContext;
  latestEvidence?: EvidenceRecord | null;
}

function VerificationGapCard({ context, latestEvidence }: VerificationGapCardProps) {
  const evidenceImpact = getEvidenceImpact(latestEvidence);
  const currentUnknown = evidenceImpact?.nextUnknown || context.goal;

  return (
    <section className="bg-[#1D1D1F] text-white rounded-2xl p-6 shadow-[0_16px_40px_rgba(29,29,31,0.12)]">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
          <Shield className="w-4.5 h-4.5 text-[#FFB340]" />
        </div>
        <div>
          <div className="text-xs text-white/45 mb-0.5">03</div>
          <h2 className="text-base font-semibold">现在最需要确认什么</h2>
        </div>
      </div>

      <p className="text-lg font-medium leading-relaxed">
        {currentUnknown}
      </p>
      <p className="mt-4 text-sm text-white/60 leading-relaxed">
        {latestEvidence ? '这是最近一次结果之后，仍然阻止你做决定的未知。' : context.why}
      </p>
    </section>
  );
}

// ============================================================
// V7 核心模块4：今晚验证什么
// ============================================================

interface TonightActionCardProps {
  action: ActionItem;
  phase: VerificationPhase;
  onStart: () => void;
  onRecord: () => void;
}

function TonightActionCard({ action, phase, onStart, onRecord }: TonightActionCardProps) {
  // 估算耗时（从 successCriteria 推断）
  const estimateTime = (criteria: string) => {
    if (criteria.includes('5分钟') || criteria.includes('5min')) return '5分钟';
    if (criteria.includes('15分钟') || criteria.includes('15min')) return '15分钟';
    if (criteria.includes('30分钟') || criteria.includes('30min')) return '30分钟';
    if (criteria.includes('1小时') || criteria.includes('1h')) return '1小时';
    return '30分钟'; // 默认
  };

  const estimatedTime = estimateTime(action.successCriteria);

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#34C759]/10 flex items-center justify-center">
          <Clock className="w-4.5 h-4.5 text-[#34C759]" />
        </div>
        <div>
          <div className="text-xs text-[#9CA3AF] mb-0.5">04</div>
          <h2 className="text-base font-semibold text-[#1D1D1F]">今晚验证什么</h2>
        </div>
      </div>

      <div className="bg-[#F7F7F8] rounded-xl p-4 mb-4">
        <div className="text-base font-semibold text-[#1D1D1F] leading-relaxed">
          {action.task}
        </div>
      </div>

      {(action.platform || action.keywords || action.action) && (
        <div className="border border-[#E5E7EB] rounded-xl p-4 mb-4 space-y-3">
          {action.platform && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-[#9CA3AF] w-12 flex-shrink-0">去哪里</span>
              <span className="text-xs text-[#6B7280]">{action.platform}</span>
            </div>
          )}
          {action.keywords && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-[#9CA3AF] w-12 flex-shrink-0">找什么</span>
              <span className="text-xs text-[#6B7280]">{action.keywords}</span>
            </div>
          )}
          {action.action && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-[#9CA3AF] w-12 flex-shrink-0">怎么做</span>
              <span className="text-xs text-[#6B7280]">{action.action}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#F7F7F8] rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">大约需要</div>
          <div className="text-sm font-semibold text-[#1D1D1F]">{estimatedTime}</div>
        </div>
        <div className="bg-[#F7F7F8] rounded-lg p-3">
          <div className="text-xs text-[#9CA3AF] mb-1">看到什么就有结果</div>
          <div className="text-xs font-medium text-[#1D1D1F] leading-relaxed">{action.successCriteria}</div>
        </div>
      </div>

      <button
        onClick={phase === 'idle' ? onStart : onRecord}
        disabled={phase === 'recorded'}
        className={`w-full h-12 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${
          phase === 'recorded'
            ? 'bg-[#E8F7EC] text-[#248A3D]'
            : phase === 'started'
            ? 'bg-[#1D1D1F] text-white hover:bg-black'
            : 'bg-[#1D1D1F] text-white hover:bg-black'
        }`}
      >
        {phase === 'recorded' ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            已记录这次发现
          </>
        ) : phase === 'started' ? (
          <>
            记录我发现了什么
            <ChevronRight className="w-4 h-4" />
          </>
        ) : (
          <>
            开始验证
            <ChevronRight className="w-4 h-4" />
          </>
        )}
      </button>
    </section>
  );
}

// ============================================================
// V7.2 记录结果与更新判断
// ============================================================

interface RecordDiscoveryCardProps {
  action: ActionItem;
  context: VerificationContext;
  error: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (result: { outcome: ResultOption; userResult: string; userDiscovery: string }) => Promise<void>;
}

function RecordDiscoveryCard({
  action,
  context,
  error,
  isSubmitting,
  onCancel,
  onSubmit,
}: RecordDiscoveryCardProps) {
  const [outcomeCode, setOutcomeCode] = useState(context.options[0]?.code || '');
  const [result, setResult] = useState('');
  const [discovery, setDiscovery] = useState('');

  const canSubmit = result.trim().length > 0;
  const selectedOutcome = context.options.find(option => option.code === outcomeCode) || context.options[0];

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
          <Sparkles className="w-4.5 h-4.5 text-[#007AFF]" />
        </div>
        <div>
          <div className="text-xs text-[#9CA3AF] mb-0.5">05</div>
          <h2 className="text-base font-semibold text-[#1D1D1F]">记录我发现了什么</h2>
        </div>
      </div>

      <div className="bg-[#F7F7F8] rounded-xl p-4 mb-5">
        <div className="text-xs text-[#9CA3AF] mb-1.5">想确认什么</div>
        <p className="text-sm font-medium text-[#1D1D1F] leading-relaxed">{context.goal}</p>
        <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">{action.task}</p>
      </div>

      <div className="mb-5">
        <div className="text-sm font-medium text-[#1D1D1F] mb-3">发生了什么？</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {context.options.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => setOutcomeCode(option.code)}
              className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                outcomeCode === option.code
                  ? 'border-[#1D1D1F] bg-[#1D1D1F] text-white'
                  : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F7F8]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block mb-4">
        <span className="block text-sm font-medium text-[#1D1D1F] mb-2">实际发生了什么？</span>
        <textarea
          value={result}
          onChange={(event) => setResult(event.target.value)}
          rows={3}
          placeholder={context.resultPlaceholder}
          className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#1D1D1F] placeholder:text-[#9CA3AF] resize-none focus:outline-none focus:border-[#007AFF]"
        />
      </label>

      <label className="block mb-5">
        <span className="block text-sm font-medium text-[#1D1D1F] mb-2">这改变了你原来的什么想法？</span>
        <textarea
          value={discovery}
          onChange={(event) => setDiscovery(event.target.value)}
          rows={2}
          placeholder="可以留空，FutureLens 会先根据结果更新判断。"
          className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#1D1D1F] placeholder:text-[#9CA3AF] resize-none focus:outline-none focus:border-[#007AFF]"
        />
      </label>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#FF3B30]/20 bg-[#FF3B30]/5 px-4 py-3 text-sm text-[#C9342D]">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>保存失败：{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-12 px-5 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#6B7280] hover:bg-[#F7F7F8]"
        >
          稍后记录
        </button>
        <button
          type="button"
          disabled={!canSubmit || !selectedOutcome || isSubmitting}
          onClick={() => selectedOutcome && onSubmit({
            outcome: selectedOutcome,
            userResult: result.trim(),
            userDiscovery: discovery.trim(),
          })}
          className="h-12 flex-1 rounded-xl bg-[#1D1D1F] text-white text-sm font-semibold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '正在保存...' : '更新判断'}
        </button>
      </div>
    </section>
  );
}

interface UpdatedJudgmentCardProps {
  record: EvidenceRecord;
}

function UpdatedJudgmentCard({ record }: UpdatedJudgmentCardProps) {
  const update = getEvidenceImpact(record);
  if (!update) return null;

  return (
    <section className="bg-[#E8F7EC] border border-[#34C759]/20 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#248A3D]" />
        </div>
        <div>
          <div className="text-xs text-[#248A3D]/70 mb-0.5">判断已更新</div>
          <h2 className="text-base font-semibold text-[#1D1D1F]">{record.outcomeLabel}</h2>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white/70 rounded-xl p-4">
          <div className="text-xs text-[#6B7280] mb-1.5">这次结果说明</div>
          <p className="text-sm text-[#1D1D1F] leading-relaxed">{update.judgment}</p>
        </div>
        <div className="bg-white/70 rounded-xl p-4">
          <div className="text-xs text-[#6B7280] mb-1.5">现在最需要确认</div>
          <p className="text-sm text-[#1D1D1F] leading-relaxed">{update.nextUnknown}</p>
        </div>
        {record.userDiscovery && (
          <div className="pt-3 border-t border-[#34C759]/15">
            <div className="text-xs text-[#248A3D] mb-1.5">你的发现</div>
            <p className="text-sm text-[#1D1D1F] leading-relaxed">{record.userDiscovery}</p>
          </div>
        )}
      </div>
    </section>
  );
}

interface RecentDiscoveriesCardProps {
  records: EvidenceRecord[];
}

function RecentDiscoveriesCard({ records }: RecentDiscoveriesCardProps) {
  if (records.length === 0) return null;

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#1D1D1F]">最近获得的发现</h2>
        <span className="text-xs text-[#9CA3AF]">{records.length} 条</span>
      </div>
      <div className="space-y-3">
        {records.slice(0, 3).map(record => (
          <div key={record.id} className="border-l-2 border-[#34C759] pl-3">
            <div className="text-xs text-[#9CA3AF] mb-1">
              {new Date(record.createdAt).toLocaleDateString('zh-CN')} · {record.outcomeLabel}
            </div>
            <p className="text-sm text-[#1D1D1F] leading-relaxed">{record.userResult}</p>
            {record.userDiscovery && (
              <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">{record.userDiscovery}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

interface SolutionPackPreviewCardProps {
  solutionPack?: SolutionPack;
  onAnalyzeMaterial?: (materialText: string) => Promise<void>;
  isAnalyzingMaterial?: boolean;
}

const problemShapeLabels: Record<ProblemShape, string> = {
  learn_capability: '学习一个能力',
  build_workflow: '搭建一个工作流',
  create_output: '完成一个具体产出',
  make_decision: '做出一个选择',
  validate_opportunity: '验证一个机会',
  solve_specific_task: '解决一个具体任务',
  research_information: '补齐关键信息',
  analyze_existing_material: '分析已有材料',
};

const capabilityLabels: Record<CapabilityName, string> = {
  search_information: '信息搜索',
  analyze_file: '文件分析',
  generate_learning_plan: '学习计划生成',
  generate_exercises: '练习材料生成',
  generate_explanation: '解释说明生成',
  generate_document: '文档结构生成',
  generate_table: '表格/记录表生成',
  generate_workflow: '工作流拆解',
  generate_prompt_template: '提示词模板生成',
  generate_checklist: '执行清单生成',
  generate_review_form: '反馈表生成',
  generate_message_template: '沟通话术生成',
  generate_script: '脚本生成',
  compare_options: '选项比较',
  run_validation_design: '机会验证设计',
  track_task: '任务追踪',
  update_plan_from_feedback: '反馈后调整',
};

const materialTypeLabels: Record<SolutionMaterialType, string> = {
  learning_plan: '学习计划',
  exercise_set: '练习材料',
  explanation: '解释说明',
  document_template: '文档模板',
  table: '记录表',
  workflow: '工作流',
  prompt_template: '提示词模板',
  checklist: '执行清单',
  review_form: '反馈表',
  script: '脚本',
  message_template: '沟通话术',
};

function SolutionMaterialCard({ material }: { material: SolutionPack['materials'][number] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-[#DCE8FA] bg-white p-4 shadow-[0_8px_24px_rgba(0,80,180,0.04)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[#1D1D1F]">{material.title}</div>
          <div className="mt-1 inline-flex rounded-full bg-[#EEF5FF] px-2.5 py-1 text-[11px] font-medium text-[#3B6EA8]">
            {materialTypeLabels[material.type]}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#6B7280]">{material.purpose}</p>
      <div className="mt-3 rounded-2xl bg-[#F8FAFD] p-3">
        <div className="mb-1 text-[11px] font-semibold text-[#9CA3AF]">今天怎么用</div>
        <p className="text-xs leading-relaxed text-[#4B5563]">{material.usageInstruction}</p>
      </div>
      <div className="mt-3 rounded-2xl border border-[#E5EAF3] bg-[#FBFCFF] p-3">
        <div className="mb-2 text-[11px] font-semibold text-[#9CA3AF]">材料正文</div>
        <pre className={`whitespace-pre-wrap break-words text-xs leading-6 text-[#1D1D1F] ${isExpanded ? '' : 'max-h-[7.5rem] overflow-hidden'}`}>
          {material.content}
        </pre>
        <button
          type="button"
          onClick={() => setIsExpanded(value => !value)}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#007AFF] ring-1 ring-[#D6E6FF] hover:bg-[#F3F7FF]"
        >
          {isExpanded ? '收起材料' : '展开材料'}
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function getExecutionMethodLabel(route: NonNullable<SolutionPack['capabilityRoute']>[number]): string {
  if (route.capabilityStatus === 'unavailable' || route.executorStatus === 'unavailable') {
    return '暂不可用';
  }
  if (route.requiresUserInput && !route.canRunAutomatically) {
    return route.executionMethod || '需要用户输入';
  }
  if (route.isSimulated) {
    return route.executionMethod || 'DeepSeek 模拟';
  }
  return route.executionMethod || '页面展示';
}

function CapabilityRouteMiniPanel({ solutionPack }: { solutionPack: SolutionPack }) {
  const [isOpen, setIsOpen] = useState(false);
  const route = solutionPack.capabilityRoute || [];
  const nextUserStep = solutionPack.executionPlan?.nextUserStep;

  if (route.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#E1ECFF] bg-[#F8FAFD] p-4">
      <button
        type="button"
        onClick={() => setIsOpen(value => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <div className="text-xs font-semibold text-[#007AFF]">系统如何解决这个问题</div>
          <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
            先判断需要哪些能力，再把能力组织成材料、任务和反馈。
          </p>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-[#6B7280]" /> : <ChevronDown className="h-4 w-4 text-[#6B7280]" />}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2">
            {route.slice(0, 5).map(item => (
              <div key={item.routeId} className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-[#E5EAF3]">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-semibold text-[#1D1D1F]">{item.capabilityName}</div>
                  <div className="w-fit rounded-full bg-[#EEF5FF] px-2 py-0.5 text-[11px] font-medium text-[#3B6EA8]">
                    {getExecutionMethodLabel(item)}
                  </div>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">{item.reason}</p>
                {item.fallbackInstruction && (
                  <p className="mt-1 text-xs leading-relaxed text-[#C9342D]">{item.fallbackInstruction}</p>
                )}
                {item.futureExecutorNames && item.futureExecutorNames.length > 0 && (
                  <p className="mt-1 text-[11px] leading-relaxed text-[#9CA3AF]">
                    后续可接入：{item.futureExecutorNames.join('、')}
                  </p>
                )}
              </div>
            ))}
          </div>
          {nextUserStep && (
            <div className="rounded-xl bg-white px-3 py-2.5 text-xs leading-relaxed text-[#4B5563] ring-1 ring-[#E5EAF3]">
              <span className="font-semibold text-[#1D1D1F]">下一步：</span>{nextUserStep}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ManualMaterialInputPanel({
  solutionPack,
  onAnalyzeMaterial,
  isAnalyzingMaterial = false,
}: {
  solutionPack: SolutionPack;
  onAnalyzeMaterial?: (materialText: string) => Promise<void>;
  isAnalyzingMaterial?: boolean;
}) {
  const [materialText, setMaterialText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const hasManualMaterialText = Boolean(solutionPack.problemUnderstanding?.hasManualMaterialText);

  if (solutionPack.problemShape !== 'analyze_existing_material') return null;

  if (hasManualMaterialText) {
    return (
      <div className="rounded-2xl border border-[#D8E8D9] bg-[#F4FBF5] p-4">
        <div className="text-sm font-semibold text-[#248A3D]">已基于粘贴文本生成材料分析</div>
        <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
          当前版本使用粘贴文本分析，文件上传和 PDF / Word 解析会在后续版本接入。
        </p>
      </div>
    );
  }

  const trimmedText = materialText.trim();
  const canSubmit = trimmedText.length >= 20 && Boolean(onAnalyzeMaterial);

  const handleSubmit = async () => {
    if (!onAnalyzeMaterial || !canSubmit || isAnalyzingMaterial) return;
    setLocalError(null);
    try {
      await onAnalyzeMaterial(trimmedText.slice(0, 5000));
      setMaterialText('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '材料分析失败，请稍后重试。');
    }
  };

  return (
    <div className="rounded-2xl border border-[#DCE8FA] bg-[#F8FAFD] p-4">
      <div className="text-sm font-semibold text-[#1D1D1F]">粘贴你要分析的材料</div>
      <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
        当前版本先支持粘贴文本分析，文件上传会在后续版本接入。
      </p>
      <textarea
        value={materialText}
        onChange={(event) => {
          setMaterialText(event.target.value.slice(0, 5000));
          setLocalError(null);
        }}
        rows={6}
        placeholder="把简历、作品集介绍、汇报稿、申请材料等文字粘贴到这里。"
        className="mt-3 w-full rounded-2xl border border-[#D6E6FF] bg-white px-4 py-3 text-sm leading-relaxed text-[#1D1D1F] placeholder:text-[#9CA3AF] focus:border-[#007AFF] focus:outline-none"
      />
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[11px] text-[#9CA3AF]">{trimmedText.length}/5000 字</span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isAnalyzingMaterial}
          className="inline-flex h-10 items-center justify-center rounded-full bg-[#1D1D1F] px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isAnalyzingMaterial ? '正在分析...' : '分析这份材料'}
        </button>
      </div>
      {localError && (
        <p className="mt-2 text-xs leading-relaxed text-[#C9342D]">{localError}</p>
      )}
    </div>
  );
}

function SolutionPackPreviewCard({
  solutionPack,
  onAnalyzeMaterial,
  isAnalyzingMaterial,
}: SolutionPackPreviewCardProps) {
  if (!solutionPack) return null;

  const materialTitles = solutionPack.todayTask.requiredMaterialIds
    .map(id => solutionPack.materials.find(material => material.id === id)?.title)
    .filter(Boolean);

  return (
    <section className="relative overflow-hidden bg-white border border-[#BFD7FF] rounded-3xl p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,80,180,0.14)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#007AFF] via-[#54A3FF] to-[#BBD8FF]" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#007AFF] flex items-center justify-center shrink-0 shadow-[0_12px_24px_rgba(0,122,255,0.22)]">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="mb-1 inline-flex rounded-full bg-[#EEF5FF] px-2.5 py-1 text-[11px] font-semibold text-[#007AFF]">
              当前核心产物
            </div>
            <h2 className="text-xl font-semibold text-[#1D1D1F]">你的解决方案包</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
              基于你的问题生成的路径、材料、任务和反馈机制
            </p>
          </div>
        </div>
        <div className="inline-flex w-fit rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-medium text-[#007AFF]">
          {problemShapeLabels[solutionPack.problemShape]}
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-[#F3F7FF] to-white border border-[#E1ECFF] p-4 mb-4">
        <div className="text-xs font-semibold text-[#007AFF] mb-2">真正阻碍</div>
        <p className="text-sm font-semibold leading-relaxed text-[#1D1D1F]">{solutionPack.coreObstacle.summary}</p>
        <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">{solutionPack.problemSummary.interpretedProblem}</p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-xs font-semibold text-[#9CA3AF] mb-2">解决路径</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {solutionPack.solutionPath.slice(0, 3).map(step => (
              <div key={`${step.order}-${step.step}`} className="rounded-2xl bg-[#F8FAFD] p-3">
                <div className="mb-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#007AFF]">
                  {step.order}
                </div>
                <div className="text-sm font-semibold text-[#1D1D1F]">{step.step}</div>
                <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">{step.purpose}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-[#9CA3AF] mb-2">所需能力</div>
          <div className="flex flex-wrap gap-2">
            {solutionPack.requiredCapabilities.slice(0, 4).map(item => (
              <span key={item.capability} className="rounded-full bg-[#F3F7FF] px-2.5 py-1 text-xs text-[#3B6EA8]">
                {capabilityLabels[item.capability]}
              </span>
            ))}
          </div>
        </div>

        <CapabilityRouteMiniPanel solutionPack={solutionPack} />

        <ManualMaterialInputPanel
          solutionPack={solutionPack}
          onAnalyzeMaterial={onAnalyzeMaterial}
          isAnalyzingMaterial={isAnalyzingMaterial}
        />

        <div>
          <div className="text-xs font-semibold text-[#9CA3AF] mb-2">执行材料</div>
          <div className="space-y-3">
            {solutionPack.materials.slice(0, 3).map(material => (
              <SolutionMaterialCard key={material.id} material={material} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[#1D1D1F] p-4 text-white">
          <div className="text-xs font-medium text-white/60 mb-1">今日任务</div>
          <p className="text-sm font-semibold leading-relaxed text-white">{solutionPack.todayTask.title}</p>
          {materialTitles.length > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-white/65">
              先使用：{materialTitles.join('、')}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

type CopyableTemplate = SolutionResult['copyableTemplates'][number];

const financeFieldCards = [
  { name: '月份', usage: '记录本月周期', example: '2026年6月' },
  { name: '收入', usage: '本月总收入', example: '120000' },
  { name: '成本', usage: '本月总成本', example: '76000' },
  { name: '毛利', usage: '收入 - 成本', example: '44000' },
  { name: '毛利率', usage: '毛利 / 收入', example: '36.7%' },
  { name: '环比', usage: '和上月比较', example: '+8%' },
  { name: '同比', usage: '和去年同期比较', example: '+12%' },
];

function parseMarkdownTable(content: string) {
  const rows = content
    .split('\n')
    .map(row => row.trim())
    .filter(row => row.startsWith('|') && !/^\|\s*-/.test(row));

  return rows.map(row =>
    row
      .split('|')
      .map(cell => cell.trim())
      .filter(Boolean)
  );
}

function CopyableTemplateCard({ template }: { template: CopyableTemplate }) {
  const [copied, setCopied] = useState(false);
  const tableRows = parseMarkdownTable(template.content);
  const isFinanceFieldTable = template.title.includes('月度经营报表字段');
  const isFieldTable = !isFinanceFieldTable && tableRows.length >= 2;
  const isFormula = template.title.includes('公式');
  const isScript = template.title.includes('汇报文案') || template.title.includes('消息模板');
  const formulaRows = template.content
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [label, ...rest] = line.split('=');
      return {
        label: label.trim(),
        formula: rest.length > 0 ? `=${rest.join('=').trim()}` : line,
      };
    });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#E5EAF3] bg-[#FBFCFF] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#111827]">{template.title}</h3>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#2463EB] ring-1 ring-[#D6E6FF] transition-colors hover:bg-[#EEF5FF]"
        >
          {copied ? '已复制' : '复制'}
        </button>
      </div>

      {isFinanceFieldTable ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {financeFieldCards.map(field => (
            <div key={field.name} className="rounded-2xl bg-white p-3 ring-1 ring-[#E5EAF3]">
              <div className="text-sm font-semibold text-[#111827]">{field.name}</div>
              <div className="mt-1 text-xs leading-relaxed text-[#64748B]">用途：{field.usage}</div>
              <div className="mt-2 rounded-xl bg-[#F8FAFD] px-3 py-2 text-xs text-[#374151]">
                示例：{field.example}
              </div>
            </div>
          ))}
        </div>
      ) : isFieldTable ? (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#E5EAF3]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFD] text-[#64748B]">
              <tr>
                {tableRows[0].map(cell => (
                  <th key={cell} className="px-3 py-2 font-semibold">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F7] text-[#374151]">
              {tableRows.slice(1).map((row, index) => (
                <tr key={`${template.title}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${template.title}-${index}-${cellIndex}`} className="px-3 py-2 leading-relaxed">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : isFormula ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {formulaRows.map(row => (
            <div key={`${row.label}-${row.formula}`} className="rounded-2xl bg-white p-3 ring-1 ring-[#E5EAF3]">
              <div className="text-xs font-semibold text-[#64748B]">{row.label}</div>
              <code className="mt-2 block rounded-xl bg-[#F8FAFD] px-3 py-2 text-xs font-semibold text-[#111827]">
                {row.formula}
              </code>
            </div>
          ))}
        </div>
      ) : (
        <pre className={`whitespace-pre-wrap break-words rounded-2xl bg-white p-4 text-sm leading-7 text-[#1F2937] ring-1 ring-[#E5EAF3] ${isScript ? 'min-h-32' : ''}`}>
          {template.content}
        </pre>
      )}
    </div>
  );
}

function RefinedResultCard({ result }: { result: SolutionResult }) {
  return (
    <section className="rounded-3xl border border-[#B7D3FF] bg-white p-5 shadow-[0_18px_48px_rgba(0,80,180,0.08)] sm:p-6">
      <div className="mb-3 inline-flex rounded-full bg-[#2463EB] px-3 py-1 text-xs font-semibold text-white">
        第二版结果
      </div>
      <h2 className="text-xl font-semibold text-[#111827]">{result.usableOutput.title}</h2>
      {result.refinementSummary && (
        <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{result.refinementSummary}</p>
      )}
      <div className="mt-5 space-y-3">
        {result.usableOutput.sections.map(section => (
          <div key={section.heading} className="rounded-2xl border border-[#E5EAF3] bg-[#FBFCFF] p-4">
            <h3 className="text-sm font-semibold text-[#111827]">{section.heading}</h3>
            <pre className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-[#374151]">{section.content}</pre>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {result.copyableTemplates.map(template => (
          <CopyableTemplateCard key={template.title} template={template} />
        ))}
      </div>
    </section>
  );
}

function CapabilityPlanCard({ plan }: { plan: CapabilityPlan }) {
  return (
    <section className="rounded-3xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
      <div className="mb-3 inline-flex rounded-full bg-[#F8FAFD] px-3 py-1 text-xs font-semibold text-[#64748B]">
        2. 这件事需要调用的能力
      </div>
      <p className="text-sm leading-relaxed text-[#64748B]">{plan.demandSummary}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {plan.requiredCapabilities.map(capability => (
          <div key={capability.id} className="rounded-2xl bg-[#FBFCFF] p-3 ring-1 ring-[#E5EAF3]">
            <div className="text-sm font-semibold text-[#111827]">{capability.label}</div>
            <p className="mt-1 text-xs leading-relaxed text-[#64748B]">{capability.reason}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {plan.recommendedExecutors.map(executor => (
          <span
            key={executor.id}
            className="rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-medium text-[#2463EB]"
          >
            {executor.label}{executor.status === 'planned' ? '（待接入）' : ''}
          </span>
        ))}
      </div>
    </section>
  );
}

function ExecutionPlanCard({ plan }: { plan: CapabilityPlan }) {
  return (
    <section className="rounded-3xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
      <div className="mb-3 inline-flex rounded-full bg-[#F8FAFD] px-3 py-1 text-xs font-semibold text-[#64748B]">
        3. FutureLens 将这样执行
      </div>
      <div className="space-y-2">
        {plan.executionSteps.map((step, index) => (
          <div key={step} className="flex gap-3 rounded-2xl bg-[#F8FAFD] p-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#2463EB]">
              {index + 1}
            </div>
            <p className="text-sm leading-relaxed text-[#1F2937]">{step}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {plan.expectedDeliverables.map(deliverable => (
          <span key={deliverable} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#64748B] ring-1 ring-[#E5EAF3]">
            {deliverable}
          </span>
        ))}
      </div>
    </section>
  );
}

function SolutionWorkspaceCard({ result, profile, capabilityPlan }: { result: SolutionResult; profile: FutureProfile; capabilityPlan: CapabilityPlan }) {
  const [refinementText, setRefinementText] = useState('');
  const [refinementNote, setRefinementNote] = useState<string | null>(null);
  const [refinedResult, setRefinedResult] = useState<SolutionResult | null>(null);

  const handleRefine = () => {
    const value = refinementText.trim();
    if (!value) return;
    setRefinedResult(buildRefinedSolutionResult(profile, value, result));
    setRefinementNote('已根据你的补充生成第二版结果。');
    setRefinementText('');
  };

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-3xl border border-[#C7DBFF] bg-white p-5 shadow-[0_24px_70px_rgba(0,80,180,0.12)] sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2463EB] via-[#5DA2FF] to-[#D9E8FF]" />
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2463EB] shadow-[0_14px_28px_rgba(36,99,235,0.22)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#2463EB]">Solution Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#111827]">解决工作台</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
              FutureLens 会先理解你的需求，再组织需要的能力，生成一版可以使用的成果。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
        <div className="mb-3 inline-flex rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#2463EB]">
          1. 我理解你的需求
        </div>
        <p className="text-base font-semibold leading-relaxed text-[#111827]">{result.problemCore.summary}</p>
      </section>

      <CapabilityPlanCard plan={capabilityPlan} />

      <ExecutionPlanCard plan={capabilityPlan} />

      <section className="rounded-3xl border border-[#C7DBFF] bg-white p-5 shadow-[0_18px_48px_rgba(0,80,180,0.08)] sm:p-6">
        <div className="mb-3 inline-flex rounded-full bg-[#2463EB] px-3 py-1 text-xs font-semibold text-white">
          4. FutureLens 已生成第一版结果
        </div>
        <h2 className="text-xl font-semibold text-[#111827]">{result.usableOutput.title}</h2>
        <div className="mt-5 space-y-3">
          {result.usableOutput.sections.map(section => (
            <div key={section.heading} className="rounded-2xl border border-[#E5EAF3] bg-[#FBFCFF] p-4">
              <h3 className="text-sm font-semibold text-[#111827]">{section.heading}</h3>
              <pre className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-[#374151]">{section.content}</pre>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
        <div className="mb-3 inline-flex rounded-full bg-[#F8FAFD] px-3 py-1 text-xs font-semibold text-[#64748B]">
          5. 可直接复制使用
        </div>
        <div className="space-y-3">
          {result.copyableTemplates.map(template => (
            <CopyableTemplateCard key={template.title} template={template} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
        <div className="mb-3 inline-flex rounded-full bg-[#F8FAFD] px-3 py-1 text-xs font-semibold text-[#64748B]">
          6. 想更准，只补充 3 个信息
        </div>
        <div className="space-y-2">
          {result.clarifyingQuestions.slice(0, 3).map((question, index) => (
            <div key={question} className="flex gap-3 rounded-2xl bg-[#F8FAFD] p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#2463EB]">
                {index + 1}
              </div>
              <p className="text-sm leading-relaxed text-[#1F2937]">{question}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
        <div className="mb-3 inline-flex rounded-full bg-[#F8FAFD] px-3 py-1 text-xs font-semibold text-[#64748B]">
          7. 继续让 FutureLens 调整
        </div>
        <h2 className="text-lg font-semibold text-[#111827]">继续让 FutureLens 调整</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
          补充你的真实情况，FutureLens 可以继续把这版成果改得更准确。
        </p>
        <textarea
          value={refinementText}
          onChange={(event) => {
            setRefinementText(event.target.value.slice(0, 1200));
            setRefinementNote(null);
          }}
          rows={4}
          placeholder={result.nextRefinementPrompt}
          className="mt-4 w-full rounded-2xl border border-[#D6E6FF] bg-[#FBFCFF] px-4 py-3 text-sm leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#2463EB] focus:outline-none"
        />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-[#9CA3AF]">补充后会在本页生成第二版结果，先不写入数据库。</span>
          <button
            type="button"
            onClick={handleRefine}
            disabled={!refinementText.trim()}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#111827] px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            生成更准确的一版
          </button>
        </div>
        {refinementNote && (
          <p className="mt-3 rounded-2xl bg-[#F4FBF5] px-4 py-3 text-xs leading-relaxed text-[#248A3D]">
            {refinementNote}
          </p>
        )}
      </section>

      {refinedResult && <RefinedResultCard result={refinedResult} />}
    </div>
  );
}

// ============================================================
// V6.5 二级折叠区域：系统分析依据
// ============================================================

interface CollapsibleAnalysisProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleAnalysis({ children, defaultOpen = false }: CollapsibleAnalysisProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mt-6">
      {/* 折叠按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
      >
        <span className="text-sm font-medium text-[#6B7280]">旧版分析，仅调试查看</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#9CA3AF]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
        )}
      </button>

      {/* 折叠内容 */}
      {isOpen && (
        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 二级区域：今日变化模块
// ============================================================

interface TodayChangesCardProps {
  changes: TodayChange[];
}

function TodayChangesCard({ changes }: TodayChangesCardProps) {
  return (
    <div className="ios-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#FF9500]/15 flex items-center justify-center">
          <Zap className="w-4 h-4 text-[#FF9500]" />
        </div>
        <h2 className="text-base font-semibold">今日变化</h2>
      </div>

      <div className="space-y-3">
        {changes.map((change, index) => (
          <div key={index} className="bg-[#F9FAFB] rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-[#FF9500]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-[#FF9500]">{index + 1}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-[#1D1D1F] mb-1">{change.title}</h3>
                <p className="text-xs text-[#6B7280]">{change.summary}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 二级区域：Personal Impact 模块
// ============================================================

interface PersonalImpactCardProps {
  personalImpact?: PersonalImpact;
}

function PersonalImpactCard({ personalImpact }: PersonalImpactCardProps) {
  if (!personalImpact) {
    return null;
  }

  return (
    <div className="ios-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#007AFF]/15 flex items-center justify-center">
          <Target className="w-4 h-4 text-[#007AFF]" />
        </div>
        <h2 className="text-base font-semibold">这对你意味着什么</h2>
      </div>

      <div className="space-y-3">
        <div className="bg-[#F9FAFB] rounded-lg p-3">
          <div className="text-xs text-[#007AFF] font-semibold mb-1">受到影响的能力</div>
          <p className="text-sm text-[#6B7280]">{personalImpact.affectedPart}</p>
        </div>

        <div className="bg-gradient-to-r from-[#007AFF]/5 to-[#AF52DE]/5 rounded-lg p-3">
          <div className="text-xs text-[#AF52DE] font-semibold mb-1">影响原因</div>
          <p className="text-sm text-[#6B7280]">{personalImpact.reason}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#34C759]/5 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-[#34C759]" />
              <span className="text-xs text-[#34C759] font-semibold">新出现的可能性</span>
            </div>
            <p className="text-xs text-[#6B7280]">{personalImpact.opportunity}</p>
          </div>
          <div className="bg-[#FF3B30]/5 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-[#FF3B30]" />
              <span className="text-xs text-[#FF3B30] font-semibold">增加的风险</span>
            </div>
            <p className="text-xs text-[#6B7280]">{personalImpact.risk}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 二级区域：当前状态模块
// ============================================================

interface UserStateCardProps {
  userState: UserStateProfile;
  latestEvidence?: EvidenceRecord | null;
}

function UserStateCard({ userState, latestEvidence }: UserStateCardProps) {
  const identitySignal = getEvidenceImpact(latestEvidence)?.identitySignal;

  return (
    <div className="ios-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#007AFF]/15 flex items-center justify-center">
          <User className="w-4 h-4 text-[#007AFF]" />
        </div>
        <h2 className="text-base font-semibold">当前状态</h2>
      </div>

      <div className="bg-gradient-to-r from-[#007AFF]/5 to-[#AF52DE]/5 rounded-lg p-3 mb-3">
        <div className="text-base font-bold text-[#1D1D1F] mb-1">{userState.stateLabel}</div>
        <p className="text-sm text-[#6B7280]">{userState.oneSentenceDiagnosis}</p>
      </div>

      {identitySignal && (
        <div className="bg-[#E8F7EC] rounded-lg p-3 mb-3">
          <div className="text-xs text-[#248A3D] font-semibold mb-1">最近一次验证带来的状态变化</div>
          <p className="text-sm text-[#1D1D1F]">{identitySignal}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="bg-[#F9FAFB] rounded-lg px-3 py-2">
          <div className="text-xs text-[#9CA3AF]">主目标</div>
          <div className="text-sm font-medium text-[#1D1D1F]">{userState.mainGoal}</div>
        </div>
        <div className="bg-[#F9FAFB] rounded-lg px-3 py-2">
          <div className="text-xs text-[#9CA3AF]">主要焦虑</div>
          <div className="text-sm font-medium text-[#1D1D1F]">{userState.mainFear}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 二级区域：价值迁移模块
// ============================================================

interface ValueMigrationCardProps {
  migration: ValueMigration;
}

function ValueMigrationCard({ migration }: ValueMigrationCardProps) {
  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high':
        return { bg: '#FF3B30', bgLight: '#FF3B30/15', text: '#FF3B30', label: '紧迫' };
      case 'medium':
        return { bg: '#FF9500', bgLight: '#FF9500/15', text: '#FF9500', label: '中等' };
      case 'low':
        return { bg: '#34C759', bgLight: '#34C759/15', text: '#34C759', label: '稳定' };
      default:
        return { bg: '#6B7280', bgLight: '#6B7280/15', text: '#6B7280', label: '未知' };
    }
  };

  const urgency = getUrgencyColor(migration.urgencyLevel);

  return (
    <div className="ios-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#AF52DE]/15 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-[#AF52DE]" />
        </div>
        <h2 className="text-base font-semibold">价值迁移</h2>
        <div 
          className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: urgency.bgLight, color: urgency.text }}
        >
          {urgency.label}
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-[#007AFF]/5 rounded-lg p-3">
          <div className="text-xs text-[#007AFF] font-semibold mb-1">你现在靠什么赚钱</div>
          <div className="flex flex-wrap gap-1">
            {migration.currentValueSource.map((item, index) => (
              <span key={index} className="text-xs bg-white px-2 py-0.5 rounded border border-[#007AFF]/20">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#FF3B30]/5 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-[#FF3B30]" />
              <span className="text-xs text-[#FF3B30] font-semibold">正在贬值</span>
            </div>
            {migration.decliningValue.map((item, index) => (
              <div key={index} className="text-xs text-[#6B7280]">• {item}</div>
            ))}
          </div>
          <div className="bg-[#34C759]/5 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-[#34C759]" />
              <span className="text-xs text-[#34C759] font-semibold">正在升值</span>
            </div>
            {migration.risingValue.map((item, index) => (
              <div key={index} className="text-xs text-[#6B7280]">• {item}</div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#AF52DE]/5 to-[#007AFF]/5 rounded-lg p-3">
          <div className="text-xs text-[#AF52DE] font-semibold mb-1">你应该迁移到</div>
          <p className="text-sm font-medium text-[#1D1D1F]">{migration.migrationDirection}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 二级区域：系统为什么这样判断
// ============================================================

interface DecisionTransparencyCardProps {
  explanation: DecisionExplanation;
}

function DecisionTransparencyCard({ explanation }: DecisionTransparencyCardProps) {
  return (
    <div className="ios-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#AF52DE]/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#AF52DE]" />
        </div>
        <h2 className="text-base font-semibold">系统为什么这样判断</h2>
      </div>

      <div className="space-y-3">
        <div className="bg-gradient-to-r from-[#AF52DE]/5 to-[#007AFF]/5 rounded-lg p-3">
          <div className="text-xs text-[#AF52DE] font-semibold mb-1">系统最关注什么</div>
          <p className="text-sm font-medium text-[#1D1D1F]">{explanation.currentPriority}</p>
        </div>

        <div className="bg-[#F9FAFB] rounded-lg p-3">
          <div className="text-xs text-[#FF3B30] font-semibold mb-1">为什么不是别的事情</div>
          <p className="text-sm text-[#6B7280]">{explanation.whyNotOthers}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {explanation.influencingFactors.map((factor, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#007AFF]/20 rounded-full text-xs">
              <CheckCircle2 className="w-3 h-3 text-[#34C759]" />
              {factor}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 二级区域：完整行动清单
// ============================================================

interface ActionsCardProps {
  actions: ActionItem[];
}

function ActionsCard({ actions }: ActionsCardProps) {
  const getTimeColor = (time: string) => {
    switch (time) {
      case '今晚':
        return { bg: '#34C759', bgLight: '#34C759/15', text: '#34C759' };
      case '明天':
        return { bg: '#007AFF', bgLight: '#007AFF/15', text: '#007AFF' };
      case '本周':
        return { bg: '#AF52DE', bgLight: '#AF52DE/15', text: '#AF52DE' };
      default:
        return { bg: '#6B7280', bgLight: '#6B7280/15', text: '#6B7280' };
    }
  };

  return (
    <div className="ios-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#34C759]/15 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-[#34C759]" />
        </div>
        <h2 className="text-base font-semibold">完整行动清单</h2>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const colors = getTimeColor(action.time);
          return (
            <div key={index} className="bg-[#F9FAFB] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ backgroundColor: colors.bgLight, color: colors.text }}
                >
                  {action.time}
                </span>
              </div>
              <p className="text-sm font-medium text-[#1D1D1F] mb-2">{action.task}</p>
              <div className="text-xs text-[#6B7280] flex items-start gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#34C759] mt-0.5 flex-shrink-0" />
                {action.successCriteria}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 二级区域：未来分身提醒
// ============================================================

interface FutureSelfCardProps {
  message: string;
  evidenceHistory: EvidenceRecord[];
}

function FutureSelfCard({ message, evidenceHistory }: FutureSelfCardProps) {
  const identitySignals = Array.from(new Set(
    evidenceHistory
      .map(record => getEvidenceImpact(record)?.identitySignal)
      .filter((signal): signal is string => Boolean(signal))
  )).slice(0, 3);

  return (
    <div className="ios-card p-5 bg-gradient-to-br from-[#FF9500]/5 to-[#FF9500]/10 border border-[#FF9500]/20">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#FF9500]/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#FF9500]" />
        </div>
        <h2 className="text-base font-semibold">正在被现实证明的你</h2>
      </div>
      {identitySignals.length > 0 ? (
        <div className="space-y-2">
          {identitySignals.map(signal => (
            <div key={signal} className="flex items-start gap-2 text-sm text-[#1D1D1F]">
              <CheckCircle2 className="w-4 h-4 text-[#34C759] mt-0.5 flex-shrink-0" />
              <span>{signal}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#1D1D1F] leading-relaxed">{message}</p>
      )}
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================

const RADAR_KEY = 'futurelens-latest-radar';
const RADAR_CREATED_AT_KEY = 'futurelens-latest-radar-created-at';
const RADAR_PROFILE_HASH_KEY = 'futurelens-latest-radar-profile-hash';
const RADAR_USER_STATE_KEY = 'futurelens-latest-user-state';
const EVIDENCE_HISTORY_KEY = 'futurelens-evidence-history';

function getProfileProblemText(profile: FutureProfile): string {
  return [
    profile.currentSituation,
    profile.currentGoal,
    profile.desiredOutcome,
    profile.currentSkills,
    profile.currentAnxiety,
    profile.majorOrCareer,
  ].filter(Boolean).join(' ').trim();
}

export default function RadarPage() {
  const [profile, setProfile] = useState<FutureProfile | null>(null);
  const [radarData, setRadarData] = useState<OpportunityRadarV4 | null>(null);
  const [userState, setUserState] = useState<UserStateProfile | null>(null);
  const [radarCreatedAt, setRadarCreatedAt] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isAnalyzingMaterial, setIsAnalyzingMaterial] = useState(false);
  const [verificationPhase, setVerificationPhase] = useState<VerificationPhase>('idle');
  const [evidenceHistory, setEvidenceHistory] = useState<EvidenceRecord[]>([]);
  const [isSavingDiscovery, setIsSavingDiscovery] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDebugAnalysis, setShowDebugAnalysis] = useState(false);

  const loadProfileForRadar = async (): Promise<FutureProfile | null> => {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.profile) {
          localStorage.setItem('futurelens-user-profile', JSON.stringify(result.profile));
          return result.profile as FutureProfile;
        }
      }
    } catch (err) {
      console.error('[Radar] Failed to fetch remote profile:', err);
    }

    return loadProfile();
  };

  const loadDiscoveryHistory = async () => {
    try {
      const response = await fetch('/api/discoveries', {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.ok) {
        const result = await response.json();
        const items = Array.isArray(result.items) ? result.items as EvidenceRecord[] : [];
        localStorage.setItem(EVIDENCE_HISTORY_KEY, JSON.stringify(items));
        setEvidenceHistory(items);
        return;
      }
    } catch (err) {
      console.error('[Radar] Failed to fetch discoveries:', err);
    }

    try {
      const stored = localStorage.getItem(EVIDENCE_HISTORY_KEY);
      if (!stored) return;

      const history = JSON.parse(stored);
      if (!Array.isArray(history)) return;

      const validHistory = history
        .filter((item): item is EvidenceRecord => Boolean(item?.id && item?.sourceJudgment && item?.verificationGoal))
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      setEvidenceHistory(validHistory);
    } catch (err) {
      console.error('[Radar] 璇诲彇鍘嗗彶鍙戠幇澶辫触:', err);
    }
  };

  const loadFromCache = (currentProfileHash: string) => {
    try {
      const cachedRadar = localStorage.getItem(RADAR_KEY);
      const cachedCreatedAt = localStorage.getItem(RADAR_CREATED_AT_KEY);
      const cachedProfileHash = localStorage.getItem(RADAR_PROFILE_HASH_KEY);
      const cachedUserState = localStorage.getItem(RADAR_USER_STATE_KEY);
      
      if (cachedRadar) {
        if (cachedProfileHash === currentProfileHash) {
          setRadarData(JSON.parse(cachedRadar));
          setRadarCreatedAt(cachedCreatedAt || undefined);
          if (cachedUserState) {
            setUserState(JSON.parse(cachedUserState));
          }
          return true;
        } else {
          localStorage.removeItem(RADAR_KEY);
          localStorage.removeItem(RADAR_CREATED_AT_KEY);
          localStorage.removeItem(RADAR_PROFILE_HASH_KEY);
          localStorage.removeItem(RADAR_USER_STATE_KEY);
        }
      }
    } catch (err) {
      console.error('[Radar] 读取缓存失败:', err);
    }
    return false;
  };

  const saveToCache = (data: OpportunityRadarV4, currentProfileHash: string, state: UserStateProfile) => {
    try {
      const now = new Date().toISOString();
      localStorage.setItem(RADAR_KEY, JSON.stringify(data));
      localStorage.setItem(RADAR_CREATED_AT_KEY, now);
      localStorage.setItem(RADAR_PROFILE_HASH_KEY, currentProfileHash);
      localStorage.setItem(RADAR_USER_STATE_KEY, JSON.stringify(state));
      setRadarCreatedAt(now);
      setUserState(state);
    } catch (err) {
      console.error('[Radar] 保存缓存失败:', err);
    }
  };

  const loadRadar = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedProfile = await loadProfileForRadar();
      if (!loadedProfile) {
        setIsLoading(false);
        return;
      }

      setProfile(loadedProfile);

      const currentProfileHash = generateProfileHash(loadedProfile);

      const analyzedState = analyzeUserState(loadedProfile);
      setUserState(analyzedState);

      if (!forceRefresh && loadFromCache(currentProfileHash)) {
        setIsLoading(false);
        return;
      }

      setIsRegenerating(true);
      
      const changeSignals = getChangeSignalsForProfile(loadedProfile, analyzedState);
      
      const response = await fetch('/api/radar/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: loadedProfile,
          changeSignals: changeSignals,
          userStateProfile: analyzedState
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '生成失败');
      }

      setRadarData(result.data);
      saveToCache(result.data, currentProfileHash, analyzedState);
    } catch (err) {
      console.error('[Radar] 加载失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    loadRadar();
  }, []);

  useEffect(() => {
    setShowDebugAnalysis(new URLSearchParams(window.location.search).get('debug') === '1');
  }, []);

  useEffect(() => {
    loadDiscoveryHistory();
  }, [radarData]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(EVIDENCE_HISTORY_KEY);
      if (!stored) return;

      const history = JSON.parse(stored);
      if (!Array.isArray(history)) return;

      const validHistory = history
        .filter((item): item is EvidenceRecord => Boolean(item?.id && item?.sourceJudgment && item?.verificationGoal))
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      setEvidenceHistory(validHistory);
    } catch (err) {
      console.error('[Radar] 读取历史发现失败:', err);
    }
  }, [radarData]);

  const latestEvidence = evidenceHistory[0] || null;
  const tonightAction = radarData?.actions.find(a => a.time === '今晚') || radarData?.actions[0];

  const handleVerificationSubmitV2 = async (
    result: { outcome: ResultOption; userResult: string; userDiscovery: string }
  ) => {
    const coreInsight = radarData?.coreInsight;
    if (!tonightAction || !coreInsight) return;

    const previousImpact = getEvidenceImpact(latestEvidence);
    const currentAction = previousImpact
      ? {
          ...tonightAction,
          task: previousImpact.nextAction,
          platform: undefined,
          keywords: undefined,
          action: undefined,
          successCriteria: '寰楀埌涓€涓兘澶熸敮鎸併€佸墛寮辨垨鏀瑰彉褰撳墠鍒ゆ柇鐨勫叿浣撶粨鏋溿€?',
        }
      : tonightAction;
    const context = latestEvidence
      ? getVerificationContextForCategory(latestEvidence.category, currentAction.task)
      : getVerificationContext(currentAction);

    const payload: CreateDiscoveryInput = {
      radarCreatedAt: radarCreatedAt || null,
      sourceJudgment: radarData?.impactOnUser?.currentProblem || '',
      verificationGoal: context.goal,
      actionTitle: currentAction.task,
      category: context.category,
      outcomeCode: result.outcome.code,
      outcomeLabel: result.outcome.label,
      userResult: result.userResult,
      userDiscovery: result.userDiscovery,
    };

    setIsSavingDiscovery(true);
    setDiscoveryError(null);

    try {
      const response = await fetch('/api/discoveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const saved = await response.json().catch(() => null);
      if (!response.ok || !saved?.success || !saved?.item) {
        throw new Error(saved?.error || '无法保存这次发现，请稍后重试');
      }
      const record = saved.item as EvidenceRecord;

      const stored = localStorage.getItem(EVIDENCE_HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const history = Array.isArray(parsed) ? parsed : [];
      const nextHistory = [record, ...history];
      localStorage.setItem(EVIDENCE_HISTORY_KEY, JSON.stringify(nextHistory));
      setEvidenceHistory(nextHistory);
      setVerificationPhase('recorded');
    } catch (err) {
      console.error('[Radar] Failed to save discovery:', err);
      setDiscoveryError(err instanceof Error ? err.message : '无法保存这次发现，请稍后重试');
    } finally {
      setIsSavingDiscovery(false);
    }
  };

  const handleVerificationSubmit = (
    result: { outcome: ResultOption; userResult: string; userDiscovery: string }
  ) => {
    const coreInsight = radarData?.coreInsight;
    if (!tonightAction || !coreInsight) return;

    const previousImpact = getEvidenceImpact(latestEvidence);
    const currentAction = previousImpact
      ? {
          ...tonightAction,
          task: previousImpact.nextAction,
          platform: undefined,
          keywords: undefined,
          action: undefined,
          successCriteria: '得到一个能够支持、削弱或改变当前判断的具体结果。',
        }
      : tonightAction;
    const context = latestEvidence
      ? getVerificationContextForCategory(latestEvidence.category, currentAction.task)
      : getVerificationContext(currentAction);

    const record: EvidenceRecord = {
      id: `${Date.now()}`,
      userId: 'local-cache',
      radarCreatedAt: radarCreatedAt || null,
      sourceJudgment: radarData?.impactOnUser?.currentProblem || '',
      verificationGoal: context.goal,
      actionTitle: currentAction.task,
      category: context.category,
      outcomeCode: result.outcome.code,
      outcomeLabel: result.outcome.label,
      userResult: result.userResult,
      userDiscovery: result.userDiscovery,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem(EVIDENCE_HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const history = Array.isArray(parsed) ? parsed : [];
      const nextHistory = [record, ...history];
      localStorage.setItem(EVIDENCE_HISTORY_KEY, JSON.stringify(nextHistory));
      setEvidenceHistory(nextHistory);
    } catch (err) {
      console.error('[Radar] 保存发现失败:', err);
    }

    setVerificationPhase('recorded');
  };

  const handleUpdateChanges = () => {
    setVerificationPhase('idle');
    loadRadar(true);
  };

  const handleAnalyzeMaterial = async (materialText: string) => {
    if (!profile) {
      throw new Error('请先完成 Profile，再分析材料。');
    }

    try {
      setIsAnalyzingMaterial(true);
      setError(null);

      const currentState = userState || analyzeUserState(profile);
      const currentProfileHash = generateProfileHash(profile);
      const changeSignals = getChangeSignalsForProfile(profile, currentState);

      const response = await fetch('/api/radar/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile,
          changeSignals,
          userStateProfile: currentState,
          attachedContext: {
            type: 'pasted_text',
            label: '粘贴材料',
            content: materialText.slice(0, 5000),
          },
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || '材料分析失败，请稍后重试。');
      }

      setRadarData(result.data);
      saveToCache(result.data, currentProfileHash, currentState);
    } finally {
      setIsAnalyzingMaterial(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#007AFF] animate-spin" />
          <span className="text-sm text-[#6B7280]">正在加载...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-[#007AFF]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mb-3">你还没有创建未来分身</h2>
          <p className="text-sm text-[#6B7280] mb-8 leading-relaxed">
            FutureLens 需要先了解你是谁，才能为你生成专属的行动导航。
          </p>
          <Link
            href="/profile"
            className="ios-button-primary inline-flex items-center gap-2 px-8 py-3 text-base font-semibold"
          >
            创建我的未来分身
          </Link>
        </div>
      </div>
    );
  }

  if (error || !radarData) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-[#FF3B30]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mb-3">出了点问题</h2>
          <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">
            {error || '暂时无法生成这次判断'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpdateChanges}
              className="ios-button-primary inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              重新判断
            </button>
            <Link
              href="/profile"
              className="ios-button-secondary inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-medium"
            >
              编辑档案
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const solutionResult = buildSolutionResult(profile, radarData);
  const capabilityPlan = routeCapabilities(getProfileProblemText(profile));

  // Solution Core v0.5 Step 1：解决工作台
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="sticky top-0 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-[#E5E7EB] z-10">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#007AFF] text-sm font-medium">
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>返回</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#2463EB]/12 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#2463EB]" />
            </div>
            <span className="text-base font-semibold">解决工作台</span>
          </div>
          <button
            onClick={handleUpdateChanges}
            disabled={isRegenerating}
            aria-label="重新生成"
            title="重新生成"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-white transition-colors disabled:opacity-50"
          >
            {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 sm:py-10">
        <SolutionWorkspaceCard result={solutionResult} profile={profile} capabilityPlan={capabilityPlan} />

        {showDebugAnalysis && (
          <CollapsibleAnalysis>
            <CoreInsightCard
              coreInsight={radarData.coreInsight}
              latestEvidence={latestEvidence}
            />
            <SolutionPackPreviewCard
              solutionPack={radarData.solutionPack}
              onAnalyzeMaterial={handleAnalyzeMaterial}
              isAnalyzingMaterial={isAnalyzingMaterial}
            />
            <TodayChangesCard changes={radarData.todayChanges} />
            <PersonalImpactCard personalImpact={radarData.personalImpact} />
            {userState && (
              <UserStateCard
                userState={userState}
                latestEvidence={latestEvidence}
              />
            )}
            {radarData.valueMigration && <ValueMigrationCard migration={radarData.valueMigration} />}
            {radarData.decisionExplanation && <DecisionTransparencyCard explanation={radarData.decisionExplanation} />}
            <ActionsCard actions={radarData.actions} />
            <FutureSelfCard
              message={radarData.futureSelfMessage}
              evidenceHistory={evidenceHistory}
            />
          </CollapsibleAnalysis>
        )}

        <div className="flex items-center justify-center gap-3 pt-8 pb-6">
          <Link href="/profile" className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
            补充问题背景
          </Link>
          <span className="text-[#D1D5DB]">·</span>
          <span className="text-xs text-[#9CA3AF]">继续补充后，可以重新生成更贴近你的成果</span>
        </div>
      </main>
    </div>
  );
}
