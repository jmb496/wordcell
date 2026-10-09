import { expect, type Locator, type Page, test } from '@playwright/test';
import { EN, view } from '../src/engine/index';
import { centre, openFixture, tapAt } from './helpers/board';
import { expectLeaves, wc } from './helpers/dialogs';
import { animationFrames } from './helpers/lifecycle';
import { booted } from './helpers/restore';
import { fixture, seedStorage } from './helpers/seed';
import { touchDrag, touchHold } from './helpers/touch';

// Epic 4 entry 11: the WordCell long-press peek and sticky view (SPEC CAP-9, F14, F24, F27;
// rule-coverage R-12, R-33, R-39, R-65, R-75, Q-21, AD-11, AD-12, AD-13 rows). Fixtures:
// `session-idle-empty-column` (Idle, column 1 empty, cell 7 holds 7 cards, Undo enabled),
// `session-place-free-letter-redo-tail` (Place with a used cell), `session-won` (cell 6 holds 24
// cards, the deepest), `session-gave-up-after-commit` (Game over, cell 7 holds 7 cards, cell 3
// empty). Every view case asserts the Session reference, the stored text and Undo/Redo enablement
// unchanged (R-65 viewing changes nothing and does not enter the move history).

type Point = { x: number; y: number };

const onAndroid = () =>
  test.skip(test.info().project.name !== 'android', 'touch flows run on android');
const onDesktop = () =>
  test.skip(test.info().project.name !== 'desktop', 'mouse flows run on desktop');

const cell = (page: Page, n: number) => page.getByTestId(`wordcell-${n}`);
const sheet = (page: Page) => page.locator('[data-view-sheet]');
const scrim = (page: Page) => page.locator('[data-view-scrim]');
const scrollArea = (page: Page) => page.locator('[data-view-scroll]');
const mirrors = (page: Page) => sheet(page).locator('[data-mirror-of]');

const wcOf = async (page: Page) => (await wc(page))?.wc;

const overflows = (page: Page) =>
  scrollArea(page).evaluate((el) => el.scrollHeight > el.clientHeight);

// The non-empty WordCells, in cell order.
function filledCells(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-wordcell]')]
      .filter((el) => !el.classList.contains('empty'))
      .map((el) => Number(el.getAttribute('data-wordcell'))),
  );
}

type Unchanged = () => Promise<void>;

// Stashes the store's Session reference, the stored text and Undo/Redo enablement; the returned
// check asserts all three unchanged.
async function stash(page: Page): Promise<Unchanged> {
  const read = () =>
    page.evaluate(() => {
      const current = window.__wordcell?.current();
      if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
      const disabled = (id: string) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        if (!(el instanceof HTMLButtonElement)) throw new Error(`${id} is not a button`);
        return el.disabled;
      };
      return {
        same: current.session === window.__pointerSession,
        stored: localStorage.getItem('wordcell:session'),
        undo: disabled('undo'),
        redo: disabled('redo'),
      };
    });
  await page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    window.__pointerSession = current.session;
  });
  const before = await read();
  return async () => {
    expect(await read()).toEqual(before);
  };
}

function cursorIndex(page: Page): Promise<number> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return current.session.cursor.index;
  });
}

// A held long-press on `n`: the peek sheet shows while held (checked by `whileHeld`), then the
// press is released.
async function holdPeek(
  page: Page,
  n: number,
  whileHeld: () => Promise<void> = async () => undefined,
): Promise<void> {
  const hold = await touchHold(page, await centre(cell(page, n)));
  try {
    await page.waitForTimeout(450);
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page)).toHaveAttribute('data-mode', 'peek');
    // Plan Boundaries: `.board` is never inert during a held peek.
    await expect(page.locator('.board')).not.toHaveAttribute('inert');
    await whileHeld();
  } finally {
    await hold.end();
  }
}

async function expectNoView(page: Page): Promise<void> {
  await animationFrames(page, 2);
  await expect(sheet(page)).toHaveCount(0);
  await expect(scrim(page)).toHaveCount(0);
}

// Opens the sticky view of `n` with a tap (one entry).
async function openSticky(page: Page, n: number, count: number): Promise<void> {
  const before = (await wcOf(page)) ?? 0;
  await tapAt(page, await centre(cell(page, n)));
  await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
  await expect(sheet(page)).toHaveAccessibleName(
    count === 1 ? `WordCell ${n} · 1 card` : `WordCell ${n} · ${count} cards`,
  );
  await expect.poll(() => wcOf(page)).toBe(before + 1);
}

// A capture-phase recorder on `window` of pointerup and click, with each event kept so its
// `defaultPrevented` is read after dispatch (the root's swallower runs after `window`'s capture).
async function recordClicks(page: Page): Promise<void> {
  await page.evaluate(() => {
    const log: { type: string; target: string; inUndo: boolean; event: Event }[] = [];
    (window as unknown as { __viewLog: typeof log }).__viewLog = log;
    for (const type of ['pointerup', 'click']) {
      window.addEventListener(
        type,
        (event) => {
          const target = event.target;
          const el = target instanceof Element ? target : null;
          log.push({
            type,
            target:
              el === null
                ? String(target)
                : `${el.tagName.toLowerCase()}${el.getAttribute('data-testid') ? `[${el.getAttribute('data-testid')}]` : ''}${el.hasAttribute('data-view-scrim') ? '[scrim]' : ''}`,
            inUndo: el?.closest('[data-testid="undo"]') != null,
            event,
          });
        },
        true,
      );
    }
  });
}

type Recorded = { type: string; target: string; inUndo: boolean; prevented: boolean };

function recorded(page: Page): Promise<Recorded[]> {
  return page.evaluate(() =>
    (
      window as unknown as {
        __viewLog: { type: string; target: string; inUndo: boolean; event: Event }[];
      }
    ).__viewLog.map(({ type, target, inUndo, event }) => ({
      type,
      target,
      inUndo,
      prevented: event.defaultPrevented,
    })),
  );
}

// The scrim tap over the enabled Undo (both projects): the view closes, nothing is undone, and
// every trailing click inside Undo was swallowed (defaultPrevented).
async function scrimTapOverUndo(page: Page): Promise<void> {
  await openFixture(page, 'session-idle-empty-column');
  const undo = page.getByTestId('undo');
  await expect(undo).toBeEnabled();
  const index = await cursorIndex(page);
  const unchanged = await stash(page);
  await openSticky(page, 7, 7);
  const point = await centre(undo);
  const hit = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.hasAttribute('data-view-scrim') ?? false,
    point,
  );
  expect(hit).toBe(true);
  await recordClicks(page);
  await tapAt(page, point);
  await expectNoView(page);
  await page.waitForTimeout(400);
  await animationFrames(page, 2);
  expect(await cursorIndex(page)).toBe(index);
  await expect.poll(() => wcOf(page)).toBe(0);
  const log = await recorded(page);
  test.info().annotations.push({ type: 'scrim-over-undo order', description: JSON.stringify(log) });
  const undoClicks = log.filter((e) => e.type === 'click' && e.inUndo);
  // Android resolves the pointerup → click order: the trailing click does reach Undo's subtree.
  if (test.info().project.name === 'android') expect(undoClicks.length).toBeGreaterThan(0);
  for (const entry of undoClicks) {
    expect(entry.prevented).toBe(true);
  }
  await unchanged();
}

test.describe('android', () => {
  test.beforeEach(onAndroid);

  test('R-65 Q-21 AD-13 a long-press peeks while held (no entry) and closes on release, changing nothing', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    const unchanged = await stash(page);
    expect(await wcOf(page)).toBe(0);
    await holdPeek(page, 7, async () => {
      await expect(sheet(page)).toHaveAccessibleName('WordCell 7 · 7 cards');
      await expect(mirrors(page)).toHaveCount(7);
      expect(await overflows(page)).toBe(false);
      expect(await wcOf(page)).toBe(0);
    });
    await expectNoView(page);
    expect(await wcOf(page)).toBe(0);
    await unchanged();
  });

  test('R-65 the used cell’s peek in Place shows its cards bottom first, the top unhatched and tagged top, titled with cards.length', async ({
    page,
  }) => {
    await openFixture(page, 'session-place-free-letter-redo-tail');
    // The expected cards come from engine data: `view()` over the store's Session (AD-17 hook).
    const session = await page.evaluate(() => {
      const current = window.__wordcell?.current();
      if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
      return current.session;
    });
    const usedCells = view(session, EN).cells.filter((c) => c.used);
    expect(usedCells).toHaveLength(1);
    const used = usedCells[0].cell;
    const order = usedCells[0].cards.map(String);
    const count = order.length;
    expect(
      Number(await page.locator('[data-wordcell]:has(.used)').getAttribute('data-wordcell')),
    ).toBe(used);
    const unchanged = await stash(page);
    await holdPeek(page, used, async () => {
      await expect(sheet(page)).toHaveAccessibleName(
        count === 1 ? `WordCell ${used} · 1 card` : `WordCell ${used} · ${count} cards`,
      );
      await expect(mirrors(page)).toHaveCount(count);
      const last = mirrors(page).last();
      await expect(last).toContainText('top');
      await expect(sheet(page).locator('.top-tag')).toHaveCount(1);
      const face = await last
        .locator(':scope > .face')
        .evaluate((el) => [getComputedStyle(el).opacity, getComputedStyle(el).backgroundImage]);
      expect(face).toEqual(['1', 'none']);
      expect(
        await mirrors(page).evaluateAll((els) =>
          els.map((el) => el.getAttribute('data-mirror-of')),
        ),
      ).toEqual(order);
      await expect(sheet(page).locator('[data-card-id], [data-testid]')).toHaveCount(0);
      expect(await wcOf(page)).toBe(0);
    });
    await expectNoView(page);
    await unchanged();
  });

  test('R-65 R-39 R-33 in Place and in Composing (one Undo) WordCell taps and drags open nothing; the long-press peek works', async ({
    page,
  }) => {
    await openFixture(page, 'session-place-free-letter-redo-tail');
    for (const phase of ['place', 'composing']) {
      if (phase === 'composing') {
        await tapAt(page, await centre(page.getByTestId('undo')));
        await expect
          .poll(() =>
            page.evaluate(() => {
              const current = window.__wordcell?.current();
              return current?.kind === 'active' ? current.session.cursor.phase : null;
            }),
          )
          .toBe('composing');
      }
      const unchanged = await stash(page);
      const filled = await filledCells(page);
      expect(filled.length).toBeGreaterThan(0);
      for (const n of filled) {
        const c = await centre(cell(page, n));
        await tapAt(page, c);
        await expectNoView(page);
        await touchDrag(page, c, { x: c.x, y: c.y - 40 });
        await expectNoView(page);
      }
      await holdPeek(page, filled[0] as number);
      await expectNoView(page);
      expect(await wcOf(page)).toBe(0);
      await unchanged();
    }
  });

  test('R-12 a WordCell drag in Idle lifts no tail and dispatches nothing', async ({ page }) => {
    await openFixture(page, 'session-idle-empty-column');
    const unchanged = await stash(page);
    const from = await centre(cell(page, 7));
    const to = await centre(page.getByTestId('column-3'));
    const hold = await touchHold(page, from);
    try {
      await hold.moveTo({ x: from.x, y: from.y - 20 });
      await hold.moveTo(to);
      await animationFrames(page, 2);
      await expect(page.locator('.wc-drag-ghost, .wc-drag-layer, .lifted')).toHaveCount(0);
    } finally {
      await hold.end();
    }
    await expectNoView(page);
    expect(await wcOf(page)).toBe(0);
    await unchanged();
  });

  for (const name of ['session-idle-empty-column', 'session-gave-up-after-commit']) {
    test(`R-65 R-75 a tap and a long-press on an empty WordCell open nothing (${name})`, async ({
      page,
    }) => {
      await openFixture(page, name);
      const unchanged = await stash(page);
      await tapAt(page, await centre(cell(page, 3)));
      await expectNoView(page);
      const hold = await touchHold(page, await centre(cell(page, 3)));
      try {
        await page.waitForTimeout(600);
        await expect(sheet(page)).toHaveCount(0);
        await expect(scrim(page)).toHaveCount(0);
      } finally {
        await hold.end();
      }
      await expectNoView(page);
      expect(await wcOf(page)).toBe(0);
      await unchanged();
    });
  }

  for (const [name, n, count] of [
    ['session-idle-empty-column', 7, 7],
    ['session-won', 8, 7],
    ['session-gave-up-after-commit', 7, 7],
  ] as const) {
    test(`R-65 R-75 AD-13 a tap opens the sticky view (one entry) with the F27 title; back closes it with the app open (${name})`, async ({
      page,
    }) => {
      await openFixture(page, name);
      const unchanged = await stash(page);
      await openSticky(page, n, count);
      await expect(mirrors(page)).toHaveCount(count);
      await expect(mirrors(page).last()).toContainText('top');
      await expect(sheet(page).locator('.top-tag')).toHaveCount(1);
      await page.goBack();
      await expectNoView(page);
      await expect.poll(() => wcOf(page)).toBe(0);
      expect(page.url()).not.toBe('about:blank');
      await expect(page.getByTestId('card-0')).toBeAttached();
      await unchanged();
    });
  }

  test('R-65 AD-13 a long-press on session-won’s deepest cell at 412 × 360 overflows and turns sticky (+1); a swipe scrolls it and keeps it; a tap on a non-top mirror closes it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 412, height: 360 });
    await openFixture(page, 'session-won');
    await expect(cell(page, 6).locator('[data-place="cell"], [data-mirror-of]')).toHaveCount(24);
    await cell(page, 6).scrollIntoViewIfNeeded();
    const unchanged = await stash(page);
    const before = (await wcOf(page)) ?? 0;
    await holdPeek(page, 6, async () => {
      expect(await overflows(page)).toBe(true);
      expect(await wcOf(page)).toBe(before);
    });
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
    await expect(mirrors(page)).toHaveCount(24);
    await expect(sheet(page)).toHaveAccessibleName('WordCell 6 · 24 cards');
    await expect.poll(() => wcOf(page)).toBe(before + 1);
    const s = await sheet(page).boundingBox();
    if (s === null) throw new Error('sheet has no box');
    const x = s.x + s.width / 2;
    expect(await scrollArea(page).evaluate((el) => el.scrollTop)).toBe(0);
    await touchDrag(page, { x, y: s.y + s.height - 20 }, { x, y: s.y + 60 }, { steps: 12 });
    await expect.poll(() => scrollArea(page).evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await page.waitForTimeout(500);
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
    expect(await scrollArea(page).evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(await wcOf(page)).toBe(before + 1);
    // R-65 only the top card is usable: a tap on another mirror only closes the view.
    const target = await page.evaluate(() => {
      const area = document.querySelector('[data-view-scroll]');
      if (area === null) throw new Error('no scroll area');
      const a = area.getBoundingClientRect();
      const all = [...area.querySelectorAll('[data-mirror-of]')];
      const top = all.at(-1);
      for (const m of all) {
        if (m === top) continue;
        const r = m.getBoundingClientRect();
        if (r.top >= a.top && r.bottom <= a.bottom) {
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
      }
      throw new Error('no fully visible non-top mirror');
    });
    await tapAt(page, target);
    await expectNoView(page);
    await expect.poll(() => wcOf(page)).toBe(before);
    await unchanged();
  });

  test('AD-11 with the sticky view open the sheet and its mirrors pan-y and user-select none, the scroll area contains overscroll, the scrim is touch-action none', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    const unchanged = await stash(page);
    await openSticky(page, 7, 7);
    const styles = await page.evaluate(() => {
      const css = (sel: string) => {
        const el = document.querySelector(sel);
        if (el === null) throw new Error(`${sel} missing`);
        return getComputedStyle(el);
      };
      const sheetCss = css('[data-view-sheet]');
      const mirrorCss = [...document.querySelectorAll('[data-view-sheet] [data-mirror-of]')].map(
        (el) => {
          const c = getComputedStyle(el);
          return [c.touchAction, c.userSelect];
        },
      );
      return {
        sheet: [sheetCss.touchAction, sheetCss.userSelect],
        mirrors: mirrorCss,
        scroll: css('[data-view-scroll]').overscrollBehaviorY,
        scrim: css('[data-view-scrim]').touchAction,
      };
    });
    expect(styles.sheet).toEqual(['pan-y', 'none']);
    expect(styles.mirrors).toHaveLength(7);
    for (const m of styles.mirrors) expect(m).toEqual(['pan-y', 'none']);
    expect(styles.scroll).toBe('contain');
    expect(styles.scrim).toBe('none');
    await unchanged();
  });

  test('R-65 a 20 px scrim drag keeps the sticky view', async ({ page }) => {
    await openFixture(page, 'session-idle-empty-column');
    const unchanged = await stash(page);
    await openSticky(page, 7, 7);
    const s = await sheet(page).boundingBox();
    if (s === null) throw new Error('sheet has no box');
    const from = { x: s.x + s.width / 2, y: Math.max(10, s.y / 2) };
    // 4-11 m5: the drag starts on the scrim.
    expect(
      await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.hasAttribute('data-view-scrim') ?? false,
        from,
      ),
    ).toBe(true);
    await touchDrag(page, from, { x: from.x, y: from.y + 20 });
    await animationFrames(page, 2);
    await page.waitForTimeout(350);
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
    expect(await wcOf(page)).toBe(1);
    await unchanged();
  });

  test('R-65 AD-12 a scrim tap over the enabled Undo closes the view without undoing (trailing click swallowed)', async ({
    page,
  }) => {
    await scrimTapOverUndo(page);
  });

  test('AD-13 a peek held on the deepest cell pushes nothing; peek turned sticky +1; back restores the count', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 412, height: 360 });
    await openFixture(page, 'session-won');
    await cell(page, 6).scrollIntoViewIfNeeded();
    const unchanged = await stash(page);
    await holdPeek(page, 6, async () => {
      expect(await wcOf(page)).toBe(0);
    });
    await expect.poll(() => wcOf(page)).toBe(1);
    await page.goBack();
    await expectNoView(page);
    await expect.poll(() => wcOf(page)).toBe(0);
    expect(page.url()).not.toBe('about:blank');
    await unchanged();
  });

  test('AD-13 open the sticky view, reload, back leaves the app', async ({ page }) => {
    await openFixture(page, 'session-idle-empty-column');
    const unchanged = await stash(page);
    // The reload's hide flush accrues activeMs (AD-9); the game itself is unchanged.
    const game = () =>
      page.evaluate(() => {
        const { activeMs: _, ...rest } = JSON.parse(
          localStorage.getItem('wordcell:session') ?? 'null',
        );
        return rest;
      });
    const storedBefore = await game();
    await openSticky(page, 7, 7);
    await unchanged();
    await page.reload();
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    await booted(page);
    await expectNoView(page);
    expect(await game()).toEqual(storedBefore);
    await expectLeaves(page);
  });
});

// Entry 12 (SPEC CAP-9, F19, F27): the desktop hover peek. The page clock is installed and paused
// before load (as e2e/blocking.spec.ts), so every 300/400/600 ms boundary is advanced with runFor.
const hoverPeek = (page: Page) => page.locator('[data-hover-peek]');
const peekMirrors = (page: Page) => hoverPeek(page).locator('[data-mirror-of]');
const label = (page: Page, n: number) => page.locator(`[data-wordcell-label="${n}"]`);

async function openPaused(page: Page, name: string, url = '/'): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await seedStorage(page, { session: fixture(`${name}.json`) });
  await page.goto(url);
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await booted(page);
}

async function box(
  locator: Locator,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const b = await locator.boundingBox();
  if (b === null) throw new Error('element has no box');
  return b;
}

// Ticket Layout: the content-sized width min(count, 7)·(w + 4) − 4 + 32, w a rendered face's width.
async function expectPeekWidth(page: Page, count: number): Promise<void> {
  const w = (await box(peekMirrors(page).first().locator('.face'))).width;
  const peek = await box(hoverPeek(page));
  expect(Math.abs(peek.width - (Math.min(count, 7) * (w + 4) - 4 + 32))).toBeLessThanOrEqual(1);
}

// The board column: the WordCell unit's track spans it (--wc-board wide).
const boardColumn = (page: Page) => box(page.locator('.track[data-band="wordcells"]'));

// The cell's cards from engine data: `view()` over the store's Session (AD-17 hook).
async function cellCards(page: Page, n: number): Promise<string[]> {
  const session = await page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return current.session;
  });
  const found = view(session, EN).cells.find((c) => c.cell === n);
  if (found === undefined) throw new Error(`no cell ${n}`);
  return found.cards.map(String);
}

// Moves the mouse onto the centre of cell `n` (a boundary entry from outside it).
async function hoverCell(page: Page, n: number): Promise<Point> {
  const c = await centre(cell(page, n));
  await page.mouse.move(c.x, c.y);
  return c;
}

// Moves the mouse well away from the WordCell row (onto the top bar's empty middle).
async function moveAway(page: Page): Promise<void> {
  const bar = await box(page.locator('[data-band="topBar"]'));
  await page.mouse.move(bar.x + bar.width / 2, bar.y + 4);
}

// expectNoView without animation frames (the paused clock holds them).
async function expectNoViewPaused(page: Page): Promise<void> {
  await expect(sheet(page)).toHaveCount(0);
  await expect(scrim(page)).toHaveCount(0);
}

const halted = (page: Page) => page.evaluate(() => window.__wordcell?.current().kind === 'halted');

const historyLength = (page: Page) => page.evaluate(() => window.history.length);

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  test('R-65 AD-12 a scrim click over the enabled Undo closes the view without undoing', async ({
    page,
  }) => {
    await scrimTapOverUndo(page);
  });

  test('R-65 AD-13 with the sticky view open, Undo, Redo and the banner band are inert: focus and Enter do nothing', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    const unchanged = await stash(page);
    await openSticky(page, 7, 7);
    const inert = await page.evaluate(() =>
      ['[data-testid="undo"]', '[data-testid="redo"]', '[data-band="banner"]'].map((sel) => {
        const el = document.querySelector(sel);
        if (el === null) throw new Error(`${sel} missing`);
        return el.closest('[inert]') !== null;
      }),
    );
    expect(inert).toEqual([true, true, true]);
    const focused = await page.evaluate(() => {
      const undo = document.querySelector<HTMLButtonElement>('[data-testid="undo"]');
      if (undo === null) throw new Error('undo missing');
      undo.focus();
      return document.activeElement === undo;
    });
    expect(focused).toBe(false);
    await page.keyboard.press('Enter');
    await animationFrames(page, 2);
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
    expect(await wcOf(page)).toBe(1);
    await unchanged();
  });

  test('R-65 hover 400 ms on session-won cell 6 shows its last 14 cards oldest first, top tagged, +10 older cards, above the anchor at the column’s left edge, no scrim; leave closes it', async ({
    page,
  }) => {
    await openPaused(page, 'session-won');
    const cards = await cellCards(page, 6);
    expect(cards).toHaveLength(24);
    const unchanged = await stash(page);
    await hoverCell(page, 6);
    await page.clock.runFor(399);
    await expect(hoverPeek(page)).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(hoverPeek(page)).toBeVisible();
    await expect(hoverPeek(page)).toHaveAttribute('aria-hidden', 'true');
    expect(
      await peekMirrors(page).evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-mirror-of')),
      ),
    ).toEqual(cards.slice(-14));
    await expect(peekMirrors(page).last()).toContainText('top');
    await expect(hoverPeek(page).locator('.top-tag')).toHaveCount(1);
    await expect(hoverPeek(page)).toContainText('+10 older cards');
    await expect(hoverPeek(page).locator('[data-card-id], [data-testid]')).toHaveCount(0);
    await expectPeekWidth(page, 14);
    const tops = await peekMirrors(page).evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().top)),
    );
    expect([...new Set(tops)]).toHaveLength(2);
    expect(tops.filter((top) => top === tops[0])).toHaveLength(7);
    const older = await box(hoverPeek(page).locator('.older'));
    const first = await box(peekMirrors(page).first());
    expect(older.y + older.height).toBeLessThanOrEqual(first.y);
    await expect(scrim(page)).toHaveCount(0);
    await expect(sheet(page)).toHaveCount(0);
    const peek = await box(hoverPeek(page));
    const anchor = await box(label(page, 6));
    const column = await boardColumn(page);
    expect(Math.abs(peek.y + peek.height - anchor.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(peek.x - column.x)).toBeLessThanOrEqual(1);
    expect(peek.x + peek.width).toBeLessThanOrEqual(column.x + column.width + 1);
    await moveAway(page);
    await expect(hoverPeek(page)).toHaveCount(0);
    expect(await wcOf(page)).toBe(0);
    await unchanged();
  });

  test('R-65 hover 400 ms on session-won cell 8 (7 cards) shows 7 mirrors and no older line, its right edge on the column’s right edge', async ({
    page,
  }) => {
    await openPaused(page, 'session-won');
    const cards = await cellCards(page, 8);
    expect(cards).toHaveLength(7);
    const unchanged = await stash(page);
    await hoverCell(page, 8);
    await page.clock.runFor(400);
    await expect(hoverPeek(page)).toBeVisible();
    expect(
      await peekMirrors(page).evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-mirror-of')),
      ),
    ).toEqual(cards);
    await expect(hoverPeek(page)).not.toContainText('older');
    await expectPeekWidth(page, 7);
    const peek = await box(hoverPeek(page));
    const anchor = await box(label(page, 8));
    const column = await boardColumn(page);
    expect(Math.abs(peek.y + peek.height - anchor.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(peek.x + peek.width - (column.x + column.width))).toBeLessThanOrEqual(1);
    expect(peek.x).toBeGreaterThanOrEqual(column.x - 1);
    await unchanged();
  });

  test('AD-12 with the WordCell row under the top bar (?bands=), no room above: the hover peek sits below the cell', async ({
    page,
  }) => {
    await openPaused(
      page,
      'session-won',
      '/?bands=topBar,banner,wordcells,leftover,columns,tray,actionBar',
    );
    const unchanged = await stash(page);
    await hoverCell(page, 8);
    await page.clock.runFor(400);
    await expect(hoverPeek(page)).toBeVisible();
    const peek = await box(hoverPeek(page));
    const anchor = await box(label(page, 8));
    const board = await box(page.locator('.board'));
    expect(anchor.y - board.y).toBeLessThan(peek.height);
    const c = await box(cell(page, 8));
    expect(Math.abs(peek.y - (c.y + c.height))).toBeLessThanOrEqual(1);
    await unchanged();
  });

  test('R-65 a click on the cell while the hover peek is open does its phase action (Game over: the sticky view), hover peek gone', async ({
    page,
  }) => {
    await openPaused(page, 'session-won');
    const unchanged = await stash(page);
    const c = await hoverCell(page, 6);
    await page.clock.runFor(400);
    await expect(hoverPeek(page)).toBeVisible();
    await page.mouse.down();
    await page.mouse.up();
    await expect(sheet(page)).toHaveAttribute('data-mode', 'sticky');
    await expect(hoverPeek(page)).toHaveCount(0);
    await expect.poll(() => wcOf(page)).toBe(1);
    // No reopen: close the view with the pointer still on cell 6, then a few-px move inside it.
    await page.mouse.down();
    await page.mouse.up();
    await expectNoViewPaused(page);
    await page.mouse.move(c.x + 3, c.y + 3);
    await page.clock.runFor(600);
    await expect(hoverPeek(page)).toHaveCount(0);
    // Out and back in: it opens 400 ms later.
    await moveAway(page);
    await hoverCell(page, 6);
    await page.clock.runFor(399);
    await expect(hoverPeek(page)).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(hoverPeek(page)).toBeVisible();
    await unchanged();
  });

  test('R-65 the hover peek takes no clicks: pointer-events none; elementFromPoint at its centre is outside it', async ({
    page,
  }) => {
    await openPaused(page, 'session-won');
    const unchanged = await stash(page);
    await hoverCell(page, 6);
    await page.clock.runFor(400);
    await expect(hoverPeek(page)).toBeVisible();
    const result = await hoverPeek(page).evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {
        pointerEvents: getComputedStyle(el).pointerEvents,
        inside: hit?.closest('[data-hover-peek]') != null,
      };
    });
    expect(result).toEqual({ pointerEvents: 'none', inside: false });
    await unchanged();
  });

  test('R-65 opening and closing a hover peek leaves Undo/Redo enablement and window.history.length unchanged', async ({
    page,
  }) => {
    await openPaused(page, 'session-won');
    const unchanged = await stash(page);
    const before = await historyLength(page);
    await hoverCell(page, 6);
    await page.clock.runFor(400);
    await expect(hoverPeek(page)).toBeVisible();
    expect(await historyLength(page)).toBe(before);
    await moveAway(page);
    await expect(hoverPeek(page)).toHaveCount(0);
    expect(await historyLength(page)).toBe(before);
    expect(await wcOf(page)).toBe(0);
    await unchanged();
  });

  test('AD-12 hover 300 ms, leave, re-enter: none 300 ms after re-entry, open 400 ms after it', async ({
    page,
  }) => {
    await openPaused(page, 'session-won');
    const unchanged = await stash(page);
    await hoverCell(page, 6);
    await page.clock.runFor(300);
    await moveAway(page);
    await hoverCell(page, 6);
    await page.clock.runFor(300);
    await expect(hoverPeek(page)).toHaveCount(0);
    await page.clock.runFor(99);
    await expect(hoverPeek(page)).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(hoverPeek(page)).toBeVisible();
    await unchanged();
  });

  test('AD-12 entering the top card, then another point of the cell at 350 ms: absent at 399 ms, present at 400 ms after the first entry, app not halted', async ({
    page,
  }) => {
    await openPaused(page, 'session-won');
    const unchanged = await stash(page);
    await hoverCell(page, 6);
    await page.clock.runFor(350);
    const c = await box(cell(page, 6));
    await page.mouse.move(c.x + 2, c.y + c.height - 2);
    await page.clock.runFor(49);
    await expect(hoverPeek(page)).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(hoverPeek(page)).toBeVisible();
    expect(await halted(page)).toBe(false);
    await unchanged();
  });

  test('AD-12 moving from cell 6 to cell 7: 6’s closes on leaving it, none before 400 ms on 7, then 7’s opens', async ({
    page,
  }) => {
    await openPaused(page, 'session-won');
    const seven = await cellCards(page, 7);
    expect(seven).toHaveLength(21);
    const unchanged = await stash(page);
    await hoverCell(page, 6);
    await page.clock.runFor(400);
    await expect(hoverPeek(page)).toBeVisible();
    await hoverCell(page, 7);
    await expect(hoverPeek(page)).toHaveCount(0);
    await page.clock.runFor(399);
    await expect(hoverPeek(page)).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(hoverPeek(page)).toBeVisible();
    expect(
      await peekMirrors(page).evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-mirror-of')),
      ),
    ).toEqual(seven.slice(-14));
    await expect(hoverPeek(page)).toContainText('+7 older cards');
    await unchanged();
  });

  test('AD-12 a press on cell 6 dragged past the threshold inside it closes the hover peek before mouse.up', async ({
    page,
  }) => {
    await openPaused(page, 'session-won');
    const unchanged = await stash(page);
    const c = await hoverCell(page, 6);
    await page.clock.runFor(400);
    await expect(hoverPeek(page)).toBeVisible();
    await page.mouse.down();
    await page.mouse.move(c.x, c.y - 15, { steps: 3 });
    await expect(hoverPeek(page)).toHaveCount(0);
    await page.mouse.up();
    await expectNoViewPaused(page);
    await expect(hoverPeek(page)).toHaveCount(0);
    await unchanged();
  });

  test('AD-12 a mouse tail drag from column 2 resting 600 ms over cell 7 shows no hover peek before release nor reopens after it; out and back in opens it', async ({
    page,
  }) => {
    await openPaused(page, 'session-idle-empty-column');
    expect(await cellCards(page, 7)).toHaveLength(7);
    const unchanged = await stash(page);
    const from = await centre(page.getByTestId('column-2').locator('[data-place="column"]').last());
    const to = await centre(cell(page, 7));
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 12 });
    await expect(page.locator('.wc-drag-layer').first()).toBeAttached();
    await page.clock.runFor(600);
    await expect(hoverPeek(page)).toHaveCount(0);
    await page.mouse.up();
    // The fly-back (WAAPI) settles in real time.
    await expect(page.locator('.wc-drag-layer, .wc-drag-ghost')).toHaveCount(0);
    await page.clock.runFor(600);
    await expect(hoverPeek(page)).toHaveCount(0);
    await page.mouse.move(to.x + 3, to.y + 3);
    await page.clock.runFor(600);
    await expect(hoverPeek(page)).toHaveCount(0);
    await moveAway(page);
    await hoverCell(page, 7);
    await page.clock.runFor(400);
    await expect(hoverPeek(page)).toBeVisible();
    await unchanged();
  });

  test('R-65 hovering session-idle-empty-column’s cell 7 for 400 ms opens its hover peek', async ({
    page,
  }) => {
    await openPaused(page, 'session-idle-empty-column');
    const cards = await cellCards(page, 7);
    expect(cards).toHaveLength(7);
    const unchanged = await stash(page);
    await hoverCell(page, 7);
    await page.clock.runFor(400);
    await expect(hoverPeek(page)).toBeVisible();
    await expect(peekMirrors(page)).toHaveCount(7);
    await expect(hoverPeek(page)).not.toContainText('older');
    await unchanged();
  });

  test('R-65 R-75 session-gave-up-after-commit’s empty cell 3 hovered 600 ms opens nothing', async ({
    page,
  }) => {
    await openPaused(page, 'session-gave-up-after-commit');
    expect(await cellCards(page, 3)).toHaveLength(0);
    const unchanged = await stash(page);
    await hoverCell(page, 3);
    await page.clock.runFor(600);
    await expect(hoverPeek(page)).toHaveCount(0);
    await expectNoViewPaused(page);
    // R-75: viewing a WordCell stays available in Game over.
    expect(await cellCards(page, 7)).toHaveLength(7);
    await hoverCell(page, 7);
    await page.clock.runFor(400);
    await expect(hoverPeek(page)).toBeVisible();
    await expect(peekMirrors(page)).toHaveCount(7);
    await unchanged();
  });

  test('R-65 the used cell 3’s hover peek shows an unhatched mirror tagged top; one live element per card; a do-nothing click keeps it open', async ({
    page,
  }) => {
    await openPaused(page, 'session-place-free-letter-redo-tail');
    const cards = await cellCards(page, 3);
    expect(cards).toHaveLength(3);
    expect(
      Number(await page.locator('[data-wordcell]:has(.used)').getAttribute('data-wordcell')),
    ).toBe(3);
    const unchanged = await stash(page);
    await hoverCell(page, 3);
    await page.clock.runFor(400);
    await expect(hoverPeek(page)).toBeVisible();
    expect(
      await peekMirrors(page).evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-mirror-of')),
      ),
    ).toEqual(cards);
    const last = peekMirrors(page).last();
    await expect(last).toContainText('top');
    const face = await last
      .locator(':scope > .face')
      .evaluate((el) => [getComputedStyle(el).opacity, getComputedStyle(el).backgroundImage]);
    expect(face).toEqual(['1', 'none']);
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    for (const id of cards) await expect(page.locator(`[data-card-id="${id}"]`)).toHaveCount(1);
    // Place: a WordCell click does nothing (CAP-9), so the hover peek stays.
    await page.mouse.down();
    await page.mouse.up();
    await expect(hoverPeek(page)).toBeVisible();
    await expectNoViewPaused(page);
    await unchanged();
  });

  test('AD-13 hover 400 ms, then hold 400 ms: only the peek sheet', async ({ page }) => {
    await openPaused(page, 'session-won');
    const unchanged = await stash(page);
    await hoverCell(page, 6);
    await page.clock.runFor(400);
    await expect(hoverPeek(page)).toBeVisible();
    await page.mouse.down();
    // At 399 ms the long press has not fired: the hover peek is still open, no sheet.
    await page.clock.runFor(399);
    await expect(hoverPeek(page)).toBeVisible();
    await expect(sheet(page)).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page)).toHaveAttribute('data-mode', 'peek');
    await expect(hoverPeek(page)).toHaveCount(0);
    await page.mouse.up();
    await unchanged();
  });
});
