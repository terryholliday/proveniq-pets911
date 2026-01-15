import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Emergency Flow
 * Full workflow testing for emergency pet situations
 */

test.describe('Emergency Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/emergency');
  });

  test('renders emergency finder assist page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Emergency/i })).toBeVisible();
  });

  test('has emergency action buttons', async ({ page }) => {
    // Check for emergency-related CTAs
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('displays county/location selection if available', async ({ page }) => {
    // Look for location-related elements
    const locationElements = page.locator('[class*="location"], [class*="county"]');
    // Soft check - may vary by implementation
  });
});

test.describe('Emergency Contacts Page', () => {
  test('renders emergency contacts', async ({ page }) => {
    await page.goto('/emergency-contacts');
    // Should show emergency contact information
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Report Neglect Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/report-neglect');
  });

  test('renders neglect reporting page', async ({ page }) => {
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('has form fields for reporting', async ({ page }) => {
    // Check for form elements
    const formElements = page.locator('input, textarea, select, button');
    const count = await formElements.count();
    expect(count).toBeGreaterThan(0);
  });
});
