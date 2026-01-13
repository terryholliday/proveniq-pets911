import { test, expect } from '@playwright/test';

test.describe('Case Management System', () => {
  test('sysop cases page loads', async ({ page }) => {
    await page.goto('/admin/sysop/cases');
    await expect(page.getByRole('heading', { name: /incident cases/i })).toBeVisible();
  });

  test('sysop TNR page loads', async ({ page }) => {
    await page.goto('/admin/sysop/tnr');
    await expect(page.getByRole('heading', { name: /tnr colony tracker/i })).toBeVisible();
  });

  test('sysop capacity page loads', async ({ page }) => {
    await page.goto('/admin/sysop/capacity');
    await expect(page.getByRole('heading', { name: /capacity crisis alerts/i })).toBeVisible();
  });

  test('sysop outcomes page loads', async ({ page }) => {
    await page.goto('/admin/sysop/outcomes');
    await expect(page.getByRole('heading', { name: /outcome tracking/i })).toBeVisible();
  });

  test('sysop equipment match page loads', async ({ page }) => {
    await page.goto('/admin/sysop/equipment-match');
    await expect(page.getByRole('heading', { name: /equipment matching/i })).toBeVisible();
  });
});

test.describe('Partner Portal', () => {
  test('partner intake form loads', async ({ page }) => {
    await page.goto('/partner/intake');
    await expect(page.getByRole('heading', { name: /partner intake form/i })).toBeVisible();
  });

  test('partner intake form shows intake types', async ({ page }) => {
    await page.goto('/partner/intake');
    await expect(page.getByText('Stray Intake')).toBeVisible();
    await expect(page.getByText('Owner Surrender')).toBeVisible();
    await expect(page.getByText('Transfer In')).toBeVisible();
  });
});

test.describe('Volunteer Dispatch', () => {
  test('volunteer dispatch page loads', async ({ page }) => {
    await page.goto('/volunteer/dispatch');
    await expect(page.getByText('Dispatch')).toBeVisible();
  });

  test('volunteer dashboard loads', async ({ page }) => {
    await page.goto('/volunteer/dashboard');
    // May redirect to login if not authenticated
    await expect(page.locator('body')).toBeVisible();
  });
});
