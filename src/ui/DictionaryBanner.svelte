<script lang="ts">
import { dictionary } from '../shell/dictionary.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// AD-8 dictionary-failed banner (DESIGN.md Components): shown straight from the store, on the
// board only. Reload is disabled while a Q-42 in-place retry runs (the banner stays shown then),
// a UI-level no-op so a tap never reaches retry() outside 'failed'. The epic-4 top bar adds the
// sticky offset and the AD-11 gesture latch.
function reload(): void {
  void dictionary.retry();
}
</script>

{#if dictionary.showBanner}
  <div class="banner">
    <p>{text.wordListFailed}</p>
    <button
      type="button"
      class="secondary"
      disabled={dictionary.state !== 'failed'}
      onclick={reload}
    >{text.reload}</button>
  </div>
{/if}

<style>
  .banner {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    min-height: 44px; margin: 0 0 4px;
  }
  p {
    margin: 0; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
    font: 500 14px/20px system-ui, "Roboto", sans-serif; color: var(--wc-error);
  }
  .secondary {
    flex: none; height: 44px; padding: 0 16px; border-radius: 9999px;
    background: var(--wc-surface-raised); border: 1px solid var(--wc-outline);
    color: var(--wc-ink-primary); font: 600 16px/24px system-ui, "Roboto", sans-serif;
  }
  .secondary:disabled { color: var(--wc-ink-disabled); }
</style>
