// AD-12 tap and hover intent (epic 4 SPEC CAP-6, R-14 tap half, Q-18, epic 4 SPEC F25, epic 4 SPEC
// F31), pure: the controller resolves a `Hit` at pointerdown and asks, at a released tap or a mouse
// hover, what it means for the `GameView` (AD-3) and the tail selection (AD-13). Column membership
// and the card index come from the view, never the DOM; a missing column or cell throws through
// lookup.ts. `drop` implies deselect-first in the controller. In Composing (epic 4 SPEC CAP-8,
// R-31, R-39) only the destination column acts, keyed on its `kIfTapped` (a number →
// `tapDestinationCard`, `null` or absent → nothing); every other column part, S ghosts included
// (they resolve as `space`), is inert, with or without a selection. With nothing selected (epic 4
// SPEC CAP-9, R-65, R-75, epic 4 SPEC F14) a non-empty WordCell tap opens the sticky view in Idle
// and Game over (`openView`). In Composing (epic 5 SPEC CAP-6, R-33, Q-31) a WordCell tap, whatever
// the selection, adds the cell's top card as a free letter (`addFreeLetter`, appended) when it has
// `canAddFreeLetter`, else does nothing (used or empty). In Place (epic 5 SPEC CAP-7, R-39, R-40,
// R-41, R-51) a WordCell tap sets the target (`setTarget`) when the cell has `canSetTarget` (legal,
// not the current target), else does nothing (a Place view never has a tail selection). The view
// sheet and its scrim are `Hit`s the controller handles itself, never `tapAction`'s, and so are
// tray/strip tiles and D-block mirrors (epic 5 SPEC CAP-4, F2: tile.ts `tileTap` only);
// `hoverAction` gives nothing for them.
import type { CardId, ColumnView, GameView, WordCellNumber } from '../../engine/index';
import type { OverlayId, TailSelection } from '../overlays.svelte';
import { cellIn, columnIn } from './lookup';

export type Hit =
  /** A live column card (`data-place="column"`) in the `[data-column]` it sits in. */
  | { readonly kind: 'card'; readonly column: number; readonly card: CardId }
  /** A non-card part of a column: empty space, placeholder, ghost, or the foot pad. */
  | { readonly kind: 'space'; readonly column: number; readonly foot: boolean }
  /** Any part of a `[data-wordcell]`, cell 3–10. */
  | { readonly kind: 'wordcell'; readonly cell: number }
  /** The WordCell view sheet (R-65; handled by the controller before `tapAction`). */
  | { readonly kind: 'sheet' }
  /** The WordCell view's scrim (R-65; handled by the controller before `tapAction`). */
  | { readonly kind: 'scrim' }
  /** A live tray or strip tile (`data-place` `tray`/`strip`, epic 5 SPEC F2; tile.ts only). */
  | { readonly kind: 'tile'; readonly card: CardId }
  /** A D-block mirror in the tray band (epic 5 SPEC F2: keeps a tile selection; tile.ts only). */
  | { readonly kind: 'block' }
  /** Everything else (F25 outside regions, disabled controls, outside the root). */
  | { readonly kind: 'outside' };

export type TapAction =
  | { readonly kind: 'select'; readonly column: number; readonly count: number }
  | {
      readonly kind: 'drop';
      readonly sourceColumn: number;
      readonly sourceCount: number;
      readonly destinationColumn: number;
    }
  | { readonly kind: 'deselect' }
  | { readonly kind: 'tapDestinationCard'; readonly card: CardId }
  | { readonly kind: 'openView'; readonly cell: number }
  /** Epic 5 SPEC CAP-6: a tap on an available Composing WordCell (Q-31: appended). */
  | { readonly kind: 'addFreeLetter'; readonly cell: WordCellNumber }
  /** Epic 5 SPEC CAP-7: a tap on a Place WordCell with `canSetTarget` (R-40, R-41, R-51). */
  | { readonly kind: 'setTarget'; readonly cell: WordCellNumber }
  | { readonly kind: 'none' };

export type HoverAction =
  /** The 1 px outline of the tail from card index `from` (grab: the tail would lift). */
  | {
      readonly column: number;
      readonly kind: 'tail';
      readonly from: number;
      readonly grab: boolean;
    }
  /** The drop-target highlight on another column. */
  | { readonly column: number; readonly kind: 'drop' }
  /** The drop-target highlight on the source column (partial: remainder top; whole: Here, F31). */
  | { readonly column: number; readonly kind: 'dropSelf' }
  /**
   * R-31 k preview: the would-be D from card index `from` down to the remainder's bottom card
   * (index `length` − 1; `length` = `kIfTapped.size`, never the S ghosts of a self-drop).
   */
  | { readonly column: number; readonly kind: 'k'; readonly from: number; readonly length: number };

const NONE: TapAction = { kind: 'none' };

function columnOf(view: GameView, column: number): ColumnView {
  return columnIn(view.columns, column, `AD-12 column ${column} is not in the GameView`);
}

// The tail count from the pressed card to the bottom (R-10).
function tailFrom(entry: ColumnView, card: CardId): { index: number; count: number } {
  const index = entry.cards.indexOf(card);
  if (index < 0) throw new Error(`AD-12 card ${card} is not in column ${entry.column}`);
  return { index, count: entry.cards.length - index };
}

function composing(view: GameView): boolean {
  return view.status === 'playing' && view.phase === 'composing';
}

function place(view: GameView): boolean {
  return view.status === 'playing' && view.phase === 'place';
}

// R-31: a Composing destination-card hit with a numeric `kIfTapped`, else null.
function destinationHit(
  hit: Hit,
  view: GameView,
): { column: number; card: CardId; value: number; size: number } | null {
  if (!composing(view) || hit.kind !== 'card') return null;
  const kIfTapped = columnOf(view, hit.column).kIfTapped;
  const value = kIfTapped?.get(hit.card);
  if (kIfTapped === undefined || typeof value !== 'number') return null;
  return { column: hit.column, card: hit.card, value, size: kIfTapped.size };
}

/** R-31: the card a Composing destination-column press sets k from, else null. */
export function destinationTap(hit: Hit, view: GameView): CardId | null {
  return destinationHit(hit, view)?.card ?? null;
}

// R-65/R-75: a WordCell tap with nothing selected opens the sticky view in Idle and Game over when
// the cell holds a card (AD-3: emptiness from the GameView).
function viewTap(n: number, view: GameView): TapAction {
  if (view.status === 'playing' && view.phase !== 'idle') return NONE;
  const cell = cellIn(view.cells, n, `AD-12 WordCell ${n} is not in the GameView`);
  return cell.cards.length === 0 ? NONE : { kind: 'openView', cell: n };
}

export function tapAction(
  hit: Hit,
  view: GameView,
  selection: TailSelection | null,
  top: OverlayId | undefined,
): TapAction {
  if (composing(view) && (hit.kind === 'card' || hit.kind === 'space')) {
    const card = destinationTap(hit, view);
    return card === null ? NONE : { kind: 'tapDestinationCard', card };
  }
  if (hit.kind === 'sheet' || hit.kind === 'scrim') {
    throw new Error(`AD-12 tapAction on the view ${hit.kind}`);
  }
  if (hit.kind === 'tile' || hit.kind === 'block') {
    throw new Error(`AD-12 tapAction on a tray ${hit.kind}`);
  }
  if (composing(view) && hit.kind === 'wordcell') {
    const cell = cellIn(view.cells, hit.cell, `AD-12 WordCell ${hit.cell} is not in the GameView`);
    return cell.canAddFreeLetter ? { kind: 'addFreeLetter', cell: cell.cell } : NONE;
  }
  // Epic 5 SPEC CAP-7, F13: `canSetTarget` is false on the current target and a not-legal cell.
  if (place(view) && hit.kind === 'wordcell') {
    const cell = cellIn(view.cells, hit.cell, `AD-12 WordCell ${hit.cell} is not in the GameView`);
    return cell.canSetTarget ? { kind: 'setTarget', cell: cell.cell } : NONE;
  }
  if (selection === null) {
    if (hit.kind === 'wordcell') return viewTap(hit.cell, view);
    if (hit.kind !== 'card') return NONE;
    const entry = columnOf(view, hit.column);
    if (!entry.canPickUp) return NONE;
    return { kind: 'select', column: hit.column, count: tailFrom(entry, hit.card).count };
  }
  switch (hit.kind) {
    case 'wordcell':
      return { kind: 'deselect' };
    // F25: outside regions.
    case 'outside':
      return top === 'tailSelection' ? { kind: 'deselect' } : NONE;
    case 'card':
    case 'space': {
      const entry = columnOf(view, hit.column);
      if (hit.kind === 'card' && hit.column === selection.column) {
        const { count } = tailFrom(entry, hit.card);
        if (count === selection.count || !entry.canPickUp) return NONE;
        return { kind: 'select', column: hit.column, count };
      }
      if (!entry.canDropOn) return NONE;
      return {
        kind: 'drop',
        sourceColumn: selection.column,
        sourceCount: selection.count,
        destinationColumn: hit.column,
      };
    }
  }
}

export function hoverAction(
  hit: Hit,
  view: GameView,
  selection: TailSelection | null,
): HoverAction | null {
  if (composing(view)) {
    const target = destinationHit(hit, view);
    if (target === null) return null;
    return {
      column: target.column,
      kind: 'k',
      from: target.size - target.value,
      length: target.size,
    };
  }
  if (view.status !== 'playing' || view.phase !== 'idle') return null;
  // Epic 5 SPEC F12: no hover on tiles or D-block mirrors.
  if (hit.kind !== 'card' && hit.kind !== 'space') return null;
  const entry = columnOf(view, hit.column);
  if (selection === null) {
    if (hit.kind !== 'card' || !entry.canPickUp) return null;
    return { column: hit.column, kind: 'tail', from: tailFrom(entry, hit.card).index, grab: true };
  }
  if (hit.column !== selection.column) {
    return entry.canDropOn ? { column: hit.column, kind: 'drop' } : null;
  }
  if (hit.kind === 'space') {
    return entry.canDropOn ? { column: hit.column, kind: 'dropSelf' } : null;
  }
  const { index, count } = tailFrom(entry, hit.card);
  if (count === selection.count || !entry.canPickUp) return null;
  return { column: hit.column, kind: 'tail', from: index, grab: false };
}
