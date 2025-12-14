# Troubleshooting Log

This document tracks issues encountered and their resolutions to prevent repeating mistakes.

## Known Working Configurations

### Supabase (Cloud)
- Using cloud-hosted Supabase (not Docker) for primary development
- Same project shared between sb1 and github-ene repos
- 56 migrations applied as of 2025-12-07

### Environment Variables Required
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_USE_MOCK_DATA` - Optional flag for offline development

### Edge Functions
- `OPENAI_API_KEY` - Required for AI features
- `ELEVENLABS_API_KEY` - Required for voice synthesis

---

## Issues Encountered & Resolved

| Date | Issue | Root Cause | Fix | Reference |
|------|-------|------------|-----|-----------|
| 2025-12-14 | Docker migrations fail | Missing base schema, duplicate migrations | Created 20251001000000_create_base_schema.sql, removed duplicates | This file |
| 2025-12-14 | Mock mode "Failed to fetch" | useAuth.ts always called Supabase | Added isMockMode() check, use MockAuth | src/hooks/useAuth.ts |
| 2025-12-14 | Mock mode not detected | .env.local overrides .env | Set VITE_USE_MOCK_DATA=true in .env.local | .env.local |
| 2025-12-14 | Org not loaded in mock mode | OrganizationContext called Supabase | Added mock data support | src/contexts/OrganizationContext.tsx |
| 2025-12-13 | Auth schema missing in Docker | Docker init only runs on first container | Apply 00-initial-setup.sql manually | SUPABASE_DOCKER_FIX.md |
| 2025-12-13 | RLS infinite recursion | Circular policies on organizations table | Simplify policies, use direct ID check | SUPABASE_DOCKER_FIX.md |
| 2025-12-07 | Slow queries on org_id filters | Missing foreign key indexes | Added 11 indexes | SECURITY_FIXES_APPLIED.md |
| 2025-12-07 | RLS policy re-evaluation overhead | auth.uid() called per row | Changed to (select auth.uid()) | SECURITY_FIXES_APPLIED.md |

---

## Prevention Checklist

### Before Docker Setup
- [ ] Remove old volumes: `docker-compose down -v`
- [ ] Run init scripts after first start
- [ ] Check auth health: `curl localhost:54321/auth/v1/health`

### Before Deploying Migrations
- [ ] Test locally first with mock data
- [ ] Check for RLS policy conflicts
- [ ] Verify foreign key indexes exist

### Development Best Practices
- [ ] Use `VITE_USE_MOCK_DATA=true` for UI development
- [ ] Test auth flows with real Supabase when ready
- [ ] Check browser console for runtime errors

---

## Common Error Messages & Solutions

### "schema 'auth' does not exist"
**Cause**: Docker init scripts didn't run
**Solution**: See SUPABASE_DOCKER_FIX.md Step 1-3

### "infinite recursion detected in policy"
**Cause**: RLS policies that reference each other
**Solution**: Simplify to direct user_id = auth.uid() checks

### "relation does not exist"
**Cause**: Missing migrations
**Solution**: Run `supabase db push` or apply migrations manually

---

## Migration from github-ene to sb1

**Date**: 2025-12-14

### What Was Done
1. Saved sb1 working state to rpm-lite repo
2. Full replacement of sb1 source with github-ene code
3. Preserved .env and .env.local files
4. Preserved documents/ folder with fix documentation

### New Features Migrated
- Knowledge base system (3 pages, 5 tables)
- Enhanced voice coaching
- 35 additional database migrations
- Security/performance optimizations

### Known Issues to Watch
- Voice coaching UI may not be fully wired
- WeeklyReflectionPage exists but may be unrouted
- Mock data infrastructure partially implemented

---

## Docker Supabase Setup (Fixed 2025-12-14)

### Problem
Migrations from github-ene expected tables to exist before ALTER TABLE commands ran.

### Solution
1. **Created base schema migration**: `20251001000000_create_base_schema.sql`
   - Creates all foundational tables: users, areas, outcomes, actions, weekly_plans, daily_notes, voice_sessions
   - Must have earliest timestamp to run first

2. **Fixed voice_sessions schema**
   - Changed `status` column to `session_type`
   - Changed `parsed_data` to `ai_insights`
   - Added `duration_seconds`

3. **Removed duplicate migrations**
   - Files with double timestamps (e.g., `20251207100308_20251006120000_*.sql`)
   - These were copies that caused "policy already exists" errors

### Commands to Set Up Fresh Docker Supabase
```bash
# Stop any existing containers
docker ps -a --filter "name=supabase" -q | xargs -r docker rm -f

# Initialize (if no config.toml exists)
cd /path/to/project
supabase init

# Start Supabase (applies all migrations)
supabase start

# Verify
curl http://localhost:54321/auth/v1/health
```

### Current Working Migration Count
- 40 migrations after duplicate removal
- All 26 tables created successfully

---

*Last updated: 2025-12-14*
