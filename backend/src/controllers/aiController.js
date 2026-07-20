const db = require('../config/database');

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// ==================== 危机干预关键词 ====================
const CRISIS_KEYWORDS = [
  '不想活', '想死', '自杀', '自残', '割腕', '跳楼', '跳河', '结束生命',
  '活不下去', '生无可恋', '死了算了', '想结束', '不想存在', '离开这个世界',
  '没有意义活着', '想消失', '自伤', '伤害自己', '结束自己', '一了百了',
  '不想继续', '活够了', '死了一了百了', '怎么死', '安乐死', '寻死',
  '活得太累', '死了就好', '解脱', '想不开',
];

const CRISIS_HOTLINES = [
  { name: '希望24热线', number: '400-161-9995', desc: '24小时心理危机干预' },
  { name: '北京心理危机干预中心', number: '010-82951332', desc: '专业危机干预' },
  { name: '全国心理援助热线', number: '12320', desc: '国家卫生健康热线' },
];

// ==================== 增强版 System Prompt ====================
const SYSTEM_PROMPT = `你是一个专业的心理健康助手，由心理健康专业人士监督设计。你的职责包括：

【核心原则】
1. 使用温暖、同理心的语气，认真倾听用户的感受
2. 提供基于循证心理学的实用建议和情绪调节技巧
3. 从不提供医疗诊断、处方建议或替代专业心理治疗
4. 如果用户表现出危机迹象，优先提供专业求助资源

【安全协议】
- 不鼓励任何形式的自伤、自杀或暴力行为
- 不提供任何可能被用于自伤的具体方法或步骤
- 不强化用户的消极自我认知或绝望感
- 当用户处于危机中时，始终引导至专业帮助
- 避免对敏感话题（如政治、宗教、性别认同等）做出价值判断

【回应风格】
- 先共情，再建议：始终先承认和验证用户的感受
- 使用开放性问题引导用户表达
- 提供具体、可操作的建议而非泛泛而谈
- 适时引入正念、呼吸练习、认知重构等技巧
- 在适当的时候，温和地建议寻求线下专业帮助

请用温暖、同理心的语气回复，帮助用户缓解心理压力，提供实用的心理建议。`;

const CRISIS_SYSTEM_APPENDIX = `\n\n【紧急提醒】用户可能正在经历心理危机。请优先：1) 表达理解和关心 2) 提供以下求助热线：希望24热线 400-161-9995、全国心理援助热线 12320 3) 温和引导用户联系家人或朋友 4) 鼓励寻求专业帮助。不要提供任何具体方法的描述。`;

// ==================== 安全过滤函数 ====================

// 危机检测
function detectCrisis(message) {
  const lowerMsg = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lowerMsg.includes(keyword));
}

// 有害消息模式
const HARMFUL_PATTERNS = [
  /怎么(自杀|自残|割腕|上吊|跳楼).{0,10}(不疼|无痛|快速)/,
  /教我.*(自残|自伤|伤害自己)/,
  /(杀|害死|弄死).{0,5}(别人|他人|他|她)/,
  /具体.*方法.*(自杀|自残|结束生命)/,
];

// 前置过滤
function preFilterMessage(message) {
  const trimmed = message.trim();
  if (trimmed.length === 0) return { blocked: false };
  if (trimmed.length > 2000) return { blocked: true, reason: '消息过长，请精简后发送' };
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { blocked: true, reason: 'message_violation' };
    }
  }
  return { blocked: false };
}

// 后置过滤（AI回复内容检查）
function postFilterResponse(responseText) {
  const concerningPatterns = [
    /你可以(尝试|考虑|选择).{0,10}(自杀|自残|结束生命)/,
    /建议你.*伤害/,
    /没有人在乎你/,
  ];
  let flagged = false;
  for (const pattern of concerningPatterns) {
    if (pattern.test(responseText)) {
      flagged = true;
      break;
    }
  }
  return { flagged, responseText };
}

// ==================== AI对话 - 流式响应 ====================
exports.chat = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const userId = req.user?.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: '请输入消息内容'
      });
    }

    // ---- 安全检测 ----
    let riskFlag = 0;
    const crisisDetected = detectCrisis(message);
    if (crisisDetected) {
      riskFlag = 1;
    }

    const preFilter = preFilterMessage(message);
    if (preFilter.blocked) {
      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const refusalMsg = preFilter.reason === 'message_violation'
        ? '我很抱歉，但我无法回应这个请求。如果你正在经历困难，请拨打心理援助热线：希望24热线 400-161-9995。你并不孤单，总有人愿意帮助你。'
        : preFilter.reason;

      res.write(`data: ${JSON.stringify({ content: refusalMsg })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, fullResponse: refusalMsg })}\n\n`);

      // 保存被拦截的消息
      if (userId) {
        try {
          await db.query(
            'INSERT INTO chat_history (user_id, user_message, ai_response, risk_flag) VALUES (?, ?, ?, ?)',
            [userId, message, refusalMsg, 1]
          );
        } catch {}
      }

      res.end();
      return;
    }

    // ---- 设置 SSE 响应头 ----
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // ---- 危机预警事件 ----
    if (crisisDetected) {
      res.write(`data: ${JSON.stringify({
        type: 'crisis_alert',
        hotlines: CRISIS_HOTLINES,
        message: '我们注意到你可能正在经历困难时刻。请记住，你并不孤单，总有人愿意倾听和帮助你。'
      })}\n\n`);
    }

    // ---- 构建对话上下文 ----
    let systemContent = SYSTEM_PROMPT;
    if (crisisDetected) {
      systemContent += CRISIS_SYSTEM_APPENDIX;
    }

    const messages = [
      { role: 'system', content: systemContent },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    let fullResponse = '';

    try {
      // 调用 DeepSeek V3 API
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API 错误: ${JSON.stringify(errorData)}`);
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              const content = data.choices?.[0]?.delta?.content;

              if (content) {
                fullResponse += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (parseError) {
              console.error('解析 SSE 数据错误:', parseError);
            }
          }
        }
      }

      // ---- 后置过滤 ----
      const postFilter = postFilterResponse(fullResponse);
      if (postFilter.flagged) {
        riskFlag = 1;
        console.warn(`[安全警报] AI回复被标记 - userId: ${userId}, 回复片段: ${fullResponse.substring(0, 100)}`);
      }

      // 发送完成事件
      res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);

      // 保存对话记录到数据库
      if (userId) {
        await db.query(
          'INSERT INTO chat_history (user_id, user_message, ai_response, risk_flag) VALUES (?, ?, ?, ?)',
          [userId, message, fullResponse, riskFlag]
        );

        // 更新用户的对话次数
        await db.query(
          'UPDATE users SET chat_count = chat_count + 1 WHERE id = ?',
          [userId]
        );
      }

    } catch (apiError) {
      console.error('DeepSeek API 调用错误:', apiError);
      res.write(`data: ${JSON.stringify({ error: 'AI服务暂时不可用，请稍后再试' })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }

    res.end();

  } catch (error) {
    console.error('AI对话错误:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }
};

// 情绪分析
exports.analyzeEmotion = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: '请输入要分析的文本'
      });
    }

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个情绪分析专家。请分析用户文本的情绪，并返回JSON格式的结果，包含以下字段：emotion（情绪类型：积极、中性、消极、焦虑、抑郁、愤怒等），confidence（置信度0-1之间的数值），suggestions（3条针对性的建议数组）。'
            },
            {
              role: 'user',
              content: `请分析这段文本的情绪：${text}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API 错误: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      let emotionResult;
      try {
        emotionResult = JSON.parse(content);
      } catch (parseError) {
        emotionResult = {
          emotion: "中性",
          confidence: 0.6,
          suggestions: [
            "继续保持积极的心态",
            "尝试进行深呼吸练习",
            "与朋友分享你的感受"
          ]
        };
      }

      res.status(200).json({
        success: true,
        data: emotionResult
      });

    } catch (apiError) {
      console.error('DeepSeek API 调用错误:', apiError);
      const emotionResult = {
        emotion: "中性",
        confidence: 0.5,
        suggestions: [
          "继续保持积极的心态",
          "尝试进行深呼吸练习",
          "与朋友分享你的感受"
        ]
      };

      res.status(200).json({
        success: true,
        data: emotionResult
      });
    }

  } catch (error) {
    console.error('情绪分析错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取对话历史
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const [history] = await db.query(
      `SELECT id, user_message, ai_response, created_at
       FROM chat_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    res.status(200).json({
      success: true,
      data: {
        history: history.reverse()
      }
    });

  } catch (error) {
    console.error('获取对话历史错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 清空对话历史
exports.clearHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      'DELETE FROM chat_history WHERE user_id = ?',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: '对话历史已清空'
    });

  } catch (error) {
    console.error('清空对话历史错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取所有对话记录（管理员接口）
exports.getAllChatHistory = async (req, res) => {
  try {
    const { userId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT ch.id, ch.user_id, ch.user_message, ch.ai_response, ch.risk_flag, ch.created_at,
             u.username, u.email
      FROM chat_history ch
      LEFT JOIN users u ON ch.user_id = u.id
    `;
    let params = [];

    if (userId) {
      query += ' WHERE ch.user_id = ?';
      params.push(parseInt(userId));
    }

    query += ' ORDER BY ch.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [history] = await db.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM chat_history';
    let countParams = [];
    if (userId) {
      countQuery += ' WHERE user_id = ?';
      countParams.push(parseInt(userId));
    }
    const [countResult] = await db.query(countQuery, countParams);

    res.status(200).json({
      success: true,
      data: {
        history: history.reverse(),
        total: countResult[0].total
      }
    });

  } catch (error) {
    console.error('获取所有对话记录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};
