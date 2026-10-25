import { expect, test } from '@playwright/test';
import { openFixture } from './helpers/board';
import { finalFrame, openScene } from './helpers/how-to-play';

// Epic themes ticket 9 (TH-4, TH-5): Brass and Walnut shots, android only; baselines are generated and
// compared only in the Playwright container (npm run test:screens).

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'screens run on android');
});

const PREFS = 'prefs-theme-steampunk';

for (const [shot, fixtureName] of [
  ['board', 'session-place-free-letter-redo-tail'],
  ['tray', 'session-composing'],
] as const) {
  test(`AD-17 brass and walnut ${shot} screenshot`, async ({ page }) => {
    await openFixture(page, fixtureName, { prefs: PREFS });
    await page.waitForFunction(() => window.__wordcell?.dictionaryState() === 'ready');
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('steampunk');
    await expect(page).toHaveScreenshot(`theme-steampunk-${shot}.png`);
  });
}

test('AD-17 brass and walnut preferences sheet screenshot at 360 px', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-idle-fresh', { prefs: PREFS });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Preferences', exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('radio', { name: 'Brass and Walnut' })).toBeChecked();
  await expect(page).toHaveScreenshot('theme-steampunk-preferences.png');
});

test('AD-17 brass and walnut how to play scene 2 final frame screenshot at 360 px', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 740 });
  const scene = await openScene(page, {
    fixture: 'session-idle-fresh',
    prefs: PREFS,
    scene: 2,
    id: 'freeLetter',
    last: finalFrame(2),
  });
  await expect(scene.getByRole('button', { name: 'Replay', exact: true })).toBeVisible();
  await expect(scene).toHaveScreenshot('theme-steampunk-scene-2.png');
});
