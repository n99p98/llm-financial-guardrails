CREATE DATABASE IF NOT EXISTS guardrails_demo;
USE guardrails_demo;

CREATE TABLE IF NOT EXISTS guardrail_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  industry VARCHAR(64) NOT NULL DEFAULT 'common',
  category VARCHAR(64) NOT NULL,
  keyword VARCHAR(255) NOT NULL,
  match_type ENUM('contains','regex') NOT NULL DEFAULT 'contains',
  action ENUM('block','redact','warn','log') NOT NULL DEFAULT 'block',
  replacement_text VARCHAR(255) NULL,
  severity INT NOT NULL DEFAULT 3,
  is_active TINYINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active_industry (is_active, industry),
  INDEX idx_category (category)
);

CREATE TABLE IF NOT EXISTS guardrail_audit_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  request_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(128) NULL,
  industry VARCHAR(64) NOT NULL,
  phase ENUM('pre','post') NOT NULL,
  matched_rules_json JSON NOT NULL,
  final_action ENUM('allow','block','redact','warn','log') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_request (request_id),
  INDEX idx_created (created_at)
);

-- Sample rules (financial confidentiality)
INSERT INTO guardrail_rules (industry, category, keyword, match_type, action, replacement_text, severity, is_active)
VALUES
('common', 'financial_confidential', 'cost price', 'contains', 'block', NULL, 5, 1),
('common', 'financial_confidential', 'margin', 'contains', 'block', NULL, 5, 1),
('common', 'financial_confidential', 'net price', 'contains', 'block', NULL, 5, 1),
('common', 'financial_confidential', 'internal discount', 'contains', 'block', NULL, 4, 1),

-- Optional: redact specific patterns (example: currency amounts)
('common', 'financial_confidential', '\\b(?:USD|INR|EUR)\\s*\\d+(?:\\.\\d+)?\\b', 'regex', 'redact', '[REDACTED:AMOUNT]', 3, 1);
