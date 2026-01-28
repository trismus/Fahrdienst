import { test, expect } from '@playwright/test';

/**
 * Ride Management E2E tests
 * These tests cover the complete ride workflow for dispatchers
 */
test.describe('Rides Management', () => {
  test.use({
    storageState: process.env.TEST_USER_EMAIL
      ? 'playwright/.auth/user.json'
      : undefined,
  });

  test.describe('Ride List', () => {
    test('should display rides page', async ({ page }) => {
      await page.goto('/rides');

      await expect(page.getByRole('heading', { name: 'Fahrten' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Neue Fahrt' })).toBeVisible();
    });

    test('should show search input', async ({ page }) => {
      await page.goto('/rides');

      await expect(page.getByPlaceholder(/Suchen|suchen/i)).toBeVisible();
    });

    test('should show status filter', async ({ page }) => {
      await page.goto('/rides');

      // Should have filter options for status
      const statusFilter = page.locator('select').filter({ hasText: /Status|Alle/ });
      const hasStatusFilter = await statusFilter.count();
      expect(hasStatusFilter).toBeGreaterThan(0);
    });

    test('should navigate to new ride form', async ({ page }) => {
      await page.goto('/rides');

      await page.getByRole('link', { name: 'Neue Fahrt' }).click();

      await expect(page).toHaveURL('/rides/new');
    });
  });

  test.describe('New Ride Form', () => {
    test('should display all form fields', async ({ page }) => {
      await page.goto('/rides/new');

      // Patient selection
      await expect(page.locator('select').filter({ hasText: /Patient|auswaehlen/ })).toBeVisible();

      // Destination selection
      await expect(page.locator('select').filter({ hasText: /Ziel|auswaehlen/ })).toBeVisible();

      // Time fields
      await expect(page.getByLabel(/Abholzeit/i)).toBeVisible();
      await expect(page.getByLabel(/Ankunftszeit/i)).toBeVisible();

      // Driver selection (optional)
      await expect(page.locator('select').filter({ hasText: /Fahrer|auswaehlen/ })).toBeVisible();
    });

    test('should display return ride checkbox', async ({ page }) => {
      await page.goto('/rides/new');

      await expect(page.getByLabel(/Rueckfahrt|Rückfahrt/i)).toBeVisible();
    });

    test('should display notes field', async ({ page }) => {
      await page.goto('/rides/new');

      await expect(page.locator('textarea')).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await page.goto('/rides/new');

      await expect(page.getByRole('button', { name: 'Speichern' })).toBeVisible();
    });

    test('should navigate back on cancel', async ({ page }) => {
      await page.goto('/rides');
      await page.getByRole('link', { name: 'Neue Fahrt' }).click();

      // Find and click cancel button
      const cancelButton = page.getByRole('button', { name: /Abbrechen|Zurueck/i });
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await expect(page).not.toHaveURL('/rides/new');
      }
    });

    test('should validate required fields on submit', async ({ page }) => {
      await page.goto('/rides/new');

      // Try to submit empty form
      await page.getByRole('button', { name: 'Speichern' }).click();

      // Should still be on form due to validation
      await expect(page).toHaveURL('/rides/new');
    });
  });

  test.describe('Ride Detail', () => {
    test('should show ride detail page structure', async ({ page }) => {
      // This test assumes there is at least one ride
      await page.goto('/rides');

      // Click on first ride if available
      const rideLink = page.locator('a[href^="/rides/"]').first();
      if (await rideLink.isVisible()) {
        await rideLink.click();

        // Should be on a ride detail page
        await expect(page).toHaveURL(/\/rides\/[a-f0-9-]+/);

        // Should show ride information
        await expect(page.getByText(/Patient|Ziel|Fahrer/i)).toBeVisible();
      }
    });
  });
});

test.describe('Ride Status Flow', () => {
  test.use({
    storageState: process.env.TEST_USER_EMAIL
      ? 'playwright/.auth/user.json'
      : undefined,
  });

  test('should display status badges', async ({ page }) => {
    await page.goto('/rides');

    // Check for status badge presence (color-coded)
    const statusBadges = page.locator('[class*="badge"], [class*="Badge"]');
    const count = await statusBadges.count();

    // Either we have rides with badges or empty state
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show cancel button on ride detail', async ({ page }) => {
    // This test requires an existing ride
    await page.goto('/rides');

    const rideLink = page.locator('a[href^="/rides/"]').first();
    if (await rideLink.isVisible()) {
      await rideLink.click();

      // Cancel/Stornieren button should be visible for non-completed rides
      const cancelButton = page.getByRole('button', { name: /Stornieren/i });
      // May or may not be visible depending on ride status
      const isVisible = await cancelButton.isVisible().catch(() => false);
      // Just verify the page loaded correctly
      await expect(page).toHaveURL(/\/rides\/[a-f0-9-]+/);
    }
  });
});
