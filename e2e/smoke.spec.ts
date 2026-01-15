import { test, expect } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  // Check page loaded with main content
  await expect(page.locator('body')).not.toBeEmpty();
  // Look for any emergency-related link
  const emergencyLink = page.getByRole('link', { name: /emergency/i }).first();
  await expect(emergencyLink).toBeVisible();
});

test('emergency finder assist renders', async ({ page }) => {
  await page.goto('/emergency');
  await expect(page.getByRole('heading', { name: 'Emergency Finder Assist' })).toBeVisible();
  await expect(page.getByText('Please select your county')).toBeVisible();
});

test('support companion renders', async ({ page }) => {
  await page.goto('/support');
  await expect(page.getByPlaceholder('Type your message...')).toBeVisible();
});
