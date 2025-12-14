/*
  # Add Draft Status, Templates Library, and Time Blocks

  ## Overview
  Enhances the RPM system with:
  1. Draft status for Goals and Outcomes to allow save-and-resume
  2. Templates library for common OPA patterns
  3. Time blocks for focused work sessions

  ## New Tables

  ### `outcome_templates`
  Templates for common outcomes with pre-filled purpose and actions

  ### `time_blocks`
  Focused work sessions for tracking RPM blocks

  ## Modified Tables

  ### `goals`
  Add draft status field:
  - `is_draft` (boolean) - Whether this is a saved draft

  ### `outcomes`
  Add draft status field:
  - `is_draft` (boolean) - Whether this is a saved draft

  ## Security
  - RLS enabled on all new tables
  - Templates are public or user-scoped
  - Time blocks are strictly user-scoped
*/

-- Add is_draft to goals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'is_draft'
  ) THEN
    ALTER TABLE goals ADD COLUMN is_draft boolean DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_goals_draft ON goals(user_id, is_draft);
  END IF;
END $$;

-- Add is_draft to outcomes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'outcomes' AND column_name = 'is_draft'
  ) THEN
    ALTER TABLE outcomes ADD COLUMN is_draft boolean DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_outcomes_draft ON outcomes(user_id, is_draft);
  END IF;
END $$;

-- Create outcome_templates table
CREATE TABLE IF NOT EXISTS outcome_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  outcome_title text NOT NULL,
  purpose text NOT NULL,
  actions jsonb DEFAULT '[]'::jsonb,
  estimated_duration_days integer,
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE outcome_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_templates_category ON outcome_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_public ON outcome_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_creator ON outcome_templates(created_by);

-- Create time_blocks table
CREATE TABLE IF NOT EXISTS time_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  outcome_id uuid REFERENCES outcomes(id) ON DELETE CASCADE,
  action_id uuid REFERENCES actions(id) ON DELETE CASCADE,
  title text NOT NULL,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  actual_start timestamptz,
  actual_end timestamptz,
  duration_minutes integer NOT NULL,
  actual_minutes integer,
  mode text DEFAULT 'SOFT' CHECK (mode IN ('SOFT', 'STRICT')),
  completed boolean DEFAULT false,
  notes text,
  distractions jsonb DEFAULT '[]'::jsonb,
  energy_before integer CHECK (energy_before >= 1 AND energy_before <= 5),
  energy_after integer CHECK (energy_after >= 1 AND energy_after <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_blocks_user_org ON time_blocks(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_blocks_scheduled ON time_blocks(scheduled_start, scheduled_end);
CREATE INDEX IF NOT EXISTS idx_blocks_outcome ON time_blocks(outcome_id);
CREATE INDEX IF NOT EXISTS idx_blocks_action ON time_blocks(action_id);
CREATE INDEX IF NOT EXISTS idx_blocks_completed ON time_blocks(completed);

-- RLS Policies for outcome_templates
CREATE POLICY "Anyone can view public templates"
  ON outcome_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can insert their own templates"
  ON outcome_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON outcome_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON outcome_templates FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for time_blocks
CREATE POLICY "Users can view their own blocks"
  ON time_blocks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own blocks"
  ON time_blocks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own blocks"
  ON time_blocks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own blocks"
  ON time_blocks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
