const db = require('../config/database');

// 创建心情日记
exports.createDiary = async (req, res) => {
  try {
    const user = req.user;
    const { title, content, mood, images, diary_date } = req.body;

    // 验证必填字段
    if (!title || !content || !mood || !diary_date) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的日记信息'
      });
    }

    // 验证心情选项
    const validMoods = ['happy', 'sad', 'anxious', 'angry', 'neutral', 'excited', 'tired', 'calm'];
    if (!validMoods.includes(mood)) {
      return res.status(400).json({
        success: false,
        message: '心情选项无效'
      });
    }

    // 验证内容长度
    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: '日记内容不能超过5000字'
      });
    }

    // 验证标题长度
    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        message: '标题不能超过200字'
      });
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(diary_date)) {
      return res.status(400).json({
        success: false,
        message: '日期格式不正确，请使用 YYYY-MM-DD 格式'
      });
    }

    // 插入日记
    const [result] = await db.query(
      'INSERT INTO mood_diaries (user_id, title, content, mood, images, diary_date) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, title, content, mood, images || null, diary_date]
    );

    // 获取刚创建的日记
    const [diaries] = await db.query(
      'SELECT id, user_id, title, content, mood, images, diary_date, created_at, updated_at FROM mood_diaries WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: '日记创建成功',
      data: {
        diary: diaries[0]
      }
    });

  } catch (error) {
    console.error('创建日记错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取用户日记列表
exports.getDiaries = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10, mood, start_date, end_date, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE user_id = ?';
    const params = [user.id];

    if (mood && mood !== 'all') {
      whereClause += ' AND mood = ?';
      params.push(mood);
    }

    if (start_date) {
      whereClause += ' AND diary_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND diary_date <= ?';
      params.push(end_date);
    }

    // 构建排序条件
    let orderBy = 'ORDER BY created_at DESC';
    if (sort === 'oldest') {
      orderBy = 'ORDER BY created_at ASC';
    } else if (sort === 'date_asc') {
      orderBy = 'ORDER BY diary_date ASC';
    } else if (sort === 'date_desc') {
      orderBy = 'ORDER BY diary_date DESC';
    }

    // 获取日记列表
    const [diaries] = await db.query(
      `SELECT id, user_id, title, content, mood, images, diary_date, created_at, updated_at
       FROM mood_diaries
       ${whereClause}
       ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM mood_diaries ${whereClause}`,
      params
    );

    res.status(200).json({
      success: true,
      data: {
        diaries,
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取日记列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取单个日记详情
exports.getDiaryDetail = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // 获取日记详情
    const [diaries] = await db.query(
      'SELECT id, user_id, title, content, mood, images, diary_date, created_at, updated_at FROM mood_diaries WHERE id = ?',
      [id]
    );

    if (diaries.length === 0) {
      return res.status(404).json({
        success: false,
        message: '日记不存在'
      });
    }

    const diary = diaries[0];

    // 检查权限
    if (diary.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权查看此日记'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        diary
      }
    });

  } catch (error) {
    console.error('获取日记详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 更新日记
exports.updateDiary = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { title, content, mood, images, diary_date } = req.body;

    // 检查日记是否存在
    const [diaries] = await db.query(
      'SELECT user_id FROM mood_diaries WHERE id = ?',
      [id]
    );

    if (diaries.length === 0) {
      return res.status(404).json({
        success: false,
        message: '日记不存在'
      });
    }

    const diary = diaries[0];

    // 检查权限
    if (diary.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权编辑此日记'
      });
    }

    // 构建更新字段
    const updates = [];
    const params = [];

    if (title !== undefined) {
      if (title.length > 200) {
        return res.status(400).json({
          success: false,
          message: '标题不能超过200字'
        });
      }
      updates.push('title = ?');
      params.push(title);
    }

    if (content !== undefined) {
      if (content.length > 5000) {
        return res.status(400).json({
          success: false,
          message: '日记内容不能超过5000字'
        });
      }
      updates.push('content = ?');
      params.push(content);
    }

    if (mood !== undefined) {
      const validMoods = ['happy', 'sad', 'anxious', 'angry', 'neutral', 'excited', 'tired', 'calm'];
      if (!validMoods.includes(mood)) {
        return res.status(400).json({
          success: false,
          message: '心情选项无效'
        });
      }
      updates.push('mood = ?');
      params.push(mood);
    }

    if (images !== undefined) {
      updates.push('images = ?');
      params.push(images);
    }

    if (diary_date !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(diary_date)) {
        return res.status(400).json({
          success: false,
          message: '日期格式不正确，请使用 YYYY-MM-DD 格式'
        });
      }
      updates.push('diary_date = ?');
      params.push(diary_date);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有需要更新的字段'
      });
    }

    // 更新日记
    params.push(id);
    await db.query(
      `UPDATE mood_diaries SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // 获取更新后的日记
    const [updatedDiaries] = await db.query(
      'SELECT id, user_id, title, content, mood, images, diary_date, created_at, updated_at FROM mood_diaries WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: '日记更新成功',
      data: {
        diary: updatedDiaries[0]
      }
    });

  } catch (error) {
    console.error('更新日记错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 删除日记
exports.deleteDiary = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // 检查日记是否存在
    const [diaries] = await db.query(
      'SELECT user_id FROM mood_diaries WHERE id = ?',
      [id]
    );

    if (diaries.length === 0) {
      return res.status(404).json({
        success: false,
        message: '日记不存在'
      });
    }

    const diary = diaries[0];

    // 检查权限
    if (diary.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权删除此日记'
      });
    }

    // 删除日记
    await db.query(
      'DELETE FROM mood_diaries WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: '日记删除成功'
    });

  } catch (error) {
    console.error('删除日记错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取心情统计
exports.getMoodStats = async (req, res) => {
  try {
    const user = req.user;
    const { days = 30 } = req.query;

    // 获取最近N天的心情统计
    const [stats] = await db.query(
      `SELECT 
        mood,
        COUNT(*) as count,
        DATE_FORMAT(created_at, '%Y-%m-%d') as date
       FROM mood_diaries
       WHERE user_id = ? 
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY mood, DATE_FORMAT(created_at, '%Y-%m-%d')
       ORDER BY date DESC, count DESC`,
      [user.id, parseInt(days)]
    );

    // 获取心情总数统计
    const [totalStats] = await db.query(
      `SELECT 
        mood,
        COUNT(*) as count
       FROM mood_diaries
       WHERE user_id = ? 
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY mood
       ORDER BY count DESC`,
      [user.id, parseInt(days)]
    );

    res.status(200).json({
      success: true,
      data: {
        dailyStats: stats,
        totalStats
      }
    });

  } catch (error) {
    console.error('获取心情统计错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};
