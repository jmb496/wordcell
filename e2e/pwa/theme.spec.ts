import { expect, test } from '@playwright/test';
import { fixture, seedStorage } from '../helpers/seed';

// Q-45, AD-16 no flash on a production build (pwa project, dist-test/): the dev-server spec
// e2e/theme.spec.ts records only `data-theme`; this one records the painted root colour.
// Fixtures: `session-idle-fresh`, `prefs-theme-paper`. The app's entry chunk is held back so
// several frames paint before main.ts runs: only the inline pre-paint script can colour them.

/** Daylight Paper's `--wc-table` (#ECE6D8) as computed. */
const PAPER_TABLE = 'rgb(236, 230, 216)';

test('Q-45 AD-16 no flash: every frame from the first paints the stored Daylight Paper table colour', async ({
  page,
}) => {
  await seedStorage(page, {
    session: fixture('session-idle-fresh.json'),
    prefs: fixture('prefs-theme-paper.json'),
  });
  await page.route('**/assets/index-*.js', async (route) => {
    await new Promise((r) => setTimeout(r, 400));
    await route.continue();
  });
  await page.addInitScript(() => {
    const frames: string[] = [];
    (window as unknown as { __tableFrames: string[] }).__tableFrames = frames;
    const tick = () => {
      frames.push(getComputedStyle(document.documentElement).backgroundColor);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto('/');
  await expect(page.getByTestId('card-0')).toBeVisible();
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  const frames = await page.evaluate(
    () => (window as unknown as { __tableFrames: string[] }).__tableFrames,
  );
  expect(frames.length).toBeGreaterThan(5);
  expect(frames.filter((colour) => colour !== PAPER_TABLE)).toEqual([]);
});
