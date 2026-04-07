-- PostgreSQL Database Schema for Mental Health Check-ins

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create checkins table
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  checkin_number INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT checkins_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, checkin_number)
);

-- Create checkins_data table for storing check-in responses
CREATE TABLE IF NOT EXISTS checkins_data (
  id UUID PRIMARY KEY,
  checkin_id UUID NOT NULL,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  audio_url TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT checkins_data_checkin_fk FOREIGN KEY (checkin_id) REFERENCES checkins(id) ON DELETE CASCADE,
  CONSTRAINT checkins_data_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_checkins_user_unlocked ON checkins(user_id, unlocked_at);
