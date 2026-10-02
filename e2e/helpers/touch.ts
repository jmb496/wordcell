import type { Page } from '@playwright/test';

// AD-17 Touch: real touch input through CDP `Input.dispatchTouchEvent` (viewport CSS pixels).
type Point = { x: number; y: number };

async function checkPoints(page: Page, helper: string, points: Point[]): Promise<void> {
  const viewport = page.viewportSize();
  if (viewport === null) throw new Error(`${helper}: page has no viewport size`);
  for (const { x, y } of points) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`${helper}: point (${x}, ${y}) is not finite`);
    }
    if (x < 0 || y < 0 || x >= viewport.width || y >= viewport.height) {
      throw new Error(
        `${helper}: point (${x}, ${y}) is outside the ${viewport.width}×${viewport.height} viewport`,
      );
    }
  }
  const maxTouchPoints = await page.evaluate(() => navigator.maxTouchPoints);
  if (!(maxTouchPoints > 0)) {
    throw new Error(`${helper}: navigator.maxTouchPoints is ${maxTouchPoints}; not a touch page`);
  }
}

export async function touchDrag(
  page: Page,
  from: Point,
  to: Point,
  { steps = 10 }: { steps?: number } = {},
): Promise<void> {
  if (!Number.isInteger(steps) || steps < 1) {
    throw new Error(`touchDrag: steps must be an integer ≥ 1 (got ${steps})`);
  }
  if (from.x === to.x && from.y === to.y) throw new Error('touchDrag: from equals to');
  await checkPoints(page, 'touchDrag', [from, to]);
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from.x, y: from.y }],
    });
    for (let i = 1; i <= steps; i++) {
      const x = i === steps ? to.x : from.x + ((to.x - from.x) * i) / steps;
      const y = i === steps ? to.y : from.y + ((to.y - from.y) * i) / steps;
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y }],
      });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await session.detach();
  }
}

export async function longPress(page: Page, target: Point, ms: number): Promise<void> {
  if (!Number.isInteger(ms) || ms < 1) {
    throw new Error(`longPress: ms must be an integer ≥ 1 (got ${ms})`);
  }
  await checkPoints(page, 'longPress', [target]);
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: target.x, y: target.y }],
    });
    await page.waitForTimeout(ms);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await session.detach();
  }
}

export type TouchHold = { moveTo(point: Point): Promise<void>; end(): Promise<void> };

// AD-17 Touch (F10): one touch held across `moveTo` steps until `end()`, on one CDP session.
// `from` is checked before the session opens. A failed `moveTo` (validation or a CDP rejection)
// ends the hold (touchEnd attempt, detach) and rethrows; once ended, `moveTo` throws and `end()`
// is a no-op. Callers end holds in try/finally.
export async function touchHold(page: Page, from: Point): Promise<TouchHold> {
  await checkPoints(page, 'touchHold', [from]);
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from.x, y: from.y }],
    });
  } catch (error) {
    await session.detach().catch(() => undefined);
    throw error;
  }
  let ended = false;

  async function finish(): Promise<void> {
    ended = true;
    try {
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally {
      await session.detach();
    }
  }

  return {
    async moveTo(point: Point): Promise<void> {
      if (ended) throw new Error('touchHold: moveTo after the hold ended');
      try {
        await checkPoints(page, 'touchHold', [point]);
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: point.x, y: point.y }],
        });
      } catch (error) {
        await finish().catch(() => undefined);
        throw error;
      }
    },
    async end(): Promise<void> {
      if (ended) return;
      await finish();
    },
  };
}
