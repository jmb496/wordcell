import fixture from '../../../fixtures/how-to-play-scoring.json';
import { text } from '../text';
import {
  CARD_H,
  CELLS_TOP,
  COLUMN_AREA_H,
  placeCellX,
  SCORE_TOTAL_BOX,
  STAGE_W,
  STRIP,
} from './geometry';
import { defineScene } from './script';
import type { Frame, Scene, SceneFixtureData } from './types';

// Epic 8 tickets 3 and 9 (HP-3, HP-5; docs/game-flow-spec.md R-36, R-65, R-80, Q-06): WordCells 3, 4
// and 6 hold CAT, QUIT and BALKED and start as the game shows a WordCell, one top card each. Four
// taps: the first three grow one stack each downwards (3, 3 and 6 cards); the third then fades in
// 3 x 3 = 9, 4 x 4 = 16 (QU counts two) and 6 x 6 = 36 together; the fourth reveals the total 61.
// The scene has no commands: its cells-only start is the whole position, so `Z` is not drawn (the
// stage's columns are all filler).
const data: SceneFixtureData = fixture;

const stackPoint = (cell: number, cards: number) => ({
  x: placeCellX(cell) + 22,
  y: CELLS_TOP + ((cards - 1) * STRIP + CARD_H) / 2,
});
const counting = (stacks: number, numbers: number): Frame => ({
  tail: 'gone',
  tray: false,
  stacks,
  numbers,
});
const growing = [
  [3, 3],
  [4, 3],
  [6, 6],
] as const;

export const scoringScene: Scene = defineScene({
  id: 'scoring',
  fixture: data,
  caption: text.howTo.scenes.scoring,
  targets: {
    rest: { x: STAGE_W - 24, y: COLUMN_AREA_H - 24 },
    cell3: stackPoint(3, 1),
    cell4: stackPoint(4, 1),
    cell6: stackPoint(6, 1),
    total: {
      x: SCORE_TOTAL_BOX.x + SCORE_TOTAL_BOX.w / 2,
      y: SCORE_TOTAL_BOX.y + SCORE_TOTAL_BOX.h / 2,
    },
  },
  elements: [
    'stage',
    'ghost',
    'score-1',
    'score-2',
    'score-3',
    'total',
    ...growing.flatMap(([cell, cards]) =>
      Array.from({ length: cards }, (_, j) => `grow-${cell}-${j}`),
    ),
  ],
  steps: [
    {
      type: 'tap',
      target: 'cell3',
      kind: 'flyToCell',
      times: 2,
      wait: { kind: 'flyToCell', times: 2 },
      grows: { cell: 3, cards: 3 },
    },
    {
      type: 'tap',
      target: 'cell4',
      kind: 'flyToCell',
      times: 2,
      wait: { kind: 'flyToCell', times: 1 },
      grows: { cell: 4, cards: 3 },
    },
    {
      type: 'tap',
      target: 'cell6',
      kind: 'flyToCell',
      times: 2,
      wait: { kind: 'flyToCell', times: 1 },
      grows: { cell: 6, cards: 6 },
      reveal: { show: ['score-1', 'score-2', 'score-3'], hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'total',
      kind: 'flyToCell',
      times: 2,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'total', hide: [], kind: 'overlay' },
    },
  ],
  rest: { kind: 'flyToCell', times: 6 },
  frames: [
    counting(0, 0),
    counting(1, 0),
    counting(2, 0),
    counting(3, 0),
    counting(3, 3),
    { ...counting(3, 3), total: 61 },
  ],
});
