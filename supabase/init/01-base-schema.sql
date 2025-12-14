-- Base Schema for RPM Application
-- This creates all core tables that the migrations will extend

-- Extensions (use pgcrypto which is more reliably available)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core Tables

-- Users table (referenced by many other tables)
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Areas table (life areas)
CREATE TABLE IF NOT EXISTS areas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    icon text DEFAULT 'target',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Outcomes table (goals/outcomes in RPM)
CREATE TABLE IF NOT EXISTS outcomes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    area_id uuid REFERENCES areas(id) ON DELETE SET NULL,
    title text NOT NULL,
    purpose text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Actions table (tasks linked to outcomes)
CREATE TABLE IF NOT EXISTS actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    outcome_id uuid REFERENCES outcomes(id) ON DELETE CASCADE,
    title text NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Goals table (hierarchical goal structure)
CREATE TABLE IF NOT EXISTS goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES goals(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    goal_type text DEFAULT 'quarterly' CHECK (goal_type IN ('annual', 'quarterly', 'monthly')),
    status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    target_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Life Plans table
CREATE TABLE IF NOT EXISTS life_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    vision text,
    values jsonb DEFAULT '[]'::jsonb,
    roles jsonb DEFAULT '[]'::jsonb,
    principles jsonb DEFAULT '[]'::jsonb,
    resources jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Inbox Items table (GTD capture)
CREATE TABLE IF NOT EXISTS inbox_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    processed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Weekly Plans table
CREATE TABLE IF NOT EXISTS weekly_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    week_start date NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Daily Notes table
CREATE TABLE IF NOT EXISTS daily_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    date date NOT NULL,
    content text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Voice Sessions table
CREATE TABLE IF NOT EXISTS voice_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    session_type text DEFAULT 'general' CHECK (session_type IN ('planning', 'coaching', 'reflection', 'general')),
    transcript text,
    audio_url text,
    duration_seconds integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Review Sessions table
CREATE TABLE IF NOT EXISTS review_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    review_type text NOT NULL CHECK (review_type IN ('daily', 'weekly', 'monthly')),
    content jsonb DEFAULT '{}'::jsonb,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Outcome Templates table
CREATE TABLE IF NOT EXISTS outcome_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    category text,
    default_actions jsonb DEFAULT '[]'::jsonb,
    is_public boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Time Blocks table
CREATE TABLE IF NOT EXISTS time_blocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    outcome_id uuid REFERENCES outcomes(id) ON DELETE SET NULL,
    is_completed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Chunks table (time-blocking groups)
CREATE TABLE IF NOT EXISTS chunks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Chunk Items table
CREATE TABLE IF NOT EXISTS chunk_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id uuid REFERENCES chunks(id) ON DELETE CASCADE,
    item_type text NOT NULL CHECK (item_type IN ('inbox', 'action', 'outcome')),
    item_id uuid NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- RLS Policies

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunk_items ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own record" ON users FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own record" ON users FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own record" ON users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Areas policies
CREATE POLICY "Users can manage own areas" ON areas FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Outcomes policies
CREATE POLICY "Users can manage own outcomes" ON outcomes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Actions policies
CREATE POLICY "Users can view own actions" ON actions FOR SELECT TO authenticated
USING (outcome_id IN (SELECT id FROM outcomes WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own actions" ON actions FOR INSERT TO authenticated
WITH CHECK (outcome_id IN (SELECT id FROM outcomes WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own actions" ON actions FOR UPDATE TO authenticated
USING (outcome_id IN (SELECT id FROM outcomes WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own actions" ON actions FOR DELETE TO authenticated
USING (outcome_id IN (SELECT id FROM outcomes WHERE user_id = auth.uid()));

-- Goals policies
CREATE POLICY "Users can manage own goals" ON goals FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Life plans policies
CREATE POLICY "Users can manage own life plan" ON life_plans FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Inbox items policies
CREATE POLICY "Users can manage own inbox items" ON inbox_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Weekly plans policies
CREATE POLICY "Users can manage own weekly plans" ON weekly_plans FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Daily notes policies
CREATE POLICY "Users can manage own daily notes" ON daily_notes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Voice sessions policies
CREATE POLICY "Users can manage own voice sessions" ON voice_sessions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Review sessions policies
CREATE POLICY "Users can manage own review sessions" ON review_sessions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Outcome templates policies
CREATE POLICY "Users can view own templates" ON outcome_templates FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY "Users can manage own templates" ON outcome_templates FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Time blocks policies
CREATE POLICY "Users can manage own time blocks" ON time_blocks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Chunks policies
CREATE POLICY "Users can manage own chunks" ON chunks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Chunk items policies
CREATE POLICY "Users can manage own chunk items" ON chunk_items FOR ALL TO authenticated
USING (chunk_id IN (SELECT id FROM chunks WHERE user_id = auth.uid()))
WITH CHECK (chunk_id IN (SELECT id FROM chunks WHERE user_id = auth.uid()));

-- Grant permissions to roles
GRANT ALL ON users TO authenticated;
GRANT ALL ON areas TO authenticated;
GRANT ALL ON outcomes TO authenticated;
GRANT ALL ON actions TO authenticated;
GRANT ALL ON goals TO authenticated;
GRANT ALL ON life_plans TO authenticated;
GRANT ALL ON inbox_items TO authenticated;
GRANT ALL ON weekly_plans TO authenticated;
GRANT ALL ON daily_notes TO authenticated;
GRANT ALL ON voice_sessions TO authenticated;
GRANT ALL ON review_sessions TO authenticated;
GRANT ALL ON outcome_templates TO authenticated;
GRANT ALL ON time_blocks TO authenticated;
GRANT ALL ON chunks TO authenticated;
GRANT ALL ON chunk_items TO authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
