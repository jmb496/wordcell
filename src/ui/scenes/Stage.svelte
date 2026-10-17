<script lang="ts">
import type { Snippet } from 'svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from '../Card.svelte';
import {
  CARD_H,
  CARD_W,
  COLUMN_AREA_H,
  COLUMNS,
  columnX,
  LABELS_TOP,
  placeCellX,
  RICH_INSET,
  SLOT,
  STAGE_H,
  STAGE_W,
  STRIP,
  TRAY_H,
  TRAY_TOP,
} from './geometry';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { face } from './stage';

// Epic 8 ticket 6 (HP-1, HP-6; DESIGN.md Layout, AD-11, AD-14): the shared stage draws the whole
// play area as the game does, in BAND_ORDER's order: eight columns (filler on the far end, then the
// scene's cards), the foot row, the tray with its empty word strip, and the WordCell labels with
// WordCells 3 to 10. It is authored at the scene base slot and scaled by the fitted card width. Cards
// are static (none of data-card-id, data-testid, data-place or data-mirror-of); the stage is
// aria-hidden, outside FLIP, and reads no GameView (AD-3). The scene's own layers go in `children`.
interface Props {
  /** Each column's scripted cards still drawn (letters, far end first); missing columns are empty. */
  columns: readonly (readonly string[])[];
  /** Each of the eight columns' filler letters (stage.ts `fillerColumns`). */
  filler: readonly (readonly string[])[];
  /** WordCell stacks by number (bottom to top); absent: the scene draws the band itself. */
  cells: Readonly<Record<string, readonly string[]>> | undefined;
  scale: number;
  children: Snippet;
}
const { columns, filler, cells, scale, children }: Props = $props();
const CELL_NUMBERS = [3, 4, 5, 6, 7, 8, 9, 10] as const;
const COLUMN_NUMBERS = Array.from({ length: COLUMNS }, (_, i) => i + 1);
// The geometry for the markup (Biome reads script usage only).
const geo = {
  cardH: CARD_H,
  cardW: CARD_W,
  columnH: COLUMN_AREA_H,
  labelsTop: LABELS_TOP,
  inset: RICH_INSET,
  slot: SLOT,
  stageH: STAGE_H,
  stageW: STAGE_W,
  strip: STRIP,
  trayH: TRAY_H,
  trayTop: TRAY_TOP,
  columnX,
  placeCellX,
};
</script>

<div
  class="stage"
  aria-hidden="true"
  data-scene-el="stage"
  style:width="{geo.stageW}px"
  style:height="{geo.stageH}px"
  style:transform="scale({scale})"
  style:--wc-w="{geo.cardW}px"
  style:--wc-slot="{geo.slot}px"
  style:--wc-H="{geo.cardH}px"
  style:--wc-strip="{geo.strip}px"
>
  {#each COLUMN_NUMBERS as column (column)}
    {@const cards = [...(filler[column - 1] ?? []), ...(columns[column - 1] ?? [])]}
    <div class="column" data-column={column} style:left="{geo.columnX(column)}px" style:height="{geo.columnH}px">
      {#each cards as letter, j (j)}
        <Card id={0} face={face(letter)} place="column" mirror="static" full={j === cards.length - 1} />
      {/each}
    </div>
  {/each}
  <div class="tray-frame" style:top="{geo.trayTop}px" style:height="{geo.trayH}px">
    <div class="word-strip" style:left="{geo.inset}px" style:width="{geo.stageW - 2 * geo.inset}px"></div>
  </div>
  {#if cells !== undefined}
    {#each CELL_NUMBERS as cell (cell)}
      {@const cards = cells[String(cell)] ?? []}
      <div class="cell" data-cell={cell} style:left="{geo.placeCellX(cell)}px" style:top="{geo.labelsTop}px">
        <span class="num">{cell}</span>
        <div class="mini" class:empty={cards.length === 0}>
          {#each cards as letter, j (j)}
            <Card id={0} face={face(letter)} place="column" mirror="static" full={j === cards.length - 1} />
          {/each}
        </div>
      </div>
    {/each}
  {/if}
  {@render children()}
</div>

<style>
  .stage {
    position: relative; overflow: hidden; border-radius: 8px; transform-origin: 0 0;
    background: var(--wc-surface-raised);
  }
  .column { position: absolute; top: 0; width: var(--wc-slot); display: flex; flex-direction: column; }
  .tray-frame {
    position: absolute; left: 0; right: 0; box-sizing: border-box;
    border-top: 1px solid var(--wc-outline); border-bottom: 1px solid var(--wc-outline);
  }
  .word-strip {
    position: absolute; top: 3px; height: var(--wc-H); box-sizing: border-box;
    border: 2px dashed var(--wc-outline); border-radius: 6px;
  }
  .cell { position: absolute; width: var(--wc-slot); }
  .num {
    display: block; text-align: center; font: 600 11px/16px system-ui, "Roboto", sans-serif;
    color: var(--wc-ink-secondary);
  }
  .mini { position: relative; display: flex; flex-direction: column; }
  .mini.empty { height: var(--wc-H); }
  .mini.empty::before {
    content: ''; position: absolute; top: 0; left: 2px; box-sizing: border-box;
    width: var(--wc-w); height: var(--wc-H); border-radius: 6px; border: 2px solid var(--wc-outline);
  }
</style>
