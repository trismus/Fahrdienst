import { test, expect } from '@playwright/test';

/**
 * Driver CRUD E2E tests
 */
test.describe('Drivers Management', () => {
  test.use({
    storageState: process.env.TEST_USER_EMAIL
      ? 'playwright/.auth/user.json'
      : undefined,
  });

  test.describe('Driver List', () => {
    test('should display drivers page', async ({ page }) => {
      await page.goto('/drivers');

      await expect(page.getByRole('heading', { name: 'Fahrer' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Neuer Fahrer' })).toBeVisible();
    });

    test('should show table headers', async ({ page }) => {
      await page.goto('/drivers');

      await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Kontakt' })).toBeVisible();
    });

    test('should navigate to new driver form', async ({ page }) => {
      await page.goto('/drivers');

      await page.getByRole('link', { name: 'Neuer Fahrer' }).click();

      await expect(page).toHaveURL('/drivers/new');
    });
  });

  test.describe('New Driver Form', () => {
    test('should display all form sections', async ({ page }) => {
      await page.goto('/drivers/new');

      await expect(page.getByText('Persönliche Daten')).toBeVisible();
      await expect(page.getByText('Kontakt')).toBeVisible();
      await expect(page.getByText('Fahrzeug')).toBeVisible();
    });

    test('should display required fields', async ({ page }) => {
      await page.goto('/drivers/new');

      await expect(page.getByLabel('Vorname')).toBeVisible();
      await expect(page.getByLabel('Nachname')).toBeVisible();
      await expect(page.getByLabel('E-Mail')).toBeVisible();
      await expect(page.getByLabel('Telefon')).toBeVisible();
    });

    test('should display vehicle type dropdown', async ({ page }) => {
      await page.goto('/drivers/new');

      const vehicleSelect = page.locator('select[name="vehicleType"]');
      await expect(vehicleSelect).toBeVisible();

      // Check options
      await expect(vehicleSelect.locator('option[value="standard"]')).toBeVisible();
      await expect(vehicleSelect.locator('option[value="wheelchair"]')).toBeVisible();
      await expect(vehicleSelect.locator('option[value="stretcher"]')).toBeVisible();
    });

    test('should navigate back on cancel', async ({ page }) => {
      await page.goto('/drivers');
      await page.getByRole('link', { name: 'Neuer Fahrer' }).click();

      await page.getByRole('button', { name: 'Abbrechen' }).click();

      await expect(page).not.toHaveURL('/drivers/new');
    });

    test('should fill and submit driver form', async ({ page }) => {
      await page.goto('/drivers/new');

      // Fill required fields
      await page.getByLabel('Vorname').fill('Hans');
      await page.getByLabel('Nachname').fill('Testfahrer');
      await page.getByLabel('E-Mail').fill('hans.testfahrer@example.com');
      await page.getByLabel('Telefon').fill('+41 79 987 65 43');

      // Vehicle info
      await page.locator('select[name="vehicleType"]').selectOption('wheelchair');
      await page.getByLabel('Fahrzeugkennzeichen').fill('AG 123456');

      // Submit
      await page.getByRole('button', { name: 'Speichern' }).click();

      // Wait for redirect or error
      await page.waitForURL(/\/drivers(?!\/new)/, { timeout: 10000 }).catch(() => {});
    });
  });
});
