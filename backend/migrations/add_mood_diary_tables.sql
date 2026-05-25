-- 心情日记表
CREATE TABLE IF NOT EXISTS mood_diaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  title VARCHAR(200) NOT NULL COMMENT '日记标题',
  content TEXT NOT NULL COMMENT '日记内容',
  mood VARCHAR(20) NOT NULL COMMENT '心情：happy, sad, anxious, angry, neutral, excited, tired, calm',
  images TEXT COMMENT '图片URL，多个图片用逗号分隔',
  diary_date DATE NOT NULL COMMENT '日记日期',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_diary_date (diary_date),
  INDEX idx_mood (mood),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
