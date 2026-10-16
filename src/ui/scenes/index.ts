import { composeScene } from './compose';
import { destinationScene } from './destination';
import { dragScene } from './drag';
import type { Scene } from './types';

/** The How to play scenes, in order (epic 8). */
export const scenes: readonly Scene[] = [dragScene, composeScene, destinationScene];
