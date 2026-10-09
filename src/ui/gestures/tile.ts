// AD-12 tile tap intent (epic 5 SPEC CAP-4, F1, F2, F13, F18; R-33, R-34, R-35, Q-31), pure: what a
// released tap (or a drag-as-tap) on `hit` means for the tile selection (AD-13
// `overlays.tileSelection`), from the `GameView` (AD-3). Total over `Hit`. The live tiles are, in
// Composing, `draft.arrangement` (S and free letters; the D-block copies are mirrors, `block`
// hits) and, in Place, `place.placementOrder`. A tile tap selects, swaps (one `arrange` /
// `setPlacementOrder` with the two exchanged), deselects (a second tap on a selected S or strip
// tile) or removes (a second tap on a selected Composing free letter: `removeFreeLetter` for the
// `draft.freeLetters` cell whose top card it is, tags.ts `originCard`). Keep: block, scrim and sheet
// hits, a Composing WordCell without `canAddFreeLetter` (used or empty), a Place WordCell that is not
// a legal target. Clear: every other hit (columns, outside, an available Composing cell and the
// current or another legal Place cell until tickets 8/9 dispatch there). A tile hit outside
// Composing and Place, a tile that is not live in the phase, or a selection that is not a live tile
// of the current phase throws (rule 6).
import type { CardId, Command, GameView, WordCellNumber } from '../../engine/index';
import { originCard } from '../tray/tags';
import type { Hit } from './intent';
import { cellIn, found } from './lookup';

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
  const order = exchanged(tiles.order, selection, card);
  return {
    kind: 'swap',
    command:
      tiles.phase === 'place'
        ? { type: 'setPlacementOrder', order }
        : { type: 'arrange', arrangement: order },
  };
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
