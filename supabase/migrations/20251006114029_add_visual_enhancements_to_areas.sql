/*
  # Visual Enhancements for Areas/Categories

  ## Overview
  Adds visual and descriptive fields to the areas table to support rich category cards
  with background images, detailed descriptions, and identity statements.

  ## Changes to `areas` Table
  
  ### New Columns
  - `background_image_url` (text, nullable) - URL for category background image
  - `description` (text, nullable) - Rich multi-line description of the area
  - `identity_statement` (text, nullable) - Role/identity statement (e.g., "I am a leader who...")
  - `color_hex` (text, nullable) - Hex color code for category theming
  - `sort_order` (integer) - Manual sorting order for categories
  
  ## Notes
  1. Safe operations using IF NOT EXISTS checks
  2. No data loss - only adding nullable columns
  3. Maintains existing RLS policies
  4. Adds indexes for performance
*/

-- Add background_image_url to areas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'areas' AND column_name = 'background_image_url'
  ) THEN
    ALTER TABLE areas ADD COLUMN background_image_url text;
  END IF;
END $$;

-- Add description to areas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'areas' AND column_name = 'description'
  ) THEN
    ALTER TABLE areas ADD COLUMN description text;
  END IF;
END $$;

-- Add identity_statement to areas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'areas' AND column_name = 'identity_statement'
  ) THEN
    ALTER TABLE areas ADD COLUMN identity_statement text;
  END IF;
END $$;

-- Add color_hex to areas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'areas' AND column_name = 'color_hex'
  ) THEN
    ALTER TABLE areas ADD COLUMN color_hex text;
  END IF;
END $$;

-- Add sort_order to areas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'areas' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE areas ADD COLUMN sort_order integer DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_areas_sort_order ON areas(user_id, sort_order);
  END IF;
END $$;

-- Add area_id to actions table for direct category association
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'area_id'
  ) THEN
    ALTER TABLE actions ADD COLUMN area_id uuid REFERENCES areas(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_actions_area ON actions(area_id);
  END IF;
END $$;

-- Add scheduled_date and scheduled_time to actions for weekly planning
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE actions ADD COLUMN scheduled_date date;
    CREATE INDEX IF NOT EXISTS idx_actions_scheduled ON actions(user_id, scheduled_date);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'scheduled_time'
  ) THEN
    ALTER TABLE actions ADD COLUMN scheduled_time time;
  END IF;
END $$;

-- Add estimated_minutes to actions for time blocking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'estimated_minutes'
  ) THEN
    ALTER TABLE actions ADD COLUMN estimated_minutes integer DEFAULT 30;
  END IF;
END $$;

-- Add is_priority flag to actions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'is_priority'
  ) THEN
    ALTER TABLE actions ADD COLUMN is_priority boolean DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_actions_priority ON actions(is_priority);
  END IF;
END $$;

-- Add result_notes to actions for capturing outcomes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'result_notes'
  ) THEN
    ALTER TABLE actions ADD COLUMN result_notes text;
  END IF;
END $$;