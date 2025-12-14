/*
  # Fix Actions RLS Policy for Inserts

  1. Changes
    - Drop existing RLS policy that only has USING clause
    - Recreate policy with both USING and WITH CHECK clauses
    - This allows authenticated users to INSERT actions for their own outcomes
    
  2. Security
    - USING clause: Controls SELECT/UPDATE/DELETE operations (users can manage actions for their outcomes)
    - WITH CHECK clause: Controls INSERT/UPDATE operations (users can create actions for their outcomes)
    - Both clauses ensure the action belongs to an outcome owned by the user
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can manage their own actions" ON actions;
DROP POLICY IF EXISTS "Users can manage actions for their outcomes" ON actions;

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "Users can manage actions for their outcomes"
  ON actions
  FOR ALL
  TO authenticated
  USING (
    outcome_id IN (
      SELECT id FROM outcomes WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    outcome_id IN (
      SELECT id FROM outcomes WHERE user_id = auth.uid()
    )
  );
