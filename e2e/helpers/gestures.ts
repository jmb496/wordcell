import { expect, type Locator, type Page } from '@playwright/test';
import { type Box, box, column, foot, type Point } from './board';
import { animationFrames } from './lifecycle';
import { type TouchHold, touchHold } from './touch';

// AD-17 gesture and geometry helpers shared by the drag, tap and view specs (ticket 5.14 S1).

// `p` moved by (dx, dy).
export const plus = (p: Point, dx: number, dy: number): Point => ({ x: p.x + dx, y: p.y + dy });

// `steps` points from `from` (excluded) to `to` (included).
export function path(from: Point, to: Point, steps: number): Point[] {
  return Array.from({ length: steps }, (_, i) => ({
    x: from.x + ((to.x - from.x) * (i + 1)) / steps,
    y: from.y + ((to.y - from.y) * (i + 1)) / steps,
  }));
}

// One held touch moved to each point in turn, a frame after each move (pointermove is
// frame-aligned); `check` runs after every move. A failed move ends the hold and rethrows.
export async function holdThrough(
  page: Page,
  from: Point,
  points: Point[],
  check: (i: number) => Promise<void> = async () => undefined,
): Promise<TouchHold> {
  const hold = await touchHold(page, from);
  try {
    for (const [i, p] of points.entries()) {
      await hold.moveTo(p);
      await animationFrames(page, 2);
      await check(i);
    }
  } catch (error) {
    await hold.end();
    throw error;
  }
  return hold;
}

// A card wrapper's face (AD-14).
export const faceOf = (card: Locator) => card.locator(':scope > .face');

export async function idOf(card: Locator): Promise<number> {
  const attr = await card.getAttribute('data-card-id');
  const id = Number(attr);
  if (attr === null || Number.isNaN(id)) throw new Error('card has no numeric data-card-id');
  return id;
}

export const css = (locator: Locator, property: string) =>
  locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);

// The `data-column`s of elements carrying `wc-drag-target` (or that of their column).
export function targets(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.wc-drag-target')].map((el) =>
      Number(el.closest('[data-column]')?.getAttribute('data-column')),
    ),
  );
}

// R-14 the tail returned: `face` has no running animation and is back on `rest` (±1 px).
export async function expectFlownBack(face: Locator, rest: Box): Promise<void> {
  await expect.poll(() => face.evaluate((el) => el.getAnimations().length)).toBe(0);
  const now = await box(face);
  for (const k of ['x', 'y', 'w', 'h'] as const) {
    expect(Math.abs(now[k] - rest[k]), k).toBeLessThanOrEqual(1);
  }
}

export const placeholder = (page: Page, n: number) => column(page, n).locator('[data-placeholder]');

// A point in column n's empty space: 6 px above its foot pad, below its bottom card or ghost.
export async function space(page: Page, n: number): Promise<Point> {
  const f = await box(foot(page, n));
  const y = f.y - 6;
  const last = column(page, n).locator('[data-place="column"], [data-mirror-of]').last();
  if ((await last.count()) > 0) {
    const b = await box(last);
    if (b.y + b.h >= y) throw new Error(`column ${n} has no empty space`);
  }
  return { x: f.x + f.w / 2, y };
}

// A corner of foot-n, off its label.
export async function footCorner(page: Page, n: number): Promise<Point> {
  const f = await box(foot(page, n));
  return { x: f.x + 3, y: f.y + 3 };
}
