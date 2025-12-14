import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Daily Planning Page
 * Route: /daily-planning
 * Implements the 6-step RPM ritual
 */
export class DailyPlanningPage {
  readonly page: Page;
  readonly stepIndicator: Locator;
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly outcomeCheckboxes: Locator;
  readonly selectedOutcomeCount: Locator;
  readonly warningMessage: Locator;
  readonly purposeReconnectionSection: Locator;
  readonly commitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.stepIndicator = page.locator('[data-testid="step-indicator"], .step-indicator');
    this.nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
    this.backButton = page.locator('button:has-text("Back"), button:has-text("Previous")');
    this.outcomeCheckboxes = page.locator('[data-testid="outcome-checkbox"], input[type="checkbox"]');
    this.selectedOutcomeCount = page.locator('[data-testid="selected-count"], .selected-count');
    this.warningMessage = page.locator('[data-testid="warning-message"], .warning-message, [role="alert"]');
    this.purposeReconnectionSection = page.locator('[data-testid="purpose-reconnection"], :has-text("Purpose Reconnection")');
    this.commitButton = page.locator('button:has-text("Commit"), button:has-text("Complete")');
  }

  /**
   * Navigate to daily planning page
   */
  async goto(): Promise<void> {
    await this.page.goto('/daily-planning');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current step number
   */
  async getCurrentStep(): Promise<number> {
    const stepText = await this.stepIndicator.textContent();
    const match = stepText?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Go to next step
   */
  async nextStep(): Promise<void> {
    await this.nextButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Go to previous step
   */
  async previousStep(): Promise<void> {
    await this.backButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select an outcome by index
   */
  async selectOutcome(index: number): Promise<void> {
    const checkbox = this.outcomeCheckboxes.nth(index);
    await checkbox.check();
  }

  /**
   * Deselect an outcome by index
   */
  async deselectOutcome(index: number): Promise<void> {
    const checkbox = this.outcomeCheckboxes.nth(index);
    await checkbox.uncheck();
  }

  /**
   * Get count of selected outcomes
   */
  async getSelectedOutcomeCount(): Promise<number> {
    const text = await this.selectedOutcomeCount.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Select multiple outcomes
   */
  async selectOutcomes(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.selectOutcome(i);
    }
  }

  /**
   * Assert warning is shown when selecting too many outcomes
   */
  async assertTooManyOutcomesWarning(): Promise<void> {
    await expect(this.warningMessage).toBeVisible();
    // Should warn about selecting more than 4 outcomes
  }

  /**
   * Assert outcome limit is enforced (max 5)
   */
  async assertOutcomeLimitEnforced(): Promise<void> {
    const selected = await this.getSelectedOutcomeCount();
    expect(selected).toBeLessThanOrEqual(5);
  }

  /**
   * Assert purpose reconnection ritual is present
   */
  async assertPurposeReconnectionVisible(): Promise<void> {
    const purposeSection = this.page.locator(':has-text("READ OUT LOUD"), :has-text("Purpose Reconnection"), :has-text("Your WHY")');
    await expect(purposeSection.first()).toBeVisible();
  }

  /**
   * Complete all steps of daily planning
   */
  async completeDailyPlanning(outcomeCount: number = 3): Promise<void> {
    // Step 1: Welcome
    await this.nextStep();

    // Step 2: Capture (may be skipped if no items)
    await this.nextStep();

    // Step 3: Organize
    await this.nextStep();

    // Step 4: Review Outcomes
    await this.nextStep();

    // Step 5: Select Focus Outcomes
    await this.selectOutcomes(outcomeCount);
    await this.nextStep();

    // Step 6: Purpose Reconnection
    await this.nextStep();

    // Step 7: Plan Actions
    await this.nextStep();

    // Step 8: Commit
    await this.commitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Assert daily planning was completed
   */
  async assertPlanningCompleted(): Promise<void> {
    // Should redirect to today page or show success
    await expect(this.page).toHaveURL(/\/(today|daily-planning\/complete)/);
  }

  /**
   * Navigate through all steps
   */
  async navigateToStep(stepNumber: number): Promise<void> {
    const currentStep = await this.getCurrentStep();
    const stepsToGo = stepNumber - currentStep;

    if (stepsToGo > 0) {
      for (let i = 0; i < stepsToGo; i++) {
        await this.nextStep();
      }
    } else if (stepsToGo < 0) {
      for (let i = 0; i < Math.abs(stepsToGo); i++) {
        await this.previousStep();
      }
    }
  }
}
