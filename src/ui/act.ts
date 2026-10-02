// AD-12 R2/F9: every App-owned button handler cancels a gesture in progress first. `main.ts` sets
// the one controller once; Dialog, BlockingMessage and Halted pass handlers through unwrapped.
import type { Controller } from './gestures/controller';

let controller: Controller | undefined;

export function setController(next: Controller): void {
  if (controller !== undefined) throw new Error('AD-12 setController() called twice');
  controller = next;
}

/** Wraps `handler` so it runs after `controller.cancel()`; wrapping itself never throws. */
export function act<A extends unknown[]>(handler: (...args: A) => void): (...args: A) => void {
  return (...args) => {
    if (controller === undefined) throw new Error('AD-12 act() before setController()');
    controller.cancel();
    handler(...args);
  };
}
