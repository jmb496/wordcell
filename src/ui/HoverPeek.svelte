<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import type { CellView, Face, GameView } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from './Card.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { hoverPeekCards, hoverPeekWidth, placeHoverPeek } from './hover-peek';
import type { Layout } from './layout/layout.svelte';
import { overlays } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// Entry 12 (SPEC CAP-9, F19, F27; DESIGN.md View sheet, Layer order): the desktop hover peek,
// rendered while `overlays.hoverPeek` is set. The view sheet's surface with no title, no scrim
// and no transition; the top 14 of `CellView.cards` as `view` mirrors (AD-14), oldest first, the
// top tagged; the older-cards line above them only above 14 cards. `aria-hidden` (the sticky view
// is the accessible path, R-65) and `pointer-events: none` (it takes no clicks). Positioned in
// `.board-root` (its containing block): x is board-column-relative (`placeHoverPeek`) plus the
// column's left edge in CSS (`.board` centres its column with `safe center`); y comes from an
// effect that measures the rendered root, the cell's label and the cell and re-places on every
// layout change while open. The controller hides it with `wc-hover-peek-hidden` during a pick-up
// drag (DOM only, AD-12).
let { view, layout }: { view: GameView; layout: Layout } = $props();

let root: HTMLElement | null = $state(null);
let placed: { x: number; y: number } | null = $state(null);

function cellOf(n: number): CellView {
  const cell = view.cells.find((c) => c.cell === n);
  if (cell === undefined) throw new Error(`AD-13 hover peek of unknown cell ${n}`);
  return cell;
}

function rectIn(base: Element, selector: string): DOMRect {
  const el = base.querySelector(selector);
  if (el === null) throw new Error(`AD-12 hover peek without ${selector}`);
  return el.getBoundingClientRect();
}

$effect(() => {
  const n = overlays.hoverPeek;
  if (n === null || root === null) {
    placed = null;
    return;
  }
  // Re-placed on any layout change (w, band heights, banner) and on the cell's count.
  void layout.w;
  void layout.heights;
  void layout.bannerShown;
  const slot = layout.metrics.slot;
  void cellOf(n).cards.length;
  const base = root.parentElement;
  if (base === null) throw new Error('AD-12 hover peek outside .board-root');
  const top = base.getBoundingClientRect().top;
  const box = root.getBoundingClientRect();
  placed = placeHoverPeek({
    cell: n,
    slot,
    width: box.width,
    height: box.height,
    labelTop: rectIn(base, `[data-wordcell-label="${n}"]`).top - top,
    cellBottom: rectIn(base, `[data-wordcell="${n}"]`).bottom - top,
    boardTop: rectIn(base, '.board').top - top,
  });
});
</script>

{#if overlays.hoverPeek !== null}
  {@const cell = cellOf(overlays.hoverPeek)}
  {@const { shown, older } = hoverPeekCards(cell.cards)}
  <div
    bind:this={root}
    class="hover-peek"
    data-hover-peek
    aria-hidden="true"
    style:width="{hoverPeekWidth(shown.length, layout.metrics.slot)}px"
    style:left="calc(max(0px, (100% - var(--wc-board)) / 2) + {placed?.x ?? 0}px)"
    style:top="{placed?.y ?? 0}px"
    style:visibility={placed === null ? 'hidden' : undefined}
  >
    {#if older > 0}<p class="older">{text.olderCards(older)}</p>{/if}
    <div class="grid">
      {#each shown as id, i (id)}
        <Card
          {id}
          face={view.faces[id] as Face}
          place="view"
          mirror="view"
          full
          topTag={i === shown.length - 1}
        />
      {/each}
    </div>
  </div>
{/if}

<style>
  /* DESIGN.md layer order: above the sticky bars (z 2) and lifted faces (z 3), below the drag
     layer (z 5). */
  .hover-peek {
    position: absolute; z-index: 4; box-sizing: border-box; padding: 16px;
    background: var(--wc-surface); border-radius: 20px; pointer-events: none;
    user-select: none; -webkit-user-select: none;
  }
  .older {
    margin: 0 0 8px;
    font: 500 14px/20px system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary);
  }
  /* As WordCellView: each card is a slot (w + 4) wide with its face inset 2 px. */
  .grid { display: flex; flex-wrap: wrap; row-gap: 4px; margin: 0 -2px; }
  :global(.wc-hover-peek-hidden) { visibility: hidden; }
</style>
