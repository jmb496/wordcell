import { expect, type Locator, test } from '@playwright/test';
import { centre, openFixture, sameSession, stashSession } from './helpers/board';
import { animationFrames } from './helpers/lifecycle';
import { openBoard } from './helpers/restore';
import { touchDrag, touchHold } from './helpers/touch';

// Epic 4 entry 6: the pointer controller's DOM wiring (AD-12, AD-11 contextmenu; SPEC CAP-4,
// rule-coverage AD-11 and AD-12 rows) and the F25 probe that its root spans the viewport.

// Dispatches a cancelable, bubbling contextmenu (no pointerId) at `locator`; true if prevented.
function contextmenuPrevented(locator: Locator): Promise<boolean> {
  return locator.evaluate((el) => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event.defaultPrevented;
  });
}

test.describe('android', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'android', 'touch pointer flows run on android');
  });

  test('AD-12 a tap and a drag on a static tray tile change nothing', async ({ page }) => {
    await openFixture(page, 'session-composing');
    const tile = page.locator('[data-place="tray"]').first();
    await expect(tile).toBeVisible();
    const before = await stashSession(page);
    const from = await centre(tile);

    const tap = await touchHold(page, from);
    await tap.end();
    await touchDrag(page, from, { x: from.x + 30, y: from.y });
    await animationFrames(page, 2);

    expect(await sameSession(page)).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('wordcell:session'))).toBe(before);
  });

  test('AD-11 AD-12 a held press’s contextmenu is defaultPrevented on a column card and a tray tile, not on a foot pad with nothing selected', async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    const card = page.locator('[data-testid="column-1"] [data-place="column"]').last();
    const tile = page.locator('[data-place="tray"]').first();
    const foot = page.getByTestId('foot-1');
    const cases: [Locator, boolean][] = [
      [card, true],
      [tile, true],
      [foot, false],
    ];
    for (const [target, prevented] of cases) {
      await expect(target).toBeVisible();
      const hold = await touchHold(page, await centre(target));
      try {
        expect(await contextmenuPrevented(target)).toBe(prevented);
      } finally {
        await hold.end();
      }
    }
  });
});

test('AD-12 the controller root spans the viewport', async ({ page }) => {
  await openBoard(page);
  const main = page.locator('main');
  await expect(main).toHaveCount(1);
  for (const band of ['topBar', 'banner', 'actionBar']) {
    await expect(main.locator(`[data-band="${band}"]`)).toHaveCount(1);
  }
  const desktop = test.info().project.name === 'desktop';
  const r = await main.evaluate((el, gutter) => {
    window.scrollTo(0, 0);
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      // desktop: the root's box, which excludes the `scrollbar-gutter: stable` strip (this
      // Chromium reports clientWidth 1280 there although the gutter is reserved).
      width: gutter ? document.documentElement.getBoundingClientRect().right : innerWidth,
      innerWidth,
      height: innerHeight,
    };
  }, desktop);
  expect(r.left).toBeLessThanOrEqual(0);
  expect(r.right).toBeGreaterThanOrEqual(r.width);
  // The only uncovered strip is the `scrollbar-gutter: stable` gutter: it is outside the root, so
  // its events do not reach the controller.
  expect(r.innerWidth - r.width).toBeLessThanOrEqual(desktop ? 20 : 0);
  expect(r.top).toBeLessThanOrEqual(0);
  expect(r.bottom).toBeGreaterThanOrEqual(r.height);
});
