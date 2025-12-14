/*
  # Create Base RPM Schema

  ## Overview
  Creates the foundational tables for the RPM (Results, Purpose, Massive Action) productivity system.
  This is the base schema that all subsequent migrations build upon.

  ## New Tables

  ### `users`
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email
  - `name` (text) - User display name
  - `settings` (jsonb) - User preferences
  - `created_at` (timestamptz)

  ### `areas`
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner of the area
  - `name` (text) - Area name (Career, Health, etc.)
  - `description` (text) - Area description
  - `color` (text) - Visual color identifier
  - `icon` (text) - Icon identifier
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `outcomes`
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner
  - `area_id` (uuid) - Parent area
  - `title` (text) - The result/outcome
  - `purpose` (text) - Why this matters (emotional fuel)
  - `status` (text) - active, completed, archived
  - `priority` (text) - high, medium, low
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `actions`
  - `id` (uuid, primary key)
  - `outcome_id` (uuid) - Parent outcome
  - `description` (text) - Action description
  - `done` (boolean) - Completion status
  - `priority` (text) - high, medium, low
  - `scheduled_date` (date) - When to do this action
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `weekly_plans`
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner
  - `week_start_date` (date) - Monday of the week
  - `focus_outcomes` (jsonb) - Key outcomes for the week
  - `reflection` (text) - Weekly review notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `daily_notes`
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner
  - `date` (date) - Date of the note
  - `morning_intention` (text) - Morning planning
  - `evening_reflection` (text) - Evening review
  - `energy_level` (integer) - 1-5 rating
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `voice_sessions`
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner
  - `transcript` (text) - Voice transcription
  - `parsed_data` (jsonb) - Extracted data
  - `status` (text) - processing, completed, failed
  - `created_at` (timestamptz)

  ## Security
  - All tables have RLS enabled
  - Users can only access their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Create areas table
CREATE TABLE IF NOT EXISTS areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'circle',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_areas_user_id ON areas(user_id);
CREATE INDEX IF NOT EXISTS idx_areas_order ON areas(order_index);

CREATE POLICY "Users can manage their own areas"
  ON areas FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create outcomes table
CREATE TABLE IF NOT EXISTS outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  title text NOT NULL,
  purpose text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_outcomes_user_id ON outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_area_id ON outcomes(area_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_status ON outcomes(status);

CREATE POLICY "Users can manage their own outcomes"
  ON outcomes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create actions table
CREATE TABLE IF NOT EXISTS actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outcome_id uuid NOT NULL REFERENCES outcomes(id) ON DELETE CASCADE,
  description text NOT NULL,
  done boolean DEFAULT false,
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  scheduled_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_actions_outcome_id ON actions(outcome_id);
CREATE INDEX IF NOT EXISTS idx_actions_done ON actions(done);

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

-- Create weekly_plans table
CREATE TABLE IF NOT EXISTS weekly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  focus_outcomes jsonb DEFAULT '[]'::jsonb,
  reflection text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_id ON weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_date ON weekly_plans(week_start_date DESC);

CREATE POLICY "Users can manage their own weekly plans"
  ON weekly_plans FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create daily_notes table
CREATE TABLE IF NOT EXISTS daily_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  morning_intention text,
  evening_reflection text,
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_daily_notes_user_id ON daily_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_notes_date ON daily_notes(date DESC);

CREATE POLICY "Users can manage their own daily notes"
  ON daily_notes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create voice_sessions table
CREATE TABLE IF NOT EXISTS voice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type text DEFAULT 'COACHING' CHECK (session_type IN ('PLANNING', 'COACHING', 'REFLECTION', 'MOTIVATION', 'CLARIFICATION')),
  transcript text,
  ai_insights jsonb DEFAULT '[]'::jsonb,
  duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON voice_sessions(user_id);

CREATE POLICY "Users can manage their own voice sessions"
  ON voice_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
