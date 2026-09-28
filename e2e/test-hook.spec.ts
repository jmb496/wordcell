import { expect, test } from '@playwright/test';

test('AD-17 test hook is present under the dev server: frozen, no own keys', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  const hook = await page.evaluate(() => {
    const value = window.__wordcell;
    return value === undefined
      ? null
      : { frozen: Object.isFrozen(value), keys: Reflect.ownKeys(value).length };
  });
  expect(hook).toEqual({ frozen: true, keys: 0 });
});
