import { expect, test } from '@playwright/test';

test('search → results → item page', async ({ page }) => {
  await page.goto('/');

  // The header search box drives /items?q=…
  await page.getByRole('searchbox', { name: 'Search foods' }).fill('iron');
  await page.getByRole('searchbox', { name: 'Search foods' }).press('Enter');

  await expect(page).toHaveURL(/\/items\?q=iron/);
  await expect(page.getByRole('heading', { name: /Search:/ })).toBeVisible();

  // Result cards link to /items/<slug>; open the first one.
  const firstResult = page.locator('a[href^="/items/"]').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  await expect(page).toHaveURL(/\/items\/[a-z0-9-]+$/);
  // Every item page renders the food name as an <h1> and a benefits section.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Benefits/ })).toBeVisible();
});
