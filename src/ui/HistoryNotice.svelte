<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from './act';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Dialog from './Dialog.svelte';
import { noticeReason } from './history-notice.svelte';
import { openSurface } from './open-surface';
import { overlays } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import ResetConfirm from './ResetConfirm.svelte';
import { text } from './text';

// §2/Q-33 History notice and its Reset confirm (EXPERIENCE.md catalogue rows 102, 104), rendered
// by App while the notice is open. The notice has no scrim action (owner decision 2026-10-01);
// the confirm (ResetConfirm, shared with the Statistics panel) has its scrim act as Keep it, and
// Delete history there closes it, then this notice. Esc on the confirm acts as Keep it
// through the key handler (keys.ts).
const body = $derived.by(() => {
  const reason = noticeReason();
  if (reason === undefined) throw new Error('AD-13 History notice rendered before it opened');
  return `${text.historySentence(reason)} ${text.historyResetHint}`;
});

function openConfirm(): void {
  openSurface('resetConfirm');
}

function notNow(): void {
  overlays.close('historyNotice');
}
</script>

<Dialog
  title={text.historyTitle}
  {body}
  dismiss={text.notNow}
  action={text.resetHistory}
  ondismiss={act(notNow)}
  onaction={act(openConfirm)}
  inert={overlays.top !== 'historyNotice'}
/>
{#if overlays.isOpen('resetConfirm')}
  <ResetConfirm ondeleted={notNow} />
{/if}
