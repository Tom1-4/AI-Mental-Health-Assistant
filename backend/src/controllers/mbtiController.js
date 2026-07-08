const db = require('../config/database');

// 安全JSON解析：兼容JSON数组和逗号分隔的纯字符串
const safeParseArray = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // 如果不是JSON，按逗号分隔
    return String(value).split(',').map(s => s.trim()).filter(Boolean);
  }
};

// 安全JSON解析：兼容JSON对象
const safeParseObject = (value) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

// MBTI 16种人格类型描述
const MBTI_TYPES = {
  INTJ: { name: '建筑师', traits: ['独立', '理性', '果断', '战略思维'], description: '富有想象力和战略性的思想家，对一切都有计划。善于独立思考和长远规划，重视知识和能力。' },
  INTP: { name: '逻辑学家', traits: ['创新', '好奇', '分析', '抽象思维'], description: '具有创造力和好奇心的发明家，对知识有着不可满足的渴望。善于发现模式和逻辑联系。' },
  ENTJ: { name: '指挥官', traits: ['大胆', '富有想象力', '意志坚强', '领导力'], description: '大胆、富有想象力且意志坚强的领导者，总能找到实现目标的方法。天生的管理者和组织者。' },
  ENTP: { name: '辩论家', traits: ['聪明', '好奇', '善辩', '机智'], description: '聪明好奇的思想家，不会放弃任何智力上的挑战。善于即兴发挥和头脑风暴。' },
  INFJ: { name: '提倡者', traits: ['理想主义', '富有同情心', '有原则', '洞察力'], description: '安静而神秘，但鼓舞人心且不知疲倦的理想主义者。具有深刻的洞察力和强烈的价值观。' },
  INFP: { name: '调停者', traits: ['诗意', '善良', '利他主义', '理想主义'], description: '诗意、善良的利他主义者，总是热情地为正义和美好的事业而奋斗。重视内心的和谐与真实。' },
  ENFJ: { name: '主人公', traits: ['富有魅力', '鼓舞人心', '同理心', '领导力'], description: '富有魅力且鼓舞人心的领导者，能够带动他人。天生的导师，乐于帮助他人成长。' },
  ENFP: { name: '竞选者', traits: ['热情', '创造力', '社交能力', '自由精神'], description: '热情、有创造力、爱社交的自由精神，总能找到理由微笑。善于发现可能性和激励他人。' },
  ISTJ: { name: '物流师', traits: ['务实', '可靠', '严谨', '有条理'], description: '务实且注重事实的人，可靠性不容置疑。重视传统、秩序和规则，做事一丝不苟。' },
  ISFJ: { name: '守卫者', traits: ['忠诚', '体贴', '细心', '奉献精神'], description: '非常专注和温暖的守护者，时刻准备保护所爱之人。默默奉献，细心周到。' },
  ESTJ: { name: '总经理', traits: ['高效', '果断', '务实', '组织能力'], description: '出色的管理者，在管理事务或人员方面无与伦比。重视效率、秩序和成果。' },
  ESFJ: { name: '执政官', traits: ['热心', '负责', '社交', '关怀'], description: '极有同情心、受欢迎且热心，时刻准备帮助他人。重视和谐、合作和社区。' },
  ISTP: { name: '鉴赏家', traits: ['大胆', '务实', '灵活', '动手能力'], description: '大胆而务实的实验者，精通各种工具的使用。善于动手解决问题，适应力强。' },
  ISFP: { name: '探险家', traits: ['灵活', '魅力', '艺术感', '探索精神'], description: '灵活且有魅力的艺术家，随时准备探索和体验新事物。活在当下，享受生活。' },
  ESTP: { name: '企业家', traits: ['聪明', '精力充沛', '敏锐', '行动力'], description: '聪明、精力充沛且善于感知的人，真正享受冒险和挑战。善于随机应变和抓住机遇。' },
  ESFP: { name: '表演者', traits: ['自发性', '活力', '热情', '社交'], description: '自发而动感十足的表演者，永远不会因关注而感到厌倦。热爱生活，乐于分享快乐。' }
};

// 维度描述
const DIMENSION_DESC = {
  EI: {
    E: '外向 (Extraversion) - 从外部世界和社交互动中获取能量，喜欢与人交往，倾向于先行动后思考。',
    I: '内向 (Introversion) - 从独处和内心世界中获取能量，喜欢深入思考，倾向于先思考后行动。'
  },
  SN: {
    S: '感觉 (Sensing) - 关注具体的事实和细节，相信实际经验，倾向于按步骤处理问题。',
    N: '直觉 (Intuition) - 关注整体模式和未来可能性，相信直觉和灵感，倾向于跳跃性思维。'
  },
  TF: {
    T: '思维 (Thinking) - 做决定时依赖逻辑和客观分析，重视公平和一致性。',
    F: '情感 (Feeling) - 做决定时考虑个人价值观和人际关系，重视和谐与同理心。'
  },
  JP: {
    J: '判断 (Judging) - 喜欢计划和组织，追求确定性和完成感，倾向于做出决定。',
    P: '感知 (Perceiving) - 喜欢灵活和开放，享受过程，倾向于保留选择余地。'
  }
};

// 计算MBTI类型
const calculateMBTI = (answers) => {
  // answers格式: { "1": 4, "2": 3, ... } 共28题
  let eiScore = 0, snScore = 0, tfScore = 0, jpScore = 0;

  for (let i = 1; i <= 28; i++) {
    const score = parseInt(answers[String(i)]) || 3;
    if (i >= 1 && i <= 7) eiScore += score;       // E/I 维度
    else if (i >= 8 && i <= 14) snScore += score;  // S/N 维度
    else if (i >= 15 && i <= 21) tfScore += score; // T/F 维度
    else if (i >= 22 && i <= 28) jpScore += score; // J/P 维度
  }

  // 每题1-5分，7题满分35，中点21
  const E = eiScore >= 21 ? 'E' : 'I';
  const S = snScore >= 21 ? 'S' : 'N';
  const T = tfScore >= 21 ? 'T' : 'F';
  const J = jpScore >= 21 ? 'J' : 'P';

  const type = E + S + T + J;

  // 计算各维度百分比
  const eiPercent = Math.round((eiScore / 35) * 100);
  const snPercent = Math.round((snScore / 35) * 100);
  const tfPercent = Math.round((tfScore / 35) * 100);
  const jpPercent = Math.round((jpScore / 35) * 100);

  return {
    type,
    typeInfo: MBTI_TYPES[type],
    dimensions: {
      EI: { score: eiScore, percent: eiPercent, result: E, description: DIMENSION_DESC.EI[E] },
      SN: { score: snScore, percent: snPercent, result: S, description: DIMENSION_DESC.SN[S] },
      TF: { score: tfScore, percent: tfPercent, result: T, description: DIMENSION_DESC.TF[T] },
      JP: { score: jpScore, percent: jpPercent, result: J, description: DIMENSION_DESC.JP[J] }
    }
  };
};

// 1. 提交测试结果
const submitTest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { answers } = req.body;

    if (!answers || Object.keys(answers).length !== 28) {
      return res.status(400).json({
        success: false,
        message: '请完成所有28道题目'
      });
    }

    const result = calculateMBTI(answers);

    // 将答案和结果存入数据库
    const [dbResult] = await db.query(
      `INSERT INTO mbti_results (user_id, mbti_type, answers, ei_score, sn_score, tf_score, jp_score, 
       ei_percent, sn_percent, tf_percent, jp_percent, type_name, type_traits, type_description, dimension_desc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        result.type,
        JSON.stringify(answers),
        result.dimensions.EI.score,
        result.dimensions.SN.score,
        result.dimensions.TF.score,
        result.dimensions.JP.score,
        result.dimensions.EI.percent,
        result.dimensions.SN.percent,
        result.dimensions.TF.percent,
        result.dimensions.JP.percent,
        result.typeInfo.name,
        JSON.stringify(result.typeInfo.traits),
        result.typeInfo.description,
        JSON.stringify({
          EI: { result: result.dimensions.EI.result, description: result.dimensions.EI.description },
          SN: { result: result.dimensions.SN.result, description: result.dimensions.SN.description },
          TF: { result: result.dimensions.TF.result, description: result.dimensions.TF.description },
          JP: { result: result.dimensions.JP.result, description: result.dimensions.JP.description }
        })
      ]
    );

    res.json({
      success: true,
      data: {
        id: dbResult.insertId,
        ...result
      }
    });
  } catch (error) {
    console.error('提交MBTI测试失败:', error);
    res.status(500).json({
      success: false,
      message: '提交测试结果失败'
    });
  }
};

// 2. 获取当前用户的MBTI测试结果
const getMyResult = async (req, res) => {
  try {
    const userId = req.user.id;

    const [results] = await db.query(
      `SELECT * FROM mbti_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (results.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: '您还没有完成MBTI测试'
      });
    }

    const result = results[0];
    res.json({
      success: true,
      data: {
        id: result.id,
        type: result.mbti_type,
        typeName: result.type_name,
        typeTraits: safeParseArray(result.type_traits),
        typeDescription: result.type_description,
        dimensions: {
          EI: { score: result.ei_score, percent: result.ei_percent, result: result.mbti_type[0], description: safeParseObject(result.dimension_desc).EI?.description || '' },
          SN: { score: result.sn_score, percent: result.sn_percent, result: result.mbti_type[1], description: safeParseObject(result.dimension_desc).SN?.description || '' },
          TF: { score: result.tf_score, percent: result.tf_percent, result: result.mbti_type[2], description: safeParseObject(result.dimension_desc).TF?.description || '' },
          JP: { score: result.jp_score, percent: result.jp_percent, result: result.mbti_type[3], description: safeParseObject(result.dimension_desc).JP?.description || '' }
        },
        createdAt: result.created_at
      }
    });
  } catch (error) {
    console.error('获取MBTI结果失败:', error);
    res.status(500).json({
      success: false,
      message: '获取测试结果失败'
    });
  }
};

// 3. 获取用户的MBTI测试历史
const getMyHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const [results] = await db.query(
      `SELECT id, mbti_type, type_name, created_at FROM mbti_results WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('获取MBTI历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取测试历史失败'
    });
  }
};

// 4. 管理员 - 获取所有用户的MBTI结果
const getAllUserResults = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [countResult] = await db.query(
      `SELECT COUNT(DISTINCT user_id) as total FROM mbti_results`
    );
    const total = countResult[0].total;

    const [results] = await db.query(
      `SELECT m.id, m.user_id, u.username, u.email, m.mbti_type, m.type_name, 
              m.ei_percent, m.sn_percent, m.tf_percent, m.jp_percent, m.created_at
       FROM mbti_results m
       JOIN users u ON m.user_id = u.id
       WHERE m.id IN (
         SELECT MAX(id) FROM mbti_results GROUP BY user_id
       )
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        users: results.map(r => ({
          id: r.id,
          userId: r.user_id,
          username: r.username,
          email: r.email,
          mbtiType: r.mbti_type,
          typeName: r.type_name,
          dimensions: {
            EI: r.ei_percent,
            SN: r.sn_percent,
            TF: r.tf_percent,
            JP: r.jp_percent
          },
          createdAt: r.created_at
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('管理员获取MBTI结果失败:', error);
    res.status(500).json({
      success: false,
      message: '获取MBTI结果失败'
    });
  }
};

// 5. 管理员 - 获取MBTI类型分布统计
const getTypeDistribution = async (req, res) => {
  try {
    const [distribution] = await db.query(
      `SELECT mbti_type, COUNT(*) as count
       FROM mbti_results
       WHERE id IN (SELECT MAX(id) FROM mbti_results GROUP BY user_id)
       GROUP BY mbti_type
       ORDER BY count DESC`
    );

    // 将统计结果与类型信息合并
    const stats = distribution.map(item => ({
      type: item.mbti_type,
      count: item.count,
      typeInfo: MBTI_TYPES[item.mbti_type] || { name: item.mbti_type, traits: [], description: '' }
    }));

    // 维度统计
    const E = distribution.filter(d => d.mbti_type[0] === 'E').reduce((s, d) => s + d.count, 0);
    const I = distribution.filter(d => d.mbti_type[0] === 'I').reduce((s, d) => s + d.count, 0);
    const S = distribution.filter(d => d.mbti_type[1] === 'S').reduce((s, d) => s + d.count, 0);
    const N = distribution.filter(d => d.mbti_type[1] === 'N').reduce((s, d) => s + d.count, 0);
    const T = distribution.filter(d => d.mbti_type[2] === 'T').reduce((s, d) => s + d.count, 0);
    const F = distribution.filter(d => d.mbti_type[2] === 'F').reduce((s, d) => s + d.count, 0);
    const J = distribution.filter(d => d.mbti_type[3] === 'J').reduce((s, d) => s + d.count, 0);
    const P = distribution.filter(d => d.mbti_type[3] === 'P').reduce((s, d) => s + d.count, 0);

    res.json({
      success: true,
      data: {
        typeDistribution: stats,
        dimensionStats: {
          EI: { E, I },
          SN: { S, N },
          TF: { T, F },
          JP: { J, P }
        },
        totalTestedUsers: E + I
      }
    });
  } catch (error) {
    console.error('获取MBTI分布失败:', error);
    res.status(500).json({
      success: false,
      message: '获取MBTI分布统计失败'
    });
  }
};

// 6. 管理员 - 获取单个用户的MBTI详情
const getUserMbtiDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    const [results] = await db.query(
      `SELECT * FROM mbti_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (results.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: '该用户未完成MBTI测试'
      });
    }

    const result = results[0];
    res.json({
      success: true,
      data: {
        id: result.id,
        type: result.mbti_type,
        typeName: result.type_name,
        typeTraits: safeParseArray(result.type_traits),
        typeDescription: result.type_description,
        dimensions: {
          EI: { score: result.ei_score, percent: result.ei_percent, result: result.mbti_type[0] },
          SN: { score: result.sn_score, percent: result.sn_percent, result: result.mbti_type[1] },
          TF: { score: result.tf_score, percent: result.tf_percent, result: result.mbti_type[2] },
          JP: { score: result.jp_score, percent: result.jp_percent, result: result.mbti_type[3] }
        },
        createdAt: result.created_at
      }
    });
  } catch (error) {
    console.error('获取用户MBTI详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取MBTI详情失败'
    });
  }
};

// 7. 获取MBTI题目
const getQuestions = async (req, res) => {
  const questions = [
    // E/I 维度 (1-7)
    { id: 1, text: '在社交聚会中，我感到精力充沛而不是疲惫', dimension: 'EI' },
    { id: 2, text: '我更喜欢与一大群人交流而不是一对一交谈', dimension: 'EI' },
    { id: 3, text: '我倾向于先行动再深入思考', dimension: 'EI' },
    { id: 4, text: '我容易与不熟悉的人开始交谈', dimension: 'EI' },
    { id: 5, text: '独处太久会让我感到不安或烦躁', dimension: 'EI' },
    { id: 6, text: '我更喜欢通过讨论来形成自己的想法', dimension: 'EI' },
    { id: 7, text: '在团队中工作时我比独自工作时更有动力', dimension: 'EI' },
    // S/N 维度 (8-14)
    { id: 8, text: '我更关注具体的事实和细节而不是整体概念', dimension: 'SN' },
    { id: 9, text: '我更喜欢按照既定的步骤和方式做事', dimension: 'SN' },
    { id: 10, text: '我相信眼见为实，更依赖实际经验而非理论', dimension: 'SN' },
    { id: 11, text: '我更关注当下正在发生的事情而不是未来的可能性', dimension: 'SN' },
    { id: 12, text: '我更喜欢实用和具体的解决方案', dimension: 'SN' },
    { id: 13, text: '我倾向于按照说明书一步步操作新设备', dimension: 'SN' },
    { id: 14, text: '我认为传统和经过验证的方法通常是有效的', dimension: 'SN' },
    // T/F 维度 (15-21)
    { id: 15, text: '做决定时我更依赖逻辑分析而不是个人感受', dimension: 'TF' },
    { id: 16, text: '我认为公平公正比照顾个人感受更重要', dimension: 'TF' },
    { id: 17, text: '我倾向于客观分析问题而不是优先考虑人际关系', dimension: 'TF' },
    { id: 18, text: '在争论中我更看重事实和道理而非对方的情感', dimension: 'TF' },
    { id: 19, text: '我比较难被感人的故事或场景打动', dimension: 'TF' },
    { id: 20, text: '我认为规章制度应该一视同仁，不应有例外', dimension: 'TF' },
    { id: 21, text: '我更倾向于直接指出问题而不是委婉表达', dimension: 'TF' },
    // J/P 维度 (22-28)
    { id: 22, text: '我喜欢提前制定计划并按计划执行', dimension: 'JP' },
    { id: 23, text: '我更喜欢事情有明确的结论和结果', dimension: 'JP' },
    { id: 24, text: '我会提前完成任务，而不是拖到最后一刻', dimension: 'JP' },
    { id: 25, text: '我喜欢有规律和秩序的生活方式', dimension: 'JP' },
    { id: 26, text: '做出决定后我很少改变主意', dimension: 'JP' },
    { id: 27, text: '我更喜欢遵循时间表和截止日期', dimension: 'JP' },
    { id: 28, text: '我喜欢在行动前做好充分的准备', dimension: 'JP' }
  ];

  res.json({
    success: true,
    data: {
      questions,
      options: [
        { value: 1, label: '完全不同意' },
        { value: 2, label: '不同意' },
        { value: 3, label: '中立' },
        { value: 4, label: '同意' },
        { value: 5, label: '完全同意' }
      ]
    }
  });
};

module.exports = {
  getQuestions,
  submitTest,
  getMyResult,
  getMyHistory,
  getAllUserResults,
  getTypeDistribution,
  getUserMbtiDetail
};
