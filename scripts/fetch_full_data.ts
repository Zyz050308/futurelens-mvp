
import * as fs from 'fs';
import * as path from 'path';

// 手动获取完整数据脚本
async function fetchFullData() {
  const TEST_CASES = [
    {
      id: 'arch-1',
      name: '建筑｜想赚钱｜时间少｜低风险',
      profile: {
        age: '25',
        education: '本科',
        majorOrCareer: '建筑设计',
        currentSkills: '手绘、CAD、SketchUp',
        interests: '室内设计、效果图',
        currentGoal: '想赚外快，补贴工资',
        currentAnxiety: '感觉加班太累，钱不够用',
        desiredOutcome: '赚钱',
        weeklyTime: '5小时以下',
        riskPreference: '稳妥'
      }
    },
    {
      id: 'arch-3',
      name: '建筑｜想稳定｜怕失业｜低风险',
      profile: {
        age: '30',
        education: '本科',
        majorOrCareer: '施工现场管理',
        currentSkills: '现场管理、施工图纸、安全员',
        interests: '考证、稳定工作',
        currentGoal: '找个稳定的岗位，不再担心失业',
        currentAnxiety: '害怕行业下滑，被裁员',
        desiredOutcome: '稳定',
        weeklyTime: '5-10小时',
        riskPreference: '稳妥'
      }
    },
    {
      id: 'finance-2',
      name: '财务｜想转型｜时间中等｜风险适中',
      profile: {
        age: '29',
        education: '本科',
        majorOrCareer: '财务分析',
        currentSkills: '数据分析、财务建模',
        interests: '数据产品、业务分析',
        currentGoal: '想转型到业务或数据方向',
        currentAnxiety: '觉得纯财务太窄，没前景',
        desiredOutcome: '转型',
        weeklyTime: '10-15小时',
        riskPreference: '适中'
      }
    },
    {
      id: 'design-2',
      name: '视觉传达｜AI产品｜创业｜时间多｜高风险',
      profile: {
        age: '25',
        education: '硕士',
        majorOrCareer: '视觉传达设计',
        currentSkills: 'Figma、AI绘画、Midjourney',
        interests: 'AI产品、SaaS、独立开发',
        currentGoal: '做一个AI设计工具或产品',
        currentAnxiety: '怕技术实现不了，或者没人用',
        desiredOutcome: '创业',
        weeklyTime: '20小时以上',
        riskPreference: '激进'
      }
    },
    {
      id: 'study-1',
      name: '雅思｜目标6.5｜时间中等｜焦虑拖延',
      profile: {
        age: '22',
        education: '本科在读',
        majorOrCareer: '准备留学',
        currentSkills: '英语基础还行',
        interests: '英语、海外文化',
        currentGoal: '今年年底雅思6.5',
        currentAnxiety: '拖延症，单词总是背不完',
        desiredOutcome: '留学',
        weeklyTime: '10-15小时',
        riskPreference: '适中'
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

  const outputPath = path.join(__dirname, '../test-results/full_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), 'utf-8');
  console.log(`完整数据已保存到: ${outputPath}`);
}

fetchFullData().catch(console.error);

