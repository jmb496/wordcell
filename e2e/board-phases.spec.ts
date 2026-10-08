import { expect, type Locator, type Page, test } from '@playwright/test';
import { openFixture } from './helpers/board';
import { tokenColor } from './helpers/style';

// Epic 4 entry 3: every GameView board state rendered (AD-14 live vs mirror, F2 static tray,
// R-22, R-30, R-33, R-42, R-73). Expected values are literals from view() over the fixtures
// (seed 1), computed at planning (the ticket plan's I/O matrix); never edited to pass.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'board phase rendering runs on android');
});

type Step = 'undo' | 'redo';
type Cursor = { index: number; phase: 'idle' | 'composing' | 'place' };

function box(locator: Locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, width: r.width, height: r.height };
  });
}

// Rule-coverage preamble: the cursor literal, and the stored wordcell:session equals the store's.
async function expectSession(page: Page, cursor: Cursor): Promise<void> {
  const read = () =>
    page.evaluate(() => {
      const current = window.__wordcell?.current();
      if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
      const text = localStorage.getItem('wordcell:session');
      return { stored: text === null ? null : JSON.parse(text), current: current.session };
    });
  await expect.poll(async () => (await read()).current.cursor).toEqual(cursor);
  const { stored, current } = await read();
  expect(stored).toEqual(current);
}

// Tray order: the live cards and mirrors inside the tray band in DOM order, a mirror as `<id>m`.
function trayOrder(page: Page): Promise<string[]> {
  return page
    .locator('[data-band="tray"] :is([data-card-id], [data-mirror-of])')
    .evaluateAll((els) =>
      els.map((el) =>
        el.hasAttribute('data-mirror-of')
          ? `${el.getAttribute('data-mirror-of')}m`
          : (el.getAttribute('data-card-id') ?? ''),
      ),
    );
}

function mirrorsIn(page: Page, scope: string): Promise<number[]> {
  return page
    .locator(`${scope} [data-mirror-of]`)
    .evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-mirror-of'))));
}

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

type State = {
  title: string;
  fixture: string;
  steps?: Step[];
  cursor: Cursor;
  mirrors: number[];
  // Ghost mirrors per column in DOM order (4-3 m2; plan I/O matrix); columns not listed hold none.
  ghosts: Record<number, number[]>;
  tray: string[];
};

const PLACE_TAN = ['42', '0', '28'];
const COLUMN_1 = ['24', '6', '49', '30', '25', '20', '48'];
const COLUMN_1_GHOSTS = [6, 20, 24, 25, 30, 48, 49];
const COLUMN_1_GHOSTS_ORDER = [24, 6, 49, 30, 25, 20, 48];

const STATES: State[] = [
  {
    title: 'session-idle-fresh',
    fixture: 'session-idle-fresh',
    cursor: { index: 0, phase: 'idle' },
    mirrors: [],
    ghosts: {},
    tray: [],
  },
  {
    title: 'session-idle-pending-draft',
    fixture: 'session-idle-pending-draft',
    cursor: { index: 0, phase: 'idle' },
    mirrors: [],
    ghosts: {},
    tray: [],
  },
  {
    title: 'session-composing',
    fixture: 'session-composing',
    cursor: { index: 0, phase: 'composing' },
    mirrors: [0, 28, 42],
    ghosts: { 3: [42, 0] },
    tray: ['42', '0', '28m'],
  },
  {
    title: 'session-composing-draft-2-letters',
    fixture: 'session-composing-draft-2-letters',
    cursor: { index: 0, phase: 'composing' },
    mirrors: [0, 28],
    ghosts: { 3: [0] },
    tray: ['0', '28m'],
  },
  {
    title: 'session-place',
    fixture: 'session-place',
    cursor: { index: 0, phase: 'place' },
    mirrors: [0, 28, 42],
    ghosts: { 3: [42, 0], 6: [28] },
    tray: PLACE_TAN,
  },
  {
    title: 'session-below-committed-last',
    fixture: 'session-below-committed-last',
    cursor: { index: 0, phase: 'place' },
    mirrors: [0, 28, 42],
    ghosts: { 3: [42, 0], 6: [28] },
    tray: PLACE_TAN,
  },
  {
    title: 'session-place-free-letter-redo-tail',
    fixture: 'session-place-free-letter-redo-tail',
    cursor: { index: 1, phase: 'place' },
    mirrors: [9, 28, 32],
    ghosts: { 4: [32], 6: [9] },
    tray: ['9', '32', '28'],
  },
  {
    title: 'session-place-free-letter-redo-tail + Undo',
    fixture: 'session-place-free-letter-redo-tail',
    steps: ['undo'],
    cursor: { index: 1, phase: 'composing' },
    mirrors: [9, 28, 32],
    ghosts: { 4: [32] },
    tray: ['32', '28', '9m'],
  },
  {
    title: 'session-place-free-letter-redo-tail + Undo, Undo, Redo',
    fixture: 'session-place-free-letter-redo-tail',
    steps: ['undo', 'undo', 'redo'],
    cursor: { index: 1, phase: 'composing' },
    mirrors: [9, 28, 32],
    ghosts: { 4: [32] },
    tray: ['32', '28', '9m'],
  },
  {
    title: 'session-place-free-letter-redo-tail + Redo, Redo',
    fixture: 'session-place-free-letter-redo-tail',
    steps: ['redo', 'redo'],
    cursor: { index: 2, phase: 'composing' },
    mirrors: [1, 26, 27],
    ghosts: { 2: [26] },
    tray: ['26', '1m', '27m'],
  },
  {
    title: 'session-won',
    fixture: 'session-won',
    cursor: { index: 8, phase: 'idle' },
    mirrors: [],
    ghosts: {},
    tray: [],
  },
  {
    title: 'session-gave-up',
    fixture: 'session-gave-up',
    cursor: { index: 0, phase: 'idle' },
    mirrors: [],
    ghosts: {},
    tray: [],
  },
  {
    title: 'session-idle-empty-column',
    fixture: 'session-idle-empty-column',
    cursor: { index: 1, phase: 'idle' },
    mirrors: [],
    ghosts: {},
    tray: [],
  },
  {
    title: 'session-idle-empty-column + Undo',
    fixture: 'session-idle-empty-column',
    steps: ['undo'],
    cursor: { index: 0, phase: 'place' },
    mirrors: COLUMN_1_GHOSTS,
    ghosts: { 1: COLUMN_1_GHOSTS_ORDER },
    tray: COLUMN_1,
  },
  {
    title: 'session-idle-empty-column + Undo, Undo',
    fixture: 'session-idle-empty-column',
    steps: ['undo', 'undo'],
    cursor: { index: 0, phase: 'composing' },
    mirrors: COLUMN_1_GHOSTS,
    ghosts: { 1: COLUMN_1_GHOSTS_ORDER },
    tray: COLUMN_1,
  },
];

for (const state of STATES) {
  test(`AD-14 one live element per card, mirrors and tray order on ${state.title}`, async ({
    page,
  }) => {
    await openFixture(page, state.fixture, { steps: state.steps, booted: false });
    await expectSession(page, state.cursor);
    const trayPlace = { idle: null, composing: 'tray', place: 'strip' }[state.cursor.phase];

    const dom = await page.evaluate(() => {
      const all = (selector: string) => [...document.querySelectorAll(selector)];
      const placesIn = (scope: string) =>
        all(`${scope} [data-card-id]`).map((el) => el.getAttribute('data-place'));
      return {
        ids: all('[data-card-id]').map((el) => Number(el.getAttribute('data-card-id'))),
        places: all('[data-place]').map((el) => el.hasAttribute('data-card-id')),
        testIds: all('[data-testid^="card-"]').map((el) => el.hasAttribute('data-card-id')),
        column: placesIn('[data-column]'),
        cell: placesIn('[data-wordcell]'),
        tray: placesIn('[data-band="tray"]'),
        mirrors: all('[data-mirror-of]').map((el) => ({
          id: Number(el.getAttribute('data-mirror-of')),
          bare:
            !el.hasAttribute('data-card-id') &&
            !el.hasAttribute('data-testid') &&
            !el.hasAttribute('data-place') &&
            el.getAttribute('aria-hidden') === 'true',
        })),
      };
    });
    expect(dom.ids.toSorted((a, b) => a - b)).toEqual(Array.from({ length: 52 }, (_, i) => i));
    expect(dom.places).toEqual(Array(52).fill(true));
    expect(dom.testIds).toEqual(Array(52).fill(true));
    expect(dom.column.every((place) => place === 'column')).toBe(true);
    expect(dom.cell.every((place) => place === 'cell')).toBe(true);
    expect(dom.tray.every((place) => place === trayPlace)).toBe(true);
    expect(dom.column.length + dom.cell.length + dom.tray.length).toBe(52);
    expect(dom.mirrors.map((m) => m.id).toSorted((a, b) => a - b)).toEqual(state.mirrors);
    expect(dom.mirrors.every((m) => m.bare)).toBe(true);
    for (let n = 1; n <= 8; n++) {
      expect(await mirrorsIn(page, `[data-testid="column-${n}"]`), `column-${n} ghosts`).toEqual(
        state.ghosts[n] ?? [],
      );
    }

    expect(await trayOrder(page)).toEqual(state.tray);
    const xs = await page
      .locator('[data-band="tray"] :is([data-card-id], [data-mirror-of])')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().left));
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] as number).toBeGreaterThan(xs[i - 1] as number);
    }
  });
}

test('AD-14 (R-30) k = 2 right: the tray holds live 26 then D mirrors 1, 27; cards 27 and 1 live in column 6 in destination style', async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-redo-tail', {
    steps: ['redo', 'redo'],
    booted: false,
  });
  await expectSession(page, { index: 2, phase: 'composing' });
  expect(await trayOrder(page)).toEqual(['26', '1m', '27m']);
  const fill = await tokenColor(page, '--wc-destination-fill');
  for (const id of [27, 1]) {
    const card = page.getByTestId('column-6').getByTestId(`card-${id}`);
    await expect(card).toHaveAttribute('data-place', 'column');
    await expect(card).toHaveClass(/\bdestination\b/);
    await expect(card.locator('.face')).toHaveCSS('background-color', fill);
  }
  // The D-block mirrors carry the destination fill too (DESIGN.md Destination block).
  for (const id of [1, 27]) {
    await expect(page.locator(`[data-band="tray"] [data-mirror-of="${id}"] .face`)).toHaveCSS(
      'background-color',
      fill,
    );
  }
  expect(await mirrorsIn(page, '[data-testid="column-2"]')).toEqual([26]);
  // One lock per D-block row segment, at its start (mirror 1); none on mirror 27.
  const tray = page.locator('[data-band="tray"]');
  await expect(tray.locator('[data-mirror-of="1"] svg.lock')).toHaveCount(1);
  await expect(tray.locator('[data-mirror-of="27"] svg.lock')).toHaveCount(0);
});

// The WordCell's computed ring (its ::after border).
const ring = (page: Page, cell: number) =>
  page.getByTestId(`wordcell-${cell}`).evaluate((el) => {
    const style = getComputedStyle(el, '::after');
    return { color: style.borderTopColor, width: style.borderTopWidth };
  });

async function expectTarget(page: Page, cell: number): Promise<void> {
  const target = page.getByTestId(`wordcell-${cell}`);
  await expect(target).toHaveClass(/\btarget\b/);
  await expect(target).not.toHaveClass(/\bdim\b/);
  await expect(target.locator('.check')).toBeVisible();
  expect(await effectiveOpacity(target.locator('.check'))).toBe(1);
  const teal = await tokenColor(page, '--wc-accent-teal');
  expect(await ring(page, cell)).toEqual({ color: teal, width: '3px' });
}

async function expectNotLegal(page: Page, cells: readonly number[]): Promise<void> {
  for (const cell of cells) {
    const wordcell = page.getByTestId(`wordcell-${cell}`);
    await expect(wordcell).toHaveClass(/\bdim\b/);
    await expect(wordcell).toHaveCSS('opacity', '0.35');
  }
}

test('R-42 (UI) on session-place the selected target 3 shows its ring and check at full opacity, cells 4–10 not legal', async ({
  page,
}) => {
  await openFixture(page, 'session-place', { booted: false });
  await expectSession(page, { index: 0, phase: 'place' });
  await expectTarget(page, 3);
  await expectNotLegal(page, [4, 5, 6, 7, 8, 9, 10]);
});

test('R-42 (UI) after one Undo on session-idle-empty-column wordcell-7 is selected, 3–6 legal, 8–10 not legal', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-empty-column', { steps: ['undo'], booted: false });
  await expectSession(page, { index: 0, phase: 'place' });
  await expectTarget(page, 7);
  for (const cell of [3, 4, 5, 6]) {
    const wordcell = page.getByTestId(`wordcell-${cell}`);
    await expect(wordcell).toHaveClass(/\blegal\b/);
    await expect(wordcell).not.toHaveClass(/\bdim\b/);
  }
  await expectNotLegal(page, [8, 9, 10]);
  const teal = await tokenColor(page, '--wc-accent-teal');
  for (const cell of [3, 4, 5, 6]) {
    expect(await ring(page, cell), `wordcell-${cell}`).toEqual({ color: teal, width: '2px' });
  }
  expect(await ring(page, 7)).toEqual({ color: teal, width: '3px' });
});

async function expectUsedCell3(page: Page): Promise<void> {
  const used = page.getByTestId('wordcell-3').locator('[data-mirror-of="28"]');
  await expect(used).toHaveCount(1);
  await expect(used.locator('.face')).toHaveCSS('opacity', '0.4');
  expect(
    await used.locator('.face').evaluate((el) => getComputedStyle(el).backgroundImage),
  ).toContain('repeating-linear-gradient');
  // The cards beneath stay live and hidden (R-61); 28 itself is live in the tray or strip.
  for (const id of [42, 0]) {
    await expect(page.getByTestId('wordcell-3').getByTestId(`card-${id}`)).toBeHidden();
  }
}

test('R-33 (UI) wordcell-3 shows the used face mirror in Place (with the selected target) and after one Undo into Composing', async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-redo-tail', { booted: false });
  await expectSession(page, { index: 1, phase: 'place' });
  await expectUsedCell3(page);
  await expectTarget(page, 3);
  await expect(page.getByTestId('card-28')).toHaveAttribute('data-place', 'strip');

  await page.getByTestId('undo').click();
  await expectSession(page, { index: 1, phase: 'composing' });
  await expectUsedCell3(page);
  await expect(page.getByTestId('card-28')).toHaveAttribute('data-place', 'tray');
});

test('R-22 column 1 placeholder: shown when empty, hidden under Place ghosts, shown under the S ghosts of a whole-column self-drop', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-empty-column', { booted: false });
  await expectSession(page, { index: 1, phase: 'idle' });
  const column1 = page.getByTestId('column-1');
  const placeholder = column1.locator('.placeholder');
  await expect(placeholder).toBeVisible();
  const cell7 = page.getByTestId('wordcell-7').locator('[data-card-id]');
  expect(
    await cell7.evaluateAll((els) => els.map((el) => el.getAttribute('data-card-id'))),
  ).toEqual(COLUMN_1);
  await expect(page.getByTestId('card-48')).toBeVisible();

  await page.getByTestId('undo').click();
  await expectSession(page, { index: 0, phase: 'place' });
  expect(await mirrorsIn(page, '[data-testid="column-1"]')).toEqual([24, 6, 49, 30, 25, 20, 48]);
  await expect(placeholder).toBeHidden();
  expect(await trayOrder(page)).toEqual(COLUMN_1);

  await page.getByTestId('undo').click();
  await expectSession(page, { index: 0, phase: 'composing' });
  expect(await mirrorsIn(page, '[data-testid="column-1"]')).toEqual([24, 6, 49, 30, 25, 20, 48]);
  await expect(placeholder).toBeVisible();
  const firstGhost = column1.locator('[data-mirror-of]').first();
  expect((await box(placeholder)).top).toBe((await box(firstGhost)).top);
  expect(await trayOrder(page)).toEqual(COLUMN_1);
  for (const id of COLUMN_1) {
    await expect(page.getByTestId(`card-${id}`)).toHaveAttribute('data-place', 'tray');
  }
});

test('R-73 (UI) a reload re-renders session-composing: ghosts, destination style, tray order', async ({
  page,
}) => {
  await openFixture(page, 'session-composing', { booted: false });
  await page.reload();
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expectSession(page, { index: 0, phase: 'composing' });
  expect(await mirrorsIn(page, '[data-testid="column-3"]')).toEqual([42, 0]);
  const card28 = page.getByTestId('column-6').getByTestId('card-28');
  await expect(card28).toHaveClass(/\bdestination\b/);
  await expect(card28.locator('.face')).toHaveCSS(
    'background-color',
    await tokenColor(page, '--wc-destination-fill'),
  );
  expect(await trayOrder(page)).toEqual(['42', '0', '28m']);
  // Ghosts draw no glyph; the lock marks the live D card and the D-block mirror only.
  await expect(page.locator('[data-testid="column-3"] [data-mirror-of] .glyph')).toHaveCount(0);
  await expect(card28.locator('svg.lock')).toHaveCount(1);
  const tray = page.locator('[data-band="tray"]');
  await expect(tray.locator('[data-mirror-of="28"] svg.lock')).toHaveCount(1);
  for (const id of [42, 0])
    await expect(tray.getByTestId(`card-${id}`).locator('svg.lock')).toHaveCount(0);
});

async function expectRedoTailPlace(page: Page): Promise<void> {
  await expectSession(page, { index: 1, phase: 'place' });
  expect(await mirrorsIn(page, '[data-testid="column-4"]')).toEqual([32]);
  expect(await mirrorsIn(page, '[data-testid="column-6"]')).toEqual([9]);
  await expectUsedCell3(page);
  expect(await trayOrder(page)).toEqual(['9', '32', '28']);
  await expectTarget(page, 3);
}

test('R-73 (UI) a reload re-renders session-place-free-letter-redo-tail, and its Composing after an Undo', async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-redo-tail', { booted: false });
  await page.reload();
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expectRedoTailPlace(page);

  await page.getByTestId('undo').click();
  await expectSession(page, { index: 1, phase: 'composing' });
  await page.reload();
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await expectSession(page, { index: 1, phase: 'composing' });
  expect(await mirrorsIn(page, '[data-testid="column-4"]')).toEqual([32]);
  await expect(page.getByTestId('column-6').getByTestId('card-9')).toHaveClass(/\bdestination\b/);
  await expectUsedCell3(page);
  expect(await trayOrder(page)).toEqual(['32', '28', '9m']);
});

test('R-70/R-71 Undo, Undo, Redo from session-place-free-letter-redo-tail re-renders moves[1] Composing with cell 3 used', async ({
  page,
}) => {
  await openFixture(page, 'session-place-free-letter-redo-tail', {
    steps: ['undo', 'undo', 'redo'],
    booted: false,
  });
  await expectSession(page, { index: 1, phase: 'composing' });
  await expectUsedCell3(page);
  await expect(page.getByTestId('card-28')).toHaveAttribute('data-place', 'tray');
  expect(await trayOrder(page)).toEqual(['32', '28', '9m']);
});

for (const [width, w] of [
  [412, 46],
  [360, 40],
] as const) {
  test(`AD-11 (F2) the static tray at ${width} × 839: reserved band, clipped tile area, tiles and ghosts touch-action none`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 839 });
    await openFixture(page, 'session-composing', { booted: false });
    await expectSession(page, { index: 0, phase: 'composing' });
    expect((await box(page.getByTestId('card-24').locator('.face'))).width).toBe(w);
    const tray = await box(page.locator('[data-band="tray"]'));
    const labels = await box(page.locator('[data-band="labels"]'));
    expect(tray.height).toBe(176);
    expect(tray.bottom).toBe(labels.top);
    const tiles = page.locator('[data-band="tray"] .tiles');
    await expect(tiles).toHaveCSS('overflow', 'hidden');
    const area = await box(tiles);
    expect(area.height).toBe(92);
    expect(area.bottom).toBeLessThanOrEqual(labels.top);
    for (const element of [
      page.locator('[data-band="tray"]').getByTestId('card-42'),
      page.getByTestId('column-3').locator('[data-mirror-of="42"]'),
    ]) {
      await expect(element).toHaveCSS('touch-action', 'none');
      await expect(element).toHaveCSS('user-select', 'none');
    }
  });
}
