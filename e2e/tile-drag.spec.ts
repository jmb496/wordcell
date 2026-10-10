import { expect, type Locator, type Page, test } from '@playwright/test';
import type { Rect } from '../src/ui/gestures/targeting';
import { gapRects, partingOffsets, slotRects, trayLayout } from '../src/ui/layout/tray';
import { stored } from './helpers/blocking';
import {
  box,
  centre,
  glidesSettled,
  openFixture,
  type Point,
  type Step,
  tapAt,
  trayIds,
} from './helpers/board';
import { expectLeaves } from './helpers/dialogs';
import { dragResidue, expectNoResidue } from './helpers/drag';
import { animationFrames, hidePage } from './helpers/lifecycle';
import { type TouchHold, touchHold } from './helpers/touch';

// Epic 5 entry 7 (SPEC CAP-5): the tile drag in the tray and the strip on android. Faces are held
// on the named gap's rect from layout/tray.ts (`slotRects` over `trayLayout(tileCount, w,
// trayInnerWidth)` with `origin` = tray position 0's wrapper top-left + 2 px x, `w` and the inner
// width read from the rendered tray, never `window.innerWidth`; the tile count excludes entry 8's
// caret). Every edit release asserts the stored wordcell:session equals the store's Session (R-73
// (UI)) and then one zero `dragResidue` read; a no-edit live-tile drag first asserts the held face
// (`wc-drag-layer`, inline transform).
// Expected values are literals from view() over the fixtures (seed 1; seed 191 for
// session-place-compact), never edited to pass. Helpers are local copies (S1 consolidation is
// entry 14's): `game`/`storedGame` from e2e/drag-interruptions.spec.ts, `expectSaved`,
// `expectSelected` and `open` from e2e/tile-tap.spec.ts, `expectUsedCell3` from
// e2e/board-phases.spec.ts.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'tile drags run on android');
});

const SESSION = 'wordcell:session';
const tray = (page: Page) => page.locator('[data-band="tray"]');
const tile = (page: Page, id: number) => tray(page).getByTestId(`card-${id}`);
const faceOf = (page: Page, id: number) => tile(page, id).locator(':scope > .face');
const selectedTiles = (page: Page) => tray(page).locator('[data-card-id].selected');
const controls = (page: Page) => tray(page).locator('.controls');
const plusButton = (page: Page) => controls(page).getByRole('button', { name: '+', exact: true });
const flipButton = (page: Page) =>
  controls(page).getByRole('button', { name: 'Flip', exact: true });

type StoredMove = { arrangement: number[]; placementOrder?: number[]; destinationCount: number };
type Stored = { moves: StoredMove[]; cursor: { index: number; phase: string } };

async function open(
  page: Page,
  name: string,
  steps: readonly Step[] = [],
  prefs?: string,
): Promise<void> {
  await openFixture(page, name, { steps, ...(prefs === undefined ? {} : { prefs }) });
  await expect(selectedTiles(page)).toHaveCount(0);
}

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

// An edit release: saved before the next action (R-73 (UI)), then one residue read, no polling.
async function expectEdit(page: Page): Promise<StoredMove> {
  const move = await storedMove(page);
  expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
  return move;
}

// The store's Session without `activeMs` (a hide flush accrues time into a new reference).
function game(page: Page): Promise<string> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return JSON.stringify({ ...current.session, activeMs: 0 });
  });
}

// The stored wordcell:session without `activeMs`.
function storedGame(page: Page): Promise<string> {
  return page.evaluate(() => {
    const text = localStorage.getItem('wordcell:session');
    if (text === null) throw new Error('wordcell:session is absent');
    return JSON.stringify({ ...JSON.parse(text), activeMs: 0 });
  });
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

async function expectUsedCell3(page: Page): Promise<void> {
  const used = page.getByTestId('wordcell-3').locator('[data-mirror-of="28"]');
  await expect(used).toHaveCount(1);
  await expect(used.locator('.face')).toHaveCSS('opacity', '0.4');
  expect(
    await used.locator('.face').evaluate((el) => getComputedStyle(el).backgroundImage),
  ).toContain('repeating-linear-gradient');
}

// --- geometry ------------------------------------------------------------------------------------

type Geometry = {
  tileCount: number;
  perRow: number;
  slots: Rect[];
  origin: Point;
  w: number;
  inner: number;
};

// Entry 6's geometry for the rendered tray: `w` from `--wc-w`, the inner width from the tray's
// content box, `origin` from tray position 0's wrapper (+ 2 px x), tileCount from `.tiles`.
async function geometry(page: Page): Promise<Geometry> {
  const m = await page.evaluate(() => {
    const band = document.querySelector<HTMLElement>('[data-band="tray"]');
    const tiles = band?.querySelector('.tiles');
    const head = tiles?.children[0];
    if (band === null || band === undefined || tiles === null || tiles === undefined) {
      throw new Error('no tray tiles');
    }
    if (head === undefined) throw new Error('no tray position 0');
    const style = getComputedStyle(band);
    const r = head.getBoundingClientRect();
    return {
      w: parseFloat(style.getPropertyValue('--wc-w')),
      inner: band.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
      x: r.left + 2,
      y: r.top,
      // Entry 8: `.tiles` ends with the caret, not a tray position.
      count: tiles.querySelectorAll(':scope > :not(.wc-caret)').length,
    };
  });
  const sizing = trayLayout(m.count, m.w, m.inner);
  const origin = { x: m.x, y: m.y };
  return {
    tileCount: m.count,
    perRow: sizing.perRow,
    slots: slotRects(sizing, origin, m.count),
    origin,
    w: m.w,
    inner: m.inner,
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

// A touch held on live tile `id`'s face centre, then moved so the face centre lies on each target.
async function holdTile(
  page: Page,
  id: number,
  targets: Point[],
): Promise<{ hold: TouchHold; at: Point }> {
  const start = await centre(faceOf(page, id));
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

// Running animations on any tray mirror's face.
const mirrorAnimations = (page: Page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll('[data-band="tray"] [data-mirror-of] .face')].flatMap((f) =>
        f.getAnimations(),
      ).length,
  );

// The held face: on the drag layer with an inline transform.
async function expectHeld(page: Page, id: number): Promise<void> {
  const face = faceOf(page, id);
  await expect(face).toHaveClass(/\bwc-drag-layer\b/);
  expect(await face.evaluate((el) => (el as HTMLElement).style.transform)).not.toBe('');
}

const settled = (locator: Locator) =>
  expect.poll(() => locator.evaluate((el) => el.getAnimations().length)).toBe(0);

const css = (locator: Locator, property: string) =>
  locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);

// --- reorders --------------------------------------------------------------------------------------

test('R-34 R-73 (UI) AD-12 tile 0 to gap 0 on session-composing stores [0, 42]; held over a column first, nothing lights there', async ({
  page,
}) => {
  await open(page, 'session-composing');
  expect(await trayIds(page)).toEqual(['42', '0', '28m']);
  const g = await geometry(page);
  const column = await centre(page.getByTestId('column-3'));
  const { hold } = await holdTile(page, 0, [column]);
  try {
    await expectHeld(page, 0);
    expect(await page.locator('.wc-drag-target').count()).toBe(0);
    await moveFace(page, hold, column, gapCentre(g, 0, 2, 0));
    expect(await page.locator('.wc-drag-target').count()).toBe(0);
  } finally {
    await hold.end();
  }
  expect((await expectEdit(page)).arrangement).toEqual([0, 42]);
  expect(await trayIds(page)).toEqual(['0', '42', '28m']);
});

test('R-51 R-73 (UI) tile 28 to gap 0 on session-place stores [28, 42, 0]; the strip marks follow', async ({
  page,
}) => {
  await open(page, 'session-place');
  const g = await geometry(page);
  const { hold } = await holdTile(page, 28, [gapCentre(g, 0, 3, 0)]);
  await hold.end();
  expect((await expectEdit(page)).placementOrder).toEqual([28, 42, 0]);
  await expect(tile(page, 28).locator('.position')).toHaveText('bottom');
  await expect(tile(page, 0).locator('.position')).toHaveText('top');
  await expect(tile(page, 42).locator('.position')).toHaveCount(0);
});

test('AD-12 on session-place tile 42 parts the others toward gap 3, then under 25 % none is transformed; the release flies back, Session byte-identical', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 'session-place');
  const before = await stored(page, SESSION);
  const g = await geometry(page);
  const gap3 = gapCentre(g, 0, 3, 3);
  const { hold, at } = await holdTile(page, 42, [gap3]);
  try {
    await expectHeld(page, 42);
    expect((await transformed(page)).sort()).toEqual(['0', '28', '42']);
    // Above the tray band: no overlap.
    const tb = await box(tray(page));
    const out = { x: at.x, y: tb.y - 80 };
    await moveFace(page, hold, at, out);
    await expectHeld(page, 42);
    expect(await transformed(page)).toEqual(['42']);
  } finally {
    await hold.end();
  }
  await expectNoResidue(page);
  expect(await stored(page, SESSION)).toBe(before);
});

test('R-33 on session-place-free-letter-redo-tail + one Undo, free-letter tile 28 released over WordCell 3: Session byte-identical, cell 3 still used', async ({
  page,
}) => {
  await open(page, 'session-place-free-letter-redo-tail', ['undo']);
  expect(await trayIds(page)).toEqual(['32', '28', '9m']);
  await expectSaved(page);
  const before = await stored(page, SESSION);
  const cell = await centre(page.getByTestId('wordcell-3'));
  const { hold } = await holdTile(page, 28, [cell]);
  try {
    await expectHeld(page, 28);
  } finally {
    await hold.end();
  }
  await expectNoResidue(page);
  expect(await stored(page, SESSION)).toBe(before);
  expect(await trayIds(page)).toEqual(['32', '28', '9m']);
  await expectUsedCell3(page);
});

test('R-34 R-73 (UI) on session-place-free-letter-redo-tail + one Undo, tile 28 to gap 0 stores [28, 32]', async ({
  page,
}) => {
  await open(page, 'session-place-free-letter-redo-tail', ['undo']);
  const g = await geometry(page);
  const { hold } = await holdTile(page, 28, [gapCentre(g, 0, 2, 0)]);
  await hold.end();
  expect((await expectEdit(page)).arrangement).toEqual([28, 32]);
  await expectUsedCell3(page);
});

test('AD-12 the drag layer: a face held over the action bar has wc-drag-layer, z-index 5 and the shadow; .tiles stops clipping', async ({
  page,
}) => {
  await open(page, 'session-composing');
  const bar = await box(page.locator('[data-band="actionBar"]'));
  const over = { x: (await centre(faceOf(page, 0))).x, y: bar.y + bar.h / 2 };
  const { hold } = await holdTile(page, 0, [over]);
  try {
    await expectHeld(page, 0);
    const face = faceOf(page, 0);
    expect(await css(face, 'z-index')).toBe('5');
    expect(await css(face, 'box-shadow')).not.toBe('none');
    expect(await css(tray(page).locator('.tiles'), 'overflow')).toBe('visible');
    const b = await box(face);
    expect(b.y + b.h / 2).toBeCloseTo(over.y, 0);
  } finally {
    await hold.end();
  }
  await expectNoResidue(page);
  expect(await css(tray(page).locator('.tiles'), 'overflow')).toBe('hidden');
});

test('R-71 on session-won + one Undo, strip tile 38 released over its own gap 2 leaves Redo enabled, Session byte-identical', async ({
  page,
}) => {
  await open(page, 'session-won', ['undo']);
  await expect(page.getByTestId('redo')).toBeEnabled();
  expect(await trayIds(page)).toEqual(['41', '3', '38', '37', '5', '46']);
  await expectSaved(page);
  const before = await stored(page, SESSION);
  const g = await geometry(page);
  const { hold } = await holdTile(page, 38, [gapCentre(g, 0, 6, 2)]);
  try {
    await expectHeld(page, 38);
    expect(await transformed(page)).toEqual(['38']);
  } finally {
    await hold.end();
  }
  await expectNoResidue(page);
  await expect(page.getByTestId('redo')).toBeEnabled();
  expect(await stored(page, SESSION)).toBe(before);
  expect(await trayIds(page)).toEqual(['41', '3', '38', '37', '5', '46']);
});

// --- the destination block ------------------------------------------------------------------------

test('R-32 (UI) a block-mirror drag on session-composing (tile 42 selected) moves nothing, dispatches nothing and keeps the selection', async ({
  page,
}) => {
  await open(page, 'session-composing');
  await select(page, 42);
  const before = await stored(page, SESSION);
  const mirror = tray(page).locator('[data-mirror-of="28"]');
  const from = await centre(mirror);
  const hold = await holdThrough(page, from, path(from, plus(from, -60, 0), 4));
  try {
    expect(await transformed(page)).toEqual([]);
    expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
    await expectSelected(page, 42);
  } finally {
    await hold.end();
  }
  await animationFrames(page, 2);
  await expectSelected(page, 42);
  expect(await stored(page, SESSION)).toBe(before);
  await expectNoResidue(page);
});

test('R-32 (UI) after + (k = 2) on session-composing, tile 42 held over mid-block parts tile 0 one slot left, no mirror moving; its release stores [0, 42]', async ({
  page,
}) => {
  await open(page, 'session-composing');
  await plusButton(page).click();
  await glidesSettled(page);
  expect((await storedMove(page)).destinationCount).toBe(2);
  expect(await trayIds(page)).toHaveLength(4);
  const g = await geometry(page);
  const [s2, s3] = [g.slots[2], g.slots[3]];
  if (s2 === undefined || s3 === undefined) throw new Error('no block slots');
  const midBlock = { x: (s2.right + s3.left) / 2, y: (s2.top + s2.bottom) / 2 };
  const { hold } = await holdTile(page, 42, [midBlock]);
  try {
    await expectHeld(page, 42);
    await settled(faceOf(page, 0));
    const zero = await box(faceOf(page, 0));
    expect(Math.abs(zero.x - (g.slots[0]?.left ?? Number.NaN))).toBeLessThanOrEqual(0.5);
    expect((await transformed(page)).sort()).toEqual(['0', '42']);
    expect(await mirrorAnimations(page)).toBe(0);
  } finally {
    await hold.end();
  }
  expect((await expectEdit(page)).arrangement).toEqual([0, 42]);
});

test('R-32 on a fresh session-composing (k = 1), tile 42 released in-band right of the block (one row, F25) stores [0, 42]', async ({
  page,
}) => {
  await open(page, 'session-composing');
  const g = await geometry(page);
  const block = g.slots[2];
  if (block === undefined) throw new Error('no block slot');
  const right = { x: block.right + (block.right - block.left) / 2 + 4, y: mid(block).y };
  const { hold } = await holdTile(page, 42, [right]);
  try {
    await expectHeld(page, 42);
    expect(await transformed(page)).not.toContain('28m');
  } finally {
    await hold.end();
  }
  expect((await expectEdit(page)).arrangement).toEqual([0, 42]);
});

test('R-34 R-32 after Flip (block left: D, 42, 0) tile 0 to gap 0 on session-composing parts tile 42 to tray position 2 and stores [0, 42], the mirror never transformed', async ({
  page,
}) => {
  await open(page, 'session-composing');
  await flipButton(page).click();
  await glidesSettled(page);
  await expectSaved(page);
  expect(await trayIds(page)).toEqual(['28m', '42', '0']);
  const g = await geometry(page);
  const { hold } = await holdTile(page, 0, [gapCentre(g, 1, 2, 0)]);
  try {
    await expectHeld(page, 0);
    expect((await transformed(page)).sort()).toEqual(['0', '42']);
    await settled(faceOf(page, 42));
    const parted = await box(faceOf(page, 42));
    const slot = g.slots[2] as Rect;
    expect(Math.abs(parted.x - slot.left)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(parted.y - slot.top)).toBeLessThanOrEqual(0.5);
    expect(await mirrorAnimations(page)).toBe(0);
  } finally {
    await hold.end();
  }
  expect((await expectEdit(page)).arrangement).toEqual([0, 42]);
  expect(await trayIds(page)).toEqual(['28m', '0', '42']);
});

// --- interruptions (F5, F18) -----------------------------------------------------------------------

test('AD-12 F5 F18 hidePage mid-drag (tile 42 selected first) settles it at once: the pre-drag Session stored bar activeMs, nothing selected, no residue', async ({
  page,
}) => {
  await open(page, 'session-composing');
  await select(page, 42);
  const before = await game(page);
  const g = await geometry(page);
  const { hold } = await holdTile(page, 0, [gapCentre(g, 0, 2, 0)]);
  try {
    await expectHeld(page, 0);
    await expectSelected(page, null);
    await hidePage(page);
    expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
    expect(await storedGame(page)).toBe(before);
  } finally {
    await hold.end();
  }
  await animationFrames(page, 2);
  expect(await game(page)).toBe(before);
  expect(await storedGame(page)).toBe(before);
  await expectSelected(page, null);
  await expectNoResidue(page);
});

test('AD-12 F5 back mid-drag leaves the app; the stored Session equals the pre-drag one bar activeMs, read after a restoring goForward', async ({
  page,
}) => {
  await open(page, 'session-composing');
  const before = await game(page);
  const g = await geometry(page);
  const { hold } = await holdTile(page, 0, [gapCentre(g, 0, 2, 0)]);
  try {
    await expectHeld(page, 0);
    await expectLeaves(page);
  } finally {
    await hold.end();
  }
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  expect(await storedGame(page)).toBe(before);
});

test('AD-12 F18 an App button (+) pressed mid-drag (tile 42 selected first) settles the drag at once and dispatches only its own command', async ({
  page,
}) => {
  await open(page, 'session-composing');
  await select(page, 42);
  const g = await geometry(page);
  const gap0 = gapCentre(g, 0, 2, 0);
  const { hold } = await holdTile(page, 0, [gap0]);
  try {
    await expectHeld(page, 0);
    await plusButton(page).dispatchEvent('click');
    expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
    await hold.moveTo(plus(gap0, 4, 0));
    await animationFrames(page, 2);
    expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
  } finally {
    await hold.end();
  }
  const move = await storedMove(page);
  expect(move.destinationCount).toBe(2);
  expect(move.arrangement).toEqual([42, 0]);
  await expectSelected(page, null);
  await expectNoResidue(page);
});

// Records each pointerdown's id, then dispatches pointercancel on the element holding that
// pointer's capture (e2e/drag-interruptions.spec.ts).
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

test('AD-12 F5 F18 pointercancel mid-drag (tile 42 selected first) flies back: Session byte-identical, nothing selected, no residue', async ({
  page,
}) => {
  await open(page, 'session-composing');
  await trackPointerId(page);
  await select(page, 42);
  const before = await stored(page, SESSION);
  const g = await geometry(page);
  const { hold } = await holdTile(page, 0, [gapCentre(g, 0, 2, 0)]);
  try {
    await expectHeld(page, 0);
    await cancelCaptured(page);
    await expectSelected(page, null);
  } finally {
    await hold.end();
  }
  await expectNoResidue(page);
  await settled(faceOf(page, 0));
  expect(await stored(page, SESSION)).toBe(before);
  await expectSelected(page, null);
  expect(await trayIds(page)).toEqual(['42', '0', '28m']);
});

// --- geometry (entry 6's deferred check) ------------------------------------------------------------

// Every tray face (mirrors included) on its resting slot within 0.5 px.
async function expectAtRest(page: Page, g: Geometry): Promise<void> {
  const faces = await page.evaluate(() =>
    [...document.querySelectorAll('[data-band="tray"] .tiles > :not(.wc-caret)')].map((w) => {
      const f = w.querySelector(':scope > .face');
      if (f === null) throw new Error('tile without a face');
      const r = f.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }),
  );
  expect(faces).toHaveLength(g.tileCount);
  for (const [p, r] of faces.entries()) {
    const slot = g.slots[p] as Rect;
    for (const k of ['left', 'top', 'right', 'bottom'] as const) {
      expect(Math.abs(r[k] - slot[k]), `position ${p} ${k}`).toBeLessThanOrEqual(0.5);
    }
  }
}

const AT_REST =
  'AD-12 at rest every tray face equals slotRects(trayLayout(tileCount, w, trayInnerWidth), origin, tileCount)[p]';

test(`${AT_REST} on session-composing`, async ({ page }) => {
  await open(page, 'session-composing');
  const g = await geometry(page);
  expect(g.tileCount).toBe(3);
  expect(g.inner).toBe(g.w * 8 + 32 - 16);
  await expectAtRest(page, g);
});

test(`${AT_REST} on session-place-compact`, async ({ page }) => {
  await open(page, 'session-place-compact');
  const g = await geometry(page);
  expect(g.tileCount).toBe(8);
  expect(g.perRow).toBe(7);
  await expectAtRest(page, g);
});

test('AD-12 F2 F18 selected tile 0 on session-composing drags from its lifted face with no jump, clears the selection, and released outside the band lands unlifted with the Session byte-identical', async ({
  page,
}) => {
  await open(page, 'session-composing');
  const g = await geometry(page);
  await select(page, 0);
  const before = await stored(page, SESSION);
  const lifted = await box(faceOf(page, 0));
  const slot = g.slots[1] as Rect;
  // Premise: Card's selected lift raises the face 4 px off its slot.
  expect(Math.abs(lifted.y - (slot.top - 4))).toBeLessThanOrEqual(0.5);
  const start = await centre(faceOf(page, 0));
  const { hold, at } = await holdTile(page, 0, [plus(start, 12, 0)]);
  try {
    await expectHeld(page, 0);
    await expectSelected(page, null);
    const held = await box(faceOf(page, 0));
    expect(Math.abs(held.y - lifted.y)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(held.x - (lifted.x + 12))).toBeLessThanOrEqual(0.5);
    const tb = await box(tray(page));
    await moveFace(page, hold, at, { x: at.x, y: tb.y - 80 });
    await expectHeld(page, 0);
  } finally {
    await hold.end();
  }
  await expectNoResidue(page);
  await settled(faceOf(page, 0));
  expect(await stored(page, SESSION)).toBe(before);
  await expectSelected(page, null);
  const rest = await box(faceOf(page, 0));
  expect(Math.abs(rest.x - slot.left)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(rest.y - slot.top)).toBeLessThanOrEqual(0.5);
});

test('AD-12 R-51 on session-place-compact tile 35 held on row 2 just past tile 7 (gap 8) parts the faces per partingOffsets, tile 7 to row 1’s last slot; the release stores [1, 38, 44, 11, 36, 9, 7, 35]', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 'session-place-compact');
  const order = [35, 1, 38, 44, 11, 36, 9, 7];
  expect(await trayIds(page)).toEqual(order.map(String));
  const g = await geometry(page);
  expect(g.perRow).toBe(7);
  const { hold } = await holdTile(page, 35, [gapCentre(g, 0, 8, 8)]);
  try {
    await expectHeld(page, 35);
    const parted = partingOffsets(g.slots, 8, 0, 8, 8, 0);
    expect(parted[7]?.slot).toBe(6);
    for (const [p, id] of order.entries()) {
      if (p === 0) continue;
      const slot = g.slots[p] as Rect;
      const o = parted[p];
      if (o === undefined) throw new Error(`no offset at ${p}`);
      const b = await box(faceOf(page, id));
      expect(Math.abs(b.x - (slot.left + o.dx)), `card ${id} x`).toBeLessThanOrEqual(0.5);
      expect(Math.abs(b.y - (slot.top + o.dy)), `card ${id} y`).toBeLessThanOrEqual(0.5);
    }
  } finally {
    await hold.end();
  }
  expect((await expectEdit(page)).placementOrder).toEqual([1, 38, 44, 11, 36, 9, 7, 35]);
});

// --- F4 clip --------------------------------------------------------------------------------------

// The share of `a`'s area inside `b`.
function ratio(a: Rect, b: Rect): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? (w * h) / ((a.right - a.left) * (a.bottom - a.top)) : 0;
}

test.describe('android, short viewport', () => {
  test.use({ viewport: { width: 412, height: 600 } });

  test('AD-12 F4 a face over the tray band under the action bar (≥ 25 % of the band, < 25 % of its visible part) parts nothing and flies back; Session byte-identical', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'session-composing');
    // Scroll so the action bar's top lies just below the tile row (clamped to the scroll range).
    const row = await box(faceOf(page, 0));
    const bar0 = await box(page.locator('[data-band="actionBar"]'));
    await page.evaluate((dy) => window.scrollBy(0, dy), Math.max(0, row.y + row.h + 4 - bar0.y));
    await animationFrames(page, 2);
    const before = await stored(page, SESSION);
    const bar = await box(page.locator('[data-band="actionBar"]'));
    const band = await box(tray(page));
    const face = await box(faceOf(page, 0));
    // Premises: the tile is pressable, the bar's top lies inside the tray band below the row.
    const at = await centre(faceOf(page, 0));
    expect(
      await page.evaluate(
        ({ x, y }) =>
          document.elementFromPoint(x, y)?.closest('[data-card-id]')?.getAttribute('data-card-id'),
        at,
      ),
    ).toBe('0');
    expect(bar.y).toBeGreaterThan(face.y + face.h);
    expect(bar.y).toBeLessThan(band.y + band.h);
    const g = await geometry(page);
    const gap0 = gapCentre(g, 0, 2, 0);
    // The held face's centre: gap 0's x, its top 20 % of its height above the bar.
    const target = { x: gap0.x, y: bar.y - 0.2 * face.h + face.h / 2 };
    const held: Rect = {
      left: target.x - face.w / 2,
      top: target.y - face.h / 2,
      right: target.x + face.w / 2,
      bottom: target.y + face.h / 2,
    };
    const whole: Rect = {
      left: band.x,
      top: band.y,
      right: band.x + band.w,
      bottom: band.y + band.h,
    };
    expect(ratio(held, whole)).toBeGreaterThanOrEqual(0.25);
    expect(ratio(held, { ...whole, bottom: bar.y })).toBeLessThan(0.25);
    const { hold } = await holdTile(page, 0, [gap0]);
    try {
      // Accepted over gap 0 first: tile 42 parts.
      expect((await transformed(page)).sort()).toEqual(['0', '42']);
      await moveFace(page, hold, gap0, target);
      await expectHeld(page, 0);
      expect(await transformed(page)).toEqual(['0']);
    } finally {
      await hold.end();
    }
    await expectNoResidue(page);
    expect(await stored(page, SESSION)).toBe(before);
    expect(await trayIds(page)).toEqual(['42', '0', '28m']);
  });
});
