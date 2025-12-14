/*
  # Part 5: Fix RLS Policies for AI Features

  Optimizes AI-related RLS policies.
*/

-- AI suggestions
DROP POLICY IF EXISTS "Users can view their own AI suggestions" ON ai_suggestions;
CREATE POLICY "Users can view their own AI suggestions"
  ON ai_suggestions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own AI suggestions" ON ai_suggestions;
CREATE POLICY "Users can insert their own AI suggestions"
  ON ai_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own AI suggestions" ON ai_suggestions;
CREATE POLICY "Users can update their own AI suggestions"
  ON ai_suggestions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own AI suggestions" ON ai_suggestions;
CREATE POLICY "Users can delete their own AI suggestions"
  ON ai_suggestions FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- AI insights
DROP POLICY IF EXISTS "Users can view their own AI insights" ON ai_insights;
CREATE POLICY "Users can view their own AI insights"
  ON ai_insights FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own AI insights" ON ai_insights;
CREATE POLICY "Users can insert their own AI insights"
  ON ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own AI insights" ON ai_insights;
CREATE POLICY "Users can update their own AI insights"
  ON ai_insights FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own AI insights" ON ai_insights;
CREATE POLICY "Users can delete their own AI insights"
  ON ai_insights FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- AI interaction logs
DROP POLICY IF EXISTS "Users can view their own AI interaction logs" ON ai_interaction_logs;
CREATE POLICY "Users can view their own AI interaction logs"
  ON ai_interaction_logs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own AI interaction logs" ON ai_interaction_logs;
CREATE POLICY "Users can insert their own AI interaction logs"
  ON ai_interaction_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Page backgrounds
DROP POLICY IF EXISTS "Users can view own page backgrounds" ON page_backgrounds;
CREATE POLICY "Users can view own page backgrounds"
  ON page_backgrounds FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own page backgrounds" ON page_backgrounds;
CREATE POLICY "Users can insert own page backgrounds"
  ON page_backgrounds FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own page backgrounds" ON page_backgrounds;
CREATE POLICY "Users can update own page backgrounds"
  ON page_backgrounds FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own page backgrounds" ON page_backgrounds;
CREATE POLICY "Users can delete own page backgrounds"
  ON page_backgrounds FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));
