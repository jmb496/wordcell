<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import type { Face, GameView } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { game } from '../shell/game.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from './Card.svelte';
import { type TrayTile, trayLayout, trayOrder } from './layout/tray';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// Static tray (F2, build-notes CAP-2; epic 5 replaces it): the reserved band (DESIGN.md Tray
// band) with the word-line slot (only epic 3's invalid-word line here), the tile area and an empty
// control row. Composing: live S and free-letter tiles (data-place tray) in R-30 order with the
// D-block mirrors at the `side` end; Place: live strip tiles in `placementOrder`; Idle and Game
// over: no tiles. No interaction, tags, word text or controls (epic 5).
let {
  view,
  w,
  innerWidth,
  height,
}: { view: GameView; w: number; innerWidth: number; height: number } = $props();

const tiles: TrayTile[] = $derived.by(() => {
  if (view.place !== undefined)
    return view.place.placementOrder.map((id) => ({ id, mirror: false }));
  if (view.draft !== undefined) return trayOrder(view.draft);
  return [];
});
const strip = $derived(view.place !== undefined);
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

<div class="tray" data-band="tray" style:height="{height}px">
  <div class="word-line">
    {#if game.feedback.rejectedWord !== undefined}
      <p class="invalid">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M6 6 L18 18 M18 6 L6 18" />
        </svg>
        <span>{text.invalidWord(game.feedback.rejectedWord)}</span>
      </p>
    {/if}
  </div>
  <div
    class="tiles"
    class:compact={sizing.mode === 'compact'}
    style:height="{sizing.area}px"
    style:grid-template-columns="repeat({sizing.perRow}, {pitch}px)"
  >
    {#each tiles as tile, i (`${tile.id}-${tile.mirror}`)}
      <Card
        id={tile.id}
        face={view.faces[tile.id] as Face}
        place={strip ? 'strip' : 'tray'}
        mirror={tile.mirror ? 'block' : undefined}
        tile={{ mode: sizing.mode, width: sizing.tileWidth }}
        segment={tile.mirror ? segment(i) : undefined}
      />
    {/each}
  </div>
  <div class="controls"></div>
</div>

<style>
  /* DESIGN.md Tray band: reserved height in every phase, padding 8, word line 24, tile area
     max(H, 92) clipping overflow (F2), control row 44. */
  .tray {
    flex: none; box-sizing: border-box; width: var(--wc-board); padding: 8px;
    display: flex; flex-direction: column;
    background: var(--wc-surface); border-radius: 12px;
  }
  .word-line { flex: none; height: 24px; min-width: 0; }
  .tiles {
    flex: none; display: grid; grid-auto-rows: max-content; align-content: start;
    overflow: hidden;
  }
  .tiles.compact { row-gap: 4px; }
  .controls { flex: none; height: 44px; }
  .invalid {
    display: flex; align-items: center; gap: 6px; margin: 0;
    font: 400 16px/24px system-ui, "Roboto", sans-serif; color: var(--wc-error);
  }
  .invalid svg { flex: none; fill: none; stroke: var(--wc-error); stroke-width: 2.5; stroke-linecap: round; }
  .invalid span { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
</style>
