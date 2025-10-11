/*
  # RPM Goals and Life Plan Enhancements

  ## Overview
  Enhances the RPM planner to support a complete goal hierarchy from vision to actions:
  Vision → Purpose → 1 Year Goals → Quarterly Goals → Outcomes → Actions

  ## New Tables

  ### `goals`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `organization_id` (uuid, foreign key to organizations)
  - `title` (text) - Goal title
  - `description` (text, nullable) - Detailed description
  - `goal_type` (text) - YEARLY or QUARTERLY
  - `area_id` (uuid, foreign key to areas) - Associated area of focus
  - `year` (integer) - Target year
  - `quarter` (integer, nullable) - Target quarter (1-4) for quarterly goals
  - `parent_goal_id` (uuid, nullable, self-reference) - Yearly goal this cascades from
  - `status` (text) - ACTIVE, COMPLETED, ARCHIVED
  - `target_date` (date, nullable) - Target completion date
  - `progress_percentage` (integer) - Calculated from outcomes (0-100)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `completed_at` (timestamptz, nullable)

  ## Modified Tables

  ### `life_plans`
  Adds new fields:
  - `purpose` (text) - Core purpose statement
  - `three_to_thrive` (jsonb) - Array of area_ids representing top 3 focus areas
  - `resources` (jsonb) - Object with people, skills, tools, financial resources

  ### `outcomes`
  Adds new field:
  - `goal_id` (uuid, nullable, foreign key to goals) - Parent goal

  ## Changes
  1. Creates goals table for yearly and quarterly goal tracking
  2. Adds purpose, three_to_thrive, and resources to life_plans
  3. Links outcomes to goals via goal_id foreign key
  4. Enables RLS on goals table
  5. Creates policies for user-scoped access

  ## Security
  - RLS enabled on goals table
  - Users can only access their own goals
  - Goals are organization-scoped for multi-tenancy
*/

-- Add new fields to life_plans table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'life_plans' AND column_name = 'purpose'
  ) THEN
    ALTER TABLE life_plans ADD COLUMN purpose text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'life_plans' AND column_name = 'three_to_thrive'
  ) THEN
    ALTER TABLE life_plans ADD COLUMN three_to_thrive jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'life_plans' AND column_name = 'resources'
  ) THEN
    ALTER TABLE life_plans ADD COLUMN resources jsonb DEFAULT '{"people": [], "skills": [], "tools": [], "financial": ""}'::jsonb;
  END IF;
END $$;

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  goal_type text NOT NULL CHECK (goal_type IN ('YEARLY', 'QUARTERLY')),
  area_id uuid REFERENCES areas(id) ON DELETE SET NULL,
  year integer NOT NULL,
  quarter integer CHECK (quarter >= 1 AND quarter <= 4),
  parent_goal_id uuid REFERENCES goals(id) ON DELETE SET NULL,
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
  target_date date,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT quarterly_must_have_quarter CHECK (
    (goal_type = 'YEARLY' AND quarter IS NULL) OR 
    (goal_type = 'QUARTERLY' AND quarter IS NOT NULL)
  )
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_goals_user_org ON goals(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_goals_type_status ON goals(goal_type, status);
CREATE INDEX IF NOT EXISTS idx_goals_year_quarter ON goals(year, quarter);
CREATE INDEX IF NOT EXISTS idx_goals_area ON goals(area_id);
CREATE INDEX IF NOT EXISTS idx_goals_parent ON goals(parent_goal_id);

-- Add goal_id to outcomes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'outcomes' AND column_name = 'goal_id'
  ) THEN
    ALTER TABLE outcomes ADD COLUMN goal_id uuid REFERENCES goals(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_outcomes_goal ON outcomes(goal_id);
  END IF;
END $$;

-- RLS Policies for goals
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update goal progress based on outcomes
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_outcomes INTEGER;
  completed_outcomes INTEGER;
  new_progress INTEGER;
  target_goal_id UUID;
BEGIN
  -- Determine which goal to update
  IF TG_OP = 'DELETE' THEN
    target_goal_id := OLD.goal_id;
  ELSE
    target_goal_id := NEW.goal_id;
  END IF;

  -- Only proceed if there's a goal_id
  IF target_goal_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count total and completed outcomes for this goal
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'COMPLETED')
  INTO total_outcomes, completed_outcomes
  FROM outcomes
  WHERE goal_id = target_goal_id;

  -- Calculate progress percentage
  IF total_outcomes > 0 THEN
    new_progress := (completed_outcomes * 100) / total_outcomes;
  ELSE
    new_progress := 0;
  END IF;

  -- Update the goal's progress
  UPDATE goals
  SET 
    progress_percentage = new_progress,
    updated_at = now(),
    completed_at = CASE 
      WHEN new_progress = 100 AND status = 'ACTIVE' THEN now()
      WHEN new_progress < 100 THEN NULL
      ELSE completed_at
    END,
    status = CASE 
      WHEN new_progress = 100 AND status = 'ACTIVE' THEN 'COMPLETED'
      WHEN new_progress < 100 AND status = 'COMPLETED' THEN 'ACTIVE'
      ELSE status
    END
  WHERE id = target_goal_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update goal progress
DROP TRIGGER IF EXISTS trigger_update_goal_progress ON outcomes;
CREATE TRIGGER trigger_update_goal_progress
  AFTER INSERT OR UPDATE OF status, goal_id OR DELETE ON outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();
