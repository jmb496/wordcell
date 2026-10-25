<script lang="ts">
import { tick, untrack } from 'svelte';
import type { GameView } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from './act';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Dialog from './Dialog.svelte';
import { focusBoard, focusByPhase, focusMenuButton } from './focus-board';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { newGame, replayDeal } from './new-game';
import { takeMenuOrigin } from './open-surface';
import { type OverlayId, overlays } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// Epic 6 CAP-3 (6.3, R-74, Q-29; EXPERIENCE.md catalogue rows 97, 98): the New game and Replay
// confirms, rendered from `overlays.isOpen(id)` beside Menu. The scrim and `Keep playing` dismiss
// (only the confirm closes); accept calls the ungated action, whose `resetForNewSession()` pops the
// confirm, and Dialog's `firstClick` makes a double tap act once. Esc closes the
// confirm through the key handler (keys.ts, ticket 6.10).
// Focus: an accept sets `accepted` and focus goes to the board at close (focus-board.ts
// `focusBoard`); otherwise a confirm opened
// from a menu row (open-surface.ts `takeMenuOrigin`) returns focus to the ☰ button (presence's
// restoreFocus aims at the exiting menu row, so this effect, run after `tick()`, wins); skipped
// when a menu was reopened during the exit.
// Any other dismissal (the N key; build-notes surface table) moves focus by the phase (SPEC F12,
// focus-board.ts `focusByPhase`: the board, the first movable tile or the first strip card),
// skipped when another entry is now on top (the end sheet or a panel keeps Dialog's default return).
const IDS = ['newGameConfirm', 'replayConfirm'] as const satisfies readonly OverlayId[];
type ConfirmId = (typeof IDS)[number];

let { view }: { view: GameView } = $props();

let accepted = false;
const wasOpen: Record<ConfirmId, boolean> = { newGameConfirm: false, replayConfirm: false };

function onClosed(id: ConfirmId): void {
  const fromAccept = accepted;
  const fromMenu = takeMenuOrigin(id);
  accepted = false;
  void tick().then(() => {
    if (fromAccept) focusBoard();
    else if (fromMenu && !overlays.isOpen('menu')) focusMenuButton();
    else if (!fromMenu && overlays.top === undefined) focusByPhase(view);
  });
}

$effect(() => {
  const now = IDS.map((id) => overlays.isOpen(id));
  untrack(() => {
    IDS.forEach((id, i) => {
      if (wasOpen[id] && !now[i]) onClosed(id);
      wasOpen[id] = now[i] ?? false;
    });
  });
});

function dismiss(id: ConfirmId): void {
  overlays.close(id);
}

function accept(action: () => void): void {
  accepted = true;
  action();
}
</script>

<Dialog
  title={text.newGameConfirmTitle}
  body={text.newGameConfirmBody}
  dismiss={text.keepPlaying}
  action={text.newGame}
  actionStyle="primary"
  open={overlays.isOpen('newGameConfirm')}
  ondismiss={act(() => dismiss('newGameConfirm'))}
  onaction={act(() => accept(newGame))}
  onscrim={act(() => dismiss('newGameConfirm'))}
/>
<Dialog
  title={text.replayConfirmTitle}
  body={text.replayConfirmBody}
  dismiss={text.keepPlaying}
  action={text.replayConfirmAction}
  actionStyle="primary"
  open={overlays.isOpen('replayConfirm')}
  ondismiss={act(() => dismiss('replayConfirm'))}
  onaction={act(() => accept(replayDeal))}
  onscrim={act(() => dismiss('replayConfirm'))}
/>
