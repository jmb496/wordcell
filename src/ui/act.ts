// AD-12 R2/F9: every App-owned button handler cancels a gesture in progress first. `main.ts` sets
// the one controller once; Dialog, BlockingMessage and Halted pass handlers through unwrapped.
// Epic 5 SPEC CAP-4 (F1, AD-4): after `cancel()` and before the handler, the tile selection
// clears unconditionally (a no-op with none); `cancel()` itself never clears it (AD-9 hide flush).
import type { Controller } from './gestures/controller';
import type { Hit } from './gestures/intent';
import { overlays } from './overlays.svelte';

let controller: Controller | undefined;

export function setController(next: Controller): void {
  if (controller !== undefined) throw new Error('AD-12 setController() called twice');
  controller = next;
}

/**
 * Wraps `handler` so it runs after `controller.cancel()` and `overlays.clearTile()`; wrapping
 * itself never throws.
 */
export function act<A extends unknown[]>(handler: (...args: A) => void): (...args: A) => void {
  return (...args) => {
    if (controller === undefined) throw new Error('AD-12 act() before setController()');
    controller.cancel();
    overlays.clearTile();
    handler(...args);
  };
}

/**
 * Epic 6 CAP-10 (6.11): the key rows that must keep a tile selection (focus moves, tail selection)
 * cancel a drag without act()'s clearTile.
 */
export function cancelGesture(): void {
  if (controller === undefined) throw new Error('AD-12 cancelGesture() before setController()');
  controller.cancel();
}

/** Epic 6 CAP-10 (6.11): the controller's key-activation entry (it cancels, never clearTile). */
export function activateHit(hit: Hit): void {
  if (controller === undefined) throw new Error('AD-12 activateHit() before setController()');
  controller.activate(hit);
}
