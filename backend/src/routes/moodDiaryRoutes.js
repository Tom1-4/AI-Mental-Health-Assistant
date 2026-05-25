const express = require('express');
const router = express.Router();
const moodDiaryController = require('../controllers/moodDiaryController');
const authMiddleware = require('../middleware/auth');

// 所有路由都需要登录认证
router.use(authMiddleware);

// 创建心情日记
router.post('/diaries', moodDiaryController.createDiary);

// 获取用户日记列表
router.get('/diaries', moodDiaryController.getDiaries);

// 获取单个日记详情
router.get('/diaries/:id', moodDiaryController.getDiaryDetail);

// 更新日记
router.put('/diaries/:id', moodDiaryController.updateDiary);

// 删除日记
router.delete('/diaries/:id', moodDiaryController.deleteDiary);

// 获取心情统计
router.get('/diaries/stats/mood', moodDiaryController.getMoodStats);

module.exports = router;
