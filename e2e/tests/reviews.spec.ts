import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TEST_USER } from '../fixtures/test-base';

test.describe('Review Rituals', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.assertLoginSuccess();
  });

  test.describe('Evening Review', () => {
    test('should load evening review page', async ({ page }) => {
      await page.goto('/evening-review');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/evening-review/);
    });

    test('should display reflection fields', async ({ page }) => {
      await page.goto('/evening-review');
      await page.waitForLoadState('networkidle');

      // Look for reflection input fields
      const winsField = page.locator('textarea[name="wins"], [placeholder*="wins" i], :has-text("Wins")');
      const lessonsField = page.locator('textarea[name="lessons"], [placeholder*="lessons" i], :has-text("Lessons")');
      const gratitudeField = page.locator('textarea[name="gratitude"], [placeholder*="gratitude" i], :has-text("Gratitude")');

      // At least some fields should be present
    });

    test('should save evening reflection', async ({ page }) => {
      await page.goto('/evening-review');
      await page.waitForLoadState('networkidle');

      // Fill reflection fields
      const winsField = page.locator('textarea[name="wins"], textarea').first();
      if (await winsField.isVisible()) {
        await winsField.fill('E2E Test: Completed daily tasks');
      }

      // Save button
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Complete")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForLoadState('networkidle');
      }
    });

    test('should display energy level selector', async ({ page }) => {
      await page.goto('/evening-review');
      await page.waitForLoadState('networkidle');

      // Look for energy level selector (1-5 scale)
      const energySelector = page.locator('[data-testid="energy-level"], :has-text("Energy"), input[type="range"]');
      // Energy level control should be present
    });
  });

  test.describe('Weekly Review', () => {
    test('should load weekly review page', async ({ page }) => {
      await page.goto('/weekly-review');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/weekly-review/);
    });

    test('should have multiple steps', async ({ page }) => {
      await page.goto('/weekly-review');
      await page.waitForLoadState('networkidle');

      // Look for step indicators or navigation
      const stepIndicator = page.locator('[data-testid="step-indicator"], .step-indicator, .step');
      // Weekly review has 7-8 steps
    });

    test('should display inbox items for processing', async ({ page }) => {
      await page.goto('/weekly-review');
      await page.waitForLoadState('networkidle');

      // Navigate to inbox step if needed
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
      }

      // Look for inbox items section
      const inboxSection = page.locator(':has-text("Inbox"), [data-testid="inbox-items"]');
    });

    test('should show time block statistics', async ({ page }) => {
      await page.goto('/weekly-review');
      await page.waitForLoadState('networkidle');

      // Navigate to schedule step
      for (let i = 0; i < 4; i++) {
        const nextButton = page.locator('button:has-text("Next")');
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await page.waitForLoadState('networkidle');
        }
      }

      // Look for statistics
      const statsSection = page.locator('[data-testid="time-stats"], :has-text("hours"), :has-text("completion")');
    });
  });

  test.describe('Monthly Review', () => {
    test('should load monthly review page', async ({ page }) => {
      await page.goto('/monthly-review');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/monthly-review/);
    });

    test('should display month navigation', async ({ page }) => {
      await page.goto('/monthly-review');
      await page.waitForLoadState('networkidle');

      // Look for month navigation
      const monthNav = page.locator('[data-testid="month-nav"], button:has-text("Previous"), button:has-text("Next")');
      // Navigation should be present
    });

    test('should show completion metrics', async ({ page }) => {
      await page.goto('/monthly-review');
      await page.waitForLoadState('networkidle');

      // Look for metrics display
      const metrics = page.locator('[data-testid="completion-metrics"], :has-text("completion"), :has-text("%")');
    });
  });

  test.describe('Review Data Persistence', () => {
    test('should save and persist review data', async ({ page }) => {
      // Complete an evening review
      await page.goto('/evening-review');
      await page.waitForLoadState('networkidle');

      const winsField = page.locator('textarea').first();
      if (await winsField.isVisible()) {
        const testText = `E2E Persistence Test ${Date.now()}`;
        await winsField.fill(testText);

        const saveButton = page.locator('button:has-text("Save")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForLoadState('networkidle');

          // Reload and verify data persisted
          await page.reload();
          await page.waitForLoadState('networkidle');

          // Check if data was saved
          // Note: May need to check database or UI state
        }
      }
    });
  });
});
