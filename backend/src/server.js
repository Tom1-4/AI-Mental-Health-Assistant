require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./config/database');

// 导入路由
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const soulCaveRoutes = require('./routes/soulCaveRoutes');
const moodDiaryRoutes = require('./routes/moodDiaryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const mbtiRoutes = require('./routes/mbtiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务 - 提供上传的图片访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// SSE 中间件 - 禁用响应超时
app.use('/api/ai/chat', (req, res, next) => {
  res.setTimeout(0); // 禁用超时
  next();
});

// 路由
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/soulcave', soulCaveRoutes);
app.use('/api/mood', moodDiaryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/mbti', mbtiRoutes);

// 测试数据库连接
db.getConnection((err, connection) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    return;
  }
  console.log('数据库连接成功');
  connection.release();
});

// 根路由
app.get('/', (req, res) => {
  res.json({ 
    message: '欢迎使用AI心理健康助手API',
    version: '1.0.0'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
