const express = require('express');
const router = express.Router();
const screeningController = require('../controllers/screeningController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// 获取量表题目
router.get('/questions', screeningController.getQuestions);

// 提交测评
router.post('/submit', screeningController.submitTest);

// 获取最新测评结果
router.get('/result', screeningController.getMyResult);

// 获取测评历史
router.get('/history', screeningController.getMyHistory);

module.exports = router;
