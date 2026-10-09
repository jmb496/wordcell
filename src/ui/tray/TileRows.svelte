<script lang="ts">
import type { CardId, Face } from '../../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from '../Card.svelte';
import { type TrayTile, trayLayout } from '../layout/tray';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { overlays } from '../overlays.svelte';

// Epic 5 tile rows (DESIGN.md Tray band, Tile, Placement strip): a CSS grid of tile-pitch `Card`s
// sized by `trayLayout`, card or compact mode. Composing: live S and free-letter tiles (place
// `tray`) with the D-block mirrors joined per row segment (one outline and one lock each). Place:
// live strip tiles (place `strip`) in `placementOrder`, the first marked `bottom` and the last
// `top` (R-50). A free-letter tile carries its origin-cell `tag` in both phases and modes; Card
// places every mark. The tile area keeps the reserved height and clips (F2); its clip's top edge
// alone is raised 6 px (the 4 px selected-tile lift + its 2 px outline, epic 5 SPEC CAP-4) by a
// padding-top the negative margin cancels, so rows and the bottom edge stay put. The live tile that
// is `overlays.tileSelection` is `selected` (and shows `↩` when it is a free letter; Card hides it
// in the strip). Keys stay `${id}-${mirror}` (AD-14: a live ↔ mirror switch remounts).
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
  /** Free-letter origin cell per live tile (Composing and Place). */
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

// R-50: the strip's first tile is its bottom, the last its top.
function stripPosition(i: number): 'bottom' | 'top' | undefined {
  if (i === 0) return 'bottom';
  if (i === tiles.length - 1) return 'top';
  return undefined;
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
      tag={tile.mirror ? undefined : tags.get(tile.id)}
      position={strip ? stripPosition(i) : undefined}
      selected={!tile.mirror && overlays.tileSelection === tile.id}
      returnSlot={!tile.mirror && overlays.tileSelection === tile.id && tags.has(tile.id)}
    />
  {/each}
</div>

<style>
  /* DESIGN.md Tray band: tile area max(H, 92), rows top-aligned, 4 px row gap in compact mode. */
  .tiles {
    flex: none; display: grid; grid-auto-rows: max-content; align-content: start;
    overflow: hidden; box-sizing: content-box; padding-top: 6px; margin-top: -6px;
  }
  .tiles.compact { row-gap: 4px; }
</style>
