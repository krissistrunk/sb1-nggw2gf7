/*
  # Add Sort Order to Actions

  ## Overview
  Adds a `sort_order` column to the actions table to enable drag-and-drop reordering
  of actions within each outcome during daily planning.

  ## Changes

  ### `actions` table enhancements:
  - `sort_order` (integer, default 0) - Stores the display order of actions within their outcome
  - Index on (outcome_id, sort_order) for efficient ordered queries
  - Populate initial sort_order values based on priority and created_at

  ## Migration Strategy
  1. Add the sort_order column with default value 0
  2. Populate sort_order for existing actions based on priority (1=highest priority)
     and created_at (older actions first within same priority)
  3. Create index for performance

  ## Security
  - Maintains existing RLS policies
  - No additional security changes needed
*/

-- Add sort_order column to actions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE actions ADD COLUMN sort_order integer DEFAULT 0;
  END IF;
END $$;

-- Populate sort_order for existing actions
-- Sort by priority (1 first, then 2, then 3) and created_at within each priority
-- Use ROW_NUMBER to assign sequential sort_order values per outcome
UPDATE actions
SET sort_order = subquery.row_num
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY outcome_id
      ORDER BY priority ASC, created_at ASC
    ) - 1 as row_num
  FROM actions
) AS subquery
WHERE actions.id = subquery.id
AND actions.sort_order = 0;

-- Create index on outcome_id and sort_order for efficient ordered queries
CREATE INDEX IF NOT EXISTS idx_actions_outcome_sort
ON actions(outcome_id, sort_order);

-- Create index on outcome_id, sort_order, and done for filtered queries
CREATE INDEX IF NOT EXISTS idx_actions_outcome_sort_done
ON actions(outcome_id, sort_order, done);
