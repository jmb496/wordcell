import fixture from '../../../fixtures/how-to-play-place.json';
import { text } from '../text';
import {
  CARD_H,
  COLUMN_AREA_H,
  CONFIRM_BOX,
  PLACE_CELL_TOP,
  placeCellX,
  RICH_SLOT,
  STAGE_W,
  STRIP_TOP,
  stripTileX,
  TRAY_TOP,
} from './geometry';
import { defineScene } from './script';
import type { Frame, Scene, SceneFixtureData } from './types';

// Epic 8 ticket 3 (HP-3d; docs/game-flow-spec.md §8, R-40, R-42, R-50 to R-52, R-60): after the
// compose scene's word, tap Validate (cells 3 to 6 light, 6 pre-selected, R-42), tap WordCell 5 then
// 6, drag D to the front (order D B A L K E, R-51), Confirm, and the cards fly to cell 6. Commands
// 0 to 2 are set-up (the fixture's drop, arrange and free letter); frame i = the state after
// fixture command 3 + i, Confirm and the fly share the final frame.
const data: SceneFixtureData = fixture;
const carry = {
  sourceColumn: 1,
  count: 4,
  destinationColumn: 3,
  destinationCount: 1,
  landed: true,
} as const;

const cellPoint = (cell: number) => ({
  x: placeCellX(cell) + 20,
  y: TRAY_TOP + PLACE_CELL_TOP + CARD_H / 2,
});
const tilePoint = (i: number) => ({
  x: stripTileX(i) + RICH_SLOT / 2,
  y: TRAY_TOP + STRIP_TOP + CARD_H / 2,
});
const confirmPoint = {
  x: CONFIRM_BOX.x + CONFIRM_BOX.w / 2,
  y: TRAY_TOP + CONFIRM_BOX.y + CONFIRM_BOX.h / 2,
};

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
});

export const placeScene: Scene = defineScene({
  id: 'place',
  fixture: data,
  caption: text.howTo.scenes.place,
  carry,
  targets: {
    rest: { x: STAGE_W - 24, y: COLUMN_AREA_H - 24 },
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
      flies: {
        element: 'strip-4',
        by: {
          x: placeCellX(6) + 20 - (stripTileX(0) + (6 * RICH_SLOT) / 2),
          y: PLACE_CELL_TOP - STRIP_TOP,
        },
      },
      reveal: { show: 'place-5', hide: [], kind: 'overlay' },
    },
  ],
  rest: { kind: 'flyToCell', times: 6 },
  frames: [
    { tail: 'gone', tray: false, validate: 'lit' },
    { ...placing(6, dflt), validate: 'pressed' },
    placing(5, dflt),
    placing(6, dflt),
    placing(6, ordered),
    { tail: 'gone', tray: false, validate: 'off', lit: [] },
  ],
});
