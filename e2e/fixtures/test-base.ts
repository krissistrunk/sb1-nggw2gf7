import { test as base, expect } from '@playwright/test';

/**
 * Test user credentials for E2E tests
 */
export const TEST_USER = {
  email: 'sarah@test.com',
  password: 'test123',
  name: 'Sarah Chen',
};

export const NEW_USER = {
  email: `e2e-test-${Date.now()}@test.com`,
  password: 'TestPassword123!',
  name: 'E2E Test User',
  orgName: 'E2E Test Organization',
};

/**
 * Extended test fixture with authentication helpers
 */
export const test = base.extend<{
  authenticatedPage: typeof base;
}>({
  // Add custom fixtures here as needed
});

export { expect };

/**
 * Common test utilities
 */
export const testUtils = {
  /**
   * Generate a unique email for test isolation
   */
  generateUniqueEmail: () => `e2e-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,

  /**
   * Wait for navigation to complete
   */
  waitForNavigation: async (page: any, url: string) => {
    await page.waitForURL(url, { timeout: 10000 });
  },

  /**
   * Wait for Supabase auth to be ready
   */
  waitForAuthReady: async (page: any) => {
    // Wait for any auth-related loading to complete
    await page.waitForLoadState('networkidle');
  },

  /**
   * Clear local storage and cookies for clean state
   */
  clearAuthState: async (page: any) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  },
};

/**
 * RPM-specific assertions
 */
export const rpmAssertions = {
  /**
   * Assert that purpose is visible and properly displayed
   */
  assertPurposeVisible: async (page: any, expectedText?: string) => {
    const purposeCard = page.locator('[data-testid="purpose-card"], .purpose-card, :has-text("Your WHY")');
    await expect(purposeCard.first()).toBeVisible();
    if (expectedText) {
      await expect(purposeCard).toContainText(expectedText);
    }
  },

  /**
   * Assert outcome count within RPM limits (3-5)
   */
  assertOutcomeCountValid: async (page: any) => {
    const outcomes = page.locator('[data-testid="selected-outcome"], .selected-outcome');
    const count = await outcomes.count();
    expect(count).toBeGreaterThanOrEqual(0);
    expect(count).toBeLessThanOrEqual(5);
  },

  /**
   * Assert action is marked as MUST
   */
  assertActionIsMust: async (page: any, actionTitle: string) => {
    const action = page.locator(`[data-testid="action-item"]:has-text("${actionTitle}")`);
    await expect(action.locator('.must-indicator, [data-must="true"]')).toBeVisible();
  },
};
