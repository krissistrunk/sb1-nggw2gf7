/*
  # Add Voice Coach Settings

  1. New Columns
    - `voice_coach_auto_delay_seconds` (integer, default 5) - Configurable delay before auto-activating microphone after coach speaks
    - `voice_coach_silence_timeout` (integer, default 10) - Seconds of silence before auto-stopping recording
    - `voice_coach_audio_cues` (boolean, default false) - Whether to play audio cues on auto-stop
  
  2. Changes
    - Add three new columns to users table for voice coach preferences
    - Set sensible defaults for all existing and new users
  
  3. Notes
    - These settings provide user control over the voice coach interaction timing
    - Auto delay range should be 3-10 seconds (enforced in UI)
    - Silence timeout helps create natural conversation pauses
*/

-- Add voice coach settings columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'voice_coach_auto_delay_seconds'
  ) THEN
    ALTER TABLE users ADD COLUMN voice_coach_auto_delay_seconds integer DEFAULT 5 CHECK (voice_coach_auto_delay_seconds >= 3 AND voice_coach_auto_delay_seconds <= 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'voice_coach_silence_timeout'
  ) THEN
    ALTER TABLE users ADD COLUMN voice_coach_silence_timeout integer DEFAULT 10 CHECK (voice_coach_silence_timeout >= 5 AND voice_coach_silence_timeout <= 30);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'voice_coach_audio_cues'
  ) THEN
    ALTER TABLE users ADD COLUMN voice_coach_audio_cues boolean DEFAULT false;
  END IF;
END $$;
