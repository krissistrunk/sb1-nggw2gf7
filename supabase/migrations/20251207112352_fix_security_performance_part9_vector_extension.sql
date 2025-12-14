/*
  # Part 9: Move Vector Extension to Extensions Schema

  Moves the vector extension from public schema to extensions schema.
  This is a security best practice to keep extensions separate from
  application tables.
*/

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Attempt to move vector extension to extensions schema
-- This may require superuser privileges in some environments
DO $$
BEGIN
  -- Check if vector extension exists in public schema
  IF EXISTS (
    SELECT 1 FROM pg_extension
    WHERE extname = 'vector'
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Try to move it (may require superuser)
    ALTER EXTENSION vector SET SCHEMA extensions;
    RAISE NOTICE 'Vector extension moved to extensions schema successfully';
  ELSIF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE NOTICE 'Vector extension already in correct schema';
  ELSE
    RAISE NOTICE 'Vector extension not found';
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot move vector extension - requires superuser privileges. Please move manually via Supabase dashboard.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not move vector extension: %', SQLERRM;
END $$;
