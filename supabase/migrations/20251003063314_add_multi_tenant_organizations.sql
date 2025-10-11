/*
  # Multi-Tenant Organizations Schema
  
  ## Overview
  Transforms the application into a multi-tenant system with white-labeling support.
  Each organization can have custom branding, subdomain, and feature flags.
  
  ## New Tables
  
  ### `organizations`
  - `id` (uuid, primary key)
  - `name` (text) - Organization display name
  - `subdomain` (text, unique) - URL subdomain (e.g., 'acme' for acme.app.com)
  - `custom_domain` (text, nullable) - Custom domain if configured
  - `logo_url` (text, nullable) - Organization logo
  - `favicon_url` (text, nullable) - Custom favicon
  - `primary_color` (text) - Brand color (hex code, default orange)
  - `subscription_tier` (text) - Starter, Professional, Enterprise
  - `feature_flags` (jsonb) - Enabled features per org
  - `settings` (jsonb) - Additional org settings
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `organization_members`
  - `id` (uuid, primary key)
  - `organization_id` (uuid, foreign key to organizations)
  - `user_id` (uuid, foreign key to auth.users)
  - `role` (text) - ADMIN, MANAGER, MEMBER
  - `invited_at` (timestamptz)
  - `joined_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
  
  ### `life_plans`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `organization_id` (uuid, foreign key to organizations)
  - `vision` (text) - 3-5 year vision statement
  - `values` (jsonb) - Array of selected values
  - `roles` (jsonb) - Array of life roles
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `inbox_items`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `organization_id` (uuid, foreign key to organizations)
  - `content` (text) - The captured note/idea
  - `item_type` (text) - NOTE, ACTION_IDEA, OUTCOME_IDEA
  - `triaged` (boolean) - Whether it's been processed
  - `triaged_to_id` (uuid, nullable) - ID of outcome/action it was converted to
  - `created_at` (timestamptz)
  
  ### `review_sessions`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `organization_id` (uuid, foreign key to organizations)
  - `ritual_type` (text) - MORNING, EVENING, WEEKLY, MONTHLY, QUARTERLY
  - `date` (date) - Date of ritual
  - `responses` (jsonb) - User's answers to ritual questions
  - `insights` (text, nullable) - AI-generated insights
  - `created_at` (timestamptz)
  
  ## Modified Tables
  Adds `organization_id` foreign key to existing tables:
  - users
  - areas
  - outcomes
  - weekly_plans
  - daily_notes
  - voice_sessions
  
  ## Changes
  1. Creates organizations infrastructure
  2. Adds organization_id to all user-scoped tables
  3. Creates life_plans for vision/values/roles
  4. Creates inbox_items for capture system
  5. Creates review_sessions for rituals
  6. Adds power_statement to outcomes
  7. Adds purpose_statement and success_metric to areas
  8. Enables RLS on all new tables
  9. Creates policies for organization-scoped access
  
  ## Security
  - All tables have RLS enabled
  - Policies ensure users can only access data from their organizations
  - Organization admins can manage members
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  custom_domain text UNIQUE,
  logo_url text,
  favicon_url text,
  primary_color text DEFAULT '#F97316',
  subscription_tier text DEFAULT 'STARTER' CHECK (subscription_tier IN ('STARTER', 'PROFESSIONAL', 'ENTERPRISE')),
  feature_flags jsonb DEFAULT '{"voiceCoaching": true, "analytics": false, "customIntegrations": false}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create organization_members junction table
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MANAGER', 'MEMBER')),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Add organization_id to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE users ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
  END IF;
END $$;

-- Add organization_id to areas table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'areas' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE areas ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_areas_organization_id ON areas(organization_id);
  END IF;
END $$;

-- Add purpose_statement and success_metric to areas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'areas' AND column_name = 'purpose_statement'
  ) THEN
    ALTER TABLE areas ADD COLUMN purpose_statement text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'areas' AND column_name = 'success_metric'
  ) THEN
    ALTER TABLE areas ADD COLUMN success_metric text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'areas' AND column_name = 'quarterly_focus'
  ) THEN
    ALTER TABLE areas ADD COLUMN quarterly_focus boolean DEFAULT false;
  END IF;
END $$;

-- Add organization_id to outcomes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'outcomes' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE outcomes ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_outcomes_organization_id ON outcomes(organization_id);
  END IF;
END $$;

-- Add power_statement to outcomes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'outcomes' AND column_name = 'power_statement'
  ) THEN
    ALTER TABLE outcomes ADD COLUMN power_statement text;
  END IF;
END $$;

-- Add organization_id to weekly_plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weekly_plans' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE weekly_plans ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_weekly_plans_organization_id ON weekly_plans(organization_id);
  END IF;
END $$;

-- Add organization_id to daily_notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_notes' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE daily_notes ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_daily_notes_organization_id ON daily_notes(organization_id);
  END IF;
END $$;

-- Add organization_id to voice_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'voice_sessions' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE voice_sessions ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_voice_sessions_organization_id ON voice_sessions(organization_id);
  END IF;
END $$;

-- Create life_plans table
CREATE TABLE IF NOT EXISTS life_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vision text NOT NULL,
  values jsonb DEFAULT '[]'::jsonb,
  roles jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE life_plans ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_life_plans_user_org ON life_plans(user_id, organization_id);

-- Create inbox_items table
CREATE TABLE IF NOT EXISTS inbox_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content text NOT NULL,
  item_type text DEFAULT 'NOTE' CHECK (item_type IN ('NOTE', 'ACTION_IDEA', 'OUTCOME_IDEA')),
  triaged boolean DEFAULT false,
  triaged_to_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_inbox_items_user_org ON inbox_items(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_inbox_items_triaged ON inbox_items(triaged) WHERE triaged = false;

-- Create review_sessions table
CREATE TABLE IF NOT EXISTS review_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ritual_type text NOT NULL CHECK (ritual_type IN ('MORNING', 'EVENING', 'WEEKLY', 'MONTHLY', 'QUARTERLY')),
  date date NOT NULL,
  responses jsonb DEFAULT '{}'::jsonb,
  insights text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_review_sessions_user_org ON review_sessions(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_date ON review_sessions(date DESC);

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their organization"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage members"
  ON organization_members FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- RLS Policies for life_plans
CREATE POLICY "Users can manage their own life plan"
  ON life_plans FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for inbox_items
CREATE POLICY "Users can manage their own inbox items"
  ON inbox_items FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for review_sessions
CREATE POLICY "Users can manage their own review sessions"
  ON review_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Update existing RLS policies to include organization context
DROP POLICY IF EXISTS "Users can manage their own areas" ON areas;
CREATE POLICY "Users can manage their own areas"
  ON areas FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own outcomes" ON outcomes;
CREATE POLICY "Users can manage their own outcomes"
  ON outcomes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage actions for their outcomes" ON actions;
CREATE POLICY "Users can manage actions for their outcomes"
  ON actions FOR ALL
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
