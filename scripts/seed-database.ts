import { chromium } from '@playwright/test';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to seed users page
    console.log('📄 Navigating to seed-users page...');
    await page.goto('http://localhost:5173/seed-users', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForSelector('button', { timeout: 10000 });

    // Find and click the seed button
    console.log('🔘 Looking for seed button...');
    const seedButton = page.getByRole('button', { name: /generate|seed|create/i });

    if (await seedButton.count() > 0) {
      console.log('🚀 Clicking seed button...');
      await seedButton.click();

      // Wait for seeding to complete (can take 2-3 minutes)
      console.log('⏳ Waiting for seeding to complete (this may take 2-3 minutes)...');

      // Wait for success message or completion indicator
      await page.waitForSelector('text=/completed|success|done/i', { timeout: 300000 });

      console.log('✅ Seeding completed successfully!');
    } else {
      console.log('⚠️ Seed button not found. Page content:');
      console.log(await page.content());
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'seed-error.png' });
    console.log('📸 Screenshot saved to seed-error.png');
  } finally {
    await browser.close();
  }
}

seedDatabase();
