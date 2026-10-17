import fixture from '../../../fixtures/how-to-play-drag.json';
import { text } from '../text';
import { COLUMN_AREA_H, columnRowY, columnX, SLOT, STAGE_W, STRIP, TRAY_TOP } from './geometry';
import { defineScene } from './script';
import type { Scene, SceneFixtureData } from './types';

// Epic 8 ticket 1 (HP-3a; docs/game-flow-spec.md §8, R-10, R-20, R-23): press E, lift E D K A, drop
// on column 3, the tray opens. The geometry is drawn from the fixture start and `carry`; the
// script-vs-fixture test pins `carry` to the fixture's drop command and the engine's draft.
const data: SceneFixtureData = fixture;
const carry = { sourceColumn: 1, count: 4, destinationColumn: 3, destinationCount: 1 } as const;

const sourceLength = data.start.columns[carry.sourceColumn - 1].length;
const destLength = data.start.columns[carry.destinationColumn - 1].length;
const home = {
  x: columnX(carry.sourceColumn),
  y: columnRowY(sourceLength, sourceLength - carry.count),
};
const landing = {
  x: columnX(carry.destinationColumn),
  y: columnRowY(destLength, destLength),
};
const offset = { x: landing.x - home.x, y: landing.y - home.y };
const destHome = {
  x: landing.x,
  y: columnRowY(destLength, destLength - carry.destinationCount),
};
// Where the cards come to rest in the tray row (DESIGN.md tray: 16 px inset, D cards first).
const trayDest = { x: 16, y: TRAY_TOP + 3 };
const trayTail = { x: trayDest.x + carry.destinationCount * SLOT, y: trayDest.y };
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
    tray: trayTail,
  },
  elements: ['stage', 'tail', 'tail-0', 'tail-1', 'tail-2', 'tail-3', 'dest', 'ghost', 'tray'],
  steps: [
    {
      type: 'grab',
      target: 'grab',
      kind: 'flyToCell',
      command: 0,
      wait: { kind: 'flyToCell', times: 2 },
    },
    { type: 'move', target: 'over', kind: 'flyToCell', times: 2 },
    {
      type: 'drop',
      target: 'over',
      kind: 'flyToCell',
      command: 0,
    },
    {
      type: 'fly',
      target: 'tray',
      kind: 'flyToCell',
      times: 2,
      reveal: { show: 'tray', hide: ['tail', 'dest', 'ghost'], kind: 'overlay' },
    },
  ],
  rest: { kind: 'flyToCell', times: 6 },
  frames: [
    { tail: 'home', tray: false },
    { tail: 'lifted', tray: false },
    { tail: 'over', tray: false },
    { tail: 'gone', tray: true },
  ],
  offset,
  layout: { tailHome: home, destHome, trayTail, trayDest },
});
