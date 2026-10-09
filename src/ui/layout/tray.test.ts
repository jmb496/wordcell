import { describe, expect, it } from 'vitest';
import type { Rect } from '../gestures/targeting';
import { reorder } from '../gestures/targeting';
import {
  gapRects,
  partingOffsets,
  segmentEnds,
  slotRects,
  type TrayLayout,
  trayLayout,
  trayOrder,
} from './tray';

describe('tray layout', () => {
  it('AD-11 tray sizing at 412 px (w 46, inner 384): 7 card, 8 and 14 compact 2, 15 compact 3', () => {
    const at = (n: number) => trayLayout(n, 46, 384);
    expect(at(0)).toEqual({
      mode: 'card',
      rows: 0,
      perRow: 7,
      tileWidth: 46,
      tileHeight: 61,
      area: 92,
    });
    expect(at(7)).toEqual({
      mode: 'card',
      rows: 1,
      perRow: 7,
      tileWidth: 46,
      tileHeight: 61,
      area: 92,
    });
    expect(at(8)).toEqual({
      mode: 'compact',
      rows: 2,
      perRow: 7,
      tileWidth: 46,
      tileHeight: 44,
      area: 92,
    });
    expect(at(14)).toEqual({
      mode: 'compact',
      rows: 2,
      perRow: 7,
      tileWidth: 46,
      tileHeight: 44,
      area: 92,
    });
    expect(at(15)).toEqual({
      mode: 'compact',
      rows: 3,
      perRow: 7,
      tileWidth: 46,
      tileHeight: 44,
      area: 92,
    });
    expect(at(22)).toEqual({
      mode: 'compact',
      rows: 4,
      perRow: 7,
      tileWidth: 46,
      tileHeight: 44,
      area: 92,
    });
  });

  it('AD-11 tray sizing at 360 px (w 40, inner 336): tile width 44, same rows', () => {
    const at = (n: number) => trayLayout(n, 40, 336);
    expect(at(0)).toEqual({
      mode: 'card',
      rows: 0,
      perRow: 7,
      tileWidth: 44,
      tileHeight: 53,
      area: 92,
    });
    expect(at(7)).toEqual({
      mode: 'card',
      rows: 1,
      perRow: 7,
      tileWidth: 44,
      tileHeight: 53,
      area: 92,
    });
    expect(at(8)).toEqual({
      mode: 'compact',
      rows: 2,
      perRow: 7,
      tileWidth: 44,
      tileHeight: 44,
      area: 92,
    });
    expect(at(14)).toEqual({
      mode: 'compact',
      rows: 2,
      perRow: 7,
      tileWidth: 44,
      tileHeight: 44,
      area: 92,
    });
    expect(at(15)).toEqual({
      mode: 'compact',
      rows: 3,
      perRow: 7,
      tileWidth: 44,
      tileHeight: 44,
      area: 92,
    });
    expect(at(22)).toEqual({
      mode: 'compact',
      rows: 4,
      perRow: 7,
      tileWidth: 44,
      tileHeight: 44,
      area: 92,
    });
  });

  it('AD-11 tray sizing at w 70 (inner 576): tile width 70, 7 per row, area H = 93', () => {
    expect(trayLayout(7, 70, 576)).toEqual({
      mode: 'card',
      rows: 1,
      perRow: 7,
      tileWidth: 70,
      tileHeight: 93,
      area: 93,
    });
  });
});

describe('tray order', () => {
  const draft = { arrangement: [32, 28], destination: [27, 1] };

  it('AD-14 left: the D block (mirrors, top → bottom) first, then the arrangement', () => {
    expect(trayOrder({ ...draft, side: 'left' })).toEqual([
      { id: 27, mirror: true },
      { id: 1, mirror: true },
      { id: 32, mirror: false },
      { id: 28, mirror: false },
    ]);
  });

  it('AD-14 right: the arrangement, then the D block reversed (mirrors)', () => {
    expect(trayOrder({ ...draft, side: 'right' })).toEqual([
      { id: 32, mirror: false },
      { id: 28, mirror: false },
      { id: 1, mirror: true },
      { id: 27, mirror: true },
    ]);
  });

  it('AD-14 k = 0: the arrangement only', () => {
    expect(trayOrder({ arrangement: [24, 6, 49], destination: [], side: 'left' })).toEqual([
      { id: 24, mirror: false },
      { id: 6, mirror: false },
      { id: 49, mirror: false },
    ]);
  });
});

// Geometry at 412 px (w 46, inner 384): perRow 7, tileWidth 46, column pitch 50; card tileHeight
// 61, compact 44 (row pitch 48); origin { x: 2, y: 0 }.
const ORIGIN = { x: 2, y: 0 };
const sizing = (tileCount: number): TrayLayout => trayLayout(tileCount, 46, 384);
/** Every slot of the rendered rows for `tileCount` tiles. */
const slotsFor = (tileCount: number): Rect[] => {
  const s = sizing(tileCount);
  return slotRects(s, ORIGIN, s.perRow * s.rows);
};
const r = (left: number, top: number, right: number, bottom: number): Rect => ({
  left,
  top,
  right,
  bottom,
});
const overlapsInterior = (a: Rect, b: Rect): boolean =>
  Math.min(a.right, b.right) > Math.max(a.left, b.left) &&
  Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);

describe('AD-12 slotRects', () => {
  it('AD-12 slotRects card pitch: x by 50, one row of card-height faces', () => {
    const slots = slotRects(sizing(5), ORIGIN, 7);
    expect(slots).toHaveLength(7);
    expect(slots[0]).toEqual(r(2, 0, 48, 61));
    expect(slots[1]).toEqual(r(52, 0, 98, 61));
    expect(slots[6]).toEqual(r(302, 0, 348, 61));
  });

  it('AD-12 slotRects compact pitch: x by 50, y by 48; slot n with room present', () => {
    const slots = slotRects(sizing(8), ORIGIN, 14);
    expect(slots[0]).toEqual(r(2, 0, 48, 44));
    expect(slots[6]).toEqual(r(302, 0, 348, 44));
    expect(slots[7]).toEqual(r(2, 48, 48, 92));
    // Slot 8 (tile count 8): the free-letter room slot.
    expect(slots[8]).toEqual(r(52, 48, 98, 92));
    expect(slots[13]).toEqual(r(302, 48, 348, 92));
  });

  it('AD-12 slotRects passes the + 2 px origin through', () => {
    const slots = slotRects(sizing(8), { x: 12, y: 100 }, 14);
    expect(slots[0]).toEqual(r(12, 100, 58, 144));
    expect(slots[8]).toEqual(r(62, 148, 108, 192));
  });

  it('AD-12 slotRects with slotCount outside 1…perRow × rows throws', () => {
    expect(() => slotRects(sizing(5), ORIGIN, 0)).toThrow(/^AD-12 slotRects/);
    expect(() => slotRects(sizing(5), ORIGIN, 8)).toThrow(/^AD-12 slotRects/);
    expect(() => slotRects(sizing(8), ORIGIN, 15)).toThrow(/^AD-12 slotRects/);
    expect(() => slotRects(sizing(8), ORIGIN, 1.5)).toThrow(/^AD-12 slotRects/);
    expect(() => slotRects(sizing(0), ORIGIN, 1)).toThrow(/^AD-12 slotRects/);
  });
});

describe('AD-12 gapRects', () => {
  it('AD-12 gapRects one row: half-gap row ends, one rect per inner gap, ascending', () => {
    expect(gapRects(slotsFor(5), 7, 5, 0, 5)).toEqual([
      { index: 0, rect: r(-2, 0, 2, 61) },
      { index: 1, rect: r(48, 0, 52, 61) },
      { index: 2, rect: r(98, 0, 102, 61) },
      { index: 3, rect: r(148, 0, 152, 61) },
      { index: 4, rect: r(198, 0, 202, 61) },
      { index: 5, rect: r(248, 0, 252, 61) },
    ]);
  });

  it('AD-12 gapRects row-break pair: end of row 0 first, then start of row 1', () => {
    const gaps = gapRects(slotsFor(10), 7, 10, 0, 10);
    expect(gaps.filter((g) => g.index === 7)).toEqual([
      { index: 7, rect: r(348, 0, 352, 44) },
      { index: 7, rect: r(-2, 48, 2, 92) },
    ]);
    expect(gaps.map((g) => g.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 7, 8, 9, 10]);
  });

  it('AD-12 gapRects none after the last row: a full last row ends with its end gap only', () => {
    const gaps = gapRects(slotsFor(14), 7, 14, 0, 14);
    expect(gaps.at(-1)).toEqual({ index: 14, rect: r(348, 48, 352, 92) });
    expect(gaps.filter((g) => g.index === 14)).toHaveLength(1);
    expect(gaps.every((g) => g.rect.top < 96)).toBe(true);
  });

  it('AD-12 gapRects rects are top-aligned with their row and tileHeight tall', () => {
    for (const g of gapRects(slotsFor(10), 7, 10, 0, 10)) {
      expect([0, 48]).toContain(g.rect.top);
      expect(g.rect.bottom - g.rect.top).toBe(44);
      expect(g.rect.right - g.rect.left).toBe(4);
    }
  });

  it('AD-12 gapRects M meets the block left at a row break (k = 7): gap 0 has both rects, neither in a mirror slot', () => {
    const slots = slotsFor(10);
    const gaps = gapRects(slots, 7, 10, 7, 3);
    expect(gaps).toEqual([
      { index: 0, rect: r(348, 0, 352, 44) },
      { index: 0, rect: r(-2, 48, 2, 92) },
      { index: 1, rect: r(48, 48, 52, 92) },
      { index: 2, rect: r(98, 48, 102, 92) },
      { index: 3, rect: r(148, 48, 152, 92) },
    ]);
    for (const g of gaps) {
      for (const mirror of slots.slice(0, 7)) expect(overlapsInterior(g.rect, mirror)).toBe(false);
    }
  });

  it('AD-12 gapRects M meets the block right where the block starts a row: gap |M| has both rects', () => {
    const slots = slotsFor(10);
    const gaps = gapRects(slots, 7, 10, 0, 7);
    expect(gaps.filter((g) => g.index === 7)).toEqual([
      { index: 7, rect: r(348, 0, 352, 44) },
      { index: 7, rect: r(-2, 48, 2, 92) },
    ]);
    for (const g of gaps) {
      for (const mirror of slots.slice(7, 10)) expect(overlapsInterior(g.rect, mirror)).toBe(false);
    }
  });

  it('AD-12 gapRects block on each side within a row: gap 0 / gap count on the block edge', () => {
    // Block left (k = 2, |M| = 3): gap 0 sits right of mirror slot 1.
    expect(gapRects(slotsFor(5), 7, 5, 2, 3)).toEqual([
      { index: 0, rect: r(98, 0, 102, 61) },
      { index: 1, rect: r(148, 0, 152, 61) },
      { index: 2, rect: r(198, 0, 202, 61) },
      { index: 3, rect: r(248, 0, 252, 61) },
    ]);
    // Block right (|M| = 3, k = 2): gap 3 sits left of mirror slot 3.
    expect(gapRects(slotsFor(5), 7, 5, 0, 3)).toEqual([
      { index: 0, rect: r(-2, 0, 2, 61) },
      { index: 1, rect: r(48, 0, 52, 61) },
      { index: 2, rect: r(98, 0, 102, 61) },
      { index: 3, rect: r(148, 0, 152, 61) },
    ]);
  });

  it('AD-12 gapRects k = 0 and the Place strip: every position movable, gaps 0…n', () => {
    // Place strip `placementOrder` [42, 0, 28] (28 a D card): the whole strip is the run.
    expect(gapRects(slotsFor(3), 7, 3, 0, 3).map((g) => g.index)).toEqual([0, 1, 2, 3]);
    expect(gapRects(slotsFor(8), 7, 8, 0, 8).map((g) => g.index)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 7, 8,
    ]);
  });

  it('AD-12 gapRects with an inconsistent run throws', () => {
    const slots = slotsFor(5);
    expect(() => gapRects(slots, 7, 5, -1, 3)).toThrow(/^AD-12 gapRects/);
    expect(() => gapRects(slots, 7, 5, 0, 0)).toThrow(/^AD-12 gapRects/);
    expect(() => gapRects(slots, 7, 5, 3, 3)).toThrow(/^AD-12 gapRects/);
    expect(() => gapRects(slots, 7, 8, 0, 3)).toThrow(/^AD-12 gapRects/);
    expect(() => gapRects(slots, 7, 5, 0.5, 3)).toThrow(/^AD-12 gapRects/);
    expect(() => gapRects(slots, 0, 5, 0, 3)).toThrow(/^AD-12 gapRects/);
  });
});

const zero = (tileCount: number) =>
  Array.from({ length: tileCount }, (_, p) => ({ slot: p, dx: 0, dy: 0 }));

describe('AD-12 parting offsets', () => {
  it('AD-12 parting offsets drag right by two (j 1, gap 4): tiles 2 and 3 one slot back', () => {
    const expected = zero(5);
    expected[2] = { slot: 1, dx: -50, dy: 0 };
    expected[3] = { slot: 2, dx: -50, dy: 0 };
    expect(partingOffsets(slotsFor(5), 5, 0, 5, 4, 1)).toEqual(expected);
  });

  it('AD-12 parting offsets drag left by two (j 4, gap 2): tiles 2 and 3 one slot forward', () => {
    const expected = zero(5);
    expected[2] = { slot: 3, dx: 50, dy: 0 };
    expected[3] = { slot: 4, dx: 50, dy: 0 };
    expect(partingOffsets(slotsFor(5), 5, 0, 5, 2, 4)).toEqual(expected);
  });

  it('AD-12 parting offsets drag right across a row break: the crossing tile → the previous row last slot', () => {
    // 10 tiles compact, j 5, gap 9: positions 6, 7, 8 take slots 5, 6, 7.
    const expected = zero(10);
    expected[6] = { slot: 5, dx: -50, dy: 0 };
    expected[7] = { slot: 6, dx: 300, dy: -48 };
    expected[8] = { slot: 7, dx: -50, dy: 0 };
    expect(partingOffsets(slotsFor(10), 10, 0, 10, 9, 5)).toEqual(expected);
  });

  it('AD-12 parting offsets drag left across a row break: the crossing tile → the next row first slot', () => {
    // 10 tiles compact, j 8, gap 5: positions 5, 6, 7 take slots 6, 7, 8.
    const expected = zero(10);
    expected[5] = { slot: 6, dx: 50, dy: 0 };
    expected[6] = { slot: 7, dx: -300, dy: 48 };
    expected[7] = { slot: 8, dx: 50, dy: 0 };
    expect(partingOffsets(slotsFor(10), 10, 0, 10, 5, 8)).toEqual(expected);
  });

  it('AD-12 parting offsets block left (k 3): run indices offset by first; mirrors stay', () => {
    // 9 tiles compact, mirrors 0…2, M at 3…8. Drag right: from 1 (position 4), gap 4 → positions
    // 5 and 6 one slot back.
    const right = zero(9);
    right[5] = { slot: 4, dx: -50, dy: 0 };
    right[6] = { slot: 5, dx: -50, dy: 0 };
    expect(partingOffsets(slotsFor(9), 9, 3, 6, 4, 1)).toEqual(right);
    // Drag left: from 4 (position 7, the origin, keeps its slot), gap 1 → positions 4…6 one slot
    // forward, position 6 across the row break to row 1's first slot.
    const left = zero(9);
    left[4] = { slot: 5, dx: 50, dy: 0 };
    left[5] = { slot: 6, dx: 50, dy: 0 };
    left[6] = { slot: 7, dx: -300, dy: 48 };
    expect(partingOffsets(slotsFor(9), 9, 3, 6, 1, 4)).toEqual(left);
  });

  it('AD-12 parting offsets reorder gaps j and j + 1 are all zero; the origin keeps its slot', () => {
    expect(partingOffsets(slotsFor(5), 5, 0, 5, 2, 2)).toEqual(zero(5));
    expect(partingOffsets(slotsFor(5), 5, 0, 5, 3, 2)).toEqual(zero(5));
    expect(partingOffsets(slotsFor(5), 5, 0, 5, 0, 2)[2]).toEqual({ slot: 2, dx: 0, dy: 0 });
    expect(partingOffsets(slotsFor(5), 5, 0, 5, 5, 2)[2]).toEqual({ slot: 2, dx: 0, dy: 0 });
  });

  it('AD-12 parting offsets Place strip with a D card in the run', () => {
    // `placementOrder` [42, 0, 28], 28 a D card: drag 42 (j 0) to gap 3; 0 and 28 one slot back.
    expect(partingOffsets(slotsFor(3), 3, 0, 3, 3, 0)).toEqual([
      { slot: 0, dx: 0, dy: 0 },
      { slot: 0, dx: -50, dy: 0 },
      { slot: 1, dx: -50, dy: 0 },
    ]);
  });

  it('AD-12 free-letter parting offsets, block right across a row break: mirrors shift; parted segments and locks', () => {
    // |M| 6 at positions 0…5, the D block (3 mirrors) at 6…8; 9 tiles compact, 14 slots; gap 4.
    const parted = partingOffsets(slotsFor(9), 9, 0, 6, 4);
    expect(parted).toEqual([
      { slot: 0, dx: 0, dy: 0 },
      { slot: 1, dx: 0, dy: 0 },
      { slot: 2, dx: 0, dy: 0 },
      { slot: 3, dx: 0, dy: 0 },
      { slot: 5, dx: 50, dy: 0 },
      { slot: 6, dx: 50, dy: 0 },
      { slot: 7, dx: -300, dy: 48 },
      { slot: 8, dx: 50, dy: 0 },
      { slot: 9, dx: 50, dy: 0 },
    ]);
    const mirrorBySlot: boolean[] = [];
    for (const p of [6, 7, 8]) mirrorBySlot[(parted[p] as { slot: number }).slot] = true;
    const ends = [7, 8, 9].map((slot) => segmentEnds(slot, 7, mirrorBySlot));
    // One segment on row 1 (lock = start: one lock, on slot 7).
    expect(ends).toEqual([
      { start: true, end: false },
      { start: false, end: false },
      { start: false, end: true },
    ]);
  });

  it('AD-12 free-letter parting offsets, block left: mirrors unmoved, only M tiles from first + gap shift', () => {
    // k 3 (mirrors 0…2), |M| 6 at 3…8; 9 tiles compact; gap 2 → positions 5…8 shift.
    expect(partingOffsets(slotsFor(9), 9, 3, 6, 2)).toEqual([
      { slot: 0, dx: 0, dy: 0 },
      { slot: 1, dx: 0, dy: 0 },
      { slot: 2, dx: 0, dy: 0 },
      { slot: 3, dx: 0, dy: 0 },
      { slot: 4, dx: 0, dy: 0 },
      { slot: 6, dx: 50, dy: 0 },
      { slot: 7, dx: -300, dy: 48 },
      { slot: 8, dx: 50, dy: 0 },
      { slot: 9, dx: 50, dy: 0 },
    ]);
  });

  it('AD-12 free-letter parting offsets: a gap that moves no tile is all zero', () => {
    // Block left, the end gap of M; k = 0, the end gap.
    expect(partingOffsets(slotsFor(9), 9, 3, 6, 6)).toEqual(zero(9));
    expect(partingOffsets(slotsFor(5), 5, 0, 5, 5)).toEqual(zero(5));
  });

  it('AD-12 free-letter parting offsets without room throws', () => {
    expect(() => partingOffsets(slotsFor(7), 7, 0, 7, 0)).toThrow(/^AD-12 partingOffsets/);
    expect(() => partingOffsets(slotsFor(14), 14, 0, 14, 3)).toThrow(/^AD-12 partingOffsets/);
  });

  it('AD-12 parting offsets with an inconsistent run, gap or from throws', () => {
    const slots = slotsFor(5);
    expect(() => partingOffsets(slots, 5, -1, 3, 0, 0)).toThrow(/^AD-12 partingOffsets/);
    expect(() => partingOffsets(slots, 5, 0, 0, 0)).toThrow(/^AD-12 partingOffsets/);
    expect(() => partingOffsets(slots, 5, 3, 3, 0, 0)).toThrow(/^AD-12 partingOffsets/);
    expect(() => partingOffsets(slots, 8, 0, 3, 0, 0)).toThrow(/^AD-12 partingOffsets/);
    expect(() => partingOffsets(slots, 5, 0, 3, 4, 0)).toThrow(/^AD-12 partingOffsets/);
    expect(() => partingOffsets(slots, 5, 0, 3, -1, 0)).toThrow(/^AD-12 partingOffsets/);
    expect(() => partingOffsets(slots, 5, 0, 3, 1, 3)).toThrow(/^AD-12 partingOffsets/);
    expect(() => partingOffsets(slots, 5, 0, 3, 1, -1)).toThrow(/^AD-12 partingOffsets/);
    expect(() => partingOffsets(slots, 5, 0, 3, 1.5, 0)).toThrow(/^AD-12 partingOffsets/);
  });
});

describe('AD-12 destination cards never reordered or interleaved', () => {
  // Composing, |M| 6 and a 3-card D block, 9 tiles compact: block left (k 3, M at 3…8) and block
  // right (M at 0…5, mirrors at 6…8).
  const M = [10, 11, 12, 13, 14, 15];
  const D = [40, 41, 42];
  const cases = [
    { side: 'left', first: 3, mirrorPositions: [0, 1, 2] },
    { side: 'right', first: 0, mirrorPositions: [6, 7, 8] },
  ];

  for (const { side, first, mirrorPositions } of cases) {
    it(`AD-12 destination cards never reordered or interleaved, block ${side}`, () => {
      const slots = slotsFor(9);
      const gaps = gapRects(slots, 7, 9, first, M.length);
      expect(new Set(gaps.map((g) => g.index))).toEqual(new Set([0, 1, 2, 3, 4, 5, 6]));
      for (const g of gaps) {
        for (const p of mirrorPositions) {
          expect(overlapsInterior(g.rect, slots[p] as Rect)).toBe(false);
        }
      }
      for (let j = 0; j < M.length; j++) {
        for (let i = 0; i <= M.length; i++) {
          const order = reorder(M, j, i);
          expect([...order].sort((a, b) => a - b)).toEqual(M);
          expect(order.some((id) => D.includes(id))).toBe(false);
          const parted = partingOffsets(slots, 9, first, M.length, i, j);
          for (const p of mirrorPositions) expect(parted[p]).toEqual({ slot: p, dx: 0, dy: 0 });
        }
      }
    });
  }
});

describe('AD-11 segmentEnds at rest', () => {
  it('AD-11 segmentEnds at rest: a 3-tile block within a row', () => {
    // 7 tiles, mirrors at 2…4.
    const mirrors = [false, false, true, true, true, false, false];
    expect([2, 3, 4].map((slot) => segmentEnds(slot, 7, mirrors))).toEqual([
      { start: true, end: false },
      { start: false, end: false },
      { start: false, end: true },
    ]);
  });

  it('AD-11 segmentEnds at rest: a 3-tile block split by a row break', () => {
    // 9 tiles, mirrors at 6…8: one segment ends row 0, the other starts row 1.
    const mirrors = [false, false, false, false, false, false, true, true, true];
    expect([6, 7, 8].map((slot) => segmentEnds(slot, 7, mirrors))).toEqual([
      { start: true, end: true },
      { start: true, end: false },
      { start: false, end: true },
    ]);
  });
});
