import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { expectAnotherWindow, expectOnlyButton, kind, stored } from './helpers/blocking';
import { button, expectLeaves, hitAt, wc } from './helpers/dialogs';
import { buildRoot } from './helpers/dist-test';
import {
  animationFrames,
  hidePage,
  pageHide,
  pageShow,
  showPage,
  startHidden,
} from './helpers/lifecycle';
import {
  booted,
  dictionaryReady,
  open,
  openBoard,
  type Snapshot,
  sessionOf,
  snapshot,
  waitForDictionary,
} from './helpers/restore';
import { captureBoot, fixture, seedStorage } from './helpers/seed';
import { armStorageSpy, storageWrites } from './helpers/storage-spy';
import { tokenColor } from './helpers/style';
import { longPress, touchDrag } from './helpers/touch';

// AD-17 helper self-tests. The direct `page.evaluate` writes to `wordcell:*` below stand in for the
// app's own writes during a prior load; they are not seeding and are allowed only in this file.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'AD-17 helper self-tests run on android');
});

type ProbeEvent = {
  type: string;
  pointerType: string | null;
  clientX: number;
  clientY: number;
  timeStamp: number;
  coalesced: number;
};

type LifecycleEvent = {
  type: string;
  listener: 'window' | 'document';
  target: 'window' | 'document' | 'other';
  visibilityState: DocumentVisibilityState;
  hidden: boolean;
  persisted: boolean | null;
};

const readKey = (page: Page, key: string) =>
  page.evaluate((k) => localStorage.getItem(k), `wordcell:${key}`);

const writeKey = (page: Page, key: string, value: string) =>
  page.evaluate(([k, v]) => localStorage.setItem(k, v), [`wordcell:${key}`, value] as const);

const readBoot = (page: Page) => page.evaluate(() => window.__wordcellBoot);

test.describe('seedStorage / captureBoot', () => {
  test('AD-17 fixture returns a root fixture file verbatim and throws for a missing one', () => {
    const text = fixture('session-idle-fresh.json');
    expect(text).toBe(
      readFileSync(
        path.resolve(import.meta.dirname, '../fixtures/session-idle-fresh.json'),
        'utf8',
      ),
    );
    expect(JSON.parse(text)).toMatchObject({ version: 1, seed: 1 });
    expect(() => fixture('session-no-such-fixture.json')).toThrow(/ENOENT/);
  });

  test('AD-17 seedStorage seeds once; a reload does not re-seed', async ({ page }) => {
    await seedStorage(page, { session: 'a' });
    await page.goto('/');
    expect(await readKey(page, 'session')).toBe('a');
    await writeKey(page, 'session', 'b');
    await page.reload();
    expect(await readKey(page, 'session')).toBe('b');
  });

  test('AD-17 a new page in the same context is not seeded (page-scoped init script)', async ({
    page,
  }) => {
    const page1 = page;
    const context = page.context();
    await seedStorage(page1, { session: 'a' });
    await page1.goto('/');
    await writeKey(page1, 'session', 'b');
    const page2 = await context.newPage();
    await page2.goto('/');
    expect(await readKey(page2, 'session')).toBe('b');
  });

  test('AD-17 seedStorage with captureBoot records the boot values on every load', async ({
    page,
  }) => {
    const expected = { 'wordcell:session': 'a', 'wordcell:history': null, 'wordcell:prefs': null };
    await seedStorage(page, { session: 'a' }, { captureBoot: true });
    await page.goto('/');
    expect(await readBoot(page)).toEqual(expected);
    await page.reload();
    expect(await readBoot(page)).toEqual(expected);
  });

  test('AD-17 seedStorage with captureBoot records live values after reload', async ({ page }) => {
    await seedStorage(page, { session: 'a' }, { captureBoot: true });
    await page.goto('/');
    await writeKey(page, 'session', 'b');
    await page.reload();
    expect(await readBoot(page)).toEqual({
      'wordcell:session': 'b',
      'wordcell:history': null,
      'wordcell:prefs': null,
    });
  });

  test('AD-17 captureBoot records absent keys as null and later writes on reload', async ({
    page,
  }) => {
    // Paused, so the reload's pagehide flush (R-73) writes the in-memory Session unchanged.
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    await captureBoot(page);
    await page.goto('/');
    expect(await readBoot(page)).toEqual({
      'wordcell:session': null,
      'wordcell:history': null,
      'wordcell:prefs': null,
    });
    // The app's first-launch write, then its hide flush on reload, are the later writes.
    const session = await page.evaluate(() => {
      const current = window.__wordcell?.current();
      if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
      return current.session;
    });
    await writeKey(page, 'prefs', 's');
    await page.reload();
    const boot = await readBoot(page);
    expect(JSON.parse(boot?.['wordcell:session'] ?? 'null')).toEqual(session);
    expect(boot).toEqual({
      'wordcell:session': expect.any(String),
      'wordcell:history': null,
      'wordcell:prefs': 's',
    });
  });

  test('AD-17 seedStorage leaves omitted keys untouched', async ({ page }) => {
    const page1 = page;
    const context = page.context();
    await page1.goto('/');
    await writeKey(page1, 'prefs', 'p');
    await page1.close();
    const page2 = await context.newPage();
    await seedStorage(page2, { session: 'a' }, { captureBoot: true });
    await page2.goto('/');
    expect(await readBoot(page2)).toEqual({
      'wordcell:session': 'a',
      'wordcell:history': null,
      'wordcell:prefs': 'p',
    });
  });

  test('AD-17 seedStorage writes values verbatim, including quotes, escapes and empty', async ({
    page,
  }) => {
    const tricky = `it's "quoted" \\ back\nslash`;
    await seedStorage(page, { history: tricky, prefs: '' }, { captureBoot: true });
    await page.goto('/');
    expect(await readBoot(page)).toEqual({
      'wordcell:session': null,
      'wordcell:history': tricky,
      'wordcell:prefs': '',
    });
  });

  test('AD-17 seedStorage twice on one page rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await seedStorage(fresh, { session: 'a' });
    await expect(seedStorage(fresh, { session: 'a' })).rejects.toThrow(/already called/);
  });

  test('AD-17 captureBoot after seedStorage rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await seedStorage(fresh, { session: 'a' });
    await expect(captureBoot(fresh)).rejects.toThrow(/already called/);
  });

  test('AD-17 seedStorage after captureBoot rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await captureBoot(fresh);
    await expect(seedStorage(fresh, { session: 'a' })).rejects.toThrow(/already called/);
  });

  test('AD-17 captureBoot twice on one page rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await captureBoot(fresh);
    await expect(captureBoot(fresh)).rejects.toThrow(/already called/);
  });

  test('AD-17 seedStorage after goto rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await fresh.goto('/');
    await expect(seedStorage(fresh, { session: 'a' })).rejects.toThrow(/about:blank/);
  });

  test('AD-17 captureBoot after goto rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await fresh.goto('/');
    await expect(captureBoot(fresh)).rejects.toThrow(/about:blank/);
  });

  test('AD-17 seedStorage with no keys rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await expect(seedStorage(fresh, {})).rejects.toThrow(/no keys/);
  });

  test('AD-17 seedStorage that fails validation does not track the page', async ({ page }) => {
    const fresh = await page.context().newPage();
    await expect(seedStorage(fresh, {})).rejects.toThrow(/no keys/);
    await expect(seedStorage(fresh, { session: 'a' })).resolves.toBeUndefined();
  });

  test('AD-17 seedStorage checks no keys before already called', async ({ page }) => {
    const fresh = await page.context().newPage();
    await seedStorage(fresh, { session: 'a' });
    await expect(seedStorage(fresh, {})).rejects.toThrow(/no keys/);
  });

  test('AD-17 seedStorage checks already called before about:blank', async ({ page }) => {
    const fresh = await page.context().newPage();
    await seedStorage(fresh, { session: 'a' });
    await fresh.goto('/');
    await expect(seedStorage(fresh, { session: 'a' })).rejects.toThrow(/already called/);
  });

  test('AD-17 captureBoot checks already called before about:blank', async ({ page }) => {
    const fresh = await page.context().newPage();
    await captureBoot(fresh);
    await fresh.goto('/');
    await expect(captureBoot(fresh)).rejects.toThrow(/already called/);
  });
});

test.describe('restore helpers', () => {
  test('AD-17 snapshot reports present keys in fixed order and open() waits past booting', async ({
    page,
    browser,
  }) => {
    await seedStorage(page, { session: fixture('session-place.json') });
    await open(page);
    expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('active');
    expect((await snapshot(page)).present).toEqual(['wordcell:session']);

    const other = await browser.newContext();
    try {
      const page2 = await other.newPage();
      await seedStorage(page2, {
        session: fixture('session-place.json'),
        history: fixture('history-three-records.json'),
        prefs: fixture('prefs-non-default.json'),
      });
      await open(page2, page.url());
      expect((await snapshot(page2)).present).toEqual([
        'wordcell:session',
        'wordcell:history',
        'wordcell:prefs',
      ]);
    } finally {
      await other.close();
    }
  });

  test('AD-17 booted, sessionOf and dictionaryReady read the active store and the ready word list', async ({
    page,
  }) => {
    await seedStorage(page, { session: fixture('session-place.json') });
    await open(page);
    const current = await page.evaluate(() => window.__wordcell?.current());
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    expect(sessionOf(await snapshot(page))).toEqual({
      ...current.session,
      activeMs: expect.any(Number),
    });
    const halted: Snapshot = {
      stored: null,
      current: { kind: 'halted' },
      loaded: { session: null, history: null, prefs: null },
      present: [],
    };
    expect(() => sessionOf(halted)).toThrow('store is halted');

    await page.reload();
    await booted(page);
    expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('active');
    await dictionaryReady(page);
    expect(await page.evaluate(() => window.__wordcell?.dictionaryState())).toBe('ready');
  });
});

test.describe('board, dictionary and style helpers', () => {
  test('AD-17 openBoard waits for card 0; waitForDictionary waits for the given word-list state', async ({
    page,
  }) => {
    await page.route('**/en*.txt', (route) => route.fulfill({ status: 500, body: '' }));
    await seedStorage(page, { session: fixture('session-place.json') });
    await openBoard(page);
    await expect(page.getByTestId('card-0')).toBeVisible();
    await waitForDictionary(page, 'failed');
    expect(await page.evaluate(() => window.__wordcell?.dictionaryState())).toBe('failed');
    await page.unroute('**/en*.txt');
    await page.reload();
    await waitForDictionary(page, 'ready');
    expect(await page.evaluate(() => window.__wordcell?.dictionaryState())).toBe('ready');
  });

  test('AD-17 tokenColor resolves a colour token to its computed rgb form and leaves no probe', async ({
    page,
  }) => {
    await openBoard(page);
    await page.evaluate(() => document.documentElement.style.setProperty('--probe', '#ff8000'));
    const children = () => page.evaluate(() => document.body.childElementCount);
    const before = await children();
    expect(await tokenColor(page, '--probe')).toBe('rgb(255, 128, 0)');
    expect(await children()).toBe(before);
  });
});

test.describe('blocking helpers', () => {
  test('AD-17 kind and stored read the hook and localStorage; expectOnlyButton and expectAnotherWindow pass on the another-window message', async ({
    page,
  }) => {
    const text = fixture('session-place.json');
    await seedStorage(page, { session: text });
    await openBoard(page);
    expect(await kind(page)).toBe('active');
    expect(await stored(page, 'wordcell:session')).toBe(text);
    expect(await stored(page, 'wordcell:history')).toBeNull();
    // Another page's write halts this one (Q-38).
    const page2 = await page.context().newPage();
    await page2.goto('/favicon.svg');
    await writeKey(page2, 'prefs', '{}');
    await expectAnotherWindow(page);
    await expectOnlyButton(page, 'Reload');
    expect(await kind(page)).toBe('halted');
  });
});

test.describe('dialog helpers', () => {
  test('AD-17 wc, button and hitAt read a healthy board; expectLeaves goes back from the base entry to about:blank', async ({
    page,
  }) => {
    await openBoard(page);
    expect(await wc(page)).toEqual({ wc: 0, launch: expect.any(Number) });
    const undo = await button(page, 'Undo').boundingBox();
    if (undo === null) throw new Error('no Undo box');
    expect(await hitAt(page, undo.x + undo.width / 2, undo.y + undo.height / 2)).toMatchObject({
      kind: 'button',
      dialog: null,
    });
    const card = await page.getByTestId('card-0').boundingBox();
    if (card === null) throw new Error('no card-0 box');
    const hit = await hitAt(page, card.x + card.width / 2, card.y + card.height / 2);
    expect(hit.dialog).toBeNull();
    expect(hit.kind).not.toBe('scrim');
    await expectLeaves(page);
  });
});

test.describe('storage spy', () => {
  test('AD-17 the spy records localStorage writes and removals in order across keys', async ({
    page,
  }) => {
    await page.goto('/');
    await armStorageSpy(page);
    expect(await storageWrites(page)).toEqual([]);
    await page.evaluate(() => {
      localStorage.setItem('wordcell:prefs', 'p1');
      localStorage.setItem('other', 'o');
      localStorage.removeItem('wordcell:prefs');
      localStorage.setItem('wordcell:session', 's');
      localStorage.removeItem('absent');
    });
    expect(await storageWrites(page)).toEqual([
      { key: 'wordcell:prefs', value: 'p1' },
      { key: 'other', value: 'o' },
      { key: 'wordcell:prefs', value: null },
      { key: 'wordcell:session', value: 's' },
      { key: 'absent', value: null },
    ]);
    expect(await readKey(page, 'session')).toBe('s');
    expect(await readKey(page, 'prefs')).toBeNull();
    await expect(armStorageSpy(page)).rejects.toThrow(/already armed/);
  });

  test('AD-17 the thrower records its key, throws storage-spy: <key> and leaves the stored value', async ({
    page,
  }) => {
    await page.goto('/');
    await armStorageSpy(page, { throwOn: 'wordcell:session' });
    const before = await readKey(page, 'session');
    expect(before).not.toBeNull();
    const thrown = await page.evaluate(() => {
      try {
        localStorage.setItem('wordcell:session', 'x');
        return null;
      } catch (error) {
        return (error as Error).message;
      }
    });
    expect(thrown).toBe('storage-spy: wordcell:session');
    expect(await readKey(page, 'session')).toBe(before);
    await writeKey(page, 'prefs', 'p');
    expect(await readKey(page, 'prefs')).toBe('p');
    expect(await storageWrites(page)).toEqual([
      { key: 'wordcell:session', value: 'x' },
      { key: 'wordcell:prefs', value: 'p' },
    ]);
  });

  test('AD-17 the spy does not record sessionStorage writes', async ({ page }) => {
    await page.goto('/');
    await armStorageSpy(page, { throwOn: 'wordcell:session' });
    await page.evaluate(() => {
      sessionStorage.setItem('wordcell:session', 's');
      sessionStorage.setItem('other', 'o');
      sessionStorage.removeItem('wordcell:session');
    });
    expect(await page.evaluate(() => sessionStorage.getItem('other'))).toBe('o');
    expect(await storageWrites(page)).toEqual([]);
  });
});

test.describe('touchDrag / longPress', () => {
  async function installProbe(page: Page): Promise<void> {
    await page.evaluate(() => {
      const w = window as unknown as { __probeEvents: ProbeEvent[] };
      w.__probeEvents = [];
      const probe = document.createElement('div');
      probe.style.cssText =
        'position: fixed; inset: 0; z-index: 2147483647; touch-action: none; user-select: none;';
      for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
        probe.addEventListener(type, (event) => {
          const e = event as PointerEvent;
          w.__probeEvents.push({
            type: e.type,
            pointerType: e.pointerType,
            clientX: e.clientX,
            clientY: e.clientY,
            timeStamp: e.timeStamp,
            coalesced: e.getCoalescedEvents().length || 1,
          });
        });
      }
      probe.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const e = event as MouseEvent;
        w.__probeEvents.push({
          type: e.type,
          pointerType: null,
          clientX: e.clientX,
          clientY: e.clientY,
          timeStamp: e.timeStamp,
          coalesced: 1,
        });
      });
      document.body.append(probe);
    });
  }

  async function probeEvents(page: Page): Promise<ProbeEvent[]> {
    await page.waitForFunction(
      () =>
        (window as unknown as { __probeEvents: ProbeEvent[] }).__probeEvents.some(
          (e) => e.type === 'pointerup' || e.type === 'pointercancel',
        ),
      undefined,
      { timeout: 5_000 },
    );
    return page.evaluate(
      () => (window as unknown as { __probeEvents: ProbeEvent[] }).__probeEvents,
    );
  }

  test('AD-17 touchDrag produces touch pointerdown, pointermoves and pointerup', async ({
    page,
  }) => {
    const from = { x: 60, y: 200 };
    const to = { x: 300, y: 600 };
    const steps = 10;
    await page.goto('/');
    await installProbe(page);
    await touchDrag(page, from, to);
    const events = await probeEvents(page);
    const pointer = events.filter((e) => e.type !== 'contextmenu');
    expect(pointer.filter((e) => e.type === 'pointercancel')).toEqual([]);
    for (const e of pointer) expect(e.pointerType).toBe('touch');
    const down = pointer.find((e) => e.type === 'pointerdown');
    const up = pointer.find((e) => e.type === 'pointerup');
    const moves = pointer.filter((e) => e.type === 'pointermove');
    expect(down).toBeDefined();
    expect(up).toBeDefined();
    expect(moves.length).toBeGreaterThanOrEqual(1);
    expect(moves.reduce((sum, e) => sum + e.coalesced, 0)).toBeGreaterThanOrEqual(steps);
    expect(Math.abs((down?.clientX ?? Number.NaN) - from.x)).toBeLessThanOrEqual(1);
    expect(Math.abs((down?.clientY ?? Number.NaN) - from.y)).toBeLessThanOrEqual(1);
    expect(Math.abs((up?.clientX ?? Number.NaN) - to.x)).toBeLessThanOrEqual(1);
    expect(Math.abs((up?.clientY ?? Number.NaN) - to.y)).toBeLessThanOrEqual(1);
  });

  test('AD-17 longPress holds a touch pointer for at least ms', async ({ page }) => {
    const ms = 600;
    const at = { x: 200, y: 400 };
    await page.goto('/');
    await installProbe(page);
    await longPress(page, at, ms);
    const events = await probeEvents(page);
    const pointer = events.filter((e) => e.type !== 'contextmenu');
    expect(pointer.filter((e) => e.type === 'pointercancel')).toEqual([]);
    for (const e of pointer) expect(e.pointerType).toBe('touch');
    const down = pointer.find((e) => e.type === 'pointerdown');
    const up = pointer.find((e) => e.type === 'pointerup');
    expect(down).toBeDefined();
    expect(up).toBeDefined();
    expect((up?.timeStamp ?? Number.NaN) - (down?.timeStamp ?? Number.NaN)).toBeGreaterThanOrEqual(
      ms - 1,
    );
    expect(Math.abs((down?.clientX ?? Number.NaN) - at.x)).toBeLessThanOrEqual(1);
    expect(Math.abs((down?.clientY ?? Number.NaN) - at.y)).toBeLessThanOrEqual(1);
    expect(Math.abs((up?.clientX ?? Number.NaN) - at.x)).toBeLessThanOrEqual(1);
    expect(Math.abs((up?.clientY ?? Number.NaN) - at.y)).toBeLessThanOrEqual(1);
  });
});

test.describe('hidePage / showPage / pageHide / pageShow', () => {
  async function installRecorder(page: Page): Promise<void> {
    await page.evaluate(() => {
      const w = window as unknown as { __lifecycleEvents: LifecycleEvent[] };
      w.__lifecycleEvents = [];
      const record = (listener: 'window' | 'document') => (event: Event) => {
        w.__lifecycleEvents.push({
          type: event.type,
          listener,
          target:
            event.target === document ? 'document' : event.target === window ? 'window' : 'other',
          visibilityState: document.visibilityState,
          hidden: document.hidden,
          persisted: event instanceof PageTransitionEvent ? event.persisted : null,
        });
      };
      for (const type of ['visibilitychange', 'pagehide', 'pageshow']) {
        window.addEventListener(type, record('window'));
        document.addEventListener(type, record('document'));
      }
    });
  }

  const lifecycleEvents = (page: Page) =>
    page.evaluate(
      () => (window as unknown as { __lifecycleEvents: LifecycleEvent[] }).__lifecycleEvents,
    );

  // Returns the events recorded while `action` ran.
  async function during(page: Page, action: () => Promise<void>): Promise<LifecycleEvent[]> {
    const before = (await lifecycleEvents(page)).length;
    await action();
    return (await lifecycleEvents(page)).slice(before);
  }

  async function expectVisibilityChange(page: Page, action: () => Promise<void>, hidden: boolean) {
    const state = hidden ? 'hidden' : 'visible';
    const events = await during(page, action);
    expect(events).toEqual([
      {
        type: 'visibilitychange',
        listener: 'document',
        target: 'document',
        visibilityState: state,
        hidden,
        persisted: null,
      },
      {
        type: 'visibilitychange',
        listener: 'window',
        target: 'document',
        visibilityState: state,
        hidden,
        persisted: null,
      },
    ]);
    expect(await page.evaluate(() => [document.visibilityState, document.hidden])).toEqual([
      state,
      hidden,
    ]);
  }

  test('AD-17 hidePage / showPage fire one visibilitychange each and reject a no-op', async ({
    page,
  }) => {
    await page.goto('/');
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible');
    await installRecorder(page);
    await expect(showPage(page)).rejects.toThrow(/already 'visible'/);
    await expectVisibilityChange(page, () => hidePage(page), true);
    await expectVisibilityChange(page, () => showPage(page), false);
    await expectVisibilityChange(page, () => hidePage(page), true);
    await expect(hidePage(page)).rejects.toThrow(/already 'hidden'/);
    expect(await lifecycleEvents(page)).toHaveLength(6);
  });

  test('AD-17 startHidden loads the page hidden; showPage then makes it visible with one visibilitychange', async ({
    page,
  }) => {
    await startHidden(page);
    await page.goto('/');
    expect(await page.evaluate(() => [document.visibilityState, document.hidden])).toEqual([
      'hidden',
      true,
    ]);
    await installRecorder(page);
    await expect(hidePage(page)).rejects.toThrow(/already 'hidden'/);
    await expectVisibilityChange(page, () => showPage(page), false);
  });

  test('AD-17 animationFrames resolves after the given number of animation frames', async ({
    page,
  }) => {
    // A blank document: no app code requests frames, so every call counted is the helper's.
    await page.setContent('<p>frames</p>');
    await page.evaluate(() => {
      const w = window as unknown as { __raf: { calls: number; fired: number } };
      w.__raf = { calls: 0, fired: 0 };
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) => {
        w.__raf.calls += 1;
        return raf((time) => {
          w.__raf.fired += 1;
          callback(time);
        });
      };
    });
    await animationFrames(page, 3);
    // Exactly three frames requested, each callback fired before the helper resolved.
    expect(await page.evaluate(() => (window as unknown as { __raf: unknown }).__raf)).toEqual({
      calls: 3,
      fired: 3,
    });
  });

  for (const state of ['visible', 'hidden'] as const) {
    test(`AD-17 pageHide / pageShow dispatch one window event each while ${state}`, async ({
      page,
    }) => {
      await page.goto('/');
      if (state === 'hidden') await hidePage(page);
      await installRecorder(page);
      const calls: Array<[string, boolean, () => Promise<void>]> = [
        ['pagehide', false, () => pageHide(page)],
        ['pageshow', true, () => pageShow(page, { persisted: true })],
        ['pageshow', false, () => pageShow(page, { persisted: false })],
      ];
      for (const [type, persisted, action] of calls) {
        const events = await during(page, action);
        expect(events).toEqual([
          {
            type,
            listener: 'window',
            target: 'window',
            visibilityState: state,
            hidden: state === 'hidden',
            persisted,
          },
        ]);
        expect(await page.evaluate(() => document.visibilityState)).toBe(state);
      }
    });
  }
});

test.describe('buildRoot', () => {
  test('AD-17 a missing build names the script that builds it; an unset or unknown PW_PREVIEW throws', () => {
    const repo = mkdtempSync(path.join(tmpdir(), 'build-root-'));
    const saved = process.env.PW_PREVIEW;
    try {
      process.env.PW_PREVIEW = 'dist';
      expect(() => buildRoot(repo)).toThrow(/dist\/index\.html is missing: run npm run build$/);
      process.env.PW_PREVIEW = 'dist-test';
      expect(() => buildRoot(repo)).toThrow(
        /dist-test\/index\.html is missing: run npm run build:test$/,
      );
      process.env.PW_PREVIEW = 'dist-tests';
      expect(() => buildRoot(repo)).toThrow(/PW_PREVIEW must be exactly/);
      delete process.env.PW_PREVIEW;
      expect(() => buildRoot(repo)).toThrow(/PW_PREVIEW must be exactly/);
    } finally {
      if (saved === undefined) delete process.env.PW_PREVIEW;
      else process.env.PW_PREVIEW = saved;
      rmSync(repo, { recursive: true, force: true });
    }
  });
});
