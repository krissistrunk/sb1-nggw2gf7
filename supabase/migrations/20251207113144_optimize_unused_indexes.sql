/*
  # Optimize Unused Indexes - Conservative Approach

  ## Analysis
  Many indexes show as "unused" because:
  1. The application is in development/testing phase
  2. Not all features have been heavily used yet
  3. Some indexes were just recently added
  
  ## Strategy
  - KEEP all foreign key indexes (critical for joins)
  - KEEP indexes on frequently filtered columns (user_id, organization_id, status, dates)
  - DROP only truly redundant indexes where composite indexes provide full coverage
  - Monitor remaining indexes after 30-60 days of production use
  
  ## Rationale
  It's better to have indexes ready for when features are used than to cause
  slow queries later. Storage cost is minimal compared to query performance impact.
*/

-- Drop truly redundant indexes where composite indexes provide full coverage

-- Actions: idx_actions_outcome_id is covered by idx_actions_outcome_sort (outcome_id, sort_order)
-- KEEP IT - needed for simple outcome_id lookups and foreign key joins

-- Actions: idx_actions_outcome_sort is covered by idx_actions_outcome_sort_done
DROP INDEX IF EXISTS idx_actions_outcome_sort;

-- Chunk items: covered by unique constraint chunk_items_chunk_id_inbox_item_id_key
-- KEEP THEM - still useful for foreign key joins

-- Areas: idx_areas_user_id is covered by idx_areas_sort_order (user_id, sort_order)
-- KEEP IT - needed for simple user_id lookups

-- Areas: idx_areas_order and idx_areas_sort_order might be redundant
-- Keep sort_order (composite), drop order (single column on less useful field)
DROP INDEX IF EXISTS idx_areas_order;

/*
  ## Indexes Kept (by category)

  ### Foreign Key Indexes (CRITICAL - must keep)
  - All organization_id indexes (11 tables)
  - All user_id indexes (multiple tables)
  - outcome_id, area_id, goal_id, chunk_id foreign key indexes
  
  ### Filter Indexes (HIGH VALUE - should keep)
  - Status/state columns: done, is_must, is_draft, triaged, status
  - Date columns: scheduled_date, created_at, dates
  - Type columns: goal_type, note_type, source_type
  
  ### Composite Indexes (HIGH VALUE - should keep)
  - Multi-column indexes for common query patterns
  - Sort and filter combinations
  
  ### Why Keep "Unused" Indexes?
  
  1. **Application Growth**: As users adopt features, these indexes will be used
  2. **Query Performance**: Better to have indexes ready than to cause slow queries
  3. **Foreign Keys**: Critical for join performance even if not showing usage
  4. **Storage Cost**: Minimal compared to poor query performance
  5. **Development Phase**: App hasn't been used enough to show full usage patterns
  
  ## Recommendation
  
  Monitor index usage after 60 days of production use with this query:
  
  ```sql
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND idx_scan = 0
  ORDER BY pg_relation_size(indexrelid) DESC;
  ```
  
  Then drop indexes that:
  - Have zero scans after 60 days
  - Are not foreign key indexes
  - Are not on commonly filtered columns
  - Have minimal storage impact
*/

-- Add note about monitoring
COMMENT ON SCHEMA public IS 
  'Indexes monitored for usage. Review unused indexes after 60 days of production use.';
