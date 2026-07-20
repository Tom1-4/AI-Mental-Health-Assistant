const db = require('../config/database');

// PHQ-9 评分标准
const PHQ9_SEVERITY = [
  { max: 4, label: '无明显抑郁症状', severity: 'none', color: '#22c55e' },
  { max: 9, label: '轻度抑郁', severity: 'mild', color: '#eab308' },
  { max: 14, label: '中度抑郁', severity: 'moderate', color: '#f97316' },
  { max: 19, label: '中重度抑郁', severity: 'moderately-severe', color: '#ef4444' },
  { max: 27, label: '重度抑郁', severity: 'severe', color: '#dc2626' },
];

// GAD-7 评分标准
const GAD7_SEVERITY = [
  { max: 4, label: '无明显焦虑症状', severity: 'none', color: '#22c55e' },
  { max: 9, label: '轻度焦虑', severity: 'mild', color: '#eab308' },
  { max: 14, label: '中度焦虑', severity: 'moderate', color: '#f97316' },
  { max: 21, label: '重度焦虑', severity: 'severe', color: '#dc2626' },
];

// 获取量表题目
exports.getQuestions = async (req, res) => {
  try {
    const phq9Questions = [
      { id: 1, text: '做事时提不起劲或没有兴趣' },
      { id: 2, text: '感到心情低落、沮丧或绝望' },
      { id: 3, text: '入睡困难、睡不安稳或睡眠过多' },
      { id: 4, text: '感觉疲倦或没有活力' },
      { id: 5, text: '食欲不振或吃太多' },
      { id: 6, text: '觉得自己很糟——或觉得自己很失败，或让自己或家人失望' },
      { id: 7, text: '对事物专注有困难，例如阅读报纸或看电视时' },
      { id: 8, text: '动作或说话速度缓慢到别人已经觉察？或正好相反——烦躁或坐立不安、动来动去的情况更胜于平常' },
      { id: 9, text: '有不如死掉或用某种方式伤害自己的念头' },
    ];

    const gad7Questions = [
      { id: 1, text: '感觉紧张、焦虑或急切' },
      { id: 2, text: '无法停止或控制担忧' },
      { id: 3, text: '对各种各样的事情担忧过多' },
      { id: 4, text: '很难放松下来' },
      { id: 5, text: '由于不安而无法静坐' },
      { id: 6, text: '变得容易烦恼或急躁' },
      { id: 7, text: '感到害怕，似乎将有可怕的事情发生' },
    ];

    const options = [
      { value: 0, label: '完全不会' },
      { value: 1, label: '好几天' },
      { value: 2, label: '一半以上的天数' },
      { value: 3, label: '几乎每天' },
    ];

    res.json({
      success: true,
      data: {
        phq9: {
          title: 'PHQ-9 抑郁筛查量表',
          description: '过去两周内，以下情况困扰您的程度如何？',
          questions: phq9Questions,
          options,
        },
        gad7: {
          title: 'GAD-7 焦虑筛查量表',
          description: '过去两周内，以下情况困扰您的程度如何？',
          questions: gad7Questions,
          options,
        },
      },
    });
  } catch (error) {
    console.error('获取量表题目错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 提交测评
exports.submitTest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { testType, answers } = req.body;

    // 验证测试类型
    if (!['phq9', 'gad7'].includes(testType)) {
      return res.status(400).json({ success: false, message: '无效的测试类型' });
    }

    // 验证答题完整性
    const expectedCount = testType === 'phq9' ? 9 : 7;
    if (!answers || Object.keys(answers).length !== expectedCount) {
      return res.status(400).json({
        success: false,
        message: `请完成全部 ${expectedCount} 道题目`,
      });
    }

    // 计算总分
    const totalScore = Object.values(answers).reduce((sum, val) => sum + Number(val), 0);

    // 确定严重程度
    const severityTable = testType === 'phq9' ? PHQ9_SEVERITY : GAD7_SEVERITY;
    let severity = severityTable[severityTable.length - 1];
    for (const s of severityTable) {
      if (totalScore <= s.max) {
        severity = s;
        break;
      }
    }

    // 存储到数据库
    const [result] = await db.query(
      `INSERT INTO screening_results (user_id, test_type, answers, total_score, severity)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, testType, JSON.stringify(answers), totalScore, severity.severity]
    );

    // 生成评估建议
    let recommendation = '';
    if (testType === 'phq9') {
      if (totalScore <= 4) recommendation = '您目前的抑郁症状不明显，请继续保持良好的生活习惯和积极心态。';
      else if (totalScore <= 9) recommendation = '您可能有轻度抑郁倾向，建议关注自己的情绪变化，适当增加运动和社交活动。如症状持续，建议咨询专业心理医生。';
      else if (totalScore <= 14) recommendation = '您可能存在中度抑郁症状，建议寻求专业心理咨询师的帮助，同时保持规律的作息和健康的社交。';
      else if (totalScore <= 19) recommendation = '您可能存在中重度抑郁症状，强烈建议尽快咨询心理医生或精神科医生，不要独自承受。';
      else recommendation = '您可能存在重度抑郁症状，请立即寻求专业帮助。可拨打心理援助热线：希望24热线 400-161-9995。';
    } else {
      if (totalScore <= 4) recommendation = '您目前的焦虑症状不明显，请继续保持良好的生活习惯。';
      else if (totalScore <= 9) recommendation = '您可能有轻度焦虑倾向，建议学习一些放松技巧，如深呼吸、正念冥想等。';
      else if (totalScore <= 14) recommendation = '您可能存在中度焦虑症状，建议寻求专业心理咨询师的帮助，学习压力管理技巧。';
      else recommendation = '您可能存在重度焦虑症状，强烈建议尽快咨询心理医生，同时可拨打全国心理援助热线 12320。';
    }

    res.json({
      success: true,
      data: {
        id: result.insertId,
        testType,
        totalScore,
        severity: severity.severity,
        severityLabel: severity.label,
        severityColor: severity.color,
        recommendation,
        answers,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('提交测评错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取我的最新测评结果
exports.getMyResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    if (!type || !['phq9', 'gad7'].includes(type)) {
      return res.status(400).json({ success: false, message: '无效的测试类型' });
    }

    const [results] = await db.query(
      `SELECT * FROM screening_results WHERE user_id = ? AND test_type = ? ORDER BY created_at DESC LIMIT 1`,
      [userId, type]
    );

    if (results.length === 0) {
      return res.json({ success: true, data: null, message: '未完成此测评' });
    }

    const r = results[0];
    res.json({
      success: true,
      data: {
        id: r.id,
        testType: r.test_type,
        totalScore: r.total_score,
        severity: r.severity,
        answers: r.answers,
        createdAt: r.created_at,
      },
    });
  } catch (error) {
    console.error('获取测评结果错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 获取测评历史
exports.getMyHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const [results] = await db.query(
      `SELECT id, test_type, total_score, severity, created_at FROM screening_results WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('获取测评历史错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};
