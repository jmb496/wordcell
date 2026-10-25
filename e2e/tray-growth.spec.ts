import { expect, type Locator, type Page, test } from '@playwright/test';
import { glidesSettled, openFixture } from './helpers/board';

// Ticket 5.12 (epic 5 SPEC CAP-9; AD-11, AD-14): the Tray band's rows follow the tile count in the
// move's own update, on android at 412 × 839 (leftover 101 absorbs the +48 px of a third compact
// row, scrollTop stays 0) and 412 × 780 (leftover 42, the document scrolls 6 px, geometry.test.ts).
// The WordCell row's viewport box stays put through growth and shrink; fixtures
// `session-composing-long` (14 tiles, one `+` gives 15) and `session-place-long` (15 strip tiles).

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'AD-11 touch layout runs on android');
});

const controls = (page: Page) => page.locator('[data-band="tray"] .controls');
const minus = (page: Page) => controls(page).getByRole('button', { name: '−', exact: true });

type Rect = { top: number; left: number; width: number; height: number };

function rectOf(page: Page, selector: string): Promise<Rect> {
  return page.locator(selector).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  });
}

const wordCellRow = (page: Page) => rectOf(page, '[data-band="wordcells"]');
const trayHeight = async (page: Page) => (await rectOf(page, '[data-band="tray"]')).height;
const scrollY = (page: Page) => page.evaluate(() => window.scrollY);
const tileCount = (page: Page) =>
  page
    .locator('[data-band="tray"] .tiles [data-place], [data-band="tray"] .tiles [data-mirror-of]')
    .count();

// Clicks `target` in the page task and reads, in the same task, how many column faces and how many
// faces in all run an animation (animation time 0), which animating WordCell faces are hidden, and
// whether the tile area's clip is lifted (`wc-drag-tiles`, F22).
async function clickAndRead(target: Locator) {
  return target.evaluate((el) => {
    (el as HTMLElement).click();
    const running = (face: Element) => face.getAnimations().some((a) => a.playState === 'running');
    const faces = [...document.querySelectorAll('[data-card-id] > .face')];
    const animating = faces.filter(running);
    const inColumn = (face: Element) => face.closest('[data-place="column"]') !== null;
    const inCell = (face: Element) => face.closest('[data-place="cell"]') !== null;
    return {
      columnFaces: animating.filter(inColumn).length,
      animating: animating.length,
      hiddenFlying: animating.filter(
        (face) =>
          inCell(face) && getComputedStyle(face.parentElement as Element).visibility === 'hidden',
      ).length,
      tilesLifted: (
        document.querySelector('[data-band="tray"] .tiles') as Element
      ).classList.contains('wc-drag-tiles'),
    };
  });
}

const plus = (page: Page) => controls(page).getByRole('button', { name: '+', exact: true });

// A-D4: the 15th tile (`.tiles` child 14, the third compact row) lies fully inside the tile area and
// is what `elementFromPoint` hits at its centre (the tile or its face).
function fifteenthTile(page: Page) {
  return page.locator('[data-band="tray"] .tiles').evaluate((tiles) => {
    const tile = tiles.children[14] as Element;
    const r = tile.getBoundingClientRect();
    const area = tiles.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      inside:
        r.top >= area.top &&
        r.bottom <= area.bottom &&
        r.left >= area.left &&
        r.right <= area.right,
      hit: hit !== null && tile.contains(hit),
    };
  });
}

for (const [height, grown] of [
  [839, 0],
  [780, 6],
] as const) {
  test.describe(`AD-11 Tray growth at 412 × ${height}`, () => {
    test.use({ viewport: { width: 412, height: height } });

    test(`AD-11 session-composing-long: + gives three rows, − two, the WordCell row box unchanged (scroll 0 / ${grown} / 0), no column face animating`, async ({
      page,
    }) => {
      await openFixture(page, 'session-composing-long');
      const row = await wordCellRow(page);
      const base = await trayHeight(page);
      expect(await tileCount(page)).toBe(14);
      expect(await scrollY(page)).toBe(0);

      const read = await clickAndRead(plus(page));
      // Positive control: the new tile's face animates in this task, so no column face is meaningful.
      expect(read.animating).toBeGreaterThan(0);
      expect(read.columnFaces).toBe(0);
      await glidesSettled(page);
      expect(await tileCount(page)).toBe(15);
      expect(await trayHeight(page)).toBe(base + 48);
      expect(await scrollY(page)).toBe(grown);
      expect(await wordCellRow(page)).toEqual(row);
      expect(await fifteenthTile(page)).toEqual({ inside: true, hit: true });

      // F22, A-D4: the tiles glide up out of the removed third row with the shrunk clip lifted.
      const shrink = await clickAndRead(minus(page));
      expect(shrink.animating).toBeGreaterThan(0);
      expect(shrink.tilesLifted).toBe(true);
      await glidesSettled(page);
      expect(await tileCount(page)).toBe(14);
      expect(await trayHeight(page)).toBe(base);
      expect(await scrollY(page)).toBe(0);
      expect(await wordCellRow(page)).toEqual(row);
    });

    test('AD-11 session-place-long: a Confirm within 150 ms of a scroll event re-lays out at once (the move clears scroll-busy)', async ({
      page,
    }) => {
      // Only 412 × 780 has a scroll range (6 px) with three rows, so only there does a real scroll
      // event make the gate busy.
      test.skip(height !== 780, 'no scroll range at 412 × 839');
      await openFixture(page, 'session-place-long');
      const full = await trayHeight(page);
      // The Confirm is clicked from a `scroll` listener added after the layout gate's own, so the
      // gate is busy (it has seen this scroll, no scrollend yet) with no dependence on frame or
      // smooth-scroll timing.
      const scrolled = await page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            window.addEventListener(
              'scroll',
              () => {
                const y = window.scrollY;
                document.querySelector<HTMLElement>('[data-testid="primary-action"]')?.click();
                resolve(y);
              },
              { once: true },
            );
            window.scrollTo(0, document.documentElement.scrollHeight);
          }),
      );
      expect(scrolled).toBeGreaterThan(0);
      await glidesSettled(page);
      expect(await tileCount(page)).toBe(0);
      expect(await trayHeight(page)).toBe(full - 48);
    });

    test('AD-11 a restored three-row Tray lays out at load at the grown height with no scroll write, and the first Confirm follows the anchor rule', async ({
      page,
    }) => {
      // Restore is the UI-reachable state swap (New game and Replay appear only at game over, with
      // no tiles); it sets the rows with no capture and no scroll write. The following Confirm
      // shrinks 15 → 0 at scroll 0: anchorScroll clamps at 0, so scrollTop stays 0 and the row
      // moves up by the part of the shrink the leftover cannot absorb (6 px at 780, none at 839).
      await page.addInitScript(() => {
        const w = window as unknown as { scrollWrites: number };
        w.scrollWrites = 0;
        const scrollTo = window.scrollTo.bind(window) as (...args: unknown[]) => void;
        window.scrollTo = (...args: unknown[]) => {
          w.scrollWrites++;
          scrollTo(...args);
        };
      });
      // The grown height the other tests use: session-composing-long after one `+`, on a second page.
      const other = await page.context().newPage();
      await openFixture(other, 'session-composing-long');
      const base = await trayHeight(other);
      await plus(other).click();
      await glidesSettled(other);
      const grownHeight = await trayHeight(other);
      expect(grownHeight).toBe(base + 48);
      await other.close();

      await openFixture(page, 'session-place-long');
      const row = await wordCellRow(page);
      const full = await trayHeight(page);
      expect(await tileCount(page)).toBe(15);
      expect(full).toBe(grownHeight);
      expect(await fifteenthTile(page)).toEqual({ inside: true, hit: true });
      expect(await scrollY(page)).toBe(0);
      expect(
        await page.evaluate(() => (window as unknown as { scrollWrites: number }).scrollWrites),
      ).toBe(0);
      await page.getByTestId('primary-action').click();
      await glidesSettled(page);
      expect(await trayHeight(page)).toBe(full - 48);
      expect(await scrollY(page)).toBe(0);
      expect((await wordCellRow(page)).top).toBe(row.top - grown);
    });

    test('AD-11 AD-14 session-place-long: Confirm, Undo and Redo change the rows with the move, the WordCell row stays and the flying cards are visible', async ({
      page,
    }) => {
      await openFixture(page, 'session-place-long');
      expect(await tileCount(page)).toBe(15);
      const full = await trayHeight(page);
      // Scrolled to the bottom (6 px at 780, none at 839), so the shrink keeps the row in place.
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const bottom = await scrollY(page);
      expect(bottom).toBe(grown);
      const row = await wordCellRow(page);

      const confirm = await clickAndRead(page.getByTestId('primary-action'));
      expect(confirm.hiddenFlying).toBe(0);
      expect(confirm.animating).toBeGreaterThan(0);
      await glidesSettled(page);
      expect(await tileCount(page)).toBe(0);
      expect(await trayHeight(page)).toBe(full - 48);
      expect(await scrollY(page)).toBe(0);
      expect(await wordCellRow(page)).toEqual(row);

      await page.getByTestId('undo').click();
      await glidesSettled(page);
      expect(await tileCount(page)).toBe(15);
      expect(await trayHeight(page)).toBe(full);
      expect(await scrollY(page)).toBe(grown);
      expect(await wordCellRow(page)).toEqual(row);

      const redo = await clickAndRead(page.getByTestId('redo'));
      expect(redo.hiddenFlying).toBe(0);
      await glidesSettled(page);
      expect(await tileCount(page)).toBe(0);
      expect(await trayHeight(page)).toBe(full - 48);
      expect(await scrollY(page)).toBe(0);
      expect(await wordCellRow(page)).toEqual(row);
    });
  });
}
