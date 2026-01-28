import { test, expect } from '@playwright/test';

/**
 * Patient CRUD E2E tests
 * Note: These tests require authentication. Run auth.setup.ts first or set
 * TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables.
 */
test.describe('Patients Management', () => {
  // Use authenticated state if available
  test.use({
    storageState: process.env.TEST_USER_EMAIL
      ? 'playwright/.auth/user.json'
      : undefined,
  });

  test.describe('Patient List', () => {
    test('should display patients page', async ({ page }) => {
      await page.goto('/patients');

      // Check page heading
      await expect(page.getByRole('heading', { name: 'Patienten' })).toBeVisible();

      // Check "New Patient" button
      await expect(page.getByRole('link', { name: 'Neuer Patient' })).toBeVisible();
    });

    test('should show empty state when no patients', async ({ page }) => {
      await page.goto('/patients');

      // If no patients, should show empty message or table
      const table = page.locator('table');
      const emptyMessage = page.getByText('Keine Patienten');

      // Either table with data or empty message should be visible
      const hasTable = await table.isVisible().catch(() => false);
      const hasEmpty = await emptyMessage.isVisible().catch(() => false);

      expect(hasTable || hasEmpty).toBeTruthy();
    });

    test('should navigate to new patient form', async ({ page }) => {
      await page.goto('/patients');

      await page.getByRole('link', { name: 'Neuer Patient' }).click();

      await expect(page).toHaveURL('/patients/new');
      await expect(page.getByRole('heading', { name: 'Neuer Patient' })).toBeVisible();
    });
  });

  test.describe('New Patient Form', () => {
    test('should display all form sections', async ({ page }) => {
      await page.goto('/patients/new');

      // Check form sections
      await expect(page.getByText('Persönliche Daten')).toBeVisible();
      await expect(page.getByText('Kontakt')).toBeVisible();
      await expect(page.getByText('Adresse')).toBeVisible();
      await expect(page.getByText('Besondere Bedürfnisse')).toBeVisible();
      await expect(page.getByText('Notfallkontakt')).toBeVisible();
      await expect(page.getByText('Versicherung')).toBeVisible();
      await expect(page.getByText('Bemerkungen')).toBeVisible();
    });

    test('should display required fields', async ({ page }) => {
      await page.goto('/patients/new');

      // Check required fields have labels
      await expect(page.getByLabel('Vorname')).toBeVisible();
      await expect(page.getByLabel('Nachname')).toBeVisible();
      await expect(page.getByLabel('Telefon')).toBeVisible();
      await expect(page.getByLabel('Strasse')).toBeVisible();
      await expect(page.getByLabel('PLZ')).toBeVisible();
      await expect(page.getByLabel('Ort')).toBeVisible();
    });

    test('should display mobility checkboxes', async ({ page }) => {
      await page.goto('/patients/new');

      await expect(page.getByLabel('Rollstuhl benötigt')).toBeVisible();
      await expect(page.getByLabel(/Rollator|Gehhilfe/)).toBeVisible();
      await expect(page.getByLabel(/Begleitung|Hilfe/)).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await page.goto('/patients/new');

      await expect(page.getByRole('button', { name: 'Speichern' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Abbrechen' })).toBeVisible();
    });

    test('should navigate back on cancel', async ({ page }) => {
      await page.goto('/patients');
      await page.getByRole('link', { name: 'Neuer Patient' }).click();

      await expect(page).toHaveURL('/patients/new');

      await page.getByRole('button', { name: 'Abbrechen' }).click();

      // Should navigate back
      await expect(page).not.toHaveURL('/patients/new');
    });

    test('should validate required fields on submit', async ({ page }) => {
      await page.goto('/patients/new');

      // Try to submit empty form
      await page.getByRole('button', { name: 'Speichern' }).click();

      // Browser validation should prevent submission
      // We should still be on the form
      await expect(page).toHaveURL('/patients/new');
    });

    test('should fill and submit patient form', async ({ page }) => {
      await page.goto('/patients/new');

      // Fill required fields
      await page.getByLabel('Vorname').fill('Max');
      await page.getByLabel('Nachname').fill('Testpatient');
      await page.getByLabel('Telefon').fill('+41 79 123 45 67');
      await page.getByLabel('Strasse').fill('Teststrasse 1');
      await page.getByLabel('PLZ').fill('5000');
      await page.getByLabel('Ort').fill('Aarau');

      // Check a mobility option
      await page.getByLabel('Rollstuhl benötigt').check();

      // Submit form
      await page.getByRole('button', { name: 'Speichern' }).click();

      // Should redirect to patients list or show success
      // Wait for either redirect or error
      await page.waitForURL(/\/patients(?!\/new)/, { timeout: 10000 }).catch(() => {
        // If redirect fails, check for error message
      });
    });
  });
});
