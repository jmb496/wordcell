// Epic 8 ticket 1: the scene stage geometry in px, shared by the scripts and the player component
// (the component sets the matching Card CSS variables from these). Epic 8 ticket 6: the stage draws
// the whole play area (eight columns, the foot row, the tray, WordCells 3 to 10; BAND_ORDER) at the
// scene base slot SLOT; the component scales it by the fitted card width (`sceneFit`, AD-11).
import { SCENE_BASE, type SceneStageInputs } from '../layout/geometry';
import { trayLayout } from '../layout/tray';

export const CARD_W = 40;
export const SLOT = SCENE_BASE.slot;
export const STRIP = SCENE_BASE.strip;
export const CARD_H = SCENE_BASE.cardH;
/** The gap between a card's slot edge and its face (tile and column Card alike). */
export const FACE_MARGIN = 2;
const COLUMN_PITCH = SLOT;
const COLUMN_X0 = 0;
export const COLUMNS = 8;
/** Every column shows at least this many cards (scripted cards under filler at the far end). */
export const MIN_COLUMN_CARDS = 5;
export const TRAY_ROWS = 2;
/** The transform that lifts a stack's top card `lifted` strips up, over the cards below it (ticket 9). */
export const liftedBy = (lifted: number): string => `translateY(${-lifted * STRIP}px)`;
const stack = (n: number): number => (n - 1) * STRIP + CARD_H;
const FOOT_H = SCENE_BASE.foot;
export const TRAY_H = SCENE_BASE.trayFirstRow + (TRAY_ROWS - 1) * SCENE_BASE.trayExtraRow;
export const STAGE_W = 8 * SLOT;

/**
 * The vertical layout of one scene's stage, a pure function of that scene's own inputs (its tallest
 * column and tallest WordCell stack, `sceneStageInputs`): the stage is only as tall as the scene
 * needs (owner decision 2026-10-17), so shorter scenes are shorter. `stageH` equals
 * `sceneBaseHeight(inputs)` (AD-11).
 */
export function stageGeometry(inputs: Pick<SceneStageInputs, 'columnCards' | 'cellCards'>) {
  const columnAreaH = stack(inputs.columnCards);
  /** The foot row below the columns. */
  const trayTop = columnAreaH + FOOT_H + SCENE_BASE.gap;
  /** The labels row and the WordCells under the tray (BAND_ORDER: labels with wordcells). */
  const labelsTop = trayTop + TRAY_H + SCENE_BASE.gap;
  const cellsTop = labelsTop + SCENE_BASE.labels;
  const stageH = cellsTop + stack(inputs.cellCards);
  return {
    columnAreaH,
    trayTop,
    labelsTop,
    cellsTop,
    stageH,
    /** The place layers cover the tray and the WordCell band (y from `trayTop`). */
    placeH: stageH - trayTop,
    /** The scoring scene's figures sit in the tray row above their WordCell, its total mid-tray. */
    scoreFigureTop: trayTop + 8,
    scoreTotalBox: { x: (STAGE_W - 100) / 2, w: 100, y: trayTop + 66, h: 30 },
  };
}
export type StageGeometry = ReturnType<typeof stageGeometry>;

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
// layer's top, TRAY_TOP): the placement strip, Confirm, and the cells. Owner decision D9
// (2026-10-22): its tray and strip tiles are the game's card-mode tiles for the scene's card
// (DESIGN.md Tile; layout/tray.ts `trayLayout`, the game's one sizing rule), so the game's
// bottom/top marks fit their face as they do in the game.
export const PLACE_TILES = trayLayout(1, CARD_W, STAGE_W - 2 * RICH_INSET);
/** The place scene's tile pitch: the tile face plus the 4 px gap. */
export const PLACE_SLOT = PLACE_TILES.tileWidth + 4;
/** WordCell n (3 to 10): its card's top inside the place layer, and its number's top. */
export const PLACE_LABEL_TOP = TRAY_H + SCENE_BASE.gap;
export const PLACE_CELL_TOP = PLACE_LABEL_TOP + SCENE_BASE.labels;
/** The placement strip's tile row: top inside the layer, and tile i's left. */
export const STRIP_TOP = 4;
export const stripTileX = (i: number): number => RICH_INSET + i * PLACE_SLOT;
/** Confirm: left, width, top and height inside the layer (the tray's second row). */
export const CONFIRM_BOX = { x: 78, w: 96, y: 64, h: 30 } as const;

/** DESIGN.md: no text under 11 px. */
export const TEXT_FLOOR = 11;
/**
 * Owner decision D12 (2026-10-22): the stage is drawn at the base slot and scaled by `scale`, so its
 * text is counter-scaled by this factor (`--wc-scene-up`): an `authored` px size renders at
 * max(authored × scale, TEXT_FLOOR), never under the floor, and is unchanged when scale >= 1.
 */
export const sceneTextUp = (scale: number): number => Math.max(1, 1 / scale);
