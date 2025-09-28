import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Starting global setup for HMS E2E tests...');

  // Create test users and data if needed
  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    // Setup test environment
    console.log('Setting up test environment...');

    // Navigate to the application
    const page = await context.newPage();
    await page.goto(config.projects?.[0]?.use?.baseURL || 'http://localhost:3000');

    // Wait for the application to be ready
    await page.waitForLoadState('networkidle');
    console.log('Application is ready for testing');

    // Take a screenshot of the initial state
    await page.screenshot({ path: 'test-results/setup-initial-state.png' });

    // Log environment information
    console.log('Environment info:');
    console.log(`  - Base URL: ${config.projects?.[0]?.use?.baseURL}`);
    console.log(`  - Browser: Chromium`);
    console.log(`  - Headless: ${process.env['HEADLESS'] !== 'false'}`);
    console.log(`  - Test Workers: ${config.workers}`);

  } catch (error) {
    console.error('Global setup failed:', error);
    // Note: page is not available in global setup, screenshot would need to be handled differently
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }

  console.log('Global setup completed successfully');
}

export default globalSetup;