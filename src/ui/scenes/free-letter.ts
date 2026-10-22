import fixture from '../../../fixtures/how-to-play-free-letter.json' with { type: 'json' };
import { text } from '../text';
import { STAGE_W, stageGeometry } from './geometry';
import { moveComposeCarry, moveComposeFinalFrame } from './move-compose';
import { defineScene } from './script';
import { sceneStageInputs } from './stage';
import { carryGeometry, trayTargets } from './tray-scene';
import type { Frame, Scene, SceneFixtureData } from './types';

// Epic 8 ticket 7 (scene 2; R-33, R-34, R-38): opens on scene 1's final position (the fixture
// carries scene 1's commands as a prefix, `opens`; frame 0 is scene 1's final frame and the tail
// has `landed`), taps WordCell 6 (a tap appends its top card L at the right end of the arranged
// cards, Q-31: BAKLED), the cards are rearranged to BALKED with the same tile glide as scene 1
// (owner decision D4, 2026-10-22), then taps Validate. Frame i = the state after `opens + i`
// fixture commands.
const data: SceneFixtureData = fixture;
const carry = { ...moveComposeCarry, landed: true } as const;
const borrowed = { ...moveComposeFinalFrame, cell6: 'used' } as const;
const balked = { ...borrowed, order: ['B', 'A', 'L', 'K', 'E', 'D'] } as const;
const frames: readonly Frame[] = [
  moveComposeFinalFrame,
  { ...borrowed, order: ['B', 'A', 'K', 'L', 'E', 'D'] },
  balked,
  { ...balked, validate: 'pressed' },
];
const stage = sceneStageInputs(data, carry, frames);
const geo = stageGeometry(stage);
const g = carryGeometry(data, carry, geo);
const tray = trayTargets(geo);

export const freeLetterScene: Scene = defineScene({
  id: 'free-letter',
  fixture: data,
  stage,
  caption: text.howTo.scenes.freeLetter,
  carry,
  targets: {
    rest: { x: STAGE_W - 24, y: geo.columnAreaH - 24 },
    cell6: tray.cell6,
    validate: tray.validate,
  },
  elements: [
    'stage',
    'ghost',
    'tray-1',
    'tray-2',
    'tray-3',
    ...[0, 1, 2, 3, 4, 5].map((j) => `tray-2-tile-${j}`),
  ],
  steps: [
    {
      type: 'tap',
      target: 'cell6',
      kind: 'flyToCell',
      times: 2,
      command: 6,
      wait: { kind: 'flyToCell', times: 2 },
      reveal: { show: 'tray-1', hide: [], kind: 'overlay' },
    },
    {
      type: 'arrange',
      target: 'cell6',
      kind: 'snap',
      times: 3,
      command: 7,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-2', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'validate',
      kind: 'flyToCell',
      times: 2,
      command: 8,
      wait: { kind: 'flyToCell', times: 1 },
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
  },
});
