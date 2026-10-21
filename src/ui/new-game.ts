// AD-4/AD-13: New game from the action bar or the rejected root closes every entry; after New game
// from the rejected root the deferred History notice is pushed (AD-16). One sequence for both.
// Epic 6 CAP-3 (6.3, R-74, Q-29): `requestNewGame`/`requestReplay` gate the menu rows on
// `GameView.inProgress` (AD-3, never re-derived): a confirm through `openSurface` (SPEC F8) while a
// game is in progress, else the ungated action. `newGame()` and `replayDeal()` stay ungated.
import type { GameView } from '../engine/index';
import { game } from '../shell/game.svelte';
import { announceReset } from './announce';
import { openHistoryNotice } from './history-notice.svelte';
import { releaseHold } from './motion';
import { openSurface } from './open-surface';
import { overlays } from './overlays.svelte';
import { roving } from './roving.svelte';
import { text } from './text';

export function newGame(): void {
  const wasRejected = game.state.kind === 'rejected';
  game.newGame();
  announceReset(text.announceNewGame);
  overlays.resetForNewSession();
  releaseHold();
  roving.reset();
  if (wasRejected) openHistoryNotice();
}

/** Replay this deal (Q-29): same seed, empty moves; every entry closes. */
export function replayDeal(): void {
  game.replay();
  announceReset(text.announceReplay);
  overlays.resetForNewSession();
  releaseHold();
  roving.reset();
}

/** Opens the New game confirm and returns true while a game is in progress, else acts at once. */
export function requestNewGame(view: GameView, from?: 'menu'): boolean {
  if (view.inProgress) {
    openSurface('newGameConfirm', { from });
    return true;
  }
  newGame();
  return false;
}

/** Opens the Replay confirm and returns true while a game is in progress, else acts at once. */
export function requestReplay(view: GameView, from?: 'menu'): boolean {
  if (view.inProgress) {
    openSurface('replayConfirm', { from });
    return true;
  }
  replayDeal();
  return false;
}
