import { expect, test } from '@playwright/test';
import { text } from '../src/ui/text';
import { openScene } from './helpers/how-to-play';

// Epic 8: the How to play scene final frames at 360 px. android; baselines are generated and
// compared only in the Playwright container (npm run test:screens).

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'screens run on android');
});

// Epic 8 ticket 6: the carousel shows one scene at a time; a scene is reached by its dot and its
// final (resting) frame by clicking Next `last` times (Replay then shows).
const next = text.howTo.sceneControls.next;
const replay = text.howTo.sceneControls.replay;

// Epic 8 tickets 1 to 3, 7 and 10 (HP-2, HP-4): the final frame of every scene under reduced motion at
// 360 px, reached by its dot and Next: scene 1 (move-compose, BAKED after the arrange), scene 2
// (free-letter, BALKED with Validate pressed), scene 3 (place, one top card E on cell 6), scene 4 (source-drop,
// the one Tricky rule, FAKED) and scene 5 (scoring, total 61; order set 2026-10-17).
for (const [n, id, last] of [
  [1, 'moveCompose', 7],
  [2, 'freeLetter', 2],
  [3, 'place', 5],
  [4, 'sourceDrop', 3],
  [5, 'scoring', 5],
] as const) {
  test(`AD-17 how to play scene ${n} final frame screenshot at 360 px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 360, height: 740 });
    const scene = await openScene(page, {
      fixture: 'session-idle-fresh',
      scene: n,
      id,
      last,
    });
    await expect(scene.getByRole('button', { name: replay, exact: true })).toBeVisible();
    await expect(scene).toHaveScreenshot(`how-to-play-scene-${n}-final.png`);
  });
}

// Epic 8 ticket 9 (HP-2, R-65): scene 5's start frame, the WordCells as the game shows them (top
// cards only), reduced-motion frame 0 with no Next click. Docker baseline only.
test('AD-17 how to play scene 5 start frame screenshot at 360 px', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 740 });
  const scene = await openScene(page, {
    fixture: 'session-idle-fresh',
    scene: 5,
    id: 'scoring',
    last: 0,
  });
  await expect(scene.getByRole('button', { name: next, exact: true })).toBeVisible();
  await expect(scene).toHaveScreenshot('how-to-play-scene-5-start.png');
});
