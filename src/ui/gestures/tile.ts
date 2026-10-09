// AD-12 tile tap intent (epic 5 SPEC CAP-4, F1, F2, F13, F18; R-33, R-34, R-35, Q-31), pure: what a
// released tap (or a drag-as-tap) on `hit` means for the tile selection (AD-13
// `overlays.tileSelection`), from the `GameView` (AD-3). Total over `Hit`. The live tiles are, in
// Composing, `draft.arrangement` (S and free letters; the D-block copies are mirrors, `block`
// hits) and, in Place, `place.placementOrder`. A tile tap selects, swaps (one `arrange` /
// `setPlacementOrder` with the two exchanged), deselects (a second tap on a selected S or strip
// tile) or removes (a second tap on a selected Composing free letter: `removeFreeLetter` for the
// `draft.freeLetters` cell whose top card it is, tags.ts `originCard`). Keep: block, scrim and sheet
// hits, a Composing WordCell without `canAddFreeLetter` (used or empty), a Place WordCell that is not
// a legal target. Clear: every other hit (columns, outside, an available Composing cell, which
// intent.ts then adds as a free letter, epic 5 SPEC CAP-6, and the current or another legal Place
// cell until ticket 9 dispatches there). A tile hit outside
// Composing and Place, a tile that is not live in the phase, or a selection that is not a live tile
// of the current phase throws (rule 6).
// Tile drag run (epic 5 SPEC CAP-5, F3, F25; build-notes CAP-5), pure: `tileRun` gives a dragged
// live tile's movable run in tray positions (Composing: `draft.arrangement` from `first` = k with
// the block on the left, else 0, over |M| + k tiles; Place: `placementOrder` from 0 over n), the
// tile's run index `from`, and `release(gap)`: targeting.ts `reorder` compared by card, one
// `arrange` / `setPlacementOrder` iff the order changes, else null. A card that is not a live tile
// of the phase, or a view outside Composing and Place, throws (rule 6).
// Free-letter drag run (epic 5 SPEC CAP-6, F3; build-notes CAP-6), pure: `freeLetterRun` gives an
// available Composing cell's top card, the R-30 tray order (layout/tray.ts `trayOrder`, mirrors
// included), M's first tray position (k with the block on the left, else 0), |M| and the tile count
// |M| + k, and `release(gap)`: one `addFreeLetter { cell, index: gap }` with the gap in M (0…|M|),
// never a tray position. Outside Composing, a cell without `canAddFreeLetter` or a gap outside
// 0…|M| throws (rule 6).
import type { CardId, Command, GameView, WordCellNumber } from '../../engine/index';
import { type TrayTile, trayOrder } from '../layout/tray';
import { originCard } from '../tray/tags';
import type { Hit } from './intent';
import { cellIn, found } from './lookup';
import { reorder } from './targeting';

export type TileAction =
  | { readonly kind: 'select'; readonly card: CardId }
  | { readonly kind: 'deselect' }
  | { readonly kind: 'swap'; readonly command: Command }
  | { readonly kind: 'remove'; readonly cell: WordCellNumber }
  | { readonly kind: 'keep' }
  | { readonly kind: 'clear' };

const KEEP: TileAction = { kind: 'keep' };
const CLEAR: TileAction = { kind: 'clear' };

type Tiles = { readonly phase: 'composing' | 'place'; readonly order: readonly CardId[] };

// The live tiles of the current phase, or null outside Composing and Place.
function liveTiles(view: GameView): Tiles | null {
  if (view.status !== 'playing') return null;
  if (view.phase === 'place') {
    const place = found(view.place, 'AD-12 Place without a place view');
    return { phase: 'place', order: place.placementOrder };
  }
  if (view.phase === 'composing') {
    const draft = found(view.draft, 'AD-12 Composing without a draft view');
    return { phase: 'composing', order: draft.arrangement };
  }
  return null;
}

// The order with cards `a` and `b` exchanged.
function exchanged(order: readonly CardId[], a: CardId, b: CardId): CardId[] {
  return order.map((card) => (card === a ? b : card === b ? a : card));
}

// R-33/Q-31: the free-letter cell whose top card is `card`, or null for an S tile.
function freeLetterCell(view: GameView, card: CardId): WordCellNumber | null {
  const draft = found(view.draft, 'AD-12 Composing without a draft view');
  return draft.freeLetters.find((cell) => originCard(view.cells, cell) === card) ?? null;
}

// The one command shape of a tray or strip reorder (swap or drag).
function orderCommand(tiles: Tiles, order: readonly CardId[]): Command {
  return tiles.phase === 'place'
    ? { type: 'setPlacementOrder', order }
    : { type: 'arrange', arrangement: order };
}

function tileHit(card: CardId, view: GameView, tiles: Tiles, selection: CardId | null): TileAction {
  if (!tiles.order.includes(card)) {
    throw new Error(`AD-12 tileTap on card ${card}, not a live tile in ${tiles.phase}`);
  }
  if (selection === null) return { kind: 'select', card };
  if (selection === card) {
    if (tiles.phase === 'place') return { kind: 'deselect' };
    const cell = freeLetterCell(view, card);
    return cell === null ? { kind: 'deselect' } : { kind: 'remove', cell };
  }
  return { kind: 'swap', command: orderCommand(tiles, exchanged(tiles.order, selection, card)) };
}

// F13: WordCell taps by phase (AD-3 flags from the GameView).
function wordcellHit(n: number, view: GameView, tiles: Tiles | null): TileAction {
  if (tiles === null) return CLEAR;
  const cell = cellIn(view.cells, n, `AD-12 WordCell ${n} is not in the GameView`);
  if (tiles.phase === 'composing') return cell.canAddFreeLetter ? CLEAR : KEEP;
  return cell.isLegalTarget ? CLEAR : KEEP;
}

export function tileTap(hit: Hit, view: GameView, selection: CardId | null): TileAction {
  const tiles = liveTiles(view);
  if (selection !== null && (tiles === null || !tiles.order.includes(selection))) {
    throw new Error(`AD-12 tileTap with tile ${selection} selected, not a live tile`);
  }
  switch (hit.kind) {
    case 'tile':
      if (tiles === null) throw new Error(`AD-12 tileTap on tile ${hit.card} outside a draft`);
      return tileHit(hit.card, view, tiles, selection);
    case 'block':
      if (tiles?.phase !== 'composing')
        throw new Error('AD-12 tileTap on a block outside Composing');
      return KEEP;
    case 'scrim':
    case 'sheet':
      return KEEP;
    case 'wordcell':
      return wordcellHit(hit.cell, view, tiles);
    case 'card':
    case 'space':
    case 'outside':
      return CLEAR;
  }
}

type TileRun = {
  /** The movable run, M or `placementOrder` (no mirrors). */
  readonly order: readonly CardId[];
  /** The run's first tray position. */
  readonly first: number;
  readonly count: number;
  /** Every tray position, D-block mirrors included. */
  readonly tileCount: number;
  /** The dragged tile's run index (j). */
  readonly from: number;
  /** The reorder command for a release at gap `gap` (0…count), or null when the order is kept. */
  release(gap: number): Command | null;
};

/** Epic 5 SPEC CAP-5: the movable run of the dragged live tile `card`. */
export function tileRun(view: GameView, card: CardId): TileRun {
  const tiles = liveTiles(view);
  if (tiles === null) throw new Error(`AD-12 tileRun on tile ${card} outside a draft`);
  const from = tiles.order.indexOf(card);
  if (from < 0) throw new Error(`AD-12 tileRun on card ${card}, not a live tile in ${tiles.phase}`);
  const count = tiles.order.length;
  let first = 0;
  let tileCount = count;
  if (tiles.phase === 'composing') {
    const draft = found(view.draft, 'AD-12 Composing without a draft view');
    first = draft.side === 'left' ? draft.k : 0;
    tileCount = count + draft.k;
  }
  return {
    order: tiles.order,
    first,
    count,
    tileCount,
    from,
    release(gap: number): Command | null {
      const next = reorder(tiles.order, from, gap);
      return next.every((id, i) => id === tiles.order[i]) ? null : orderCommand(tiles, next);
    },
  };
}

type FreeLetterRun = {
  /** The cell's top card (the dragged live element). */
  readonly card: CardId;
  /** Every tray position in R-30 order, D-block mirrors included. */
  readonly tray: readonly TrayTile[];
  /** M's first tray position. */
  readonly first: number;
  /** |M|. */
  readonly count: number;
  /** |M| + k. */
  readonly tileCount: number;
  /** The insert for a release at gap `gap` in M (0…count). */
  release(gap: number): Command;
};

/** Epic 5 SPEC CAP-6: the free-letter drag run of available Composing cell `cell`. */
export function freeLetterRun(view: GameView, cell: number): FreeLetterRun {
  if (view.status !== 'playing' || view.phase !== 'composing') {
    throw new Error(`AD-12 freeLetterRun on cell ${cell} outside Composing`);
  }
  const draft = found(view.draft, 'AD-12 Composing without a draft view');
  const entry = cellIn(view.cells, cell, `AD-12 WordCell ${cell} is not in the GameView`);
  if (!entry.canAddFreeLetter) {
    throw new Error(`AD-12 freeLetterRun on cell ${cell} without canAddFreeLetter`);
  }
  const card = found(entry.cards.at(-1), `AD-12 freeLetterRun on empty cell ${cell}`);
  const count = draft.arrangement.length;
  return {
    card,
    tray: trayOrder(draft),
    first: draft.side === 'left' ? draft.k : 0,
    count,
    tileCount: count + draft.k,
    release(gap: number): Command {
      if (!Number.isInteger(gap) || gap < 0 || gap > count) {
        throw new Error(`AD-12 freeLetterRun release at gap ${gap} outside 0…${count}`);
      }
      return { type: 'addFreeLetter', cell: entry.cell, index: gap };
    },
  };
}
