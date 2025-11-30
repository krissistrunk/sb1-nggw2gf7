# AGENTS

## Snapshot
- Product: RPM-style productivity/goal management app (React 18 + TypeScript, Vite, Tailwind). Multi-tenant via Supabase auth/DB/storage; dark/light theming through organization settings.
- Backend: Supabase Postgres + storage; edge function at `supabase/functions/ai-assistant` proxies OpenAI `gpt-4o-mini` for AI features; logs usage to `ai_interaction_logs`.
- UI shell: `AppLayout` provides nav, mobile tray, dark mode toggle, page hero backgrounds stored in `page_backgrounds` bucket (via `usePageBackground` + `ImageUploadModal`).

## Data Model (from migrations + UI usage)
- `organizations` + `organization_members`: branding (primary_color/logo/favicon), subdomain, subscription_tier, feature_flags, member roles.
- `users`: mirrors auth users with `organization_id`, name/email; signup inserts here but does not attach to an org until setup.
- `areas`: name/icon/color/background/identity_statement/description/sort_order; counts of active outcomes shown.
- `goals`: annual/quarterly goals (status, is_draft) tied to outcomes.
- `outcomes`: area_id/goal_id, title/purpose/description, status ACTIVE/COMPLETED, draft flag, source_chunk_id.
- `actions`: outcome_id, priority/is_must, duration_minutes, delegated_to/date, scheduled_date/time, done/completed_at, sort_order, chunk links.
- `inbox_items`: captured notes/action ideas/outcome ideas, triaged flag, chunk_id, triaged_to_id.
- `chunks` + `chunk_items`: grouping of inbox items with convert-to-outcome flow.
- `time_blocks`: scheduled_start/end/duration, completed, counted_as_must.
- `daily_notes` plus review/plan tables (weekly/monthly rituals), `life_plans`, templates/drafts/blocks, `page_backgrounds`, `ai_interaction_logs`.

## Frontend Surface (routes)
- Public: `/login`, `/signup` (creates auth user + users row), `/seed-users` (browser seeding of 5 personas with orgs + 2 years of data).
- Onboarding: `/setup-organization` creates org + member row and updates user.org_id.
- Core (Protected + `AppLayout`):
  - `/today`: daily focus board (top 5 outcomes, quick add to today or inbox, Must/Delegation badges, focus timer modal, daily progress widget, AI daily planner to pick outcomes/schedule actions, editable hero background).
  - `/weekly-plan`: time-block calendar with capture list by area; drag unscheduled actions into slots, create manual blocks, link to weekly review; `/week` shows legacy `WeeklyPlanner` view.
  - `/outcomes`: CRUD with drafts, status toggle, quick area creation, links to detail, AI purpose refinement. `/outcomes/:id` detail page (actions + AI suggestions).
  - `/areas`: CRUD for areas with colors/icons/backgrounds and identity statements.
  - `/goals`: goal management (annual/quarterly) page present.
  - Planning rituals: `/daily-planning` multi-step flow (capture -> categorize -> chunks with AI suggestions -> select focus outcomes -> must/delegation -> reorder -> intention -> commit actions/daily_note); `/capture` + `/inbox` for quick capture and triage.
  - Review rituals: `/evening-review`, `/weekly-review`, `/monthly-review` pages exist for reflections/progress (lightly reviewed).
  - Foundation/tools: `/life-plan` (vision/values/roles), `/templates`, `/profile`, `/voice` (coming-soon placeholder).
- Shared UI: drag/drop via @dnd-kit, `FocusTimer`, `DailyProgressWidget`, `BackgroundHeroSection` per page.

## AI System
- Components: `AIActionSuggestions` (bulk action creation), `AIPurposeRefinement` (rewrite purpose), `AIDailyPlanner` (choose today's focus and auto-schedule top actions), `AIChunkSuggestions` (group inbox items into chunks/outcomes).
- Edge function `ai-assistant` features: `suggest-actions`, `refine-purpose`, `daily-plan`, `generate-insights`, `transcribe-voice`, `suggest-chunks`; requires env `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`. Voice coach UI is not wired to `transcribe-voice` yet.

## Seed/Test Data
- `/seed-users` page builds org + member + life_plan + areas/outcomes/actions/daily_notes/inbox items for 5 personas; uses Supabase client directly.
- Scripts: `seed-test-users.ts`, `seed-data-sql.ts`. Docs: `QUICK_START.md`, `CREATE_TEST_USERS.md`, `CREDENTIALS.md`, `TEST_USERS_GUIDE.md` (all default password `test123`).
- Run Supabase migrations in `supabase/migrations/*` and deploy the edge function to keep schema/API in sync.

## Operational Notes
- Env: `.env` needs `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`; edge function needs `OPENAI_API_KEY`; storage bucket `page-backgrounds` must exist.
- Auth inserts into `users` but does not auto-create organizations; many flows assume `organization_id` exists (quick add inbox, outcome creation), so `/setup-organization` or seeding is required post-signup.
- Scripts available: `npm run dev|build|preview|lint|typecheck` (see `CLAUDE.md`). No tests/CI present.

## Gaps / To-Build
- Voice coaching experience is placeholder; need recording/upload UI, wire to `transcribe-voice`, and display AI parsing.
- README and contributor docs are boilerplate; add real setup/run/deploy steps (env, migrations, storage bucket, edge deploy, seeding).
- Org lifecycle: enforce or guide org creation for new users across pages to prevent null organization_id failures.
- AI coverage: surface `generate-insights`/voice features in reviews/dashboards; improve error handling/loading for AI calls.
- Performance/data loading: several pages fetch in loops (area counts, outcome actions, daily planner) without pagination; consider batching and adding filters.
- Quality: no automated tests or error boundaries; add validation around Supabase writes and better empty/loading states for large datasets.
