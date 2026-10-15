<script lang="ts">
import { tick, untrack } from 'svelte';
import { act } from './act';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Dialog from './Dialog.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { clearConfirmOrigin, confirmOrigin, newGame, replayDeal } from './new-game';
import { type OverlayId, overlays } from './overlays.svelte';
import { text } from './text';

// Epic 6 CAP-3 (6.3, R-74, Q-29; EXPERIENCE.md catalogue rows 97, 98): the New game and Replay
// confirms, rendered from `overlays.isOpen(id)` beside Menu. The scrim and `Keep playing` dismiss
// (only the confirm closes); accept calls the ungated action, whose `resetForNewSession()` pops the
// confirm, and Dialog's `firstClick` makes a double tap act once. Esc: interim `act()`-wrapped
// window handler, active only while the top overlay is a confirm (entry 10's keymap replaces it).
// Focus: an accept sets `accepted` and focus goes to `main` at close; otherwise a confirm opened
// from a menu row returns focus to the ☰ button (presence's restoreFocus aims at the exiting menu
// row, so this effect, run after `tick()`, wins); skipped when a menu was reopened during the exit.
// Other openers keep Dialog's default return.
const IDS = ['newGameConfirm', 'replayConfirm'] as const satisfies readonly OverlayId[];
type ConfirmId = (typeof IDS)[number];

let accepted = false;
const wasOpen: Record<ConfirmId, boolean> = { newGameConfirm: false, replayConfirm: false };

function onClosed(): void {
  const fromAccept = accepted;
  const fromMenu = confirmOrigin() === 'menu';
  accepted = false;
  clearConfirmOrigin();
  void tick().then(() => {
    if (fromAccept) document.querySelector('main')?.focus();
    else if (fromMenu && !overlays.isOpen('menu')) {
      document.querySelector<HTMLElement>(`button[aria-label="${text.menu}"]`)?.focus();
    }
  });
}

$effect(() => {
  const now = IDS.map((id) => overlays.isOpen(id));
  untrack(() => {
    IDS.forEach((id, i) => {
      if (wasOpen[id] && !now[i]) onClosed();
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

const closeOnEsc = act((): void => {
  const top = overlays.top;
  if (top === 'newGameConfirm' || top === 'replayConfirm') dismiss(top);
});

function onkeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  const top = overlays.top;
  if (
    event.key === 'Escape' &&
    !event.repeat &&
    (top === 'newGameConfirm' || top === 'replayConfirm')
  ) {
    event.preventDefault();
    closeOnEsc();
  }
}
</script>

<svelte:window {onkeydown} />

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
