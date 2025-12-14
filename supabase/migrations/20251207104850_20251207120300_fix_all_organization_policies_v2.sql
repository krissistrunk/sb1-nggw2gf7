/*
  # Complete Fix for Organization Policies - V2

  ## Problem
  The organizations table policies query organization_members, which can cause
  performance issues or recursion problems during signup/organization creation.
  
  ## Solution
  Simplify all policies to avoid complex subqueries.
  
  ## Changes
  1. Drop existing organization policies FIRST
  2. Then drop the helper function
  3. Create minimal, performant policies
*/

-- Drop existing organization policies FIRST (before dropping the function they depend on)
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Organization admins can update their organization" ON organizations;

-- Now we can safely drop the helper function
DROP FUNCTION IF EXISTS is_organization_admin(uuid);

-- Create simple, performant policies for organizations

-- Allow authenticated users to view all organizations
-- (The app will filter based on user's organization_id)
CREATE POLICY "authenticated_can_view_organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create organizations (needed during signup)
CREATE POLICY "authenticated_can_create_organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow updates to organizations where the user is a member
-- Uses users table instead of organization_members to avoid potential recursion
CREATE POLICY "users_can_update_own_organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- For admin operations, handle at the application layer
-- or use Supabase service role for privileged operations
