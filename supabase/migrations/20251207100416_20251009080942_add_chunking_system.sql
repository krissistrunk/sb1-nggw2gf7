/*
  # Add Chunking System for Bottom-Up RPM Planning

  ## Overview
  Adds a chunking system that allows users to group related captured items together
  and convert them into RPM outcomes or goals. This supports bottom-up planning
  alongside the existing top-down approach.

  ## New Tables

  ### `chunks`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users) - Owner of the chunk
  - `organization_id` (uuid, foreign key to organizations) - Organization context
  - `name` (text) - Chunk name/title
  - `description` (text, nullable) - Optional description
  - `color` (text) - Visual color for organization (hex code)
  - `status` (text) - ACTIVE or ARCHIVED
  - `converted_to_type` (text, nullable) - What was created: OUTCOME, GOAL, or null
  - `converted_to_id` (uuid, nullable) - ID of created outcome/goal
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `converted_at` (timestamptz, nullable) - When chunk was converted

  ### `chunk_items`
  - `id` (uuid, primary key)
  - `chunk_id` (uuid, foreign key to chunks)
  - `inbox_item_id` (uuid, foreign key to inbox_items)
  - `sort_order` (integer) - Order within the chunk
  - `created_at` (timestamptz)

  ## Modified Tables
  - `inbox_items` - Add `chunk_id` for quick reference
  - `outcomes` - Add `source_chunk_id` to track chunk origin

  ## Security
  - All tables have RLS enabled
  - Users can only access their own chunks and chunk items
  - Chunk items inherit user access from parent chunk

  ## Indexes
  - Index on user_id and status for efficient chunk queries
  - Index on chunk_id for quick item lookups
  - Unique constraint on chunk_id + inbox_item_id to prevent duplicates
*/

-- Create chunks table
CREATE TABLE IF NOT EXISTS chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#6366F1',
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  converted_to_type text CHECK (converted_to_type IN ('OUTCOME', 'GOAL')),
  converted_to_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  converted_at timestamptz
);

ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_chunks_user_status ON chunks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_chunks_organization ON chunks(organization_id);

-- Create chunk_items junction table
CREATE TABLE IF NOT EXISTS chunk_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id uuid NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  inbox_item_id uuid NOT NULL REFERENCES inbox_items(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(chunk_id, inbox_item_id)
);

ALTER TABLE chunk_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_chunk_items_chunk ON chunk_items(chunk_id);
CREATE INDEX IF NOT EXISTS idx_chunk_items_inbox ON chunk_items(inbox_item_id);

-- Add chunk_id to inbox_items for quick reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inbox_items' AND column_name = 'chunk_id'
  ) THEN
    ALTER TABLE inbox_items ADD COLUMN chunk_id uuid REFERENCES chunks(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_inbox_items_chunk ON inbox_items(chunk_id);
  END IF;
END $$;

-- Add source_chunk_id to outcomes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'outcomes' AND column_name = 'source_chunk_id'
  ) THEN
    ALTER TABLE outcomes ADD COLUMN source_chunk_id uuid REFERENCES chunks(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_outcomes_source_chunk ON outcomes(source_chunk_id);
  END IF;
END $$;

-- RLS Policies for chunks
CREATE POLICY "Users can view their own chunks"
  ON chunks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chunks"
  ON chunks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chunks"
  ON chunks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own chunks"
  ON chunks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for chunk_items
CREATE POLICY "Users can view their own chunk items"
  ON chunk_items FOR SELECT
  TO authenticated
  USING (
    chunk_id IN (
      SELECT id FROM chunks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own chunk items"
  ON chunk_items FOR INSERT
  TO authenticated
  WITH CHECK (
    chunk_id IN (
      SELECT id FROM chunks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own chunk items"
  ON chunk_items FOR UPDATE
  TO authenticated
  USING (
    chunk_id IN (
      SELECT id FROM chunks WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    chunk_id IN (
      SELECT id FROM chunks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own chunk items"
  ON chunk_items FOR DELETE
  TO authenticated
  USING (
    chunk_id IN (
      SELECT id FROM chunks WHERE user_id = auth.uid()
    )
  );
