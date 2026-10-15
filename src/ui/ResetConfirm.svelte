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
// and the end sheet pass it, only the Statistics panel handles Esc itself; entry 10's keymap
// replaces it).
let { ondeleted, escKeeps = false }: { ondeleted?: () => void; escKeeps?: boolean } = $props();

function keepIt(): void {
  overlays.close('resetConfirm');
}

function deleteHistory(): void {
  // 6.7: a reset with the finished-game sheet open (and not from the Statistics panel) leaves that
  // finish unrecorded; the line is shown only after the reset succeeded (rule 6). Delete history on
  // the relaunch History notice over the expanded sheet is an intended case for setting the flag.
  const fromSheet = overlays.isOpen('endSheet') && !overlays.isOpen('statistics');
  scoreHistory.reset();
  if (fromSheet) overlays.markFinishUnrecorded();
  overlays.close('resetConfirm');
  ondeleted?.();
}

const keepOnEsc = act((): void => {
  if (overlays.top === 'resetConfirm') keepIt();
});

function onkeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
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
