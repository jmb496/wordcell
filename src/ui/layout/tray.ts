// Tray geometry: tile sizing and tile order after DESIGN.md Tray band and Tile (F2, build-notes
// CAP-2), and the resting slot rects, insertion gap rects, parting offsets and D-block segment ends
// tile and free-letter drags use (F3, build-notes CAP-5, CAP-6). Pure: no DOM, `window` or Svelte.
import type { CardId, DestinationSide, GameView } from '../../engine/index';
import type { GapRect, Rect } from '../gestures/targeting';
import { cardMetrics, trayGrowth } from './geometry';

export type TrayLayout = {
  mode: 'card' | 'compact';
  /** Tile rows; 0 for no tiles, 1 in card mode, uncapped in compact mode. */
  rows: number;
  perRow: number;
  tileWidth: number;
  /** The tile face height: card H in card mode, 44 in compact mode. */
  tileHeight: number;
  /** The tile-area height, max(H, 92) + `trayGrowth(rows, H)` (A-D4: every compact row fits). */
  area: number;
};

export type TrayTile = { id: CardId; mirror: boolean };

const TOUCH_MIN = 44;
const GAP = 4;
const COMPACT_AREA = 2 * TOUCH_MIN + GAP;

/** DESIGN.md Tray band: card-height tiles while they fit one row, else compact rows. */
export function trayLayout(tileCount: number, w: number, innerWidth: number): TrayLayout {
  const tileWidth = Math.max(w, TOUCH_MIN);
  const perRow = Math.floor((innerWidth + GAP) / (tileWidth + GAP));
  const { H } = cardMetrics(w);
  const reserved = Math.max(H, COMPACT_AREA);
  if (tileCount <= perRow) {
    const rows = tileCount === 0 ? 0 : 1;
    return { mode: 'card', rows, perRow, tileWidth, tileHeight: H, area: reserved };
  }
  const rows = Math.ceil(tileCount / perRow);
  const area = reserved + trayGrowth(rows, H);
  return { mode: 'compact', rows, perRow, tileWidth, tileHeight: TOUCH_MIN, area };
}

/**
 * R-30 tray order in Composing: the arrangement with the D block (mirrors) at the `side` end,
 * D (top → bottom) reversed on the right.
 */
export function trayOrder(draft: {
  readonly arrangement: readonly CardId[];
  readonly destination: readonly CardId[];
  readonly side: DestinationSide;
}): TrayTile[] {
  const live = draft.arrangement.map((id) => ({ id, mirror: false }));
  const block = draft.destination.map((id) => ({ id, mirror: true }));
  return draft.side === 'left' ? [...block, ...live] : [...live, ...block.reverse()];
}

/**
 * The tiles the Tray renders (AD-3): the strip in `placementOrder` in Place, the R-30 tray order in
 * Composing, none otherwise. The one source of the tile count `layout.tray` rows are derived from.
 */
export function trayTiles(view: GameView): TrayTile[] {
  if (view.place !== undefined)
    return view.place.placementOrder.map((id) => ({ id, mirror: false }));
  if (view.draft !== undefined) return trayOrder(view.draft);
  return [];
}

/** The tile count of `trayTiles(view)` (build-notes CAP-9). */
export function trayTileCount(view: GameView): number {
  return trayTiles(view).length;
}

const isInt = (n: number | undefined): boolean => Number.isInteger(n);

/**
 * Build-notes CAP-5: the resting slot rects (unlifted faces, tileWidth × tileHeight) of slots
 * 0…slotCount − 1 in reading order. `origin` is the caller's: tray position 0's wrapper top-left
 * + 2 px in x, measured once at drag start in the same viewport frame as the dragged face rect
 * (both from `getBoundingClientRect`). slotCount is at most perRow × the rendered rows.
 */
export function slotRects(
  sizing: TrayLayout,
  origin: { readonly x: number; readonly y: number },
  slotCount: number,
): Rect[] {
  const { perRow, rows, tileWidth, tileHeight } = sizing;
  if (!isInt(slotCount) || slotCount < 1 || slotCount > perRow * rows) {
    throw new Error(`AD-12 slotRects with slotCount ${slotCount} outside 1…${perRow * rows}`);
  }
  return Array.from({ length: slotCount }, (_, n) => {
    const left = origin.x + (n % perRow) * (tileWidth + GAP);
    const top = origin.y + Math.floor(n / perRow) * (tileHeight + GAP);
    return { left, top, right: left + tileWidth, bottom: top + tileHeight };
  });
}

function checkRun(
  fn: string,
  slots: readonly Rect[],
  tileCount: number,
  first: number,
  count: number,
): void {
  if (
    !isInt(tileCount) ||
    !isInt(first) ||
    !isInt(count) ||
    first < 0 ||
    count < 1 ||
    first + count > tileCount ||
    tileCount > slots.length
  ) {
    throw new Error(
      `AD-12 ${fn} with an inconsistent run (first ${first}, count ${count}, tileCount ${tileCount}, ${slots.length} slots)`,
    );
  }
}

/**
 * F3, build-notes CAP-5: the insertion gap rects of the movable run [first, first + count) in tray
 * positions, from the resting slot rects. Index i ∈ 0…count (the gap in M or `placementOrder`) is
 * the boundary between tray positions p − 1 and p, p = first + i: one 4 px × tileHeight rect when
 * both share a row, else the end of p − 1's row then the start of p's row; a missing side yields the
 * other only. Ascending by index.
 */
export function gapRects(
  slots: readonly Rect[],
  perRow: number,
  tileCount: number,
  first: number,
  count: number,
): GapRect[] {
  checkRun('gapRects', slots, tileCount, first, count);
  if (!isInt(perRow) || perRow < 1) throw new Error(`AD-12 gapRects with perRow ${perRow}`);
  const out: GapRect[] = [];
  for (let index = 0; index <= count; index++) {
    const p = first + index;
    const prev = p - 1 >= 0 ? (slots[p - 1] as Rect) : null;
    const next = p < tileCount ? (slots[p] as Rect) : null;
    const after: Rect | null = prev && {
      left: prev.right,
      top: prev.top,
      right: prev.right + GAP,
      bottom: prev.bottom,
    };
    const before: Rect | null = next && {
      left: next.left - GAP,
      top: next.top,
      right: next.left,
      bottom: next.bottom,
    };
    if (after && before && Math.floor((p - 1) / perRow) === Math.floor(p / perRow)) {
      out.push({ index, rect: after });
      continue;
    }
    if (after) out.push({ index, rect: after });
    if (before) out.push({ index, rect: before });
  }
  return out;
}

export type Parted = { readonly slot: number; readonly dx: number; readonly dy: number };

/**
 * Build-notes CAP-5, CAP-6: per tray position its parted slot and offset (parted slot rect − own
 * slot rect, left/top). `gap` and `from` are run indices. Reorder (`from` = j): a drag right moves
 * run tiles j+1…gap−1 one slot back, a drag left run tiles gap…j−1 one slot forward; the origin
 * keeps its slot (and can share it with a neighbour's parted slot). Free-letter (`from` omitted):
 * every position from first + gap on, mirrors after the run included, one slot forward.
 */
export function partingOffsets(
  slots: readonly Rect[],
  tileCount: number,
  first: number,
  count: number,
  gap: number,
  from?: number,
): Parted[] {
  checkRun('partingOffsets', slots, tileCount, first, count);
  if (!isInt(gap) || gap < 0 || gap > count) {
    throw new Error(`AD-12 partingOffsets with gap ${gap} outside 0…${count}`);
  }
  if (from !== undefined && (!isInt(from) || from < 0 || from >= count)) {
    throw new Error(`AD-12 partingOffsets with from ${from} outside 0…${count - 1}`);
  }
  if (from === undefined && tileCount + 1 > slots.length) {
    throw new Error(
      `AD-12 partingOffsets free-letter without room (${tileCount} tiles, ${slots.length} slots)`,
    );
  }
  const target = (p: number): number => {
    const i = p - first;
    if (from === undefined) return i >= gap ? p + 1 : p;
    if (gap > from + 1 && i > from && i < gap) return p - 1;
    if (gap < from && i >= gap && i < from) return p + 1;
    return p;
  };
  return Array.from({ length: tileCount }, (_, p) => {
    const slot = target(p);
    const own = slots[p] as Rect;
    const parted = slots[slot] as Rect;
    return { slot, dx: parted.left - own.left, dy: parted.top - own.top };
  });
}

/**
 * The D-block row segment ends of `TileRows.svelte` (a segment starts at the block's first tile or
 * a row start, and ends likewise). The free-letter drag (controller.ts, epic 5 SPEC CAP-6) builds
 * `mirrorBySlot` by mapping each mirror's free-letter `partingOffsets` slot (a mapping, not a
 * re-derivation) for its parted segment classes; in reorder mode the origin's slot can equal a
 * neighbour's parted slot, so only free-letter results (or rest) feed it.
 */
export function segmentEnds(
  slot: number,
  perRow: number,
  mirrorBySlot: readonly boolean[],
): { start: boolean; end: boolean } {
  return {
    start: slot % perRow === 0 || mirrorBySlot[slot - 1] !== true,
    end: (slot + 1) % perRow === 0 || mirrorBySlot[slot + 1] !== true,
  };
}
