// Epic 6 CAP-10 (6.11): what the keyboard focus is on, for the key table (keys.ts). Reads the DOM
// (`document.activeElement`); the unit tests of keys.ts mock this module. A card is identified by
// its live element's `data-card-id` and `data-place` (AD-14: mirrors are never focusable).
import type { CardId } from '../engine/index';

export type FocusTarget =
  /** A live column card. */
  | { readonly kind: 'column'; readonly column: number; readonly card: CardId }
  /** A live tray tile (Composing) or strip card (Place), with its neighbours in the region. */
  | {
      readonly kind: 'tile';
      readonly place: 'tray' | 'strip';
      readonly card: CardId;
      readonly left: CardId | null;
      readonly right: CardId | null;
    }
  | { readonly kind: 'cell'; readonly cell: number }
  /** The open sticky WordCell view's sheet (`data-view-cell`, WordCellView.svelte) and its cell. */
  | { readonly kind: 'view'; readonly cell: number }
  /** A native control that keeps Enter and Space (button, link, input). */
  | { readonly kind: 'control' }
  /** The Board container, `body`, or anything else. */
  | { readonly kind: 'board' };

const NATIVE = 'button, a[href], input, select, textarea, summary';

/** The live tiles (tray or strip) in DOM order. */
export function liveTiles(place: 'tray' | 'strip'): CardId[] {
  return [...document.querySelectorAll<HTMLElement>(`[data-card-id][data-place="${place}"]`)].map(
    (el) => Number(el.dataset.cardId),
  );
}

export function readFocus(): FocusTarget {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement) || el === document.body) return { kind: 'board' };
  if (el.matches(NATIVE)) return { kind: 'control' };
  const place = el.dataset.place;
  if (el.dataset.cardId !== undefined && place !== undefined) {
    const card = Number(el.dataset.cardId);
    if (place === 'column') {
      const column = el.closest<HTMLElement>('[data-column]');
      if (column === null) throw new Error(`AD-14 column card ${card} outside [data-column]`);
      return { kind: 'column', column: Number(column.dataset.column), card };
    }
    if (place === 'tray' || place === 'strip') {
      const list = liveTiles(place);
      const at = list.indexOf(card);
      return {
        kind: 'tile',
        place,
        card,
        left: list[at - 1] ?? null,
        right: list[at + 1] ?? null,
      };
    }
    return { kind: 'board' };
  }
  if (el.dataset.wordcell !== undefined) return { kind: 'cell', cell: Number(el.dataset.wordcell) };
  if (el.dataset.viewCell !== undefined) return { kind: 'view', cell: Number(el.dataset.viewCell) };
  return { kind: 'board' };
}
