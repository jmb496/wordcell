// Epic 10 ticket 10.7 (AD-19 Hide, Resize; R-87): the hide and resize ends of the win celebration.
// One callback, registered once with the store's before-hide flush and as permanent `resize` and
// `orientationchange` listeners on `win`, calls the run controller's ordinary `end()`: a no-op with
// no run (or on the second flush, `pagehide` after `visibilitychange`), and any such event during a
// run ends it (no size compare, no debounce). The plain `end()` departs from AD-19 Hide's "the hide
// mode only stops the run and removes the entry", pending the owner's rule 7 nod (ticket 10.7
// Hide); `done` (end-sheet.ts) defers the sheet's open to `game.whenVisible()` on a hidden page.
// Halted (AD-15): `game.svelte.ts` `flush()` runs its callbacks in every state, so the injected
// `halted()` leaves a live run running; `end()` itself never checks it. This module imports no
// store: main.ts passes `window`, `game.registerBeforeHide`, its `halted()` and `celebration.end`.

export type InterruptionDeps = {
  readonly win: Pick<EventTarget, 'addEventListener'>;
  readonly registerBeforeHide: (fn: () => void) => void;
  readonly halted: () => boolean;
  readonly end: () => void;
};

let installed = false;

/** AD-19: once, at boot (main.ts); a second call throws. */
export function installInterruptions({
  win,
  registerBeforeHide,
  halted,
  end,
}: InterruptionDeps): void {
  if (installed) throw new Error('AD-19 installInterruptions() called twice');
  installed = true;
  const stop = (): void => {
    if (!halted()) end();
  };
  registerBeforeHide(stop);
  win.addEventListener('resize', stop);
  win.addEventListener('orientationchange', stop);
}
