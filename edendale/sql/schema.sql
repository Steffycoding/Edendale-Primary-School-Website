-- ============================================================
-- schema.sql — Edendale Primary School Database
-- Engine: MySQL 8.x
-- Run this ONCE to set up the database.
-- ============================================================

-- Create database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS edendale_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE edendale_db;

-- ══════════════════════════════════════════════════════════════
-- TABLE: admin_users
-- Stores login credentials for the admin panel.
-- Passwords are stored as BCrypt hashes — NEVER plain text.
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT          NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,   -- BCrypt hash
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ══════════════════════════════════════════════════════════════
-- TABLE: content
-- Stores all editable text/image fields for each page.
-- One row per (page, field_name) pair.
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS content (
  id          INT          NOT NULL AUTO_INCREMENT,
  page        VARCHAR(50)  NOT NULL,              -- e.g. 'home', 'grades', 'contact'
  field_name  VARCHAR(100) NOT NULL,              -- matches data-field attribute in HTML
  value       TEXT,                               -- actual content (text or image URL)
  type        ENUM('text', 'image') NOT NULL DEFAULT 'text',
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_page_field (page, field_name)     -- enforces one row per field per page
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ══════════════════════════════════════════════════════════════
-- TABLE: events
-- Stores school calendar events.
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS events (
  id          INT          NOT NULL AUTO_INCREMENT,
  title       VARCHAR(200) NOT NULL,
  event_date  DATE         NOT NULL,
  event_time  VARCHAR(20)  DEFAULT NULL,          -- e.g. '08:00'
  description TEXT         DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_event_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ══════════════════════════════════════════════════════════════
-- SEED DATA
-- ══════════════════════════════════════════════════════════════

-- ── Default Admin User ────────────────────────────────────────
-- Username: admin
-- Password: Admin@1234  (BCrypt hash below)
-- TODO: Change the password after first login!
-- To generate a new hash:  https://bcrypt-generator.com/
INSERT IGNORE INTO admin_users (username, password_hash)
VALUES (
  'admin',
  '$2a$12$Kp9v8XPwjK4rT7eL0mN3yuJhVtOsQzGbIyWcFxDaElUdMsRkZpABe'
  -- BCrypt of "Admin@1234" with cost factor 12
);

-- ── Sample Events ─────────────────────────────────────────────
INSERT IGNORE INTO events (title, event_date, event_time, description) VALUES
  ('Term 2 Begins',          '2026-04-07', '07:30', 'Start of second school term.'),
  ('Parent-Teacher Meetings', '2026-04-15', '14:00', 'Individual parent-teacher interviews. Please book a slot.'),
  ('Sports Day',             '2026-04-22', '09:00', 'Annual inter-grade sports day on the school grounds.'),
  ('Winter Concert',         '2026-06-10', '18:00', 'Annual cultural evening featuring choir, drama and dance.'),
  ('Term 2 Ends',            '2026-06-26', '12:00', 'Last day of second school term.');

-- ── Sample Content ────────────────────────────────────────────
-- Home page defaults
INSERT IGNORE INTO content (page, field_name, value, type) VALUES
  ('home', 'hero_title',       'Edendale Primary School', 'text'),
  ('home', 'hero_tagline',     'Kernels in Big',          'text'),
  ('home', 'hero_description', 'Edendale Primary School has been serving the Manenburg community with dedication, compassion, and a commitment to excellence in education.', 'text'),
  ('home', 'hero_cta',         'Admissions Enquiry',      'text'),
  ('home', 'about_title',      'A Place of Learning, Growth & Community', 'text'),
  ('home', 'stat_learners',    '400+',    'text'),
  ('home', 'stat_teachers',    '70+',     'text'),
  ('home', 'stat_grades',      'Gr R–7',  'text');

-- Contact page defaults
INSERT IGNORE INTO content (page, field_name, value, type) VALUES
  ('contact', 'contact_school_name', 'Edendale Primary School', 'text'),
  ('contact', 'contact_address',     '100 Philippi Ring Road & Manenburg Ave, Manenburg, Cape Town, 7764, South Africa', 'text'),
  ('contact', 'contact_phone',       '021 800 0111',             'text'),
  ('contact', 'contact_mobile',      '082 829 1000',             'text'),
  ('contact', 'contact_email',       'edendaleprimary@gmail.com','text'),
  ('contact', 'contact_emis',        '1054821000',               'text');
