import fixture from '../../../fixtures/how-to-play-move-compose.json';
import { text } from '../text';
import { RICH_SLOT, STAGE_W, stageGeometry } from './geometry';
import { defineScene } from './script';
import { sceneStageInputs } from './stage';
import { carryGeometry, trayTargets } from './tray-scene';
import type { Frame, Scene, SceneFixtureData } from './types';

// Epic 8 ticket 7 (scene 1; docs/game-flow-spec.md R-10, R-13, R-20, R-23, R-30 to R-32, R-38):
// lift K B A from column 1, drop them on column 3 (E is the locked block), + twice (k 2, k 3: a
// non-word draft), − back to k 2, Flip (the block reads right, reversed), then the cards are
// rearranged in the tray with an animated reorder (the pointer does not drag every card), ending
// on BAKED. Frame i is the state after step i's visible change; the fixture commands applied are
// 0, 0, 1, 2, 3, 4, 5, 6, so Validate is lit exactly where the fixture's `validatable` is true.
const data: SceneFixtureData = fixture;
/** The column move. `destinationCount` is the k the drop opens with (R-31, default 1). */
export const moveComposeCarry = {
  sourceColumn: 1,
  count: 3,
  destinationColumn: 3,
  destinationCount: 1,
} as const;
const opened = { tail: 'gone', tray: true, validate: 'lit', cell6: 'top' } as const;
/** The last frame (BAKED, k 2, side right): scene 2 opens on it (ticket 7 continuity). */
export const moveComposeFinalFrame: Frame = {
  ...opened,
  order: ['B', 'A', 'K', 'E', 'D'],
  k: 2,
  side: 'right',
};

const frames: readonly Frame[] = [
  { tail: 'home', tray: false, validate: 'off', cell6: 'top' },
  { tail: 'lifted', tray: false, validate: 'off', cell6: 'top' },
  { ...opened, order: ['E', 'K', 'B', 'A'], k: 1, side: 'left' },
  { ...opened, order: ['D', 'E', 'K', 'B', 'A'], k: 2, side: 'left' },
  { ...opened, order: ['N', 'D', 'E', 'K', 'B', 'A'], k: 3, side: 'left' },
  { ...opened, order: ['D', 'E', 'K', 'B', 'A'], k: 2, side: 'left' },
  { ...opened, order: ['K', 'B', 'A', 'E', 'D'], k: 2, side: 'right' },
  moveComposeFinalFrame,
];
const stage = sceneStageInputs(data, moveComposeCarry, frames);
const geo = stageGeometry(stage);
const g = carryGeometry(data, moveComposeCarry, geo);
const tray = trayTargets(geo);

export const moveComposeScene: Scene = defineScene({
  id: 'move-compose',
  fixture: data,
  stage,
  caption: text.howTo.scenes.moveCompose,
  carry: moveComposeCarry,
  targets: {
    rest: { x: STAGE_W - 24, y: geo.columnAreaH - 24 },
    grab: g.grab,
    over: g.over,
    tray: g.trayTail,
    minus: tray.minus,
    plus: tray.plus,
    flip: tray.flip,
  },
  elements: [
    'stage',
    'tail',
    'tail-0',
    'tail-1',
    'tail-2',
    'dest',
    'ghost',
    ...[2, 3, 4, 5, 6, 7].map((i) => `tray-${i}`),
    ...[0, 1, 2, 3, 4].map((j) => `tray-7-tile-${j}`),
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
      type: 'tap',
      target: 'plus',
      kind: 'flyToCell',
      times: 2,
      command: 1,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-3', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'plus',
      kind: 'flyToCell',
      times: 1,
      command: 2,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-4', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'minus',
      kind: 'flyToCell',
      times: 2,
      command: 3,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-5', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'flip',
      kind: 'flyToCell',
      times: 2,
      command: 4,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-6', hide: [], kind: 'overlay' },
    },
    {
      type: 'arrange',
      target: 'flip',
      kind: 'snap',
      times: 3,
      command: 5,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-7', hide: [], kind: 'overlay' },
    },
  ],
  rest: { kind: 'flyToCell', times: 6 },
  frames,
  offset: g.offset,
  layout: {
    tailHome: g.home,
    destHome: g.destHome,
    trayTail: g.trayTail,
    trayDest: g.trayDest,
    traySlot: RICH_SLOT,
  },
});
