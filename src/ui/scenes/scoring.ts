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

// Epic 8 ticket 3 (HP-3e; docs/game-flow-spec.md R-36, R-80): WordCells 3, 4 and 6 hold CAT, QUIT
// and BALKED; four taps reveal 3 x 3 = 9, 4 x 4 = 16 (QU counts two), 6 x 6 = 36 and the total
// 61. The scene has no commands: its cells-only start is the whole position, so `Z` is not drawn (the
// stage's columns are all filler).
const data: SceneFixtureData = fixture;

const stackPoint = (cell: number, cards: number) => ({
  x: placeCellX(cell) + 22,
  y: CELLS_TOP + ((cards - 1) * STRIP + CARD_H) / 2,
});
const counting = (numbers: number): Frame => ({ tail: 'gone', tray: false, numbers });

export const scoringScene: Scene = defineScene({
  id: 'scoring',
  fixture: data,
  caption: text.howTo.scenes.scoring,
  targets: {
    rest: { x: STAGE_W - 24, y: COLUMN_AREA_H - 24 },
    cell3: stackPoint(3, 3),
    cell4: stackPoint(4, 3),
    cell6: stackPoint(6, 6),
    total: {
      x: SCORE_TOTAL_BOX.x + SCORE_TOTAL_BOX.w / 2,
      y: SCORE_TOTAL_BOX.y + SCORE_TOTAL_BOX.h / 2,
    },
  },
  elements: ['stage', 'ghost', 'score-1', 'score-2', 'score-3', 'total'],
  steps: [
    {
      type: 'tap',
      target: 'cell3',
      kind: 'flyToCell',
      times: 2,
      wait: { kind: 'flyToCell', times: 2 },
      reveal: { show: 'score-1', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'cell4',
      kind: 'flyToCell',
      times: 2,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'score-2', hide: [], kind: 'overlay' },
    },
    {
      type: 'tap',
      target: 'cell6',
      kind: 'flyToCell',
      times: 2,
      wait: { kind: 'flyToCell', times: 1 },
      reveal: { show: 'score-3', hide: [], kind: 'overlay' },
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
  frames: [counting(0), counting(1), counting(2), counting(3), { ...counting(3), total: 61 }],
});
