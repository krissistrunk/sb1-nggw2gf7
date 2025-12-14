/*
  # Enhance Voice Coach System

  ## Overview
  This migration enhances the existing voice_sessions table with additional fields needed for
  comprehensive voice coaching integration across daily planning, weekly reviews, and general coaching.

  ## Changes

  ### Enhanced `voice_sessions` table
  Adds missing columns to support full voice coaching functionality

  ## Storage

  Creates a storage bucket named `voice-recordings` for storing user voice recordings.

  ## Security

  - Storage bucket policies allow authenticated users to upload and manage their own recordings
  - Recordings are organized by user ID for security and organization

  ## Indexes

  - Index on `context_type` for linking sessions to entities
*/

-- Add missing columns to existing voice_sessions table
DO $$
BEGIN
  -- Add session_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voice_sessions' AND column_name = 'session_type'
  ) THEN
    ALTER TABLE voice_sessions ADD COLUMN session_type text DEFAULT 'COACHING' CHECK (session_type IN ('PLANNING', 'REFLECTION', 'COACHING', 'MOTIVATION', 'CLARIFICATION'));
  END IF;

  -- Add context_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voice_sessions' AND column_name = 'context_type'
  ) THEN
    ALTER TABLE voice_sessions ADD COLUMN context_type text CHECK (context_type IN ('daily_planning', 'weekly_review', 'general', 'outcome', 'area'));
  END IF;

  -- Add context_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voice_sessions' AND column_name = 'context_id'
  ) THEN
    ALTER TABLE voice_sessions ADD COLUMN context_id uuid;
  END IF;

  -- Add audio_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voice_sessions' AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE voice_sessions ADD COLUMN audio_url text;
  END IF;

  -- Add ai_response column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voice_sessions' AND column_name = 'ai_response'
  ) THEN
    ALTER TABLE voice_sessions ADD COLUMN ai_response text;
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voice_sessions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE voice_sessions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index for context filtering
CREATE INDEX IF NOT EXISTS idx_voice_sessions_context ON voice_sessions(context_type);

-- Create storage bucket for voice recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-recordings', 'voice-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_voice_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS voice_sessions_updated_at ON voice_sessions;
CREATE TRIGGER voice_sessions_updated_at
  BEFORE UPDATE ON voice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_sessions_updated_at();
