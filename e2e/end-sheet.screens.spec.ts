import { expect, test } from '@playwright/test';
import { openFixture } from './helpers/board';

// Epic 6 ticket 6.6 (build-notes Screens specs): the end sheet expanded (a Give up with the
// penalty line) and collapsed to its bar, at 360 px. Baselines are generated and compared only in
// the Playwright container (npm run test:screens).

test('AD-17 end sheet screenshot expanded at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-gave-up-after-commit', { endSheet: 'expanded' });
  await expect(page.getByRole('dialog', { name: 'Game given up.' })).toBeVisible();
  await expect(page).toHaveScreenshot('end-sheet-expanded.png');
});

test('AD-17 end sheet screenshot collapsed at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-won');
  await expect(page.getByRole('button', { name: /^Show result:/ })).toBeVisible();
  await expect(page).toHaveScreenshot('end-sheet-collapsed.png');
});

// Ticket 6.7: the unreadable-history block (variant history-invalid-version-unknown) and the
// single line after Reset history, at 360 px.
test('AD-17 end sheet screenshot with the history-unreadable block at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-gave-up-after-commit', {
    endSheet: 'expanded',
    history: 'history-invalid-version-unknown',
  });
  await expect(page.getByRole('dialog', { name: 'Game given up.' })).toBeVisible();
  await expect(page.getByText("This game wasn't added to your statistics.")).toBeVisible();
  await expect(page).toHaveScreenshot('end-sheet-history-unreadable.png');
});

test('AD-17 end sheet screenshot with the not-added line at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-gave-up-after-commit', {
    endSheet: 'expanded',
    history: 'history-invalid-version-unknown',
  });
  const sheet = page.getByRole('dialog', { name: 'Game given up.' });
  await sheet.getByRole('button', { name: 'Reset history', exact: true }).click();
  await page.getByRole('button', { name: 'Delete history', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Delete the score history?' })).toHaveCount(0);
  await expect(sheet.getByText("This game wasn't added to your statistics.")).toBeVisible();
  await expect(page).toHaveScreenshot('end-sheet-not-added.png');
});

// Ticket 10.2 (R-88): the Words section scrolled into frame, Charcoal and Daylight Paper.
for (const [prefs, file] of [
  [undefined, 'end-sheet-words.png'],
  ['prefs-theme-paper', 'end-sheet-words-paper.png'],
] as const) {
  test(`AD-17 end sheet screenshot with the Words list ${prefs === undefined ? 'in Charcoal' : 'in Paper'} at 360 px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openFixture(page, 'session-won-words', { endSheet: 'expanded', prefs });
    await expect(page.getByRole('list', { name: 'Words', exact: true })).toBeVisible();
    await page.locator('.content').evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await expect(page).toHaveScreenshot(file);
  });
}
