import { describe, expect, it } from 'vitest';
import { hoverPeekCards, hoverPeekWidth, placeHoverPeek } from './hover-peek';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

describe('AD-12 hover peek slice', () => {
  it('AD-12 one card: shown, no older', () => {
    expect(hoverPeekCards([7])).toEqual({ shown: [7], older: 0 });
  });

  it('AD-12 14 cards: all shown, no older', () => {
    expect(hoverPeekCards(range(14))).toEqual({ shown: range(14), older: 0 });
  });

  it('AD-12 15 cards: the top 14 oldest first, one older', () => {
    expect(hoverPeekCards(range(15))).toEqual({ shown: range(15).slice(1), older: 1 });
  });
});

describe('AD-12 hover peek width', () => {
  it('AD-12 min(count, 7) slots − 4 + 32', () => {
    expect(hoverPeekWidth(1, 44)).toBe(72);
    expect(hoverPeekWidth(7, 44)).toBe(336);
    expect(hoverPeekWidth(14, 44)).toBe(336);
  });
});

describe('AD-12 hover peek placement', () => {
  // Slot 44: board column 352 wide; cell n's centre at (n − 2.5) × 44.
  const base = { slot: 44, height: 100, labelTop: 300, cellBottom: 376, boardTop: 0 };

  it('AD-12 a narrow peek is centred on the cell, above the label', () => {
    expect(placeHoverPeek({ ...base, cell: 6, width: 72 })).toEqual({
      x: 3.5 * 44 - 36,
      y: 200,
      below: false,
    });
  });

  it('AD-12 left-clamped to the column', () => {
    expect(placeHoverPeek({ ...base, cell: 3, width: 336 }).x).toBe(0);
  });

  it('AD-12 right-clamped to the column', () => {
    expect(placeHoverPeek({ ...base, cell: 10, width: 336 }).x).toBe(352 - 336);
  });

  it('AD-12 above when the room equals the height', () => {
    expect(placeHoverPeek({ ...base, cell: 6, width: 72, labelTop: 150, boardTop: 50 })).toEqual({
      x: 118,
      y: 50,
      below: false,
    });
  });

  it('AD-12 below the cell when there is no room above, never clamped', () => {
    expect(placeHoverPeek({ ...base, cell: 6, width: 72, labelTop: 149, boardTop: 50 })).toEqual({
      x: 118,
      y: 376,
      below: true,
    });
  });
});
