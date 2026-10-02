<script lang="ts">
import type { CellView, Face, GameView } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from './Card.svelte';

// DESIGN.md WordCell, build-notes CAP-2: labels 3–10 in the `labelsRow` track, each wordcell-<n>
// in the `cellsRow` track under column n − 2 (A-D7), outside its label (F25). Every cell card is
// a live Card (AD-14) in DOM order bottom → top, stacked; only the top one is visible. States
// come from `CellView` and `view.place` (AD-3).
let {
  cells,
  faces,
  place,
  labelsRow,
  cellsRow,
}: {
  cells: readonly CellView[];
  faces: readonly Face[];
  place: GameView['place'];
  labelsRow: number;
  cellsRow: number;
} = $props();

const inPlace = $derived(place !== undefined);
</script>

{#each cells as cell (cell.cell)}
  {@const top = cell.cards.length - 1}
  {@const target = place?.target === cell.cell}
  {@const dim = inPlace && !cell.isLegalTarget && !target}
  <span
    class="label"
    class:dim
    aria-hidden="true"
    style:grid-column={cell.cell - 2}
    style:grid-row={labelsRow}
  >{cell.cell}</span>
  <div
    class="wordcell"
    class:empty={cell.cards.length === 0}
    class:legal={inPlace && cell.isLegalTarget && !target}
    class:target
    class:dim
    role="group"
    aria-label="WordCell {cell.cell}"
    data-testid="wordcell-{cell.cell}"
    data-wordcell={cell.cell}
    style:grid-column={cell.cell - 2}
    style:grid-row={cellsRow}
  >
    {#each cell.cards as id, i (id)}
      <Card
        {id}
        face={faces[id] as Face}
        place="cell"
        full
        hidden={i !== top}
        used={i === top && cell.used}
      />
    {/each}
    {#if cell.cards.length >= 2}<span class="count">{cell.cards.length}</span>{/if}
    {#if target}
      <span class="check" aria-hidden="true">
        <svg viewBox="0 0 14 14" width="14" height="14"><path d="M3.5 7.2 L6 9.6 L10.5 4.6" /></svg>
      </span>
    {/if}
  </div>
{/each}

<style>
  .label {
    align-self: center; text-align: center;
    font: 600 13px/16px system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary);
  }
  .wordcell { position: relative; width: var(--wc-slot); height: var(--wc-H); }
  .dim { opacity: 0.35; }
  /* The card rect inside the slot: empty outline, legal ring, selected-target ring. */
  .wordcell.empty::before,
  .wordcell.legal::after,
  .wordcell.target::after {
    content: ''; position: absolute; top: 0; left: 2px; box-sizing: border-box;
    width: var(--wc-w); height: var(--wc-H); border-radius: 6px; pointer-events: none;
  }
  .wordcell.empty::before { border: 2px solid var(--wc-outline); }
  .wordcell.legal::after { border: 2px solid var(--wc-accent-teal); }
  .wordcell.target::after { border: 3px solid var(--wc-accent-teal); }
  /* DESIGN.md WordCell count badge: bottom-right of the card rect, inset 2 px. */
  .count {
    position: absolute; right: 4px; bottom: 2px; box-sizing: border-box;
    min-width: 16px; height: 16px; padding: 0 4px; border-radius: 9999px;
    background: var(--wc-surface-raised); color: var(--wc-ink-primary);
    font: 700 11px/16px system-ui, "Roboto", sans-serif; text-align: center;
    pointer-events: none;
  }
  .check {
    position: absolute; top: 2px; left: 4px; width: 14px; height: 14px; border-radius: 50%;
    background: var(--wc-accent-teal); pointer-events: none;
  }
  .check svg {
    display: block; fill: none; stroke: var(--wc-ink-on-accent); stroke-width: 2;
    stroke-linecap: round; stroke-linejoin: round;
  }
</style>
