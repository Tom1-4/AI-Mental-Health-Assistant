const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// 用户注册
router.post('/register', userController.register);

// 用户登录
router.post('/login', userController.login);

// 用户登出（需要认证）
router.post('/logout', authMiddleware, userController.logout);

// 获取用户信息（需要认证）
router.get('/profile', authMiddleware, userController.getProfile);

// 更新用户信息（需要认证）
router.put('/profile', authMiddleware, userController.updateProfile);

// 修改密码（需要认证）
router.put('/password', authMiddleware, userController.changePassword);

// 更新头像（需要认证）
router.post('/avatar', authMiddleware, userController.updateAvatar);

module.exports = router;
