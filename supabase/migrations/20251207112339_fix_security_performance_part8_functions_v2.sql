/*
  # Part 8: Fix Function Search Paths

  Sets search_path to empty or restricted values to prevent search path
  injection attacks. This is a critical security improvement.
*/

-- Set search_path to empty for trigger functions
-- This prevents privilege escalation attacks

ALTER FUNCTION update_goal_progress()
  SET search_path = '';

ALTER FUNCTION update_knowledge_note_timestamp()
  SET search_path = '';

ALTER FUNCTION update_voice_sessions_updated_at()
  SET search_path = '';

ALTER FUNCTION update_tag_note_count()
  SET search_path = '';

ALTER FUNCTION update_note_reference_count()
  SET search_path = '';

-- search_knowledge_notes needs access to vector operations and text search
-- so we use pg_catalog and public schemas only
ALTER FUNCTION search_knowledge_notes(vector, double precision, integer, uuid)
  SET search_path = pg_catalog, public;
