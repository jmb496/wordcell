import { expect, test } from '@playwright/test';
import { openFixture } from './helpers/board';
import { advance, enableCelebration, running } from './helpers/celebration';
import { onAndroid } from './helpers/project';

// Epic 10 entry 6 (AD-17 Celebration seam, AD-19): one mid-run frame of the win celebration at
// 360 px on android, the run on the manual clock with one fixed advance, default theme. Baselines
// are generated and compared only in the Playwright container (npm run test:screens).

test.beforeEach(onAndroid);

test('AD-17 celebration mid-run frame at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-won-words', { steps: ['undo'] });
  await page.waitForFunction(() => window.__wordcell?.dictionaryState() === 'ready');
  await enableCelebration(page);
  await page.getByTestId('primary-action').click();
  await expect.poll(() => running(page)).toBe(true);
  await expect.poll(() => page.locator('[data-celebration-group]').count()).toBeGreaterThan(0);
  await advance(page, 1200);
  expect(await running(page)).toBe(true);
  await expect(page).toHaveScreenshot('celebration-mid-run.png');
});
