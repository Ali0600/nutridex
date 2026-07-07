import { expect, test } from '@playwright/test';

test('quiz: pick a problem, answer questions, reach recommendations', async ({ page }) => {
  await page.goto('/quiz');

  // Step 1 — pick a problem.
  await page.getByRole('checkbox').first().check();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 2 — if the chosen problem has symptom questions, answer each (strongest option)
  // and continue; otherwise we're already at the results step.
  const seeMyFoods = page.getByRole('button', { name: 'See my foods' });
  if (await seeMyFoods.isVisible().catch(() => false)) {
    const fieldsets = page.locator('fieldset');
    for (let i = 0; i < (await fieldsets.count()); i++) {
      await fieldsets.nth(i).getByRole('radio').last().check({ force: true });
    }
    await seeMyFoods.click();
  }

  // Step 3 — results.
  await expect(page.getByRole('heading', { name: 'Foods worth a look' })).toBeVisible();
});
