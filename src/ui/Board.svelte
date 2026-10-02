<script lang="ts">
import type { GameView } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { game } from '../shell/game.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import ActionBar from './ActionBar.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Column from './Column.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import DictionaryBanner from './DictionaryBanner.svelte';
import { BAND_ORDER, type BandId, type Unit } from './layout/bands';
import { bands, cardMetrics, cardWidth } from './layout/geometry';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import TopBar from './TopBar.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import WordCellRow from './WordCellRow.svelte';

// AD-11 tracer bullet: the Board iterates BAND_ORDER and lays every band out from geometry.ts,
// with the mount inputs read once here until entry 4's live layout replaces them (build-notes
// CAP-1): clientWidth, innerHeight, zero insets, one hover/pointer read, one tray row, no banner.
// The bars and the banner are content-sized; every other band takes its `bands()` height.
let { view }: { view: GameView } = $props();

const insets = { top: 0, bottom: 0 };
const hoverFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const w = cardWidth(document.documentElement.clientWidth, window.innerHeight, insets, hoverFine);
const metrics = cardMetrics(w);
const { heights } = bands(w, BAND_ORDER, 1, false, window.innerHeight, insets);

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
    <div class="banner" data-band="banner"><DictionaryBanner /></div>
  {:else if id === 'tray'}
    <div class="tray" data-band="tray" style:height="{heights.tray}px">
      {#if game.feedback.rejectedWord !== undefined}
        <p class="invalid">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
          <span>{text.invalidWord(game.feedback.rejectedWord)}</span>
        </p>
      {/if}
    </div>
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
>
  <h1 class="sr-only">WordCell</h1>
  {#each BAND_ORDER as unit, u (u)}
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
              cardsRow={row(unit, 'columns')}
              footRow={row(unit, 'footRow')}
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
  .spacer { flex: none; width: var(--wc-board); }
  /* DESIGN.md Dictionary-failed banner: sticky directly under the top bar (entry 4 re-lays it). */
  .banner {
    position: sticky; top: calc(44px + env(safe-area-inset-top)); z-index: 2; flex: none;
    width: var(--wc-board); background: var(--wc-table);
  }
  /* DESIGN.md Tray band: reserved height in every phase; the invalid-word line in the word-line
     position until entry 3's Tray. */
  .tray {
    flex: none; box-sizing: border-box; width: var(--wc-board); padding: 8px;
    background: var(--wc-surface); border-radius: 12px;
  }
  .invalid {
    display: flex; align-items: center; gap: 6px; margin: 0;
    font: 400 16px/24px system-ui, "Roboto", sans-serif; color: var(--wc-error);
  }
  .invalid svg { flex: none; fill: none; stroke: var(--wc-error); stroke-width: 2.5; stroke-linecap: round; }
  .invalid span { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
</style>
