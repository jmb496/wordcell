import type { Page } from '@playwright/test';

// Epic 6 ticket 6.13 (A-E9): a test-side MutationObserver on the polite live region records each
// set (every non-empty text it was given, in order), so a repeated string shows two sets and
// commit-then-outcome shows their order.
declare global {
  interface Window {
    __sr?: string[];
  }
}

export const REGION = '[role="status"][aria-live="polite"]';

/** Installs the recorder; call it after the board is up. */
export async function recordRegion(page: Page): Promise<void> {
  await page.evaluate((selector) => {
    const region = document.querySelector(selector);
    if (region === null) throw new Error('no live region');
    window.__sr = [];
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.textContent) window.__sr?.push(node.textContent);
        }
      }
    }).observe(region, { childList: true, characterData: true, subtree: true });
  }, REGION);
}

/** Every string set since `recordRegion` (or the last `resetRegion`). */
export const sets = (page: Page): Promise<string[]> => page.evaluate(() => window.__sr ?? []);

export async function resetRegion(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__sr = [];
  });
}
