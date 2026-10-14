import { expect, type Page, test } from '@playwright/test';
import { cards, centre, openFixture, tapAt, trayIds } from './helpers/board';
import { placeholder } from './helpers/gestures';
import { waitForDictionary } from './helpers/restore';
import { storedGame, storedText } from './helpers/session';
import { armStorageSpy, storageWrites } from './helpers/storage-spy';

// Epic 5 entry 3: the D-block controls, the k = 0 caption, Validate (F15, F21) and the primary
// label shrink (A9 4.2-m1). Expected values are literals from view() over the fixtures (seed 1),
// never edited to pass. Card → letter from src/engine/lang/en.ts.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'tray controls run on android');
});

const LIST = '**/en*.txt';
const SESSION = 'wordcell:session';
const tray = (page: Page) => page.locator('[data-band="tray"]');
const controls = (page: Page) => tray(page).locator('.controls');
const minus = (page: Page) => controls(page).getByRole('button', { name: '−', exact: true });
const plus = (page: Page) => controls(page).getByRole('button', { name: '+', exact: true });
const flip = (page: Page) => controls(page).getByRole('button', { name: 'Flip', exact: true });
const kText = (page: Page) => controls(page).locator('.k');
const primary = (page: Page) => page.getByTestId('primary-action');
const invalid = (page: Page) => tray(page).locator('.word-line .invalid');
const wordText = (page: Page) => tray(page).locator('.word-line .word-text');
type Stored = {
  moves: {
    destinationCount: number;
    destinationSide: string;
    reached: string;
    targetCell?: number;
  }[];
  cursor: { index: number; phase: string };
};

// R-73: the stored wordcell:session deep-equals the store's Session (e2e/board-phases.spec.ts).
async function expectSaved(page: Page): Promise<Stored> {
  const read = () =>
    page.evaluate((key) => {
      const current = window.__wordcell?.current();
      if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
      const text = localStorage.getItem(key);
      return { stored: text === null ? null : JSON.parse(text), current: current.session };
    }, SESSION);
  await expect
    .poll(async () => {
      const { stored, current } = await read();
      return JSON.stringify(stored) === JSON.stringify(current);
    })
    .toBe(true);
  const { stored, current } = await read();
  expect(stored).toEqual(current);
  return stored as Stored;
}

const phase = (page: Page) =>
  page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return current.session.cursor.phase;
  });

const storeKind = (page: Page) => page.evaluate(() => window.__wordcell?.current().kind);

const sessionWrites = async (page: Page) =>
  (await storageWrites(page)).filter((w) => w.key === SESSION);

// The control row's left slot children in DOM order, by text.
const leftOrder = (page: Page) =>
  controls(page)
    .locator('.left > *')
    .evaluateAll((els) => els.map((el) => el.textContent?.trim()));

// A word-list stub without TAN: Validate on session-composing fails (R-38).
const stubCatDog = (page: Page) =>
  page.route(LIST, (route) => route.fulfill({ status: 200, body: 'cat\ndog\n' }));

async function failValidate(page: Page): Promise<void> {
  await waitForDictionary(page, 'ready');
  await primary(page).click();
  await expect(invalid(page)).toBeVisible();
}

test('R-30 R-31 R-38 R-73 (UI) D-block controls on session-composing: + raises k, Flip flips the side, − lowers k, each saved; Validate only on tap enters Place', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  await waitForDictionary(page, 'ready');
  await expect(minus(page)).toBeDisabled();
  await expect(plus(page)).toBeEnabled();
  await expect(flip(page)).toBeEnabled();
  await expect(kText(page)).toHaveText('1');
  await expect(controls(page).locator('.caption')).toHaveCount(0);
  // DOM order: − < k < + < Flip.
  expect(await leftOrder(page)).toEqual(['\u2212', '1', '+', '\u21c4 Flip']);
  await expect(minus(page)).toHaveText('−');
  await expect(plus(page)).toHaveText('+');

  await tapAt(page, await centre(plus(page)));
  await expect(kText(page)).toHaveText('2');
  let stored = await expectSaved(page);
  expect(stored.moves[0]?.destinationCount).toBe(2);
  expect(stored.cursor.phase).toBe('composing');
  await expect(wordText(page)).toHaveText('TANE');
  expect(await trayIds(page)).toEqual(['42', '0', '28m', '9m']);
  await expect(minus(page)).toBeEnabled();

  await tapAt(page, await centre(flip(page)));
  stored = await expectSaved(page);
  expect(stored.moves[0]?.destinationSide).toBe('left');
  expect(stored.cursor.phase).toBe('composing');
  await expect(wordText(page)).toHaveText('ENTA');
  expect(await trayIds(page)).toEqual(['9m', '28m', '42', '0']);

  await tapAt(page, await centre(flip(page)));
  stored = await expectSaved(page);
  expect(stored.moves[0]?.destinationSide).toBe('right');
  expect(stored.cursor.phase).toBe('composing');
  await expect(wordText(page)).toHaveText('TANE');
  expect(await trayIds(page)).toEqual(['42', '0', '28m', '9m']);

  await tapAt(page, await centre(minus(page)));
  await expect(kText(page)).toHaveText('1');
  stored = await expectSaved(page);
  expect(stored.moves[0]?.destinationCount).toBe(1);
  expect(stored.cursor.phase).toBe('composing');
  await expect(wordText(page)).toHaveText('TAN');
  expect(await trayIds(page)).toEqual(['42', '0', '28m']);
  await expect(minus(page)).toBeDisabled();

  await primary(page).click();
  await expect.poll(() => phase(page)).toBe('place');
  await expectSaved(page);
});

test('R-31 R-73 (UI) + pressed until disabled reaches k = column 6 card count, each press saved; a tap on the disabled + changes nothing', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  await waitForDictionary(page, 'ready');
  const max = await cards(page, 6).count();
  let k = 1;
  while (await plus(page).isEnabled()) {
    await tapAt(page, await centre(plus(page)));
    k += 1;
    await expect(kText(page)).toHaveText(`${k}`);
    const stored = await expectSaved(page);
    expect(stored.moves[0]?.destinationCount).toBe(k);
  }
  expect(k).toBe(max);
  await expect(plus(page)).toBeDisabled();
  const before = await storedText(page);
  await tapAt(page, await centre(plus(page)));
  await expect(kText(page)).toHaveText(`${max}`);
  expect(await storedText(page)).toBe(before);
});

test('R-73 R-38 (UI) a successful Validate saves once: one wordcell:session write after the click, equal to the store, phase place, no halt', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  await waitForDictionary(page, 'ready');
  await armStorageSpy(page);
  await primary(page).click();
  await expect.poll(() => phase(page)).toBe('place');
  const writes = await sessionWrites(page);
  expect(writes).toHaveLength(1);
  const current = await page.evaluate(() => window.__wordcell?.current());
  if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
  expect(JSON.parse(writes[0]?.value ?? 'null')).toEqual(current.session);
  expect(await storeKind(page)).toBe('active');
  await expect(primary(page)).toHaveText('Confirm');
});

test('R-38 R-71 R-31 (UI) a tap on the disabled − keeps the invalid line and the stored Session', async ({
  page,
}) => {
  await stubCatDog(page);
  await openFixture(page, 'session-composing');
  await failValidate(page);
  await expect(minus(page)).toBeDisabled();
  const before = await storedText(page);
  await tapAt(page, await centre(minus(page)));
  await expect(invalid(page)).toBeVisible();
  await expect(kText(page)).toHaveText('1');
  expect(await storedText(page)).toBe(before);
});

test('R-38 R-71 R-31 (UI) + after a failed Validate clears the invalid line', async ({ page }) => {
  await stubCatDog(page);
  await openFixture(page, 'session-composing');
  await failValidate(page);
  await tapAt(page, await centre(plus(page)));
  await expect(invalid(page)).toHaveCount(0);
  await expect(wordText(page)).toHaveText('TANE');
  await expectSaved(page);
});

test('R-38 R-71 R-31 (UI) Undo then Redo after a failed Validate returns to Composing with no invalid line', async ({
  page,
}) => {
  await stubCatDog(page);
  await openFixture(page, 'session-composing');
  await failValidate(page);
  await page.getByTestId('undo').click();
  await expect.poll(() => phase(page)).toBe('idle');
  await page.getByTestId('redo').click();
  await expect.poll(() => phase(page)).toBe('composing');
  await expect(invalid(page)).toHaveCount(0);
  await expect(wordText(page)).toHaveText('TAN');
});

test('R-38 R-71 R-31 (UI) a failed Validate with a redo tail leaves the stored Session (but activeMs) and Redo unchanged; Redo, Undo leaves no line', async ({
  page,
}) => {
  await stubCatDog(page);
  await openFixture(page, 'session-place', { steps: ['undo'] });
  await expect.poll(() => phase(page)).toBe('composing');
  await expect(page.getByTestId('redo')).toBeEnabled();
  await waitForDictionary(page, 'ready');
  const before = await storedGame(page);
  await primary(page).click();
  await expect(invalid(page)).toBeVisible();
  expect(await storedGame(page)).toBe(before);
  await expect(page.getByTestId('redo')).toBeEnabled();
  await page.getByTestId('redo').click();
  await expect.poll(() => phase(page)).toBe('place');
  await page.getByTestId('undo').click();
  await expect.poll(() => phase(page)).toBe('composing');
  await expect(invalid(page)).toHaveCount(0);
  await expect(wordText(page)).toHaveText('TAN');
});

test('R-31 (UI) k = 0: the empty-column caption replaces −, k, + and Flip; single line, ellipsizing before the letter count', async ({
  page,
}) => {
  await openFixture(page, 'session-idle-empty-column');
  await tapAt(page, await centre(cards(page, 2).last()));
  await tapAt(page, await centre(placeholder(page, 1)));
  await expect.poll(() => phase(page)).toBe('composing');
  const caption = controls(page).locator('.caption');
  await expect(caption).toHaveText('Empty column: no cards join the word');
  await expect(controls(page).getByRole('button')).toHaveCount(0);
  await expect(controls(page).locator('.k')).toHaveCount(0);
  const style = await caption.evaluate((el) => {
    const s = getComputedStyle(el);
    return { whiteSpace: s.whiteSpace, overflowX: s.overflowX, textOverflow: s.textOverflow };
  });
  expect(style).toEqual({ whiteSpace: 'nowrap', overflowX: 'hidden', textOverflow: 'ellipsis' });
  const count = controls(page).locator('.count');
  await expect(count).toHaveText('1 letter');
  // Narrow the row to the count's width plus 48 px, measured in-page.
  const width = await count.evaluate((el) => el.getBoundingClientRect().width + 48);
  await page.addStyleTag({
    content: `[data-band="tray"] .controls .row { width: ${width}px !important; }`,
  });
  await expect.poll(() => caption.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  const fit = await page.evaluate(() => {
    const row = document.querySelector('[data-band="tray"] .controls .row');
    const c = document.querySelector('[data-band="tray"] .controls .count');
    if (row === null || c === null) throw new Error('control row missing');
    return {
      scrollWidth: c.scrollWidth,
      clientWidth: c.clientWidth,
      right: c.getBoundingClientRect().right,
      rowRight: row.getBoundingClientRect().right,
    };
  });
  expect(fit.scrollWidth).toBeLessThanOrEqual(fit.clientWidth);
  expect(fit.right).toBeLessThanOrEqual(fit.rowRight + 0.5);
  // The caption ends before the count starts: the ellipsized caption never runs under the count.
  const captionRight = await caption.evaluate((el) => el.getBoundingClientRect().right);
  const countLeft = await count.evaluate((el) => el.getBoundingClientRect().left);
  expect(captionRight).toBeLessThanOrEqual(countLeft + 0.5);
});

// The primary label span's natural nowrap width at 14, 15 and 16 px (a temporary inline font
// size, restored), the button's horizontal padding and box-sizing, measured in-page.
async function labelGeometry(page: Page) {
  return primary(page).evaluate((button) => {
    const span = button.querySelector('.primary-label') as HTMLElement | null;
    if (span === null) throw new Error('label span missing');
    const previous = span.style.fontSize;
    const natural: Record<number, number> = {};
    for (const px of [14, 15, 16]) {
      span.style.fontSize = `${px}px`;
      natural[px] = span.getBoundingClientRect().width;
    }
    span.style.fontSize = previous;
    const s = getComputedStyle(button);
    return {
      natural,
      padding: Number.parseFloat(s.paddingLeft) + Number.parseFloat(s.paddingRight),
      borderBox: s.boxSizing === 'border-box',
    };
  });
}

// Forces the primary button's width so its content width is `content` px.
async function forceContent(page: Page, content: number) {
  const g = await labelGeometry(page);
  const width = content + (g.borderBox ? g.padding : 0);
  return page.addStyleTag({
    content: `[data-testid="primary-action"] { width: ${width}px !important; }`,
  });
}

const labelSize = (page: Page) =>
  primary(page)
    .locator('.primary-label')
    .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

const buttonSize = (page: Page) =>
  primary(page).evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));

const primaryOverflows = (page: Page) =>
  primary(page).evaluate((el) => el.scrollWidth > el.clientWidth);

const buttonWidth = (page: Page) =>
  primary(page).evaluate((el) => el.getBoundingClientRect().width);

test('AD-11 (A9 4.2-m1) the primary label shrinks to 15 px between its 15/16 px widths and to 14 px, then ellipsizes, below its 14 px width', async ({
  page,
}) => {
  await page.route(LIST, (route) => route.fulfill({ status: 500, body: '' }));
  await openFixture(page, 'session-composing');
  await waitForDictionary(page, 'failed');
  await expect(primary(page)).toHaveText('Word list unavailable');
  await expect.poll(() => labelSize(page)).toBe(16);
  expect(await buttonSize(page)).toBe(16);
  expect(await primaryOverflows(page)).toBe(false);

  const g = await labelGeometry(page);
  expect(g.natural[16]).toBeGreaterThan(g.natural[15] as number);
  const between = await forceContent(
    page,
    ((g.natural[15] as number) + (g.natural[16] as number)) / 2,
  );
  await expect.poll(() => labelSize(page)).toBe(15);
  expect(await buttonSize(page)).toBe(await labelSize(page));
  expect(await primaryOverflows(page)).toBe(false);
  await between.evaluate((el) => (el as Element).remove());
  // The button widens back: the ResizeObserver refits the label to 16 px.
  await expect.poll(() => labelSize(page)).toBe(16);

  await forceContent(page, (g.natural[14] as number) - 10);
  await expect.poll(() => labelSize(page)).toBe(14);
  expect(await buttonSize(page)).toBe(await labelSize(page));
  const display = await primary(page)
    .locator('.primary-label')
    .evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe('inline');
  expect(await primaryOverflows(page)).toBe(true);
});

test('AD-11 (A9 4.2-m1) a label change refits: Loading words… at 15 px, then Validate at 16 px with the button width unchanged', async ({
  page,
}) => {
  let release: () => void = () => {
    throw new Error('route not held yet');
  };
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(LIST, async (route) => {
    await released;
    await route.continue();
  });
  await openFixture(page, 'session-composing');
  await expect(primary(page)).toHaveText('Loading words…');
  const g = await labelGeometry(page);
  await forceContent(page, ((g.natural[15] as number) + (g.natural[16] as number)) / 2);
  await expect.poll(() => labelSize(page)).toBe(15);
  const width = await buttonWidth(page);
  release();
  await waitForDictionary(page, 'ready');
  await expect(primary(page)).toHaveText('Validate');
  await expect.poll(() => labelSize(page)).toBe(16);
  expect(await buttonWidth(page)).toBe(width);
  expect(await primaryOverflows(page)).toBe(false);
});

// F21: the stored Session's last move after a double activation of primary-action.
async function expectCommittedAtCell3(page: Page): Promise<void> {
  await expect.poll(() => phase(page)).toBe('idle');
  const writes = await sessionWrites(page);
  expect(writes).toHaveLength(2);
  const [placed, committed] = writes.map((w) => JSON.parse(w.value ?? 'null') as Stored);
  expect(placed?.cursor.phase).toBe('place');
  expect(placed?.moves.at(-1)?.reached).toBe('place');
  const last = committed?.moves.at(-1);
  expect(last?.reached).toBe('committed');
  expect(last?.targetCell).toBe(3);
  const stored = await expectSaved(page);
  expect(stored.moves.at(-1)).toEqual(last);
  expect(await storeKind(page)).toBe('active');
}

test('R-38 F21 (UI) two synchronous clicks on primary-action validate then confirm at cell 3: writes Place, commit; no halt', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  await waitForDictionary(page, 'ready');
  await armStorageSpy(page);
  const between = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="primary-action"]') as HTMLButtonElement | null;
    if (el === null) throw new Error('primary-action missing');
    el.click();
    // F15: flushSync rendered Place before the click returned, on the same button node.
    const seen = {
      label: el.textContent,
      sameNode: document.querySelector('[data-testid="primary-action"]') === el,
    };
    el.click();
    return seen;
  });
  expect(between).toEqual({ label: 'Confirm', sameNode: true });
  await expectCommittedAtCell3(page);
});

test('R-38 F21 (UI) an android double tap on primary-action validates then confirms at cell 3', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  await waitForDictionary(page, 'ready');
  await armStorageSpy(page);
  const p = await centre(primary(page));
  await page.touchscreen.tap(p.x, p.y);
  await page.touchscreen.tap(p.x, p.y);
  await expectCommittedAtCell3(page);
});

test('R-31 R-30 (UI) − and + are 44 × 44, Flip is 44 tall and at least 44 wide', async ({
  page,
}) => {
  await openFixture(page, 'session-composing');
  const size = (name: '−' | '+' | 'Flip') =>
    controls(page)
      .getByRole('button', { name, exact: true })
      .evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height };
      });
  for (const name of ['−', '+'] as const) {
    const s = await size(name);
    expect(Math.abs(s.w - 44)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(s.h - 44)).toBeLessThanOrEqual(0.5);
  }
  const f = await size('Flip');
  expect(Math.abs(f.h - 44)).toBeLessThanOrEqual(0.5);
  expect(f.w).toBeGreaterThanOrEqual(44 - 0.5);
});
