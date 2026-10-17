import { destinationRuleScene } from './destination-rule';
import { freeLetterScene } from './free-letter';
import { moveComposeScene } from './move-compose';
import { placeScene } from './place';
import { scoringScene } from './scoring';
import { sourceDropScene } from './source-drop';
import { topCardScene } from './top-card';
import type { Scene } from './types';

/** The four basic How to play scenes, in order (epic 8 tickets 1 to 3 and 7). */
export const basicScenes: readonly Scene[] = [
  moveComposeScene,
  freeLetterScene,
  placeScene,
  scoringScene,
];

/** The Tricky rules scenes, in order (epic 8 ticket 4). */
export const trickyScenes: readonly Scene[] = [sourceDropScene, destinationRuleScene, topCardScene];

/** Every How to play scene, in order. */
export const scenes: readonly Scene[] = [...basicScenes, ...trickyScenes];
