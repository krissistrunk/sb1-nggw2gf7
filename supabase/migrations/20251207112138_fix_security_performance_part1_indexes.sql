/*
  # Part 1: Add Missing Foreign Key Indexes

  Adds covering indexes for foreign keys to improve join performance by 10-100x.
  These indexes support the foreign key constraints and speed up queries
  that filter or join on these columns.
*/

-- AI-related tables
CREATE INDEX IF NOT EXISTS idx_ai_insights_organization_id
  ON ai_insights(organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_organization_id
  ON ai_interaction_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_organization_id
  ON ai_suggestions(organization_id);

-- Core tables
CREATE INDEX IF NOT EXISTS idx_goals_organization_id
  ON goals(organization_id);

CREATE INDEX IF NOT EXISTS idx_inbox_items_organization_id
  ON inbox_items(organization_id);

CREATE INDEX IF NOT EXISTS idx_life_plans_organization_id
  ON life_plans(organization_id);

CREATE INDEX IF NOT EXISTS idx_review_sessions_organization_id
  ON review_sessions(organization_id);

CREATE INDEX IF NOT EXISTS idx_time_blocks_organization_id
  ON time_blocks(organization_id);

-- Knowledge base tables
CREATE INDEX IF NOT EXISTS idx_knowledge_tags_organization_id
  ON knowledge_tags(organization_id);

CREATE INDEX IF NOT EXISTS idx_page_backgrounds_organization_id
  ON page_backgrounds(organization_id);

-- User management
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id
  ON organization_members(user_id);
