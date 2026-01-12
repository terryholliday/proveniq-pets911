import { expect, test } from '@playwright/test';

test('privacy policy renders', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
});

test('terms of service renders', async ({ page }) => {
  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
});

test('resources page renders', async ({ page }) => {
  await page.goto('/resources');
  await expect(page.getByRole('heading', { name: 'Pet Resources & Support' })).toBeVisible();
});

test('about page renders', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'About Pet911' })).toBeVisible();
});

test('help & safety page renders', async ({ page }) => {
  await page.goto('/help/safety');
  await expect(page.getByRole('heading', { name: 'Help & Safety' })).toBeVisible();
});

test('home CTA navigates to emergency', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /^EMERGENCY ASSIST$/ }).click();
  await expect(page).toHaveURL(/\/emergency$/);
  await expect(page.getByRole('heading', { name: 'Emergency Finder Assist' })).toBeVisible();
});

test('home footer link navigates to support', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /^Support Companion$/ }).first().click();
  await expect(page).toHaveURL(/\/support$/);
  await expect(page.getByPlaceholder('Type your message...')).toBeVisible();
});

test('sysop route redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/admin/sysop');
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
});

test('moderator route redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/admin/mods');
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
});

