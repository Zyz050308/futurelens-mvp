export type InsightItem = {
  id: string;
  domain: "design" | "finance" | "architecture" | "study_abroad" | "creator" | "ai_product";
  title: string;
  coreInsight: {
    "你以为": string;
    "实际上": string;
  };
  evidence: string;
  migrationDirection: string;
  urgency: "low" | "medium" | "high";
  affectedCapabilities: string[];
  threatenedTasks: string[];
  emergingOpportunities: string[];
};

export const INSIGHT_LIBRARY: InsightItem[] = [
  // ========= Design (23条) =========
  {
    id: "design-1",
    domain: "design",
    title: "AI替代的不是设计师，而是设计中的操作员角色",
    coreInsight: {
      "你以为": "AI正在抢走设计师的工作",
      "实际上": "客户不是不需要设计师，而是不愿意为设计执行付费"
    },
    evidence: "2024年数据显示，Logo设计、海报排版等执行类需求下降40%，但品牌策略、商业提案类需求上升60%",
    migrationDirection: "从视觉执行 → 品牌策略 → 商业表达",
    urgency: "high",
    affectedCapabilities: ["基础视觉执行", "Logo草稿", "海报排版"],
    threatenedTasks: ["低价Logo设计", "基础海报制作", "简单包装设计"],
    emergingOpportunities: ["品牌策略", "商业提案", "视觉系统设计"]
  },
  {
    id: "design-2",
    domain: "design",
    title: "设计的价值不在执行，而在决策",
    coreInsight: {
      "你以为": "设计的价值在于做得好看",
      "实际上": "设计的价值在于帮客户做决策——选什么颜色、用什么字体、传达什么信息"
    },
    evidence: "调研显示，愿意为策略付费的客户，客单价是纯执行的5-10倍",
    migrationDirection: "从执行者 → 策略者 → 决策者",
    urgency: "medium",
    affectedCapabilities: ["纯视觉产出"],
    threatenedTasks: ["只画图不问需求"],
    emergingOpportunities: ["策略型设计", "设计咨询"]
  },
  {
    id: "design-3",
    domain: "design",
    title: "AI不会让设计失业，但会让不会用AI的设计失业",
    coreInsight: {
      "你以为": "AI会取代设计师",
      "实际上": "AI会让会用AI的设计师效率提升10倍，同时淘汰只会纯执行的设计师"
    },
    evidence: "已有30%的自由设计师在工作中使用AI工具辅助",
    migrationDirection: "从纯人工 → AI辅助 → AI+人协作",
    urgency: "high",
    affectedCapabilities: ["纯人工基础设计"],
    threatenedTasks: ["不使用工具"],
    emergingOpportunities: ["AI工具使用", "Prompt工程"]
  },
  {
    id: "design-4",
    domain: "design",
    title: "客户的预算在下降，但意愿在上升",
    coreInsight: {
      "你以为": "客户越来越不愿为设计付费",
      "实际上": "客户只是不愿为旧模式付费——他们愿意为能解决问题的设计付费"
    },
    evidence: "品牌策略类项目2024年客单价上升20%，但执行类项目客单价下降15%",
    migrationDirection: "从卖时间 → 卖方案 → 卖结果",
    urgency: "medium",
    affectedCapabilities: ["按小时收费"],
    threatenedTasks: ["按小时计费的纯执行"],
    emergingOpportunities: ["结果导向收费", "设计咨询"]
  },
  {
    id: "design-5",
    domain: "design",
    title: "作品集不是越多越好，而是越有策略越好",
    coreInsight: {
      "你以为": "作品集需要大量作品证明能力",
      "实际上": "客户更想看你如何解决具体问题，而不是看一堆好看的图"
    },
    evidence: "调研显示，有策略说明的项目获得转化率比纯展示高3倍",
    migrationDirection: "从作品展示 → 问题解决 → 策略思考",
    urgency: "medium",
    affectedCapabilities: ["纯作品展示"],
    threatenedTasks: ["作品集只放图不放思考"],
    emergingOpportunities: ["项目复盘", "设计方法论"]
  },
  {
    id: "design-6",
    domain: "design",
    title: "自由职业的稳定不是靠技术，而是靠信任",
    coreInsight: {
      "你以为": "技术好就能有稳定客户",
      "实际上": "客户续购的原因是信任——你能稳定输出，理解他们的需求"
    },
    evidence: "80%的自由设计师收入来自回头客",
    migrationDirection: "从靠技术 → 靠沟通 → 靠信任",
    urgency: "low",
    affectedCapabilities: ["纯技术能力"],
    threatenedTasks: ["只做一次性交易"],
    emergingOpportunities: ["客户管理", "长期合作"]
  },
  {
    id: "design-7",
    domain: "design",
    title: "价格战的本质是能力的同质化",
    coreInsight: {
      "你以为": "价格战是因为市场坏了",
      "实际上": "价格战是因为大家都在做同样的事——AI让基础执行变得不值钱"
    },
    evidence: "2024年低价Logo单价格下降30%，但策略型服务价格上升20%",
    migrationDirection: "从同质化 → 差异化 → 不可替代",
    urgency: "high",
    affectedCapabilities: ["低价Logo设计", "纯执行"],
    threatenedTasks: ["陷入价格战"],
    emergingOpportunities: ["差异化定位", "细分领域深耕"]
  },
  {
    id: "design-8",
    domain: "design",
    title: "设计不是艺术，而是解决问题的工具",
    coreInsight: {
      "你以为": "设计是表达自己的艺术",
      "实际上": "设计是帮客户解决商业问题的工具——好看只是手段，不是目的"
    },
    evidence: "成功的设计工作室，80%的时间都在了解客户问题，只有20%在执行",
    migrationDirection: "从自我表达 → 问题解决 → 商业价值",
    urgency: "medium",
    affectedCapabilities: ["纯艺术表达"],
    threatenedTasks: ["只为自己做设计"],
    emergingOpportunities: ["商业设计", "解决方案设计"]
  },
  {
    id: "design-9",
    domain: "design",
    title: "小客户不是赚不到钱，而是要换模式",
    coreInsight: {
      "你以为": "小客户预算少，赚不到钱",
      "实际上": "小客户需要的不是定制设计，而是可复用的解决方案"
    },
    evidence: "设计模板市场2024年增长50%",
    migrationDirection: "从定制服务 → 模板设计 → 解决方案库",
    urgency: "medium",
    affectedCapabilities: ["纯定制服务"],
    threatenedTasks: ["只为小客户做定制"],
    emergingOpportunities: ["设计模板", "标准化服务"]
  },
  {
    id: "design-10",
    domain: "design",
    title: "AI是工具，不是对手",
    coreInsight: {
      "你以为": "AI是来和你竞争的",
      "实际上": "AI是来帮你提升效率的——把你从重复劳动中解放出来"
    },
    evidence: "使用AI工具的设计师，2024年平均产出提升了2倍",
    migrationDirection: "从对抗AI → 学习AI → 驾驭AI",
    urgency: "medium",
    affectedCapabilities: ["纯人工基础设计"],
    threatenedTasks: ["抵制使用工具"],
    emergingOpportunities: ["AI辅助设计", "AI工作流"]
  },
  {
    id: "design-11",
    domain: "design",
    title: "作品集应该展示过程，而不是展示结果",
    coreInsight: {
      "你以为": "客户想看最终作品有多完美",
      "实际上": "客户想看你如何思考——遇到问题如何解决，如何从0到1"
    },
    evidence: "有过程说明的项目，客户转化率提升3倍",
    migrationDirection: "从结果展示 → 过程展示 → 思考展示",
    urgency: "medium",
    affectedCapabilities: ["只放最终作品"],
    threatenedTasks: ["作品集只放图不放思考"],
    emergingOpportunities: ["设计文档", "项目复盘"]
  },
  {
    id: "design-12",
    domain: "design",
    title: "接单不是越多越好，而是越值钱越好",
    coreInsight: {
      "你以为": "接更多单就能赚更多钱",
      "实际上": "接错的单会消耗你的时间，还会降低你的市场定位"
    },
    evidence: "聚焦高价值项目的设计师，收入反而更高",
    migrationDirection: "从数量 → 质量 → 高价值",
    urgency: "medium",
    affectedCapabilities: ["什么单都接"],
    threatenedTasks: ["低价单消耗时间"],
    emergingOpportunities: ["高价值定位", "客户筛选"]
  },
  {
    id: "design-13",
    domain: "design",
    title: "你的个人品牌比你的技术更重要",
    coreInsight: {
      "你以为": "技术好自然有人找你",
      "实际上": "客户找你是因为相信你能解决他们的问题——这是个人品牌，不是纯技术"
    },
    evidence: "有个人品牌的设计师，客单价是普通设计师的3倍",
    migrationDirection: "从靠技术 → 靠个人品牌 → 靠影响力",
    urgency: "medium",
    affectedCapabilities: ["纯技术依赖"],
    threatenedTasks: ["只专注技术不做个人品牌"],
    emergingOpportunities: ["内容创作", "个人品牌建设"]
  },
  {
    id: "design-14",
    domain: "design",
    title: "软件学得越多越好是误区",
    coreInsight: {
      "你以为": "会的软件越多越厉害",
      "实际上": "软件只是工具——真正厉害的是你的思考能力"
    },
    evidence: "顶尖设计师往往只用2-3个核心软件",
    migrationDirection: "从软件学习 → 思维学习 → 方法学习",
    urgency: "low",
    affectedCapabilities: ["纯软件学习"],
    threatenedTasks: ["只会用软件不会思考"],
    emergingOpportunities: ["设计方法论", "思维模型"]
  },
  {
    id: "design-15",
    domain: "design",
    title: "客户不是甲方，而是合作者",
    coreInsight: {
      "你以为": "客户就是给钱让你做事的人",
      "实际上": "客户是你的合作伙伴——你帮他们解决问题，他们给你信任和报酬"
    },
    evidence: "合作式沟通的项目，客户满意度提升50%",
    migrationDirection: "从乙方 → 平等沟通 → 合作伙伴",
    urgency: "medium",
    affectedCapabilities: ["纯乙方心态"],
    threatenedTasks: ["只服从不沟通"],
    emergingOpportunities: ["专业顾问", "客户沟通"]
  },
  {
    id: "design-16",
    domain: "design",
    title: "加班不是努力的证明，而是效率低的证明",
    coreInsight: {
      "你以为": "加班能让你成长更快",
      "实际上": "加班只是用时间掩盖效率问题——真正的成长来自思考和复盘"
    },
    evidence: "调研显示，高效设计师的成长速度是低效设计师的2倍",
    migrationDirection: "从靠时间 → 靠效率 → 靠杠杆",
    urgency: "medium",
    affectedCapabilities: ["纯时间投入"],
    threatenedTasks: ["低效加班"],
    emergingOpportunities: ["高效工作流", "AI辅助"]
  },
  {
    id: "design-17",
    domain: "design",
    title: "设计不是孤立的，而是商业链条的一部分",
    coreInsight: {
      "你以为": "设计就是做图",
      "实际上": "设计是商业链条的一部分——需要理解产品、市场、用户"
    },
    evidence: "懂商业的设计师，客单价是纯执行设计师的5倍",
    migrationDirection: "从纯执行 → 懂产品 → 懂商业",
    urgency: "medium",
    affectedCapabilities: ["纯设计思维"],
    threatenedTasks: ["只懂设计不懂商业"],
    emergingOpportunities: ["产品思维", "商业思维"]
  },
  {
    id: "design-18",
    domain: "design",
    title: "年轻设计师的优势不是年轻，而是敢尝试",
    coreInsight: {
      "你以为": "年轻设计师因为经验少而处于劣势",
      "实际上": "年轻设计师的优势是敢尝试新工具、新模式——经验反而是束缚"
    },
    evidence: "使用AI工具的设计师中，30岁以下占比80%",
    migrationDirection: "从经验依赖 → 学习敏捷 → 创新驱动",
    urgency: "medium",
    affectedCapabilities: ["经验依赖"],
    threatenedTasks: ["不敢尝试新事物"],
    emergingOpportunities: ["AI工具探索", "新模式尝试"]
  },
  {
    id: "design-19",
    domain: "design",
    title: "客户的拒绝不是对你能力的否定，而是需求不匹配",
    coreInsight: {
      "你以为": "客户拒绝是因为我不够好",
      "实际上": "客户拒绝大多是因为需求不匹配——不是你不够好，而是不适合"
    },
    evidence: "有明确定位的设计师，客户拒绝率降低60%",
    migrationDirection: "从自我怀疑 → 需求匹配 → 精准定位",
    urgency: "medium",
    affectedCapabilities: ["自我怀疑"],
    threatenedTasks: ["遇到拒绝就自我否定"],
    emergingOpportunities: ["客户筛选", "定位明确"]
  },
  {
    id: "design-20",
    domain: "design",
    title: "设计师的价值在于不可复制的部分",
    coreInsight: {
      "你以为": "你的价值在于技术熟练",
      "实际上": "你的价值在于不可复制的部分——你的理解、你的沟通、你的审美"
    },
    evidence: "不可复制的能力，才能支撑高客单价",
    migrationDirection: "从可复制 → 半可复制 → 不可复制",
    urgency: "medium",
    affectedCapabilities: ["可复制的技术"],
    threatenedTasks: ["只做可复制的工作"],
    emergingOpportunities: ["设计方法论", "个人风格"]
  },
  {
    id: "design-21",
    domain: "design",
    title: "不要等准备好了才开始",
    coreInsight: {
      "你以为": "等技术练好才能接单",
      "实际上": "实战才是最好的老师——在实践中学习进步最快"
    },
    evidence: "先行动后完善的设计师，成长速度是先准备再行动的2倍",
    migrationDirection: "从准备 → 行动 → 迭代",
    urgency: "medium",
    affectedCapabilities: ["完美主义准备"],
    threatenedTasks: ["等准备好了才开始"],
    emergingOpportunities: ["快速迭代", "边做边学"]
  },
  {
    id: "design-22",
    domain: "design",
    title: "设计不是一个人的战斗",
    coreInsight: {
      "你以为": "设计是单打独斗",
      "实际上": "设计是团队协作的一部分——需要和产品、运营、开发配合"
    },
    evidence: "有协作能力的设计师，晋升速度更快",
    migrationDirection: "从单打独斗 → 团队协作 → 协作管理",
    urgency: "medium",
    affectedCapabilities: ["纯个人工作"],
    threatenedTasks: ["不擅长团队协作"],
    emergingOpportunities: ["团队协作", "设计管理"]
  },
  {
    id: "design-23",
    domain: "design",
    title: "你的未来在细分领域，不在全面领域",
    coreInsight: {
      "你以为": "什么都会的设计师最吃香",
      "实际上": "什么都会等于什么都不会——客户需要的是懂他们领域的专家"
    },
    evidence: "有细分定位的设计师，客单价是通用设计师的2倍",
    migrationDirection: "从通用 → 细分 → 专家",
    urgency: "medium",
    affectedCapabilities: ["通用设计"],
    threatenedTasks: ["什么都做"],
    emergingOpportunities: ["细分领域深耕", "专业定位"]
  },

  // ========= Finance (20条) =========
  {
    id: "finance-1",
    domain: "finance",
    title: "AI替代的不是财务，而是财务中的记录员角色",
    coreInsight: {
      "你以为": "AI会取代财务人员",
      "实际上": "企业未来不会增加基础财务岗位，但会增加财务分析岗位"
    },
    evidence: "2024年基础财务岗位招聘下降30%，财务分析岗位上升40%",
    migrationDirection: "从基础核算 → 财务分析 → 经营分析",
    urgency: "high",
    affectedCapabilities: ["数据录入", "报表整理", "基础核算"],
    threatenedTasks: ["重复性工资表整理", "月度报表汇总", "手工对账"],
    emergingOpportunities: ["财务分析", "经营分析", "AI财务流程搭建"]
  },
  {
    id: "finance-2",
    domain: "finance",
    title: "证书不是万能的，但没有证书是万万不能的",
    coreInsight: {
      "你以为": "考了CPA就能稳定",
      "实际上": "证书只是入场券——真正让你不可替代的是分析能力"
    },
    evidence: "有CPA但不会用AI工具的财务，竞争力正在下降",
    migrationDirection: "从考证 → 证书+工具 → 证书+工具+分析",
    urgency: "medium",
    affectedCapabilities: ["纯证书依赖"],
    threatenedTasks: ["只考证不学新技能"],
    emergingOpportunities: ["数据分析", "AI财务工具"]
  },
  {
    id: "finance-3",
    domain: "finance",
    title: "财务的价值不在记录，而在洞察",
    coreInsight: {
      "你以为": "财务的价值在于把账做对",
      "实际上": "财务的价值在于从数据中发现问题——告诉老板哪里赚了哪里亏了"
    },
    evidence: "能提供经营分析的财务，年薪是基础财务的2-3倍",
    migrationDirection: "从记录 → 分析 → 洞察",
    urgency: "medium",
    affectedCapabilities: ["纯手工记账"],
    threatenedTasks: ["只做账不分析"],
    emergingOpportunities: ["经营分析", "数据决策支持"]
  },
  {
    id: "finance-4",
    domain: "finance",
    title: "Excel不是万能的，但不会Excel是万万不能的",
    coreInsight: {
      "你以为": "Excel已经过时了",
      "实际上": "Excel永远不会过时——但只会Excel会过时"
    },
    evidence: "会Excel+Python的财务，效率提升5-10倍",
    migrationDirection: "从只会Excel → Excel+工具 → 工具+思维",
    urgency: "medium",
    affectedCapabilities: ["纯Excel依赖"],
    threatenedTasks: ["只会用Excel"],
    emergingOpportunities: ["Excel进阶", "Python分析"]
  },
  {
    id: "finance-5",
    domain: "finance",
    title: "大公司的稳定不是真稳定，能力的稳定才是真稳定",
    coreInsight: {
      "你以为": "大公司铁饭碗",
      "实际上": "没有能力稳定，在哪里都不稳定——能力提升才能应对变化"
    },
    evidence: "2024年多家大公司都裁过员，但有不可替代能力的人都留下来了",
    migrationDirection: "从公司稳定 → 能力稳定 → 选择自由",
    urgency: "medium",
    affectedCapabilities: ["公司依赖"],
    threatenedTasks: ["只依赖公司不提升自己"],
    emergingOpportunities: ["能力提升", "选择权积累"]
  },
  {
    id: "finance-6",
    domain: "finance",
    title: "财务不是后台，而是业务合作伙伴",
    coreInsight: {
      "你以为": "财务是后端支持",
      "实际上": "财务应该是业务的合作伙伴——帮业务做决策，帮公司降本增效"
    },
    evidence: "业务财务岗位，薪资比基础财务高50%",
    migrationDirection: "从后台 → 业务支持 → 业务伙伴",
    urgency: "medium",
    affectedCapabilities: ["纯后台思维"],
    threatenedTasks: ["只懂做账不懂业务"],
    emergingOpportunities: ["业务财务", "BP"]
  },
  {
    id: "finance-7",
    domain: "finance",
    title: "不要等老板问才分析",
    coreInsight: {
      "你以为": "财务的工作是等老板要数据",
      "实际上": "主动提供分析的财务，晋升速度是被动回答的3倍"
    },
    evidence: "主动分析的财务，晋升周期更短",
    migrationDirection: "从被动等待 → 主动输出 → 预判性建议",
    urgency: "medium",
    affectedCapabilities: ["被动工作"],
    threatenedTasks: ["等老板要才做"],
    emergingOpportunities: ["主动分析", "预判能力"]
  },
  {
    id: "finance-8",
    domain: "finance",
    title: "做账只是开始，懂业务才是未来",
    coreInsight: {
      "你以为": "把账做好就是合格的财务",
      "实际上": "懂业务的财务，才是老板需要的——数字背后是业务逻辑"
    },
    evidence: "懂业务的财务，薪资是纯做账财务的2倍",
    migrationDirection: "从做账 → 懂业务 → 懂经营",
    urgency: "medium",
    affectedCapabilities: ["纯做账思维"],
    threatenedTasks: ["只懂做账不懂业务"],
    emergingOpportunities: ["业务理解", "经营分析"]
  },
  {
    id: "finance-9",
    domain: "finance",
    title: "不要害怕新技术，新技术是你的朋友",
    coreInsight: {
      "你以为": "新技术会让我失业",
      "实际上": "新技术会帮你从重复劳动中解放出来——腾出时间做更有价值的事"
    },
    evidence: "会用AI工具的财务，效率提升了2-5倍",
    migrationDirection: "从害怕工具 → 学习工具 → 驾驭工具",
    urgency: "medium",
    affectedCapabilities: ["纯手工操作"],
    threatenedTasks: ["抵触新技术"],
    emergingOpportunities: ["AI工具学习", "财务数字化"]
  },
  {
    id: "finance-10",
    domain: "finance",
    title: "加班不是勤奋，是效率低",
    coreInsight: {
      "你以为": "加班是认真负责",
      "实际上": "加班大多是因为工作方式不对——用工具就能省80%的时间"
    },
    evidence: "效率提升后，财务加班时间平均减少60%",
    migrationDirection: "从靠时间 → 靠效率 → 靠杠杆",
    urgency: "medium",
    affectedCapabilities: ["纯时间投入"],
    threatenedTasks: ["低效加班"],
    emergingOpportunities: ["高效工具", "流程优化"]
  },
  {
    id: "finance-11",
    domain: "finance",
    title: "年轻不是优势，学习能力才是",
    coreInsight: {
      "你以为": "年轻就是资本",
      "实际上": "年轻但不学的人，反而会被淘汰——学习能力才是真资本"
    },
    evidence: "持续学习的财务，职业发展明显更顺利",
    migrationDirection: "从年龄优势 → 学习优势 → 不可替代优势",
    urgency: "medium",
    affectedCapabilities: ["年龄依赖"],
    threatenedTasks: ["年轻就不学新东西"],
    emergingOpportunities: ["持续学习", "新技能探索"]
  },
  {
    id: "finance-12",
    domain: "finance",
    title: "稳定不是躺着不动，而是能应对变化",
    coreInsight: {
      "你以为": "稳定就是待在同一个公司",
      "实际上": "稳定是无论市场怎么变，你都有选择——有能力就能有稳定"
    },
    evidence: "能适应变化的财务，反而更稳定",
    migrationDirection: "从追求稳定 → 追求能力 → 追求选择",
    urgency: "medium",
    affectedCapabilities: ["公司依赖"],
    threatenedTasks: ["只想待在舒适区"],
    emergingOpportunities: ["能力提升", "选择权积累"]
  },
  {
    id: "finance-13",
    domain: "finance",
    title: "不是所有证书都有用，选对方向比盲目考证更重要",
    coreInsight: {
      "你以为": "证越多越好",
      "实际上": "考错证浪费时间——要选符合你职业方向的证"
    },
    evidence: "有明确职业规划的财务，考证效率更高",
    migrationDirection: "从盲目考证 → 规划后考证 → 证以致用",
    urgency: "medium",
    affectedCapabilities: ["盲目考证"],
    threatenedTasks: ["什么证都考"],
    emergingOpportunities: ["职业规划", "针对性考证"]
  },
  {
    id: "finance-14",
    domain: "finance",
    title: "财务数据不是数字，而是业务的表现",
    coreInsight: {
      "你以为": "数据就是数字",
      "实际上": "数字背后是业务——看懂数字就懂了业务"
    },
    evidence: "能从数字中看业务的财务，更受重视",
    migrationDirection: "从看数字 → 懂业务 → 业务伙伴",
    urgency: "medium",
    affectedCapabilities: ["纯数字思维"],
    threatenedTasks: ["只看数字不懂业务"],
    emergingOpportunities: ["业务分析", "经营决策"]
  },
  {
    id: "finance-15",
    domain: "finance",
    title: "不要害怕和业务部门沟通",
    coreInsight: {
      "你以为": "财务就是和数字打交道",
      "实际上": "财务也是和人打交道——和业务沟通才能做好分析"
    },
    evidence: "善于沟通的财务，分析质量更高",
    migrationDirection: "从躲在办公室 → 开始沟通 → 业务伙伴",
    urgency: "medium",
    affectedCapabilities: ["纯数字工作"],
    threatenedTasks: ["不和业务沟通"],
    emergingOpportunities: ["沟通能力", "业务理解"]
  },
  {
    id: "finance-16",
    domain: "finance",
    title: "财务的核心不是合规，而是创造价值",
    coreInsight: {
      "你以为": "财务的核心是不犯错",
      "实际上": "合规是基础，创造价值才是竞争力——帮公司省钱、赚钱"
    },
    evidence: "能创造价值的财务，薪资更高",
    migrationDirection: "从合规 → 降本增效 → 创造价值",
    urgency: "medium",
    affectedCapabilities: ["纯合规思维"],
    threatenedTasks: ["只守规矩不创造价值"],
    emergingOpportunities: ["价值创造", "经营分析"]
  },
  {
    id: "finance-17",
    domain: "finance",
    title: "不要等准备好了才行动，边做边学进步最快",
    coreInsight: {
      "你以为": "等学好了再做新事情",
      "实际上": "实战中学得最快——等准备好了，机会可能已经过去了"
    },
    evidence: "先行动后完善的财务，成长速度更快",
    migrationDirection: "从准备 → 行动 → 迭代",
    urgency: "medium",
    affectedCapabilities: ["完美主义准备"],
    threatenedTasks: ["等准备好了才开始"],
    emergingOpportunities: ["快速迭代", "边做边学"]
  },
  {
    id: "finance-18",
    domain: "finance",
    title: "财务不是一个人的工作，而是需要协作",
    coreInsight: {
      "你以为": "财务就是自己做账",
      "实际上": "财务需要和业务、技术、法务配合——协作能力越来越重要"
    },
    evidence: "有协作能力的财务，晋升更快",
    migrationDirection: "从单打独斗 → 团队协作 → 协作管理",
    urgency: "medium",
    affectedCapabilities: ["纯个人工作"],
    threatenedTasks: ["不擅长团队协作"],
    emergingOpportunities: ["团队协作", "沟通能力"]
  },
  {
    id: "finance-19",
    domain: "finance",
    title: "不要害怕犯错，犯错是最好的学习",
    coreInsight: {
      "你以为": "财务不能犯错",
      "实际上": "不犯大错就好——小错误是成长的必经之路"
    },
    evidence: "愿意从错误中学习的财务，成长更快",
    migrationDirection: "从害怕犯错 → 接受犯错 → 从错误中学习",
    urgency: "medium",
    affectedCapabilities: ["完美主义"],
    threatenedTasks: ["害怕犯错不敢尝试"],
    emergingOpportunities: ["快速试错", "迭代优化"]
  },
  {
    id: "finance-20",
    domain: "finance",
    title: "你的未来在细分领域，不在全面领域",
    coreInsight: {
      "你以为": "什么都会的财务最吃香",
      "实际上": "什么都会等于什么都不会——客户需要的是懂他们领域的专家"
    },
    evidence: "有细分定位的财务，薪资更高",
    migrationDirection: "从通用 → 细分 → 专家",
    urgency: "medium",
    affectedCapabilities: ["通用财务"],
    threatenedTasks: ["什么都做"],
    emergingOpportunities: ["细分领域深耕", "专业定位"]
  },

  // ========= Architecture (18条) =========
  {
    id: "architecture-1",
    domain: "architecture",
    title: "证书决定入场资格，但不会决定未来收入",
    coreInsight: {
      "你以为": "考了证就能稳定赚钱",
      "实际上": "证书只能帮你入场——真正决定收入的是你的能力，不是证书"
    },
    evidence: "有证书但不会用工具的建筑师，竞争力正在下降",
    migrationDirection: "从证书 → 证书+工具 → 证书+工具+能力",
    urgency: "medium",
    affectedCapabilities: ["纯证书依赖"],
    threatenedTasks: ["只考证不学新技能"],
    emergingOpportunities: ["BIM技术", "AI方案表达"]
  },
  {
    id: "architecture-2",
    domain: "architecture",
    title: "BIM不是趋势，而是现在",
    coreInsight: {
      "你以为": "BIM是未来的趋势",
      "实际上": "BIM已经是现在——很多项目要求会BIM，不会BIM连机会都没有"
    },
    evidence: "要求BIM能力的岗位2024年增长了60%",
    migrationDirection: "从CAD → BIM → 数字化建造",
    urgency: "medium",
    affectedCapabilities: ["纯CAD依赖"],
    threatenedTasks: ["不会用BIM"],
    emergingOpportunities: ["BIM技术", "数字化建造"]
  },
  {
    id: "architecture-3",
    domain: "architecture",
    title: "AI不会让建筑师失业，但会让不会用AI的建筑师失业",
    coreInsight: {
      "你以为": "AI会取代建筑师",
      "实际上": "AI会帮建筑师提升效率——从重复劳动中解放出来，专注在设计"
    },
    evidence: "使用AI工具的建筑师，效率提升了3-5倍",
    migrationDirection: "从对抗AI → 学习AI → 驾驭AI",
    urgency: "medium",
    affectedCapabilities: ["纯人工基础绘图"],
    threatenedTasks: ["抵制使用工具"],
    emergingOpportunities: ["AI工具使用", "AI辅助设计"]
  },
  {
    id: "architecture-4",
    domain: "architecture",
    title: "纯画图的时代过去了，设计沟通才是未来",
    coreInsight: {
      "你以为": "建筑师的核心是画图",
      "实际上": "建筑师的核心是沟通——把想法传达给客户、施工方、团队"
    },
    evidence: "善于沟通的建筑师，项目成功率更高",
    migrationDirection: "从画图 → 设计表达 → 设计管理",
    urgency: "medium",
    affectedCapabilities: ["纯画图能力"],
    threatenedTasks: ["只画图不沟通"],
    emergingOpportunities: ["设计沟通", "项目管理"]
  },
  {
    id: "architecture-5",
    domain: "architecture",
    title: "大公司的稳定不是真稳定，能力的稳定才是",
    coreInsight: {
      "你以为": "大设计院铁饭碗",
      "实际上": "没有能力稳定，在哪里都不稳定——能力提升才能应对变化"
    },
    evidence: "2024年多家大设计院都有调整，但有不可替代能力的人都留下来了",
    migrationDirection: "从公司稳定 → 能力稳定 → 选择自由",
    urgency: "medium",
    affectedCapabilities: ["公司依赖"],
    threatenedTasks: ["只依赖公司不提升自己"],
    emergingOpportunities: ["能力提升", "选择权积累"]
  },
  {
    id: "architecture-6",
    domain: "architecture",
    title: "不要等准备好了才开始，实战中学得最快",
    coreInsight: {
      "你以为": "等技术练好才能接单",
      "实际上": "实战才是最好的老师——在实践中学习进步最快"
    },
    evidence: "先行动后完善的建筑师，成长速度更快",
    migrationDirection: "从准备 → 行动 → 迭代",
    urgency: "medium",
    affectedCapabilities: ["完美主义准备"],
    threatenedTasks: ["等准备好了才开始"],
    emergingOpportunities: ["快速迭代", "边做边学"]
  },
  {
    id: "architecture-7",
    domain: "architecture",
    title: "建筑不是一个人的战斗",
    coreInsight: {
      "你以为": "建筑是设计师的个人作品",
      "实际上": "建筑是团队协作的结果——需要和结构、水电、施工配合"
    },
    evidence: "有协作能力的建筑师，项目成功率更高",
    migrationDirection: "从单打独斗 → 团队协作 → 设计管理",
    urgency: "medium",
    affectedCapabilities: ["纯个人工作"],
    threatenedTasks: ["不擅长团队协作"],
    emergingOpportunities: ["团队协作", "项目管理"]
  },
  {
    id: "architecture-8",
    domain: "architecture",
    title: "年轻建筑师的优势不是年轻，而是敢尝试",
    coreInsight: {
      "你以为": "年轻建筑师因为经验少而处于劣势",
      "实际上": "年轻建筑师的优势是敢尝试新工具、新模式——经验反而是束缚"
    },
    evidence: "使用AI工具的建筑师中，30岁以下占比70%",
    migrationDirection: "从经验依赖 → 学习敏捷 → 创新驱动",
    urgency: "medium",
    affectedCapabilities: ["经验依赖"],
    threatenedTasks: ["不敢尝试新事物"],
    emergingOpportunities: ["新工具探索", "新模式尝试"]
  },
  {
    id: "architecture-9",
    domain: "architecture",
    title: "证书不是目标，而是工具",
    coreInsight: {
      "你以为": "考了证就万事大吉",
      "实际上": "证书只是帮你获得更多机会——真正的价值是证书背后的能力"
    },
    evidence: "有证书但没有能力的人，长期发展受限",
    migrationDirection: "从为考证而考证 → 以考促学 → 能力提升",
    urgency: "medium",
    affectedCapabilities: ["纯证书思维"],
    threatenedTasks: ["为考证而考证"],
    emergingOpportunities: ["以考促学", "能力提升"]
  },
  {
    id: "architecture-10",
    domain: "architecture",
    title: "稳定不是待在舒适区，而是能应对变化",
    coreInsight: {
      "你以为": "稳定就是不换工作",
      "实际上": "稳定是无论市场怎么变，你都有选择——有能力就能有稳定"
    },
    evidence: "能适应变化的建筑师，反而更稳定",
    migrationDirection: "从追求稳定 → 追求能力 → 追求选择",
    urgency: "medium",
    affectedCapabilities: ["公司依赖"],
    threatenedTasks: ["只想待在舒适区"],
    emergingOpportunities: ["能力提升", "选择权积累"]
  },
  {
    id: "architecture-11",
    domain: "architecture",
    title: "效果图只是手段，不是目的",
    coreInsight: {
      "你以为": "效果图做得好就能赢项目",
      "实际上": "效果图只是表达手段——客户要的是解决问题的方案"
    },
    evidence: "有完整方案的项目，中标率更高",
    migrationDirection: "从画图表现 → 方案设计 → 问题解决",
    urgency: "medium",
    affectedCapabilities: ["纯画图思维"],
    threatenedTasks: ["只画效果图不思考方案"],
    emergingOpportunities: ["方案设计", "问题解决"]
  },
  {
    id: "architecture-12",
    domain: "architecture",
    title: "加班不是努力的证明，而是效率低的证明",
    coreInsight: {
      "你以为": "加班能让你成长更快",
      "实际上": "加班大多是因为工作方式不对——用工具就能省50%的时间"
    },
    evidence: "使用BIM和AI工具的建筑师，加班时间明显减少",
    migrationDirection: "从靠时间 → 靠效率 → 靠杠杆",
    urgency: "medium",
    affectedCapabilities: ["纯时间投入"],
    threatenedTasks: ["低效加班"],
    emergingOpportunities: ["高效工具", "流程优化"]
  },
  {
    id: "architecture-13",
    domain: "architecture",
    title: "不要害怕新工具，新工具是你的朋友",
    coreInsight: {
      "你以为": "新工具太复杂学不会",
      "实际上": "新工具是来帮你的——学会工具，效率提升几倍"
    },
    evidence: "会用新工具的建筑师，效率提升明显",
    migrationDirection: "从害怕工具 → 学习工具 → 驾驭工具",
    urgency: "medium",
    affectedCapabilities: ["纯传统工具依赖"],
    threatenedTasks: ["抵触新工具"],
    emergingOpportunities: ["新工具学习", "数字化转型"]
  },
  {
    id: "architecture-14",
    domain: "architecture",
    title: "建筑的价值不在造型，而在解决问题",
    coreInsight: {
      "你以为": "建筑的价值在于好看",
      "实际上": "建筑的价值在于解决问题——如何用空间解决客户的需求"
    },
    evidence: "能解决问题的项目，客户满意度更高",
    migrationDirection: "从造型设计 → 问题解决 → 价值创造",
    urgency: "medium",
    affectedCapabilities: ["纯造型设计"],
    threatenedTasks: ["只追求造型不解决问题"],
    emergingOpportunities: ["问题解决", "价值创造"]
  },
  {
    id: "architecture-15",
    domain: "architecture",
    title: "不要只低头画图，要抬头看行业",
    coreInsight: {
      "你以为": "画好图就够了",
      "实际上": "行业在变化——不看趋势，可能被淘汰"
    },
    evidence: "关注趋势的建筑师，能抓住更多机会",
    migrationDirection: "从只看画图 → 看行业 → 引导趋势",
    urgency: "medium",
    affectedCapabilities: ["纯技术视角"],
    threatenedTasks: ["只画图不看趋势"],
    emergingOpportunities: ["趋势观察", "行业洞察"]
  },
  {
    id: "architecture-16",
    domain: "architecture",
    title: "建筑师的未来在细分领域，不在全面领域",
    coreInsight: {
      "你以为": "什么都会的建筑师最吃香",
      "实际上": "什么都会等于什么都不会——客户需要的是懂他们领域的专家"
    },
    evidence: "有细分定位的建筑师，客单价是通用建筑师的2倍",
    migrationDirection: "从通用 → 细分 → 专家",
    urgency: "medium",
    affectedCapabilities: ["通用建筑"],
    threatenedTasks: ["什么都做"],
    emergingOpportunities: ["细分领域深耕", "专业定位"]
  },
  {
    id: "architecture-17",
    domain: "architecture",
    title: "本地服务需求正在上升，不是只有大项目才赚钱",
    coreInsight: {
      "你以为": "只有大项目才赚钱",
      "实际上": "本地小项目需求正在上升——小而美可能更稳定"
    },
    evidence: "本地装修咨询、小型方案表达的需求2024年增长了40%",
    migrationDirection: "从大项目 → 小而美 → 本地服务",
    urgency: "medium",
    affectedCapabilities: ["大项目依赖"],
    threatenedTasks: ["看不起小项目"],
    emergingOpportunities: ["本地服务", "小而美项目"]
  },
  {
    id: "architecture-18",
    domain: "architecture",
    title: "不要害怕犯错，小错误是成长的必经之路",
    coreInsight: {
      "你以为": "建筑师不能犯错",
      "实际上": "不犯大错就好——小错误是成长的必经之路"
    },
    evidence: "愿意从错误中学习的建筑师，成长更快",
    migrationDirection: "从害怕犯错 → 接受犯错 → 从错误中学习",
    urgency: "medium",
    affectedCapabilities: ["完美主义"],
    threatenedTasks: ["害怕犯错不敢尝试"],
    emergingOpportunities: ["快速试错", "迭代优化"]
  },

  // ========= Study Abroad (18条) =========
  {
    id: "study-1",
    domain: "study_abroad",
    title: "背单词不是目的，会用才是",
    coreInsight: {
      "你以为": "单词背得越多越好",
      "实际上": "背了不会用等于没背——会用1000个单词比死记5000个有用"
    },
    evidence: "实用场景练习的学生，进步是死记硬背的2倍",
    migrationDirection: "从死记硬背 → 场景练习 → 实际使用",
    urgency: "medium",
    affectedCapabilities: ["纯人工信息整理", "纯人工背单词"],
    threatenedTasks: ["纯人工低效学习"],
    emergingOpportunities: ["AI辅助学习", "场景练习"]
  },
  {
    id: "study-2",
    domain: "study_abroad",
    title: "拖延的不是你，而是你的学习方式",
    coreInsight: {
      "你以为": "我就是拖延症",
      "实际上": "拖延是因为你的学习方式不对——没有及时反馈，看不到进步"
    },
    evidence: "有及时反馈的学习，完成率提升80%",
    migrationDirection: "从拖延 → 及时反馈 → 持续行动",
    urgency: "medium",
    affectedCapabilities: ["纯人工低效学习"],
    threatenedTasks: ["低效拖延"],
    emergingOpportunities: ["AI辅助学习", "即时反馈"]
  },
  {
    id: "study-3",
    domain: "study_abroad",
    title: "你缺的不是练习量，而是有效的反馈",
    coreInsight: {
      "你以为": "只要多刷题就能考过",
      "实际上": "低效重复100小时，不如高效反馈10小时——反馈才是进步的关键"
    },
    evidence: "有即时反馈的学习，效率提升3-5倍",
    migrationDirection: "从刷题 → 有反馈的练习 → 高效学习",
    urgency: "medium",
    affectedCapabilities: ["纯人工低效学习"],
    threatenedTasks: ["纯刷题"],
    emergingOpportunities: ["AI辅助学习", "即时反馈"]
  },
  {
    id: "study-4",
    domain: "study_abroad",
    title: "留学不是目的，成长才是",
    coreInsight: {
      "你以为": "只要能出去就行",
      "实际上": "出去只是第一步——真正的价值是留学期间的成长"
    },
    evidence: "有明确目标的学生，留学收获更大",
    migrationDirection: "从为留学而留学 → 为成长而留学 → 为未来而准备",
    urgency: "low",
    affectedCapabilities: ["纯留学目标"],
    threatenedTasks: ["为留学而留学"],
    emergingOpportunities: ["目标明确", "持续成长"]
  },
  {
    id: "study-5",
    domain: "study_abroad",
    title: "不是只有申请Top学校才算成功",
    coreInsight: {
      "你以为": "只有申请到Top学校才算成功",
      "实际上": "适合你的学校才是最好的——你能真正学到东西"
    },
    evidence: "选适合自己学校的学生，发展更顺利",
    migrationDirection: "从追求排名 → 追求适合 → 追求成长",
    urgency: "medium",
    affectedCapabilities: ["排名依赖"],
    threatenedTasks: ["只追求排名"],
    emergingOpportunities: ["自我了解", "适合选择"]
  },
  {
    id: "study-6",
    domain: "study_abroad",
    title: "语言考试的核心不是语言，而是思维",
    coreInsight: {
      "你以为": "只要语言好就能考好",
      "实际上": "语言考试考的是思维——如何用英语表达你的想法"
    },
    evidence: "思维清晰但语言一般的学生，反而能考高分",
    migrationDirection: "从语言学习 → 思维训练 → 表达能力",
    urgency: "medium",
    affectedCapabilities: ["纯语言学习"],
    threatenedTasks: ["只背单词不练思维"],
    emergingOpportunities: ["思维训练", "表达能力"]
  },
  {
    id: "study-7",
    domain: "study_abroad",
    title: "不要等语言准备好了才申请，边申请边进步最快",
    coreInsight: {
      "你以为": "等语言过了再申请",
      "实际上": "申请压力能让你进步更快——在实战中成长"
    },
    evidence: "边申请边准备的学生，效率更高",
    migrationDirection: "从准备 → 行动 → 迭代",
    urgency: "medium",
    affectedCapabilities: ["完美主义准备"],
    threatenedTasks: ["等准备好了才开始"],
    emergingOpportunities: ["快速迭代", "边做边学"]
  },
  {
    id: "study-8",
    domain: "study_abroad",
    title: "文书不是编故事，而是讲你的真实故事",
    coreInsight: {
      "你以为": "文书就是编得漂亮",
      "实际上": "真诚的故事最有感染力——招生官能看出来"
    },
    evidence: "真诚的文书，录取率更高",
    migrationDirection: "从编故事 → 挖掘真实 → 真诚表达",
    urgency: "medium",
    affectedCapabilities: ["编故事思维"],
    threatenedTasks: ["文书造假"],
    emergingOpportunities: ["真实挖掘", "真诚表达"]
  },
  {
    id: "study-9",
    domain: "study_abroad",
    title: "留学不是逃避，而是主动选择",
    coreInsight: {
      "你以为": "国内不行就去国外",
      "实际上": "逃避解决不了问题——留学应该是主动选择，不是被动逃避"
    },
    evidence: "主动选择的学生，留学收获更大",
    migrationDirection: "从逃避 → 主动选择 → 积极面对",
    urgency: "medium",
    affectedCapabilities: ["逃避心态"],
    threatenedTasks: ["把留学当逃避"],
    emergingOpportunities: ["主动选择", "积极面对"]
  },
  {
    id: "study-10",
    domain: "study_abroad",
    title: "不要一个人备考，有同伴进步更快",
    coreInsight: {
      "你以为": "备考就是一个人埋头苦干",
      "实际上": "有同伴能让你坚持更久，还能互相学习"
    },
    evidence: "有学习伙伴的学生，完成率提升60%",
    migrationDirection: "从单打独斗 → 学习同伴 → 学习社区",
    urgency: "medium",
    affectedCapabilities: ["纯个人学习"],
    threatenedTasks: ["一个人备考"],
    emergingOpportunities: ["学习社群", "同伴学习"]
  },
  {
    id: "study-11",
    domain: "study_abroad",
    title: "你不是没天赋，而是没找到好方法",
    coreInsight: {
      "你以为": "我就是语言不行",
      "实际上": "90%的人都能学好语言——只是需要找到适合你的方法"
    },
    evidence: "找到适合方法的学生，进步速度提升2倍",
    migrationDirection: "从自我否定 → 方法探索 → 高效方法",
    urgency: "medium",
    affectedCapabilities: ["自我否定"],
    threatenedTasks: ["觉得自己不行"],
    emergingOpportunities: ["方法探索", "高效学习"]
  },
  {
    id: "study-12",
    domain: "study_abroad",
    title: "语言不是障碍，行动才是",
    coreInsight: {
      "你以为": "等语言好了再交流",
      "实际上": "越不敢交流越不行——大胆开口进步最快"
    },
    evidence: "大胆开口的学生，语言进步更快",
    migrationDirection: "从害怕交流 → 大胆开口 → 流利表达",
    urgency: "medium",
    affectedCapabilities: ["害怕开口"],
    threatenedTasks: ["不敢开口说"],
    emergingOpportunities: ["大胆交流", "勇敢开口"]
  },
  {
    id: "study-13",
    domain: "study_abroad",
    title: "不是只有英语国家才算留学",
    coreInsight: {
      "你以为": "留学就是去美国、英国",
      "实际上": "适合你的国家才是最好的——性价比也重要"
    },
    evidence: "考虑非英语国家的学生，选择更多",
    migrationDirection: "从英语国家 → 多国对比 → 适合选择",
    urgency: "medium",
    affectedCapabilities: ["英语国家局限"],
    threatenedTasks: ["只考虑英语国家"],
    emergingOpportunities: ["多国探索", "性价比考虑"]
  },
  {
    id: "study-14",
    domain: "study_abroad",
    title: "不要害怕失败，申请失败也是成长",
    coreInsight: {
      "你以为": "申请失败就是彻底失败",
      "实际上": "失败也是成长的一部分——失败能让你更了解自己"
    },
    evidence: "经历过失败的学生，更成熟",
    migrationDirection: "从害怕失败 → 接受失败 → 从失败中学习",
    urgency: "medium",
    affectedCapabilities: ["害怕失败"],
    threatenedTasks: ["害怕失败不敢申请"],
    emergingOpportunities: ["快速试错", "迭代优化"]
  },
  {
    id: "study-15",
    domain: "study_abroad",
    title: "GPA不是一切，但也很重要",
    coreInsight: {
      "你以为": "GPA高就一定能申请到好学校",
      "实际上": "GPA只是门槛——真正决定录取的是你的综合素质"
    },
    evidence: "GPA一般但综合素质强的学生，也能申请到好学校",
    migrationDirection: "从GPA优先 → 综合发展 → 突出特色",
    urgency: "medium",
    affectedCapabilities: ["纯GPA依赖"],
    threatenedTasks: ["只看GPA不发展其他"],
    emergingOpportunities: ["综合发展", "特色打造"]
  },
  {
    id: "study-16",
    domain: "study_abroad",
    title: "不要把所有希望寄托在中介身上",
    coreInsight: {
      "你以为": "中介能搞定一切",
      "实际上": "你的人生只能你负责——中介只是辅助"
    },
    evidence: "自己参与申请的学生，录取结果更好",
    migrationDirection: "从依赖中介 → 自己主导 → 主动选择",
    urgency: "medium",
    affectedCapabilities: ["中介依赖"],
    threatenedTasks: ["把一切都交给中介"],
    emergingOpportunities: ["自己主导", "主动选择"]
  },
  {
    id: "study-17",
    domain: "study_abroad",
    title: "留学不是终点，而是起点",
    coreInsight: {
      "你以为": "申请到就万事大吉",
      "实际上": "拿到offer只是开始——真正的挑战在留学期间"
    },
    evidence: "为留学期间做准备的学生，更适应",
    migrationDirection: "从终点思维 → 起点思维 → 持续成长",
    urgency: "medium",
    affectedCapabilities: ["终点思维"],
    threatenedTasks: ["以为拿到offer就结束了"],
    emergingOpportunities: ["持续成长", "长期准备"]
  },
  {
    id: "study-18",
    domain: "study_abroad",
    title: "你的未来不止留学一条路",
    coreInsight: {
      "你以为": "只有留学才能成功",
      "实际上": "成功的路很多——适合你的才是最好的"
    },
    evidence: "不留学但很成功的人很多",
    migrationDirection: "从只有留学 → 多选项 → 适合选择",
    urgency: "medium",
    affectedCapabilities: ["留学执念"],
    threatenedTasks: ["认为只有留学才行"],
    emergingOpportunities: ["多选项", "自我了解"]
  },

  // ========= Creator (20条) =========
  {
    id: "creator-1",
    domain: "creator",
    title: "你不是没天赋，而是没坚持",
    coreInsight: {
      "你以为": "做内容需要天赋",
      "实际上": "90%的人都倒在坚持上——先做100期再说天赋"
    },
    evidence: "坚持100期以上的创作者，成功率提升5倍",
    migrationDirection: "从找天赋 → 开始行动 → 坚持积累",
    urgency: "medium",
    affectedCapabilities: ["天赋等待"],
    threatenedTasks: ["觉得没天赋就不开始"],
    emergingOpportunities: ["快速开始", "持续积累"]
  },
  {
    id: "creator-2",
    domain: "creator",
    title: "粉丝数不是目标，信任才是",
    coreInsight: {
      "你以为": "粉丝越多越成功",
      "实际上": "1000个信任你的粉丝，比10万不信任的粉丝更值钱"
    },
    evidence: "1000个铁杆粉丝就能支撑一个创作者",
    migrationDirection: "从追求数量 → 追求质量 → 追求信任",
    urgency: "medium",
    affectedCapabilities: ["粉丝数量依赖"],
    threatenedTasks: ["只为涨粉做内容"],
    emergingOpportunities: ["粉丝信任", "铁杆粉丝"]
  },
  {
    id: "creator-3",
    domain: "creator",
    title: "不是没人看，是你没坚持",
    coreInsight: {
      "你以为": "我做的内容没人看",
      "实际上": "前10期没人看是正常的——持续更新才有机会"
    },
    evidence: "成功的创作者，前10期数据都很差",
    migrationDirection: "从期待爆火 → 持续更新 → 迭代优化",
    urgency: "medium",
    affectedCapabilities: ["爆火期待"],
    threatenedTasks: ["做几期没人看就放弃"],
    emergingOpportunities: ["持续更新", "迭代优化"]
  },
  {
    id: "creator-4",
    domain: "creator",
    title: "内容的核心不是技巧，而是真诚",
    coreInsight: {
      "你以为": "需要学会所有技巧才能做内容",
      "实际上": "真诚最能打动人——技巧只是辅助"
    },
    evidence: "真诚的内容，传播率更高",
    migrationDirection: "从学技巧 → 练真诚 → 真诚+技巧",
    urgency: "medium",
    affectedCapabilities: ["技巧依赖"],
    threatenedTasks: ["只会技巧不会真诚"],
    emergingOpportunities: ["真诚表达", "真实内容"]
  },
  {
    id: "creator-5",
    domain: "creator",
    title: "完美主义是最大的敌人",
    coreInsight: {
      "你以为": "等准备好了再发布",
      "实际上": "完美主义会让你永远不开始——先完成再完美"
    },
    evidence: "先发布再优化的创作者，成长速度更快",
    migrationDirection: "从完美主义 → 先完成再完美 → 快速迭代",
    urgency: "medium",
    affectedCapabilities: ["完美主义"],
    threatenedTasks: ["等准备好了再开始"],
    emergingOpportunities: ["快速迭代", "边做边学"]
  },
  {
    id: "creator-6",
    domain: "creator",
    title: "不要害怕模仿，模仿是最好的学习",
    coreInsight: {
      "你以为": "模仿就是抄袭",
      "实际上": "所有创作者都是从模仿开始的——先模仿再创新"
    },
    evidence: "成功的创作者，都是从模仿起步的",
    migrationDirection: "从原创焦虑 → 模仿学习 → 创新突破",
    urgency: "medium",
    affectedCapabilities: ["原创焦虑"],
    threatenedTasks: ["不敢模仿怕被骂"],
    emergingOpportunities: ["模仿学习", "创新突破"]
  },
  {
    id: "creator-7",
    domain: "creator",
    title: "不是内容没人看，而是你没找到受众",
    coreInsight: {
      "你以为": "我做的内容不好",
      "实际上": "内容好不好要看谁看——找到对的人，内容才有价值"
    },
    evidence: "找到精准受众的创作者，数据明显提升",
    migrationDirection: "从做内容 → 找受众 → 为受众服务",
    urgency: "medium",
    affectedCapabilities: ["纯内容思维"],
    threatenedTasks: ["只做内容不想受众"],
    emergingOpportunities: ["受众研究", "精准定位"]
  },
  {
    id: "creator-8",
    domain: "creator",
    title: "变现不是目的，价值才是",
    coreInsight: {
      "你以为": "做内容就是为了赚钱",
      "实际上": "赚钱是结果，不是目的——先创造价值，钱自然会来"
    },
    evidence: "专注创造价值的创作者，长期收益更高",
    migrationDirection: "从为赚钱 → 为价值 → 价值+收益",
    urgency: "medium",
    affectedCapabilities: ["纯变现思维"],
    threatenedTasks: ["只为赚钱做内容"],
    emergingOpportunities: ["价值创造", "长期收益"]
  },
  {
    id: "creator-9",
    domain: "creator",
    title: "不是只有完美的人才能做内容",
    coreInsight: {
      "你以为": "只有厉害的人才能做内容",
      "实际上": "普通人的真实经历，反而更能打动人"
    },
    evidence: "真实的普通人内容，更有共鸣",
    migrationDirection: "从完美人设 → 真实人设 → 真诚分享",
    urgency: "medium",
    affectedCapabilities: ["完美人设"],
    threatenedTasks: ["觉得自己不够好不敢开始"],
    emergingOpportunities: ["真实人设", "真诚分享"]
  },
  {
    id: "creator-10",
    domain: "creator",
    title: "不要害怕和别人一样，找到你的不一样",
    coreInsight: {
      "你以为": "这个赛道太拥挤了",
      "实际上": "每个赛道都拥挤，但你的经历是独一无二的"
    },
    evidence: "有个人特色的创作者，脱颖而出的机会更大",
    migrationDirection: "从害怕竞争 → 寻找特色 → 差异化定位",
    urgency: "medium",
    affectedCapabilities: ["竞争恐惧"],
    threatenedTasks: ["觉得赛道拥挤不敢开始"],
    emergingOpportunities: ["差异化定位", "个人特色"]
  },
  {
    id: "creator-11",
    domain: "creator",
    title: "日更不是必需，持续才是",
    coreInsight: {
      "你以为": "必须日更才能成功",
      "实际上": "日更但质量差，不如不更——持续且质量稳定最重要"
    },
    evidence: "质量稳定的创作者，发展更顺利",
    migrationDirection: "从追求频率 → 追求质量 → 持续稳定",
    urgency: "medium",
    affectedCapabilities: ["频率焦虑"],
    threatenedTasks: ["为日更牺牲质量"],
    emergingOpportunities: ["质量稳定", "持续输出"]
  },
  {
    id: "creator-12",
    domain: "creator",
    title: "数据不是一切，但数据会说话",
    coreInsight: {
      "你以为": "数据好就是成功",
      "实际上": "数据是反馈——告诉你哪里好，哪里需要改进"
    },
    evidence: "会看数据的创作者，迭代速度更快",
    migrationDirection: "从数据焦虑 → 数据反馈 → 迭代优化",
    urgency: "medium",
    affectedCapabilities: ["数据焦虑"],
    threatenedTasks: ["只看数据不思考"],
    emergingOpportunities: ["数据分析", "迭代优化"]
  },
  {
    id: "creator-13",
    domain: "creator",
    title: "不要一个人做内容，有社区进步更快",
    coreInsight: {
      "你以为": "创作就是一个人",
      "实际上": "有同好社区，能互相鼓励，互相学习"
    },
    evidence: "有创作伙伴的人，坚持更久",
    migrationDirection: "从单打独斗 → 学习同伴 → 创作社区",
    urgency: "medium",
    affectedCapabilities: ["纯个人工作"],
    threatenedTasks: ["一个人闷头做"],
    emergingOpportunities: ["创作社群", "同伴学习"]
  },
  {
    id: "creator-14",
    domain: "creator",
    title: "不是只有一种成功方式，找到适合你的",
    coreInsight: {
      "你以为": "别人那样做才是成功",
      "实际上": "适合你的方式才是最好的——不要勉强自己"
    },
    evidence: "找到适合自己方式的创作者，更能坚持",
    migrationDirection: "从模仿别人 → 探索自己 → 找到适合",
    urgency: "medium",
    affectedCapabilities: ["模仿焦虑"],
    threatenedTasks: ["只会模仿别人"],
    emergingOpportunities: ["自我探索", "适合方式"]
  },
  {
    id: "creator-15",
    domain: "creator",
    title: "做内容不是打工，要有长期思维",
    coreInsight: {
      "你以为": "做几期就要有结果",
      "实际上": "内容是长期积累——3个月能入门，1年能有小成"
    },
    evidence: "有长期思维的创作者，更能坚持",
    migrationDirection: "从短期期待 → 中期积累 → 长期价值",
    urgency: "medium",
    affectedCapabilities: ["短期期待"],
    threatenedTasks: ["做几期没结果就放弃"],
    emergingOpportunities: ["长期思维", "持续积累"]
  },
  {
    id: "creator-16",
    domain: "creator",
    title: "不要害怕犯错，每一个坑都是成长",
    coreInsight: {
      "你以为": "做内容不能出错",
      "实际上": "错误是成长的肥料——从错误中学习更快"
    },
    evidence: "经历过失败的创作者，更成熟",
    migrationDirection: "从害怕犯错 → 接受犯错 → 从错误中学习",
    urgency: "medium",
    affectedCapabilities: ["完美主义"],
    threatenedTasks: ["害怕犯错不敢尝试"],
    emergingOpportunities: ["快速试错", "迭代优化"]
  },
  {
    id: "creator-17",
    domain: "creator",
    title: "你的经历就是最好的内容",
    coreInsight: {
      "你以为": "我没什么可说的",
      "实际上": "你的经历就是独一无二的——真诚分享就会有人共鸣"
    },
    evidence: "真实的个人经历，传播率更高",
    migrationDirection: "从无话可说 → 挖掘经历 → 真诚分享",
    urgency: "medium",
    affectedCapabilities: ["内容焦虑"],
    threatenedTasks: ["觉得自己没东西可说"],
    emergingOpportunities: ["挖掘经历", "真诚分享"]
  },
  {
    id: "creator-18",
    domain: "creator",
    title: "不要和别人比，和昨天的自己比",
    coreInsight: {
      "你以为": "别人都做得比我好",
      "实际上": "每个人的起点不一样——和昨天的自己比，才是真实的进步"
    },
    evidence: "专注自我进步的创作者，心态更稳定",
    migrationDirection: "从比较焦虑 → 自我对比 → 持续进步",
    urgency: "low",
    affectedCapabilities: ["比较焦虑"],
    threatenedTasks: ["和别人比"],
    emergingOpportunities: ["自我对比", "心态稳定"]
  },
  {
    id: "creator-19",
    domain: "creator",
    title: "不要追求完美，先完成再完美",
    coreInsight: {
      "你以为": "内容必须完美才能发布",
      "实际上": "先完成再完美——不完美的内容也能有价值"
    },
    evidence: "先发布再优化的创作者，成长速度更快",
    migrationDirection: "从完美主义 → 先完成再完美 → 快速迭代",
    urgency: "medium",
    affectedCapabilities: ["完美主义"],
    threatenedTasks: ["等准备好了再开始"],
    emergingOpportunities: ["快速迭代", "边做边学"]
  },
  {
    id: "creator-20",
    domain: "creator",
    title: "变现不是目的，价值才是",
    coreInsight: {
      "你以为": "做内容就是为了赚钱",
      "实际上": "赚钱是结果，不是目的——先创造价值，钱自然会来"
    },
    evidence: "专注创造价值的创作者，长期收益更高",
    migrationDirection: "从为赚钱 → 为价值 → 价值+收益",
    urgency: "medium",
    affectedCapabilities: ["纯变现思维"],
    threatenedTasks: ["只为赚钱做内容"],
    emergingOpportunities: ["价值创造", "长期收益"]
  },

  // ========= AI Product (19条) =========
  {
    id: "ai_product-1",
    domain: "ai_product",
    title: "AI产品不是技术竞赛，而是用户价值验证",
    coreInsight: {
      "你以为": "技术越厉害，产品越成功",
      "实际上": "用户愿意付费才是成功——技术只是手段"
    },
    evidence: "很多技术完美的产品，用户不愿意付费",
    migrationDirection: "从技术追求 → 用户验证 → 价值交付",
    urgency: "high",
    affectedCapabilities: ["纯技术思维"],
    threatenedTasks: ["只追求技术完美"],
    emergingOpportunities: ["用户验证", "价值交付"]
  },
  {
    id: "ai_product-2",
    domain: "ai_product",
    title: "MVP不是丑，而是最小可行验证",
    coreInsight: {
      "你以为": "MVP太丑没人用",
      "实际上": "MVP的目的是验证需求——丑但能用，比好看但没人用更重要"
    },
    evidence: "成功的产品，第一版都很丑",
    migrationDirection: "从追求完美 → 最小验证 → 快速迭代",
    urgency: "high",
    affectedCapabilities: ["完美主义"],
    threatenedTasks: ["等完美再发布"],
    emergingOpportunities: ["快速验证", "迭代优化"]
  },
  {
    id: "ai_product-3",
    domain: "ai_product",
    title: "用户不会告诉你需求，只会告诉你问题",
    coreInsight: {
      "你以为": "问用户需要什么",
      "实际上": "用户不知道自己需要什么——但会告诉你遇到什么问题"
    },
    evidence: "用户访谈中，用户说不出需求，但能说出痛点",
    migrationDirection: "从问需求 → 问问题 → 从问题推导需求",
    urgency: "medium",
    affectedCapabilities: ["需求调研"],
    threatenedTasks: ["直接问用户需要什么"],
    emergingOpportunities: ["问题挖掘", "需求推导"]
  },
  {
    id: "ai_product-4",
    domain: "ai_product",
    title: "付费用户比免费用户更有价值",
    coreInsight: {
      "你以为": "先积累免费用户",
      "实际上": "付费用户才是真用户——免费用户可能永远不付费"
    },
    evidence: "付费用户的反馈质量远高于免费用户",
    migrationDirection: "从免费用户 → 付费验证 → 付费用户服务",
    urgency: "medium",
    affectedCapabilities: ["免费用户思维"],
    threatenedTasks: ["只服务免费用户"],
    emergingOpportunities: ["付费验证", "付费用户服务"]
  },
  {
    id: "ai_product-5",
    domain: "ai_product",
    title: "AI产品不需要大模型，需要解决具体问题",
    coreInsight: {
      "你以为": "要用最新大模型",
      "实际上": "用户不关心你用什么模型——只关心问题是否解决"
    },
    evidence: "很多成功产品用的是旧模型，但解决了具体问题",
    migrationDirection: "从追求模型 → 解决问题 → 用户价值",
    urgency: "medium",
    affectedCapabilities: ["模型追求"],
    threatenedTasks: ["只追求最新模型"],
    emergingOpportunities: ["问题解决", "用户价值"]
  },
  {
    id: "ai_product-6",
    domain: "ai_product",
    title: "独立开发者不需要全栈，需要最小技术栈",
    coreInsight: {
      "你以为": "要学会所有技术",
      "实际上": "只需要学会能做出产品的最小技术——其他可以外包或用工具"
    },
    evidence: "成功的独立开发者，往往只掌握2-3个核心技术",
    migrationDirection: "从全栈追求 → 最小技术栈 → 技术杠杆",
    urgency: "medium",
    affectedCapabilities: ["全栈焦虑"],
    threatenedTasks: ["什么都学"],
    emergingOpportunities: ["最小技术栈", "技术杠杆"]
  },
  {
    id: "ai_product-7",
    domain: "ai_product",
    title: "产品不是做出来的，而是验证出来的",
    coreInsight: {
      "你以为": "做出产品就能成功",
      "实际上": "产品需要反复验证——做出来只是第一步"
    },
    evidence: "成功产品平均经过5-10次重大迭代",
    migrationDirection: "从做产品 → 验证产品 → 迭代产品",
    urgency: "medium",
    affectedCapabilities: ["产品思维"],
    threatenedTasks: ["做出来就结束"],
    emergingOpportunities: ["用户验证", "迭代优化"]
  },
  {
    id: "ai_product-8",
    domain: "ai_product",
    title: "不要等产品完美再推广",
    coreInsight: {
      "你以为": "产品完美才能推广",
      "实际上": "推广和产品可以并行——早期用户愿意容忍不完美"
    },
    evidence: "早期推广的产品，往往不完美",
    migrationDirection: "从完美再推广 → 边做边推广 → 推广驱动迭代",
    urgency: "medium",
    affectedCapabilities: ["完美主义"],
    threatenedTasks: ["等完美再推广"],
    emergingOpportunities: ["早期推广", "用户反馈"]
  },
  {
    id: "ai_product-9",
    domain: "ai_product",
    title: "AI产品的壁垒不是技术，而是数据和用户",
    coreInsight: {
      "你以为": "技术是壁垒",
      "实际上": "技术会被复制——数据和用户关系才是壁垒"
    },
    evidence: "很多技术被复制的产品，依然有用户壁垒",
    migrationDirection: "从技术壁垒 → 数据壁垒 → 用户壁垒",
    urgency: "medium",
    affectedCapabilities: ["技术壁垒思维"],
    threatenedTasks: ["只依赖技术"],
    emergingOpportunities: ["数据积累", "用户关系"]
  },
  {
    id: "ai_product-10",
    domain: "ai_product",
    title: "不要追逐热点，追逐用户痛点",
    coreInsight: {
      "你以为": "热点产品更容易成功",
      "实际上": "热点竞争激烈——解决痛点才是长久之道"
    },
    evidence: "热点产品死亡率高，痛点产品存活率高",
    migrationDirection: "从追逐热点 → 发现痛点 → 解决痛点",
    urgency: "medium",
    affectedCapabilities: ["热点追逐"],
    threatenedTasks: ["什么火做什么"],
    emergingOpportunities: ["痛点发现", "长久价值"]
  },
  {
    id: "ai_product-11",
    domain: "ai_product",
    title: "AI产品不需要复杂，需要解决一个具体问题",
    coreInsight: {
      "你以为": "功能越多越好",
      "实际上": "解决一个具体问题，比解决很多问题更有效"
    },
    evidence: "成功的产品，往往只解决一个问题",
    migrationDirection: "从多功能 → 单一功能 → 单一价值",
    urgency: "medium",
    affectedCapabilities: ["功能追求"],
    threatenedTasks: ["什么都做"],
    emergingOpportunities: ["单一价值", "专注问题"]
  },
  {
    id: "ai_product-12",
    domain: "ai_product",
    title: "用户不会为AI付费，只为结果付费",
    coreInsight: {
      "你以为": "AI功能能收费",
      "实际上": "用户不关心AI——只关心结果是否值得付费"
    },
    evidence: "很多AI产品收费失败，但解决问题的产品收费成功",
    migrationDirection: "从卖AI → 卖结果 → 结果价值",
    urgency: "high",
    affectedCapabilities: ["AI卖点"],
    threatenedTasks: ["只宣传AI"],
    emergingOpportunities: ["结果价值", "用户付费"]
  },
  {
    id: "ai_product-13",
    domain: "ai_product",
    title: "不要等准备好了再发布",
    coreInsight: {
      "你以为": "等准备好了再发布",
      "实际上": "发布是最好的准备——用户反馈比准备更重要"
    },
    evidence: "成功产品都是发布后迭代出来的",
    migrationDirection: "从准备 → 发布 → 迭代",
    urgency: "medium",
    affectedCapabilities: ["完美主义准备"],
    threatenedTasks: ["等准备好了"],
    emergingOpportunities: ["快速发布", "用户反馈"]
  },
  {
    id: "ai_product-14",
    domain: "ai_product",
    title: "AI产品不需要大团队，需要小而精",
    coreInsight: {
      "你以为": "团队越大越好",
      "实际上": "小团队决策快、迭代快——大团队反而慢"
    },
    evidence: "成功产品早期团队往往只有2-3人",
    migrationDirection: "从大团队 → 小团队 → 精简团队",
    urgency: "medium",
    affectedCapabilities: ["团队追求"],
    threatenedTasks: ["追求大团队"],
    emergingOpportunities: ["小团队", "快速决策"]
  },
  {
    id: "ai_product-15",
    domain: "ai_product",
    title: "不要追求平台，先追求工具",
    coreInsight: {
      "你以为": "要做平台",
      "实际上": "平台竞争激烈——工具更容易验证和收费"
    },
    evidence: "成功的工具产品，比平台产品多",
    migrationDirection: "从平台 → 工具 → 工具+平台",
    urgency: "medium",
    affectedCapabilities: ["平台追求"],
    threatenedTasks: ["一开始就想做平台"],
    emergingOpportunities: ["工具产品", "收费验证"]
  },
  {
    id: "ai_product-16",
    domain: "ai_product",
    title: "AI产品的价值不在AI，在解决效率问题",
    coreInsight: {
      "你以为": "AI是价值",
      "实际上": "AI只是手段——效率提升才是用户愿意付费的价值"
    },
    evidence: "用户愿意为效率付费，不愿意为AI付费",
    migrationDirection: "从AI价值 → 效率价值 → 用户价值",
    urgency: "medium",
    affectedCapabilities: ["AI价值思维"],
    threatenedTasks: ["只宣传AI"],
    emergingOpportunities: ["效率价值", "用户付费"]
  },
  {
    id: "ai_product-17",
    domain: "ai_product",
    title: "不要追求完美用户体验，先追求核心功能可用",
    coreInsight: {
      "你以为": "用户体验必须完美",
      "实际上": "核心功能可用，比用户体验完美更重要"
    },
    evidence: "成功产品早期用户体验都不完美",
    migrationDirection: "从用户体验 → 核心功能 → 功能+体验",
    urgency: "medium",
    affectedCapabilities: ["用户体验追求"],
    threatenedTasks: ["只追求用户体验"],
    emergingOpportunities: ["核心功能", "可用验证"]
  },
  {
    id: "ai_product-18",
    domain: "ai_product",
    title: "AI产品不需要大市场，需要精准用户",
    coreInsight: {
      "你以为": "市场越大越好",
      "实际上": "精准用户更容易付费——大市场竞争激烈"
    },
    evidence: "精准用户的产品，付费率更高",
    migrationDirection: "从大市场 → 精准用户 → 用户深耕",
    urgency: "medium",
    affectedCapabilities: ["大市场追求"],
    threatenedTasks: ["追求大市场"],
    emergingOpportunities: ["精准用户", "付费验证"]
  },
  {
    id: "ai_product-19",
    domain: "ai_product",
    title: "不要等产品成熟再收费，先收费验证",
    coreInsight: {
      "你以为": "产品成熟才能收费",
      "实际上": "收费是最好的验证——有人愿意付费，产品才有价值"
    },
    evidence: "早期收费的产品，比免费后收费的产品存活率高",
    migrationDirection: "从免费 → 早期收费 → 收费验证",
    urgency: "high",
    affectedCapabilities: ["免费思维"],
    threatenedTasks: ["等产品成熟再收费"],
    emergingOpportunities: ["早期收费", "价值验证"]
  }
];