import { subDays, subMonths, format, startOfWeek, addDays } from 'date-fns';

const TWO_YEARS_AGO = subDays(new Date(), 730);
const TODAY = new Date();

const TEST_USERS = [
  {
    email: 'sarah@test.com',
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

console.log('=== Test User Credentials ===\n');
console.log('To create these users, please:');
console.log('1. Go to your signup page at /signup');
console.log('2. Create each user manually with these credentials:\n');

TEST_USERS.forEach((user, i) => {
  console.log(`${i + 1}. ${user.name} (${user.persona})`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: test123`);
  console.log(`   Organization: ${user.organization.name}\n`);
});

console.log('\nNote: Once users are created, you can log in with:');
console.log('- Email: [user email from above]');
console.log('- Password: test123');
