// Static tray (F2, build-notes CAP-2): tile sizing and tile order after DESIGN.md Tray band and
// Tile. Pure: no DOM, `window` or Svelte. Epic 5 reuses both helpers.
import type { CardId, DestinationSide } from '../../engine/index';
import { cardMetrics } from './geometry';

export type TrayLayout = {
  mode: 'card' | 'compact';
  /** Tile rows; 0 for no tiles, 1 in card mode, uncapped in compact mode. */
  rows: number;
  perRow: number;
  tileWidth: number;
  /** The reserved tile-area height, max(H, 92). */
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
  const area = Math.max(cardMetrics(w).H, COMPACT_AREA);
  if (tileCount <= perRow) {
    return { mode: 'card', rows: tileCount === 0 ? 0 : 1, perRow, tileWidth, area };
  }
  return { mode: 'compact', rows: Math.ceil(tileCount / perRow), perRow, tileWidth, area };
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
