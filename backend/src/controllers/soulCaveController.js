const db = require('../config/database');

// 发布心灵树洞帖子
exports.createPost = async (req, res) => {
  try {
    const user = req.user;
    const { content, emotion, anonymous_name, is_anonymous = true } = req.body;

    // 验证必填字段
    if (!content) {
      return res.status(400).json({
        success: false,
        message: '请填写帖子内容'
      });
    }

    // 验证内容长度
    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: '帖子内容不能超过2000字'
      });
    }

    // 如果是匿名发布，需要匿名昵称
    if (is_anonymous && !anonymous_name) {
      return res.status(400).json({
        success: false,
        message: '匿名发布需要提供匿名昵称'
      });
    }

    // 插入帖子
    const [result] = await db.query(
      'INSERT INTO soul_cave_posts (user_id, anonymous_name, content, emotion, is_anonymous) VALUES (?, ?, ?, ?, ?)',
      [user.id, anonymous_name, content, emotion, is_anonymous ? 1 : 0]
    );

    // 获取刚创建的帖子
    const [posts] = await db.query(
      'SELECT id, user_id, anonymous_name, content, emotion, likes_count, comments_count, is_anonymous, created_at FROM soul_cave_posts WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: '发布成功',
      data: {
        post: posts[0]
      }
    });

  } catch (error) {
    console.error('发布帖子错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取帖子列表
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, emotion, sort = 'newest' } = req.query;
    const user = req.user;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (emotion && emotion !== 'all') {
      whereClause += ' AND emotion = ?';
      params.push(emotion);
    }

    // 构建排序条件
    let orderBy = 'ORDER BY p.created_at DESC';
    if (sort === 'hottest') {
      orderBy = 'ORDER BY p.likes_count DESC, p.created_at DESC';
    } else if (sort === 'latest') {
      orderBy = 'ORDER BY p.created_at ASC';
    }

    // 获取帖子列表
    const [posts] = await db.query(
      `SELECT
        p.id,
        p.user_id,
        p.anonymous_name,
        p.content,
        p.emotion,
        p.likes_count,
        p.comments_count,
        p.is_anonymous,
        p.created_at,
        u.avatar,
        u.username
      FROM soul_cave_posts p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM soul_cave_posts p ${whereClause}`,
      params
    );

    // 获取当前用户对这些帖子的点赞状态
    const [likedPosts] = await db.query(
      `SELECT target_id FROM soul_cave_likes
       WHERE user_id = ? AND target_type = 'post' AND target_id IN (?)`,
      [user.id, posts.map(p => p.id)]
    );

    const likedPostIds = likedPosts.map(l => l.target_id);

    res.status(200).json({
      success: true,
      data: {
        posts,
        likedPostIds,
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取单个帖子详情（包含评论）
exports.getPostDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 获取帖子详情
    const [posts] = await db.query(
      `SELECT
        p.id,
        p.user_id,
        p.anonymous_name,
        p.content,
        p.emotion,
        p.likes_count,
        p.comments_count,
        p.is_anonymous,
        p.created_at,
        u.avatar,
        u.username
      FROM soul_cave_posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    // 获取评论列表
    const [comments] = await db.query(
      `SELECT
        c.id,
        c.post_id,
        c.user_id,
        c.anonymous_name,
        c.content,
        c.likes_count,
        c.is_anonymous,
        c.created_at,
        u.avatar,
        u.username
      FROM soul_cave_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC`,
      [id]
    );

    // 检查当前用户是否点赞了帖子
    const [postLike] = await db.query(
      'SELECT id FROM soul_cave_likes WHERE user_id = ? AND target_id = ? AND target_type = ?',
      [user.id, id, 'post']
    );
    const isPostLiked = postLike.length > 0;

    // 获取当前用户对这些评论的点赞状态
    let likedCommentIds = [];
    if (comments.length > 0) {
      const [likedComments] = await db.query(
        `SELECT target_id FROM soul_cave_likes
         WHERE user_id = ? AND target_type = 'comment' AND target_id IN (?)`,
        [user.id, comments.map(c => c.id)]
      );
      likedCommentIds = likedComments.map(l => l.target_id);
    }

    res.status(200).json({
      success: true,
      data: {
        post: posts[0],
        comments,
        likedPostId: isPostLiked ? id : null,
        likedCommentIds
      }
    });

  } catch (error) {
    console.error('获取帖子详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 点赞帖子或评论
exports.likeItem = async (req, res) => {
  try {
    const user = req.user;
    const { target_id, target_type } = req.body;

    // 验证参数
    if (!target_id || !target_type) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    if (!['post', 'comment'].includes(target_type)) {
      return res.status(400).json({
        success: false,
        message: '目标类型错误'
      });
    }

    // 检查是否已经点赞
    const [existing] = await db.query(
      'SELECT id FROM soul_cave_likes WHERE user_id = ? AND target_id = ? AND target_type = ?',
      [user.id, target_id, target_type]
    );

    if (existing.length > 0) {
      // 取消点赞
      await db.query(
        'DELETE FROM soul_cave_likes WHERE user_id = ? AND target_id = ? AND target_type = ?',
        [user.id, target_id, target_type]
      );

      // 更新点赞数
      const tableName = target_type === 'post' ? 'soul_cave_posts' : 'soul_cave_comments';
      await db.query(
        `UPDATE ${tableName} SET likes_count = likes_count - 1 WHERE id = ?`,
        [target_id]
      );

      return res.status(200).json({
        success: true,
        message: '取消点赞成功',
        data: {
          liked: false
        }
      });
    }

    // 添加点赞
    await db.query(
      'INSERT INTO soul_cave_likes (user_id, target_id, target_type) VALUES (?, ?, ?)',
      [user.id, target_id, target_type]
    );

    // 更新点赞数
    const tableName = target_type === 'post' ? 'soul_cave_posts' : 'soul_cave_comments';
    await db.query(
      `UPDATE ${tableName} SET likes_count = likes_count + 1 WHERE id = ?`,
      [target_id]
    );

    res.status(200).json({
      success: true,
      message: '点赞成功',
      data: {
        liked: true
      }
    });

  } catch (error) {
    console.error('点赞操作错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 添加评论
exports.addComment = async (req, res) => {
  try {
    const user = req.user;
    const { post_id, content, anonymous_name, is_anonymous = true } = req.body;

    // 验证必填字段
    if (!post_id || !content) {
      return res.status(400).json({
        success: false,
        message: '请填写帖子ID和评论内容'
      });
    }

    // 验证评论长度
    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能超过500字'
      });
    }

    // 检查帖子是否存在
    const [posts] = await db.query(
      'SELECT id FROM soul_cave_posts WHERE id = ?',
      [post_id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    // 如果是匿名评论，需要匿名昵称
    if (is_anonymous && !anonymous_name) {
      return res.status(400).json({
        success: false,
        message: '匿名评论需要提供匿名昵称'
      });
    }

    // 插入评论
    const [result] = await db.query(
      'INSERT INTO soul_cave_comments (post_id, user_id, anonymous_name, content, is_anonymous) VALUES (?, ?, ?, ?, ?)',
      [post_id, user.id, anonymous_name, content, is_anonymous ? 1 : 0]
    );

    // 更新帖子的评论数
    await db.query(
      'UPDATE soul_cave_posts SET comments_count = comments_count + 1 WHERE id = ?',
      [post_id]
    );

    // 获取刚创建的评论
    const [comments] = await db.query(
      `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.anonymous_name,
        c.content,
        c.likes_count,
        c.is_anonymous,
        c.created_at,
        u.avatar,
        u.username
      FROM soul_cave_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: '评论成功',
      data: {
        comment: comments[0]
      }
    });

  } catch (error) {
    console.error('添加评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 删除帖子
exports.deletePost = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // 检查帖子是否存在
    const [posts] = await db.query(
      'SELECT user_id FROM soul_cave_posts WHERE id = ?',
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '帖子不存在'
      });
    }

    const post = posts[0];

    // 检查权限
    if (post.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权删除此帖子'
      });
    }

    // 删除帖子（会级联删除相关评论）
    await db.query(
      'DELETE FROM soul_cave_posts WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: '删除成功'
    });

  } catch (error) {
    console.error('删除帖子错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取帖子的评论列表
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 获取评论列表
    const [comments] = await db.query(
      `SELECT
        c.id,
        c.post_id,
        c.user_id,
        c.anonymous_name,
        c.content,
        c.likes_count,
        c.is_anonymous,
        c.created_at,
        u.avatar,
        u.username
      FROM soul_cave_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC`,
      [id]
    );

    // 获取当前用户对这些评论的点赞状态
    let likedCommentIds = [];
    if (comments.length > 0) {
      const [likedComments] = await db.query(
        `SELECT target_id FROM soul_cave_likes
         WHERE user_id = ? AND target_type = 'comment' AND target_id IN (?)`,
        [user.id, comments.map(c => c.id)]
      );
      likedCommentIds = likedComments.map(l => l.target_id);
    }

    res.status(200).json({
      success: true,
      data: {
        comments,
        likedCommentIds
      }
    });

  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 删除评论
exports.deleteComment = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // 检查评论是否存在
    const [comments] = await db.query(
      'SELECT post_id, user_id FROM soul_cave_comments WHERE id = ?',
      [id]
    );

    if (comments.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    const comment = comments[0];

    // 检查权限
    if (comment.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权删除此评论'
      });
    }

    // 删除评论
    await db.query(
      'DELETE FROM soul_cave_comments WHERE id = ?',
      [id]
    );

    // 更新帖子的评论数
    await db.query(
      'UPDATE soul_cave_posts SET comments_count = comments_count - 1 WHERE id = ?',
      [comment.post_id]
    );

    res.status(200).json({
      success: true,
      message: '删除成功'
    });

  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};
