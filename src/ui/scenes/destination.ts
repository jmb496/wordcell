import fixture from '../../../fixtures/how-to-play-destination.json';
import { text } from '../text';
import { COLUMN_AREA_H, RICH_SLOT, STAGE_W } from './geometry';
import { defineScene } from './script';
import { carryGeometry, trayTargets } from './tray-scene';
import type { Scene, SceneFixtureData } from './types';

// Epic 8 ticket 2 (HP-3c; docs/game-flow-spec.md R-30 to R-32, R-38): on a mini board (source tail
// P E, destination column S T A) the drop shows A locked (APE), + twice adds T and S (TAPE, STAPE;
// Validate stays lit, R-38), Flip moves the block right, reversed (PEATS). Frame i = state after
// i fixture commands (frame 0 and the drop's frame 1 .. 4), Validate lit from the first command.
const data: SceneFixtureData = fixture;
const carry = { sourceColumn: 1, count: 2, destinationColumn: 2, destinationCount: 1 } as const;
const g = carryGeometry(data, carry);

const opened = { tail: 'gone', tray: true, validate: 'lit' } as const;

export const destinationScene: Scene = defineScene({
  id: 'destination',
  fixture: data,
  caption: text.howTo.scenes.destination,
  carry,
  targets: {
    rest: { x: STAGE_W - 24, y: COLUMN_AREA_H - 24 },
    grab: g.grab,
    over: g.over,
    tray: g.trayTail,
    plus: trayTargets.plus,
    flip: trayTargets.flip,
  },
  elements: [
    'stage',
    'tail',
    'tail-0',
    'tail-1',
    'dest',
    'ghost',
    'tray-1',
    'tray-2',
    'tray-3',
    'tray-4',
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
      reveal: { show: 'tray-1', hide: ['tail', 'dest'], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'plus',
      kind: 'flyToCell',
      times: 2,
      command: 1,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-2', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'plus',
      kind: 'flyToCell',
      times: 1,
      command: 2,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-3', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'flip',
      kind: 'flyToCell',
      times: 2,
      command: 3,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-4', hide: [], kind: 'overlay' },
    },
  ],
  rest: { kind: 'flyToCell', times: 6 },
  frames: [
    { tail: 'home', tray: false, validate: 'off' },
    { ...opened, order: ['A', 'P', 'E'], k: 1, side: 'left' },
    { ...opened, order: ['T', 'A', 'P', 'E'], k: 2, side: 'left' },
    { ...opened, order: ['S', 'T', 'A', 'P', 'E'], k: 3, side: 'left' },
    { ...opened, order: ['P', 'E', 'A', 'T', 'S'], k: 3, side: 'right' },
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
