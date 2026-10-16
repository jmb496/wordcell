import fixture from '../../../fixtures/how-to-play-compose.json';
import { text } from '../text';
import { COLUMN_AREA_H, RICH_SLOT, STAGE_W } from './geometry';
import { defineScene } from './script';
import { carryGeometry, trayTargets } from './tray-scene';
import type { Scene, SceneFixtureData } from './types';

// Epic 8 ticket 2 (HP-3b; docs/game-flow-spec.md §8, R-23, R-30, R-33, R-34, R-38): drop E D K A
// on column 3 (B is the locked block), arrange A K E D (BAKED), borrow WordCell 6's L (BALKED),
// tap Validate. Frame i is the state after step i's visible change; `n` of the ticket is the
// number of fixture commands applied (0, 0, 1, 2, 3, 4), so Validate is lit exactly where the
// fixture's `validatable` is true, and `pressed` on the tap (the engine then leaves Composing).
const data: SceneFixtureData = fixture;
const carry = { sourceColumn: 1, count: 4, destinationColumn: 3, destinationCount: 1 } as const;
const g = carryGeometry(data, carry);

const baked = ['B', 'A', 'K', 'E', 'D'];
const balked = ['B', 'A', 'L', 'K', 'E', 'D'];
const opened = { tail: 'gone', tray: true, k: 1, side: 'left' } as const;

export const composeScene: Scene = defineScene({
  id: 'compose',
  fixture: data,
  caption: text.howTo.scenes.compose,
  carry,
  targets: {
    rest: { x: STAGE_W - 24, y: COLUMN_AREA_H - 24 },
    grab: g.grab,
    over: g.over,
    tray: g.trayTail,
    tiles: trayTargets.tiles,
    cell6: trayTargets.cell6,
    validate: trayTargets.validate,
  },
  elements: [
    'stage',
    'tail',
    'tail-0',
    'tail-1',
    'tail-2',
    'tail-3',
    'dest',
    'ghost',
    'tray-2',
    'tray-3',
    'tray-4',
    'tray-5',
  ],
  steps: [
    {
      type: 'grab',
      target: 'grab',
      kind: 'flyToCell',
      command: 0,
      wait: { kind: 'flyToCell', times: 2 },
    },
    { type: 'move', target: 'over', kind: 'flyToCell', times: 2 },
    { type: 'drop', target: 'over', kind: 'flyToCell', command: 0 },
    {
      type: 'fly',
      target: 'tray',
      kind: 'flyToCell',
      times: 2,
      reveal: { show: 'tray-2', hide: ['tail', 'dest'], kind: 'overlay' },
    },
    {
      type: 'move',
      target: 'tiles',
      kind: 'flyToCell',
      times: 2,
      command: 1,
      wait: { kind: 'flyToCell', times: 2 },
      reveal: { show: 'tray-3', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'cell6',
      kind: 'flyToCell',
      times: 2,
      command: 2,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-4', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'validate',
      kind: 'flyToCell',
      times: 2,
      command: 3,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-5', hide: [], kind: 'overlay' },
    },
  ],
  rest: { kind: 'flyToCell', times: 6 },
  frames: [
    { tail: 'home', tray: false, validate: 'off', cell6: 'top' },
    { tail: 'lifted', tray: false, validate: 'off', cell6: 'top' },
    { ...opened, order: ['B', 'E', 'D', 'K', 'A'], validate: 'lit', cell6: 'top' },
    { ...opened, order: baked, validate: 'lit', cell6: 'top' },
    { ...opened, order: balked, validate: 'lit', cell6: 'used' },
    { ...opened, order: balked, validate: 'pressed', cell6: 'used' },
  ],
  offset: g.offset,
  layout: {
    tailHome: g.home,
    destHome: g.destHome,
    trayTail: g.trayTail,
    trayDest: g.trayDest,
    traySlot: RICH_SLOT,
  },
});
