import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Today Page
 * Route: /today
 */
export class TodayPage {
  readonly page: Page;
  readonly outcomeCards: Locator;
  readonly purposeCards: Locator;
  readonly actionItems: Locator;
  readonly quickAddInput: Locator;
  readonly quickAddButton: Locator;
  readonly focusTimerButton: Locator;
  readonly progressWidget: Locator;

  constructor(page: Page) {
    this.page = page;
    this.outcomeCards = page.locator('[data-testid="outcome-card"], .outcome-card');
    this.purposeCards = page.locator('[data-testid="purpose-card"], .purpose-card, :has-text("Your WHY")');
    this.actionItems = page.locator('[data-testid="action-item"], .action-item');
    this.quickAddInput = page.locator('[data-testid="quick-add-input"], input[placeholder*="action" i]');
    this.quickAddButton = page.locator('[data-testid="quick-add-button"], button:has-text("Add")');
    this.focusTimerButton = page.locator('[data-testid="focus-timer"], button:has-text("Focus")');
    this.progressWidget = page.locator('[data-testid="progress-widget"], .progress-widget');
  }

  /**
   * Navigate to today page
   */
  async goto(): Promise<void> {
    await this.page.goto('/today');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Assert page is visible and loaded
   */
  async assertPageVisible(): Promise<void> {
    await this.page.waitForURL('**/today');
    // Wait for content to load
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get count of displayed outcomes
   */
  async getOutcomeCount(): Promise<number> {
    return await this.outcomeCards.count();
  }

  /**
   * Get count of displayed actions
   */
  async getActionCount(): Promise<number> {
    return await this.actionItems.count();
  }

  /**
   * Assert purpose is visible for outcomes (RPM requirement)
   */
  async assertPurposeVisible(): Promise<void> {
    const purposeElements = this.page.locator(':has-text("Your WHY"), :has-text("Purpose"), .purpose-card');
    await expect(purposeElements.first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Quick add an action
   */
  async quickAddAction(actionTitle: string): Promise<void> {
    await this.quickAddInput.fill(actionTitle);
    await this.quickAddButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Toggle action completion
   */
  async toggleActionCompletion(actionIndex: number): Promise<void> {
    const action = this.actionItems.nth(actionIndex);
    const checkbox = action.locator('input[type="checkbox"], [data-testid="action-checkbox"]');
    await checkbox.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if action is completed
   */
  async isActionCompleted(actionIndex: number): Promise<boolean> {
    const action = this.actionItems.nth(actionIndex);
    const checkbox = action.locator('input[type="checkbox"], [data-testid="action-checkbox"]');
    return await checkbox.isChecked();
  }

  /**
   * Open focus timer
   */
  async openFocusTimer(): Promise<void> {
    await this.focusTimerButton.click();
    // Wait for modal to open
    await this.page.waitForSelector('[data-testid="focus-timer-modal"], .focus-timer-modal', { timeout: 5000 });
  }

  /**
   * Assert empty state when no outcomes selected
   */
  async assertEmptyState(): Promise<void> {
    const emptyState = this.page.locator('[data-testid="empty-state"], .empty-state, :has-text("no outcomes")');
    await expect(emptyState).toBeVisible();
  }

  /**
   * Click on an outcome to view details
   */
  async clickOutcome(index: number): Promise<void> {
    await this.outcomeCards.nth(index).click();
  }

  /**
   * Get all action titles
   */
  async getActionTitles(): Promise<string[]> {
    const titles: string[] = [];
    const count = await this.actionItems.count();
    for (let i = 0; i < count; i++) {
      const title = await this.actionItems.nth(i).locator('.action-title, h3, span').first().textContent();
      if (title) titles.push(title.trim());
    }
    return titles;
  }

  /**
   * Assert MUST action is highlighted
   */
  async assertMustActionHighlighted(actionTitle: string): Promise<void> {
    const action = this.page.locator(`[data-testid="action-item"]:has-text("${actionTitle}")`);
    const mustIndicator = action.locator('.must-indicator, [data-must="true"], svg');
    await expect(mustIndicator).toBeVisible();
  }
}
