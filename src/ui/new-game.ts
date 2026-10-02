// AD-4/AD-13: New game from the action bar or the rejected root closes every entry; after New game
// from the rejected root the deferred History notice is pushed (AD-16). One sequence for both.
import { game } from '../shell/game.svelte';
import { openHistoryNotice } from './history-notice.svelte';
import { overlays } from './overlays.svelte';

export function newGame(): void {
  const wasRejected = game.state.kind === 'rejected';
  game.newGame();
  overlays.resetForNewSession();
  if (wasRejected) openHistoryNotice();
}
