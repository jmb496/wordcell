<script lang="ts">
import { type HistoryRejectReason, scoreHistory } from '../shell/history.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Dialog from './Dialog.svelte';
import { noticeReason } from './history-notice.svelte';
import { overlays } from './overlays.svelte';
import { text } from './text';

// §2/Q-33 History notice and its Reset confirm (EXPERIENCE.md catalogue rows 102, 104), rendered
// by App while the notice is open. The notice has no scrim action (owner decision 2026-10-01);
// the confirm's scrim acts as Keep it. Delete history resets first, so a throwing write reaches
// AD-15 with nothing closed, then closes top-down.
function sentence(reason: HistoryRejectReason): string {
  switch (reason.reason) {
    case 'version-unknown':
      return text.historyVersionUnknown(reason.version);
    case 'version-unreadable':
      return text.historyVersionUnreadable;
    case 'contents-unreadable':
      return text.historyContentsUnreadable(reason.version);
  }
}

const body = $derived.by(() => {
  const reason = noticeReason();
  if (reason === undefined) throw new Error('AD-13 History notice rendered before it opened');
  return `${sentence(reason)} ${text.historyResetHint}`;
});

function notNow(): void {
  overlays.close('historyNotice');
}

function openConfirm(): void {
  overlays.open('resetConfirm');
}

function keepIt(): void {
  overlays.close('resetConfirm');
}

function deleteHistory(): void {
  scoreHistory.reset();
  overlays.close('resetConfirm');
  overlays.close('historyNotice');
}
</script>

<Dialog
  title={text.historyTitle}
  {body}
  dismiss={text.notNow}
  action={text.resetHistory}
  ondismiss={notNow}
  onaction={openConfirm}
  inert={overlays.top !== 'historyNotice'}
/>
{#if overlays.isOpen('resetConfirm')}
  <Dialog
    title={text.resetConfirmTitle}
    body={text.resetConfirmBody}
    dismiss={text.keepIt}
    action={text.deleteHistory}
    ondismiss={keepIt}
    onaction={deleteHistory}
    onscrim={keepIt}
  />
{/if}
