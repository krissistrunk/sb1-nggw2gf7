/*
  # Part 6: Fix RLS Policies for Knowledge Base

  Optimizes knowledge base RLS policies.
*/

-- Knowledge notes
DROP POLICY IF EXISTS "Users can view own notes" ON knowledge_notes;
CREATE POLICY "Users can view own notes"
  ON knowledge_notes FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own notes" ON knowledge_notes;
CREATE POLICY "Users can insert own notes"
  ON knowledge_notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own notes" ON knowledge_notes;
CREATE POLICY "Users can update own notes"
  ON knowledge_notes FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own notes" ON knowledge_notes;
CREATE POLICY "Users can delete own notes"
  ON knowledge_notes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Knowledge links
DROP POLICY IF EXISTS "Users can view own links" ON knowledge_links;
CREATE POLICY "Users can view own links"
  ON knowledge_links FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own links" ON knowledge_links;
CREATE POLICY "Users can insert own links"
  ON knowledge_links FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own links" ON knowledge_links;
CREATE POLICY "Users can update own links"
  ON knowledge_links FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own links" ON knowledge_links;
CREATE POLICY "Users can delete own links"
  ON knowledge_links FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Knowledge tags
DROP POLICY IF EXISTS "Users can view own tags" ON knowledge_tags;
CREATE POLICY "Users can view own tags"
  ON knowledge_tags FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own tags" ON knowledge_tags;
CREATE POLICY "Users can insert own tags"
  ON knowledge_tags FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own tags" ON knowledge_tags;
CREATE POLICY "Users can update own tags"
  ON knowledge_tags FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own tags" ON knowledge_tags;
CREATE POLICY "Users can delete own tags"
  ON knowledge_tags FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Knowledge note tags
DROP POLICY IF EXISTS "Users can view own note tags" ON knowledge_note_tags;
CREATE POLICY "Users can view own note tags"
  ON knowledge_note_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_tags
      WHERE knowledge_tags.id = knowledge_note_tags.tag_id
      AND knowledge_tags.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own note tags" ON knowledge_note_tags;
CREATE POLICY "Users can insert own note tags"
  ON knowledge_note_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_tags
      WHERE knowledge_tags.id = knowledge_note_tags.tag_id
      AND knowledge_tags.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own note tags" ON knowledge_note_tags;
CREATE POLICY "Users can delete own note tags"
  ON knowledge_note_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_tags
      WHERE knowledge_tags.id = knowledge_note_tags.tag_id
      AND knowledge_tags.user_id = (select auth.uid())
    )
  );

-- Knowledge embeddings
DROP POLICY IF EXISTS "Users can view own embeddings" ON knowledge_embeddings;
CREATE POLICY "Users can view own embeddings"
  ON knowledge_embeddings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_notes
      WHERE knowledge_notes.id = knowledge_embeddings.note_id
      AND knowledge_notes.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own embeddings" ON knowledge_embeddings;
CREATE POLICY "Users can insert own embeddings"
  ON knowledge_embeddings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_notes
      WHERE knowledge_notes.id = knowledge_embeddings.note_id
      AND knowledge_notes.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own embeddings" ON knowledge_embeddings;
CREATE POLICY "Users can update own embeddings"
  ON knowledge_embeddings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_notes
      WHERE knowledge_notes.id = knowledge_embeddings.note_id
      AND knowledge_notes.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own embeddings" ON knowledge_embeddings;
CREATE POLICY "Users can delete own embeddings"
  ON knowledge_embeddings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_notes
      WHERE knowledge_notes.id = knowledge_embeddings.note_id
      AND knowledge_notes.user_id = (select auth.uid())
    )
  );
