-- Migration 001: Clinical screening results table
-- 临床心理筛查结果表 (PHQ-9 / GAD-7)

CREATE TABLE IF NOT EXISTS screening_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  test_type VARCHAR(10) NOT NULL COMMENT '测评类型: phq9 或 gad7',
  answers JSON NOT NULL COMMENT '用户答题记录 {qid: score}',
  total_score INT NOT NULL COMMENT '总分',
  severity VARCHAR(20) NOT NULL COMMENT '严重程度: none/mild/moderate/moderately-severe/severe',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, test_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
