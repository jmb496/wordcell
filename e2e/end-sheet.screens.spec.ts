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
