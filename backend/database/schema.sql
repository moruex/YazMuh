-- schema.sql

-- ==================================
-- ENUMS
-- ==================================
CREATE TYPE role_type AS ENUM ('actor', 'director', 'writer', 'producer', 'cinematographer', 'composer');
CREATE TYPE admin_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'CONTENT_MODERATOR');

-- ==================================
-- CORE TABLES
-- ==================================

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Genres Table
CREATE TABLE genres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  is_collection BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Persons Table
CREATE TABLE persons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  bio TEXT,
  birth_date DATE,
  profile_image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Movies Table
CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  release_date DATE,
  plot_summary TEXT,
  poster_url VARCHAR(255),
  duration_minutes INTEGER,
  trailer_url VARCHAR(255),
  avg_rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Comments Table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,                             -- Original/Current text of the comment
  parent_comment_id INTEGER NULL REFERENCES comments(id) ON DELETE CASCADE,
  likes_count INTEGER NOT NULL DEFAULT 0,

  -- Denormalized flag for quick filtering/display
  is_currently_censored BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP -- Tracks user edits AND moderation actions
);
COMMENT ON COLUMN comments.is_currently_censored IS 'Denormalized flag indicating if the comment is currently censored based on the latest relevant log entry. Updated via application logic when censorship occurs.';
COMMENT ON COLUMN comments.content IS 'The text of the comment. Application logic decides whether to display this or a placeholder based on is_currently_censored flag.';


-- News Articles Table
CREATE TABLE news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  short_content TEXT,
  content TEXT NOT NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Changed from RESTRICT to SET NULL for flexibility
  image_url VARCHAR(255),
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users Table
CREATE TABLE admins (
  id SERIAL PRIMARY KEY, -- This is INTEGER
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role admin_role NOT NULL DEFAULT 'ADMIN',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================================
-- NEW Censorship Tables
-- ==================================

-- Stores predefined, reusable reasons for censoring comments
CREATE TABLE censorship_reasons (
    reason_code VARCHAR(50) PRIMARY KEY, -- e.g., 'HATE_SPEECH', 'SPAM', 'SPOILER'
    description TEXT NOT NULL,             -- User-friendly explanation
    is_active BOOLEAN NOT NULL DEFAULT TRUE -- Allows retiring reasons
);
COMMENT ON TABLE censorship_reasons IS 'Stores predefined reasons for comment censorship.';
COMMENT ON COLUMN censorship_reasons.reason_code IS 'A short, machine-readable code for the censorship reason.';
COMMENT ON COLUMN censorship_reasons.is_active IS 'Indicates if the reason is currently available for selection by admins.';

-- Log table to record every instance of comment censorship
CREATE TABLE comment_censorship_log (
    id SERIAL PRIMARY KEY,                          -- Unique ID for the log entry
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE, -- The comment being actioned
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE RESTRICT, -- Admin performing the action (ON DELETE RESTRICT prevents deleting admins with log entries)
    reason_code VARCHAR(50) NOT NULL REFERENCES censorship_reasons(reason_code), -- Structured reason from the lookup table
    admin_notes TEXT NULL,                          -- Specific free-text notes from the admin for this instance
    action_taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, -- When this specific log entry/action occurred
    original_content_snapshot TEXT NULL             -- Snapshot of comment.content just before this action was taken (optional but recommended)
    -- Add fields for 'uncensor' actions if needed later (e.g., is_undone, undone_at, undone_by_admin_id)
);
COMMENT ON TABLE comment_censorship_log IS 'Records moderation actions taken on comments, focusing on censorship.';
COMMENT ON COLUMN comment_censorship_log.admin_id IS 'The ID of the admin user who performed the censorship action.';
COMMENT ON COLUMN comment_censorship_log.reason_code IS 'The predefined reason code for the censorship action.';
COMMENT ON COLUMN comment_censorship_log.admin_notes IS 'Optional free-text notes provided by the admin during censorship.';
COMMENT ON COLUMN comment_censorship_log.original_content_snapshot IS 'A copy of the comments.content field at the time this action was taken.';


-- ==================================
-- RELATIONSHIP / JOIN TABLES (No changes needed here)
-- ==================================
CREATE TABLE movie_genres (
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);

CREATE TABLE user_ratings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, movie_id)
);

CREATE TABLE user_lists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_type VARCHAR(20) NOT NULL CHECK (list_type IN ('favorites', 'watched', 'watchlist')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_list_items (
  id SERIAL PRIMARY KEY,
  list_id INTEGER NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (list_id, movie_id)
);

CREATE TABLE comment_likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, comment_id)
);

CREATE TABLE news_movies (
  news_id INTEGER NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  PRIMARY KEY (news_id, movie_id)
);

-- ==================================
-- Quiz Tables
-- ==================================
CREATE TABLE quiz_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  allowed_choices_count INTEGER NOT NULL DEFAULT 1 CHECK (allowed_choices_count >= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_choices (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  choice_text VARCHAR(255) NOT NULL,
  image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_quiz_answers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  choice_id INTEGER NOT NULL REFERENCES quiz_choices(id) ON DELETE CASCADE,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, question_id, choice_id)
);

-- ==================================
-- Recommendation Tables
-- ==================================
CREATE TABLE recommendation_sections (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) UNIQUE NOT NULL,
  section_type VARCHAR(50) NOT NULL CHECK (section_type IN ('ADMIN_DEFINED', 'LATEST', 'POPULAR', 'MOST_RATED', 'MOST_COMMENTED')),
  description TEXT,
  display_order INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recommendation_section_movies (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES recommendation_sections(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0 NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (section_id, movie_id)
);

-- ==================================
-- Session Tables (No changes, ensure FK to admins.id is INTEGER)
-- ==================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_jti TEXT NOT NULL UNIQUE, -- Unique JWT ID (jti claim) or the token hash
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL, -- Mirror JWT expiration or set custom server-side expiry
    last_used_at TIMESTAMPTZ, -- Optional: Update on use for activity tracking
    revoked_at TIMESTAMPTZ    -- Optional: Mark as revoked instead of deleting
);

CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token_jti TEXT NOT NULL UNIQUE, -- Unique JWT ID (jti claim) or the token hash
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL, -- Mirror JWT expiration or set custom server-side expiry
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

-- ==================================
-- Indexes (Review and add for new tables)
-- ==================================
-- Keep existing relevant indexes...
CREATE INDEX idx_users_username ON users(lower(username));
CREATE INDEX idx_users_email ON users(lower(email));
CREATE INDEX idx_genres_name ON genres(lower(name));
CREATE INDEX idx_persons_name ON persons(name);
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_movies_release_date ON movies(release_date DESC);
CREATE INDEX idx_movies_avg_rating ON movies(avg_rating DESC);
CREATE INDEX idx_news_published_at ON news(published_at DESC);
CREATE INDEX idx_admins_username ON admins(lower(username));

-- Indexes for Comments (Updated)
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_movie_id ON comments(movie_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments (created_at DESC);
CREATE INDEX idx_comments_is_currently_censored ON comments (is_currently_censored); -- Important Index

-- Keep existing relationship/join table indexes...
CREATE INDEX idx_movie_genres_genre_id ON movie_genres(genre_id);
CREATE INDEX idx_user_ratings_movie_id ON user_ratings(movie_id);
CREATE INDEX idx_user_list_items_movie_id ON user_list_items(movie_id);
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_news_movies_movie_id ON news_movies(movie_id);
CREATE INDEX idx_quiz_choices_question_id ON quiz_choices(question_id);
CREATE INDEX idx_user_quiz_answers_user_question ON user_quiz_answers(user_id, question_id);
CREATE INDEX idx_user_quiz_answers_choice_id ON user_quiz_answers(choice_id);
CREATE INDEX idx_recommendation_sections_type ON recommendation_sections(section_type);
CREATE INDEX idx_recommendation_sections_order ON recommendation_sections(display_order);
CREATE INDEX idx_recommendation_section_movies_movie ON recommendation_section_movies(movie_id);
CREATE INDEX idx_recommendation_section_movies_order ON recommendation_section_movies(display_order);

-- Keep session table indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Indexes for Censorship Tables
CREATE INDEX idx_censorship_reasons_is_active ON censorship_reasons (is_active);
CREATE INDEX idx_comment_censorship_log_comment_id ON comment_censorship_log (comment_id);
CREATE INDEX idx_comment_censorship_log_admin_id ON comment_censorship_log (admin_id);
CREATE INDEX idx_comment_censorship_log_reason_code ON comment_censorship_log (reason_code);
CREATE INDEX idx_comment_censorship_log_action_taken_at ON comment_censorship_log (action_taken_at DESC);
