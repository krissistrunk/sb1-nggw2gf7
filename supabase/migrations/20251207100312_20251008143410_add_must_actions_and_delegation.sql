/*
  # Add Must Actions and Delegation Support

  1. Schema Changes
    - Add `is_must` boolean column to actions table (default false)
    - Add `delegated_to` text column for delegate name (nullable)
    - Add `delegated_date` timestamptz for tracking when delegated (nullable)

  2. Purpose
    - Enable marking critical "must do" actions during daily planning
    - Support delegation tracking for team/assistant assignments
    - Improve time management by distinguishing must vs optional actions

  3. Notes
    - is_must defaults to false to maintain backward compatibility
    - delegated_to is optional and only set when action is delegated
    - All existing actions will work without changes
*/

-- Add must action and delegation columns to actions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'is_must'
  ) THEN
    ALTER TABLE actions ADD COLUMN is_must boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'delegated_to'
  ) THEN
    ALTER TABLE actions ADD COLUMN delegated_to text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'delegated_date'
  ) THEN
    ALTER TABLE actions ADD COLUMN delegated_date timestamptz;
  END IF;
END $$;

-- Create index for querying must actions efficiently
CREATE INDEX IF NOT EXISTS idx_actions_is_must ON actions(is_must) WHERE is_must = true;

-- Create index for querying delegated actions
CREATE INDEX IF NOT EXISTS idx_actions_delegated ON actions(delegated_to) WHERE delegated_to IS NOT NULL;
