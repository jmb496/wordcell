import { expect, type Page } from '@playwright/test';
import { END_SHEET } from './board';

// AD-17 Celebration seam helpers (epic 10 entry 5; used by entries 6 and 7). In hook builds the
// celebration is off until `enableCelebration`, which also puts the run on the manual clock; the
// hook's `advance` steps it in whole 16 ms sub-steps (`advance(cap)` stops short of a cap that is
// not a multiple of 16, so the cap constants are rounded up to the next 16 ms step).

/** The manual clock's sub-step (celebration.svelte.ts `MANUAL_STEP_MS`). */
export const MANUAL_STEP_MS = 16;
/** AD-19 cap: 6000 × baseMs / 180 (Fast 90, Normal 180, Slow 320), rounded up to a 16 ms step. */
const capStep = (baseMs: number) =>
  Math.ceil((6000 * baseMs) / 180 / MANUAL_STEP_MS) * MANUAL_STEP_MS;
export const FAST_CAP_STEP_MS = capStep(90);
export const NORMAL_CAP_STEP_MS = capStep(180);
export const SLOW_CAP_STEP_MS = capStep(320);

// Ticket 10.2 (R-88): the won sheet's Words rows of session-won-words, in order. Rows are
// `WON_WORDS_LIST` in src/engine/serialize.test.ts (session-won-words, seed 2089).
export const WON_ROWS = [
  'EHNPBNTFSA, 10 letters',
  'JDAQUYE, 7 letters',
  'EIOGKD, 6 letters',
  'TMXRWO, 6 letters',
  'AECCP, 5 letters',
  'LHVIA, 5 letters',
  'NMIHZ, 5 letters',
  'LTOS, 4 letters',
  'SURF, 4 letters',
  'SURF, 4 letters',
];

/** The hook's celebration object; throws in the page when the hook is absent. */
export const running = (page: Page) =>
  page.evaluate(() => {
    const hook = window.__wordcell;
    if (hook === undefined) throw new Error('AD-17 no test hook');
    return hook.celebration.running();
  });

export const advance = (page: Page, ms: number) =>
  page.evaluate((m) => {
    const hook = window.__wordcell;
    if (hook === undefined) throw new Error('AD-17 no test hook');
    hook.celebration.advance(m);
  }, ms);

/** Waits for the store to be active (main.ts has registered the seam by then), then enables. */
export async function enableCelebration(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => window.__wordcell?.current().kind ?? 'none'))
    .toBe('active');
  await page.evaluate(() => {
    const hook = window.__wordcell;
    if (hook === undefined) throw new Error('AD-17 no test hook');
    hook.celebration.setEnabled(true);
  });
}

/**
 * Waits for a run (`running()` true and its groups mounted), advances past the Slow (largest) cap,
 * then asserts the run is over and the end sheet expanded.
 */
export async function finishCelebration(page: Page): Promise<void> {
  await expect.poll(() => running(page)).toBe(true);
  await expect.poll(() => page.locator('[data-celebration-group]').count()).toBeGreaterThan(0);
  await advance(page, SLOW_CAP_STEP_MS);
  expect(await running(page)).toBe(false);
  await expect(page.getByRole('dialog', { name: END_SHEET })).toBeVisible();
}

type Added = { __added?: Record<string, boolean> };

// The page-side observer: from now on records whether a node matching `selector` is ever added to
// `document` (itself or inside an added subtree). Sent as source; no `__wordcell` name (AD-18).
function observeAdded(selector: string): void {
  const w = window as unknown as Added;
  w.__added ??= {};
  const seen = w.__added;
  seen[selector] = document.querySelector(selector) !== null;
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element && (node.matches(selector) || node.querySelector(selector))) {
          seen[selector] = true;
        }
      }
    }
  }).observe(document, { childList: true, subtree: true });
}

const reader = (page: Page, selector: string) => () =>
  page.evaluate((s) => (window as unknown as Added).__added?.[s] === true, selector);

/** Records whether a `selector` node is ever added from now on; returns the reader. */
export async function watchAdded(page: Page, selector: string): Promise<() => Promise<boolean>> {
  await page.evaluate(observeAdded, selector);
  return reader(page, selector);
}

/** As `watchAdded`, from the next navigation's first script on (call before `goto`). */
export async function watchAddedFromBoot(
  page: Page,
  selector: string,
): Promise<() => Promise<boolean>> {
  await page.addInitScript(observeAdded, selector);
  return reader(page, selector);
}
