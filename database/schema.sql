-- Timo database schema (MySQL, XAMPP friendly)
CREATE DATABASE IF NOT EXISTS timo
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE timo;

CREATE TABLE IF NOT EXISTS applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  logo VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS folders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(100) NOT NULL DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_folders_app FOREIGN KEY (application_id)
    REFERENCES applications (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tasks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  folder_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status ENUM('todo','doing','done') NOT NULL DEFAULT 'todo',
  priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_folder FOREIGN KEY (folder_id)
    REFERENCES folders (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_key VARCHAR(100) NOT NULL DEFAULT 'default',
  work_minutes INT NOT NULL DEFAULT 30,
  break_minutes INT NOT NULL DEFAULT 10,
  UNIQUE KEY uq_settings_user (user_key)
) ENGINE=InnoDB;

INSERT IGNORE INTO settings (user_key, work_minutes, break_minutes)
VALUES ('default', 30, 10);

-- Migration for databases created before the logo column existed
SET @has_logo := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'timo' AND TABLE_NAME = 'applications' AND COLUMN_NAME = 'logo'
);
SET @sql := IF(@has_logo = 0,
  'ALTER TABLE applications ADD COLUMN logo VARCHAR(255) NULL AFTER name',
  'DO 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
