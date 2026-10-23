<script lang="ts">
import type { ColumnView, DraftView, Face, Phase } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from './Card.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { dropTarget } from './gestures/drop-target';
import type { TailSelection } from './overlays.svelte';
import { roving } from './roving.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// AD-12 column hit rect: the whole slot, a grid item spanning its unit's rows (subgrid), with the
// fanned cards in the `cardsRow` track and the foot pad in the `footRow` track
// (epic 4 build-notes CAP-1, epic 4 build-notes CAP-4). The placeholder is always rendered in the
// top slot and shown only when the column is empty, or in Composing under the S ghosts when the
// emptied source is the destination (DESIGN.md Column slot, Card ghost). Ghosts and destination
// style come from membership in `draft.source` / `draft.destination` (AD-3, AD-14): S slots are
// ghosts in Composing and Place, D slots are live in destination style in Composing and ghosts in
// Place. Cards are keyed by id plus mirror kind, so a live ↔ ghost switch remounts the node instead
// of moving `data-card-id` onto a mirror (epic 5 SPEC CAP-1, A9 4.3-m3, AD-14).
// Selection (epic 4 SPEC CAP-6; DESIGN.md Column slot, Card states, Elevation & Depth): a
// tap-selected tail lifts its faces (epic 4 SPEC F26) inside one teal outline; the source foot
// shows `Here` on surface-raised, the other feet the wash and dashed border, and every foot is
// `touch-action: none` (AD-11 row). Desktop hover classes are toggled on the column element by the
// controller (never Svelte state); this component's CSS maps them to the right child.
// Drag (epic 4 SPEC CAP-7; DESIGN.md Card states dragging / drop target / ghost, Layer order): the
// whole slot registers as a drop target; during a drag the controller adds `wc-drag-ghost` to the
// tail's slot wrappers (a dashed ghost drawn by `::before`, the face keeping its fill),
// `wc-drag-layer` to their faces (above the bars, the lift and the hover peek, below the scrim) and
// `wc-drag-target` to the target's bottom card, placeholder (revealed) or the card above a partial
// tail, in every media context. Svelte toggles its own class directives with `classList`, so these
// survive re-renders. While a drag replaces a selection (epic 4 SPEC CAP-4, epic 4 SPEC CAP-7,
// epic 4 SPEC F12, epic 4 SPEC F24) the controller puts `wc-selection-suppressed` on App's
// `<main>`; under it the old selection's lift, outline, `Here` and every foot's source/target paint
// are cancelled (visual properties only: hit rects and the foot row's `touch-action` stay, AD-11,
// AD-12); dragged faces are never affected.
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
/** S slots in Composing and Place, D slots in Place (DESIGN.md Card ghost). */
const isGhost = (id: number) => inSource(id) || (phase === 'place' && inDestination(id));
const placeholder = $derived(
  column.cards.length === 0 ||
    (phase === 'composing' &&
      draft?.sourceColumn === column.column &&
      draft.destinationColumn === column.column &&
      column.cards.every(inSource)),
);
// Epic 6 CAP-10 (6.11): the column is one Tab stop, its last-focused live card, else the bottom one.
const live = $derived(column.cards.filter((id) => !isGhost(id)));
const remembered = $derived(roving.column(column.column));
const stop = $derived(
  remembered !== undefined && live.includes(remembered) ? remembered : live.at(-1),
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
  use:dropTarget={{ kind: 'column', id: column.column }}
>
  <div
    class="cards"
    style:grid-row={cardsRow}
    style:--wc-len={column.cards.length}
    style:--wc-lift-start={liftStart}
    style:--wc-lift={source ? 'var(--wc-select-lift)' : '0px'}
  >
    <div class="placeholder" class:shown={placeholder} data-placeholder></div>
    {#each column.cards as id, i (`${id}-${isGhost(id) ? 'ghost' : 'live'}`)}
      {@const ghost = isGhost(id)}
      <Card
        {id}
        face={faces[id] as Face}
        place="column"
        full={i === last}
        mirror={ghost ? 'ghost' : undefined}
        destination={phase === 'composing' && inDestination(id)}
        lifted={i >= liftStart}
        remainderTop={source && i === liftStart - 1}
        stop={id === stop}
        onfocus={() => roving.focusedColumn(column.column, id)}
        name={ghost
          ? undefined
          : text.nameColumnCard(
              (faces[id] as Face).letter,
              column.column,
              i + 1,
              column.cards.length,
              i >= liftStart,
              phase === 'composing' && inDestination(id),
            )}
      />
    {/each}
    {#if source}
      <div
        class="selection-outline"
        data-selection-outline
        style:top="calc({liftStart} * var(--wc-strip) - var(--wc-select-lift))"
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
    role="group"
    aria-label={source ? text.nameFootSource(column.column) : text.nameFoot(column.column)}
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
  /* The controller's class names and `--wc-hover-*` properties below are literals of
     gestures/classes.ts (CSS cannot import it): change both together. */
  /* DESIGN.md Scrolling: the column background and its foot pad pan (cards set none); the hit
     rect is unchanged (AD-12). The foot row is none while a tail is selected (epic 4 SPEC
     CAP-6). */
  .column {
    grid-row: 1 / -1; display: grid; grid-template-rows: subgrid; min-width: 0;
    touch-action: var(--wc-pan);
    /* DESIGN.md Card states: the 12 % teal drop wash, the one declaration every drop target below
       (card faces, the placeholder, the foot) inherits. */
    --drop-wash: linear-gradient(
      color-mix(in srgb, var(--wc-accent-teal) 12%, transparent),
      color-mix(in srgb, var(--wc-accent-teal) 12%, transparent)
    );
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
     tail outline runs from `--wc-hover-from` to the bottom card, following any lift. The k
     preview (epic 4 SPEC CAP-8): `--wc-hover-len` (the remainder length) ends it at the
     remainder's bottom card, never over a self-drop's S ghosts. */
  .hover-outline {
    display: none; position: absolute; left: 2px; width: var(--wc-w); z-index: 3;
    pointer-events: none; box-sizing: border-box; border-radius: 6px;
    outline: 1px solid var(--wc-accent-teal);
    --lifted: clamp(0, calc(var(--wc-hover-from, 0) - var(--wc-lift-start) + 1), 1);
    top: calc(var(--wc-hover-from, 0) * var(--wc-strip) - var(--lifted) * var(--wc-lift));
    height: calc(
      (var(--wc-hover-len, var(--wc-len)) - 1 - var(--wc-hover-from, 0)) * var(--wc-strip) + var(--wc-H)
        - var(--wc-lift) + var(--lifted) * var(--wc-lift)
    );
  }
  @media (hover: hover) and (pointer: fine) {
    .column:global(.wc-hover-tail) .hover-outline { display: block; }
    .column:global(.wc-grab) .cards :global(.card) { cursor: grab; }
    /* A card face keeps its theme texture under the wash (owner decision D4, 2026-10-22). */
    .column:global(.wc-drop) .cards :global(.card.full) > :global(.face),
    .column:global(.wc-drop-self) .cards :global(.remainder-top) > :global(.face) {
      outline: 3px solid var(--wc-accent-teal);
      background-image: var(--drop-wash), var(--wc-card-texture);
    }
    .column:global(.wc-drop) .placeholder.shown,
    .column:global(.wc-drop-self) .foot.whole {
      outline: 3px solid var(--wc-accent-teal);
      background-image: var(--drop-wash);
    }
    .column:global(.wc-drop-self) .foot.whole { outline-offset: -3px; }
  }

  /* DESIGN.md Card states, dragging and ghost (epic 4 SPEC CAP-7): the old slot draws a ghost the
     size and inset of Card's ghost face; the dragged face keeps its fill, raised to the drag layer
     (above the sticky bars 2, the lift 3 and the hover peek's reserved 4, below any scrim) with the
     lift shadow. Every media context. */
  .cards :global(.card.wc-drag-ghost) { position: relative; }
  .cards :global(.card.wc-drag-ghost)::before {
    content: ''; position: absolute; top: 0; left: 2px; box-sizing: border-box;
    width: var(--wc-w); height: var(--wc-H); border: 1px dashed var(--wc-outline);
    border-radius: 6px; pointer-events: none;
  }
  /* Epic 4 SPEC F24: a selection being replaced by a drag shows no lift, outline, `Here` or foot
     state. */
  :global(main.wc-selection-suppressed) .cards :global(.card.lifted) > :global(.face:not(.wc-drag-layer)) {
    transform: none; box-shadow: none; z-index: auto;
  }
  :global(main.wc-selection-suppressed) .selection-outline { display: none; }
  :global(main.wc-selection-suppressed) .foot.source { background: none; }
  :global(main.wc-selection-suppressed) .here { visibility: hidden; }
  :global(main.wc-selection-suppressed) .foot.target { border-color: transparent; background: none; }
  .cards :global(.face.wc-drag-layer) { z-index: 5; box-shadow: 0 6px 16px var(--wc-shadow-drag); }
  /* Epic 5 SPEC CAP-8 (DESIGN.md Layer order): a FLIP-gliding face (flip.ts `wc-glide`, literal
     from gestures/classes.ts) rides above the cards and under the sticky bars (2), no shadow. */
  .cards :global(.face.wc-glide) { z-index: 1; }
  /* DESIGN.md Card states, drop target under a drag: 3 px teal outline and 12 % teal wash, over
     the card face's theme texture (owner decision D4, 2026-10-22). */
  .cards :global(.card.wc-drag-target) > :global(.face) {
    visibility: visible;
    outline: 3px solid var(--wc-accent-teal);
    background-image: var(--drop-wash), var(--wc-card-texture);
  }
  .placeholder:global(.wc-drag-target) {
    visibility: visible;
    outline: 3px solid var(--wc-accent-teal);
    background-image: var(--drop-wash);
  }
</style>
