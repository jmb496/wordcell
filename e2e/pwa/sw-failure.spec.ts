import { expect, type Page, type Route, test } from '@playwright/test';
import { bootCalls, recordBootCalls } from '../helpers/boot-calls';
import { buildRoot, swChunkFile } from '../helpers/dist-test';
import { copy } from '../helpers/static-server';

// Epic 7 SPEC CAP-5 (ticket 7.7; Q-40, F17, AD-15, AD-16) on `dist-test/` (pwa project only:
// playwright.pwa.config.ts's `dist-smoke` `testMatch` omits this file). Each Q-40 failure, boot
// only: the hook build reports it to AD-15, so the fatal surface shows and `swState()` is `failed`.
// The hook-free `dist/` halves (boot, deal, validate, nothing shown) are in dist-smoke.spec.ts.

// F6: the worker must run (its install is what fails); set explicitly, not left to the default.
test.use({ serviceWorkers: 'allow' });

const TEST_TIMEOUT_MS = 60_000;
const POLL_MS = 15_000;
const INTERVAL_MS = 100;
const FATAL = 'Something went wrong.';
const ICON = '/icons/icon-192.png';

const chunkUrl = (baseURL: string | undefined) => new URL(`/${swChunkFile()}`, baseURL).href;

const macrotask = (page: Page) =>
  page.evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

const swState = (page: Page) => page.evaluate(() => window.__wordcell?.swState());

/**
 * AD-15 fatal surface with Q-40's `swState()` `failed`, its body naming `cause` (the halt text:
 * `src/shell/sw.ts`'s `fail()` reasons with their `Q-40 ` prefix, or `src/main.ts`'s F17 report).
 */
async function expectFatal(page: Page, cause: string): Promise<void> {
  await expect.poll(() => swState(page), { timeout: POLL_MS }).toBe('failed');
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toHaveCount(1);
  await expect(dialog.getByRole('heading', { name: FATAL, exact: true })).toBeVisible();
  await expect(dialog).toContainText(cause);
  expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('halted');
}

test('Q-40 AD-15 the worker script missing: register() rejects, swState() failed and the fatal surface shows', async ({
  page,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  const site = copy(buildRoot());
  try {
    site.remove('sw.js');
    const served = await site.serve();
    await page.goto(`${served.url}/`);
    await expectFatal(page, 'Q-40 Workbox.register() rejected');
    expect(
      served.requests().filter((r) => r.path === '/sw.js'),
      'the static server answered /sw.js 404',
    ).toContainEqual(expect.objectContaining({ status: 404 }));
  } finally {
    await site.stop();
  }
});

test('Q-40 AD-15 a precached icon 404 during the first install: the install turns redundant, swState() failed and the fatal surface shows', async ({
  page,
  context,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  let workerHits = 0;
  let answered!: { resolve: () => void; reject: (error: Error) => void };
  const done = new Promise<void>((resolve, reject) => {
    answered = { resolve, reject };
  });
  // Resolved at the first worker hit: the "no worker request" timer races only this, and the hold
  // (`done`) is bounded by the handler's own deadline, which starts at the hit.
  let seen!: () => void;
  const hit = new Promise<void>((resolve) => {
    seen = resolve;
  });
  // F6: before the first goto, so the first install's precache fetch of the icon (which the page
  // itself does not load) reaches it; matched by pathname, anything else is not ours.
  await context.route(
    (url) => url.pathname === ICON,
    async (route) => {
      if (route.request().serviceWorker() === null) return route.fallback();
      workerHits++;
      if (workerHits > 1) return route.fulfill({ status: 404, body: '' });
      seen();
      // Held until the page has observed the install, so `sw.ts` sees the installing worker
      // before it turns redundant.
      const deadline = Date.now() + POLL_MS;
      let state: string | undefined;
      try {
        for (;;) {
          state = await swState(page);
          if (state === 'installing' || state === 'failed' || Date.now() >= deadline) break;
          await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
        }
      } catch (error) {
        // A failed read reaches the test as the awaited rejection, never a timeout.
        await route.fulfill({ status: 404, body: '' });
        answered.reject(error as Error);
        return;
      }
      await route.fulfill({ status: 404, body: '' });
      if (state === 'installing') answered.resolve();
      else
        answered.reject(
          new Error(`the held icon was released with swState() ${String(state)}, not installing`),
        );
    },
  );
  await page.goto('/');
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    hit,
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`no worker request for ${ICON} reached the context.route`)),
        2 * POLL_MS,
      );
    }),
  ]).finally(() => clearTimeout(timer));
  await done;
  await expectFatal(page, 'Q-40 a service worker turned redundant before it activated');
  expect(workerHits, 'the worker requested the icon exactly once').toBe(1);
});

test('Q-40 AD-15 (F17) the sw.ts chunk 404: swState() failed, the fatal surface shows, no register, persisted or persist call', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  let hits = 0;
  // The uncontrolled first-launch page (as boot-order.spec.ts): page.route sees the chunk request.
  // Answered at once: the F17 catch halts synchronously, before the persistence check.
  await page.route(chunkUrl(baseURL), (route) => {
    hits++;
    return route.fulfill({ status: 404, body: '' });
  });
  await recordBootCalls(page);
  await page.goto('/');
  await expectFatal(page, 'Q-40 F17 the sw.ts chunk did not load');
  await macrotask(page);
  expect(hits, 'the sw.ts chunk route was hit once').toBe(1);
  expect(await bootCalls(page)).toStrictEqual([]);
});

// Epic 7 entry 2 (F17 on a halted launch; src/main.ts reports on the hook gate alone): the halt
// lands while the chunk request is held, so the boot tail is already past its last `halted()`
// check before the import; the later fatal replaces the halt text (src/ui/Halted.svelte).
test('Q-40 AD-15 (F17) a halt while the sw.ts chunk request is held, then the chunk 404: the F17 report replaces the halt text, swState() failed, no register, persisted or persist call', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  const held: Route[] = [];
  await page.route(chunkUrl(baseURL), (route) => {
    held.push(route);
  });
  await recordBootCalls(page);
  await page.goto('/');
  await expect.poll(() => held.length).toBe(1);
  await page.evaluate(() => reportError(new Error('F17 test halt')));
  await page.waitForFunction(() => window.__wordcell?.current().kind === 'halted');
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toHaveAccessibleDescription('F17 test halt');
  await held[0]?.fulfill({ status: 404, body: '' });
  await expect.poll(() => swState(page), { timeout: POLL_MS }).toBe('failed');
  await expect(dialog).toHaveAccessibleDescription('Q-40 F17 the sw.ts chunk did not load');
  await macrotask(page);
  expect(held).toHaveLength(1);
  expect(await bootCalls(page)).toStrictEqual([]);
});
