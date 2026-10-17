import { expect, test } from '@playwright/test';
import { text } from '../src/ui/text';
import { openFixture } from './helpers/board';

// Epic 6 ticket 6.9: the How to play Worked example at 360 px. android; baselines are generated and
// compared only in the Playwright container (npm run test:screens).

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'screens run on android');
});

test('AD-17 how to play worked example screenshot at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-idle-fresh');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'How to play', exact: true });
  await expect(panel).toBeVisible();
  const example = panel.locator('section.example');
  await example.scrollIntoViewIfNeeded();
  await expect(example).toHaveScreenshot('how-to-play-example.png');
});

// Epic 8 ticket 1 (HP-2): scene 1's final frame (tray open) under reduced motion at 360 px.
test('AD-17 how to play scene 1 final frame screenshot at 360 px', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 740 });
  await openFixture(page, 'session-idle-fresh');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'How to play', exact: true });
  const scene = panel.getByRole('figure', { name: text.howTo.scenes.drag });
  await expect(scene).toBeVisible();
  for (let i = 0; i < 3; i++)
    await scene.getByRole('button', { name: text.howTo.sceneControls.next, exact: true }).click();
  await expect(scene.getByRole('button', { name: text.howTo.sceneControls.replay })).toBeVisible();
  await expect(scene).toHaveScreenshot('how-to-play-scene-1-final.png');
});

// Epic 8 tickets 2 and 3 (HP-2): the final frames of scene 2 (compose, Validate pressed), scene 3
// (destination, PEATS after Flip), scene 4 (place, BALKED on cell 6) and scene 5 (scoring, total 61)
// under reduced motion at 360 px.
for (const [n, id, last] of [
  [2, 'compose', 5],
  [3, 'destination', 4],
  [4, 'place', 5],
  [5, 'scoring', 4],
  // Epic 8 ticket 4 (HP-4): the Tricky rules scenes, source-drop (FAKED), destination-rule (half 2,
  // BAT) and top-card (SAT with cell 5 dimmed).
  [6, 'sourceDrop', 3],
  [7, 'destinationRule', 7],
  [8, 'topCard', 3],
] as const) {
  test(`AD-17 how to play scene ${n} final frame screenshot at 360 px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 360, height: 740 });
    await openFixture(page, 'session-idle-fresh');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: 'How to play', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'How to play', exact: true });
    const scene = panel.getByRole('figure', { name: text.howTo.scenes[id] });
    await scene.scrollIntoViewIfNeeded();
    for (let i = 0; i < last; i++)
      await scene.getByRole('button', { name: text.howTo.sceneControls.next, exact: true }).click();
    await expect(
      scene.getByRole('button', { name: text.howTo.sceneControls.replay }),
    ).toBeVisible();
    await expect(scene).toHaveScreenshot(`how-to-play-scene-${n}-final.png`);
  });
}
