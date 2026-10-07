<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import type { CellView, Face, GameView } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from './Card.svelte';
import { overlays } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// Entry 11 (SPEC CAP-9, R-65, F14, F27; DESIGN.md WordCell view, Elevation & Depth): the long-press
// peek and the sticky view render this one sheet over a full-viewport scrim, from the overlays
// store (`peek ?? viewCell`); `peekToSticky` changes only `data-mode`. The sheet lists
// `CellView.cards` bottom first, the top last and tagged `top`, as `view` mirrors (AD-14). The
// controller reads `[data-view-scroll]` at a long-press release (overflow → sticky) and classifies
// presses on `[data-view-scrim]` and `[data-view-sheet]` itself: neither carries a click handler.
// No transition (SPEC Non-goals), so the release-time overflow read sees the settled sheet.
let { view }: { view: GameView } = $props();

const open = $derived(overlays.peek ?? overlays.viewCell);

function cellOf(n: number): CellView {
  const cell = view.cells.find((c) => c.cell === n);
  if (cell === undefined) throw new Error(`AD-13 WordCell view of unknown cell ${n}`);
  return cell;
}
</script>

{#if open !== null}
  {@const cell = cellOf(open)}
  {@const title = text.viewTitle(cell.cell, cell.cards.length)}
  <div class="scrim" data-view-scrim></div>
  <div
    class="sheet"
    data-view-sheet
    role="dialog"
    aria-label={title}
    data-mode={overlays.peek !== null ? 'peek' : 'sticky'}
  >
    <h2 class="title">{title}</h2>
    <div class="scroll" data-view-scroll>
      <div class="grid">
        {#each cell.cards as id, i (id)}
          <Card
            {id}
            face={view.faces[id] as Face}
            place="view"
            mirror="view"
            full
            topTag={i === cell.cards.length - 1}
          />
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  /* DESIGN.md layer order: scrim and overlay above the bars (z 2), lifted faces (z 3) and the drag
     layer (z 5). */
  .scrim {
    position: fixed; inset: 0; z-index: 10; background: var(--wc-scrim); touch-action: none;
  }
  .sheet {
    position: fixed; left: 50%; top: 50%; z-index: 11; transform: translate(-50%, -50%);
    box-sizing: border-box; width: var(--wc-board); max-height: 80dvh;
    display: flex; flex-direction: column;
    background: var(--wc-surface); border-radius: 20px; overflow: hidden;
    touch-action: pan-y; overscroll-behavior: contain;
    user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  }
  .title {
    flex: none; margin: 0; padding: 16px 16px 8px;
    font: 600 1.25rem/1.75rem system-ui, "Roboto", sans-serif; color: var(--wc-ink-primary);
  }
  .scroll {
    flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
    padding: 0 16px 16px; touch-action: pan-y;
  }
  /* Cards per row = floor((inner width + 4) ÷ (card width + 4)): each card is a slot (w + 4) wide
     with its face inset 2 px, so the row spans the inner width plus 2 px each side. */
  .grid { display: flex; flex-wrap: wrap; row-gap: 4px; margin: 0 -2px; }
</style>
