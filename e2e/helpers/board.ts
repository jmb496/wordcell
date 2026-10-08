import { expect, type Locator, type Page } from '@playwright/test';
import { booted as waitBooted } from './restore';
import { fixture, seedStorage } from './seed';

// AD-17 board helpers shared by the epic 4 board, gesture and view specs (ticket 4.13 D8).

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };
export type Step = 'undo' | 'redo';

export type OpenOptions = {
  // Root fixture `<prefs>.json` seeded as wordcell:prefs.
  prefs?: string;
  // Undo / Redo clicks after the board is up, in order.
  steps?: readonly Step[];
  // Wait for the store to leave 'booting' (restore.ts `booted`).
  booted?: boolean;
};

// Seeds root fixture `<name>.json` as wordcell:session, opens '/', waits for the heading and the
// 52 live cards, then (by default) for the store to leave 'booting', then clicks `steps`.
export async function openFixture(
  page: Page,
  name: string,
  { prefs, steps = [], booted = true }: OpenOptions = {},
): Promise<void> {
  await seedStorage(page, {
    session: fixture(`${name}.json`),
    ...(prefs === undefined ? {} : { prefs: fixture(`${prefs}.json`) }),
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  if (booted) await waitBooted(page);
  for (const step of steps) await page.getByTestId(step).click();
}

export const column = (page: Page, n: number) => page.getByTestId(`column-${n}`);
export const cards = (page: Page, n: number) => column(page, n).locator('[data-place="column"]');
export const foot = (page: Page, n: number) => page.getByTestId(`foot-${n}`);

// The locator's bounding box (viewport CSS px); throws when it has none.
export async function box(locator: Locator): Promise<Box> {
  const b = await locator.boundingBox();
  if (b === null) throw new Error('element has no box');
  return { x: b.x, y: b.y, w: b.width, h: b.height };
}

export async function centre(locator: Locator): Promise<Point> {
  const b = await box(locator);
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

// Stashes the store's Session reference; returns the stored wordcell:session text.
export function stashSession(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    window.__pointerSession = current.session;
    return localStorage.getItem('wordcell:session');
  });
}

// Whether the store's Session is the reference stashSession stashed.
export function sameSession(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return current.session === window.__pointerSession;
  });
}
