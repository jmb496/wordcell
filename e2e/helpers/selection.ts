import { expect, type Page } from '@playwright/test';
import { cards, centre, tapAt } from './board';
import { wc } from './dialogs';

// AD-17 column-selection readers and the column tap-select (ticket 5.14 S1).

export type Selection = { column: number; count: number } | null;

// The rendered selection: the outline's column and its lifted cards.
export function selection(page: Page): Promise<Selection> {
  return page.evaluate(() => {
    const outlines = document.querySelectorAll('[data-selection-outline]');
    if (outlines.length > 1) throw new Error('more than one selection outline');
    const found = outlines[0];
    if (found === undefined) {
      if (document.querySelector('.lifted') !== null) throw new Error('lifted without outline');
      return null;
    }
    const col = found.closest('[data-column]');
    if (col === null) throw new Error('outline outside a column');
    return {
      column: Number(col.getAttribute('data-column')),
      count: col.querySelectorAll('[data-place="column"].lifted').length,
    };
  });
}

// The nav state's `wc` entry count (dialogs.ts `wc`).
export const wcOf = async (page: Page) => (await wc(page))?.wc;

export async function expectSelection(
  page: Page,
  expected: Selection,
  entries: number,
): Promise<void> {
  await expect.poll(() => selection(page)).toEqual(expected);
  await expect.poll(() => wcOf(page)).toBe(entries);
}

// Taps column n's card i and expects the tail from i selected, one History entry.
export async function select(page: Page, n: number, i: number): Promise<void> {
  await tapAt(page, await centre(cards(page, n).nth(i)));
  const count = await cards(page, n).count();
  await expectSelection(page, { column: n, count: count - i }, 1);
}
