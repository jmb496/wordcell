import { expect, test } from '@playwright/test';
import { openFixture } from './helpers/board';

// Epic 6 ticket 6.2 (build-notes Screens specs): the Menu sheet at 360 px, Idle (Give up enabled)
// and Composing (Give up disabled), with the footer fixed by WORDCELL_APP_VERSION. Baselines are
// generated and compared only in the Playwright container (npm run test:screens).

for (const [label, name] of [
  ['idle', 'session-idle-fresh'],
  ['composing', 'session-composing'],
] as const) {
  test(`AD-17 menu screenshot ${label} at 360 px`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openFixture(page, name);
    await page.waitForFunction(() => window.__wordcell?.dictionaryState() === 'ready');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Menu', exact: true })).toBeVisible();
    await expect(page.getByText('0.0.0 (test)', { exact: true })).toBeVisible();
    await expect(page).toHaveScreenshot(`menu-${label}.png`);
  });
}
