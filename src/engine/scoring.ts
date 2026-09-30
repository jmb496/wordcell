import type { LangData } from './lang/lang-data';
import { type Position, wordLetterCount } from './rules';
import { BAND_DENOMINATOR, BAND_THRESHOLDS, PENALTY_PER_LETTER, WORD_CELL_NUMBERS } from './types';

/** R-80 live score: Σ over WordCells of letter count × the cell's number (committed cells, AD-3). */
export function liveScore(cells: Position['cells'], lang: LangData): number {
  return cells.reduce(
    (sum, cell, i) => sum + wordLetterCount(cell, lang) * WORD_CELL_NUMBERS[i],
    0,
  );
}

/** R-81 letters left in the columns (`QU` 2). */
export function lettersLeft(columns: Position['columns'], lang: LangData): number {
  return columns.reduce((sum, column) => sum + wordLetterCount(column, lang), 0);
}

/** R-81 give-up penalty: `PENALTY_PER_LETTER` × letters left. */
export function penalty(columns: Position['columns'], lang: LangData): number {
  return PENALTY_PER_LETTER * lettersLeft(columns, lang);
}

/** R-81 final score: live score minus the penalty when given up; unclamped (Q-28). */
export function finalScore(position: Position, gaveUp: boolean, lang: LangData): number {
  return liveScore(position.cells, lang) - (gaveUp ? penalty(position.columns, lang) : 0);
}

/** R-83 band 0–5: count of thresholds met by `score × BAND_DENOMINATOR ≥ t × maxScore`. */
export function band(score: number, lang: LangData): number {
  return BAND_THRESHOLDS.filter((t) => score * BAND_DENOMINATOR >= t * lang.maxScore).length;
}
