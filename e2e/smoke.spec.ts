import { expect, test } from '@playwright/test';

test('AD-17 placeholder board renders 52 live card elements with AD-14 attributes', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  const cards = page.getByTestId(/^card-\d+$/);
  await expect(cards).toHaveCount(52);
  const ids: number[] = [];
  for (const card of await cards.all()) {
    const testId = await card.getAttribute('data-testid');
    const id = Number(testId?.slice('card-'.length));
    expect(await card.getAttribute('data-card-id')).toBe(String(id));
    expect(await card.getAttribute('data-place')).toBe('column');
    ids.push(id);
  }
  expect(new Set(ids)).toEqual(new Set(Array.from({ length: 52 }, (_, i) => i)));
  await expect(page.getByTestId('column-1').getByTestId(/^card-\d+$/)).toHaveCount(7);
  await expect(page.getByTestId('column-8').getByTestId(/^card-\d+$/)).toHaveCount(6);
  await expect(page.getByTestId('app')).toHaveCount(0);
  await expect(page.getByText('Seed 1', { exact: false })).toBeVisible();
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expect(page.locator('[data-mirror-of]')).toHaveCount(0);
});
