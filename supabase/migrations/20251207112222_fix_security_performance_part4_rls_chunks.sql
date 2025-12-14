/*
  # Part 4: Fix RLS Policies for Chunks and Chunk Items

  Optimizes chunk-related RLS policies.
*/

-- Chunks
DROP POLICY IF EXISTS "Users can view their own chunks" ON chunks;
CREATE POLICY "Users can view their own chunks"
  ON chunks FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own chunks" ON chunks;
CREATE POLICY "Users can insert their own chunks"
  ON chunks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own chunks" ON chunks;
CREATE POLICY "Users can update their own chunks"
  ON chunks FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own chunks" ON chunks;
CREATE POLICY "Users can delete their own chunks"
  ON chunks FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Chunk items
DROP POLICY IF EXISTS "Users can view their own chunk items" ON chunk_items;
CREATE POLICY "Users can view their own chunk items"
  ON chunk_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chunks
      WHERE chunks.id = chunk_items.chunk_id
      AND chunks.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert their own chunk items" ON chunk_items;
CREATE POLICY "Users can insert their own chunk items"
  ON chunk_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chunks
      WHERE chunks.id = chunk_items.chunk_id
      AND chunks.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own chunk items" ON chunk_items;
CREATE POLICY "Users can update their own chunk items"
  ON chunk_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chunks
      WHERE chunks.id = chunk_items.chunk_id
      AND chunks.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete their own chunk items" ON chunk_items;
CREATE POLICY "Users can delete their own chunk items"
  ON chunk_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chunks
      WHERE chunks.id = chunk_items.chunk_id
      AND chunks.user_id = (select auth.uid())
    )
  );
