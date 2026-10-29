<script lang="ts">
import type { CardId, CellView, Face, GameView } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from './Card.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { inFlight } from './flip';
import { text } from './text';

// DESIGN.md WordCell, build-notes CAP-2: labels 3–10 in the `labelsRow` track, each wordcell-<n> in
// the `cellsRow` track under column n − 2 (A-D7), outside its label (F25). Every cell card is a
// live Card (AD-14) in DOM order bottom → top, stacked; only the top one is visible, except a
// `used` cell's top card, which is live in the tray or strip and drawn here, in Composing only, as
// a used mirror (R-33). In Place a cell the commit changes (`cell.preview`, AD-3, Q-49) is drawn as
// after Confirm instead: its used card gets no element here, the shown top is `preview.top` (a live
// card beneath, or for the target a `preview` mirror of the strip's last tile) with the `★`, the
// empty outline when it is null, and badge and group name from the preview; the cell's other live
// cards stay hidden and silent (the R-65 view still lists `cell.cards`). States come from
// `CellView` and `view.place` (AD-3). Cards are keyed by id plus mirror kind (A9 4.3-m3, AD-14), so
// a live ↔ used or preview switch remounts the node. While a Confirm or Redo flies its cards in
// (flip.ts `inFlight`, epic 5 SPEC CAP-8, F28, E6) the target holds: its base, drawn first, is a
// silent `preview` mirror of its new top without the `★` (the live top is itself the last flying
// card), and the committed cards stay shown over it; the cards before the committed run stay
// hidden, so the cell never looks empty and never shows its previous top. The last landing
// releases the hold: the copy goes and the non-top cards hide together. During a free-letter drag
// (epic 5 SPEC CAP-6, R-61) the controller's `wc-drag-ghost` on the cell draws the 1 px dashed
// ghost at the card rect and the dragged top face takes `wc-drag-layer` as Column's does (literals
// from gestures/classes.ts); the count badge keeps counting the dragged card.
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

type Shown = {
  id: CardId;
  key: string;
  mirror?: 'used' | 'preview';
  hidden: boolean;
  name?: string;
  silent: boolean;
  mark: boolean;
};

// One entry per card element in the cell, bottom → top (the flight hold's copy first).
function shown(cell: CellView, lowest: number): Shown[] {
  const preview = cell.preview;
  if (preview !== undefined) {
    // Q-49: the used card's live element is its strip tile, so the cell draws none of it.
    const live = cell.used ? cell.cards.slice(0, -1) : cell.cards;
    const list: Shown[] = live.map((id) => ({
      id,
      key: `${id}-live`,
      hidden: id !== preview.top,
      silent: true,
      mark: id === preview.top,
    }));
    if (preview.top !== null && !live.includes(preview.top)) {
      list.push({
        id: preview.top,
        key: `preview-${preview.top}`,
        mirror: 'preview',
        hidden: false,
        silent: true,
        mark: true,
      });
    }
    return list;
  }
  const top = cell.cards.length - 1;
  const list: Shown[] = cell.cards.map((id, i) => ({
    id,
    key: `${id}-${i === top && cell.used ? 'used' : 'live'}`,
    mirror: i === top && cell.used ? 'used' : undefined,
    hidden: i !== top && !(lowest >= 0 && i >= lowest),
    name: i === top ? text.nameCellTop((faces[id] as Face).letter, cell.cell) : undefined,
    silent: i !== top,
    mark: false,
  }));
  if (lowest >= 0) {
    // F28, E6: the hold's base, the new top's copy; the `★` went at commit.
    const newTop = cell.cards.at(-1) as CardId;
    list.unshift({
      id: newTop,
      key: `preview-${newTop}`,
      mirror: 'preview',
      hidden: false,
      silent: true,
      mark: false,
    });
  }
  return list;
}

function cellName(cell: CellView): string {
  const preview = cell.preview;
  if (preview !== undefined) {
    return preview.top === null
      ? text.nameCellEmptyAfter(cell.cell)
      : text.nameCellAfter(cell.cell, (faces[preview.top] as Face).letter, preview.count);
  }
  const top = cell.cards.at(-1);
  return top === undefined
    ? text.nameCellEmpty(cell.cell)
    : text.nameCell(cell.cell, (faces[top] as Face).letter, cell.cards.length, cell.used);
}
</script>

{#each cells as cell (cell.cell)}
  {@const target = place?.target === cell.cell}
  {@const lowest = cell.cards.findIndex((id) => inFlight.committed.has(id))}
  {@const count = cell.preview?.count ?? cell.cards.length}
  {@const dim = inPlace && !cell.isLegalTarget && !target}
  <span
    class="label"
    class:wc-dim={dim}
    aria-hidden="true"
    data-wordcell-label={cell.cell}
    style:grid-column={cell.cell - 2}
    style:grid-row={labelsRow}
  >{cell.cell}</span>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="wordcell"
    class:empty={cell.preview === undefined ? cell.cards.length === 0 : cell.preview.top === null}
    class:legal={inPlace && cell.isLegalTarget && !target}
    class:target
    class:wc-dim={dim}
    role="group"
    aria-label={cellName(cell)}
    tabindex="0"
    data-testid="wordcell-{cell.cell}"
    data-wordcell={cell.cell}
    style:grid-column={cell.cell - 2}
    style:grid-row={cellsRow}
  >
    {#each shown(cell, lowest) as card (card.key)}
      <Card
        id={card.id}
        face={faces[card.id] as Face}
        place="cell"
        full
        hidden={card.hidden}
        mirror={card.mirror}
        name={card.name}
        silent={card.silent}
        previewMark={card.mark}
      />
    {/each}
    {#if count >= 2}<span class="count">{count}</span>{/if}
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
    touch-action: var(--wc-pan); user-select: none; -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  .wordcell {
    position: relative; width: var(--wc-slot); height: var(--wc-H);
    touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  }
  /* The not-legal dim (`.wc-dim`) is the shared rule in app.css (DESIGN.md WordCell, R-40). */
  /* DESIGN.md Focus ring (epic 6 CAP-10): each WordCell is one Tab stop; the ring encloses the slot. */
  .wordcell:focus-visible { outline: 2px solid var(--wc-accent-teal); outline-offset: 2px; }
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
    pointer-events: none; touch-action: none; user-select: none; -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  /* DESIGN.md WordCell, Card states dragging and ghost (epic 5 SPEC CAP-6): mid free-letter drag
     the card rect shows a ghost (the cards beneath stay hidden, R-61) and the dragged face rises to
     the drag layer (above the sticky bars 2, the lift 3 and the hover peek's reserved 4, below any
     scrim) with the lift shadow. */
  .wordcell:global(.wc-drag-ghost)::before {
    content: ''; position: absolute; top: 0; left: 2px; box-sizing: border-box;
    width: var(--wc-w); height: var(--wc-H); border: 1px dashed var(--wc-outline);
    border-radius: 6px; pointer-events: none;
  }
  .wordcell :global(.face.wc-drag-layer) { z-index: 5; box-shadow: 0 6px 16px var(--wc-shadow-drag); }
  /* Epic 5 SPEC CAP-8 (DESIGN.md Layer order): a FLIP-gliding face (flip.ts `wc-glide`, literal
     from gestures/classes.ts) rides above the cards and under the sticky bars (2), no shadow. */
  .wordcell :global(.face.wc-glide) { z-index: 1; }
  .check {
    position: absolute; top: 2px; left: 4px; width: 14px; height: 14px; border-radius: 50%;
    background: var(--wc-accent-teal); pointer-events: none;
  }
  .check svg {
    display: block; fill: none; stroke: var(--wc-ink-on-accent); stroke-width: 2;
    stroke-linecap: round; stroke-linejoin: round;
  }
</style>
