/*
  # Fix Users Table RLS Policies
  
  ## Problem
  Users cannot sign up because there's no INSERT policy on the users table.
  When auth.signUp() succeeds, the app tries to create a record in public.users
  but it's blocked by RLS.
  
  ## Changes
  1. Add INSERT policy for users table
     - Allows authenticated users to insert their own user record
     - Checks that the user_id matches auth.uid()
  
  ## Security
  - Users can only create a record for themselves (id must match auth.uid())
  - RLS remains enabled and restrictive
*/

-- Add INSERT policy for users table
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
