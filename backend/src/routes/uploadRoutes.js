const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');

// 所有路由都需要登录认证
router.use(authMiddleware);

// 上传单张图片
router.post('/single', uploadSingle, handleUploadError, uploadController.uploadSingle);

// 上传多张图片
router.post('/multiple', uploadMultiple, handleUploadError, uploadController.uploadMultiple);

// 删除图片
router.delete('/images/:filename', uploadController.deleteImage);

module.exports = router;
