import { freeLetterScene } from './free-letter';
import { moveComposeScene } from './move-compose';
import { placeScene } from './place';
import { scoringScene } from './scoring';
import { sourceDropScene } from './source-drop';
import type { Scene } from './types';

/** The four basic How to play scenes, in order (epic 8 tickets 1 to 3 and 7). */
export const basicScenes: readonly Scene[] = [
  moveComposeScene,
  freeLetterScene,
  placeScene,
  scoringScene,
];

/** Every How to play scene, in order: the four basic ones, then the one Tricky rule (epic 8 ticket 10). */
export const scenes: readonly Scene[] = [...basicScenes, sourceDropScene];
