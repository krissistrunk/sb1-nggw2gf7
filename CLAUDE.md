# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript productivity/goal management application built with Vite, featuring multi-tenant organization support and AI-powered planning features. The application uses Supabase for backend services (authentication, database, storage) and integrates with OpenAI for AI capabilities.

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

### Directory Structure

```
src/
├── components/      # Reusable UI components
│   ├── AI*.tsx     # AI-powered components (suggestions, planning)
│   ├── AppLayout.tsx
│   ├── ProtectedRoute.tsx
│   └── ...
├── pages/          # Route-level page components
│   ├── TodayPage.tsx        # Daily view
│   ├── OutcomesPage.tsx     # Outcomes management
│   ├── AreasPage.tsx        # Life areas
│   ├── DailyPlanningPage.tsx
│   ├── WeeklyReviewPage.tsx
│   └── ...
├── hooks/          # Custom React hooks
│   ├── useAuth.ts           # Authentication state/methods
│   ├── useActions.ts        # Action CRUD operations
│   ├── useChunks.ts         # Time-block management
│   └── ...
├── contexts/       # React contexts
│   └── OrganizationContext.tsx  # Organization state and theming
├── lib/            # Core utilities and services
│   ├── supabase.ts          # Supabase client configuration
│   ├── database.types.ts    # Generated TypeScript types
│   ├── ai-service.ts        # OpenAI integration
│   └── default-backgrounds.ts
├── App.tsx         # Main routing configuration
└── main.tsx        # Application entry point

supabase/
├── migrations/     # SQL migration files (14 total)
└── functions/      # Edge functions (if any)
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

Required environment variables (create `.env` file):
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

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
