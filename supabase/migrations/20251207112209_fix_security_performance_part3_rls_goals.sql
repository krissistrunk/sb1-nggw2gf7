/*
  # Part 3: Fix RLS Policies for Goals and Templates

  Continues optimizing RLS policies with (select auth.uid()) pattern.
*/

-- Goals
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
CREATE POLICY "Users can insert their own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;
CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Outcome templates
DROP POLICY IF EXISTS "Anyone can view public templates" ON outcome_templates;
CREATE POLICY "Anyone can view public templates"
  ON outcome_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own templates" ON outcome_templates;
CREATE POLICY "Users can insert their own templates"
  ON outcome_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own templates" ON outcome_templates;
CREATE POLICY "Users can update their own templates"
  ON outcome_templates FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own templates" ON outcome_templates;
CREATE POLICY "Users can delete their own templates"
  ON outcome_templates FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

-- Time blocks
DROP POLICY IF EXISTS "Users can view their own blocks" ON time_blocks;
CREATE POLICY "Users can view their own blocks"
  ON time_blocks FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own blocks" ON time_blocks;
CREATE POLICY "Users can insert their own blocks"
  ON time_blocks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own blocks" ON time_blocks;
CREATE POLICY "Users can update their own blocks"
  ON time_blocks FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own blocks" ON time_blocks;
CREATE POLICY "Users can delete their own blocks"
  ON time_blocks FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));
