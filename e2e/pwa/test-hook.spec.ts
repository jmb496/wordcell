import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { END_SHEET, openFixture } from '../helpers/board';
import { running, watchAdded } from '../helpers/celebration';
import { buildRoot, walk } from '../helpers/dist-test';
import { precacheMissing, readPrecacheManifest } from '../helpers/precache';

test('AD-17 test hook is present in the test build: frozen, exposes exactly its hook keys', async ({
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
test('AD-17 the celebration seam is off by default in the test build: a win opens the sheet expanded, nothing runs and no celebration root is ever added', async ({
  page,
}) => {
  await openFixture(page, 'session-won-words', { steps: ['undo'] });
  const added = await watchAdded(page, '[data-celebration-root]');
  await page.getByTestId('primary-action').click();
  await expect(page.getByRole('dialog', { name: END_SHEET })).toBeVisible();
  expect(await running(page)).toBe(false);
  expect(await added()).toBe(false);
});

// Epic 7 CAP-1, CAP-2: the boot tail registers /sw.js after the dictionary settles; the hook reads
// the worker state from the shell module (key list pinned above).
test('AD-16 AD-17 the registered worker reaches swState() active in the test build', async ({
  page,
}) => {
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => window.__wordcell?.swState()), { timeout: 15_000 })
    .toBe('active');
});

// Epic 7 CAP-2: the hook recomputes on every call, so the poll reaches true once the worker is
// activated and its precache is in Cache Storage; the page-side check confirms every manifest URL.
test('AD-17 precacheComplete() polls to true once the worker is activated and every precache manifest URL is cached', async ({
  page,
  request,
}) => {
  // AD-15: a halted page could still poll to true after an early rejecting recompute.
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => window.__wordcell?.precacheComplete()), { timeout: 15_000 })
    .toBe(true);
  const urls = (await readPrecacheManifest(request)).map((entry) => entry.url);
  expect(await precacheMissing(page, urls)).toEqual([]);
  // Not right after the last poll: after precacheMissing's cache reads and the dev test's settle
  // step (a getRegistration(), then a macrotask), so a rejection from the recompute that poll
  // started has time to reach AD-15 before the not-halted check.
  await page.evaluate(async () => {
    await navigator.serviceWorker.getRegistration();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
  expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('active');
  expect(errors).toEqual([]);
});

// Positive control for dist-smoke.spec.ts's `AD-17 AD-18 no app chunk in dist/assets contains
// precacheAndRoute or __WB_REVISION__`: the hook build keeps both names in an app chunk (the
// precacheComplete() code), so the dist-smoke search can find them when they are there.
test("AD-17 AD-18 the test build's app chunk holds precacheAndRoute and __WB_REVISION__ (positive control for dist-smoke)", () => {
  const root = buildRoot();
  const chunks = walk(root).filter((file) => /^assets\/[^/]+\.js$/.test(file));
  expect(chunks.length).toBeGreaterThan(0);
  const hits = chunks.filter((file) => {
    const text = readFileSync(path.join(root, file), 'latin1');
    return text.includes('precacheAndRoute') && text.includes('__WB_REVISION__');
  });
  expect(hits.length, 'app chunks holding both names').toBeGreaterThan(0);
});
