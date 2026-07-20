const db = require('../config/database');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'your_default_secret_key_change_this_in_production';

// 认证中间件
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '未提供认证token'
      });
    }

    // 提取Bearer token
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '无效的token格式'
      });
    }

    // 验证 JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (jwtError) {
      console.error('JWT验证错误:', jwtError);
      return res.status(401).json({
        success: false,
        message: '无效或过期的token'
      });
    }

    // 从数据库获取用户最新信息
    const [users] = await db.query(
      'SELECT id, username, email, chat_count, last_login_time, role, deleted_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = users[0];

    // 检查软删除状态
    if (user.deleted_at) {
      const deletedDate = new Date(user.deleted_at);
      const now = new Date();
      const daysSinceDeletion = (now - deletedDate) / (1000 * 60 * 60 * 24);

      if (daysSinceDeletion > 7) {
        return res.status(403).json({
          success: false,
          message: '该账号已注销。如需重新使用，请联系管理员。'
        });
      }

      // 7天宽限期内：自动恢复账号
      await db.query(
        'UPDATE users SET deleted_at = NULL, deleted_reason = NULL WHERE id = ?',
        [user.id]
      );
      user.deleted_at = null;
    }

    // 将用户信息附加到请求对象
    req.user = user;
    next();
  } catch (error) {
    console.error('认证错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = authMiddleware;
