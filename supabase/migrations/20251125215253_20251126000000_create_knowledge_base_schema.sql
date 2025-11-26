/*
  # Personal Knowledge Base System

  ## Overview
  Creates an Obsidian-style personal knowledge management system that captures insights
  from coaching sessions and grows with the user over time. Enables bidirectional linking,
  semantic search, and AI-powered knowledge extraction.

  ## New Tables

  ### `knowledge_notes` - Core knowledge repository
  Stores markdown-based notes with metadata and source tracking.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique note identifier
  - `user_id` (uuid) - Owner of the note
  - `organization_id` (uuid) - Organization context
  - `title` (text) - Note title for display and search
  - `content` (text) - Full markdown content with wiki-links
  - `note_type` (text) - permanent, fleeting, literature, insight, pattern, learning
  - `source_type` (text) - coaching_session, manual, ai_generated, weekly_review, daily_reflection
  - `source_id` (uuid, nullable) - Links to source record (voice_sessions, daily_notes, etc.)
  - `metadata` (jsonb) - Custom fields, categories, properties
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last modification
  - `last_referenced_at` (timestamptz) - For resurfacing old insights
  - `reference_count` (integer) - How often linked/referenced

  ### `knowledge_links` - Bidirectional relationships
  Tracks connections between notes for graph visualization.
  
  **Columns:**
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Owner
  - `from_note_id` (uuid) - Source note
  - `to_note_id` (uuid) - Target note
  - `link_type` (text) - relates_to, contradicts, supports, example_of, caused_by, leads_to
  - `strength` (integer) - AI confidence 1-10
  - `created_by` (text) - user or ai
  - `created_at` (timestamptz)

  ### `knowledge_tags` - Tag taxonomy
  User's personal tag system for categorization.
  
  **Columns:**
  - `id` (uuid, primary key)
  - `user_id` (uuid)
  - `organization_id` (uuid)
  - `tag_name` (text) - Unique tag name per user
  - `category` (text, nullable) - Group tags by category
  - `color` (text) - Hex color for visual distinction
  - `note_count` (integer) - Cached count of notes using this tag
  - `created_at` (timestamptz)

  ### `knowledge_note_tags` - Many-to-many junction
  Links notes to tags.

  ### `knowledge_embeddings` - Semantic search vectors
  Stores embeddings for AI-powered semantic search (requires pgvector extension).

  ## Security
  - RLS enabled on all tables
  - Users can only access their own notes
  - Organization context maintained
  - Policies for select, insert, update, delete

  ## Indexes
  - Full-text search on title and content
  - GIN indexes for JSONB metadata
  - B-tree indexes on foreign keys
  - Composite indexes for common queries
*/

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- knowledge_notes table
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  note_type text NOT NULL DEFAULT 'fleeting' 
    CHECK (note_type IN ('permanent', 'fleeting', 'literature', 'insight', 'pattern', 'learning')),
  source_type text NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('coaching_session', 'manual', 'ai_generated', 'weekly_review', 'daily_reflection', 'outcome_completion')),
  source_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_referenced_at timestamptz DEFAULT now(),
  reference_count integer DEFAULT 0 CHECK (reference_count >= 0)
);

-- Indexes for knowledge_notes
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_user_id ON knowledge_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_org_id ON knowledge_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_note_type ON knowledge_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_source_type ON knowledge_notes(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_created_at ON knowledge_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_last_referenced ON knowledge_notes(last_referenced_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_metadata ON knowledge_notes USING gin(metadata);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_search ON knowledge_notes 
  USING gin(to_tsvector('english', title || ' ' || content));

-- Enable RLS
ALTER TABLE knowledge_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_notes
CREATE POLICY "Users can view own notes"
  ON knowledge_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON knowledge_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON knowledge_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON knowledge_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- knowledge_links table
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_note_id uuid NOT NULL REFERENCES knowledge_notes(id) ON DELETE CASCADE,
  to_note_id uuid NOT NULL REFERENCES knowledge_notes(id) ON DELETE CASCADE,
  link_type text NOT NULL DEFAULT 'relates_to'
    CHECK (link_type IN ('relates_to', 'contradicts', 'supports', 'example_of', 'caused_by', 'leads_to')),
  strength integer DEFAULT 5 CHECK (strength >= 1 AND strength <= 10),
  created_by text NOT NULL DEFAULT 'user' CHECK (created_by IN ('user', 'ai')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_links CHECK (from_note_id != to_note_id),
  CONSTRAINT unique_link_pair UNIQUE (from_note_id, to_note_id, link_type)
);

-- Indexes for knowledge_links
CREATE INDEX IF NOT EXISTS idx_knowledge_links_user_id ON knowledge_links(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_from_note ON knowledge_links(from_note_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_to_note ON knowledge_links(to_note_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_type ON knowledge_links(link_type);

-- Enable RLS
ALTER TABLE knowledge_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_links
CREATE POLICY "Users can view own links"
  ON knowledge_links FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own links"
  ON knowledge_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links"
  ON knowledge_links FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own links"
  ON knowledge_links FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- knowledge_tags table
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  category text,
  color text DEFAULT '#6366f1',
  note_count integer DEFAULT 0 CHECK (note_count >= 0),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_tag UNIQUE (user_id, tag_name)
);

-- Indexes for knowledge_tags
CREATE INDEX IF NOT EXISTS idx_knowledge_tags_user_id ON knowledge_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags_name ON knowledge_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags_category ON knowledge_tags(category);

-- Enable RLS
ALTER TABLE knowledge_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_tags
CREATE POLICY "Users can view own tags"
  ON knowledge_tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON knowledge_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON knowledge_tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON knowledge_tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- knowledge_note_tags junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_note_tags (
  note_id uuid NOT NULL REFERENCES knowledge_notes(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES knowledge_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (note_id, tag_id)
);

-- Indexes for knowledge_note_tags
CREATE INDEX IF NOT EXISTS idx_knowledge_note_tags_note ON knowledge_note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_note_tags_tag ON knowledge_note_tags(tag_id);

-- Enable RLS
ALTER TABLE knowledge_note_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_note_tags
CREATE POLICY "Users can view own note tags"
  ON knowledge_note_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_notes
      WHERE knowledge_notes.id = knowledge_note_tags.note_id
      AND knowledge_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own note tags"
  ON knowledge_note_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_notes
      WHERE knowledge_notes.id = knowledge_note_tags.note_id
      AND knowledge_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own note tags"
  ON knowledge_note_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_notes
      WHERE knowledge_notes.id = knowledge_note_tags.note_id
      AND knowledge_notes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- knowledge_embeddings table (for semantic search)
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES knowledge_notes(id) ON DELETE CASCADE,
  embedding vector(1536),
  embedding_model text NOT NULL DEFAULT 'text-embedding-3-small',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_note_embedding UNIQUE (note_id)
);

-- Indexes for knowledge_embeddings
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_note ON knowledge_embeddings(note_id);

-- Vector similarity search index (cosine distance)
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector 
  ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Enable RLS
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_embeddings
CREATE POLICY "Users can view own embeddings"
  ON knowledge_embeddings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_notes
      WHERE knowledge_notes.id = knowledge_embeddings.note_id
      AND knowledge_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own embeddings"
  ON knowledge_embeddings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_notes
      WHERE knowledge_notes.id = knowledge_embeddings.note_id
      AND knowledge_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own embeddings"
  ON knowledge_embeddings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_notes
      WHERE knowledge_notes.id = knowledge_embeddings.note_id
      AND knowledge_notes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_notes
      WHERE knowledge_notes.id = knowledge_embeddings.note_id
      AND knowledge_notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own embeddings"
  ON knowledge_embeddings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_notes
      WHERE knowledge_notes.id = knowledge_embeddings.note_id
      AND knowledge_notes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_knowledge_note_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_knowledge_note_timestamp
  BEFORE UPDATE ON knowledge_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_note_timestamp();

-- Function to update tag note_count
CREATE OR REPLACE FUNCTION update_tag_note_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE knowledge_tags
    SET note_count = note_count + 1
    WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE knowledge_tags
    SET note_count = note_count - 1
    WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain tag counts
CREATE TRIGGER trigger_update_tag_note_count
  AFTER INSERT OR DELETE ON knowledge_note_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_note_count();

-- Function to update note reference_count when linked
CREATE OR REPLACE FUNCTION update_note_reference_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE knowledge_notes
    SET reference_count = reference_count + 1,
        last_referenced_at = now()
    WHERE id = NEW.to_note_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE knowledge_notes
    SET reference_count = GREATEST(reference_count - 1, 0)
    WHERE id = OLD.to_note_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain reference counts
CREATE TRIGGER trigger_update_note_reference_count
  AFTER INSERT OR DELETE ON knowledge_links
  FOR EACH ROW
  EXECUTE FUNCTION update_note_reference_count();