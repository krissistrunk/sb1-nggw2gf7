# Test Users Setup Guide

## Quick Access Credentials

Here are 5 test user accounts you can create to explore different parts of the system:

| Name | Email | Password | Role | Organization |
|------|-------|----------|------|--------------|
| Sarah Chen | sarah@test.com | test123 | Individual Learner | Personal Growth Academy |
| Mike Rodriguez | mike@test.com | test123 | Corporate Trainer | TechCorp Training |
| Emma Watson | emma@test.com | test123 | Course Developer | Creative Learning Hub |
| James Kim | james@test.com | test123 | Administrator | Global Education Institute |
| Lisa Morgan | lisa@test.com | test123 | Team Manager | Innovation Team Co |

---

## Setup Instructions

Since the Supabase instance is not directly accessible from automated scripts, you have **two options**:

### Option 1: Manual Signup (Quick - 5 minutes)

1. Navigate to `/signup` in your application
2. For each user above, create an account using their email and password
3. After signing up, you'll need to create their organization manually in the app
4. Log in with any account using: `email` / `test123`

### Option 2: Automated Seed via Browser (Recommended - 30 seconds)

I've created a seed page that will automatically create all test users with 2 years of data:

1. Navigate to `/seed-users` in your browser
2. Click the "Generate Test Users" button
3. Wait 2-3 minutes for all data to be created
4. You'll see progress updates for each user
5. When complete, you can log in with any of the credentials above

---

## User Personas & Data Overview

### 1. Sarah Chen - Individual Learner
**Focus**: Personal growth, technical skill development, career advancement

**Data includes**:
- 8 life areas (Technical Skills, Career Growth, Health, Projects, Reading, Relationships, Financial, Creative)
- 40-50 outcomes spanning 2 years
- 300-400 actions (70% completed)
- 450+ daily notes with morning intentions and evening reflections
- 90+ weekly plans
- 1500+ review sessions (morning, evening, weekly rituals)
- 150-250 inbox items (mix of notes, action ideas, outcome ideas)
- 20-40 voice coaching sessions

**Best for testing**: Self-paced learning, personal productivity, habit tracking

---

### 2. Mike Rodriguez - Corporate Trainer
**Focus**: Training delivery, team leadership, content development

**Data includes**:
- 8 training-focused areas (Training Programs, Content Development, Team Leadership, Professional Growth)
- 40-50 outcomes related to course delivery and team management
- 300-400 training-related actions
- Consistent daily notes showing training preparation
- Weekly reviews with team performance metrics
- Inbox items for course ideas and student feedback
- Voice sessions for planning and coaching

**Best for testing**: Course management, team collaboration, training analytics

---

### 3. Emma Watson - Course Developer
**Focus**: Content creation, creative projects, audience growth

**Data includes**:
- 8 creator-focused areas (Course Creation, Creative Projects, Content Marketing, Revenue Growth)
- 40-50 outcomes for product launches and content creation
- Mix of completed and in-progress creative projects
- Irregular but intense work periods (realistic creator schedule)
- Marketing and community-building activities
- Revenue and growth tracking

**Best for testing**: Content creator workflows, project management, marketplace features

---

### 4. James Kim - Administrator
**Focus**: Strategic planning, organizational leadership, innovation

**Data includes**:
- 8 leadership areas (Strategic Planning, Team Development, Platform Innovation, Stakeholder Relations)
- 40-50 high-level strategic outcomes
- Executive-level actions and initiatives
- Daily leadership reflections
- Quarterly and monthly review sessions
- Industry thought leadership activities

**Best for testing**: Admin features, organization management, reporting, analytics

---

### 5. Lisa Morgan - Team Manager
**Focus**: Team performance, project delivery, people development

**Data includes**:
- 8 management areas (Team Performance, People Development, Project Delivery, Collaboration)
- 40-50 team and project outcomes
- Mix of tactical and strategic actions
- Regular team check-ins and 1-on-1 notes
- Weekly team performance reviews
- Family and work-life balance tracking

**Best for testing**: Team management, project tracking, performance monitoring

---

## What Each User Has

Every test user includes **2 years of historical data** with:

### Core Data
- **Life Plan**: Vision statement, 5-7 core values, 4-6 life roles
- **Areas**: 8-12 life/work areas with purpose statements and success metrics
- **Outcomes**: 40-50 outcomes (60% completed, 30% active, 10% archived)
- **Actions**: 300-400 actions (70% completed, distributed over 2 years)

### Daily Tracking
- **Daily Notes**: 450-500 entries (65% of days covered)
  - Morning intentions (80% of notes)
  - Evening reflections (70% of notes)
  - Energy levels (1-10 scale)
- **Weekly Plans**: 90-100 plans with 3-5 focus outcomes each
- **Review Sessions**: 1500-2000 total
  - Morning rituals: ~350
  - Evening rituals: ~300
  - Weekly reviews: ~95
  - Monthly reviews: ~24
  - Quarterly reviews: ~8

### Capture & Planning
- **Inbox Items**: 150-250 items
  - 50% notes
  - 30% action ideas
  - 20% outcome ideas
  - 60% triaged, 40% still in inbox
- **Voice Sessions**: 20-40 sessions
  - Planning, coaching, and reflection types
  - 3-15 minutes duration
  - AI insights and transcripts included

---

## Data Distribution Patterns

All data is realistically distributed over 2 years:

- **Completion rates**: Reflect realistic productivity (not 100% perfect)
- **Date patterns**: More recent activity, some gaps for vacations
- **Priorities**: Mix of high/medium/low priority actions
- **Status**: Natural progression from active to completed to archived
- **Scheduling**: Actions scheduled across past, present, and future
- **Notes quality**: Varying detail levels (some detailed, some brief)

---

## Testing Scenarios

### Scenario 1: Daily Workflow
Log in as **Sarah Chen** and explore:
- Today's scheduled actions
- Morning intention setting
- Evening reflection
- Energy level tracking

### Scenario 2: Weekly Planning
Log in as **Lisa Morgan** and explore:
- Weekly plan creation
- Focus outcome selection
- Weekly review ritual
- Progress tracking

### Scenario 3: Project Management
Log in as **Emma Watson** and explore:
- Multiple creative projects
- Content pipeline management
- Revenue tracking
- Audience growth metrics

### Scenario 4: Team Leadership
Log in as **Mike Rodriguez** and explore:
- Team performance tracking
- Training delivery schedule
- Content development pipeline
- Client satisfaction metrics

### Scenario 5: Strategic Planning
Log in as **James Kim** and explore:
- Quarterly strategic outcomes
- Organizational initiatives
- Executive planning rituals
- Stakeholder management

---

## Switching Between Accounts

To test different user experiences:

1. Log out of current account
2. Navigate to `/login`
3. Enter credentials for desired test user
4. Password is always: `test123`

---

## Troubleshooting

### Users not showing data after signup
- Make sure you've completed the signup process fully
- Check that organizations were created
- Try logging out and back in

### Can't create users
- Check Supabase auth is enabled
- Verify email confirmation is disabled in Supabase settings
- Check RLS policies allow user creation

### Seed page not working
- Ensure you're logged in as an authenticated user first
- Check browser console for errors
- Verify Supabase connection in .env file

---

## Next Steps

After creating test users:

1. **Explore the UI**: Log in as each user to see their unique data
2. **Test Features**: Try creating new outcomes, actions, and notes
3. **Check Filters**: Test date ranges, status filters, area filters
4. **Review Analytics**: See how 2 years of data looks in charts/graphs
5. **Test Collaboration**: See how organization data is shared (if applicable)

---

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify Supabase connection details in `.env`
3. Ensure all database migrations have run successfully
4. Check that RLS policies allow data access for authenticated users
