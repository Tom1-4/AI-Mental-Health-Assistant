const path = require('path');

// 获取图片URL
const getImageUrl = (filename) => {
  // 在实际生产环境中，这里应该返回对象存储的URL
  // 例如: https://oss.example.com/images/filename.jpg
  return `/uploads/images/${filename}`;
};

// 上传单张图片
exports.uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const imageUrl = getImageUrl(req.file.filename);

    res.status(200).json({
      success: true,
      message: '上传成功',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('上传图片错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 上传多张图片
exports.uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const images = req.files.map(file => ({
      url: getImageUrl(file.filename),
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.status(200).json({
      success: true,
      message: '上传成功',
      data: {
        images,
        count: images.length
      }
    });

  } catch (error) {
    console.error('上传图片错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 删除图片
exports.deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '../../uploads/images', filename);

    // 检查文件是否存在
    if (fs.existsSync(filePath)) {
      // 删除文件
      fs.unlinkSync(filePath);
      res.status(200).json({
        success: true,
        message: '删除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

  } catch (error) {
    console.error('删除图片错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};
