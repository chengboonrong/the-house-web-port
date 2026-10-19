import { test, expect } from '@playwright/test';

test('preloads animated scene, advances interactions and navigates between rooms', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#stage img[data-layer-id="room"]')).toBeVisible();
  await expect(page.locator('#stage img[data-layer-id="flicker"]')).toBeVisible();
  await expect(page.locator('#status')).toContainText('Tap the picture frame.');
  await page.getByRole('button', { name: 'INSPECT FRAME' }).click();
  await expect(page.locator('#status')).toContainText('mark appears');
  await expect(page.locator('#stage img[data-layer-id="mark"]')).toBeVisible();
  await page.getByRole('button', { name: 'GO TO HALL' }).click();
  await expect(page.locator('#stage')).toHaveAttribute('aria-label', 'Scene test-hall');
  await expect(page.locator('#stage img[data-layer-id="hall"]')).toBeVisible();
  await page.getByRole('button', { name: 'GO TO HALL' }).click();
  await expect(page.locator('#stage')).toHaveAttribute('aria-label', 'Scene test-room');
});

test('saves a stable state and restores it after reset', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('Tap the picture frame.');
  await page.getByRole('button', { name: 'INSPECT FRAME' }).click();
  await expect(page.locator('#status')).toContainText('mark appears');
  await page.getByRole('button', { name: 'SAVE', exact: true }).click();
  await expect(page.locator('#status')).toContainText('Checkpoint saved');
  await page.getByRole('button', { name: 'RESET' }).click();
  await expect(page.locator('#stage img[data-layer-id="mark"]')).toBeHidden();
  await page.getByRole('button', { name: 'RESUME' }).click();
  await expect(page.locator('#stage img[data-layer-id="mark"]')).toBeVisible();
  await page.locator('.debug-panel summary').click();
  await expect(page.locator('#debug-status')).toContainText('"frameClicks": 1');
});

test('animation uses image-frame sources and debugger records activity', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#stage img[data-layer-id="flicker"]')).toBeVisible();
  const image = page.locator('#stage img[data-layer-id="flicker"]');
  const first = await image.getAttribute('src');
  await expect.poll(() => image.getAttribute('src'), { timeout: 3_000 }).not.toBe(first);
  await page.getByRole('button', { name: 'INSPECT FRAME' }).click();
  await page.locator('.debug-panel summary').click();
  await expect(page.locator('#debug-trace')).toContainText('"event": "click"');
});
