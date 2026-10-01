import { expect, test } from '@playwright/test';

test('AD-17 test hook is present in the test build: frozen, exposes loaded, current and dictionaryState', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  const hook = await page.evaluate(() => {
    const value = window.__wordcell;
    return value === undefined
      ? null
      : {
          frozen: Object.isFrozen(value),
          keys: Reflect.ownKeys(value).map(String).sort(),
          kind: value.current().kind,
        };
  });
  expect(hook).toEqual({
    frozen: true,
    keys: ['current', 'dictionaryState', 'loaded'],
    kind: 'active',
  });
});
