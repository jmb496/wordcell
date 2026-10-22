import { expect, type Locator, type Page } from '@playwright/test';
import { openFixture } from './board';
import { dictionaryReady } from './restore';
import { SESSIONS } from './sessions';

// Epic 6 ticket 6.15: the Flow 6 helpers of e2e/board-keys.spec.ts (ticket 6.11), moved unchanged
// (`tray`, `tiles`, `where`, `focusedCard` and `letters` are what they use).

export const tray = (page: Page) => page.locator('[data-band="tray"]');
export const tiles = (page: Page) => tray(page).locator('[data-card-id][data-place="tray"]');
export type Where = {
  tag: string;
  card: string | null;
  place: string | null;
  column: string | null;
  cell: string | null;
  testid: string | null;
  name: string | null;
};

// A description of the focused element, for Tab-order and focus-target assertions.
export const where = (page: Page): Promise<Where> =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return {
      tag: el?.tagName ?? '',
      card: el?.getAttribute('data-card-id') ?? null,
      place: el?.getAttribute('data-place') ?? null,
      column: el?.closest('[data-column]')?.getAttribute('data-column') ?? null,
      cell: el?.getAttribute('data-wordcell') ?? null,
      testid: el?.getAttribute('data-testid') ?? null,
      name: el?.getAttribute('aria-label') ?? null,
    };
  });

export const focusedCard = async (page: Page): Promise<string | null> => (await where(page)).card;

// EXPERIENCE.md Keyboard "the board" (focus-board.ts `focusBoard`): the bottom live card of the
// lowest-numbered non-empty board column is focused; `main` only when every column is empty.
// `timeout` shortens the poll (the helper's negative self-tests).
export async function expectBoardFocus(
  page: Page,
  { timeout }: { timeout?: number } = {},
): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const columns = [...document.querySelectorAll<HTMLElement>('main [data-column]')].sort(
            (a, b) => Number(a.dataset.column) - Number(b.dataset.column),
          );
          if (columns.length !== 8) return `${columns.length} board columns`;
          const bottom = columns
            .map((c) => [...c.querySelectorAll('[data-card-id][data-place="column"]')].at(-1))
            .find((el) => el !== undefined);
          const target = bottom ?? document.querySelector('main');
          const active = document.activeElement;
          if (active === target) return 'board';
          const name = (el: Element | null | undefined) =>
            `${el?.tagName} ${el?.getAttribute('data-card-id') ?? ''}`.trim();
          return `focused ${name(active)}, expected ${name(target)}`;
        }),
      timeout === undefined ? {} : { timeout },
    )
    .toBe('board');
}
// Records each keydown's final `defaultPrevented` (the app's handler is registered first).
export async function track(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __kp: boolean[] };
    w.__kp = [];
    window.addEventListener('keydown', (event) => w.__kp.push(event.defaultPrevented));
  });
}

// Presses `key`; returns whether the app default-prevented it (it did something).
export async function press(page: Page, key: string): Promise<boolean> {
  await page.keyboard.press(key);
  return page.evaluate(() => (window as unknown as { __kp: boolean[] }).__kp.at(-1) ?? false);
}
export async function open(
  page: Page,
  name: string | { literal: string },
  options: Parameters<typeof openFixture>[2] = {},
) {
  await openFixture(page, name, options);
  await dictionaryReady(page);
  await track(page);
}

// Flow 6 steps 2: `6`, `↑` x3, `5` (columns 1-3 are empty in `SESSIONS.flow6`).
export async function toComposing(page: Page): Promise<void> {
  await open(page, { literal: SESSIONS.flow6 });
  for (const key of ['6', 'ArrowUp', 'ArrowUp', 'ArrowUp', '5']) await page.keyboard.press(key);
  await expect(tiles(page)).toHaveCount(4);
}

async function letters(locator: Locator): Promise<string[]> {
  return locator.evaluateAll((els) =>
    els.map((el) => el.querySelector('.glyph')?.textContent?.toUpperCase() ?? ''),
  );
}

// Moves the tray tiles into `target` (the movable letters after the block) by keys alone: `←`/`→`
// to reach a tile, `Shift`+`←` to carry it left.
export async function arrangeByKeys(page: Page, target: string): Promise<void> {
  for (let p = 0; p < target.length; p++) {
    const have = await letters(tiles(page));
    const c = have.findIndex((letter, i) => i >= p && letter === target[p]);
    expect(c, `a ${target[p]} at or after ${p}`).toBeGreaterThanOrEqual(0);
    if (c === p) continue;
    const ids = await tiles(page).evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-card-id')),
    );
    const carried = ids[c] as string;
    let at = ids.indexOf(await focusedCard(page));
    while (at !== c) {
      await page.keyboard.press(at < c ? 'ArrowRight' : 'ArrowLeft');
      at += at < c ? 1 : -1;
      await expect.poll(() => focusedCard(page)).toBe(ids[at]);
    }
    for (let step = c - 1; step >= p; step--) {
      await page.keyboard.press('Shift+ArrowLeft');
      await expect
        .poll(() =>
          tiles(page)
            .evaluateAll((els) => els.map((el) => el.getAttribute('data-card-id')))
            .then((now) => now.indexOf(carried)),
        )
        .toBe(step);
      expect(await focusedCard(page)).toBe(carried);
    }
  }
}
