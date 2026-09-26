/**
 * Core value types for the WordCell rules engine.
 * The engine is pure TypeScript: no DOM, no I/O, no framework imports.
 */

/** A letter card. `QU` is a single card that contributes two letters. */
export type Letter =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'QU'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

export interface Card {
  /** Stable id 0..51, assigned at deal time; never changes for the life of a game. */
  readonly id: number;
  readonly letter: Letter;
}

/** WordCells are numbered by the minimum word length they accept. */
export type WordCellNumber = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const WORD_CELL_NUMBERS: readonly WordCellNumber[] = [3, 4, 5, 6, 7, 8, 9, 10];
export const COLUMN_COUNT = 8;
export const DECK_SIZE = 52;
export const MIN_WORD_LENGTH = 3;
export const STUCK_PENALTY_PER_CARD = 10;

/** English letter distribution; counts sum to 52. Data-driven so other languages can follow. */
export const ENGLISH_DISTRIBUTION: Readonly<Record<Letter, number>> = {
  A: 3,
  B: 1,
  C: 2,
  D: 2,
  E: 4,
  F: 2,
  G: 1,
  H: 3,
  I: 3,
  J: 1,
  K: 1,
  L: 2,
  M: 2,
  N: 3,
  O: 3,
  P: 2,
  QU: 1,
  R: 3,
  S: 3,
  T: 3,
  U: 2,
  V: 1,
  W: 1,
  X: 1,
  Y: 1,
  Z: 1,
};
