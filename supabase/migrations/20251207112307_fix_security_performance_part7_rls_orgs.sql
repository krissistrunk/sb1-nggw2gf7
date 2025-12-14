/*
  # Part 7: Fix RLS Policies for Organizations

  Optimizes organization and organization member RLS policies.
*/

-- Organization members
DROP POLICY IF EXISTS "view_own_membership" ON organization_members;
CREATE POLICY "view_own_membership"
  ON organization_members FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "insert_own_membership" ON organization_members;
CREATE POLICY "insert_own_membership"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "update_own_membership" ON organization_members;
CREATE POLICY "update_own_membership"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "delete_own_membership" ON organization_members;
CREATE POLICY "delete_own_membership"
  ON organization_members FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Organizations
DROP POLICY IF EXISTS "users_can_update_own_organization" ON organizations;
CREATE POLICY "users_can_update_own_organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id
      FROM users
      WHERE id = (select auth.uid()) AND organization_id IS NOT NULL
    )
  );
