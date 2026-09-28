import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { buildRoot } from './helpers/dist-test';
import { hidePage, pageHide, pageShow, showPage } from './helpers/lifecycle';
import { captureBoot, seedStorage } from './helpers/seed';
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
    await captureBoot(page);
    await page.goto('/');
    expect(await readBoot(page)).toEqual({
      'wordcell:session': null,
      'wordcell:history': null,
      'wordcell:prefs': null,
    });
    await writeKey(page, 'session', 's');
    await page.reload();
    expect(await readBoot(page)).toEqual({
      'wordcell:session': 's',
      'wordcell:history': null,
      'wordcell:prefs': null,
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
