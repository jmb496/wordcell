import { expect, test } from '@playwright/test';
import { stored } from './helpers/blocking';
import { openFixture } from './helpers/board';
import { fixture, seedStorage } from './helpers/seed';

// Epic 6 ticket 6.4 (build-notes Screens specs): the Preferences panel and the top bar with the
// timer at 360 px, including a negative score (Score −530, a 12:03:04 timer). android; baselines
// are generated and compared only in the Playwright container (npm run test:screens).

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'screens run on android');
});

test('AD-17 preferences panel screenshot at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-idle-fresh', { prefs: 'prefs-non-default' });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Preferences', exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Slow' })).toBeChecked();
  await expect(page).toHaveScreenshot('preferences-panel.png');
});

test('AD-17 top bar with the timer and a negative score screenshot at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const session = JSON.stringify({
    ...JSON.parse(fixture('session-gave-up.json')),
    activeMs: 43_384_000,
  });
  await seedStorage(page, { session, prefs: fixture('prefs-non-default.json') });
  await page.goto('/');
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expect(page.locator('[data-band="topBar"] .timer')).toHaveText('12:03:04');
  expect(await stored(page, 'wordcell:prefs')).not.toBeNull();
  await page.waitForFunction(() => window.__wordcell?.dictionaryState() === 'ready');
  await expect(page).toHaveScreenshot('top-bar-timer.png');
});
