import { freeLetterScene } from './free-letter';
import { moveComposeScene } from './move-compose';
import { placeScene } from './place';
import { scoringScene } from './scoring';
import { sourceDropScene } from './source-drop';
import type { Scene } from './types';

/**
 * The three basic How to play scenes that build on each other, in order (epic 8 tickets 1 to 3 and
 * 7): move and compose, the free letter, place.
 */
export const basicScenes: readonly Scene[] = [moveComposeScene, freeLetterScene, placeScene];

/**
 * Every How to play scene, in order: the basic ones, then the one Tricky rule (epic 8 ticket 10),
 * then scoring last (owner decision 2026-10-17).
 */
export const scenes: readonly Scene[] = [...basicScenes, sourceDropScene, scoringScene];
