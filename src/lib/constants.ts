import { GOAL_STATUS, OUTCOME_STATUS as OUTCOME_STATUS_VALUES, type GoalStatus, type OutcomeStatus as OutcomeStatusValue } from '../constants/status';

/**
 * Application-wide constants
 */

// Branding
export const DEFAULT_PRIMARY_COLOR = '#F97316';
export const APP_NAME = 'RPM Life';

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Default feature flags for new organizations
export const DEFAULT_FEATURE_FLAGS = {
  voiceCoaching: true,
  analytics: false,
  customIntegrations: false,
} as const;

// Organization member roles
export const MEMBER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
} as const;

export type MemberRole = keyof typeof MEMBER_ROLES;

// Outcome and action statuses
export const OUTCOME_STATUS = OUTCOME_STATUS_VALUES;
export type OutcomeStatus = OutcomeStatusValue;
export { GOAL_STATUS };
export type { GoalStatus };

// Priority levels
export const PRIORITY_LEVELS = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
} as const;

export type PriorityLevel = (typeof PRIORITY_LEVELS)[keyof typeof PRIORITY_LEVELS];

// Review session types
export const RITUAL_TYPES = {
  MORNING: 'MORNING',
  EVENING: 'EVENING',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
} as const;

export type RitualType = keyof typeof RITUAL_TYPES;

// Inbox item types
export const INBOX_ITEM_TYPES = {
  NOTE: 'NOTE',
  ACTION_IDEA: 'ACTION_IDEA',
  OUTCOME_IDEA: 'OUTCOME_IDEA',
} as const;

export type InboxItemType = keyof typeof INBOX_ITEM_TYPES;

// Goal types
export const GOAL_TYPES = {
  YEARLY: 'YEARLY',
  QUARTERLY: 'QUARTERLY',
} as const;

export type GoalType = keyof typeof GOAL_TYPES;

// Time block modes
export const TIME_BLOCK_MODES = {
  SOFT: 'SOFT',
  STRICT: 'STRICT',
} as const;

export type TimeBlockMode = keyof typeof TIME_BLOCK_MODES;

// Voice session types
export const VOICE_SESSION_TYPES = {
  PLANNING: 'PLANNING',
  COACHING: 'COACHING',
  REFLECTION: 'REFLECTION',
} as const;

export type VoiceSessionType = keyof typeof VOICE_SESSION_TYPES;

// Default durations (in minutes)
export const DEFAULT_DURATIONS = {
  ACTION: 30,
  FOCUS_SESSION: 25,
  SHORT_BREAK: 5,
  LONG_BREAK: 15,
} as const;

// Storage bucket names
export const STORAGE_BUCKETS = {
  PAGE_BACKGROUNDS: 'page-backgrounds',
} as const;

// Route paths (for programmatic navigation)
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  SETUP_ORGANIZATION: '/setup-organization',
  TODAY: '/today',
  OUTCOMES: '/outcomes',
  AREAS: '/areas',
  GOALS: '/goals',
  INBOX: '/inbox',
  CAPTURE: '/capture',
  DAILY_PLANNING: '/daily-planning',
  EVENING_REVIEW: '/evening-review',
  WEEKLY_PLAN: '/weekly-plan',
  WEEKLY_REVIEW: '/weekly-review',
  MONTHLY_REVIEW: '/monthly-review',
  LIFE_PLAN: '/life-plan',
  TEMPLATES: '/templates',
  PROFILE: '/profile',
  VOICE: '/voice',
} as const;
