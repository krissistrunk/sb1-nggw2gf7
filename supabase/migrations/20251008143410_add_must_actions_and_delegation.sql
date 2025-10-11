/*
  # Add Must Actions and Delegation Support

  1. Schema Changes
    - Add `is_must` boolean column to actions table (default false)
    - Add `delegated_to` text column for delegate name (nullable)
    - Add `delegated_date` timestamptz for tracking when delegated (nullable)
    - Add `user_id` column to actions table if not exists (for RLS)

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

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE actions ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create index for querying must actions efficiently
CREATE INDEX IF NOT EXISTS idx_actions_is_must ON actions(is_must) WHERE is_must = true;

-- Create index for querying delegated actions
CREATE INDEX IF NOT EXISTS idx_actions_delegated ON actions(delegated_to) WHERE delegated_to IS NOT NULL;

-- Update RLS policies for actions table if user_id was just added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'user_id'
  ) THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own actions" ON actions;
    DROP POLICY IF EXISTS "Users can insert own actions" ON actions;
    DROP POLICY IF EXISTS "Users can update own actions" ON actions;
    DROP POLICY IF EXISTS "Users can delete own actions" ON actions;

    -- Create new policies
    CREATE POLICY "Users can view own actions"
      ON actions FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid()
        OR outcome_id IN (
          SELECT id FROM outcomes WHERE user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can insert own actions"
      ON actions FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid()
        OR outcome_id IN (
          SELECT id FROM outcomes WHERE user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can update own actions"
      ON actions FOR UPDATE
      TO authenticated
      USING (
        user_id = auth.uid()
        OR outcome_id IN (
          SELECT id FROM outcomes WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        user_id = auth.uid()
        OR outcome_id IN (
          SELECT id FROM outcomes WHERE user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can delete own actions"
      ON actions FOR DELETE
      TO authenticated
      USING (
        user_id = auth.uid()
        OR outcome_id IN (
          SELECT id FROM outcomes WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;