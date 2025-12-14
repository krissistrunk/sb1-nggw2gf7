/*
  # Add Chunk-to-Outcome Tracking Fields
  
  1. Changes
    - Add `source_chunk_id` to outcomes table to track which chunk created the outcome
    - Add `source_chunk_item_id` to actions table to track which chunk item created the action
    - Add indexes for performance
  
  2. Purpose
    - Enables RPM methodology flow: Capture → Organize (Chunks) → Convert to Outcomes
    - Allows users to see the connection between organized chunks and created outcomes
    - Supports automatic action creation from chunk items
*/

-- Add source_chunk_id to outcomes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'outcomes' AND column_name = 'source_chunk_id'
  ) THEN
    ALTER TABLE outcomes ADD COLUMN source_chunk_id uuid REFERENCES chunks(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add source_chunk_item_id to actions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'source_chunk_item_id'
  ) THEN
    ALTER TABLE actions ADD COLUMN source_chunk_item_id uuid REFERENCES chunk_items(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_outcomes_source_chunk_id ON outcomes(source_chunk_id);
CREATE INDEX IF NOT EXISTS idx_actions_source_chunk_item_id ON actions(source_chunk_item_id);