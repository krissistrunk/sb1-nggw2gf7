/**
 * Mock Data - Central Export
 *
 * This module provides mock data for development without database connection.
 * Enable mock mode by setting VITE_USE_MOCK_DATA=true in .env
 */

export * from './mock-users';
export * from './mock-organizations';
export * from './mock-areas';
export * from './mock-outcomes';
export * from './mock-actions';

import { DEFAULT_MOCK_USER, getMockUserByEmail, getMockUserById, MOCK_USERS } from './mock-users';
import { getMockOrganizationById, MOCK_ORGANIZATIONS } from './mock-organizations';
import { getMockAreasByUserId, getMockAreaById, SARAH_AREAS } from './mock-areas';
import { getMockOutcomesByUserId, getMockActiveOutcomes, getMockOutcomeById, SARAH_OUTCOMES } from './mock-outcomes';
import { getMockActionsByUserId, getMockTodayActions, getMockActionsByOutcomeId, getMockActionById, SARAH_ACTIONS } from './mock-actions';

/**
 * Check if mock mode is enabled
 */
export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
}

/**
 * Mock Authentication
 */
export const MockAuth = {
  currentUser: DEFAULT_MOCK_USER,

  async signIn(email: string, password: string) {
    const user = getMockUserByEmail(email);
    if (user && password === 'test123') {
      this.currentUser = user;
      return { data: { user: { id: user.id, email: user.email } }, error: null };
    }
    return { data: { user: null }, error: { message: 'Invalid credentials' } };
  },

  async signUp(email: string, _password: string, metadata: any) {
    // In mock mode, just return success
    const newUser = {
      id: `user-mock-${Date.now()}`,
      email,
      name: metadata.name || 'New User',
      organization_id: `org-mock-${Date.now()}`,
      created_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    };
    return { data: { user: { id: newUser.id, email: newUser.email } }, error: null };
  },

  async signOut() {
    this.currentUser = DEFAULT_MOCK_USER;
    return { error: null };
  },

  getSession() {
    return {
      data: {
        session: {
          user: { id: this.currentUser.id, email: this.currentUser.email }
        }
      },
      error: null
    };
  }
};

/**
 * Mock Data Provider
 * Simulates Supabase query interface
 */
export const MockData = {
  // Users
  getUser(id: string) {
    return getMockUserById(id) || DEFAULT_MOCK_USER;
  },

  getUserByEmail(email: string) {
    return getMockUserByEmail(email) || DEFAULT_MOCK_USER;
  },

  getAllUsers() {
    return MOCK_USERS;
  },

  // Organizations
  getOrganization(id: string) {
    return getMockOrganizationById(id);
  },

  getAllOrganizations() {
    return MOCK_ORGANIZATIONS;
  },

  // Areas
  getAreasByUser(userId: string) {
    return getMockAreasByUserId(userId);
  },

  getArea(areaId: string) {
    return getMockAreaById(areaId);
  },

  // Outcomes
  getOutcomesByUser(userId: string) {
    return getMockOutcomesByUserId(userId);
  },

  getActiveOutcomes(userId: string) {
    return getMockActiveOutcomes(userId);
  },

  getOutcome(outcomeId: string) {
    return getMockOutcomeById(outcomeId);
  },

  // Actions
  getActionsByUser(userId: string) {
    return getMockActionsByUserId(userId);
  },

  getTodayActions(userId: string) {
    return getMockTodayActions(userId);
  },

  getActionsByOutcome(outcomeId: string) {
    return getMockActionsByOutcomeId(outcomeId);
  },

  getAction(actionId: string) {
    return getMockActionById(actionId);
  },

  // Simulate async database operations
  async query(options: {
    table: string;
    select?: string;
    filters?: Record<string, any>;
    order?: { column: string; ascending: boolean };
    limit?: number;
  }) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

    let data: any[] = [];

    switch (options.table) {
      case 'users':
        data = MOCK_USERS;
        break;
      case 'organizations':
        data = MOCK_ORGANIZATIONS;
        break;
      case 'areas':
        data = SARAH_AREAS;
        break;
      case 'outcomes':
        data = SARAH_OUTCOMES;
        break;
      case 'actions':
        data = SARAH_ACTIONS;
        break;
      default:
        data = [];
    }

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        data = data.filter(item => item[key] === value);
      });
    }

    // Apply limit
    if (options.limit) {
      data = data.slice(0, options.limit);
    }

    return { data, error: null };
  },

  // Simulate mutations (create, update, delete)
  async insert(table: string, values: any) {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('[Mock] Insert into', table, values);
    return { data: { ...values, id: `mock-${Date.now()}` }, error: null };
  },

  async update(table: string, id: string, values: any) {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('[Mock] Update', table, id, values);
    return { data: { id, ...values }, error: null };
  },

  async delete(table: string, id: string) {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('[Mock] Delete from', table, id);
    return { data: null, error: null };
  }
};

/**
 * Log mock mode status
 */
if (isMockMode()) {
  console.log('%c🎭 MOCK MODE ENABLED', 'background: #FCD34D; color: #78350F; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
  console.log('Using local mock data instead of Supabase');
  console.log('Set VITE_USE_MOCK_DATA=false in .env to connect to database');
}
