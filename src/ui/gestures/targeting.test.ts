import { describe, expect, it } from 'vitest';
import { type Candidate, pickTarget, type Rect } from './targeting';

// AD-12 pickTarget (EXPERIENCE.md Drop targeting by overlap 3–5). Columns 50 wide, 200 tall,
// side by side from x 0; the dragged rect is 40 × 40 (area 1600).
const column = (id: number): Candidate => ({
  id,
  rect: { left: (id - 1) * 50, top: 0, right: id * 50, bottom: 200 },
});
const columns = [1, 2, 3, 4].map(column);
const dragged = (left: number, top = 0, size = 40): Rect => ({
  left,
  top,
  right: left + size,
  bottom: top + size,
});

describe('AD-12 pickTarget', () => {
  it('AD-12 below 25 % → raw and highlighted null', () => {
    // 9 px of 40 inside column 1 (22.5 %), the rest left of every column.
    expect(pickTarget(dragged(-31), columns, 2, true)).toEqual({ raw: null, highlighted: null });
  });

  it('AD-12 exactly 25 % qualifies', () => {
    expect(pickTarget(dragged(-30), columns, 2, true)).toEqual({ raw: 1, highlighted: 1 });
  });

  it('AD-12 vertical overlap counts too: 25 % at the top edge qualifies, below does not', () => {
    expect(pickTarget(dragged(5, -30), columns, 2, true).raw).toBe(1);
    expect(pickTarget(dragged(5, -31), columns, 2, true).raw).toBeNull();
  });

  it('AD-12 the largest ratio wins', () => {
    // 30 px in column 2 (75 %), 10 px in column 3 (25 %); then 15 px (37.5 %) vs 25 px (62.5 %).
    expect(pickTarget(dragged(70), columns, 1, false)).toEqual({ raw: 2, highlighted: 2 });
    expect(pickTarget(dragged(85), columns, 1, false)).toEqual({ raw: 3, highlighted: 3 });
    // The larger ratio wins even when it is the farther centre: dragged 30..70 (centre 50) over a
    // short column 1 centred on it (20 × 20 in, 25 %) and a tall column 2 to the right (15 × 40 in,
    // 37.5 %, centre 127.5).
    const farther: Candidate[] = [
      { id: 1, rect: { left: 40, top: 0, right: 60, bottom: 20 } },
      { id: 2, rect: { left: 55, top: 0, right: 200, bottom: 200 } },
    ];
    expect(pickTarget(dragged(30), farther, 4, true).raw).toBe(2);
  });

  it('AD-12 equal ratios → the horizontally nearest centre, then the lower id', () => {
    // 20 px in each of columns 1 and 2: centres 25 and 75 are equidistant from 50 → lower id.
    expect(pickTarget(dragged(30), columns, 4, true).raw).toBe(1);
    // Same ratio, unequal distance: a narrow column 2 (centre 60) beside a wide column 1.
    const uneven: Candidate[] = [
      { id: 1, rect: { left: -100, top: 0, right: 50, bottom: 200 } },
      { id: 2, rect: { left: 50, top: 0, right: 70, bottom: 200 } },
    ];
    // Dragged 30..70: 20 px in each; centre 50; column 1 centre −25, column 2 centre 60.
    expect(pickTarget(dragged(30), uneven, 4, true).raw).toBe(2);
    // Candidate order does not matter.
    expect(pickTarget(dragged(30), [...columns].reverse(), 4, true).raw).toBe(1);
  });

  it('AD-12 source largest and hasLeftSource false → raw = source, highlighted null', () => {
    expect(pickTarget(dragged(55), columns, 2, false)).toEqual({ raw: 2, highlighted: null });
  });

  it('AD-12 source largest and hasLeftSource true → the source is highlighted', () => {
    expect(pickTarget(dragged(55), columns, 2, true)).toEqual({ raw: 2, highlighted: 2 });
  });

  it('AD-12 another column ≥ 25 % with the source larger and hasLeftSource false → highlighted null, not the runner-up', () => {
    // 30 px in the source column 2 (75 %), 10 px in column 3 (25 %).
    expect(pickTarget(dragged(70), columns, 2, false)).toEqual({ raw: 2, highlighted: null });
  });

  it('AD-12 sub-25 % over the source only → both null', () => {
    // 5 px of 40 inside the source column 1, above it otherwise.
    const over: Rect = { left: 5, top: -35, right: 45, bottom: 5 };
    expect(pickTarget(over, columns, 1, false)).toEqual({ raw: null, highlighted: null });
  });

  it('AD-12 a zero-area dragged rect throws', () => {
    expect(() => pickTarget({ left: 0, top: 0, right: 0, bottom: 40 }, columns, 1, false)).toThrow(
      /^AD-12 pickTarget with a zero-area dragged rect/,
    );
  });
});
