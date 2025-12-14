/*
  # Fix Outcomes RLS Policy for Inserts

  1. Changes
    - Drop existing RLS policy that only has USING clause
    - Recreate policy with both USING and WITH CHECK clauses
    - This allows authenticated users to INSERT their own outcomes
    
  2. Security
    - USING clause: Controls SELECT operations (users can see their own outcomes)
    - WITH CHECK clause: Controls INSERT/UPDATE operations (users can create/update their own outcomes)
    - Both clauses ensure user_id matches auth.uid()
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can manage their own outcomes" ON outcomes;

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "Users can manage their own outcomes"
  ON outcomes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
