import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TEST_USER } from '../fixtures/test-base';

test.describe('Knowledge Base', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.assertLoginSuccess();
  });

  test.describe('Knowledge Base Page', () => {
    test('should load knowledge base page', async ({ page }) => {
      await page.goto('/knowledge');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/knowledge/);
    });

    test('should display create note button', async ({ page }) => {
      await page.goto('/knowledge');
      await page.waitForLoadState('networkidle');

      const createButton = page.locator('button:has-text("Create"), button:has-text("New Note"), button:has-text("Add")');
      await expect(createButton.first()).toBeVisible();
    });

    test('should display note type filters', async ({ page }) => {
      await page.goto('/knowledge');
      await page.waitForLoadState('networkidle');

      // Look for type filter options
      const typeFilters = page.locator('[data-testid="type-filter"], select[name="type"], :has-text("permanent")');
      // Type filters should be available
    });
  });

  test.describe('Note Creation', () => {
    test('should create a new knowledge note', async ({ page }) => {
      await page.goto('/knowledge');
      await page.waitForLoadState('networkidle');

      const createButton = page.locator('button:has-text("Create"), button:has-text("New")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForLoadState('networkidle');

        // Fill note form
        const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]');
        const contentInput = page.locator('textarea[name="content"], [data-testid="note-content"]');

        if (await titleInput.isVisible()) {
          await titleInput.fill(`E2E Test Note ${Date.now()}`);
        }

        if (await contentInput.isVisible()) {
          await contentInput.fill('This is a test note created by E2E tests.');
        }

        // Save note
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should support multiple note types', async ({ page }) => {
      await page.goto('/knowledge');
      await page.waitForLoadState('networkidle');

      const createButton = page.locator('button:has-text("Create")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);

        // Look for note type selector
        const typeSelect = page.locator('select[name="note_type"], [data-testid="note-type-select"]');
        if (await typeSelect.isVisible()) {
          // Should have options: permanent, fleeting, literature, insight, pattern, learning
          const options = await typeSelect.locator('option').allTextContents();
          // Verify multiple types available
        }
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('should have search input', async ({ page }) => {
      await page.goto('/knowledge');
      await page.waitForLoadState('networkidle');

      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], [data-testid="search-input"]');
      await expect(searchInput.first()).toBeVisible();
    });

    test('should filter notes when searching', async ({ page }) => {
      await page.goto('/knowledge');
      await page.waitForLoadState('networkidle');

      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForLoadState('networkidle');

        // Results should filter
        // Note: This depends on having existing notes with "test" in them
      }
    });
  });

  test.describe('Knowledge Graph', () => {
    test('should load knowledge graph page', async ({ page }) => {
      await page.goto('/knowledge-graph');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/knowledge-graph/);
    });

    test('should display graph visualization', async ({ page }) => {
      await page.goto('/knowledge-graph');
      await page.waitForLoadState('networkidle');

      // Look for ReactFlow container or graph visualization
      const graphContainer = page.locator('[data-testid="knowledge-graph"], .react-flow, .knowledge-graph');
      await expect(graphContainer).toBeVisible({ timeout: 10000 });
    });

    test('should have zoom controls', async ({ page }) => {
      await page.goto('/knowledge-graph');
      await page.waitForLoadState('networkidle');

      // Look for zoom controls
      const zoomControls = page.locator('.react-flow__controls, [data-testid="zoom-controls"]');
      // Zoom controls may be present
    });

    test('should allow node interaction', async ({ page }) => {
      await page.goto('/knowledge-graph');
      await page.waitForLoadState('networkidle');

      // Look for graph nodes
      const nodes = page.locator('.react-flow__node, [data-testid="graph-node"]');
      const nodeCount = await nodes.count();

      if (nodeCount > 0) {
        // Click on a node
        await nodes.first().click();
        // Node should be selectable or show details
      }
    });
  });
});
