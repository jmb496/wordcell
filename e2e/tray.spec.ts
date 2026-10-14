import { expect, type Page, test } from '@playwright/test';
import { cards, centre, openFixture, type Step, trayIds } from './helpers/board';
import { animationFrames } from './helpers/lifecycle';
import { waitForDictionary } from './helpers/restore';
import { seedStorage } from './helpers/seed';
import { tokenColor } from './helpers/style';

// Epic 5 entries 1–2: the Composing tray and the Place strip (DESIGN.md Tray band, Tile,
// Placement strip, Invalid-word message). Expected values are literals from view() over the
// fixtures (seed 1; seed 191 for session-place-compact; the plans' I/O matrices), never edited to
// pass. Card → letter from src/engine/lang/en.ts.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'tray rendering runs on android');
});

const LIST = '**/en*.txt';
// R-30 word on session-composing after the R-31 tap raising k to 2.
const K2_WORD = 'TANE';
const tray = (page: Page) => page.locator('[data-band="tray"]');

// The word line's letters in DOM order: card id, text and whether it is underlined.
function wordLetters(page: Page) {
  return tray(page)
    .locator('.word-line [data-word-card]')
    .evaluateAll((els) =>
      els.map((el) => ({
        id: Number(el.getAttribute('data-word-card')),
        text: el.textContent,
        underlined: getComputedStyle(el).textDecorationLine.includes('underline'),
      })),
    );
}

async function expectComposing(
  page: Page,
  expected: {
    word: string;
    letters: readonly string[];
    underlined: readonly number[];
    ids: readonly string[];
    count: string;
  },
): Promise<void> {
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  const line = tray(page).locator('.word-line .word-text');
  await expect(line).toHaveText(expected.word);
  const letters = await wordLetters(page);
  expect(letters.map((l) => l.text)).toEqual(expected.letters);
  expect(letters.filter((l) => l.underlined).map((l) => l.id)).toEqual(expected.underlined);
  expect(await trayIds(page)).toEqual(expected.ids);
  // R-30: tray order equals the word line's card order (draft.wordCards).
  expect(letters.map((l) => `${l.id}`)).toEqual(expected.ids.map((id) => id.replace('m', '')));
  await expect(tray(page).locator('.controls .count')).toHaveText(expected.count);
  // R-31 D-block controls (entry 3): `−` k `+` and Flip, k the destination count.
  const left = tray(page).locator('.controls .left');
  await expect(left.getByRole('button', { name: '\u2212', exact: true })).toHaveCount(1);
  await expect(left.locator('.k')).toHaveText(`${expected.underlined.length}`);
  await expect(left.getByRole('button', { name: '+', exact: true })).toHaveCount(1);
  await expect(left.getByRole('button', { name: 'Flip', exact: true })).toHaveCount(1);
  await expect(left.locator('.caption')).toHaveCount(0);
}

// A tile mark's place on its card's `.face` box (epic 4 F11: quadrants, no px literals): the
// mark's bounding-box centre and left/right edges as fractions of the face's width and height.
async function markAt(
  page: Page,
  id: number,
  selector: string,
): Promise<{ x: number; y: number; left: number; right: number }> {
  const mark = tray(page).getByTestId(`card-${id}`).locator(selector);
  await expect(mark).toHaveCount(1);
  return mark.evaluate((el) => {
    const face = el.closest('.face');
    if (face === null) throw new Error('mark outside a face');
    const f = face.getBoundingClientRect();
    const m = el.getBoundingClientRect();
    return {
      x: (m.left + m.width / 2 - f.left) / f.width,
      y: (m.top + m.height / 2 - f.top) / f.height,
      left: (m.left - f.left) / f.width,
      right: (m.right - f.left) / f.width,
    };
  });
}

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

async function expectCorner(page: Page, id: number, selector: string, corner: Corner) {
  const at = await markAt(page, id, selector);
  if (corner.startsWith('top')) expect(at.y).toBeLessThan(0.5);
  else expect(at.y).toBeGreaterThan(0.5);
  if (corner.endsWith('left')) expect(at.x).toBeLessThan(0.5);
  else expect(at.x).toBeGreaterThan(0.5);
}

// DESIGN.md Card: the bottom band is the face below its 72 % line. A band word such as `bottom`
// is nearly face-wide, so its side is read from the edge it is anchored to (its outer quarter),
// and it stays inside the face.
async function expectBand(page: Page, id: number, selector: string, side: 'left' | 'right') {
  const at = await markAt(page, id, selector);
  expect(at.y).toBeGreaterThan(0.72);
  expect(at.left).toBeGreaterThanOrEqual(0);
  expect(at.right).toBeLessThanOrEqual(1);
  if (side === 'left') expect(at.left).toBeLessThan(0.25);
  else expect(at.right).toBeGreaterThan(0.75);
}

// DESIGN.md Card: the flourish (`.face::after`) is drawn unless the bottom band holds a mark.
const flourish = (page: Page, id: number) =>
  tray(page)
    .getByTestId(`card-${id}`)
    .locator('.face')
    .evaluate((el) => getComputedStyle(el, '::after').content);

async function expectEmptyRows(page: Page, tiles: boolean): Promise<void> {
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expect(tray(page).locator('.word-line *')).toHaveCount(0);
  await expect(tray(page).locator('.word-line')).toHaveText('');
  await expect(tray(page).locator('.controls *')).toHaveCount(0);
  await expect(tray(page).locator('.controls')).toHaveText('');
  await expect(tray(page).locator('.tag')).toHaveCount(0);
  if (!tiles) await expect(tray(page).locator('.tiles *')).toHaveCount(0);
}

test('R-30 R-36 R-37 (UI) session-composing: word line TAN with N underlined, tiles 42 0 28m, 3 letters, no tag', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  await expectComposing(page, {
    word: 'TAN',
    letters: ['T', 'A', 'N'],
    underlined: [28],
    ids: ['42', '0', '28m'],
    count: '3 letters',
  });
  await expect(tray(page).locator('.tag')).toHaveCount(0);
  // The underline is destination blue (DESIGN.md Typography word line).
  await expect(tray(page).locator('[data-word-card="28"]')).toHaveCSS(
    'text-decoration-color',
    await tokenColor(page, '--wc-destination'),
  );
});

test('R-33 (UI) a free letter from cell 3: word ONE with E underlined, tag 3 on card-28 only, cell 3 a used mirror', async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-redo-tail', { steps: ['undo'] });
  await expectComposing(page, {
    word: 'ONE',
    letters: ['O', 'N', 'E'],
    underlined: [9],
    ids: ['32', '28', '9m'],
    count: '3 letters',
  });
  await expect(page.getByTestId('card-28').locator('.tag')).toHaveText('3');
  await expect(tray(page).locator('.tag')).toHaveCount(1);
  // Card mode, tray: the tag in the bottom band, left, and no flourish on card 28.
  await expectBand(page, 28, '.tag', 'left');
  expect(await flourish(page, 28)).toBe('none');
  const used = page.getByTestId('wordcell-3').locator('[data-mirror-of="28"]');
  await expect(used).toHaveCount(1);
  await expect(used).toHaveClass(/\bused\b/);
});

// A compact-mode Composing scratch Session (no fixture holds one): session-place committed to
// cell 3 (top 28 N), then S = column 4's tail 14 16 17 18 32, the free letter 28 from cell 3 and
// D = 9 1 27 (k = 3) on the right: 9 tiles, more than one android row.
const COMPACT_SCRATCH = {
  version: 1,
  seed: 1,
  moves: [
    {
      sourceColumn: 3,
      sourceCount: 2,
      destinationColumn: 6,
      destinationCount: 1,
      destinationSide: 'right',
      freeLetters: [],
      arrangement: [42, 0],
      reached: 'committed',
      targetCell: 3,
      placementOrder: [42, 0, 28],
    },
    {
      sourceColumn: 4,
      sourceCount: 5,
      destinationColumn: 6,
      destinationCount: 3,
      destinationSide: 'right',
      freeLetters: [3],
      arrangement: [14, 16, 17, 18, 32, 28],
      reached: 'composing',
    },
  ],
  cursor: { index: 1, phase: 'composing' },
  gaveUp: false,
  activeMs: 0,
};

test("R-33 (UI) compact mode: a free letter's origin tag sits top-left", async ({ page }) => {
  await seedStorage(page, { session: JSON.stringify(COMPACT_SCRATCH) });
  await page.goto('/');
  await expectComposing(page, {
    word: 'GHHIONEAN',
    letters: ['G', 'H', 'H', 'I', 'O', 'N', 'E', 'A', 'N'],
    underlined: [9, 1, 27],
    ids: ['14', '16', '17', '18', '32', '28', '9m', '1m', '27m'],
    count: '9 letters',
  });
  await expect(tray(page).locator('.tiles.compact')).toHaveCount(1);
  await expect(tray(page).getByTestId('card-28')).toHaveAttribute('data-place', 'tray');
  await expect(tray(page).locator('.tag')).toHaveCount(1);
  await expect(tray(page).getByTestId('card-28').locator('.tag')).toHaveText('3');
  await expectCorner(page, 28, '.tag', 'top-left');
  // R-33: the free letter's origin cell shows its used mark.
  await expect(page.getByTestId('wordcell-3').locator('[data-mirror-of="28"]')).toHaveClass(
    /\bused\b/,
  );
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
});

test('R-32 (UI) k = 2: word MAN with A and N underlined, one blue block outline and one lock in the tray', async ({
  page,
}) => {
  const steps: Step[] = ['redo', 'redo'];
  await openFixture(page, 'session-place-free-letter-redo-tail', { steps });
  await expectComposing(page, {
    word: 'MAN',
    letters: ['M', 'A', 'N'],
    underlined: [1, 27],
    ids: ['26', '1m', '27m'],
    count: '3 letters',
  });
  await expect(tray(page).locator('.block.start')).toHaveCount(1);
  await expect(tray(page).locator('[data-mirror-of="1"]')).toHaveClass(/\bstart\b/);
  await expect(tray(page).locator('.block.end')).toHaveCount(1);
  await expect(tray(page).locator('[data-mirror-of="27"]')).toHaveClass(/\bend\b/);
  const blue = await tokenColor(page, '--wc-destination');
  const blockFace = (id: number) => tray(page).locator(`[data-mirror-of="${id}"] .face`);
  for (const id of [1, 27]) {
    await expect(blockFace(id)).toHaveCSS('border-top-color', blue);
    await expect(blockFace(id)).toHaveCSS('border-bottom-color', blue);
  }
  // The outline's open ends: the start face keeps its left border, the end face its right one.
  await expect(blockFace(1)).toHaveCSS('border-left-color', blue);
  await expect(blockFace(27)).toHaveCSS('border-right-color', blue);
  await expect(tray(page).locator('.lock:visible')).toHaveCount(1);
  // Joined edge to edge (Card.svelte `.block`): the start face drops its right border and overlaps
  // the end face, which drops its left border, by 1 px (no seam).
  const join = await tray(page).evaluate((el) => {
    const start = el.querySelector('[data-mirror-of="1"] .face');
    const end = el.querySelector('[data-mirror-of="27"] .face');
    if (start === null || end === null) throw new Error('block faces missing');
    return {
      overlap: start.getBoundingClientRect().right - end.getBoundingClientRect().left,
      startRight: getComputedStyle(start).borderRightWidth,
      endLeft: getComputedStyle(end).borderLeftWidth,
    };
  });
  expect(Math.abs(join.overlap - 1)).toBeLessThanOrEqual(0.5);
  expect(join.startRight).toBe('0px');
  expect(join.endLeft).toBe('0px');
});

// Place matrix rows (plan I/O matrix): word line, strip, the free-letter tag and the meta.
const PLACE_ROWS = [
  {
    fixture: 'session-place',
    word: 'TAN',
    letters: ['T', 'A', 'N'],
    ids: ['42', '0', '28'],
    tag: undefined,
    meta: '3 letters \u2192 cell 3 \u00b7 +9',
  },
  {
    fixture: 'session-place-free-letter-redo-tail',
    word: 'ONE',
    letters: ['O', 'N', 'E'],
    ids: ['9', '32', '28'],
    tag: '3',
    meta: '3 letters \u2192 cell 3 \u00b7 +6',
  },
] as const;

// The Place tray's word line letters with no D underline, and the strip as `ids`.
async function expectPlace(
  page: Page,
  row: { word: string; letters: readonly string[]; ids: readonly string[]; meta: string },
): Promise<void> {
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expect(tray(page).locator('.word-line .word-text')).toHaveText(row.word);
  const letters = await wordLetters(page);
  expect(letters.map((l) => l.text)).toEqual(row.letters);
  expect(letters.filter((l) => l.underlined)).toEqual([]);
  await expect(tray(page).locator('.word-line .d')).toHaveCount(0);
  expect(await trayIds(page)).toEqual(row.ids);
  await expect(tray(page).locator('[data-place="strip"]')).toHaveCount(row.ids.length);
  await expect(tray(page).locator('.controls .meta')).toHaveText(row.meta);
  await expect(tray(page).locator('.controls .count')).toHaveCount(0);
  await expect(tray(page).locator('.controls .left *')).toHaveCount(0);
  // D cards are normal strip tiles: no mirror, no lock, no block outline.
  await expect(tray(page).locator('[data-mirror-of]')).toHaveCount(0);
  await expect(tray(page).locator('.lock:visible')).toHaveCount(0);
  await expect(tray(page).locator('.block')).toHaveCount(0);
}

for (const row of PLACE_ROWS) {
  test(`R-50 R-80 (UI) Place on ${row.fixture}: word line ${row.word}, bottom on the first tile, top and the orange star in the last tile's bottom band, meta`, async ({
    page,
  }) => {
    await openFixture(page, row.fixture);
    await expectPlace(page, row);
    const first = Number(row.ids[0]);
    const last = Number(row.ids.at(-1));
    await expect(tray(page).locator('.tiles.compact')).toHaveCount(0);
    await expect(tray(page).locator('.position')).toHaveCount(2);
    await expect(tray(page).getByTestId(`card-${first}`).locator('.position')).toHaveText('bottom');
    await expectBand(page, first, '.position', 'left');
    await expect(tray(page).getByTestId(`card-${last}`).locator('.position')).toHaveText('top');
    await expectBand(page, last, '.position', 'left');
    await expect(tray(page).locator('.star')).toHaveCount(1);
    await expect(tray(page).getByTestId(`card-${last}`).locator('.star')).toHaveText('\u2605');
    await expectBand(page, last, '.star', 'right');
    // The band marks replace the flourish on the end tiles; the unmarked middle tile keeps it.
    expect(await flourish(page, first)).toBe('none');
    expect(await flourish(page, last)).toBe('none');
    expect(await flourish(page, Number(row.ids[1]))).not.toBe('none');
    // `top` and the star share the band without overlapping.
    const top = await markAt(page, last, '.position');
    const star = await markAt(page, last, '.star');
    expect(top.right).toBeLessThanOrEqual(star.left);
    await expect(tray(page).locator('.star')).toHaveCSS(
      'color',
      await tokenColor(page, '--wc-accent-orange'),
    );
    if (row.tag === undefined) {
      await expect(tray(page).locator('.tag')).toHaveCount(0);
    } else {
      // A-D10: on a full-height strip tile the origin tag moves to the top-left corner.
      await expect(tray(page).locator('.tag')).toHaveCount(1);
      await expect(tray(page).getByTestId(`card-${last}`).locator('.tag')).toHaveText(row.tag);
      await expectCorner(page, last, '.tag', 'top-left');
    }
  });
}

test('R-51 (UI) session-place: the strip in its default placementOrder equals the word order', async ({
  page,
}) => {
  const row = PLACE_ROWS[0];
  await openFixture(page, row.fixture);
  await expectPlace(page, row);
  const letters = await wordLetters(page);
  expect(letters.map((l) => `${l.id}`)).toEqual([...row.ids]);
});

test('R-50 AD-3 (UI) session-place-free-letter-redo-tail: the strip follows placementOrder while the word line reads ONE in word order', async ({
  page,
}) => {
  const row = PLACE_ROWS[1];
  await openFixture(page, row.fixture);
  await expectPlace(page, row);
  const letters = await wordLetters(page);
  // R-30 word order [32, 28, 9]; the strip is placementOrder [9, 32, 28] (fixtures/).
  expect(letters.map((l) => l.id)).toEqual([32, 28, 9]);
  expect(await trayIds(page)).not.toEqual(letters.map((l) => `${l.id}`));
  // D card 9 is a normal strip tile.
  await expect(tray(page).getByTestId('card-9')).toHaveAttribute('data-place', 'strip');
  await expect(tray(page).getByTestId('card-9')).not.toHaveClass(/\b(block|destination)\b/);
});

const COMPACT_STRIP = ['35', '1', '38', '44', '11', '36', '9', '7'];
const QUARTERED = ['QU', 'A', 'R', 'T', 'E', 'R', 'E', 'D'];

// The tray-relative top of each live tile or mirror, in tray order.
const tileTops = (page: Page) =>
  tray(page)
    .locator('.tiles > :not(.wc-caret)')
    .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));

test('R-50 R-33 R-80 (UI) AD-14 session-place-compact: compact strip over two rows with the corner map, QU tag 4, word line QUARTERED and meta', async ({
  page,
}) => {
  await openFixture(page, 'session-place-compact');
  await expectPlace(page, {
    word: 'QUARTERED',
    letters: QUARTERED,
    ids: COMPACT_STRIP,
    meta: '9 letters \u2192 cell 9 \u00b7 +73',
  });
  await expect(tray(page).locator('.tiles.compact')).toHaveCount(1);
  // Two rows of 7 + 1 (DESIGN.md Tray band at 412 px).
  const tops = await tileTops(page);
  expect(new Set(tops.slice(0, 7)).size).toBe(1);
  expect(tops[7]).toBeGreaterThan(tops[0] as number);
  // QU card 35, the first tile: ▼ top-left, ×2 top-right, origin tag 4 bottom-left.
  await expect(tray(page).getByTestId('card-35').locator('.bottom-mark')).toHaveText('\u25bc');
  await expectCorner(page, 35, '.bottom-mark', 'top-left');
  await expectCorner(page, 35, '.badge', 'top-right');
  await expect(tray(page).locator('.tag')).toHaveCount(1);
  await expect(tray(page).getByTestId('card-35').locator('.tag')).toHaveText('4');
  await expectCorner(page, 35, '.tag', 'bottom-left');
  // The last tile, 7: the orange ★ top-left.
  await expect(tray(page).locator('.star')).toHaveCount(1);
  await expect(tray(page).getByTestId('card-7').locator('.star')).toHaveText('\u2605');
  await expectCorner(page, 7, '.star', 'top-left');
  await expect(tray(page).locator('.star')).toHaveCSS(
    'color',
    await tokenColor(page, '--wc-accent-orange'),
  );
  // Compact glyphs replace the `bottom`/`top` words.
  await expect(tray(page).locator('.position')).toHaveCount(0);
  expect(await tray(page).locator('.tiles').textContent()).not.toMatch(/bottom|top/);
  // R-33: free letter 35's origin cell 4 shows its used mark.
  await expect(page.getByTestId('wordcell-4').locator('[data-mirror-of="35"]')).toHaveClass(
    /\bused\b/,
  );
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
});

test('R-32 R-33 R-30 R-36 R-37 (UI) AD-14 session-place-compact after one Undo: compact Composing marks, QU tag 4 top-left, the D block in two segments across the row break', async ({
  page,
}) => {
  await openFixture(page, 'session-place-compact', { steps: ['undo'] });
  await expectComposing(page, {
    word: 'QUARTERED',
    letters: QUARTERED,
    underlined: [36, 9, 7],
    ids: ['35', '1', '38', '44', '11', '36m', '9m', '7m'],
    count: '9 letters',
  });
  await expect(tray(page).locator('.tiles.compact')).toHaveCount(1);
  // QU one unit in the word line (R-37), from free letter 35 of cell 4.
  const qu = tray(page).locator('.word-text [data-word-card="35"]');
  await expect(qu).toHaveCount(1);
  await expect(qu).toHaveText('QU');
  await expect(tray(page).getByTestId('card-35')).toHaveAttribute('data-place', 'tray');
  await expect(tray(page).locator('.tag')).toHaveCount(1);
  await expect(tray(page).getByTestId('card-35').locator('.tag')).toHaveText('4');
  await expectCorner(page, 35, '.tag', 'top-left');
  await expectCorner(page, 35, '.badge', 'top-right');
  await expect(tray(page).locator('.star, .bottom-mark, .position')).toHaveCount(0);
  // R-32: block 36m 9m on row 1 (tray indices 5–6), 7m alone on row 2; one outline and lock each.
  const tops = await tileTops(page);
  expect(tops[5]).toBe(tops[0]);
  expect(tops[6]).toBe(tops[0]);
  expect(tops[7]).toBeGreaterThan(tops[0] as number);
  // Segment 1 (row 1) is 36m start and 9m end, segment 2 (row 2) is 7m, both; each segment end
  // draws a non-zero computed border and each start mirror shows its one lock.
  const blockFace = (id: number) => tray(page).locator(`[data-mirror-of="${id}"] .face`);
  const shownLock = (id: number) => tray(page).locator(`[data-mirror-of="${id}"] .lock:visible`);
  for (const id of [36, 9, 7]) {
    await expect(tray(page).locator(`[data-mirror-of="${id}"]`)).toHaveCount(1);
  }
  await expect(blockFace(36)).not.toHaveCSS('border-left-width', '0px');
  await expect(blockFace(9)).not.toHaveCSS('border-right-width', '0px');
  await expect(blockFace(7)).not.toHaveCSS('border-left-width', '0px');
  await expect(blockFace(7)).not.toHaveCSS('border-right-width', '0px');
  await expect(shownLock(36)).toHaveCount(1);
  await expect(shownLock(9)).toHaveCount(0);
  await expect(shownLock(7)).toHaveCount(1);
  await expect(tray(page).locator('.lock:visible')).toHaveCount(2);
  // R-33: free letter 35's origin cell 4 shows its used mark.
  await expect(page.getByTestId('wordcell-4').locator('[data-mirror-of="35"]')).toHaveClass(
    /\bused\b/,
  );
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
});

test('R-38 (UI) a failed Validate replaces the word line with the invalid line: textContent invalidWord(tan), a space before the suffix', async ({
  page,
}) => {
  await page.route(LIST, (route) => route.fulfill({ status: 200, body: 'cat\ndog\n' }));
  await openFixture(page, 'session-composing');
  await waitForDictionary(page, 'ready');
  await page.getByTestId('primary-action').click();
  const text = tray(page).locator('.word-line .invalid .text');
  await expect(text).toBeVisible();
  expect(await text.evaluate((el) => el.textContent)).toBe("TAN isn't in the word list.");
  await expect(tray(page).locator('.word-line .word-text')).toHaveCount(0);
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  // The space renders: the suffix starts right of the word's end.
  const gap = await text.evaluate((el) => {
    const word = el.querySelector('.word')?.getBoundingClientRect();
    const suffix = el.querySelector('.suffix')?.getBoundingClientRect();
    if (word === undefined || suffix === undefined) throw new Error('invalid line parts missing');
    return suffix.left - word.right;
  });
  expect(gap).toBeGreaterThan(2);
  // The word → invalid switch refits to the invalid max: 14…16 px, the suffix whole in the line.
  await expect.poll(() => fontSize(page, '.invalid .text')).toBeLessThanOrEqual(16);
  expect(await fontSize(page, '.invalid .text')).toBeGreaterThanOrEqual(14);
  expect(await suffixOverflow(page)).toBeLessThanOrEqual(0.5);
});

for (const fixture of ['session-idle-pending-draft', 'session-won', 'session-gave-up']) {
  test(`AD-14 ${fixture}: word line, tiles and control row empty`, async ({ page }) => {
    await openFixture(page, fixture);
    await expectEmptyRows(page, false);
    expect(await trayIds(page)).toEqual([]);
  });
}

test('AD-11 the word line fits without overflow at a computed size within 14…20 px', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  const line = tray(page).locator('.word-line .word-text');
  await expect(line).toHaveText('TAN');
  const measured = await line.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    size: Number.parseFloat(getComputedStyle(el).fontSize),
  }));
  expect(measured.scrollWidth).toBeLessThanOrEqual(measured.clientWidth);
  expect(measured.size).toBeGreaterThanOrEqual(14);
  expect(measured.size).toBeLessThanOrEqual(20);
});

test('AD-14 an Undo from session-composing remounts card 0: the column-3 ghost handle is detached and card-0 is live in column 3', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  const ghost = await page.getByTestId('column-3').locator('[data-mirror-of="0"]').elementHandle();
  if (ghost === null) throw new Error('no column-3 ghost of card 0');
  await page.getByTestId('undo').click();
  await expect(page.getByTestId('column-3').getByTestId('card-0')).toHaveAttribute(
    'data-place',
    'column',
  );
  expect(await ghost.evaluate((el) => el.isConnected)).toBe(false);
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
});

test('AD-14 an Undo from Place remounts the D card: the column-6 ghost handle is detached and card-28 is live; a Redo remounts it as a ghost', async ({
  page,
}) => {
  await openFixture(page, 'session-place');
  const column6 = page.getByTestId('column-6');
  await expect(column6.locator('[data-mirror-of="28"]')).toHaveCount(1);
  await expect(column6.getByTestId('card-28')).toHaveCount(0);
  const ghost = await column6.locator('[data-mirror-of="28"]').elementHandle();
  if (ghost === null) throw new Error('no column-6 ghost of card 28');
  await page.getByTestId('undo').click();
  await expect(column6.getByTestId('card-28')).toHaveAttribute('data-place', 'column');
  expect(await ghost.evaluate((el) => el.isConnected)).toBe(false);
  await expect(column6.locator('[data-mirror-of="28"]')).toHaveCount(0);
  const live = await column6.getByTestId('card-28').elementHandle();
  if (live === null) throw new Error('no live card 28 in column 6');
  await page.getByTestId('redo').click();
  await expect(column6.locator('[data-mirror-of="28"]')).toHaveCount(1);
  expect(await live.evaluate((el) => el.isConnected)).toBe(false);
  await expect(column6.getByTestId('card-28')).toHaveCount(0);
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
});

// Narrows the tray's word-line slot so the word line's ResizeObserver refits.
const narrow = (page: Page, px: number) =>
  tray(page)
    .locator('.word-line')
    .evaluate((el, width) => {
      (el as HTMLElement).style.width = `${width}px`;
    }, px);

const fontSize = (page: Page, selector: string) =>
  tray(page)
    .locator(selector)
    .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

// How far the invalid line's suffix ends past the word line's (WordLine root's) right edge.
const suffixOverflow = (page: Page) =>
  tray(page)
    .locator('.word-line .line')
    .evaluate((line) => {
      const suffix = line.querySelector('.suffix');
      if (suffix === null) throw new Error('invalid line suffix missing');
      return suffix.getBoundingClientRect().right - line.getBoundingClientRect().right;
    });

// The word line's measured geometry, either branch: the text's x offset in the line (the invalid
// line's ✕ glyph and gap; 0 for the word line), the line's width, and the text's natural nowrap
// width at each px 14…20 (`natural[px]`) on a detached clone under `wc-measuring`; for the invalid
// line also its space and suffix spans' natural widths at 14 px.
const lineGeometry = (page: Page) =>
  tray(page)
    .locator('.word-line .line')
    .evaluate((line) => {
      const host = line.querySelector('.invalid') ?? line.querySelector('.word-text');
      const live = line.querySelector('.text');
      if (host === null || live === null) throw new Error('word line text missing');
      const probeAt = (px: number) => {
        const probe = host.cloneNode(true) as HTMLElement;
        probe.style.cssText = 'position:absolute;left:0;top:0;width:max-content;visibility:hidden';
        const text = (probe.matches('.text') ? probe : probe.querySelector('.text')) as HTMLElement;
        text.classList.add('wc-measuring');
        text.style.fontSize = `${px}px`;
        document.body.append(probe);
        try {
          const width = (selector: string) =>
            probe.querySelector(selector)?.getBoundingClientRect().width ?? 0;
          return {
            text: text.getBoundingClientRect().width,
            space: width('.space'),
            suffix: width('.suffix'),
          };
        } finally {
          probe.remove();
        }
      };
      const natural: number[] = [];
      for (let px = 14; px <= 20; px++) natural[px] = probeAt(px).text;
      const at14 = probeAt(14);
      return {
        offset: live.getBoundingClientRect().left - line.getBoundingClientRect().left,
        lineWidth: line.clientWidth,
        natural,
        space14: at14.space,
        suffix14: at14.suffix,
      };
    });

type LineGeometry = Awaited<ReturnType<typeof lineGeometry>>;

// The invalid line's geometry with its natural widths at 14 and 16 px.
const invalidGeometry = async (page: Page) => {
  const g = await lineGeometry(page);
  return { ...g, at14: g.natural[14] as number, at16: g.natural[16] as number };
};

// AD-11 Fit from in-browser measurements: the largest integer px in 14…max whose natural width
// fits the line minus the offset, else 14 (never a literal text-dependent size, epic 4 F11).
function fitted(g: LineGeometry, max: number): number {
  for (let px = max; px > 14; px--)
    if ((g.natural[px] as number) <= g.lineWidth - g.offset) return px;
  return 14;
}

const measuring = (page: Page) => tray(page).locator('.wc-measuring');

test('AD-11 a narrowed word line shrinks below 20 px and not below 14 px', async ({ page }) => {
  await openFixture(page, 'session-composing');
  await expect(tray(page).locator('.word-text')).toHaveText('TAN');
  await narrow(page, 30);
  await expect.poll(() => fontSize(page, '.word-text')).toBeLessThan(20);
  expect(await fontSize(page, '.word-text')).toBeGreaterThanOrEqual(14);
  // The size is the largest that fits the measured natural widths.
  expect(await fontSize(page, '.word-text')).toBe(fitted(await lineGeometry(page), 20));
  await expect(measuring(page)).toHaveCount(0);
});

// AD-11 (R-30) Fit measures the line's fractional width: a `clientWidth` rounds up (a 33.6 px line
// reads 34), so fitting against it chose a size whose text overflows the true width. The line is
// set to a width just under the natural width at s + 1 px, with a fraction ≥ .5, so `clientWidth`
// rounds up past the text (ticket 5.14 S19).
test('AD-11 (R-30) a word line of fractional width, whose clientWidth rounds up past the next size, fits at the largest size its true width holds', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  const line = tray(page).locator('.word-line .line');
  await expect(tray(page).locator('.word-text')).toHaveText('TAN');
  const g = await lineGeometry(page);
  // The first size s whose next size's natural width has a fraction in (.55, 1) and is wider than
  // s's, so the width `natural[s + 1] - .01` is fractional ≥ .5 and holds s but not s + 1.
  let size: number | undefined;
  for (let px = 14; px < 20 && size === undefined; px++) {
    const next = g.natural[px + 1] as number;
    if (next % 1 > 0.55 && (g.natural[px] as number) <= next - 0.01) size = px;
  }
  if (size === undefined) throw new Error('no size 14…19 with a fractional next natural width');
  const width = (g.natural[size + 1] as number) - 0.01;
  await narrow(page, width);
  await expect.poll(() => fontSize(page, '.word-text')).toBe(size);
  const read = await line.evaluate((el) => ({
    width: el.getBoundingClientRect().width,
    clientWidth: el.clientWidth,
  }));
  expect(Math.abs(read.width - width)).toBeLessThan(0.05);
  // The premise: the integer clientWidth reaches the text that does not fit the true width.
  expect(read.clientWidth).toBeGreaterThanOrEqual(g.natural[size + 1] as number);
  expect(g.natural[size] as number).toBeLessThanOrEqual(read.width);
  expect(g.natural[size + 1] as number).toBeGreaterThan(read.width);
  await expect(measuring(page)).toHaveCount(0);
});

// Stubs the word list without TAN, then Validates session-composing: the R-38 invalid line.
async function invalidTan(page: Page): Promise<void> {
  await page.route(LIST, (route) => route.fulfill({ status: 200, body: 'cat\ndog\n' }));
  await openFixture(page, 'session-composing');
  await waitForDictionary(page, 'ready');
  await page.getByTestId('primary-action').click();
  await expect(tray(page).locator('.invalid .text')).toBeVisible();
}

test('AD-11 (R-38) a narrowed invalid line shrinks below 16 px and not below 14 px; the suffix is never truncated', async ({
  page,
}) => {
  await invalidTan(page);
  const text = tray(page).locator('.invalid .text');
  // A width where the line fits at 14 px but not at 16 px, from the measured natural widths.
  const g = await invalidGeometry(page);
  expect(g.at16 - g.at14).toBeGreaterThan(4);
  await narrow(page, Math.round(g.offset + (g.at14 + g.at16) / 2));
  await expect.poll(() => fontSize(page, '.invalid .text')).toBeLessThan(16);
  expect(await fontSize(page, '.invalid .text')).toBeGreaterThanOrEqual(14);
  expect(await fontSize(page, '.invalid .text')).toBe(fitted(await lineGeometry(page), 16));
  expect(await suffixOverflow(page)).toBeLessThanOrEqual(0.5);
  expect(await text.evaluate((el) => el.textContent)).toBe("TAN isn't in the word list.");
  await expect(measuring(page)).toHaveCount(0);
});

test('AD-11 (R-38) below the 14 px width only the word span ellipsizes; the suffix is never truncated', async ({
  page,
}) => {
  await invalidTan(page);
  const text = tray(page).locator('.invalid .text');
  // The ✕ glyph and gap, the space and the suffix at 14 px, plus 8 px of word: below the 14 px width.
  const g = await invalidGeometry(page);
  const width = Math.round(g.offset + g.space14 + g.suffix14 + 8);
  expect(width).toBeLessThan(g.offset + g.at14);
  await narrow(page, width);
  await expect.poll(() => fontSize(page, '.invalid .text')).toBe(14);
  const word = await text.evaluate((el) => {
    const span = el.querySelector('.word') as HTMLElement;
    const space = el.querySelector('.space') as HTMLElement;
    const style = getComputedStyle(span);
    return {
      scrollWidth: span.scrollWidth,
      clientWidth: span.clientWidth,
      overflowX: style.overflowX,
      textOverflow: style.textOverflow,
      right: span.getBoundingClientRect().right,
      spaceLeft: space.getBoundingClientRect().left,
    };
  });
  expect(word.scrollWidth).toBeGreaterThan(word.clientWidth);
  // The overflow is clipped with an ellipsis and never paints over the space or suffix.
  expect(word.overflowX).toBe('hidden');
  expect(word.textOverflow).toBe('ellipsis');
  expect(word.right).toBeLessThanOrEqual(word.spaceLeft + 0.5);
  expect(await suffixOverflow(page)).toBeLessThanOrEqual(0.5);
  const suffix = await text.evaluate((el) => {
    const span = el.querySelector('.suffix') as HTMLElement;
    return { scrollWidth: span.scrollWidth, clientWidth: span.clientWidth };
  });
  expect(suffix.scrollWidth).toBeLessThanOrEqual(suffix.clientWidth);
  expect(await text.evaluate((el) => el.textContent)).toBe("TAN isn't in the word list.");
  await expect(measuring(page)).toHaveCount(0);
});

// R-31: on session-composing the card above the top of D (column 6 index 4) raises k to 2.
const raiseK = async (page: Page) => {
  const dest = cards(page, 6);
  const p = await centre(dest.nth(4));
  await page.touchscreen.tap(p.x, p.y);
};

test('AD-11 (R-31) a longer word while the line stays mounted re-measures: below 20 px, not below 14 px', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  const line = tray(page).locator('.word-text');
  await expect(line).toHaveText('TAN');
  // TAN fits at 20 px with 2 px to spare; a fourth letter does not.
  const before = await lineGeometry(page);
  await narrow(page, Math.ceil((before.natural[20] as number) + 2));
  await animationFrames(page, 2);
  expect(await fontSize(page, '.word-text')).toBe(20);
  await raiseK(page);
  await expect(line).toHaveText(K2_WORD);
  await expect.poll(() => fontSize(page, '.word-text')).toBeLessThan(20);
  expect(await fontSize(page, '.word-text')).toBeGreaterThanOrEqual(14);
  expect(await fontSize(page, '.word-text')).toBe(fitted(await lineGeometry(page), 20));
  await expect(measuring(page)).toHaveCount(0);
});

test('AD-11 (R-38 R-31) invalid → word: a destination tap clears the invalid line and the new word refits to its 20 px max', async ({
  page,
}) => {
  await invalidTan(page);
  await expect.poll(() => fontSize(page, '.invalid .text')).toBeLessThanOrEqual(16);
  await raiseK(page);
  const line = tray(page).locator('.word-line .word-text');
  await expect(line).toHaveText(K2_WORD);
  await expect(tray(page).locator('.word-line .invalid')).toHaveCount(0);
  const g = await lineGeometry(page);
  expect(g.natural[20]).toBeLessThanOrEqual(g.lineWidth);
  await expect.poll(() => fontSize(page, '.word-text')).toBe(fitted(g, 20));
  expect(fitted(g, 20)).toBe(20);
  const overflow = await line.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(measuring(page)).toHaveCount(0);
});

// The resize itself forces the shrink: the slot is `calc(100% - N px)`, N chosen from the line
// widths measured at both viewports so that the line fits at 16 px before and only between 14 and
// 16 px at 360 px (DESIGN.md A-D3 minimum).
test('AD-11 (R-38) a viewport narrowed to 360 px refits the invalid line below 16 px: the suffix whole in the line', async ({
  page,
}) => {
  await invalidTan(page);
  const viewport = page.viewportSize();
  if (viewport === null) throw new Error('no viewport');
  const wide = await invalidGeometry(page);
  await page.setViewportSize({ width: 360, height: viewport.height });
  await expect
    .poll(async () => (await invalidGeometry(page)).lineWidth)
    .toBeLessThan(wide.lineWidth);
  const at360 = (await invalidGeometry(page)).lineWidth;
  await page.setViewportSize(viewport);
  await expect.poll(async () => (await invalidGeometry(page)).lineWidth).toBe(wide.lineWidth);
  const mid = (wide.at14 + wide.at16) / 2;
  const n = Math.round(at360 - wide.offset - mid);
  expect(wide.lineWidth - n - wide.offset).toBeGreaterThan(wide.at16 + 1);
  await tray(page)
    .locator('.word-line')
    .evaluate((el, px) => {
      (el as HTMLElement).style.width = `calc(100% - ${px}px)`;
    }, n);
  await expect.poll(() => fontSize(page, '.invalid .text')).toBe(16);
  await page.setViewportSize({ width: 360, height: viewport.height });
  await expect.poll(() => fontSize(page, '.invalid .text')).toBeLessThan(16);
  expect(await fontSize(page, '.invalid .text')).toBeGreaterThanOrEqual(14);
  expect(await fontSize(page, '.invalid .text')).toBe(fitted(await lineGeometry(page), 16));
  expect(await suffixOverflow(page)).toBeLessThanOrEqual(0.5);
  await expect(measuring(page)).toHaveCount(0);
});

test("AD-14 an Undo from Composing to Idle remounts cell 3's top: the used-mirror handle is detached and card-28 is live in wordcell-3", async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-redo-tail', { steps: ['undo'] });
  await expect(page.getByTestId('card-28')).toHaveAttribute('data-place', 'tray');
  const used = await page
    .getByTestId('wordcell-3')
    .locator('[data-mirror-of="28"]')
    .elementHandle();
  if (used === null) throw new Error('no used mirror of card 28 in wordcell-3');
  await page.getByTestId('undo').click();
  await expect(page.getByTestId('wordcell-3').getByTestId('card-28')).toHaveAttribute(
    'data-place',
    'cell',
  );
  expect(await used.evaluate((el) => el.isConnected)).toBe(false);
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
});

// The plan's Design Notes ×2 badge scratch Session: block 23m 35m 8m puts QU on a middle tile.
// Column 3 of seed 1 is 23 L, 35 QU, 8 E, 21 J, 2 A, 42 T, 0 A (top → bottom).
const BADGE_SCRATCH = {
  version: 1,
  seed: 1,
  moves: [
    {
      sourceColumn: 3,
      sourceCount: 4,
      destinationColumn: 3,
      destinationCount: 3,
      destinationSide: 'left',
      freeLetters: [],
      arrangement: [21, 2, 42, 0],
      reached: 'composing',
    },
  ],
  cursor: { index: 0, phase: 'composing' },
  gaveUp: false,
  activeMs: 0,
};

// BADGE_SCRATCH variants placing QU on each block tile position (R-30 tray order, R-31 k).
const BADGE_VARIANTS = [
  { tile: 'middle', move: {}, word: 'LQUEJATA', count: '8 letters', start: false, end: false },
  {
    tile: 'first',
    move: { destinationCount: 2 },
    word: 'QUEJATA',
    count: '7 letters',
    start: true,
    end: false,
  },
  {
    tile: 'last',
    move: { destinationCount: 2, destinationSide: 'right' },
    word: 'JATAEQU',
    count: '7 letters',
    start: false,
    end: true,
  },
  {
    tile: 'single (k = 1)',
    move: { sourceCount: 5, destinationCount: 1, arrangement: [8, 21, 2, 42, 0] },
    word: 'QUEJATA',
    count: '7 letters',
    start: true,
    end: true,
  },
] as const;

for (const variant of BADGE_VARIANTS) {
  test(`AD-14 (Q-06) the ×2 badge on a ${variant.tile} block tile ends at its wrapper x + tileWidth; QU is one underlined unit`, async ({
    page,
  }) => {
    const session = {
      ...BADGE_SCRATCH,
      moves: [{ ...BADGE_SCRATCH.moves[0], ...variant.move }],
    };
    await seedStorage(page, { session: JSON.stringify(session) });
    await page.goto('/');
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    await expect(tray(page).locator('.word-text')).toHaveText(variant.word);
    // R-36: QU counts 2.
    await expect(tray(page).locator('.controls .count')).toHaveText(variant.count);
    const mirror = tray(page).locator('[data-mirror-of="35"]');
    await expect(mirror).toHaveClass(/\bblock\b/);
    await expect(mirror).toHaveClass(variant.start ? /\bstart\b/ : /^(?!.*\bstart\b)/);
    await expect(mirror).toHaveClass(variant.end ? /\bend\b/ : /^(?!.*\bend\b)/);
    const geometry = await tray(page).evaluate((el) => {
      const live = el.querySelector('[data-card-id] .face');
      const wrapper = el.querySelector('[data-mirror-of="35"]');
      const face = wrapper?.querySelector('.face');
      const badge = wrapper?.querySelector('.badge');
      if (live == null || wrapper == null || face == null || badge == null)
        throw new Error('scratch tray missing');
      const b = badge.getBoundingClientRect();
      return {
        tileWidth: live.getBoundingClientRect().width,
        left: wrapper.getBoundingClientRect().left,
        right: b.right,
        width: b.width,
        height: b.height,
        top: b.top,
        // `.block .badge { top: 0 }` is the face's padding edge: its border-box top + top border.
        faceTop:
          face.getBoundingClientRect().top +
          Number.parseFloat(getComputedStyle(face).borderTopWidth),
      };
    });
    expect(Math.abs(geometry.right - (geometry.left + geometry.tileWidth))).toBeLessThanOrEqual(
      0.5,
    );
    expect(Math.abs(geometry.width - 18)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(geometry.height - 12)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(geometry.top - geometry.faceTop)).toBeLessThanOrEqual(0.5);
    const qu = tray(page).locator('.word-text [data-word-card="35"]');
    await expect(qu).toHaveCount(1);
    await expect(qu).toHaveText('QU');
    await expect(qu).toHaveClass(/\bd\b/);
  });
}
