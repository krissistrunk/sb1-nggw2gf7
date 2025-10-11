/*
  # Enhance RPM Planning Schema
  
  ## Overview
  Adds fields and structures to fully support Tony Robbins' RPM (Results, Purpose, Massive Action Plan) methodology.
  
  ## Changes to Existing Tables
  
  ### `outcomes` table enhancements:
  - `metric` (text) - Specific measurable metric for the result
  - `target_date` (date) - Deadline for achieving the outcome
  - `completed_at` (timestamptz) - When the outcome was completed
  - Existing: `title` (Result), `purpose` (Purpose), `actions` (MAP)
  
  ### `actions` table enhancements:
  - `user_id` (uuid) - Link to user for proper querying
  - `scheduled_time` (text) - Time of day for time blocking (HH:MM format)
  - `duration_minutes` (integer) - Estimated duration for time blocking
  - Already exists: `scheduled_date`, `done`, `priority`
  
  ### `daily_notes` table usage:
  - `morning_intention` (text) - Morning planning ritual notes
  - `evening_reflection` (text) - Evening review notes
  - `energy_level` (integer) - Daily energy rating 1-5
  - Links to specific date for daily planning
  
  ### `weekly_plans` table structure:
  - `focus_outcomes` (jsonb) - Array of 3-5 key outcome IDs for the week
  - `reflection` (text) - Weekly review reflection
  - `week_start_date` (date) - Monday of the planning week
  - Challenges and strategies can be added to reflection
  
  ## New Features Added
  1. Metric and target date fields to outcomes for specificity
  2. User ID to actions for direct querying
  3. Time blocking support with scheduled_time and duration
  4. Completion tracking with completed_at timestamp
  
  ## Security
  - Maintains existing RLS policies
  - All new fields follow existing security model
*/

-- Add metric field to outcomes for measurability
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'outcomes' AND column_name = 'metric'
  ) THEN
    ALTER TABLE outcomes ADD COLUMN metric text;
  END IF;
END $$;

-- Add target_date to outcomes for time-bound results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'outcomes' AND column_name = 'target_date'
  ) THEN
    ALTER TABLE outcomes ADD COLUMN target_date date;
  END IF;
END $$;

-- Add completed_at timestamp to outcomes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'outcomes' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE outcomes ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Add user_id to actions for direct user queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'actions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE actions ADD COLUMN user_id uuid REFERENCES users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_actions_user_id ON actions(user_id);
  END IF;
END $$;

-- Populate user_id in actions from outcomes
UPDATE actions 
SET user_id = outcomes.user_id 
FROM outcomes 
WHERE actions.outcome_id = outcomes.id 
AND actions.user_id IS NULL;

-- Add scheduled_time for time blocking (HH:MM format)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'actions' AND column_name = 'scheduled_time'
  ) THEN
    ALTER TABLE actions ADD COLUMN scheduled_time text;
  END IF;
END $$;

-- Add duration_minutes for time blocking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'actions' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE actions ADD COLUMN duration_minutes integer DEFAULT 60;
  END IF;
END $$;

-- Add completed_at to actions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'actions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE actions ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Create index on scheduled_date for faster daily queries
CREATE INDEX IF NOT EXISTS idx_actions_scheduled_date ON actions(scheduled_date) WHERE scheduled_date IS NOT NULL;

-- Create index on user_id and scheduled_date combination
CREATE INDEX IF NOT EXISTS idx_actions_user_scheduled ON actions(user_id, scheduled_date) WHERE scheduled_date IS NOT NULL;

-- Add RLS policy for actions if not exists (users can manage their own actions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'actions' AND policyname = 'Users can manage their own actions'
  ) THEN
    CREATE POLICY "Users can manage their own actions"
      ON actions FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
