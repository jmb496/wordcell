import { describe, expect, it } from 'vitest';
import { EN } from './lang/en';
import { makeLangData } from './lang/lang-data';
import type { Position } from './rules';
import { band, finalScore, lettersLeft, liveScore, penalty } from './scoring';

const QU = EN.letters.indexOf('QU');
const Z = EN.letters.indexOf('Z');
const EMPTY: readonly (readonly number[])[] = [[], [], [], [], [], [], [], []];

/** Eight WordCells (index 0 = WordCell 3) with the given cards at the given cell numbers. */
function cellsWith(entries: Record<number, readonly number[]>): readonly (readonly number[])[] {
  return EMPTY.map((_, i) => entries[i + 3] ?? []);
}

/** Eight columns with the given cards in column 1. */
function columnsWith(cards: readonly number[]): readonly (readonly number[])[] {
  return EMPTY.map((_, i) => (i === 0 ? cards : []));
}

const synthetic = makeLangData(
  'synthetic',
  EN.distribution.map((e) => (e.letter === 'Z' ? { ...e, value: 2 } : { ...e })),
);

describe('scoring', () => {
  it('R-80 live score sums letter count × cell number over WordCells, QU as 2', () => {
    // WordCell 3: 3 cards incl. QU = 4 letters × 3; WordCell 10: 7 cards × 10.
    const cells = cellsWith({ 3: [0, QU, 4], 10: [1, 2, 3, 5, 6, 7, 8] });
    expect(liveScore(cells, EN)).toBe(82);
  });

  it('R-80 live score reads the language letter counts (synthetic LangData)', () => {
    expect(liveScore(cellsWith({ 10: [Z] }), EN)).toBe(10);
    expect(liveScore(cellsWith({ 10: [Z] }), synthetic)).toBe(20);
  });

  it('R-80 live score with every WordCell empty is 0', () => {
    expect(liveScore(EMPTY, EN)).toBe(0);
  });

  it('R-81 a QU left in the columns counts 2 letters, penalty 20', () => {
    const columns = columnsWith([QU]);
    expect(lettersLeft(columns, EN)).toBe(2);
    expect(penalty(columns, EN)).toBe(20);
  });

  it('R-81 empty columns leave 0 letters and no penalty', () => {
    expect(lettersLeft(EMPTY, EN)).toBe(0);
    expect(penalty(EMPTY, EN)).toBe(0);
  });

  it('R-81 letters left and the penalty read the language letter counts (synthetic LangData)', () => {
    const z = columnsWith([Z]);
    expect(lettersLeft(z, EN)).toBe(1);
    expect(lettersLeft(z, synthetic)).toBe(2);
    expect(penalty(z, synthetic)).toBe(20);
  });

  it('R-81 won (empty columns): final equals live', () => {
    const position: Position = {
      columns: EMPTY,
      cells: cellsWith({ 3: [0, QU, 4], 10: [1, 2, 3, 5, 6, 7, 8] }),
    };
    expect(finalScore(position, false, EN)).toBe(82);
    expect(finalScore(position, true, EN)).toBe(82);
  });

  it('R-81 gaveUp subtracts the penalty for letters left; not gaveUp does not', () => {
    // WordCell 4: 4 cards = 16; columns: QU + 2 cards = 4 letters → penalty 40.
    const position: Position = {
      columns: columnsWith([QU, 10, 11]),
      cells: cellsWith({ 4: [0, 1, 2, 3] }),
    };
    expect(liveScore(position.cells, EN)).toBe(16);
    expect(finalScore(position, false, EN)).toBe(16);
    expect(finalScore(position, true, EN)).toBe(16 - 40);
  });

  it('R-81 give up at the deal: −530, unclamped, lowest band', () => {
    const columns = EMPTY.map((_, c) =>
      Array.from({ length: 52 }, (_, id) => id).filter((id) => id % 8 === c),
    );
    const final = finalScore({ columns, cells: EMPTY }, true, EN);
    expect(final).toBe(-530);
    expect(band(final, EN)).toBe(0);
  });

  it('R-83 EN bands at each boundary and for a negative score', () => {
    const thresholds = [50, 100, 150, 200, 250, 300, 350, 400, 530];
    const cases: [number, number][] = [[-530, 0]];
    thresholds.forEach((t, i) => {
      cases.push([t - 1, i], [t, i + 1]);
    });
    cases.push([529, 8], [530, 9]);
    for (const [score, expected] of cases) expect(band(score, EN), `score ${score}`).toBe(expected);
  });

  it('R-83 bands are relative to the language maxScore (synthetic LangData)', () => {
    expect(synthetic.maxScore).toBe(540);
    const thresholds = [50, 100, 150, 200, 250, 300, 350, 400, 530];
    const cases: [number, number][] = [];
    thresholds.forEach((t, i) => {
      const needed = Math.ceil((t * 540) / 530);
      cases.push([needed - 1, i], [needed, i + 1]);
    });
    cases.push([539, 8], [540, 9]);
    for (const [score, expected] of cases)
      expect(band(score, synthetic), `score ${score}`).toBe(expected);
    expect(band(51, EN)).toBe(1);
    expect(band(51, synthetic)).toBe(1);
    expect(band(50, synthetic)).toBe(0);
    expect(band(530, EN)).toBe(9);
    expect(band(530, synthetic)).toBe(8);
  });
});
