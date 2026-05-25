const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

// AI对话路由
router.post('/chat', authMiddleware, aiController.chat);
router.post('/emotion', authMiddleware, aiController.analyzeEmotion);
router.get('/history', authMiddleware, aiController.getHistory);
router.delete('/history', authMiddleware, aiController.clearHistory);

// 管理员路由
router.get('/admin/all-history', authMiddleware, aiController.getAllChatHistory);

module.exports = router;
