import { expect, type Locator, type Page, type Request, type Route, test } from '@playwright/test';
import {
  box,
  cards,
  centre,
  column,
  foot,
  openFixture,
  sameSession,
  stashSession,
} from './helpers/board';
import { expectLeaves, wc } from './helpers/dialogs';
import { animationFrames } from './helpers/lifecycle';
import { booted, waitForDictionary } from './helpers/restore';
import { tokenColor } from './helpers/style';
import { longPress, touchHold } from './helpers/touch';

// Epic 4 entry 7: tap-select, foot pads and tap-drop (R-14 tap half, Q-18, SPEC CAP-6, F25, F26,
// F31; rule-coverage §3 R-14 tap rows, AD-11, AD-12, AD-13 rows). `session-idle-fresh` columns
// hold 7/7/7/7/6/6/6/6 cards; `session-idle-empty-column` has column 1 empty and cell 7 filled.

type Point = { x: number; y: number };
type Selection = { column: number; count: number } | null;

const LIST = '**/en*.txt';
// The word-list fetch itself, not the dev server's `en.txt?url` module (dictionary.spec.ts).
const isList = (request: Request) => /\/en[^/?]*\.txt$/.test(request.url());

const onAndroid = () =>
  test.skip(test.info().project.name !== 'android', 'touch tap flows run on android');
const onDesktop = () =>
  test.skip(test.info().project.name !== 'desktop', 'mouse hover flows run on desktop');

// A point in column n's empty space: 6 px above its foot pad, below its bottom card.
async function space(page: Page, n: number): Promise<Point> {
  const f = await box(foot(page, n));
  const y = f.y - 6;
  const last = cards(page, n).last();
  if ((await last.count()) > 0) {
    const b = await box(last);
    if (b.y + b.h >= y) throw new Error(`column ${n} has no empty space`);
  }
  return { x: f.x + f.w / 2, y };
}

// A corner of foot-n, off its label.
async function footCorner(page: Page, n: number): Promise<Point> {
  const f = await box(foot(page, n));
  return { x: f.x + 3, y: f.y + 3 };
}

const cardAt = (page: Page, n: number, i: number) => centre(cards(page, n).nth(i));

async function tapAt(page: Page, p: Point): Promise<void> {
  if (test.info().project.name === 'android') await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
}

// The rendered selection: the outline's column and its lifted cards.
function selection(page: Page): Promise<Selection> {
  return page.evaluate(() => {
    const outlines = document.querySelectorAll('[data-selection-outline]');
    if (outlines.length > 1) throw new Error('more than one selection outline');
    const outline = outlines[0];
    if (outline === undefined) {
      if (document.querySelector('.lifted') !== null) throw new Error('lifted without outline');
      return null;
    }
    const col = outline.closest('[data-column]');
    if (col === null) throw new Error('outline outside a column');
    return {
      column: Number(col.getAttribute('data-column')),
      count: col.querySelectorAll('[data-place="column"].lifted').length,
    };
  });
}

const wcOf = async (page: Page) => (await wc(page))?.wc;

async function expectSelection(page: Page, expected: Selection, entries: number): Promise<void> {
  await expect.poll(() => selection(page)).toEqual(expected);
  await expect.poll(() => wcOf(page)).toBe(entries);
}

async function select(page: Page, n: number, i: number): Promise<void> {
  await tapAt(page, await cardAt(page, n, i));
  const count = await cards(page, n).count();
  await expectSelection(page, { column: n, count: count - i }, 1);
}

const storedText = (page: Page) => page.evaluate(() => localStorage.getItem('wordcell:session'));

type Draft = {
  phase: string;
  sourceColumn: number;
  sourceCount: number;
  destinationColumn: number;
  destinationCount: number;
};

// The cursor phase and the move at the cursor (the draft after a drop).
function draft(page: Page): Promise<Draft> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    const { cursor, moves } = current.session;
    const move = moves[cursor.index];
    return {
      phase: cursor.phase,
      sourceColumn: move?.sourceColumn ?? 0,
      sourceCount: move?.sourceCount ?? 0,
      destinationColumn: move?.destinationColumn ?? 0,
      destinationCount: move?.destinationCount ?? -1,
    };
  });
}

function cursorOf(page: Page): Promise<{ index: number; phase: string }> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return current.session.cursor;
  });
}

async function expectDrop(page: Page, d: Omit<Draft, 'phase' | 'destinationCount'>, k: number) {
  await expectSelection(page, null, 0);
  expect(await draft(page)).toEqual({ phase: 'composing', ...d, destinationCount: k });
  expect(JSON.parse((await storedText(page)) ?? 'null').cursor.phase).toBe('composing');
}

test.describe('android', () => {
  test.beforeEach(onAndroid);

  test('R-14 a tap-select dispatches nothing: Session reference and storage unchanged, wc 1', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const before = await stashSession(page);
    await select(page, 1, 4);
    expect(await sameSession(page)).toBe(true);
    expect(await storedText(page)).toBe(before);
  });

  test('R-14 with nothing selected, taps on empty space, placeholder, foot pad and an empty WordCell are inert', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    const before = await stashSession(page);
    const points = [
      await space(page, 5),
      await centre(column(page, 1).locator('.placeholder')),
      await centre(foot(page, 3)),
      await footCorner(page, 1),
      await centre(page.getByTestId('wordcell-3')),
    ];
    for (const p of points) {
      await tapAt(page, p);
      await animationFrames(page, 2);
      expect(await selection(page)).toBeNull();
      expect(await wcOf(page)).toBe(0);
    }
    expect(await sameSession(page)).toBe(true);
    expect(await storedText(page)).toBe(before);
  });

  test('R-14 R-20 a tap on another column’s bottom card drops there', async ({ page }) => {
    await openFixture(page, 'session-idle-fresh');
    await select(page, 1, 5);
    await tapAt(page, await cardAt(page, 3, 6));
    await expectDrop(page, { sourceColumn: 1, sourceCount: 2, destinationColumn: 3 }, 1);
  });

  test('R-14 R-20 a tap on an upper card of another column drops there', async ({ page }) => {
    await openFixture(page, 'session-idle-fresh');
    await select(page, 2, 6);
    await tapAt(page, await cardAt(page, 4, 1));
    await expectDrop(page, { sourceColumn: 2, sourceCount: 1, destinationColumn: 4 }, 1);
  });

  test('R-14 R-22 a tap on another column’s placeholder drops there (k 0)', async ({ page }) => {
    await openFixture(page, 'session-idle-empty-column');
    await select(page, 2, 6);
    await tapAt(page, await centre(column(page, 1).locator('.placeholder')));
    await expectDrop(page, { sourceColumn: 2, sourceCount: 1, destinationColumn: 1 }, 0);
  });

  test('R-14 a tap on another column’s empty space drops there', async ({ page }) => {
    await openFixture(page, 'session-idle-fresh');
    await select(page, 1, 6);
    await tapAt(page, await space(page, 6));
    await expectDrop(page, { sourceColumn: 1, sourceCount: 1, destinationColumn: 6 }, 1);
  });

  test('R-14 a tap on another column’s foot pad drops there', async ({ page }) => {
    await openFixture(page, 'session-idle-fresh');
    await select(page, 7, 3);
    await tapAt(page, await centre(foot(page, 8)));
    await expectDrop(page, { sourceColumn: 7, sourceCount: 3, destinationColumn: 8 }, 1);
  });

  test('R-14 R-11 R-22 a self-drop through the source column’s empty space (partial, k 1)', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await select(page, 5, 4);
    await tapAt(page, await space(page, 5));
    await expectDrop(page, { sourceColumn: 5, sourceCount: 2, destinationColumn: 5 }, 1);
  });

  test('R-14 R-11 R-22 a self-drop through a corner of the Here pad (whole column, k 0)', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await select(page, 5, 0);
    await tapAt(page, await footCorner(page, 5));
    await expectDrop(page, { sourceColumn: 5, sourceCount: 6, destinationColumn: 5 }, 0);
  });

  test('R-14 a tap on the selected card is a no-op', async ({ page }) => {
    await openFixture(page, 'session-idle-fresh');
    const before = await stashSession(page);
    await select(page, 2, 3);
    await tapAt(page, await cardAt(page, 2, 3));
    await animationFrames(page, 2);
    await expectSelection(page, { column: 2, count: 4 }, 1);
    expect(await sameSession(page)).toBe(true);
    expect(await storedText(page)).toBe(before);
  });

  test('R-14 R-10 a re-select grows above and shrinks inside the tail with wc kept; the next drop’s sourceCount matches', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await select(page, 3, 4);
    await tapAt(page, await cardAt(page, 3, 1));
    await expectSelection(page, { column: 3, count: 6 }, 1);
    await tapAt(page, await cardAt(page, 3, 5));
    await expectSelection(page, { column: 3, count: 2 }, 1);
    await tapAt(page, await cardAt(page, 4, 6));
    await expectDrop(page, { sourceColumn: 3, sourceCount: 2, destinationColumn: 4 }, 1);
  });

  test('R-14 a WordCell tap (empty and non-empty) deselects with no view; an empty-WordCell long-press deselects on release', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    const before = await stashSession(page);
    for (const cell of [3, 7]) {
      await select(page, 2, 6);
      await tapAt(page, await centre(page.getByTestId(`wordcell-${cell}`)));
      await expectSelection(page, null, 0);
    }
    await select(page, 2, 6);
    await longPress(page, await centre(page.getByTestId('wordcell-4')), 600);
    await expectSelection(page, null, 0);
    expect(await sameSession(page)).toBe(true);
    expect(await storedText(page)).toBe(before);
  });

  test('R-14 F25 outside taps deselect: top bar, score, tray band, labels, gaps, action bar, leftover, disabled controls', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await waitForDictionary(page, 'ready');
    const before = await stashSession(page);
    for (const id of ['undo', 'redo', 'primary-action']) {
      await expect(page.getByTestId(id)).toBeDisabled();
    }
    const bar = await box(page.locator('[data-band="actionBar"]'));
    const top = await box(page.locator('[data-band="topBar"]'));
    const regions: [string, Point][] = [
      ['top bar background', { x: top.x + 22, y: top.y + top.h / 2 }],
      ['score', await centre(page.locator('.score'))],
      ['tray band', await centre(page.locator('[data-band="tray"]'))],
      ['label', await centre(page.locator('.label').first())],
      ['tray gap', await centre(page.locator('[data-band="trayGap"]'))],
      ['action gap', await centre(page.locator('[data-band="actionGap"]'))],
      ['action bar background', { x: bar.x + bar.w / 2, y: bar.y + 2 }],
      ['leftover', await centre(page.locator('[data-band="leftover"]'))],
      ['disabled primary-action', await centre(page.getByTestId('primary-action'))],
      ['disabled Undo', await centre(page.getByTestId('undo'))],
      ['disabled Redo', await centre(page.getByTestId('redo'))],
    ];
    for (const [name, p] of regions) {
      await select(page, 1, 6);
      await tapAt(page, p);
      await expect.poll(() => selection(page), name).toBeNull();
      await expect.poll(() => wcOf(page), name).toBe(0);
    }
    expect(await sameSession(page)).toBe(true);
    expect(await storedText(page)).toBe(before);
  });

  test('R-14 F25 a tap on the banner background deselects; the banner Reload clears it, then acts', async ({
    page,
  }) => {
    let failed = false;
    const held: Route[] = [];
    await page.route(LIST, async (route) => {
      if (!isList(route.request())) return route.continue();
      if (!failed) {
        failed = true;
        return route.abort();
      }
      held.push(route);
    });
    await openFixture(page, 'session-idle-fresh');
    await waitForDictionary(page, 'failed');
    const banner = page.locator('[data-band="banner"]');
    const reload = page.getByRole('button', { name: 'Reload', exact: true });
    await expect(reload).toBeVisible();
    const b = await box(banner);
    await select(page, 1, 6);
    await tapAt(page, { x: b.x + 2, y: b.y + b.h / 2 });
    await expectSelection(page, null, 0);
    await select(page, 1, 6);
    await tapAt(page, await centre(reload));
    await expectSelection(page, null, 0);
    await expect.poll(() => held.length).toBe(1);
    await waitForDictionary(page, 'loading');
    await held[0]?.continue();
  });

  // Entry 11 (R-65, Q-21): the held peek shows above the lifted selection, then closes on release.
  test('R-14 R-65 Q-21 a non-empty WordCell long-press peeks while held and keeps the selection; Session, storage and Undo/Redo unchanged', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    await select(page, 2, 6);
    // R-65 viewing changes nothing: the Session reference, the stored text, Undo/Redo enablement.
    const stored = await stashSession(page);
    const controls = async () => [
      await page.getByTestId('undo').isEnabled(),
      await page.getByTestId('redo').isEnabled(),
    ];
    const controlsBefore = await controls();
    const face = await centre(cards(page, 2).nth(6).locator('.face'));
    const hold = await touchHold(page, await centre(page.getByTestId('wordcell-7')));
    try {
      await page.waitForTimeout(450);
      const sheet = page.locator('[data-view-sheet]');
      await expect(sheet).toBeVisible();
      await expect(sheet).toHaveAttribute('data-mode', 'peek');
      const overflow = await page
        .locator('[data-view-scroll]')
        .evaluate((el) => el.scrollHeight > el.clientHeight);
      expect(overflow).toBe(false);
      const atFace = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        if (el === null) throw new Error('nothing at the lifted face');
        return el.closest('[data-view-scrim]') !== null || el.closest('[data-view-sheet]') !== null;
      }, face);
      expect(atFace).toBe(true);
      // A held peek pushes no history entry: only the selection's.
      expect(await wcOf(page)).toBe(1);
      expect(await controls()).toEqual(controlsBefore);
      expect(await sameSession(page)).toBe(true);
    } finally {
      await hold.end();
    }
    await expect(page.locator('[data-view-sheet]')).toHaveCount(0);
    await animationFrames(page, 2);
    await expectSelection(page, { column: 2, count: 1 }, 1);
    expect(await sameSession(page)).toBe(true);
    expect(await storedText(page)).toBe(stored);
    expect(await controls()).toEqual(controlsBefore);
  });

  test('R-14 AD-13 Undo with a selection clears it (entry popped), then undoes', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    expect(await cursorOf(page)).toEqual({ index: 1, phase: 'idle' });
    await select(page, 2, 6);
    await tapAt(page, await centre(page.getByTestId('undo')));
    await expectSelection(page, null, 0);
    // R-70: one phase state back, from Idle at 1 to the committed move's Place.
    await expect.poll(() => cursorOf(page)).toEqual({ index: 0, phase: 'place' });
  });

  test('R-14 AD-13 Redo with a selection clears it (entry popped), then redoes', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-pending-draft');
    expect(await cursorOf(page)).toEqual({ index: 0, phase: 'idle' });
    await select(page, 2, 6);
    await tapAt(page, await centre(page.getByTestId('redo')));
    await expectSelection(page, null, 0);
    // R-71: one phase state forward, into the pending draft's Composing.
    await expect.poll(() => cursorOf(page)).toEqual({ index: 0, phase: 'composing' });
  });

  test('AD-13 the selection entry is popped on drop and deselect; back clears it with the app open', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await select(page, 1, 6);
    await tapAt(page, await centre(page.locator('[data-band="leftover"]')));
    await expectSelection(page, null, 0);
    await select(page, 1, 6);
    await page.goBack();
    await expectSelection(page, null, 0);
    expect(page.url()).not.toBe('about:blank');
    await expect(page.getByTestId('card-0')).toBeVisible();
    await select(page, 1, 6);
    await tapAt(page, await cardAt(page, 2, 6));
    await expectSelection(page, null, 0);
  });

  test('AD-13 R-14 a reload shows nothing selected with the Session unchanged; select, reload, back leaves the app', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    // The hide flush accrues activeMs (AD-9); the game itself is unchanged.
    const game = async () => {
      const { activeMs: _, ...rest } = JSON.parse((await storedText(page)) ?? 'null');
      return rest;
    };
    const before = await game();
    await select(page, 1, 4);
    await page.reload();
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    await booted(page);
    expect(await selection(page)).toBeNull();
    expect(await game()).toEqual(before);
    await expectLeaves(page);
  });

  test('AD-12 P4 a selected tail lifts its faces 8 px with the shadow inside one teal outline; feet show Here and the wash', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const rects = () =>
      cards(page, 1).evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, left: r.left, width: r.width, height: r.height };
        }),
      );
    const wrappers = await rects();
    await select(page, 1, 4);
    expect(await rects()).toEqual(wrappers);
    const teal = await tokenColor(page, '--wc-accent-teal');
    const faces = await cards(page, 1).evaluateAll((els) =>
      els.map((el) => {
        const face = el.firstElementChild as HTMLElement;
        const s = getComputedStyle(face);
        const r = face.getBoundingClientRect();
        return {
          transform: s.transform,
          shadow: s.boxShadow,
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
        };
      }),
    );
    for (const [i, f] of faces.entries()) {
      if (i >= 4) {
        expect(f.transform).toBe('matrix(1, 0, 0, 1, 0, -8)');
        expect(f.shadow).toBe('rgba(0, 0, 0, 0.533) 0px 6px 16px 0px');
      } else {
        expect(f.transform).toBe('none');
        expect(f.shadow).toBe('none');
      }
    }
    const outline = await page.locator('[data-selection-outline]').evaluate((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        width: s.outlineWidth,
        style: s.outlineStyle,
        color: s.outlineColor,
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
      };
    });
    expect(outline).toMatchObject({ width: '2px', style: 'solid', color: teal });
    const lifted = faces.slice(4);
    expect(outline.top).toBeCloseTo(Math.min(...lifted.map((f) => f.top)), 1);
    expect(outline.bottom).toBeCloseTo(Math.max(...lifted.map((f) => f.bottom)), 1);
    expect(outline.left).toBeCloseTo(lifted[0]?.left ?? Number.NaN, 1);
    expect(outline.right).toBeCloseTo(lifted[0]?.right ?? Number.NaN, 1);
    // DESIGN.md Card selected: the lifted faces and the outline paint above the sticky bars.
    const zOf = (locator: Locator) => locator.evaluate((el) => Number(getComputedStyle(el).zIndex));
    const bar = await zOf(page.locator('[data-band="topBar"]'));
    expect(await zOf(cards(page, 1).nth(4).locator('.face'))).toBeGreaterThan(bar);
    expect(await zOf(page.locator('[data-selection-outline]'))).toBeGreaterThan(bar);
    // 4-7 stacking: those z-indexes compete with the bars' only if no ancestor below `.board`
    // creates a stacking context.
    const contexts = (locator: Locator) =>
      locator.evaluate((el) => {
        const found: string[] = [];
        for (let a = el.parentElement; a !== null && !a.classList.contains('board'); ) {
          const s = getComputedStyle(a);
          const parent = a.parentElement;
          const display = parent === null ? '' : getComputedStyle(parent).display;
          const item = display.includes('flex') || display.includes('grid');
          if (
            (s.position !== 'static' && s.zIndex !== 'auto') ||
            s.position === 'fixed' ||
            s.position === 'sticky' ||
            (item && s.zIndex !== 'auto') ||
            Number(s.opacity) < 1 ||
            s.transform !== 'none' ||
            s.translate !== 'none' ||
            s.scale !== 'none' ||
            s.rotate !== 'none' ||
            s.filter !== 'none' ||
            s.backdropFilter !== 'none' ||
            s.perspective !== 'none' ||
            s.clipPath !== 'none' ||
            s.maskImage !== 'none' ||
            s.mixBlendMode !== 'normal' ||
            s.isolation === 'isolate' ||
            /transform|opacity|filter|perspective|z-index/.test(s.willChange) ||
            /paint|layout|strict|content/.test(s.contain) ||
            s.containerType !== 'normal'
          ) {
            found.push(`${a.tagName}.${a.className}`);
          }
          a = parent;
        }
        return found;
      });
    expect(await contexts(cards(page, 1).nth(4).locator('.face'))).toEqual([]);
    expect(await contexts(page.locator('[data-selection-outline]'))).toEqual([]);

    // F26: elementFromPoint at each card's original slot still answers that card's wrapper.
    const hits = await cards(page, 1).evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === el;
      }),
    );
    expect(hits).toEqual(hits.map(() => true));

    const raised = await tokenColor(page, '--wc-surface-raised');
    const outlineToken = await tokenColor(page, '--wc-outline');
    const wash = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'color-mix(in srgb, var(--wc-accent-teal) 8%, transparent)';
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    const here = foot(page, 1).getByText('Here', { exact: true });
    await expect(here).toBeVisible();
    expect(await foot(page, 1).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(raised);
    for (let n = 2; n <= 8; n++) {
      await expect(foot(page, n).getByText('Here', { exact: true })).toHaveCount(0);
      const style = await foot(page, n).evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          background: s.backgroundColor,
          border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
        };
      });
      expect(style).toEqual({ background: wash, border: `1px dashed ${outlineToken}` });
    }
  });

  test.describe('at 360 × 750', () => {
    test.use({ viewport: { width: 360, height: 750 } });

    test('AD-12 F26 a slot-margin tap hits its card; a lifted tail’s bottom 8 px and the 8 px above it re-select', async ({
      page,
    }) => {
      await openFixture(page, 'session-idle-fresh');
      const wrapper = await box(cards(page, 1).nth(3));
      await tapAt(page, { x: wrapper.x + 1, y: wrapper.y + wrapper.h / 2 });
      await expectSelection(page, { column: 1, count: 4 }, 1);
      await tapAt(page, await cardAt(page, 1, 4));
      await expectSelection(page, { column: 1, count: 3 }, 1);
      const bottom = await box(cards(page, 1).nth(6));
      await tapAt(page, { x: bottom.x + bottom.w / 2, y: bottom.y + bottom.h - 4 });
      await expectSelection(page, { column: 1, count: 1 }, 1);
      await tapAt(page, await cardAt(page, 1, 4));
      await expectSelection(page, { column: 1, count: 3 }, 1);
      const above = await box(cards(page, 1).nth(3));
      await tapAt(page, { x: above.x + above.w / 2, y: above.y + above.h - 4 });
      await expectSelection(page, { column: 1, count: 4 }, 1);
    });
  });

  test('AD-11 the foot row is touch-action none with a tail selected, pan-y without; a held non-card column press’s contextmenu is prevented with one', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const touchActions = () =>
      page
        .locator('[data-foot]')
        .evaluateAll((els) => [...new Set(els.map((el) => getComputedStyle(el).touchAction))]);
    expect(await touchActions()).toEqual(['pan-y']);
    await select(page, 1, 6);
    expect(await touchActions()).toEqual(['none']);
    const at = await space(page, 6);
    const hold = await touchHold(page, at);
    try {
      const prevented = await column(page, 6).evaluate((el) => {
        const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        el.dispatchEvent(event);
        return event.defaultPrevented;
      });
      expect(prevented).toBe(true);
    } finally {
      await hold.end();
    }
  });

  test.describe('at 412 × 600', () => {
    test.use({ viewport: { width: 412, height: 600 } });

    test('R-14 a tray-band pan at a scrolling viewport keeps the selection', async ({ page }) => {
      await openFixture(page, 'session-idle-fresh');
      await select(page, 1, 6);
      const tray = await centre(page.locator('[data-band="tray"]'));
      const hold = await touchHold(page, tray);
      try {
        for (let i = 1; i <= 10; i++) {
          await hold.moveTo({ x: tray.x, y: tray.y - 3 * i });
          await page.waitForTimeout(30);
        }
        expect(
          await page.evaluate(() => window.scrollY),
          'the tray-band pan scrolls',
        ).toBeGreaterThan(0);
      } finally {
        await hold.end();
      }
      await animationFrames(page, 2);
      await expectSelection(page, { column: 1, count: 1 }, 1);
    });
  });
});

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  const classes = (page: Page, n: number) =>
    column(page, n).evaluate((el) => [...el.classList].filter((c) => c.startsWith('wc-')).sort());

  async function moveTo(page: Page, p: Point): Promise<void> {
    await page.mouse.move(p.x, p.y);
    await animationFrames(page, 1);
  }

  // DESIGN.md drop target: the 12 % teal wash, computed through a probe element.
  const wash12 = (page: Page) =>
    page.evaluate(() => {
      const probe = document.createElement('span');
      const c = 'color-mix(in srgb, var(--wc-accent-teal) 12%, transparent)';
      probe.style.backgroundImage = `linear-gradient(${c}, ${c})`;
      document.body.append(probe);
      const image = getComputedStyle(probe).backgroundImage;
      probe.remove();
      return image;
    });
  const imageOf = (locator: Locator) =>
    locator.evaluate((el) => getComputedStyle(el).backgroundImage);

  // The hover outline's box against the hovered card's face top and the bottom card's face bottom.
  async function expectHoverOutline(page: Page, n: number, from: number): Promise<void> {
    const o = await box(column(page, n).locator('.hover-outline'));
    const top = await box(cards(page, n).nth(from).locator('.face'));
    const last = await box(cards(page, n).last().locator('.face'));
    expect(o.y).toBeCloseTo(top.y, 0);
    expect(o.y + o.h).toBeCloseTo(last.y + last.h, 0);
  }

  // The computed outline of the drop-target element.
  const outlineOf = (locator: Locator) =>
    locator.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}`;
    });

  test('AD-12 hover: the grab outline on the tail that would lift (cursor grab)', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const teal = await tokenColor(page, '--wc-accent-teal');
    await moveTo(page, await cardAt(page, 1, 4));
    expect(await classes(page, 1)).toEqual(['wc-grab', 'wc-hover-tail']);
    expect(
      await cards(page, 1)
        .nth(4)
        .evaluate((el) => getComputedStyle(el).cursor),
    ).toBe('grab');
    const outline = column(page, 1).locator('.hover-outline');
    expect(await outlineOf(outline)).toBe(`1px solid ${teal}`);
    const o = await box(outline);
    const from = await box(cards(page, 1).nth(4).locator('.face'));
    const last = await box(cards(page, 1).nth(6).locator('.face'));
    expect(o.y).toBeCloseTo(from.y, 0);
    expect(o.y + o.h).toBeCloseTo(last.y + last.h, 0);
    await moveTo(page, await space(page, 5));
    expect(await classes(page, 1)).toEqual([]);
    expect(await classes(page, 5)).toEqual([]);
    await moveTo(page, await cardAt(page, 2, 0));
    expect(await classes(page, 1)).toEqual([]);
    expect(await classes(page, 2)).toEqual(['wc-grab', 'wc-hover-tail']);
  });

  test('AD-12 hover with a tail selected: drop target on another column (card, space, foot); source only over empty space and Here; re-select outline; nothing on the selected card', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const teal = await tokenColor(page, '--wc-accent-teal');
    const wash = await wash12(page);
    // Column 5 holds 6 cards (empty space below them); the tail is its bottom 3.
    await select(page, 5, 3);
    // Right after a click-select without moving: nothing on the selected card.
    await animationFrames(page, 2);
    expect(await classes(page, 5)).toEqual([]);
    for (const p of [await cardAt(page, 6, 0), await space(page, 6), await centre(foot(page, 6))]) {
      await moveTo(page, p);
      expect(await classes(page, 6)).toEqual(['wc-drop']);
      expect(await outlineOf(cards(page, 6).last().locator('.face'))).toBe(`3px solid ${teal}`);
      expect(await imageOf(cards(page, 6).last().locator('.face'))).toBe(wash);
    }
    await moveTo(page, await cardAt(page, 5, 1));
    expect(await classes(page, 6)).toEqual([]);
    expect(await classes(page, 5)).toEqual(['wc-hover-tail']);
    await expectHoverOutline(page, 5, 1);
    await moveTo(page, await cardAt(page, 5, 5));
    expect(await classes(page, 5)).toEqual(['wc-hover-tail']);
    await expectHoverOutline(page, 5, 5);
    await moveTo(page, await cardAt(page, 5, 3));
    expect(await classes(page, 5)).toEqual([]);
    for (const p of [await space(page, 5), await centre(foot(page, 5))]) {
      await moveTo(page, p);
      expect(await classes(page, 5)).toEqual(['wc-drop-self']);
      expect(await outlineOf(cards(page, 5).nth(2).locator('.face'))).toBe(`3px solid ${teal}`);
      expect(await imageOf(cards(page, 5).nth(2).locator('.face'))).toBe(wash);
    }
  });

  test("AD-12 hover with a tail selected: an empty column's placeholder shows the drop target", async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    const teal = await tokenColor(page, '--wc-accent-teal');
    await select(page, 2, 6);
    const placeholder = column(page, 1).locator('.placeholder');
    await moveTo(page, await centre(placeholder));
    expect(await classes(page, 1)).toEqual(['wc-drop']);
    expect(await outlineOf(placeholder)).toBe(`3px solid ${teal}`);
    expect(await imageOf(placeholder)).toBe(await wash12(page));
  });

  test('AD-12 F31 hover with a whole column selected lights the Here pad', async ({ page }) => {
    await openFixture(page, 'session-idle-fresh');
    const teal = await tokenColor(page, '--wc-accent-teal');
    const wash = await wash12(page);
    await select(page, 5, 0);
    for (const p of [await space(page, 5), await centre(foot(page, 5))]) {
      await moveTo(page, p);
      expect(await classes(page, 5)).toEqual(['wc-drop-self']);
      expect(await outlineOf(foot(page, 5))).toBe(`3px solid ${teal}`);
      expect(await imageOf(foot(page, 5))).toBe(wash);
    }
  });

  test('AD-12 a selected tail replaces the column numbers with Here on the source foot; deselect restores them', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const numbers = async () => {
      const shown: string[] = [];
      for (let n = 1; n <= 8; n++) {
        if (await foot(page, n).getByText(String(n), { exact: true }).isVisible())
          shown.push(`${n}`);
      }
      return shown;
    };
    expect(await numbers()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    await select(page, 3, 6);
    expect(await numbers()).toEqual([]);
    await expect(foot(page, 3).getByText('Here', { exact: true })).toBeVisible();
    await expect(page.locator('[data-foot]').getByText('Here', { exact: true })).toHaveCount(1);
    await tapAt(page, await centre(page.locator('[data-band="leftover"]')));
    await expectSelection(page, null, 0);
    await expect(page.locator('[data-foot]').getByText('Here', { exact: true })).toHaveCount(0);
    expect(await numbers()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
  });

  test('R-14 F25 a side-margin click and box-centre clicks on the disabled controls deselect', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await waitForDictionary(page, 'ready');
    const board = await box(page.locator('[data-band="topBar"]'));
    expect(board.x, 'the board leaves a side margin').toBeGreaterThan(8);
    const points: Point[] = [
      { x: board.x / 2, y: 300 },
      await centre(page.getByTestId('primary-action')),
      await centre(page.getByTestId('undo')),
      await centre(page.getByTestId('redo')),
    ];
    for (const p of points) {
      await select(page, 1, 6);
      await tapAt(page, p);
      await expectSelection(page, null, 0);
    }
  });

  test('AD-13 back with the mouse resting on another column’s empty space leaves no drop highlight', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await select(page, 1, 6);
    await moveTo(page, await space(page, 6));
    expect(await classes(page, 6)).toEqual(['wc-drop']);
    await page.goBack();
    await expectSelection(page, null, 0);
    await expect.poll(() => classes(page, 6)).toEqual([]);
  });
});
