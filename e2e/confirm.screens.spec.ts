import { expect, test } from '@playwright/test';
import { openFixture } from './helpers/board';
import { onAndroid } from './helpers/project';

// Epic 6 ticket 6.3 (build-notes Screens specs): the New game and Replay confirms at 360 px on
// android. Baselines are generated and compared only in the Playwright container
// (npm run test:screens).

test.beforeEach(onAndroid);

for (const [label, row, title] of [
  ['new-game', 'New game', 'Start a new game?'],
  ['replay', 'Replay this deal', 'Replay this deal?'],
] as const) {
  test(`AD-17 ${label} confirm screenshot at 360 px`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openFixture(page, 'session-idle-empty-column');
    await page.waitForFunction(() => window.__wordcell?.dictionaryState() === 'ready');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Menu', exact: true })
      .getByRole('button', { name: row, exact: true })
      .click();
    await expect(page.getByRole('dialog', { name: title })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Keep playing', exact: true })).toBeFocused();
    await expect(page).toHaveScreenshot(`confirm-${label}.png`);
  });
}
