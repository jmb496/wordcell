import { expect, type Page } from '@playwright/test';

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

/** A double tap's gap from the first tap's touchEnd to the second tap's touchStart. */
export const DOUBLE_TAP_GAP_MS = 80;

type ClickLog = {
  __doubleTapClicks: number[];
  __doubleTapEvents: string[];
  __doubleTapListener: (event: Event) => void;
};

// AD-17 Touch: a touch double tap at `target`. Chromium counts the second tap as a repeat (its
// click has `detail` 2, which presence.ts `firstClick` drops) only when its touchStart comes within
// 400 ms of the first touchEnd on the event clock (measured: 390 ms gives detail 2, 410 ms detail
// 1). Every event carries a CDP `timestamp`, the second tap DOUBLE_TAP_GAP_MS after the first, so
// the count does not depend on how late a loaded machine dispatches it (`touchscreen.tap` stamps
// the dispatch time: under 12 workers real gaps of 500 ms gave detail 1). `between` is the real
// wait between the taps (default DOUBLE_TAP_GAP_MS). The page's clicks are recorded from the first
// tap, and the call fails unless they are exactly two, with detail 1 then 2; the failure lists the
// page's touch and click events with their `timeStamp`s, the CDP stamps (the first in epoch ms)
// and the page's `performance.timeOrigin` (ticket 11.6: the nav.spec.ts:163 detail-1 path had no
// cause from its log).
export async function doubleTap(
  page: Page,
  target: Point,
  {
    between = () => page.waitForTimeout(DOUBLE_TAP_GAP_MS),
  }: { between?: () => Promise<void> } = {},
): Promise<void> {
  await checkPoints(page, 'doubleTap', [target]);
  await page.evaluate(() => {
    const w = window as unknown as ClickLog;
    w.__doubleTapClicks = [];
    w.__doubleTapEvents = [];
    w.__doubleTapListener = (event) => {
      const detail = event.type === 'click' ? `(${(event as MouseEvent).detail})` : '';
      w.__doubleTapEvents.push(`${event.type}${detail}@${event.timeStamp.toFixed(1)}`);
      if (event.type === 'click') w.__doubleTapClicks.push((event as MouseEvent).detail);
    };
    for (const type of ['touchstart', 'touchend', 'click'])
      window.addEventListener(type, w.__doubleTapListener, { capture: true, passive: true });
  });
  const session = await page.context().newCDPSession(page);
  const first = Date.now() / 1000;
  try {
    const tap = async (timestamp: number) => {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: target.x, y: target.y }],
        timestamp,
      });
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
        timestamp,
      });
    };
    await tap(first);
    await between();
    await tap(first + DOUBLE_TAP_GAP_MS / 1000);
  } finally {
    await session.detach();
  }
  try {
    await expect
      .poll(() => page.evaluate(() => (window as unknown as ClickLog).__doubleTapClicks), {
        message: 'doubleTap: the click details of the two taps',
      })
      .toEqual([1, 2]);
  } catch (error) {
    const message = (error as Error).message;
    const read = await page
      .evaluate(() => ({
        events: (window as unknown as ClickLog).__doubleTapEvents,
        timeOrigin: performance.timeOrigin,
      }))
      .catch((readError: Error) => {
        throw new Error(
          `${message}\ndoubleTap: reading the page events failed: ${readError.message}`,
          {
            cause: error,
          },
        );
      });
    throw new Error(
      `${message}\ndoubleTap: page events ${read.events.join(', ')}; CDP stamps ${(first * 1000).toFixed(1)} +0 and +${DOUBLE_TAP_GAP_MS} ms; page timeOrigin ${read.timeOrigin.toFixed(1)}`,
      { cause: error },
    );
  }
  await page.evaluate(() => {
    const w = window as unknown as ClickLog;
    for (const type of ['touchstart', 'touchend', 'click'])
      window.removeEventListener(type, w.__doubleTapListener, true);
  });
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
