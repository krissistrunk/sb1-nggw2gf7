import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Authentication helper functions for E2E tests
 */
export class AuthHelpers {
  constructor(private page: Page) {}

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    // Fill login form
    await this.page.fill('input[type="email"], input[name="email"]', email);
    await this.page.fill('input[type="password"], input[name="password"]', password);

    // Submit form
    await this.page.click('button[type="submit"]');

    // Wait for redirect to /today or /setup-organization
    await this.page.waitForURL(/\/(today|setup-organization)/, { timeout: 15000 });
  }

  /**
   * Sign up a new user
   */
  async signup(email: string, password: string, name: string): Promise<void> {
    await this.page.goto('/signup');
    await this.page.waitForLoadState('networkidle');

    // Fill signup form
    await this.page.fill('input[name="name"], input[placeholder*="name" i]', name);
    await this.page.fill('input[type="email"], input[name="email"]', email);
    await this.page.fill('input[type="password"], input[name="password"]', password);

    // Submit form
    await this.page.click('button[type="submit"]');

    // Wait for redirect to organization setup
    await this.page.waitForURL('**/setup-organization', { timeout: 15000 });
  }

  /**
   * Complete organization setup
   */
  async setupOrganization(orgName: string): Promise<void> {
    await this.page.waitForURL('**/setup-organization');

    // Fill organization name
    await this.page.fill('input[name="organizationName"], input[placeholder*="organization" i]', orgName);

    // Submit form
    await this.page.click('button[type="submit"]');

    // Wait for redirect to /today
    await this.page.waitForURL('**/today', { timeout: 15000 });
  }

  /**
   * Complete full signup flow (signup + org setup)
   */
  async signupComplete(email: string, password: string, name: string, orgName: string): Promise<void> {
    await this.signup(email, password, name);
    await this.setupOrganization(orgName);
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    // Try different logout methods
    try {
      // Method 1: Click user menu and logout button
      const userMenu = this.page.locator('[data-testid="user-menu"], .user-menu, button:has-text("Sign out")');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        const logoutBtn = this.page.locator('button:has-text("Sign out"), [data-testid="logout-button"]');
        if (await logoutBtn.isVisible()) {
          await logoutBtn.click();
        }
      }
    } catch {
      // Method 2: Direct navigation to clear auth
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await this.page.context().clearCookies();
    }

    await this.page.goto('/login');
    await this.page.waitForURL('**/login');
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.goto('/today');
      await this.page.waitForURL(/\/(today|login|setup-organization)/, { timeout: 5000 });
      const url = this.page.url();
      return url.includes('/today');
    } catch {
      return false;
    }
  }

  /**
   * Assert user is redirected to login when not authenticated
   */
  async assertRedirectsToLogin(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForURL('**/login', { timeout: 10000 });
    expect(this.page.url()).toContain('/login');
  }

  /**
   * Assert user is redirected to org setup when no organization
   */
  async assertRedirectsToOrgSetup(): Promise<void> {
    await this.page.waitForURL('**/setup-organization', { timeout: 10000 });
    expect(this.page.url()).toContain('/setup-organization');
  }

  /**
   * Clear all authentication state
   */
  async clearAuthState(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await this.page.context().clearCookies();
  }
}

/**
 * Factory function to create AuthHelpers instance
 */
export function createAuthHelpers(page: Page): AuthHelpers {
  return new AuthHelpers(page);
}
