// Entry 12 (SPEC CAP-9, F19, F27; DESIGN.md View sheet): the desktop hover peek's pure helpers.
// HoverPeek.svelte calls them; they read no DOM.

/** F19: the hover peek shows at most the top 14 cards, 7 per row. */
export const HOVER_PEEK_MAX = 14;
export const PER_ROW = 7;
/** The sheet's 16 px padding on each side. */
const PADDING = 16;

/** The shown slice (the top 14, oldest of them first) and the count of older cards left out. */
export function hoverPeekCards<T>(cards: readonly T[]): { shown: readonly T[]; older: number } {
  const older = Math.max(0, cards.length - HOVER_PEEK_MAX);
  return { shown: cards.slice(older), older };
}

/** Content-sized width: `min(count, 7)` slots, minus the last 4 px gap, plus the padding. */
export function hoverPeekWidth(count: number, slot: number): number {
  return Math.min(count, PER_ROW) * slot - 4 + 2 * PADDING;
}

export type HoverPeekPlacement = {
  /** The WordCell (3–10). */
  readonly cell: number;
  /** Slot pitch (w + 4). */
  readonly slot: number;
  /** The rendered root's width and height. */
  readonly width: number;
  readonly height: number;
  /** The cell label's top (the anchor box's top), the cell's bottom and the `.board` top, all in
   * the Board root's coordinates. */
  readonly labelTop: number;
  readonly cellBottom: number;
  readonly boardTop: number;
};

/**
 * F19: `x` is relative to the board column's left edge, the cell's centre clamped inside the
 * column; above the anchor box (bottom = label top) unless its height exceeds the room between the
 * board top and the anchor top, then below the cell (top = cell bottom), never clamped vertically.
 */
export function placeHoverPeek(p: HoverPeekPlacement): { x: number; y: number; below: boolean } {
  const centre = (p.cell - 2.5) * p.slot;
  const x = Math.min(Math.max(centre - p.width / 2, 0), 8 * p.slot - p.width);
  const below = p.height > p.labelTop - p.boardTop;
  return { x, y: below ? p.cellBottom : p.labelTop - p.height, below };
}
