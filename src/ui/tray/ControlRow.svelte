<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { game } from '../../shell/game.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from '../act';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from '../text';

// Epic 5 control row (DESIGN.md Tray band, D-block controls): the left slot holds, in Composing
// only (`controls` set), `−` k `+` (44 × 44 secondary circles dispatching `setDestinationCount`
// k ∓ 1, disabled at a bound from `canDecK`/`canIncK`) and `⇄ Flip` (dispatching `flip` while
// `canFlip`), each through act() (AD-12); at k = 0 the R-31 caption replaces them, single line,
// ellipsizing before the letter count. Place has no controls. The right slot, ui-label,
// right-aligned: in Composing the letter count (`draft.letterCount`, R-36); in Place the meta
// (R-80) from `text.placeMeta`.
let {
  letterCount,
  meta,
  controls,
}: {
  letterCount: number;
  /** Place: the target cell and the net score change on commit. */
  meta?: { target: number; scoreDelta: number };
  /** Composing: the destination count and the D-block enablement flags from `GameView`. */
  controls?: { k: number; canDecK: boolean; canIncK: boolean; canFlip: boolean };
} = $props();
</script>

<div class="row">
  <div class="left">
    {#if controls !== undefined}
      {#if controls.k === 0}
        <span class="caption">{text.emptyColumn}</span>
      {:else}
        {@const k = controls.k}
        <button
          type="button"
          class="round"
          disabled={!controls.canDecK}
          onclick={act(() => game.dispatch({ type: 'setDestinationCount', k: k - 1 }))}
        >{text.minus}</button>
        <span class="k">{k}</span>
        <button
          type="button"
          class="round"
          disabled={!controls.canIncK}
          onclick={act(() => game.dispatch({ type: 'setDestinationCount', k: k + 1 }))}
        >{text.plus}</button>
        <button
          type="button"
          class="flip"
          disabled={!controls.canFlip}
          onclick={act(() => game.dispatch({ type: 'flip' }))}
        ><span aria-hidden="true">{text.flipGlyph}</span> {text.flip}</button>
      {/if}
    {/if}
  </div>
  {#if meta === undefined}
    <span class="count">{text.letters(letterCount)}</span>
  {:else}
    <span class="meta">{text.placeMeta(letterCount, meta.target, meta.scoreDelta)}</span>
  {/if}
</div>

<style>
  .row { display: flex; align-items: center; height: 44px; gap: 8px; }
  .left { flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 8px; }
  .count, .meta {
    flex: none; white-space: nowrap;
    font: 500 14px/20px system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary);
  }
  /* DESIGN.md Buttons, secondary: surface-raised, 1 px outline border, ink-primary. */
  .round, .flip {
    flex: none; box-sizing: border-box; height: 44px; margin: 0;
    border-radius: 9999px; background: var(--wc-surface-raised);
    border: 1px solid var(--wc-outline); color: var(--wc-ink-primary); touch-action: none;
  }
  .round {
    width: 44px; padding: 0; display: grid; place-items: center;
    font: 600 16px/24px system-ui, "Roboto", sans-serif;
  }
  .flip {
    margin-left: 8px; padding: 0 12px; white-space: nowrap;
    font: 600 16px/24px system-ui, "Roboto", sans-serif;
  }
  .round:disabled, .flip:disabled { color: var(--wc-ink-disabled); }
  .k, .caption {
    font: 500 14px/20px system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary);
  }
  .k { flex: none; min-width: 2ch; text-align: center; }
  .caption { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
