/*
  # Add counted_as_must field to time_blocks
  
  ## Overview
  This migration enhances the time_blocks table to track whether a focus session
  should count toward the daily "must" time goal. This enables dual progress tracking:
  must time (commitment) vs. total focus time (productivity).
  
  ## Changes
  
  1. New Column
    - `counted_as_must` (boolean, default false)
      - Indicates if this time block counts toward must time goals
      - Set to true when the session is linked to a must action
      - Used for calculating daily must time progress
  
  ## Notes
  - Existing time_blocks will default to false for counted_as_must
  - This field is set during session completion based on the linked action's is_must flag
  - Enables separate tracking of must time vs. total productive time
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_blocks' AND column_name = 'counted_as_must'
  ) THEN
    ALTER TABLE time_blocks ADD COLUMN counted_as_must boolean DEFAULT false;
  END IF;
END $$;