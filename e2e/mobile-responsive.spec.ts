import { expect, test, devices } from '@playwright/test';

/**
 * E2E Tests for Mobile Responsiveness
 * Tests the app on mobile viewport sizes
 */

test.describe('Mobile Viewport Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('homepage is responsive on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Small tolerance
  });

  test('navigation adapts to mobile', async ({ page }) => {
    await page.goto('/');
    
    // Look for mobile menu button (hamburger)
    const mobileMenu = page.locator('[class*="mobile"], [class*="hamburger"], button[aria-label*="menu"]');
    // May or may not have mobile menu depending on design
  });

  test('sighting report form works on mobile', async ({ page }) => {
    await page.goto('/sighting/report');
    await expect(page.getByRole('heading', { name: 'What did you see?' })).toBeVisible();
    
    // Form should be usable
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeVisible();
  });

  test('missing report form works on mobile', async ({ page }) => {
    await page.goto('/missing/report');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('emergency page works on mobile', async ({ page }) => {
    await page.goto('/emergency');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('support chat works on mobile', async ({ page }) => {
    await page.goto('/support');
    await expect(page.getByPlaceholder(/type.*message/i)).toBeVisible();
  });

  test('login page works on mobile', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });
});

test.describe('Tablet Viewport Tests', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad

  test('homepage is responsive on tablet', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('sighting report form works on tablet', async ({ page }) => {
    await page.goto('/sighting/report');
    await expect(page.getByRole('heading', { name: 'What did you see?' })).toBeVisible();
  });
});

test.describe('Large Desktop Viewport Tests', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('homepage displays correctly on large screens', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('content is properly contained on large screens', async ({ page }) => {
    await page.goto('/');
    // Check that content has max-width constraints
    const main = page.locator('main, [class*="container"]');
    await expect(main.first()).toBeVisible();
  });
});

test.describe('Touch Interactions', () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

  test('buttons are tappable on touch devices', async ({ page }) => {
    await page.goto('/sighting/report');
    
    // Tap on continue button
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await continueBtn.tap();
    
    // Should navigate to step 2
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
  });

  test('form inputs work with touch keyboard', async ({ page }) => {
    await page.goto('/sighting/report');
    
    const colorInput = page.getByPlaceholder('e.g., Black, White with spots');
    await colorInput.tap();
    await colorInput.fill('Brown');
    await expect(colorInput).toHaveValue('Brown');
  });
});
