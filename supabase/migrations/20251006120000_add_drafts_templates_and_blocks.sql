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
  - `id` (uuid, primary key)
  - `name` (text) - Template name
  - `description` (text) - Template description
  - `category` (text) - Template category (e.g., 'Health', 'Business', 'Personal')
  - `outcome_title` (text) - Default outcome title
  - `purpose` (text) - Default purpose statement
  - `actions` (jsonb) - Array of default action titles
  - `estimated_duration_days` (integer) - Typical duration
  - `is_public` (boolean) - Whether template is available to all users
  - `created_by` (uuid, nullable) - User who created (null for system templates)
  - `usage_count` (integer) - Track popularity
  - `created_at` (timestamptz)

  ### `time_blocks`
  Focused work sessions for tracking RPM blocks
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `organization_id` (uuid, foreign key to organizations)
  - `outcome_id` (uuid, foreign key to outcomes, nullable)
  - `action_id` (uuid, foreign key to actions, nullable)
  - `title` (text) - Block title
  - `scheduled_start` (timestamptz) - When block is scheduled to start
  - `scheduled_end` (timestamptz) - When block is scheduled to end
  - `actual_start` (timestamptz, nullable) - When user actually started
  - `actual_end` (timestamptz, nullable) - When user actually finished
  - `duration_minutes` (integer) - Planned duration
  - `actual_minutes` (integer, nullable) - Actual duration
  - `mode` (text) - 'SOFT' or 'STRICT' focus mode
  - `completed` (boolean) - Whether block was completed
  - `notes` (text, nullable) - Post-block notes
  - `distractions` (jsonb) - Array of distraction notes captured during block
  - `energy_before` (integer, nullable) - Energy level 1-5 before block
  - `energy_after` (integer, nullable) - Energy level 1-5 after block
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Modified Tables

  ### `goals`
  Add draft status field:
  - `is_draft` (boolean) - Whether this is a saved draft

  ### `outcomes`
  Add draft status field:
  - `is_draft` (boolean) - Whether this is a saved draft

  ## Changes
  1. Creates outcome_templates table with system templates
  2. Creates time_blocks table for focus sessions
  3. Adds is_draft field to goals and outcomes
  4. Seeds system templates for common patterns
  5. Enables RLS on new tables
  6. Creates policies for user-scoped access

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

-- Seed system templates
INSERT INTO outcome_templates (name, description, category, outcome_title, purpose, actions, estimated_duration_days, is_public, created_by)
VALUES
  (
    'Launch Landing Page',
    'Build and deploy a professional landing page for a product or service',
    'Business',
    'Launch a high-converting landing page',
    'Establish online presence and start generating leads to grow the business',
    '[
      "Define target audience and key messaging",
      "Design wireframes and mockups",
      "Write compelling copy for hero, features, and CTA sections",
      "Build responsive HTML/CSS or use landing page builder",
      "Set up analytics and conversion tracking",
      "Test on multiple devices and browsers",
      "Deploy to production domain"
    ]'::jsonb,
    14,
    true,
    NULL
  ),
  (
    '8-Week Health Transformation',
    'Complete health overhaul with fitness, nutrition, and habit building',
    'Health',
    'Transform my health and fitness in 8 weeks',
    'Feel energized, confident, and strong in my body so I can show up fully in all areas of life',
    '[
      "Get complete health checkup and baseline measurements",
      "Create personalized workout plan with trainer",
      "Design meal prep system and grocery shopping routine",
      "Establish morning routine with exercise",
      "Track daily habits: water, sleep, workouts, meals",
      "Schedule weekly progress photos and measurements",
      "Plan one cheat meal per week for sustainability",
      "Book follow-up checkup at end of 8 weeks"
    ]'::jsonb,
    56,
    true,
    NULL
  ),
  (
    'Plan Epic Family Trip',
    'Research, plan, and book a memorable family vacation',
    'Family',
    'Plan and book an amazing family vacation',
    'Create lasting memories with my family and strengthen our bond through shared experiences',
    '[
      "Survey family members for destination preferences",
      "Research top 5 destinations within budget",
      "Compare flight and accommodation options",
      "Create daily itinerary with activities for all ages",
      "Book flights, hotels, and key activities",
      "Prepare packing lists for each family member",
      "Arrange pet care and home security",
      "Create travel document folder with confirmations"
    ]'::jsonb,
    21,
    true,
    NULL
  ),
  (
    'Write and Publish Book',
    'Complete manuscript and publish your first book',
    'Creative',
    'Write and publish my first book',
    'Share my knowledge and story with the world while establishing myself as an authority in my field',
    '[
      "Outline book structure with chapter breakdown",
      "Set daily writing goal (500-1000 words)",
      "Complete first draft",
      "Hire professional editor for developmental edit",
      "Revise manuscript based on feedback",
      "Design or commission book cover",
      "Format for print and ebook",
      "Choose publishing platform and publish",
      "Create launch marketing plan"
    ]'::jsonb,
    90,
    true,
    NULL
  ),
  (
    'Learn New Skill to Mastery',
    'Master a new professional or personal skill',
    'Learning',
    'Achieve mastery in [skill name]',
    'Expand my capabilities and open new opportunities for growth and contribution',
    '[
      "Research best courses, books, and mentors",
      "Purchase or enroll in primary learning resource",
      "Set up daily practice schedule (minimum 30 min)",
      "Join community or find accountability partner",
      "Complete beginner fundamentals",
      "Build 3 practice projects increasing in difficulty",
      "Get feedback from expert or mentor",
      "Create portfolio piece showcasing skill"
    ]'::jsonb,
    60,
    true,
    NULL
  ),
  (
    'Debt Freedom Plan',
    'Create and execute a plan to become debt-free',
    'Financial',
    'Eliminate all consumer debt',
    'Achieve financial freedom and peace of mind, redirect money toward building wealth and living my vision',
    '[
      "List all debts with balances, rates, and minimum payments",
      "Calculate total debt and average payoff timeline",
      "Create detailed monthly budget",
      "Identify areas to cut expenses and increase income",
      "Choose debt payoff strategy (snowball or avalanche)",
      "Set up automatic payments for all debts",
      "Track progress weekly with debt-free chart",
      "Plan celebration and next financial goal"
    ]'::jsonb,
    180,
    true,
    NULL
  ),
  (
    'Build Morning Ritual',
    'Design and implement a powerful morning routine',
    'Personal Development',
    'Establish an empowering morning ritual',
    'Start every day with intention, energy, and clarity to maximize my potential',
    '[
      "Define ideal morning routine components (meditation, exercise, journaling, etc.)",
      "Set consistent wake-up time",
      "Prepare evening routine to support morning wake-up",
      "Start with 10-minute mini-routine and gradually expand",
      "Track completion daily for 21 days to build habit",
      "Adjust routine based on energy and results",
      "Create travel version for consistency on the road"
    ]'::jsonb,
    21,
    true,
    NULL
  ),
  (
    'Grow Social Media Presence',
    'Build engaged following on social media platform',
    'Business',
    'Grow to [X] followers with high engagement',
    'Build authority, reach more people with my message, and create opportunities for impact and income',
    '[
      "Define target audience and content pillars",
      "Analyze top 10 accounts in niche for patterns",
      "Create content calendar for 30 days",
      "Design templates for consistent brand look",
      "Commit to daily posting schedule",
      "Engage authentically with 20 accounts daily",
      "Track analytics weekly and adjust strategy",
      "Plan collaboration with 3 complementary accounts"
    ]'::jsonb,
    90,
    true,
    NULL
  )
ON CONFLICT DO NOTHING;
