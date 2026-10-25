import { expect, type Page, test } from '@playwright/test';
import { placeHoverPeek } from '../src/ui/hover-peek';
import { box, openFixture } from './helpers/board';
import { onDesktop } from './helpers/project';
import { waitForDictionary } from './helpers/restore';

// Ticket 6.14 (F6, epic 4 retro A8): an open desktop hover peek re-anchors above its cell when the
// layout shifts under it (`HoverPeek.svelte` re-places on `layout.w`, `heights`, `bannerShown`; AD-12,
// DESIGN.md Components, hover peek: directly above the cell, never covering it). Desktop only.

const hoverPeek = (page: Page) => page.locator('[data-hover-peek]');
const label = (page: Page, n: number) => page.locator(`[data-wordcell-label="${n}"]`);
const cell = (page: Page, n: number) => page.getByTestId(`wordcell-${n}`);

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  // Cell 7 (21 cards in session-won): its peek's x is clamped to the column's right edge, so it
  // depends on the slot (cell 6's is clamped to 0 at every w).
  const CELL = 7;

  // The mouse enters the cell `inset` px inside its left edge (so a later leftward shift of the
  // column keeps the pointer on the cell); the peek is open and anchored. Returns its box and its
  // top in document coordinates.
  async function openPeek(page: Page, size = { width: 1280, height: 720 }) {
    await page.setViewportSize(size);
    await openFixture(page, 'session-won');
    const c = await box(cell(page, CELL));
    await page.mouse.move(c.x + 3, c.y + c.h / 2);
    await expect(hoverPeek(page)).toBeVisible();
    await expectAnchored(page);
    return placement(page);
  }

  // The peek's left in the viewport and its top in document coordinates.
  async function placement(page: Page): Promise<{ x: number; docY: number }> {
    const peek = await box(hoverPeek(page));
    const y = await page.evaluate(() => window.scrollY);
    return { x: peek.x, docY: peek.y + y };
  }

  // The peek's expected left: the board column's left (the cell's grid unit) plus the owner's
  // `placeHoverPeek` x for the cell's slot (its width) and the peek's rendered size.
  async function expectedLeft(page: Page): Promise<number> {
    const peek = await box(hoverPeek(page));
    const c = await box(cell(page, CELL));
    const anchor = await box(label(page, CELL));
    const unitLeft = await cell(page, CELL).evaluate((el) => {
      if (el.parentElement === null) throw new Error('WordCell outside its grid unit');
      return el.parentElement.getBoundingClientRect().left;
    });
    const { x } = placeHoverPeek({
      cell: CELL,
      slot: c.w,
      width: peek.w,
      height: peek.h,
      labelTop: anchor.y,
      cellBottom: c.y + c.h,
      boardTop: (await box(page.locator('.board'))).y,
    });
    return unitLeft + x;
  }

  // Once layout settles: the peek's bottom edge is within 1 px of the label's top edge, its left
  // within 1 px of `expectedLeft`, and it does not overlap the cell (DESIGN.md Components, hover
  // peek).
  async function expectAnchored(page: Page): Promise<void> {
    await expect
      .poll(async () => {
        const peek = await box(hoverPeek(page));
        const anchor = await box(label(page, CELL));
        return (
          Math.abs(peek.y + peek.h - anchor.y) <= 1 &&
          Math.abs(peek.x - (await expectedLeft(page))) <= 1
        );
      })
      .toBe(true);
    const peek = await box(hoverPeek(page));
    const c = await box(cell(page, CELL));
    expect(peek.y + peek.h).toBeLessThanOrEqual(c.y);
  }

  test('AD-12 an open hover peek re-anchors above its cell after a viewport width change, the pointer staying on the cell', async ({
    page,
  }) => {
    // At 1000 px tall the width rule sets w (AD-11 `cardWidth`): 75 at 700 px wide, 67 at 600.
    const before = await openPeek(page, { width: 700, height: 1000 });
    const c0 = await box(cell(page, CELL));
    await page.setViewportSize({ width: 600, height: 1000 });
    // The column moved and w changed: the peek changed position, the cell moved and narrowed, and
    // the pointer is still on it.
    await expect.poll(async () => (await placement(page)).x).not.toBe(before.x);
    const c1 = await box(cell(page, CELL));
    expect(Math.abs(c1.x - c0.x)).toBeGreaterThan(1);
    expect(c1.w).toBeLessThan(c0.w);
    const onCell = await page.evaluate(
      ([x, y]) =>
        document.elementFromPoint(x as number, y as number)?.closest('[data-wordcell]') != null,
      [c0.x + 3, c0.y + c0.h / 2],
    );
    expect(onCell).toBe(true);
    await expect(hoverPeek(page)).toBeVisible();
    await expectAnchored(page);
  });

  test('AD-12 an open hover peek re-anchors above its cell when the dictionary banner shows', async ({
    page,
  }) => {
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    // AD-8: the word list request fails, but only once the peek is open.
    await page.route('**/en*.txt', async (route) => {
      if (!/\/en[^/?]*\.txt$/.test(route.request().url())) return route.continue();
      await held;
      return route.abort();
    });
    const before = await openPeek(page);
    release();
    await waitForDictionary(page, 'failed');
    // The banner grows the page and layout scrolls by its height: the peek moved in the document.
    await expect.poll(async () => (await placement(page)).docY).not.toBe(before.docY);
    expect((await box(page.locator('[data-band="banner"]'))).h).toBeGreaterThan(0);
    await expect(hoverPeek(page)).toBeVisible();
    await expectAnchored(page);
  });
});
