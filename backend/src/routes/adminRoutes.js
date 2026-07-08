const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const mbtiController = require('../controllers/mbtiController');
const authMiddleware = require('../middleware/auth');

// 获取用户列表（需要管理员权限）
router.get('/users', authMiddleware, userController.getUserList);

// 删除用户（需要管理员权限）
router.delete('/users/:userId', authMiddleware, userController.deleteUser);

// 修改用户身份（需要管理员权限）
router.put('/users/:userId/role', authMiddleware, userController.updateUserRole);

// 获取用户心理评估（需要管理员权限）
router.get('/users/:userId/assessment', authMiddleware, userController.getPsychologicalAssessment);

// 获取仪表盘数据统计（需要管理员权限）
router.get('/dashboard', authMiddleware, userController.getDashboardData);

// 获取每日统计数据（需要管理员权限）
router.get('/dashboard/daily', authMiddleware, userController.getDailyStats);

// 获取用户状态列表（需要管理员权限）
router.get('/user-status', authMiddleware, userController.getUserStatus);

// MBTI管理 - 获取所有用户MBTI结果（需要管理员权限）
router.get('/mbti/users', authMiddleware, mbtiController.getAllUserResults);

// MBTI管理 - 获取类型分布统计（需要管理员权限）
router.get('/mbti/distribution', authMiddleware, mbtiController.getTypeDistribution);

// MBTI管理 - 获取单个用户MBTI详情（需要管理员权限）
router.get('/mbti/users/:userId', authMiddleware, mbtiController.getUserMbtiDetail);

module.exports = router;
