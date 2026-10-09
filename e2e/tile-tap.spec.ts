import { expect, type Locator, type Page, test } from '@playwright/test';
import { stored } from './helpers/blocking';
import { box, centre, openFixture, type Step, tapAt, trayIds } from './helpers/board';
import { expectLeaves } from './helpers/dialogs';
import { hidePage, showPage } from './helpers/lifecycle';
import { booted, waitForDictionary } from './helpers/restore';
import { tokenColor } from './helpers/style';

// Epic 5 entry 5 (SPEC CAP-4): tile tap selection, swap and removal on android. The selection is
// read by the live tile's `selected` class; every edit's stored wordcell:session equals the
// store's Session before the next action (R-73). Expected values are literals from view() over the
// fixtures (seed 1; seed 191 for session-place-compact), never edited to pass. Card → letter from
// src/engine/lang/en.ts (session-won's last move: 41 S, 3 B, 38 R, 37 R, 5 C, 46 U).

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'tile taps run on android');
});

const SESSION = 'wordcell:session';
const tray = (page: Page) => page.locator('[data-band="tray"]');
const tile = (page: Page, id: number) => tray(page).getByTestId(`card-${id}`);
const selectedTiles = (page: Page) => tray(page).locator('[data-card-id].selected');
const primary = (page: Page) => page.getByTestId('primary-action');
const controls = (page: Page) => tray(page).locator('.controls');
const minus = (page: Page) => controls(page).getByRole('button', { name: '−', exact: true });
const plus = (page: Page) => controls(page).getByRole('button', { name: '+', exact: true });
const invalid = (page: Page) => tray(page).locator('.word-line .invalid');

type StoredMove = {
  freeLetters: number[];
  arrangement: number[];
  reached: string;
  targetCell?: number;
  placementOrder?: number[];
};
type Stored = { moves: StoredMove[]; cursor: { index: number; phase: string } };

async function open(page: Page, name: string, steps: readonly Step[] = []): Promise<void> {
  await openFixture(page, name, { steps });
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

// The draft move the cursor points at, as stored.
async function storedMove(page: Page): Promise<StoredMove> {
  const s = await expectSaved(page);
  const move = s.moves[s.cursor.index];
  if (move === undefined) throw new Error('no stored move at the cursor');
  return move;
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

const ret = (page: Page, id: number) => tile(page, id).locator('.return');

// --- select, swap, deselect, remove ------------------------------------------------------------

test('R-33 R-34 R-35 R-73 (UI) Composing on session-composing: select, swap and deselect source tiles', async ({
  page,
}) => {
  await open(page, 'session-composing');
  await select(page, 42);
  // R-35: a selected source tile shows no ↩.
  await expect(ret(page, 42)).toHaveCount(0);
  await tapTile(page, 0);
  await expectSelected(page, null);
  expect((await storedMove(page)).arrangement).toEqual([0, 42]);
  expect(await trayIds(page)).toEqual(['0', '42', '28m']);
  await select(page, 0);
  const before = await stored(page, SESSION);
  await tapTile(page, 0);
  await expectSelected(page, null);
  expect(await stored(page, SESSION)).toBe(before);
});

test('R-33 R-34 R-35 Q-31 R-73 (UI) Composing on session-place-free-letter-redo-tail + one Undo: select, swap, deselect, then remove the free letter', async ({
  page,
}) => {
  await open(page, 'session-place-free-letter-redo-tail', ['undo']);
  expect(await trayIds(page)).toEqual(['32', '28', '9m']);
  await select(page, 32);
  await expect(ret(page, 32)).toHaveCount(0);
  await tapTile(page, 28);
  await expectSelected(page, null);
  expect((await storedMove(page)).arrangement).toEqual([28, 32]);
  await select(page, 32);
  const before = await stored(page, SESSION);
  await tapTile(page, 32);
  await expectSelected(page, null);
  expect(await stored(page, SESSION)).toBe(before);
  // Free letter 28 from cell 3 (card mode): selected, `↩` in the bottom band, right.
  await select(page, 28);
  await expect(tile(page, 28).locator('.return.band-r')).toHaveText('↩');
  await tapTile(page, 28);
  await expectSelected(page, null);
  const move = await storedMove(page);
  expect(move.arrangement).toEqual([32]);
  expect(move.freeLetters).toEqual([]);
  await expect(page.getByTestId('wordcell-3').getByTestId('card-28')).toHaveAttribute(
    'data-place',
    'cell',
  );
});

test('R-34 R-35 R-51 R-73 (UI) strip on session-place: select, swap and deselect', async ({
  page,
}) => {
  await open(page, 'session-place');
  await select(page, 42);
  await expect(ret(page, 42)).toHaveCount(0);
  await tapTile(page, 28);
  await expectSelected(page, null);
  expect((await storedMove(page)).placementOrder).toEqual([28, 0, 42]);
  expect(await trayIds(page)).toEqual(['28', '0', '42']);
  await select(page, 0);
  const before = await stored(page, SESSION);
  await tapTile(page, 0);
  await expectSelected(page, null);
  expect(await stored(page, SESSION)).toBe(before);
});

test('R-35 a selected strip free-letter tile (28 from cell 3, session-place-free-letter-redo-tail) shows no ↩ and a second tap only deselects', async ({
  page,
}) => {
  await open(page, 'session-place-free-letter-redo-tail');
  await select(page, 28);
  await expect(ret(page, 28)).toHaveCount(0);
  const before = await stored(page, SESSION);
  await tapTile(page, 28);
  await expectSelected(page, null);
  expect(await stored(page, SESSION)).toBe(before);
  await expect(tile(page, 28)).toHaveAttribute('data-place', 'strip');
});

test('R-33 Q-31 R-73 (UI) compact QU free letter on session-place-compact + one Undo: swap 35 with 38, select 35 (↩ bottom-right), remove it', async ({
  page,
}) => {
  await open(page, 'session-place-compact', ['undo']);
  await expect(tray(page).locator('.tiles.compact')).toHaveCount(1);
  await select(page, 35);
  await tapTile(page, 38);
  await expectSelected(page, null);
  expect((await storedMove(page)).arrangement).toEqual([38, 1, 35, 44, 11]);
  await select(page, 35);
  await expect(tile(page, 35).locator('.return.br')).toHaveText('↩');
  await tapTile(page, 35);
  await expectSelected(page, null);
  const move = await storedMove(page);
  expect(move.arrangement).toEqual([38, 1, 44, 11]);
  expect(move.freeLetters).toEqual([]);
  await expect(page.getByTestId('wordcell-4').getByTestId('card-35')).toHaveAttribute(
    'data-place',
    'cell',
  );
  await expect(page.getByTestId('wordcell-4').locator('[data-mirror-of="35"]')).toHaveCount(0);
  await expect(tray(page).locator('.tiles.compact')).toHaveCount(0);
});

// --- R-71 same-letter swaps ----------------------------------------------------------------------

test('R-71 R-38 R-73 (UI) Composing on session-won + two Undos: swapping R 38 and R 37 is an edit; a failed Validate clears the selection; the next swap hides the invalid line', async ({
  page,
}) => {
  await open(page, 'session-won', ['undo', 'undo']);
  await waitForDictionary(page, 'ready');
  await expect(page.getByTestId('redo')).toBeEnabled();
  await select(page, 38);
  await tapTile(page, 37);
  await expectSelected(page, null);
  await expect(page.getByTestId('redo')).toBeDisabled();
  let s = await expectSaved(page);
  expect(s.moves).toHaveLength(s.cursor.index + 1);
  let move = await storedMove(page);
  expect(move.arrangement).toEqual([41, 3, 37, 38, 5, 46]);
  expect(move.reached).toBe('composing');
  expect(move.targetCell).toBeUndefined();
  expect(move.placementOrder).toBeUndefined();
  // A non-word swap (S 41 ↔ U 46: UBRRCS).
  await select(page, 41);
  await tapTile(page, 46);
  await expectSelected(page, null);
  move = await storedMove(page);
  expect(move.arrangement).toEqual([46, 3, 37, 38, 5, 41]);
  await select(page, 3);
  await primary(page).click();
  await expect(invalid(page)).toBeVisible();
  s = await expectSaved(page);
  expect(s.cursor.phase).toBe('composing');
  await expectSelected(page, null);
  await select(page, 38);
  await tapTile(page, 37);
  await expect(invalid(page)).toHaveCount(0);
  move = await storedMove(page);
  expect(move.arrangement).toEqual([46, 3, 38, 37, 5, 41]);
  expect(move.reached).toBe('composing');
});

test('R-71 R-34 R-73 (UI) Place on session-won + one Undo: swapping R 38 and R 37 in the strip is an edit', async ({
  page,
}) => {
  await open(page, 'session-won', ['undo']);
  await expect(page.getByTestId('redo')).toBeEnabled();
  await select(page, 38);
  await tapTile(page, 37);
  await expectSelected(page, null);
  await expect(page.getByTestId('redo')).toBeDisabled();
  const s = await expectSaved(page);
  expect(s.moves).toHaveLength(s.cursor.index + 1);
  expect(s.cursor.phase).toBe('place');
  const move = await storedMove(page);
  expect(move.placementOrder).toEqual([41, 3, 37, 38, 5, 46]);
  expect(move.reached).toBe('place');
});

test('R-72 R-70 R-73 (UI) three tile edits then one Undo on session-composing return to Idle', async ({
  page,
}) => {
  await open(page, 'session-composing');
  for (const expected of [
    [0, 42],
    [42, 0],
    [0, 42],
  ]) {
    await select(page, 42);
    await tapTile(page, 0);
    expect((await storedMove(page)).arrangement).toEqual(expected);
  }
  await page.getByTestId('undo').click();
  const s = await expectSaved(page);
  expect(s.cursor).toEqual({ index: 0, phase: 'idle' });
});

// --- keep -----------------------------------------------------------------------------------------

test('R-32 (UI) a tap on a D-block tile keeps the tile selection and the stored Session', async ({
  page,
}) => {
  await open(page, 'session-composing');
  await select(page, 42);
  const before = await stored(page, SESSION);
  await tapAt(page, await centre(tray(page).locator('[data-mirror-of="28"]')));
  await expectSelected(page, 42);
  expect(await stored(page, SESSION)).toBe(before);
});

test('R-33 (UI) in Composing a used and an empty WordCell keep the tile selection (session-place-free-letter-redo-tail + one Undo)', async ({
  page,
}) => {
  await open(page, 'session-place-free-letter-redo-tail', ['undo']);
  await select(page, 32);
  const before = await stored(page, SESSION);
  for (const cell of [3, 4]) {
    await tapAt(page, await centre(page.getByTestId(`wordcell-${cell}`)));
    await expectSelected(page, 32);
    expect(await stored(page, SESSION)).toBe(before);
  }
});

test('R-40 in Place a not-legal WordCell keeps the tile selection (session-place, cell 4)', async ({
  page,
}) => {
  await open(page, 'session-place');
  await select(page, 42);
  const before = await stored(page, SESSION);
  await tapAt(page, await centre(page.getByTestId('wordcell-4')));
  await expectSelected(page, 42);
  expect(await stored(page, SESSION)).toBe(before);
});

test('AD-9 (UI) F1 a hide and show without reload keep the tile selection', async ({ page }) => {
  await open(page, 'session-composing');
  await select(page, 42);
  await hidePage(page);
  await showPage(page);
  await expectSelected(page, 42);
});

// --- clear ----------------------------------------------------------------------------------------

test('AD-12 F13 a tap on the current target cell clears the tile selection and dispatches nothing (session-place)', async ({
  page,
}) => {
  await open(page, 'session-place');
  await select(page, 42);
  const before = await stored(page, SESSION);
  await tapAt(page, await centre(page.getByTestId('wordcell-3')));
  await expectSelected(page, null);
  expect(await stored(page, SESSION)).toBe(before);
});

test('R-33 R-31 (UI) taps on the tray band background, the letter count, the top bar, an inert column card and the disabled − clear the tile selection with no edit (session-composing)', async ({
  page,
}) => {
  await open(page, 'session-composing');
  await expect(minus(page)).toBeDisabled();
  const band = await box(tray(page));
  const row = await box(tile(page, 42));
  const points: [string, () => Promise<{ x: number; y: number }>][] = [
    ['tray background', async () => ({ x: band.x + band.w - 12, y: row.y + row.h / 2 })],
    ['letter count', () => centre(controls(page).locator('.count'))],
    ['top bar', () => centre(page.getByRole('heading', { name: 'WordCell' }))],
    [
      'inert column card',
      () => centre(page.getByTestId('column-1').locator('[data-place="column"]').last()),
    ],
    ['disabled −', () => centre(minus(page))],
  ];
  const before = await stored(page, SESSION);
  for (const [, at] of points) {
    await select(page, 42);
    await tapAt(page, await at());
    await expectSelected(page, null);
    expect(await stored(page, SESSION)).toBe(before);
  }
});

test('R-31 R-38 AD-4 (UI) an enabled control (+, −, Validate) clears the tile selection before it acts (session-composing)', async ({
  page,
}) => {
  await open(page, 'session-composing');
  await waitForDictionary(page, 'ready');
  await select(page, 42);
  await plus(page).click();
  await expectSelected(page, null);
  await expect(controls(page).locator('.k')).toHaveText('2');
  expect((await storedMove(page)).arrangement).toEqual([42, 0]);
  await select(page, 0);
  await minus(page).click();
  await expectSelected(page, null);
  await expect(controls(page).locator('.k')).toHaveText('1');
  await expectSaved(page);
  // TAN validates (session-place is its Place).
  await select(page, 0);
  await primary(page).click();
  await expect(primary(page)).toHaveText('Confirm');
  expect((await expectSaved(page)).cursor.phase).toBe('place');
  await expectSelected(page, null);
});

test('R-70 AD-4 (UI) Undo with a strip tile selected clears it: Composing with nothing selected (session-place-free-letter-redo-tail)', async ({
  page,
}) => {
  await open(page, 'session-place-free-letter-redo-tail');
  await select(page, 28);
  await page.getByTestId('undo').click();
  expect((await expectSaved(page)).cursor).toEqual({ index: 1, phase: 'composing' });
  await expect(tile(page, 28)).toHaveAttribute('data-place', 'tray');
  await expectSelected(page, null);
});

// --- look and hit rect ----------------------------------------------------------------------------

type Rect = { x: number; y: number; w: number; h: number };
const inside = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.w <= outer.x + outer.w &&
  inner.y + inner.h <= outer.y + outer.h;
const grown = (r: Rect, by: number): Rect => ({
  x: r.x - by,
  y: r.y - by,
  w: r.w + 2 * by,
  h: r.h + 2 * by,
});

// A selected row-1 tile: the slot is unchanged, the face 4 px up with a 2 px teal outline, and the
// face box grown by the outline lies inside the clipping tile area and the tray band.
async function expectLook(page: Page, wrapper: Locator, slot: Rect): Promise<void> {
  expect(await box(wrapper)).toEqual(slot);
  const face = wrapper.locator('.face');
  const lifted = await box(face);
  expect(lifted.y).toBe(slot.y - 4);
  await expect(face).toHaveCSS('outline-style', 'solid');
  await expect(face).toHaveCSS('outline-width', '2px');
  await expect(face).toHaveCSS('outline-color', await tokenColor(page, '--wc-accent-teal'));
  await expect(face).toHaveCSS('box-shadow', 'none');
  const outlined = grown(lifted, 2);
  expect(inside(outlined, await box(tray(page).locator('.tiles')))).toBe(true);
  expect(inside(outlined, await box(tray(page)))).toBe(true);
}

test('AD-12 (UI) F2 full pitch in card mode: a tap 1 px right of a face selects its tile; the lift moves the face only, fully visible (session-composing)', async ({
  page,
}) => {
  await open(page, 'session-composing');
  const wrapper = tile(page, 42);
  const slot = await box(wrapper);
  const face = await box(wrapper.locator('.face'));
  expect(face.y).toBe(slot.y);
  await tapAt(page, { x: face.x + face.w + 1, y: face.y + face.h / 2 });
  await expectSelected(page, 42);
  await expectLook(page, wrapper, slot);
});

test('AD-12 (UI) F2 full pitch in a compact tray: a tap 1 px below a row-1 face selects its tile; the selected face stays fully visible (session-place-compact + one Undo)', async ({
  page,
}) => {
  await open(page, 'session-place-compact', ['undo']);
  await expect(tray(page).locator('.tiles.compact')).toHaveCount(1);
  const wrapper = tile(page, 1);
  const slot = await box(wrapper);
  const face = await box(wrapper.locator('.face'));
  // Row 1: a row-2 tile (the last block mirror) sits below it.
  const last = await box(tray(page).locator('[data-mirror-of="7"]'));
  expect(last.y).toBeGreaterThan(slot.y + slot.h);
  await tapAt(page, { x: face.x + face.w / 2, y: face.y + face.h + 1 });
  await expectSelected(page, 1);
  await expectLook(page, wrapper, slot);
  // A tap in the selected tile's own lower half-gap (1 px below its slot) resolves to it: deselect.
  const before = await stored(page, SESSION);
  await tapAt(page, { x: slot.x + slot.w / 2, y: slot.y + slot.h + 1 });
  await expectSelected(page, null);
  expect(await stored(page, SESSION)).toBe(before);
});

// --- back and reload ------------------------------------------------------------------------------

test('AD-13 (UI) back with a tile selected leaves the app (no history entry)', async ({ page }) => {
  await open(page, 'session-composing');
  await select(page, 42);
  await expectLeaves(page);
});

test('R-73 (UI) reload in Composing after a tap-swap (session-place-free-letter-redo-tail + one Undo): same tray and tags, nothing selected', async ({
  page,
}) => {
  await open(page, 'session-place-free-letter-redo-tail', ['undo']);
  await select(page, 32);
  await tapTile(page, 28);
  expect((await storedMove(page)).arrangement).toEqual([28, 32]);
  await select(page, 32);
  await page.reload();
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await booted(page);
  expect(await trayIds(page)).toEqual(['28', '32', '9m']);
  await expect(tile(page, 28).locator('.tag')).toHaveText('3');
  await expectSelected(page, null);
  expect((await storedMove(page)).arrangement).toEqual([28, 32]);
});
