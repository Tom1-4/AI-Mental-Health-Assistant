# AI心理健康助手后端服务

基于 Express 和 MySQL 的后端服务。

## 安装依赖

```bash
npm install
```

## 数据库配置

1. 确保 MySQL 已安装并运行
2. 执行 `src/database/init.sql` 脚本创建数据库和用户表
3. 修改 `.env` 文件中的数据库配置：
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=mental_health_db
   ```

## 初始化数据库

```bash
mysql -u root -p < src/database/init.sql
```

## 运行项目

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API 端点

### 用户相关（公开）
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录

### 用户相关（需认证）
- `POST /api/users/logout` - 用户登出（需token）
- `GET /api/users/profile` - 获取当前用户信息（需token）
- `PUT /api/users/profile` - 更新当前用户信息（需token）

### AI相关（需认证）
- `POST /api/ai/chat` - AI对话（需token）
- `POST /api/ai/emotion` - 情绪分析（需token）

## 认证说明

登录成功后会在响应中返回token，后续请求需要在请求头中携带：
```
Authorization: <token>
```

## 数据库表结构

### users 表
- `id` - 用户ID（主键）
- `username` - 用户名（唯一）
- `email` - 邮箱（唯一）
- `password` - 密码
- `chat_count` - 对话次数（默认0）
- `token` - 登录token
- `last_login_time` - 最近登录时间
- `created_at` - 注册时间
- `updated_at` - 更新时间

## 项目结构

```
backend/
├── src/
│   ├── config/
│   │   └── database.js      # 数据库配置
│   ├── controllers/
│   │   ├── userController.js
│   │   └── aiController.js
│   ├── middleware/
│   │   └── auth.js          # 认证中间件
│   ├── routes/
│   │   ├── userRoutes.js
│   │   └── aiRoutes.js
│   ├── database/
│   │   └── init.sql         # 数据库初始化脚本
│   └── server.js            # 服务器入口文件
├── .env                     # 环境变量配置
├── package.json
└── README.md
```
