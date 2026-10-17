import fixture from '../../../fixtures/how-to-play-destination-rule.json';
import { text } from '../text';
import { COLUMN_AREA_H, RICH_SLOT, STAGE_W } from './geometry';
import { defineScene } from './script';
import { carryGeometry, cellTarget, undoTarget } from './tray-scene';
import type { Carry, Scene, SceneFixtureData } from './types';

// Epic 8 ticket 4 (HP-4b; R-13, R-22, R-31, Q-12, Q-27): two halves in sequence on one figure, both
// giving BAT. Half 1 drops A T on column 2 (R B): its bottom card B must join (locked, k 1 left);
// Undo resets the board. Half 2 drops B alone on the empty column 3: nothing has to join (k 0), and
// the free letters A (WordCell 3) and T (WordCell 4) complete BAT. Half 2 lifts the scene's D block
// (the same B card). Frames are by command state (`n` = commands applied: 0, 0, 1, 2, 2, 3, 4, 5);
// the resting frame is half 2 (owner confirms at the plan checkpoint).
const data: SceneFixtureData = fixture;
const carry = { sourceColumn: 1, count: 2, destinationColumn: 2, destinationCount: 1 } as const;
const carry2: Carry = {
  sourceColumn: 2,
  count: 1,
  destinationColumn: 3,
  destinationCount: 0,
  lifts: 'dest',
};
const g = carryGeometry(data, carry);
const g2 = carryGeometry(data, carry2);
const cells = data.start.cells ?? {};
const cell3 = cellTarget(3, cells['3']?.length ?? 0);
const cell4 = cellTarget(4, cells['4']?.length ?? 0);

const open1 = { tail: 'gone', dest: 'gone', tray: true } as const;

export const destinationRuleScene: Scene = defineScene({
  id: 'destination-rule',
  fixture: data,
  caption: text.howTo.scenes.destinationRule,
  carry,
  targets: {
    rest: { x: STAGE_W - 24, y: COLUMN_AREA_H - 24 },
    grab: g.grab,
    over: g.over,
    undo: undoTarget,
    grab2: g2.grab,
    over2: g2.over,
    cell3,
    cell4,
  },
  elements: [
    'stage',
    'tail',
    'tail-0',
    'tail-1',
    'dest',
    'ghost',
    'tray-2',
    'tray-5',
    'tray-6',
    'tray-7',
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
      target: 'over',
      kind: 'flyToCell',
      times: 2,
      reveal: { show: 'tray-2', hide: ['tail', 'dest'], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'undo',
      kind: 'flyToCell',
      times: 2,
      command: 1,
      wait: { kind: 'flyToCell', times: 3 },
      reveal: { hide: ['tray-2'], kind: 'overlay' },
    },
    {
      type: 'grab',
      target: 'grab2',
      kind: 'flyToCell',
      times: 2,
      command: 2,
      carry: carry2,
      wait: { kind: 'flyToCell', times: 1 },
    },
    { type: 'move', target: 'over2', kind: 'flyToCell', times: 2 },
    { type: 'drop', target: 'over2', kind: 'flyToCell', command: 2, carry: carry2 },
    {
      type: 'fly',
      target: 'over2',
      kind: 'flyToCell',
      times: 2,
      reveal: { show: 'tray-5', hide: ['dest'], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'cell3',
      kind: 'flyToCell',
      times: 2,
      command: 3,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-6', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'cell4',
      kind: 'flyToCell',
      times: 2,
      command: 4,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-7', hide: [], kind: 'overlay' },
    },
  ],
  rest: { kind: 'flyToCell', times: 6 },
  frames: [
    { tail: 'home', tray: false, validate: 'off' },
    { tail: 'lifted', tray: false, validate: 'off' },
    { ...open1, order: ['B', 'A', 'T'], k: 1, side: 'left', validate: 'lit' },
    { tail: 'home', tray: false, validate: 'off' },
    { tail: 'home', dest: 'lifted', tray: false, validate: 'off' },
    { ...open1, tail: 'home', order: ['B'], k: 0, side: 'left', validate: 'off' },
    { ...open1, tail: 'home', order: ['B', 'A'], k: 0, side: 'left', validate: 'off', used: [3] },
    {
      ...open1,
      tail: 'home',
      order: ['B', 'A', 'T'],
      k: 0,
      side: 'left',
      validate: 'lit',
      used: [3, 4],
    },
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
