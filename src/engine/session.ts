import { EngineError } from './errors';
import { isUint32 } from './fields';
import type { CardId, WordCellNumber } from './types';

/** §2 `cursor.phase`: the player-visible phase of the draft. */
export type Phase = 'idle' | 'composing' | 'place';

/** §2 `Move.reached`: the furthest phase state valid for the move's data (R-71). */
export type Reached = 'composing' | 'place' | 'committed';

/** §2 `Move.destinationSide` (R-30). */
export type DestinationSide = 'left' | 'right';

/** §2 `cursor`: `index` is the former `undoIndex`; `phase` refines it. */
export interface Cursor {
  readonly index: number;
  readonly phase: Phase;
}

/** §2 `Move`: the stored record created by a drop, committed or not. */
export interface Move {
  /** Column 1–8; S = its bottom `sourceCount` cards. */
  readonly sourceColumn: number;
  readonly sourceCount: number;
  /** Column 1–8; D = its bottom `destinationCount` cards after S is removed (R-21). */
  readonly destinationColumn: number;
  readonly destinationCount: number;
  readonly destinationSide: DestinationSide;
  /** WordCells whose top card is a free letter of the word; order is not a rule (D8). */
  readonly freeLetters: readonly WordCellNumber[];
  /** Left-to-right order of S ∪ F (the movable part). */
  readonly arrangement: readonly CardId[];
  readonly reached: Reached;
  /** Present iff `reached` ≥ place. */
  readonly targetCell?: WordCellNumber;
  /** Present iff `reached` ≥ place; bottom → top order of S ∪ F ∪ D on `targetCell`. */
  readonly placementOrder?: readonly CardId[];
}

/** §2 `Session`: every position is derived from it by replay (AGENTS.md rule 2). */
export interface Session {
  readonly version: number;
  readonly seed: number;
  readonly moves: readonly Move[];
  readonly cursor: Cursor;
  readonly gaveUp: boolean;
  readonly activeMs: number;
}

/** D5; bumps per AD-7. */
export const SESSION_VERSION = 1;

/** AD-2 / AD-7 seed domain: a uint32; throws `seed-uint32`. */
export function assertSeed(seed: number): void {
  if (!isUint32(seed)) throw new EngineError('seed-uint32', `AD-7 seed ${seed} is not a uint32`);
}

/** R-04, R-74: a fresh Session for `seed`. */
export function createSession(seed: number): Session {
  assertSeed(seed);
  return {
    version: SESSION_VERSION,
    seed,
    moves: [],
    cursor: { index: 0, phase: 'idle' },
    gaveUp: false,
    activeMs: 0,
  };
}
