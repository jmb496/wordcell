<script lang="ts">
import type { ColumnView, DraftView, Face, Phase } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from './Card.svelte';

// AD-12 column hit rect: the whole slot, a grid item spanning its unit's rows (subgrid), with the
// fanned cards in the `cardsRow` track and the foot pad in the `footRow` track (build-notes CAP-1,
// CAP-4). The placeholder is always rendered in the top slot and shown only when the column is
// empty, or in Composing under the S ghosts when the emptied source is the destination (DESIGN.md
// Column slot, Card ghost). Ghosts and destination style come from membership in `draft.source` /
// `draft.destination` (AD-3, AD-14): S slots are ghosts in Composing and Place, D slots are live
// in destination style in Composing and ghosts in Place.
let {
  column,
  faces,
  draft,
  phase,
  cardsRow,
  footRow,
}: {
  column: ColumnView;
  faces: readonly Face[];
  draft: DraftView | undefined;
  phase: Phase;
  cardsRow: number;
  footRow: number;
} = $props();

const last = $derived(column.cards.length - 1);
const inSource = (id: number) => draft?.source.includes(id) === true;
const inDestination = (id: number) => draft?.destination.includes(id) === true;
const placeholder = $derived(
  column.cards.length === 0 ||
    (phase === 'composing' &&
      draft?.sourceColumn === column.column &&
      draft.destinationColumn === column.column &&
      column.cards.every(inSource)),
);
</script>

<div
  class="column"
  data-testid="column-{column.column}"
  data-column={column.column}
  style:grid-column={column.column}
>
  <div class="cards" style:grid-row={cardsRow}>
    <div class="placeholder" class:shown={placeholder}></div>
    {#each column.cards as id, i (id)}
      {@const ghost = inSource(id) || (phase === 'place' && inDestination(id))}
      <Card
        {id}
        face={faces[id] as Face}
        place="column"
        full={i === last}
        mirror={ghost ? 'ghost' : undefined}
        destination={phase === 'composing' && inDestination(id)}
      />
    {/each}
  </div>
  <div class="foot" data-testid="foot-{column.column}" data-foot={column.column} style:grid-row={footRow}>
    <span class="number">{column.column}</span>
  </div>
</div>

<style>
  .column { grid-row: 1 / -1; display: grid; grid-template-rows: subgrid; min-width: 0; }
  .cards { position: relative; display: flex; flex-direction: column; }
  .placeholder {
    position: absolute; top: 0; left: 2px; box-sizing: border-box;
    width: var(--wc-w); height: var(--wc-H);
    border: 2px dashed var(--wc-outline); border-radius: 6px; visibility: hidden;
  }
  .placeholder.shown { visibility: visible; }
  .foot { display: grid; place-items: center; }
  /* DESIGN.md Column slot: the column number only under (hover: hover) and (pointer: fine). */
  .number { display: none; font: 500 14px/20px system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary); }
  @media (hover: hover) and (pointer: fine) {
    .number { display: inline; }
  }
</style>
