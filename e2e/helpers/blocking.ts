import { expect, type Page } from '@playwright/test';

// AD-15/Q-38 blocking-message reads shared by the blocking, lifecycle, history and history-notice
// specs.

const ANOTHER_WINDOW = 'WordCell is open in another window.';

// The store's kind through the AD-17 hook (undefined before the hook exists).
export const kind = (page: Page) => page.evaluate(() => window.__wordcell?.current().kind);

// The stored text of `key` (null when absent).
export const stored = (page: Page, key: string) =>
  page.evaluate((k) => localStorage.getItem(k), key);

// The one button on the page is `name`.
export async function expectOnlyButton(page: Page, name: string): Promise<void> {
  await expect(page.getByRole('button')).toHaveCount(1);
  await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
}

// Q-38: the another-window message is the one alertdialog, with Reload its only button, and the
// store is halted.
export async function expectAnotherWindow(page: Page): Promise<void> {
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toHaveCount(1);
  await expect(dialog.getByRole('heading', { name: ANOTHER_WINDOW, exact: true })).toBeVisible();
  await expect(dialog).toHaveAccessibleName(ANOTHER_WINDOW);
  await expect(dialog).toHaveAccessibleDescription('');
  await expectOnlyButton(page, 'Reload');
  expect(await kind(page)).toBe('halted');
}
