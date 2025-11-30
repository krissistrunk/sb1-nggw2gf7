# RPM Productivity App

> A comprehensive productivity and goal management application implementing **Tony Robbins' RPM (Results-focused, Purpose-driven, Massive Action) methodology** from his "Time of Your Life" program.

[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)

## 🎯 What is RPM?

RPM (originally called OPA - Outcome, Purpose, Action) is Tony Robbins' personal productivity system that transforms traditional to-do lists into a purpose-driven, results-focused approach to life management.

### The RPM Philosophy

Instead of asking *"What do I need to do?"*, RPM asks:
1. **What do I really want?** (Result/Outcome)
2. **Why do I want it?** (Purpose - your emotional fuel)
3. **What actions will get me there?** (Massive Action Plan)

This app faithfully implements RPM's core principles with **85% methodology alignment**.

## ✨ Features

### 🎯 Core RPM Implementation
- **Life Areas**: 8-10 categories of improvement (Career, Health, Relationships, etc.)
- **Outcomes Management**: Result-focused goal setting with powerful purpose statements
- **Massive Action Planning**: Break outcomes into high-leverage actions
- **MUST Actions**: Identify non-negotiable daily priorities
- **Purpose Emphasis**: Emotional fuel visible throughout your journey

### 📅 Planning Rituals
- **Daily Planning**: 6-step ritual enforcing 3-5 outcome focus (Tony Robbins' recommendation)
- **Weekly Planning**: Time-block calendar with drag-and-drop scheduling
- **Evening Review**: Reflect on progress and purpose alignment
- **Weekly/Monthly Reviews**: Regular progress assessment and course correction

### 🤖 AI-Powered Features
- **Action Suggestions**: AI generates relevant actions from your outcomes
- **Purpose Refinement**: AI helps craft emotionally compelling purpose statements
- **Daily Planner**: AI suggests focus outcomes and schedules actions automatically
- **Chunk Suggestions**: AI groups inbox items into actionable outcomes

### 🏢 Multi-Tenant Architecture
- **Organizations**: Team collaboration with custom branding
- **User Roles**: Individual, team member, or administrator access
- **Dynamic Theming**: Per-organization color schemes and branding

### 📊 Additional Features
- Life Plan (Vision, Values, Roles)
- GTD-style Inbox for quick capture
- Focus Timer (Pomodoro technique)
- Daily Progress Tracking
- Custom page backgrounds
- Drag-and-drop action reordering

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- (Optional) OpenAI API key for AI features

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sb1-nggw2gf7
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Supabase credentials
   ```

4. **Set up Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Run migrations from `supabase/migrations/` (via CLI or dashboard)
   - Create storage bucket: `page-backgrounds` (public access)
   - Deploy edge function: `supabase functions deploy ai-assistant`
   - Add `OPENAI_API_KEY` to edge function environment variables

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Create test users**
   - Navigate to http://localhost:5173/seed-users
   - Click "Generate Test Users"
   - Wait 2-3 minutes for data generation
   - Login with: `sarah@test.com` / `test123`

See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.

## 🎭 Demo Mode (Without Database)

Don't have a database set up yet? No problem!

```bash
# In your .env file:
VITE_USE_MOCK_DATA=true
```

The app will run with local mock data, perfect for development and testing.

## 📁 Project Structure

```
src/
├── components/          # 14 reusable UI components
│   ├── AI*.tsx         # 4 AI-powered components
│   └── ...
├── pages/              # 23 page components (22 routed)
│   ├── TodayPage.tsx        # Daily execution view
│   ├── DailyPlanningPage.tsx  # 6-step RPM ritual
│   ├── OutcomesPage.tsx     # Outcomes CRUD
│   └── ...
├── hooks/              # 5 custom React hooks
├── contexts/           # OrganizationContext for theming
├── lib/                # Core utilities
│   ├── supabase.ts          # Supabase client
│   ├── database.types.ts    # Generated types
│   └── ai-service.ts        # OpenAI integration
└── App.tsx             # 19 routes configured

supabase/
├── migrations/         # 14 SQL migration files
└── functions/
    └── ai-assistant/   # 6 AI features (OpenAI)
```

## 🎓 Test Users

After running the seed script, you can login with:

| Email | Password | Profile |
|-------|----------|---------|
| sarah@test.com | test123 | Personal Growth Focus |
| mike@test.com | test123 | Corporate Training |
| emma@test.com | test123 | Course Development |
| james@test.com | test123 | Administrator |
| lisa@test.com | test123 | Team Management |

Each account includes 2 years of historical data. See [CREDENTIALS.md](CREDENTIALS.md) for details.

## 🔧 Development Commands

```bash
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Type-check without emitting files
```

## 📖 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Developer guide for working with the codebase
- **[RPM_METHODOLOGY.md](RPM_METHODOLOGY.md)** - Detailed RPM implementation guide
- **[AGENTS.md](AGENTS.md)** - Technical architecture documentation
- **[QUICK_START.md](QUICK_START.md)** - Step-by-step setup guide
- **[TEST_USERS_GUIDE.md](TEST_USERS_GUIDE.md)** - Test user personas

## 🎨 Technology Stack

**Frontend**:
- React 18.3 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)
- @dnd-kit (drag-and-drop)
- React Router v7 (routing)
- date-fns (date handling)

**Backend**:
- Supabase (PostgreSQL database, auth, storage)
- Row-Level Security (RLS) for data isolation
- Supabase Edge Functions (Deno)
- OpenAI GPT-4o-mini (AI features)

**Development**:
- TypeScript 5.5 (strict mode)
- ESLint (code quality)
- tsx (TypeScript execution)

## 🏗️ Architecture Highlights

### Multi-Tenancy
- Organizations with isolated data
- Row-Level Security (RLS) policies
- Dynamic theming per organization

### Authentication
- Supabase Auth with session persistence
- Protected route guards
- Auto-redirect on organization setup

### AI Integration
- Edge functions proxy OpenAI requests
- Usage logging (tokens, response time)
- 4 fully integrated features, 2 in backend

### Data Model
- 20+ tables implementing RPM methodology
- Generated TypeScript types for type safety
- Proper foreign key relationships

## 🔐 Security

- ✅ Row-Level Security (RLS) on all tables
- ✅ Organization-scoped data isolation
- ✅ Environment variables for secrets
- ✅ Input validation
- ⚠️ Rate limiting (to be implemented)
- ⚠️ CSRF protection (to be implemented)

## 🚦 RPM Methodology Alignment

**Current Alignment: 85%**

The app correctly implements:
- ✅ RPM sequence: Result → Purpose → Massive Action
- ✅ 3-5 outcome daily limit (Tony Robbins' recommendation)
- ✅ Purpose emphasis throughout user journey
- ✅ Emotional reconnection during planning rituals
- ✅ Purpose visible during daily execution
- ✅ Life plan foundation
- ✅ MUST actions philosophy
- ✅ Weekly/monthly review rituals

Recent improvements:
- Fixed daily planning to enforce 3-5 outcomes (was 1-7)
- Added emotional reconnection prompts with visualization
- Enhanced purpose display on Today page
- Strengthened purpose field emphasis in outcome creation

See [RPM_METHODOLOGY.md](RPM_METHODOLOGY.md) for detailed methodology documentation.

## 🗺️ Roadmap

### In Progress
- [ ] Complete Voice Coach feature (recording, transcription, parsing)
- [ ] Wire up AI Insights generation to review pages
- [ ] Implement mock data infrastructure for offline development

### Planned Features
- [ ] Mobile app (React Native)
- [ ] Calendar integration (Google, Outlook)
- [ ] Collaboration features (shared outcomes)
- [ ] Habit tracking
- [ ] Analytics dashboard
- [ ] Export/import functionality
- [ ] Offline mode with sync
- [ ] Keyboard shortcuts (power user features)

### Technical Improvements
- [ ] Automated testing (unit, integration, e2e)
- [ ] Error boundaries
- [ ] Performance optimizations (N+1 queries, pagination)
- [ ] CI/CD pipeline
- [ ] Rate limiting
- [ ] Enhanced security validation

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Follow existing code style and conventions.

## 📝 License

[Add your license here]

## 🙏 Acknowledgments

- **Tony Robbins** - For the RPM methodology
- **Supabase** - For the excellent backend platform
- **OpenAI** - For AI capabilities
- All contributors and users of this application

## 📬 Support

- **Issues**: [GitHub Issues](https://github.com/<your-repo>/issues)
- **Documentation**: See docs folder
- **Community**: [Discord/Slack link if available]

---

**Built with ❤️ using Tony Robbins' RPM Methodology**

*Transform your to-do list into a purpose-driven life.*
