<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from '../text';

// Epic 5 control row (DESIGN.md Tray band): the left slot stays empty (entry 3 adds the D-block
// controls in Composing; Place has none). The right slot, ui-label, right-aligned: in Composing
// the letter count (`draft.letterCount`, R-36); in Place the meta (R-80) from `text.placeMeta`.
let {
  letterCount,
  meta,
}: {
  letterCount: number;
  /** Place: the target cell and the net score change on commit. */
  meta?: { target: number; scoreDelta: number };
} = $props();
</script>

<div class="row">
  <div class="left"></div>
  {#if meta === undefined}
    <span class="count">{text.letters(letterCount)}</span>
  {:else}
    <span class="meta">{text.placeMeta(letterCount, meta.target, meta.scoreDelta)}</span>
  {/if}
</div>

<style>
  .row { display: flex; align-items: center; height: 44px; gap: 8px; }
  .left { flex: 1 1 auto; min-width: 0; }
  .count, .meta {
    flex: none; white-space: nowrap;
    font: 500 14px/20px system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary);
  }
</style>
