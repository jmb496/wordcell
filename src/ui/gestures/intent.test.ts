import { describe, expect, it } from 'vitest';
import type { GameView } from '../../engine/index';
import { destinationTap, type Hit, hoverAction, tapAction } from './intent';

// AD-12 tap and hover intent (SPEC CAP-6, the plan's I/O matrix): a hand-built GameView slice.
// Column 1 holds cards 10–14 (top → bottom), column 2 cards 20–21, column 3 is empty.
// Entry 10: `kIfTapped` puts a map on one column (Composing destination).
type Overrides = {
  canPickUp?: boolean;
  canDropOn?: boolean;
  status?: string;
  phase?: string;
  kIfTapped?: { column: number; map: ReadonlyMap<number, number | null> };
};

function view(o: Overrides = {}): GameView {
  const col = (column: number, cards: number[]) => ({
    column,
    cards,
    canPickUp: (o.canPickUp ?? true) && cards.length > 0,
    canDropOn: o.canDropOn ?? true,
    canTapForK: false,
    ...(o.kIfTapped?.column === column ? { kIfTapped: o.kIfTapped.map } : {}),
  });
  return {
    status: o.status ?? 'playing',
    phase: o.phase ?? 'idle',
    columns: [
      col(1, [10, 11, 12, 13, 14]),
      col(2, [20, 21]),
      col(3, []),
      ...[4, 5, 6, 7, 8].map((c) => col(c, [c * 10])),
    ],
    // Entry 11: cell 3 holds one card, cell 4 none.
    cells: [
      { cell: 3, cards: [90] },
      { cell: 4, cards: [] },
    ],
  } as unknown as GameView;
}

const card = (column: number, id: number): Hit => ({ kind: 'card', column, card: id });
const space = (column: number, foot = false): Hit => ({ kind: 'space', column, foot });
const SEL = { column: 1, count: 2 } as const;
const drop = (destinationColumn: number) => ({
  kind: 'drop',
  sourceColumn: 1,
  sourceCount: 2,
  destinationColumn,
});

describe('AD-12 tapAction with nothing selected', () => {
  it('AD-12 a column card with canPickUp selects it and every card below', () => {
    expect(tapAction(card(1, 12), view(), null, undefined)).toEqual({
      kind: 'select',
      column: 1,
      count: 3,
    });
    expect(tapAction(card(1, 10), view(), null, undefined)).toEqual({
      kind: 'select',
      column: 1,
      count: 5,
    });
    expect(tapAction(card(2, 21), view(), null, undefined)).toEqual({
      kind: 'select',
      column: 2,
      count: 1,
    });
  });

  it('AD-12 canPickUp false, empty space, placeholder, foot and outside are inert', () => {
    expect(tapAction(card(1, 12), view({ canPickUp: false }), null, undefined)).toEqual({
      kind: 'none',
    });
    for (const hit of [space(1), space(3), space(2, true), { kind: 'outside' }] as Hit[]) {
      expect(tapAction(hit, view(), null, undefined)).toEqual({ kind: 'none' });
    }
  });

  // Epic 5 SPEC F2: tray/strip tiles and D-block mirrors go to tile.ts `tileTap` only.
  it('AD-12 a tile or block hit throws, with or without a selection, in every phase', () => {
    for (const hit of [{ kind: 'tile', card: 3 }, { kind: 'block' }] as Hit[]) {
      for (const v of [view(), view({ phase: 'composing' }), view({ phase: 'place' })]) {
        expect(() => tapAction(hit, v, null, undefined)).toThrow(
          new RegExp(`^AD-12 tapAction on a tray ${hit.kind}`),
        );
        expect(() => tapAction(hit, v, SEL, 'tailSelection')).toThrow(/^AD-12 tapAction on a tray/);
      }
    }
  });

  // Entry 11 (R-65, R-75; R-33, R-39 inert): the plan's I/O rows Tap opens / Tap inert.
  it('AD-12 a non-empty WordCell opens the view in Idle and Game over; empty, Composing and Place are inert', () => {
    const cell3: Hit = { kind: 'wordcell', cell: 3 };
    const cell4: Hit = { kind: 'wordcell', cell: 4 };
    const open = { kind: 'openView', cell: 3 };
    for (const v of [view(), view({ status: 'won' }), view({ status: 'gaveUp' })]) {
      expect(tapAction(cell3, v, null, undefined)).toEqual(open);
      expect(tapAction(cell4, v, null, undefined)).toEqual({ kind: 'none' });
    }
    for (const v of [view({ phase: 'composing' }), view({ phase: 'place' })]) {
      expect(tapAction(cell3, v, null, undefined)).toEqual({ kind: 'none' });
      expect(tapAction(cell4, v, null, undefined)).toEqual({ kind: 'none' });
    }
    expect(() => tapAction({ kind: 'wordcell', cell: 5 }, view(), null, undefined)).toThrow(
      /^AD-12 WordCell 5/,
    );
  });

  it('AD-12 the view sheet and scrim never reach tapAction (the controller handles them)', () => {
    for (const hit of [{ kind: 'sheet' }, { kind: 'scrim' }] as Hit[]) {
      expect(() => tapAction(hit, view(), null, undefined)).toThrow(/^AD-12 tapAction on the view/);
      expect(() => tapAction(hit, view(), SEL, 'wordcellView')).toThrow(/^AD-12/);
    }
  });

  it('AD-12 a card not in the GameView column throws', () => {
    expect(() => tapAction(card(1, 20), view(), null, undefined)).toThrow(/^AD-12 card 20/);
  });
});

describe('AD-12 tapAction with a tail selected', () => {
  it('AD-12 any card, empty space, placeholder or foot of another column drops there', () => {
    for (const [hit, dest] of [
      [card(2, 21), 2],
      [card(2, 20), 2],
      [space(2), 2],
      [space(2, true), 2],
      [space(3), 3],
    ] as [Hit, number][]) {
      expect(tapAction(hit, view(), SEL, 'tailSelection')).toEqual(drop(dest));
    }
  });

  it('AD-12 the source column’s empty space and foot (Here) self-drop', () => {
    expect(tapAction(space(1), view(), SEL, 'tailSelection')).toEqual(drop(1));
    expect(tapAction(space(1, true), view(), SEL, 'tailSelection')).toEqual(drop(1));
  });

  it('AD-12 canDropOn false: no drop', () => {
    for (const hit of [card(2, 21), space(3), space(1, true)]) {
      expect(tapAction(hit, view({ canDropOn: false }), SEL, 'tailSelection')).toEqual({
        kind: 'none',
      });
    }
  });

  it('AD-12 a source card re-selects above (grow) and inside (shrink); the selected card is a no-op', () => {
    expect(tapAction(card(1, 11), view(), SEL, 'tailSelection')).toEqual({
      kind: 'select',
      column: 1,
      count: 4,
    });
    expect(tapAction(card(1, 14), view(), SEL, 'tailSelection')).toEqual({
      kind: 'select',
      column: 1,
      count: 1,
    });
    expect(tapAction(card(1, 13), view(), SEL, 'tailSelection')).toEqual({ kind: 'none' });
  });

  it('AD-12 a WordCell deselects', () => {
    expect(tapAction({ kind: 'wordcell', cell: 3 }, view(), SEL, 'tailSelection')).toEqual({
      kind: 'deselect',
    });
  });

  it('AD-12 F25 outside deselects only when tailSelection is the top entry', () => {
    expect(tapAction({ kind: 'outside' }, view(), SEL, 'tailSelection')).toEqual({
      kind: 'deselect',
    });
    expect(tapAction({ kind: 'outside' }, view(), SEL, 'wordcellView')).toEqual({ kind: 'none' });
  });
});

describe('AD-12 hoverAction', () => {
  it('AD-12 nothing selected: a card with canPickUp outlines its tail with grab; space and canPickUp false give nothing', () => {
    expect(hoverAction(card(1, 12), view(), null)).toEqual({
      column: 1,
      kind: 'tail',
      from: 2,
      grab: true,
    });
    expect(hoverAction(space(1), view(), null)).toBeNull();
    expect(hoverAction(space(1, true), view(), null)).toBeNull();
    expect(hoverAction(card(1, 12), view({ canPickUp: false }), null)).toBeNull();
  });

  it('AD-12 not Idle or not playing: nothing', () => {
    expect(hoverAction(card(1, 12), view({ phase: 'composing' }), null)).toBeNull();
    expect(hoverAction(card(1, 12), view({ status: 'won' }), null)).toBeNull();
    expect(hoverAction(space(2), view({ status: 'gaveUp' }), SEL)).toBeNull();
  });

  it('AD-12 a tail selected: another column’s card, space or foot shows the drop target', () => {
    for (const hit of [card(2, 20), space(2), space(2, true), space(3)]) {
      expect(hoverAction(hit, view(), SEL)).toEqual({
        column: hit.kind === 'card' || hit.kind === 'space' ? hit.column : 0,
        kind: 'drop',
      });
    }
    expect(hoverAction(card(2, 20), view({ canDropOn: false }), SEL)).toBeNull();
  });

  it('AD-12 F31 the source column’s empty space and Here show dropSelf, partial and whole', () => {
    expect(hoverAction(space(1), view(), SEL)).toEqual({ column: 1, kind: 'dropSelf' });
    expect(hoverAction(space(1, true), view(), { column: 1, count: 5 })).toEqual({
      column: 1,
      kind: 'dropSelf',
    });
  });

  it('AD-12 a source card other than the selected one outlines the re-select tail; the selected card nothing', () => {
    expect(hoverAction(card(1, 10), view(), SEL)).toEqual({
      column: 1,
      kind: 'tail',
      from: 0,
      grab: false,
    });
    expect(hoverAction(card(1, 14), view(), SEL)).toEqual({
      column: 1,
      kind: 'tail',
      from: 4,
      grab: false,
    });
    expect(hoverAction(card(1, 13), view(), SEL)).toBeNull();
  });

  it('AD-12 WordCells, tiles, D-block mirrors and outside give nothing', () => {
    for (const hit of [
      { kind: 'wordcell', cell: 3 },
      { kind: 'tile', card: 3 },
      { kind: 'block' },
      { kind: 'outside' },
    ] as Hit[]) {
      expect(hoverAction(hit, view(), null)).toBeNull();
      expect(hoverAction(hit, view(), SEL)).toBeNull();
    }
  });
});

// Entry 10 (SPEC CAP-8): Composing as the engine gives it (src/engine/view.ts): columns neither pick
// up nor take drops; column 1 (cards 10–14) is the destination, values as R-31 gives them.
const composing = (map: [number, number | null][], o: Overrides = {}) =>
  view({
    phase: 'composing',
    canPickUp: false,
    canDropOn: false,
    kIfTapped: { column: 1, map: new Map(map) },
    ...o,
  });
// Plain destination at k = 2: 10 → 5, 11 → 4, 12 → 3, 13 (top of D) → 1, 14 (bottom) → 1.
const K2 = composing([
  [10, 5],
  [11, 4],
  [12, 3],
  [13, 1],
  [14, 1],
]);
// Plain destination at k = 1: the top of D (14) is the R-31 no-op.
const K1 = composing([
  [10, 5],
  [11, 4],
  [12, 3],
  [13, 2],
  [14, null],
]);
// Self-drop at k = 1: remainder 10–12, S ghosts 13–14 are not keys.
const SELF = composing([
  [10, 3],
  [11, 2],
  [12, null],
]);
const tapDest = (id: number) => ({ kind: 'tapDestinationCard', card: id });

describe('AD-12 entry 10 Composing tapAction', () => {
  it('AD-12 a destination card whose kIfTapped is a number taps it', () => {
    expect(tapAction(card(1, 11), K1, null, undefined)).toEqual(tapDest(11));
    expect(tapAction(card(1, 13), K1, null, undefined)).toEqual(tapDest(13));
    expect(tapAction(card(1, 13), K2, null, undefined)).toEqual(tapDest(13));
    expect(tapAction(card(1, 10), SELF, null, undefined)).toEqual(tapDest(10));
  });

  it('AD-12 null, absent, another column, space, foot and S ghost (space) are inert', () => {
    for (const [hit, v] of [
      [card(1, 14), K1],
      [card(1, 12), SELF],
      [card(1, 13), SELF],
      [card(2, 20), K1],
      [card(4, 40), K1],
      [space(1), K1],
      [space(1, true), K1],
      [space(2), K1],
      [space(3, true), K1],
      [space(1), SELF],
    ] as [Hit, GameView][]) {
      expect(tapAction(hit, v, null, undefined)).toEqual({ kind: 'none' });
    }
  });

  it('AD-12 the branch ignores a selection; WordCells and outside keep today’s paths', () => {
    expect(tapAction(card(1, 11), K1, SEL, 'tailSelection')).toEqual(tapDest(11));
    expect(tapAction(space(2), K1, SEL, 'tailSelection')).toEqual({ kind: 'none' });
    expect(tapAction(card(2, 21), K1, SEL, 'tailSelection')).toEqual({ kind: 'none' });
    expect(tapAction({ kind: 'wordcell', cell: 3 }, K1, SEL, 'tailSelection')).toEqual({
      kind: 'deselect',
    });
    expect(tapAction({ kind: 'outside' }, K1, null, undefined)).toEqual({ kind: 'none' });
  });

  it('AD-12 an empty destination (k = 0, kIfTapped empty) is inert', () => {
    const empty = view({
      phase: 'composing',
      canPickUp: false,
      canDropOn: false,
      kIfTapped: { column: 3, map: new Map() },
    });
    for (const hit of [space(3), space(3, true)]) {
      expect(tapAction(hit, empty, null, undefined)).toEqual({ kind: 'none' });
    }
  });

  // R-39 (Place), R-75 (Game over).
  it('AD-12 Place and Game over columns stay inert', () => {
    const place = view({ phase: 'place', canPickUp: false, canDropOn: false });
    const won = view({ status: 'won', canPickUp: false, canDropOn: false });
    const gaveUp = view({ status: 'gaveUp', canPickUp: false, canDropOn: false });
    for (const v of [place, won, gaveUp]) {
      for (const hit of [card(1, 12), card(2, 21), space(1), space(3, true)]) {
        expect(tapAction(hit, v, null, undefined)).toEqual({ kind: 'none' });
      }
    }
  });
});

describe('AD-12 entry 10 destinationTap', () => {
  it('AD-12 the card iff Composing, playing, a card hit and its kIfTapped is a number', () => {
    expect(destinationTap(card(1, 12), K1)).toBe(12);
    expect(destinationTap(card(1, 14), K1)).toBeNull();
    expect(destinationTap(card(1, 13), SELF)).toBeNull();
    expect(destinationTap(card(2, 20), K1)).toBeNull();
    expect(destinationTap(space(1), K1)).toBeNull();
    expect(destinationTap({ kind: 'wordcell', cell: 3 }, K1)).toBeNull();
    expect(destinationTap(card(1, 12), composing([[12, 3]], { status: 'won' }))).toBeNull();
    expect(destinationTap(card(1, 12), composing([[12, 3]], { phase: 'place' }))).toBeNull();
    expect(destinationTap(card(1, 12), view())).toBeNull();
  });
});

describe('AD-12 entry 10 hoverAction k preview', () => {
  it('AD-12 a destination card with a number previews from size − value over the remainder', () => {
    expect(hoverAction(card(1, 11), K1, null)).toEqual({
      column: 1,
      kind: 'k',
      from: 1,
      length: 5,
    });
    expect(hoverAction(card(1, 13), K1, null)).toEqual({
      column: 1,
      kind: 'k',
      from: 3,
      length: 5,
    });
    // The top of D at k = 2 previews k − 1 (the bottom card only).
    expect(hoverAction(card(1, 13), K2, null)).toEqual({
      column: 1,
      kind: 'k',
      from: 4,
      length: 5,
    });
  });

  it('AD-12 a self-drop bounds the preview by the remainder, not the column with its S ghosts', () => {
    expect(hoverAction(card(1, 10), SELF, null)).toEqual({
      column: 1,
      kind: 'k',
      from: 0,
      length: 3,
    });
    expect(hoverAction(card(1, 11), SELF, null)).toEqual({
      column: 1,
      kind: 'k',
      from: 1,
      length: 3,
    });
  });

  it('AD-12 null, ghosts, other columns, spaces and non-column hits preview nothing', () => {
    for (const [hit, v] of [
      [card(1, 14), K1],
      [card(1, 12), SELF],
      [card(1, 13), SELF],
      [card(2, 20), K1],
      [space(1), K1],
      [space(1, true), K1],
      [space(2), K1],
      [{ kind: 'wordcell', cell: 3 }, K1],
      [{ kind: 'tile', card: 3 }, K1],
      [{ kind: 'block' }, K1],
      [{ kind: 'outside' }, K1],
    ] as [Hit, GameView][]) {
      expect(hoverAction(hit, v, null)).toBeNull();
    }
  });
});
