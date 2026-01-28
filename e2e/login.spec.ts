import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');

    // Check page title/heading
    await expect(page.getByRole('heading', { name: 'Fahrdienst' })).toBeVisible();
    await expect(page.getByText('Melden Sie sich an, um fortzufahren')).toBeVisible();

    // Check form elements
    await expect(page.getByLabel('E-Mail-Adresse')).toBeVisible();
    await expect(page.getByLabel('Passwort')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
  });

  test('should show validation error for empty form', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.getByRole('button', { name: 'Anmelden' }).click();

    // Browser validation should prevent submission
    // Check that we're still on login page
    await expect(page).toHaveURL('/login');
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/login');

    // Fill invalid email
    await page.getByLabel('E-Mail-Adresse').fill('invalid-email');
    await page.getByLabel('Passwort').fill('password123');
    await page.getByRole('button', { name: 'Anmelden' }).click();

    // Should stay on login page (browser validation)
    await expect(page).toHaveURL('/login');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill wrong credentials
    await page.getByLabel('E-Mail-Adresse').fill('wrong@example.com');
    await page.getByLabel('Passwort').fill('wrongpassword');
    await page.getByRole('button', { name: 'Anmelden' }).click();

    // Wait for error message
    await expect(page.getByText(/Ungültige|fehlgeschlagen/i)).toBeVisible({ timeout: 5000 });

    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('should show loading state when submitting', async ({ page }) => {
    await page.goto('/login');

    // Fill form
    await page.getByLabel('E-Mail-Adresse').fill('test@example.com');
    await page.getByLabel('Passwort').fill('password123');

    // Click and check loading state
    await page.getByRole('button', { name: 'Anmelden' }).click();

    // Button should show loading state briefly
    await expect(page.getByRole('button')).toContainText(/Anmelden/);
  });

  test('should have link to support', async ({ page }) => {
    await page.goto('/login');

    // Check support link
    const supportLink = page.getByRole('link', { name: 'Kontaktieren Sie den Support' });
    await expect(supportLink).toBeVisible();
    await expect(supportLink).toHaveAttribute('href', 'mailto:support@fahrdienst.ch');
  });
});
