// Epic 8 ticket 1: the scene stage geometry in px, shared by the scripts and the player component
// (the component sets the matching Card CSS variables from these).
export const CARD_W = 40;
export const SLOT = 44;
export const STRIP = 20;
export const CARD_H = 56;
export const COLUMN_PITCH = 52;
export const COLUMN_X0 = 48;
export const COLUMN_AREA_H = 200;
export const TRAY_TOP = 208;
export const TRAY_H = 60;
export const STAGE_W = 252;
export const STAGE_H = TRAY_TOP + TRAY_H;
/** The tail lifts this far while carried (DESIGN.md Card lift). */
export const LIFT = 8;
/** The pointer hand's box and its fingertip inside it (the point the hand targets). */
export const HAND_W = 28;
export const HAND_H = 32;
export const HAND_TIP = { x: 9, y: 1 } as const;

export const columnX = (column: number): number => COLUMN_X0 + (column - 1) * COLUMN_PITCH;

// Epic 8 ticket 2: the open tray of the compose and destination scenes holds a tile row and a
// controls row (−, +, Flip, Validate), so its tiles use a 40 px pitch (a block of up to six fits).
export const RICH_TRAY_H = 104;
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
/** WordCell 6's card on the stage (left of column 1). */
export const CELL6 = { x: 4, y: 4 } as const;

// Epic 8 ticket 3: the place scene's lower area (WordCells 3 to 6, the placement strip, Confirm;
// y from the area's top, TRAY_TOP) and the scoring scene's total row. Cards there use the rich
// pitch (RICH_SLOT) except the WordCells, which keep the full card.
export const PLACE_H = 188;
export const SCORE_H = 52;
/** WordCell n (3 to 6): its card's left and top inside the place area. */
export const PLACE_CELL_TOP = 8;
export const placeCellX = (cell: number): number => 30 + (cell - 3) * 56;
/** The placement strip's tile row: top inside the area, and tile i's left. */
export const STRIP_TOP = 92;
export const stripTileX = (i: number): number => RICH_INSET + i * RICH_SLOT;
/** Confirm: left, width, top and height inside the area. */
export const CONFIRM_BOX = { x: 78, w: 96, y: 154, h: 30 } as const;
/** The scoring scene's WordCell stacks: stack k (0 to 2) left and top on the stage. */
export const scoreStackX = (k: number): number => 24 + k * 72;
export const SCORE_STACK_TOP = 22;
/** The scoring scene's total pill (stage coordinates; the stage is TRAY_TOP + SCORE_H high). */
export const SCORE_TOTAL_BOX = { x: 76, w: 100, y: 214, h: 32 } as const;
