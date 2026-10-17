import { expect, test } from '@playwright/test';
import { text } from '../src/ui/text';
import { openFixture } from './helpers/board';

// Epic 8: the How to play scene final frames at 360 px. android; baselines are generated and
// compared only in the Playwright container (npm run test:screens).

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'screens run on android');
});

// Epic 8 ticket 6: the carousel shows one scene at a time; a scene is reached by its dot and its
// final (resting) frame by clicking Next `last` times (Replay then shows).
const next = text.howTo.sceneControls.next;
const replay = text.howTo.sceneControls.replay;

// Epic 8 tickets 1 to 4 and 7 (HP-2, HP-4): the final frame of every scene under reduced motion at
// 360 px, reached by its dot and Next: scene 1 (move-compose, BAKED after the arrange), scene 2
// (free-letter, BALKED with Validate pressed), scene 3 (place, BALKED on cell 6), scene 4 (scoring,
// total 61), and the Tricky rules scenes source-drop (FAKED), destination-rule (half 2, BAT) and
// top-card (SAT with cell 5 dimmed).
for (const [n, id, last] of [
  [1, 'moveCompose', 7],
  [2, 'freeLetter', 2],
  [3, 'place', 5],
  [4, 'scoring', 4],
  [5, 'sourceDrop', 3],
  [6, 'destinationRule', 7],
  [7, 'topCard', 3],
] as const) {
  test(`AD-17 how to play scene ${n} final frame screenshot at 360 px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 360, height: 740 });
    await openFixture(page, 'session-idle-fresh');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: 'How to play', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'How to play', exact: true });
    await panel.getByRole('button', { name: text.howTo.carousel.dot(n, 7), exact: true }).click();
    const scene = panel.getByRole('figure', { name: text.howTo.scenes[id] });
    await expect(scene).toBeVisible();
    for (let i = 0; i < last; i++)
      await scene.getByRole('button', { name: next, exact: true }).click();
    await expect(scene.getByRole('button', { name: replay, exact: true })).toBeVisible();
    await expect(scene).toHaveScreenshot(`how-to-play-scene-${n}-final.png`);
  });
}
