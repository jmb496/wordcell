<script lang="ts">
import { scoreHistory } from '../shell/history.svelte';
import { act } from './act';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Dialog from './Dialog.svelte';
import { overlays } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// §2/Q-33 Reset history's confirm (EXPERIENCE.md catalogue row 104), shared by the History notice
// and the Statistics panel; the parent mounts it while `resetConfirm` is open. The scrim acts as
// Keep it. Delete history resets first, so a throwing write reaches AD-15 with nothing closed,
// then closes only `resetConfirm`; `ondeleted` lets the notice close itself too. Focus return is
// the opener's: the notice relies on Dialog, the panel on its own effect. `escKeeps` adds the
// interim act()-wrapped Esc handler (acts as Keep it only while this is the top overlay; the notice
// leaves Esc unhandled; entry 10's keymap replaces it).
let { ondeleted, escKeeps = false }: { ondeleted?: () => void; escKeeps?: boolean } = $props();

function keepIt(): void {
  overlays.close('resetConfirm');
}

function deleteHistory(): void {
  scoreHistory.reset();
  overlays.close('resetConfirm');
  ondeleted?.();
}

const keepOnEsc = act((): void => {
  if (overlays.top === 'resetConfirm') keepIt();
});

function onkeydown(event: KeyboardEvent): void {
  if (escKeeps && event.key === 'Escape' && !event.repeat && overlays.top === 'resetConfirm') {
    event.preventDefault();
    keepOnEsc();
  }
}
</script>

<svelte:window {onkeydown} />

<Dialog
  title={text.resetConfirmTitle}
  body={text.resetConfirmBody}
  dismiss={text.keepIt}
  action={text.deleteHistory}
  ondismiss={act(keepIt)}
  onaction={act(deleteHistory)}
  onscrim={act(keepIt)}
/>
