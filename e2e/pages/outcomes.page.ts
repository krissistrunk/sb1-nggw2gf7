import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Outcomes Page
 * Route: /outcomes
 */
export class OutcomesPage {
  readonly page: Page;
  readonly outcomeList: Locator;
  readonly createOutcomeButton: Locator;
  readonly outcomeForm: Locator;
  readonly titleInput: Locator;
  readonly purposeInput: Locator;
  readonly descriptionInput: Locator;
  readonly areaSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.outcomeList = page.locator('[data-testid="outcome-list"], .outcome-list');
    this.createOutcomeButton = page.locator('button:has-text("Create"), button:has-text("New Outcome")');
    this.outcomeForm = page.locator('[data-testid="outcome-form"], .outcome-form, form');
    this.titleInput = page.locator('input[name="title"], input[placeholder*="title" i]');
    this.purposeInput = page.locator('textarea[name="purpose"], textarea[placeholder*="why" i], textarea[placeholder*="purpose" i]');
    this.descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]');
    this.areaSelect = page.locator('select[name="area_id"], [data-testid="area-select"]');
    this.saveButton = page.locator('button[type="submit"], button:has-text("Save")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
  }

  /**
   * Navigate to outcomes page
   */
  async goto(): Promise<void> {
    await this.page.goto('/outcomes');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create a new outcome
   */
  async createOutcome(title: string, purpose: string, options?: {
    description?: string;
    areaId?: string;
  }): Promise<void> {
    await this.createOutcomeButton.click();
    await this.page.waitForLoadState('networkidle');

    await this.titleInput.fill(title);
    await this.purposeInput.fill(purpose);

    if (options?.description) {
      await this.descriptionInput.fill(options.description);
    }

    if (options?.areaId) {
      await this.areaSelect.selectOption(options.areaId);
    }

    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get outcome count
   */
  async getOutcomeCount(): Promise<number> {
    const outcomes = this.page.locator('[data-testid="outcome-item"], .outcome-item, .outcome-card');
    return await outcomes.count();
  }

  /**
   * Click on an outcome
   */
  async clickOutcome(title: string): Promise<void> {
    const outcome = this.page.locator(`[data-testid="outcome-item"]:has-text("${title}"), .outcome-item:has-text("${title}")`);
    await outcome.click();
  }

  /**
   * Assert purpose field has RPM emphasis (prominent label, larger textarea)
   */
  async assertPurposeFieldEmphasized(): Promise<void> {
    const purposeLabel = this.page.locator('label:has-text("WHY"), label:has-text("Purpose")');
    await expect(purposeLabel).toBeVisible();

    // Check textarea has at least 3 rows
    const rows = await this.purposeInput.getAttribute('rows');
    expect(parseInt(rows || '2')).toBeGreaterThanOrEqual(3);
  }

  /**
   * Assert outcome was created successfully
   */
  async assertOutcomeCreated(title: string): Promise<void> {
    const outcome = this.page.locator(`[data-testid="outcome-item"]:has-text("${title}"), .outcome-item:has-text("${title}")`);
    await expect(outcome).toBeVisible({ timeout: 5000 });
  }

  /**
   * Delete an outcome
   */
  async deleteOutcome(title: string): Promise<void> {
    await this.clickOutcome(title);
    const deleteButton = this.page.locator('button:has-text("Delete"), [data-testid="delete-outcome"]');
    await deleteButton.click();

    // Confirm deletion if dialog appears
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }

    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Edit an outcome
   */
  async editOutcome(title: string, newTitle: string, newPurpose: string): Promise<void> {
    await this.clickOutcome(title);

    const editButton = this.page.locator('button:has-text("Edit"), [data-testid="edit-outcome"]');
    await editButton.click();

    await this.titleInput.clear();
    await this.titleInput.fill(newTitle);

    await this.purposeInput.clear();
    await this.purposeInput.fill(newPurpose);

    await this.saveButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
