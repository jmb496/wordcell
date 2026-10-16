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
