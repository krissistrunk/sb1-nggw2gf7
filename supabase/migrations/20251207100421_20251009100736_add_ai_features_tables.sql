/*
  # Add AI Features Tables

  This migration creates the necessary tables to support AI-powered features in the RPM application.

  ## New Tables

  1. `ai_suggestions`
     - Stores AI-generated suggestions for actions, purposes, and other content
     - Tracks whether suggestions were accepted or rejected
     - Links to the relevant entity (outcome, action, etc.)

  2. `ai_insights`
     - Stores AI-generated insights from weekly/monthly reviews
     - Contains pattern analysis and productivity recommendations
     - Tracks time periods and insight types

  3. `ai_interaction_logs`
     - Logs all AI API interactions for analytics and debugging
     - Tracks tokens used, response times, and success/failure
     - Helps monitor AI usage and costs

  ## Security
  - All tables have RLS enabled
  - Users can only access their own data
  - Proper policies for authenticated users
*/

-- Create ai_suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  suggestion_type text NOT NULL CHECK (suggestion_type IN ('ACTION', 'PURPOSE', 'CHUNK', 'DAILY_PLAN', 'INSIGHT')),
  entity_type text CHECK (entity_type IN ('OUTCOME', 'ACTION', 'CHUNK', 'INBOX_ITEM', 'LIFE_PLAN')),
  entity_id uuid,
  content jsonb NOT NULL DEFAULT '{}',
  reasoning text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_entity ON ai_suggestions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_suggestions(status);

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  insight_type text NOT NULL CHECK (insight_type IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'PATTERN', 'ALERT')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  insights jsonb NOT NULL DEFAULT '{}',
  patterns jsonb DEFAULT '{}',
  recommendations jsonb DEFAULT '{}',
  metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_period ON ai_insights(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);

-- Create ai_interaction_logs table
CREATE TABLE IF NOT EXISTS ai_interaction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  feature_type text NOT NULL,
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  model text,
  response_time_ms integer,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feature ON ai_interaction_logs(feature_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_interaction_logs(created_at);

-- Enable RLS
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interaction_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_suggestions
CREATE POLICY "Users can view their own AI suggestions"
  ON ai_suggestions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI suggestions"
  ON ai_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI suggestions"
  ON ai_suggestions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI suggestions"
  ON ai_suggestions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ai_insights
CREATE POLICY "Users can view their own AI insights"
  ON ai_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI insights"
  ON ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI insights"
  ON ai_insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI insights"
  ON ai_insights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ai_interaction_logs
CREATE POLICY "Users can view their own AI interaction logs"
  ON ai_interaction_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI interaction logs"
  ON ai_interaction_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
