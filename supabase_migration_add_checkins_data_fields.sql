-- Migration: add explicit checkins_data columns for survey and audio fields
-- Run this script against your Supabase/Postgres database.

BEGIN;

ALTER TABLE checkins_data
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS checkin_number INTEGER,
  ADD COLUMN IF NOT EXISTS survey1 SMALLINT,
  ADD COLUMN IF NOT EXISTS survey2a SMALLINT,
  ADD COLUMN IF NOT EXISTS survey2b SMALLINT,
  ADD COLUMN IF NOT EXISTS survey3 SMALLINT,
  ADD COLUMN IF NOT EXISTS audio_task1_baseline TEXT,
  ADD COLUMN IF NOT EXISTS audio_task2_stroop TEXT,
  ADD COLUMN IF NOT EXISTS audio_task3_deadline TEXT,
  ADD COLUMN IF NOT EXISTS audio_task4_reading TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Backfill values from existing JSON payloads where available.
UPDATE checkins_data
SET
  username = COALESCE(username, data->>'username'),
  checkin_number = COALESCE(checkin_number, (data->>'checkinNumber')::INTEGER),
  survey1 = COALESCE(survey1, (data->>'survey1')::SMALLINT),
  survey2a = COALESCE(survey2a, (data->>'survey2a')::SMALLINT),
  survey2b = COALESCE(survey2b, (data->>'survey2b')::SMALLINT),
  survey3 = COALESCE(survey3, (data->>'survey3')::SMALLINT),
  audio_task1_baseline = COALESCE(audio_task1_baseline, data->>'audioTask1Baseline'),
  audio_task2_stroop = COALESCE(audio_task2_stroop, data->>'audioTask2Stroop'),
  audio_task3_deadline = COALESCE(audio_task3_deadline, data->>'audioTask3Deadline'),
  audio_task4_reading = COALESCE(audio_task4_reading, data->>'audioTask4Reading'),
  submitted_at = COALESCE(submitted_at, (data->>'submittedAt')::TIMESTAMPTZ)
WHERE data IS NOT NULL;

-- Ensure username is present for all rows.
UPDATE checkins_data
SET username = 'unknown'
WHERE username IS NULL;

ALTER TABLE checkins_data ALTER COLUMN username SET NOT NULL;

COMMIT;
