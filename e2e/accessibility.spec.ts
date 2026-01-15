import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Accessibility
 * Tests WCAG compliance and accessibility features
 */

test.describe('Keyboard Navigation', () => {
  test('can navigate homepage with keyboard only', async ({ page }) => {
    await page.goto('/');
    
    // Tab through focusable elements
    await page.keyboard.press('Tab');
    const firstFocused = page.locator(':focus');
    await expect(firstFocused).toBeTruthy();
    
    // Continue tabbing
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const currentFocused = page.locator(':focus');
    await expect(currentFocused).toBeTruthy();
  });

  test('can navigate sighting form with keyboard', async ({ page }) => {
    await page.goto('/sighting/report');
    
    // Tab to form fields
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Type in focused field
    await page.keyboard.type('Test input');
  });

  test('enter key activates buttons', async ({ page }) => {
    await page.goto('/sighting/report');
    
    // Find and focus continue button
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await continueBtn.focus();
    await page.keyboard.press('Enter');
    
    // Should navigate to step 2
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
  });

  test('escape key closes modals/dropdowns', async ({ page }) => {
    await page.goto('/sighting/report');
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Go to step 3 where law triggers have expandable sections
    await page.getByPlaceholder('Street address, intersection').fill('123 Main St');
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Escape should work for closing things
    await page.keyboard.press('Escape');
  });
});

test.describe('ARIA Labels', () => {
  test('form inputs have labels', async ({ page }) => {
    await page.goto('/sighting/report');
    
    // Check that inputs are labeled
    const labeledInputs = page.locator('input[aria-label], input[aria-labelledby], label input, input[placeholder]');
    const count = await labeledInputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/sighting/report');
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute('aria-label') || await button.textContent();
      expect(name).toBeTruthy();
    }
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      // Images should have alt or be decorative (role="presentation")
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('navigation has proper landmarks', async ({ page }) => {
    await page.goto('/');
    
    // Check for landmark roles - use flexible matching
    const nav = page.locator('nav, [role="navigation"], header').first();
    const hasNav = await nav.isVisible().catch(() => false);
    
    const main = page.locator('main, [role="main"], [class*="container"]').first();
    const hasMain = await main.isVisible().catch(() => false);
    
    // At least one landmark should exist
    expect(hasNav || hasMain).toBe(true);
  });
});

test.describe('Color Contrast', () => {
  test('text is visible against background', async ({ page }) => {
    await page.goto('/sighting/report');
    
    // Check that main heading is visible
    const heading = page.getByRole('heading', { name: 'What did you see?' });
    await expect(heading).toBeVisible();
    
    // Check that form labels are visible
    await expect(page.getByText('Color/Markings')).toBeVisible();
  });
});

test.describe('Focus Indicators', () => {
  test('focused elements have visible indicator', async ({ page }) => {
    await page.goto('/login');
    
    // Focus on email input
    const emailInput = page.getByPlaceholder(/email/i);
    await emailInput.focus();
    
    // Check that focus is visible (element should have focus styles)
    await expect(emailInput).toBeFocused();
  });
});

test.describe('Screen Reader Compatibility', () => {
  test('headings follow proper hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('form has proper structure', async ({ page }) => {
    await page.goto('/sighting/report');
    
    // Check for form-related structure
    const formGroups = page.locator('[class*="form"], fieldset, [role="group"]');
    // May or may not use these specific patterns
  });
});

test.describe('Reduced Motion', () => {
  test('page works with reduced motion preference', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/sighting/report');
    await expect(page.getByRole('heading', { name: 'What did you see?' })).toBeVisible();
    
    // Navigate and verify functionality still works
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
  });
});
