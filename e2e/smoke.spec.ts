import { expect, test } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header').getByText('PetMayday', { exact: true })).toBeVisible();
});

test('privacy policy renders', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: /Fail-Closed Privacy/i })).toBeVisible();
});

test('terms of service renders', async ({ page }) => {
  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
});

test('training page prompts sign-in when unauthenticated', async ({ page }) => {
  await page.goto('/training');
  await expect(page.getByText('Please sign in to access training modules.', { exact: true })).toBeVisible();
});

test('sysop route redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/admin/sysop');
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

