import { expect, type Page, test } from '@playwright/test';
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

  const CELL = 6;

  // The mouse enters the cell `inset` px inside its left edge (so a later leftward shift of the
  // column keeps the pointer on the cell); the peek is open and anchored. Returns its box and its
  // top in document coordinates.
  async function openPeek(page: Page) {
    await page.setViewportSize({ width: 1280, height: 720 });
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

  // Once layout settles: the peek's bottom edge is within 1 px of the label's top edge and it does
  // not overlap the cell (DESIGN.md Components, hover peek).
  async function expectAnchored(page: Page): Promise<void> {
    await expect
      .poll(async () => {
        const peek = await box(hoverPeek(page));
        const anchor = await box(label(page, CELL));
        return Math.abs(peek.y + peek.h - anchor.y) <= 1;
      })
      .toBe(true);
    const peek = await box(hoverPeek(page));
    const c = await box(cell(page, CELL));
    expect(peek.y + peek.h).toBeLessThanOrEqual(c.y);
  }

  test('AD-12 an open hover peek re-anchors above its cell after a viewport width change, the pointer staying on the cell', async ({
    page,
  }) => {
    const before = await openPeek(page);
    const c0 = await box(cell(page, CELL));
    await page.setViewportSize({ width: 1220, height: 720 });
    // The column moved: the peek changed position, the cell did too, and the pointer is still on it.
    await expect.poll(async () => (await placement(page)).x).not.toBe(before.x);
    const c1 = await box(cell(page, CELL));
    expect(Math.abs(c1.x - c0.x)).toBeGreaterThan(1);
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
