import { expect, type Locator, type Page, test } from '@playwright/test';
import { EN, view } from '../src/engine/index';
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

async function openFixture(page: Page, name: string): Promise<void> {
  await seedStorage(page, { session: fixture(`${name}.json`) });
  await page.goto('/');
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await booted(page);
}

const cell = (page: Page, n: number) => page.getByTestId(`wordcell-${n}`);
const sheet = (page: Page) => page.locator('[data-view-sheet]');
const scrim = (page: Page) => page.locator('[data-view-scrim]');
const scrollArea = (page: Page) => page.locator('[data-view-scroll]');
const mirrors = (page: Page) => sheet(page).locator('[data-mirror-of]');

async function centre(locator: Locator): Promise<Point> {
  const b = await locator.boundingBox();
  if (b === null) throw new Error('element has no box');
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

async function tapAt(page: Page, p: Point): Promise<void> {
  if (test.info().project.name === 'android') await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
}

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
});
