/*
  # Simplify organization_members Policies - Final Fix

  ## Problem
  Complex policies can still cause recursion. Simplify to the most basic approach.
  
  ## Solution
  Use single, simple policies that don't reference organization_members in subqueries.
  
  ## Changes
  1. Drop all existing policies
  2. Create minimal, non-recursive policies
  3. Use direct column checks only
*/

-- Drop ALL existing policies on organization_members
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
DROP POLICY IF EXISTS "Users can join organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can update own membership" ON organization_members;
DROP POLICY IF EXISTS "Admins can add members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Admins can remove members" ON organization_members;

-- Create simple, non-recursive policies

-- SELECT: Users can view their own membership records
CREATE POLICY "view_own_membership"
  ON organization_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Users can create their own membership (e.g., accepting invites)
CREATE POLICY "insert_own_membership"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own membership
CREATE POLICY "update_own_membership"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own membership (leave organization)
CREATE POLICY "delete_own_membership"
  ON organization_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- For admin operations, we'll handle permissions at the application level
-- or use a service role for admin operations
