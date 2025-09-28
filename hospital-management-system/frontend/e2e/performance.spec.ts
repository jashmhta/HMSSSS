import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('Dashboard should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/dashboard');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('Patient search should respond within 1 second', async ({ page }) => {
    await page.goto('/patient');

    const startTime = Date.now();
    await page.fill('input[placeholder*="search"]', 'John');
    await page.waitForTimeout(100);
    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(1000);
  });

  test('Appointment booking should complete within 5 seconds', async ({ page }) => {
    await page.goto('/appointments');

    const startTime = Date.now();
    // Simulate booking process
    await page.click('button:has-text("New Appointment")');
    await page.fill('input[name="patientName"]', 'John Doe');
    await page.selectOption('select[name="doctor"]', 'Dr. Smith');
    await page.click('button:has-text("Book")');
    await page.waitForSelector('text=Appointment booked successfully');
    const bookingTime = Date.now() - startTime;

    expect(bookingTime).toBeLessThan(5000);
  });
});