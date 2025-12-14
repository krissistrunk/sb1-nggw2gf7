/*
  # Add Voice Preferences to User Settings

  ## Overview
  This migration enhances the user settings to include voice coach preferences for text-to-speech functionality.

  ## Changes

  ### User Settings Enhancement
  Updates the default settings in the users table to include voice preferences

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

-- Update existing users who have empty settings
UPDATE users 
SET settings = settings || '{
  "voiceEnabled": true,
  "autoSpeak": true,
  "preferredVoice": null,
  "speechRate": 1.0,
  "speechPitch": 1.0,
  "speechVolume": 1.0
}'::jsonb
WHERE settings IS NOT NULL AND NOT (settings ? 'voiceEnabled');
