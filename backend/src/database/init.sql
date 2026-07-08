-- 创建数据库
CREATE DATABASE IF NOT EXISTS mental_health_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mental_health_db;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' COMMENT '用户角色：user 或 admin',
  avatar VARCHAR(500) COMMENT '头像URL地址',
  chat_count INT DEFAULT 0 COMMENT '对话次数',
  token VARCHAR(255) COMMENT '登录token',
  last_login_time TIMESTAMP NULL COMMENT '最近登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 聊天历史表
CREATE TABLE IF NOT EXISTS chat_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_message TEXT NOT NULL COMMENT '用户消息',
  ai_response TEXT NOT NULL COMMENT 'AI回复',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 心灵树洞帖子表
CREATE TABLE IF NOT EXISTS soul_cave_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT COMMENT '发布用户ID（可为空表示匿名）',
  anonymous_name VARCHAR(50) COMMENT '匿名昵称',
  content TEXT NOT NULL COMMENT '帖子内容',
  emotion VARCHAR(20) COMMENT '情绪标签：happy, sad, anxious, angry, neutral',
  likes_count INT DEFAULT 0 COMMENT '点赞数',
  comments_count INT DEFAULT 0 COMMENT '评论数',
  is_anonymous TINYINT(1) DEFAULT 1 COMMENT '是否匿名：1-是，0-否',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_created_at (created_at),
  INDEX idx_emotion (emotion),
  INDEX idx_likes (likes_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 心灵树洞评论表
CREATE TABLE IF NOT EXISTS soul_cave_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL COMMENT '帖子ID',
  user_id INT COMMENT '评论用户ID（可为空表示匿名）',
  anonymous_name VARCHAR(50) COMMENT '匿名昵称',
  content TEXT NOT NULL COMMENT '评论内容',
  likes_count INT DEFAULT 0 COMMENT '点赞数',
  is_anonymous TINYINT(1) DEFAULT 1 COMMENT '是否匿名：1-是，0-否',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (post_id) REFERENCES soul_cave_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_post_id (post_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MBTI人格测试结果表
CREATE TABLE IF NOT EXISTS mbti_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  mbti_type VARCHAR(4) NOT NULL COMMENT 'MBTI类型(如INTJ, ENFP等)',
  answers JSON NOT NULL COMMENT '28道题目答案',
  ei_score INT NOT NULL COMMENT 'E/I维度得分',
  sn_score INT NOT NULL COMMENT 'S/N维度得分',
  tf_score INT NOT NULL COMMENT 'T/F维度得分',
  jp_score INT NOT NULL COMMENT 'J/P维度得分',
  ei_percent INT NOT NULL COMMENT 'E/I维度百分比',
  sn_percent INT NOT NULL COMMENT 'S/N维度百分比',
  tf_percent INT NOT NULL COMMENT 'T/F维度百分比',
  jp_percent INT NOT NULL COMMENT 'J/P维度百分比',
  type_name VARCHAR(50) NOT NULL COMMENT '人格类型名称',
  type_traits JSON COMMENT '人格特质列表',
  type_description TEXT COMMENT '人格类型描述',
  dimension_desc JSON COMMENT '各维度描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '测试时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_mbti_type (mbti_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 心灵树洞点赞记录表
CREATE TABLE IF NOT EXISTS soul_cave_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  target_id INT NOT NULL COMMENT '目标ID（帖子ID或评论ID）',
  target_type VARCHAR(20) NOT NULL COMMENT '目标类型：post或comment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (user_id, target_id, target_type),
  INDEX idx_user_id (user_id),
  INDEX idx_target (target_id, target_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
