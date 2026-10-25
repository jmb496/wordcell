import fixture from '../../../fixtures/how-to-play-source-drop.json' with { type: 'json' };
import { text } from '../text';
import { RICH_SLOT, SLOT, STAGE_W, stageGeometry } from './geometry';
import { defineScene } from './script';
import { sceneStageInputs } from './stage';
import { carryGeometry } from './tray-scene';
import type { Frame, Scene, SceneFixtureData } from './types';

// Epic 8 ticket 4 (HP-4a; docs/game-flow-spec.md §8, R-21, R-13, R-14, Q-11, Q-34): lift E D K A
// from column 1 and drop it back on column 1; F is left behind and is the destination card that
// must join (k 1 left), then the cards are rearranged to A K E D for FAKED with the same tile glide
// as scene 1 (owner decision D3, 2026-10-22). A drag that never leaves the source column is a cancel
// (R-14, Q-34), so the pointer goes out and back before the drop; the drop lands at the tail's home
// (`offset` 0). Frames are by command state (`n` = commands applied: 0, 0, 1, 2), so the
// out-and-back `move` steps only animate; Validate follows the fixture `validatable` at `n`.
const data: SceneFixtureData = fixture;
const carry = { sourceColumn: 1, count: 4, destinationColumn: 1, destinationCount: 1 } as const;
const opened = {
  tail: 'gone',
  dest: 'gone',
  tray: true,
  k: 1,
  side: 'left',
  validate: 'lit',
} as const;

const frames: readonly Frame[] = [
  { tail: 'home', tray: false, validate: 'off' },
  { tail: 'lifted', tray: false, validate: 'off' },
  { ...opened, order: ['F', 'E', 'D', 'K', 'A'] },
  { ...opened, order: ['F', 'A', 'K', 'E', 'D'] },
];
const stage = sceneStageInputs(data, carry, frames);
const geo = stageGeometry(stage);
const g = carryGeometry(data, carry, geo);
// Owner decision D8 (2026-10-22): the drag leaves the source column to the right, over column 2,
// so the hand and the carried cards stay on the stage (a point left of column 1 is off it).
const out = { x: g.grab.x + SLOT, y: g.grab.y + 24 };

export const sourceDropScene: Scene = defineScene({
  id: 'source-drop',
  fixture: data,
  stage,
  caption: text.howTo.scenes.sourceDrop,
  carry,
  targets: {
    rest: { x: STAGE_W - 24, y: geo.columnAreaH - 24 },
    grab: g.grab,
    out,
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
    ...[0, 1, 2, 3, 4].map((j) => `tray-3-tile-${j}`),
  ],
  steps: [
    {
      type: 'grab',
      target: 'grab',
      kind: 'flyToCell',
      command: 0,
      wait: { kind: 'flyToCell', times: 2 },
    },
    { type: 'move', target: 'out', kind: 'flyToCell', times: 2 },
    { type: 'move', target: 'grab', kind: 'flyToCell', times: 2 },
    { type: 'drop', target: 'grab', kind: 'flyToCell', command: 0 },
    {
      type: 'fly',
      target: 'grab',
      kind: 'flyToCell',
      times: 2,
      reveal: { show: 'tray-2', hide: ['tail', 'dest'], kind: 'overlay' },
    },
    {
      type: 'arrange',
      target: 'grab',
      kind: 'snap',
      times: 3,
      command: 1,
      wait: { kind: 'flyToCell', times: 2 },
      reveal: { show: 'tray-3', hide: [], kind: 'overlay' },
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
