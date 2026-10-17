// Epic 8 ticket 1: the scene stage geometry in px, shared by the scripts and the player component
// (the component sets the matching Card CSS variables from these). Epic 8 ticket 6: the stage draws
// the whole play area (eight columns, the foot row, the tray, WordCells 3 to 10; BAND_ORDER) at the
// scene base slot SLOT; the component scales it by the fitted card width (`sceneFit`, AD-11).
import { SCENE_BASE, type SceneStageInputs, sceneBaseHeight } from '../layout/geometry';

export const CARD_W = 40;
export const SLOT = SCENE_BASE.slot;
export const STRIP = SCENE_BASE.strip;
export const CARD_H = SCENE_BASE.cardH;
export const COLUMN_PITCH = SLOT;
export const COLUMN_X0 = 0;
export const COLUMNS = 8;
/** Every column shows at least this many cards (scripted cards under filler at the far end). */
export const MIN_COLUMN_CARDS = 5;
/** The tallest column over any scene (filler, scripted cards and a landed tail); pinned by a test. */
export const MAX_COLUMN_CARDS = 9;
/** The tallest WordCell stack over any scene (the place scene's DBALKE). */
export const MAX_CELL_CARDS = 6;
export const TRAY_ROWS = 2;
export const STAGE_INPUTS: SceneStageInputs = {
  columnCards: MAX_COLUMN_CARDS,
  trayRows: TRAY_ROWS,
  cellCards: MAX_CELL_CARDS,
};
const stack = (n: number): number => (n - 1) * STRIP + CARD_H;
export const COLUMN_AREA_H = stack(MAX_COLUMN_CARDS);
/** The foot row below the columns holds the Undo pill. */
export const FOOT_H = SCENE_BASE.foot;
export const TRAY_TOP = COLUMN_AREA_H + FOOT_H + SCENE_BASE.gap;
export const TRAY_H = SCENE_BASE.trayFirstRow + (TRAY_ROWS - 1) * SCENE_BASE.trayExtraRow;
export const STAGE_W = 8 * SLOT;
/** The labels row and the WordCells under the tray (BAND_ORDER: labels with wordcells). */
export const LABELS_TOP = TRAY_TOP + TRAY_H + SCENE_BASE.gap;
export const CELLS_TOP = LABELS_TOP + SCENE_BASE.labels;
export const STAGE_H = CELLS_TOP + stack(MAX_CELL_CARDS);
export const BASE_HEIGHT = sceneBaseHeight(STAGE_INPUTS);
/** The tail lifts this far while carried (DESIGN.md Card lift). */
export const LIFT = 8;
/** The pointer hand's box and its fingertip inside it (the point the hand targets). */
export const HAND_W = 28;
export const HAND_H = 32;
export const HAND_TIP = { x: 9, y: 1 } as const;

export const columnX = (column: number): number => COLUMN_X0 + (column - 1) * COLUMN_PITCH;

/** Filler cards a column of `length` scripted cards gets on its far (top) end (ticket 6). */
export const fillerCount = (length: number): number => Math.max(0, MIN_COLUMN_CARDS - length);
/** The top of card `index` (0 = far end) of a column that starts with `length` scripted cards. */
export const columnRowY = (length: number, index: number): number =>
  (fillerCount(length) + index) * STRIP;

// Epic 8 ticket 2: the open tray of the move-compose and free-letter scenes holds a tile row and a
// controls row (−, +, Flip, Validate), so its tiles use a 40 px pitch (a block of up to six fits).
export const RICH_SLOT = 40;
export const RICH_TILE_W = 36;
export const RICH_INSET = 6;
/** The tray controls row: top inside the tray, height, and the x and width of each control. */
export const CONTROLS_TOP = 68;
export const CONTROLS_H = 30;
export const CONTROL_BOX = {
  minus: { x: 6, w: 36 },
  plus: { x: 46, w: 36 },
  flip: { x: 90, w: 64 },
  validate: { x: 162, w: 84 },
} as const;

// WordCell n (3 to 10) sits at the column pitch in the band under the tray, its number above it
// (BAND_ORDER: labels with wordcells); its stack grows downward, the top card last (ticket 6).
export const placeCellX = (cell: number): number => (cell - 3) * SLOT;

// Epic 8 ticket 3: the place scene's layers cover the tray and the WordCell band (y from the
// layer's top, TRAY_TOP): the placement strip, Confirm, and the cells. Cards in the strip use the
// rich pitch (RICH_SLOT) except the WordCells, which keep the full card.
export const PLACE_H = STAGE_H - TRAY_TOP;
/** WordCell n (3 to 10): its card's top inside the place layer, and its number's top. */
export const PLACE_CELL_TOP = CELLS_TOP - TRAY_TOP;
export const PLACE_LABEL_TOP = LABELS_TOP - TRAY_TOP;
/** The placement strip's tile row: top inside the layer, and tile i's left. */
export const STRIP_TOP = 4;
export const stripTileX = (i: number): number => RICH_INSET + i * RICH_SLOT;
/** Confirm: left, width, top and height inside the layer (the tray's second row). */
export const CONFIRM_BOX = { x: 78, w: 96, y: 64, h: 30 } as const;
/**
 * The scoring scene's figures sit in the tray row above their WordCell (stage coordinates), and
 * its total pill in the middle of the tray.
 */
export const SCORE_FIGURE_TOP = TRAY_TOP + 8;
export const SCORE_TOTAL_BOX = { x: (STAGE_W - 100) / 2, w: 100, y: TRAY_TOP + 66, h: 30 } as const;

// Epic 8 ticket 4: the Tricky rules scenes draw an Undo pill in the foot row at the right.
export const UNDO_BOX = { x: STAGE_W - 52, w: 48, y: COLUMN_AREA_H + 7, h: 30 } as const;
