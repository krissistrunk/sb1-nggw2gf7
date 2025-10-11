# Test User Credentials

## Quick Access

All test users use the same password for easy testing: **test123**

| Name | Email | Password | Role | Organization |
|------|-------|----------|------|--------------|
| Sarah Chen | sarah@test.com | test123 | Individual Learner | Personal Growth Academy |
| Mike Rodriguez | mike@test.com | test123 | Corporate Trainer | TechCorp Training |
| Emma Watson | emma@test.com | test123 | Course Developer | Creative Learning Hub |
| James Kim | james@test.com | test123 | Administrator | Global Education Institute |
| Lisa Morgan | lisa@test.com | test123 | Team Manager | Innovation Team Co |

---

## How to Create Test Users

### Option 1: Automated Browser-Based Seeding (Recommended - 2 minutes)

1. Navigate to: `/seed-users`
2. Click "Generate Test Users" button
3. Wait for completion (progress will show in real-time)
4. Once done, go to `/login` and use any credentials above

### Option 2: Manual Signup (5-10 minutes)

1. Go to `/signup`
2. For each user above, create an account with:
   - Email: [from table above]
   - Password: test123
   - Name: [from table above]
3. Complete signup process
4. Repeat for all 5 users

---

## What Each User Account Contains

Each test user comes with **2 years of realistic historical data**:

### Data Summary (per user)
- 8 life/work areas with purpose statements
- 40-50 outcomes (60% completed, 30% active, 10% archived)
- 300-400 actions distributed over 2 years
- 450+ daily notes with intentions and reflections
- 90+ weekly plans
- 200+ inbox items (60% triaged)
- Life plan with vision, values, and roles

### Data Characteristics
- Realistic date distribution (2 years back to present)
- Natural completion patterns (not 100% perfect)
- Mix of priorities and statuses
- Varied detail levels (some detailed, some brief)
- Scheduled items in past, present, and future

---

## User Personas

### 1. Sarah Chen - Individual Learner
**Best for testing**: Personal productivity, learning journeys, habit tracking

**Focus areas**:
- Technical Skills
- Career Growth
- Health & Fitness
- Personal Projects
- Reading & Learning
- Relationships
- Financial Health
- Creative Expression

**Typical data**: Consistent daily notes, strong learning focus, balanced life areas

---

### 2. Mike Rodriguez - Corporate Trainer
**Best for testing**: Course delivery, team management, professional training

**Focus areas**:
- Training Programs
- Content Development
- Team Leadership
- Professional Growth
- Health & Wellness
- Innovation Projects
- Client Relations
- Personal Life

**Typical data**: Training-focused outcomes, team coordination, professional development

---

### 3. Emma Watson - Course Developer
**Best for testing**: Content creation, creative projects, creator workflows

**Focus areas**:
- Course Creation
- Creative Projects
- Content Marketing
- Revenue Growth
- Skill Development
- Community Building
- Health & Energy
- Work-Life Balance

**Typical data**: Irregular but intense work periods, creative projects, revenue tracking

---

### 4. James Kim - Administrator
**Best for testing**: Admin features, strategic planning, organization management

**Focus areas**:
- Strategic Planning
- Team Development
- Platform Innovation
- Stakeholder Relations
- Operational Excellence
- Industry Leadership
- Personal Wellness
- Learning & Growth

**Typical data**: High-level strategic outcomes, executive planning, quarterly reviews

---

### 5. Lisa Morgan - Team Manager
**Best for testing**: Team management, project tracking, people development

**Focus areas**:
- Team Performance
- People Development
- Project Delivery
- Cross-functional Collaboration
- Innovation Initiatives
- Professional Skills
- Health & Fitness
- Family & Relationships

**Typical data**: Team-focused outcomes, regular reviews, balanced work-life tracking

---

## Login Instructions

1. Navigate to `/login`
2. Enter email: [any email from table above]
3. Enter password: test123
4. Click "Sign In"

---

## Switching Between Users

To experience different user perspectives:

1. Log out (if logged in)
2. Go to `/login`
3. Enter credentials for desired user
4. Explore their unique data and workflows

---

## Testing Scenarios

### Daily Workflow Test (Sarah Chen)
- View today's scheduled actions
- Set morning intention
- Log evening reflection
- Track energy level
- Review progress

### Weekly Planning Test (Lisa Morgan)
- Create new weekly plan
- Select focus outcomes
- Review previous week
- Track team progress
- Update action items

### Project Management Test (Emma Watson)
- View active projects
- Track content pipeline
- Monitor revenue goals
- Manage creative outcomes
- Review audience growth

### Course Delivery Test (Mike Rodriguez)
- View training schedule
- Track course outcomes
- Review client feedback
- Monitor team performance
- Plan content development

### Strategic Planning Test (James Kim)
- Review quarterly outcomes
- Plan organizational initiatives
- Track strategic metrics
- Conduct executive reviews
- Monitor stakeholder relationships

---

## Important Notes

- **Password**: All users use `test123` for easy testing
- **Organizations**: Each user belongs to a separate organization
- **Data scope**: 2 years of historical data per user
- **Realistic patterns**: Data includes gaps, varying completion rates, and realistic schedules
- **Privacy**: Organizations are isolated - users cannot see each other's data

---

## Troubleshooting

### Cannot log in
- Ensure users have been created (via `/seed-users` or manual signup)
- Check that password is exactly: test123 (lowercase, no spaces)
- Verify email is correctly typed
- Try logging out completely and logging back in

### No data showing after login
- If using manual signup, you'll need to create data manually
- If using seed page, ensure the process completed successfully
- Check browser console for errors
- Try refreshing the page

### Seed page not working
- Check that Supabase connection is configured in .env
- Verify all database migrations have run
- Check browser console for specific errors
- Ensure RLS policies allow data creation

---

## Next Steps After Setup

1. **Explore UI**: Log in as each user to see their unique data
2. **Test Features**: Create new outcomes, actions, notes
3. **View Analytics**: See 2 years of data in charts and dashboards
4. **Test Filters**: Try date ranges, status filters, area filters
5. **Check Workflows**: Experience daily, weekly, and monthly rituals
6. **Mobile Testing**: Test responsive design on different devices

---

## Support

For issues or questions:
1. Check browser console for errors
2. Review TEST_USERS_GUIDE.md for detailed information
3. Verify .env configuration
4. Ensure database migrations are current
5. Check RLS policies in Supabase dashboard

---

**Quick Start**: Navigate to `/seed-users`, click the button, wait 2 minutes, then log in with any email above using password: test123
