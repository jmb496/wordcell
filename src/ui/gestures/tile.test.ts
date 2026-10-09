import { describe, expect, it } from 'vitest';
import type { GameView } from '../../engine/index';
import type { Hit } from './intent';
import { tileTap } from './tile';

// AD-12 tile tap intent (epic 5 SPEC CAP-4, the plan's I/O matrix): hand-built GameView slices.
// Composing: arrangement [10, 11, 12, 13] (S 10, 11; free letters 12 from cell 4 and 13 from cell
// 7, whose tops they are, cell 7 listed first), D block mirrors elsewhere; cell 3 used, cells 4 and
// 7 the free letters' cells (used), cell 5 available, cell 6 empty. Place: placementOrder
// [20, 10, 11, 12, 13], target 5, legal 3–5 and 7, cell 6 not legal.
type CellSlice = {
  cell: number;
  cards: number[];
  used?: boolean;
  canAddFreeLetter?: boolean;
  canSetTarget?: boolean;
  isLegalTarget?: boolean;
};

function cells(list: CellSlice[]) {
  return list.map((c) => ({
    used: false,
    canAddFreeLetter: false,
    canSetTarget: false,
    isLegalTarget: false,
    ...c,
  }));
}

const DRAFT = {
  arrangement: [10, 11, 12, 13],
  freeLetters: [7, 4],
  destination: [20],
};

const COMPOSING = {
  status: 'playing',
  phase: 'composing',
  draft: DRAFT,
  cells: cells([
    { cell: 3, cards: [30], used: true },
    { cell: 4, cards: [31, 12], used: true },
    { cell: 5, cards: [32], canAddFreeLetter: true },
    { cell: 6, cards: [] },
    { cell: 7, cards: [33, 13], used: true },
  ]),
} as unknown as GameView;

const PLACE = {
  status: 'playing',
  phase: 'place',
  draft: DRAFT,
  place: { placementOrder: [20, 10, 11, 12, 13], target: 5, legalTargets: [3, 4, 5, 7] },
  cells: cells([
    { cell: 3, cards: [30], used: true, isLegalTarget: true, canSetTarget: true },
    { cell: 4, cards: [31, 12], used: true, isLegalTarget: true, canSetTarget: true },
    { cell: 5, cards: [32], isLegalTarget: true },
    { cell: 6, cards: [] },
    { cell: 7, cards: [33, 13], used: true, isLegalTarget: true, canSetTarget: true },
  ]),
} as unknown as GameView;

const IDLE = {
  status: 'playing',
  phase: 'idle',
  cells: cells([{ cell: 3, cards: [30] }]),
} as unknown as GameView;

const WON = { status: 'won', phase: 'idle', cells: [] } as unknown as GameView;

const tile = (card: number): Hit => ({ kind: 'tile', card });
const cell = (n: number): Hit => ({ kind: 'wordcell', cell: n });
const BLOCK: Hit = { kind: 'block' };
const OUTSIDE: Hit = { kind: 'outside' };
const CARD: Hit = { kind: 'card', column: 1, card: 40 };
const SPACE: Hit = { kind: 'space', column: 2, foot: true };

describe('AD-12 tileTap on tiles', () => {
  it('AD-12 a live tile with nothing selected selects it, in Composing and Place', () => {
    expect(tileTap(tile(10), COMPOSING, null)).toEqual({ kind: 'select', card: 10 });
    expect(tileTap(tile(12), COMPOSING, null)).toEqual({ kind: 'select', card: 12 });
    expect(tileTap(tile(20), PLACE, null)).toEqual({ kind: 'select', card: 20 });
  });

  it('AD-12 another live tile swaps the two: one arrange in Composing, one setPlacementOrder in Place', () => {
    expect(tileTap(tile(12), COMPOSING, 10)).toEqual({
      kind: 'swap',
      command: { type: 'arrange', arrangement: [12, 11, 10, 13] },
    });
    expect(tileTap(tile(11), COMPOSING, 12)).toEqual({
      kind: 'swap',
      command: { type: 'arrange', arrangement: [10, 12, 11, 13] },
    });
    expect(tileTap(tile(12), PLACE, 20)).toEqual({
      kind: 'swap',
      command: { type: 'setPlacementOrder', order: [12, 10, 11, 20, 13] },
    });
  });

  it('AD-12 R-35 a second tap on a selected source tile or any selected strip tile deselects', () => {
    expect(tileTap(tile(10), COMPOSING, 10)).toEqual({ kind: 'deselect' });
    expect(tileTap(tile(11), COMPOSING, 11)).toEqual({ kind: 'deselect' });
    expect(tileTap(tile(12), PLACE, 12)).toEqual({ kind: 'deselect' });
    expect(tileTap(tile(20), PLACE, 20)).toEqual({ kind: 'deselect' });
  });

  it('AD-12 Q-31 a second tap on a selected Composing free letter removes it from its cell', () => {
    expect(tileTap(tile(12), COMPOSING, 12)).toEqual({ kind: 'remove', cell: 4 });
    expect(tileTap(tile(13), COMPOSING, 13)).toEqual({ kind: 'remove', cell: 7 });
  });

  it('AD-12 a tile that is not live in the phase, or a tile hit outside a draft, throws', () => {
    expect(() => tileTap(tile(20), COMPOSING, null)).toThrow(
      /^AD-12 tileTap on card 20, not a live tile in composing/,
    );
    expect(() => tileTap(tile(99), PLACE, 20)).toThrow(/^AD-12 tileTap on card 99/);
    expect(() => tileTap(tile(10), IDLE, null)).toThrow(
      /^AD-12 tileTap on tile 10 outside a draft/,
    );
    expect(() => tileTap(tile(10), WON, null)).toThrow(/^AD-12 tileTap on tile 10 outside a draft/);
  });
});

describe('AD-12 tileTap keep and clear', () => {
  it('AD-12 R-32 a D-block mirror, the view scrim and the view sheet keep the selection', () => {
    for (const hit of [BLOCK, { kind: 'scrim' }, { kind: 'sheet' }] as Hit[]) {
      expect(tileTap(hit, COMPOSING, 10)).toEqual({ kind: 'keep' });
    }
    for (const hit of [{ kind: 'scrim' }, { kind: 'sheet' }] as Hit[]) {
      expect(tileTap(hit, PLACE, 20)).toEqual({ kind: 'keep' });
    }
  });

  it('AD-12 a block hit outside Composing throws', () => {
    for (const v of [PLACE, IDLE]) {
      expect(() => tileTap(BLOCK, v, null)).toThrow(/^AD-12 tileTap on a block outside Composing/);
    }
  });

  it('AD-12 Composing: a used or empty WordCell keeps (an empty-cell long-press releases as this tap); an available cell clears', () => {
    expect(tileTap(cell(3), COMPOSING, 10)).toEqual({ kind: 'keep' });
    expect(tileTap(cell(4), COMPOSING, 10)).toEqual({ kind: 'keep' });
    expect(tileTap(cell(6), COMPOSING, 10)).toEqual({ kind: 'keep' });
    expect(tileTap(cell(5), COMPOSING, 10)).toEqual({ kind: 'clear' });
  });

  it('AD-12 F13 Place: a not-legal WordCell keeps; the current target and a legal non-current cell clear', () => {
    expect(tileTap(cell(6), PLACE, 20)).toEqual({ kind: 'keep' });
    expect(tileTap(cell(5), PLACE, 20)).toEqual({ kind: 'clear' });
    expect(tileTap(cell(3), PLACE, 20)).toEqual({ kind: 'clear' });
    expect(tileTap(cell(4), PLACE, 20)).toEqual({ kind: 'clear' });
  });

  it('AD-12 column cards, column space and outside clear, in Composing and Place', () => {
    for (const hit of [CARD, SPACE, OUTSIDE]) {
      expect(tileTap(hit, COMPOSING, 11)).toEqual({ kind: 'clear' });
      expect(tileTap(hit, PLACE, 11)).toEqual({ kind: 'clear' });
    }
  });

  it('AD-12 with nothing selected, Idle and Game over: card, space, outside and WordCell clear; scrim and sheet keep (no-ops)', () => {
    for (const v of [IDLE, WON]) {
      for (const hit of [CARD, SPACE, OUTSIDE, cell(3)]) {
        expect(tileTap(hit, v, null)).toEqual({ kind: 'clear' });
      }
      for (const hit of [{ kind: 'scrim' }, { kind: 'sheet' }] as Hit[]) {
        expect(tileTap(hit, v, null)).toEqual({ kind: 'keep' });
      }
    }
  });

  it('AD-12 a missing WordCell throws', () => {
    expect(() => tileTap(cell(9), COMPOSING, null)).toThrow(
      /^AD-12 WordCell 9 is not in the GameView/,
    );
  });
});

describe('AD-12 tileTap stale selection', () => {
  it('AD-12 a selection that is not a live tile of the current phase throws for every hit', () => {
    for (const hit of [tile(10), BLOCK, cell(3), CARD, OUTSIDE, { kind: 'scrim' }] as Hit[]) {
      expect(() => tileTap(hit, COMPOSING, 20)).toThrow(
        /^AD-12 tileTap with tile 20 selected, not a live tile/,
      );
      expect(() => tileTap(hit, IDLE, 10)).toThrow(/^AD-12 tileTap with tile 10 selected/);
    }
    expect(() => tileTap(OUTSIDE, PLACE, 99)).toThrow(/^AD-12 tileTap with tile 99 selected/);
  });
});
