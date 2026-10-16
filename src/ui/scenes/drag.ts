import fixture from '../../../fixtures/how-to-play-drag.json';
import { text } from '../text';
import { COLUMN_AREA_H, columnX, SLOT, STAGE_W, STRIP } from './geometry';
import { defineScene } from './script';
import type { Scene, SceneFixtureData } from './types';

// Epic 8 ticket 1 (HP-3a; docs/game-flow-spec.md §8, R-10, R-20, R-23): press E, lift E D K A, drop
// on column 3, the tray opens. The geometry is drawn from the fixture start and `carry`; the
// script-vs-fixture test pins `carry` to the fixture's drop command and the engine's draft.
const data: SceneFixtureData = fixture;
const carry = { sourceColumn: 1, count: 4, destinationColumn: 3, destinationCount: 1 } as const;

const home = {
  x: columnX(carry.sourceColumn),
  y: (data.start.columns[carry.sourceColumn - 1].length - carry.count) * STRIP,
};
const landing = {
  x: columnX(carry.destinationColumn),
  y: data.start.columns[carry.destinationColumn - 1].length * STRIP,
};
const offset = { x: landing.x - home.x, y: landing.y - home.y };
const grab = { x: home.x + SLOT / 2, y: home.y + STRIP / 2 };

export const dragScene: Scene = defineScene({
  id: 'drag',
  fixture: data,
  caption: text.howTo.scenes.drag,
  carry,
  targets: {
    rest: { x: STAGE_W - 24, y: COLUMN_AREA_H - 24 },
    grab,
    over: { x: grab.x + offset.x, y: grab.y + offset.y },
  },
  elements: ['stage', 'tail', 'ghost', 'tray'],
  steps: [
    { type: 'grab', target: 'grab', kind: 'snap', command: 0 },
    { type: 'move', target: 'over', kind: 'undoRedo' },
    {
      type: 'drop',
      target: 'over',
      kind: 'snap',
      command: 0,
      reveal: { show: 'tray', hide: ['tail', 'ghost'], kind: 'overlay' },
    },
  ],
  rest: { kind: 'flyToCell', times: 4 },
  frames: [
    { tail: 'home', tray: false },
    { tail: 'lifted', tray: false },
    { tail: 'over', tray: false },
    { tail: 'gone', tray: true },
  ],
  offset,
});
