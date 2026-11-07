import { expect, type Page, type Route, test } from '@playwright/test';
import {
  bootCalls,
  listTextCalls,
  recordBootCalls,
  releaseListText,
  releaseRegister,
} from '../helpers/boot-calls';
import { swChunkFile } from '../helpers/dist-test';

// Epic 7 SPEC CAP-1, CAP-3, CAP-4, F4 (AD-16, AD-7, AD-8) on `dist-test/` (pwa project): the boot
// tail requests the word list, then (once it settled) imports the `sw.ts` chunk and registers the
// worker, then requests persistent storage, and returns at every `halted()` check. Every route is
// a `page.route` on the uncontrolled first-launch page (no worker yet, so it sees the requests and
// the worker's own precache fetches are unaffected); each case has one page.

// `**/en*.txt` matches the build's word-list URL (AD-8, e2e/dictionary.spec.ts).
const LIST = '**/en*.txt';

const chunkUrl = (baseURL: string | undefined) => new URL(`/${swChunkFile()}`, baseURL).href;

const macrotask = (page: Page) =>
  page.evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

const dictionaryState = (page: Page) => page.evaluate(() => window.__wordcell?.dictionaryState());

const halt = async (page: Page) => {
  await page.evaluate(() => reportError(new Error('F4 test halt')));
  await page.waitForFunction(() => window.__wordcell?.current().kind === 'halted');
};

// Reads the whole log once `persist` is in it, the network is quiet and one macrotask passed.
async function order(page: Page, dictionary: 'ready' | 'failed'): Promise<void> {
  await expect
    .poll(async () => (await bootCalls(page)).some((call) => call.event === 'persist'))
    .toBe(true);
  await page.waitForLoadState('networkidle');
  await macrotask(page);
  expect(await bootCalls(page)).toStrictEqual([
    { event: 'register', dictionary },
    { event: 'register-settled', outcome: 'fulfilled', dictionary },
    { event: 'persisted', dictionary },
    { event: 'persist', dictionary },
  ]);
  expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('active');
}

test('AD-8 AD-16 AD-7 first launch: dictionary settled → register → register settled → persisted → persist, the sw.ts chunk requested only after the dictionary', async ({
  page,
  baseURL,
}) => {
  const url = chunkUrl(baseURL);
  const chunkHits: string[] = [];
  await page.route(url, async (route) => {
    chunkHits.push(route.request().url());
    await route.continue();
  });
  // The gating hold: the word list's `text()` (the dictionary turns `ready` synchronously once it
  // resolves), so an import that awaits less than the whole load requests the chunk while held.
  await recordBootCalls(page, { holdListText: true });
  await page.goto('/');
  await expect.poll(() => listTextCalls(page)).toBe(1);
  // Two animation frames plus a macrotask with the text held: still loading, no chunk request yet.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0))),
      ),
  );
  expect(await dictionaryState(page)).toBe('loading');
  expect(chunkHits).toEqual([]);
  const releasedAt = await releaseListText(page);
  await order(page, 'ready');
  expect(chunkHits).toEqual([url]);
  // The chunk request started at or after the release, on the page's own clock.
  const starts = await page.evaluate(
    (chunk) => performance.getEntriesByName(chunk).map((entry) => entry.startTime),
    url,
  );
  expect(starts, 'one resource timing entry for the sw.ts chunk').toHaveLength(1);
  expect(starts[0]).toBeGreaterThanOrEqual(releasedAt);
});

test('AD-16 AD-7 after a dictionary 404: register → register settled → persisted → persist, snapshots failed', async ({
  page,
}) => {
  let hits = 0;
  await page.route(LIST, (route) => {
    hits++;
    return route.fulfill({ status: 404, contentType: 'text/plain', body: '' });
  });
  await recordBootCalls(page);
  await page.goto('/');
  await order(page, 'failed');
  expect(hits).toBe(1);
});

// The worker runs outside the page clock (unverified), so no `swState()` assertion here.
test('AD-16 AD-7 after a dictionary timeout: register → register settled → persisted → persist, snapshots failed', async ({
  page,
}) => {
  await page.clock.install();
  let hits = 0;
  // Held forever: only the AD-8 timeout ends the request.
  await page.route(LIST, () => {
    hits++;
  });
  await recordBootCalls(page);
  await page.goto('/');
  await expect.poll(() => hits).toBe(1);
  // Past dictionary.svelte.ts's 30 000 ms TIMEOUT_MS.
  await page.clock.fastForward(31_000);
  await expect.poll(() => dictionaryState(page)).toBe('failed');
  await order(page, 'failed');
  expect(hits).toBe(1);
});

test('AD-16 AD-7 (F4) a halt while the dictionary request is held: no sw.ts chunk request, no register, persisted or persist call', async ({
  page,
  baseURL,
}) => {
  const held: Route[] = [];
  await page.route(LIST, (route) => {
    held.push(route);
  });
  const chunkHits: string[] = [];
  await page.route(chunkUrl(baseURL), async (route) => {
    chunkHits.push(route.request().url());
    await route.continue();
  });
  await recordBootCalls(page);
  await page.goto('/');
  await expect.poll(() => held.length).toBe(1);
  await halt(page);
  await held[0]?.continue();
  await expect.poll(() => dictionaryState(page)).not.toBe('loading');
  await macrotask(page);
  await page.waitForLoadState('networkidle');
  expect(await bootCalls(page)).toStrictEqual([]);
  expect(chunkHits).toEqual([]);
});

test('AD-16 AD-7 (F4) a halt while the sw.ts chunk request is held: no register, persisted or persist call', async ({
  page,
  baseURL,
}) => {
  const url = chunkUrl(baseURL);
  const held: Route[] = [];
  // Released by `route.continue()`, never a stub (a stub leaves `sw.registerWorker` undefined).
  await page.route(url, (route) => {
    held.push(route);
  });
  await recordBootCalls(page);
  await page.goto('/');
  await expect.poll(() => held.length).toBe(1);
  await halt(page);
  await held[0]?.continue();
  // The same module record as main.ts's import: resolves only after the chunk evaluated.
  await page.evaluate((chunk) => import(chunk).then(() => undefined), url);
  await macrotask(page);
  expect(held).toHaveLength(1);
  expect(await bootCalls(page)).toStrictEqual([]);
});

// The one case reaching CAP-3's trailing `halted()` check (after the registration attempt).
test('AD-16 AD-7 (F4) a halt during the registration attempt: register called, no persisted or persist call', async ({
  page,
}) => {
  await recordBootCalls(page, { holdRegister: true });
  await page.goto('/');
  await expect
    .poll(async () => (await bootCalls(page)).some((call) => call.event === 'register'))
    .toBe(true);
  await halt(page);
  await releaseRegister(page);
  // `registerWorker()`'s last step leaves `unregistered`; the attempt has then settled.
  await expect
    .poll(() => page.evaluate(() => window.__wordcell?.swState()), { timeout: 15_000 })
    .not.toBe('unregistered');
  await macrotask(page);
  const calls = await bootCalls(page);
  expect(calls.map((call) => call.event)).toEqual(['register', 'register-settled']);
  expect(calls[1]?.outcome).toBe('fulfilled');
});
