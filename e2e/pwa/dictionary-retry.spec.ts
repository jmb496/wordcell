import { expect, type Page, type Route, test } from '@playwright/test';
import { readPrecacheManifest } from '../helpers/precache';
import { isList, waitForDictionary } from '../helpers/restore';

// Epic 7 SPEC CAP-5 (ticket 7.7; Q-42, AD-8, F7) on `dist-test/` (pwa project only, it needs the
// hook: playwright.pwa.config.ts's `dist-smoke` `testMatch` omits this file). Under a real
// controlling worker, a word-list 404 followed by Reload retries in place: the banner stays while
// the retry runs, the page does not reload, and the banner hides once the list loads. The stubbed
// controller half is e2e/dictionary.spec.ts's AD-8 test.

// F6: the worker must run and control the reloaded page; set explicitly, not left to the default.
test.use({ serviceWorkers: 'allow' });

const TEST_TIMEOUT_MS = 60_000;
const POLL_MS = 15_000;
// `**/en*.txt` matches the build's word-list URL (AD-8 Tests, e2e/dictionary.spec.ts).
const LIST = '**/en*.txt';
const BANNER = "Word list didn't load.";

const dictionaryState = (page: Page) => page.evaluate(() => window.__wordcell?.dictionaryState());

test('Q-42 under a controlling worker, Reload after a 404 retries in place with the banner kept and no page load, and the banner hides when the retry succeeds', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  // AD-15: an error during the retry halts the store (Halted replaces App, hiding the banner too).
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));

  // 1. First launch installs the worker; the precache is complete.
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => window.__wordcell?.precacheComplete()), { timeout: POLL_MS })
    .toBe(true);

  // 2. Control (`swState()` `active` is not control, no `clientsClaim`): a reload, then the list
  // loads from the precache before anything is deleted or routed.
  await page.reload();
  expect(
    await page.evaluate(() => navigator.serviceWorker.controller !== null),
    'the reloaded page is controlled',
  ).toBe(true);
  await waitForDictionary(page, 'ready');

  // 3. F7: the list is precached, so a controlled page never reaches a route for it until its
  // precache entry is gone. Delete it by pathname across the `workbox-precache*` caches.
  const lists = (await readPrecacheManifest(request))
    .map((entry) => entry.url)
    .filter((url) => /(^|\/)en[^/?]*\.txt$/.test(url));
  expect(lists, 'exactly one word-list precache entry').toHaveLength(1);
  const { pathname, deleted } = await page.evaluate(async (url) => {
    // Resolved as the precache resolves its entries: against the absolute `/sw.js` URL.
    const path = new URL(url, new URL('/sw.js', location.href)).pathname;
    let count = 0;
    for (const name of await caches.keys()) {
      if (!name.startsWith('workbox-precache')) continue;
      const cache = await caches.open(name);
      for (const key of await cache.keys()) {
        if (new URL(key.url).pathname === path && (await cache.delete(key))) count++;
      }
    }
    return { pathname: path, deleted: count };
  }, lists[0] as string);
  expect(deleted, `precache entries deleted for ${pathname}`).toBe(1);

  // 4. The worker's network fetch of the list: hit 1 answered 404, hit 2 (the Reload retry) held,
  // any later hit answered 404 and recorded; a request not made by the worker is recorded and
  // passed on. Both extra kinds fail the final hit check.
  const workerHits: string[] = [];
  const pageHits: string[] = [];
  const held: Route[] = [];
  await context.route(LIST, async (route) => {
    const req = route.request();
    if (req.serviceWorker() === null) {
      pageHits.push(req.url());
      return route.fallback();
    }
    workerHits.push(req.url());
    if (workerHits.length === 2) {
      held.push(route);
      return;
    }
    await route.fulfill({ status: 404, contentType: 'text/plain', body: '' });
  });

  // 5. The reload's list request goes through the worker to the routed 404.
  // One call, so neither promise is left pending if the other rejects.
  const [, listResponse] = await Promise.all([
    page.reload(),
    page.waitForResponse((r) => isList(r.request())),
  ]);
  expect(listResponse.status(), 'the page sees the 404').toBe(404);
  expect(listResponse.fromServiceWorker(), 'the 404 reaches the page through the worker').toBe(
    true,
  );
  expect(
    await page.evaluate(() => navigator.serviceWorker.controller !== null),
    'the page is still controlled',
  ).toBe(true);
  await waitForDictionary(page, 'failed');
  const banner = page.getByText(BANNER, { exact: true });
  await expect(banner).toBeVisible();
  expect(workerHits, 'one worker hit before Reload').toHaveLength(1);

  // 6. Reload (AD-8 `retry()`): in place under the controller.
  const loads: unknown[] = [];
  page.on('load', (event) => loads.push(event));
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await expect.poll(() => held.length, { timeout: POLL_MS }).toBe(1);
  await expect(banner).toBeVisible();
  expect(await dictionaryState(page)).toBe('loading');
  expect(loads, 'no page load while the retry is held').toEqual([]);

  // 7. Released to the network: the real list.
  await held[0]?.continue();
  await expect.poll(() => dictionaryState(page), { timeout: POLL_MS }).toBe('ready');
  await expect(banner).toHaveCount(0);
  expect(loads, 'no page load after the retry').toEqual([]);
  expect(workerHits, 'exactly two worker hits').toHaveLength(2);
  expect(pageHits, 'no word-list request outside the worker').toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('active');
});
