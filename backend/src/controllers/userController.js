const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const SECRET_KEY = process.env.JWT_SECRET || 'your_default_secret_key_change_this_in_production';

// 生成JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user'
    },
    SECRET_KEY,
    { expiresIn: '7d' }
  );
};

// 用户注册
exports.register = async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '请填写完整信息'
      });
    }

    // 检查邮箱或用户名是否已存在
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已被注册'
      });
    }

    // 使用 bcrypt 对密码进行加密
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 插入新用户
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );

    // 创建返回给前端的新用户对象
    const newUser = {
      id: result.insertId,
      username: username,
      email: email,
      role: role
    };

    // 生成 JWT Token
    const token = jwt.sign(
      {
        id: result.insertId,
        username: username,
        email: email,
        role: role
      },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    // 返回 Token 和用户信息
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: newUser
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请填写用户名和密码'
      });
    }

    // 查询用户（包括 role 字段）
    const [users] = await db.query(
      'SELECT id, username, email, password, role, avatar, chat_count, last_login_time FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const user = users[0];

    // 使用 bcrypt 比较密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成 JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role  // 将 role 信息包含在 token 中
      },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    // 更新最后登录时间
    await db.query(
      'UPDATE users SET last_login_time = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // 返回 Token 和用户信息（包含 role）
    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,  // 这里返回 role 字段
          avatar: user.avatar,
          chat_count: user.chat_count,
          last_login_time: user.last_login_time
        }
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 用户登出
exports.logout = async (req, res) => {
  try {
    // 在无状态 JWT 方案中，客户端删除 Token 即可
    // 可以选择记录登出日志
    res.status(200).json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取用户信息（需要Token验证）
exports.getProfile = async (req, res) => {
  try {
    // 从JWT Token中获取用户信息
    const user = req.user;

    // 从数据库中获取用户最新信息
    const [users] = await db.query(
      'SELECT id, username, email, role, avatar, chat_count, last_login_time, created_at FROM users WHERE id = ?',
      [user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: users[0]
      }
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 修改密码（需要Token验证）
exports.changePassword = async (req, res) => {
  try {
    const user = req.user;
    const { oldPassword, newPassword } = req.body;

    // 验证必填字段
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供原密码和新密码'
      });
    }

    // 获取用户当前密码
    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 使用 bcrypt 验证原密码
    const isPasswordValid = await bcrypt.compare(oldPassword, users[0].password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }

    // 使用 bcrypt 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 更新密码
    await db.query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, user.id]
    );

    res.status(200).json({
      success: true,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 更新用户信息（需要Token验证）
exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { username, email, avatar } = req.body;

    // 检查邮箱或用户名是否已被其他用户使用
    if (username || email) {
      const [existingUsers] = await db.query(
        'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
        [email, username, user.id]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: '用户名或邮箱已被使用'
        });
      }
    }

    // 动态构建更新语句
    const updateFields = [];
    const updateValues = [];

    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      updateValues.push(avatar);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有提供要更新的字段'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(user.id);

    // 更新用户信息
    await db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 获取更新后的用户信息
    const [updatedUsers] = await db.query(
      'SELECT id, username, email, role, avatar, chat_count, updated_at FROM users WHERE id = ?',
      [user.id]
    );

    res.status(200).json({
      success: true,
      message: '更新成功',
      data: {
        user: updatedUsers[0]
      }
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 更新头像（需要Token验证）
exports.updateAvatar = async (req, res) => {
  try {
    const user = req.user;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // 更新用户头像
    await db.query(
      'UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [avatarUrl, user.id]
    );

    // 获取更新后的用户信息
    const [updatedUsers] = await db.query(
      'SELECT id, username, email, role, avatar, chat_count, updated_at FROM users WHERE id = ?',
      [user.id]
    );

    res.status(200).json({
      success: true,
      message: '头像更新成功',
      data: {
        user: updatedUsers[0],
        avatarUrl: avatarUrl
      }
    });

  } catch (error) {
    console.error('更新头像错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// B端：获取用户列表（需要管理员权限）
exports.getUserList = async (req, res) => {
  try {
    // 验证当前用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    const { page = 1, pageSize = 10, keyword = '' } = req.query;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    let whereClause = '1=1';
    let queryParams = [];

    if (keyword) {
      whereClause += ' AND (username LIKE ? OR email LIKE ?)';
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 查询用户列表（不含密码）
    const [users] = await db.query(
      `SELECT 
        id, 
        username, 
        email, 
        chat_count, 
        role, 
        last_login_time, 
        created_at 
      FROM users 
      WHERE ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(pageSize), parseInt(offset)]
    );

    // 查询总用户数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
      queryParams
    );

    res.status(200).json({
      success: true,
      data: {
        users,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(countResult[0].total / pageSize)
      }
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// B端：删除用户（需要管理员权限）
exports.deleteUser = async (req, res) => {
  try {
    // 验证当前用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    const { userId } = req.params;

    // 不允许删除自己
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账号'
      });
    }

    // 检查用户是否存在
    const [users] = await db.query(
      'SELECT id, username FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 删除用户
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.status(200).json({
      success: true,
      message: '用户删除成功'
    });

  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// B端：修改用户身份（需要管理员权限）
exports.updateUserRole = async (req, res) => {
  try {
    // 验证当前用户是否为管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    const { userId } = req.params;
    const { role } = req.body;

    // 验证角色值
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: '无效的角色值'
      });
    }

    // 不允许修改自己的角色
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能修改自己的身份'
      });
    }

    // 检查用户是否存在
    const [users] = await db.query(
      'SELECT id, username, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新用户角色
    await db.query(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [role, userId]
    );

    // 获取更新后的用户信息
    const [updatedUsers] = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: '用户身份修改成功',
      data: {
        user: updatedUsers[0]
      }
    });

  } catch (error) {
    console.error('修改用户身份错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 用户心理评估
exports.getPsychologicalAssessment = async (req, res) => {
  try {
    const { userId } = req.params;

    // 验证用户存在
    const [users] = await db.query(
      'SELECT id, username, email FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = users[0];

    // 最近3天（含今天）
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const dayList = [];
    for (let i = 2; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      dayList.push({
        date,
        key: formatDate(date)
      });
    }

    // 每日采样：AI对话3条、树洞3条、日记1篇
    const chatHistory = [];
    const soulCavePosts = [];
    const diaries = [];

    for (const day of dayList) {
      const [dailyChats] = await db.query(
        `SELECT id, user_message, ai_response, created_at
         FROM chat_history
         WHERE user_id = ? AND DATE(created_at) = ?
         ORDER BY created_at DESC
         LIMIT 3`,
        [userId, day.key]
      );

      const [dailyPosts] = await db.query(
        `SELECT id, content, emotion, created_at
         FROM soul_cave_posts
         WHERE user_id = ? AND DATE(created_at) = ?
         ORDER BY created_at DESC
         LIMIT 3`,
        [userId, day.key]
      );

      const [dailyDiaries] = await db.query(
        `SELECT id, title, content, mood, diary_date, created_at
         FROM mood_diaries
         WHERE user_id = ? AND diary_date = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, day.key]
      );

      chatHistory.push(...dailyChats);
      soulCavePosts.push(...dailyPosts);
      diaries.push(...dailyDiaries);
    }

    const totalRecords = chatHistory.length + soulCavePosts.length + diaries.length;

    if (totalRecords === 0) {
      return res.status(200).json({
        success: false,
        message: '用户最近3天未进行活动，暂无法评估'
      });
    }

    // 情绪关键词配置
    const emotionKeywords = {
      positive: ['开心', '高兴', '快乐', '幸福', '愉快', '喜悦', '兴奋', '满意', '美好', '感谢', '棒', '赞', '优秀', '爱', '喜欢', '期待', '温暖', '舒适', '轻松', '平静', '感恩', '希望', '加油', '哈哈', '真好', '不错', '完美'],
      negative: ['难过', '伤心', '痛苦', '沮丧', '绝望', '焦虑', '担心', '害怕', '恐惧', '愤怒', '生气', '烦躁', '郁闷', '压抑', '疲惫', '累', '无聊', '寂寞', '孤独', '迷茫', '无奈', '遗憾', '失望', '委屈', '烦恼', '压力', '紧张'],
      neutral: ['一般', '还行', '平常', '普通', '还好', '无所谓', '随缘']
    };

    const moodEmotionMap = {
      happy: 'positive',
      excited: 'positive',
      calm: 'positive',
      sad: 'negative',
      anxious: 'negative',
      angry: 'negative',
      tired: 'negative',
      neutral: 'neutral'
    };

    const analyzeTextEmotion = (text, fallbackMood) => {
      const sourceText = String(text || '');
      let positive = 0;
      let negative = 0;
      let neutral = 0;

      for (const word of emotionKeywords.positive) {
        if (sourceText.includes(word)) positive++;
      }
      for (const word of emotionKeywords.negative) {
        if (sourceText.includes(word)) negative++;
      }
      for (const word of emotionKeywords.neutral) {
        if (sourceText.includes(word)) neutral++;
      }

      if (positive > negative && positive > neutral) return 'positive';
      if (negative > positive && negative > neutral) return 'negative';

      if (fallbackMood && moodEmotionMap[fallbackMood]) {
        return moodEmotionMap[fallbackMood];
      }

      return 'neutral';
    };

    const getTimeWeight = (createdAt) => {
      const now = new Date();
      const created = new Date(createdAt);
      const daysDiff = Math.floor((now - created) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 0) return 1.5;
      if (daysDiff === 1) return 1.2;
      return 1.0;
    };

    let totalScore = 0;
    let totalWeight = 0;
    const emotionDetails = [];

    for (const chat of chatHistory) {
      const emotion = analyzeTextEmotion(`${chat.user_message || ''} ${chat.ai_response || ''}`);
      const weight = getTimeWeight(chat.created_at);
      totalWeight += weight;
      totalScore += (emotion === 'positive' ? 80 : emotion === 'negative' ? 40 : 60) * weight;
      emotionDetails.push({ type: 'chat', emotion, created_at: chat.created_at });
    }

    for (const post of soulCavePosts) {
      const emotion = analyzeTextEmotion(post.content, post.emotion);
      const weight = getTimeWeight(post.created_at);
      totalWeight += weight;
      totalScore += (emotion === 'positive' ? 80 : emotion === 'negative' ? 40 : 60) * weight;
      emotionDetails.push({ type: 'post', emotion, created_at: post.created_at });
    }

    for (const diary of diaries) {
      const emotion = analyzeTextEmotion(`${diary.title || ''} ${diary.content || ''}`, diary.mood);
      const weight = getTimeWeight(diary.created_at || diary.diary_date);
      totalWeight += weight;
      totalScore += (emotion === 'positive' ? 80 : emotion === 'negative' ? 40 : 60) * weight;
      emotionDetails.push({ type: 'diary', emotion, created_at: diary.created_at || diary.diary_date });
    }

    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 60;

    let emotionStatus = '平稳 / 偏中性';
    let suggestion = '保持心情记录，适当放松，及时疏导情绪。';
    if (finalScore >= 75) {
      emotionStatus = '积极向上';
      suggestion = '整体状态良好，建议保持规律作息与积极社交。';
    } else if (finalScore < 45) {
      emotionStatus = '偏低落 / 需关注';
      suggestion = '建议优先休息与减压，必要时及时寻求专业心理支持。';
    }

    const emotionCount = { positive: 0, negative: 0, neutral: 0 };
    for (const item of emotionDetails) {
      emotionCount[item.emotion]++;
    }

    const dayEmotionBuckets = dayList.reduce((acc, day) => {
      acc[day.key] = { positive: 0, negative: 0, neutral: 0 };
      return acc;
    }, {});

    for (const item of emotionDetails) {
      const key = formatDate(new Date(item.created_at));
      if (dayEmotionBuckets[key]) {
        dayEmotionBuckets[key][item.emotion] += 1;
      }
    }

    const emotionLabelMap = {
      positive: '正面',
      negative: '负面',
      neutral: '中性'
    };

    const trendText = dayList
      .map((day) => {
        const bucket = dayEmotionBuckets[day.key];
        const dominant =
          bucket.positive >= bucket.negative && bucket.positive >= bucket.neutral
            ? 'positive'
            : bucket.negative >= bucket.positive && bucket.negative >= bucket.neutral
              ? 'negative'
              : 'neutral';
        return `${day.key.slice(5)} ${emotionLabelMap[dominant]}`;
      })
      .join(' -> ');

    const sampleNote = totalRecords < 4 ? '\n样本说明：最近3天数据较少，结果仅供参考。' : '';

    const report = `【AI 心理健康评估报告】
评估对象：${user.username}
评估周期：最近 3 天
情绪趋势：${trendText}
情绪状态：${emotionStatus}
综合评分：${finalScore}/100
建议：${suggestion}
  ${sampleNote}

温馨提示：本结果仅基于日常记录分析，不作心理医学诊断。`;

    res.status(200).json({
      success: true,
      data: {
        report,
        score: finalScore,
        emotionStatus,
        suggestion,
        details: {
          chatCount: chatHistory.length,
          postCount: soulCavePosts.length,
          diaryCount: diaries.length,
          totalSamples: totalRecords,
          emotionCount,
          trend: trendText
        }
      }
    });

  } catch (error) {
    console.error('获取心理评估错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取仪表盘统计数据
exports.getDashboardData = async (req, res) => {
  try {
    // 获取总用户数
    const [userCountResult] = await db.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = userCountResult[0].total;

    // 获取本月新增用户数
    const [newUsersResult] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())'
    );
    const newUsersThisMonth = newUsersResult[0].count;

    // 获取树洞发言总数
    const [postCountResult] = await db.query('SELECT COUNT(*) as total FROM soul_cave_posts');
    const totalPosts = postCountResult[0].total;

    // 获取心情日记总数
    const [diaryCountResult] = await db.query('SELECT COUNT(*) as total FROM mood_diaries');
    const totalDiaries = diaryCountResult[0].total;

    // 获取AI对话总次数（从users表的chat_count）
    const [chatCountResult] = await db.query('SELECT COALESCE(SUM(chat_count), 0) as total FROM users');
    const totalChats = chatCountResult[0].total;

    // 获取情绪分布（从心情日记）
    const [moodStats] = await db.query(
      `SELECT mood, COUNT(*) as count FROM mood_diaries GROUP BY mood`
    );

    let positive = 0, negative = 0, neutral = 0;
    moodStats.forEach(item => {
      if (['happy', 'excited', 'calm'].includes(item.motion)) {
        positive += item.count;
      } else if (['sad', 'anxious', 'angry', 'tired'].includes(item.mood)) {
        negative += item.count;
      } else {
        neutral += item.count;
      }
    });

    // 生成近30天的每日统计数据
    const days = parseInt(req.query.days) || 30;
    const dailyStats = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // 每日新增用户
      const [newUsers] = await db.query(
        `SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?`,
        [dateStr]
      );

      // 每日树洞发言
      const [posts] = await db.query(
        `SELECT COUNT(*) as count FROM soul_cave_posts WHERE DATE(created_at) = ?`,
        [dateStr]
      );

      // 每日心情日记
      const [diaries] = await db.query(
        `SELECT COUNT(*) as count FROM mood_diaries WHERE DATE(diary_date) = ?`,
        [dateStr]
      );

      dailyStats.push({
        date: dateStr,
        users: newUsers[0].count,
        chats: 0,
        posts: posts[0].count,
        diaries: diaries[0].count
      });
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          newUsersThisMonth,
          activeUsersToday: dailyStats[dailyStats.length - 1]?.users || 0,
          activeUsersThisWeek: dailyStats.slice(-7).reduce((sum, d) => sum + d.users, 0),
          activeUsersThisMonth: dailyStats.reduce((sum, d) => sum + d.users, 0),
          totalChats,
          totalPosts,
          totalDiaries
        },
        dailyStats,
        emotionDistribution: {
          positive,
          negative,
          neutral
        }
      }
    });
  } catch (error) {
    console.error('获取仪表盘数据错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取每日统计数据
exports.getDailyStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dailyStats = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const [newUsers] = await db.query(
        `SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?`,
        [dateStr]
      );

      const [posts] = await db.query(
        `SELECT COUNT(*) as count FROM soul_cave_posts WHERE DATE(created_at) = ?`,
        [dateStr]
      );

      const [diaries] = await db.query(
        `SELECT COUNT(*) as count FROM mood_diaries WHERE DATE(diary_date) = ?`,
        [dateStr]
      );

      dailyStats.push({
        date: dateStr,
        users: newUsers[0].count,
        chats: 0,
        posts: posts[0].count,
        diaries: diaries[0].count
      });
    }

    res.json({
      success: true,
      data: dailyStats
    });
  } catch (error) {
    console.error('获取每日统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取用户状态列表
exports.getUserStatus = async (req, res) => {
  try {
    // 获取所有用户的基本信息
    const [users] = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.avatar,
        u.chat_count,
        u.last_login_time,
        u.created_at,
        (SELECT mood FROM mood_diaries WHERE user_id = u.id ORDER BY diary_date DESC LIMIT 1) as latest_mood,
        (SELECT diary_date FROM mood_diaries WHERE user_id = u.id ORDER BY diary_date DESC LIMIT 1) as latest_diary_date,
        (SELECT COUNT(*) FROM soul_cave_posts WHERE user_id = u.id) as post_count,
        (SELECT COUNT(*) FROM mood_diaries WHERE user_id = u.id) as diary_count
      FROM users u
      WHERE u.role = 'user'
      ORDER BY u.last_login_time DESC
    `);

    // 心情标签映射
    const moodLabels = {
      'happy': '开心',
      'sad': '伤心',
      'anxious': '焦虑',
      'angry': '愤怒',
      'neutral': '平静',
      'excited': '兴奋',
      'tired': '疲惫',
      'calm': '平和'
    };

    // 心情颜色映射
    const moodColors = {
      'happy': '#67C23A',
      'sad': '#409EFF',
      'anxious': '#E6A23C',
      'angry': '#F56C6C',
      'neutral': '#909399',
      'excited': '#F56C6C',
      'tired': '#909399',
      'calm': '#67C23A'
    };

    // 处理用户数据
    const userStatusList = users.map(user => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      chatCount: user.chat_count || 0,
      lastLoginTime: user.last_login_time,
      createdAt: user.created_at,
      latestMood: user.latest_mood || 'neutral',
      moodLabel: moodLabels[user.latest_mood] || '未知',
      moodColor: moodColors[user.latest_mood] || '#909399',
      latestDiaryDate: user.latest_diary_date,
      postCount: user.post_count || 0,
      diaryCount: user.diary_count || 0
    }));

    // 统计数据
    const totalUsers = users.length;
    const activeUsers = users.filter(u => {
      if (!u.last_login_time) return false;
      const lastLogin = new Date(u.last_login_time);
      const now = new Date();
      const diffDays = (now - lastLogin) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }).length;

    const moodStats = {
      happy: users.filter(u => u.latest_mood === 'happy').length,
      sad: users.filter(u => u.latest_mood === 'sad').length,
      anxious: users.filter(u => u.latest_mood === 'anxious').length,
      neutral: users.filter(u => u.latest_mood === 'neutral' || !u.latest_mood).length,
      other: users.filter(u => ['angry', 'excited', 'tired', 'calm'].includes(u.latest_mood)).length
    };

    res.json({
      success: true,
      data: {
        users: userStatusList,
        stats: {
          totalUsers,
          activeUsers,
          moodStats
        }
      }
    });
  } catch (error) {
    console.error('获取用户状态错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

