import { expect, type Locator, type Page, test } from '@playwright/test';
import { EN, type GameView, type Session, view } from '../src/engine/index';
import type { Rect } from '../src/ui/gestures/targeting';
import { gapRects, slotRects, trayLayout } from '../src/ui/layout/tray';
import { stored } from './helpers/blocking';
import {
  box,
  cards,
  centre,
  column,
  openFixture,
  type Point,
  tapAt,
  trayIds,
} from './helpers/board';
import { expectLeaves } from './helpers/dialogs';
import { dragResidue, expectNoResidue } from './helpers/drag';
import { path } from './helpers/gestures';
import { animationFrames, hidePage } from './helpers/lifecycle';
import { onAndroid, onDesktop } from './helpers/project';
import { game, storedGame } from './helpers/session';
import { type TouchHold, touchHold } from './helpers/touch';

// Epic 5 entry 8 (SPEC CAP-6, F5, F16, F18): free letters by tap and by drag on
// session-idle-empty-column (seed 1; cell 7 holds 7 cards, its top card 48 `W`; column 1 empty)
// after a drop, one source per load. The drops are picked from `view()` over the fixture (every
// drop below is legal there; a drop lands with the block on the left): column 3's tail [42, 0] onto
// column 4 (k 1, D [32]: tray [32m, 42, 0]); column 2's last card 26 onto empty column 1 (k = 0:
// tray [26]); column 2's whole 7-card tail onto column 1 (k = 0, 7 card-mode tiles, perRow 7 at
// 412 px: the full layout). `⇄ Flip` puts the block on the right. Held faces go to the named gap's
// rect from layout/tray.ts (`slotRects` over `trayLayout(tileCount, w, trayInnerWidth)` with one
// extra slot while the layout has room, `origin` = tray position 0's wrapper + 2 px x, `w` and the
// inner width read from the rendered tray). Every edit asserts the stored wordcell:session equals
// the store's Session (R-73 (UI)) and then one zero `dragResidue` read. Local helpers
// (shared ones are in e2e/helpers/, ticket 5.14 S1): `open`/`expectSaved`/`storedMove`/geometry/hold
// helpers from e2e/tile-drag.spec.ts, the used-cell
// check after e2e/board-phases.spec.ts `expectUsedCell3`.

const SESSION = 'wordcell:session';
const FIXTURE = 'session-idle-empty-column';
const TOP = 48;
const tray = (page: Page) => page.locator('[data-band="tray"]');
const tile = (page: Page, id: number) => tray(page).getByTestId(`card-${id}`);
const cell = (page: Page, n: number) => page.getByTestId(`wordcell-${n}`);
const cellTop = (page: Page) => cell(page, 7).getByTestId(`card-${TOP}`);
const cellTopFace = (page: Page) => cellTop(page).locator(':scope > .face');
const caret = (page: Page) => tray(page).locator('.wc-caret');
const selectedTiles = (page: Page) => tray(page).locator('[data-card-id].selected');
const flipButton = (page: Page) =>
  tray(page).locator('.controls').getByRole('button', { name: 'Flip', exact: true });

type StoredMove = {
  arrangement: number[];
  freeLetters: number[];
  destinationCount: number;
  destinationSide: string;
};
type Stored = { moves: StoredMove[]; cursor: { index: number; phase: string } };

// R-73: the stored wordcell:session deep-equals current().session; returns it.
async function expectSaved(page: Page): Promise<Stored> {
  const read = async () => {
    const text = await stored(page, SESSION);
    const session = await page.evaluate(() => {
      const current = window.__wordcell?.current();
      if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
      return current.session;
    });
    return { stored: text === null ? null : JSON.parse(text), session };
  };
  await expect
    .poll(async () => {
      const r = await read();
      return JSON.stringify(r.stored) === JSON.stringify(r.session);
    })
    .toBe(true);
  const r = await read();
  expect(r.stored).toEqual(r.session);
  return r.stored as Stored;
}

// The draft move the cursor points at, as stored (saved first).
async function storedMove(page: Page): Promise<StoredMove> {
  const s = await expectSaved(page);
  const move = s.moves[s.cursor.index];
  if (move === undefined) throw new Error('no stored move at the cursor');
  return move;
}

// An edit: saved before the next action (R-73 (UI)), then residue polled until the release glide settles.
async function expectEdit(page: Page): Promise<StoredMove> {
  const move = await storedMove(page);
  // Ticket 5.16 (CAP-8, F17): the release's FLIP glide holds `wc-drag-tiles` until it settles.
  await expectNoResidue(page);
  await expectNoTrayResidue(page);
  return move;
}

// What `dragResidue` cannot see (SPEC CAP-6, F16): the caret hidden with no inline transform, and no
// tray element carrying a parted class. One read, no polling.
async function expectNoTrayResidue(page: Page): Promise<void> {
  expect(
    await page.evaluate(() => {
      const caret = document.querySelector<HTMLElement>('[data-band="tray"] .wc-caret');
      return {
        shown: caret?.classList.contains('wc-caret-shown') ?? false,
        transform: caret?.style.transform ?? '',
        parted: document.querySelectorAll(
          '[data-band="tray"] :is(.wc-parted, .wc-part-start, .wc-part-end)',
        ).length,
      };
    }),
  ).toEqual({ shown: false, transform: '', parted: 0 });
}

// The store's Session and its view() (AD-17 hook; AD-3 view from the engine).
async function current(page: Page): Promise<GameView> {
  const session = await page.evaluate(() => {
    const c = window.__wordcell?.current();
    if (c?.kind !== 'active') throw new Error(`store is ${c?.kind}`);
    return c.session;
  });
  return view(session as Session, EN);
}

async function expectSelected(page: Page, id: number | null): Promise<void> {
  if (id === null) {
    await expect(selectedTiles(page)).toHaveCount(0);
    return;
  }
  await expect(selectedTiles(page)).toHaveCount(1);
  await expect(tile(page, id)).toHaveClass(/\bselected\b/);
}

async function select(page: Page, id: number): Promise<void> {
  await tapAt(page, await centre(tile(page, id)));
  await expectSelected(page, id);
}

// R-33: cell 7 shows its top as the used-hatch mirror (the live card is in the tray).
async function expectUsed(page: Page): Promise<void> {
  const used = cell(page, 7).locator(`[data-mirror-of="${TOP}"]`);
  await expect(used).toHaveCount(1);
  await expect(used.locator('.face')).toHaveCSS('opacity', '0.4');
  expect(
    await used.locator('.face').evaluate((el) => getComputedStyle(el).backgroundImage),
  ).toContain('repeating-linear-gradient');
}

async function expectUnused(page: Page): Promise<void> {
  await expect(cell(page, 7).locator('[data-mirror-of]')).toHaveCount(0);
  await expect(cellTop(page)).toHaveCount(1);
  expect((await current(page)).cells.find((c) => c.cell === 7)?.used).toBe(false);
}

type Drop = { source: number; count: number; destination: number };
const BLOCK: Drop = { source: 3, count: 2, destination: 4 };
const SHORT: Drop = { source: 2, count: 1, destination: 1 };
const WHOLE: Drop = { source: 2, count: 7, destination: 1 };

// Opens the fixture and drops `drop` by taps (select the tail, tap the destination's bottom card or
// placeholder), checking it lands in Composing, saved; returns the view.
async function open(page: Page, drop: Drop, { flip = false } = {}): Promise<GameView> {
  await openFixture(page, FIXTURE);
  const before = await current(page);
  const source = before.columns[drop.source - 1];
  if (source === undefined) throw new Error(`no column ${drop.source}`);
  await tapAt(page, await centre(cards(page, drop.source).nth(source.cards.length - drop.count)));
  const target = cards(page, drop.destination);
  await tapAt(
    page,
    await centre(
      (await target.count()) === 0
        ? column(page, drop.destination).locator('[data-placeholder]')
        : target.last(),
    ),
  );
  await expect.poll(async () => (await current(page)).phase).toBe('composing');
  if (flip) await flipButton(page).click();
  await expectSaved(page);
  await expect(selectedTiles(page)).toHaveCount(0);
  const v = await current(page);
  // Premise: cell 7 is the one source of a free letter.
  expect(v.cells.filter((c) => c.canAddFreeLetter).map((c) => c.cell)).toEqual([7]);
  return v;
}

// --- geometry ------------------------------------------------------------------------------------

type Geometry = {
  tileCount: number;
  perRow: number;
  mode: string;
  room: boolean;
  slots: Rect[];
  w: number;
  inner: number;
};

// Entry 6's geometry for the rendered tray (tile count from `.tiles` without the caret); one more
// slot than the tile count while the layout has room (the free-letter parting).
async function geometry(page: Page): Promise<Geometry> {
  const m = await page.evaluate(() => {
    const band = document.querySelector<HTMLElement>('[data-band="tray"]');
    const tiles = band?.querySelector('.tiles');
    if (band === null || band === undefined || tiles === null || tiles === undefined) {
      throw new Error('no tray tiles');
    }
    const head = tiles.children[0];
    if (head === undefined) throw new Error('no tray position 0');
    const style = getComputedStyle(band);
    const r = head.getBoundingClientRect();
    return {
      w: parseFloat(style.getPropertyValue('--wc-w')),
      inner: band.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
      x: r.left + 2,
      y: r.top,
      count: tiles.querySelectorAll(':scope > :not(.wc-caret)').length,
    };
  });
  const sizing = trayLayout(m.count, m.w, m.inner);
  const room = m.count + 1 <= sizing.perRow * sizing.rows;
  return {
    tileCount: m.count,
    perRow: sizing.perRow,
    mode: sizing.mode,
    room,
    slots: slotRects(sizing, { x: m.x, y: m.y }, room ? m.count + 1 : m.count),
    w: m.w,
    inner: m.inner,
  };
}

const mid = (r: Rect): Point => ({ x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 });

function gapRect(g: Geometry, first: number, count: number, index: number): Rect {
  const found = gapRects(g.slots, g.perRow, g.tileCount, first, count).find(
    (e) => e.index === index,
  );
  if (found === undefined) throw new Error(`no gap ${index}`);
  return found.rect;
}

const gapCentre = (g: Geometry, first: number, count: number, index: number): Point =>
  mid(gapRect(g, first, count, index));

const slot = (g: Geometry, p: number): Rect => {
  const s = g.slots[p];
  if (s === undefined) throw new Error(`no slot ${p}`);
  return s;
};

async function moveFace(page: Page, hold: TouchHold, from: Point, to: Point, steps = 4) {
  for (const p of path(from, to, steps)) {
    await hold.moveTo(p);
    await animationFrames(page, 2);
  }
}

// A touch held on cell 7's top face centre, then moved so the face centre lies on each target.
async function holdTop(page: Page, targets: Point[]): Promise<{ hold: TouchHold; at: Point }> {
  const start = await centre(cellTopFace(page));
  const hold = await touchHold(page, start);
  let at = start;
  try {
    for (const to of targets) {
      await moveFace(page, hold, at, to);
      at = to;
    }
  } catch (error) {
    await hold.end();
    throw error;
  }
  return { hold, at };
}

// The tray's faces carrying an inline transform, by card id (a mirror as `<id>m`).
function transformed(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-band="tray"] .face')]
      .filter((f) => f.style.transform !== '')
      .map((f) => {
        const w = f.parentElement;
        const mirror = w?.getAttribute('data-mirror-of');
        return mirror === null || mirror === undefined
          ? (w?.getAttribute('data-card-id') ?? '?')
          : `${mirror}m`;
      }),
  );
}

// A block mirror's segment-end look (Card.svelte): its lock display, its face width past the tile
// width, each face edge (margin, border width, radius), and its badge's `right` (null without one).
type BlockEnds = {
  lock: boolean;
  width: number;
  left: string;
  right: string;
  badge: string | null;
};

// A closed segment edge (2 px margin, 2 px border, 6 px radius) or a joined one.
const CLOSED = '2px 2px 6px';
const JOINED = '0px 0px 0px';

function blockEnds(page: Page, id: number): Promise<BlockEnds> {
  return tray(page).evaluate((band, id) => {
    const w = band.querySelector(`[data-mirror-of="${id}"]`);
    const lock = w?.querySelector('.lock');
    const face = w?.querySelector(':scope > .face');
    if (w === null || w === undefined || lock === null || lock === undefined) {
      throw new Error(`mirror ${id} incomplete`);
    }
    if (face === null || face === undefined) throw new Error(`mirror ${id} without a face`);
    const f = getComputedStyle(face);
    const badge = face.querySelector('.badge');
    return {
      lock: getComputedStyle(lock).display !== 'none',
      width: parseFloat(f.width) - parseFloat(getComputedStyle(w).getPropertyValue('--tile-w')),
      left: `${f.marginLeft} ${f.borderLeftWidth} ${f.borderTopLeftRadius}`,
      right: `${f.marginRight} ${f.borderRightWidth} ${f.borderTopRightRadius}`,
      badge: badge === null ? null : getComputedStyle(badge).right,
    };
  }, id);
}

// The held face: on the drag layer with an inline transform, the cell showing its ghost.
async function expectHeld(page: Page): Promise<void> {
  await expect(cellTopFace(page)).toHaveClass(/\bwc-drag-layer\b/);
  expect(await cellTopFace(page).evaluate((el) => (el as HTMLElement).style.transform)).not.toBe(
    '',
  );
  await expect(cell(page, 7)).toHaveClass(/\bwc-drag-ghost\b/);
}

const settled = (locator: Locator) =>
  expect.poll(() => locator.evaluate((el) => el.getAnimations().length)).toBe(0);

// The caret: shown on `rect` (3 px wide, centred in the 4 px gap rect, its height).
async function expectCaretAt(page: Page, rect: Rect): Promise<void> {
  await expect(caret(page)).toHaveClass(/\bwc-caret-shown\b/);
  const b = await box(caret(page));
  expect(Math.abs(b.x - (rect.left + 0.5))).toBeLessThanOrEqual(0.5);
  expect(Math.abs(b.y - rect.top)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(b.w - 3)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(b.h - (rect.bottom - rect.top))).toBeLessThanOrEqual(0.5);
  expect(await caret(page).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
    await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.color = 'var(--wc-accent-teal)';
      document.querySelector('.board-root')?.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    }),
  );
}

const caretHidden = (page: Page) => expect(caret(page)).toBeHidden();

// A point whose held face (centred on it, at the face's size) overlaps the tray band by 20 % of
// its height from the band's top edge (under 25 %), at `x`.
async function underQuarter(page: Page, x: number): Promise<Point> {
  const band = await box(tray(page));
  const face = await box(cellTopFace(page));
  return { x, y: band.y + 0.2 * face.h - face.h / 2 };
}

// --- tap-add and drag-insert ----------------------------------------------------------------------

test.describe('android', () => {
  test.beforeEach(onAndroid);

  test('R-33 (UI) R-73 (UI) Q-31 tap-add with the block left and tile 42 selected appends cell 7’s top: cell 7 used, nothing selected', async ({
    page,
  }) => {
    const v = await open(page, BLOCK);
    expect(v.draft).toMatchObject({ k: 1, side: 'left', arrangement: [42, 0] });
    await select(page, 42);
    await tapAt(page, await centre(cellTop(page)));
    const move = await storedMove(page);
    expect(move.arrangement).toEqual([42, 0, TOP]);
    expect(move.freeLetters).toEqual([7]);
    await expectSelected(page, null);
    await expectUsed(page);
    expect(await trayIds(page)).toEqual(['32m', '42', '0', `${TOP}`]);
  });

  test('R-33 (UI) R-73 (UI) Q-31 AD-12 drag-insert at the inner gap 1 of M (block left): mid-drag the ghost (badge unchanged, no card beneath, cell not used) and tile 0 parted; stored [42, 48, 0], cell 7 used', async ({
    page,
  }) => {
    const v = await open(page, BLOCK);
    // Premises: a ≥ 2-card tail on a non-empty column, the block left.
    expect(v.draft?.k).toBeGreaterThanOrEqual(1);
    expect(v.draft?.arrangement.length).toBeGreaterThanOrEqual(2);
    expect(v.draft?.side).toBe('left');
    const g = await geometry(page);
    expect(g.room).toBe(true);
    const badge = await cell(page, 7).locator('.count').textContent();
    expect(badge).toBe('7');
    const { hold } = await holdTop(page, [gapCentre(g, 1, 2, 1)]);
    try {
      await expectHeld(page);
      await expect(cell(page, 7).locator('.count')).toHaveText('7');
      // No card beneath shows: every other card of the cell stays hidden.
      expect(
        await cell(page, 7)
          .locator('[data-card-id]')
          .evaluateAll((els) =>
            els
              .filter((el) => el.getAttribute('data-card-id') !== '48')
              .map((el) => getComputedStyle(el).visibility),
          ),
      ).toEqual(Array(6).fill('hidden'));
      // The ghost: a 1 px dashed outline at the card rect.
      expect(
        await cell(page, 7).evaluate((el) => {
          const s = getComputedStyle(el, '::before');
          return `${s.borderTopWidth} ${s.borderTopStyle}`;
        }),
      ).toBe('1px dashed');
      await expect(cell(page, 7).locator('[data-mirror-of]')).toHaveCount(0);
      expect((await transformed(page)).sort()).toEqual(['0']);
      await caretHidden(page);
      await expect(page.locator('[data-card-id]')).toHaveCount(52);
    } finally {
      await hold.end();
    }
    const move = await expectEdit(page);
    expect(move.arrangement).toEqual([42, TOP, 0]);
    expect(move.freeLetters).toEqual([7]);
    await expectUsed(page);
    expect(await trayIds(page)).toEqual(['32m', '42', `${TOP}`, '0']);
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
  });

  test('R-33 Q-31 F16 the caret at, and a release into, the end gap of M with the block left: no tile transformed; stored [42, 0, 48]', async ({
    page,
  }) => {
    await open(page, BLOCK);
    const g = await geometry(page);
    const end = gapRect(g, 1, 2, 2);
    const { hold } = await holdTop(page, [mid(end)]);
    try {
      await expectHeld(page);
      await expectCaretAt(page, end);
      expect(await transformed(page)).toEqual([]);
    } finally {
      await hold.end();
    }
    await caretHidden(page);
    expect((await expectEdit(page)).arrangement).toEqual([42, 0, TOP]);
    await expectUsed(page);
  });

  test('R-33 Q-31 F16 with k = 0 (card 26 on empty column 1) the caret at, and a release into, the end gap of M: stored [26, 48]', async ({
    page,
  }) => {
    const v = await open(page, SHORT);
    expect(v.draft).toMatchObject({ k: 0, arrangement: [26] });
    const g = await geometry(page);
    const end = gapRect(g, 0, 1, 1);
    const { hold } = await holdTop(page, [mid(end)]);
    try {
      await expectHeld(page);
      await expectCaretAt(page, end);
      expect(await transformed(page)).toEqual([]);
    } finally {
      await hold.end();
    }
    expect((await expectEdit(page)).arrangement).toEqual([26, TOP]);
    await expectUsed(page);
  });

  test('R-33 Q-31 F16 full layout (column 2’s 7-card tail on empty column 1, perRow 7 card mode): the caret at inner gap 3 with every tile untransformed, hidden under 25 %; the release on it stores 48 at gap 3', async ({
    page,
  }) => {
    const v = await open(page, WHOLE);
    const m = [44, 29, 33, 7, 47, 19, 26];
    expect(v.draft).toMatchObject({ k: 0, arrangement: m });
    const g = await geometry(page);
    expect(trayLayout(7, g.w, g.inner)).toMatchObject({ perRow: 7, mode: 'card', rows: 1 });
    expect(g.room).toBe(false);
    const inner = gapRect(g, 0, 7, 3);
    const { hold, at } = await holdTop(page, [mid(inner)]);
    try {
      await expectHeld(page);
      await expectCaretAt(page, inner);
      expect(await transformed(page)).toEqual([]);
      const under = await underQuarter(page, at.x);
      await moveFace(page, hold, at, under);
      await expectHeld(page);
      await caretHidden(page);
      await moveFace(page, hold, under, mid(inner));
      await expectCaretAt(page, inner);
      expect(await transformed(page)).toEqual([]);
    } finally {
      await hold.end();
    }
    expect((await expectEdit(page)).arrangement).toEqual([44, 29, 33, TOP, 7, 47, 19, 26]);
  });

  // --- the destination block (R-32, AD-14) -------------------------------------------------------

  test('AD-14 R-33 Q-31 under reduced motion, block right (after Flip): cell 7’s top held at gap 0 parts tiles 42, 0 and the D-block mirror one slot step, 52 live cards mid-drag and after; the mirror at rest after release; stored [48, 42, 0]', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const v = await open(page, BLOCK, { flip: true });
    expect(v.draft).toMatchObject({ k: 1, side: 'right', arrangement: [42, 0] });
    expect(await trayIds(page)).toEqual(['42', '0', '32m']);
    const g = await geometry(page);
    expect(g.room).toBe(true);
    const mirrorFace = tray(page).locator('[data-mirror-of="32"] > .face');
    const { hold } = await holdTop(page, [gapCentre(g, 0, 2, 0)]);
    try {
      await expectHeld(page);
      expect((await transformed(page)).sort()).toEqual(['0', '32m', '42']);
      const step = slot(g, 3).left - slot(g, 2).left;
      const parted = await box(mirrorFace);
      expect(Math.abs(parted.x - slot(g, 3).left)).toBeLessThanOrEqual(0.5);
      expect(await mirrorFace.evaluate((el) => (el as HTMLElement).style.transform)).toBe(
        `translate(${step}px, 0px)`,
      );
      await expect(tray(page).locator('[data-mirror-of="32"]')).toHaveClass(/\bwc-parted\b/);
      await expect(tray(page).locator('[data-mirror-of="32"] .lock:visible')).toHaveCount(1);
      // The parted single mirror is both segment ends: tile-wide face, both edges closed.
      expect(await blockEnds(page, 32)).toEqual({
        lock: true,
        width: 0,
        left: CLOSED,
        right: CLOSED,
        badge: null,
      });
      expect(await mirrorFace.evaluate((el) => el.getAnimations().length)).toBe(0);
      await expect(page.locator('[data-card-id]')).toHaveCount(52);
    } finally {
      await hold.end();
    }
    expect((await expectEdit(page)).arrangement).toEqual([TOP, 42, 0]);
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    expect(await trayIds(page)).toEqual([`${TOP}`, '42', '0', '32m']);
    expect(await mirrorFace.evaluate((el) => (el as HTMLElement).style.transform)).toBe('');
    expect(await mirrorFace.evaluate((el) => el.getAnimations().length)).toBe(0);
    await expect(tray(page).locator('[data-mirror-of="32"]')).not.toHaveClass(/\bwc-parted\b/);
  });

  test('AD-14 F5 under reduced motion, block right (after Flip): the D-block mirror parted at gap 0, then the drag ended by pointercancel while parted, the mirror has no inline transform and no animation right after the end; Session byte-identical, cell 7 unused', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, BLOCK, { flip: true });
    await trackPointerId(page);
    expect(await trayIds(page)).toEqual(['42', '0', '32m']);
    const before = await stored(page, SESSION);
    const g = await geometry(page);
    const mirrorFace = tray(page).locator('[data-mirror-of="32"] > .face');
    const gap0 = gapCentre(g, 0, 2, 0);
    const { hold } = await holdTop(page, [gap0]);
    try {
      await expectHeld(page);
      expect((await transformed(page)).sort()).toEqual(['0', '32m', '42']);
      // Ended while parted: the return reaches home()'s reduced-motion mirror snap (AD-14).
      await cancelCaptured(page);
      expect(
        await mirrorFace.evaluate((el) => ({
          transform: (el as HTMLElement).style.transform,
          animations: el.getAnimations().length,
        })),
      ).toEqual({ transform: '', animations: 0 });
    } finally {
      await hold.end();
    }
    await expectNoResidue(page);
    await expectNoTrayResidue(page);
    expect(await stored(page, SESSION)).toBe(before);
    await expectUnused(page);
  });

  test('AD-14 a k = 2 block (redo-tail fixture, block right) under wc-parted: each mirror’s lock and segment ends follow wc-part-start / wc-part-end and ignore its resting .start / .end', async ({
    page,
  }) => {
    await openFixture(page, 'session-place-free-letter-redo-tail', { steps: ['redo', 'redo'] });
    expect(await trayIds(page)).toEqual(['26', '1m', '27m']);
    await expect(tray(page).locator('[data-mirror-of="1"]')).toHaveClass(/\bstart\b/);
    await expect(tray(page).locator('[data-mirror-of="27"]')).toHaveClass(/\bend\b/);
    // Neither mirror is QU: give each face a probe badge in Card.svelte's scope so its block badge
    // rules apply.
    await tray(page).evaluate((band) => {
      for (const face of band.querySelectorAll('[data-mirror-of] > .face')) {
        const scope = [...face.classList].find((c) => c.startsWith('svelte-'));
        if (scope === undefined) throw new Error('face without a Svelte scope class');
        const badge = document.createElement('span');
        badge.className = `badge ${scope}`;
        face.append(badge);
      }
    });
    const ends = async () => [await blockEnds(page, 1), await blockEnds(page, 27)];
    // At rest: 1 is the segment start (lock), 27 its end.
    expect(await ends()).toEqual([
      { lock: true, width: 3, left: CLOSED, right: JOINED, badge: '5px' },
      { lock: false, width: 2, left: JOINED, right: CLOSED, badge: '0px' },
    ]);
    // Parted with the ends swapped (1 an end, 27 a start): the parted classes win over .start/.end.
    await tray(page).evaluate((band) => {
      band.querySelector('[data-mirror-of="1"]')?.classList.add('wc-parted', 'wc-part-end');
      band.querySelector('[data-mirror-of="27"]')?.classList.add('wc-parted', 'wc-part-start');
    });
    expect(await ends()).toEqual([
      { lock: false, width: 2, left: JOINED, right: CLOSED, badge: '0px' },
      { lock: true, width: 3, left: CLOSED, right: JOINED, badge: '5px' },
    ]);
    // Parted as neither end (1, a segment middle) and as both ends (27).
    await tray(page).evaluate((band) => {
      band.querySelector('[data-mirror-of="1"]')?.classList.remove('wc-part-end');
      band.querySelector('[data-mirror-of="27"]')?.classList.add('wc-part-end');
    });
    expect(await ends()).toEqual([
      { lock: false, width: 5, left: JOINED, right: JOINED, badge: '5px' },
      { lock: true, width: 0, left: CLOSED, right: CLOSED, badge: '0px' },
    ]);
  });

  for (const [where, offset] of [
    ['over', 0],
    ['past', 1],
  ] as const) {
    test(`R-32 block right (one row, F25): a free letter released in-band ${where} the block is stored at the end of M [42, 0, 48]`, async ({
      page,
    }) => {
      await open(page, BLOCK, { flip: true });
      const g = await geometry(page);
      const { hold } = await holdTop(page, [mid(slot(g, 2 + offset))]);
      try {
        await expectHeld(page);
      } finally {
        await hold.end();
      }
      expect((await expectEdit(page)).arrangement).toEqual([42, 0, TOP]);
    });
  }

  test('R-32 block left: a free letter released over the block lands first in M [48, 42, 0]', async ({
    page,
  }) => {
    await open(page, BLOCK);
    const g = await geometry(page);
    const { hold } = await holdTop(page, [mid(slot(g, 0))]);
    try {
      await expectHeld(page);
    } finally {
      await hold.end();
    }
    expect((await expectEdit(page)).arrangement).toEqual([TOP, 42, 0]);
  });

  // --- inert cases and the long-press ------------------------------------------------------------

  test('R-33 a drag on a used WordCell (7, after a tap-add) and on an empty one (3) into the tray, tile 42 selected: nothing moves, Session byte-identical, selection kept', async ({
    page,
  }) => {
    await open(page, BLOCK);
    await tapAt(page, await centre(cellTop(page)));
    await storedMove(page);
    await expectUsed(page);
    await select(page, 42);
    const before = await stored(page, SESSION);
    const g = await geometry(page);
    for (const n of [7, 3]) {
      const from = await centre(cell(page, n));
      const hold = await touchHold(page, from);
      try {
        await moveFace(page, hold, from, gapCentre(g, 1, 3, 1));
        expect(await transformed(page)).toEqual([]);
        expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
        await expectNoTrayResidue(page);
      } finally {
        await hold.end();
      }
      await animationFrames(page, 2);
      await expectSelected(page, 42);
      expect(await stored(page, SESSION)).toBe(before);
    }
  });

  test('R-65 (UI) a long-press peek on available cell 7 with tile 42 selected: the peek shown, then moved into the band and released, Session byte-identical, cell 7 unused, the tile still selected', async ({
    page,
  }) => {
    await open(page, BLOCK);
    await select(page, 42);
    const before = await stored(page, SESSION);
    const g = await geometry(page);
    const from = await centre(cellTop(page));
    const hold = await touchHold(page, from);
    try {
      await expect(page.locator('[data-view-sheet]')).toBeVisible();
      await expectSelected(page, 42);
      await moveFace(page, hold, from, gapCentre(g, 1, 2, 1));
      expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
      await expectNoTrayResidue(page);
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    expect(await stored(page, SESSION)).toBe(before);
    await expectUnused(page);
    await expectSelected(page, 42);
  });

  // --- ends (F5) ----------------------------------------------------------------------------------

  for (const end of ['outside the tray band', 'under 25 %'] as const) {
    test(`AD-12 F5 a free letter released ${end} (epic Done when 3) flies back: Session byte-identical, cell 7 unused`, async ({
      page,
    }) => {
      await open(page, BLOCK);
      const before = await stored(page, SESSION);
      const g = await geometry(page);
      const gap = gapCentre(g, 1, 2, 1);
      const band = await box(tray(page));
      const target =
        end === 'under 25 %' ? await underQuarter(page, gap.x) : { x: gap.x, y: band.y - 120 };
      const { hold } = await holdTop(page, [gap, target]);
      try {
        await expectHeld(page);
        expect(await transformed(page)).toEqual([]);
        await caretHidden(page);
      } finally {
        await hold.end();
      }
      await expectNoResidue(page);
      await expectNoTrayResidue(page);
      await settled(cellTopFace(page));
      expect(await stored(page, SESSION)).toBe(before);
      await expectUnused(page);
    });
  }

  // Records each pointerdown's id; dispatches pointercancel on the element holding its capture
  // (e2e/drag-interruptions.spec.ts).
  async function trackPointerId(page: Page): Promise<void> {
    await page.evaluate(() => {
      document.addEventListener(
        'pointerdown',
        (event) => {
          (window as unknown as { __pointerId: number }).__pointerId = event.pointerId;
        },
        { capture: true },
      );
    });
  }

  async function cancelCaptured(page: Page): Promise<void> {
    await page.evaluate(() => {
      const id = (window as unknown as { __pointerId: number }).__pointerId;
      const el = [...document.querySelectorAll('*')].find((e) => e.hasPointerCapture(id));
      if (el === undefined) throw new Error(`no element holds pointer ${id}`);
      el.dispatchEvent(new PointerEvent('pointercancel', { pointerId: id, bubbles: true }));
    });
  }

  test('AD-12 F5 F18 pointercancel mid-drag (tile 42 selected first) flies back: Session byte-identical, cell 7 unused, nothing selected', async ({
    page,
  }) => {
    await open(page, BLOCK);
    await trackPointerId(page);
    await select(page, 42);
    const before = await stored(page, SESSION);
    const g = await geometry(page);
    const { hold } = await holdTop(page, [gapCentre(g, 1, 2, 1)]);
    try {
      await expectHeld(page);
      await expectSelected(page, null);
      await cancelCaptured(page);
    } finally {
      await hold.end();
    }
    await expectNoResidue(page);
    await expectNoTrayResidue(page);
    await settled(cellTopFace(page));
    expect(await stored(page, SESSION)).toBe(before);
    await expectUnused(page);
    await expectSelected(page, null);
  });

  test('AD-12 F5 F18 an enabled App button (Flip) pressed mid-drag (tile 42 selected first) settles the drag at once and stores only its own command; cell 7 unused, nothing selected', async ({
    page,
  }) => {
    await open(page, BLOCK);
    await select(page, 42);
    const g = await geometry(page);
    const gap = gapCentre(g, 1, 2, 1);
    const { hold } = await holdTop(page, [gap]);
    try {
      await expectHeld(page);
      await flipButton(page).dispatchEvent('click');
      expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
      await expectNoTrayResidue(page);
      await caretHidden(page);
      await hold.moveTo({ x: gap.x + 4, y: gap.y });
      await animationFrames(page, 2);
      expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
      await expectNoTrayResidue(page);
    } finally {
      await hold.end();
    }
    const move = await storedMove(page);
    expect(move).toMatchObject({ arrangement: [42, 0], freeLetters: [], destinationSide: 'right' });
    await expectUnused(page);
    await expectSelected(page, null);
    await expectNoResidue(page);
    await expectNoTrayResidue(page);
  });

  test('AD-12 F5 hidePage mid-drag (tile 42 selected first) settles it at once: the pre-drag Session stored bar activeMs, nothing selected, cell 7 unused', async ({
    page,
  }) => {
    await open(page, BLOCK);
    await select(page, 42);
    const before = await game(page);
    const g = await geometry(page);
    const { hold } = await holdTop(page, [gapCentre(g, 1, 2, 1)]);
    try {
      await expectHeld(page);
      await hidePage(page);
      expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
      await expectNoTrayResidue(page);
      expect(await storedGame(page)).toBe(before);
    } finally {
      await hold.end();
    }
    await animationFrames(page, 2);
    expect(await game(page)).toBe(before);
    expect(await storedGame(page)).toBe(before);
    await expectSelected(page, null);
    await expectUnused(page);
    await expectNoResidue(page);
    await expectNoTrayResidue(page);
  });

  // F16: each in-page end above with the caret shown (the end gap of M, block left) hides it at once
  // (back leaves the page; the controller Vitest pins its caret-shown byBack end).
  for (const end of ['pointercancel', 'an enabled App button (Flip)', 'hidePage'] as const) {
    test(`AD-12 F5 F16 ${end} mid-drag with the caret shown at the end gap of M hides it at once: no caret transform, no parted class; cell 7 unused`, async ({
      page,
    }) => {
      await open(page, BLOCK);
      await trackPointerId(page);
      const g = await geometry(page);
      const endGap = gapRect(g, 1, 2, 2);
      const { hold } = await holdTop(page, [mid(endGap)]);
      try {
        await expectHeld(page);
        await expectCaretAt(page, endGap);
        if (end === 'pointercancel') await cancelCaptured(page);
        else if (end === 'hidePage') await hidePage(page);
        else await flipButton(page).dispatchEvent('click');
        await expectNoTrayResidue(page);
      } finally {
        await hold.end();
      }
      await expectUnused(page);
    });
  }

  test('AD-12 F5 F18 back mid-drag (tile 42 selected first, nothing selected once held) leaves the app; the stored Session equals the pre-drag one bar activeMs, read after a restoring goForward: cell 7 unused', async ({
    page,
  }) => {
    await open(page, BLOCK);
    await select(page, 42);
    const before = await game(page);
    const g = await geometry(page);
    const { hold } = await holdTop(page, [gapCentre(g, 1, 2, 1)]);
    try {
      await expectHeld(page);
      await expectSelected(page, null);
      await expectLeaves(page);
    } finally {
      await hold.end();
    }
    await page.goForward();
    await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    expect(await storedGame(page)).toBe(before);
    await expectUnused(page);
  });
});

// --- desktop --------------------------------------------------------------------------------------

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  test('AD-12 R-33 Q-31 in Composing a hover peek on cell 7, then a mouse drag of its top past 8 px: the peek hidden mid-drag and closed after the release, the insert stored', async ({
    page,
  }) => {
    await open(page, BLOCK);
    const g = await geometry(page);
    const peek = page.locator('[data-hover-peek]');
    const from = await centre(cellTopFace(page));
    await page.mouse.move(from.x, from.y);
    await expect(peek).toBeVisible();
    await page.mouse.down();
    await page.mouse.move(from.x + 12, from.y, { steps: 2 });
    await expect(peek).toHaveClass(/\bwc-hover-peek-hidden\b/);
    await expectHeld(page);
    const gap = gapCentre(g, 1, 2, 1);
    for (const p of path({ x: from.x + 12, y: from.y }, gap, 4)) {
      await page.mouse.move(p.x, p.y);
      await animationFrames(page, 2);
    }
    expect((await transformed(page)).sort()).toEqual(['0']);
    await page.mouse.up();
    await expect(peek).toHaveCount(0);
    const move = await expectEdit(page);
    expect(move.arrangement).toEqual([42, TOP, 0]);
    await expectUsed(page);
  });
});
