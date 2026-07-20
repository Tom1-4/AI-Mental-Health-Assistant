-- Migration 002: Add risk_flag to chat_history for safety guardrails
-- AI安全护栏 - 对话风险标记

ALTER TABLE chat_history
  ADD COLUMN risk_flag TINYINT(1) DEFAULT 0 COMMENT '风险标记: 0=正常, 1=需要关注'
  AFTER ai_response;

CREATE INDEX idx_risk_flag ON chat_history (risk_flag);
