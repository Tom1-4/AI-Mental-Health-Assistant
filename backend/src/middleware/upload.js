const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名: prefix_timestamp_extension
    const prefix = req.user?.id || 'anonymous';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${prefix}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的图片类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的图片格式，仅支持 JPG、PNG、WebP、GIF'), false);
  }
};

// 配置 multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制单文件大小为 5MB
    files: 10 // 限制最多上传 10 个文件
  }
});

// 单文件上传中间件
exports.uploadSingle = upload.single('file');

// 多文件上传中间件
exports.uploadMultiple = upload.array('files', 10);

// 处理 multer 错误
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer 错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大 5MB）'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超过限制（最多 10 个）'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: '意外的文件字段名'
      });
    }
  } else if (err) {
    // 其他错误
    return res.status(400).json({
      success: false,
      message: err.message || '文件上传失败'
    });
  }
  next();
};
