import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Organization Setup Page
 * Route: /setup-organization
 */
export class SetupOrgPage {
  readonly page: Page;
  readonly orgNameInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orgNameInput = page.locator('input[name="organizationName"], input[placeholder*="organization" i]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"], .error-message, [role="alert"]');
  }

  /**
   * Navigate to setup organization page
   */
  async goto(): Promise<void> {
    await this.page.goto('/setup-organization');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill organization name
   */
  async fillOrgName(name: string): Promise<void> {
    await this.orgNameInput.fill(name);
  }

  /**
   * Submit organization setup form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete organization setup
   */
  async setupOrganization(orgName: string): Promise<void> {
    await this.fillOrgName(orgName);
    await this.submit();
  }

  /**
   * Assert setup was successful (redirected to /today)
   */
  async assertSetupSuccess(): Promise<void> {
    await this.page.waitForURL('**/today', { timeout: 15000 });
    expect(this.page.url()).toContain('/today');
  }

  /**
   * Assert setup failed with error
   */
  async assertSetupFailure(): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert page is visible
   */
  async assertPageVisible(): Promise<void> {
    await expect(this.orgNameInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Get subdomain preview if visible
   */
  async getSubdomainPreview(): Promise<string | null> {
    const preview = this.page.locator('[data-testid="subdomain-preview"], .subdomain-preview');
    if (await preview.isVisible()) {
      return await preview.textContent();
    }
    return null;
  }
}
