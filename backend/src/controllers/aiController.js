const db = require('../config/database');

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// AI对话 - 流式响应
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

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 构建对话上下文
    const messages = [
      {
        role: 'system',
        content: '你是一个专业的心理健康助手，擅长倾听、理解和给予情感支持。请用温暖、同理心的语气回复，帮助用户缓解心理压力，提供实用的心理建议。'
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
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
                // 发送 SSE 事件
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (parseError) {
              console.error('解析 SSE 数据错误:', parseError);
            }
          }
        }
      }

      // 发送完成事件
      res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);

      // 保存对话记录到数据库并更新对话次数
      if (userId) {
        await db.query(
          'INSERT INTO chat_history (user_id, user_message, ai_response) VALUES (?, ?, ?)',
          [userId, message, fullResponse]
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
      // 使用 DeepSeek API 进行情绪分析
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

      // 尝试解析 JSON 结果
      let emotionResult;
      try {
        emotionResult = JSON.parse(content);
      } catch (parseError) {
        // 如果解析失败，返回默认结果
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
      // 返回模拟结果作为降级处理
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
        history: history.reverse() // 按时间正序返回
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
      SELECT ch.id, ch.user_id, ch.user_message, ch.ai_response, ch.created_at,
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
