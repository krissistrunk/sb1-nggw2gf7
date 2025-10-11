import { createClient } from '@supabase/supabase-js';
import { subDays, subWeeks, subMonths, format, startOfWeek, addDays } from 'date-fns';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TWO_YEARS_AGO = subDays(new Date(), 730);
const TODAY = new Date();

const TEST_USERS = [
  {
    email: 'sarah@test.com',
    password: 'test123',
    name: 'Sarah Chen',
    persona: 'learner',
    organization: {
      name: 'Personal Growth Academy',
      subdomain: 'sarah-growth',
      subscription_tier: 'STARTER',
      primary_color: '#10B981'
    }
  },
  {
    email: 'mike@test.com',
    password: 'test123',
    name: 'Mike Rodriguez',
    persona: 'trainer',
    organization: {
      name: 'TechCorp Training',
      subdomain: 'techcorp-train',
      subscription_tier: 'ENTERPRISE',
      primary_color: '#3B82F6'
    }
  },
  {
    email: 'emma@test.com',
    password: 'test123',
    name: 'Emma Watson',
    persona: 'developer',
    organization: {
      name: 'Creative Learning Hub',
      subdomain: 'creative-hub',
      subscription_tier: 'PROFESSIONAL',
      primary_color: '#8B5CF6'
    }
  },
  {
    email: 'james@test.com',
    password: 'test123',
    name: 'James Kim',
    persona: 'admin',
    organization: {
      name: 'Global Education Institute',
      subdomain: 'global-edu',
      subscription_tier: 'ENTERPRISE',
      primary_color: '#EF4444'
    }
  },
  {
    email: 'lisa@test.com',
    password: 'test123',
    name: 'Lisa Morgan',
    persona: 'manager',
    organization: {
      name: 'Innovation Team Co',
      subdomain: 'innovation-team',
      subscription_tier: 'PROFESSIONAL',
      primary_color: '#F59E0B'
    }
  }
];

const AREA_TEMPLATES = {
  learner: [
    { name: 'Technical Skills', icon: 'code', color: '#3B82F6', purpose: 'Master modern web development and cloud technologies', metric: 'Complete 4 courses and 2 projects per quarter' },
    { name: 'Career Growth', icon: 'briefcase', color: '#10B981', purpose: 'Advance to senior developer role', metric: 'Achieve promotion within 18 months' },
    { name: 'Health & Fitness', icon: 'heart', color: '#EF4444', purpose: 'Maintain optimal physical and mental health', metric: 'Exercise 4x per week, 7+ hours sleep' },
    { name: 'Personal Projects', icon: 'lightbulb', color: '#F59E0B', purpose: 'Build portfolio of meaningful side projects', metric: 'Ship 2 projects per year' },
    { name: 'Reading & Learning', icon: 'book', color: '#8B5CF6', purpose: 'Continuous learning through books and courses', metric: 'Read 24 books per year' },
    { name: 'Relationships', icon: 'users', color: '#EC4899', purpose: 'Nurture meaningful connections', metric: 'Weekly quality time with loved ones' },
    { name: 'Financial Health', icon: 'dollar-sign', color: '#059669', purpose: 'Build financial security and independence', metric: 'Save 20% of income monthly' },
    { name: 'Creative Expression', icon: 'palette', color: '#F97316', purpose: 'Explore creative outlets and hobbies', metric: 'Dedicate 5 hours per week to creativity' }
  ],
  trainer: [
    { name: 'Training Programs', icon: 'presentation', color: '#3B82F6', purpose: 'Deliver exceptional learning experiences', metric: '90%+ satisfaction across all courses' },
    { name: 'Content Development', icon: 'edit', color: '#10B981', purpose: 'Create cutting-edge training materials', metric: 'Launch 8 new courses per year' },
    { name: 'Team Leadership', icon: 'users', color: '#F59E0B', purpose: 'Build and mentor high-performing team', metric: 'Team satisfaction >4.5/5' },
    { name: 'Professional Growth', icon: 'trending-up', color: '#8B5CF6', purpose: 'Stay current with industry trends', metric: 'Attend 4 conferences, earn 2 certifications' },
    { name: 'Health & Wellness', icon: 'heart', color: '#EF4444', purpose: 'Maintain energy and focus', metric: 'Exercise 5x per week, manage stress' },
    { name: 'Innovation Projects', icon: 'lightbulb', color: '#EC4899', purpose: 'Pioneer new training methodologies', metric: 'Launch 2 experimental programs per year' },
    { name: 'Client Relations', icon: 'handshake', color: '#059669', purpose: 'Build lasting client partnerships', metric: '95% client retention rate' },
    { name: 'Personal Life', icon: 'home', color: '#6366F1', purpose: 'Balance work and personal fulfillment', metric: 'Weekly family time, monthly adventures' }
  ],
  developer: [
    { name: 'Course Creation', icon: 'video', color: '#8B5CF6', purpose: 'Build world-class learning content', metric: 'Publish 12 premium courses per year' },
    { name: 'Creative Projects', icon: 'palette', color: '#EC4899', purpose: 'Explore innovative content formats', metric: 'Experiment with 3 new formats quarterly' },
    { name: 'Content Marketing', icon: 'megaphone', color: '#F59E0B', purpose: 'Grow audience and reach', metric: '25% follower growth quarterly' },
    { name: 'Revenue Growth', icon: 'trending-up', color: '#10B981', purpose: 'Build sustainable creator business', metric: 'Achieve $10k MRR within 2 years' },
    { name: 'Skill Development', icon: 'graduation-cap', color: '#3B82F6', purpose: 'Master new tools and technologies', metric: 'Learn one new skill monthly' },
    { name: 'Community Building', icon: 'users', color: '#06B6D4', purpose: 'Foster engaged learner community', metric: 'Active community of 1000+ members' },
    { name: 'Health & Energy', icon: 'zap', color: '#EF4444', purpose: 'Sustain creative energy', metric: 'Daily movement, proper sleep, nutrition' },
    { name: 'Work-Life Balance', icon: 'scale', color: '#059669', purpose: 'Prevent burnout, enjoy life', metric: 'Work 30 hours/week, take monthly breaks' }
  ],
  admin: [
    { name: 'Strategic Planning', icon: 'target', color: '#3B82F6', purpose: 'Drive organizational vision and growth', metric: 'Achieve 40% YoY growth' },
    { name: 'Team Development', icon: 'users', color: '#10B981', purpose: 'Build exceptional leadership team', metric: 'Zero regretted attrition' },
    { name: 'Platform Innovation', icon: 'lightbulb', color: '#8B5CF6', purpose: 'Lead product evolution', metric: 'Launch 4 major features per quarter' },
    { name: 'Stakeholder Relations', icon: 'handshake', color: '#F59E0B', purpose: 'Align board and investors', metric: 'Quarterly positive board feedback' },
    { name: 'Operational Excellence', icon: 'settings', color: '#06B6D4', purpose: 'Optimize processes and systems', metric: '20% efficiency improvement annually' },
    { name: 'Industry Leadership', icon: 'award', color: '#EC4899', purpose: 'Establish thought leadership', metric: 'Speak at 6 conferences per year' },
    { name: 'Personal Wellness', icon: 'heart', color: '#EF4444', purpose: 'Model sustainable leadership', metric: 'Exercise daily, 8+ hours sleep' },
    { name: 'Learning & Growth', icon: 'book', color: '#059669', purpose: 'Continuous personal development', metric: 'Read 2 books monthly, exec coaching' }
  ],
  manager: [
    { name: 'Team Performance', icon: 'trending-up', color: '#10B981', purpose: 'Drive team results and engagement', metric: 'Meet 100% of team OKRs' },
    { name: 'People Development', icon: 'users', color: '#3B82F6', purpose: 'Grow team capabilities', metric: 'Each member achieves growth goal' },
    { name: 'Project Delivery', icon: 'check-circle', color: '#8B5CF6', purpose: 'Deliver projects on time, on budget', metric: '90%+ on-time, on-budget delivery' },
    { name: 'Cross-functional Collaboration', icon: 'link', color: '#F59E0B', purpose: 'Build strong partnerships', metric: 'Positive feedback from 3+ departments' },
    { name: 'Innovation Initiatives', icon: 'lightbulb', color: '#EC4899', purpose: 'Drive continuous improvement', metric: 'Implement 2 major improvements quarterly' },
    { name: 'Professional Skills', icon: 'graduation-cap', color: '#06B6D4', purpose: 'Advance management capabilities', metric: 'Complete leadership certification' },
    { name: 'Health & Fitness', icon: 'heart', color: '#EF4444', purpose: 'Maintain peak performance', metric: 'Exercise 4x weekly, manage stress' },
    { name: 'Family & Relationships', icon: 'home', color: '#059669', purpose: 'Prioritize important relationships', metric: 'Daily family time, weekly date nights' }
  ]
};

const LIFE_PLAN_TEMPLATES = {
  learner: {
    vision: 'To become a highly skilled software engineer who creates impactful products, while maintaining a healthy, balanced, and fulfilling life.',
    values: ['Growth', 'Excellence', 'Balance', 'Creativity', 'Health', 'Relationships'],
    roles: ['Software Engineer', 'Lifelong Learner', 'Partner', 'Friend', 'Health Advocate']
  },
  trainer: {
    vision: 'To transform how people learn technology by creating exceptional training experiences that empower thousands to achieve their career goals.',
    values: ['Impact', 'Excellence', 'Innovation', 'Empowerment', 'Leadership', 'Integrity'],
    roles: ['Training Director', 'Team Leader', 'Course Creator', 'Mentor', 'Parent', 'Health Enthusiast']
  },
  developer: {
    vision: 'To build a thriving creator business that helps people learn new skills while enjoying creative freedom and financial independence.',
    values: ['Creativity', 'Freedom', 'Impact', 'Authenticity', 'Growth', 'Community'],
    roles: ['Course Creator', 'Entrepreneur', 'Content Strategist', 'Community Builder', 'Creative', 'Partner']
  },
  admin: {
    vision: 'To lead our organization to become the #1 learning platform globally while fostering a culture of innovation, excellence, and wellbeing.',
    values: ['Vision', 'Leadership', 'Innovation', 'Excellence', 'People First', 'Sustainability'],
    roles: ['CEO', 'Strategic Leader', 'Culture Champion', 'Industry Voice', 'Parent', 'Community Member']
  },
  manager: {
    vision: 'To build and lead high-performing teams that consistently deliver exceptional results while growing professionally and maintaining work-life balance.',
    values: ['Results', 'People Development', 'Collaboration', 'Accountability', 'Balance', 'Continuous Improvement'],
    roles: ['Team Manager', 'Mentor', 'Project Leader', 'Collaborator', 'Parent', 'Partner']
  }
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function shouldInclude(probability: number): boolean {
  return Math.random() < probability;
}

async function createTestUser(userConfig: typeof TEST_USERS[0]) {
  console.log(`\n=== Creating user: ${userConfig.name} ===`);

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userConfig.email,
    password: userConfig.password,
    options: {
      data: { name: userConfig.name }
    }
  });

  if (authError) {
    console.error(`Error creating auth user: ${authError.message}`);
    return null;
  }

  if (!authData.user) {
    console.error('No user returned from signup');
    return null;
  }

  const userId = authData.user.id;
  console.log(`Auth user created: ${userId}`);

  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: userConfig.organization.name,
      subdomain: userConfig.organization.subdomain,
      subscription_tier: userConfig.organization.subscription_tier,
      primary_color: userConfig.organization.primary_color,
      feature_flags: {
        voiceCoaching: true,
        analytics: userConfig.organization.subscription_tier !== 'STARTER',
        customIntegrations: userConfig.organization.subscription_tier === 'ENTERPRISE'
      }
    })
    .select()
    .single();

  if (orgError) {
    console.error(`Error creating organization: ${orgError.message}`);
    return null;
  }

  const orgId = orgData.id;
  console.log(`Organization created: ${orgId}`);

  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: userConfig.email,
      name: userConfig.name,
      organization_id: orgId
    });

  if (userError) {
    console.error(`Error creating user record: ${userError.message}`);
  }

  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgId,
      user_id: userId,
      role: 'ADMIN',
      joined_at: TWO_YEARS_AGO.toISOString()
    });

  if (memberError) {
    console.error(`Error creating org member: ${memberError.message}`);
  }

  const lifePlanTemplate = LIFE_PLAN_TEMPLATES[userConfig.persona as keyof typeof LIFE_PLAN_TEMPLATES];
  const { error: lifePlanError } = await supabase
    .from('life_plans')
    .insert({
      user_id: userId,
      organization_id: orgId,
      vision: lifePlanTemplate.vision,
      values: lifePlanTemplate.values,
      roles: lifePlanTemplate.roles,
      created_at: TWO_YEARS_AGO.toISOString()
    });

  if (lifePlanError) {
    console.error(`Error creating life plan: ${lifePlanError.message}`);
  }

  return { userId, orgId, persona: userConfig.persona, name: userConfig.name };
}

async function generateAreasForUser(userId: string, orgId: string, persona: string) {
  console.log(`Generating areas for ${persona}...`);

  const areaTemplates = AREA_TEMPLATES[persona as keyof typeof AREA_TEMPLATES];
  const areas = areaTemplates.map((template, index) => ({
    user_id: userId,
    organization_id: orgId,
    name: template.name,
    icon: template.icon,
    color: template.color,
    purpose_statement: template.purpose,
    success_metric: template.metric,
    quarterly_focus: index < 3,
    sort_order: index,
    created_at: subMonths(TODAY, randomInt(18, 24)).toISOString()
  }));

  const { data, error } = await supabase
    .from('areas')
    .insert(areas)
    .select();

  if (error) {
    console.error(`Error creating areas: ${error.message}`);
    return [];
  }

  console.log(`Created ${data.length} areas`);
  return data;
}

async function generateOutcomesForUser(userId: string, orgId: string, areas: any[], persona: string) {
  console.log(`Generating outcomes for ${persona}...`);

  const outcomeCount = randomInt(40, 50);
  const outcomes = [];

  for (let i = 0; i < outcomeCount; i++) {
    const area = randomChoice(areas);
    const createdAt = randomDate(TWO_YEARS_AGO, subMonths(TODAY, 1));
    const isCompleted = shouldInclude(0.6);
    const targetDate = new Date(createdAt);
    targetDate.setMonth(targetDate.getMonth() + randomInt(1, 6));

    const outcomeTypes = [
      { title: `Master ${randomChoice(['React', 'TypeScript', 'Node.js', 'Python', 'AWS'])}`, purpose: 'Build expertise in key technology' },
      { title: `Complete ${randomChoice(['certification', 'course', 'bootcamp', 'program'])}`, purpose: 'Gain professional credentials' },
      { title: `Launch ${randomChoice(['side project', 'portfolio site', 'mobile app', 'SaaS product'])}`, purpose: 'Create tangible deliverable' },
      { title: `Improve ${randomChoice(['fitness level', 'sleep quality', 'nutrition', 'stress management'])}`, purpose: 'Enhance personal wellbeing' },
      { title: `Achieve ${randomChoice(['promotion', 'salary increase', 'new role', 'team leadership'])}`, purpose: 'Advance career progress' },
      { title: `Build ${randomChoice(['professional network', 'online presence', 'personal brand', 'community'])}`, purpose: 'Expand influence and connections' }
    ];

    const outcome = randomChoice(outcomeTypes);

    outcomes.push({
      user_id: userId,
      organization_id: orgId,
      area_id: area.id,
      title: outcome.title,
      purpose: outcome.purpose,
      power_statement: `By achieving this, I will ${randomChoice(['unlock new opportunities', 'build lasting skills', 'create meaningful impact', 'achieve personal growth'])}`,
      metric: `${randomChoice(['Complete', 'Achieve', 'Reach'])} by ${format(targetDate, 'MMM yyyy')}`,
      target_date: targetDate.toISOString().split('T')[0],
      status: isCompleted ? 'COMPLETED' : shouldInclude(0.1) ? 'ARCHIVED' : 'ACTIVE',
      created_at: createdAt.toISOString(),
      completed_at: isCompleted ? targetDate.toISOString() : null
    });
  }

  const { data, error } = await supabase
    .from('outcomes')
    .insert(outcomes)
    .select();

  if (error) {
    console.error(`Error creating outcomes: ${error.message}`);
    return [];
  }

  console.log(`Created ${data.length} outcomes`);
  return data;
}

async function generateActionsForUser(userId: string, outcomes: any[]) {
  console.log(`Generating actions...`);

  const actionCount = randomInt(300, 400);
  const actions = [];

  for (let i = 0; i < actionCount; i++) {
    const outcome = randomChoice(outcomes);
    const createdAt = randomDate(new Date(outcome.created_at), TODAY);
    const isDone = shouldInclude(0.7);
    const scheduledDate = randomDate(createdAt, addDays(TODAY, 30));

    const actionTitles = [
      'Review documentation and examples',
      'Complete tutorial section',
      'Practice coding exercises',
      'Build sample project',
      'Review and refactor code',
      'Write tests for feature',
      'Research best practices',
      'Meet with mentor',
      'Attend workshop or webinar',
      'Read relevant articles',
      'Update portfolio',
      'Network with professionals',
      'Exercise for 30 minutes',
      'Meal prep for the week',
      'Review goals and progress',
      'Plan next week',
      'Schedule important meetings',
      'Follow up on action items'
    ];

    actions.push({
      outcome_id: outcome.id,
      title: randomChoice(actionTitles),
      notes: shouldInclude(0.4) ? 'Additional context and notes about this action' : null,
      done: isDone,
      priority: randomChoice([1, 1, 2, 2, 2, 3, 3] as const),
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      scheduled_time: shouldInclude(0.6) ? `${randomInt(8, 18)}:${randomChoice(['00', '30'])}:00` : null,
      duration_minutes: randomChoice([15, 30, 45, 60, 90, 120]),
      created_at: createdAt.toISOString(),
      completed_at: isDone ? scheduledDate.toISOString() : null
    });
  }

  const batchSize = 100;
  for (let i = 0; i < actions.length; i += batchSize) {
    const batch = actions.slice(i, i + batchSize);
    const { error } = await supabase.from('actions').insert(batch);
    if (error) {
      console.error(`Error creating actions batch: ${error.message}`);
    }
  }

  console.log(`Created ${actions.length} actions`);
}

async function generateDailyNotesForUser(userId: string, orgId: string) {
  console.log(`Generating daily notes...`);

  const notes = [];
  let currentDate = new Date(TWO_YEARS_AGO);

  while (currentDate <= TODAY) {
    if (shouldInclude(0.65)) {
      const hasMorning = shouldInclude(0.8);
      const hasEvening = shouldInclude(0.7);
      const hasEnergy = shouldInclude(0.8);

      notes.push({
        user_id: userId,
        organization_id: orgId,
        date: format(currentDate, 'yyyy-MM-dd'),
        morning_intention: hasMorning ? randomChoice([
          'Focus on deep work and completing key tasks',
          'Start day with exercise and healthy breakfast',
          'Tackle most important project first',
          'Be present and mindful throughout the day',
          'Make progress on learning goals'
        ]) : null,
        evening_reflection: hasEvening ? randomChoice([
          'Productive day, completed main objectives',
          'Made good progress on key projects',
          'Learned something new today',
          'Could improve time management tomorrow',
          'Grateful for progress and opportunities'
        ]) : null,
        energy_level: hasEnergy ? randomInt(5, 9) : null,
        created_at: currentDate.toISOString()
      });
    }
    currentDate = addDays(currentDate, 1);
  }

  const batchSize = 100;
  for (let i = 0; i < notes.length; i += batchSize) {
    const batch = notes.slice(i, i + batchSize);
    const { error } = await supabase.from('daily_notes').insert(batch);
    if (error) {
      console.error(`Error creating daily notes batch: ${error.message}`);
    }
  }

  console.log(`Created ${notes.length} daily notes`);
}

async function generateWeeklyPlansForUser(userId: string, orgId: string, outcomes: any[]) {
  console.log(`Generating weekly plans...`);

  const plans = [];
  let currentDate = new Date(TWO_YEARS_AGO);

  while (currentDate <= TODAY) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

    if (shouldInclude(0.85)) {
      const focusOutcomes = [];
      for (let i = 0; i < randomInt(3, 5); i++) {
        const outcome = randomChoice(outcomes.filter(o => o.status === 'ACTIVE'));
        if (outcome) focusOutcomes.push(outcome.id);
      }

      plans.push({
        user_id: userId,
        organization_id: orgId,
        week_start_date: format(weekStart, 'yyyy-MM-dd'),
        focus_outcomes: focusOutcomes,
        reflection: shouldInclude(0.8) ? randomChoice([
          'Strong week, made good progress on key outcomes',
          'Completed most planned actions, feeling accomplished',
          'Need to improve time blocking next week',
          'Great momentum, staying consistent',
          'Balanced productivity with self-care well'
        ]) : null,
        created_at: weekStart.toISOString()
      });
    }

    currentDate = addDays(currentDate, 7);
  }

  const { error } = await supabase.from('weekly_plans').insert(plans);
  if (error) {
    console.error(`Error creating weekly plans: ${error.message}`);
  }

  console.log(`Created ${plans.length} weekly plans`);
}

async function generateReviewSessionsForUser(userId: string, orgId: string) {
  console.log(`Generating review sessions...`);

  const sessions = [];
  let currentDate = new Date(TWO_YEARS_AGO);

  while (currentDate <= TODAY) {
    if (shouldInclude(0.5)) {
      sessions.push({
        user_id: userId,
        organization_id: orgId,
        ritual_type: 'MORNING',
        date: format(currentDate, 'yyyy-MM-dd'),
        responses: {
          gratitude: 'Grateful for health, opportunities, and loved ones',
          priorities: 'Focus on key project deliverables today',
          intention: 'Be present and productive'
        },
        insights: 'Starting day with clarity and purpose',
        created_at: currentDate.toISOString()
      });
    }

    if (shouldInclude(0.4)) {
      sessions.push({
        user_id: userId,
        organization_id: orgId,
        ritual_type: 'EVENING',
        date: format(currentDate, 'yyyy-MM-dd'),
        responses: {
          wins: 'Completed major tasks, made progress',
          lessons: 'Time blocking helps maintain focus',
          improvements: 'Start earlier tomorrow'
        },
        insights: 'Good day overall, consistent progress',
        created_at: currentDate.toISOString()
      });
    }

    currentDate = addDays(currentDate, 1);
  }

  let weekDate = new Date(TWO_YEARS_AGO);
  while (weekDate <= TODAY) {
    if (shouldInclude(0.9)) {
      sessions.push({
        user_id: userId,
        organization_id: orgId,
        ritual_type: 'WEEKLY',
        date: format(startOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        responses: {
          accomplishments: 'Completed 5 key outcomes this week',
          challenges: 'Time management in afternoons',
          nextWeek: 'Focus on deep work blocks'
        },
        insights: 'Strong week with consistent progress',
        created_at: weekDate.toISOString()
      });
    }
    weekDate = addDays(weekDate, 7);
  }

  const batchSize = 100;
  for (let i = 0; i < sessions.length; i += batchSize) {
    const batch = sessions.slice(i, i + batchSize);
    const { error } = await supabase.from('review_sessions').insert(batch);
    if (error) {
      console.error(`Error creating review sessions batch: ${error.message}`);
    }
  }

  console.log(`Created ${sessions.length} review sessions`);
}

async function generateInboxItemsForUser(userId: string, orgId: string, outcomes: any[]) {
  console.log(`Generating inbox items...`);

  const items = [];
  const itemCount = randomInt(150, 250);

  for (let i = 0; i < itemCount; i++) {
    const createdAt = randomDate(TWO_YEARS_AGO, TODAY);
    const isTriaged = shouldInclude(0.6);

    const contents = [
      'Research new framework for project',
      'Follow up on networking conversation',
      'Explore course options for skill development',
      'Ideas for side project features',
      'Book recommendations to read',
      'Conference to attend next quarter',
      'Blog post ideas',
      'Meeting notes and action items',
      'Interesting article to review',
      'Tool or app to evaluate'
    ];

    items.push({
      user_id: userId,
      organization_id: orgId,
      content: randomChoice(contents),
      item_type: randomChoice(['NOTE', 'NOTE', 'ACTION_IDEA', 'OUTCOME_IDEA']),
      triaged: isTriaged,
      triaged_to_id: isTriaged && shouldInclude(0.7) ? randomChoice(outcomes).id : null,
      created_at: createdAt.toISOString()
    });
  }

  const { error } = await supabase.from('inbox_items').insert(items);
  if (error) {
    console.error(`Error creating inbox items: ${error.message}`);
  }

  console.log(`Created ${items.length} inbox items`);
}

async function generateVoiceSessionsForUser(userId: string, orgId: string) {
  console.log(`Generating voice sessions...`);

  const sessions = [];
  const sessionCount = randomInt(20, 40);

  for (let i = 0; i < sessionCount; i++) {
    const createdAt = randomDate(TWO_YEARS_AGO, TODAY);

    sessions.push({
      user_id: userId,
      organization_id: orgId,
      session_type: randomChoice(['PLANNING', 'COACHING', 'REFLECTION']),
      transcript: 'Voice session transcript would be stored here...',
      ai_insights: {
        summary: 'Discussed weekly priorities and challenges',
        actionItems: ['Review project timeline', 'Schedule team meeting'],
        sentiment: 'positive'
      },
      duration_seconds: randomInt(180, 900),
      created_at: createdAt.toISOString()
    });
  }

  const { error } = await supabase.from('voice_sessions').insert(sessions);
  if (error) {
    console.error(`Error creating voice sessions: ${error.message}`);
  }

  console.log(`Created ${sessions.length} voice sessions`);
}

async function seedDatabase() {
  console.log('Starting database seed with 2 years of test data...\n');

  for (const userConfig of TEST_USERS) {
    const user = await createTestUser(userConfig);

    if (user) {
      const areas = await generateAreasForUser(user.userId, user.orgId, user.persona);
      const outcomes = await generateOutcomesForUser(user.userId, user.orgId, areas, user.persona);

      await generateActionsForUser(user.userId, outcomes);
      await generateDailyNotesForUser(user.userId, user.orgId);
      await generateWeeklyPlansForUser(user.userId, user.orgId, outcomes);
      await generateReviewSessionsForUser(user.userId, user.orgId);
      await generateInboxItemsForUser(user.userId, user.orgId, outcomes);
      await generateVoiceSessionsForUser(user.userId, user.orgId);

      console.log(`✓ Completed data generation for ${user.name}\n`);
    }
  }

  console.log('\n=== Database Seeding Complete ===\n');
  console.log('Test User Credentials:');
  console.log('----------------------');
  TEST_USERS.forEach(user => {
    console.log(`${user.name} (${user.persona}): ${user.email} / ${user.password}`);
  });
}

seedDatabase().catch(console.error);
