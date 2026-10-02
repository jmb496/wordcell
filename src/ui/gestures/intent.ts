// AD-12 tap and hover intent (SPEC CAP-6, R-14 tap half, Q-18, F25, F31), pure: the controller
// resolves a `Hit` at pointerdown and asks, at a released tap or a mouse hover, what it means for
// the `GameView` (AD-3) and the tail selection (AD-13). Column membership and the card index come
// from the view, never the DOM. `drop` implies deselect-first in the controller.
import type { CardId, ColumnView, GameView } from '../../engine/index';
import type { OverlayId, TailSelection } from '../overlays.svelte';

export type Hit =
  /** A live column card (`data-place="column"`) in the `[data-column]` it sits in. */
  | { readonly kind: 'card'; readonly column: number; readonly card: CardId }
  /** A non-card part of a column: empty space, placeholder, ghost, or the foot pad. */
  | { readonly kind: 'space'; readonly column: number; readonly foot: boolean }
  /** Any part of a `[data-wordcell]`. */
  | { readonly kind: 'wordcell' }
  /** A tray or strip tile or a tray mirror (no selection change of its own, F23; outside for F25). */
  | { readonly kind: 'tile' }
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
  | { readonly column: number; readonly kind: 'dropSelf' };

const NONE: TapAction = { kind: 'none' };

function columnOf(view: GameView, column: number): ColumnView {
  const entry = view.columns[column - 1];
  if (entry === undefined || entry.column !== column) {
    throw new Error(`AD-12 column ${column} is not in the GameView`);
  }
  return entry;
}

// The tail count from the pressed card to the bottom (R-10).
function tailFrom(entry: ColumnView, card: CardId): { index: number; count: number } {
  const index = entry.cards.indexOf(card);
  if (index < 0) throw new Error(`AD-12 card ${card} is not in column ${entry.column}`);
  return { index, count: entry.cards.length - index };
}

export function tapAction(
  hit: Hit,
  view: GameView,
  selection: TailSelection | null,
  top: OverlayId | undefined,
): TapAction {
  if (selection === null) {
    if (hit.kind !== 'card') return NONE;
    const entry = columnOf(view, hit.column);
    if (!entry.canPickUp) return NONE;
    return { kind: 'select', column: hit.column, count: tailFrom(entry, hit.card).count };
  }
  switch (hit.kind) {
    case 'wordcell':
      return { kind: 'deselect' };
    // F25: the tray band and its tiles are outside regions.
    case 'outside':
    case 'tile':
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
  if (view.status !== 'playing' || view.phase !== 'idle') return null;
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
