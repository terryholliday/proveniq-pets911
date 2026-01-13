import { expect, test } from '@playwright/test';

test('admin mods route redirects to dispatch queue', async ({ page }) => {
  await page.goto('/admin/mods');
  await expect(page).toHaveURL(/\/admin\/mods\/dispatch/);
});

test('moderator dispatch queue prompts sign-in when unauthenticated', async ({ page }) => {
  await page.goto('/admin/mods/dispatch');
  await expect(page.getByText('Please sign in to access the moderator dispatch queue.')).toBeVisible();
});

test('volunteer apply prompts sign-in when unauthenticated', async ({ page }) => {
  await page.goto('/volunteer/apply');
  await expect(page.getByRole('heading', { name: 'Volunteer Application' })).toBeVisible();
  await expect(page.getByText('Sign in to start or continue your volunteer application.')).toBeVisible();
});

test('training content page renders (unauthenticated)', async ({ page }) => {
  await page.goto('/training/vol101/orientation');
  await expect(page.getByText('Content Placeholder')).toBeVisible();
});

test('login page supports magic link mode', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="password"]')).toHaveCount(1);

  await page.getByRole('button', { name: 'Magic Link' }).click();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Send magic link' })).toBeVisible();
});

test('home page exposes key CTAs', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header').getByText('PetMayday', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Volunteer Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Launch App' })).toBeVisible();
});

