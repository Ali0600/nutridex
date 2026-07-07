import { expect, test } from '@playwright/test';

test('browse: organ index → detail → breadcrumb back', async ({ page }) => {
  await page.goto('/organs');
  await expect(page.getByRole('heading', { name: 'Browse by body part' })).toBeVisible();

  // Open a body-part detail page from the index.
  await page.getByRole('link', { name: /Heart & circulation/ }).click();
  await expect(page).toHaveURL(/\/organs\/heart$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // The breadcrumb returns to the index.
  await page.getByRole('link', { name: '← All body parts' }).click();
  await expect(page).toHaveURL(/\/organs$/);
  await expect(page.getByRole('heading', { name: 'Browse by body part' })).toBeVisible();
});

test('browse: every collection index route is reachable and lists entries', async ({ page }) => {
  for (const [path, heading] of [
    ['/categories', 'Browse by category'],
    ['/organs', 'Browse by body part'],
    ['/goals', 'Browse by goal'],
    ['/nutrients', 'Browse by nutrient'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    // Each index links to at least one of its own detail pages.
    await expect(page.locator(`a[href^="${path}/"]`).first()).toBeVisible();
  }
});
