<script lang="ts">
import type { CardId, Face } from '../../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from '../Card.svelte';
import { segmentEnds, type TrayLayout, type TrayTile } from '../layout/tray';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { overlays } from '../overlays.svelte';
import { roving } from '../roving.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from '../text';

// Epic 5 tile rows (DESIGN.md Tray band, Tile, Placement strip): a CSS grid of tile-pitch `Card`s
// sized by `layout.tray` (`trayLayout`), card or compact mode. Composing: live S and free-letter tiles (place
// `tray`) with the D-block mirrors joined per row segment (one outline and one lock each). Place:
// live strip tiles (place `strip`) in `placementOrder`, the first marked `bottom` and the last
// `top` (R-50). A free-letter tile carries its origin-cell `tag` in both phases and modes; Card
// places every mark and, from `gaps`, the compact hit rect's row-gap halves (F2). The tile area
// keeps the reserved height, grown per A-D4 (`sizing.area`), and clips (F2); its clip's top edge alone is raised 6 px (the 4 px
// selected-tile lift + its 2 px outline, epic 5 SPEC CAP-4) by a padding-top the negative margin
// cancels, so rows and the bottom edge stay put. The live tile that is `overlays.tileSelection` is
// `selected` (and shows `↩` when it is a free letter; Card hides it in the strip). Keys stay
// `${id}-${mirror}` (AD-14: a live ↔ mirror switch remounts). During a tile drag (epic 5 SPEC
// CAP-5) the controller's `wc-drag-tiles` lifts the clip and the dragged face's `wc-drag-layer`
// raises it as Column's does (literals from gestures/classes.ts). In Composing the last child is
// the free-letter drag's one caret (epic 5 SPEC CAP-6, F16; DESIGN.md Tray band: 3 px teal, tile
// height), hidden until the controller adds `wc-caret-shown` and positions it by `transform` in
// `.tiles` coordinates; it stays last so `.tiles` child 0 is tray position 0.
let {
  tiles,
  faces,
  strip,
  tags,
  sizing,
}: {
  tiles: readonly TrayTile[];
  faces: readonly Face[];
  strip: boolean;
  /** Free-letter origin cell per live tile (Composing and Place). */
  tags: ReadonlyMap<CardId, number>;
  /** The one `layout.tray` value the band's rows also read (AD-11, AD-3). */
  sizing: TrayLayout;
} = $props();

const pitch = $derived(sizing.tileWidth + 4);
const mirrors = $derived(tiles.map((t) => t.mirror));
// Epic 6 CAP-10 (6.11): the tiles are one Tab stop, the last-focused live tile, else the first.
const live = $derived(tiles.filter((t) => !t.mirror).map((t) => t.id));
// Epic 6 CAP-11 (6.13): a live tile's name counts live named tiles only, left to right.
const liveIndex = $derived(new Map(live.map((id, k) => [id, k + 1])));
const stop = $derived(roving.tile !== null && live.includes(roving.tile) ? roving.tile : live[0]);

// A D-block row segment starts at the block's first tile or a row start, and ends likewise
// (`segmentEnds`).
function segment(i: number): { start: boolean; end: boolean } {
  return segmentEnds(i, sizing.perRow, mirrors);
}

// Epic 5 SPEC F2: which sides of tile i face a row gap (a row above it, a row below it).
function gaps(i: number): { gapAbove: boolean; gapBelow: boolean } {
  const row = Math.floor(i / sizing.perRow);
  return { gapAbove: row > 0, gapBelow: row < Math.ceil(tiles.length / sizing.perRow) - 1 };
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
      tile={{ mode: sizing.mode, width: sizing.tileWidth, ...gaps(i) }}
      segment={tile.mirror ? segment(i) : undefined}
      tag={tile.mirror ? undefined : tags.get(tile.id)}
      position={strip ? stripPosition(i) : undefined}
      selected={!tile.mirror && overlays.tileSelection === tile.id}
      returnSlot={!tile.mirror && overlays.tileSelection === tile.id && tags.has(tile.id)}
      stop={!tile.mirror && tile.id === stop}
      onfocus={() => roving.focusedTile(tile.id)}
      name={tile.mirror
        ? undefined
        : text.nameTrayTile(
            (faces[tile.id] as Face).letter,
            liveIndex.get(tile.id) as number,
            live.length,
            overlays.tileSelection === tile.id,
          )}
    />
  {/each}
  {#if !strip && tiles.length > 0}
    <span class="wc-caret" aria-hidden="true" style:height="{sizing.tileHeight}px"></span>
  {/if}
</div>

<style>
  /* DESIGN.md Tray band: tile area max(H, 92) grown per A-D4 (`sizing.area`), rows top-aligned, 4 px
     row gap in compact mode. */
  .tiles {
    position: relative; flex: none; display: grid; grid-auto-rows: max-content;
    align-content: start; overflow: hidden; box-sizing: content-box; padding-top: 6px;
    margin-top: -6px;
  }
  .tiles.compact { row-gap: 4px; }
  /* Epic 5 SPEC CAP-5: mid tile drag the area stops clipping, and the dragged face takes the drag
     layer (above the sticky bars 2, the lift 3 and the hover peek's reserved 4, below any scrim)
     with the lift shadow, as Column.svelte's. */
  .tiles:global(.wc-drag-tiles) { overflow: visible; }
  .tiles :global(.face.wc-drag-layer) { z-index: 5; box-shadow: 0 6px 16px var(--wc-shadow-drag); }
  /* Epic 5 SPEC CAP-8 (DESIGN.md Layer order): a FLIP-gliding face (flip.ts `wc-glide`, literal
     from gestures/classes.ts) rides above the cards and under the sticky bars (2), no shadow; a
     band-changing glide, or a tray glide that starts outside the tile area (A-D4), lifts the clip
     by `wc-drag-tiles` above. */
  .tiles :global(.face.wc-glide) { z-index: 1; }
  /* Epic 5 SPEC CAP-6, F16: the caret, above the tiles' marks (1), out of the grid flow. */
  .wc-caret {
    position: absolute; top: 0; left: 0; z-index: 2; display: none; width: 3px;
    background: var(--wc-accent-teal); pointer-events: none;
  }
  .wc-caret:global(.wc-caret-shown) { display: block; }
</style>
