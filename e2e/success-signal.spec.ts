import { expect, type Page, test } from '@playwright/test';
import type { Rect } from '../src/ui/gestures/targeting';
import { gapRects, slotRects, trayLayout } from '../src/ui/layout/tray';
import { stored } from './helpers/blocking';
import { box, cards, centre, column, openFixture, type Point, tapAt } from './helpers/board';
import { expectNoResidue } from './helpers/drag';
import { animationFrames } from './helpers/lifecycle';
import { waitForDictionary } from './helpers/restore';
import { type TouchHold, touchHold } from './helpers/touch';

// Epic 5 entry 17 (SPEC Success signal; epic Done when 2 and Done when 3's same-Session sentence):
// one whole move from session-idle-empty-column (seed 1; column 1 empty, column 6 ends in the tail
// [1, 9, 28] A E N, cell 7's top card 48 W), played once by taps and once with the drop, the
// free-letter add and both reorders by drag: the tail dropped on empty column 1 (k 0), W added
// at the end of M → [1, 9, 28, 48], tile 28 before tile 9 → [1, 28, 9, 48] (ANEW), Validate
// (legal 3–4, target 4 pre-selected, meta +9), retarget 3 (meta +5), strip 28 to the bottom →
// [28, 1, 9, 48], Confirm (score 49 → 54). Expected values are literals from engine replay over
// the fixture, never edited to pass. Every dispatching step polls its stored value, then checks
// the stored wordcell:session equals current().session before the next input (R-73 (UI)).
// Helpers are local copies (S1 consolidation is entry 14's): `expectSaved`, `cellIds`,
// `columnIds`, `signed`, `score`, `metaDelta`, `confirm` and the tile tap helpers from
// e2e/place.spec.ts; `selection` from e2e/tap.spec.ts; `holdThrough` from e2e/drag.spec.ts;
// `geometry`, `gapCentre`, `moveFace`, `path`, `mid`, `plus` from e2e/tile-drag.spec.ts;
// e2e/free-letter.spec.ts's `geometry`/`gapCentre` (one extra slot while the layout has room) as
// `insertGeometry`/`insertGapCentre`. Adapted: both `geometry` variants read one `trayMetrics`;
// tile-drag's `holdTile` and free-letter's `holdTop` share `holdFace` and return the `TouchHold`.
// New here: `storedAt`, `expectStep`, `expectStoredCursor`, `expectFinalSession`, `expectLanded`.

const onAndroid = () =>
  test.skip(test.info().project.name !== 'android', 'touch flows run on android');

const SESSION = 'wordcell:session';
const FIXTURE = 'session-idle-empty-column';
const W = 48;
const tray = (page: Page) => page.locator('[data-band="tray"]');
const tile = (page: Page, id: number) => tray(page).getByTestId(`card-${id}`);
const faceOf = (page: Page, id: number) => tile(page, id).locator(':scope > .face');
const selectedTiles = (page: Page) => tray(page).locator('[data-card-id].selected');
const cell = (page: Page, n: number) => page.getByTestId(`wordcell-${n}`);
const cellTop = (page: Page) => cell(page, 7).getByTestId(`card-${W}`);
const cellTopFace = (page: Page) => cellTop(page).locator(':scope > .face');
const placeholder = (page: Page) => column(page, 1).locator('[data-placeholder]');
const primary = (page: Page) => page.getByTestId('primary-action');
// Card 1: column 6's third card from the bottom, the head of the tail [1, 9, 28].
const tailHead = async (page: Page) => cards(page, 6).nth((await cards(page, 6).count()) - 3);

type StoredMove = {
  sourceColumn: number;
  sourceCount: number;
  destinationColumn: number;
  destinationCount: number;
  destinationSide: string;
  freeLetters: number[];
  arrangement: number[];
  reached: string;
  targetCell?: number;
  placementOrder?: number[];
};
type Cursor = { index: number; phase: string };
type Stored = { moves: StoredMove[]; cursor: Cursor };

// The fixture's move verbatim, then the Success-signal move (ANEW into cell 3).
const EXPECTED = {
  moves: [
    {
      sourceColumn: 1,
      sourceCount: 7,
      destinationColumn: 1,
      destinationCount: 0,
      destinationSide: 'left',
      freeLetters: [],
      arrangement: [24, 6, 49, 30, 25, 20, 48],
      reached: 'committed',
      targetCell: 7,
      placementOrder: [24, 6, 49, 30, 25, 20, 48],
    },
    {
      sourceColumn: 6,
      sourceCount: 3,
      destinationColumn: 1,
      destinationCount: 0,
      destinationSide: 'left',
      freeLetters: [7],
      arrangement: [1, 28, 9, 48],
      reached: 'committed',
      targetCell: 3,
      placementOrder: [28, 1, 9, 48],
    },
  ],
  cursor: { index: 2, phase: 'idle' },
};

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

// The stored cursor and the stored move at it.
async function storedAt(page: Page): Promise<{ cursor: Cursor; move: StoredMove | undefined }> {
  const text = await stored(page, SESSION);
  if (text === null) throw new Error('wordcell:session is absent');
  const s = JSON.parse(text) as Stored;
  return { cursor: s.cursor, move: s.moves[s.cursor.index] };
}

// A dispatching step: polls the stored move at the cursor until it matches `move` (and the stored
// cursor `cursor`, when given), then checks it is saved (R-73).
async function expectStep(page: Page, move: Partial<StoredMove>, cursor?: Cursor): Promise<void> {
  await expect
    .poll(async () => {
      const at = await storedAt(page);
      const got = at.move ?? {};
      const picked = Object.fromEntries(
        Object.keys(move).map((k) => [k, (got as Record<string, unknown>)[k]]),
      );
      return cursor === undefined ? picked : { ...picked, cursor: at.cursor };
    })
    .toEqual(cursor === undefined ? move : { ...move, cursor });
  await expectSaved(page);
}

// Polls the stored cursor to `cursor`, then checks it is saved (R-73).
async function expectStoredCursor(page: Page, cursor: Cursor): Promise<void> {
  await expect.poll(async () => (await storedAt(page)).cursor).toEqual(cursor);
  await expectSaved(page);
}

// The rendered column selection: the outline's column and its lifted cards.
function selection(page: Page): Promise<{ column: number; count: number } | null> {
  return page.evaluate(() => {
    const outlines = document.querySelectorAll('[data-selection-outline]');
    if (outlines.length > 1) throw new Error('more than one selection outline');
    const outline = outlines[0];
    if (outline === undefined) return null;
    const col = outline.closest('[data-column]');
    if (col === null) throw new Error('outline outside a column');
    return {
      column: Number(col.getAttribute('data-column')),
      count: col.querySelectorAll('[data-place="column"].lifted').length,
    };
  });
}

async function tapTile(page: Page, id: number): Promise<void> {
  await tapAt(page, await centre(tile(page, id)));
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
  await tapTile(page, id);
  await expectSelected(page, id);
}

async function tapPrimary(page: Page, label: string): Promise<void> {
  await expect(primary(page)).toHaveText(label);
  await tapAt(page, await centre(primary(page)));
}

const confirm = (page: Page) => tapPrimary(page, 'Confirm');

// The live card ids in a WordCell, bottom → top (DOM order).
function cellIds(page: Page, n: number): Promise<number[]> {
  return cell(page, n)
    .locator('[data-card-id]')
    .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-card-id'))));
}

function columnIds(page: Page, n: number): Promise<number[]> {
  return cards(page, n).evaluateAll((els) =>
    els.map((el) => Number(el.getAttribute('data-card-id'))),
  );
}

// A signed integer as text.ts writes it (`+n`, `±0`, U+2212 `−n`).
function signed(text: string): number {
  if (text === '±0') return 0;
  const m = /^([+−])(\d+)$/.exec(text);
  if (m === null) throw new Error(`not a signed number: ${text}`);
  return (m[1] === '+' ? 1 : -1) * Number(m[2]);
}

// R-80: the top bar's score and the Place meta's delta, from the DOM.
async function score(page: Page): Promise<number> {
  const text = (await page.locator('.score').textContent()) ?? '';
  const m = /^Score (−?)(\d+)$/.exec(text.trim());
  if (m === null) throw new Error(`score text ${text}`);
  return (m[1] === '' ? 1 : -1) * Number(m[2]);
}

async function metaDelta(page: Page): Promise<number> {
  const text = (await tray(page).locator('.controls .meta').textContent()) ?? '';
  const m = / · (\S+)$/.exec(text.trim());
  if (m === null) throw new Error(`meta text ${text}`);
  return signed(m[1] as string);
}

// The Session without `activeMs`, from the store and from storage.
async function expectFinalSession(page: Page): Promise<void> {
  const want = { version: 1, seed: 1, ...EXPECTED, gaveUp: false, activeMs: 0 };
  const session = await page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return current.session;
  });
  expect({ ...session, activeMs: 0 }).toEqual(want);
  const text = await stored(page, SESSION);
  if (text === null) throw new Error('wordcell:session is absent');
  expect({ ...JSON.parse(text), activeMs: 0 }).toEqual(want);
}

// After Confirm: cell 3 holds the strip bottom → top (word ANEW; N A E W bottom → top), W on top;
// column 6 lost the tail.
async function expectLanded(page: Page): Promise<void> {
  await expect.poll(() => cellIds(page, 3)).toEqual([28, 1, 9, W]);
  await expect(cell(page, 3).getByTestId(`card-${W}`)).toBeVisible();
  await expect.poll(() => columnIds(page, 6)).toEqual([31, 34, 27]);
  await expectFinalSession(page);
}

// --- drag geometry ---------------------------------------------------------------------------------

type Geometry = { tileCount: number; perRow: number; slots: Rect[] };

// The rendered tray's tray-layout input: `w` from `--wc-w`, the inner width from the tray's
// content box, `origin` from tray position 0's wrapper (+ 2 px x), the tile count without the caret.
async function trayMetrics(page: Page) {
  return page.evaluate(() => {
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
}

// e2e/tile-drag.spec.ts: one slot per tile (reorders).
async function geometry(page: Page): Promise<Geometry> {
  const m = await trayMetrics(page);
  const sizing = trayLayout(m.count, m.w, m.inner);
  return {
    tileCount: m.count,
    perRow: sizing.perRow,
    slots: slotRects(sizing, { x: m.x, y: m.y }, m.count),
  };
}

// e2e/free-letter.spec.ts: one more slot than the tile count while the layout has room.
async function insertGeometry(page: Page): Promise<Geometry & { room: boolean }> {
  const m = await trayMetrics(page);
  const sizing = trayLayout(m.count, m.w, m.inner);
  const room = m.count + 1 <= sizing.perRow * sizing.rows;
  return {
    tileCount: m.count,
    perRow: sizing.perRow,
    room,
    slots: slotRects(sizing, { x: m.x, y: m.y }, room ? m.count + 1 : m.count),
  };
}

const mid = (r: Rect): Point => ({ x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 });

// The centre of gap `index`'s (first) rect over the run [first, first + count).
function gapCentre(g: Geometry, first: number, count: number, index: number): Point {
  const found = gapRects(g.slots, g.perRow, g.tileCount, first, count).find(
    (e) => e.index === index,
  );
  if (found === undefined) throw new Error(`no gap ${index}`);
  return mid(found.rect);
}

const insertGapCentre = gapCentre;

const plus = (p: Point, dx: number, dy: number): Point => ({ x: p.x + dx, y: p.y + dy });

// `steps` points from `from` (excluded) to `to` (included).
function path(from: Point, to: Point, steps: number): Point[] {
  return Array.from({ length: steps }, (_, i) => ({
    x: from.x + ((to.x - from.x) * (i + 1)) / steps,
    y: from.y + ((to.y - from.y) * (i + 1)) / steps,
  }));
}

// One held touch moved to each point in turn, a frame after each move.
async function holdThrough(page: Page, from: Point, points: Point[]): Promise<TouchHold> {
  const hold = await touchHold(page, from);
  try {
    for (const p of points) {
      await hold.moveTo(p);
      await animationFrames(page, 2);
    }
  } catch (error) {
    await hold.end();
    throw error;
  }
  return hold;
}

// Moves a held face (pressed at its centre) so its centre lies on `to`, in `steps` moves.
async function moveFace(page: Page, hold: TouchHold, from: Point, to: Point, steps = 4) {
  for (const p of path(from, to, steps)) {
    await hold.moveTo(p);
    await animationFrames(page, 2);
  }
}

// A touch held at `start` (a face centre), then moved so the face centre lies on each target.
async function holdFace(page: Page, start: Point, targets: Point[]): Promise<TouchHold> {
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
  return hold;
}

// Live tray tile `id` held at its face centre and moved onto each target.
async function holdTile(page: Page, id: number, targets: Point[]): Promise<TouchHold> {
  return holdFace(page, await centre(faceOf(page, id)), targets);
}

// Cell 7's top face (W) held at its centre and moved onto each target.
async function holdTop(page: Page, targets: Point[]): Promise<TouchHold> {
  return holdFace(page, await centre(cellTopFace(page)), targets);
}

// --- the move --------------------------------------------------------------------------------------

async function open(page: Page): Promise<void> {
  await openFixture(page, FIXTURE);
  await waitForDictionary(page, 'ready');
  // Premises: column 1 empty, column 6 ending in the tail [1, 9, 28], W on cell 7.
  expect(await columnIds(page, 1)).toEqual([]);
  expect(await columnIds(page, 6)).toEqual([31, 34, 27, 1, 9, 28]);
  await expect(cellTop(page)).toBeVisible();
  await expect(selectedTiles(page)).toHaveCount(0);
  await expectSaved(page);
}

const DROPPED: Partial<StoredMove> = {
  sourceColumn: 6,
  sourceCount: 3,
  destinationColumn: 1,
  destinationCount: 0,
  destinationSide: 'left',
  arrangement: [1, 9, 28],
  reached: 'composing',
};

// Validate (tap), then the retarget to cell 3 (tap); the meta deltas are DOM reads.
async function validateAndRetarget(page: Page): Promise<void> {
  await tapPrimary(page, 'Validate');
  await expectStep(
    page,
    { reached: 'place', targetCell: 4, placementOrder: [1, 28, 9, W] },
    { index: 1, phase: 'place' },
  );
  await expect.poll(() => metaDelta(page)).toBe(9);
  await tapAt(page, await centre(cell(page, 3)));
  await expectStep(page, { targetCell: 3 });
  await expect.poll(() => metaDelta(page)).toBe(5);
}

test.describe('android', () => {
  test.beforeEach(onAndroid);

  test('R-73 (UI) R-80 Success signal (epic Done when 2): tap-only move from session-idle-empty-column, ANEW into cell 3 after a retarget and a strip swap, every step saved, the score change equals the meta delta', async ({
    page,
  }) => {
    await open(page);
    // 1: tap-select the tail (no dispatch).
    await tapAt(page, await centre(await tailHead(page)));
    await expect.poll(() => selection(page)).toEqual({ column: 6, count: 3 });
    await expectSaved(page);
    // 2: tap-drop on empty column 1 (k 0).
    await tapAt(page, await centre(placeholder(page)));
    await expectStep(page, DROPPED, { index: 1, phase: 'composing' });
    // 3: tap-add W from cell 7.
    await tapAt(page, await centre(cellTop(page)));
    await expectStep(page, { arrangement: [1, 9, 28, W], freeLetters: [7] });
    // 4: tap-swap tiles 9 and 28.
    await select(page, 9);
    await expectSaved(page);
    await tapTile(page, 28);
    await expectStep(page, { arrangement: [1, 28, 9, W] });
    await expectSelected(page, null);
    // 5, 6: Validate (target 4, +9), retarget 3 (+5).
    await validateAndRetarget(page);
    // 7: tap-swap strip tiles 1 and 28.
    await select(page, 1);
    await expectSaved(page);
    await tapTile(page, 28);
    await expectStep(page, { targetCell: 3, placementOrder: [28, 1, 9, W] });
    await expectSelected(page, null);
    // 8: R-80, the meta delta after the last Place edit equals the score change across Confirm.
    const delta = await metaDelta(page);
    expect(delta).toBe(5);
    const before = await score(page);
    expect(before).toBe(49);
    await confirm(page);
    await expectStoredCursor(page, EXPECTED.cursor);
    await expect.poll(() => score(page)).toBe(before + delta);
    expect(before + delta).toBe(54);
    // 9: the word landed.
    await expectLanded(page);
  });

  test('R-73 (UI) Success signal (epic Done when 3): the same move by drag from session-idle-empty-column, the drop, the W insert and both reorders dragged, the same Session as by taps', async ({
    page,
  }) => {
    await open(page);
    // 2: card 1's face centred on column 1's placeholder (k 0).
    const head = await tailHead(page);
    const from = await centre(head);
    const face = await box(head.locator(':scope > .face'));
    const slot = await box(placeholder(page));
    const dx = slot.x + slot.w / 2 - (face.x + face.w / 2);
    const dy = slot.y + slot.h / 2 - (face.y + face.h / 2);
    const drop = await holdThrough(page, from, path(from, plus(from, dx, dy), 5));
    await drop.end();
    await expectStep(page, DROPPED, { index: 1, phase: 'composing' });
    await expectNoResidue(page);
    // 3: W from cell 7 into the end gap of M (k 0).
    const ig = await insertGeometry(page);
    expect(ig.tileCount).toBe(3);
    expect(ig.room).toBe(true);
    const add = await holdTop(page, [insertGapCentre(ig, 0, 3, 3)]);
    await add.end();
    await expectStep(page, { arrangement: [1, 9, 28, W], freeLetters: [7] });
    await expectNoResidue(page);
    // 4: tray tile 28 into the gap before tile 9.
    const g = await geometry(page);
    expect(g.tileCount).toBe(4);
    const arrange = await holdTile(page, 28, [gapCentre(g, 0, 4, 1)]);
    await arrange.end();
    await expectStep(page, { arrangement: [1, 28, 9, W] });
    await expectNoResidue(page);
    // 5, 6: Validate (target 4, +9), retarget 3 (+5), by taps.
    await validateAndRetarget(page);
    // 7: strip tile 28 into gap 0.
    const strip = await geometry(page);
    expect(strip.tileCount).toBe(4);
    const order = await holdTile(page, 28, [gapCentre(strip, 0, 4, 0)]);
    await order.end();
    await expectStep(page, { targetCell: 3, placementOrder: [28, 1, 9, W] });
    await expectNoResidue(page);
    // 8: Confirm (tap).
    await confirm(page);
    await expectStoredCursor(page, EXPECTED.cursor);
    // 9: the word landed; the same Session as the tap-only test.
    await expectLanded(page);
  });
});
