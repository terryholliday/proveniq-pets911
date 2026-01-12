import { expect, test } from '@playwright/test';

async function stubGeolocationDenied(page: import('@playwright/test').Page) {
  await page.addInitScript({
    content: `
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (_success, error) => {
            if (typeof error === 'function') {
              error({ code: 1, message: 'User denied Geolocation' });
            }
          },
          watchPosition: () => 0,
          clearWatch: () => {},
        },
      });
    `,
  });
}

test('emergency flow: select county -> critical routing', async ({ page }) => {
  await stubGeolocationDenied(page);
  await page.goto('/emergency');

  await expect(page.getByText('Offline Mode - Changes will sync when connected')).toBeHidden();
  await page.locator('select').selectOption('GREENBRIER');
  await expect(page.getByText("What is the animal's condition?")).toBeVisible();

  await page.getByRole('button', { name: /^CRITICAL/ }).click();
  await expect(page.getByText('CRITICAL EMERGENCY - Urgent Humane Care Required')).toBeVisible();
});

test('emergency flow: select county -> injured stable routing', async ({ page }) => {
  await stubGeolocationDenied(page);
  await page.goto('/emergency');

  await expect(page.getByText('Offline Mode - Changes will sync when connected')).toBeHidden();
  await page.locator('select').selectOption('KANAWHA');
  await expect(page.getByText("What is the animal's condition?")).toBeVisible();

  await page.getByRole('button', { name: /INJURED\s*-\s*STABLE/i }).click();
  await expect(page.getByText('Animal needs care but is stable. Contact options below.')).toBeVisible();
  await expect(page.getByText('Can You Transport the Animal?')).toBeVisible();
});

test('emergency flow: select county -> healthy routing', async ({ page }) => {
  await stubGeolocationDenied(page);
  await page.goto('/emergency');

  await expect(page.getByText('Offline Mode - Changes will sync when connected')).toBeHidden();
  await page.locator('select').selectOption('GREENBRIER');
  await expect(page.getByText("What is the animal's condition?")).toBeVisible();

  await page.getByRole('button', { name: /^HEALTHY/ }).click();
  await expect(page.getByText('Animal appears healthy. Options to report or assist below.')).toBeVisible();
});

test('emergency flow: select county -> deceased routing', async ({ page }) => {
  await stubGeolocationDenied(page);
  await page.goto('/emergency');

  await expect(page.getByText('Offline Mode - Changes will sync when connected')).toBeHidden();
  await page.locator('select').selectOption('GREENBRIER');
  await expect(page.getByText("What is the animal's condition?")).toBeVisible();

  await page.getByRole('button', { name: /^DECEASED/ }).click();
  await expect(page.getByText(/Respectful Handling Required/i)).toBeVisible();
});
