import { test, expect } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header').getByText('PetNexus PetMayday', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /^EMERGENCY ASSIST$/ })).toBeVisible();
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
