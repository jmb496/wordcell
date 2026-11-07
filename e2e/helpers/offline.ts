import { expect, type Page } from '@playwright/test';
import { cards, centre, glidesSettled, tapAt, trayIds } from './board';
import { select, wcOf } from './selection';

// Epic 7 CAP-4 (ticket 7.6) offline-proof helpers, hook-free so `dist/` uses them too.
//
// `pinNextSeed` is an init-script stub of `crypto.getRandomValues` (test-only, no production path):
// every call passes through to the original until `armSeed` sets `window.__wordcellSeedArmed`; the
// next one-element `Uint32Array` call (R-74's New game seed, `src/shell/seed.ts`) gets 1, disarms
// and bumps `window.__wordcellSeedPins`. Other arrays pass through and leave it armed, and AD-13's
// launch id is drawn before any arming, so it stays random. The flag and counter start per document
// (the init script runs on every navigation, the reloaded page included).

/** The tray after `composeTan` (`session-composing.json`'s draft): T, A, N on its left side. */
export const TAN_TRAY: readonly string[] = ['42', '0', '28m'];

const pinned = new WeakSet<Page>();

export async function pinNextSeed(page: Page): Promise<void> {
  if (pinned.has(page)) throw new Error('pinNextSeed: already called on this page');
  // Sent to the page as source: it uses only page globals.
  await page.addInitScript(() => {
    const original = crypto.getRandomValues.bind(crypto);
    window.__wordcellSeedArmed = false;
    window.__wordcellSeedPins = 0;
    crypto.getRandomValues = <T extends Exclude<BufferSource, ArrayBuffer>>(array: T): T => {
      if (
        window.__wordcellSeedArmed === true &&
        array instanceof Uint32Array &&
        array.length === 1
      ) {
        array[0] = 1;
        window.__wordcellSeedArmed = false;
        window.__wordcellSeedPins = (window.__wordcellSeedPins ?? 0) + 1;
        return array;
      }
      return original(array);
    };
  });
  pinned.add(page);
}

/** Arms the stub: the next one-element `Uint32Array` call gets 1. */
export async function armSeed(page: Page): Promise<void> {
  if (!pinned.has(page)) throw new Error('armSeed: pinNextSeed was not called on this page');
  await page.evaluate(() => {
    if (window.__wordcellSeedPins === undefined) {
      throw new Error('armSeed: no seed stub in this document');
    }
    window.__wordcellSeedArmed = true;
  });
}

/** How many calls the stub pinned in this document. */
export async function seedPins(page: Page): Promise<number> {
  if (!pinned.has(page)) throw new Error('seedPins: pinNextSeed was not called on this page');
  return page.evaluate(() => {
    const pins = window.__wordcellSeedPins;
    if (pins === undefined) throw new Error('seedPins: no seed stub in this document');
    return pins;
  });
}

/**
 * On a seed-1 deal in Idle: tap-selects column 3's T A tail, tap-drops it on column 6's N (block
 * left), presses Flip and expects the tray TAN (`session-composing.json`'s draft).
 */
export async function composeTan(page: Page): Promise<void> {
  await select(page, 3, 5);
  await tapAt(page, await centre(cards(page, 6).last()));
  await glidesSettled(page);
  await page.getByRole('button', { name: 'Flip', exact: true }).click();
  await glidesSettled(page);
  await expect.poll(() => trayIds(page)).toEqual(TAN_TRAY);
}

/**
 * R-74 through the menu while a game is in progress: Menu → New game, the confirm appears, the seed
 * stub is armed, the confirm's New game deals; waits until both dialogs have gone, the glides have
 * settled and no History entry is left.
 */
export async function dealNewGame(page: Page): Promise<void> {
  const menu = page.getByRole('dialog', { name: 'Menu', exact: true });
  const confirm = page.getByRole('dialog', { name: 'Start a new game?', exact: true });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(menu).toBeVisible();
  await menu.getByRole('button', { name: 'New game', exact: true }).click();
  await expect(confirm).toBeVisible();
  await armSeed(page);
  await confirm.getByRole('button', { name: 'New game', exact: true }).click();
  await expect(confirm).toHaveCount(0);
  await expect(menu).toHaveCount(0);
  await glidesSettled(page);
  await expect.poll(() => wcOf(page)).toBe(0);
}
