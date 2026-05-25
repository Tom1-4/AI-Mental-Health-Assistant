const express = require('express');
const router = express.Router();
const soulCaveController = require('../controllers/soulCaveController');
const authMiddleware = require('../middleware/auth');

// 所有路由都需要登录认证
router.use(authMiddleware);

// 获取单个帖子详情（必须放在 /posts 前面）
router.get('/posts/:id', soulCaveController.getPostDetail);

// 发布心灵树洞帖子
router.post('/posts', soulCaveController.createPost);

// 获取帖子列表
router.get('/posts', soulCaveController.getPosts);

// 删除帖子
router.delete('/posts/:id', soulCaveController.deletePost);

// 点赞帖子或评论
router.post('/like', soulCaveController.likeItem);

// 添加评论
router.post('/comments', soulCaveController.addComment);

// 获取帖子评论列表
router.get('/comments/:id', soulCaveController.getComments);

// 删除评论
router.delete('/comments/:id', soulCaveController.deleteComment);

module.exports = router;
