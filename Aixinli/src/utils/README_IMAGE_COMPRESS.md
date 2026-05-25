# 图片上传和压缩功能说明

## 功能概述

本系统实现了前端图片压缩和服务器上传的完整流程,确保性能优化和用户体验。

## 架构说明

### 1. 图片压缩工具 (`src/utils/imageCompress.ts`)

提供以下功能:

- `compressImage()` - 压缩单张图片
- `compressImageToBase64()` - 压缩并转换为Base64
- `compressImages()` - 批量压缩图片
- `getImageInfo()` - 获取图片信息(尺寸、大小)
- `formatFileSize()` - 格式化文件大小显示

**压缩参数:**
```typescript
{
  maxWidth: 1920,      // 最大宽度
  maxHeight: 1080,     // 最大高度
  quality: 0.8,        // 压缩质量 (0-1)
  type: 'image/jpeg'    // 输出格式
}
```

### 2. 图片上传服务 (`src/services/upload.ts`)

提供以下API接口:

- `uploadSingleImage(file)` - 上传单张图片
- `uploadMultipleImages(files)` - 上传多张图片
- `deleteImage(filename)` - 删除图片

### 3. 心情日记服务 (`src/services/moodDiary.ts`)

处理日记相关的API调用。

## 完整流程

### 创建日记流程

```
用户选择图片
    ↓
前端压缩图片 (maxWidth: 1920, maxHeight: 1080, quality: 0.8)
    ↓
显示压缩进度和节省空间
    ↓
上传压缩后的图片到服务器 (POST /api/upload/multiple)
    ↓
获取图片URL
    ↓
提交日记数据 (POST /api/mood/diaries)
    ↓
完成
```

### 编辑日记流程

```
打开编辑对话框
    ↓
加载已有图片(显示预览)
    ↓
用户可以:
  - 添加新图片(压缩→上传)
  - 删除图片
  - 修改其他内容
    ↓
提交更新 (PUT /api/mood/diaries/:id)
    ↓
完成
```

## API接口说明

### 上传接口

#### 上传单张图片
```
POST /api/upload/single
Content-Type: multipart/form-data
Authorization: Bearer <token>

请求: FormData { file: File }
响应: { success: true, data: { url: string, ... } }
```

#### 上传多张图片
```
POST /api/upload/multiple
Content-Type: multipart/form-data
Authorization: Bearer <token>

请求: FormData { files: File[] }
响应: { success: true, data: { images: [...], count: number } }
```

#### 删除图片
```
DELETE /api/upload/images/:filename
Authorization: Bearer <token>
```

### 日记接口

#### 创建日记
```
POST /api/mood/diaries
Authorization: Bearer <token>
Content-Type: application/json

请求体:
{
  "title": "标题",
  "content": "内容",
  "mood": "happy",
  "images": "/uploads/images/1_123.jpg,/uploads/images/1_124.jpg",
  "diary_date": "2026-03-26"
}
```

#### 更新日记
```
PUT /api/mood/diaries/:id
Authorization: Bearer <token>
Content-Type: application/json

请求体: (所有字段可选)
{
  "title": "新标题",
  "content": "新内容",
  ...
}
```

## 压缩效果示例

| 原始图片 | 压缩后 | 节省空间 |
|---------|--------|---------|
| 5MB, 4000x3000px | 200KB, 1920x1440px | 96% |
| 2MB, 3000x2000px | 120KB, 1920x1280px | 94% |
| 500KB, 1920x1080px | 80KB, 1920x1080px | 84% |

## 文件大小限制

- **前端限制**: 单个文件最大 10MB
- **后端限制**: 单个文件最大 5MB
- **图片格式**: JPG, PNG, WebP, GIF

## 使用示例

### 前端使用

```typescript
import { uploadMultipleImages } from '@/services/upload'
import { compressImage } from '@/utils/imageCompress'

// 压缩并上传
const handleUpload = async (files: File[]) => {
  // 1. 压缩图片
  const compressedFiles = await Promise.all(
    files.map(file => compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8
    }))
  )
  
  // 2. 转换为File对象
  const filesToUpload = compressedFiles.map((blob, index) => 
    new File([blob], files[index].name, { type: 'image/jpeg' })
  )
  
  // 3. 上传到服务器
  const urls = await uploadMultipleImages(filesToUpload)
  
  return urls
}
```

### 后端集成

#### 存储目录结构
```
project/
├── uploads/
│   └── images/
│       ├── 1_1711449600000.jpg
│       ├── 1_1711449601000.png
│       └── ...
```

#### 数据库存储
```sql
-- mood_diaries 表
CREATE TABLE mood_diaries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(200),
  content TEXT,
  mood VARCHAR(20),
  images TEXT,  -- 用逗号分隔的图片URL
  diary_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 注意事项

### 安全性
1. 所有上传接口需要登录认证
2. 后端验证文件类型和大小
3. 文件名使用 `{user_id}_{timestamp}` 格式避免冲突

### 性能优化
1. 前端压缩减少上传时间
2. 批量上传减少请求次数
3. 图片尺寸限制避免超大图片

### 生产环境建议
1. 使用对象存储服务 (OSS/COS/七牛云)
2. 配置CDN加速图片访问
3. 实现图片懒加载
4. 添加图片缓存策略
5. 定期清理未使用的图片

### 开发环境
- 图片访问URL: `http://localhost:3000/uploads/images/filename.jpg`
- 确保 `uploads/images/` 目录存在且有写权限

## 错误处理

### 前端错误
- 文件过大: "图片大小不能超过 10MB!"
- 格式不支持: "只能上传图片文件!"
- 压缩失败: "图片压缩失败,请重试"
- 上传失败: "图片上传失败"

### 后端错误
- 400: 文件过大 (超过5MB)
- 400: 不支持的格式
- 400: 文件数量超过限制
- 401: 未授权
- 500: 服务器错误

## 更新日志

- 2026-03-26: 实现图片压缩和上传功能
- 2026-03-26: 集成后端上传API
- 2026-03-26: 替换Base64为URL传输方式
