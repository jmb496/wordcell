import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { type BrowserContext, expect, type Page, test, type Worker } from '@playwright/test';
import { buildRoot } from '../helpers/dist-test';
import { expectNoPrompt } from '../helpers/live-region';
import { type Copy, copy, type Served } from '../helpers/static-server';

// Epic 7 CAP-4 (ticket 7.3; Q-40, AD-16, A-A15): a waiting build B activates only once every page
// of the context has closed, with no prompt. A and B are `dist-test/` copies; B differs only in
// `index.html` (build marker `<meta name="wc-build">`) and in `sw.js`'s `index.html` precache
// revision, which makes the update check find B. Both are served from disk by F8's static server;
// B is written with `swap` after A controls the page. `context.route`/`page.route` cannot route an
// updated worker's script fetch (F8), so this spec uses neither.

// F6: the worker must run and control pages; set explicitly, not left to the default.
test.use({ serviceWorkers: 'allow' });
// A retry could hide an activation that is only sometimes early, so none, also on CI.
test.describe.configure({ retries: 0 });

// The D-route label (SPEC Assumptions, G3): Chromium's own activation timing differs from A-A15.
const TIMING = 'A-A15 timing differs (SPEC Assumptions, G3)';
// Covers the sum of the bounded waits one test can hit (setup: four 15 s state polls and the 10 s
// `/sw.js` wait; the A-side test adds two 15 s state polls and the 5 s hold: 105 s; the all-closed
// test adds the 30 s activation poll, its probe page and a final 15 s state poll: 115 s) plus
// navigation slack, so each bounded wait fails with its own message before Playwright's generic
// timeout. A passing run takes about 4 s per test (2026-10-30).
const TEST_TIMEOUT_MS = 150_000;
const STATE_POLL_MS = 15_000;
const SW_FETCH_POLL_MS = 10_000;
const ACTIVATION_POLL_MS = 30_000;
// Step 3: B must stay waiting this long with pages 2 and 3 open after page 1's close (planning
// probe: B activated about 1.0 s after the last close).
const HOLD_MS = 5_000;
const INTERVAL_MS = 100;

type State = 'unregistered' | 'installing' | 'waiting' | 'active' | 'failed';

const tick = () => new Promise((done) => setTimeout(done, INTERVAL_MS));

const requestLog = (served: Served) =>
  served
    .requests()
    .map((r) => `  ${r.status} ${r.mode ?? '-'} ${r.path}`)
    .join('\n');

/** Replaces the one match of `anchor`; throws unless it matches exactly once (rule 6). */
function replaceOnce(text: string, anchor: string | RegExp, value: string): string {
  const parts = text.split(anchor);
  if (parts.length !== 2) {
    throw new Error(`replaceOnce: ${String(anchor)} matched ${parts.length - 1} times, not once`);
  }
  return parts.join(value);
}

/** The content of the single build marker. */
async function marker(page: Page): Promise<string | null> {
  const meta = page.locator('meta[name="wc-build"]');
  expect(await meta.count(), 'exactly one meta[name="wc-build"]').toBe(1);
  return meta.getAttribute('content');
}

/** Steps 2–3: marker B on a page while another page is open or after a reload is the D route. */
async function expectMarkerA(page: Page, where: string): Promise<void> {
  const value = await marker(page);
  if (value === 'B') throw new Error(`${TIMING}: marker B ${where}`);
  expect(value, `build marker ${where}`).toBe('A');
}

const controlled = (page: Page) => page.evaluate(() => navigator.serviceWorker.controller !== null);

/** The hook's `swState()`; a missing hook throws (rule 6), never reads as a state. */
const readSwState = (page: Page): Promise<State> =>
  page.evaluate(() => {
    if (window.__wordcell === undefined) throw new Error('no window.__wordcell test hook');
    return window.__wordcell.swState();
  });

/**
 * Polls the hook's `swState()` to `want` every 100 ms for 15 s. `failed` throws at once with the
 * request log; with `afterWaiting`, `active` throws the timing label (B activated early).
 */
async function pollState(
  page: Page,
  want: State,
  served: Served,
  opts: { afterWaiting?: boolean } = {},
): Promise<void> {
  const deadline = Date.now() + STATE_POLL_MS;
  let last: State;
  for (;;) {
    last = await readSwState(page);
    if (last === 'failed') {
      throw new Error(`swState() is failed (want ${want}); requests:\n${requestLog(served)}`);
    }
    if (opts.afterWaiting && last === 'active') {
      throw new Error(`${TIMING}: swState() active after waiting was seen`);
    }
    if (last === want) return;
    if (Date.now() >= deadline) {
      throw new Error(
        `swState() did not reach ${want} in ${STATE_POLL_MS} ms (last ${String(last)}); requests:\n${requestLog(served)}`,
      );
    }
    await tick();
  }
}

/**
 * Step 3: `swState()` stays `waiting` for `HOLD_MS`, read every 100 ms. `failed` throws with the
 * request log, `active` the timing label, any other state with the log.
 */
async function holdWaiting(page: Page, served: Served, where: string): Promise<void> {
  const end = Date.now() + HOLD_MS;
  while (Date.now() < end) {
    const state = await readSwState(page);
    if (state === 'active') throw new Error(`${TIMING}: swState() active ${where}`);
    if (state !== 'waiting') {
      throw new Error(`swState() ${state} ${where}, not waiting; requests:\n${requestLog(served)}`);
    }
    await tick();
  }
}

/**
 * Writes a new build over the copy: `index.html` first, then `sw.js` with the `index.html`
 * precache revision changed to the new HTML's MD5 last, so the update check finds a new worker.
 */
function writeBuild(site: Copy, html: string, build: string): void {
  site.swap('index.html', html);
  const swBefore = readFileSync(path.join(site.dir, 'sw.js'), 'utf8');
  const entry = /\{url:"index\.html",revision:"[0-9a-f]+"\}/g;
  const oldEntry = swBefore.match(entry)?.[0];
  const revision = createHash('md5').update(html).digest('hex');
  const newEntry = `{url:"index.html",revision:"${revision}"}`;
  expect(newEntry, `${build} changes the index.html precache revision`).not.toBe(oldEntry);
  site.swap('sw.js', replaceOnce(swBefore, entry, newEntry));
}

/** Shared steps 1–2: A active and controlling page 1, then B written and waiting after two reloads. */
async function setup(page: Page, site: Copy, served: Served): Promise<void> {
  // Step 1: marker A, A active, a reload leaves the page controlled.
  const original = readFileSync(path.join(site.dir, 'index.html'), 'utf8');
  const htmlA = replaceOnce(original, '<head>', '<head>\n    <meta name="wc-build" content="A">');
  site.swap('index.html', htmlA);
  await page.goto(`${served.url}/`);
  await pollState(page, 'active', served);
  await page.reload();
  expect(await controlled(page), 'page 1 controlled after the reload').toBe(true);
  await expectMarkerA(page, 'on page 1 before B is written');
  await pollState(page, 'active', served);

  // Step 2: B = marker B in index.html first, then sw.js with the index.html revision changed last.
  const mark = served.requests().length;
  const htmlB = replaceOnce(
    htmlA,
    '<meta name="wc-build" content="A">',
    '<meta name="wc-build" content="B">',
  );
  writeBuild(site, htmlB, 'B');

  await page.reload();
  // The reload's update check fetches /sw.js; only on a miss the test asks for one itself.
  const deadline = Date.now() + SW_FETCH_POLL_MS;
  const fetched = () =>
    served
      .requests()
      .slice(mark)
      .some((r) => r.path === '/sw.js' && r.status === 200);
  while (!fetched() && Date.now() < deadline) await tick();
  if (!fetched()) {
    test.info().annotations.push({
      type: 'update-fallback',
      description: `no /sw.js 200 within ${SW_FETCH_POLL_MS} ms of the reload: registration.update() called`,
    });
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r?.update()));
  }
  try {
    await pollState(page, 'waiting', served);
  } catch (error) {
    // Before `waiting` was seen, an early activation reads as a timeout: one reload tells D apart.
    if (!fetched() || (await readSwState(page)) !== 'active') throw error;
    await page.reload();
    if ((await controlled(page)) && (await marker(page)) === 'B') {
      throw new Error(`${TIMING}: B active on the reload that found it`);
    }
    throw error;
  }
  expect(fetched(), `a /sw.js 200 logged after the B write`).toBe(true);
  expect(await controlled(page), 'page 1 controlled after the reload that found B').toBe(true);
  await expectMarkerA(page, 'on page 1 after the reload that found B');
  await expectNoPrompt(page);

  await page.reload();
  await pollState(page, 'waiting', served, { afterWaiting: true });
  expect(await controlled(page), 'page 1 controlled after a second reload').toBe(true);
  await expectMarkerA(page, 'on page 1 after a second reload');
  await expectNoPrompt(page);
}

async function openPage(context: BrowserContext, served: Served): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`${served.url}/`);
  return page;
}

async function closePages(context: Pick<BrowserContext, 'pages'>): Promise<void> {
  for (const page of context.pages()) await page.close();
}

type Scope = {
  registration: ServiceWorkerRegistration;
  serviceWorker: ServiceWorker;
  __wcWaiting?: ServiceWorkerState;
};

/** A worker handle and whether its target has closed (tracked from identification on). */
type Tracked = { worker: Worker; closed(): boolean };

function track(worker: Worker): Tracked {
  let closed = false;
  worker.on('close', () => {
    closed = true;
  });
  return { worker, closed: () => closed };
}

/**
 * B's handle, plus A's (the active worker), which records B's state as A's scope sees it. A
 * waiting worker that a newer install replaces is terminated before it turns `redundant`, so B's
 * own handle closes without ever reading `redundant`; A's record still sees it.
 */
type Handle = { b: Tracked; a: Tracked };

/** The `context.serviceWorkers()` entries that hold `slot` of their registration. */
async function inSlot(context: BrowserContext, slot: 'waiting' | 'active'): Promise<Worker[]> {
  const found: Worker[] = [];
  for (const worker of context.serviceWorkers()) {
    const holds = await worker.evaluate(
      (name) =>
        (self as unknown as Scope).registration[name] === (self as unknown as Scope).serviceWorker,
      slot,
    );
    if (holds) found.push(worker);
  }
  return found;
}

/**
 * Step 4: B's handle is the single `context.serviceWorkers()` entry that is its registration's
 * waiting worker, and A's the single active one, found while a page is open; none or several is
 * an observation fault. A's scope starts recording B's state.
 */
async function waitingHandle(context: BrowserContext): Promise<Handle> {
  const waiting = await inSlot(context, 'waiting');
  const active = await inSlot(context, 'active');
  if (waiting.length !== 1 || active.length !== 1) {
    throw new Error(
      `observation fault: of ${context.serviceWorkers().length} context.serviceWorkers() entries, ${waiting.length} are the registration's waiting worker and ${active.length} its active one, not exactly one each`,
    );
  }
  const a = active[0] as Worker;
  await a.evaluate(() => {
    const scope = self as unknown as Scope;
    const b = scope.registration.waiting as ServiceWorker;
    scope.__wcWaiting = b.state;
    b.addEventListener('statechange', () => {
      scope.__wcWaiting = b.state;
    });
  });
  return { b: track(waiting[0] as Worker), a: track(a) };
}

// Per handle read (D-70): an `evaluate` that has not settled this long reads as unreadable, so one
// hanging handle cannot use up the activation poll.
const READ_MS = 2_000;

/** One handle read: its state, or why there is none. */
type Read = { state: ServiceWorkerState | undefined } | { gone: 'closed' | 'unreadable' };

/**
 * Reads a handle: `closed` once its target has closed (`tracked.closed()`); `unreadable`, for this
 * read only, when `evaluate` rejects with a closed, destroyed, detached or restarted error while
 * the handle is not closed, or has not settled within `READ_MS` (nor by `deadline`). Under load
 * Playwright can reject `evaluate` with `Service worker restarted` (D-70 in the ticket 7.10 plan);
 * Playwright then reloads the same worker into a new execution context, so a later read may
 * succeed again. On a restarted worker not yet reloaded, `evaluate` awaits the new context with no
 * deadline of its own, hence the per-read bound. Any other evaluate error is rethrown.
 */
async function readState(
  tracked: Tracked,
  read: () => ServiceWorkerState | undefined,
  deadline: number,
): Promise<Read> {
  if (tracked.closed()) return { gone: 'closed' };
  const evaluated = tracked.worker.evaluate(read).then(
    (state): Read => ({ state }),
    (error: unknown): Read => {
      if (tracked.closed()) return { gone: 'closed' };
      if (/closed|destroyed|detached|restarted/i.test(String(error))) return { gone: 'unreadable' };
      throw error;
    },
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<Read>((resolve) => {
    const bound = Math.min(deadline, Date.now() + READ_MS);
    timer = setTimeout(() => resolve({ gone: 'unreadable' }), Math.max(0, bound - Date.now()));
  });
  return Promise.race([evaluated, late]).finally(() => clearTimeout(timer));
}

/** How the activation poll ended without B activating or turning redundant. */
type Ending =
  | { kind: 'closed' }
  | { kind: 'unreadable' }
  | { kind: 'stayed'; state: ServiceWorkerState | undefined };
type Outcome = { kind: 'activated' } | { kind: 'redundant' } | Ending;

/**
 * Step 4's loop: reads B's state every 100 ms until `deadline`, from B's handle and, when that read
 * has no state (`readState`), from A's record. `activated` or `redundant` ends it at once, and so
 * do both handles closed (`closed`). Any other read with no state from either handle (restarted,
 * raced or past `READ_MS`) ticks and polls on. At the deadline: `unreadable` when the last
 * iteration read no state, else `stayed` with the last state read.
 */
async function activationOutcome(handle: Handle, deadline: number): Promise<Outcome> {
  let last: Read = { gone: 'unreadable' };
  while (Date.now() < deadline) {
    last = await readState(
      handle.b,
      () => (self as unknown as Scope).serviceWorker.state,
      deadline,
    );
    if ('gone' in last) {
      last = await readState(handle.a, () => (self as unknown as Scope).__wcWaiting, deadline);
    }
    if ('state' in last) {
      if (last.state === 'activated' || last.state === 'redundant') return { kind: last.state };
    } else if (handle.b.closed() && handle.a.closed()) {
      return { kind: 'closed' };
    }
    await tick();
  }
  return 'state' in last ? { kind: 'stayed', state: last.state } : { kind: 'unreadable' };
}

/**
 * The error a poll `ending` throws, given the probe page's marker: marker A after both handles
 * closed, or after B read but not activated for the whole poll, is the timing label (SPEC A-A15's
 * D route, Chromium's own activation timing); an ending with unreadable handles is an observation
 * limit, so an observation fault whatever the marker, as is any marker other than A.
 */
function activationFault(ending: Ending, value: string | null): Error {
  const why =
    ending.kind === 'closed'
      ? "B's and A's handles closed"
      : ending.kind === 'unreadable'
        ? `B's and A's handles unreadable (restarted, or no answer within ${READ_MS} ms) at the end of the ${ACTIVATION_POLL_MS} ms poll`
        : `B stayed ${String(ending.state)} for ${ACTIVATION_POLL_MS} ms`;
  if (value === 'A' && ending.kind !== 'unreadable') {
    return new Error(`${TIMING}: ${why}; a probe page shows marker A`);
  }
  return new Error(`observation fault: ${why}; a probe page shows marker ${String(value)}`);
}

/**
 * Step 4: polls B's state to `activated` for 30 s (`activationOutcome`); `redundant` throws at
 * once with the request log. Any other ending opens one probe page and throws
 * `activationFault`'s error. Does not itself close or need closed pages.
 */
async function pollActivated(
  handle: Handle,
  served: Served,
  context: BrowserContext,
): Promise<void> {
  const outcome = await activationOutcome(handle, Date.now() + ACTIVATION_POLL_MS);
  if (outcome.kind === 'activated') return;
  if (outcome.kind === 'redundant') {
    throw new Error(`B's worker turned redundant; requests:\n${requestLog(served)}`);
  }
  const probe = await openPage(context, served);
  throw activationFault(outcome, await marker(probe));
}

/**
 * Runs `body` on its own copy of `dist-test/` and server; closes every page before `stop()`. A
 * cleanup error never replaces the body's (which may carry the timing label): with both, the
 * body's error is rethrown with the cleanup error as its `cause` (Playwright reports message,
 * stack and cause); a body error that is not an `Error` or already has a `cause` becomes an
 * `AggregateError` with the body's message and stack, `[body error, cleanup error]` and the
 * cleanup error as its `cause`.
 */
async function withSite(
  context: Pick<BrowserContext, 'pages'>,
  body: (site: Copy, served: Served) => Promise<void>,
): Promise<void> {
  const site = copy(buildRoot());
  let failed: { error: unknown } | undefined;
  try {
    await body(site, await site.serve());
  } catch (error) {
    failed = { error };
  }
  try {
    try {
      await closePages(context);
    } finally {
      await site.stop();
    }
  } catch (cleanup) {
    if (failed === undefined) throw cleanup;
    const { error } = failed;
    if (error instanceof Error && error.cause === undefined) {
      error.cause = cleanup;
      throw error;
    }
    const both = new AggregateError(
      [error, cleanup],
      error instanceof Error ? error.message : String(error),
      { cause: cleanup },
    );
    if (error instanceof Error) both.stack = error.stack;
    throw both;
  }
  if (failed !== undefined) throw failed.error;
}

test('Q-40 AD-16 A-A15 build B stays waiting on reloads and while pages open and close: every page keeps marker A, no prompt', async ({
  context,
  page,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await withSite(context, async (site, served) => {
    await setup(page, site, served);

    // Step 3: a second page opens, page 1 closes, another opens; B waits throughout.
    const page2 = await openPage(context, served);
    // Control first: an uncontrolled page (marker B from the network) is a test fault, never D.
    expect(await controlled(page2), 'page 2 controlled').toBe(true);
    await expectMarkerA(page2, 'on page 2 with page 1 open');
    await pollState(page2, 'waiting', served, { afterWaiting: true });

    await page.close();
    // Page 2's already-loaded DOM: shows only that page 2 was not reloaded or replaced (markers
    // only; page 2 may show Q-38 and then never registers, AD-9). The hold below checks B.
    await expectMarkerA(page2, 'on page 2 after page 1 closed');

    const page3 = await openPage(context, served);
    expect(await controlled(page3), 'page 3 controlled').toBe(true);
    await expectMarkerA(page3, 'on page 3 with page 2 open');
    await pollState(page3, 'waiting', served, { afterWaiting: true });
    await holdWaiting(page3, served, 'on page 3 while pages 2 and 3 stay open after page 1 closed');
  });
});

test('Q-40 AD-16 A-A15 build B activates only once every page has closed: a new page shows marker B, controlled, active, no prompt', async ({
  context,
  page,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await withSite(context, async (site, served) => {
    await setup(page, site, served);

    // Step 4: B's handle, found while page 1 is open (the CDP version route is unavailable).
    const handle = await waitingHandle(context);

    await closePages(context);
    expect(context.pages(), 'every page of the context closed').toHaveLength(0);

    await pollActivated(handle, served, context);
    test.info().annotations.push({ type: 'route', description: 'worker-handle' });

    const fresh = await openPage(context, served);
    expect(await marker(fresh), 'build marker on the page opened after B activated').toBe('B');
    expect(await controlled(fresh), 'the new page controlled').toBe(true);
    await pollState(fresh, 'active', served);
    await expectNoPrompt(fresh);
  });
});

// AD-17 self-tests of this spec's own failure branches (plan I/O Matrix rows "B redundant /
// `failed`" and "Early activation"): each induces the branch and asserts the check fails with its
// own message, so a real failure is not misread as a pass or as another fault.
// A G3 acceptance that removes the tests for shared steps 1–2 also removes the self-tests that
// call `setup()`.

// Matrix row "B redundant / `failed`", `failed` half: with `sw.js` gone, `register()` rejects and
// the hook build sets `swState()` `failed` (and reports Q-40 to AD-15, so a fatal surface shows).
test('AD-17 the update spec state poll fails at once on swState() failed, with the request log', async ({
  context,
  page,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await withSite(context, async (site, served) => {
    site.remove('sw.js');
    await page.goto(`${served.url}/`);
    const started = Date.now();
    await expect(pollState(page, 'active', served)).rejects.toThrow(
      /swState\(\) is failed \(want active\); requests:\n(.*\n)*\s*404 \S+ \/sw\.js/,
    );
    expect(Date.now() - started, 'failed is caught before the state poll bound').toBeLessThan(
      STATE_POLL_MS,
    );
  });
});

// Matrix row "B redundant / `failed`", `redundant` half: with page 1 open, a build C written over
// B and found by a reload installs and replaces waiting B, so B turns redundant. Pages stay open.
test('AD-17 the update spec activation poll fails at once when B turns redundant, with the request log', async ({
  context,
  page,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await withSite(context, async (site, served) => {
    await setup(page, site, served);
    const handle = await waitingHandle(context);
    // C's own fetch: the log in the message must hold more `/sw.js` 200s than before the C write
    // (B's setup already logged some).
    const sw200 = (log: string) =>
      log.split('\n').filter((line) => /^\s*200 \S+ \/sw\.js$/.test(line)).length;
    const before = sw200(requestLog(served));

    const htmlB = readFileSync(path.join(site.dir, 'index.html'), 'utf8');
    writeBuild(
      site,
      replaceOnce(
        htmlB,
        '<meta name="wc-build" content="B">',
        '<meta name="wc-build" content="C">',
      ),
      'C',
    );
    await page.reload();
    const started = Date.now();
    const failure = pollActivated(handle, served, context);
    await expect(failure).rejects.toThrow(
      /B's worker turned redundant; requests:\n(.*\n)*\s*200 \S+ \/sw\.js/,
    );
    expect(
      Date.now() - started,
      'redundant is caught before the activation poll bound',
    ).toBeLessThan(ACTIVATION_POLL_MS);
    const message = await failure.then(
      () => '',
      (error: unknown) => String(error),
    );
    expect(sw200(message), 'a /sw.js 200 logged after the C write').toBeGreaterThan(before);
    expect(context.pages(), 'page 1 stays open throughout').toHaveLength(1);
  });
});

// Matrix row "Early activation": the test (not the app, AD-16) tells waiting B to skip waiting
// while page 1 is open, so B activates early: the `afterWaiting` state poll and a newly opened
// page's marker check (marker B with another page open) both throw the timing label.
test('AD-17 the update spec timing checks fail with the A-A15 label when B activates while a page is open', async ({
  context,
  page,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await withSite(context, async (site, served) => {
    await setup(page, site, served);
    await page.evaluate(async (bound) => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.waiting) throw new Error('no waiting worker to skip');
      // Returns only once B controls page 1, so the poll below runs after B is active.
      const changed = new Promise<void>((done) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true }),
      );
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      let timer: ReturnType<typeof setTimeout> | undefined;
      const late = new Promise<never>((_, fail) => {
        timer = setTimeout(
          () => fail(new Error(`no controllerchange within ${bound} ms of SKIP_WAITING`)),
          bound,
        );
      });
      await Promise.race([changed, late]);
      clearTimeout(timer);
    }, STATE_POLL_MS);
    await expect(pollState(page, 'waiting', served, { afterWaiting: true })).rejects.toThrow(
      `${TIMING}: swState() active after waiting was seen`,
    );

    const page2 = await openPage(context, served);
    await expect(expectMarkerA(page2, 'on page 2 with page 1 open')).rejects.toThrow(
      `${TIMING}: marker B on page 2 with page 1 open`,
    );
    // Step 3's hold: `active` throws the timing label, not the generic not-waiting fault.
    await pollState(page2, 'active', served);
    await expect(holdWaiting(page2, served, 'on page 2 with page 1 open')).rejects.toThrow(
      `${TIMING}: swState() active on page 2 with page 1 open`,
    );
  });
});

// `withSite`'s cleanup: a cleanup error never replaces the body's (a fake context whose one page
// fails to close; the copy and server are real and stopped).
test('AD-17 the update spec withSite keeps the body error and attaches the cleanup error', async () => {
  const bodyError = new Error(`${TIMING}: body`);
  const cleanupError = new Error('page close failed');
  const failing = {
    pages: () => [{ close: () => Promise.reject(cleanupError) }],
  } as unknown as Pick<BrowserContext, 'pages'>;
  const none = { pages: () => [] } as unknown as Pick<BrowserContext, 'pages'>;
  const outcome = (run: Promise<void>) =>
    run.then(
      () => 'resolved',
      (error: unknown) => error,
    );

  // One error alone is rethrown as it is.
  expect(
    await outcome(
      withSite(none, async () => {
        throw bodyError;
      }),
    ),
  ).toBe(bodyError);
  const both = await outcome(
    withSite(failing, async () => {
      throw bodyError;
    }),
  );
  expect(both).toBe(bodyError);
  expect(bodyError.cause).toBe(cleanupError);
  // A body error that already has a cause keeps it: an AggregateError carries both.
  const caused = new Error(`${TIMING}: caused body`, { cause: 'own cause' });
  const aggregate = await outcome(
    withSite(failing, async () => {
      throw caused;
    }),
  );
  expect(aggregate).toBeInstanceOf(AggregateError);
  expect((aggregate as AggregateError).message).toBe(caused.message);
  expect((aggregate as AggregateError).stack).toBe(caused.stack);
  expect((aggregate as AggregateError).errors).toEqual([caused, cleanupError]);
  expect((aggregate as AggregateError).cause).toBe(cleanupError);
  expect(caused.cause).toBe('own cause');
  // A body value that is not an `Error`: an AggregateError carries both.
  const thrown = await outcome(
    withSite(failing, async () => {
      throw `${TIMING}: string body`;
    }),
  );
  expect(thrown).toBeInstanceOf(AggregateError);
  expect((thrown as AggregateError).message).toBe(`${TIMING}: string body`);
  expect((thrown as AggregateError).errors).toEqual([`${TIMING}: string body`, cleanupError]);
  expect((thrown as AggregateError).cause).toBe(cleanupError);
  expect(await outcome(withSite(failing, async () => {}))).toBe(cleanupError);
  expect(await outcome(withSite(none, async () => {}))).toBe('resolved');
});

/** A page-less `Tracked`: its `evaluate` answers the `call`-th read (0-based) with `answer`. */
const fakeTracked = (
  answer: (call: number) => Promise<ServiceWorkerState | undefined>,
  closed = false,
): Tracked => {
  let calls = 0;
  return {
    closed: () => closed,
    worker: { evaluate: () => answer(calls++) } as unknown as Worker,
  };
};
const restarted = () => Promise.reject(new Error('worker.evaluate: Service worker restarted'));
const hangs = () => new Promise<never>(() => {});

// `readState`'s handle-gone rule (D-70): a restarted worker handle is `unreadable` for that read
// only (Playwright reloads it into a new context), an `evaluate` that never settles is
// `unreadable` by the deadline or `READ_MS`, whichever comes first, a closed handle is `closed`,
// and any other evaluate error is rethrown as it is.
test('AD-17 the update spec readState treats a restarted worker handle as gone', async () => {
  const read = () => (self as unknown as Scope).serviceWorker.state;
  const later = () => Date.now() + 30_000;
  const reloaded = fakeTracked((call) => (call === 0 ? restarted() : Promise.resolve('activated')));
  expect(await readState(reloaded, read, later())).toEqual({ gone: 'unreadable' });
  // Not remembered: the next read evaluates again and sees the reloaded worker.
  expect(await readState(reloaded, read, later())).toEqual({ state: 'activated' });
  // A read that never settles is unreadable by the deadline, not a hang.
  let started = Date.now();
  expect(await readState(fakeTracked(hangs), read, started + 200)).toEqual({ gone: 'unreadable' });
  expect(Date.now() - started).toBeLessThan(5_000);
  // … and by `READ_MS` when the deadline is further off.
  started = Date.now();
  expect(await readState(fakeTracked(hangs), read, later())).toEqual({ gone: 'unreadable' });
  expect(Date.now() - started).toBeLessThan(READ_MS + 1_000);
  expect(await readState(fakeTracked(restarted, true), read, later())).toEqual({ gone: 'closed' });
  const boom = new Error('boom');
  await expect(
    readState(
      fakeTracked(() => Promise.reject(boom)),
      read,
      later(),
    ),
  ).rejects.toBe(boom);
});

// `pollActivated` without pages (D-70): its served log and context are fakes that these branches
// never open (`newPage` throws), so a probe page means the poll ended on the wrong branch.
const noLog = { requests: () => [] } as unknown as Served;
const noProbe = {
  newPage: () => Promise.reject(new Error('no probe page in this self-test')),
} as unknown as BrowserContext;

test("AD-17 the update spec activation poll reports B redundant from A's record while B's handle hangs, well before the poll bound", async () => {
  const handle: Handle = {
    b: fakeTracked(hangs),
    a: fakeTracked(() => Promise.resolve('redundant')),
  };
  const started = Date.now();
  await expect(pollActivated(handle, noLog, noProbe)).rejects.toThrow(
    /^B's worker turned redundant; requests:\n/,
  );
  expect(Date.now() - started, 'one bounded B read, then A').toBeLessThan(3 * READ_MS);
});

test('AD-17 the update spec activation poll passes when B restarts once and then reads activated after A closed', async () => {
  const handle: Handle = {
    b: fakeTracked((call) => (call === 0 ? restarted() : Promise.resolve('activated'))),
    a: fakeTracked(hangs, true),
  };
  await expect(pollActivated(handle, noLog, noProbe)).resolves.toBeUndefined();
});

test('AD-17 the update spec activation poll ends with unreadable handles as an observation fault, never the A-A15 label', async () => {
  const handle: Handle = { b: fakeTracked(restarted), a: fakeTracked(restarted) };
  const ending = await activationOutcome(handle, Date.now() + 500);
  expect(ending).toEqual({ kind: 'unreadable' });
  const unreadable = activationFault(ending as Ending, 'A').message;
  expect(unreadable).toMatch(/^observation fault: B's and A's handles unreadable/);
  expect(unreadable).not.toContain(TIMING);
  // The timing label stays for both handles closed or B read but not activated, with marker A.
  const closed = { b: fakeTracked(hangs, true), a: fakeTracked(hangs, true) };
  expect(await activationOutcome(closed, Date.now() + 500)).toEqual({ kind: 'closed' });
  expect(activationFault({ kind: 'closed' }, 'A').message).toMatch(
    `${TIMING}: B's and A's handles closed`,
  );
  const stayed = { b: fakeTracked(() => Promise.resolve('installed')), a: fakeTracked(hangs) };
  const stayedEnding = await activationOutcome(stayed, Date.now() + 500);
  expect(stayedEnding).toEqual({ kind: 'stayed', state: 'installed' });
  expect(activationFault(stayedEnding as Ending, 'A').message).toMatch(
    `${TIMING}: B stayed installed`,
  );
  expect(activationFault({ kind: 'closed' }, 'B').message).toMatch(/^observation fault: /);
});
