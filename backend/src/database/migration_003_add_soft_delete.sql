-- Migration 003: Soft-delete columns for account self-deletion
-- 账号自主注销 - 软删除

ALTER TABLE users
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '注销时间(软删除)',
  ADD COLUMN deleted_reason VARCHAR(255) DEFAULT NULL COMMENT '注销原因';

CREATE INDEX idx_deleted_at ON users (deleted_at);
