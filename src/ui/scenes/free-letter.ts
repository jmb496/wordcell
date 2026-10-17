import fixture from '../../../fixtures/how-to-play-free-letter.json';
import { text } from '../text';
import { COLUMN_AREA_H, STAGE_W } from './geometry';
import { moveComposeCarry, moveComposeFinalFrame } from './move-compose';
import { defineScene } from './script';
import { carryGeometry, trayTargets } from './tray-scene';
import type { Scene, SceneFixtureData } from './types';

// Epic 8 ticket 7 (scene 2; R-33, R-34, R-38): opens on scene 1's final position (the fixture
// carries scene 1's commands as a prefix, `opens`; frame 0 is scene 1's final frame and the tail
// has `landed`), taps WordCell 6 (its top card L joins the word between A and K: BALKED), then
// taps Validate. Frame i = the state after `opens + i` fixture commands.
const data: SceneFixtureData = fixture;
const carry = { ...moveComposeCarry, landed: true } as const;
const g = carryGeometry(data, carry);

const opened = { ...moveComposeFinalFrame, order: ['B', 'A', 'L', 'K', 'E', 'D'] } as const;

export const freeLetterScene: Scene = defineScene({
  id: 'free-letter',
  fixture: data,
  caption: text.howTo.scenes.freeLetter,
  carry,
  targets: {
    rest: { x: STAGE_W - 24, y: COLUMN_AREA_H - 24 },
    cell6: trayTargets.cell6,
    validate: trayTargets.validate,
  },
  elements: ['stage', 'ghost', 'tray-1', 'tray-2'],
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
      type: 'tap',
      target: 'validate',
      kind: 'flyToCell',
      times: 2,
      command: 7,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-2', hide: [], kind: 'overlay' },
    },
  ],
  rest: { kind: 'flyToCell', times: 6 },
  frames: [
    moveComposeFinalFrame,
    { ...opened, cell6: 'used' },
    { ...opened, cell6: 'used', validate: 'pressed' },
  ],
  offset: g.offset,
  layout: {
    tailHome: g.home,
    destHome: g.destHome,
    trayTail: g.trayTail,
    trayDest: g.trayDest,
  },
});
