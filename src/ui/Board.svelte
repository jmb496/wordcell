<script lang="ts">
import type { GameView } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import ActionBar from './ActionBar.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Column from './Column.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import DictionaryBanner from './DictionaryBanner.svelte';
import type { BandId, Unit } from './layout/bands';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { SELECTION_LIFT_PX } from './layout/geometry';
import type { Layout } from './layout/layout.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { overlays } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import TopBar from './TopBar.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Tray from './Tray.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import WordCellRow from './WordCellRow.svelte';

// AD-11: the Board iterates the live layout's band order and lays every band out from its getters
// (w, metrics, wide, heights, bandOrder, the gate-latched bannerShown; build-notes CAP-1, CAP-3,
// F20). The bars and the banner are content-sized; every other band takes its `bands()` height.
// DESIGN.md Scrolling: `--wc-pan` is the non-card regions' touch-action (`pan-x pan-y` when wide);
// the Board itself and its units set no touch-action (they compute `auto`).
let { view, layout }: { view: GameView; layout: Layout } = $props();

const w = $derived(layout.w);
const metrics = $derived(layout.metrics);
const heights = $derived(layout.heights);

// Units whose bands are row tracks of one CSS grid (F22: the column hit rect spans its foot pad;
// the labels sit above the WordCells outside [data-wordcell]).
const GRID_UNITS: readonly BandId[] = ['columns', 'wordcells'];

function gridUnit(unit: Unit): boolean {
  return unit.some((band) => GRID_UNITS.includes(band));
}

function row(unit: Unit, band: BandId): number {
  return unit.indexOf(band) + 1;
}
</script>

{#snippet band(id: BandId)}
  {#if id === 'topBar'}
    <TopBar {view} />
  {:else if id === 'banner'}
    <div class="banner" data-band="banner">{#if layout.bannerShown}<DictionaryBanner />{/if}</div>
  {:else if id === 'tray'}
    <Tray {view} {w} innerWidth={metrics.board - 16} height={heights.tray} />
  {:else if id === 'actionBar'}
    <ActionBar {view} />
  {:else}
    <div class="spacer" data-band={id} style:height="{heights[id]}px"></div>
  {/if}
{/snippet}

<div
  class="board"
  style:--wc-w="{w}px"
  style:--wc-H="{metrics.H}px"
  style:--wc-strip="{metrics.strip}px"
  style:--wc-slot="{metrics.slot}px"
  style:--wc-board="{metrics.board}px"
  style:--wc-pan={layout.wide ? 'pan-x pan-y' : 'pan-y'}
  style:--wc-select-lift="{SELECTION_LIFT_PX}px"
>
  <h1 class="sr-only">WordCell</h1>
  {#each layout.bandOrder as unit, u (u)}
    {#if gridUnit(unit)}
      <div class="unit" style:grid-template-rows={unit.map((b) => `${heights[b]}px`).join(' ')}>
        {#each unit as id, i (id)}
          <div class="track" data-band={id} style:grid-row={i + 1}></div>
        {/each}
        {#if unit.includes('columns')}
          {#each view.columns as column (column.column)}
            <Column
              {column}
              faces={view.faces}
              draft={view.draft}
              phase={view.phase}
              cardsRow={row(unit, 'columns')}
              footRow={row(unit, 'footRow')}
              selection={overlays.selection}
            />
          {/each}
        {:else}
          <WordCellRow
            cells={view.cells}
            faces={view.faces}
            place={view.place}
            labelsRow={row(unit, 'labels')}
            cellsRow={row(unit, 'wordcells')}
          />
        {/if}
      </div>
    {:else}
      {#each unit as id (id)}
        {@render band(id)}
      {/each}
    {/if}
  {/each}
</div>

<style>
  .board {
    display: flex; flex-direction: column; align-items: safe center;
    width: 100%; min-height: 100dvh;
  }
  .sr-only {
    position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
  .unit {
    flex: none; display: grid; grid-template-columns: repeat(8, var(--wc-slot));
    width: var(--wc-board);
  }
  .track { grid-column: 1 / -1; pointer-events: none; }
  .spacer { flex: none; width: var(--wc-board); touch-action: var(--wc-pan); }
  /* DESIGN.md Dictionary-failed banner: sticky directly under the top bar's DESIGN.md 44 px (F22
     exception, plan-recorded); its background pans, Reload sets none. */
  .banner {
    position: sticky; top: calc(44px + env(safe-area-inset-top)); z-index: 2; flex: none;
    width: var(--wc-board); background: var(--wc-table); touch-action: var(--wc-pan);
  }
</style>
