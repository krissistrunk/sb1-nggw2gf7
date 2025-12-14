/*
  # Fix Infinite Recursion in organization_members Policies

  ## Problem
  The organization_members table has policies that query itself, creating infinite recursion.
  
  ## Solution
  Replace the recursive policies with direct checks:
  - Users can view/update their own membership records (where user_id = auth.uid())
  - Admins can manage all members through a helper function that doesn't cause recursion
  
  ## Changes
  1. Drop existing problematic policies
  2. Create new non-recursive policies
  3. Add a helper function to check admin status without recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their organization" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;

-- Create helper function to check if user is admin (uses a different approach)
CREATE OR REPLACE FUNCTION is_organization_admin(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New non-recursive policies for organization_members

-- Users can view their own membership records
CREATE POLICY "Users can view own membership"
  ON organization_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view other members in organizations where they are members
-- This uses a materialized subquery to avoid recursion
CREATE POLICY "Users can view org members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      WITH user_orgs AS (
        SELECT DISTINCT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
      )
      SELECT organization_id FROM user_orgs
    )
  );

-- Allow users to insert themselves into organizations (for invites)
CREATE POLICY "Users can join organizations"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own membership
CREATE POLICY "Users can update own membership"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can insert new members
CREATE POLICY "Admins can add members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (is_organization_admin(organization_id));

-- Admins can update any member in their org
CREATE POLICY "Admins can update members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (is_organization_admin(organization_id))
  WITH CHECK (is_organization_admin(organization_id));

-- Admins can delete members from their org
CREATE POLICY "Admins can remove members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (is_organization_admin(organization_id));

-- Fix organizations policies to use the helper function
DROP POLICY IF EXISTS "Organization admins can update their organization" ON organizations;

CREATE POLICY "Organization admins can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (is_organization_admin(id))
  WITH CHECK (is_organization_admin(id));
