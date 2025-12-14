import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Login Page
 * Route: /login
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.passwordInput = page.locator('input[type="password"], input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"], .error-message, [role="alert"]');
    this.signupLink = page.locator('a[href="/signup"], a:has-text("Sign up")');
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill login form
   */
  async fillForm(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit login form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete login flow
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillForm(email, password);
    await this.submit();
  }

  /**
   * Assert login was successful (redirected to /today)
   */
  async assertLoginSuccess(): Promise<void> {
    await this.page.waitForURL(/\/(today|setup-organization)/, { timeout: 15000 });
    const url = this.page.url();
    expect(url).toMatch(/\/(today|setup-organization)/);
  }

  /**
   * Assert login failed with error
   */
  async assertLoginFailure(): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert error message content
   */
  async assertErrorMessage(expectedText: string): Promise<void> {
    await expect(this.errorMessage).toContainText(expectedText);
  }

  /**
   * Assert page is visible
   */
  async assertPageVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Navigate to signup page
   */
  async goToSignup(): Promise<void> {
    await this.signupLink.click();
    await this.page.waitForURL('**/signup');
  }

  /**
   * Check if form has validation errors
   */
  async hasValidationError(): Promise<boolean> {
    const emailValid = await this.emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    const passwordValid = await this.passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    return !emailValid || !passwordValid;
  }
}
