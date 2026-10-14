import type { Page } from '@playwright/test';

// AD-17 readers of the store's Session and the stored wordcell:session (ticket 5.14 S1).

export type Draft = {
  phase: string;
  sourceColumn: number;
  sourceCount: number;
  destinationColumn: number;
  destinationCount: number;
};

export type DraftDetail = Draft & { destinationSide: string; arrangement: number[] };

// The cursor phase and the move at the cursor; throws when there is none.
export function draftDetail(page: Page): Promise<DraftDetail> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    const { cursor, moves } = current.session;
    const move = moves[cursor.index];
    if (move === undefined) throw new Error(`no move at cursor ${cursor.index}`);
    return {
      phase: cursor.phase,
      sourceColumn: move.sourceColumn,
      sourceCount: move.sourceCount,
      destinationColumn: move.destinationColumn,
      destinationCount: move.destinationCount,
      destinationSide: move.destinationSide,
      arrangement: [...move.arrangement],
    };
  });
}

// `draftDetail` without the side and the arrangement.
export async function draft(page: Page): Promise<Draft> {
  const { phase, sourceColumn, sourceCount, destinationColumn, destinationCount } =
    await draftDetail(page);
  return { phase, sourceColumn, sourceCount, destinationColumn, destinationCount };
}

// The stored wordcell:session text.
export const storedText = (page: Page) =>
  page.evaluate(() => localStorage.getItem('wordcell:session'));

// The store's Session without `activeMs` (a hide flush accrues time into a new reference).
export function game(page: Page): Promise<string> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return JSON.stringify({ ...current.session, activeMs: 0 });
  });
}

// The stored wordcell:session without `activeMs`.
export function storedGame(page: Page): Promise<string> {
  return page.evaluate(() => {
    const text = localStorage.getItem('wordcell:session');
    if (text === null) throw new Error('wordcell:session is absent');
    return JSON.stringify({ ...JSON.parse(text), activeMs: 0 });
  });
}

export const cursorIndex = (page: Page) =>
  page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    return current.session.cursor.index;
  });
