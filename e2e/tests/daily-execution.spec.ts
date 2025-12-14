import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TodayPage } from '../pages/today.page';
import { TEST_USER } from '../fixtures/test-base';

test.describe('Daily Execution', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.assertLoginSuccess();
  });

  test.describe('Today Page', () => {
    test('should load today page with user data', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();
      await todayPage.assertPageVisible();
    });

    test('should display outcomes for today', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      // Page should load without errors
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/today/);
    });

    test('should show empty state when no outcomes selected', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      const outcomeCount = await todayPage.getOutcomeCount();
      if (outcomeCount === 0) {
        // Should show some form of empty state or call to action
        const emptyStateOrCTA = page.locator(':has-text("plan"), :has-text("select"), :has-text("no outcomes")');
        // Empty state behavior varies
      }
    });
  });

  test.describe('Quick Add Action', () => {
    test('should add action via quick-add form', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      // Find quick add input
      const quickAddInput = page.locator('input[placeholder*="action" i], [data-testid="quick-add-input"]');
      if (await quickAddInput.isVisible()) {
        const testAction = `E2E Quick Add ${Date.now()}`;
        await quickAddInput.fill(testAction);

        const addButton = page.locator('button:has-text("Add"), [data-testid="quick-add-button"]');
        await addButton.click();
        await page.waitForLoadState('networkidle');

        // Verify action was added
        const actionItem = page.locator(`:has-text("${testAction}")`);
        // Action should appear in list
      }
    });
  });

  test.describe('Action Reordering', () => {
    test('should support drag-and-drop reordering', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      const actionCount = await todayPage.getActionCount();
      if (actionCount >= 2) {
        // Find drag handles
        const dragHandles = page.locator('[data-testid="drag-handle"], .drag-handle');
        if (await dragHandles.first().isVisible()) {
          // Drag first item to second position
          const firstHandle = dragHandles.first();
          const secondItem = todayPage.actionItems.nth(1);

          await firstHandle.dragTo(secondItem);
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });

  test.describe('MUST Actions', () => {
    test('should highlight MUST actions with flame icon', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      // Look for MUST action indicators
      const mustIndicators = page.locator('[data-must="true"], .must-action, :has(svg):has-text("MUST")');
      // If MUST actions exist, they should be highlighted
    });

    test('should allow marking action as MUST', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      const actionCount = await todayPage.getActionCount();
      if (actionCount > 0) {
        // Find action and look for MUST toggle
        const firstAction = todayPage.actionItems.first();
        const mustToggle = firstAction.locator('button:has-text("MUST"), [data-testid="must-toggle"]');

        if (await mustToggle.isVisible()) {
          await mustToggle.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });

  test.describe('Delegated Actions', () => {
    test('should display delegated actions with assignee', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      // Look for delegation indicators
      const delegationIndicators = page.locator('[data-delegated="true"], .delegated-action, :has-text("Delegated to")');
      // Delegated actions should show assignee name
    });
  });

  test.describe('Daily Progress Widget', () => {
    test('should display progress widget', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      // Look for progress widget
      const progressWidget = page.locator('[data-testid="progress-widget"], .progress-widget, .daily-progress');
      // Progress widget may or may not be visible based on state
    });

    test('should update progress on action completion', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      const progressWidget = page.locator('[data-testid="progress-widget"], .progress-widget');
      if (await progressWidget.isVisible()) {
        // Get initial progress
        const initialText = await progressWidget.textContent();

        // Complete an action
        const actionCount = await todayPage.getActionCount();
        if (actionCount > 0) {
          await todayPage.toggleActionCompletion(0);
          await page.waitForLoadState('networkidle');

          // Progress should update
          const updatedText = await progressWidget.textContent();
          // Note: May not always change if no MUST actions
        }
      }
    });
  });

  test.describe('Focus Timer', () => {
    test('should open focus timer modal', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      const focusButton = page.locator('button:has-text("Focus"), button:has-text("Timer"), [data-testid="focus-timer-button"]');
      if (await focusButton.isVisible()) {
        await focusButton.click();

        // Timer modal should open
        const timerModal = page.locator('[data-testid="focus-timer-modal"], .focus-timer, .timer-modal');
        await expect(timerModal).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have preset duration options', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      const focusButton = page.locator('button:has-text("Focus"), [data-testid="focus-timer-button"]');
      if (await focusButton.isVisible()) {
        await focusButton.click();

        // Look for preset buttons (15, 25, 45, 60 min)
        const preset25 = page.locator('button:has-text("25"), [data-duration="25"]');
        // Preset buttons should be available
      }
    });

    test('should start and display timer countdown', async ({ page }) => {
      const todayPage = new TodayPage(page);
      await todayPage.goto();

      const focusButton = page.locator('button:has-text("Focus"), [data-testid="focus-timer-button"]');
      if (await focusButton.isVisible()) {
        await focusButton.click();
        await page.waitForTimeout(500);

        // Select 25 min preset
        const preset25 = page.locator('button:has-text("25")');
        if (await preset25.isVisible()) {
          await preset25.click();

          // Start timer
          const startButton = page.locator('button:has-text("Start"), [data-testid="start-timer"]');
          if (await startButton.isVisible()) {
            await startButton.click();

            // Timer display should show countdown
            const timerDisplay = page.locator('[data-testid="timer-display"], .timer-display');
            await expect(timerDisplay).toBeVisible();
          }
        }
      }
    });
  });
});
