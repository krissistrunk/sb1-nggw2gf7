# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **React + TypeScript productivity/goal management application** built with Vite, implementing **Tony Robbins' RPM (Results-focused, Purpose-driven, Massive Action) methodology** from his "Time of Your Life" program (originally called OPA - Outcome, Purpose, Action).

The application features:
- Multi-tenant organization support with custom branding
- AI-powered planning (OpenAI + Anthropic)
- Voice coaching with text-to-speech (ElevenLabs)
- Knowledge management system (Zettelkasten-style)
- Supabase backend (authentication, database, storage, edge functions)

### RPM Methodology Implementation Status
**Current Alignment: 85%** (improved from 65% after critical fixes)

The application correctly implements:
- RPM sequence: Result/Outcome -> Purpose -> Massive Action Plan
- Daily planning limited to 3-5 key outcomes (Tony Robbins' recommendation)
- Purpose emphasis throughout user journey
- Emotional reconnection prompts during planning rituals
- Purpose visibility during daily execution
- Life plan foundation (vision, values, roles)
- MUST actions philosophy
- Weekly/monthly review rituals

**See [RPM_METHODOLOGY.md](RPM_METHODOLOGY.md) for detailed methodology documentation.**

---

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

---

## Architecture Overview

### Tech Stack
- **Framework**: React 18.3.1 + TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **Routing**: React Router DOM 7.9.3
- **Backend**: Supabase JS 2.57.4
- **Styling**: TailwindCSS 3.4.1
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Date Utilities**: date-fns 4.1.0
- **Icons**: Lucide React 0.344.0
- **AI**: OpenAI 6.2.0 (via Edge Functions)
- **Graph Visualization**: ReactFlow 11.11.4
- **Video/Audio**: LiveKit Client 2.15.8

### Core Data Model
The application follows RPM methodology with these primary entities:

| Entity | Description |
|--------|-------------|
| **Organizations** | Multi-tenant support with custom branding, subscription tiers (STARTER/PROFESSIONAL/ENTERPRISE) |
| **Users** | Belong to organizations, have personal settings and voice preferences |
| **Areas** | Life/work areas with purpose statements (Career, Health, Relationships, etc.) |
| **Outcomes** | Goal-like entities with purpose statements, power statements, metrics, status |
| **Actions** | Tasks linked to outcomes with priority, duration, status, sorting, MUST flag |
| **Goals** | Hierarchical goal structure (annual/quarterly) linked to outcomes |
| **Inbox Items** | GTD-style capture system for quick task collection |
| **Chunks** | Time-blocking/grouping system for action scheduling |
| **Time Blocks** | Scheduled focus sessions with completion tracking |
| **Life Plan** | Vision, values, roles, principles, resources |
| **Daily/Weekly Plans** | Planning templates and progress tracking |
| **Knowledge Notes** | Zettelkasten-style note system with linking |
| **Voice Sessions** | Recorded coaching sessions with transcriptions |

---

## Directory Structure

```
src/
├── components/          # 20 reusable UI components
│   ├── AI*.tsx          # 4 AI-powered components
│   ├── AppLayout.tsx    # Main navigation shell
│   ├── ProtectedRoute.tsx
│   ├── ErrorBoundary.tsx
│   ├── FocusTimer.tsx
│   ├── VoiceCoach*.tsx  # Voice coaching components
│   ├── Knowledge*.tsx   # Knowledge base components
│   └── ...
├── pages/               # 25 page components (21 routed)
│   ├── TodayPage.tsx
│   ├── OutcomesPage.tsx
│   ├── DailyPlanningPage.tsx
│   ├── VoiceCoachPage.tsx
│   ├── KnowledgeBasePage.tsx
│   ├── KnowledgeGraphPage.tsx
│   └── ...
├── hooks/               # 8 custom React hooks
│   ├── useAuth.ts
│   ├── useActions.ts
│   ├── useChunks.ts
│   ├── useDailyProgress.ts
│   ├── usePageBackground.ts
│   ├── useVoiceRecording.ts
│   ├── useSpeechSynthesis.ts
│   └── useKnowledge.ts
├── contexts/
│   └── OrganizationContext.tsx
├── lib/
│   ├── supabase.ts
│   ├── database.types.ts    # Generated types (800+ lines)
│   ├── ai-service.ts
│   ├── elevenlabs-service.ts
│   ├── knowledge-service.ts
│   ├── constants.ts
│   ├── default-backgrounds.ts
│   └── mock-data/           # 6 mock data files
├── App.tsx                  # 21 routes configured
└── main.tsx

supabase/
├── migrations/              # 21 SQL migration files
└── functions/
    └── ai-assistant/        # Multi-feature edge function
```

---

## Pages Reference (25 total)

### Public Pages (3)
| Page | Route | Purpose |
|------|-------|---------|
| `LoginPage` | `/login` | User authentication |
| `SignupPage` | `/signup` | New user registration |
| `SeedUsersPage` | `/seed-users` | Development: create test users with 2 years of data |

### Onboarding (1)
| Page | Route | Purpose |
|------|-------|---------|
| `SetupOrganizationPage` | `/setup-organization` | First-time org setup (name, subdomain, branding) |

### Core Navigation (5)
| Page | Route | Purpose |
|------|-------|---------|
| `TodayPage` | `/today` | Daily dashboard with selected outcomes, actions, purpose display |
| `OutcomesPage` | `/outcomes` | Outcomes CRUD with RPM emphasis on purpose |
| `OutcomeDetailPage` | `/outcomes/:id` | Single outcome detail with action management |
| `AreasPage` | `/areas` | Life areas management (8 icons, 8 colors) |
| `GoalsPage` | `/goals` | Annual/quarterly goal hierarchy |

### Capture & Inbox (2)
| Page | Route | Purpose |
|------|-------|---------|
| `InboxPage` | `/inbox` | GTD-style inbox processing |
| `CapturePage` | `/capture` | Quick capture with AI-powered chunking |

### Planning Rituals (4)
| Page | Route | Purpose |
|------|-------|---------|
| `DailyPlanningPage` | `/daily-planning` | 8-step RPM ritual (3-5 outcomes max) |
| `WeeklyPlanPage` | `/weekly-plan` | Time-block calendar (24-hour grid) |
| `WeekPage` | `/week` | Alternative week view with WeeklyPlanner component |
| `LifePlanPage` | `/life-plan` | Vision, values, roles, principles, "Three to Thrive" |

### Review Rituals (4)
| Page | Route | Purpose |
|------|-------|---------|
| `EveningReviewPage` | `/evening-review` | Daily reflection (wins, lessons, gratitude) |
| `WeeklyReviewPage` | `/weekly-review` | 8-step weekly ritual |
| `WeeklyReflectionPage` | `/weekly-reflection` | Alternative weekly reflection |
| `MonthlyReviewPage` | `/monthly-review` | Monthly metrics and goal review |

### Foundation & Tools (5)
| Page | Route | Purpose |
|------|-------|---------|
| `TemplatesPage` | `/templates` | Outcome template library |
| `ProfilePage` | `/profile` | User settings, voice preferences |
| `VoiceCoachPage` | `/voice` | Voice coaching sessions (5 modes) |
| `KnowledgeBasePage` | `/knowledge` | Zettelkasten note-taking |
| `KnowledgeGraphPage` | `/knowledge-graph` | Knowledge visualization with ReactFlow |

### Unrouted/Backup (2)
- `WeeklyReflectionPage.tsx` - Exists but not in main navigation
- `WeeklyPlanPage_BACKUP.tsx` - Backup file (should be archived)

---

## Components Reference (20 total)

### Layout & Navigation
| Component | Purpose |
|-----------|---------|
| `AppLayout` | Main shell with sticky header, dark mode toggle, expandable nav sections |
| `ProtectedRoute` | Auth guard (redirects to login/setup-organization) |
| `ErrorBoundary` | React error boundary with dev-mode details |

### AI-Powered (4)
| Component | Purpose |
|-----------|---------|
| `AIActionSuggestions` | Generate action suggestions for outcome |
| `AIPurposeRefinement` | Improve purpose statements with tone options |
| `AIDailyPlanner` | AI-recommended focus outcomes and schedules |
| `AIChunkSuggestions` | Auto-organize inbox items into chunks |

### Voice Coaching (2)
| Component | Purpose |
|-----------|---------|
| `VoiceCoachButton` | Trigger voice coach in UI |
| `VoiceCoachModal` | Full coaching session (record, TTS, knowledge extraction) |

### Knowledge Base (3)
| Component | Purpose |
|-----------|---------|
| `NoteEditor` | Rich markdown editor with wiki-links |
| `KnowledgeGraphView` | ReactFlow-based graph visualization |
| `RelevantKnowledgeSidebar` | Show relevant notes during sessions |

### UI Components (8)
| Component | Purpose |
|-----------|---------|
| `BackgroundHeroSection` | Reusable hero with custom background |
| `ImageUploadModal` | Upload/configure background images |
| `FocusTimer` | Pomodoro timer with MUST goal celebration |
| `DailyProgressWidget` | Display MUST action progress |
| `WeeklyPlanner` | Week planning component wrapper |
| `SortableActionItem` | Draggable action with @dnd-kit |
| `DraggableActionItem` | Alternative draggable action |
| `CategorySidebar` | Toggle-able category/area filter |

---

## Hooks Reference (8 total)

| Hook | Purpose | Key Methods |
|------|---------|-------------|
| `useAuth` | Auth state and operations | `signIn`, `signUp`, `signOut` |
| `useActions` | Action CRUD operations | `scheduleAction`, `toggleAction`, `createAction`, `toggleMustStatus`, `updateDelegation` |
| `useChunks` | Time-block management | `loadChunks`, `createChunk`, `updateChunk`, `deleteChunk`, `archiveChunk` |
| `useDailyProgress` | Track MUST action progress | `calculateProgress` (returns `mustTimeRequired`, `mustTimeCompleted`, `mustTimePercentage`) |
| `usePageBackground` | Per-page custom backgrounds | `updateBackground`, `uploadImage`, `deleteBackground` |
| `useVoiceRecording` | Audio recording with silence detection | `startRecording`, `stopRecording`, `uploadRecording`, `blobToBase64` |
| `useSpeechSynthesis` | Web Speech API TTS | `speak`, `pause`, `resume`, `cancel`, `queue`, `getPreferredVoice` |
| `useKnowledge` | Knowledge base operations | `loadNotes`, `createNote`, `updateNote`, `searchNotes`, `linkNotes`, `extractKnowledgeFromSession` |

---

## Services & Utilities

### `ai-service.ts`
AI integration calling Supabase Edge Function:
- `suggestActions(outcomeTitle, description, existingActions)`
- `refinePurpose(currentPurpose, title)`
- `generateDailyPlan(outcomes, actions, completionHistory)`
- `generateInsights(actionsData, reviewData)`
- `transcribeVoice(audioBase64)`
- `suggestChunks(inboxItems, outcomes)`

### `elevenlabs-service.ts`
Text-to-speech integration:
- `textToSpeech(text, voiceId, options)` - Returns audio URL
- `getVoices()` - Get available voices
- `playAudio(audioUrl)` - Play generated audio
- IndexedDB caching for offline playback
- 6 popular voices pre-configured (Rachel, Antoni, Josh, Domi, Elli, Callum)

### `knowledge-service.ts`
Zettelkasten note management:
- Note types: permanent, fleeting, literature, insight, pattern, learning
- Source types: coaching_session, manual, ai_generated, weekly_review, daily_reflection
- Link types: relates_to, contradicts, supports, example_of, caused_by, leads_to
- Wiki-link extraction and markdown export

### `constants.ts`
Application-wide constants:
- `DEFAULT_PRIMARY_COLOR`: #F97316
- `APP_NAME`: 'RPM Life'
- `SUBSCRIPTION_TIERS`: STARTER, PROFESSIONAL, ENTERPRISE
- `MEMBER_ROLES`: ADMIN, MANAGER, MEMBER
- `OUTCOME_STATUS`: ACTIVE, COMPLETED, ARCHIVED
- `VOICE_SESSION_TYPES`: PLANNING, COACHING, REFLECTION
- `STORAGE_BUCKETS`: PAGE_BACKGROUNDS, VOICE_RECORDINGS
- `ROUTES`: All route paths

### `default-backgrounds.ts`
15 default backgrounds organized by category (Nature, Workspace, Abstract) with page-specific defaults.

---

## Supabase Edge Function: `ai-assistant`

**Location**: `/supabase/functions/ai-assistant/index.ts`

Supports 12 features:

| Feature | AI Provider | Purpose |
|---------|-------------|---------|
| `suggest-actions` | OpenAI | Generate action suggestions |
| `refine-purpose` | OpenAI | Improve purpose statements |
| `daily-plan` | OpenAI | Create daily plan |
| `generate-insights` | OpenAI | Analyze completions |
| `transcribe-voice` | OpenAI | Speech-to-text |
| `suggest-chunks` | OpenAI | Group inbox items |
| `coaching-response` | Anthropic | Interactive coaching |
| `save-voice-session` | Database | Persist voice session |
| `extract-knowledge` | Anthropic | Extract knowledge from session |
| `semantic-search` | OpenAI | Find similar notes |
| `generate-embedding` | OpenAI | Create text embedding |
| `elevenlabs-tts` | ElevenLabs | Text-to-speech |

---

## Database Migrations (21 total)

Key migrations include:
1. Multi-tenant organizations with RLS policies
2. RPM schema (areas, outcomes, actions, goals)
3. Life plan tables (vision, values, roles, resources)
4. Visual enhancements (icons, colors, backgrounds)
5. Drafts and templates system
6. MUST actions and delegation
7. Chunking/time-blocking system
8. AI features tables
9. Voice coach system (sessions, transcriptions)
10. Voice settings and preferences
11. Knowledge base schema
12. Semantic search function with embeddings

To apply migrations: Use Supabase CLI or apply directly in Supabase dashboard.

---

## Environment Setup

### Required Environment Variables
Create a `.env` file (see `.env.example`):

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Flags (Optional)
VITE_USE_MOCK_DATA=false  # Set to 'true' for offline development
```

### Edge Function Environment (Supabase Dashboard)
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
```

### Database Connection Strategy

**Connected Mode** (default):
- Full Supabase integration
- All CRUD operations persist
- AI features require API keys in Edge Function environment

**Mock Mode** (`VITE_USE_MOCK_DATA=true`):
- Local mock data from `src/lib/mock-data/`
- UI shows "Demo Mode" banner
- Write operations simulate success but don't persist
- Allows development without database access

---

## Test Data

### Creating Test Users
1. **Automated**: Navigate to `/seed-users` and click "Generate Test Users"
2. **Manual**: Use `npx tsx seed-test-users.ts`

### Test Accounts (password: `test123`)
| Email | Persona | Tier | Primary Color |
|-------|---------|------|---------------|
| sarah@test.com | Individual Learner | STARTER | #10B981 (green) |
| mike@test.com | Corporate Trainer | ENTERPRISE | #3B82F6 (blue) |
| emma@test.com | Course Developer | PROFESSIONAL | #8B5CF6 (purple) |
| james@test.com | Administrator | ENTERPRISE | #EF4444 (red) |
| lisa@test.com | Team Manager | PROFESSIONAL | #F59E0B (amber) |

Each account includes 2 years of historical data: areas, outcomes, actions, daily notes, weekly plans, and inbox items.

---

## Key Technical Patterns

### Authentication Flow
```
useAuth hook -> ProtectedRoute wrapper -> Organization check -> Page render
```
- User record auto-created in `users` table on signup
- Redirects to `/setup-organization` if no organization

### Organization Context
- `OrganizationProvider` wraps entire app
- Applies dynamic theming via CSS variable `--primary-color`
- Sets document title and favicon
- All queries filtered by `organization_id` via RLS

### Data Access Pattern
- Custom hooks encapsulate Supabase queries
- TypeScript types from generated `database.types.ts`
- Row-Level Security (RLS) enforces organization isolation

### Voice Coaching Flow
```
VoiceCoachModal -> useVoiceRecording (record) -> ai-assistant/transcribe-voice
                -> ai-assistant/coaching-response (Anthropic)
                -> elevenlabs-service/textToSpeech -> useSpeechSynthesis (playback)
                -> ai-assistant/extract-knowledge -> knowledge-service/createNote
```

### Knowledge Graph Flow
```
KnowledgeBasePage -> useKnowledge -> knowledge-service
                  -> NoteEditor (create/edit with wiki-links)
                  -> KnowledgeGraphPage -> KnowledgeGraphView (ReactFlow)
```

---

## Code Style & Conventions

- **TypeScript**: Strict mode enabled, prefer explicit types
- **Components**: Functional components with hooks
- **Imports**: Use type imports (`import type { ... }`)
- **Database Types**: Generated in `database.types.ts` - do not manually edit
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Styling**: TailwindCSS utility classes
- **Date Handling**: `date-fns` library consistently
- **Drag & Drop**: `@dnd-kit` library

---

## RPM Methodology Critical Features

### 1. Daily Planning Outcome Limit
- Enforces 3-5 outcome maximum (Tony Robbins' recommendation)
- Warning when selecting more than 4 outcomes
- Location: `DailyPlanningPage.tsx`

### 2. Emotional Reconnection Prompts
- "Tony Robbins' Purpose Reconnection Ritual"
- Instructions: "Read OUT LOUD", visualization, emotional questions
- Location: `DailyPlanningPage.tsx`

### 3. Purpose Display on Today Page
- Purpose cards with "Your WHY" for each outcome
- Red/orange gradient with Heart icon
- Location: `TodayPage.tsx`

### 4. Purpose Field Emphasis
- "YOUR WHY (The Emotional Fuel)" label
- Guidance box with 4 key questions
- 5-row textarea for detailed purpose
- Location: `OutcomesPage.tsx`

---

## AI Features Status

### Fully Integrated
| Feature | UI Component | Status |
|---------|--------------|--------|
| Action Suggestions | `AIActionSuggestions` | Active |
| Purpose Refinement | `AIPurposeRefinement` | Active |
| Daily Planner | `AIDailyPlanner` | Active |
| Chunk Suggestions | `AIChunkSuggestions` | Active |
| Voice Transcription | `VoiceCoachModal` | Active |
| Coaching Response | `VoiceCoachModal` | Active |
| Knowledge Extraction | `VoiceCoachModal` | Active |
| Text-to-Speech | `VoiceCoachModal` | Active |

### Backend Only (Not Surfaced in UI)
| Feature | Edge Function | Status |
|---------|---------------|--------|
| Generate Insights | `generate-insights` | Needs UI in review pages |
| Semantic Search | `semantic-search` | Needs UI integration |

---

## Important Notes

1. **RLS Policies**: All tables have Row-Level Security - queries auto-filtered by user/organization
2. **Type Generation**: Regenerate `database.types.ts` after schema changes using Supabase CLI
3. **API Keys**: AI features require keys in Supabase Edge Function environment (not client-side)
4. **Organization Required**: Users must complete `/setup-organization` before accessing main features
5. **Voice Features**: Require microphone permission and ElevenLabs API key
6. **Knowledge Links**: Use wiki-style `[[Note Title]]` syntax for linking notes

---

## Files to Clean Up

- `WeeklyPlanPage_BACKUP.tsx` - Backup file that should be archived or removed
- Possible duplicate migration files in `supabase/migrations/`
- Consider routing `WeeklyReflectionPage` or removing if unused

---

## Documentation Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file - developer guide |
| `README.md` | Project overview and setup |
| `RPM_METHODOLOGY.md` | Detailed RPM implementation guide |
| `AGENTS.md` | Technical architecture documentation |
| `QUICK_START.md` | User onboarding guide |
| `TEST_USERS_GUIDE.md` | Test user personas and credentials |
| `CREDENTIALS.md` | Test account credentials |
| `DOCKER_SETUP.md` | Docker configuration guide |
