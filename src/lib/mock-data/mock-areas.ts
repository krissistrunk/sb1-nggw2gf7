/**
 * Mock Life Areas (Categories of Improvement)
 * Based on Tony Robbins' RPM methodology
 */

export interface MockArea {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  icon: string;
  color: string;
  background_url: string | null;
  identity_statement: string;
  description: string;
  sort_order: number;
  created_at: string;
}

// Areas for Sarah (user-sarah-001, org-001)
export const SARAH_AREAS: MockArea[] = [
  {
    id: 'area-sarah-001',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    name: 'Physical Body',
    icon: '💪',
    color: '#EF4444',
    background_url: null,
    identity_statement: 'I am strong, healthy, and energized',
    description: 'Physical health, fitness, nutrition, and energy',
    sort_order: 1,
    created_at: '2023-01-16T08:00:00Z',
  },
  {
    id: 'area-sarah-002',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    name: 'Emotions & Meaning',
    icon: '❤️',
    color: '#F59E0B',
    background_url: null,
    identity_statement: 'I am joyful, fulfilled, and purposeful',
    description: 'Emotional well-being, purpose, and life satisfaction',
    sort_order: 2,
    created_at: '2023-01-16T08:05:00Z',
  },
  {
    id: 'area-sarah-003',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    name: 'Relationships',
    icon: '👥',
    color: '#8B5CF6',
    background_url: null,
    identity_statement: 'I nurture deep, loving, meaningful connections',
    description: 'Family, friends, romantic relationships, social connections',
    sort_order: 3,
    created_at: '2023-01-16T08:10:00Z',
  },
  {
    id: 'area-sarah-004',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    name: 'Career & Mission',
    icon: '🚀',
    color: '#3B82F6',
    background_url: null,
    identity_statement: 'I create massive value and impact through my work',
    description: 'Professional growth, career advancement, life mission',
    sort_order: 4,
    created_at: '2023-01-16T08:15:00Z',
  },
  {
    id: 'area-sarah-005',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    name: 'Finances',
    icon: '💰',
    color: '#10B981',
    background_url: null,
    identity_statement: 'I am financially abundant and secure',
    description: 'Income, savings, investments, financial security',
    sort_order: 5,
    created_at: '2023-01-16T08:20:00Z',
  },
  {
    id: 'area-sarah-006',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    name: 'Time',
    icon: '⏰',
    color: '#6366F1',
    background_url: null,
    identity_statement: 'I am the master of my time and priorities',
    description: 'Time management, productivity, work-life balance',
    sort_order: 6,
    created_at: '2023-01-16T08:25:00Z',
  },
  {
    id: 'area-sarah-007',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    name: 'Fun & Adventure',
    icon: '🎉',
    color: '#EC4899',
    background_url: null,
    identity_statement: 'I live with joy, play, and adventure',
    description: 'Recreation, hobbies, travel, enjoyment',
    sort_order: 7,
    created_at: '2023-01-16T08:30:00Z',
  },
  {
    id: 'area-sarah-008',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    name: 'Contribution',
    icon: '🌟',
    color: '#14B8A6',
    background_url: null,
    identity_statement: 'I give back and make a difference in the world',
    description: 'Giving, service, impact, legacy',
    sort_order: 8,
    created_at: '2023-01-16T08:35:00Z',
  },
];

export const MOCK_AREAS_BY_USER: Record<string, MockArea[]> = {
  'user-sarah-001': SARAH_AREAS,
  // Other users would have similar areas with their own IDs
  // For simplicity, we'll return Sarah's areas for all users in mock mode
};

export function getMockAreasByUserId(userId: string): MockArea[] {
  // In real implementation, each user would have their own areas
  // For demo, return Sarah's areas with updated user_id
  return SARAH_AREAS.map(area => ({
    ...area,
    id: `area-${userId}-${area.sort_order}`,
    user_id: userId,
  }));
}

export function getMockAreaById(areaId: string): MockArea | undefined {
  return SARAH_AREAS.find(area => area.id === areaId);
}
