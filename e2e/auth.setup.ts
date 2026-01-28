import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Authentication setup for E2E tests.
 * This runs before other tests to create an authenticated session.
 *
 * Prerequisites:
 * - Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables
 * - Or create a .env.test file with these variables
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.warn('TEST_USER_EMAIL and TEST_USER_PASSWORD not set. Skipping auth setup.');
    console.warn('Tests requiring authentication will fail.');
    return;
  }

  await page.goto('/login');

  // Fill in login form
  await page.getByLabel('E-Mail-Adresse').fill(email);
  await page.getByLabel('Passwort').fill(password);

  // Click login button
  await page.getByRole('button', { name: 'Anmelden' }).click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
