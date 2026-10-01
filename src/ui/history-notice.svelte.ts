// §2/Q-33 History notice, once per launch (AD-16): opened at boot after the store's lifecycle
// registration when the store is active and the score history unreadable, or after New game from
// the rejected root (AD-13, the deferred push). The reason is captured at open, so the notice
// keeps its text while Delete history flips the store to ok before the closes.
import { game } from '../shell/game.svelte';
import { type HistoryRejectReason, scoreHistory } from '../shell/history.svelte';
import { overlays } from './overlays.svelte';

let shown = false;
let reason = $state.raw<HistoryRejectReason | undefined>(undefined);

/** Opens the notice unless already shown this launch, the store is not active, or the history is readable. */
export function openHistoryNotice(): void {
  const current = scoreHistory.state;
  if (shown || game.state.kind !== 'active' || current.status !== 'unreadable') return;
  reason = current.reason;
  shown = true;
  overlays.open('historyNotice');
}

/** The reason captured when the notice opened; undefined before. */
export function noticeReason(): HistoryRejectReason | undefined {
  return reason;
}
