import { expect, test } from '@playwright/test';

test('compare: a deep-linked comparison renders both foods side by side', async ({ page }) => {
  await page.goto('/compare?items=kiwi,orange');

  // Both foods appear as column headers (links to their item pages).
  await expect(page.getByRole('link', { name: /Kiwi/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Orange/ })).toBeVisible();

  // The comparison table has the shared rows (target table cells, not the page intro).
  await expect(page.getByRole('cell', { name: 'Key benefits' })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Nutrients \(per 100g/ })).toBeVisible();
});
