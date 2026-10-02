import { expect, type Page, test } from '@playwright/test';
import { fixture, seedStorage } from './helpers/seed';

// Epic 4 entry 2: the Board over BAND_ORDER (AD-11), its cards (AD-14, F26) and the bars.
// Expected values are literals from view(parseSession(<fixture>), EN).

async function openFixture(page: Page, name: string): Promise<void> {
  await seedStorage(page, { session: fixture(`${name}.json`) });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
}

function box(page: Page, selector: string) {
  return page.locator(selector).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, right: r.right, width: r.width, height: r.height };
  });
}

const score = (page: Page) => page.getByText(/^Score /);

test('AD-17 F11 geometry: faces 46 × 61, slot 50, board 400, strip 44, no document scroll', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'android', 'AD-17 Pixel 7 geometry runs on android');
  await openFixture(page, 'session-idle-fresh');
  const face = await box(page, '[data-testid="card-24"] .face');
  expect({ width: face.width, height: face.height }).toEqual({ width: 46, height: 61 });
  for (let n = 1; n <= 8; n++) {
    expect((await box(page, `[data-testid="column-${n}"]`)).width).toBe(50);
  }
  const first = await box(page, '[data-testid="column-1"]');
  const last = await box(page, '[data-testid="column-8"]');
  expect(last.right - first.left).toBe(400);
  const tops = await page
    .getByTestId('column-1')
    .locator('[data-card-id]')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
  for (let i = 1; i < tops.length; i++)
    expect((tops[i] as number) - (tops[i - 1] as number)).toBe(44);
  const sizes = await page.evaluate(() => ({
    bands: [...document.querySelectorAll('[data-band]')].reduce(
      (sum, el) => sum + el.getBoundingClientRect().height,
      0,
    ),
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
  }));
  expect(sizes).toEqual({ bands: 839, scrollHeight: 839, innerHeight: 839 });
});

for (const [name, expected] of [
  ['session-idle-fresh', 'Score 0'],
  ['session-place', 'Score 0'],
  ['session-won', 'Score 355'],
  ['session-gave-up', 'Score \u2212530'],
] as const) {
  test(`R-82 (UI) the top bar shows ${expected} on ${name}`, async ({ page }) => {
    await openFixture(page, name);
    await expect(score(page)).toHaveText(expected);
  });
}

test('R-82 (UI) the live score follows a Redo across a commit', async ({ page }) => {
  await openFixture(page, 'session-place-free-letter-redo-tail');
  await expect(score(page)).toHaveText('Score 9');
  const redo = page.getByRole('button', { name: 'Redo', exact: true });
  for (const expected of ['Score 15', 'Score 15', 'Score 15', 'Score 24']) {
    await redo.click();
    await expect(score(page)).toHaveText(expected);
  }
});

const undo = (page: Page) => page.getByRole('button', { name: 'Undo', exact: true });
const redo = (page: Page) => page.getByRole('button', { name: 'Redo', exact: true });

for (const [name, canUndo] of [
  ['session-idle-fresh', false],
  ['session-won', true],
  ['session-gave-up', true],
] as const) {
  test(`R-70/R-71 Undo ${canUndo ? 'enabled' : 'disabled'} and Redo disabled on ${name}`, async ({
    page,
  }) => {
    await openFixture(page, name);
    if (canUndo) await expect(undo(page)).toBeEnabled();
    else await expect(undo(page)).toBeDisabled();
    await expect(redo(page)).toBeDisabled();
  });
}

test('R-70/R-71 Undo and Redo enabled on a redo tail, Redo disabled at its end', async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-redo-tail');
  await expect(undo(page)).toBeEnabled();
  await expect(redo(page)).toBeEnabled();
  for (let i = 0; i < 4; i++) {
    await expect(redo(page)).toBeEnabled();
    await redo(page).click();
  }
  await expect(redo(page)).toBeDisabled();
  await expect(undo(page)).toBeEnabled();
});

for (const name of ['session-idle-fresh', 'session-won', 'session-gave-up']) {
  test(`AD-14 one live element per card on ${name}`, async ({ page }) => {
    await openFixture(page, name);
    const ids = await page
      .locator('[data-card-id]')
      .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-card-id'))));
    expect(ids.toSorted((a, b) => a - b)).toEqual(Array.from({ length: 52 }, (_, i) => i));
    const places = await page.evaluate(() => {
      const of = (selector: string) =>
        [...document.querySelectorAll(`${selector} [data-card-id]`)].map((el) =>
          el.getAttribute('data-place'),
        );
      return {
        column: of('[data-column]'),
        cell: of('[data-wordcell]'),
        all: document.querySelectorAll('[data-card-id]').length,
      };
    });
    expect(places.column.every((place) => place === 'column')).toBe(true);
    expect(places.cell.every((place) => place === 'cell')).toBe(true);
    expect(places.column.length + places.cell.length).toBe(places.all);
    await expect(page.locator('[data-mirror-of]')).toHaveCount(0);
  });
}

async function footTopsMatch(page: Page): Promise<void> {
  const bandTop = (await box(page, '[data-band="footRow"]')).top;
  for (let n = 1; n <= 8; n++) {
    expect((await box(page, `[data-testid="foot-${n}"]`)).top, `foot-${n}`).toBe(bandTop);
  }
}

test('AD-17 board render rules on session-idle-fresh: no placeholder, foot pads in the foot row', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-fresh');
  await expect(page.locator('.placeholder:visible')).toHaveCount(0);
  await footTopsMatch(page);
  // Q-06 the QU card (column 3, second from the top) carries the ×2 badge outside its glyph.
  const qu = page.getByTestId('column-3').locator('[data-card-id]').nth(1);
  await expect(qu.locator('.badge')).toHaveText('\u00d72');
  await expect(qu.locator('.glyph')).toHaveText('Qu', { useInnerText: true });
  expect(await qu.locator('.glyph').textContent()).toBe('Qu');
  await expect(page.locator('[data-card-id] .badge')).toHaveCount(1);
  // Rule 4: card wrappers take no browser touch or selection gestures.
  const columnCard = page.getByTestId('column-1').locator('[data-card-id]').first();
  await expect(columnCard).toHaveCSS('touch-action', 'none');
  await expect(columnCard).toHaveCSS('user-select', 'none');
});

test('AD-17 board render rules on session-won: count badges, placeholders, foot pads, bar details', async ({
  page,
}) => {
  const desktop = test.info().project.name === 'desktop';
  await openFixture(page, 'session-won');
  for (const [cell, count] of [
    [6, '24'],
    [7, '21'],
    [8, '7'],
  ] as const) {
    await expect(page.getByTestId(`wordcell-${cell}`).locator('.count')).toHaveText(count);
  }
  await expect(page.getByTestId('wordcell-3').locator('.count')).toHaveCount(0);
  const cellCard = page.getByTestId('wordcell-8').locator('[data-card-id]').last();
  await expect(cellCard).toHaveCSS('touch-action', 'none');
  await expect(cellCard).toHaveCSS('user-select', 'none');
  await expect(page.locator('.placeholder:visible')).toHaveCount(8);
  await footTopsMatch(page);
  for (let n = 1; n <= 8; n++) {
    await expect(page.getByTestId(`foot-${n}`)).toHaveText(desktop ? String(n) : '', {
      useInnerText: true,
    });
  }
  await expect(undo(page)).toHaveAttribute('title', 'Undo');
  await expect(redo(page)).toHaveAttribute('title', 'Redo');
  await expect(score(page)).toHaveCSS('font-variant-numeric', 'tabular-nums');
});

test('AD-11 bands render in BAND_ORDER (default)', async ({ page }) => {
  await openFixture(page, 'session-idle-fresh');
  const order = await page
    .locator('[data-band]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-band')));
  expect(order).toEqual([
    'topBar',
    'banner',
    'leftover',
    'columns',
    'footRow',
    'trayGap',
    'tray',
    'labels',
    'wordcells',
    'actionGap',
    'actionBar',
  ]);
});

// AD-11 `?bands=` (dev only): the units in the query's order, flattened as DOM order.
const PERMUTED = 'topBar,banner,leftover,tray,columns,wordcells,actionBar';
const PERMUTED_BANDS = [
  'topBar',
  'banner',
  'leftover',
  'trayGap',
  'tray',
  'columns',
  'footRow',
  'labels',
  'wordcells',
  'actionGap',
  'actionBar',
];

test('AD-11 ?bands= reorders bands in dev', async ({ page }) => {
  test.skip(test.info().project.name !== 'android', 'AD-11 band order runs on android');
  await seedStorage(page, { session: fixture('session-idle-fresh.json') });
  await page.goto(`/?bands=${PERMUTED}`);
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  const bands = await page.locator('[data-band]').evaluateAll((els) =>
    els.map((el) => ({
      id: el.getAttribute('data-band'),
      top: el.getBoundingClientRect().top + window.scrollY,
    })),
  );
  expect(bands.map((b) => b.id)).toEqual(PERMUTED_BANDS);
  for (let i = 1; i < bands.length; i++) {
    expect(bands[i]?.top, bands[i]?.id ?? '').toBeGreaterThanOrEqual(bands[i - 1]?.top ?? 0);
  }
});
