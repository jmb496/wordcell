import { expect, test } from '@playwright/test';
import { END_SHEET, openFixture } from './helpers/board';
import { running, watchAdded } from './helpers/celebration';

test('AD-17 test hook is present under the dev server: frozen, exposes exactly its hook keys', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  const hook = await page.evaluate(() => {
    const value = window.__wordcell;
    return value === undefined
      ? null
      : {
          frozen: Object.isFrozen(value),
          keys: Reflect.ownKeys(value).map(String).sort(),
          kind: value.current().kind,
          celebrationFrozen: Object.isFrozen(value.celebration),
          celebrationKeys: Reflect.ownKeys(value.celebration).map(String).sort(),
        };
  });
  expect(hook).toEqual({
    frozen: true,
    keys: ['celebration', 'current', 'dictionaryState', 'loaded', 'swState'],
    kind: 'active',
    celebrationFrozen: true,
    celebrationKeys: ['advance', 'running', 'setEnabled'],
  });
});

// AD-17 Celebration seam: hook builds keep the celebration off until a test enables it, so a win
// takes today's open (session-won-words plus one Undo is the Place phase whose Confirm wins).
test('AD-17 the celebration seam is off by default under the dev server: a win opens the sheet expanded, nothing runs and no celebration root is ever added', async ({
  page,
}) => {
  await openFixture(page, 'session-won-words', { steps: ['undo'] });
  const added = await watchAdded(page, '[data-celebration-root]');
  await page.getByTestId('primary-action').click();
  await expect(page.getByRole('dialog', { name: END_SHEET })).toBeVisible();
  expect(await running(page)).toBe(false);
  expect(await added()).toBe(false);
});

// Epic 7 F3: the dev server never imports the sw.ts chunk, so no worker registers there.
test('AD-16 AD-17 the dev server never requests src/shell/sw.ts and swState() stays unregistered', async ({
  page,
}) => {
  const paths: string[] = [];
  page.on('request', (request) => paths.push(new URL(request.url()).pathname));
  await page.goto('/');
  // Settled: `ready` or `failed` (an undefined hook before boot must not pass as "not loading").
  await expect
    .poll(() => page.evaluate(() => window.__wordcell?.dictionaryState()))
    .toMatch(/^(ready|failed)$/);
  // One macrotask for the boot tail after the dictionary settles, then the network quiet.
  await page.evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => window.__wordcell?.swState())).toBe('unregistered');
  expect(paths.filter((pathname) => pathname === '/src/shell/sw.ts')).toEqual([]);
  expect(paths.filter((pathname) => pathname.includes('workbox-window'))).toEqual([]);
});
