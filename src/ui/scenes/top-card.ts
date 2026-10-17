import fixture from '../../../fixtures/how-to-play-top-card.json';
import { text } from '../text';
import { COLUMN_AREA_H, RICH_SLOT, STAGE_W } from './geometry';
import { defineScene } from './script';
import { carryGeometry, cellTarget } from './tray-scene';
import type { Scene, SceneFixtureData } from './types';

// Epic 8 ticket 4 (HP-4c; docs/game-flow-spec.md R-33, Q-31): drop A T on column 2, tap WordCell 5
// (its top S joins at index 0, Q-31: S before AT, SAT) and the cell dims; a second tap does nothing
// (the engine throws `r33-free-letter-duplicate`, which lives only in the fixture's `rejected`, the
// UI never dispatches it). Column 2 is empty (R-22) on purpose: it is a legal destination with no
// destination cards, so SAT is built from the lifted AT plus the free letter. Frames are by
// command state (`n` = commands applied: 0, 0, 1, 2); Validate follows the fixture `validatable`.
const data: SceneFixtureData = fixture;
const carry = { sourceColumn: 1, count: 2, destinationColumn: 2, destinationCount: 0 } as const;
const g = carryGeometry(data, carry);
const cell5 = cellTarget(5, data.start.cells?.['5']?.length ?? 0);

const opened = { tail: 'gone', dest: 'gone', tray: true, k: 0, side: 'left' } as const;

export const topCardScene: Scene = defineScene({
  id: 'top-card',
  fixture: data,
  caption: text.howTo.scenes.topCard,
  carry,
  targets: {
    rest: { x: STAGE_W - 24, y: COLUMN_AREA_H - 24 },
    grab: g.grab,
    over: g.over,
    cell5,
  },
  elements: ['stage', 'tail', 'tail-0', 'tail-1', 'dest', 'ghost', 'tray-2', 'tray-3'],
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
      target: 'cell5',
      kind: 'flyToCell',
      times: 2,
      command: 1,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'tray-3', hide: [], kind: 'overlay' },
    },
    // R-33: the second tap on the used cell dispatches nothing.
    { type: 'tap', target: 'cell5', kind: 'flyToCell', wait: { kind: 'flyToCell', times: 2 } },
  ],
  rest: { kind: 'flyToCell', times: 6 },
  frames: [
    { tail: 'home', tray: false, validate: 'off' },
    { tail: 'lifted', tray: false, validate: 'off' },
    { ...opened, order: ['A', 'T'], validate: 'off' },
    { ...opened, order: ['S', 'A', 'T'], validate: 'lit', used: [5] },
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
