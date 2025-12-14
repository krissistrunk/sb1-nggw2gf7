/**
 * Mock Outcomes Data
 * With strong RPM-aligned purpose statements
 */

import { OUTCOME_STATUS, type OutcomeStatus } from '../../constants/status';

export interface MockOutcome {
  id: string;
  user_id: string;
  organization_id: string;
  area_id: string;
  title: string;
  purpose: string;
  description: string;
  status: OutcomeStatus;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

// Sample outcomes for Sarah demonstrating strong RPM purposes
export const SARAH_OUTCOMES: MockOutcome[] = [
  // Physical Body outcomes
  {
    id: 'outcome-001',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    area_id: 'area-sarah-001',
    title: 'Lose 15 pounds by March 31st',
    purpose: 'To feel confident and energized in my body. To prove to myself I have the discipline to achieve anything. To be a role model for my kids showing them what commitment looks like. To avoid the regret of another year passing without taking care of my health. When I achieve this, I will feel proud, powerful, and alive.',
    description: 'Sustainable weight loss through nutrition and exercise',
    status: OUTCOME_STATUS.ACTIVE,
    is_draft: false,
    created_at: '2024-01-05T09:00:00Z',
    updated_at: '2024-01-05T09:00:00Z',
  },
  {
    id: 'outcome-002',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    area_id: 'area-sarah-001',
    title: 'Run a 5K in under 30 minutes',
    purpose: 'To feel strong and capable. To overcome my limiting belief that I\'m "not a runner". To experience the rush of accomplishment when I cross that finish line. To inspire my daughter to push past her own limits. Not achieving this would mean staying in my comfort zone and missing the growth that comes from challenge.',
    description: 'Build endurance and speed for 5K race',
    status: OUTCOME_STATUS.ACTIVE,
    is_draft: false,
    created_at: '2024-01-10T10:30:00Z',
    updated_at: '2024-01-10T10:30:00Z',
  },

  // Career & Mission outcomes
  {
    id: 'outcome-003',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    area_id: 'area-sarah-004',
    title: 'Launch online course and generate $10K revenue',
    purpose: 'To create financial freedom and security for my family. To impact thousands of people with my knowledge. To prove I can build a business doing what I love. To feel the exhilaration of entrepreneurial success. This will give me confidence, autonomy, and the ability to design my ideal lifestyle. Not doing this means staying stuck in a job that doesn\'t fulfill me.',
    description: 'Create and launch comprehensive online course',
    status: OUTCOME_STATUS.ACTIVE,
    is_draft: false,
    created_at: '2024-01-08T11:00:00Z',
    updated_at: '2024-01-08T11:00:00Z',
  },
  {
    id: 'outcome-004',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    area_id: 'area-sarah-004',
    title: 'Secure promotion to Senior Manager',
    purpose: 'To feel recognized and valued for my contributions. To increase my income by 30% providing more security for my family. To gain the influence and platform to implement my ideas at scale. To prove to myself I deserve this level of success. This will give me pride, financial stability, and career momentum. Not achieving this would mean staying undervalued and limiting my impact.',
    description: 'Meet all promotion requirements and demonstrate leadership',
    status: OUTCOME_STATUS.ACTIVE,
    is_draft: false,
    created_at: '2024-01-12T14:00:00Z',
    updated_at: '2024-01-12T14:00:00Z',
  },

  // Relationships outcomes
  {
    id: 'outcome-005',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    area_id: 'area-sarah-003',
    title: 'Have 2 quality date nights per month with partner',
    purpose: 'To strengthen our connection and keep our relationship vibrant. To feel loved, appreciated, and deeply connected. To model a loving relationship for our children. To invest in the most important relationship in my life before it\'s too late. This will give me joy, security, and fulfillment. Not doing this risks drifting apart and losing the magic we have.',
    description: 'Schedule regular quality time together',
    status: OUTCOME_STATUS.ACTIVE,
    is_draft: false,
    created_at: '2024-01-15T16:00:00Z',
    updated_at: '2024-01-15T16:00:00Z',
  },

  // Finances outcomes
  {
    id: 'outcome-006',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    area_id: 'area-sarah-005',
    title: 'Save $15,000 for emergency fund',
    purpose: 'To feel secure and sleep peacefully at night. To eliminate the anxiety about unexpected expenses. To give my family financial safety and stability. To prove I can be disciplined with money. This will give me peace of mind, confidence, and freedom from financial stress. Not having this safety net means living with constant worry and vulnerability.',
    description: 'Build 6-month emergency fund',
    status: OUTCOME_STATUS.ACTIVE,
    is_draft: false,
    created_at: '2024-01-20T09:30:00Z',
    updated_at: '2024-01-20T09:30:00Z',
  },

  // Emotions & Meaning outcomes
  {
    id: 'outcome-007',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    area_id: 'area-sarah-002',
    title: 'Meditate for 10 minutes daily for 90 consecutive days',
    purpose: 'To find inner peace and clarity. To manage stress effectively instead of being controlled by it. To be more present with my family. To prove I can build a transformative habit. This will give me calmness, focus, and emotional resilience. Not doing this means continuing to feel overwhelmed and reactive.',
    description: 'Establish daily meditation practice',
    status: OUTCOME_STATUS.ACTIVE,
    is_draft: false,
    created_at: '2024-01-25T07:00:00Z',
    updated_at: '2024-01-25T07:00:00Z',
  },

  // Time outcomes
  {
    id: 'outcome-008',
    user_id: 'user-sarah-001',
    organization_id: 'org-001',
    area_id: 'area-sarah-006',
    title: 'Complete daily planning ritual for 30 days',
    purpose: 'To take control of my life instead of being reactive. To feel organized and intentional. To stop wasting time on things that don\'t matter. To experience the power of living with purpose. This will give me focus, productivity, and fulfillment. Not doing this means continuing to feel scattered and unfulfilled.',
    description: 'Use RPM planning method consistently',
    status: OUTCOME_STATUS.ACTIVE,
    is_draft: false,
    created_at: '2024-02-01T08:00:00Z',
    updated_at: '2024-02-01T08:00:00Z',
  },
];

export function getMockOutcomesByUserId(userId: string): MockOutcome[] {
  return SARAH_OUTCOMES.map(outcome => ({
    ...outcome,
    id: `outcome-${userId}-${outcome.id.split('-')[1]}`,
    user_id: userId,
  }));
}

export function getMockOutcomesByAreaId(areaId: string): MockOutcome[] {
  return SARAH_OUTCOMES.filter(outcome => outcome.area_id === areaId);
}

export function getMockOutcomeById(outcomeId: string): MockOutcome | undefined {
  return SARAH_OUTCOMES.find(outcome => outcome.id === outcomeId);
}

export function getMockActiveOutcomes(userId: string): MockOutcome[] {
  return getMockOutcomesByUserId(userId).filter(outcome => outcome.status === OUTCOME_STATUS.ACTIVE);
}
