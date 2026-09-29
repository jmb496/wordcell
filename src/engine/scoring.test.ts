import { describe, expect, it } from 'vitest';
import { EN } from './lang/en';
import { makeLangData } from './lang/lang-data';
import type { Position } from './rules';
import { band, finalScore, lettersLeft, liveScore, penalty } from './scoring';

const QU = EN.letters.indexOf('QU');
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
    const cases: [number, number][] = [
      [158, 0],
      [159, 1],
      [264, 1],
      [265, 2],
      [377, 2],
      [378, 3],
      [468, 3],
      [469, 4],
      [529, 4],
      [530, 5],
      [-530, 0],
    ];
    for (const [score, expected] of cases) expect(band(score, EN), `score ${score}`).toBe(expected);
  });

  it('R-83 bands are relative to the language maxScore (synthetic LangData)', () => {
    expect(synthetic.maxScore).toBe(540);
    const z = columnsWith([EN.letters.indexOf('Z')]);
    expect(lettersLeft(z, EN)).toBe(1);
    expect(lettersLeft(z, synthetic)).toBe(2);
    const cases: [number, number][] = [
      [161, 0],
      [162, 1],
      [269, 1],
      [270, 2],
      [384, 2],
      [385, 3],
      [477, 3],
      [478, 4],
      [539, 4],
      [540, 5],
    ];
    for (const [score, expected] of cases)
      expect(band(score, synthetic), `score ${score}`).toBe(expected);
    expect(band(159, EN)).toBe(1);
    expect(band(159, synthetic)).toBe(0);
    expect(band(530, EN)).toBe(5);
    expect(band(530, synthetic)).toBe(4);
  });
});
