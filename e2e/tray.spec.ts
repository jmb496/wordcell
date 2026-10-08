import { expect, type Page, test } from '@playwright/test';
import { openFixture, type Step, trayIds } from './helpers/board';
import { waitForDictionary } from './helpers/restore';
import { seedStorage } from './helpers/seed';
import { tokenColor } from './helpers/style';

// Epic 5 entry 1: the Composing tray (DESIGN.md Tray band, Tile, Invalid-word message). Expected
// values are literals from view() over the fixtures (seed 1; the plan's I/O matrix), never edited
// to pass. Card → letter from src/engine/lang/en.ts.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'tray rendering runs on android');
});

const LIST = '**/en*.txt';
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
  await expect(tray(page).locator('.controls .left')).toBeEmpty();
  await expect(tray(page).locator('.controls .left *')).toHaveCount(0);
}

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
  const used = page.getByTestId('wordcell-3').locator('[data-mirror-of="28"]');
  await expect(used).toHaveCount(1);
  await expect(used).toHaveClass(/\bused\b/);
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
  for (const id of [1, 27]) {
    await expect(tray(page).locator(`[data-mirror-of="${id}"] .face`)).toHaveCSS(
      'border-top-color',
      blue,
    );
  }
  await expect(tray(page).locator('.lock')).toHaveCount(1);
});

for (const [fixture, ids] of [
  ['session-place', ['42', '0', '28']],
  ['session-place-free-letter-redo-tail', ['9', '32', '28']],
] as const) {
  test(`AD-14 (R-30) Place on ${fixture}: the strip as built, no word line, tag or count`, async ({
    page,
  }) => {
    await openFixture(page, fixture);
    await expectEmptyRows(page, true);
    expect(await trayIds(page)).toEqual(ids);
  });
}

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

test('AD-11 a narrowed word line shrinks below 20 px and not below 14 px', async ({ page }) => {
  await openFixture(page, 'session-composing');
  await expect(tray(page).locator('.word-text')).toHaveText('TAN');
  await narrow(page, 30);
  await expect.poll(() => fontSize(page, '.word-text')).toBeLessThan(20);
  expect(await fontSize(page, '.word-text')).toBeGreaterThanOrEqual(14);
});

test('AD-11 (R-38) a narrowed invalid line shrinks below 16 px and not below 14 px; the suffix is never truncated', async ({
  page,
}) => {
  await page.route(LIST, (route) => route.fulfill({ status: 200, body: 'cat\ndog\n' }));
  await openFixture(page, 'session-composing');
  await waitForDictionary(page, 'ready');
  await page.getByTestId('primary-action').click();
  const text = tray(page).locator('.invalid .text');
  await expect(text).toBeVisible();
  await narrow(page, 120);
  await expect.poll(() => fontSize(page, '.invalid .text')).toBeLessThan(16);
  expect(await fontSize(page, '.invalid .text')).toBeGreaterThanOrEqual(14);
  const suffix = await text
    .locator('.suffix')
    .evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
  expect(suffix.scroll).toBeLessThanOrEqual(suffix.client);
  expect(await text.evaluate((el) => el.textContent)).toBe("TAN isn't in the word list.");
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

test('AD-14 (Q-06) the ×2 badge on a middle block tile ends at its wrapper x + tileWidth; QU is one underlined unit', async ({
  page,
}) => {
  await seedStorage(page, { session: JSON.stringify(BADGE_SCRATCH) });
  await page.goto('/');
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expect(tray(page).locator('.word-text')).toHaveText('LQUEJATA');
  const mirror = tray(page).locator('[data-mirror-of="35"]');
  await expect(mirror).toHaveClass(/\bblock\b/);
  await expect(mirror).not.toHaveClass(/\bend\b/);
  const geometry = await tray(page).evaluate((el) => {
    const live = el.querySelector('[data-card-id] .face');
    const wrapper = el.querySelector('[data-mirror-of="35"]');
    const badge = wrapper?.querySelector('.badge');
    if (live == null || wrapper == null || badge == null) throw new Error('scratch tray missing');
    return {
      tileWidth: live.getBoundingClientRect().width,
      left: wrapper.getBoundingClientRect().left,
      right: badge.getBoundingClientRect().right,
    };
  });
  expect(Math.abs(geometry.right - (geometry.left + geometry.tileWidth))).toBeLessThanOrEqual(0.5);
  const qu = tray(page).locator('.word-text [data-word-card="35"]');
  await expect(qu).toHaveCount(1);
  await expect(qu).toHaveText('QU');
  await expect(qu).toHaveClass(/\bd\b/);
});
