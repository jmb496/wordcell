import { composeScene } from './compose';
import { destinationScene } from './destination';
import { destinationRuleScene } from './destination-rule';
import { dragScene } from './drag';
import { placeScene } from './place';
import { scoringScene } from './scoring';
import { sourceDropScene } from './source-drop';
import { topCardScene } from './top-card';
import type { Scene } from './types';

/** The five basic How to play scenes, in order (epic 8 tickets 1 to 3). */
export const basicScenes: readonly Scene[] = [
  dragScene,
  composeScene,
  destinationScene,
  placeScene,
  scoringScene,
];

/** The Tricky rules scenes, in order (epic 8 ticket 4). */
export const trickyScenes: readonly Scene[] = [sourceDropScene, destinationRuleScene, topCardScene];

/** Every How to play scene, in order. */
export const scenes: readonly Scene[] = [...basicScenes, ...trickyScenes];
