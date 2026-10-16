import { expect, type Page, test } from '@playwright/test';
import { box, cards, centre, openFixture, type Point } from './helpers/board';
import { expectNoResidue } from './helpers/drag';
import { faceOf, path, targets } from './helpers/gestures';
import { animationFrames } from './helpers/lifecycle';
import { onDesktop } from './helpers/project';
import { draftDetail } from './helpers/session';

// Ticket 6.14 (F3, epic 4 retro A8): the wheel scrolls the page under a held mouse drag and no
// pointermove follows; the faces, the highlight and the drop target must follow the pointer (AD-12,
// F34). Desktop only (a mouse drag). A short viewport makes the fresh board overflow.

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  const scrollY = (page: Page) => page.evaluate(() => window.scrollY);
  const maxScroll = (page: Page) =>
    page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

  // Opens the fresh board in a 560 px viewport, column 1's bottom card at the page top, and
  // returns the grab point on it and the point over column 3's bottom card.
  async function ready(page: Page): Promise<{ from: Point; to: Point }> {
    await page.setViewportSize({ width: 1280, height: 560 });
    await openFixture(page, 'session-idle-fresh');
    expect(await maxScroll(page)).toBeGreaterThan(150);
    await page.evaluate(() => window.scrollTo(0, 0));
    await animationFrames(page, 2);
    const from = await centre(cards(page, 1).last());
    const to = await centre(cards(page, 3).last());
    return { from, to };
  }

  async function hold(page: Page, from: Point, to: Point): Promise<void> {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (const p of path(from, to, 5)) {
      await page.mouse.move(p.x, p.y);
      await animationFrames(page, 1);
    }
  }

  test('AD-12 F3 a wheel scroll during a held mouse drag keeps the face under the pointer and re-targets: the scroll takes column 3 away, scrolling back lights it and the release drops there', async ({
    page,
  }) => {
    const { from, to } = await ready(page);
    await hold(page, from, to);
    expect(await targets(page)).toEqual([3]);
    const dragged = faceOf(cards(page, 1).last());
    const before = await box(dragged);
    const y0 = await scrollY(page);
    const wheel = async (delta: number) => {
      const y = await scrollY(page);
      await page.mouse.wheel(0, delta);
      await expect.poll(() => scrollY(page)).not.toBe(y);
      await animationFrames(page, 2);
    };
    const expectUnderPointer = async () => {
      const now = await box(dragged);
      // The face stayed under the pointer: its viewport rect did not move with the page.
      expect(Math.abs(now.y - before.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(now.x - before.x)).toBeLessThanOrEqual(1);
    };
    // Down: the page moves up under the pointer, column 3 ends above the face (recomputed, unlit).
    await wheel(150);
    expect((await scrollY(page)) - y0).toBeGreaterThan(100);
    await expectUnderPointer();
    const col3 = await box(page.getByTestId('column-3'));
    expect(col3.y + col3.h).toBeLessThan(before.y + before.h * 0.75);
    expect(await targets(page)).toEqual([]);
    // Back up to the start: column 3 is under the face again.
    await wheel(-150);
    expect(Math.abs((await scrollY(page)) - y0)).toBeLessThanOrEqual(1);
    await expectUnderPointer();
    expect(await targets(page)).toEqual([3]);
    await page.mouse.up();
    await expect.poll(async () => (await draftDetail(page)).phase).toBe('composing');
    expect(await draftDetail(page)).toMatchObject({
      sourceColumn: 1,
      sourceCount: 1,
      destinationColumn: 3,
    });
    await expectNoResidue(page);
  });

  test('AD-12 F3 a wheel at the page end scrolls nothing and changes neither the face nor the target', async ({
    page,
  }) => {
    await ready(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(async () => (await maxScroll(page)) - (await scrollY(page))).toBeLessThan(1);
    await animationFrames(page, 2);
    const grab = await centre(cards(page, 1).last());
    const to = await centre(cards(page, 3).last());
    await hold(page, grab, to);
    expect(await targets(page)).toEqual([3]);
    const dragged = faceOf(cards(page, 1).last());
    const before = await box(dragged);
    const transform = await dragged.evaluate((el) => (el as HTMLElement).style.transform);
    const y0 = await scrollY(page);
    await page.mouse.wheel(0, 200);
    await animationFrames(page, 3);
    expect(await scrollY(page)).toBe(y0);
    expect(await box(dragged)).toEqual(before);
    expect(await dragged.evaluate((el) => (el as HTMLElement).style.transform)).toBe(transform);
    expect(await targets(page)).toEqual([3]);
    await page.mouse.up();
    await expect.poll(async () => (await draftDetail(page)).phase).toBe('composing');
    await expectNoResidue(page);
  });
});
