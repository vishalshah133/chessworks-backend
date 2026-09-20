-- ChessWorks database schema. Run via `npm run migrate`.

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  username      VARCHAR(32)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(64)  NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Refresh tokens are stored hashed (SHA-256) so a DB read alone can't be replayed as a live token.
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  user_id     CHAR(36)     NOT NULL,
  token_hash  CHAR(64)     NOT NULL,
  expires_at  DATETIME     NOT NULL,
  revoked_at  DATETIME     NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  replaced_by CHAR(36)     NULL,
  UNIQUE KEY uq_refresh_token_hash (token_hash),
  KEY idx_refresh_user (user_id),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS daily_posts (
  id            VARCHAR(64)  NOT NULL PRIMARY KEY,
  avatar_glyph  VARCHAR(16)  NOT NULL DEFAULT '',
  avatar_style  VARCHAR(64)  NOT NULL DEFAULT '',
  title         VARCHAR(128) NOT NULL,
  meta          VARCHAR(128) NOT NULL DEFAULT '',
  caption       VARCHAR(512) NOT NULL DEFAULT '',
  sort_order    INT          NOT NULL DEFAULT 0,
  active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lessons_catalog (
  id          VARCHAR(64)  NOT NULL PRIMARY KEY,
  title       VARCHAR(128) NOT NULL,
  category    VARCHAR(64)  NOT NULL DEFAULT 'Basics',
  glyph       VARCHAR(16)  NOT NULL DEFAULT '',
  sort_order  INT          NOT NULL DEFAULT 0,
  active      TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lesson_tags (
  lesson_id VARCHAR(64) NOT NULL,
  tag       VARCHAR(64) NOT NULL,
  PRIMARY KEY (lesson_id, tag),
  CONSTRAINT fk_tag_lesson FOREIGN KEY (lesson_id) REFERENCES lessons_catalog(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per teaching beat within a lesson. board_pieces/highlight_squares/correct_squares hold
-- algebraic square strings (e.g. "e4"), matching how lesson content used to be hand-authored in
-- LessonBook.cs - Unity converts them to internal square indices client-side via Squares.TryParse,
-- exactly like the old LessonStep.Board()/Squares_() helpers did, so this table stays engine-index
-- agnostic and human-editable. board_pieces = NULL means "leave the board exactly as the previous
-- step left it" (LessonStep's original null-means-unchanged convention); a JSON array (even an
-- empty one, `[]`) means "set the board to exactly this".
CREATE TABLE IF NOT EXISTS lesson_steps (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id           VARCHAR(64)  NOT NULL,
  step_index          INT          NOT NULL,
  instructor_line     TEXT         NULL,
  mood                VARCHAR(16)  NOT NULL DEFAULT 'Idle',
  board_pieces        JSON         NULL,
  highlight_squares   JSON         NOT NULL,
  quiz_mode           VARCHAR(16)  NOT NULL DEFAULT 'None',
  question_text       TEXT         NULL,
  correct_squares     JSON         NOT NULL,
  choices             JSON         NOT NULL,
  correct_choice_index INT         NOT NULL DEFAULT 0,
  success_line        TEXT         NULL,
  fail_line           TEXT         NULL,
  UNIQUE KEY uq_lesson_step (lesson_id, step_index),
  CONSTRAINT fk_step_lesson FOREIGN KEY (lesson_id) REFERENCES lessons_catalog(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id      CHAR(36)     NOT NULL,
  lesson_id    VARCHAR(64)  NOT NULL,
  completed    TINYINT(1)   NOT NULL DEFAULT 0,
  last_step    INT          NOT NULL DEFAULT 0,
  completed_at DATETIME     NULL,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, lesson_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons_catalog(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
