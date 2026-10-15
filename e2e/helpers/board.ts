import { expect, type Locator, type Page, test } from '@playwright/test';
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
  // Ticket 6.6 (R-73): a relaunch into won or gaveUp opens the end sheet expanded. Unless 'expanded'
  // is asked for, the sheet is collapsed (its handle) so the Board is live, as in the specs written
  // before the sheet existed.
  endSheet?: 'expanded' | 'collapsed';
  // Ticket 6.7: root fixture `<history>.json` seeded as wordcell:history; when it is unreadable the
  // History notice shows at boot over a live game and is dismissed with Not now before `steps`.
  history?: string;
};

export const END_SHEET = /^(Every column cleared\.|Game given up\.)$/;

// Seeds root fixture `<name>.json` as wordcell:session, opens '/', waits for the heading and the
// 52 live cards, then (by default) for the store to leave 'booting', then clicks `steps`, each
// followed by `glidesSettled` (a step's FLIP glide, AD-14).
export async function openFixture(
  page: Page,
  name: string | { literal: string },
  { prefs, steps = [], booted = true, endSheet = 'collapsed', history }: OpenOptions = {},
): Promise<void> {
  await seedStorage(page, {
    // Ticket 6.11: `{ literal }` seeds a session text (helpers/sessions.ts) that is not a fixtures/ file.
    session: typeof name === 'string' ? fixture(`${name}.json`) : name.literal,
    ...(prefs === undefined ? {} : { prefs: fixture(`${prefs}.json`) }),
    ...(history === undefined ? {} : { history: fixture(`${history}.json`) }),
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  if (booted) await waitBooted(page);
  if (booted && history !== undefined) {
    await page.getByRole('button', { name: 'Not now', exact: true }).click();
    await expect(
      page.getByRole('dialog', { name: "Your score history can't be read." }),
    ).toHaveCount(0);
  }
  if (
    booted &&
    endSheet === 'collapsed' &&
    (await page.getByRole('dialog', { name: END_SHEET }).count()) > 0
  ) {
    await page.getByRole('button', { name: 'Collapse result', exact: true }).click();
    await expect(page.getByRole('dialog', { name: END_SHEET })).toHaveCount(0);
  }
  for (const step of steps) {
    await page.getByTestId(step).click();
    await glidesSettled(page);
  }
}

// Ticket 6.6: collapses the expanded end sheet by its grab handle and waits until it has left.
export async function collapseEndSheet(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Collapse result', exact: true }).click();
  await expect(page.getByRole('dialog', { name: END_SHEET })).toHaveCount(0);
}

// AD-14: waits until no animation runs in the document (FLIP glides, fly-backs, parting), so a
// face read after an act() click sees the settled rect.
export async function glidesSettled(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
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

// One tap at `p` (viewport CSS px): a touchscreen tap on android, a mouse click elsewhere. Works on
// disabled controls (a coordinate tap, no actionability wait).
export async function tapAt(page: Page, p: Point): Promise<void> {
  if (test.info().project.name === 'android') await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
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
    if (window.__pointerSession === undefined) throw new Error('no stashed session');
    return current.session === window.__pointerSession;
  });
}

// The tray band's live cards and mirrors in DOM order, a mirror as `<id>m` (AD-14).
export function trayIds(page: Page): Promise<string[]> {
  return page
    .locator('[data-band="tray"] :is([data-card-id], [data-mirror-of])')
    .evaluateAll((els) =>
      els.map((el) =>
        el.hasAttribute('data-mirror-of')
          ? `${el.getAttribute('data-mirror-of')}m`
          : (el.getAttribute('data-card-id') ?? ''),
      ),
    );
}
