import { describe, expect, it } from 'vitest';
import type { CellView, WordCellNumber } from '../../engine/index';
import { originCard } from './tags';

const cellView = (cell: WordCellNumber, cards: number[]): CellView => ({
  cell,
  cards,
  used: false,
  canAddFreeLetter: false,
  canSetTarget: false,
  isLegalTarget: false,
});

describe('AD-3 origin-tag lookup', () => {
  it('AD-3 originCard finds the cell by its cell field and returns its top card', () => {
    // Out of order and missing cells: an index by cell number would read the wrong entry.
    const cells = [cellView(7, [4, 11, 35]), cellView(3, [28]), cellView(5, [])];
    expect(originCard(cells, 7)).toBe(35);
    expect(originCard(cells, 3)).toBe(28);
  });

  it('AD-3 originCard throws naming the cell when its entry is missing', () => {
    expect(() => originCard([cellView(3, [28])], 9)).toThrow(
      new Error('origin tag: no top card in WordCell 9'),
    );
  });

  it('AD-3 originCard throws naming the cell when its cards are empty', () => {
    expect(() => originCard([cellView(5, [])], 5)).toThrow(
      new Error('origin tag: no top card in WordCell 5'),
    );
  });
});
