import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { subDays, subMonths, format, startOfWeek, addDays } from 'date-fns';
import { OUTCOME_STATUS } from '../constants/status';

const TWO_YEARS_AGO = subDays(new Date(), 730);
const TODAY = new Date();

interface TestUser {
  email: string;
  password: string;
  name: string;
  persona: string;
  organization: {
    name: string;
    subdomain: string;
    subscription_tier: string;
    primary_color: string;
  };
}

const TEST_USERS: TestUser[] = [
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

export function SeedUsersPage() {
  const [progress, setProgress] = useState<string[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [completed, setCompleted] = useState(false);

  const addProgress = (message: string) => {
    setProgress(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const randomChoice = <T,>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const randomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };

  const shouldInclude = (probability: number) => {
    return Math.random() < probability;
  };

  const createTestUser = async (userConfig: TestUser) => {
    addProgress(`Creating user: ${userConfig.name}`);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userConfig.email,
      password: userConfig.password,
      options: {
        data: { name: userConfig.name }
      }
    });

    if (authError) {
      addProgress(`❌ Error creating ${userConfig.name}: ${authError.message}`);
      return null;
    }

    if (!authData.user) {
      addProgress(`❌ No user returned for ${userConfig.name}`);
      return null;
    }

    const userId = authData.user.id;

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: userConfig.organization.name,
        subdomain: userConfig.organization.subdomain,
        subscription_tier: userConfig.organization.subscription_tier,
        primary_color: userConfig.organization.primary_color
      })
      .select()
      .maybeSingle();

    if (orgError || !orgData) {
      addProgress(`❌ Error creating organization: ${orgError?.message}`);
      return null;
    }

    const orgId = orgData.id;

    await supabase.from('users').insert({
      id: userId,
      email: userConfig.email,
      name: userConfig.name,
      organization_id: orgId
    });

    await supabase.from('organization_members').insert({
      organization_id: orgId,
      user_id: userId,
      role: 'ADMIN',
      joined_at: TWO_YEARS_AGO.toISOString()
    });

    await supabase.from('life_plans').insert({
      user_id: userId,
      organization_id: orgId,
      vision: 'Sample vision statement for personal and professional growth',
      values: ['Growth', 'Excellence', 'Balance', 'Creativity'],
      roles: ['Professional', 'Learner', 'Partner', 'Friend'],
      created_at: TWO_YEARS_AGO.toISOString()
    });

    addProgress(`✓ Created ${userConfig.name} with organization`);
    return { userId, orgId, persona: userConfig.persona };
  };

  const generateDataForUser = async (userId: string, orgId: string, name: string) => {
    addProgress(`Generating data for ${name}...`);

    const areas = await generateAreas(userId, orgId);
    const outcomes = await generateOutcomes(userId, orgId, areas);
    await generateActions(outcomes);
    await generateDailyNotes(userId, orgId);
    await generateInboxItems(userId, orgId);

    addProgress(`✓ Completed all data for ${name}`);
  };

  const generateAreas = async (userId: string, orgId: string) => {
    const areas = [
      { name: 'Career & Work', icon: 'briefcase', color: '#3B82F6' },
      { name: 'Health & Fitness', icon: 'heart', color: '#EF4444' },
      { name: 'Learning & Growth', icon: 'book', color: '#10B981' },
      { name: 'Relationships', icon: 'users', color: '#EC4899' },
      { name: 'Financial', icon: 'dollar-sign', color: '#F59E0B' },
      { name: 'Creative Projects', icon: 'palette', color: '#8B5CF6' },
      { name: 'Personal Development', icon: 'target', color: '#06B6D4' },
      { name: 'Community', icon: 'globe', color: '#84CC16' }
    ].map((area, index) => ({
      user_id: userId,
      organization_id: orgId,
      ...area,
      purpose_statement: `Purpose for ${area.name}`,
      success_metric: `Success metric for ${area.name}`,
      quarterly_focus: index < 3,
      sort_order: index,
      created_at: subMonths(TODAY, randomInt(18, 24)).toISOString()
    }));

    const { data } = await supabase.from('areas').insert(areas).select();
    return data || [];
  };

  const generateOutcomes = async (userId: string, orgId: string, areas: any[]) => {
    const outcomes = [];
    const outcomeCount = 45;

    for (let i = 0; i < outcomeCount; i++) {
      const area = randomChoice(areas);
      const createdAt = randomDate(TWO_YEARS_AGO, subMonths(TODAY, 1));
      const isCompleted = shouldInclude(0.6);
      const targetDate = new Date(createdAt);
      targetDate.setMonth(targetDate.getMonth() + randomInt(1, 6));

      outcomes.push({
        user_id: userId,
        organization_id: orgId,
        area_id: area.id,
        title: `Outcome ${i + 1} for ${area.name}`,
        purpose: 'Sample purpose for this outcome',
        power_statement: 'Sample power statement',
        metric: `Complete by ${format(targetDate, 'MMM yyyy')}`,
        target_date: targetDate.toISOString().split('T')[0],
        status: isCompleted
          ? OUTCOME_STATUS.COMPLETED
          : shouldInclude(0.1)
            ? OUTCOME_STATUS.ARCHIVED
            : OUTCOME_STATUS.ACTIVE,
        created_at: createdAt.toISOString(),
        completed_at: isCompleted ? targetDate.toISOString() : null
      });
    }

    const { data } = await supabase.from('outcomes').insert(outcomes).select();
    return data || [];
  };

  const generateActions = async (outcomes: any[]) => {
    const actions = [];
    const actionCount = 350;

    for (let i = 0; i < actionCount; i++) {
      const outcome = randomChoice(outcomes);
      const createdAt = randomDate(new Date(outcome.created_at), TODAY);
      const isDone = shouldInclude(0.7);
      const scheduledDate = randomDate(createdAt, addDays(TODAY, 30));

      actions.push({
        outcome_id: outcome.id,
        title: `Action ${i + 1} for outcome`,
        notes: shouldInclude(0.4) ? 'Sample notes' : null,
        done: isDone,
        priority: randomChoice([1, 2, 2, 2, 3, 3]),
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        scheduled_time: shouldInclude(0.6) ? `${randomInt(8, 18)}:00:00` : null,
        duration_minutes: randomChoice([15, 30, 45, 60, 90]),
        created_at: createdAt.toISOString(),
        completed_at: isDone ? scheduledDate.toISOString() : null
      });
    }

    const batchSize = 100;
    for (let i = 0; i < actions.length; i += batchSize) {
      const batch = actions.slice(i, i + batchSize);
      await supabase.from('actions').insert(batch);
    }
  };

  const generateDailyNotes = async (userId: string, orgId: string) => {
    const notes = [];
    let currentDate = new Date(TWO_YEARS_AGO);

    while (currentDate <= TODAY) {
      if (shouldInclude(0.65)) {
        notes.push({
          user_id: userId,
          organization_id: orgId,
          date: format(currentDate, 'yyyy-MM-dd'),
          morning_intention: shouldInclude(0.8) ? 'Morning intention note' : null,
          evening_reflection: shouldInclude(0.7) ? 'Evening reflection note' : null,
          energy_level: shouldInclude(0.8) ? randomInt(5, 9) : null,
          created_at: currentDate.toISOString()
        });
      }
      currentDate = addDays(currentDate, 1);
    }

    const batchSize = 100;
    for (let i = 0; i < notes.length; i += batchSize) {
      const batch = notes.slice(i, i + batchSize);
      await supabase.from('daily_notes').insert(batch);
    }
  };

  const generateInboxItems = async (userId: string, orgId: string) => {
    const items = [];
    const itemCount = 200;

    for (let i = 0; i < itemCount; i++) {
      const createdAt = randomDate(TWO_YEARS_AGO, TODAY);
      items.push({
        user_id: userId,
        organization_id: orgId,
        content: `Inbox item ${i + 1}`,
        item_type: randomChoice(['NOTE', 'NOTE', 'ACTION_IDEA', 'OUTCOME_IDEA']),
        triaged: shouldInclude(0.6),
        created_at: createdAt.toISOString()
      });
    }

    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await supabase.from('inbox_items').insert(batch);
    }
  };

  const handleSeedUsers = async () => {
    setIsSeeding(true);
    setProgress([]);
    setCompleted(false);

    addProgress('🚀 Starting database seed...');

    for (const userConfig of TEST_USERS) {
      const user = await createTestUser(userConfig);
      if (user) {
        await generateDataForUser(user.userId, user.orgId, userConfig.name);
      }
    }

    addProgress('✅ Database seeding complete!');
    setCompleted(true);
    setIsSeeding(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Users Seed Tool</h1>
          <p className="text-gray-600 mb-6">
            Click the button below to automatically create 5 test users with 2 years of comprehensive data each.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">Test Users</h2>
            <ul className="space-y-1 text-sm text-blue-800">
              {TEST_USERS.map(user => (
                <li key={user.email}>
                  <strong>{user.name}</strong> ({user.persona}) - {user.email} / test123
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleSeedUsers}
            disabled={isSeeding || completed}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isSeeding ? '⏳ Generating Users...' : completed ? '✅ Completed!' : '🚀 Generate Test Users'}
          </button>
        </div>

        {progress.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Progress Log</h2>
            <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                {progress.join('\n')}
              </pre>
            </div>
          </div>
        )}

        {completed && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
            <h2 className="font-semibold text-green-900 mb-2">✅ Success!</h2>
            <p className="text-green-800 mb-4">
              All test users have been created. You can now log in with any of the credentials above.
            </p>
            <a
              href="/login"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
