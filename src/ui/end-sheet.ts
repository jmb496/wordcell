// Epic 6 CAP-4 (ticket 6.6, AD-13, AD-16): the end sheet's wiring from DispatchResult to
// `overlays`, pure functions over `overlays` and `game`. A win (Confirm or Redo) defers the open
// to the animation's settle (one token, re-checked against the store); a Give up opens at once;
// an unfinished game (Undo) hides the sheet or cancels the pending open; a relaunch into won or
// gaveUp opens at boot. Undo-cancel and the 300 ms floor belong to the winning guard (entry 12).
import { tick } from 'svelte';
import { type DispatchResult, game } from '../shell/game.svelte';
import { focusBoard } from './focus-board';
import { overlays } from './overlays.svelte';

/** Registers `callback` to run once the move's animation has settled (at once if none runs). */
export type WhenSettled = (callback: () => void) => void;

export function onDispatched(result: DispatchResult, whenSettled: WhenSettled): void {
  if (result.unfinished === true) {
    const shown = overlays.endSheet !== 'hidden';
    overlays.onUnfinished();
    // EXPERIENCE.md Focus: Undo from the sheet resumes play with focus on the board.
    if (shown) void tick().then(focusBoard);
    return;
  }
  if (result.finished === 'won') {
    const token = overlays.deferEndSheetOpen();
    // AD-13: pushes only while the store still says won (the token callback re-check).
    whenSettled(() => {
      if (game.view?.status === 'won') overlays.openDeferred(token);
    });
  } else if (result.finished === 'gaveUp') {
    overlays.openDeferred(overlays.deferEndSheetOpen());
  }
}

/** R-73: a relaunch with status won or gaveUp opens the sheet expanded (AD-16, before the notice). */
export function openAtBoot(): void {
  const status = game.view?.status;
  if (status !== 'won' && status !== 'gaveUp') return;
  overlays.openDeferred(overlays.deferEndSheetOpen());
}
