import { expect, test } from '@playwright/test';
import { openFixture } from './helpers/board';
import { openScene } from './helpers/how-to-play';

// Epic themes ticket 6 (TH-4, TH-5): Daylight Paper shots, android only; baselines are generated and
// compared only in the Playwright container (npm run test:screens).

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'screens run on android');
});

const PREFS = 'prefs-theme-paper';

for (const [shot, fixtureName] of [
  ['board', 'session-place-free-letter-redo-tail'],
  ['tray', 'session-composing'],
] as const) {
  test(`AD-17 daylight paper ${shot} screenshot`, async ({ page }) => {
    await openFixture(page, fixtureName, { prefs: PREFS });
    await page.waitForFunction(() => window.__wordcell?.dictionaryState() === 'ready');
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('paper');
    await expect(page).toHaveScreenshot(`theme-paper-${shot}.png`);
  });
}

test('AD-17 daylight paper preferences sheet screenshot at 360 px', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-idle-fresh', { prefs: PREFS });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Preferences', exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('radio', { name: 'Daylight Paper' })).toBeChecked();
  await expect(page).toHaveScreenshot('theme-paper-preferences.png');
});

test('AD-17 daylight paper how to play scene 2 final frame screenshot at 360 px', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 740 });
  const scene = await openScene(page, {
    fixture: 'session-idle-fresh',
    prefs: PREFS,
    scene: 2,
    id: 'freeLetter',
    last: 2,
  });
  await expect(scene.getByRole('button', { name: 'Replay', exact: true })).toBeVisible();
  await expect(scene).toHaveScreenshot('theme-paper-scene-2.png');
});
