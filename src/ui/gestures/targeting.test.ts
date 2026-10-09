import { describe, expect, it } from 'vitest';
import { gapRects, slotRects, trayLayout } from '../layout/tray';
import {
  type Candidate,
  type GapRect,
  insertionIndex,
  pickTarget,
  type Rect,
  reorder,
} from './targeting';

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

  it('AD-12 equal ratios compare horizontal centre distance only, not 2-D distance', () => {
    // Dragged 30..70 × 0..40, centre (50, 20). Column 2 (x 40..70, y 20..2000; centre x 55, y 1010):
    // 30 × 20 in (37.5 %), horizontally 5 away but vertically 990. Column 1 (x 15..45, y −100..140;
    // centre x 30, y 20): 15 × 40 in (37.5 %), horizontally 20 away, vertically level. Horizontal
    // distance picks 2; a 2-D centre distance or the lower id would pick 1.
    const skewed: Candidate[] = [
      { id: 1, rect: { left: 15, top: -100, right: 45, bottom: 140 } },
      { id: 2, rect: { left: 40, top: 20, right: 70, bottom: 2000 } },
    ];
    expect(pickTarget(dragged(30), skewed, 4, true).raw).toBe(2);
    expect(pickTarget(dragged(30), [...skewed].reverse(), 4, true).raw).toBe(2);
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

// AD-12 insertionIndex (F3) over real slot and gap rects at 412 px (w 46, inner 384): perRow 7,
// column pitch 50, origin { x: 2, y: 0 }; card faces 46 × 61, compact 46 × 44 (row pitch 48).
const gapsFor = (tileCount: number, first = 0, count = tileCount): GapRect[] => {
  const sizing = trayLayout(tileCount, 46, 384);
  const slots = slotRects(sizing, { x: 2, y: 0 }, sizing.perRow * sizing.rows);
  return gapRects(slots, sizing.perRow, tileCount, first, count);
};
/** A dragged face centred on (cx, cy), 46 × `h`. */
const face = (cx: number, cy: number, h = 44): Rect => ({
  left: cx - 23,
  top: cy - h / 2,
  right: cx + 23,
  bottom: cy + h / 2,
});

describe('AD-12 insertionIndex', () => {
  it('AD-12 insertionIndex single row: the nearest gap centre', () => {
    // Gap centres at x 0, 50, 100, 150, 200, 250; y 30.5.
    const gaps = gapsFor(5);
    expect(insertionIndex(face(103, 30.5, 61), gaps).index).toBe(2);
    expect(insertionIndex(face(170, 10, 61), gaps).index).toBe(3);
  });

  it('AD-12 insertionIndex two compact rows: by 2-D distance', () => {
    const gaps = gapsFor(10);
    // Row 1 gap 9 (after slot 8, centre (100, 70)); the same x on row 0 is gap 2.
    expect(insertionIndex(face(101, 72), gaps).index).toBe(9);
    expect(insertionIndex(face(101, 20), gaps).index).toBe(2);
  });

  it('AD-12 insertionIndex block left (k 3): indices stay in M; over mirror slot 2 → gap 0, over mirror slot 0 → the nearer start-of-row-1 rect (gap 4)', () => {
    // 9 tiles compact, mirrors at 0…2, M at 3…8; dragged over mirror slot 2 (centre (125, 22)).
    const gaps = gapsFor(9, 3, 6);
    expect(insertionIndex(face(125, 22), gaps).index).toBe(0);
    // Over mirror slot 0 (centre (25, 22)): nearest is gap 4's start-of-row-1 rect (0, 70), an M gap.
    expect(insertionIndex(face(25, 22), gaps).index).toBe(4);
  });

  it('AD-12 insertionIndex block right: over the block → gap |M|', () => {
    // 9 tiles compact, M at 0…5, mirrors at 6…8; dragged over mirror slot 6 (centre (325, 22)).
    const gaps = gapsFor(9, 0, 6);
    expect(insertionIndex(face(325, 22), gaps).index).toBe(6);
    expect(gaps.every((g) => g.index <= 6)).toBe(true);
  });

  it('AD-12 insertionIndex block right across a row break: over mirror slot 7 (row 1 start) → gap 0, not gap |M|', () => {
    // 9 tiles compact, M at 0…5, mirrors at 6…8; mirror slot 7 centre (25, 70). Gaps 0 (0, 22) and
    // 1 (50, 22) tie as nearest; the lower index wins.
    const gaps = gapsFor(9, 0, 6);
    expect(insertionIndex(face(25, 70), gaps).index).toBe(0);
  });

  it('AD-12 insertionIndex k = 0 and the ends of M', () => {
    const gaps = gapsFor(5);
    expect(insertionIndex(face(-200, 30.5, 61), gaps).index).toBe(0);
    expect(insertionIndex(face(600, 30.5, 61), gaps).index).toBe(5);
  });

  it('AD-12 insertionIndex tie across indices → the lower index', () => {
    // Centre x 75, midway between gap 1 (x 50) and gap 2 (x 100).
    const gaps = gapsFor(5);
    expect(insertionIndex(face(75, 30.5, 61), gaps).index).toBe(1);
    expect(insertionIndex(face(75, 30.5, 61), [...gaps].reverse()).index).toBe(1);
  });

  it('AD-12 insertionIndex tie within a row-break index → the earlier element, returned itself', () => {
    const endOfRow: GapRect = { index: 3, rect: { left: 98, top: 0, right: 102, bottom: 44 } };
    const startOfRow: GapRect = { index: 3, rect: { left: -2, top: 48, right: 2, bottom: 92 } };
    // Centre (50, 46): equidistant from (100, 22) and (0, 70).
    expect(insertionIndex(face(50, 46), [endOfRow, startOfRow])).toBe(endOfRow);
  });

  it('AD-12 insertionIndex a row-break index whose start-of-row rect wins returns that rect', () => {
    const gaps = gapsFor(10);
    const startOfRow = gaps.filter((g) => g.index === 7)[1];
    expect(insertionIndex(face(10, 70), gaps)).toBe(startOfRow);
  });

  it('AD-12 insertionIndex a drag right by one past the neighbour centre → gap j + 2; reorder moves it by one', () => {
    // Tile j 1 (slot centre x 75), neighbour slot 2 centre x 125; the face centre at x 130.
    const order = [10, 11, 12, 13, 14];
    const gap = insertionIndex(face(130, 30.5, 61), gapsFor(5));
    expect(gap.index).toBe(3);
    expect(reorder(order, 1, gap.index)).toEqual([10, 12, 11, 13, 14]);
  });

  it('AD-12 insertionIndex a drag to the far end → gap n; reorder puts the dragged tile last', () => {
    const order = [10, 11, 12, 13, 14];
    const gap = insertionIndex(face(400, 30.5, 61), gapsFor(5));
    expect(gap.index).toBe(5);
    expect(reorder(order, 1, gap.index)).toEqual([10, 12, 13, 14, 11]);
  });

  it('AD-12 insertionIndex Place strip: a D card is movable like any strip tile', () => {
    // `placementOrder` [42, 0, 28] (28 a D card) dragged to the strip start.
    const order = [42, 0, 28];
    const gap = insertionIndex(face(-10, 30.5, 61), gapsFor(3));
    expect(gap.index).toBe(0);
    expect(reorder(order, 2, gap.index)).toEqual([28, 42, 0]);
  });

  it('AD-12 insertionIndex with no gap rects or a zero-area dragged rect throws', () => {
    expect(() => insertionIndex(face(0, 0), [])).toThrow(/^AD-12 insertionIndex with no gap rects/);
    expect(() => insertionIndex({ left: 0, top: 0, right: 0, bottom: 40 }, gapsFor(5))).toThrow(
      /^AD-12 insertionIndex with a zero-area dragged rect/,
    );
  });
});

describe('AD-12 reorder', () => {
  const order = [10, 11, 12, 13, 14];

  it('AD-12 reorder drag left inserts at i', () => {
    expect(reorder(order, 3, 1)).toEqual([10, 13, 11, 12, 14]);
    expect(reorder(order, 4, 0)).toEqual([14, 10, 11, 12, 13]);
  });

  it('AD-12 reorder drag right inserts at i − 1', () => {
    expect(reorder(order, 1, 4)).toEqual([10, 12, 13, 11, 14]);
    expect(reorder(order, 0, 5)).toEqual([11, 12, 13, 14, 10]);
  });

  it('AD-12 reorder gaps j and j + 1 return the input reference', () => {
    expect(reorder(order, 2, 2)).toBe(order);
    expect(reorder(order, 2, 3)).toBe(order);
  });

  it('AD-12 reorder a Place placementOrder with a D card', () => {
    // [42, 0, 28], 28 a D card: drag 28 to gap 1, then 42 past it.
    expect(reorder([42, 0, 28], 2, 1)).toEqual([42, 28, 0]);
    expect(reorder([42, 0, 28], 0, 3)).toEqual([0, 28, 42]);
  });

  it('AD-12 reorder with j or i out of range throws', () => {
    expect(() => reorder(order, -1, 0)).toThrow(/^AD-12 reorder/);
    expect(() => reorder(order, 5, 0)).toThrow(/^AD-12 reorder/);
    expect(() => reorder(order, 0.5, 0)).toThrow(/^AD-12 reorder/);
    expect(() => reorder(order, 0, -1)).toThrow(/^AD-12 reorder/);
    expect(() => reorder(order, 0, 6)).toThrow(/^AD-12 reorder/);
    expect(() => reorder(order, 0, 1.5)).toThrow(/^AD-12 reorder/);
  });
});
