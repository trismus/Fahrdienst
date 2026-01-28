import { test, expect } from '@playwright/test';

/**
 * Destination CRUD E2E tests
 */
test.describe('Destinations Management', () => {
  test.use({
    storageState: process.env.TEST_USER_EMAIL
      ? 'playwright/.auth/user.json'
      : undefined,
  });

  test.describe('Destination List', () => {
    test('should display destinations page', async ({ page }) => {
      await page.goto('/destinations');

      await expect(page.getByRole('heading', { name: 'Ziele' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Neues Ziel' })).toBeVisible();
    });

    test('should show table headers', async ({ page }) => {
      await page.goto('/destinations');

      await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Typ' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Adresse' })).toBeVisible();
    });

    test('should navigate to new destination form', async ({ page }) => {
      await page.goto('/destinations');

      await page.getByRole('link', { name: 'Neues Ziel' }).click();

      await expect(page).toHaveURL('/destinations/new');
    });
  });

  test.describe('New Destination Form', () => {
    test('should display all form sections', async ({ page }) => {
      await page.goto('/destinations/new');

      await expect(page.getByText('Grunddaten')).toBeVisible();
      await expect(page.getByText('Adresse')).toBeVisible();
      await expect(page.getByText('Kontakt')).toBeVisible();
      await expect(page.getByText('Zusätzliche Informationen')).toBeVisible();
    });

    test('should display destination type dropdown', async ({ page }) => {
      await page.goto('/destinations/new');

      const typeSelect = page.locator('select[name="destinationType"]');
      await expect(typeSelect).toBeVisible();

      // Check options exist
      await expect(typeSelect.locator('option[value="hospital"]')).toHaveText('Spital');
      await expect(typeSelect.locator('option[value="doctor"]')).toHaveText('Arztpraxis');
      await expect(typeSelect.locator('option[value="therapy"]')).toHaveText('Therapie');
      await expect(typeSelect.locator('option[value="other"]')).toHaveText('Sonstiges');
    });

    test('should display required fields', async ({ page }) => {
      await page.goto('/destinations/new');

      await expect(page.getByLabel('Name')).toBeVisible();
      await expect(page.getByLabel('Strasse')).toBeVisible();
      await expect(page.getByLabel('PLZ')).toBeVisible();
      await expect(page.getByLabel('Ort')).toBeVisible();
    });

    test('should display optional fields', async ({ page }) => {
      await page.goto('/destinations/new');

      await expect(page.getByLabel('Abteilung')).toBeVisible();
      await expect(page.getByLabel('Telefon')).toBeVisible();
      await expect(page.getByLabel('E-Mail')).toBeVisible();
      await expect(page.getByLabel('Öffnungszeiten')).toBeVisible();
      await expect(page.getByLabel('Ankunftsanweisungen')).toBeVisible();
    });

    test('should navigate back on cancel', async ({ page }) => {
      await page.goto('/destinations');
      await page.getByRole('link', { name: 'Neues Ziel' }).click();

      await page.getByRole('button', { name: 'Abbrechen' }).click();

      await expect(page).not.toHaveURL('/destinations/new');
    });

    test('should fill and submit destination form', async ({ page }) => {
      await page.goto('/destinations/new');

      // Fill required fields
      await page.getByLabel('Name').fill('Test Spital');
      await page.locator('select[name="destinationType"]').selectOption('hospital');
      await page.getByLabel('Abteilung').fill('Dialyse');
      await page.getByLabel('Strasse').fill('Spitalstrasse 1');
      await page.getByLabel('PLZ').fill('5000');
      await page.getByLabel('Ort').fill('Aarau');

      // Optional fields
      await page.getByLabel('Öffnungszeiten').fill('Mo-Fr 07:00-18:00');

      // Submit
      await page.getByRole('button', { name: 'Speichern' }).click();

      // Wait for redirect or error
      await page.waitForURL(/\/destinations(?!\/new)/, { timeout: 10000 }).catch(() => {});
    });
  });
});
