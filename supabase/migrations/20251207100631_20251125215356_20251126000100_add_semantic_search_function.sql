/*
  # Add Semantic Search Function for Knowledge Base

  ## Overview
  Creates a PostgreSQL function for semantic search using vector similarity.
  Uses cosine distance to find notes similar to a query embedding.

  ## Function

  ### `search_knowledge_notes`
  Performs semantic search across user's knowledge notes using embeddings.

  ## Security
  - Function respects RLS policies
  - Only returns notes owned by the specified user
  - Uses SECURITY DEFINER with user_id filtering
*/

-- Create semantic search function
CREATE OR REPLACE FUNCTION search_knowledge_notes(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  user_id_param uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  note_type text,
  source_type text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kn.id,
    kn.title,
    kn.content,
    kn.note_type,
    kn.source_type,
    kn.created_at,
    1 - (ke.embedding <=> query_embedding) as similarity
  FROM knowledge_notes kn
  INNER JOIN knowledge_embeddings ke ON kn.id = ke.note_id
  WHERE kn.user_id = user_id_param
    AND 1 - (ke.embedding <=> query_embedding) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
