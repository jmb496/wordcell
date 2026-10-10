import { expect, type Locator, type Page, test } from '@playwright/test';
import { stored } from './helpers/blocking';
import {
  cards,
  centre,
  openFixture,
  type Point,
  type Step,
  sameSession,
  stashSession,
  tapAt,
  trayIds,
} from './helpers/board';
import { dragResidue } from './helpers/drag';
import { animationFrames } from './helpers/lifecycle';
import { booted, waitForDictionary } from './helpers/restore';
import { armStorageSpy, storageWrites } from './helpers/storage-spy';
import { tokenColor } from './helpers/style';
import { longPress, touchHold } from './helpers/touch';

// Epic 5 ticket 9 (SPEC CAP-7, F1, F13, F14; S15): the Place target, order and Confirm. Every
// fixture is seeded fresh per test; "won + Undo" is session-won after one Undo (Place of its last
// move at cursor 7: strip [41, 3, 38, 37, 5, 46], target 6, legal 3–6, cells 3–5 empty, Redo
// enabled). session-place-free-letter-two-cards (seed 191): Place at cursor 2, strip
// [26, 32, 45, 28, 42] (MOUNT), free letter 28 from cell 4 = [20, 28], target 5, legal 3–5, score
// 89, meta delta +21 (+16 with target 4). session-place-free-letter-redo-tail (seed 1): Place at
// cursor 1, strip [9, 32, 28], free letter 28 from cell 3 = [42, 0, 28], target 3 only. Expected
// values are literals from view() over the fixtures, never edited to pass. Every setTarget,
// setPlacementOrder and confirm asserts the stored wordcell:session equals current().session
// before the next action (R-73). Helpers are local copies (S1 consolidation is entry 14's):
// `expectSaved`/`storedMove` from e2e/tile-tap.spec.ts, ring/target checks and `expectUsedCell3`'s
// shape from e2e/board-phases.spec.ts, `hoverPeek` from e2e/wordcell-view.spec.ts.

const onAndroid = () =>
  test.skip(test.info().project.name !== 'android', 'touch flows run on android');
const onDesktop = () =>
  test.skip(test.info().project.name !== 'desktop', 'mouse flows run on desktop');

const SESSION = 'wordcell:session';
const TWO = 'session-place-free-letter-two-cards';
const REDO_TAIL = 'session-place-free-letter-redo-tail';
const tray = (page: Page) => page.locator('[data-band="tray"]');
const tile = (page: Page, id: number) => tray(page).getByTestId(`card-${id}`);
const selectedTiles = (page: Page) => tray(page).locator('[data-card-id].selected');
const cell = (page: Page, n: number) => page.getByTestId(`wordcell-${n}`);
const primary = (page: Page) => page.getByTestId('primary-action');
const sheet = (page: Page) => page.locator('[data-view-sheet]');
const hoverPeek = (page: Page) => page.locator('[data-hover-peek]');

type StoredMove = {
  freeLetters: number[];
  arrangement: number[];
  reached: string;
  targetCell?: number;
  placementOrder?: number[];
};
type Cursor = { index: number; phase: string };
type Stored = { moves: StoredMove[]; cursor: Cursor };

async function open(page: Page, name: string, steps: readonly Step[] = []): Promise<void> {
  await openFixture(page, name, { steps });
  await expect(selectedTiles(page)).toHaveCount(0);
}

// The won + Undo Place (cursor 7, target 6).
async function openWonUndo(page: Page): Promise<void> {
  await open(page, 'session-won', ['undo']);
  expect((await expectSaved(page)).cursor).toEqual({ index: 7, phase: 'place' });
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

// The move the cursor points at, as stored (saved first).
async function storedMove(page: Page): Promise<StoredMove> {
  const s = await expectSaved(page);
  const move = s.moves[s.cursor.index];
  if (move === undefined) throw new Error('no stored move at the cursor');
  return move;
}

// Polls until the store's cursor equals `cursor`, then checks it is saved (R-73); returns it.
async function expectCursor(page: Page, cursor: Cursor): Promise<Stored> {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const current = window.__wordcell?.current();
        if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
        return current.session.cursor;
      }),
    )
    .toEqual(cursor);
  const s = await expectSaved(page);
  expect(s.cursor).toEqual(cursor);
  return s;
}

// The stored text and the store's Session reference, for a no-dispatch check.
async function stash(page: Page): Promise<() => Promise<void>> {
  const before = await stashSession(page);
  return async () => {
    await animationFrames(page, 2);
    expect(await stored(page, SESSION)).toBe(before);
    expect(await sameSession(page)).toBe(true);
  };
}

async function tapCell(page: Page, n: number): Promise<void> {
  await tapAt(page, await centre(cell(page, n)));
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

// A strip tap-swap of `a` and `b` (one setPlacementOrder), saved; returns the stored order.
async function swap(page: Page, a: number, b: number): Promise<number[]> {
  await select(page, a);
  await tapTile(page, b);
  await expectSelected(page, null);
  const order = (await storedMove(page)).placementOrder;
  if (order === undefined) throw new Error('no stored placementOrder');
  return order;
}

// Taps `n` and checks the Place move's stored targetCell becomes `n` (setTarget, saved).
async function retarget(page: Page, n: number): Promise<StoredMove> {
  await tapCell(page, n);
  await expect.poll(async () => (await storedMove(page)).targetCell).toBe(n);
  return storedMove(page);
}

async function confirm(page: Page): Promise<void> {
  await expect(primary(page)).toHaveText('Confirm');
  await tapAt(page, await centre(primary(page)));
}

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

// The WordCell's computed ring (its ::after border).
const ring = (page: Page, n: number) =>
  cell(page, n).evaluate((el) => {
    const style = getComputedStyle(el, '::after');
    return { color: style.borderTopColor, width: style.borderTopWidth };
  });

// The product of computed opacity from the element up to the root.
function effectiveOpacity(locator: Locator): Promise<number> {
  return locator.evaluate((el) => {
    let opacity = 1;
    for (let node: Element | null = el; node !== null; node = node.parentElement) {
      opacity *= Number(getComputedStyle(node).opacity);
    }
    return opacity;
  });
}

// R-42: the selected target's 3 px ring and check at full opacity.
async function expectTarget(page: Page, n: number): Promise<void> {
  const target = cell(page, n);
  await expect(target).toHaveClass(/\btarget\b/);
  await expect(target).not.toHaveClass(/\bdim\b/);
  await expect(target.locator('.check')).toBeVisible();
  expect(await effectiveOpacity(target.locator('.check'))).toBe(1);
  const teal = await tokenColor(page, '--wc-accent-teal');
  expect(await ring(page, n)).toEqual({ color: teal, width: '3px' });
}

// R-40: a legal non-current cell's 2 px ring, not faded, no check.
async function expectLegal(page: Page, cells: readonly number[]): Promise<void> {
  const teal = await tokenColor(page, '--wc-accent-teal');
  for (const n of cells) {
    await expect(cell(page, n)).toHaveClass(/\blegal\b/);
    await expect(cell(page, n)).not.toHaveClass(/\bdim\b/);
    await expect(cell(page, n).locator('.check')).toHaveCount(0);
    expect(await ring(page, n), `wordcell-${n}`).toEqual({ color: teal, width: '2px' });
  }
}

// R-40: a not-legal cell faded to 0.35.
async function expectNotLegal(page: Page, cells: readonly number[]): Promise<void> {
  for (const n of cells) {
    await expect(cell(page, n)).toHaveClass(/\bdim\b/);
    await expect(cell(page, n)).toHaveCSS('opacity', '0.35');
  }
}

// R-33: cell `n` shows its top card `top` as the used-hatch mirror; the cards beneath stay hidden.
async function expectUsedCell(page: Page, n: number, top: number, beneath: number[]) {
  const used = cell(page, n).locator(`[data-mirror-of="${top}"]`);
  await expect(used).toHaveCount(1);
  await expect(used.locator('.face')).toHaveCSS('opacity', '0.4');
  expect(
    await used.locator('.face').evaluate((el) => getComputedStyle(el).backgroundImage),
  ).toContain('repeating-linear-gradient');
  for (const id of beneath) await expect(cell(page, n).getByTestId(`card-${id}`)).toBeHidden();
}

// The strip's tags: each live strip tile's id with its free-letter origin tag and position tag.
function stripTags(page: Page): Promise<string[]> {
  return tray(page)
    .locator('[data-place="strip"]')
    .evaluateAll((els) =>
      els.map((el) => {
        const tag = el.querySelector('.tag')?.textContent ?? '';
        const position = el.querySelector('.position')?.textContent ?? '';
        return `${el.getAttribute('data-card-id')}:${tag}:${position}`;
      }),
    );
}

test.describe('android', () => {
  test.beforeEach(onAndroid);

  // --- rings, fade, pre-selection ------------------------------------------------------------------

  test('R-40 R-39 (UI) on session-place target 3 ringed, cells 4–10 faded; a tap on not-legal 4 and on current target 3 dispatches nothing, Session byte-identical', async ({
    page,
  }) => {
    await open(page, 'session-place');
    await expectTarget(page, 3);
    await expectNotLegal(page, [4, 5, 6, 7, 8, 9, 10]);
    const unchanged = await stash(page);
    await tapCell(page, 4);
    await tapCell(page, 3);
    await unchanged();
    await expectTarget(page, 3);
  });

  test('R-42 (UI) Validate on session-composing (dictionary loaded) pre-selects the stored target 3, cells 4–10 faded', async ({
    page,
  }) => {
    await open(page, 'session-composing');
    await waitForDictionary(page, 'ready');
    await expect(primary(page)).toHaveText('Validate');
    await tapAt(page, await centre(primary(page)));
    await expectCursor(page, { index: 0, phase: 'place' });
    expect((await storedMove(page)).targetCell).toBe(3);
    await expectTarget(page, 3);
    await expectNotLegal(page, [4, 5, 6, 7, 8, 9, 10]);
  });

  test('R-40 R-42 (UI) on session-place-free-letter-redo-tail target 3 checked and ringed, cells 4–10 faded', async ({
    page,
  }) => {
    await open(page, REDO_TAIL);
    await expectTarget(page, 3);
    await expectNotLegal(page, [4, 5, 6, 7, 8, 9, 10]);
  });

  test('R-40 R-42 (UI) on won + Undo legal 3–5 ringed, target 6 checked, cells 7–10 faded', async ({
    page,
  }) => {
    await openWonUndo(page);
    await expectTarget(page, 6);
    await expectLegal(page, [3, 4, 5]);
    await expectNotLegal(page, [7, 8, 9, 10]);
  });

  // --- retargets on won + Undo ---------------------------------------------------------------------

  test('R-71 R-42 R-73 (UI) a retarget is a Place edit on won + Undo: Redo enabled, tap cell 4, Redo disabled, targetCell 4 saved', async ({
    page,
  }) => {
    await openWonUndo(page);
    await expect(page.getByTestId('redo')).toBeEnabled();
    const move = await retarget(page, 4);
    expect(move.reached).toBe('place');
    await expect(page.getByTestId('redo')).toBeDisabled();
    await expectTarget(page, 4);
    await expectLegal(page, [3, 5, 6]);
    expect((await expectSaved(page)).cursor).toEqual({ index: 7, phase: 'place' });
  });

  test('R-51 R-42 R-73 (UI) a strip swap to [46, 3, 38, 37, 5, 41], then a tap on cell 3: placementOrder unchanged in current().session, storage and the strip DOM; cell 3 the target', async ({
    page,
  }) => {
    await openWonUndo(page);
    expect(await trayIds(page)).toEqual(['41', '3', '38', '37', '5', '46']);
    const order = await swap(page, 41, 46);
    expect(order).toEqual([46, 3, 38, 37, 5, 41]);
    expect(await trayIds(page)).toEqual(['46', '3', '38', '37', '5', '41']);
    const move = await retarget(page, 3);
    expect(move.placementOrder).toEqual([46, 3, 38, 37, 5, 41]);
    expect((await expectSaved(page)).cursor).toEqual({ index: 7, phase: 'place' });
    expect(await trayIds(page)).toEqual(['46', '3', '38', '37', '5', '41']);
    await expectTarget(page, 3);
    await expectLegal(page, [4, 5, 6]);
  });

  test('R-39 R-42 AD-12 a long-press on empty cell 5 released in place sets the target 5 (won + Undo)', async ({
    page,
  }) => {
    await openWonUndo(page);
    await longPress(page, await centre(cell(page, 5)), 600);
    await expect.poll(async () => (await storedMove(page)).targetCell).toBe(5);
    await expectTarget(page, 5);
    await expect(sheet(page)).toHaveCount(0);
  });

  test('R-39 R-42 AD-12 a long-press on empty cell 3 held past 400 ms, then moved past 8 px over cell 4 and released, sets the target 3 (won + Undo)', async ({
    page,
  }) => {
    await openWonUndo(page);
    const hold = await touchHold(page, await centre(cell(page, 3)));
    try {
      await page.waitForTimeout(600);
      await hold.moveTo(await centre(cell(page, 4)));
    } finally {
      await hold.end();
    }
    await expect.poll(async () => (await storedMove(page)).targetCell).toBe(3);
    await expectTarget(page, 3);
  });

  test('R-39 F1 F13 with a strip tile selected (won + Undo): a not-legal tap on 7 keeps it, a drag from cell 4 and a drag on target 6’s top card clear it, a tap on target 6 clears it, each no dispatch; then a tap on cell 4 sets the target 4 and clears it', async ({
    page,
  }) => {
    await openWonUndo(page);
    const unchanged = await stash(page);
    // R-39: a not-legal tap keeps the selection and opens no WordCell view.
    await select(page, 38);
    await tapCell(page, 7);
    await animationFrames(page, 2);
    await expectSelected(page, 38);
    await expect(sheet(page)).toHaveCount(0);
    await unchanged();
    // SPEC CAP-4: a drag from legal non-current cell 4 ending in pointerup clears, no dispatch.
    const from4 = await centre(cell(page, 4));
    const drag4 = await touchHold(page, from4);
    try {
      await drag4.moveTo({ x: from4.x + 20, y: from4.y });
    } finally {
      await drag4.end();
    }
    await expectSelected(page, null);
    await unchanged();
    // R-39: a drag on the current target's top card (13) moves nothing (no free-letter drag in
    // Place) and clears.
    await select(page, 38);
    const from6: Point = await centre(cell(page, 6).getByTestId('card-13'));
    const drag6 = await touchHold(page, from6);
    try {
      await drag6.moveTo({ x: from6.x + 20, y: from6.y });
      expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
    } finally {
      await drag6.end();
    }
    await expectSelected(page, null);
    await unchanged();
    // F13: a tap on the current target clears, no dispatch.
    await select(page, 38);
    await tapCell(page, 6);
    await expectSelected(page, null);
    await unchanged();
    // A legal non-current cell: setTarget 4, the selection cleared.
    await select(page, 38);
    const move = await retarget(page, 4);
    expect(move.placementOrder).toEqual([41, 3, 38, 37, 5, 46]);
    await expectSelected(page, null);
    await expectTarget(page, 4);
  });

  // --- Confirm -------------------------------------------------------------------------------------

  test('R-62 R-60 R-51 (won + Undo) a strip swap, a retarget to 3, then Confirm: cell 3 holds the reordered strip bottom → top, Game over with no end sheet', async ({
    page,
  }) => {
    await openWonUndo(page);
    expect(await swap(page, 41, 46)).toEqual([46, 3, 38, 37, 5, 41]);
    expect((await retarget(page, 3)).placementOrder).toEqual([46, 3, 38, 37, 5, 41]);
    await confirm(page);
    const s = await expectCursor(page, { index: 8, phase: 'idle' });
    expect(s.moves).toHaveLength(8);
    expect(await cellIds(page, 3)).toEqual([46, 3, 38, 37, 5, 41]);
    await expect(primary(page)).toHaveText('New game');
    for (let n = 1; n <= 8; n++) expect(await columnIds(page, n), `column ${n}`).toEqual([]);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('R-60 R-52 R-73 (UI) Confirm on session-place-free-letter-redo-tail into cell 3: one session write, redo tail dropped, columns 4 and 6 lose 32 and 9, cell 3 [42, 0, 9, 32, 28]; then a drop and a tap on cell 3 adds its top 28 as a free letter', async ({
    page,
  }) => {
    await open(page, REDO_TAIL);
    expect(await trayIds(page)).toEqual(['9', '32', '28']);
    await expect(page.getByTestId('redo')).toBeEnabled();
    await armStorageSpy(page);
    await confirm(page);
    const s = await expectCursor(page, { index: 2, phase: 'idle' });
    expect(s.moves).toHaveLength(2);
    expect(s.moves[1]?.reached).toBe('committed');
    expect((await storageWrites(page)).filter((w) => w.key === SESSION)).toHaveLength(1);
    expect(await columnIds(page, 4)).toEqual([10, 22, 14, 16, 17, 18]);
    expect(await columnIds(page, 6)).toEqual([31, 34, 27, 1]);
    await expect(page.getByTestId('redo')).toBeDisabled();
    expect(await cellIds(page, 3)).toEqual([42, 0, 9, 32, 28]);
    // R-52: the strip's last card 28 is the new top; the next move can take it as a free letter.
    await tapAt(page, await centre(cards(page, 2).last()));
    await tapAt(page, await centre(cards(page, 6).last()));
    await expectCursor(page, { index: 2, phase: 'composing' });
    await tapCell(page, 3);
    await expect.poll(async () => (await storedMove(page)).freeLetters).toEqual([3]);
    expect(await trayIds(page)).toContain('28');
  });

  test('R-41 R-80 R-73 (UI) on session-place-free-letter-two-cards a retarget to the used cell 4, then Confirm into it: cell 4 [20, 26, 32, 45, 28, 42], the score change equals the meta delta', async ({
    page,
  }) => {
    await open(page, TWO);
    await expectTarget(page, 5);
    await expectLegal(page, [3, 4]);
    await expectUsedCell(page, 4, 28, [20]);
    expect(await metaDelta(page)).toBe(21);
    const before = await score(page);
    expect(before).toBe(89);
    const move = await retarget(page, 4);
    expect(move.placementOrder).toEqual([26, 32, 45, 28, 42]);
    expect((await expectSaved(page)).cursor).toEqual({ index: 2, phase: 'place' });
    await expectTarget(page, 4);
    await expectLegal(page, [3, 5]);
    await expectUsedCell(page, 4, 28, [20]);
    const delta = await metaDelta(page);
    expect(delta).toBe(16);
    await confirm(page);
    await expectCursor(page, { index: 3, phase: 'idle' });
    // R-52: 28 once, the strip's last card 42 on top.
    expect(await cellIds(page, 4)).toEqual([20, 26, 32, 45, 28, 42]);
    await expect(cell(page, 4).getByTestId('card-42')).toBeVisible();
    await expect(cell(page, 4).locator('.count')).toHaveText('6');
    await expect.poll(() => score(page)).toBe(before + delta);
  });

  test('R-61 R-65 R-80 R-73 (UI) on session-place-free-letter-two-cards: badge 2 on cell 4 with the used mirror on top; a long-press peek on it keeps the tile and dispatches nothing; Confirm into target 5 shows card 20 with no badge', async ({
    page,
  }) => {
    await open(page, TWO);
    await expect(cell(page, 4).locator('.count')).toHaveText('2');
    await expectUsedCell(page, 4, 28, [20]);
    await expectTarget(page, 5);
    // R-65, F13: the long-press peek on c (not the target) with a strip tile selected.
    await select(page, 45);
    const unchanged = await stash(page);
    const hold = await touchHold(page, await centre(cell(page, 4)));
    try {
      await expect(sheet(page)).toBeVisible();
      await expect(sheet(page)).toHaveAttribute('data-mode', 'peek');
      await expectSelected(page, 45);
    } finally {
      await hold.end();
    }
    // Two cards do not overflow: the release closes the peek.
    await expect(sheet(page)).toHaveCount(0);
    await unchanged();
    await expectSelected(page, 45);
    // R-39: a tap on non-empty not-legal cell 9 dispatches nothing, opens no view, keeps the tile.
    await tapCell(page, 9);
    await animationFrames(page, 2);
    await expect(sheet(page)).toHaveCount(0);
    await expectSelected(page, 45);
    await unchanged();
    expect((await storedMove(page)).targetCell).toBe(5);
    await expectTarget(page, 5);
    const delta = await metaDelta(page);
    expect(delta).toBe(21);
    const before = await score(page);
    await confirm(page);
    await expectCursor(page, { index: 3, phase: 'idle' });
    // R-61: cell 4's next card shows; one card, no badge (S15).
    expect(await cellIds(page, 4)).toEqual([20]);
    await expect(cell(page, 4).getByTestId('card-20')).toBeVisible();
    await expect(cell(page, 4).locator('[data-mirror-of]')).toHaveCount(0);
    await expect(cell(page, 4).locator('.count')).toHaveCount(0);
    expect(await cellIds(page, 5)).toEqual([26, 32, 45, 28, 42]);
    await expect.poll(() => score(page)).toBe(before + delta);
  });

  test('R-73 (UI) R-42 a reload in Place on session-place-free-letter-two-cards after a strip swap, a retarget to 4 and a tile selected: same strip, tags and target, cell 4 used and the target, nothing selected', async ({
    page,
  }) => {
    await open(page, TWO);
    expect(await swap(page, 26, 42)).toEqual([42, 32, 45, 28, 26]);
    expect((await retarget(page, 4)).placementOrder).toEqual([42, 32, 45, 28, 26]);
    await select(page, 32);
    const strip = await trayIds(page);
    expect(strip).toEqual(['42', '32', '45', '28', '26']);
    const tags = await stripTags(page);
    expect(tags).toEqual(['42::bottom', '32::', '45::', '28:4:', '26::top']);
    await page.reload();
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    await booted(page);
    expect(await trayIds(page)).toEqual(strip);
    expect(await stripTags(page)).toEqual(tags);
    await expectSelected(page, null);
    const move = await storedMove(page);
    expect(move.targetCell).toBe(4);
    expect(move.placementOrder).toEqual([42, 32, 45, 28, 26]);
    await expectTarget(page, 4);
    await expectUsedCell(page, 4, 28, [20]);
  });

  test('R-39 AD-12 Composing on session-composing with tile 42 selected: a long-press on empty cell 3 dispatches nothing and keeps the tile', async ({
    page,
  }) => {
    await open(page, 'session-composing');
    await select(page, 42);
    const unchanged = await stash(page);
    await longPress(page, await centre(cell(page, 3)), 600);
    await unchanged();
    await expectSelected(page, 42);
    await expect(sheet(page)).toHaveCount(0);
  });
});

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  test('R-65 (UI) F26 on session-place-free-letter-two-cards a click on cell 4 with its hover peek open sets the target 4; the hover peek stays open', async ({
    page,
  }) => {
    await open(page, TWO);
    const c = await centre(cell(page, 4));
    await page.mouse.move(c.x, c.y);
    await expect(hoverPeek(page)).toBeVisible();
    await page.mouse.down();
    await page.mouse.up();
    await expect.poll(async () => (await storedMove(page)).targetCell).toBe(4);
    await expectTarget(page, 4);
    await expect(hoverPeek(page)).toBeVisible();
  });
});
