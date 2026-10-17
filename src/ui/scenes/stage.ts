import { COLUMNS, fillerCount, liftedBy } from './geometry';

/** A static card's face from a scene letter (QU counts two letters, R-36). */
export const face = (letter: string) => ({ letter, letterCount: letter === 'QU' ? 2 : 1 });

// Epic 8 ticket 6 (HP-1, HP-6): the filler cards of the shared stage. A column shows at least
// `MIN_COLUMN_CARDS` cards: its scripted cards sit under filler added at the far (top) end, so the
// tail and the bottom cards keep their order. Filler needs no CardId and is in no fixture (the HP-5
// engine replay is unchanged). The letters come from this fixed sequence, no randomness: column 1's
// filler first, then column 2's, and so on, each filler card taking the next letter in turn.
export const FILLER_LETTERS = 'RSTLNEAIODUCMPHGBYFWK';

/**
 * The filler letters of each of the stage's eight columns, far end first, for columns that start
 * with `lengths[i]` scripted cards (a column the scene does not list has none).
 */
export function fillerColumns(lengths: readonly number[]): string[][] {
  let next = 0;
  return Array.from({ length: COLUMNS }, (_, column) =>
    Array.from({ length: fillerCount(lengths[column] ?? 0) }, () => {
      const letter = FILLER_LETTERS[next % FILLER_LETTERS.length];
      next++;
      return letter;
    }),
  );
}

/**
 * The inline base style of card `j` of a growing stack of `cards` (epic 8 ticket 9, HP-1): every
 * card but the top is hidden, and the top card sits collapsed at the stack's top. It equals the
 * first keyframe of the card's grow effect (effects.ts), so cancelling the animations restores it.
 */
export const growBase = (cards: number, j: number): { opacity?: 0; transform?: string } =>
  j < cards - 1 ? { opacity: 0 } : { transform: liftedBy(cards - 1) };
