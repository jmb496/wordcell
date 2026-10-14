<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import MessageCard from './MessageCard.svelte';

// DESIGN.md Blocking message: replaces the board with a dialog-styled card centred on the table,
// no scrim, one primary button. Renders the §2 rejected root, the AD-15 fatal and the Q-38
// another-window surfaces.
interface Props {
  title: string;
  body?: string | undefined;
  action: string;
  onaction: () => void;
}

const { title, body, action, onaction }: Props = $props();

// Owner decision 2026-09-30 (ticket 3.5): keyboard focus moves to the one button when the message
// appears and again when its cause (the title) changes.
function focusOnCause(button: HTMLButtonElement): void {
  void title;
  button.focus();
}
</script>

<div class="table">
  <MessageCard role="alertdialog" {title} {body}>
    <button type="button" class="primary" onclick={onaction} {@attach focusOnCause}>{action}</button>
  </MessageCard>
</div>

<style>
  .table {
    box-sizing: border-box; min-height: 100%; padding: 16px;
    display: grid; place-items: center;
  }
  .primary {
    display: block; width: 100%; height: 48px; margin-top: 24px; padding: 0 16px;
    border: none; border-radius: 9999px;
    background: var(--wc-accent-orange); color: var(--wc-ink-on-accent);
    font: 600 1rem/1.5rem system-ui, "Roboto", sans-serif;
  }
</style>
