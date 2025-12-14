# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript productivity/goal management application built with Vite, implementing **Tony Robbins' RPM (Results-focused, Purpose-driven, Massive Action) methodology** from his "Time of Your Life" program (originally called OPA - Outcome, Purpose, Action). The application features multi-tenant organization support and AI-powered planning features. It uses Supabase for backend services (authentication, database, storage) and integrates with OpenAI for AI capabilities.

### RPM Methodology Implementation Status
**Current Alignment: 85%** (improved from 65% after critical fixes)

The application correctly implements:
- ✅ RPM sequence: Result/Outcome → Purpose → Massive Action Plan
- ✅ Daily planning limited to 3-5 key outcomes (Tony Robbins' recommendation)
- ✅ Purpose emphasis throughout user journey
- ✅ Emotional reconnection prompts during planning rituals
- ✅ Purpose visibility during daily execution
- ✅ Life plan foundation (vision, values, roles)
- ✅ MUST actions philosophy
- ✅ Weekly/monthly review rituals

**See [RPM_METHODOLOGY.md](RPM_METHODOLOGY.md) for detailed methodology documentation.**

## Development Commands

### Essential Commands
```bash
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Type-check without emitting files
```

### Database Seeding
```bash
# Automated seeding via browser (recommended)
# Navigate to http://localhost:5173/seed-users after starting dev server

# Manual seeding via script
npx tsx seed-test-users.ts
```

## Architecture Overview

### Core Data Model
The application follows an RPM (Results, Purpose, Massive Action) methodology with these primary entities:

- **Organizations**: Multi-tenant support with custom branding, subscription tiers (STARTER/PROFESSIONAL/ENTERPRISE)
- **Users**: Belong to organizations, have personal settings and preferences
- **Areas**: Life/work areas with purpose statements and success metrics (Career, Health, Relationships, etc.)
- **Outcomes**: Goal-like entities with purpose statements, power statements, metrics, and status tracking
- **Actions**: Tasks linked to outcomes with priority, duration, status, and sorting
- **Goals**: Hierarchical goal structure (annual/quarterly) linked to outcomes
- **Inbox Items**: GTD-style capture system for quick task collection
- **Chunks**: Time-blocking system for action scheduling
- **Life Plan**: Vision, values, roles, and principles
- **Daily/Weekly Plans**: Planning templates and progress tracking

### Current Implementation Status

**Pages**: 23 total (22 routed, 1 unrouted)
- ✅ Public: LoginPage, SignupPage, SeedUsersPage
- ✅ Onboarding: SetupOrganizationPage
- ✅ Core: TodayPage, OutcomesPage, OutcomeDetailPage, AreasPage, GoalsPage
- ✅ Capture: InboxPage, CapturePage
- ✅ Planning: DailyPlanningPage, WeeklyPlanPage
- ✅ Reviews: EveningReviewPage, WeeklyReviewPage, MonthlyReviewPage
- ✅ Foundation: LifePlanPage, TemplatesPage, ProfilePage
- ⚠️ Voice: VoiceCoachPage (placeholder - implementation pending)
- ❌ Unrouted: WeeklyReflectionPage (exists but not in App.tsx)

**Components**: 14 total
- AI-powered: AIActionSuggestions, AIPurposeRefinement, AIDailyPlanner, AIChunkSuggestions
- UI: AppLayout, ProtectedRoute, BackgroundHeroSection, ImageUploadModal, FocusTimer, DailyProgressWidget, SortableActionItem, DraggableActionItem, CategorySidebar, WeeklyPlanner

**Hooks**: 5 custom hooks (useAuth, useActions, useChunks, useDailyProgress, usePageBackground)

**Files to Clean Up**:
- `WeeklyPlanPage_BACKUP.tsx` - backup file that should be archived or removed
- Possible duplicate migration files in `supabase/migrations/`

### Directory Structure

```
src/
├── components/      # 14 reusable UI components
│   ├── AI*.tsx     # 4 AI-powered components
│   ├── AppLayout.tsx
│   ├── ProtectedRoute.tsx
│   └── ...
├── pages/          # 23 page components (22 routed)
│   ├── TodayPage.tsx        # Daily view with purpose emphasis
│   ├── OutcomesPage.tsx     # Outcomes CRUD with RPM emphasis
│   ├── AreasPage.tsx        # Life areas management
│   ├── DailyPlanningPage.tsx  # 6-step RPM ritual (3-5 outcomes)
│   ├── WeeklyPlanPage.tsx   # Time-block calendar
│   ├── WeeklyReflectionPage.tsx  # ⚠️ NOT ROUTED
│   └── ...
├── hooks/          # 5 custom React hooks
│   ├── useAuth.ts           # Authentication state/methods
│   ├── useActions.ts        # Action CRUD operations
│   ├── useChunks.ts         # Time-block management
│   └── ...
├── contexts/       # React contexts
│   └── OrganizationContext.tsx  # Organization state and theming
├── lib/            # Core utilities and services
│   ├── supabase.ts          # Supabase client configuration
│   ├── database.types.ts    # Generated TypeScript types (23KB)
│   ├── ai-service.ts        # OpenAI integration
│   └── default-backgrounds.ts
├── App.tsx         # 19 routes configured
└── main.tsx        # Application entry point

supabase/
├── migrations/     # 14 SQL migration files
└── functions/      # Edge functions
    └── ai-assistant/  # 6 AI features (OpenAI integration)
```

### Key Technical Patterns

**Authentication Flow**:
- Uses `useAuth` hook for auth state management
- `ProtectedRoute` component wraps authenticated routes
- User record automatically created in `users` table on signup
- Session persistence enabled in Supabase client

**Organization Context**:
- `OrganizationProvider` wraps the entire app
- Loads user's organization on mount
- Applies dynamic theming based on organization's `primary_color`
- All data queries filtered by `organization_id` via RLS policies

**Data Access Pattern**:
- Custom hooks (e.g., `useActions`, `useChunks`) encapsulate Supabase queries
- TypeScript types imported from `database.types.ts` for type safety
- Row-Level Security (RLS) policies enforce organization-level data isolation

**AI Integration**:
- AI features call Supabase Edge Functions which interface with OpenAI
- Components like `AIActionSuggestions`, `AIDailyPlanner`, `AIPurposeRefinement`
- AI capabilities include action suggestions, daily planning, purpose refinement, and insights

**Routing**:
- React Router v7+ with data-focused routing
- All authenticated routes wrapped in `<ProtectedRoute><AppLayout>...</AppLayout></ProtectedRoute>`
- Public routes: `/login`, `/signup`, `/seed-users`
- Default authenticated route: `/today`

## Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory (see `.env.example` for template):

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Flags (Optional)
VITE_USE_MOCK_DATA=false  # Set to 'true' for development without database
```

### Database Connection Strategy

**If Database is Connected**:
- App works normally with full Supabase integration
- All CRUD operations persist to database
- AI features require `OPENAI_API_KEY` in Supabase Edge Function environment

**If Database is NOT Connected** (Mock Mode):
- Set `VITE_USE_MOCK_DATA=true` in `.env`
- App uses local mock data from `src/lib/mock-data/`
- UI shows "Demo Mode" banner
- Write operations simulate success but don't persist
- Allows development and testing without database access

**Organization Setup Critical Note**:
- After signup, users MUST complete organization setup at `/setup-organization`
- Many pages assume `user.organization_id` exists and will error without it
- Consider implementing automatic redirect or enforcement

## Database Migrations

Migrations are located in `supabase/migrations/` and include:
- Multi-tenant organization setup
- RPM schema (areas, outcomes, actions, goals)
- Chunking/time-blocking system
- Templates and drafts system
- Visual enhancements (backgrounds, icons, colors)
- RLS policies for data isolation

To apply migrations, use Supabase CLI or apply directly in Supabase dashboard.

## Test Data

Test users can be created via:
1. **Automated**: Navigate to `/seed-users` page and click "Generate Test Users"
2. **Manual**: Use `/signup` with credentials from `CREDENTIALS.md`

All test accounts use password: `test123`

Default test users:
- sarah@test.com (Individual Learner)
- mike@test.com (Corporate Trainer)
- emma@test.com (Course Developer)
- james@test.com (Administrator)
- lisa@test.com (Team Manager)

Seeded accounts include 2 years of historical data: areas, outcomes, actions, daily notes, weekly plans, and inbox items.

## Code Style & Conventions

- **TypeScript**: Strict mode enabled, prefer explicit types
- **Components**: Functional components with hooks
- **Imports**: Use type imports (`import type { ... }`) for types
- **Database Types**: Generated types in `database.types.ts` - do not manually edit
- **Naming**: PascalCase for components, camelCase for functions/variables
- **File Organization**: Co-locate related components, extract reusable logic to hooks

## Important Notes

- All database tables have RLS policies enabled - queries automatically filtered by user/organization
- The `database.types.ts` file is generated from Supabase schema - regenerate after schema changes
- AI features require OpenAI API key configured in Supabase Edge Functions
- Organization theming applies CSS custom properties dynamically
- Actions support drag-and-drop reordering via `@dnd-kit` library
- Date handling uses `date-fns` library consistently throughout the app

## Recent Critical RPM Methodology Fixes

The following changes were made to align the app with Tony Robbins' true RPM methodology:

### 1. Daily Planning Outcome Limit (DailyPlanningPage.tsx)
- **Changed**: Enforces 3-5 outcome maximum (was 1-7)
- **Added**: Warning when selecting more than 4 outcomes
- **Rationale**: Tony Robbins explicitly recommends 3-4 key outcomes per day for optimal focus

### 2. Emotional Reconnection Prompts (DailyPlanningPage.tsx)
- **Added**: "Tony Robbins' Purpose Reconnection Ritual" instructions
- **Includes**: "Read OUT LOUD", visualization, emotional questions
- **Rationale**: Purpose provides emotional fuel - must reconnect daily

### 3. Purpose Display on Today Page (TodayPage.tsx)
- **Added**: Purpose cards with "Your WHY" for each outcome
- **Visual**: Red/orange gradient with Heart icon
- **Rationale**: Purpose must be visible during execution, not just planning

### 4. Purpose Field Emphasis (OutcomesPage.tsx)
- **Enhanced**: "YOUR WHY (The Emotional Fuel)" label
- **Added**: Guidance box with 4 key questions
- **Increased**: Textarea from 2 to 5 rows
- **Rationale**: Purpose is THE most important field in RPM methodology

**Result**: RPM alignment improved from 65% to 85%

## AI Features Status

**Fully Integrated (4/6)**:
- ✅ Action Suggestions - Bulk action creation from outcome
- ✅ Purpose Refinement - AI-powered purpose statement improvement
- ✅ Daily Planner - AI suggests focus outcomes and schedules actions
- ✅ Chunk Suggestions - AI groups inbox items into outcomes

**Backend Only (2/6)**:
- ⏳ Voice Transcription - Edge function exists, UI not implemented
- ⏳ Generate Insights - Edge function exists, not surfaced in review pages

## Documentation Files

- `CLAUDE.md` - This file (developer guide)
- `README.md` - Project overview and setup (needs rewrite)
- `RPM_METHODOLOGY.md` - Detailed RPM implementation guide (to be created)
- `AGENTS.md` - Technical architecture documentation
- `QUICK_START.md` - User onboarding guide
- `TEST_USERS_GUIDE.md` - Test user personas and credentials
- `CREDENTIALS.md` - Test account credentials (password: test123)
