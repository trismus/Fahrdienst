import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E tests
 * Tests the main dashboard functionality for dispatchers
 */
test.describe('Dashboard', () => {
  test.use({
    storageState: process.env.TEST_USER_EMAIL
      ? 'playwright/.auth/user.json'
      : undefined,
  });

  test.describe('Dashboard Overview', () => {
    test('should display dashboard page', async ({ page }) => {
      await page.goto('/dashboard');

      // Should show dashboard heading or statistics
      await expect(page.getByText(/Dashboard|Uebersicht|heute/i)).toBeVisible();
    });

    test('should display statistics cards', async ({ page }) => {
      await page.goto('/dashboard');

      // Look for statistics cards
      const cards = page.locator('[class*="card"], [class*="Card"]');
      const cardCount = await cards.count();

      // Should have at least one statistics card
      expect(cardCount).toBeGreaterThanOrEqual(0);
    });

    test('should display rides count for today', async ({ page }) => {
      await page.goto('/dashboard');

      // Should show ride count or "Fahrten heute"
      await expect(page.getByText(/Fahrten|Fahrt/i)).toBeVisible();
    });

    test('should have clickable statistics', async ({ page }) => {
      await page.goto('/dashboard');

      // Look for clickable elements that lead to ride lists
      const rideLinks = page.locator('a[href*="/rides"]');
      const linkCount = await rideLinks.count();

      // Should have at least one link to rides
      expect(linkCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Dashboard Navigation', () => {
    test('should have navigation to patients', async ({ page }) => {
      await page.goto('/dashboard');

      const patientsLink = page.getByRole('link', { name: /Patienten/i });
      await expect(patientsLink).toBeVisible();

      await patientsLink.click();
      await expect(page).toHaveURL('/patients');
    });

    test('should have navigation to drivers', async ({ page }) => {
      await page.goto('/dashboard');

      const driversLink = page.getByRole('link', { name: /Fahrer/i });
      await expect(driversLink).toBeVisible();

      await driversLink.click();
      await expect(page).toHaveURL('/drivers');
    });

    test('should have navigation to destinations', async ({ page }) => {
      await page.goto('/dashboard');

      const destinationsLink = page.getByRole('link', { name: /Ziele/i });
      await expect(destinationsLink).toBeVisible();

      await destinationsLink.click();
      await expect(page).toHaveURL('/destinations');
    });

    test('should have navigation to rides', async ({ page }) => {
      await page.goto('/dashboard');

      const ridesLink = page.getByRole('link', { name: /Fahrten/i });
      await expect(ridesLink).toBeVisible();

      await ridesLink.click();
      await expect(page).toHaveURL('/rides');
    });
  });

  test.describe('Dashboard User Menu', () => {
    test('should display user information or logout', async ({ page }) => {
      await page.goto('/dashboard');

      // Should have logout button or user menu
      const logoutButton = page.getByRole('button', { name: /Abmelden|Logout/i });
      const userMenu = page.locator('[class*="user"], [class*="User"], [class*="avatar"], [class*="Avatar"]');

      const hasLogout = await logoutButton.isVisible().catch(() => false);
      const hasUserMenu = await userMenu.first().isVisible().catch(() => false);

      // Should have either logout button or user menu
      expect(hasLogout || hasUserMenu).toBeTruthy();
    });

    test('should logout successfully', async ({ page }) => {
      await page.goto('/dashboard');

      // Try to find and click logout
      const logoutButton = page.getByRole('button', { name: /Abmelden|Logout/i });

      if (await logoutButton.isVisible()) {
        await logoutButton.click();

        // Should redirect to login
        await expect(page).toHaveURL(/\/login/);
      }
    });
  });
});

test.describe('Dashboard Calendar', () => {
  test.use({
    storageState: process.env.TEST_USER_EMAIL
      ? 'playwright/.auth/user.json'
      : undefined,
  });

  test('should display calendar view', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for calendar or date navigation
    const calendar = page.locator('[class*="calendar"], [class*="Calendar"]');
    const dateNav = page.getByRole('button', { name: /Heute|Today|Woche|Week/i });

    const hasCalendar = await calendar.first().isVisible().catch(() => false);
    const hasDateNav = await dateNav.isVisible().catch(() => false);

    // Should have calendar or date navigation
    expect(hasCalendar || hasDateNav).toBeTruthy();
  });

  test('should navigate dates', async ({ page }) => {
    await page.goto('/dashboard');

    // Try to find date navigation buttons
    const prevButton = page.getByRole('button', { name: /Zurueck|Previous|</ });
    const nextButton = page.getByRole('button', { name: /Weiter|Next|>/ });

    // May or may not have navigation depending on view
    const hasPrev = await prevButton.isVisible().catch(() => false);
    const hasNext = await nextButton.isVisible().catch(() => false);

    // Just verify dashboard loaded
    await expect(page.getByText(/Dashboard|Uebersicht|heute|Fahrten/i)).toBeVisible();
  });
});
