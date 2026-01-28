import { test, expect } from '@playwright/test';

/**
 * Navigation and basic accessibility tests
 */
test.describe('Navigation', () => {
  test('homepage should redirect to login or dashboard', async ({ page }) => {
    await page.goto('/');

    // Should redirect based on auth state
    await expect(page).toHaveURL(/\/(login|dashboard)/);
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Fahrdienst' })).toBeVisible();
  });

  test('protected routes should redirect to login', async ({ page }) => {
    // Clear any auth state
    await page.context().clearCookies();

    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected routes list should redirect to login', async ({ page }) => {
    await page.context().clearCookies();

    const protectedRoutes = ['/patients', '/drivers', '/destinations', '/rides'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/, {
        timeout: 5000,
      });
    }
  });
});

test.describe('Responsive Design', () => {
  test('login page should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Fahrdienst' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
  });

  test('login page should work on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Fahrdienst' })).toBeVisible();
  });

  test('login page should work on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Fahrdienst' })).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/nonexistent-page');

    // Should either show 404 or redirect
    expect(response?.status()).toBeLessThan(500);
  });
});
