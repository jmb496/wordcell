import { expect, type Page, type Request, type Route, test } from '@playwright/test';
import { animationFrames, hidePage, showPage } from './helpers/lifecycle';
import { waitForDictionary } from './helpers/restore';
import { fixture, seedStorage } from './helpers/seed';
import { type TouchHold, touchHold } from './helpers/touch';

// Epic 4 entry 4: the live layout, the AD-11 gate latch and the DESIGN.md Scrolling regions.
// Band numbers from geometry.ts (plan Code Map): 412 × 915 leftover 177 (banner 133); 412 × 780
// leftover 42 (the banner writes scrollTop 2); 412 × 600 w 40, total 722, scroll range 122.

const LIST = '**/en*.txt';
// The word-list fetch itself, not the dev server's `en.txt?url` module (dictionary.spec.ts).
const isList = (request: Request) => /\/en[^/?]*\.txt$/.test(request.url());

const onAndroid = () =>
  test.skip(test.info().project.name !== 'android', 'AD-11 touch layout runs on android');

// Holds every word-list request until the test fails it with a 500.
async function holdList(page: Page): Promise<{ fail(): Promise<void> }> {
  const held: Route[] = [];
  await page.route(LIST, async (route) => {
    if (!isList(route.request())) return route.continue();
    held.push(route);
  });
  return {
    async fail() {
      await expect.poll(() => held.length).toBeGreaterThan(0);
      for (const route of held.splice(0)) await route.fulfill({ status: 500, body: '' });
    },
  };
}

async function openFixture(page: Page, name: string): Promise<void> {
  await seedStorage(page, { session: fixture(`${name}.json`) });
  await page.goto('/');
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
}

const banner = (page: Page) => page.locator('[data-band="banner"] > *');

function rect(page: Page, selector: string) {
  return page.locator(selector).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, height: r.height, left: r.left, width: r.width };
  });
}

const BELOW = ['columns', 'footRow', 'trayGap', 'tray', 'labels', 'wordcells', 'actionGap'];

test.describe('AD-11 banner at 412 × 915', () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test('AD-11 banner takes leftover first', async ({ page }) => {
    onAndroid();
    const list = await holdList(page);
    await openFixture(page, 'session-idle-fresh');
    expect((await rect(page, '[data-band="leftover"]')).height).toBe(177);
    const face = page.locator('[data-testid="column-1"] [data-card-id] > .face').first();
    expect((await face.boundingBox())?.width).toBe(46);
    const tops = async () => {
      const out: Record<string, number> = {};
      for (const id of [...BELOW, 'actionBar']) {
        out[id] = (await rect(page, `[data-band="${id}"]`)).top;
      }
      return out;
    };
    const before = await tops();
    await list.fail();
    await expect(banner(page)).toHaveCount(1);
    await animationFrames(page, 2);
    expect((await rect(page, '[data-band="banner"]')).height).toBe(44);
    expect((await rect(page, '[data-band="leftover"]')).height).toBe(133);
    expect(await tops()).toEqual(before);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test.describe('AD-11 banner at 412 × 780', () => {
  test.use({ viewport: { width: 412, height: 780 } });

  test('AD-11 WordCell row box unchanged when the banner shows with leftover under 44 px', async ({
    page,
  }) => {
    onAndroid();
    const list = await holdList(page);
    await openFixture(page, 'session-idle-fresh');
    expect((await rect(page, '[data-band="leftover"]')).height).toBe(42);
    const before = await rect(page, '[data-band="wordcells"]');
    // Recorded in the MutationObserver callback for the banner's insertion: the relayout inserts
    // it (flushSync) and writes scrollTop in one rAF callback, and the observer runs at the
    // microtask checkpoint right after that callback, so a correction in a later frame (or a
    // write before the insertion, clamped to the old range) shows here as scrollY 0.
    await page.evaluate(() => {
      const band = document.querySelector('[data-band="banner"]');
      const row = document.querySelector('[data-band="wordcells"]');
      if (band === null || row === null) throw new Error('no banner or wordcells band');
      new MutationObserver((_, observer) => {
        if (band.firstElementChild === null) return;
        observer.disconnect();
        const at = { y: scrollY, top: row.getBoundingClientRect().top };
        (window as unknown as { __atInsert: typeof at }).__atInsert = at;
      }).observe(band, { childList: true });
    });
    await list.fail();
    await expect(banner(page)).toHaveCount(1);
    const atInsert = await page.evaluate(
      () => (window as unknown as { __atInsert: { y: number; top: number } }).__atInsert,
    );
    expect(atInsert.y).toBe(2);
    expect(Math.abs(atInsert.top - before.top)).toBeLessThan(1);
    await animationFrames(page, 2);
    const after = await rect(page, '[data-band="wordcells"]');
    expect(Math.abs(after.top - before.top)).toBeLessThan(1);
    expect(Math.abs(after.height - before.height)).toBeLessThan(1);
    expect((await rect(page, '[data-band="leftover"]')).height).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(2);
  });
});

// In-page recorders for the banner-during-scroll procedure (plan Design Notes): a continuous rAF
// tick log, scroll/scrollend/visibilitychange timestamps and the banner's first insertion.
type Recorded = {
  ticks: number[];
  scrolls: { t: number; y: number }[];
  scrollends: number[];
  visibility: number[];
  inserted: number | null;
};

async function installRecorders(page: Page): Promise<void> {
  await page.evaluate(() => {
    const rec: Recorded = {
      ticks: [],
      scrolls: [],
      scrollends: [],
      visibility: [],
      inserted: null,
    };
    (window as unknown as { __rec: Recorded }).__rec = rec;
    const tick = () => {
      rec.ticks.push(performance.now());
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    addEventListener('scroll', () => rec.scrolls.push({ t: performance.now(), y: scrollY }));
    addEventListener('scrollend', () => rec.scrollends.push(performance.now()));
    document.addEventListener('visibilitychange', () => rec.visibility.push(performance.now()));
    const band = document.querySelector('[data-band="banner"]');
    if (band === null) throw new Error('no banner band');
    new MutationObserver(() => {
      if (rec.inserted === null && band.firstElementChild !== null) {
        rec.inserted = performance.now();
      }
    }).observe(band, { childList: true });
  });
}

const recorded = (page: Page) =>
  page.evaluate(() => (window as unknown as { __rec: Recorded }).__rec);

// Index of the first tick at or after `t`.
function tickAfter(ticks: number[], t: number): number {
  const i = ticks.findIndex((tick) => tick >= t);
  if (i < 0) throw new Error(`no rAF tick after ${t}`);
  return i;
}

// Index of the tick (frame) in which `t` fell: the last tick at or before it.
function tickOf(ticks: number[], t: number): number {
  let i = -1;
  for (let k = 0; k < ticks.length; k++) if ((ticks[k] as number) <= t) i = k;
  return i;
}

// Path 1 (plan Design Notes): a foot-pad touchHold pan at 412 × 600, nothing selected. Steps of
// 3 px past the touch slop, then ±3 px about every 50 ms (the pause before each move, so a pan
// returns right after its last scroll) while the word list fails, each step checking that scrollY
// changed and no banner was inserted. Returns the held pan.
async function panThroughFailure(page: Page): Promise<TouchHold> {
  const list = await holdList(page);
  await openFixture(page, 'session-idle-fresh');
  await installRecorders(page);
  const foot = await rect(page, '[data-testid="foot-1"]');
  const x = foot.left + foot.width / 2;
  let y = foot.top + foot.height / 2;
  const hold = await touchHold(page, { x, y });
  // scrollY and the banner state one frame after a move.
  const settle = () =>
    page.evaluate(
      () =>
        new Promise<{ y: number; inserted: boolean; state: string | undefined }>((resolve) =>
          requestAnimationFrame(() =>
            resolve({
              y: window.scrollY,
              inserted: (window as unknown as { __rec: Recorded }).__rec.inserted !== null,
              state: window.__wordcell?.dictionaryState(),
            }),
          ),
        ),
    );
  try {
    for (let i = 0; i < 10; i++) {
      y -= 3;
      await hold.moveTo({ x, y });
      await page.waitForTimeout(30);
    }
    let last = await settle();
    expect(last.y, 'the foot-pad pan scrolls the page').toBeGreaterThan(0);
    let dir = 1;
    const step = async () => {
      await page.waitForTimeout(35);
      y += 3 * dir;
      dir = -dir;
      await hold.moveTo({ x, y });
      const next = await settle();
      expect(next.y, 'scrollY changes between steps').not.toBe(last.y);
      expect(next.inserted, 'no banner while the pan continues').toBe(false);
      last = next;
    };
    await list.fail();
    for (let i = 0; last.state !== 'failed'; i++) {
      if (i > 100) throw new Error('the word list never failed');
      await step();
    }
    const until = Date.now() + 300;
    while (Date.now() < until) await step();
    const rec = await recorded(page);
    expect(rec.scrollends, 'no scrollend before release').toEqual([]);
    const gaps = rec.scrolls.slice(1).map((s, i) => s.t - (rec.scrolls[i] as { t: number }).t);
    expect(gaps.length, 'at least 6 scroll gaps recorded').toBeGreaterThanOrEqual(6);
    expect(Math.max(...gaps.slice(-6)), 'scroll events under 150 ms apart').toBeLessThan(150);
    return hold;
  } catch (error) {
    await hold.end();
    throw error;
  }
}

// The last pan scroll before `t` (later scroll events are the layout's own anchor write).
function lastScrollBefore(rec: Recorded, t: number): number {
  const before = rec.scrolls.filter((s) => s.t < t);
  const last = before.at(-1);
  if (last === undefined) throw new Error('no scroll before the banner');
  return last.t;
}

test.describe('AD-11 banner during a scroll at 412 × 600', () => {
  test.use({ viewport: { width: 412, height: 600 } });

  test('AD-11 banner during a scroll applied after it ends', async ({ page }) => {
    onAndroid();
    const hold = await panThroughFailure(page);
    try {
      // Finger kept down, no moves (a held pan fires no scrollend): the 150 ms quiet point (A-A9).
      await expect.poll(async () => (await recorded(page)).inserted).not.toBeNull();
      await animationFrames(page, 2);
      const rec = await recorded(page);
      const inserted = rec.inserted as number;
      const lastScroll = lastScrollBefore(rec, inserted);
      const quiet = Math.min(rec.scrollends[0] ?? Number.POSITIVE_INFINITY, lastScroll + 150);
      expect(inserted).toBeGreaterThanOrEqual(quiet - 1);
      expect(tickOf(rec.ticks, inserted)).toBeLessThanOrEqual(tickAfter(rec.ticks, quiet) + 1);
      // The only later scroll is the layout's own write keeping the WordCell row (banner + 44).
      const after = rec.scrolls.filter((s) => s.t >= inserted);
      expect(after.length).toBeLessThanOrEqual(1);
    } finally {
      await hold.end();
    }
    await expect(banner(page)).toHaveCount(1);
  });

  test('AD-11 banner during a scroll applied after a hide, before the quiet point', async ({
    page: first,
    context,
  }) => {
    onAndroid();
    let valid = false;
    // One repeat on a fresh page when the hide missed the 100 ms window (plan Design Notes).
    for (let attempt = 0; attempt < 2 && !valid; attempt++) {
      const page = attempt === 0 ? first : await context.newPage();
      const hold = await panThroughFailure(page);
      try {
        await animationFrames(page, 1);
        await hidePage(page);
        await showPage(page);
        await animationFrames(page, 2);
        const rec = await recorded(page);
        const hidden = rec.visibility[0];
        if (hidden === undefined) throw new Error('no visibilitychange recorded');
        const lastScroll = lastScrollBefore(rec, hidden);
        valid = hidden < lastScroll + 100;
        if (!valid) continue;
        expect(rec.inserted).not.toBeNull();
        const inserted = rec.inserted as number;
        expect(inserted).toBeGreaterThan(hidden);
        expect(inserted).toBeLessThan(lastScroll + 150);
        expect(tickOf(rec.ticks, inserted)).toBeLessThanOrEqual(tickAfter(rec.ticks, hidden) + 1);
      } finally {
        await hold.end();
      }
    }
    expect(valid, 'visibilitychange within 100 ms after the last scroll (else invalid)').toBe(true);
  });
});

// DESIGN.md Scrolling regions (computed style only).
type Styles = { touchAction: string; userSelect: string };

async function stylesOf(page: Page, selector: string): Promise<Styles[]> {
  const all = await page.locator(selector).evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el);
      return { touchAction: s.touchAction, userSelect: s.userSelect };
    }),
  );
  expect(all.length, selector).toBeGreaterThan(0);
  return all;
}

async function expectTouchAction(page: Page, selector: string, value: string): Promise<void> {
  for (const s of await stylesOf(page, selector)) expect(s.touchAction, selector).toBe(value);
}

async function expectNoSelect(page: Page, selector: string): Promise<void> {
  for (const s of await stylesOf(page, selector)) expect(s.userSelect, selector).toBe('none');
}

const NONE = [
  '[data-card-id]',
  '[data-mirror-of]',
  '[data-place="tray"]',
  '[data-wordcell]',
  '[data-testid="undo"]',
  '[data-testid="redo"]',
  '[data-testid="primary-action"]',
  '[data-band="banner"] button',
];

const PAN = [
  '[data-band="topBar"]',
  '[data-band="banner"]',
  '[data-band="leftover"]',
  '[data-column]',
  '[data-foot]',
  '[data-band="trayGap"]',
  '[data-band="tray"]',
  '.label',
  '[data-band="actionGap"]',
  '[data-band="actionBar"]',
];

// Region ancestors outside other regions, up to html.
const ANCESTORS = ['.unit', '[data-column] > .cards', '.board', 'main', '#app', 'body', 'html'];

async function expectRegions(page: Page, pan: string): Promise<void> {
  for (const selector of NONE) await expectTouchAction(page, selector, 'none');
  for (const selector of PAN) await expectTouchAction(page, selector, pan);
  for (const selector of ANCESTORS) await expectTouchAction(page, selector, 'auto');
  // Every non-region ancestor of a region computes auto.
  const offenders = await page.evaluate(
    ({ regions }) => {
      const set = new Set(regions.flatMap((s) => [...document.querySelectorAll(s)]));
      const bad: string[] = [];
      for (const el of set) {
        for (let a = el.parentElement; a !== null; a = a.parentElement) {
          if (set.has(a)) break;
          const value = getComputedStyle(a).touchAction;
          if (value !== 'auto') bad.push(`${a.tagName}.${a.className}: ${value}`);
        }
      }
      return [...new Set(bad)];
    },
    { regions: PAN },
  );
  expect(offenders).toEqual([]);
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter),
  ).toBe('stable');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowAnchor)).toBe(
    'none',
  );
}

test('AD-11 touch-action and user-select regions (computed style)', async ({ page, context }) => {
  await page.route(LIST, (route) =>
    isList(route.request()) ? route.fulfill({ status: 500, body: '' }) : route.continue(),
  );
  if (test.info().project.name === 'android') {
    await openFixture(page, 'session-composing');
    await waitForDictionary(page, 'failed');
    await expect(banner(page)).toHaveCount(1);
    await expectRegions(page, 'pan-y');
    for (const selector of ['[data-card-id]', '[data-wordcell]', '.label', '[data-foot]']) {
      await expectNoSelect(page, selector);
    }
    // Count badges on a fixture with stacked WordCells.
    const won = await context.newPage();
    await openFixture(won, 'session-won');
    await expectTouchAction(won, '[data-wordcell] .count', 'none');
    await expectNoSelect(won, '[data-wordcell] .count');
    return;
  }
  await page.setViewportSize({ width: 370, height: 750 });
  await openFixture(page, 'session-composing');
  await waitForDictionary(page, 'failed');
  await expect(banner(page)).toHaveCount(1);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const board = (await rect(page, '[data-band="topBar"]')).width;
  expect(board).toBe(352);
  expect(board).toBeGreaterThan(clientWidth - 32);
  await expectRegions(page, 'pan-x pan-y');
});
