import {
  CARD_H,
  CELLS_TOP,
  CONTROL_BOX,
  CONTROLS_H,
  CONTROLS_TOP,
  columnRowY,
  columnX,
  placeCellX,
  RICH_INSET,
  RICH_SLOT,
  SLOT,
  STRIP,
  TRAY_TOP,
} from './geometry';
import type { Point, SceneFixtureData } from './types';

// Epic 8 ticket 2: the geometry the move-compose and free-letter scripts share, drawn from the
// fixture start and the script's `carry`: the tail's home and landing, the D cards,
// the tray rest points (tile row of the rich tray) and the pointer targets on its controls.
interface Carry {
  readonly sourceColumn: number;
  readonly count: number;
  readonly destinationColumn: number;
  readonly destinationCount: number;
}

export function carryGeometry(data: SceneFixtureData, carry: Carry) {
  const sourceLength = data.start.columns[carry.sourceColumn - 1].length;
  const home = {
    x: columnX(carry.sourceColumn),
    y: columnRowY(sourceLength, sourceLength - carry.count),
  };
  // A drop on the source column (R-21): the tail lands back at its home and the D cards are the
  // bottom ones of what the lift left behind.
  const same = carry.sourceColumn === carry.destinationColumn;
  const destLength = data.start.columns[carry.destinationColumn - 1].length;
  const landing = same
    ? home
    : { x: columnX(carry.destinationColumn), y: columnRowY(destLength, destLength) };
  const offset = { x: landing.x - home.x, y: landing.y - home.y };
  const destHome = {
    x: landing.x,
    y: columnRowY(
      destLength,
      same
        ? destLength - carry.count - carry.destinationCount
        : destLength - carry.destinationCount,
    ),
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
  cell6: { x: placeCellX(6) + SLOT / 2, y: CELLS_TOP + CARD_H / 2 },
  tiles: { x: RICH_INSET + RICH_SLOT * 3, y: TRAY_TOP + 4 + CARD_H / 2 },
} as const;
