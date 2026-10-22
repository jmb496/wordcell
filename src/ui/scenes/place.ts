import fixture from '../../../fixtures/how-to-play-place.json' with { type: 'json' };
import { text } from '../text';
import {
  CARD_H,
  CONFIRM_BOX,
  HAND_H,
  HAND_TIP,
  PLACE_CELL_TOP,
  PLACE_SLOT,
  placeCellX,
  STAGE_W,
  STRIP_TOP,
  stageGeometry,
  stripTileX,
} from './geometry';
import { defineScene } from './script';
import { sceneStageInputs } from './stage';
import type { Frame, Scene, SceneFixtureData } from './types';

// Epic 8 ticket 3 (HP-3d; docs/game-flow-spec.md §8, R-40, R-42, R-50 to R-52, R-60): after the
// compose scene's word, tap Validate (cells 3 to 6 light, 6 pre-selected, R-42), tap WordCell 5 then
// 6, drag D to the front (order D B A L K E, R-51), Confirm, and the cards fly to cell 6. Commands
// 0 to 2 are set-up (the fixture's drop, arrange and free letter); frame i = the state after
// fixture command 3 + i, Confirm and the fly share the final frame. Owner decision D5 (2026-10-22):
// frame 0 is the composed word as the tray shows it (B A L K E D, the D block B locked) and
// WordCell 6, whose top card L is in the word (R-33), is drawn used from frame 0 until Confirm.
const data: SceneFixtureData = fixture;
const carry = {
  sourceColumn: 1,
  count: 4,
  destinationColumn: 3,
  destinationCount: 1,
  landed: true,
} as const;

const lit = [3, 4, 5, 6] as const;
const dflt = ['B', 'A', 'L', 'K', 'E', 'D'];
const ordered = ['D', 'B', 'A', 'L', 'K', 'E'];
const placing = (placeTarget: number, placeOrder: readonly string[]): Frame => ({
  tail: 'gone',
  tray: false,
  validate: 'off',
  lit,
  placeTarget,
  placeOrder,
  cell6: 'used',
});
const frames: readonly Frame[] = [
  {
    tail: 'gone',
    tray: true,
    validate: 'lit',
    order: dflt,
    k: 1,
    side: 'left',
    cell6: 'used',
  },
  { ...placing(6, dflt), validate: 'pressed' },
  placing(5, dflt),
  placing(6, dflt),
  placing(6, ordered),
  { tail: 'gone', tray: false, validate: 'off', lit: [], cellTop: true, cell6: 'top' },
];
const stage = sceneStageInputs(data, carry, frames);
const geo = stageGeometry(stage);

// A WordCell is tapped just high enough on its card that the whole hand stays on the stage (D8).
const cellPoint = (cell: number) => ({
  x: placeCellX(cell) + 20,
  y: geo.trayTop + PLACE_CELL_TOP + CARD_H - (HAND_H - HAND_TIP.y),
});
const tilePoint = (i: number) => ({
  x: stripTileX(i) + PLACE_SLOT / 2,
  y: geo.trayTop + STRIP_TOP + CARD_H / 2,
});
const confirmPoint = {
  x: CONFIRM_BOX.x + CONFIRM_BOX.w / 2,
  y: geo.trayTop + CONFIRM_BOX.y + CONFIRM_BOX.h / 2,
};

export const placeScene: Scene = defineScene({
  id: 'place',
  fixture: data,
  stage,
  caption: text.howTo.scenes.place,
  carry,
  targets: {
    rest: { x: STAGE_W - 24, y: geo.columnAreaH - 24 },
    validate: confirmPoint,
    cell5: cellPoint(5),
    cell6: cellPoint(6),
    dtile: tilePoint(5),
    front: tilePoint(0),
    confirm: confirmPoint,
  },
  elements: [
    'stage',
    'ghost',
    'place-0',
    'place-1',
    'place-2',
    'place-3',
    'place-4',
    'place-5',
    'strip-4',
    'confirm',
    'tuck',
    'tuck-0',
    'tuck-1',
    'tuck-2',
    'tuck-3',
    'tuck-4',
    'tuck-5',
  ],
  steps: [
    {
      type: 'tap',
      target: 'validate',
      kind: 'flyToCell',
      times: 2,
      command: 3,
      wait: { kind: 'flyToCell', times: 2 },
      reveal: { show: 'place-1', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'cell5',
      kind: 'flyToCell',
      times: 2,
      command: 4,
      wait: { kind: 'flyToCell', times: 2 },
      reveal: { show: 'place-2', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'cell6',
      kind: 'flyToCell',
      times: 1,
      command: 5,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'place-3', hide: [], kind: 'overlay' },
    },
    {
      type: 'move',
      target: 'dtile',
      kind: 'flyToCell',
      times: 2,
      wait: { kind: 'flyToCell', times: 1 },
    },
    {
      type: 'move',
      target: 'front',
      kind: 'flyToCell',
      times: 2,
      command: 6,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'place-4', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'confirm',
      kind: 'flyToCell',
      times: 2,
      command: 7,
      wait: { kind: 'flyToCell', times: 1 },
    },
    {
      type: 'fly',
      target: 'confirm',
      kind: 'flyToCell',
      times: 2,
      tucks: { cell: 6, letters: ordered },
    },
  ],
  rest: { kind: 'flyToCell', times: 6 },
  frames,
});
