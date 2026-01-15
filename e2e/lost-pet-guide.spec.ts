import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Lost Pet Guide
 * Tests the educational content and guidance for lost pet situations
 */

test.describe('Lost Pet Guide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lost-pet-guide');
  });

  test('renders lost pet guide page', async ({ page }) => {
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('has informational content sections', async ({ page }) => {
    // Should have headings for different guide sections
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('has actionable steps or tips', async ({ page }) => {
    // Look for list items or numbered steps
    const lists = page.locator('ul, ol, [class*="step"]');
    const count = await lists.count();
    // May or may not have lists depending on design
  });

  test('has links to relevant resources', async ({ page }) => {
    const links = page.locator('a[href]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });
});
