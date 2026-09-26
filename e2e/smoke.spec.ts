import { expect, test } from '@playwright/test';

test('renders the placeholder board with 52 cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  await expect(page.locator('.card')).toHaveCount(52);
  await expect(page.getByTestId('column-1').locator('.card')).toHaveCount(7);
  await expect(page.getByTestId('column-8').locator('.card')).toHaveCount(6);
});
