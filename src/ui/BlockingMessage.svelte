<script lang="ts">
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
const id = $props.id();

// Owner decision 2026-09-30 (ticket 3.5): keyboard focus moves to the one button when the message
// appears and again when its cause (the title) changes.
function focusOnCause(button: HTMLButtonElement): void {
  void title;
  button.focus();
}
</script>

<div class="table">
  <div
    class="card"
    role="alertdialog"
    aria-labelledby="{id}-title"
    aria-describedby={body === undefined ? undefined : `${id}-body`}
  >
    <h2 id="{id}-title">{title}</h2>
    {#if body !== undefined}
      <p id="{id}-body">{body}</p>
    {/if}
    <button type="button" class="primary" onclick={onaction} {@attach focusOnCause}>{action}</button>
  </div>
</div>

<style>
  .table {
    box-sizing: border-box; min-height: 100%; padding: 16px;
    display: grid; place-items: center;
  }
  .card {
    box-sizing: border-box; width: 100%; max-width: 320px; padding: 24px;
    background: var(--wc-surface-raised); border-radius: 12px;
  }
  h2 { margin: 0; font: 600 1.25rem/1.75rem system-ui, "Roboto", sans-serif; color: var(--wc-ink-primary); }
  p {
    margin: 8px 0 0; font: 400 1rem/1.5rem system-ui, "Roboto", sans-serif;
    color: var(--wc-ink-secondary); overflow-wrap: anywhere;
  }
  .primary {
    display: block; width: 100%; height: 48px; margin-top: 24px; padding: 0 16px;
    border: none; border-radius: 9999px;
    background: var(--wc-accent-orange); color: var(--wc-ink-on-accent);
    font: 600 1rem/1.5rem system-ui, "Roboto", sans-serif;
  }
</style>
