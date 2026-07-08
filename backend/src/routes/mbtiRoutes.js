const express = require('express');
const router = express.Router();
const mbtiController = require('../controllers/mbtiController');
const authMiddleware = require('../middleware/auth');

// 所有MBTI路由都需要认证
router.use(authMiddleware);

// 获取测试题目
router.get('/questions', mbtiController.getQuestions);

// 提交测试
router.post('/submit', mbtiController.submitTest);

// 获取当前用户的测试结果
router.get('/result', mbtiController.getMyResult);

// 获取当前用户的测试历史
router.get('/history', mbtiController.getMyHistory);

module.exports = router;
