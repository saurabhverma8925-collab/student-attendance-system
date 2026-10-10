-- =============================================================================
-- Student Attendance System (SAS) - Database Schema
-- Target: MySQL 8.0+ / Jakarta Servlet 6.0 + JDBC
-- =============================================================================
--
-- Entity-Relationship Diagram (Mermaid)
--
-- erDiagram
--   ADMINS ||--o{ AUDIT_LOGS : "writes"
--   ADMINS ||--o{ QR_SESSIONS : "creates"
--   ADMINS ||--o{ ATTENDANCE : "marks (manual)"
--   STUDENTS ||--o{ ATTENDANCE : "has"
--   STUDENTS ||--o{ DEVICE_REGISTRATIONS : "owns"
--   STUDENTS ||--o{ QR_SCANS : "submits"
--   SUBJECTS ||--o{ ATTENDANCE : "tracks"
--   SUBJECTS ||--o{ RESOURCES : "offers"
--   SUBJECTS ||--o{ QR_SESSIONS : "scheduled for"
--   SUBJECTS ||--o{ QR_SCANS : "for"
--   QR_SESSIONS ||--o{ QR_SCANS : "scanned by"
--   FAILED_LOGIN_ATTEMPTS }o--o{ ADMINS : "rate-limit"
--   FAILED_LOGIN_ATTEMPTS }o--o{ STUDENTS : "rate-limit"
--
--   ADMINS {
--     bigint id PK
--     varchar username UK
--     varchar password_hash
--     varchar name
--     varchar role
--     datetime created_at
--   }
--   STUDENTS {
--     bigint id PK
--     varchar student_id UK
--     varchar name
--     varchar branch
--     varchar section
--     int semester
--     varchar password_hash
--     varchar email
--     varchar phone
--     varchar device_fingerprint
--     datetime device_registered_at
--     boolean has_seen_onboarding
--     datetime created_at
--     datetime updated_at
--   }
--   SUBJECTS {
--     bigint id PK
--     varchar code UK
--     varchar name
--     varchar branch
--     int semester
--     int total_classes
--     datetime created_at
--   }
--   ATTENDANCE {
--     bigint id PK
--     bigint student_id FK
--     bigint subject_id FK
--     date date
--     varchar status
--     varchar marked_by
--     varchar marked_via
--     datetime created_at
--   }
--   DEVICE_REGISTRATIONS {
--     bigint id PK
--     bigint student_id FK
--     varchar device_fingerprint
--     varchar user_agent
--     datetime registered_at
--   }
--   RESOURCES {
--     bigint id PK
--     bigint subject_id FK
--     varchar title
--     varchar type
--     varchar url
--     text description
--     boolean is_free
--     datetime created_at
--   }
--   QR_SESSIONS {
--     bigint id PK
--     varchar token UK
--     bigint subject_id FK
--     date date
--     varchar created_by
--     datetime expires_at
--     boolean is_active
--     datetime created_at
--   }
--   QR_SCANS {
--     bigint id PK
--     bigint qr_session_id FK
--     bigint student_id FK
--     bigint subject_id FK
--     date date
--     boolean face_verified
--     varchar captured_photo_hash
--     datetime created_at
--   }
--   AUDIT_LOGS {
--     bigint id PK
--     varchar actor_id
--     varchar actor_role
--     varchar action
--     varchar target
--     varchar ip
--     varchar user_agent
--     text details
--     datetime created_at
--   }
--   FAILED_LOGIN_ATTEMPTS {
--     bigint id PK
--     varchar username
--     varchar role
--     varchar ip
--     varchar user_agent
--     datetime created_at
--   }
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS device_registrations;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS qr_scans;
DROP TABLE IF EXISTS qr_sessions;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS failed_login_attempts;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS admins;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- admins
-- -----------------------------------------------------------------------------
CREATE TABLE admins (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'admin',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_admins PRIMARY KEY (id),
    CONSTRAINT uq_admins_username UNIQUE (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- students
-- -----------------------------------------------------------------------------
CREATE TABLE students (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    student_id          VARCHAR(30)  NOT NULL,
    name                VARCHAR(100) NOT NULL,
    branch              VARCHAR(20)  NOT NULL,
    section             VARCHAR(5)   NOT NULL,
    semester            INT          NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    email               VARCHAR(254) NOT NULL,
    phone               VARCHAR(20)  NOT NULL,
    device_fingerprint  VARCHAR(255),
    device_registered_at DATETIME,
    has_seen_onboarding BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_students PRIMARY KEY (id),
    CONSTRAINT uq_students_student_id UNIQUE (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- subjects
-- -----------------------------------------------------------------------------
CREATE TABLE subjects (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    code          VARCHAR(20)  NOT NULL,
    name          VARCHAR(100) NOT NULL,
    branch        VARCHAR(20)  NOT NULL,
    semester      INT          NOT NULL,
    total_classes INT          NOT NULL DEFAULT 0,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_subjects PRIMARY KEY (id),
    CONSTRAINT uq_subjects_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- attendance
-- -----------------------------------------------------------------------------
CREATE TABLE attendance (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    student_id  BIGINT      NOT NULL,
    subject_id  BIGINT      NOT NULL,
    date        DATE        NOT NULL,
    status      VARCHAR(10) NOT NULL,
    marked_by   VARCHAR(50) NOT NULL,
    marked_via  VARCHAR(20) NOT NULL DEFAULT 'manual',
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_attendance PRIMARY KEY (id),
    CONSTRAINT uq_attendance UNIQUE (student_id, subject_id, date),
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- device_registrations
-- -----------------------------------------------------------------------------
CREATE TABLE device_registrations (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    student_id         BIGINT       NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    user_agent         VARCHAR(500),
    registered_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_device_registrations PRIMARY KEY (id),
    CONSTRAINT uq_device_registrations_student UNIQUE (student_id),
    CONSTRAINT fk_device_reg_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- resources
-- -----------------------------------------------------------------------------
CREATE TABLE resources (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    subject_id  BIGINT       NOT NULL,
    title       VARCHAR(200) NOT NULL,
    type        VARCHAR(20)  NOT NULL,
    url         VARCHAR(500) NOT NULL,
    description TEXT,
    is_free     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_resources PRIMARY KEY (id),
    CONSTRAINT fk_resources_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- qr_sessions
-- -----------------------------------------------------------------------------
CREATE TABLE qr_sessions (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    token       VARCHAR(64) NOT NULL,
    subject_id  BIGINT      NOT NULL,
    date        DATE        NOT NULL,
    created_by  VARCHAR(50) NOT NULL,
    expires_at  DATETIME    NOT NULL,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_qr_sessions PRIMARY KEY (id),
    CONSTRAINT uq_qr_sessions_token UNIQUE (token),
    CONSTRAINT fk_qr_sessions_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- qr_scans
-- -----------------------------------------------------------------------------
CREATE TABLE qr_scans (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    qr_session_id       BIGINT       NOT NULL,
    student_id          BIGINT       NOT NULL,
    subject_id          BIGINT       NOT NULL,
    date                DATE         NOT NULL,
    face_verified       BOOLEAN      NOT NULL DEFAULT TRUE,
    captured_photo_hash VARCHAR(255),
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_qr_scans PRIMARY KEY (id),
    CONSTRAINT uq_qr_scan UNIQUE (qr_session_id, student_id),
    CONSTRAINT fk_qr_scans_session FOREIGN KEY (qr_session_id) REFERENCES qr_sessions (id) ON DELETE CASCADE,
    CONSTRAINT fk_qr_scans_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_qr_scans_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- audit_logs
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    actor_id    VARCHAR(50)  NOT NULL,
    actor_role  VARCHAR(20)  NOT NULL,
    action      VARCHAR(100) NOT NULL,
    target      VARCHAR(50),
    ip          VARCHAR(50),
    user_agent  VARCHAR(500),
    details     TEXT,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    CONSTRAINT idx_audit_logs_actor   INDEX (actor_id),
    CONSTRAINT idx_audit_logs_action   INDEX (action),
    CONSTRAINT idx_audit_logs_created  INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------------
-- failed_login_attempts
-- -----------------------------------------------------------------------------
CREATE TABLE failed_login_attempts (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    username    VARCHAR(100) NOT NULL,
    role        VARCHAR(20)  NOT NULL,
    ip          VARCHAR(50)  NOT NULL,
    user_agent  VARCHAR(500),
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_failed_login_attempts PRIMARY KEY (id),
    CONSTRAINT idx_failed_login_username INDEX (username),
    CONSTRAINT idx_failed_login_ip        INDEX (ip),
    CONSTRAINT idx_failed_login_created   INDEX (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
