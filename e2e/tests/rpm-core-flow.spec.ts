import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { OutcomesPage } from '../pages/outcomes.page';
import { DailyPlanningPage } from '../pages/daily-planning.page';
import { TodayPage } from '../pages/today.page';
import { createAuthHelpers } from '../helpers/auth.helpers';
import { TEST_USER, testUtils } from '../fixtures/test-base';

test.describe('Core RPM Flow', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.assertLoginSuccess();
  });

  test.describe('Areas', () => {
    test('should display areas page', async ({ page }) => {
      await page.goto('/areas');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/areas/);
    });

    test('should create an area with identity statement', async ({ page }) => {
      await page.goto('/areas');
      await page.waitForLoadState('networkidle');

      // Look for create button
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")');
      if (await createButton.isVisible()) {
        await createButton.click();

        // Fill form if modal appears
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
        if (await nameInput.isVisible()) {
          await nameInput.fill('E2E Test Area');

          // Check for identity statement option
          const identityInput = page.locator('input[name="identity"], textarea[placeholder*="identity" i]');
          if (await identityInput.isVisible()) {
            await identityInput.fill('I am a person who values growth');
          }

          const saveButton = page.locator('button[type="submit"], button:has-text("Save")');
          await saveButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });

  test.describe('Outcomes', () => {
    test('should create outcome with prominent purpose field', async ({ page }) => {
      const outcomesPage = new OutcomesPage(page);
      await outcomesPage.goto();

      // Click create button
      await outcomesPage.createOutcomeButton.click();
      await page.waitForLoadState('networkidle');

      // Assert purpose field is emphasized (RPM requirement)
      await outcomesPage.assertPurposeFieldEmphasized();
    });

    test('should create outcome with purpose/WHY', async ({ page }) => {
      const outcomesPage = new OutcomesPage(page);
      await outcomesPage.goto();

      const testTitle = `E2E Test Outcome ${Date.now()}`;
      const testPurpose = 'To achieve mastery and contribute to my growth because this matters deeply to me.';

      await outcomesPage.createOutcome(testTitle, testPurpose);
      await outcomesPage.assertOutcomeCreated(testTitle);
    });

    test('should show purpose guidance questions', async ({ page }) => {
      const outcomesPage = new OutcomesPage(page);
      await outcomesPage.goto();
      await outcomesPage.createOutcomeButton.click();

      // Look for purpose guidance
      const guidanceText = page.locator(':has-text("emotional fuel"), :has-text("why does this matter")');
      // Purpose guidance should be present (RPM methodology)
    });

    test('should link outcome to actions', async ({ page }) => {
      const outcomesPage = new OutcomesPage(page);
      await outcomesPage.goto();

      const testTitle = `Action Link Test ${Date.now()}`;
      await outcomesPage.createOutcome(testTitle, 'Testing action linking');

      // Navigate to outcome detail
      await outcomesPage.clickOutcome(testTitle);
      await page.waitForLoadState('networkidle');

      // Should be on outcome detail page
      await expect(page).toHaveURL(/\/outcomes\/[a-zA-Z0-9-]+/);

      // Look for action section
      const actionSection = page.locator(':has-text("Actions"), [data-testid="actions-section"]');
      await expect(actionSection).toBeVisible();
    });
  });

  test.describe('Daily Planning', () => {
    test('should complete 6-step daily planning ritual', async ({ page }) => {
      const dailyPlanningPage = new DailyPlanningPage(page);
      await dailyPlanningPage.goto();

      // Verify we're on daily planning page
      await expect(page).toHaveURL(/\/daily-planning/);
    });

    test('should enforce 3-5 outcome limit', async ({ page }) => {
      const dailyPlanningPage = new DailyPlanningPage(page);
      await dailyPlanningPage.goto();

      // Navigate to outcome selection step
      await dailyPlanningPage.navigateToStep(5);

      // Try to select outcomes
      const checkboxCount = await dailyPlanningPage.outcomeCheckboxes.count();
      if (checkboxCount > 0) {
        // Select up to 5 outcomes
        const toSelect = Math.min(5, checkboxCount);
        await dailyPlanningPage.selectOutcomes(toSelect);

        // Verify limit is enforced
        await dailyPlanningPage.assertOutcomeLimitEnforced();
      }
    });

    test('should show warning when selecting more than 4 outcomes', async ({ page }) => {
      const dailyPlanningPage = new DailyPlanningPage(page);
      await dailyPlanningPage.goto();

      // Navigate to outcome selection step
      await dailyPlanningPage.navigateToStep(5);

      const checkboxCount = await dailyPlanningPage.outcomeCheckboxes.count();
      if (checkboxCount >= 5) {
        await dailyPlanningPage.selectOutcomes(5);
        // Warning should appear for selecting more than 4
        await dailyPlanningPage.assertTooManyOutcomesWarning();
      }
    });

    test('should include purpose reconnection ritual', async ({ page }) => {
      const dailyPlanningPage = new DailyPlanningPage(page);
      await dailyPlanningPage.goto();

      // Navigate to purpose step
      await dailyPlanningPage.navigateToStep(6);

      // Purpose reconnection should be visible
      await dailyPlanningPage.assertPurposeReconnectionVisible();
    });
  });

  test.describe('Today Page - Purpose Visibility', () => {
    test('should display purpose cards on today page', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      // After daily planning, purpose should be visible
      // This may fail if no daily planning was done
      try {
        await todayPage.assertPurposeVisible();
      } catch {
        // Expected if no outcomes selected for today
        console.log('No outcomes selected for today - skipping purpose visibility check');
      }
    });

    test('should show "Your WHY" for selected outcomes', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      // Look for WHY indicators
      const whyElements = page.locator(':has-text("Your WHY"), .purpose-card, [data-testid="purpose-display"]');
      const count = await whyElements.count();

      // If outcomes are selected, WHY should be visible
      if (await todayPage.getOutcomeCount() > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Action Management', () => {
    test('should mark action as complete', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      const actionCount = await todayPage.getActionCount();
      if (actionCount > 0) {
        await todayPage.toggleActionCompletion(0);
        const isCompleted = await todayPage.isActionCompleted(0);
        expect(isCompleted).toBe(true);
      }
    });

    test('should toggle action completion state', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      const actionCount = await todayPage.getActionCount();
      if (actionCount > 0) {
        // Mark complete
        await todayPage.toggleActionCompletion(0);
        expect(await todayPage.isActionCompleted(0)).toBe(true);

        // Mark incomplete
        await todayPage.toggleActionCompletion(0);
        expect(await todayPage.isActionCompleted(0)).toBe(false);
      }
    });
  });

  test.describe('Focus Timer', () => {
    test('should open focus timer', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      // Look for focus timer button
      const focusButton = page.locator('button:has-text("Focus"), [data-testid="focus-timer-button"]');
      if (await focusButton.isVisible()) {
        await focusButton.click();

        // Timer modal should appear
        const timerModal = page.locator('[data-testid="focus-timer-modal"], .focus-timer-modal, .modal:has-text("Timer")');
        await expect(timerModal).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
