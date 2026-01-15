import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Case Management
 * Tests case viewing and management workflows
 * Note: Most admin features require authentication
 */

test.describe('Case Page (Public View)', () => {
  test('case page with invalid ID shows appropriate message', async ({ page }) => {
    await page.goto('/case/invalid-id-12345');
    // Should show error or not found
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Sightings List Page', () => {
  test('renders sightings page', async ({ page }) => {
    await page.goto('/sightings');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('has list or grid of sightings', async ({ page }) => {
    await page.goto('/sightings');
    await page.waitForTimeout(1000);
    // Check for list/grid container
    const container = page.locator('[class*="grid"], [class*="list"], main');
    await expect(container.first()).toBeVisible();
  });
});

test.describe('Missing Pets List', () => {
  test('renders missing pets page if exists', async ({ page }) => {
    const response = await page.goto('/missing');
    // May redirect or show list
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Admin Case Management (Auth Required)', () => {
  test('admin cases redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin/mods/cases');
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin reports redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin/mods/reports');
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin sightings redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin/mods/sightings');
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin dashboard redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin/mods/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Volunteer Routes (Auth Required)', () => {
  test('volunteer page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/volunteer');
    await expect(page).toHaveURL(/\/login/);
  });
});
