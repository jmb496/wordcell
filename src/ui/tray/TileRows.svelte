<script lang="ts">
import type { CardId, Face } from '../../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from '../Card.svelte';
import { type TrayTile, trayLayout } from '../layout/tray';

// Epic 5 entry 1 tile rows (DESIGN.md Tray band, Tile; moved from the F2 static tray): a CSS grid
// of tile-pitch `Card`s sized by `trayLayout`. Composing: live S and free-letter tiles (place
// `tray`) with the D-block mirrors joined per row segment (one outline and one lock each); a
// free-letter tile carries its origin-cell `tag` in card mode only (compact marks are entry 2).
// Place: live strip tiles (place `strip`). The tile area keeps the reserved height and clips
// (F2). Keys stay `${id}-${mirror}` (AD-14: a live ↔ mirror switch remounts).
let {
  tiles,
  faces,
  strip,
  tags,
  w,
  innerWidth,
}: {
  tiles: readonly TrayTile[];
  faces: readonly Face[];
  strip: boolean;
  /** Free-letter origin cell per live tile (Composing). */
  tags: ReadonlyMap<CardId, number>;
  w: number;
  innerWidth: number;
} = $props();

const sizing = $derived(trayLayout(tiles.length, w, innerWidth));
const pitch = $derived(sizing.tileWidth + 4);

// A D-block row segment starts at the block's first tile or a row start, and ends likewise.
function segment(i: number): { start: boolean; end: boolean } {
  return {
    start: i % sizing.perRow === 0 || tiles[i - 1]?.mirror !== true,
    end: (i + 1) % sizing.perRow === 0 || tiles[i + 1]?.mirror !== true,
  };
}
</script>

<div
  class="tiles"
  class:compact={sizing.mode === 'compact'}
  style:height="{sizing.area}px"
  style:grid-template-columns="repeat({sizing.perRow}, {pitch}px)"
>
  {#each tiles as tile, i (`${tile.id}-${tile.mirror}`)}
    <Card
      id={tile.id}
      face={faces[tile.id] as Face}
      place={strip ? 'strip' : 'tray'}
      mirror={tile.mirror ? 'block' : undefined}
      tile={{ mode: sizing.mode, width: sizing.tileWidth }}
      segment={tile.mirror ? segment(i) : undefined}
      tag={!tile.mirror && sizing.mode === 'card' ? tags.get(tile.id) : undefined}
    />
  {/each}
</div>

<style>
  /* DESIGN.md Tray band: tile area max(H, 92), rows top-aligned, 4 px row gap in compact mode. */
  .tiles {
    flex: none; display: grid; grid-auto-rows: max-content; align-content: start;
    overflow: hidden;
  }
  .tiles.compact { row-gap: 4px; }
</style>
