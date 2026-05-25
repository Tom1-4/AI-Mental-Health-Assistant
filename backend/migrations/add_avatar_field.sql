-- 添加头像字段到用户表
USE mental_health_db;
ALTER TABLE users ADD COLUMN avatar VARCHAR(500) COMMENT '头像URL地址' AFTER role;

-- 更新现有用户，设置默认头像
UPDATE users SET avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username WHERE avatar IS NULL OR avatar = '';
