<script lang="ts">
import type { ColumnView, DraftView, Face, Phase } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from './Card.svelte';
import type { TailSelection } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// AD-12 column hit rect: the whole slot, a grid item spanning its unit's rows (subgrid), with the
// fanned cards in the `cardsRow` track and the foot pad in the `footRow` track (build-notes CAP-1,
// CAP-4). The placeholder is always rendered in the top slot and shown only when the column is
// empty, or in Composing under the S ghosts when the emptied source is the destination (DESIGN.md
// Column slot, Card ghost). Ghosts and destination style come from membership in `draft.source` /
// `draft.destination` (AD-3, AD-14): S slots are ghosts in Composing and Place, D slots are live
// in destination style in Composing and ghosts in Place.
// Entry 7 (SPEC CAP-6, DESIGN.md Column slot, Card states, Elevation & Depth): a tap-selected tail
// lifts its faces (F26) inside one teal outline; the source foot shows `Here` on surface-raised,
// the other feet the wash and dashed border, and every foot is `touch-action: none` (AD-11 row).
// Desktop hover classes are toggled on the column element by the controller (never Svelte state);
// this component's CSS maps them to the right child.
let {
  column,
  faces,
  draft,
  phase,
  cardsRow,
  footRow,
  selection,
}: {
  column: ColumnView;
  faces: readonly Face[];
  draft: DraftView | undefined;
  phase: Phase;
  cardsRow: number;
  footRow: number;
  selection: TailSelection | null;
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
const source = $derived(selection?.column === column.column);
const count = $derived(source && selection !== null ? selection.count : 0);
/** Index of the first lifted card; the column length when this is not the source. */
const liftStart = $derived(column.cards.length - count);
</script>

<div
  class="column"
  data-testid="column-{column.column}"
  data-column={column.column}
  style:grid-column={column.column}
>
  <div
    class="cards"
    style:grid-row={cardsRow}
    style:--wc-len={column.cards.length}
    style:--wc-lift-start={liftStart}
    style:--wc-lift={source ? '8px' : '0px'}
  >
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
        lifted={i >= liftStart}
        remainderTop={source && i === liftStart - 1}
      />
    {/each}
    {#if source}
      <div
        class="selection-outline"
        data-selection-outline
        style:top="calc({liftStart} * var(--wc-strip) - 8px)"
        style:height="calc({count - 1} * var(--wc-strip) + var(--wc-H))"
      ></div>
    {/if}
    <div class="hover-outline"></div>
  </div>
  <div
    class="foot"
    class:selecting={selection !== null}
    class:source
    class:target={selection !== null && !source}
    class:whole={source && liftStart === 0}
    data-testid="foot-{column.column}"
    data-foot={column.column}
    style:grid-row={footRow}
  >
    {#if selection === null}
      <span class="number">{column.column}</span>
    {:else if source}
      <span class="here">{text.here}</span>
    {/if}
  </div>
</div>

<style>
  /* DESIGN.md Scrolling: the column background and its foot pad pan (cards set none); the hit
     rect is unchanged (AD-12). The foot row is none while a tail is selected (entry 7). */
  .column {
    grid-row: 1 / -1; display: grid; grid-template-rows: subgrid; min-width: 0;
    touch-action: var(--wc-pan);
  }
  .cards { position: relative; display: flex; flex-direction: column; }
  .placeholder {
    position: absolute; top: 0; left: 2px; box-sizing: border-box;
    width: var(--wc-w); height: var(--wc-H);
    border: 2px dashed var(--wc-outline); border-radius: 6px; visibility: hidden;
  }
  .placeholder.shown { visibility: visible; }
  .foot {
    display: grid; place-items: center; touch-action: var(--wc-pan);
    user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  }
  .foot.selecting { touch-action: none; }
  /* DESIGN.md Column slot: the column number only under (hover: hover) and (pointer: fine), and
     only while nothing is selected; with a tail selected the source foot is the `Here` pad on
     surface-raised (every device), the other feet an 8 % teal wash and a 1 px dashed border. */
  .number { display: none; font: 500 14px/20px system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary); }
  @media (hover: hover) and (pointer: fine) {
    .number { display: inline; }
  }
  .foot.source { background: var(--wc-surface-raised); }
  .here { font: 500 14px/20px system-ui, "Roboto", sans-serif; color: var(--wc-ink-primary); }
  .foot.target {
    box-sizing: border-box; border: 1px dashed var(--wc-outline);
    background: color-mix(in srgb, var(--wc-accent-teal) 8%, transparent);
  }

  /* DESIGN.md Card selected / Focus ring: one 2 px teal outline around the lifted faces' union. */
  .selection-outline {
    position: absolute; left: 2px; width: var(--wc-w); z-index: 3; pointer-events: none;
    box-sizing: border-box; outline: 2px solid var(--wc-accent-teal); border-radius: 6px;
  }

  /* DESIGN.md Card states, hover (desktop only): classes the controller sets on the column. The
     tail outline runs from `--wc-hover-from` to the bottom card, following any lift. */
  .hover-outline {
    display: none; position: absolute; left: 2px; width: var(--wc-w); z-index: 3;
    pointer-events: none; box-sizing: border-box; border-radius: 6px;
    outline: 1px solid var(--wc-accent-teal);
    --lifted: clamp(0, calc(var(--wc-hover-from, 0) - var(--wc-lift-start) + 1), 1);
    top: calc(var(--wc-hover-from, 0) * var(--wc-strip) - var(--lifted) * var(--wc-lift));
    height: calc(
      (var(--wc-len) - 1 - var(--wc-hover-from, 0)) * var(--wc-strip) + var(--wc-H)
        - var(--wc-lift) + var(--lifted) * var(--wc-lift)
    );
  }
  @media (hover: hover) and (pointer: fine) {
    .column:global(.wc-hover-tail) .hover-outline { display: block; }
    .column:global(.wc-grab) .cards :global(.card) { cursor: grab; }
    .column:global(.wc-drop) .cards :global(.card.full) > :global(.face),
    .column:global(.wc-drop) .placeholder.shown,
    .column:global(.wc-drop-self) .cards :global(.remainder-top) > :global(.face),
    .column:global(.wc-drop-self) .foot.whole {
      outline: 3px solid var(--wc-accent-teal);
      background-image: linear-gradient(
        color-mix(in srgb, var(--wc-accent-teal) 12%, transparent),
        color-mix(in srgb, var(--wc-accent-teal) 12%, transparent)
      );
    }
    .column:global(.wc-drop-self) .foot.whole { outline-offset: -3px; }
  }
</style>
