
import * as fs from 'fs';
import * as path from 'path';

async function fetchMoreData() {
  const TEST_CASES = [
    {
      id: 'arch-2',
      name: '建筑｜想赚钱｜时间多｜高风险',
      profile: {
        age: '27',
        education: '硕士',
        majorOrCareer: '建筑师',
        currentSkills: 'BIM、Revit、设计全流程',
        interests: '数字建筑、参数化设计',
        currentGoal: '利用技能搞副业赚钱',
        currentAnxiety: '想创业但没经验',
        desiredOutcome: '赚钱',
        weeklyTime: '20小时以上',
        riskPreference: '激进'
      }
    },
    {
      id: 'design-1',
      name: '视觉传达｜想赚钱｜时间少｜低风险',
      profile: {
        age: '24',
        education: '本科',
        majorOrCareer: '视觉传达设计',
        currentSkills: 'PS、AI、平面设计',
        interests: '品牌设计、小红书',
        currentGoal: '用设计技能赚外快',
        currentAnxiety: '感觉基础设计不值钱了',
        desiredOutcome: '赚钱',
        weeklyTime: '5小时以下',
        riskPreference: '稳妥'
      }
    },
    {
      id: 'arch-4',
      name: '建筑｜想创业｜时间多｜高风险',
      profile: {
        age: '32',
        education: '硕士',
        majorOrCareer: '建筑项目管理',
        currentSkills: '项目管理、客户沟通、方案设计',
        interests: '创业、互联网+建筑',
        currentGoal: '想做一个小型的建筑服务工作室',
        currentAnxiety: '怕客户不接受新模式',
        desiredOutcome: '创业',
        weeklyTime: '20小时以上',
        riskPreference: '激进'
      }
    },
    {
      id: 'finance-1',
      name: '财务｜想稳定｜怕AI替代｜低风险',
      profile: {
        age: '27',
        education: '本科',
        majorOrCareer: '会计',
        currentSkills: 'Excel、做账、报税、财务分析',
        interests: '稳定、考证',
        currentGoal: '在行业变化前做好准备，保住工作',
        currentAnxiety: '怕AI财务工具代替自己',
        desiredOutcome: '稳定',
        weeklyTime: '5-10小时',
        riskPreference: '稳妥'
      }
    }
  ];

  const allData: any[] = [];

  for (const testCase of TEST_CASES) {
    console.log(`正在获取: ${testCase.name}...`);
    try {
      const response = await fetch('http://localhost:3001/api/radar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: testCase.profile,
          changeSignals: [{ title: '测试信号', summary: '测试', category: 'test' }],
          userStateProfile: {
            state: 'test',
            stateLabel: '测试状态',
            oneSentenceDiagnosis: '测试诊断',
            mainGoal: '测试目标',
            mainFear: '测试焦虑',
            keyConstraint: '测试限制',
            availableTime: testCase.profile.weeklyTime,
            riskPreference: testCase.profile.riskPreference,
            resourceLevel: 'moderate',
            executionCapacity: 'medium',
            decisionLogic: 'test',
            recommendedStrategy: 'test',
            avoidStrategy: 'test',
            strategyFocus: ['test'],
            actionBias: ['test'],
            forbiddenBias: ['test'],
            decisionPriority: 'test'
          }
        })
      });

      const responseData = await response.json();
      allData.push({
        name: testCase.name,
        profile: testCase.profile,
        radarData: responseData.data
      });
    } catch (error) {
      console.error(`获取失败: ${testCase.name}:`, error);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  // 合并已有的数据
  const existingDataPath = path.join(__dirname, '../test-results/full_data.json');
  let existingData: any[] = [];
  if (fs.existsSync(existingDataPath)) {
    existingData = JSON.parse(fs.readFileSync(existingDataPath, 'utf-8'));
  }

  const allDataCombined = [...existingData, ...allData];

  const outputPath = path.join(__dirname, '../test-results/all_test_cases.json');
  fs.writeFileSync(outputPath, JSON.stringify(allDataCombined, null, 2), 'utf-8');
  console.log(`所有完整数据已保存到: ${outputPath}`);
}

fetchMoreData().catch(console.error);

