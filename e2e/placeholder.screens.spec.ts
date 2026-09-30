import { expect, test } from '@playwright/test';
import { fixture, seedStorage } from './helpers/seed';

// AD-17 Screenshots (SPEC D4): the minimal board (epic 3 E1), seeded with session-idle-fresh.json
// (seed 1); epic 4 replaces it.

test('AD-17 placeholder board screenshot', async ({ page }) => {
  await seedStorage(page, { session: fixture('session-idle-fresh.json') });
  await page.goto('/');
  for (let id = 0; id < 52; id++) {
    await expect(page.getByTestId(`card-${id}`)).toBeVisible();
  }

  // Copied from e2e/pwa/font.spec.ts.
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

  await expect(page).toHaveScreenshot('placeholder-board.png');
});
