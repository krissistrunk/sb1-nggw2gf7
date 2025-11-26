/*
  # Add Voice Preferences to User Settings

  ## Overview
  This migration enhances the user settings to include voice coach preferences for text-to-speech functionality.

  ## Changes

  ### User Settings Enhancement
  Updates the default settings in the users table to include voice preferences:

  - `voiceEnabled` - Whether voice features are enabled
  - `autoSpeak` - Whether coach responses should auto-play
  - `preferredVoice` - Name of preferred TTS voice
  - `speechRate` - Speech playback speed (0.5 to 2.0)
  - `speechPitch` - Voice pitch (0.0 to 2.0)
  - `speechVolume` - Volume level (0.0 to 1.0)

  This is a non-breaking change that extends the existing settings JSONB column.
*/

-- Update the default settings for existing users to include voice preferences
-- This is a non-destructive update that only affects the default value
ALTER TABLE users 
  ALTER COLUMN settings SET DEFAULT '{
    "theme": "light",
    "notifications": true,
    "voiceEnabled": true,
    "autoSpeak": true,
    "preferredVoice": null,
    "speechRate": 1.0,
    "speechPitch": 1.0,
    "speechVolume": 1.0
  }'::jsonb;

-- Update existing users who have NULL settings
UPDATE users 
SET settings = '{
  "theme": "light",
  "notifications": true,
  "voiceEnabled": true,
  "autoSpeak": true,
  "preferredVoice": null,
  "speechRate": 1.0,
  "speechPitch": 1.0,
  "speechVolume": 1.0
}'::jsonb
WHERE settings IS NULL;