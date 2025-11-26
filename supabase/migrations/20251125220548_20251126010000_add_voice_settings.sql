/*
  # Add Voice Settings to Users

  ## Overview
  Adds voice coach settings to users table for customizing voice output.

  ## Changes
  - Add voice_settings jsonb column to users table with default values
  
  ## Voice Settings Schema
  {
    "voice_mode": "browser" | "elevenlabs",
    "elevenlabs_voice_id": string (default: Rachel voice),
    "browser_voice": string (system voice name),
    "speech_rate": number (0.5-2.0, default 1.0),
    "pitch": number (0-2, default 1.0),
    "volume": number (0-1, default 1.0)
  }

  ## Security
  - Users can update their own voice settings
  - RLS policies ensure data privacy
*/

-- Add voice_settings column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'voice_settings'
  ) THEN
    ALTER TABLE users ADD COLUMN voice_settings jsonb DEFAULT '{
      "voice_mode": "browser",
      "elevenlabs_voice_id": "EXAVITQu4vr4xnSDxMaL",
      "browser_voice": null,
      "speech_rate": 1.0,
      "pitch": 1.0,
      "volume": 1.0
    }'::jsonb;
  END IF;
END $$;