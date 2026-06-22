-- Account Foundation v0.1
-- Review before running on production. This migration keeps the existing
-- users/profiles/discoveries model and adds public account identity fields.

ALTER TABLE users
  ADD COLUMN public_uid VARCHAR(6) NULL AFTER id,
  ADD COLUMN nickname VARCHAR(64) NULL AFTER public_uid,
  ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user' AFTER email,
  ADD UNIQUE KEY users_public_uid_unique (public_uid);

CREATE TABLE IF NOT EXISTS uid_reservations (
  id VARCHAR(36) PRIMARY KEY,
  uid VARCHAR(6) NOT NULL,
  status ENUM('reserved', 'assigned') NOT NULL DEFAULT 'reserved',
  assigned_to_user_id VARCHAR(36) NULL,
  note VARCHAR(255) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uid_reservations_uid_unique (uid),
  KEY uid_reservations_assigned_user_idx (assigned_to_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO uid_reservations (
  id, uid, status, note, created_at, updated_at
)
SELECT UUID(), reserved_uid, 'reserved', 'Account Foundation v0.1 reserved UID', NOW(), NOW()
FROM (
  SELECT '666' AS reserved_uid UNION ALL
  SELECT '888' UNION ALL
  SELECT '999' UNION ALL
  SELECT '8888' UNION ALL
  SELECT '9999' UNION ALL
  SELECT '666666' UNION ALL
  SELECT '777777' UNION ALL
  SELECT '888888' UNION ALL
  SELECT '999999' UNION ALL
  SELECT '123456' UNION ALL
  SELECT '520520'
) AS reserved_values
ON DUPLICATE KEY UPDATE updated_at = updated_at;

CREATE TABLE IF NOT EXISTS user_profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  stage VARCHAR(64) NULL,
  profession VARCHAR(255) NULL,
  goal TEXT NULL,
  common_problems TEXT NULL,
  materials_note TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY user_profiles_user_id_unique (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_problems (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  original_input TEXT NOT NULL,
  problem_shape VARCHAR(64) NULL,
  status ENUM('draft', 'generated', 'waiting_feedback', 'completed') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY user_problems_user_id_created_idx (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
