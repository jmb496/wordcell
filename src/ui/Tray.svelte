<script lang="ts">
import type { CardId, GameView } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { game } from '../shell/game.svelte';
import { type TrayTile, trayOrder } from './layout/tray';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import ControlRow from './tray/ControlRow.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import TileRows from './tray/TileRows.svelte';
import { originCard } from './tray/tags';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import WordLine from './tray/WordLine.svelte';

// Epic 5 entry 1 tray band (DESIGN.md Tray band): the reserved band (height from `bands()`) with
// the word line, the tile rows and the control row, switching on `view.place`, then
// `view.draft`, else empty (AD-3). Composing: the word line (or the R-38 invalid line while
// `feedback.rejectedWord` is set), tiles in R-30 tray order with the D-block mirrors at the
// `side` end and free-letter origin tags, and the letter count. Place: the F2 strip as built
// (live tiles in `placementOrder`; entry 2 adds the word line, tags and meta). Idle and Game over:
// all three rows empty.
let {
  view,
  w,
  innerWidth,
  height,
}: { view: GameView; w: number; innerWidth: number; height: number } = $props();

const composing = $derived(view.place === undefined ? view.draft : undefined);
const tiles: TrayTile[] = $derived.by(() => {
  if (view.place !== undefined)
    return view.place.placementOrder.map((id) => ({ id, mirror: false }));
  if (view.draft !== undefined) return trayOrder(view.draft);
  return [];
});
// Free-letter origin tags, looked up per render from `cells` (AD-3; no stored map).
const tags: ReadonlyMap<CardId, number> = $derived(
  new Map(composing?.freeLetters.map((cell) => [originCard(view.cells, cell), cell]) ?? []),
);
</script>

<div class="tray" data-band="tray" style:height="{height}px">
  <div class="word-line">
    {#if composing !== undefined}
      <WordLine
        faces={view.faces}
        wordCards={composing.wordCards}
        destination={composing.destination}
        rejectedWord={game.feedback.rejectedWord}
      />
    {/if}
  </div>
  <TileRows
    {tiles}
    faces={view.faces}
    strip={view.place !== undefined}
    {tags}
    {w}
    {innerWidth}
  />
  <div class="controls">
    {#if composing !== undefined}<ControlRow letterCount={composing.letterCount} />{/if}
  </div>
</div>

<style>
  /* DESIGN.md Tray band: reserved height in every phase, padding 8, word line 24, tile area
     max(H, 92) clipping overflow (F2), control row 44. */
  .tray {
    flex: none; box-sizing: border-box; width: var(--wc-board); padding: 8px;
    display: flex; flex-direction: column;
    background: var(--wc-surface); border-radius: 12px; touch-action: var(--wc-pan);
  }
  .word-line { flex: none; height: 24px; min-width: 0; }
  .controls { flex: none; height: 44px; }
</style>
