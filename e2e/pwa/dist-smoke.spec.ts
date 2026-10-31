import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, type Page, type Route, test } from '@playwright/test';
import { SWALLOW_MS } from '../../src/ui/gestures/click-swallow';
import { stored } from '../helpers/blocking';
import { END_SHEET, glidesSettled, openFixture, trayIds } from '../helpers/board';
import { bootCalls, recordBootCalls } from '../helpers/boot-calls';
import { skipByPress, watchAdded, watchAddedFromBoot } from '../helpers/celebration';
import { buildRoot, swChunkFile, walk } from '../helpers/dist-test';
import { animationFrames } from '../helpers/lifecycle';
import { expectNoPrompt } from '../helpers/live-region';
import { composeTan, dealNewGame, pinNextSeed, seedPins } from '../helpers/offline';
import { precacheMissing, readPrecacheManifest } from '../helpers/precache';
import { isList } from '../helpers/restore';
import { fixture, seedStorage } from '../helpers/seed';
import { copy } from '../helpers/static-server';

/** AD-15: collects page errors and console errors from now on (attach before the first goto). */
function errorsOf(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.stack ?? error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()} @ ${msg.location().url}`);
  });
  return errors;
}

test('AD-18 production build loads with 52 live cards, no errors and no test hook', async ({
  page,
}) => {
  const errors = errorsOf(page);
  await seedStorage(page, { session: fixture('session-idle-fresh.json') });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  await expect(page.getByTestId(/^card-\d+$/)).toHaveCount(52);
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  expect(await page.evaluate(() => '__wordcell' in window)).toBe(false);
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('AD-18 no file in dist/ contains __wordcell', () => {
  const root = path.resolve(import.meta.dirname, '../../dist');
  const files = walk(root);
  expect(files).toContain('index.html');
  expect(files.some((file) => /^assets\/[^/]+\.js$/.test(file))).toBe(true);
  const hits = files.filter((file) =>
    readFileSync(path.join(root, file), 'latin1').includes('__wordcell'),
  );
  expect(hits).toEqual([]);
});

// Epic 7 CAP-2: the precacheComplete() code sits behind the hook gate, so no app chunk keeps it
// (today only dist/sw.js and dist/workbox-*.js hold these names).
test('AD-17 AD-18 no app chunk in dist/assets contains precacheAndRoute or __WB_REVISION__', () => {
  const root = path.resolve(import.meta.dirname, '../../dist');
  const chunks = walk(root).filter((file) => /^assets\/[^/]+\.js$/.test(file));
  expect(chunks.length).toBeGreaterThan(0);
  const hits = chunks.filter((file) => {
    const text = readFileSync(path.join(root, file), 'latin1');
    return text.includes('precacheAndRoute') || text.includes('__WB_REVISION__');
  });
  expect(hits).toEqual([]);
});

// R-87 (AD-13 "a reload mid-run is a relaunch"): the hook-free build keeps the celebration on (real
// rAF), and a relaunch into a won game opens the sheet at boot without starting it.
test('R-87 a relaunch into a won game plays no celebration in the hook-free build', async ({
  page,
}) => {
  await seedStorage(page, { session: fixture('session-won-words.json') });
  const added = await watchAddedFromBoot(page, '[data-celebration-root]');
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: END_SHEET })).toBeVisible();
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  expect(await added()).toBe(false);
});

// R-87 hook-free row (ticket 10.8; closes the 10.5 deferral): a real win in `dist/` starts the run
// on the real rAF loop (no prefs: Normal speed), proven from the DOM only (AD-17 Celebration seam,
// AD-18: no `window.__wordcell`). The skip follows the start proof at once, the root still attached,
// and the sheet is bounded to 1 s, so the run's natural end (Normal ≈5.8 s) cannot stand in for it.
const WON = 'Every column cleared.';
const wonSheet = (page: Page) => page.getByRole('dialog', { name: WON, exact: true });
const ROOT = '[data-celebration-root]';

async function winIntoRealRun(page: Page): Promise<void> {
  // AD-19 Start: reduced motion plays no run, so pin the media feature.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openFixture(page, 'session-won-words', { booted: false, steps: ['undo'] });
  await expect(page.getByTestId('primary-action')).toHaveText('Confirm');
  const added = await watchAdded(page, ROOT);
  // No root before the winning Confirm, so the `added()` check below is not a leftover.
  await expect(page.locator(ROOT)).toHaveCount(0);
  expect(await added()).toBe(false);
  await page.getByTestId('primary-action').click();
  // The run starts in the winning whenSettled callback, after the commit glide and the 300 ms guard.
  await expect.poll(() => page.locator('[data-celebration-group]').count()).toBeGreaterThan(0);
  // The 10.5 deferral's literal assertion: a root is added after a real winning Confirm.
  expect(await added()).toBe(true);
  await expect(wonSheet(page)).toHaveCount(0);
  // SPEC F21/F26: the first shown copy's transform moves between real frames (a run's first frame
  // has dt 0, so two frames apart).
  await expect
    .poll(async () => {
      const first = await page.evaluate(() => {
        const copies = [...document.querySelectorAll<HTMLElement>('[data-celebration]')];
        const i = copies.findIndex(
          (c) => c.style.visibility !== 'hidden' && c.style.transform !== '',
        );
        return { i, a: copies[i]?.style.transform ?? '' };
      });
      await animationFrames(page, 2);
      const b = await page.evaluate(
        (i) =>
          document.querySelectorAll<HTMLElement>('[data-celebration]')[i]?.style.transform ?? '',
        first.i,
      );
      return first.a !== '' && first.a !== b;
    })
    .toBe(true);
  await expect(page.locator(ROOT)).toHaveCount(1);
}

async function expectSkippedToSheet(page: Page): Promise<void> {
  await expect(page.locator(ROOT)).toHaveCount(0);
  await expect(
    wonSheet(page).getByRole('button', { name: 'Replay this deal', exact: true }),
  ).toBeFocused();
}

test('R-87 hook-free build: a real win plays and a press skips it to the expanded end sheet', async ({
  page,
}) => {
  const errors = errorsOf(page);
  await winIntoRealRun(page);
  // The press is the skip, not a natural finish in the round trips before it: a window capture
  // listener (before skip.ts's document capture listener consumes it) records the root at the press.
  await page.evaluate(() =>
    window.addEventListener(
      'pointerdown',
      () => {
        const w = window as unknown as { __rootAtPress?: boolean };
        w.__rootAtPress ??= document.querySelector('[data-celebration-root]') !== null;
      },
      { capture: true },
    ),
  );
  // A touch tap (Pixel 7); the mouse branch is covered by the e2e/helpers.spec.ts self-test.
  await skipByPress(page);
  await expect(wonSheet(page)).toBeVisible({ timeout: 1000 });
  expect(
    await page.evaluate(() => (window as unknown as { __rootAtPress?: boolean }).__rootAtPress),
  ).toBe(true);
  await expectSkippedToSheet(page);
  await page.waitForLoadState('networkidle');
  // AD-19 Skip / SPEC F18: wait past the press skip's post-run tail (the click swallower and the
  // guard, SWALLOW_MS from the release) so an error thrown there is caught; networkidle resolves at
  // once here.
  await page.evaluate((ms) => new Promise((resolve) => setTimeout(resolve, ms)), SWALLOW_MS + 100);
  expect(errors).toEqual([]);
});

// Back ends the run through `closedByBack` (AD-13 celebration entry, AD-19 `end()`); the depth check
// (back again collapses the sheet) is e2e/celebration.spec.ts's.
test('R-87 hook-free build: a real win plays and back skips it to the expanded end sheet, the app still open', async ({
  page,
}) => {
  const errors = errorsOf(page);
  await winIntoRealRun(page);
  await page.goBack();
  await expect(wonSheet(page)).toBeVisible({ timeout: 1000 });
  await expectSkippedToSheet(page);
  expect(page.url()).not.toBe('about:blank');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('AD-11 ?bands= ignored in dist/', async ({ page }) => {
  await seedStorage(page, { session: fixture('session-idle-fresh.json') });
  await page.goto('/?bands=topBar,banner,leftover,tray,columns,wordcells,actionBar');
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  const order = await page
    .locator('[data-band]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-band')));
  expect(order).toEqual([
    'topBar',
    'banner',
    'leftover',
    'columns',
    'footRow',
    'trayGap',
    'tray',
    'labels',
    'wordcells',
    'actionGap',
    'actionBar',
  ]);
});

test('Q-45 AD-10 the production Theme radiogroup offers Charcoal, Deep Space, Greenhouse Dusk, Brass and Walnut, Daylight Paper and Plum Dusk, applied as default', async ({
  page,
}) => {
  await seedStorage(page, { session: fixture('session-idle-fresh.json') });
  await page.goto('/');
  await expect(page.getByTestId(/^card-\d+$/)).toHaveCount(52);
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(
    'default',
  );
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  const group = page
    .getByRole('dialog', { name: 'Preferences', exact: true })
    .getByRole('radiogroup', { name: 'Theme' });
  const radios = group.getByRole('radio');
  await expect(radios).toHaveCount(6);
  await expect(radios.nth(0)).toHaveAccessibleName('Charcoal');
  await expect(radios.nth(1)).toHaveAccessibleName('Deep Space');
  await expect(radios.nth(2)).toHaveAccessibleName('Greenhouse Dusk');
  await expect(radios.nth(3)).toHaveAccessibleName('Brass and Walnut');
  await expect(radios.nth(4)).toHaveAccessibleName('Daylight Paper');
  await expect(radios.nth(5)).toHaveAccessibleName('Plum Dusk');
  await expect(group.getByRole('radio', { name: 'Charcoal' })).toBeChecked();
  await group.getByRole('radio', { name: 'Plum Dusk' }).check();
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(
    'plum',
  );
  expect(
    await page.evaluate(
      () => document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content,
    ),
  ).toBe('#1D1028');
});

// F6: the tests above leave the worker mode at Playwright's default (no `serviceWorkers` set). The
// offline proof needs the worker to run and control the reloaded page, so this describe sets
// `allow` explicitly (never at file level). Entry 7 adds its cases here; each test does its own
// setup (seedStorage throws on a second call per page).
test.describe('F6 serviceWorkers allow', () => {
  test.use({ serviceWorkers: 'allow' });

  // Epic 7 CAP-4 (ticket 7.6; brief §6.8): e2e/pwa/offline.spec.ts's steps minus the hook reads.
  test('AD-16 AD-17 offline after the precache is complete: a reload restores the game with no prompt, then deals and validates a word', async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(60_000);
    // AD-15: console is not checked (offline network errors log there).
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    await pinNextSeed(page);
    await seedStorage(page, { session: fixture('session-idle-fresh.json') });
    await page.goto('/');
    await expect(page.locator('[data-card-id]')).toHaveCount(52);

    // 1. The move, online.
    await composeTan(page);

    // 2. The precache is complete: every manifest URL is cached and the worker is activated.
    const urls = (await readPrecacheManifest(request)).map((entry) => entry.url);
    await expect
      .poll(
        async () => ({
          missing: await precacheMissing(page, urls),
          active: await page.evaluate(
            async () => (await navigator.serviceWorker.getRegistration())?.active?.state ?? null,
          ),
        }),
        { timeout: 15_000 },
      )
      .toEqual({ missing: [], active: 'activated' });

    // 3. Before-state.
    type Stored = { activeMs: number; [key: string]: unknown };
    const storedSession = async (): Promise<Stored> => {
      const text = await stored(page, 'wordcell:session');
      if (text === null) throw new Error('wordcell:session is not stored');
      return JSON.parse(text) as Stored;
    };
    const beforeSession = await storedSession();
    const beforeTray = await trayIds(page);

    // 4. Offline reload, served by the worker.
    await context.setOffline(true);
    // One call, so neither promise is left pending if the other rejects.
    const [response, listResponse] = await Promise.all([
      page.reload(),
      page.waitForResponse((r) => isList(r.request())),
    ]);
    expect(response?.fromServiceWorker(), 'the reload is served by the worker').toBe(true);
    expect(listResponse.fromServiceWorker(), 'the word list is served by the worker').toBe(true);

    // 5. Restore: the restored draft with the list ready, then the stored Session (the old page's
    // pagehide write).
    const primary = page.getByTestId('primary-action');
    await expect(primary).toHaveText('Validate');
    expect(await trayIds(page)).toEqual(beforeTray);
    const afterSession = await storedSession();
    expect(afterSession).toEqual({ ...beforeSession, activeMs: expect.any(Number) });
    expect(afterSession.activeMs).toBeGreaterThanOrEqual(beforeSession.activeMs);

    // 6. No prompt after the offline reload (AD-16), before the deal.
    await expectNoPrompt(page);

    // 7. Deal, still offline.
    await dealNewGame(page);
    expect(await trayIds(page)).toEqual([]);
    await expect
      .poll(async () => {
        const s = await storedSession();
        return { seed: s.seed, moves: s.moves, cursor: s.cursor };
      })
      .toEqual({ seed: 1, moves: [], cursor: { index: 0, phase: 'idle' } });
    expect(await seedPins(page)).toBe(1);

    // 8. Validate a word, still offline.
    await composeTan(page);
    await expect(primary).toHaveText('Validate');
    await primary.click();
    await expect(primary).toHaveText('Confirm');
    await glidesSettled(page);
    await expectNoPrompt(page);
    expect(errors).toEqual([]);
  });

  // Epic 7 SPEC CAP-5 (ticket 7.7; Q-40, F17): each Q-40 failure on the hook-free build is silent.
  // The page boots, deals and validates with nothing shown (`expectNoPrompt`, no `pageerror`;
  // console not checked: the 404s log there). In the missing-script and chunk cases persistence is
  // requested after the failure (entry 5's boot-call log; no `dictionary` key without the hook);
  // the icon case does not read the log for it (persistence follows the fulfilled `register()`,
  // before the install fails). The `dist-test/` halves (fatal
  // surface, `swState()` `failed`) are in e2e/pwa/sw-failure.spec.ts.
  const Q40_TIMEOUT_MS = 60_000;
  const POLL_MS = 15_000;
  const INTERVAL_MS = 100;
  const ICON = '/icons/icon-192.png';

  const macrotask = (page: Page) =>
    page.evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

  const pageErrors = (page: Page): string[] => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    return errors;
  };

  /** Boots `session-idle-fresh.json` with the seed stub and the boot-call log armed. */
  const arm = async (page: Page): Promise<void> => {
    await pinNextSeed(page);
    await seedStorage(page, { session: fixture('session-idle-fresh.json') });
    await recordBootCalls(page);
  };

  /** Plays a move, deals a new game (seed pinned to 1) and validates TAN, with nothing shown. */
  const playAndValidate = async (page: Page): Promise<void> => {
    await composeTan(page);
    await dealNewGame(page);
    expect(await seedPins(page)).toBe(1);
    await composeTan(page);
    const primary = page.getByTestId('primary-action');
    await expect(primary).toHaveText('Validate');
    await primary.click();
    await expect(primary).toHaveText('Confirm');
    await glidesSettled(page);
    await expectNoPrompt(page);
  };

  test('Q-40 the worker script missing: register() rejects silently, persistence is requested after it settles, then the page deals and validates with nothing shown', async ({
    page,
  }) => {
    test.setTimeout(Q40_TIMEOUT_MS);
    const errors = pageErrors(page);
    const site = copy(buildRoot());
    try {
      site.remove('sw.js');
      const served = await site.serve();
      await arm(page);
      await page.goto(`${served.url}/`);
      await expect(page.locator('[data-card-id]')).toHaveCount(52);
      await expect
        .poll(() => served.requests().some((r) => r.path === '/sw.js' && r.status === 404), {
          message: 'the static server answered /sw.js 404',
          timeout: POLL_MS,
        })
        .toBe(true);
      const want = [
        { event: 'register' },
        { event: 'register-settled', outcome: 'rejected' },
        { event: 'persisted' },
        { event: 'persist' },
      ];
      await expect.poll(() => bootCalls(page), { timeout: POLL_MS }).toStrictEqual(want);
      await page.waitForLoadState('networkidle');
      await macrotask(page);
      expect(await bootCalls(page)).toStrictEqual(want);
      await expectNoPrompt(page);
      await playAndValidate(page);
      expect(errors).toEqual([]);
    } finally {
      await site.stop();
    }
  });

  test('Q-40 a precached icon 404 during the first install: the install turns redundant silently, then the page deals and validates with nothing shown', async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(Q40_TIMEOUT_MS);
    const errors = pageErrors(page);
    const urls = (await readPrecacheManifest(request)).map((entry) => entry.url);
    expect(urls, 'the icon is a precache entry').toContain(ICON.slice(1));
    let workerHits = 0;
    let answered!: { resolve: () => void; reject: (error: Error) => void };
    const done = new Promise<void>((resolve, reject) => {
      answered = { resolve, reject };
    });
    // F6: before the first goto, so the first install's precache fetch of the icon (which the
    // page itself does not load) reaches it; matched by pathname, anything else is not ours.
    await context.route(
      (url) => url.pathname === ICON,
      async (route) => {
        if (route.request().serviceWorker() === null) return route.fallback();
        workerHits++;
        if (workerHits > 1) return route.fulfill({ status: 404, body: '' });
        // Held until the page has observed the install (`register()` fulfilled), so the 404
        // fails a worker the page registered.
        const deadline = Date.now() + POLL_MS;
        let log: Awaited<ReturnType<typeof bootCalls>> = [];
        let outcome: string | undefined;
        try {
          for (;;) {
            log = await bootCalls(page);
            outcome = log.find((call) => call.event === 'register-settled')?.outcome;
            if (outcome !== undefined || Date.now() >= deadline) break;
            await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
          }
        } catch (error) {
          // A failed read reaches the test as the awaited rejection, never a timeout.
          await route.fulfill({ status: 404, body: '' });
          answered.reject(error as Error);
          return;
        }
        await route.fulfill({ status: 404, body: '' });
        if (outcome === 'fulfilled') answered.resolve();
        else
          answered.reject(
            new Error(
              `the held icon was released without register() fulfilled: ${JSON.stringify(log)}`,
            ),
          );
      },
    );
    await arm(page);
    await page.goto('/');
    let timer: ReturnType<typeof setTimeout> | undefined;
    await Promise.race([
      done,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`no worker request for ${ICON} reached the context.route`)),
          2 * POLL_MS,
        );
      }),
    ]).finally(() => clearTimeout(timer));
    // No worker left in any slot: the first install failed (Q-40), none activated. `empty` is no
    // registration, or one with no installing, waiting or active worker; anything else reads as
    // its slot states.
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration === undefined) return 'empty';
            const slots = {
              installing: registration.installing?.state ?? null,
              waiting: registration.waiting?.state ?? null,
              active: registration.active?.state ?? null,
            };
            return Object.values(slots).every((state) => state === null) ? 'empty' : slots;
          }),
        { timeout: POLL_MS },
      )
      .toBe('empty');
    expect(workerHits, 'the worker requested the icon exactly once').toBe(1);
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    await expectNoPrompt(page);
    await playAndValidate(page);
    expect(errors).toEqual([]);
  });

  test('Q-40 (F17) the sw.ts chunk 404: the failed import is silent, persistence is requested after it, then the page deals and validates with nothing shown', async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(Q40_TIMEOUT_MS);
    const errors = pageErrors(page);
    const held: Route[] = [];
    // The uncontrolled first-launch page (as boot-order.spec.ts): page.route sees the chunk
    // request. Held, so the log is read before the import fails.
    await page.route(new URL(`/${swChunkFile()}`, baseURL).href, (route) => {
      held.push(route);
    });
    await arm(page);
    await page.goto('/');
    await expect.poll(() => held.length, { timeout: POLL_MS }).toBe(1);
    await macrotask(page);
    expect(
      (await bootCalls(page)).map((call) => call.event),
      'no persisted call while the chunk is held',
    ).not.toContain('persisted');
    await held[0]?.fulfill({ status: 404, body: '' });
    await expect
      .poll(() => bootCalls(page), { timeout: POLL_MS })
      .toStrictEqual([{ event: 'persisted' }, { event: 'persist' }]);
    await page.waitForLoadState('networkidle');
    await macrotask(page);
    expect(await bootCalls(page)).toStrictEqual([{ event: 'persisted' }, { event: 'persist' }]);
    expect(held, 'the sw.ts chunk route was hit once').toHaveLength(1);
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    await expectNoPrompt(page);
    await playAndValidate(page);
    expect(errors).toEqual([]);
  });
});
