/**
 * Mock Users Data
 * These match the test users from the seed scripts
 */

export interface MockUser {
  id: string;
  email: string;
  name: string;
  organization_id: string;
  created_at: string;
  last_accessed_at: string | null;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'user-sarah-001',
    email: 'sarah@test.com',
    name: 'Sarah Chen',
    organization_id: 'org-001',
    created_at: '2023-01-15T08:00:00Z',
    last_accessed_at: new Date().toISOString(),
  },
  {
    id: 'user-mike-002',
    email: 'mike@test.com',
    name: 'Mike Rodriguez',
    organization_id: 'org-002',
    created_at: '2023-02-10T09:30:00Z',
    last_accessed_at: new Date().toISOString(),
  },
  {
    id: 'user-emma-003',
    email: 'emma@test.com',
    name: 'Emma Watson',
    organization_id: 'org-003',
    created_at: '2023-03-05T10:15:00Z',
    last_accessed_at: new Date().toISOString(),
  },
  {
    id: 'user-james-004',
    email: 'james@test.com',
    name: 'James Kim',
    organization_id: 'org-004',
    created_at: '2023-04-20T11:00:00Z',
    last_accessed_at: new Date().toISOString(),
  },
  {
    id: 'user-lisa-005',
    email: 'lisa@test.com',
    name: 'Lisa Morgan',
    organization_id: 'org-005',
    created_at: '2023-05-12T14:30:00Z',
    last_accessed_at: new Date().toISOString(),
  },
];

// Default user for demo mode (Sarah)
export const DEFAULT_MOCK_USER = MOCK_USERS[0];

export function getMockUserByEmail(email: string): MockUser | undefined {
  return MOCK_USERS.find(user => user.email.toLowerCase() === email.toLowerCase());
}

export function getMockUserById(id: string): MockUser | undefined {
  return MOCK_USERS.find(user => user.id === id);
}
