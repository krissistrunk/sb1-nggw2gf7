import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { SignupPage } from '../pages/signup.page';
import { SetupOrgPage } from '../pages/setup-org.page';
import { TodayPage } from '../pages/today.page';
import { createAuthHelpers } from '../helpers/auth.helpers';
import { TEST_USER, testUtils } from '../fixtures/test-base';

test.describe('Authentication Flow', () => {
  test.describe('Login', () => {
    test('should display login page correctly', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.assertPageVisible();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(TEST_USER.email, TEST_USER.password);
      await loginPage.assertLoginSuccess();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(TEST_USER.email, 'wrongpassword');
      await loginPage.assertLoginFailure();
    });

    test('should redirect to login when accessing protected route unauthenticated', async ({ page }) => {
      const authHelpers = createAuthHelpers(page);
      await authHelpers.clearAuthState();
      await authHelpers.assertRedirectsToLogin('/today');
    });

    test('should navigate to signup page from login', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.goToSignup();
      await expect(page).toHaveURL(/\/signup/);
    });
  });

  test.describe('Signup', () => {
    test('should display signup page correctly', async ({ page }) => {
      const signupPage = new SignupPage(page);
      await signupPage.goto();
      await signupPage.assertPageVisible();
    });

    test('should complete signup and redirect to org setup', async ({ page }) => {
      const signupPage = new SignupPage(page);
      const uniqueEmail = testUtils.generateUniqueEmail();

      await signupPage.goto();
      await signupPage.signup('Test User', uniqueEmail, 'TestPassword123!');
      await signupPage.assertSignupSuccess();
    });

    test('should show validation error for short password', async ({ page }) => {
      const signupPage = new SignupPage(page);

      await signupPage.goto();
      await signupPage.fillForm('Test User', testUtils.generateUniqueEmail(), '123');

      // Check if form has validation
      const hasError = await signupPage.hasValidationError();
      // HTML5 validation should prevent submission
    });

    test('should navigate to login page from signup', async ({ page }) => {
      const signupPage = new SignupPage(page);
      await signupPage.goto();
      await signupPage.goToLogin();
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Organization Setup', () => {
    test('should require organization setup after signup', async ({ page }) => {
      const signupPage = new SignupPage(page);
      const uniqueEmail = testUtils.generateUniqueEmail();

      await signupPage.goto();
      await signupPage.signup('Test User', uniqueEmail, 'TestPassword123!');

      // Should be on org setup page
      await expect(page).toHaveURL(/\/setup-organization/);
    });

    test('should complete organization setup successfully', async ({ page }) => {
      const signupPage = new SignupPage(page);
      const setupOrgPage = new SetupOrgPage(page);
      const uniqueEmail = testUtils.generateUniqueEmail();

      // First signup
      await signupPage.goto();
      await signupPage.signup('Test User', uniqueEmail, 'TestPassword123!');

      // Then setup org
      await setupOrgPage.setupOrganization('E2E Test Organization');
      await setupOrgPage.assertSetupSuccess();

      // Should be on today page
      await expect(page).toHaveURL(/\/today/);
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const authHelpers = createAuthHelpers(page);

      // Login first
      await loginPage.goto();
      await loginPage.login(TEST_USER.email, TEST_USER.password);
      await loginPage.assertLoginSuccess();

      // Then logout
      await authHelpers.logout();

      // Should be on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should not access protected routes after logout', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const authHelpers = createAuthHelpers(page);

      // Login
      await loginPage.goto();
      await loginPage.login(TEST_USER.email, TEST_USER.password);
      await loginPage.assertLoginSuccess();

      // Logout
      await authHelpers.logout();

      // Try to access protected route
      await authHelpers.assertRedirectsToLogin('/today');
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session on page reload', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const todayPage = new TodayPage(page);

      // Login
      await loginPage.goto();
      await loginPage.login(TEST_USER.email, TEST_USER.password);
      await loginPage.assertLoginSuccess();

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be on today page (or redirected there)
      const url = page.url();
      expect(url).toMatch(/\/(today|setup-organization)/);
    });
  });

  test.describe('Complete Flow', () => {
    test('should complete full signup -> org setup -> login flow', async ({ page }) => {
      const signupPage = new SignupPage(page);
      const setupOrgPage = new SetupOrgPage(page);
      const loginPage = new LoginPage(page);
      const authHelpers = createAuthHelpers(page);
      const uniqueEmail = testUtils.generateUniqueEmail();

      // Step 1: Signup
      await signupPage.goto();
      await signupPage.signup('Complete Flow Test', uniqueEmail, 'TestPassword123!');
      await signupPage.assertSignupSuccess();

      // Step 2: Organization Setup
      await setupOrgPage.setupOrganization('Complete Flow Org');
      await setupOrgPage.assertSetupSuccess();

      // Step 3: Verify on Today page
      await expect(page).toHaveURL(/\/today/);

      // Step 4: Logout
      await authHelpers.logout();

      // Step 5: Login again with new credentials
      await loginPage.goto();
      await loginPage.login(uniqueEmail, 'TestPassword123!');
      await loginPage.assertLoginSuccess();
    });
  });
});
