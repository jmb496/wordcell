import {
  CARD_H,
  CONTROL_BOX,
  CONTROLS_H,
  CONTROLS_TOP,
  columnRowY,
  columnX,
  HAND_H,
  HAND_TIP,
  placeCellX,
  RICH_INSET,
  RICH_SLOT,
  SLOT,
  STRIP,
  type StageGeometry,
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

export function carryGeometry(data: SceneFixtureData, carry: Carry, geo: StageGeometry) {
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
  const trayDest = { x: RICH_INSET, y: geo.trayTop + 4 };
  const trayTail = { x: trayDest.x + carry.destinationCount * RICH_SLOT, y: trayDest.y };
  const grab = { x: home.x + SLOT / 2, y: home.y + STRIP / 2 };
  return { home, offset, destHome, trayDest, trayTail, grab, over: add(grab, offset) };
}

const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });

/**
 * Pointer targets: the tray controls and WordCell 6, tapped just high enough on its card that the
 * whole hand stays on the stage (owner decision D8).
 */
export const trayTargets = (geo: StageGeometry) => {
  const centre = (box: { x: number; w: number }): Point => ({
    x: box.x + box.w / 2,
    y: geo.trayTop + CONTROLS_TOP + CONTROLS_H / 2,
  });
  return {
    minus: centre(CONTROL_BOX.minus),
    plus: centre(CONTROL_BOX.plus),
    flip: centre(CONTROL_BOX.flip),
    validate: centre(CONTROL_BOX.validate),
    cell6: { x: placeCellX(6) + SLOT / 2, y: geo.cellsTop + CARD_H - (HAND_H - HAND_TIP.y) },
  } as const;
};
