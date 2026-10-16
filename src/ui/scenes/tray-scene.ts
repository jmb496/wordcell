import {
  CARD_H,
  CELL6,
  CONTROL_BOX,
  CONTROLS_H,
  CONTROLS_TOP,
  columnX,
  RICH_INSET,
  RICH_SLOT,
  SLOT,
  STRIP,
  TRAY_TOP,
} from './geometry';
import type { Point, SceneFixtureData } from './types';

// Epic 8 ticket 2: the geometry the compose and destination scripts share with drag.ts's scheme,
// drawn from the fixture start and the script's `carry`: the tail's home and landing, the D cards,
// the tray rest points (tile row of the rich tray) and the pointer targets on its controls.
interface Carry {
  readonly sourceColumn: number;
  readonly count: number;
  readonly destinationColumn: number;
  readonly destinationCount: number;
}

export function carryGeometry(data: SceneFixtureData, carry: Carry) {
  const home = {
    x: columnX(carry.sourceColumn),
    y: (data.start.columns[carry.sourceColumn - 1].length - carry.count) * STRIP,
  };
  const landing = {
    x: columnX(carry.destinationColumn),
    y: data.start.columns[carry.destinationColumn - 1].length * STRIP,
  };
  const offset = { x: landing.x - home.x, y: landing.y - home.y };
  const destHome = {
    x: landing.x,
    y: (data.start.columns[carry.destinationColumn - 1].length - carry.destinationCount) * STRIP,
  };
  const trayDest = { x: RICH_INSET, y: TRAY_TOP + 4 };
  const trayTail = { x: trayDest.x + carry.destinationCount * RICH_SLOT, y: trayDest.y };
  const grab = { x: home.x + SLOT / 2, y: home.y + STRIP / 2 };
  return { home, offset, destHome, trayDest, trayTail, grab, over: add(grab, offset) };
}

const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });

const controlCentre = (box: { x: number; w: number }): Point => ({
  x: box.x + box.w / 2,
  y: TRAY_TOP + CONTROLS_TOP + CONTROLS_H / 2,
});

/** Pointer targets: the tray controls, WordCell 6, and the middle of the tile row. */
export const trayTargets = {
  minus: controlCentre(CONTROL_BOX.minus),
  plus: controlCentre(CONTROL_BOX.plus),
  flip: controlCentre(CONTROL_BOX.flip),
  validate: controlCentre(CONTROL_BOX.validate),
  cell6: { x: CELL6.x + SLOT / 2, y: CELL6.y + CARD_H / 2 },
  tiles: { x: RICH_INSET + RICH_SLOT * 3, y: TRAY_TOP + 4 + CARD_H / 2 },
} as const;
