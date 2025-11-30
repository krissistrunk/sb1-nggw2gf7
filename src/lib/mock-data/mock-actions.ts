/**
 * Mock Actions Data (Massive Action Plans)
 */

export interface MockAction {
  id: string;
  user_id: string;
  organization_id: string;
  outcome_id: string;
  title: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  is_must: boolean;
  duration_minutes: number;
  done: boolean;
  scheduled_date: string | null;
  scheduled_time: string | null;
  delegated_to: string | null;
  delegated_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

// Actions for Outcome 001: Lose 15 pounds
const WEIGHT_LOSS_ACTIONS: MockAction[] = [
  {
    id: 'action-001',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-001',
    title: 'Meal prep healthy lunches for the week',
    priority: 'HIGH',
    is_must: true,
    duration_minutes: 120,
    done: false,
    scheduled_date: today,
    scheduled_time: '10:00',
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 1,
    created_at: '2024-01-05T09:05:00Z',
  },
  {
    id: 'action-002',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-001',
    title: '45-minute workout at gym',
    priority: 'HIGH',
    is_must: true,
    duration_minutes: 45,
    done: false,
    scheduled_date: today,
    scheduled_time: '06:00',
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 2,
    created_at: '2024-01-05T09:10:00Z',
  },
  {
    id: 'action-003',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-001',
    title: 'Track calories in MyFitnessPal app',
    priority: 'HIGH',
    is_must: false,
    duration_minutes: 10,
    done: false,
    scheduled_date: today,
    scheduled_time: null,
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 3,
    created_at: '2024-01-05T09:15:00Z',
  },
  {
    id: 'action-004',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-001',
    title: 'Drink 8 glasses of water',
    priority: 'MEDIUM',
    is_must: false,
    duration_minutes: 5,
    done: false,
    scheduled_date: today,
    scheduled_time: null,
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 4,
    created_at: '2024-01-05T09:20:00Z',
  },
];

// Actions for Outcome 003: Launch online course
const COURSE_LAUNCH_ACTIONS: MockAction[] = [
  {
    id: 'action-011',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-003',
    title: 'Record module 3 video lessons (4 videos)',
    priority: 'HIGH',
    is_must: true,
    duration_minutes: 180,
    done: false,
    scheduled_date: today,
    scheduled_time: '14:00',
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 1,
    created_at: '2024-01-08T11:05:00Z',
  },
  {
    id: 'action-012',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-003',
    title: 'Design course landing page in Figma',
    priority: 'HIGH',
    is_must: false,
    duration_minutes: 120,
    done: false,
    scheduled_date: tomorrow,
    scheduled_time: null,
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 2,
    created_at: '2024-01-08T11:10:00Z',
  },
  {
    id: 'action-013',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-003',
    title: 'Write email sequence for launch (5 emails)',
    priority: 'MEDIUM',
    is_must: false,
    duration_minutes: 90,
    done: false,
    scheduled_date: null,
    scheduled_time: null,
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 3,
    created_at: '2024-01-08T11:15:00Z',
  },
  {
    id: 'action-014',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-003',
    title: 'Hire video editor on Upwork',
    priority: 'HIGH',
    is_must: false,
    duration_minutes: 60,
    done: false,
    scheduled_date: null,
    scheduled_time: null,
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 4,
    created_at: '2024-01-08T11:20:00Z',
  },
];

// Actions for Outcome 005: Date nights
const DATE_NIGHT_ACTIONS: MockAction[] = [
  {
    id: 'action-021',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-005',
    title: 'Make reservation at Italian restaurant for Friday',
    priority: 'HIGH',
    is_must: true,
    duration_minutes: 15,
    done: false,
    scheduled_date: today,
    scheduled_time: '12:00',
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 1,
    created_at: '2024-01-15T16:05:00Z',
  },
  {
    id: 'action-022',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-005',
    title: 'Arrange babysitter for Friday evening',
    priority: 'HIGH',
    is_must: true,
    duration_minutes: 20,
    done: false,
    scheduled_date: today,
    scheduled_time: '13:00',
    delegated_to: 'Partner',
    delegated_date: today,
    completed_at: null,
    sort_order: 2,
    created_at: '2024-01-15T16:10:00Z',
  },
];

// Actions for Outcome 007: Meditation
const MEDITATION_ACTIONS: MockAction[] = [
  {
    id: 'action-031',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-007',
    title: 'Morning meditation - 10 minutes',
    priority: 'HIGH',
    is_must: true,
    duration_minutes: 10,
    done: false,
    scheduled_date: today,
    scheduled_time: '07:00',
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 1,
    created_at: '2024-01-25T07:05:00Z',
  },
  {
    id: 'action-032',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-007',
    title: 'Download Headspace app',
    priority: 'MEDIUM',
    is_must: false,
    duration_minutes: 5,
    done: false,
    scheduled_date: null,
    scheduled_time: null,
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 2,
    created_at: '2024-01-25T07:10:00Z',
  },
];

// Actions for Outcome 008: Daily planning
const PLANNING_ACTIONS: MockAction[] = [
  {
    id: 'action-041',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-008',
    title: 'Complete 10-minute daily planning ritual',
    priority: 'HIGH',
    is_must: true,
    duration_minutes: 10,
    done: false,
    scheduled_date: today,
    scheduled_time: '08:00',
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 1,
    created_at: '2024-02-01T08:05:00Z',
  },
  {
    id: 'action-042',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    outcome_id: 'outcome-008',
    title: 'Evening review - reflect on progress',
    priority: 'HIGH',
    is_must: false,
    duration_minutes: 5,
    done: false,
    scheduled_date: today,
    scheduled_time: '21:00',
    delegated_to: null,
    delegated_date: null,
    completed_at: null,
    sort_order: 2,
    created_at: '2024-02-01T08:10:00Z',
  },
];

export const SARAH_ACTIONS: MockAction[] = [
  ...WEIGHT_LOSS_ACTIONS,
  ...COURSE_LAUNCH_ACTIONS,
  ...DATE_NIGHT_ACTIONS,
  ...MEDITATION_ACTIONS,
  ...PLANNING_ACTIONS,
];

export function getMockActionsByUserId(userId: string): MockAction[] {
  return SARAH_ACTIONS.map(action => ({
    ...action,
    id: `action-${userId}-${action.id.split('-')[1]}`,
    user_id: userId,
  }));
}

export function getMockActionsByOutcomeId(outcomeId: string): MockAction[] {
  return SARAH_ACTIONS.filter(action => action.outcome_id === outcomeId);
}

export function getMockActionsByDate(userId: string, date: string): MockAction[] {
  return getMockActionsByUserId(userId).filter(action => action.scheduled_date === date);
}

export function getMockActionById(actionId: string): MockAction | undefined {
  return SARAH_ACTIONS.find(action => action.id === actionId);
}

export function getMockTodayActions(userId: string): MockAction[] {
  return getMockActionsByDate(userId, today);
}

export function getMockMustActions(userId: string): MockAction[] {
  return getMockActionsByUserId(userId).filter(action => action.is_must && !action.done);
}
