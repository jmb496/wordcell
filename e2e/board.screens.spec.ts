import { expect, test } from '@playwright/test';
import { fixture, seedStorage } from './helpers/seed';

// AD-17 Screenshots (build-notes CAP-2): the Board in each phase, baselines generated and
// compared only in the Playwright container (npm run test:screens).

for (const [phase, name] of [
  ['idle', 'session-idle-fresh'],
  ['composing', 'session-composing'],
  ['place', 'session-place-free-letter-redo-tail'],
  ['place-compact', 'session-place-compact'],
  ['game-over', 'session-gave-up'],
] as const) {
  test(`AD-17 board screenshot ${phase}`, async ({ page }) => {
    await seedStorage(page, { session: fixture(`${name}.json`) });
    await page.goto('/');
    // Attached, not visible: the cards beneath a WordCell top are live but hidden.
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    // AD-8: the primary action settles once the word list is ready.
    await page.waitForFunction(() => window.__wordcell?.dictionaryState() === 'ready');

    // Copied from e2e/pwa/font.spec.ts (via the deleted placeholder spec).
    const fonts = await page.evaluate(async () => {
      const loaded = await document.fonts.load('600 1em "WordCell Serif"', 'W');
      const faces: { weight: string; status: string }[] = [];
      document.fonts.forEach((face) => {
        if (face.family.replace(/['"]/g, '') === 'WordCell Serif') {
          faces.push({ weight: face.weight, status: face.status });
        }
      });
      return { loaded: loaded.length, faces };
    });
    expect(fonts.loaded).toBe(1);
    expect(fonts.faces).toEqual([{ weight: '600', status: 'loaded' }]);

    await expect(page).toHaveScreenshot(`board-${phase}.png`);
  });
}
