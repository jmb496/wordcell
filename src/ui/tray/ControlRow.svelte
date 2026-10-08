<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from '../text';

// Epic 5 entry 1 control row (DESIGN.md Tray band, Composing): the left slot stays empty (entry 3
// adds the D-block controls); the letter count (`draft.letterCount`, R-36) sits right-aligned in
// ui-label.
let { letterCount }: { letterCount: number } = $props();
</script>

<div class="row">
  <div class="left"></div>
  <span class="count">{text.letters(letterCount)}</span>
</div>

<style>
  .row { display: flex; align-items: center; height: 44px; gap: 8px; }
  .left { flex: 1 1 auto; min-width: 0; }
  .count {
    flex: none; white-space: nowrap;
    font: 500 14px/20px system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary);
  }
</style>
