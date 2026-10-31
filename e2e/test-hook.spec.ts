import { expect, test } from '@playwright/test';
import { END_SHEET, openFixture } from './helpers/board';
import { bootCalls, recordBootCalls } from './helpers/boot-calls';
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
    keys: ['celebration', 'current', 'dictionaryState', 'loaded', 'precacheComplete', 'swState'],
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

// Epic 7 F3: the dev server never imports the sw.ts chunk, so no worker registers there; CAP-2:
// with no registration precacheComplete() reads false and fetches nothing; CAP-3: persistence is
// still requested once, after the dictionary settled (e2e/helpers/boot-calls.ts).
test('AD-16 AD-7 AD-17 the dev server never requests src/shell/sw.ts, swState() stays unregistered, precacheComplete() stays false and persistence is requested once', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  const paths: string[] = [];
  page.on('request', (request) => paths.push(new URL(request.url()).pathname));
  await recordBootCalls(page);
  await page.goto('/');
  // Settled: `ready` or `failed` (an undefined hook before boot must not pass as "not loading").
  await expect
    .poll(() => page.evaluate(() => window.__wordcell?.dictionaryState()))
    .toMatch(/^(ready|failed)$/);
  // One macrotask for the boot tail after the dictionary settles, then the network quiet.
  await page.evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  await page.waitForLoadState('networkidle');
  await expect
    .poll(async () => (await bootCalls(page)).some((call) => call.event === 'persist'))
    .toBe(true);
  expect(await page.evaluate(() => window.__wordcell?.precacheComplete())).toBe(false);
  // Settle the recompute that call started: its getRegistration() resolves first, then a macrotask.
  await page.evaluate(async () => {
    await navigator.serviceWorker.getRegistration();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
  await page.waitForLoadState('networkidle');
  // F3: no register; the dev server serves the real word list, so both snapshots read `ready`.
  expect(await bootCalls(page)).toStrictEqual([
    { event: 'persisted', dictionary: 'ready' },
    { event: 'persist', dictionary: 'ready' },
  ]);
  expect(await page.evaluate(() => window.__wordcell?.precacheComplete())).toBe(false);
  expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('active');
  expect(errors).toEqual([]);
  expect(paths.filter((pathname) => pathname === '/sw.js')).toEqual([]);
  expect(paths.filter((pathname) => pathname === '/src/shell/sw.ts')).toEqual([]);
  expect(paths.filter((pathname) => pathname.includes('workbox-window'))).toEqual([]);
  expect(await page.evaluate(() => window.__wordcell?.swState())).toBe('unregistered');
});

// Rule 6: the accessor's recompute is never caught, so its rejection reaches main.ts's
// `unhandledrejection` handler and halts the store.
test('AD-15 AD-17 a rejected precacheComplete() recompute reaches the AD-15 halt', async ({
  page,
}) => {
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => window.__wordcell?.dictionaryState()))
    .toMatch(/^(ready|failed)$/);
  expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('active');
  await page.evaluate(() => {
    navigator.serviceWorker.getRegistration = () => Promise.reject(new Error('AD-17 test'));
    window.__wordcell?.precacheComplete();
  });
  await page.waitForFunction(() => window.__wordcell?.current().kind === 'halted');
  await expect(page.getByRole('alertdialog')).toHaveAccessibleDescription('AD-17 test');
});

// Epic 7 CAP-3 (rule 6): main.ts awaits `requestPersistence()` uncaught, so a rejected
// `persisted()` reaches the `unhandledrejection` handler and halts the store.
test('AD-15 AD-7 a rejected persisted() reaches the AD-15 halt', async ({ page }) => {
  await page.addInitScript(() => {
    StorageManager.prototype.persisted = () =>
      Promise.reject(new Error('AD-7 test persisted rejected'));
  });
  await page.goto('/');
  await page.waitForFunction(() => window.__wordcell?.current().kind === 'halted');
  await expect(page.getByRole('alertdialog')).toHaveAccessibleDescription(
    'AD-7 test persisted rejected',
  );
});
