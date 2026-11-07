// AD-16 worker state (epic 7 SPEC CAP-1, F1): the one value `sw.ts` (dynamic chunk) writes and
// the AD-17 hook reads; `main.ts` writes it only for F17. Imports nothing, so the hook and the
// main chunk read it without pulling in `workbox-window`. `failed` is sticky for the launch.

export type SwState = 'unregistered' | 'installing' | 'waiting' | 'active' | 'failed';

let state: SwState = 'unregistered';

export function swState(): SwState {
  return state;
}

/** Once `failed`, every later value is ignored (CAP-1). */
export function setSwState(next: SwState): void {
  if (state === 'failed') return;
  state = next;
}
