import { expect, type Locator, type Page, test } from '@playwright/test';
import { animationFrames } from './helpers/lifecycle';
import { booted, openBoard } from './helpers/restore';
import { fixture, seedStorage } from './helpers/seed';
import { touchDrag, touchHold } from './helpers/touch';

// Epic 4 entry 6: the pointer controller's DOM wiring (AD-12, AD-11 contextmenu; SPEC CAP-4,
// rule-coverage AD-11 and AD-12 rows) and the F25 probe that its root spans the viewport.

async function openFixture(page: Page, name: string): Promise<void> {
  await seedStorage(page, { session: fixture(`${name}.json`) });
  await page.goto('/');
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await booted(page);
}

async function centre(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error('element has no box');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// Stashes the store's Session reference and returns the stored wordcell:session text.
function stashSession(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    window.__pointerSession = current.session;
    return localStorage.getItem('wordcell:session');
  });
}

function sameSession(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return current.session === window.__pointerSession;
  });
}

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
  // The only uncovered strip is the `scrollbar-gutter: stable` gutter (no page pointer events).
  expect(r.innerWidth - r.width).toBeLessThanOrEqual(desktop ? 20 : 0);
  expect(r.top).toBeLessThanOrEqual(0);
  expect(r.bottom).toBeGreaterThanOrEqual(r.height);
});
