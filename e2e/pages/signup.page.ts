import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Signup Page
 * Route: /signup
 */
export class SignupPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly loginLink: Locator;
  readonly passwordStrengthIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('#name, input[name="name"]');
    this.emailInput = page.locator('#email, input[type="email"]');
    this.passwordInput = page.locator('#password');
    this.confirmPasswordInput = page.locator('#confirmPassword');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"], .error-message, [role="alert"], .bg-red-50');
    this.loginLink = page.locator('a[href="/login"], a:has-text("Sign in")');
    this.passwordStrengthIndicator = page.locator('[class*="h-1.5"][class*="bg-"]');
  }

  /**
   * Navigate to signup page
   */
  async goto(): Promise<void> {
    await this.page.goto('/signup');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill signup form
   */
  async fillForm(name: string, email: string, password: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    // Wait for password validation to update
    await this.page.waitForTimeout(300);
    await this.confirmPasswordInput.fill(password);
  }

  /**
   * Submit signup form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete signup flow
   */
  async signup(name: string, email: string, password: string): Promise<void> {
    await this.fillForm(name, email, password);
    await this.submit();
  }

  /**
   * Assert signup was successful (redirected to org setup)
   */
  async assertSignupSuccess(): Promise<void> {
    await this.page.waitForURL('**/setup-organization', { timeout: 15000 });
    expect(this.page.url()).toContain('/setup-organization');
  }

  /**
   * Assert signup failed with error
   */
  async assertSignupFailure(): Promise<void> {
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
    await expect(this.nameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Navigate to login page
   */
  async goToLogin(): Promise<void> {
    await this.loginLink.click();
    await this.page.waitForURL('**/login');
  }

  /**
   * Validate password requirements
   */
  async validatePasswordRequirements(password: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Password too short');
    if (!/[A-Z]/.test(password)) errors.push('Missing uppercase');
    if (!/[a-z]/.test(password)) errors.push('Missing lowercase');
    if (!/[0-9]/.test(password)) errors.push('Missing number');
    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if there's a validation error displayed
   */
  async hasValidationError(): Promise<boolean> {
    // Check for password requirements not met
    const notMetRequirements = this.page.locator('text=/At least 8 characters/');
    const errorMessage = this.page.locator('.bg-red-50, [role="alert"]');
    const submitDisabled = await this.submitButton.isDisabled();

    return submitDisabled || (await errorMessage.count()) > 0;
  }
}
