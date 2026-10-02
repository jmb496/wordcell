import { describe, expect, it } from 'vitest';
import type { GameView } from '../../engine/index';
import { type Hit, hoverAction, tapAction } from './intent';

// AD-12 tap and hover intent (SPEC CAP-6, the plan's I/O matrix): a hand-built GameView slice.
// Column 1 holds cards 10–14 (top → bottom), column 2 cards 20–21, column 3 is empty.
type Overrides = { canPickUp?: boolean; canDropOn?: boolean; status?: string; phase?: string };

function view(o: Overrides = {}): GameView {
  const col = (column: number, cards: number[]) => ({
    column,
    cards,
    canPickUp: (o.canPickUp ?? true) && cards.length > 0,
    canDropOn: o.canDropOn ?? true,
    canTapForK: false,
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

  it('AD-12 canPickUp false, empty space, placeholder, foot, WordCell, tile and outside are inert', () => {
    expect(tapAction(card(1, 12), view({ canPickUp: false }), null, undefined)).toEqual({
      kind: 'none',
    });
    for (const hit of [
      space(1),
      space(3),
      space(2, true),
      { kind: 'wordcell' },
      { kind: 'tile' },
      { kind: 'outside' },
    ] as Hit[]) {
      expect(tapAction(hit, view(), null, undefined)).toEqual({ kind: 'none' });
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

  it('AD-12 a WordCell deselects; F25 a tile deselects like outside, only when tailSelection is the top entry', () => {
    expect(tapAction({ kind: 'wordcell' }, view(), SEL, 'tailSelection')).toEqual({
      kind: 'deselect',
    });
    expect(tapAction({ kind: 'tile' }, view(), SEL, 'tailSelection')).toEqual({
      kind: 'deselect',
    });
    expect(tapAction({ kind: 'tile' }, view(), SEL, 'wordcellView')).toEqual({ kind: 'none' });
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

  it('AD-12 WordCells, tiles and outside give nothing', () => {
    for (const hit of [{ kind: 'wordcell' }, { kind: 'tile' }, { kind: 'outside' }] as Hit[]) {
      expect(hoverAction(hit, view(), null)).toBeNull();
      expect(hoverAction(hit, view(), SEL)).toBeNull();
    }
  });
});
