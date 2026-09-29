/**
 * Core value types for the WordCell rules engine.
 * The engine is pure TypeScript: no DOM, no I/O, no framework imports.
 */

/** Stable card id 0–51 (§2), assigned at deal time; never changes for the life of a game. */
export type CardId = number;

export interface Card {
  readonly id: CardId;
  /** The card's glyph from `LangData.letters` (uppercase, `QU` a single card). */
  readonly letter: string;
}

/** WordCells are numbered by the minimum word length they accept. */
export type WordCellNumber = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const WORD_CELL_NUMBERS: readonly WordCellNumber[] = [3, 4, 5, 6, 7, 8, 9, 10];
export const COLUMN_COUNT = 8;
export const DECK_SIZE = 52;
export const MIN_WORD_LENGTH = 3;
/** R-81 penalty per letter left in the columns. */
export const PENALTY_PER_LETTER = 10;
